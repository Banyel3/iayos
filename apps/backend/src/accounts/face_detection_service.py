"""
Face Detection & Verification Service - Using DeepFace

DeepFace is a lightweight open-source face recognition library that provides:
1. Face Detection - Multiple backends (opencv, mtcnn, retinaface, etc.)
2. Face Verification - Compare two faces and determine if they match
3. Facial Attributes - Age, gender, emotion, race prediction (optional)

Key Benefits over Azure Face API:
- 100% LOCAL processing - No data sent to cloud (privacy!)
- FREE - No API costs or rate limits
- VERIFICATION WORKS - Unlike Azure which requires special approval
- HIGH ACCURACY - FaceNet, ArcFace achieve 98%+ accuracy

Migration from CompreFace/Azure:
- DeepFace handles both detection AND comparison locally
- No external API dependencies
- Works perfectly on Render free tier

Usage:
    from accounts.face_detection_service import get_face_service
    
    service = get_face_service()
    result = service.detect_face(image_bytes)
    match = service.compare_faces(id_image, selfie_image)
"""

import io
import os
import logging
import tempfile
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)

# ============================================================================
# DeepFace Configuration
# ============================================================================

# Try to import DeepFace
try:
    import time
    import sys
    start_time = time.time()
    logger.info("🔄 Attempting to load DeepFace...")
    logger.info(f"   Python version: {sys.version}")
    logger.info(f"   Python executable: {sys.executable}")
    logger.info(f"   sys.path: {sys.path[:3]}...")  # Show first 3 paths
    
    from deepface import DeepFace
    load_time = time.time() - start_time
    DEEPFACE_AVAILABLE = True
    logger.info(f"✅ DeepFace loaded successfully in {load_time:.2f}s")
    logger.info(f"   DeepFace module location: {DeepFace.__file__ if hasattr(DeepFace, '__file__') else 'unknown'}")
except ImportError as e:
    DEEPFACE_AVAILABLE = False
    logger.error(f"❌ DeepFace import FAILED: {e}")
    logger.error(f"   Error type: {type(e).__name__}")
    logger.error(f"   This is expected on Alpine Linux (use Debian-based image)")
    logger.error(f"   Fallback: Face detection will use manual review workflow")
    import traceback
    logger.error(f"   Full traceback:\n{traceback.format_exc()}")
    DeepFace = None
except Exception as e:
    DEEPFACE_AVAILABLE = False
    logger.error(f"❌ DeepFace unexpected error: {e}")
    logger.error(f"   Error type: {type(e).__name__}")
    import traceback
    logger.error(f"   Full traceback:\n{traceback.format_exc()}")
    DeepFace = None

# DeepFace model configuration
# FaceNet512 offers best balance of accuracy (98.4%) and speed
FACE_RECOGNITION_MODEL = os.getenv("DEEPFACE_MODEL", "Facenet512")

# Face detector backend (retinaface is most accurate, opencv is fastest)
# Options: 'opencv', 'ssd', 'dlib', 'mtcnn', 'fastmtcnn', 'retinaface', 'mediapipe', 'yolov8', 'yunet', 'centerface'
FACE_DETECTOR_BACKEND = os.getenv("DEEPFACE_DETECTOR", "opencv")

# Similarity threshold for face matching (0-1, higher = stricter)
# FaceNet512 recommended threshold: 0.30 (cosine distance)
FACE_SIMILARITY_THRESHOLD = float(os.getenv("DEEPFACE_THRESHOLD", "0.40"))

# ============================================================================
# Face Detection Result Types
# ============================================================================

@dataclass
class FaceDetectionResult:
    """Result from face detection"""
    detected: bool = False
    count: int = 0
    confidence: float = 0.0
    bounding_boxes: List[Dict] = None
    face_too_small: bool = False
    skipped: bool = False
    error: str = None
    
    def __post_init__(self):
        if self.bounding_boxes is None:
            self.bounding_boxes = []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "detected": self.detected,
            "count": self.count,
            "confidence": self.confidence,
            "bounding_boxes": self.bounding_boxes,
            "face_too_small": self.face_too_small,
            "skipped": self.skipped,
            "error": self.error
        }


@dataclass
class FaceComparisonResult:
    """Result from face comparison"""
    match: bool = False
    similarity: float = 0.0
    distance: float = 0.0
    threshold: float = 0.0
    id_has_face: bool = False
    selfie_has_face: bool = False
    skipped: bool = False
    needs_manual_review: bool = False
    error: str = None
    method: str = None  # 'deepface', 'local_only', etc.
    model: str = None  # Which face recognition model was used
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "match": self.match,
            "similarity": self.similarity,
            "distance": self.distance,
            "threshold": self.threshold,
            "faces_detected": self.id_has_face and self.selfie_has_face,
            "id_has_face": self.id_has_face,
            "selfie_has_face": self.selfie_has_face,
            "skipped": self.skipped,
            "needs_manual_review": self.needs_manual_review,
            "error": self.error,
            "method": self.method,
            "model": self.model
        }


# ============================================================================
# Face Detection Service
# ============================================================================

# Minimum free memory required to run DeepFace (in MB)
# TensorFlow + DeepFace needs ~300-400MB to load models
MIN_FREE_MEMORY_MB = int(os.getenv("DEEPFACE_MIN_MEMORY_MB", "250"))

def _get_available_memory_mb() -> int:
    """Get available system memory in MB. Returns -1 if unable to determine."""
    try:
        # Try reading from /proc/meminfo (Linux)
        with open('/proc/meminfo', 'r') as f:
            for line in f:
                if line.startswith('MemAvailable:'):
                    # Format: "MemAvailable:    1234567 kB"
                    kb = int(line.split()[1])
                    return kb // 1024
    except:
        pass
    
    try:
        # Fallback: use psutil if available
        import psutil
        return int(psutil.virtual_memory().available / 1024 / 1024)
    except:
        pass
    
    # Unknown - return -1 to indicate we couldn't check
    return -1


class FaceDetectionService:
    """
    Face detection and verification service using DeepFace
    
    DeepFace wraps multiple face recognition models:
    - VGG-Face, FaceNet (128d & 512d), OpenFace, DeepFace, DeepID
    - ArcFace, Dlib, SFace, GhostFaceNet, Buffalo_L
    
    And multiple face detection backends:
    - opencv, ssd, dlib, mtcnn, fastmtcnn, retinaface
    - mediapipe, yolov8, yunet, centerface
    """
    
    def __init__(self):
        """Initialize face detection service"""
        self._initialized = False
        self._temp_dir = None
        
        if DEEPFACE_AVAILABLE:
            try:
                import time
                init_start = time.time()
                logger.info(f"🚀 Initializing DeepFace service...")
                logger.info(f"   Model: {FACE_RECOGNITION_MODEL}")
                logger.info(f"   Detector: {FACE_DETECTOR_BACKEND}")
                logger.info(f"   Threshold: {FACE_SIMILARITY_THRESHOLD}")
                
                # Create temp directory for image processing
                self._temp_dir = tempfile.mkdtemp(prefix="deepface_")
                logger.info(f"   Temp directory: {self._temp_dir}")
                
                # Pre-warm DeepFace models (optional, speeds up first inference)
                # This downloads models on first run (~100-500MB depending on model)
                # Don't pre-load models in __init__ - let them load on first use
                # This avoids blocking startup
                self._initialized = True
                init_time = time.time() - init_start
                logger.info(f"✅ DeepFace service ready in {init_time:.2f}s")
                logger.info(f"   Note: Model files will download on first face detection (~100-500MB)")
                
            except Exception as e:
                logger.error(f"❌ DeepFace initialization failed: {e}")
                logger.error(f"   Error type: {type(e).__name__}")
                import traceback
                logger.error(f"   Traceback:\n{traceback.format_exc()}")
                self._initialized = False
        else:
            logger.warning("⚠️ DeepFace not available - face services disabled")
            logger.warning("   Face detection will skip with manual review flag")
            logger.warning("   This is normal on Alpine Linux (TensorFlow requires glibc)")
    
    def _save_image_temp(self, image_data: bytes, prefix: str = "face") -> str:
        """Save image bytes to a temporary file for DeepFace processing"""
        if not self._temp_dir:
            self._temp_dir = tempfile.mkdtemp(prefix="deepface_")
        
        import uuid
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(self._temp_dir, filename)
        
        # Ensure image is valid JPEG
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_data))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(filepath, 'JPEG', quality=95)
        except Exception as e:
            logger.error(f"Failed to save temp image: {e}")
            # Fallback: write raw bytes
            with open(filepath, 'wb') as f:
                f.write(image_data)
        
        return filepath
    
    def _cleanup_temp_file(self, filepath: str):
        """Remove temporary file after processing"""
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            logger.warning(f"Failed to cleanup temp file {filepath}: {e}")
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get current service availability status"""
        return {
            "deepface_available": DEEPFACE_AVAILABLE and self._initialized,
            "face_detection_available": DEEPFACE_AVAILABLE and self._initialized,
            "face_comparison_available": DEEPFACE_AVAILABLE and self._initialized,
            "model": FACE_RECOGNITION_MODEL,
            "detector": FACE_DETECTOR_BACKEND,
            "threshold": FACE_SIMILARITY_THRESHOLD,
        }
    
    # ========================================================================
    # Face Detection
    # ========================================================================
    
    def detect_face(self, image_data: bytes) -> FaceDetectionResult:
        """
        Detect faces in an image using DeepFace
        
        Args:
            image_data: Raw image bytes (JPEG/PNG)
            
        Returns:
            FaceDetectionResult with detection details
        """
        import time
        request_id = int(time.time() * 1000) % 1000000  # Last 6 digits of timestamp
        logger.info(f"🔍 [REQ-{request_id}] Starting face detection with DeepFace...")
        logger.info(f"   [REQ-{request_id}] Image size: {len(image_data)} bytes")
        
        # Check available memory before running DeepFace (prevents OOM crash)
        available_mb = _get_available_memory_mb()
        logger.info(f"   [REQ-{request_id}] Available memory: {available_mb}MB (min required: {MIN_FREE_MEMORY_MB}MB)")
        
        if available_mb != -1 and available_mb < MIN_FREE_MEMORY_MB:
            logger.warning(f"⚠️ [REQ-{request_id}] Insufficient memory for DeepFace ({available_mb}MB < {MIN_FREE_MEMORY_MB}MB)")
            logger.warning(f"   [REQ-{request_id}] Skipping face detection to prevent OOM crash - manual review required")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error=f"Insufficient memory for face detection ({available_mb}MB available). Document will be reviewed manually."
            )
        
        if not DEEPFACE_AVAILABLE or not self._initialized:
            logger.error(f"❌ [REQ-{request_id}] DeepFace not available (AVAILABLE={DEEPFACE_AVAILABLE}, INITIALIZED={self._initialized})")
            logger.error(f"   [REQ-{request_id}] Returning skipped=True for manual review")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error="Face detection service not available"
            )
        
        temp_path = None
        try:
            detect_start = time.time()
            # Save image to temp file (DeepFace works with file paths)
            temp_path = self._save_image_temp(image_data, "detect")
            logger.info(f"   [REQ-{request_id}] Temp file created: {temp_path}")
            
            # Use extract_faces to detect faces
            logger.info(f"   [REQ-{request_id}] Calling DeepFace.extract_faces (backend={FACE_DETECTOR_BACKEND})...")
            try:
                faces = DeepFace.extract_faces(
                    img_path=temp_path,
                    detector_backend=FACE_DETECTOR_BACKEND,
                    enforce_detection=False,  # Don't raise exception if no face
                    align=True
                )
            except ValueError as ve:
                # DeepFace throws ValueError when no face detected (despite enforce_detection=False)
                logger.warning(f"   [REQ-{request_id}] DeepFace ValueError (no face): {ve}")
                return FaceDetectionResult(detected=False, count=0, confidence=0)
            except TypeError as te:
                # DeepFace throws TypeError for corrupted/invalid images
                logger.warning(f"   [REQ-{request_id}] DeepFace TypeError (invalid image): {te}")
                return FaceDetectionResult(detected=False, count=0, confidence=0, error="Invalid image format")
            
            detect_time = time.time() - detect_start
            logger.info(f"   [REQ-{request_id}] DeepFace.extract_faces completed in {detect_time:.2f}s")
            
            # Filter out placeholder faces (confidence=0 or near-zero)
            # DeepFace returns placeholder faces when enforce_detection=False but no real face found
            MIN_CONFIDENCE = 0.01
            real_faces = [f for f in (faces or []) if f.get('confidence', 0) > MIN_CONFIDENCE]
            
            if not real_faces:
                logger.info(f"   [REQ-{request_id}] DeepFace: No real faces detected (filtered {len(faces or [])} placeholder faces)")
                return FaceDetectionResult(detected=False, count=0, confidence=0)
            
            # Process detections (using filtered real_faces)
            bounding_boxes = []
            max_confidence = 0
            face_too_small = True
            
            for face_obj in real_faces:
                confidence = face_obj.get('confidence', 0.0) or 0.0
                if confidence > max_confidence:
                    max_confidence = confidence
                
                # Get bounding box (facial_area)
                area = face_obj.get('facial_area', {})
                x = area.get('x', 0)
                y = area.get('y', 0)
                w = area.get('w', 0)
                h = area.get('h', 0)
                
                # Check if face is large enough (at least 5% of image)
                from PIL import Image
                img = Image.open(io.BytesIO(image_data))
                img_area = img.width * img.height
                face_area = w * h
                if face_area / img_area >= 0.05:
                    face_too_small = False
                
                bounding_boxes.append({
                    "x_min": x,
                    "y_min": y,
                    "x_max": x + w,
                    "y_max": y + h,
                    "probability": float(confidence)
                })
            
            logger.info(f"✅ [REQ-{request_id}] DeepFace: Detected {len(real_faces)} face(s), max_confidence={max_confidence:.2f}, face_too_small={face_too_small}")
            
            return FaceDetectionResult(
                detected=True,
                count=len(real_faces),
                confidence=float(max_confidence),
                bounding_boxes=bounding_boxes,
                face_too_small=face_too_small
            )
            
        except Exception as e:
            logger.error(f"❌ [REQ-{request_id}] DeepFace detection error: {e}")
            logger.error(f"   [REQ-{request_id}] Error type: {type(e).__name__}")
            import traceback
            logger.error(f"   [REQ-{request_id}] Traceback:\n{traceback.format_exc()}")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error=f"Face detection failed: {str(e)}"
            )
        finally:
            if temp_path:
                self._cleanup_temp_file(temp_path)
    
    # ========================================================================
    # Face Comparison / Verification
    # ========================================================================
    
    def compare_faces(
        self, 
        id_image_data: bytes, 
        selfie_image_data: bytes,
        similarity_threshold: float = None
    ) -> FaceComparisonResult:
        """
        Compare faces between ID document and selfie using DeepFace
        
        DeepFace.verify() compares two faces and returns:
        - verified: True if faces match (within threshold)
        - distance: Numerical distance between face embeddings
        - threshold: Model-specific threshold for matching
        
        Args:
            id_image_data: Raw bytes of ID document image
            selfie_image_data: Raw bytes of selfie image
            similarity_threshold: Optional custom threshold (uses model default if not specified)
            
        Returns:
            FaceComparisonResult with comparison details
        """
        import time
        request_id = int(time.time() * 1000) % 1000000  # Last 6 digits
        logger.info(f"🔍 [COMP-{request_id}] Starting face comparison with DeepFace...")
        logger.info(f"   [COMP-{request_id}] ID image size: {len(id_image_data)} bytes")
        logger.info(f"   [COMP-{request_id}] Selfie image size: {len(selfie_image_data)} bytes")
        logger.info(f"   [COMP-{request_id}] Custom threshold: {similarity_threshold}")
        
        # Check available memory before running DeepFace (prevents OOM crash)
        available_mb = _get_available_memory_mb()
        logger.info(f"   [COMP-{request_id}] Available memory: {available_mb}MB (min required: {MIN_FREE_MEMORY_MB}MB)")
        
        if available_mb != -1 and available_mb < MIN_FREE_MEMORY_MB:
            logger.warning(f"⚠️ [COMP-{request_id}] Insufficient memory for DeepFace ({available_mb}MB < {MIN_FREE_MEMORY_MB}MB)")
            logger.warning(f"   [COMP-{request_id}] Skipping face comparison to prevent OOM crash - manual review required")
            return FaceComparisonResult(
                match=False,
                skipped=True,
                needs_manual_review=True,
                error=f"Insufficient memory for face comparison ({available_mb}MB available). Document will be reviewed manually."
            )
        
        if not DEEPFACE_AVAILABLE or not self._initialized:
            logger.error(f"❌ [COMP-{request_id}] DeepFace not available (AVAILABLE={DEEPFACE_AVAILABLE}, INITIALIZED={self._initialized})")
            logger.error(f"   [COMP-{request_id}] Returning skipped=True, needs_manual_review=True")
            return FaceComparisonResult(
                match=False,
                skipped=True,
                needs_manual_review=True,
                error="Face comparison service not available"
            )
        
        id_temp_path = None
        selfie_temp_path = None
        
        try:
            compare_start = time.time()
            # Save both images to temp files
            id_temp_path = self._save_image_temp(id_image_data, "id")
            selfie_temp_path = self._save_image_temp(selfie_image_data, "selfie")
            logger.info(f"   [COMP-{request_id}] Temp files created: {id_temp_path}, {selfie_temp_path}")
            
            # First check if faces exist in both images
            logger.info(f"   [COMP-{request_id}] Pre-checking for faces in both images...")
            id_detection = self.detect_face(id_image_data)
            selfie_detection = self.detect_face(selfie_image_data)
            
            id_has_face = id_detection.detected and id_detection.count > 0
            selfie_has_face = selfie_detection.detected and selfie_detection.count > 0
            logger.info(f"   [COMP-{request_id}] ID has face: {id_has_face}, Selfie has face: {selfie_has_face}")
            
            if not id_has_face:
                logger.warning(f"❌ [COMP-{request_id}] No face detected in ID document")
                return FaceComparisonResult(
                    match=False,
                    id_has_face=False,
                    selfie_has_face=selfie_has_face,
                    error="No face detected in ID document. Please upload a clear photo of your ID showing your face."
                )
            
            if not selfie_has_face:
                logger.warning(f"❌ [COMP-{request_id}] No face detected in selfie")
                return FaceComparisonResult(
                    match=False,
                    id_has_face=True,
                    selfie_has_face=False,
                    error="No face detected in selfie. Please take a clear photo of your face."
                )
            
            # Perform face verification with DeepFace
            logger.info(f"   [COMP-{request_id}] Calling DeepFace.verify (model={FACE_RECOGNITION_MODEL}, detector={FACE_DETECTOR_BACKEND})...")
            verify_start = time.time()
            
            try:
                result = DeepFace.verify(
                    img1_path=id_temp_path,
                    img2_path=selfie_temp_path,
                    model_name=FACE_RECOGNITION_MODEL,
                    detector_backend=FACE_DETECTOR_BACKEND,
                    distance_metric="cosine",  # cosine similarity
                    enforce_detection=False,  # Don't raise exception if face not found
                )
            except ValueError as ve:
                # DeepFace throws ValueError when face comparison fails
                logger.warning(f"   [COMP-{request_id}] DeepFace ValueError during verify: {ve}")
                return FaceComparisonResult(
                    match=False,
                    needs_manual_review=True,
                    error=f"Face comparison failed: {str(ve)}"
                )
            except TypeError as te:
                # DeepFace throws TypeError for corrupted/invalid images
                logger.warning(f"   [COMP-{request_id}] DeepFace TypeError during verify: {te}")
                return FaceComparisonResult(
                    match=False,
                    needs_manual_review=True,
                    error="Invalid image format for face comparison"
                )
            
            verify_time = time.time() - verify_start
            logger.info(f"   [COMP-{request_id}] DeepFace.verify completed in {verify_time:.2f}s")
            
            # Parse results
            is_verified = result.get("verified", False)
            distance = result.get("distance", 1.0)
            threshold = result.get("threshold", FACE_SIMILARITY_THRESHOLD)
            model_used = result.get("model", FACE_RECOGNITION_MODEL)
            
            # Calculate similarity (1 - distance for cosine)
            # Cosine distance: 0 = identical, 1 = completely different
            similarity = max(0.0, 1.0 - distance)
            
            # Use custom threshold if provided
            if similarity_threshold is not None:
                is_match = distance <= (1.0 - similarity_threshold)
            else:
                is_match = is_verified
            
            total_time = time.time() - compare_start
            logger.info(f"✅ [COMP-{request_id}] DeepFace comparison complete in {total_time:.2f}s")
            logger.info(f"   [COMP-{request_id}] Result: verified={is_verified}, match={is_match}, distance={distance:.4f}, threshold={threshold:.4f}, similarity={similarity:.2%}")
            
            return FaceComparisonResult(
                match=is_match,
                similarity=similarity,
                distance=distance,
                threshold=threshold,
                id_has_face=True,
                selfie_has_face=True,
                needs_manual_review=not is_match,  # Flag non-matches for review
                method='deepface',
                model=model_used
            )
            
        except Exception as e:
            logger.error(f"❌ [COMP-{request_id}] DeepFace comparison error: {e}")
            logger.error(f"   [COMP-{request_id}] Error type: {type(e).__name__}")
            import traceback
            logger.error(f"   [COMP-{request_id}] Traceback:\n{traceback.format_exc()}")
            
            # If comparison fails, still return face detection status
            id_has_face = False
            selfie_has_face = False
            try:
                id_detection = self.detect_face(id_image_data)
                selfie_detection = self.detect_face(selfie_image_data)
                id_has_face = id_detection.detected
                selfie_has_face = selfie_detection.detected
            except:
                pass
            
            return FaceComparisonResult(
                match=False,
                id_has_face=id_has_face,
                selfie_has_face=selfie_has_face,
                skipped=True,
                needs_manual_review=True,
                error=f"Face comparison failed: {str(e)}",
                method='deepface'
            )
        finally:
            if id_temp_path:
                self._cleanup_temp_file(id_temp_path)
            if selfie_temp_path:
                self._cleanup_temp_file(selfie_temp_path)
    
    # ========================================================================
    # Facial Attribute Analysis (Optional)
    # ========================================================================
    
    def analyze_face(
        self, 
        image_data: bytes, 
        actions: List[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze facial attributes (age, gender, emotion, race)
        
        Args:
            image_data: Raw image bytes
            actions: List of analyses to perform ['age', 'gender', 'emotion', 'race']
                     Defaults to ['age', 'gender']
            
        Returns:
            Dictionary with analysis results
        """
        if actions is None:
            actions = ['age', 'gender']
        
        logger.info(f"🔍 Analyzing face attributes: {actions}")
        
        if not DEEPFACE_AVAILABLE or not self._initialized:
            logger.warning("DeepFace not available for analysis")
            return {"error": "Face analysis service not available"}
        
        temp_path = None
        try:
            temp_path = self._save_image_temp(image_data, "analyze")
            
            results = DeepFace.analyze(
                img_path=temp_path,
                actions=actions,
                detector_backend=FACE_DETECTOR_BACKEND,
                enforce_detection=False
            )
            
            if isinstance(results, list) and len(results) > 0:
                result = results[0]  # Take first face
                logger.info(f"   Analysis result: {result}")
                return result
            
            return {"error": "No face found for analysis"}
            
        except Exception as e:
            logger.error(f"Face analysis error: {e}")
            return {"error": str(e)}
        finally:
            if temp_path:
                self._cleanup_temp_file(temp_path)


# ============================================================================
# Singleton Instance
# ============================================================================

_face_service: Optional[FaceDetectionService] = None


def get_face_service() -> FaceDetectionService:
    """Get or create the face detection service singleton"""
    global _face_service
    if _face_service is None:
        _face_service = FaceDetectionService()
    return _face_service


def check_face_services_available() -> Dict[str, Any]:
    """Check which face detection services are available (for health checks)"""
    service = get_face_service()
    return service.get_service_status()

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
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    logger.info("✅ DeepFace loaded successfully")
except ImportError as e:
    DEEPFACE_AVAILABLE = False
    logger.warning(f"⚠️ DeepFace not installed: {e}")
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
                # Create temp directory for image processing
                self._temp_dir = tempfile.mkdtemp(prefix="deepface_")
                
                # Pre-warm DeepFace models (optional, speeds up first inference)
                # This downloads models on first run (~100-500MB depending on model)
                logger.info(f"🚀 Initializing DeepFace with model={FACE_RECOGNITION_MODEL}, detector={FACE_DETECTOR_BACKEND}")
                
                # Don't pre-load models in __init__ - let them load on first use
                # This avoids blocking startup
                self._initialized = True
                logger.info("✅ DeepFace service ready")
                
            except Exception as e:
                logger.error(f"❌ DeepFace initialization failed: {e}")
                self._initialized = False
        else:
            logger.warning("⚠️ DeepFace not available - face services disabled")
    
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
        logger.info("🔍 Starting face detection with DeepFace...")
        
        if not DEEPFACE_AVAILABLE or not self._initialized:
            logger.error("❌ DeepFace not available")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error="Face detection service not available"
            )
        
        temp_path = None
        try:
            # Save image to temp file (DeepFace works with file paths)
            temp_path = self._save_image_temp(image_data, "detect")
            
            # Use extract_faces to detect faces
            faces = DeepFace.extract_faces(
                img_path=temp_path,
                detector_backend=FACE_DETECTOR_BACKEND,
                enforce_detection=False,  # Don't raise exception if no face
                align=True
            )
            
            if not faces:
                logger.info("   DeepFace: No faces detected")
                return FaceDetectionResult(detected=False, count=0, confidence=0)
            
            # Process detections
            bounding_boxes = []
            max_confidence = 0
            face_too_small = True
            
            for face_obj in faces:
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
            
            logger.info(f"   DeepFace: Detected {len(faces)} face(s), confidence={max_confidence:.2f}")
            
            return FaceDetectionResult(
                detected=True,
                count=len(faces),
                confidence=float(max_confidence),
                bounding_boxes=bounding_boxes,
                face_too_small=face_too_small
            )
            
        except Exception as e:
            logger.error(f"DeepFace detection error: {e}")
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
        logger.info("🔍 Starting face comparison with DeepFace...")
        
        if not DEEPFACE_AVAILABLE or not self._initialized:
            logger.error("❌ DeepFace not available")
            return FaceComparisonResult(
                match=False,
                skipped=True,
                needs_manual_review=True,
                error="Face comparison service not available"
            )
        
        id_temp_path = None
        selfie_temp_path = None
        
        try:
            # Save both images to temp files
            id_temp_path = self._save_image_temp(id_image_data, "id")
            selfie_temp_path = self._save_image_temp(selfie_image_data, "selfie")
            
            # First check if faces exist in both images
            id_detection = self.detect_face(id_image_data)
            selfie_detection = self.detect_face(selfie_image_data)
            
            id_has_face = id_detection.detected and id_detection.count > 0
            selfie_has_face = selfie_detection.detected and selfie_detection.count > 0
            
            if not id_has_face:
                logger.warning("No face detected in ID document")
                return FaceComparisonResult(
                    match=False,
                    id_has_face=False,
                    selfie_has_face=selfie_has_face,
                    error="No face detected in ID document. Please upload a clear photo of your ID showing your face."
                )
            
            if not selfie_has_face:
                logger.warning("No face detected in selfie")
                return FaceComparisonResult(
                    match=False,
                    id_has_face=True,
                    selfie_has_face=False,
                    error="No face detected in selfie. Please take a clear photo of your face."
                )
            
            # Perform face verification with DeepFace
            logger.info(f"   Comparing faces with model={FACE_RECOGNITION_MODEL}, detector={FACE_DETECTOR_BACKEND}")
            
            result = DeepFace.verify(
                img1_path=id_temp_path,
                img2_path=selfie_temp_path,
                model_name=FACE_RECOGNITION_MODEL,
                detector_backend=FACE_DETECTOR_BACKEND,
                distance_metric="cosine",  # cosine similarity
                enforce_detection=False,  # Don't raise exception if face not found
            )
            
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
            
            logger.info(f"   DeepFace result: verified={is_verified}, distance={distance:.4f}, threshold={threshold:.4f}, similarity={similarity:.2%}")
            
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
            logger.error(f"DeepFace comparison error: {e}")
            
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

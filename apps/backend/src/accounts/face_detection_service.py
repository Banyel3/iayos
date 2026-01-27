"""
Face Detection & Verification Service - Using InsightFace

InsightFace is a lightweight face recognition library using ONNX Runtime that provides:
1. Face Detection - SCRFD detector (very fast, accurate)
2. Face Verification - ArcFace recognition (state-of-the-art accuracy)
3. Facial Attributes - Age, gender prediction (optional)

Key Benefits over DeepFace:
- ~180MB RAM vs ~400MB (50% less memory!)
- Uses ONNX Runtime instead of TensorFlow
- Faster inference on CPU
- Same high accuracy (97%+ on IJB-C benchmark)
- Works perfectly on Render free tier (512MB RAM)

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

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ============================================================================
# InsightFace Configuration
# ============================================================================

# Try to import InsightFace
INSIGHTFACE_AVAILABLE = False
FaceAnalysis = None

try:
    import time
    start_time = time.time()
    logger.info("🔄 Attempting to load InsightFace...")
    
    from insightface.app import FaceAnalysis as _FaceAnalysis
    FaceAnalysis = _FaceAnalysis
    
    load_time = time.time() - start_time
    INSIGHTFACE_AVAILABLE = True
    logger.info(f"✅ InsightFace loaded successfully in {load_time:.2f}s")
    
except ImportError as e:
    logger.error(f"❌ InsightFace import FAILED: {e}")
    logger.error(f"   Install with: pip install insightface onnxruntime")
except Exception as e:
    logger.error(f"❌ InsightFace unexpected error: {e}")
    import traceback
    logger.error(f"   Full traceback:\n{traceback.format_exc()}")

# InsightFace model configuration
# buffalo_s is the smallest model (~160MB) with good accuracy
# Options: buffalo_l (largest), buffalo_m, buffalo_s (smallest), buffalo_sc (speed)
FACE_MODEL_NAME = os.getenv("INSIGHTFACE_MODEL", "buffalo_s")

# Detection size (smaller = faster, larger = more accurate for small faces)
FACE_DET_SIZE = int(os.getenv("INSIGHTFACE_DET_SIZE", "320"))

# Similarity threshold for face matching (cosine similarity, 0-1)
# Higher = stricter matching
FACE_SIMILARITY_THRESHOLD = float(os.getenv("FACE_SIMILARITY_THRESHOLD", "0.40"))

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
    method: str = None  # 'insightface', 'local_only', etc.
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
    Face detection and verification service using InsightFace
    
    InsightFace uses ONNX Runtime for lightweight inference:
    - SCRFD detector for face detection (fast, accurate)
    - ArcFace for face recognition/verification
    - buffalo_s model for minimal memory footprint (~180MB total)
    """
    
    def __init__(self):
        """Initialize face detection service"""
        self._initialized = False
        self._app = None
        
        if INSIGHTFACE_AVAILABLE:
            try:
                import time
                init_start = time.time()
                logger.info(f"🚀 Initializing InsightFace service...")
                logger.info(f"   Model: {FACE_MODEL_NAME}")
                logger.info(f"   Det size: {FACE_DET_SIZE}")
                logger.info(f"   Threshold: {FACE_SIMILARITY_THRESHOLD}")
                
                # Initialize FaceAnalysis with CPU provider
                # name='buffalo_s' uses smallest model (~160MB)
                self._app = FaceAnalysis(
                    name=FACE_MODEL_NAME,
                    providers=['CPUExecutionProvider']
                )
                
                # Prepare with detection size (smaller = faster)
                self._app.prepare(ctx_id=-1, det_size=(FACE_DET_SIZE, FACE_DET_SIZE))
                
                self._initialized = True
                init_time = time.time() - init_start
                logger.info(f"✅ InsightFace service ready in {init_time:.2f}s")
                
            except Exception as e:
                logger.error(f"❌ InsightFace initialization failed: {e}")
                import traceback
                logger.error(f"   Traceback:\n{traceback.format_exc()}")
                self._initialized = False
        else:
            logger.warning("⚠️ InsightFace not available - face services disabled")
            logger.warning("   Face detection will skip with manual review flag")
    
    def _load_image(self, image_data: bytes) -> np.ndarray:
        """Load image bytes into numpy array (BGR format for InsightFace)"""
        img = Image.open(io.BytesIO(image_data))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        # InsightFace expects BGR format
        img_array = np.array(img)
        # Convert RGB to BGR
        img_bgr = img_array[:, :, ::-1]
        return img_bgr
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get current service availability status"""
        return {
            "insightface_available": INSIGHTFACE_AVAILABLE and self._initialized,
            "face_detection_available": INSIGHTFACE_AVAILABLE and self._initialized,
            "face_comparison_available": INSIGHTFACE_AVAILABLE and self._initialized,
            "model": FACE_MODEL_NAME,
            "det_size": FACE_DET_SIZE,
            "threshold": FACE_SIMILARITY_THRESHOLD,
        }
    
    # ========================================================================
    # Face Detection
    # ========================================================================
    
    def detect_face(self, image_data: bytes) -> FaceDetectionResult:
        """
        Detect faces in an image using InsightFace
        
        Args:
            image_data: Raw image bytes (JPEG/PNG)
            
        Returns:
            FaceDetectionResult with detection details
        """
        import time
        request_id = int(time.time() * 1000) % 1000000
        logger.info(f"🔍 [REQ-{request_id}] Starting face detection with InsightFace...")
        logger.info(f"   [REQ-{request_id}] Image size: {len(image_data)} bytes")
        
        if not INSIGHTFACE_AVAILABLE or not self._initialized:
            logger.error(f"❌ [REQ-{request_id}] InsightFace not available")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error="Face detection service not available"
            )
        
        try:
            detect_start = time.time()
            
            # Load image
            img = self._load_image(image_data)
            img_height, img_width = img.shape[:2]
            logger.info(f"   [REQ-{request_id}] Image dimensions: {img_width}x{img_height}")
            
            # Detect faces
            faces = self._app.get(img)
            
            detect_time = time.time() - detect_start
            logger.info(f"   [REQ-{request_id}] Detection completed in {detect_time:.2f}s")
            
            if not faces:
                logger.info(f"   [REQ-{request_id}] No faces detected")
                return FaceDetectionResult(detected=False, count=0, confidence=0)
            
            # Process detections
            bounding_boxes = []
            max_confidence = 0
            face_too_small = True
            img_area = img_width * img_height
            
            for face in faces:
                # Get detection confidence
                confidence = float(face.det_score) if hasattr(face, 'det_score') else 0.9
                if confidence > max_confidence:
                    max_confidence = confidence
                
                # Get bounding box
                bbox = face.bbox.astype(int)
                x_min, y_min, x_max, y_max = bbox
                face_width = x_max - x_min
                face_height = y_max - y_min
                face_area = face_width * face_height
                
                # Check if face is large enough (at least 5% of image)
                if face_area / img_area >= 0.05:
                    face_too_small = False
                
                bounding_boxes.append({
                    "x_min": int(x_min),
                    "y_min": int(y_min),
                    "x_max": int(x_max),
                    "y_max": int(y_max),
                    "probability": float(confidence)
                })
            
            logger.info(f"✅ [REQ-{request_id}] Detected {len(faces)} face(s), max_confidence={max_confidence:.2f}")
            
            return FaceDetectionResult(
                detected=True,
                count=len(faces),
                confidence=float(max_confidence),
                bounding_boxes=bounding_boxes,
                face_too_small=face_too_small
            )
            
        except Exception as e:
            logger.error(f"❌ [REQ-{request_id}] Detection error: {e}")
            import traceback
            logger.error(f"   [REQ-{request_id}] Traceback:\n{traceback.format_exc()}")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error=f"Face detection failed: {str(e)}"
            )
    
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
        Compare faces between ID document and selfie using InsightFace
        
        Uses ArcFace embeddings and cosine similarity for comparison.
        
        Args:
            id_image_data: Raw bytes of ID document image
            selfie_image_data: Raw bytes of selfie image
            similarity_threshold: Optional custom threshold (uses default if not specified)
            
        Returns:
            FaceComparisonResult with comparison details
        """
        import time
        request_id = int(time.time() * 1000) % 1000000
        logger.info(f"🔍 [COMP-{request_id}] Starting face comparison with InsightFace...")
        logger.info(f"   [COMP-{request_id}] ID image size: {len(id_image_data)} bytes")
        logger.info(f"   [COMP-{request_id}] Selfie image size: {len(selfie_image_data)} bytes")
        
        threshold = similarity_threshold or FACE_SIMILARITY_THRESHOLD
        
        if not INSIGHTFACE_AVAILABLE or not self._initialized:
            logger.error(f"❌ [COMP-{request_id}] InsightFace not available")
            return FaceComparisonResult(
                match=False,
                skipped=True,
                needs_manual_review=True,
                error="Face comparison service not available"
            )
        
        try:
            compare_start = time.time()
            
            # Load images
            id_img = self._load_image(id_image_data)
            selfie_img = self._load_image(selfie_image_data)
            
            # Detect faces and get embeddings
            id_faces = self._app.get(id_img)
            selfie_faces = self._app.get(selfie_img)
            
            id_has_face = len(id_faces) > 0
            selfie_has_face = len(selfie_faces) > 0
            
            logger.info(f"   [COMP-{request_id}] ID faces: {len(id_faces)}, Selfie faces: {len(selfie_faces)}")
            
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
            
            # Get face embeddings (use first/largest face from each)
            id_embedding = id_faces[0].embedding
            selfie_embedding = selfie_faces[0].embedding
            
            # Calculate cosine similarity
            # similarity = dot(a, b) / (norm(a) * norm(b))
            dot_product = np.dot(id_embedding, selfie_embedding)
            norm_product = np.linalg.norm(id_embedding) * np.linalg.norm(selfie_embedding)
            similarity = float(dot_product / norm_product) if norm_product > 0 else 0.0
            
            # Normalize to 0-1 range (cosine similarity can be -1 to 1)
            similarity = (similarity + 1) / 2
            
            # Distance is 1 - similarity
            distance = 1.0 - similarity
            
            # Check if match
            is_match = similarity >= threshold
            
            compare_time = time.time() - compare_start
            logger.info(f"✅ [COMP-{request_id}] Comparison complete in {compare_time:.2f}s")
            logger.info(f"   [COMP-{request_id}] Result: match={is_match}, similarity={similarity:.2%}, threshold={threshold:.2%}")
            
            return FaceComparisonResult(
                match=is_match,
                similarity=similarity,
                distance=distance,
                threshold=threshold,
                id_has_face=True,
                selfie_has_face=True,
                needs_manual_review=not is_match,
                method='insightface',
                model=FACE_MODEL_NAME
            )
            
        except Exception as e:
            logger.error(f"❌ [COMP-{request_id}] Comparison error: {e}")
            import traceback
            logger.error(f"   [COMP-{request_id}] Traceback:\n{traceback.format_exc()}")
            
            return FaceComparisonResult(
                match=False,
                skipped=True,
                needs_manual_review=True,
                error=f"Face comparison failed: {str(e)}",
                method='insightface'
            )
    
    # ========================================================================
    # Facial Attribute Analysis (Optional)
    # ========================================================================
    
    def analyze_face(
        self, 
        image_data: bytes, 
        actions: List[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze facial attributes (age, gender)
        
        Args:
            image_data: Raw image bytes
            actions: List of analyses to perform ['age', 'gender']
                     (InsightFace supports age and gender)
            
        Returns:
            Dictionary with analysis results
        """
        if actions is None:
            actions = ['age', 'gender']
        
        logger.info(f"🔍 Analyzing face attributes: {actions}")
        
        if not INSIGHTFACE_AVAILABLE or not self._initialized:
            logger.warning("InsightFace not available for analysis")
            return {"error": "Face analysis service not available"}
        
        try:
            img = self._load_image(image_data)
            faces = self._app.get(img)
            
            if not faces:
                return {"error": "No face found for analysis"}
            
            face = faces[0]  # Take first face
            result = {}
            
            if 'age' in actions and hasattr(face, 'age'):
                result['age'] = int(face.age)
            
            if 'gender' in actions and hasattr(face, 'gender'):
                # InsightFace gender: 1 = male, 0 = female
                result['gender'] = 'Male' if face.gender == 1 else 'Female'
            
            logger.info(f"   Analysis result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Face analysis error: {e}")
            return {"error": str(e)}


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

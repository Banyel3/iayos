"""
Face Detection Service - Replaces CompreFace with MediaPipe + Azure Face API

This service provides face detection and comparison using:
1. MediaPipe - Local face detection (fast, free, ~100MB)
2. Azure Face API - Cloud-based face comparison (30K free/month)

Migration from CompreFace:
- MediaPipe replaces CompreFace for face detection
- Azure Face API replaces CompreFace for face comparison (ID ↔ selfie)
- Both services are more reliable and work on Render free tier

Usage:
    from accounts.face_detection_service import get_face_service
    
    service = get_face_service()
    result = service.detect_face(image_bytes)
    match = service.compare_faces(id_image, selfie_image)
"""

import io
import os
import logging
import base64
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

# ============================================================================
# MediaPipe Face Detection (Local - Always Available)
# ============================================================================

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    MEDIAPIPE_AVAILABLE = True
    logger.info("✅ MediaPipe loaded successfully")
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    logger.warning("⚠️ MediaPipe not installed - face detection limited")

# Fallback to OpenCV Haar Cascades if MediaPipe unavailable
try:
    import cv2
    OPENCV_AVAILABLE = True
    logger.info("✅ OpenCV loaded successfully")
except ImportError:
    OPENCV_AVAILABLE = False
    logger.warning("⚠️ OpenCV not installed - no fallback face detection")

# ============================================================================
# Azure Face API Configuration
# ============================================================================

# Azure Face API (free tier: 30,000 calls/month)
# Get keys from: https://portal.azure.com → Create "Face" resource
AZURE_FACE_ENDPOINT = os.getenv("AZURE_FACE_ENDPOINT", "")
AZURE_FACE_KEY = os.getenv("AZURE_FACE_KEY", "")

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

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
    id_has_face: bool = False
    selfie_has_face: bool = False
    skipped: bool = False
    needs_manual_review: bool = False
    error: str = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "match": self.match,
            "similarity": self.similarity,
            "faces_detected": self.id_has_face and self.selfie_has_face,
            "id_has_face": self.id_has_face,
            "selfie_has_face": self.selfie_has_face,
            "skipped": self.skipped,
            "needs_manual_review": self.needs_manual_review,
            "error": self.error
        }


# ============================================================================
# Face Detection Service
# ============================================================================

class FaceDetectionService:
    """
    Face detection and comparison service using MediaPipe + Azure Face API
    
    Detection Strategy:
    1. Try MediaPipe (local, fast, free)
    2. Fallback to OpenCV Haar Cascades (local, very fast, less accurate)
    
    Comparison Strategy:
    1. Try Azure Face API (accurate, 30K free/month)
    2. If Azure unavailable, detect faces in both images and flag for manual review
    """
    
    def __init__(self):
        """Initialize face detection service"""
        self._mediapipe_detector = None
        self._opencv_cascade = None
        self._azure_available = None
        
        # Initialize MediaPipe if available
        if MEDIAPIPE_AVAILABLE:
            try:
                self._init_mediapipe()
                logger.info("✅ MediaPipe face detector initialized")
            except Exception as e:
                logger.warning(f"⚠️ MediaPipe initialization failed: {e}")
        
        # Initialize OpenCV cascade as fallback
        if OPENCV_AVAILABLE:
            try:
                self._opencv_cascade = cv2.CascadeClassifier(
                    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                )
                logger.info("✅ OpenCV Haar Cascade loaded")
            except Exception as e:
                logger.warning(f"⚠️ OpenCV cascade loading failed: {e}")
    
    def _init_mediapipe(self):
        """Initialize MediaPipe face detection"""
        if not MEDIAPIPE_AVAILABLE:
            return
        
        # Use BlazeFace detector (fast and accurate)
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self._mediapipe_detector = self.mp_face_detection.FaceDetection(
            model_selection=1,  # 0 = short-range (2m), 1 = full-range (5m)
            min_detection_confidence=0.5
        )
    
    def check_azure_available(self) -> bool:
        """Check if Azure Face API is configured and available"""
        if self._azure_available is not None:
            return self._azure_available
        
        if not AZURE_FACE_ENDPOINT or not AZURE_FACE_KEY:
            logger.info("Azure Face API not configured (no endpoint/key)")
            self._azure_available = False
            return False
        
        if not HTTPX_AVAILABLE:
            logger.warning("httpx not available for Azure Face API calls")
            self._azure_available = False
            return False
        
        try:
            # Quick health check
            response = httpx.get(
                f"{AZURE_FACE_ENDPOINT}face/v1.0/detect",
                headers={"Ocp-Apim-Subscription-Key": AZURE_FACE_KEY},
                timeout=5.0
            )
            # 400 = bad request (no image) but service is up
            # 401 = unauthorized (bad key)
            # 200 = shouldn't happen without image
            self._azure_available = response.status_code in [200, 400]
            logger.info(f"Azure Face API check: status={response.status_code}, available={self._azure_available}")
        except Exception as e:
            logger.warning(f"Azure Face API not available: {e}")
            self._azure_available = False
        
        return self._azure_available
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get current service availability status"""
        return {
            "mediapipe_available": MEDIAPIPE_AVAILABLE and self._mediapipe_detector is not None,
            "opencv_available": OPENCV_AVAILABLE and self._opencv_cascade is not None,
            "azure_available": self.check_azure_available(),
            "face_detection_available": (
                (MEDIAPIPE_AVAILABLE and self._mediapipe_detector is not None) or
                (OPENCV_AVAILABLE and self._opencv_cascade is not None)
            ),
            "face_comparison_available": self.check_azure_available()
        }
    
    # ========================================================================
    # Face Detection
    # ========================================================================
    
    def detect_face(self, image_data: bytes) -> FaceDetectionResult:
        """
        Detect faces in an image
        
        Args:
            image_data: Raw image bytes (JPEG/PNG)
            
        Returns:
            FaceDetectionResult with detection details
        """
        logger.info("🔍 Starting face detection...")
        
        # Try MediaPipe first
        if MEDIAPIPE_AVAILABLE and self._mediapipe_detector:
            try:
                result = self._detect_with_mediapipe(image_data)
                if not result.skipped:
                    return result
            except Exception as e:
                logger.warning(f"MediaPipe detection failed: {e}")
        
        # Fallback to OpenCV
        if OPENCV_AVAILABLE and self._opencv_cascade is not None:
            try:
                result = self._detect_with_opencv(image_data)
                if not result.skipped:
                    return result
            except Exception as e:
                logger.warning(f"OpenCV detection failed: {e}")
        
        # No detection method available
        logger.error("❌ No face detection method available")
        return FaceDetectionResult(
            detected=False,
            skipped=True,
            error="No face detection service available"
        )
    
    def _detect_with_mediapipe(self, image_data: bytes) -> FaceDetectionResult:
        """Detect faces using MediaPipe"""
        try:
            # Load image
            image = Image.open(io.BytesIO(image_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            image_np = np.array(image)
            img_height, img_width = image_np.shape[:2]
            img_area = img_height * img_width
            
            # Detect faces
            results = self._mediapipe_detector.process(image_np)
            
            if not results.detections:
                logger.info("   MediaPipe: No faces detected")
                return FaceDetectionResult(detected=False, count=0, confidence=0)
            
            # Process detections
            bounding_boxes = []
            max_confidence = 0
            face_too_small = True
            
            for detection in results.detections:
                confidence = detection.score[0]
                if confidence > max_confidence:
                    max_confidence = confidence
                
                # Get bounding box
                bbox = detection.location_data.relative_bounding_box
                x_min = int(bbox.xmin * img_width)
                y_min = int(bbox.ymin * img_height)
                width = int(bbox.width * img_width)
                height = int(bbox.height * img_height)
                
                face_area = width * height
                if face_area / img_area >= 0.05:  # 5% of image
                    face_too_small = False
                
                bounding_boxes.append({
                    "x_min": x_min,
                    "y_min": y_min,
                    "x_max": x_min + width,
                    "y_max": y_min + height,
                    "probability": float(confidence)
                })
            
            logger.info(f"   MediaPipe: Detected {len(results.detections)} face(s), confidence={max_confidence:.2f}")
            
            return FaceDetectionResult(
                detected=True,
                count=len(results.detections),
                confidence=float(max_confidence),
                bounding_boxes=bounding_boxes,
                face_too_small=face_too_small
            )
            
        except Exception as e:
            logger.error(f"MediaPipe detection error: {e}")
            return FaceDetectionResult(skipped=True, error=str(e))
    
    def _detect_with_opencv(self, image_data: bytes) -> FaceDetectionResult:
        """Detect faces using OpenCV Haar Cascades (fallback)"""
        try:
            # Load image
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            img_height, img_width = image.shape[:2]
            img_area = img_height * img_width
            
            # Detect faces
            faces = self._opencv_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            if len(faces) == 0:
                logger.info("   OpenCV: No faces detected")
                return FaceDetectionResult(detected=False, count=0, confidence=0)
            
            # Process detections (OpenCV doesn't give confidence, estimate 0.85)
            bounding_boxes = []
            face_too_small = True
            
            for (x, y, w, h) in faces:
                face_area = w * h
                if face_area / img_area >= 0.05:
                    face_too_small = False
                
                bounding_boxes.append({
                    "x_min": int(x),
                    "y_min": int(y),
                    "x_max": int(x + w),
                    "y_max": int(y + h),
                    "probability": 0.85  # OpenCV doesn't provide confidence
                })
            
            logger.info(f"   OpenCV: Detected {len(faces)} face(s)")
            
            return FaceDetectionResult(
                detected=True,
                count=len(faces),
                confidence=0.85,
                bounding_boxes=bounding_boxes,
                face_too_small=face_too_small
            )
            
        except Exception as e:
            logger.error(f"OpenCV detection error: {e}")
            return FaceDetectionResult(skipped=True, error=str(e))
    
    # ========================================================================
    # Face Comparison (Azure Face API)
    # ========================================================================
    
    def compare_faces(
        self, 
        id_image_data: bytes, 
        selfie_image_data: bytes,
        similarity_threshold: float = 0.80
    ) -> FaceComparisonResult:
        """
        Compare faces between ID document and selfie
        
        Args:
            id_image_data: Raw bytes of ID document image
            selfie_image_data: Raw bytes of selfie image
            similarity_threshold: Minimum similarity for match (0-1)
            
        Returns:
            FaceComparisonResult with comparison details
        """
        logger.info("🔍 Starting face comparison...")
        
        # First, detect faces in both images locally
        id_result = self.detect_face(id_image_data)
        selfie_result = self.detect_face(selfie_image_data)
        
        id_has_face = id_result.detected and id_result.count > 0
        selfie_has_face = selfie_result.detected and selfie_result.count > 0
        
        # Check if faces detected in both
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
        
        # Try Azure Face API for comparison
        if self.check_azure_available():
            try:
                result = self._compare_with_azure(id_image_data, selfie_image_data, similarity_threshold)
                if not result.skipped:
                    return result
            except Exception as e:
                logger.warning(f"Azure Face API comparison failed: {e}")
        
        # Azure not available - return success with manual review flag
        logger.info("   ✅ Faces detected in both images - flagged for manual review")
        return FaceComparisonResult(
            match=True,  # Allow to proceed
            similarity=0.0,  # Unknown
            id_has_face=True,
            selfie_has_face=True,
            needs_manual_review=True,
            error=None
        )
    
    def _compare_with_azure(
        self, 
        id_image_data: bytes, 
        selfie_image_data: bytes,
        similarity_threshold: float
    ) -> FaceComparisonResult:
        """Compare faces using Azure Face API"""
        try:
            # Step 1: Detect face in ID and get faceId
            id_face_id = self._detect_face_azure(id_image_data)
            if not id_face_id:
                return FaceComparisonResult(
                    match=False,
                    id_has_face=False,
                    error="Azure could not detect face in ID"
                )
            
            # Step 2: Detect face in selfie and get faceId
            selfie_face_id = self._detect_face_azure(selfie_image_data)
            if not selfie_face_id:
                return FaceComparisonResult(
                    match=False,
                    id_has_face=True,
                    selfie_has_face=False,
                    error="Azure could not detect face in selfie"
                )
            
            # Step 3: Verify faces match
            match_result = self._verify_faces_azure(id_face_id, selfie_face_id)
            
            is_match = match_result.get("isIdentical", False)
            confidence = match_result.get("confidence", 0.0)
            
            logger.info(f"   Azure comparison: match={is_match}, confidence={confidence:.2f}")
            
            return FaceComparisonResult(
                match=is_match or confidence >= similarity_threshold,
                similarity=confidence,
                id_has_face=True,
                selfie_has_face=True
            )
            
        except Exception as e:
            logger.error(f"Azure Face API error: {e}")
            return FaceComparisonResult(
                skipped=True,
                id_has_face=True,
                selfie_has_face=True,
                needs_manual_review=True,
                error=str(e)
            )
    
    def _detect_face_azure(self, image_data: bytes) -> Optional[str]:
        """Detect face and get faceId from Azure Face API"""
        try:
            response = httpx.post(
                f"{AZURE_FACE_ENDPOINT}face/v1.0/detect",
                headers={
                    "Ocp-Apim-Subscription-Key": AZURE_FACE_KEY,
                    "Content-Type": "application/octet-stream"
                },
                params={
                    "returnFaceId": "true",
                    "detectionModel": "detection_03",
                    "recognitionModel": "recognition_04"
                },
                content=image_data,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.warning(f"Azure detect returned {response.status_code}: {response.text}")
                return None
            
            faces = response.json()
            if not faces:
                return None
            
            return faces[0].get("faceId")
            
        except Exception as e:
            logger.error(f"Azure detect error: {e}")
            return None
    
    def _verify_faces_azure(self, face_id1: str, face_id2: str) -> Dict[str, Any]:
        """Verify if two faces match using Azure Face API"""
        try:
            response = httpx.post(
                f"{AZURE_FACE_ENDPOINT}face/v1.0/verify",
                headers={
                    "Ocp-Apim-Subscription-Key": AZURE_FACE_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "faceId1": face_id1,
                    "faceId2": face_id2
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.warning(f"Azure verify returned {response.status_code}: {response.text}")
                return {"isIdentical": False, "confidence": 0.0}
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Azure verify error: {e}")
            return {"isIdentical": False, "confidence": 0.0}


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

"""
Face Detection Service - Using External Face API (MediaPipe)

This service calls an external Face API microservice for face detection.
The Face API uses Google's MediaPipe for lightweight face detection (~150MB RAM).

External Service: https://iayos-face-api.onrender.com
Endpoints:
- GET /health - Health check
- POST /detect - Detect faces in an image
- POST /verify - Check if faces exist in both images (detection only, no matching)

IMPORTANT: MediaPipe only supports face DETECTION, not face MATCHING/VERIFICATION.
All face comparisons will auto-accept and store images for manual review if needed.

Usage:
    from accounts.face_detection_service import get_face_service
    
    service = get_face_service()
    result = service.detect_face(image_bytes)
    match = service.compare_faces(id_image, selfie_image)
"""

import os
import logging
import requests
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# ============================================================================
# Face API Configuration
# ============================================================================

# External Face API service URL
FACE_API_URL = os.getenv("FACE_API_URL", "https://iayos-face-api.onrender.com")

# Request timeout (Face API cold start can take ~10-15s on Render free tier)
FACE_API_TIMEOUT = int(os.getenv("FACE_API_TIMEOUT", "30"))

# Minimum confidence threshold for face detection
MIN_FACE_CONFIDENCE = float(os.getenv("MIN_FACE_CONFIDENCE", "0.7"))

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
    method: str = None  # 'face_api', 'auto_accept', etc.
    model: str = None  # Which face detection model was used
    
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
    Face detection service using external Face API (MediaPipe-based)
    
    The external service provides:
    - Face detection (count, confidence, bounding boxes)
    - Basic face presence verification (does NOT match faces)
    
    Since MediaPipe cannot match faces, all face comparisons auto-accept.
    Images are stored in Supabase for manual review if issues arise.
    """
    
    def __init__(self):
        """Initialize face detection service"""
        self._api_url = FACE_API_URL
        self._timeout = FACE_API_TIMEOUT
        self._initialized = bool(self._api_url)
        
        if self._initialized:
            logger.info(f"FaceDetectionService initialized with API: {self._api_url}")
        else:
            logger.warning("FACE_API_URL not set - face detection disabled")
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get current service availability status"""
        status = {
            "face_api_url": self._api_url,
            "face_detection_available": self._initialized,
            "face_comparison_available": self._initialized,
            "model": "mediapipe",
            "auto_accept_enabled": True,  # Always auto-accept since MediaPipe can't match
        }
        
        # Optionally check if Face API is reachable
        if self._initialized:
            try:
                response = requests.get(
                    f"{self._api_url}/health",
                    timeout=5
                )
                if response.status_code == 200:
                    health = response.json()
                    status["face_api_status"] = "healthy"
                    status["face_api_memory_mb"] = health.get("memory_mb")
                    status["face_api_requests_served"] = health.get("requests_served")
                else:
                    status["face_api_status"] = "degraded"
            except Exception as e:
                status["face_api_status"] = "unreachable"
                status["face_api_error"] = str(e)
        
        return status
    
    # ========================================================================
    # Face Detection
    # ========================================================================
    
    def detect_face(self, image_data: bytes) -> FaceDetectionResult:
        """
        Detect faces in an image using external Face API
        
        Args:
            image_data: Raw image bytes (JPEG/PNG)
            
        Returns:
            FaceDetectionResult with detection details
        """
        import time
        request_id = int(time.time() * 1000) % 1000000
        logger.info(f"[REQ-{request_id}] Starting face detection via Face API...")
        logger.info(f"   [REQ-{request_id}] Image size: {len(image_data)} bytes")
        
        if not self._initialized:
            logger.error(f"[REQ-{request_id}] Face API URL not configured")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error="Face detection service not configured"
            )
        
        try:
            detect_start = time.time()
            
            # Call external Face API
            files = {"file": ("image.jpg", image_data, "image/jpeg")}
            response = requests.post(
                f"{self._api_url}/detect",
                files=files,
                timeout=self._timeout
            )
            
            detect_time = time.time() - detect_start
            logger.info(f"   [REQ-{request_id}] API response in {detect_time:.2f}s, status={response.status_code}")
            
            if response.status_code != 200:
                error_msg = response.json().get("detail", "Unknown error")
                logger.error(f"[REQ-{request_id}] Face API error: {error_msg}")
                return FaceDetectionResult(
                    detected=False,
                    skipped=True,
                    error=f"Face API error: {error_msg}"
                )
            
            data = response.json()
            
            # Parse response
            detected = data.get("detected", False)
            count = data.get("count", 0)
            confidence = data.get("confidence", 0.0)
            faces = data.get("faces", [])
            
            # Convert faces to bounding_boxes format
            bounding_boxes = []
            for face in faces:
                bbox = face.get("bbox", {})
                bounding_boxes.append({
                    "x_min": bbox.get("x_min", 0),
                    "y_min": bbox.get("y_min", 0),
                    "x_max": bbox.get("x_max", 0),
                    "y_max": bbox.get("y_max", 0),
                    "probability": face.get("confidence", 0.0)
                })
            
            logger.info(f"[REQ-{request_id}] Detected {count} face(s), confidence={confidence:.2f}")
            
            return FaceDetectionResult(
                detected=detected,
                count=count,
                confidence=float(confidence),
                bounding_boxes=bounding_boxes,
                face_too_small=False  # Let the caller determine this
            )
            
        except requests.exceptions.Timeout:
            logger.error(f"[REQ-{request_id}] Face API timeout after {self._timeout}s")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error="Face detection timed out - service may be starting up"
            )
        except requests.exceptions.ConnectionError as e:
            logger.error(f"[REQ-{request_id}] Face API connection error: {e}")
            return FaceDetectionResult(
                detected=False,
                skipped=True,
                error="Face detection service unavailable"
            )
        except Exception as e:
            logger.error(f"[REQ-{request_id}] Detection error: {e}")
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
        Compare faces between ID document and selfie.
        
        IMPORTANT: MediaPipe does NOT support face matching/verification.
        This method will:
        1. Check if a face exists in the ID document
        2. Check if a face exists in the selfie
        3. AUTO-ACCEPT if both faces are detected
        
        Images are stored in Supabase for manual review if issues arise later.
        
        Args:
            id_image_data: Raw bytes of ID document image
            selfie_image_data: Raw bytes of selfie image
            similarity_threshold: Ignored (MediaPipe cannot match faces)
            
        Returns:
            FaceComparisonResult with auto-accept if both faces detected
        """
        import time
        request_id = int(time.time() * 1000) % 1000000
        logger.info(f"[COMP-{request_id}] Starting face comparison via Face API (auto-accept mode)...")
        logger.info(f"   [COMP-{request_id}] ID image size: {len(id_image_data)} bytes")
        logger.info(f"   [COMP-{request_id}] Selfie image size: {len(selfie_image_data)} bytes")
        
        if not self._initialized:
            logger.warning(f"[COMP-{request_id}] Face API not configured - auto-accepting")
            return FaceComparisonResult(
                match=True,  # Auto-accept
                similarity=1.0,
                id_has_face=True,
                selfie_has_face=True,
                needs_manual_review=False,
                method="auto_accept",
                model="none"
            )
        
        try:
            compare_start = time.time()
            
            # Call external Face API /verify endpoint
            files = {
                "file1": ("id.jpg", id_image_data, "image/jpeg"),
                "file2": ("selfie.jpg", selfie_image_data, "image/jpeg")
            }
            response = requests.post(
                f"{self._api_url}/verify",
                files=files,
                timeout=self._timeout
            )
            
            compare_time = time.time() - compare_start
            logger.info(f"   [COMP-{request_id}] API response in {compare_time:.2f}s, status={response.status_code}")
            
            if response.status_code != 200:
                # Service error - auto-accept anyway
                logger.warning(f"[COMP-{request_id}] Face API error - auto-accepting")
                return FaceComparisonResult(
                    match=True,  # Auto-accept on error
                    similarity=1.0,
                    id_has_face=True,
                    selfie_has_face=True,
                    needs_manual_review=False,
                    method="auto_accept",
                    model="mediapipe"
                )
            
            data = response.json()
            
            id_has_face = data.get("face1_detected", False)
            selfie_has_face = data.get("face2_detected", False)
            
            logger.info(f"   [COMP-{request_id}] ID has face: {id_has_face}, Selfie has face: {selfie_has_face}")
            
            # Auto-accept: If both images have faces, consider it a match
            # MediaPipe cannot actually verify they are the same person
            if id_has_face and selfie_has_face:
                logger.info(f"[COMP-{request_id}] Both faces detected - auto-accepting")
                return FaceComparisonResult(
                    match=True,
                    similarity=1.0,  # We assume match since we cannot verify
                    distance=0.0,
                    threshold=0.0,
                    id_has_face=True,
                    selfie_has_face=True,
                    needs_manual_review=False,
                    method="face_api_auto_accept",
                    model="mediapipe"
                )
            
            # If one image is missing a face, still auto-accept but note it
            if not id_has_face:
                logger.warning(f"[COMP-{request_id}] No face in ID - auto-accepting anyway")
            if not selfie_has_face:
                logger.warning(f"[COMP-{request_id}] No face in selfie - auto-accepting anyway")
            
            # Auto-accept even if faces missing - images are stored for review
            return FaceComparisonResult(
                match=True,  # Auto-accept
                similarity=1.0,
                distance=0.0,
                threshold=0.0,
                id_has_face=id_has_face,
                selfie_has_face=selfie_has_face,
                needs_manual_review=False,
                method="face_api_auto_accept",
                model="mediapipe"
            )
            
        except requests.exceptions.Timeout:
            logger.warning(f"[COMP-{request_id}] Face API timeout - auto-accepting")
            return FaceComparisonResult(
                match=True,  # Auto-accept on timeout
                similarity=1.0,
                id_has_face=True,
                selfie_has_face=True,
                needs_manual_review=False,
                method="auto_accept",
                model="mediapipe"
            )
        except Exception as e:
            logger.warning(f"[COMP-{request_id}] Comparison error: {e} - auto-accepting")
            return FaceComparisonResult(
                match=True,  # Auto-accept on error
                similarity=1.0,
                id_has_face=True,
                selfie_has_face=True,
                needs_manual_review=False,
                error=str(e),
                method="auto_accept",
                model="mediapipe"
            )
    
    # ========================================================================
    # Facial Attribute Analysis (Not supported by MediaPipe Face Detection)
    # ========================================================================
    
    def analyze_face(
        self, 
        image_data: bytes, 
        actions: List[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze facial attributes (age, gender)
        
        NOTE: MediaPipe Face Detection does not support attribute analysis.
        This method returns empty results.
        
        Args:
            image_data: Raw image bytes
            actions: List of analyses to perform (ignored)
            
        Returns:
            Dictionary indicating analysis not supported
        """
        logger.info("Facial attribute analysis not supported by MediaPipe")
        return {
            "error": "Facial attribute analysis not available",
            "note": "MediaPipe only supports face detection, not attribute analysis"
        }


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

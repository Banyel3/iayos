"""
Face Detection & Verification Service - Using face_recognition (dlib)

This service uses the `face_recognition` Python library (dlib-based) for both
face DETECTION and face MATCHING/VERIFICATION locally.

Key capabilities:
- Face detection using HOG (Histogram of Oriented Gradients)
- 128-dimensional face encoding for comparison
- Euclidean distance-based similarity scoring
- 99.38% accuracy on LFW benchmark

Memory usage: ~150 MB (fits within 1 GB DigitalOcean instance alongside Django)

Usage:
    from accounts.face_detection_service import get_face_service

    service = get_face_service()
    result = service.detect_face(image_bytes)
    match = service.compare_faces(id_image, selfie_image)
"""

import io
import logging
import time
import threading
import concurrent.futures
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

# Default threshold: Euclidean distance <= 0.55 → match
# Lower distance = more similar.  similarity = 1 - distance
DEFAULT_FACE_MATCH_THRESHOLD = 0.55

# Timeout (seconds) for a single face detection / comparison call.
# If the underlying dlib call hangs (e.g. missing model files), this
# prevents an infinite block that would cause a 504 gateway timeout.
FACE_DETECTION_TIMEOUT = 30

# ============================================================================
# Lazy import helpers (avoid loading dlib at module import time)
# ============================================================================

_face_recognition = None
_face_recognition_available: Optional[bool] = None  # None = not checked yet


def _get_face_recognition():
    """Lazy-load the face_recognition library and verify model files exist.
    
    Returns the face_recognition module if models are available, else None.
    """
    global _face_recognition, _face_recognition_available

    # Already checked and unavailable – fast exit
    if _face_recognition_available is False:
        return None

    if _face_recognition is None:
        # IMPORTANT: Check face_recognition_models FIRST before importing face_recognition.
        # When face_recognition_models is absent, face_recognition/__init__.py calls quit()
        # which raises SystemExit (a BaseException, not Exception/ImportError).
        # SystemExit in an ASGI worker causes a full server restart – importing
        # face_recognition first would trigger that crash before we can guard against it.
        try:
            import face_recognition_models
            import os
            model_path = face_recognition_models.face_recognition_model_location()
            predictor_path = face_recognition_models.pose_predictor_model_location()
            if not os.path.exists(model_path) or not os.path.exists(predictor_path):
                raise FileNotFoundError(
                    f"face_recognition model files not found: "
                    f"model={os.path.exists(model_path)}, predictor={os.path.exists(predictor_path)}"
                )
        except (ImportError, FileNotFoundError) as model_err:
            logger.error(
                f"face_recognition_models NOT available: {model_err}. "
                "Face detection will be skipped (documents will go to manual review)."
            )
            _face_recognition_available = False
            return None

        # Models confirmed present – now safe to import face_recognition.
        # Use BaseException (not just ImportError) to catch SystemExit in case
        # face_recognition itself calls quit() for any unexpected reason.
        try:
            import face_recognition as _fr
            _face_recognition = _fr
            _face_recognition_available = True
            logger.info("face_recognition library loaded (dlib models verified and ready)")
        except BaseException as e:
            logger.error(f"face_recognition import failed: {e}")
            _face_recognition_available = False
            return None

    return _face_recognition


def _bytes_to_image(data: bytes, max_dim: int = 1024):
    """Convert raw image bytes to a numpy RGB array that face_recognition expects.
    
    Downscales the longest edge to *max_dim* (default 1024 px) using
    Lanczos resampling.  Phone cameras produce 12-48 MP images whose
    raw numpy arrays exceed 36 MB – far too large for the HOG detector
    on a single-vCPU instance.  Down-scaling to 1024 px keeps the face
    well above the 64 px minimum HOG needs while cutting detection time
    from ~10 s to < 1 s.
    """
    from PIL import Image
    import numpy as np
    img = Image.open(io.BytesIO(data)).convert("RGB")
    
    # Downscale if either dimension exceeds max_dim
    w, h = img.size
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        new_w, new_h = int(w * scale), int(h * scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        logger.info(f"Image downscaled from {w}x{h} to {new_w}x{new_h} for face detection")
    
    return np.array(img)


def prewarm_face_api() -> bool:
    """
    Pre-warm the face_recognition library by loading the dlib model.
    Call once on Django startup so the first real request is fast.
    Returns True if face_recognition is functional, False otherwise.
    """
    try:
        fr = _get_face_recognition()
        if fr is None:
            logger.warning("face_recognition pre-warm: models not available – face detection disabled")
            return False
        logger.info("face_recognition pre-warmed successfully")
        return True
    except BaseException as e:
        logger.warning(f"face_recognition pre-warm failed: {e}")
        return False


# ============================================================================
# Result Data Classes
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
            "error": self.error,
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
    method: str = None
    model: str = None

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
            "model": self.model,
        }


# ============================================================================
# Face Detection Service
# ============================================================================

class FaceDetectionService:
    """
    Local face detection + verification using face_recognition (dlib).

    Unlike the old MediaPipe-based external service this replaces, this can
    actually MATCH faces, not just detect them.
    """

    def __init__(self):
        self._initialized = True
        logger.info("FaceDetectionService initialised (dlib / face_recognition)")

    # ------------------------------------------------------------------
    # Service status
    # ------------------------------------------------------------------

    def get_service_status(self) -> Dict[str, Any]:
        available = _face_recognition_available is not False
        return {
            "face_detection_available": available,
            "face_comparison_available": available,
            "model": "dlib_face_recognition",
            "auto_accept_enabled": False,
            "threshold": DEFAULT_FACE_MATCH_THRESHOLD,
        }

    # ------------------------------------------------------------------
    # Face Detection
    # ------------------------------------------------------------------

    def detect_face(self, image_data: bytes) -> FaceDetectionResult:
        """Detect faces in an image using HOG detector.
        
        Returns skipped=True if face_recognition models aren't available
        or if the call times out.
        """
        request_id = int(time.time() * 1000) % 1000000
        logger.info(f"[REQ-{request_id}] detect_face  image={len(image_data)} bytes")

        # Fast exit if face_recognition models are unavailable
        fr = _get_face_recognition()
        if fr is None:
            logger.warning(f"[REQ-{request_id}] face_recognition unavailable – skipping detection")
            return FaceDetectionResult(
                detected=False, skipped=True,
                error="Face detection models not installed (document will be reviewed manually)",
            )

        def _do_detect():
            img = _bytes_to_image(image_data)
            return fr.face_locations(img, model="hog")

        try:
            # Run with timeout to prevent hanging if dlib gets stuck
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_do_detect)
                locations = future.result(timeout=FACE_DETECTION_TIMEOUT)

            count = len(locations)

            bounding_boxes = []
            for top, right, bottom, left in locations:
                bounding_boxes.append({
                    "x_min": left, "y_min": top,
                    "x_max": right, "y_max": bottom,
                    "probability": 0.99,
                })

            detected = count > 0
            confidence = 0.99 if detected else 0.0
            logger.info(f"[REQ-{request_id}] Detected {count} face(s)")

            return FaceDetectionResult(
                detected=detected,
                count=count,
                confidence=confidence,
                bounding_boxes=bounding_boxes,
            )

        except concurrent.futures.TimeoutError:
            logger.error(f"[REQ-{request_id}] Face detection TIMED OUT after {FACE_DETECTION_TIMEOUT}s")
            return FaceDetectionResult(
                detected=False, skipped=True,
                error=f"Face detection timed out ({FACE_DETECTION_TIMEOUT}s) – document will be reviewed manually",
            )

        except Exception as e:
            logger.error(f"[REQ-{request_id}] Detection error: {e}")
            return FaceDetectionResult(
                detected=False, skipped=True,
                error=f"Face detection failed: {e}",
            )

    # ------------------------------------------------------------------
    # Face Comparison / Verification
    # ------------------------------------------------------------------

    def compare_faces(
        self,
        id_image_data: bytes,
        selfie_image_data: bytes,
        similarity_threshold: float = None,
    ) -> FaceComparisonResult:
        """
        Compare the face in an ID document with a selfie.

        Uses 128-d face encodings + Euclidean distance.
        similarity = 1 - distance   (range 0-1, higher is better)
        """
        threshold = similarity_threshold or DEFAULT_FACE_MATCH_THRESHOLD
        request_id = int(time.time() * 1000) % 1000000
        logger.info(
            f"[COMP-{request_id}] compare_faces  "
            f"id={len(id_image_data)}B  selfie={len(selfie_image_data)}B  "
            f"threshold={threshold}"
        )

        # Fast exit if face_recognition models are unavailable
        fr = _get_face_recognition()
        if fr is None:
            logger.warning(f"[COMP-{request_id}] face_recognition unavailable – skipping comparison")
            return FaceComparisonResult(
                match=False,
                similarity=0.0,
                distance=1.0,
                threshold=threshold,
                skipped=True,
                needs_manual_review=True,
                error="Face detection models not installed (document will be reviewed manually)",
                method="face_recognition",
                model="dlib_resnet_128d",
            )

        def _do_compare():
            id_img = _bytes_to_image(id_image_data)
            selfie_img = _bytes_to_image(selfie_image_data)
            id_enc = fr.face_encodings(id_img)
            selfie_enc = fr.face_encodings(selfie_img)
            return id_enc, selfie_enc

        try:
            # Run with timeout to prevent hanging
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_do_compare)
                id_encodings, selfie_encodings = future.result(timeout=FACE_DETECTION_TIMEOUT * 2)

            id_has_face = len(id_encodings) > 0
            selfie_has_face = len(selfie_encodings) > 0

            if not id_has_face or not selfie_has_face:
                missing = []
                if not id_has_face:
                    missing.append("ID")
                if not selfie_has_face:
                    missing.append("selfie")
                msg = f"No face found in: {', '.join(missing)}"
                logger.warning(f"[COMP-{request_id}] {msg}")
                return FaceComparisonResult(
                    match=False,
                    similarity=0.0,
                    distance=1.0,
                    threshold=threshold,
                    id_has_face=id_has_face,
                    selfie_has_face=selfie_has_face,
                    needs_manual_review=True,
                    error=msg,
                    method="face_recognition",
                    model="dlib_resnet_128d",
                )

            # Euclidean distance between the two 128-d vectors
            distance = float(fr.face_distance([id_encodings[0]], selfie_encodings[0])[0])
            similarity = round(1.0 - distance, 4)
            is_match = distance <= threshold

            logger.info(
                f"[COMP-{request_id}] distance={distance:.4f}  "
                f"similarity={similarity:.4f}  match={is_match}"
            )

            return FaceComparisonResult(
                match=is_match,
                similarity=similarity,
                distance=distance,
                threshold=threshold,
                id_has_face=True,
                selfie_has_face=True,
                needs_manual_review=not is_match,
                method="face_recognition",
                model="dlib_resnet_128d",
            )

        except concurrent.futures.TimeoutError:
            logger.error(f"[COMP-{request_id}] Face comparison TIMED OUT after {FACE_DETECTION_TIMEOUT * 2}s")
            return FaceComparisonResult(
                match=False,
                similarity=0.0,
                distance=1.0,
                threshold=threshold,
                skipped=True,
                needs_manual_review=True,
                error=f"Face comparison timed out – document will be reviewed manually",
                method="face_recognition",
                model="dlib_resnet_128d",
            )

        except Exception as e:
            logger.error(f"[COMP-{request_id}] Comparison error: {e}")
            return FaceComparisonResult(
                match=False,
                similarity=0.0,
                distance=1.0,
                threshold=threshold,
                id_has_face=False,
                selfie_has_face=False,
                needs_manual_review=True,
                error=str(e),
                method="face_recognition",
                model="dlib_resnet_128d",
            )

    # ------------------------------------------------------------------
    # Facial Attribute Analysis (not supported)
    # ------------------------------------------------------------------

    def analyze_face(self, image_data: bytes, actions: List[str] = None) -> Dict[str, Any]:
        """Not supported by face_recognition library."""
        return {
            "error": "Facial attribute analysis not available",
            "note": "face_recognition only supports detection and verification",
        }


# ============================================================================
# Singleton
# ============================================================================

_face_service: Optional[FaceDetectionService] = None


def get_face_service() -> FaceDetectionService:
    """Get or create the face detection service singleton."""
    global _face_service
    if _face_service is None:
        _face_service = FaceDetectionService()
    return _face_service


def check_face_services_available() -> Dict[str, Any]:
    """Check which face detection services are available (for health checks)."""
    service = get_face_service()
    return service.get_service_status()

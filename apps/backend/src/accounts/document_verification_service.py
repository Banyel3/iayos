"""
Document Verification Service for KYC Uploads

This service provides automated verification of KYC documents using:
1. CompreFace - Face detection for government IDs
2. Tesseract OCR - Text extraction for clearances and permits
3. Image quality checks - Blur detection, resolution, orientation

Integration points:
- Called during upload_kyc_document() after Supabase upload
- Returns verification results that can auto-reject or flag for manual review
"""

import io
import re
import httpx
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from enum import Enum
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

# CompreFace configuration
COMPREFACE_URL = "http://compreface:8100"
COMPREFACE_API_KEY = "compreface-api-key"  # Will be set via environment variable

# Tesseract is imported conditionally to handle environments where it's not installed
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract not installed - OCR verification disabled")


class VerificationStatus(Enum):
    """Verification result status"""
    PASSED = "PASSED"
    FAILED = "FAILED"
    WARNING = "WARNING"
    SKIPPED = "SKIPPED"


class RejectionReason(Enum):
    """Auto-rejection reasons"""
    NO_FACE_DETECTED = "NO_FACE_DETECTED"
    MULTIPLE_FACES = "MULTIPLE_FACES"
    FACE_TOO_SMALL = "FACE_TOO_SMALL"
    MISSING_REQUIRED_TEXT = "MISSING_REQUIRED_TEXT"
    IMAGE_TOO_BLURRY = "IMAGE_TOO_BLURRY"
    RESOLUTION_TOO_LOW = "RESOLUTION_TOO_LOW"
    INVALID_ORIENTATION = "INVALID_ORIENTATION"
    UNREADABLE_DOCUMENT = "UNREADABLE_DOCUMENT"


@dataclass
class VerificationResult:
    """Result of document verification"""
    status: VerificationStatus
    rejection_reason: Optional[RejectionReason] = None
    confidence_score: float = 0.0
    details: Dict[str, Any] = None
    extracted_text: str = ""
    face_detected: bool = False
    face_count: int = 0
    quality_score: float = 0.0
    warnings: List[str] = None

    def __post_init__(self):
        if self.details is None:
            self.details = {}
        if self.warnings is None:
            self.warnings = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "rejection_reason": self.rejection_reason.value if self.rejection_reason else None,
            "confidence_score": self.confidence_score,
            "details": self.details,
            "extracted_text": self.extracted_text[:500] if self.extracted_text else "",  # Truncate
            "face_detected": self.face_detected,
            "face_count": self.face_count,
            "quality_score": self.quality_score,
            "warnings": self.warnings
        }


# Document type to required keywords mapping
DOCUMENT_KEYWORDS = {
    # NBI Clearance - must contain these keywords
    "NBI": [
        ["NBI", "NATIONAL BUREAU OF INVESTIGATION"],  # Must have at least one
        ["CLEARANCE"],  # Must have clearance
    ],
    # Police Clearance
    "POLICE": [
        ["POLICE", "PNP", "PHILIPPINE NATIONAL POLICE"],
        ["CLEARANCE", "CERTIFICATE"],
    ],
    # Business Permit (for agencies)
    "BUSINESS_PERMIT": [
        ["BUSINESS", "MAYOR", "PERMIT", "LICENSE"],
        ["CITY", "MUNICIPALITY", "BARANGAY"],
    ],
}

# Government IDs that require face detection
FACE_REQUIRED_DOCUMENTS = [
    "PASSPORT", "NATIONALID", "UMID", "PHILHEALTH", 
    "DRIVERSLICENSE", "FRONTID", "REPRESENTATIVE_ID_FRONT"
]

# Minimum requirements
MIN_RESOLUTION = 640  # Minimum width or height in pixels
MIN_FACE_SIZE_RATIO = 0.05  # Face must be at least 5% of image area
MAX_BLUR_THRESHOLD = 100  # Laplacian variance threshold (lower = more blur)
MIN_CONFIDENCE_FACE = 0.85  # Minimum confidence for face detection


class DocumentVerificationService:
    """
    Service for automated document verification using AI/ML
    """

    def __init__(self, compreface_url: str = None, compreface_api_key: str = None):
        """
        Initialize the verification service
        
        Args:
            compreface_url: URL of CompreFace service (default: http://compreface:8100)
            compreface_api_key: API key for CompreFace
        """
        import os
        self.compreface_url = compreface_url or os.getenv("COMPREFACE_URL", COMPREFACE_URL)
        self.compreface_api_key = compreface_api_key or os.getenv("COMPREFACE_API_KEY", COMPREFACE_API_KEY)
        self._compreface_available = None  # Lazy check
        
        logger.info(f"DocumentVerificationService initialized - CompreFace URL: {self.compreface_url}")

    def _check_compreface_available(self) -> bool:
        """Check if CompreFace service is available"""
        if self._compreface_available is not None:
            return self._compreface_available
            
        try:
            # Try to reach CompreFace health endpoint
            response = httpx.get(f"{self.compreface_url}/api/v1/recognition/faces", timeout=5.0)
            self._compreface_available = response.status_code in [200, 401, 404]  # Service is up
            logger.info(f"CompreFace availability: {self._compreface_available}")
        except Exception as e:
            logger.warning(f"CompreFace not available: {e}")
            self._compreface_available = False
            
        return self._compreface_available

    def verify_document(
        self, 
        file_data: bytes, 
        document_type: str,
        file_name: str = ""
    ) -> VerificationResult:
        """
        Verify a single document
        
        Args:
            file_data: Raw file bytes
            document_type: Type of document (e.g., "FRONTID", "NBI", "PASSPORT")
            file_name: Original filename for logging
            
        Returns:
            VerificationResult with verification details
        """
        logger.info(f"🔍 Starting verification for document: {document_type} ({file_name})")
        
        warnings = []
        details = {}
        
        try:
            # Load image
            image = Image.open(io.BytesIO(file_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            width, height = image.size
            details["resolution"] = f"{width}x{height}"
            logger.info(f"   Image loaded: {width}x{height}, mode={image.mode}")
            
            # Step 1: Check image quality
            quality_result = self._check_image_quality(image)
            details["quality"] = quality_result
            
            if quality_result["status"] == "FAILED":
                logger.warning(f"   ❌ Quality check failed: {quality_result['reason']}")
                return VerificationResult(
                    status=VerificationStatus.FAILED,
                    rejection_reason=RejectionReason[quality_result["rejection_reason"]],
                    quality_score=quality_result["score"],
                    details=details,
                    warnings=warnings
                )
            
            if quality_result["warnings"]:
                warnings.extend(quality_result["warnings"])
            
            # Step 2: Face detection (for IDs)
            face_required = document_type.upper() in FACE_REQUIRED_DOCUMENTS
            face_result = {"detected": False, "count": 0, "confidence": 0}
            
            if face_required:
                face_result = self._detect_face(file_data)
                details["face_detection"] = face_result
                
                if not face_result["detected"]:
                    logger.warning(f"   ❌ No face detected in ID document")
                    return VerificationResult(
                        status=VerificationStatus.FAILED,
                        rejection_reason=RejectionReason.NO_FACE_DETECTED,
                        face_detected=False,
                        face_count=0,
                        quality_score=quality_result["score"],
                        details=details,
                        warnings=warnings
                    )
                
                if face_result["count"] > 1:
                    warnings.append(f"Multiple faces detected ({face_result['count']})")
                    
                if face_result.get("face_too_small"):
                    logger.warning(f"   ❌ Face too small in image")
                    return VerificationResult(
                        status=VerificationStatus.FAILED,
                        rejection_reason=RejectionReason.FACE_TOO_SMALL,
                        face_detected=True,
                        face_count=face_result["count"],
                        quality_score=quality_result["score"],
                        details=details,
                        warnings=warnings
                    )
                
                logger.info(f"   ✅ Face detected: confidence={face_result['confidence']:.2f}")
            
            # Step 3: OCR text extraction (for clearances and permits)
            ocr_required = document_type.upper() in DOCUMENT_KEYWORDS
            extracted_text = ""
            
            if ocr_required or document_type.upper() in ["NBI", "POLICE", "CLEARANCE"]:
                ocr_result = self._extract_text(image)
                extracted_text = ocr_result.get("text", "")
                details["ocr"] = {
                    "text_length": len(extracted_text),
                    "confidence": ocr_result.get("confidence", 0)
                }
                
                if ocr_required:
                    keyword_check = self._check_required_keywords(extracted_text, document_type.upper())
                    details["keyword_check"] = keyword_check
                    
                    if not keyword_check["passed"]:
                        logger.warning(f"   ❌ Missing required text for {document_type}")
                        return VerificationResult(
                            status=VerificationStatus.FAILED,
                            rejection_reason=RejectionReason.MISSING_REQUIRED_TEXT,
                            extracted_text=extracted_text,
                            face_detected=face_result.get("detected", False),
                            face_count=face_result.get("count", 0),
                            quality_score=quality_result["score"],
                            details=details,
                            warnings=warnings
                        )
                    
                    logger.info(f"   ✅ Required keywords found for {document_type}")
            
            # Calculate overall confidence
            confidence = self._calculate_confidence(
                quality_score=quality_result["score"],
                face_confidence=face_result.get("confidence", 1.0) if face_required else 1.0,
                ocr_confidence=details.get("ocr", {}).get("confidence", 1.0) if ocr_required else 1.0
            )
            
            logger.info(f"   ✅ Verification PASSED: confidence={confidence:.2f}")
            
            return VerificationResult(
                status=VerificationStatus.PASSED,
                confidence_score=confidence,
                extracted_text=extracted_text,
                face_detected=face_result.get("detected", False),
                face_count=face_result.get("count", 0),
                quality_score=quality_result["score"],
                details=details,
                warnings=warnings
            )
            
        except Exception as e:
            logger.error(f"   ❌ Verification error: {str(e)}", exc_info=True)
            return VerificationResult(
                status=VerificationStatus.WARNING,
                confidence_score=0.0,
                details={"error": str(e)},
                warnings=[f"Verification error: {str(e)}"]
            )

    def _check_image_quality(self, image: Image.Image) -> Dict[str, Any]:
        """
        Check image quality (resolution, blur, orientation)
        
        Returns dict with:
            - status: "PASSED", "FAILED", "WARNING"
            - score: 0.0-1.0 quality score
            - reason: failure reason if failed
            - warnings: list of quality warnings
        """
        warnings = []
        width, height = image.size
        
        # Check resolution
        if width < MIN_RESOLUTION and height < MIN_RESOLUTION:
            return {
                "status": "FAILED",
                "rejection_reason": "RESOLUTION_TOO_LOW",
                "score": 0.2,
                "reason": f"Image resolution too low ({width}x{height}). Minimum: {MIN_RESOLUTION}px",
                "warnings": []
            }
        
        if width < MIN_RESOLUTION * 1.5 or height < MIN_RESOLUTION * 1.5:
            warnings.append(f"Low resolution image ({width}x{height})")
        
        # Check blur using Laplacian variance
        try:
            gray = image.convert('L')
            img_array = np.array(gray)
            laplacian_var = self._calculate_laplacian_variance(img_array)
            
            if laplacian_var < MAX_BLUR_THRESHOLD:
                return {
                    "status": "FAILED",
                    "rejection_reason": "IMAGE_TOO_BLURRY",
                    "score": 0.3,
                    "reason": f"Image is too blurry (sharpness: {laplacian_var:.1f}). Please upload a clearer image.",
                    "warnings": [],
                    "blur_score": laplacian_var
                }
            
            if laplacian_var < MAX_BLUR_THRESHOLD * 2:
                warnings.append(f"Image slightly blurry (sharpness: {laplacian_var:.1f})")
                
        except Exception as e:
            logger.warning(f"Blur detection failed: {e}")
            warnings.append("Could not analyze image sharpness")
        
        # Check orientation (landscape vs portrait for IDs)
        # Most IDs are landscape, but this is just a warning
        if height > width * 1.5:
            warnings.append("Image appears to be in portrait orientation - IDs are typically landscape")
        
        # Calculate quality score
        resolution_score = min(1.0, (width * height) / (1920 * 1080))
        blur_score = min(1.0, laplacian_var / (MAX_BLUR_THRESHOLD * 5)) if 'laplacian_var' in locals() else 0.5
        quality_score = (resolution_score * 0.4 + blur_score * 0.6)
        
        return {
            "status": "PASSED",
            "score": quality_score,
            "reason": None,
            "warnings": warnings,
            "resolution_score": resolution_score,
            "blur_score": blur_score
        }

    def _calculate_laplacian_variance(self, gray_image: np.ndarray) -> float:
        """Calculate Laplacian variance for blur detection"""
        # Simple Laplacian kernel
        kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        
        # Apply convolution manually (avoiding scipy dependency)
        from scipy.ndimage import convolve
        laplacian = convolve(gray_image.astype(np.float32), kernel)
        return float(np.var(laplacian))

    def _detect_face(self, image_data: bytes) -> Dict[str, Any]:
        """
        Detect faces in image using CompreFace
        
        Returns dict with:
            - detected: bool
            - count: number of faces
            - confidence: highest face confidence
            - face_too_small: bool if face is too small
        """
        if not self._check_compreface_available():
            logger.warning("CompreFace not available, skipping face detection")
            return {
                "detected": False,
                "count": 0,
                "confidence": 0,
                "skipped": True,
                "reason": "CompreFace service not available"
            }
        
        try:
            # Call CompreFace face detection API
            headers = {"x-api-key": self.compreface_api_key}
            files = {"file": ("image.jpg", image_data, "image/jpeg")}
            
            response = httpx.post(
                f"{self.compreface_url}/api/v1/detection/detect",
                headers=headers,
                files=files,
                params={"limit": 5, "det_prob_threshold": 0.5},
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.warning(f"CompreFace returned {response.status_code}: {response.text}")
                return {
                    "detected": False,
                    "count": 0,
                    "confidence": 0,
                    "error": f"API error: {response.status_code}"
                }
            
            result = response.json()
            faces = result.get("result", [])
            
            if not faces:
                return {
                    "detected": False,
                    "count": 0,
                    "confidence": 0
                }
            
            # Get image dimensions for size check
            image = Image.open(io.BytesIO(image_data))
            img_area = image.width * image.height
            
            # Check face size
            max_confidence = 0
            face_too_small = True
            
            for face in faces:
                box = face.get("box", {})
                face_width = box.get("x_max", 0) - box.get("x_min", 0)
                face_height = box.get("y_max", 0) - box.get("y_min", 0)
                face_area = face_width * face_height
                
                if face_area / img_area >= MIN_FACE_SIZE_RATIO:
                    face_too_small = False
                
                probability = face.get("box", {}).get("probability", 0)
                if probability > max_confidence:
                    max_confidence = probability
            
            return {
                "detected": True,
                "count": len(faces),
                "confidence": max_confidence,
                "face_too_small": face_too_small,
                "faces": [
                    {
                        "box": f.get("box", {}),
                        "probability": f.get("box", {}).get("probability", 0)
                    }
                    for f in faces
                ]
            }
            
        except httpx.TimeoutException:
            logger.error("CompreFace request timed out")
            return {
                "detected": False,
                "count": 0,
                "confidence": 0,
                "error": "Face detection timed out"
            }
        except Exception as e:
            logger.error(f"Face detection error: {e}", exc_info=True)
            return {
                "detected": False,
                "count": 0,
                "confidence": 0,
                "error": str(e)
            }

    def _extract_text(self, image: Image.Image) -> Dict[str, Any]:
        """
        Extract text from image using Tesseract OCR
        
        Returns dict with:
            - text: extracted text
            - confidence: OCR confidence (0-100)
        """
        if not TESSERACT_AVAILABLE:
            logger.warning("Tesseract not available, skipping OCR")
            return {
                "text": "",
                "confidence": 0,
                "skipped": True,
                "reason": "Tesseract not installed"
            }
        
        try:
            # Preprocess image for better OCR
            processed = self._preprocess_for_ocr(image)
            
            # Extract text with confidence data
            # Use English + Filipino
            custom_config = r'--oem 3 --psm 6 -l eng+fil'
            
            # Get detailed data including confidence
            data = pytesseract.image_to_data(processed, config=custom_config, output_type=pytesseract.Output.DICT)
            
            # Calculate average confidence of detected words
            confidences = [int(c) for c in data['conf'] if int(c) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Get plain text
            text = pytesseract.image_to_string(processed, config=custom_config)
            
            return {
                "text": text.strip(),
                "confidence": avg_confidence / 100,  # Normalize to 0-1
                "word_count": len([w for w in data['text'] if w.strip()])
            }
            
        except Exception as e:
            logger.error(f"OCR error: {e}", exc_info=True)
            return {
                "text": "",
                "confidence": 0,
                "error": str(e)
            }

    def _preprocess_for_ocr(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        gray = image.convert('L')
        
        # Resize if too small
        width, height = gray.size
        if width < 1000:
            scale = 1000 / width
            gray = gray.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)
        
        # Increase contrast using simple thresholding
        img_array = np.array(gray)
        
        # Apply adaptive threshold-like enhancement
        mean_val = np.mean(img_array)
        img_array = np.where(img_array < mean_val * 0.8, 0, img_array)
        img_array = np.where(img_array > mean_val * 1.2, 255, img_array)
        
        return Image.fromarray(img_array.astype(np.uint8))

    def _check_required_keywords(self, text: str, document_type: str) -> Dict[str, Any]:
        """
        Check if required keywords are present in extracted text
        
        Returns dict with:
            - passed: bool
            - found_keywords: list of found keywords
            - missing_groups: list of missing keyword groups
        """
        if document_type not in DOCUMENT_KEYWORDS:
            return {"passed": True, "found_keywords": [], "missing_groups": []}
        
        keyword_groups = DOCUMENT_KEYWORDS[document_type]
        text_upper = text.upper()
        
        found_keywords = []
        missing_groups = []
        
        for group in keyword_groups:
            group_found = False
            for keyword in group:
                if keyword.upper() in text_upper:
                    found_keywords.append(keyword)
                    group_found = True
                    break
            
            if not group_found:
                missing_groups.append(group)
        
        passed = len(missing_groups) == 0
        
        return {
            "passed": passed,
            "found_keywords": found_keywords,
            "missing_groups": missing_groups,
            "document_type": document_type
        }

    def _calculate_confidence(
        self, 
        quality_score: float, 
        face_confidence: float, 
        ocr_confidence: float
    ) -> float:
        """Calculate overall verification confidence score"""
        # Weighted average
        return (quality_score * 0.3 + face_confidence * 0.4 + ocr_confidence * 0.3)


# Singleton instance
_verification_service: Optional[DocumentVerificationService] = None


def get_verification_service() -> DocumentVerificationService:
    """Get or create the verification service singleton"""
    global _verification_service
    if _verification_service is None:
        _verification_service = DocumentVerificationService()
    return _verification_service


def verify_kyc_document(
    file_data: bytes,
    document_type: str,
    file_name: str = ""
) -> VerificationResult:
    """
    Convenience function to verify a KYC document
    
    Args:
        file_data: Raw file bytes
        document_type: Type of document (FRONTID, BACKID, NBI, PASSPORT, etc.)
        file_name: Original filename for logging
        
    Returns:
        VerificationResult with verification details
    """
    service = get_verification_service()
    return service.verify_document(file_data, document_type, file_name)


def should_auto_reject(result: VerificationResult) -> Tuple[bool, str]:
    """
    Determine if a document should be auto-rejected based on verification result
    
    Returns:
        Tuple of (should_reject, rejection_message)
    """
    if result.status == VerificationStatus.FAILED:
        messages = {
            RejectionReason.NO_FACE_DETECTED: "No face detected in ID document. Please upload a clear photo of your ID showing your face.",
            RejectionReason.MULTIPLE_FACES: "Multiple faces detected. Please upload an ID with only your face visible.",
            RejectionReason.FACE_TOO_SMALL: "Face in the document is too small. Please upload a clearer, closer photo of your ID.",
            RejectionReason.MISSING_REQUIRED_TEXT: "Could not verify document authenticity. Please ensure the document shows required text clearly.",
            RejectionReason.IMAGE_TOO_BLURRY: "Image is too blurry. Please upload a clearer photo.",
            RejectionReason.RESOLUTION_TOO_LOW: "Image resolution is too low. Please upload a higher quality image.",
            RejectionReason.INVALID_ORIENTATION: "Document orientation is incorrect. Please upload in landscape orientation.",
            RejectionReason.UNREADABLE_DOCUMENT: "Document is unreadable. Please upload a clearer image.",
        }
        message = messages.get(result.rejection_reason, "Document verification failed. Please try again with a clearer image.")
        return True, message
    
    return False, ""

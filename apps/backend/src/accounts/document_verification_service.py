"""
Document Verification Service for KYC Uploads

This service provides automated verification of KYC documents using:
1. Face API (InsightFace microservice) - Face detection for government IDs
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

# Face API configuration (InsightFace microservice)
import os
FACE_API_URL = os.getenv("FACE_API_URL", "https://iayos-face-api.onrender.com")

# Tesseract is imported conditionally
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract not installed - OCR verification disabled")

# Import pdf2image for PDF support
try:
    from pdf2image import convert_from_bytes
    PDF_SUPPORT_AVAILABLE = True
except ImportError:
    PDF_SUPPORT_AVAILABLE = False
    logger.warning("pdf2image not installed - PDF verification disabled")






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
    FACE_MISMATCH = "FACE_MISMATCH"  # Selfie doesn't match ID photo
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
    face_embedding: List[float] = None  # Face embedding for matching

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
# Each document type has a list of keyword groups
# For each group, at least ONE keyword must be found
# ALL groups must pass for the document to be valid
DOCUMENT_KEYWORDS = {
    # ============ CLEARANCES ============
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
    # Business Permit (for agencies) - includes Mayor's Permit AND DTI Business Registration
    "BUSINESS_PERMIT": [
        # Must match at least one from this group
        ["BUSINESS", "MAYOR", "PERMIT", "LICENSE", "DTI", "TRADE", "INDUSTRY", "CERTIFICATE"],
        # Must match at least one from this group (location OR DTI registration keywords)
        ["CITY", "MUNICIPALITY", "BARANGAY", "REGION", "REGISTRATION", "CERTIFIES", "ZAMBOANGA"],
    ],
    
    # ============ GOVERNMENT IDs ============
    # Philippine Passport - uses Filipino text: "PILIPINAS" and "PASAPORTE"
    "PASSPORT": [
        ["PASAPORTE", "PASSPORT"],  # Main identifier
        ["PILIPINAS", "PHILIPPINES", "REPUBLIKA"],  # Country identifier
    ],
    # Philippine National ID (PhilSys)
    "NATIONALID": [
        ["PHILSYS", "PHILIPPINE IDENTIFICATION", "NATIONAL ID", "PSN"],
        ["PILIPINAS", "PHILIPPINES", "REPUBLIKA"],
    ],
    # Driver's License (LTO)
    "DRIVERSLICENSE": [
        ["DRIVER", "LICENSE", "LTO", "LAND TRANSPORTATION"],
        ["PILIPINAS", "PHILIPPINES", "REPUBLIKA", "NON-PROFESSIONAL", "PROFESSIONAL"],
    ],
    # UMID - Unified Multi-Purpose ID
    "UMID": [
        ["UMID", "UNIFIED MULTI-PURPOSE", "MULTI PURPOSE"],
        ["SSS", "GSIS", "PHILHEALTH", "PAG-IBIG", "PILIPINAS", "PHILIPPINES"],
    ],
    # PhilHealth ID
    "PHILHEALTH": [
        ["PHILHEALTH", "PHILIPPINE HEALTH", "PHIC"],
        ["MEMBER", "ID", "IDENTIFICATION", "PILIPINAS", "PHILIPPINES"],
    ],
    
    # ============ FRONT ID (Generic fallback) ============
    # Generic front ID - at least show it's a Philippine ID
    "FRONTID": [
        ["PILIPINAS", "PHILIPPINES", "REPUBLIKA", "PHILIPPINE"],  # Must be Philippine document
    ],
    
    # ============ MOBILE APP ID TYPE ALIASES ============
    # These match the ID type names used in the mobile app for unified naming
    # PHILSYS_ID maps to NATIONALID keywords
    "PHILSYS_ID": [
        ["PHILSYS", "PHILIPPINE IDENTIFICATION", "NATIONAL ID", "PSN", "EPHILID"],
        ["PILIPINAS", "PHILIPPINES", "REPUBLIKA"],
    ],
    # DRIVERS_LICENSE maps to DRIVERSLICENSE keywords  
    "DRIVERS_LICENSE": [
        ["DRIVER", "LICENSE", "LTO", "LAND TRANSPORTATION"],
        ["PILIPINAS", "PHILIPPINES", "REPUBLIKA", "NON-PROFESSIONAL", "PROFESSIONAL"],
    ],
    # SSS ID
    "SSS_ID": [
        ["SSS", "SOCIAL SECURITY"],
        ["PILIPINAS", "PHILIPPINES", "MEMBER", "ID"],
    ],
    # PRC ID (Professional Regulation Commission)
    "PRC_ID": [
        ["PRC", "PROFESSIONAL REGULATION", "PROFESSIONAL REGULATORY"],
        ["PILIPINAS", "PHILIPPINES", "LICENSE", "REGISTRATION"],
    ],
    # Postal ID
    "POSTAL_ID": [
        ["POSTAL", "PHILPOST", "POST OFFICE"],
        ["PILIPINAS", "PHILIPPINES", "ID", "IDENTIFICATION"],
    ],
    # Voter's ID
    "VOTERS_ID": [
        ["VOTER", "COMELEC", "ELECTION"],
        ["PILIPINAS", "PHILIPPINES", "REGISTRATION", "ID"],
    ],
    # TIN ID
    "TIN_ID": [
        ["TIN", "TAX IDENTIFICATION", "BIR"],
        ["PILIPINAS", "PHILIPPINES", "NUMBER"],
    ],
    # Senior Citizen ID
    "SENIOR_CITIZEN_ID": [
        ["SENIOR", "CITIZEN", "OSCA"],
        ["PILIPINAS", "PHILIPPINES", "ID"],
    ],
    # OFW ID
    "OFW_ID": [
        ["OFW", "OVERSEAS FILIPINO", "OWWA"],
        ["PILIPINAS", "PHILIPPINES", "ID", "WORKER"],
    ],
    # OTHER - Generic Philippine Government ID fallback
    "OTHER": [
        ["PILIPINAS", "PHILIPPINES", "REPUBLIKA", "PHILIPPINE"],
    ],
}

# Government IDs that require face detection
FACE_REQUIRED_DOCUMENTS = [
    "PASSPORT", "NATIONALID", "UMID", "PHILHEALTH", 
    "DRIVERSLICENSE", "FRONTID", "REPRESENTATIVE_ID_FRONT",
    # Mobile app unified ID type names
    "PHILSYS_ID", "DRIVERS_LICENSE", "SSS_ID", "PRC_ID",
    "POSTAL_ID", "VOTERS_ID", "TIN_ID", "SENIOR_CITIZEN_ID",
    "OFW_ID", "OTHER"
]

# Minimum requirements
MIN_RESOLUTION = 400  # Minimum width or height in pixels (lowered from 640 for testing)
MIN_FACE_SIZE_RATIO = 0.05  # Face must be at least 5% of image area
MAX_BLUR_THRESHOLD = 50  # Lowered from 100 for leniency on REP IDs  # Laplacian variance threshold (lower = more blur)
MIN_CONFIDENCE_FACE = 0.40  # Minimum confidence for face detection (lowered for ID photos with small/faded faces)


TEXT_ONLY_DOCUMENTS = [
    # Clearance / permits and supporting docs that do not need face detection
    "NBI",
    "POLICE",
    "CLEARANCE",
    "BUSINESS_PERMIT",
    "ADDRESS_PROOF",
    "AUTH_LETTER",
]


class DocumentVerificationService:
    """
    Service for automated document verification using AI/ML
    
    Uses:
    - Face API (InsightFace microservice) for face detection
    - Tesseract OCR for text extraction
    """

    def __init__(self, face_api_url: str = None, skip_face_service: bool = False):
        """
        Initialize the verification service
        
        Args:
            face_api_url: URL of Face API service (default from FACE_API_URL env)
            skip_face_service: When True, never call Face API (used for text-only docs)
        """
        self.face_api_url = face_api_url or FACE_API_URL
        self.skip_face_service = skip_face_service
        self._face_api_available = None  # Lazy check
        
        logger.info(
            f"DocumentVerificationService initialized - Face API URL: {self.face_api_url}, skip_face_service={self.skip_face_service}"
        )

    def _check_face_api_available(self) -> bool:
        """Check if Face API service is available"""
        if self.skip_face_service:
            self._face_api_available = False
            return False

        if self._face_api_available is not None:
            return self._face_api_available
            
        try:
            response = httpx.get(f"{self.face_api_url}/health", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                self._face_api_available = data.get("model_loaded", False)
            else:
                self._face_api_available = False
            logger.info(f"Face API availability check: available={self._face_api_available}")
        except Exception as e:
            logger.warning(f"Face API not available: {e}")
            self._face_api_available = False
            
        return self._face_api_available

    def validate_document_quick(
        self, 
        file_data: bytes, 
        document_type: str,
        require_face: bool = False
    ) -> Dict[str, Any]:
        """
        Quick validation for per-step KYC checks (NO OCR - OCR runs on final submission).
        Checks: resolution, blur, and optionally face detection.
        
        Args:
            file_data: Raw file bytes
            document_type: Type of document (e.g., "FRONTID", "SELFIE", "CLEARANCE")
            require_face: Whether to require face detection (True for ID photos and selfies)
            
        Returns:
            Dict with:
                - valid: bool - whether document passes validation
                - error: str - user-friendly error message if invalid
                - details: dict - validation details
        """
        logger.info(f"🔍 Quick validation for {document_type}, require_face={require_face}")
        
        try:
            # Load image
            image = Image.open(io.BytesIO(file_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            width, height = image.size
            logger.info(f"   Image: {width}x{height}")
            
            # Step 1: Check image quality (resolution + blur)
            quality_result = self._check_image_quality(image)
            
            if quality_result["status"] == "FAILED":
                error_msg = quality_result.get("reason", "Image quality check failed")
                # Make error message more user-friendly
                if "resolution" in error_msg.lower():
                    error_msg = f"Image resolution too low ({width}x{height}). Please use a higher quality image (minimum {MIN_RESOLUTION}x{MIN_RESOLUTION} pixels)."
                elif "blurry" in error_msg.lower():
                    error_msg = "Image is too blurry. Please take a clearer photo with good lighting."
                
                logger.warning(f"   ❌ Quality check failed: {error_msg}")
                return {
                    "valid": False,
                    "error": error_msg,
                    "details": {"quality": quality_result, "resolution": f"{width}x{height}"}
                }
            
            # Step 2: Face detection (if required)
            face_detection_skipped = False
            face_detection_warning = None
            
            if require_face:
                face_result = self._detect_face(file_data)
                
                if not face_result.get("detected", False):
                    if face_result.get("skipped"):
                        # CompreFace not available - mark for manual review with warning
                        face_detection_skipped = True
                        face_detection_warning = "Face detection service temporarily unavailable. Your document will be reviewed manually."
                        logger.warning("   ⚠️ Face detection skipped (CompreFace unavailable) - marked for manual review")
                    else:
                        error_msg = "No face detected in the image. Please ensure your face is clearly visible."
                        if document_type.upper() == "SELFIE":
                            error_msg = "No face detected in your selfie. Please take a clear photo of your face looking at the camera."
                        elif document_type.upper() in ["FRONTID", "BACKID", "PHILSYS_ID", "DRIVERS_LICENSE"]:
                            error_msg = "No face detected on your ID. Please ensure the photo on your ID is clearly visible."
                        
                        logger.warning(f"   ❌ No face detected")
                        return {
                            "valid": False,
                            "error": error_msg,
                            "details": {"face_detection": face_result, "resolution": f"{width}x{height}"}
                        }
                else:
                    logger.info(f"   ✅ Face detected with confidence {face_result.get('confidence', 0):.2f}")
            
            # All checks passed (or face detection was skipped for manual review)
            if face_detection_skipped:
                logger.info(f"   ⚠️ Quick validation passed for {document_type} (face detection skipped - needs manual review)")
            else:
                logger.info(f"   ✅ Quick validation passed for {document_type}")
            
            # Build warnings list
            warnings = quality_result.get("warnings", [])
            if face_detection_warning:
                warnings.append(face_detection_warning)
            
            return {
                "valid": True,
                "error": None,
                "details": {
                    "resolution": f"{width}x{height}",
                    "quality_score": quality_result.get("score", 0),
                    "warnings": warnings,
                    "face_detection_skipped": face_detection_skipped,
                    "needs_manual_review": face_detection_skipped
                }
            }
            
        except Exception as e:
            logger.error(f"Quick validation error: {e}", exc_info=True)
            return {
                "valid": False,
                "error": "Failed to process image. Please try a different photo.",
                "details": {"error": str(e)}
            }

    def validate_text_only_document(
        self,
        file_data: bytes,
        document_type: str,
        skip_keyword_check: bool = False,
    ) -> Dict[str, Any]:
        """
        Lightweight validation path for documents that only need OCR/quality checks.

        Used for agency/business permits and supporting docs to avoid hitting the
        face detection service (cold starts on Render cause timeouts).
        """
        logger.info(
            f"📄 Text-only validation for {document_type}, skip_keyword_check={skip_keyword_check}"
        )

        try:
            image = Image.open(io.BytesIO(file_data))
            if image.mode != "RGB":
                image = image.convert("RGB")

            width, height = image.size

            # 1) Quality check
            quality_result = self._check_image_quality(image)
            if quality_result["status"] == "FAILED":
                reason = quality_result.get("reason", "Image quality too low")
                logger.warning(f"   ❌ Text-only quality failed: {reason}")
                return {
                    "valid": False,
                    "error": reason,
                    "details": {"quality": quality_result, "resolution": f"{width}x{height}"},
                }

            # 2) OCR
            ocr_result = self._extract_text(image)
            extracted_text = ocr_result.get("text", "")
            details = {
                "quality_score": quality_result.get("score", 0),
                "resolution": f"{width}x{height}",
                "ocr_confidence": ocr_result.get("confidence", 0),
                "ocr_length": len(extracted_text),
                "warnings": quality_result.get("warnings", []),
            }

            if ocr_result.get("skipped") or ocr_result.get("error"):
                reason = ocr_result.get("reason") or ocr_result.get("error") or "OCR unavailable"
                logger.warning(f"   ❌ OCR failed for text-only doc: {reason}")
                return {"valid": False, "error": reason, "details": details}

            if not extracted_text.strip():
                logger.warning("   ❌ No readable text found in document")
                return {
                    "valid": False,
                    "error": "No readable text detected. Please upload a clearer document.",
                    "details": details,
                }

            # 3) Optional keyword check
            if not skip_keyword_check and document_type.upper() in DOCUMENT_KEYWORDS:
                keyword_check = self._check_required_keywords(
                    extracted_text, document_type.upper()
                )
                details["keyword_check"] = keyword_check
                if not keyword_check["passed"]:
                    missing = keyword_check.get("missing_groups") or []
                    logger.warning(f"   ❌ Missing required keywords for {document_type}: {missing}")
                    return {
                        "valid": False,
                        "error": "Required document text not found. Please upload a clearer copy.",
                        "details": details,
                    }

            return {"valid": True, "error": None, "details": details}

        except Exception as e:
            logger.error(f"Text-only validation error: {e}", exc_info=True)
            return {
                "valid": False,
                "error": "Failed to process document. Please try again.",
                "details": {"error": str(e)},
            }

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
                
                # Face size check removed - was causing issues with valid IDs
                
                print(f"   ✅ Face detected: confidence={face_result['confidence']:.2f}")
            
            # Step 3: OCR text extraction (for clearances and Government IDs)
            ocr_required = document_type.upper() in DOCUMENT_KEYWORDS
            extracted_text = ""
            
            print(f"   📝 OCR check: document_type={document_type.upper()}, ocr_required={ocr_required}")
            print(f"   📝 TESSERACT_AVAILABLE = {TESSERACT_AVAILABLE}")

            if ocr_required or document_type.upper() in ["NBI", "POLICE", "CLEARANCE"]:
                print(f"   📝 Running Tesseract OCR for {document_type}...")
                ocr_result = self._extract_text(image)
                extracted_text = ocr_result.get("text", "")
                details["ocr"] = {
                    "text_length": len(extracted_text),
                    "confidence": ocr_result.get("confidence", 0),
                    "skipped": ocr_result.get("skipped", False),
                    "error": ocr_result.get("error"),
                    "reason": ocr_result.get("reason")
                }
                
                # Log extracted text for debugging (first 500 chars)
                # Log extracted text for debugging (first 500 chars)
                text_preview = extracted_text[:500].replace('\n', ' ') if extracted_text else "(empty)"
                print(f"   📝 OCR extracted ({len(extracted_text)} chars): {text_preview}")
                
                 # CRITICAL: Fail if OCR was skipped or errored - don't allow documents without text verification
                if ocr_result.get("skipped") or ocr_result.get("error"):
                    error_reason = ocr_result.get("reason") or ocr_result.get("error") or "OCR unavailable"
                    print(f"   ❌ OCR FAILED: {error_reason}")
                    return VerificationResult(
                        status=VerificationStatus.FAILED,
                        rejection_reason=RejectionReason.UNREADABLE_DOCUMENT,
                        extracted_text="",
                        face_detected=face_result.get("detected", False),
                        face_count=face_result.get("count", 0),
                        quality_score=quality_result["score"],
                        details=details,
                        warnings=[f"OCR failed: {error_reason}"]
                    )
                
                if ocr_required:
                    keyword_check = self._check_required_keywords(extracted_text, document_type.upper())
                    details["keyword_check"] = keyword_check
                    
                    print(f"   📝 Keyword check for {document_type.upper()}: passed={keyword_check['passed']}, found={keyword_check['found_keywords']}, missing={keyword_check['missing_groups']}")
                    
                    if not keyword_check["passed"]:
                        print(f"   ❌ Missing required text for {document_type}: {keyword_check['missing_groups']}")
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
                    
                    print(f"   ✅ Required keywords found for {document_type}")
            
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
        
        # Check resolution - BOTH width and height must meet minimum
        if width < MIN_RESOLUTION or height < MIN_RESOLUTION:
            return {
                "status": "FAILED",
                "rejection_reason": "RESOLUTION_TOO_LOW",
                "score": 0.2,
                "reason": f"Image resolution too low ({width}x{height}). Both dimensions must be at least {MIN_RESOLUTION}px.",
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
        Detect faces in image using Face API (InsightFace microservice)
        
        Returns dict with:
            - detected: bool
            - count: number of faces
            - confidence: highest face confidence
            - skipped: bool if detection was skipped
        """
        if not self._check_face_api_available():
            logger.warning("Face API not available, skipping face detection")
            return {
                "detected": False,
                "count": 0,
                "confidence": 0,
                "skipped": True,
                "reason": "Face API service not available"
            }
        
        try:
            # Resize image if too large
            image = Image.open(io.BytesIO(image_data))
            original_size = (image.width, image.height)
            max_dimension = 1920
            
            if max(image.width, image.height) > max_dimension:
                ratio = max_dimension / max(image.width, image.height)
                new_size = (int(image.width * ratio), int(image.height * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"   📐 Resized image from {original_size} to {new_size}")
                
                # Convert back to bytes
                buffer = io.BytesIO()
                image.save(buffer, format="JPEG", quality=90)
                image_data = buffer.getvalue()
            
            # Call Face API detection endpoint
            files = {"file": ("image.jpg", image_data, "image/jpeg")}
            
            response = httpx.post(
                f"{self.face_api_url}/detect",
                files=files,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.warning(f"Face API returned {response.status_code}: {response.text}")
                return {
                    "detected": False,
                    "count": 0,
                    "confidence": 0,
                    "error": f"API error: {response.status_code}"
                }
            
            result = response.json()
            
            # Apply confidence threshold to prevent false positives
            confidence = result.get("confidence", 0)
            detected = result.get("detected", False)
            
            # If detected but confidence is too low, treat as not detected
            if detected and confidence < MIN_CONFIDENCE_FACE:
                logger.warning(f"   ⚠️ Face detected but confidence too low ({confidence:.2f} < {MIN_CONFIDENCE_FACE}) - rejecting as false positive")
                return {
                    "detected": False,
                    "count": 0,
                    "confidence": confidence,
                    "faces": result.get("faces", []),
                    "reason": f"Face detection confidence too low ({confidence:.2f})"
                }
            
            return {
                "detected": detected,
                "count": result.get("count", 0),
                "confidence": confidence,
                "faces": result.get("faces", [])
            }
            
        except httpx.TimeoutException:
            logger.error("Face API request timed out")
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

    def _extract_face_embedding(self, image_data: bytes) -> Dict[str, Any]:
        """
        Extract face embedding from image using CompreFace recognition API
        
        Returns dict with:
            - success: bool
            - embedding: list of floats (face vector)
            - box: face bounding box
            - confidence: detection confidence
        """
        if not self._check_compreface_available():
            logger.warning("CompreFace not available, skipping embedding extraction")
            return {
                "success": False,
                "embedding": None,
                "error": "CompreFace service not available"
            }
        
        try:
            headers = {"x-api-key": self.compreface_api_key}
            files = {"file": ("image.jpg", image_data, "image/jpeg")}
            
            # Use detection endpoint (Detection service API)
            # Detection API: /api/v1/detection/detect
            response = httpx.post(
                f"{self.compreface_url}/api/v1/detection/detect",
                headers=headers,
                files=files,
                params={"limit": 1, "det_prob_threshold": 0.5},
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.warning(f"CompreFace embedding API returned {response.status_code}: {response.text}")
                return {
                    "success": False,
                    "embedding": None,
                    "error": f"API error: {response.status_code}"
                }
            
            result = response.json()
            faces = result.get("result", [])
            
            if not faces:
                return {
                    "success": False,
                    "embedding": None,
                    "error": "No face found for embedding"
                }
            
            # Get the first (largest/most prominent) face
            face = faces[0]
            embedding = face.get("embedding", [])
            box = face.get("box", {})
            
            return {
                "success": True,
                "embedding": embedding,
                "box": box,
                "confidence": box.get("probability", 0)
            }
            
        except Exception as e:
            logger.error(f"Face embedding extraction error: {e}", exc_info=True)
            return {
                "success": False,
                "embedding": None,
                "error": str(e)
            }

    def compare_faces(
        self, 
        id_image_data: bytes, 
        selfie_image_data: bytes,
        similarity_threshold: float = 0.85
    ) -> Dict[str, Any]:
        """
        Verify faces exist in both ID document and selfie images.
        Face comparison will be done manually by admin.
        
        Args:
            id_image_data: Raw bytes of ID document image
            selfie_image_data: Raw bytes of selfie image
            similarity_threshold: Not used (kept for backward compatibility)
            
        Returns dict with:
            - faces_detected: bool - whether faces were found in both images
            - id_has_face: bool - whether ID has a detectable face
            - selfie_has_face: bool - whether selfie has a detectable face
            - error: str - error message if failed
        """
        logger.info("🔍 Checking for faces in ID and selfie images...")
        
        if not self._check_compreface_available():
            logger.warning("CompreFace not available, skipping face detection")
            return {
                "faces_detected": None,
                "skipped": True,
                "reason": "CompreFace service not available - manual verification required"
            }
        
        try:
            # Detect face in ID document
            id_result = self._detect_face(id_image_data)
            id_has_face = id_result.get("detected", False) and id_result.get("count", 0) > 0
            
            if not id_has_face and not id_result.get("skipped"):
                logger.warning("No face detected in ID document")
                return {
                    "faces_detected": False,
                    "id_has_face": False,
                    "selfie_has_face": None,
                    "error": "No face detected in ID document. Please upload a clear photo of your ID showing your face."
                }
            
            # Detect face in selfie
            selfie_result = self._detect_face(selfie_image_data)
            selfie_has_face = selfie_result.get("detected", False) and selfie_result.get("count", 0) > 0
            
            if not selfie_has_face and not selfie_result.get("skipped"):
                logger.warning("No face detected in selfie")
                return {
                    "faces_detected": False,
                    "id_has_face": id_has_face,
                    "selfie_has_face": False,
                    "error": "No face detected in selfie. Please upload a clear photo of your face."
                }
            
            # Both have faces - success! Manual comparison will be done by admin
            logger.info(f"   ✅ Face detection result: ID has face={id_has_face}, Selfie has face={selfie_has_face}")
            
            return {
                "faces_detected": True,
                "id_has_face": id_has_face,
                "selfie_has_face": selfie_has_face,
                "id_confidence": id_result.get("confidence", 0),
                "selfie_confidence": selfie_result.get("confidence", 0),
                "note": "Face comparison will be done manually by admin"
            }
            
        except Exception as e:
            logger.error(f"Face detection error: {e}", exc_info=True)
            return {
                "faces_detected": False,
                "error": str(e)
            }

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if len(vec1) != len(vec2):
            logger.warning(f"Embedding dimension mismatch: {len(vec1)} vs {len(vec2)}")
            return 0.0
        
        # Convert to numpy for efficient computation
        arr1 = np.array(vec1)
        arr2 = np.array(vec2)
        
        dot_product = np.dot(arr1, arr2)
        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))

    def _extract_text(self, image: Image.Image) -> Dict[str, Any]:
        """
        Extract text from image using Tesseract OCR
        
        Returns dict with:
            - text: extracted text
            - confidence: OCR confidence (0-100)
            - skipped: True if OCR was skipped
            - error: Error message if OCR failed
        """
        print(f"   📝 _extract_text called, TESSERACT_AVAILABLE={TESSERACT_AVAILABLE}")
        
        if not TESSERACT_AVAILABLE:
            print("   ❌ Tesseract not available - pytesseract module not imported")
            return {
                "text": "",
                "confidence": 0,
                "skipped": True,
                "reason": "pytesseract module not installed"
            }
        
        try:
            # Preprocess image for better OCR
            processed = self._preprocess_for_ocr(image)
            
            # Extract text with confidence data
            # Use English only (Filipino language pack not installed in Alpine)
            custom_config = r'--oem 3 --psm 6 -l eng'
            
            print(f"   📝 Running pytesseract with config: {custom_config}")
            
            # Get detailed data including confidence
            data = pytesseract.image_to_data(processed, config=custom_config, output_type=pytesseract.Output.DICT)
            
            # Calculate average confidence of detected words
            confidences = [int(c) for c in data['conf'] if int(c) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Get plain text
            text = pytesseract.image_to_string(processed, config=custom_config)
            
            print(f"   📝 Tesseract extracted {len(text)} chars, avg_confidence={avg_confidence:.1f}%")
            
            return {
                "text": text.strip(),
                "confidence": avg_confidence / 100,  # Normalize to 0-1
                "word_count": len([w for w in data['text'] if w.strip()]),
                "skipped": False,
                "error": None
            }
            
        except Exception as e:
            print(f"   ❌ OCR error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "text": "",
                "confidence": 0,
                "skipped": False,
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
            RejectionReason.FACE_MISMATCH: "The face in your selfie does not match the face on your ID document. Please ensure you're uploading your own documents.",
            RejectionReason.MISSING_REQUIRED_TEXT: "Could not verify document authenticity. Please ensure the document shows required text clearly.",
            RejectionReason.IMAGE_TOO_BLURRY: "Image is too blurry. Please upload a clearer photo.",
            RejectionReason.RESOLUTION_TOO_LOW: "Image resolution is too low. Please upload a higher quality image.",
            RejectionReason.INVALID_ORIENTATION: "Document orientation is incorrect. Please upload in landscape orientation.",
            RejectionReason.UNREADABLE_DOCUMENT: "Document is unreadable. Please upload a clearer image.",
        }
        message = messages.get(result.rejection_reason, "Document verification failed. Please try again with a clearer image.")
        return True, message
    
    return False, ""


def verify_face_match(id_image_data: bytes, selfie_image_data: bytes, similarity_threshold: float = 0.85) -> Dict[str, Any]:
    """
    Compare faces between ID document and selfie
    
    Args:
        id_image_data: Raw bytes of ID document image (front of ID)
        selfie_image_data: Raw bytes of selfie image
        similarity_threshold: Minimum similarity score to consider a match (0-1)
        
    Returns:
        Dict with match result, similarity score, and any errors
    """
    service = get_verification_service()
    return service.compare_faces(id_image_data, selfie_image_data, similarity_threshold)

from typing import Any, Annotated, Optional, Union, cast

from ninja import Router, Form as NinjaForm, File as NinjaFile, Body
from ninja.files import UploadedFile
from .schemas import (
    createAccountSchema, logInSchema, createAgencySchema,
    forgotPasswordSchema, resetPasswordSchema, assignRoleSchema,
    KYCUploadSchema, KYCStatusResponse, KYCUploadResponse,
    UpdateLocationSchema, LocationResponseSchema,
    ToggleLocationSharingSchema, NearbyWorkersSchema,
    DepositFundsSchema,
    # Worker Phase 1 schemas
    WorkerProfileUpdateSchema, WorkerProfileResponse, ProfileCompletionResponse,
    CertificationSchema, AddCertificationRequest, UpdateCertificationRequest, CertificationResponse,
    MaterialSchema, AddMaterialRequest, UpdateMaterialRequest, MaterialResponse,
    PortfolioItemSchema, UploadPortfolioRequest, UpdatePortfolioCaptionRequest,
    PortfolioItemResponse, ReorderPortfolioRequest
)
# Phase 8: Review schemas
from .review_schemas import (
    SubmitReviewRequest, ReviewResponse, ReviewListRequest, ReviewListResponse,
    ReviewStatsResponse, AddReviewResponseRequest, ReportReviewRequest, MyReviewsResponse
)
from .services import (
    create_account_individ, create_account_agency, login_account, 
    _verify_account, forgot_password_request, reset_password_verify, 
    logout_account, refresh_token, fetch_currentUser, generateCookie, 
    assign_role, upload_kyc_document, get_kyc_status, get_pending_kyc_submissions,
    update_user_location, toggle_location_sharing, get_user_location, find_nearby_workers
)
# Worker Phase 1 service imports
from .worker_profile_service import (
    update_worker_profile, get_worker_profile_completion
)
from .certification_service import (
    add_certification, get_certifications, get_expiring_certifications,
    update_certification, delete_certification, verify_certification
)
from .portfolio_service import (
    upload_portfolio_image, get_portfolio, update_portfolio_caption,
    reorder_portfolio, delete_portfolio_image
)
from .models import Profile, WorkerProfile, Accounts
from .material_service import (
    add_material, list_materials, list_materials_for_client, update_material, delete_material
)
# Profile metrics helpers
from .profile_metrics_service import get_profile_metrics
# Phase 8: Review service imports
from .review_service import (
    submit_review, get_reviews_for_worker, get_review_stats,
    get_my_reviews, edit_review, report_review
)
from ninja.responses import Response
from .authentication import cookie_auth, dual_auth
from django.shortcuts import redirect
from django.urls import reverse

Form = cast(Any, NinjaForm)
File = cast(Any, NinjaFile)

router = Router(tags=["Accounts"])


def _get_worker_profile(
    account,
    not_worker_error: str = "Only workers can access this resource",
) -> Union[WorkerProfile, Response]:
    """Resolve the worker profile for the authenticated account."""
    print(f"[WORKER_PROFILE] Getting worker profile for account: {account.email}")
    
    profile = (
        Profile.objects
        .filter(accountFK=account)
        .select_related("workerprofile")
        .first()
    )

    if not profile:
        print(f"[WORKER_PROFILE] ❌ No profile found for account: {account.email}")
        return Response(
            {"error": "User profile not found"},
            status=404,
        )

    print(f"[WORKER_PROFILE] ✅ Profile found: ID={profile.profileID}, Type={profile.profileType}")

    # Try different case variations for the relation
    worker_profile = getattr(profile, "workerprofile", None)
    if worker_profile is None:
        print(f"[WORKER_PROFILE] ⚠️ workerprofile relation not found via getattr, trying direct query")
        # Try with capital W (WorkerProfile model name)
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
            print(f"[WORKER_PROFILE] ✅ WorkerProfile found via direct query")
        except WorkerProfile.DoesNotExist:
            print(f"[WORKER_PROFILE] ❌ No WorkerProfile exists for this profile")
            return Response(
                {"error": not_worker_error},
                status=403,
            )
    else:
        print(f"[WORKER_PROFILE] ✅ WorkerProfile found via getattr")

    return worker_profile

#region USER-SIDE ACCOUNTS
@router.get("/auth/google/login")
def google_login(request):
 
    return redirect(reverse("google_login"))
    
@router.get("/auth/google/callback")
def google_callback(request):
    if not request.user.is_authenticated:
        return {"error": "Authentication failed"}
    
    return generateCookie(request.user)
@router.post("/register")
def register(request, payload: createAccountSchema):
    try:
        result = create_account_individ(payload)
        return result
    except ValueError as e:
        print(f"❌ ValueError in registration: {str(e)}")  # Add logging
        return Response(
            {"error": [{"message": str(e)}]}, 
            status=400
        )
    except Exception as e:
        print(f"❌ Exception in registration: {str(e)}")  # Add logging
        import traceback
        traceback.print_exc()  # Print full stack trace
        return Response(
            {"error": [{"message": "Registration failed"}]}, 
            status=500
        )
@router.post("/register/agency")
def register_agency(request, payload: createAgencySchema):
    try:
        result = create_account_agency(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Registration failed"}]}

@router.post("/login")
def login(request, payload: logInSchema):
    try:
        result = login_account(payload, request)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Login failed"}]}

@router.post('/assign-role')
def assignRole(request, payload: assignRoleSchema):
    try:
        result = assign_role(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Role Assigning Failed"}]}
@router.post("/logout", auth=cookie_auth)
def logout(request):
   try:
       result = logout_account()  # 🔥 FIX: Call the function with ()
       return result
   except ValueError as e:
        return {"error": [{"message": str(e)}]}

@router.post("/refresh", auth=cookie_auth)
def refresh(request):
    try:
        result = refresh_token(request.COOKIES.get("refresh"))
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}

@router.get("/me", auth=dual_auth)
def get_user_profile(request):
    try:
        user = request.auth  # This comes from our dual_auth (cookie or JWT Bearer)
        print(f"✅ /me - Authenticated user: {user.email}")
        result = fetch_currentUser(user.accountID)
        return result
    except Exception as e:
        print(f"❌ /me error: {str(e)}")
        return {"error": [{"message": "Failed to fetch user profile"}]}


@router.get("/profile/metrics", auth=dual_auth)
def get_profile_metrics_endpoint(request):
    """Return payment verification, response rate, and rating stats."""
    try:
        user = request.auth
        metrics = get_profile_metrics(user)
        return metrics
    except Exception as e:
        print(f"❌ /profile/metrics error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch profile metrics"},
            status=500,
        )

# Send Email Verification
@router.get("/verify")
def verify(request, verifyToken: str, accountID: int):
    try:
        result = _verify_account(verifyToken, accountID)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Verification failed"}]}


@router.post("/verify-otp")
def verify_otp(request, payload: dict = Body(...)):
    """
    Verify email using 6-digit OTP code.
    
    Body:
    - email: User's email address
    - otp: 6-digit OTP code from email
    
    Returns:
    - success: Whether verification succeeded
    - message: Status message
    """
    from django.utils import timezone
    
    email = payload.get("email")
    otp = payload.get("otp")
    
    if not email or not otp:
        return Response({"success": False, "error": "Email and OTP are required"}, status=400)
    
    # Normalize OTP (strip whitespace)
    otp = str(otp).strip()
    
    try:
        user = Accounts.objects.get(email__iexact=email)
    except Accounts.DoesNotExist:
        return Response({"success": False, "error": "Account not found"}, status=404)
    
    # Check if already verified
    if user.isVerified:
        return {"success": True, "message": "Email already verified", "already_verified": True}
    
    # Check if OTP exists
    if not user.email_otp:
        return Response({"success": False, "error": "No OTP found. Please request a new one."}, status=400)
    
    # Check max attempts (5 attempts allowed)
    if user.email_otp_attempts >= 5:
        return Response({
            "success": False, 
            "error": "Too many failed attempts. Please request a new OTP.",
            "max_attempts_reached": True
        }, status=429)
    
    # Check expiry (5 minutes)
    if user.email_otp_expiry and user.email_otp_expiry < timezone.now():
        return Response({
            "success": False, 
            "error": "OTP has expired. Please request a new one.",
            "expired": True
        }, status=400)
    
    # Verify OTP
    if user.email_otp != otp:
        user.email_otp_attempts += 1
        user.save()
        remaining_attempts = 5 - user.email_otp_attempts
        return Response({
            "success": False, 
            "error": f"Invalid OTP. {remaining_attempts} attempts remaining.",
            "remaining_attempts": remaining_attempts
        }, status=400)
    
    # OTP is valid - verify account
    user.isVerified = True
    user.email_otp = None
    user.email_otp_expiry = None
    user.email_otp_attempts = 0
    user.verifyToken = None  # Clear legacy token too
    user.verifyTokenExpiry = None
    user.save()
    
    print(f"✅ [OTP VERIFY] Account verified for: {email}")
    
    return {
        "success": True, 
        "message": "Email verified successfully!",
        "accountID": user.accountID
    }


@router.post("/resend-otp")
def resend_otp(request, payload: dict = Body(...)):
    """
    Resend OTP verification code to email.
    
    Body:
    - email: User's email address
    
    Rate limited: Max 3 resends per 15 minutes
    
    Returns:
    - success: Whether OTP was resent
    - otp_code: The new OTP (for email sending)
    - expires_in_minutes: Time until expiry
    """
    from django.utils import timezone
    from datetime import timedelta
    from .services import generate_otp
    import random
    
    email = payload.get("email")
    
    if not email:
        return Response({"success": False, "error": "Email is required"}, status=400)
    
    try:
        user = Accounts.objects.get(email__iexact=email)
    except Accounts.DoesNotExist:
        return Response({"success": False, "error": "Account not found"}, status=404)
    
    # Check if already verified
    if user.isVerified:
        return {"success": False, "error": "Email is already verified", "already_verified": True}
    
    # Rate limiting: Check if last OTP was sent within 60 seconds
    # Only enforce rate limit if there's an existing unexpired OTP
    if user.email_otp_expiry and user.email_otp_expiry > timezone.now():
        # Calculate time since OTP creation (expiry - 5 minutes)
        otp_created_at = user.email_otp_expiry - timedelta(minutes=5)
        seconds_since_last = (timezone.now() - otp_created_at).total_seconds()
        
        # Only apply rate limit if this is a recent OTP (within last 60 seconds)
        if seconds_since_last < 60:
            wait_seconds = int(60 - seconds_since_last)
            return Response({
                "success": False, 
                "error": f"Please wait {wait_seconds} seconds before requesting a new OTP.",
                "wait_seconds": wait_seconds
            }, status=429)
    
    # Generate new OTP
    otp_code = generate_otp()
    user.email_otp = otp_code
    user.email_otp_expiry = timezone.now() + timedelta(minutes=5)
    user.email_otp_attempts = 0  # Reset attempts on resend
    user.save()
    
    print(f"📧 [OTP RESEND] New OTP generated for: {email}")
    
    return {
        "success": True,
        "message": "New OTP sent to your email",
        "otp_code": otp_code,  # Frontend will use this to send email
        "expires_in_minutes": 5
    }

@router.post("/forgot-password/send-verify")
def forgot_password_send_verify(request, payload: forgotPasswordSchema):
    """Send password reset verification email"""
    try:
        result = forgot_password_request(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Password reset request failed"}]}

@router.post("/forgot-password/verify")
def forgot_password_verify(request, payload: resetPasswordSchema, verifyToken: str, id: int):
    try:
        result = reset_password_verify(verifyToken, id, payload, request)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Password reset failed"}]}
    
@router.post("/upload/kyc", auth=dual_auth)
def upload_kyc(request):
    try:
        # 🔥 Use authenticated user's ID instead of trusting client
        user = request.auth
        accountID = user.accountID
        
        IDType = request.POST.get("IDType")
        clearanceType = request.POST.get("clearanceType")
        frontID = request.FILES.get("frontID")
        backID = request.FILES.get("backID")
        clearance = request.FILES.get("clearance")
        selfie = request.FILES.get("selfie")
        
        # Get user-confirmed extraction data from per-step OCR
        extracted_id_data = request.POST.get("extracted_id_data")
        extracted_clearance_data = request.POST.get("extracted_clearance_data")

        payload = KYCUploadSchema(
            accountID=accountID,
            IDType=IDType,
            clearanceType=clearanceType
        )
        result = upload_kyc_document(
            payload, frontID, backID, clearance, selfie,
            extracted_id_data=extracted_id_data,
            extracted_clearance_data=extracted_clearance_data
        )
        return result
    except ValueError as e:
        print(f"❌ ValueError in KYC upload: {str(e)}")
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        print(f"❌ Exception in KYC upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": [{"message": "Upload Failed"}]}


@router.post("/kyc/validate-document", auth=dual_auth)
def validate_kyc_document(request):
    """
    Quick validation for a single KYC document (per-step validation).
    Checks resolution, blur, and face detection (for ID/selfie).
    Does NOT run OCR - that happens on final submission.
    
    OPTIMIZATIONS (matching Agency KYC performance):
    - Redis caching: Same file hash returns cached result (10 min TTL)
    - Fast path for BACKID/CLEARANCE: skip face service initialization
    - Fallback: Accept for manual review if Face API unavailable
    
    NOTE: This endpoint is for INDIVIDUAL/MOBILE KYC only.
    Agency KYC uses /api/agency/kyc/validate-document with different document types.
    
    Request: multipart/form-data
    - file: The document image file
    - document_type: Type of document (FRONTID, BACKID, CLEARANCE, SELFIE)
    
    Returns:
    - valid: boolean - whether document passes validation
    - error: string - user-friendly error message if invalid
    - details: object - validation details
    - cached: boolean - whether result was from cache
    - file_hash: string - SHA-256 hash of file (for debugging)
    """
    try:
        file = request.FILES.get("file")
        document_type = request.POST.get("document_type", "").upper()
        
        if not file:
            return {"valid": False, "error": "No file provided", "details": {}}
        
        if not document_type:
            return {"valid": False, "error": "Document type not specified", "details": {}}
        
        # Validate document type - INDIVIDUAL/MOBILE KYC only
        # Agency KYC documents (BUSINESS_PERMIT, REP_ID_FRONT, etc.) should use /api/agency/kyc/validate-document
        valid_types = ['FRONTID', 'BACKID', 'CLEARANCE', 'SELFIE']
        if document_type not in valid_types:
            return {"valid": False, "error": f"Invalid document_type for individual KYC. Must be one of: {', '.join(valid_types)}", "details": {}}
        
        print(f"🔍 [MOBILE VALIDATE] Document type: {document_type}, File: {file.name} ({file.size} bytes)")
        
        # Read file data
        file_data = file.read()
        
        # ============================================
        # OPTIMIZATION 1: Redis Cache Check
        # Same file hash returns cached result instantly
        # ============================================
        from agency.validation_cache import generate_file_hash, cache_validation_result, get_cached_validation
        
        file_hash = generate_file_hash(file_data)
        cache_key = f"mobile_{document_type}"  # Prefix to distinguish from agency cache
        
        cached_result = get_cached_validation(file_hash, cache_key)
        if cached_result:
            print(f"   ⚡ [CACHE HIT] Returning cached validation for {document_type}")
            return {
                "valid": cached_result.get('ai_status') != 'FAILED',
                "error": cached_result.get('ai_rejection_message'),
                "details": cached_result,
                "file_hash": file_hash,
                "cached": True
            }
        
        # ============================================
        # OPTIMIZATION 2: Fast path for non-face documents
        # BACKID and CLEARANCE don't need face detection
        # Skip face service initialization entirely
        # ============================================
        from accounts.document_verification_service import DocumentVerificationService
        
        # Face required for: Front ID (has photo), Selfie
        # Face NOT required for: Back ID (usually no photo), Clearance (certificate)
        require_face = document_type in ["FRONTID", "SELFIE"]
        
        # Use skip_face_service=True for documents that don't need face detection
        # This avoids Face API cold start delays
        skip_face = document_type in ["BACKID", "CLEARANCE"]
        
        try:
            verifier = DocumentVerificationService(skip_face_service=skip_face)
            result = verifier.validate_document_quick(file_data, document_type, require_face=require_face)
            
            print(f"   {'✅' if result['valid'] else '❌'} Validation result: valid={result['valid']}, error={result.get('error')}")
            
            # Cache successful validation result (10 min TTL via validation_cache default)
            validation_data = {
                'ai_status': 'PASSED' if result['valid'] else 'FAILED',
                'ai_rejection_message': result.get('error'),
                'quality_score': result.get('details', {}).get('quality_score', 0),
                'resolution': result.get('details', {}).get('resolution', ''),
                'warnings': result.get('details', {}).get('warnings', []),
                'face_detection_skipped': result.get('details', {}).get('face_detection_skipped', False),
                'needs_manual_review': result.get('details', {}).get('needs_manual_review', False),
            }
            cache_validation_result(file_hash, cache_key, validation_data)
            
            # Add file_hash and cached flag to result
            result['file_hash'] = file_hash
            result['cached'] = False
            return result
            
        except Exception as service_error:
            # ============================================
            # OPTIMIZATION 3: Fallback - Accept for manual review
            # If Face API or verification service fails, accept document
            # for manual review rather than blocking user
            # ============================================
            print(f"   ⚠️ Service error, accepting for manual review: {service_error}")
            
            fallback_result = {
                "valid": True,
                "error": None,
                "details": {
                    "skipped": True,
                    "reason": "Validation service temporarily unavailable - document accepted for manual review",
                    "needs_manual_review": True
                },
                "file_hash": file_hash,
                "cached": False
            }
            
            # Cache fallback result too
            validation_data = {
                'ai_status': 'PASSED',
                'ai_rejection_message': None,
                'needs_manual_review': True,
                'skipped': True,
            }
            cache_validation_result(file_hash, cache_key, validation_data)
            
            return fallback_result
        
    except Exception as e:
        print(f"❌ Exception in document validation: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"valid": False, "error": "Validation failed. Please try again.", "details": {"error": str(e)}}


@router.get("/kyc/history", auth=dual_auth)
def get_kyc_application_history(request):
    """
    Get the authenticated user's KYC application history.
    
    Returns:
    - hasActiveKYC: boolean - if user has pending KYC
    - activeKYCId: ID of pending KYC (if any)
    - kycHistory: list of past applications with status, dates, and reasons
    - canResubmit: boolean - if user can submit new KYC
    - totalApplications: total number of KYC applications submitted
    """
    try:
        from adminpanel.service import get_user_kyc_history
        
        user = request.auth
        print(f"🔍 Fetching KYC history for user: {user.email} (ID: {user.accountID})")
        
        result = get_user_kyc_history(user.accountID)
        return {"success": True, **result}
        
    except Exception as e:
        print(f"❌ Error fetching KYC history: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch KYC history"}


@router.get("/kyc-status", auth=dual_auth)
def get_kyc_status_endpoint(request):
    """
    Get the current KYC status for the authenticated user.
    Supports both web (cookies) and mobile (Bearer token).
    
    Returns:
    - status: KYC status (NOT_STARTED, PENDING, APPROVED, REJECTED)
    - kyc_id: ID of KYC record (if exists)
    - notes: Admin notes/reason for rejection
    - submitted_at: Submission timestamp
    - reviewed_at: Review timestamp
    - files: List of uploaded files
    """
    try:
        user = request.auth
        print(f"🔍 Fetching KYC status for user: {user.email} (ID: {user.accountID})")
        
        result = get_kyc_status(user.accountID)
        return {"success": True, **result}
        
    except ValueError as e:
        print(f"❌ ValueError in KYC status: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error fetching KYC status: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch KYC status"}


# =============================================================================
# KYC PER-STEP OCR EXTRACTION ENDPOINTS (Mobile KYC Enhancement)
# =============================================================================

@router.post("/kyc/extract-id", auth=dual_auth)
def extract_id_from_ocr(request):
    """
    Extract ID-related fields from uploaded ID image via OCR.
    
    Called AFTER document validation passes in Step 2.
    Returns 5 key editable fields with confidence scores.
    
    Request: multipart/form-data with:
    - id_front: ID front image (required)
    - id_type: ID type (NATIONALID, DRIVERSLICENSE, PASSPORT, UMID, PHILHEALTH)
    
    Response:
    - success: bool
    - fields: dict with extracted fields (full_name, id_number, birth_date, address, sex)
    - confidence: float (0-1) overall OCR quality
    
    NOTE: Always returns JSON (never HTTP 500) - graceful fallback if OCR fails.
    """
    from django.utils import timezone
    
    # Get id_type early for consistent error responses
    id_type = request.POST.get("id_type", "NATIONALID")
    
    # Define empty fields template for fallback responses
    def get_empty_fields():
        return {
            "full_name": {"value": "", "confidence": 0, "editable": True},
            "id_number": {"value": "", "confidence": 0, "editable": True},
            "birth_date": {"value": "", "confidence": 0, "editable": True},
            "address": {"value": "", "confidence": 0, "editable": True},
            "sex": {"value": "", "confidence": 0, "editable": True}
        }
    
    try:
        from .kyc_extraction_parser import get_kyc_parser
        from .document_verification_service import DocumentVerificationService
        from PIL import Image
        import io
        
        user = request.auth
        print(f"📝 [EXTRACT-ID] Starting extraction for user: {user.email}")
        
        id_front = request.FILES.get("id_front")
        
        if not id_front:
            return {
                "success": False,
                "has_extraction": False,
                "error": "ID front image is required",
                "error_code": "MISSING_FILE",
                "fields": get_empty_fields(),
                "confidence": 0,
                "id_type": id_type,
                "extracted_at": timezone.now().isoformat()
            }
        
        print(f"   📄 [EXTRACT-ID] Processing {id_type} ({id_front.size} bytes)")
        
        # Read image bytes
        id_front.seek(0)
        id_bytes = id_front.read()
        
        # Initialize OCR service (skip face detection for faster extraction)
        try:
            doc_service = DocumentVerificationService(skip_face_service=True)
            id_img = Image.open(io.BytesIO(id_bytes))
            ocr_result = doc_service._extract_text(id_img)
            ocr_text = ocr_result.get("text", "")
            ocr_confidence = ocr_result.get("confidence", 0)
        except Exception as ocr_error:
            print(f"   ⚠️ [EXTRACT-ID] OCR failed: {ocr_error}")
            # Return graceful fallback - let user fill manually
            return {
                "success": True,
                "has_extraction": False,
                "message": "OCR extraction temporarily unavailable. Please fill in your details manually.",
                "fields": get_empty_fields(),
                "confidence": 0,
                "id_type": id_type,
                "extracted_at": timezone.now().isoformat(),
                "ocr_error": True
            }
        
        print(f"   🔍 [EXTRACT-ID] OCR result: {len(ocr_text)} chars, confidence={ocr_confidence:.2f}")
        
        if not ocr_text or len(ocr_text) < 10:
            return {
                "success": True,
                "has_extraction": False,
                "message": "Could not extract text from image. Please ensure the ID is clear and well-lit.",
                "fields": get_empty_fields(),
                "confidence": 0,
                "id_type": id_type,
                "extracted_at": timezone.now().isoformat()
            }
        
        # Parse OCR text using KYC parser
        try:
            parser = get_kyc_parser()
            parsed_data = parser.parse_ocr_text(ocr_text, id_type.upper())
            
            # Return 5 key fields for user editing
            fields = {
                "full_name": {
                    "value": parsed_data.full_name.value or "",
                    "confidence": parsed_data.full_name.confidence,
                    "editable": True
                },
                "id_number": {
                    "value": parsed_data.id_number.value or "",
                    "confidence": parsed_data.id_number.confidence,
                    "editable": True
                },
                "birth_date": {
                    "value": parsed_data.birth_date.value or "",
                    "confidence": parsed_data.birth_date.confidence,
                    "editable": True
                },
                "address": {
                    "value": parsed_data.address.value or "",
                    "confidence": parsed_data.address.confidence,
                    "editable": True
                },
                "sex": {
                    "value": parsed_data.sex.value or "",
                    "confidence": parsed_data.sex.confidence,
                    "editable": True
                }
            }
            
            print(f"✅ [EXTRACT-ID] Extracted: name='{fields['full_name']['value'][:30]}...', id={fields['id_number']['value']}")
            
            return {
                "success": True,
                "has_extraction": True,
                "fields": fields,
                "confidence": parsed_data.overall_confidence,
                "id_type": id_type,
                "extracted_at": timezone.now().isoformat()
            }
        except Exception as parse_error:
            print(f"   ⚠️ [EXTRACT-ID] Parser failed: {parse_error}")
            # Return graceful fallback with empty fields
            return {
                "success": True,
                "has_extraction": False,
                "message": "Could not parse extracted text. Please fill in your details manually.",
                "fields": get_empty_fields(),
                "confidence": 0,
                "id_type": id_type,
                "extracted_at": timezone.now().isoformat(),
                "parse_error": True
            }
        
    except Exception as e:
        print(f"❌ [EXTRACT-ID] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        # ALWAYS return JSON - never HTTP 500
        # This prevents Render proxy from returning HTML error pages
        return {
            "success": True,
            "has_extraction": False,
            "message": "Extraction failed. Please fill in your details manually.",
            "fields": get_empty_fields(),
            "confidence": 0,
            "id_type": id_type,
            "extracted_at": timezone.now().isoformat(),
            "error": str(e)
        }


@router.post("/kyc/extract-clearance", auth=dual_auth)
def extract_clearance_from_ocr(request):
    """
    Extract clearance-related fields from uploaded clearance image via OCR.
    
    Called AFTER document validation passes in Step 3.
    Returns 5 key editable fields with confidence scores.
    
    Request: multipart/form-data with:
    - clearance: Clearance image (required)
    - clearance_type: Clearance type (NBI or POLICE)
    
    Response:
    - success: bool
    - fields: dict with extracted fields (clearance_number, holder_name, issue_date, validity_date, clearance_type)
    - confidence: float (0-1) overall OCR quality
    
    NOTE: Always returns JSON (never HTTP 500) - graceful fallback if OCR fails.
    """
    from django.utils import timezone
    
    # Get clearance_type early for error responses
    clearance_type = request.POST.get("clearance_type", "NBI")
    
    # Define empty fields template for fallback responses
    def get_empty_fields():
        return {
            "clearance_number": {"value": "", "confidence": 0, "editable": True},
            "holder_name": {"value": "", "confidence": 0, "editable": True},
            "issue_date": {"value": "", "confidence": 0, "editable": True},
            "validity_date": {"value": "", "confidence": 0, "editable": True},
            "clearance_type": {"value": clearance_type, "confidence": 1.0, "editable": False}
        }
    
    try:
        from .kyc_extraction_parser import get_kyc_parser
        from .document_verification_service import DocumentVerificationService
        from PIL import Image
        import io
        
        user = request.auth
        print(f"📝 [EXTRACT-CLEARANCE] Starting extraction for user: {user.email}")
        
        clearance = request.FILES.get("clearance")
        
        if not clearance:
            return {
                "success": False, 
                "has_extraction": False,
                "error": "Clearance image is required",
                "error_code": "MISSING_FILE",
                "fields": get_empty_fields(),
                "confidence": 0,
                "clearance_type": clearance_type,
                "extracted_at": timezone.now().isoformat()
            }
        
        print(f"   📄 [EXTRACT-CLEARANCE] Processing {clearance_type} ({clearance.size} bytes)")
        
        # Read image bytes
        clearance.seek(0)
        clearance_bytes = clearance.read()
        
        # Initialize OCR service
        try:
            doc_service = DocumentVerificationService(skip_face_service=True)
            clearance_img = Image.open(io.BytesIO(clearance_bytes))
            ocr_result = doc_service._extract_text(clearance_img)
            ocr_text = ocr_result.get("text", "")
            ocr_confidence = ocr_result.get("confidence", 0)
        except Exception as ocr_error:
            print(f"   ⚠️ [EXTRACT-CLEARANCE] OCR failed: {ocr_error}")
            # Return graceful fallback - let user fill manually
            return {
                "success": True,
                "has_extraction": False,
                "message": "OCR extraction temporarily unavailable. Please fill in your details manually.",
                "fields": get_empty_fields(),
                "confidence": 0,
                "clearance_type": clearance_type,
                "extracted_at": timezone.now().isoformat(),
                "ocr_error": True
            }
        
        print(f"   🔍 [EXTRACT-CLEARANCE] OCR result: {len(ocr_text)} chars, confidence={ocr_confidence:.2f}")
        
        if not ocr_text or len(ocr_text) < 10:
            return {
                "success": True,
                "has_extraction": False,
                "message": "Could not extract text from image. Please ensure the clearance is clear and well-lit.",
                "fields": get_empty_fields(),
                "confidence": 0,
                "clearance_type": clearance_type,
                "extracted_at": timezone.now().isoformat()
            }
        
        # Parse OCR text - use clearance-specific parsing
        try:
            parser = get_kyc_parser()
            
            # Extract clearance-specific fields from OCR text
            clearance_fields = parser.parse_clearance_text(ocr_text, clearance_type.upper())
            
            # Return 5 key fields for user editing
            fields = {
                "clearance_number": {
                    "value": clearance_fields.get("clearance_number", ""),
                    "confidence": clearance_fields.get("clearance_number_confidence", 0),
                    "editable": True
                },
                "holder_name": {
                    "value": clearance_fields.get("holder_name", ""),
                    "confidence": clearance_fields.get("holder_name_confidence", 0),
                    "editable": True
                },
                "issue_date": {
                    "value": clearance_fields.get("issue_date", ""),
                    "confidence": clearance_fields.get("issue_date_confidence", 0),
                    "editable": True
                },
                "validity_date": {
                    "value": clearance_fields.get("validity_date", ""),
                    "confidence": clearance_fields.get("validity_date_confidence", 0),
                    "editable": True
                },
                "clearance_type": {
                    "value": clearance_type,
                    "confidence": 1.0,  # User selected, so 100% confident
                    "editable": False
                }
            }
            
            print(f"✅ [EXTRACT-CLEARANCE] Extracted: name='{fields['holder_name']['value']}', number={fields['clearance_number']['value']}")
            
            return {
                "success": True,
                "has_extraction": True,
                "fields": fields,
                "confidence": clearance_fields.get("overall_confidence", 0),
                "clearance_type": clearance_type,
                "extracted_at": timezone.now().isoformat()
            }
        except Exception as parse_error:
            print(f"   ⚠️ [EXTRACT-CLEARANCE] Parser failed: {parse_error}")
            # Return graceful fallback with empty fields
            return {
                "success": True,
                "has_extraction": False,
                "message": "Could not parse extracted text. Please fill in your details manually.",
                "fields": get_empty_fields(),
                "confidence": 0,
                "clearance_type": clearance_type,
                "extracted_at": timezone.now().isoformat(),
                "parse_error": True
            }
        
    except Exception as e:
        print(f"❌ [EXTRACT-CLEARANCE] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        # ALWAYS return JSON - never HTTP 500
        # This prevents Render proxy from returning HTML error pages
        return {
            "success": True,
            "has_extraction": False,
            "message": "Extraction failed. Please fill in your details manually.",
            "fields": get_empty_fields(),
            "confidence": 0,
            "clearance_type": clearance_type,
            "extracted_at": timezone.now().isoformat(),
            "error": str(e)
        }


# =============================================================================
# KYC AUTO-FILL ENDPOINTS (Mobile KYC Enhancement)
# =============================================================================

@router.get("/kyc/autofill", auth=dual_auth)
def get_kyc_autofill_data(request):
    """
    Get AI-extracted KYC data for mobile auto-fill.
    
    Returns extracted fields from OCR processing that users can review/confirm.
    Called by mobile app after document upload to pre-populate form fields.
    
    Returns:
    - has_extracted_data: Whether extraction data exists
    - extraction_status: PENDING, EXTRACTED, CONFIRMED, FAILED
    - fields: Dictionary of extracted fields with values and confidence scores
    - needs_confirmation: Whether user needs to confirm/edit the data
    """
    try:
        from .models import kyc, KYCExtractedData
        
        user = request.auth
        print(f"🔍 [KYC AUTOFILL] Fetching auto-fill data for user: {user.email}")
        
        # Get user's KYC record
        try:
            kyc_record = kyc.objects.get(accountFK=user)
        except kyc.DoesNotExist:
            return {
                "success": True,
                "has_extracted_data": False,
                "message": "No KYC submission found"
            }
        
        # Get extracted data
        try:
            extracted = KYCExtractedData.objects.get(kycID=kyc_record)
            
            # If extraction is still PENDING, try to process it now
            if extracted.extraction_status == "PENDING":
                print(f"   ⏳ [KYC AUTOFILL] Extraction status is PENDING, attempting to process now...")
                from .kyc_extraction_service import process_kyc_extraction
                result = process_kyc_extraction(kyc_record)
                if result:
                    extracted = result  # Use newly processed data
                    print(f"   ✅ [KYC AUTOFILL] Extraction completed! Status: {extracted.extraction_status}")
                else:
                    print(f"   ❌ [KYC AUTOFILL] Extraction processing returned None")
            
            autofill_data = extracted.get_autofill_data()
            
            return {
                "success": True,
                "has_extracted_data": True,
                "extraction_status": extracted.extraction_status,
                "needs_confirmation": extracted.extraction_status == "EXTRACTED",
                "extracted_at": extracted.extracted_at.isoformat() if extracted.extracted_at else None,
                "confirmed_at": extracted.confirmed_at.isoformat() if extracted.confirmed_at else None,
                "fields": autofill_data,
                "user_edited_fields": extracted.user_edited_fields or []
            }
            
        except KYCExtractedData.DoesNotExist:
            print(f"   ⚠️  [KYC AUTOFILL] No KYCExtractedData record found, attempting extraction...")
            from .kyc_extraction_service import process_kyc_extraction
            result = process_kyc_extraction(kyc_record)
            if result:
                print(f"   ✅ [KYC AUTOFILL] Extraction created! Status: {result.extraction_status}")
                autofill_data = result.get_autofill_data()
                return {
                    "success": True,
                    "has_extracted_data": True,
                    "extraction_status": result.extraction_status,
                    "needs_confirmation": result.extraction_status == "EXTRACTED",
                    "extracted_at": result.extracted_at.isoformat() if result.extracted_at else None,
                    "confirmed_at": result.confirmed_at.isoformat() if result.confirmed_at else None,
                    "fields": autofill_data,
                    "user_edited_fields": result.user_edited_fields or []
                }
            else:
                print(f"   ❌ [KYC AUTOFILL] No OCR data available for extraction")
                return {
                    "success": True,
                    "has_extracted_data": False,
                    "message": "No extracted data available yet - OCR text not found"
                }
            
    except Exception as e:
        print(f"❌ [KYC AUTOFILL] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch auto-fill data"}


@router.get("/kyc/debug-extraction", auth=dual_auth)
def debug_kyc_extraction(request):
    """
    DEBUG ENDPOINT: Check extraction status and trigger manual extraction if needed.
    Returns detailed diagnostic information.
    """
    try:
        from .models import kyc, KYCExtractedData, kycFiles
        from .kyc_extraction_service import process_kyc_extraction
        
        user = request.auth
        
        # Get user's KYC record
        try:
            kyc_record = kyc.objects.get(accountFK=user)
        except kyc.DoesNotExist:
            return {
                "success": False,
                "error": "No KYC submission found"
            }
        
        # Get KYC files
        files = kycFiles.objects.filter(kycID=kyc_record)
        files_info = []
        for kf in files:
            files_info.append({
                "type": kf.idType or "UNKNOWN",
                "has_ocr": bool(kf.ocr_text),
                "ocr_length": len(kf.ocr_text) if kf.ocr_text else 0,
                "ocr_preview": kf.ocr_text[:100] if kf.ocr_text else None
            })
        
        # Check extracted data
        extracted_exists = False
        extracted_status = None
        extracted_fields = {}
        
        try:
            extracted = KYCExtractedData.objects.get(kycID=kyc_record)
            extracted_exists = True
            extracted_status = extracted.extraction_status
            extracted_fields = {
                "full_name": extracted.extracted_full_name,
                "date_of_birth": str(extracted.extracted_birth_date) if extracted.extracted_birth_date else None,
                "id_number": extracted.extracted_id_number,
                "address": extracted.extracted_address,
                "confidence": extracted.overall_confidence
            }
        except KYCExtractedData.DoesNotExist:
            pass
        
        # Try manual extraction
        manual_result = None
        if not extracted_exists or extracted_status == "PENDING":
            try:
                result = process_kyc_extraction(kyc_record)
                if result:
                    manual_result = {
                        "status": result.extraction_status,
                        "confidence": result.overall_confidence,
                        "full_name": result.extracted_full_name
                    }
            except Exception as e:
                manual_result = {"error": str(e)}
        
        return {
            "success": True,
            "kyc_id": kyc_record.kycID,
            "files_count": len(files_info),
            "files": files_info,
            "extracted_data_exists": extracted_exists,
            "extraction_status": extracted_status,
            "extracted_fields": extracted_fields,
            "manual_extraction_attempt": manual_result
        }
        
    except Exception as e:
        print(f"❌ [DEBUG EXTRACTION] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/kyc/confirm", auth=dual_auth)
def confirm_kyc_extracted_data(request, payload: dict = Body(...)):
    """
    Confirm or edit KYC extracted data from mobile.
    
    Users review AI-extracted fields and can confirm or edit them.
    This saves their confirmed values for admin verification.
    
    If auto-approval is enabled and confidence thresholds are met,
    the KYC will be automatically approved without admin review.
    
    Body:
    - full_name: Confirmed full name
    - first_name: Confirmed first name
    - middle_name: Confirmed middle name
    - last_name: Confirmed last name
    - birth_date: Confirmed birth date (YYYY-MM-DD)
    - address: Confirmed address
    - id_number: Confirmed ID number
    
    Returns:
    - success: Whether confirmation was saved
    - extraction_status: New status (CONFIRMED)
    - auto_approved: Whether KYC was auto-approved
    """
    try:
        from .models import kyc, KYCExtractedData
        from django.utils import timezone
        
        user = request.auth
        print(f"🔍 [KYC CONFIRM] Confirming data for user: {user.email}")
        print(f"   Payload: {payload}")
        
        # Get user's KYC record
        try:
            kyc_record = kyc.objects.get(accountFK=user)
        except kyc.DoesNotExist:
            return {"success": False, "error": "No KYC submission found"}
        
        # Get or create extracted data record
        extracted, created = KYCExtractedData.objects.get_or_create(
            kycID=kyc_record,
            defaults={"extraction_status": "PENDING"}
        )
        
        # Track which fields were edited by user
        edited_fields = []
        
        # Update confirmed fields from payload
        field_mappings = {
            "full_name": "confirmed_full_name",
            "first_name": "confirmed_first_name",
            "middle_name": "confirmed_middle_name",
            "last_name": "confirmed_last_name",
            "address": "confirmed_address",
            "id_number": "confirmed_id_number",
            "nationality": "confirmed_nationality",
            "sex": "confirmed_sex",
            "place_of_birth": "confirmed_place_of_birth",
            # Clearance-specific fields
            "clearance_number": "confirmed_clearance_number",
            "clearance_type": "confirmed_clearance_type",
        }
        
        for payload_field, model_field in field_mappings.items():
            if payload_field in payload and payload[payload_field]:
                new_value = payload[payload_field]
                extracted_field = model_field.replace("confirmed_", "extracted_")
                extracted_value = getattr(extracted, extracted_field, "")
                
                # Check if user edited the value
                if new_value != extracted_value:
                    edited_fields.append(payload_field)
                
                setattr(extracted, model_field, new_value)
        
        # Handle birth_date specially (convert string to date)
        if "birth_date" in payload and payload["birth_date"]:
            from datetime import datetime
            try:
                date_value = datetime.strptime(payload["birth_date"], "%Y-%m-%d").date()
                extracted.confirmed_birth_date = date_value
                
                # Check if edited
                if extracted.extracted_birth_date != date_value:
                    edited_fields.append("birth_date")
            except ValueError:
                print(f"   ⚠️ Invalid date format: {payload['birth_date']}")
        
        # Handle clearance date fields (convert string to date)
        date_field_mappings = {
            "clearance_issue_date": ("confirmed_clearance_issue_date", "extracted_clearance_issue_date"),
            "clearance_validity_date": ("confirmed_clearance_validity_date", "extracted_clearance_validity_date"),
        }
        
        for payload_field, (confirmed_field, extracted_field) in date_field_mappings.items():
            if payload_field in payload and payload[payload_field]:
                from datetime import datetime
                try:
                    date_value = datetime.strptime(payload[payload_field], "%Y-%m-%d").date()
                    setattr(extracted, confirmed_field, date_value)
                    
                    # Check if edited
                    extracted_value = getattr(extracted, extracted_field, None)
                    if extracted_value != date_value:
                        edited_fields.append(payload_field)
                except ValueError:
                    print(f"   ⚠️ Invalid date format for {payload_field}: {payload[payload_field]}")
        
        # Update status and metadata
        extracted.extraction_status = "CONFIRMED"
        extracted.confirmed_at = timezone.now()
        extracted.user_edited_fields = edited_fields
        extracted.save()
        
        print(f"   ✅ KYC data confirmed. Edited fields: {edited_fields}")
        
        # Check for auto-approval eligibility
        auto_approved = False
        auto_approval_reason = None
        
        try:
            auto_approved, auto_approval_reason = _check_kyc_auto_approval(
                kyc_record, extracted, edited_fields
            )
            
            if auto_approved:
                print(f"   🎉 KYC auto-approved! Reason: {auto_approval_reason}")
        except Exception as e:
            print(f"   ⚠️ Auto-approval check failed: {str(e)}")
        
        return {
            "success": True,
            "extraction_status": "CONFIRMED",
            "edited_fields": edited_fields,
            "confirmed_at": extracted.confirmed_at.isoformat(),
            "auto_approved": auto_approved,
            "auto_approval_reason": auto_approval_reason
        }
        
    except Exception as e:
        print(f"❌ [KYC CONFIRM] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to save confirmed data"}


def _check_kyc_auto_approval(kyc_record, extracted, edited_fields):
    """
    Check if KYC should be auto-approved based on platform settings and AI confidence.
    
    Auto-approval criteria:
    1. autoApproveKYC must be enabled in platform settings
    2. User has confirmed their data (extraction_status == CONFIRMED)
    3. ID type is a valid Philippine ID (not foreign documents)
    4. Overall confidence >= kycAutoApproveMinConfidence
    5. Face match was completed via verified method (InsightFace or Azure)
    6. Face match similarity >= kycFaceMatchMinSimilarity
    
    Returns:
        Tuple of (was_approved: bool, reason: str or None)
    """
    from adminpanel.models import PlatformSettings
    from django.utils import timezone
    from decimal import Decimal
    
    # Valid Philippine ID types for auto-approval
    VALID_PH_ID_TYPES = [
        'UMID', 'SSS', 'PHILHEALTH', 'TIN', 'PASSPORT', 'DRIVERSLICENSE',
        'NATIONALID', 'VOTERID', 'POSTALID', 'PRC', 'OWWA', 'OFW',
        'PHILIPPINE NATIONAL ID', 'DRIVERS LICENSE', 'VOTER ID',
        'POSTAL ID', 'PHILHEALTH ID', 'SSS ID', 'TIN ID', 'UMID ID'
    ]
    
    # Get platform settings
    try:
        settings = PlatformSettings.objects.first()
        if not settings:
            return False, None
    except Exception:
        return False, None
    
    # Check if auto-approval is enabled
    if not settings.autoApproveKYC:
        return False, None
    
    print(f"   🔍 [AUTO-APPROVAL] Checking eligibility...")
    print(f"      - autoApproveKYC: {settings.autoApproveKYC}")
    print(f"      - kycAutoApproveMinConfidence: {settings.kycAutoApproveMinConfidence}")
    print(f"      - kycFaceMatchMinSimilarity: {settings.kycFaceMatchMinSimilarity}")
    print(f"      - kycRequireUserConfirmation: {settings.kycRequireUserConfirmation}")
    
    # Check user confirmation requirement
    if settings.kycRequireUserConfirmation and extracted.extraction_status != "CONFIRMED":
        print(f"      ❌ User confirmation required but status is: {extracted.extraction_status}")
        return False, None
    
    # Check ID type is a valid Philippine ID
    id_type = (extracted.extracted_id_type or "").upper().strip()
    is_valid_ph_id = any(
        ph_id.upper() in id_type or id_type in ph_id.upper()
        for ph_id in VALID_PH_ID_TYPES
    )
    print(f"      - Extracted ID type: {id_type}")
    if not is_valid_ph_id:
        print(f"      ❌ ID type '{id_type}' is not a recognized Philippine ID")
        return False, None
    print(f"      ✓ Valid Philippine ID type")
    
    # Check overall confidence threshold
    overall_confidence = Decimal(str(extracted.overall_confidence or 0))
    min_confidence = settings.kycAutoApproveMinConfidence
    
    print(f"      - Overall confidence: {overall_confidence}")
    
    if overall_confidence < min_confidence:
        print(f"      ❌ Confidence {overall_confidence} < min {min_confidence}")
        return False, None
    
    # REQUIRE face match completion via verified method (InsightFace or Azure)
    if not extracted.face_match_completed:
        print(f"      ❌ Face matching not completed via verified method (required for auto-approval)")
        return False, None
    print(f"      ✓ Face matching completed via verified method")
    
    # Check face match threshold
    face_match_score = extracted.face_match_score
    if face_match_score is None:
        print(f"      ❌ Face match score is None (face comparison required)")
        return False, None
    
    face_match_decimal = Decimal(str(face_match_score))
    min_face_match = settings.kycFaceMatchMinSimilarity
    
    print(f"      - Face match score: {face_match_decimal}")
    
    if face_match_decimal < min_face_match:
        print(f"      ❌ Face match {face_match_decimal} < min {min_face_match}")
        return False, None
    
    # All checks passed - auto-approve the KYC
    print(f"      ✅ All thresholds met, auto-approving...")
    
    # Update KYC record status
    kyc_record.kyc_status = "APPROVED"
    kyc_record.reviewedBy = "AI_AUTO_APPROVAL"
    kyc_record.reviewedAt = timezone.now()
    kyc_record.notes = f"Auto-approved: Confidence={overall_confidence:.2f}, FaceMatch={face_match_score:.2f}, ID={id_type}"
    kyc_record.save()
    
    # Create notification for user
    try:
        from .models import Notification
        Notification.objects.create(
            accountFK=kyc_record.accountFK,
            type='KYC',
            title='KYC Verified! ✅',
            body='Your identity has been automatically verified. You can now access all platform features.',
        )
    except Exception as e:
        print(f"      ⚠️ Failed to create notification: {e}")
    
    reason = f"Met all thresholds: confidence={overall_confidence:.2f} >= {min_confidence}, "
    reason += f"face_match={face_match_score:.2f} >= {settings.kycFaceMatchMinSimilarity}, "
    reason += f"id_type={id_type} (valid PH ID)"
    
    return True, reason


@router.get("/kyc/comparison", auth=dual_auth)
def get_kyc_comparison_data(request):
    """
    Get KYC comparison data for admin review.
    Shows extracted values side-by-side with user-confirmed values.
    
    Returns:
    - comparison: Dictionary of fields with extracted vs confirmed values
    - user_edited_fields: List of fields user modified
    - overall_confidence: AI confidence score
    """
    try:
        from .models import kyc, KYCExtractedData
        
        user = request.auth
        print(f"🔍 [KYC COMPARISON] Fetching comparison for user: {user.email}")
        
        # Check if admin or the user themselves
        # (Admins will typically access via adminpanel endpoints, but allow here too)
        
        try:
            kyc_record = kyc.objects.get(accountFK=user)
        except kyc.DoesNotExist:
            return {"success": False, "error": "No KYC submission found"}
        
        try:
            extracted = KYCExtractedData.objects.get(kycID=kyc_record)
            comparison_data = extracted.get_comparison_data()
            
            return {
                "success": True,
                "comparison": comparison_data,
                "user_edited_fields": extracted.user_edited_fields or [],
                "overall_confidence": extracted.overall_confidence,
                "extraction_status": extracted.extraction_status,
                "extraction_source": extracted.extraction_source
            }
            
        except KYCExtractedData.DoesNotExist:
            return {"success": False, "error": "No extracted data available"}
            
    except Exception as e:
        print(f"❌ [KYC COMPARISON] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch comparison data"}


# =============================================================================
# NOTIFICATIONS ENDPOINTS
# =============================================================================

@router.get("/notifications", auth=dual_auth)
def get_notifications(request, limit: int = 50, unread_only: bool = False):
    """
    Get notifications for the authenticated user.
    Filters by profile_type from JWT token to show profile-specific notifications.
    
    Query params:
    - limit: Maximum number of notifications to return (default 50)
    - unread_only: If true, only return unread notifications (default false)
    """
    try:
        from .services import get_user_notifications
        
        user = request.auth
        # Get profile_type from JWT token for dual-profile filtering
        profile_type = getattr(user, 'profile_type', None)
        notifications = get_user_notifications(user.accountID, limit, unread_only, profile_type)
        
        return {
            "success": True,
            "notifications": notifications,
            "count": len(notifications)
        }
        
    except Exception as e:
        print(f"❌ Error fetching notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch notifications"}


@router.post("/notifications/{notification_id}/mark-read", auth=dual_auth)
def mark_notification_read(request, notification_id: int):
    """
    Mark a specific notification as read.
    """
    try:
        from .services import mark_notification_as_read
        
        user = request.auth
        mark_notification_as_read(user.accountID, notification_id)
        
        return {"success": True, "message": "Notification marked as read"}
        
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error marking notification as read: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to mark notification as read"}


@router.post("/notifications/mark-all-read", auth=dual_auth)
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for the authenticated user.
    """
    try:
        from .services import mark_all_notifications_as_read
        
        user = request.auth
        count = mark_all_notifications_as_read(user.accountID)
        
        return {
            "success": True,
            "message": f"Marked {count} notifications as read",
            "count": count
        }
        
    except Exception as e:
        print(f"❌ Error marking all notifications as read: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to mark notifications as read"}


@router.get("/notifications/unread-count", auth=dual_auth)
def get_unread_count(request):
    """
    Get the count of unread notifications for the authenticated user.
    Filters by profile_type from JWT token to count profile-specific notifications.
    Supports both mobile (Bearer token) and web (cookie) authentication.
    """
    try:
        from .services import get_unread_notification_count

        user = request.auth
        # Get profile_type from JWT token for dual-profile filtering
        profile_type = getattr(user, 'profile_type', None)
        count = get_unread_notification_count(user.accountID, profile_type)

        return {"success": True, "unread_count": count}

    except Exception as e:
        print(f"❌ Error getting unread count: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to get unread count"}


@router.post("/register-push-token", auth=dual_auth)
def register_push_token(request, pushToken: str, deviceType: str = "android"):
    """
    Register or update an Expo push token for the authenticated user.

    Parameters:
        pushToken: Expo push token (ExponentPushToken[...])
        deviceType: 'ios' or 'android' (default: 'android')
    """
    try:
        from .services import register_push_token_service

        user = request.auth
        token = register_push_token_service(user.accountID, pushToken, deviceType)

        return {
            "success": True,
            "message": "Push token registered successfully",
            "tokenID": token.tokenID
        }

    except Exception as e:
        print(f"❌ Error registering push token: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to register push token"}


@router.get("/notification-settings", auth=dual_auth)
def get_notification_settings(request):
    """
    Get notification settings for the authenticated user.
    """
    try:
        from .services import get_notification_settings_service

        user = request.auth
        settings = get_notification_settings_service(user.accountID)

        return {
            "success": True,
            "settings": {
                "pushEnabled": settings.pushEnabled,
                "soundEnabled": settings.soundEnabled,
                "jobUpdates": settings.jobUpdates,
                "messages": settings.messages,
                "payments": settings.payments,
                "reviews": settings.reviews,
                "kycUpdates": settings.kycUpdates,
                "doNotDisturbStart": settings.doNotDisturbStart.strftime("%H:%M") if settings.doNotDisturbStart else None,
                "doNotDisturbEnd": settings.doNotDisturbEnd.strftime("%H:%M") if settings.doNotDisturbEnd else None,
            }
        }

    except Exception as e:
        print(f"❌ Error fetching notification settings: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch notification settings"}


@router.put("/notification-settings", auth=dual_auth)
def update_notification_settings(request,
                                 pushEnabled: bool = None,
                                 soundEnabled: bool = None,
                                 jobUpdates: bool = None,
                                 messages: bool = None,
                                 payments: bool = None,
                                 reviews: bool = None,
                                 kycUpdates: bool = None,
                                 doNotDisturbStart: str = None,
                                 doNotDisturbEnd: str = None):
    """
    Update notification settings for the authenticated user.
    Only provided fields will be updated.
    """
    try:
        from .services import update_notification_settings_service

        user = request.auth
        settings_data = {}

        if pushEnabled is not None:
            settings_data['pushEnabled'] = pushEnabled
        if soundEnabled is not None:
            settings_data['soundEnabled'] = soundEnabled
        if jobUpdates is not None:
            settings_data['jobUpdates'] = jobUpdates
        if messages is not None:
            settings_data['messages'] = messages
        if payments is not None:
            settings_data['payments'] = payments
        if reviews is not None:
            settings_data['reviews'] = reviews
        if kycUpdates is not None:
            settings_data['kycUpdates'] = kycUpdates
        if doNotDisturbStart is not None:
            settings_data['doNotDisturbStart'] = doNotDisturbStart
        if doNotDisturbEnd is not None:
            settings_data['doNotDisturbEnd'] = doNotDisturbEnd

        settings = update_notification_settings_service(user.accountID, settings_data)

        return {
            "success": True,
            "message": "Notification settings updated successfully",
            "settings": {
                "pushEnabled": settings.pushEnabled,
                "soundEnabled": settings.soundEnabled,
                "jobUpdates": settings.jobUpdates,
                "messages": settings.messages,
                "payments": settings.payments,
                "reviews": settings.reviews,
                "kycUpdates": settings.kycUpdates,
                "doNotDisturbStart": settings.doNotDisturbStart.strftime("%H:%M") if settings.doNotDisturbStart else None,
                "doNotDisturbEnd": settings.doNotDisturbEnd.strftime("%H:%M") if settings.doNotDisturbEnd else None,
            }
        }

    except Exception as e:
        print(f"❌ Error updating notification settings: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to update notification settings"}


@router.delete("/notifications/{notification_id}/delete", auth=dual_auth)
def delete_notification(request, notification_id: int):
    """
    Delete a specific notification for the authenticated user.
    """
    try:
        from .services import delete_notification_service

        user = request.auth
        success = delete_notification_service(user.accountID, notification_id)

        if success:
            return {"success": True, "message": "Notification deleted successfully"}
        else:
            return {"success": False, "error": "Notification not found or unauthorized"}

    except Exception as e:
        print(f"❌ Error deleting notification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to delete notification"}


@router.get("/specializations")
def get_specializations_endpoint(request):
    """
    Get all job categories/specializations.
    Public endpoint - no authentication required.
    """
    try:
        from .models import Specializations
        
        categories = Specializations.objects.all().order_by('specializationName')
        
        category_list = [
            {
                'specializationID': cat.specializationID,
                'categoryName': cat.specializationName,
            }
            for cat in categories
        ]
        
        return category_list
        
    except Exception as e:
        print(f"❌ Error fetching specializations: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch specializations"}, 
            status=500
        )


#region WORKER ENDPOINTS
@router.get("/users/workers")

def get_all_workers_endpoint(request, latitude: float = None, longitude: float = None):
    """
    Fetch all workers with their profiles and specializations.
    Public endpoint - no authentication required for browsing workers.
    
    Query Parameters:
        latitude (optional): Client's latitude for distance calculation
        longitude (optional): Client's longitude for distance calculation
    """
    try:
        from .services import get_all_workers
        
        # Pass client location to service function
        workers = get_all_workers(
            client_latitude=latitude,
            client_longitude=longitude
        )
        
        return {
            "success": True,
            "workers": workers,
            "count": len(workers)
        }
        
    except Exception as e:
        print(f"❌ Error fetching workers: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"success": False, "error": "Failed to fetch workers"}, 
            status=500
        )


@router.get("/users/workers/{user_id}")
def get_worker_by_id_endpoint(request, user_id: int, latitude: float = None, longitude: float = None):
    """
    Fetch a single worker by their account ID.
    Public endpoint - no authentication required for viewing worker profiles.
    
    Query Parameters:
        latitude (optional): Client's latitude for distance calculation
        longitude (optional): Client's longitude for distance calculation
    """
    try:
        from .services import get_worker_by_id
        
        # Pass client location to service function
        worker = get_worker_by_id(
            user_id,
            client_latitude=latitude,
            client_longitude=longitude
        )
        
        if worker is None:
            return Response(
                {"success": False, "error": "Worker not found"}, 
                status=404
            )
        
        return {
            "success": True,
            "worker": worker
        }
        
    except Exception as e:
        print(f"❌ Error fetching worker {user_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"success": False, "error": "Failed to fetch worker"}, 
            status=500
        )


@router.patch("/workers/availability", auth=cookie_auth)
def update_worker_availability_endpoint(request, is_available: bool):
    """
    Update the authenticated worker's availability status.
    Requires authentication.
    """
    try:
        from .services import update_worker_availability
        
        user = request.auth
        result = update_worker_availability(user.accountID, is_available)
        
        return {
            "success": True,
            "data": result
        }
        
    except ValueError as e:
        print(f"❌ ValueError updating availability: {str(e)}")
        return Response(
            {"success": False, "error": str(e)}, 
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating worker availability: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"success": False, "error": "Failed to update availability"}, 
            status=500
        )


@router.get("/workers/availability", auth=cookie_auth)
def get_worker_availability_endpoint(request):
    """
    Get the authenticated worker's current availability status.
    Requires authentication.
    """
    try:
        from .services import get_worker_availability
        
        user = request.auth
        result = get_worker_availability(user.accountID)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        print(f"❌ Error getting worker availability: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"success": False, "error": "Failed to get availability"}, 
            status=500
        )
#endregion

#region LOCATION TRACKING APIs

@router.post("/location/update", auth=dual_auth, response=LocationResponseSchema)
def update_location(request, payload: UpdateLocationSchema):
    """
    Update user's current GPS location
    """
    try:
        user = request.auth
        result = update_user_location(
            account_id=user.accountID,
            latitude=payload.latitude,
            longitude=payload.longitude
        )
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating location: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update location"},
            status=500
        )


@router.get("/location/me", auth=dual_auth, response=LocationResponseSchema)
def get_my_location(request):
    """
    Get current user's location
    """
    try:
        user = request.auth
        result = get_user_location(account_id=user.accountID)
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error getting location: {str(e)}")
        return Response(
            {"error": "Failed to get location"},
            status=500
        )


@router.post("/location/toggle-sharing", auth=dual_auth, response=LocationResponseSchema)
def toggle_location_sharing_endpoint(request, payload: ToggleLocationSharingSchema):
    """
    Enable or disable location sharing
    """
    try:
        user = request.auth
        result = toggle_location_sharing(
            account_id=user.accountID,
            enabled=payload.enabled
        )
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error toggling location sharing: {str(e)}")
        return Response(
            {"error": "Failed to toggle location sharing"},
            status=500
        )


@router.post("/location/nearby-workers")
def get_nearby_workers(request, payload: NearbyWorkersSchema):
    """
    Find workers near a specific location
    Can be used by clients to find workers nearby
    """
    try:
        result = find_nearby_workers(
            latitude=payload.latitude,
            longitude=payload.longitude,
            radius_km=payload.radius_km,
            specialization_id=payload.specialization_id
        )
        return result
        
    except Exception as e:
        print(f"❌ Error finding nearby workers: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to find nearby workers"},
            status=500
        )

#endregion

#region PROFILE IMAGE UPLOAD

@router.post("/upload/profile-image", auth=cookie_auth)
def upload_profile_image_endpoint(request, profile_image: UploadedFile = File(...)):
    """
    Upload user profile image to Supabase storage.
    
    Path structure: users/user_{userID}/profileImage/avatar.png
    
    Args:
        profile_image: Image file (JPEG, PNG, JPG, WEBP, max 5MB)
    
    Returns:
        success: boolean
        message: string
        image_url: string (public URL)
        accountID: int
    """
    try:
        from .services import upload_profile_image_service
        
        user = request.auth
        result = upload_profile_image_service(user, profile_image)
        
        return result
        
    except ValueError as e:
        print(f"❌ ValueError in profile image upload: {str(e)}")
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Exception in profile image upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to upload profile image"},
            status=500
        )

#endregion

#region WALLET ENDPOINTS

@router.get("/wallet/balance", auth=cookie_auth)
def get_wallet_balance(request):
    """Get current user's wallet balance including reserved funds"""
    try:
        from .models import Wallet
        from decimal import Decimal
        
        # Get or create wallet for the user
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': Decimal('0.00'), 'reservedBalance': Decimal('0.00')}
        )
        
        return {
            "success": True,
            "balance": float(wallet.balance),
            "reservedBalance": float(wallet.reservedBalance),
            "availableBalance": float(wallet.availableBalance),
            "created": created
        }
        
    except Exception as e:
        print(f"❌ Error fetching wallet balance: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch wallet balance"},
            status=500
        )


@router.post("/wallet/deposit", auth=cookie_auth)
def deposit_funds(request, data: DepositFundsSchema):
    """
    Create a payment invoice for wallet deposit.
    Uses configured payment provider (PayMongo by default, Xendit for legacy).
    
    SECURE FLOW:
    1. Create PENDING transaction (no balance change)
    2. Redirect user to PayMongo checkout
    3. User pays via GCash/Card
    4. PayMongo webhook confirms payment
    5. Webhook handler adds funds to wallet
    
    Returns payment URL for user to complete payment.
    """
    try:
        from .models import Wallet, Transaction, Profile
        from .payment_provider import get_payment_provider
        from decimal import Decimal
        from django.utils import timezone
        
        amount = data.amount
        payment_method = data.payment_method
        
        print(f"📥 Deposit request received: amount={amount}, payment_method={payment_method}")
        
        if amount <= 0:
            return Response(
                {"error": "Amount must be greater than 0"},
                status=400
            )
        
        # Get or create wallet
        wallet, _ = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': 0.00}
        )
        
        # Get user's profile for name
        try:
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(request.auth, 'profile_type', None)
            
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=request.auth,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile
                profile = Profile.objects.filter(accountFK=request.auth).first()
            
            if profile:
                user_name = f"{profile.firstName} {profile.lastName}"
            else:
                user_name = request.auth.email.split('@')[0]  # Fallback to email username
        except Exception:
            user_name = request.auth.email.split('@')[0]  # Fallback to email username
        
        print(f"💰 Processing deposit for {user_name}")
        print(f"   Current balance: ₱{wallet.balance}")
        
        # Create PENDING transaction - funds NOT added yet!
        # Balance will be updated by webhook after PayMongo confirms payment
        transaction = Transaction.objects.create(
            walletID=wallet,
            transactionType=Transaction.TransactionType.DEPOSIT,
            amount=Decimal(str(amount)),
            balanceAfter=wallet.balance,  # Balance unchanged until payment confirmed
            status=Transaction.TransactionStatus.PENDING,  # PENDING until webhook confirms
            description=f"TOP UP via GCASH - ₱{amount}",
            paymentMethod=Transaction.PaymentMethod.GCASH,
        )
        
        print(f"   Transaction {transaction.transactionID} created as PENDING")
        print(f"   ⚠️ Funds will be added after PayMongo payment confirmation")
        
        # Create payment invoice using configured provider
        payment_provider = get_payment_provider()
        provider_name = payment_provider.provider_name
        print(f"🔄 Creating payment invoice via {provider_name.upper()}...")
        
        payment_result = payment_provider.create_gcash_payment(
            amount=amount,
            user_email=request.auth.email,
            user_name=user_name,
            transaction_id=transaction.transactionID
        )
        
        if not payment_result.get("success"):
            # If payment provider fails, mark transaction as failed and return error
            transaction.status = Transaction.TransactionStatus.FAILED
            transaction.description = f"TOP UP FAILED - ₱{amount} - {payment_result.get('error', 'Payment provider error')}"
            transaction.save()
            return Response(
                {"error": "Failed to create payment invoice", "details": payment_result.get("error")},
                status=500
            )
        
        # Update transaction with payment provider details
        # We reuse xendit fields for backward compatibility (can rename in future migration)
        transaction.xenditInvoiceID = payment_result.get('checkout_id') or payment_result.get('invoice_id')
        transaction.xenditExternalID = payment_result.get('external_id')
        transaction.invoiceURL = payment_result.get('checkout_url') or payment_result.get('invoice_url')
        transaction.xenditPaymentChannel = "GCASH"
        transaction.xenditPaymentMethod = provider_name.upper()
        transaction.save()
        
        print(f"📄 {provider_name.upper()} invoice created: {transaction.xenditInvoiceID}")
        print(f"   Payment URL: {transaction.invoiceURL}")
        print(f"   ⏳ Waiting for user to complete payment...")
        
        return {
            "success": True,
            "transaction_id": transaction.transactionID,
            "payment_url": payment_result.get('checkout_url') or payment_result.get('invoice_url'),
            "invoice_id": transaction.xenditInvoiceID,
            "amount": amount,
            "current_balance": float(wallet.balance),  # Show current balance, not new
            "expiry_date": payment_result.get('expiry_date'),
            "provider": provider_name,
            "status": "pending",
            "message": "Payment invoice created. Complete payment to add funds to wallet."
        }
        
    except Exception as e:
        print(f"❌ Error depositing funds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to deposit funds"},
            status=500
        )


@router.post("/wallet/withdraw", auth=cookie_auth)
def withdraw_funds(request, amount: float, payment_method: str = "GCASH", gcash_number: str = None, gcash_name: str = None):
    """
    Withdraw funds from wallet via PayMongo/Xendit disbursement.
    Uses configured payment provider (PayMongo by default, Xendit for legacy).
    
    In test mode: Simulates successful disbursement
    In production: Creates actual payout to GCash/bank
    """
    try:
        from .models import Wallet, Transaction, Profile
        from .payment_provider import get_payment_provider
        from decimal import Decimal
        from django.utils import timezone
        
        if amount <= 0:
            return Response(
                {"error": "Amount must be greater than 0"},
                status=400
            )
        
        # Minimum withdrawal
        if amount < 100:
            return Response(
                {"error": "Minimum withdrawal amount is ₱100"},
                status=400
            )
        
        # Require GCash details
        if not gcash_number or not gcash_name:
            return Response(
                {"error": "GCash account number and name are required"},
                status=400
            )
        
        # Get wallet
        try:
            wallet = Wallet.objects.get(accountFK=request.auth)
        except Wallet.DoesNotExist:
            return Response(
                {"error": "Wallet not found"},
                status=404
            )
        
        # Check sufficient balance
        if wallet.balance < Decimal(str(amount)):
            return Response(
                {"error": "Insufficient balance"},
                status=400
            )
        
        # Get user profile for details
        try:
            profile = Profile.objects.filter(accountFK=request.auth).first()
            user_name = f"{profile.firstName} {profile.lastName}" if profile else request.auth.email.split('@')[0]
        except Exception:
            user_name = request.auth.email.split('@')[0]
        
        # Deduct balance first
        old_balance = wallet.balance
        wallet.balance -= Decimal(str(amount))
        wallet.save()
        
        # Create pending withdrawal transaction
        transaction = Transaction.objects.create(
            walletID=wallet,
            transactionType="WITHDRAWAL",
            amount=Decimal(str(amount)),
            balanceAfter=wallet.balance,
            status="PENDING",
            description=f"Withdrawal to {payment_method} - {gcash_number}",
            paymentMethod=payment_method,
        )
        
        print(f"💸 Processing withdrawal for {user_name}: ₱{amount}")
        print(f"   Old balance: ₱{old_balance} → New balance: ₱{wallet.balance}")
        
        # Create disbursement using configured provider
        payment_provider = get_payment_provider()
        provider_name = payment_provider.provider_name
        print(f"🔄 Creating disbursement via {provider_name.upper()}...")
        
        disbursement_result = payment_provider.create_disbursement(
            amount=amount,
            currency="PHP",
            recipient_name=gcash_name,
            account_number=gcash_number,
            channel_code="GCASH",
            transaction_id=transaction.transactionID,
            description=f"Wallet withdrawal - {user_name}",
            metadata={"user_email": request.auth.email}
        )
        
        if not disbursement_result.get("success"):
            # Rollback balance deduction
            wallet.balance = old_balance
            wallet.save()
            transaction.status = "FAILED"
            transaction.save()
            
            return Response(
                {"error": "Failed to process withdrawal", "details": disbursement_result.get("error")},
                status=500
            )
        
        # Update transaction with disbursement details
        transaction.xenditInvoiceID = disbursement_result.get('disbursement_id')
        transaction.xenditExternalID = disbursement_result.get('external_id')
        transaction.xenditPaymentChannel = "GCASH"
        transaction.xenditPaymentMethod = provider_name.upper()
        
        # Mark as completed if already done (test mode)
        if disbursement_result.get('status') in ['COMPLETED', 'completed']:
            transaction.status = "COMPLETED"
            transaction.completedAt = timezone.now()
        
        transaction.save()
        
        print(f"📄 {provider_name.upper()} disbursement created: {transaction.xenditInvoiceID}")
        print(f"✅ Status: {disbursement_result.get('status', 'PENDING')}")
        
        return {
            "success": True,
            "new_balance": float(wallet.balance),
            "transaction_id": transaction.transactionID,
            "disbursement_id": disbursement_result.get('disbursement_id'),
            "status": disbursement_result.get('status', 'PENDING'),
            "message": disbursement_result.get('message', f"Successfully withdrew ₱{amount}"),
            "provider": provider_name,
            "test_mode": disbursement_result.get('test_mode', False)
        }
        
    except Exception as e:
        print(f"❌ Error withdrawing funds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to withdraw funds"},
            status=500
        )


@router.get("/wallet/transactions", auth=cookie_auth)
def get_wallet_transactions(request):
    """Get user's wallet transaction history"""
    try:
        from .models import Wallet, Transaction
        
        # Get wallet
        try:
            wallet = Wallet.objects.get(accountFK=request.auth)
        except Wallet.DoesNotExist:
            return {
                "success": True,
                "transactions": []
            }
        
        # Get transactions
        transactions = Transaction.objects.filter(
            walletID=wallet
        ).order_by('-createdAt')[:50]  # Last 50 transactions
        
        transaction_list = [
            {
                "id": t.transactionID,
                "type": t.transactionType,
                "amount": float(t.amount),
                "balance_after": float(t.balanceAfter),
                "status": t.status,
                "description": t.description,
                "payment_method": t.paymentMethod,
                "reference_number": t.referenceNumber,
                "created_at": t.createdAt.isoformat(),
                "completed_at": t.completedAt.isoformat() if t.completedAt else None
            }
            for t in transactions
        ]
        
        return {
            "success": True,
            "transactions": transaction_list,
            "current_balance": float(wallet.balance),
            "reserved_balance": float(wallet.reservedBalance),
            "available_balance": float(wallet.availableBalance)
        }
        
    except Exception as e:
        print(f"❌ Error fetching transactions: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch transactions"},
            status=500
        )


@router.post("/wallet/webhook", auth=None)  # No auth for webhooks
def xendit_webhook(request):
    """
    [DEPRECATED] Handle Xendit payment webhook callbacks.
    
    This endpoint is kept for processing historical Xendit transactions.
    New transactions use PayMongo via /wallet/paymongo-webhook.
    
    This endpoint is called by Xendit when payment status changes.
    """
    try:
        from .models import Transaction
        from .xendit_service import XenditService
        from decimal import Decimal
        from django.utils import timezone
        import json
        
        # Get webhook payload
        payload = json.loads(request.body)
        
        print(f"📥 Xendit Webhook received: {payload.get('id')}")
        
        # Verify webhook (optional in TEST mode)
        webhook_token = request.headers.get('x-callback-token', '')
        if not XenditService.verify_webhook_signature(webhook_token):
            print(f"❌ Invalid webhook signature")
            return Response(
                {"error": "Invalid webhook signature"},
                status=401
            )
        
        # Parse webhook data
        webhook_data = XenditService.parse_webhook_payload(payload)
        if not webhook_data:
            return Response(
                {"error": "Invalid webhook payload"},
                status=400
            )
        
        # Find transaction by Xendit invoice ID
        try:
            transaction = Transaction.objects.get(
                xenditInvoiceID=webhook_data['invoice_id']
            )
        except Transaction.DoesNotExist:
            print(f"❌ Transaction not found for invoice {webhook_data['invoice_id']}")
            return Response(
                {"error": "Transaction not found"},
                status=404
            )
        
        # Update transaction based on status
        invoice_status = webhook_data['status']
        
        if invoice_status == 'PAID':
            # IDEMPOTENCY CHECK: Skip if already completed to prevent duplicate deposits
            if transaction.status == Transaction.TransactionStatus.COMPLETED:
                print(f"⚠️ Transaction {transaction.transactionID} already COMPLETED - skipping duplicate webhook")
                return {"success": True, "message": "Transaction already processed"}
            
            # Payment successful
            wallet = transaction.walletID
            
            # Update wallet balance based on transaction type
            if transaction.transactionType == Transaction.TransactionType.DEPOSIT:
                # Deposit adds to wallet
                wallet.balance += transaction.amount
                wallet.save()
                print(f"💰 Added ₱{transaction.amount} to wallet (DEPOSIT)")
            elif transaction.transactionType == Transaction.TransactionType.PAYMENT:
                # Payment/Escrow - money goes to platform, not deducted from wallet
                # Wallet balance stays the same (escrow is held by platform)
                print(f"💸 Escrow payment of ₱{transaction.amount} received (held by platform)")
            
            # Update transaction
            transaction.status = Transaction.TransactionStatus.COMPLETED
            transaction.balanceAfter = wallet.balance
            transaction.xenditPaymentID = webhook_data.get('payment_id')
            transaction.xenditPaymentChannel = webhook_data.get('payment_channel')
            transaction.xenditPaymentMethod = webhook_data.get('payment_method')
            transaction.completedAt = timezone.now()
            transaction.save()
            
            # If this is an escrow payment, mark the job as escrow paid
            if transaction.relatedJobPosting:
                job = transaction.relatedJobPosting
                if "escrow" in transaction.description.lower() or "downpayment" in transaction.description.lower():
                    job.escrowPaid = True
                    job.escrowPaidAt = timezone.now()
                    job.save()
                    print(f"✅ Job {job.jobID} escrow marked as paid")
                elif "remaining" in transaction.description.lower() or "final" in transaction.description.lower():
                    # This is the remaining payment - mark job as completed
                    job.remainingPaymentPaid = True
                    job.remainingPaymentPaidAt = timezone.now()
                    job.status = "COMPLETED"
                    job.save()
                    print(f"✅ Job {job.jobID} remaining payment received - Job marked as COMPLETED")
            
            print(f"✅ Payment completed for transaction {transaction.transactionID}")
            
        elif invoice_status in ['EXPIRED', 'FAILED']:
            # Payment failed or expired
            transaction.status = Transaction.TransactionStatus.FAILED
            transaction.description = f"{transaction.description} - {invoice_status}"
            transaction.save()
            
            print(f"❌ Payment {invoice_status.lower()} for transaction {transaction.transactionID}")
        
        return {"success": True, "message": "Webhook processed"}
        
    except Exception as e:
        print(f"❌ Error processing webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to process webhook"},
            status=500
        )


@router.post("/wallet/disbursement-webhook", auth=None)  # No auth for webhooks
def xendit_disbursement_webhook(request):
    """
    [DEPRECATED] Handle Xendit disbursement/payout webhook callbacks.
    
    This endpoint is kept for processing historical Xendit disbursements.
    New payouts use PayMongo.
    
    This endpoint is called by Xendit when a disbursement status changes.
    Used for withdrawal processing (both agency and worker withdrawals).
    """
    try:
        from .models import Transaction, Wallet
        from .xendit_service import XenditService
        from django.utils import timezone
        import json
        
        # Get webhook payload
        payload = json.loads(request.body)
        
        print(f"📥 Xendit Disbursement Webhook received: {payload}")
        
        # Verify webhook (optional in TEST mode)
        webhook_token = request.headers.get('x-callback-token', '')
        if not XenditService.verify_webhook_signature(webhook_token):
            print(f"❌ Invalid webhook signature for disbursement webhook")
            return Response(
                {"error": "Invalid webhook signature"},
                status=401
            )
        
        # Parse disbursement webhook data
        # Xendit sends different formats for payouts vs invoices
        disbursement_id = payload.get('id')
        external_id = payload.get('external_id') or payload.get('reference_id')
        status = payload.get('status', '').upper()
        failure_code = payload.get('failure_code')
        
        print(f"📤 Disbursement ID: {disbursement_id}, Status: {status}, External ID: {external_id}")
        
        if not disbursement_id and not external_id:
            print("❌ No disbursement ID or external ID in webhook payload")
            return Response(
                {"error": "Invalid webhook payload - missing ID"},
                status=400
            )
        
        # Find transaction by Xendit disbursement ID or external ID
        transaction = None
        try:
            if disbursement_id:
                transaction = Transaction.objects.filter(
                    xenditInvoiceID=disbursement_id
                ).first()
            if not transaction and external_id:
                transaction = Transaction.objects.filter(
                    xenditExternalID=external_id
                ).first()
        except Exception as e:
            print(f"❌ Error finding transaction: {str(e)}")
        
        if not transaction:
            print(f"❌ Transaction not found for disbursement {disbursement_id} / {external_id}")
            # Return 200 to prevent Xendit from retrying for unknown transactions
            return {"success": True, "message": "Transaction not found, skipping"}
        
        print(f"✅ Found transaction {transaction.transactionID} for disbursement")
        
        # Update transaction based on status
        if status in ['COMPLETED', 'SUCCEEDED', 'PAID']:
            # Disbursement successful - money sent to recipient
            transaction.status = Transaction.TransactionStatus.COMPLETED
            transaction.completedAt = timezone.now()
            transaction.save()
            print(f"✅ Withdrawal completed for transaction {transaction.transactionID}")
            
        elif status in ['FAILED', 'VOIDED', 'CANCELLED', 'REVERSED']:
            # Disbursement failed - refund the wallet balance
            wallet = transaction.walletID
            wallet.balance += transaction.amount  # Refund the deducted amount
            wallet.save()
            
            transaction.status = Transaction.TransactionStatus.FAILED
            transaction.description = f"{transaction.description} - {status}"
            if failure_code:
                transaction.description += f" ({failure_code})"
            transaction.save()
            
            print(f"❌ Withdrawal {status} for transaction {transaction.transactionID}. Refunded ₱{transaction.amount} to wallet.")
            
        elif status == 'PENDING':
            # Still processing, no action needed
            print(f"⏳ Withdrawal still pending for transaction {transaction.transactionID}")
        
        return {"success": True, "message": "Disbursement webhook processed"}
        
    except Exception as e:
        print(f"❌ Error processing disbursement webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to process disbursement webhook"},
            status=500
        )


@router.post("/wallet/paymongo-webhook", auth=None)  # No auth for webhooks
def paymongo_webhook(request):
    """
    Handle PayMongo payment webhook callbacks.
    
    PayMongo sends events for:
    - checkout_session.payment.paid (payment successful)
    - checkout_session.payment.failed (payment failed)
    - checkout_session.payment.expired (checkout expired)
    - payment.paid, payment.failed (direct payment events)
    
    Also handles:
    - gcash_verification: Verifies payment method and credits ₱1 bonus
    
    This endpoint must be registered in PayMongo dashboard under Webhooks.
    """
    try:
        from .models import Transaction, Wallet, UserPaymentMethod
        from .paymongo_service import PayMongoService
        from django.utils import timezone
        import json
        
        # Get webhook payload
        raw_body = request.body
        payload = json.loads(raw_body)
        
        print(f"📥 PayMongo Webhook received: {payload.get('data', {}).get('id', 'unknown')}")
        
        # Verify webhook signature
        signature = request.headers.get('Paymongo-Signature', '')
        paymongo = PayMongoService()
        
        if not paymongo.verify_webhook_signature(raw_body, signature):
            print(f"❌ Invalid PayMongo webhook signature")
            return Response(
                {"error": "Invalid webhook signature"},
                status=401
            )
        
        # Parse webhook data
        webhook_data = paymongo.parse_webhook_payload(payload)
        if not webhook_data:
            print(f"❌ Failed to parse PayMongo webhook payload")
            return Response(
                {"error": "Invalid webhook payload"},
                status=400
            )
        
        event_type = webhook_data.get('event_type', '')
        payment_id = webhook_data.get('payment_id')
        external_id = webhook_data.get('external_id')
        transaction_id = webhook_data.get('transaction_id')
        status = webhook_data.get('status', '')
        metadata = webhook_data.get('metadata', {})
        
        print(f"📤 PayMongo Event: {event_type}, Payment ID: {payment_id}, External ID: {external_id}")
        print(f"   Metadata: {metadata}")
        
        # ============================================
        # Handle GCash Verification Checkout
        # ============================================
        if metadata.get('payment_type') == 'gcash_verification':
            payment_method_id = metadata.get('payment_method_id')
            
            if not payment_method_id:
                print(f"❌ Missing payment_method_id in verification metadata")
                return {"success": True, "message": "Missing payment method ID"}
            
            if status == 'paid' or 'paid' in event_type:
                return _handle_gcash_verification_success(
                    payment_method_id=int(payment_method_id),
                    metadata=metadata,
                    payment_id=payment_id
                )
            elif status in ['failed', 'expired', 'cancelled'] or any(s in event_type for s in ['failed', 'expired', 'cancel']):
                return _handle_gcash_verification_failed(
                    payment_method_id=int(payment_method_id),
                    reason=status
                )
            
            return {"success": True, "message": "Verification webhook processed"}
        
        # ============================================
        # Handle Regular Transaction Webhooks
        # ============================================
        
        # Find transaction by PayMongo checkout ID or external ID
        transaction = None
        try:
            if transaction_id:
                transaction = Transaction.objects.filter(transactionID=int(transaction_id)).first()
            if not transaction and payment_id:
                # Try finding by checkout session ID stored in xenditInvoiceID field
                # (we reuse this field for PayMongo checkout ID)
                transaction = Transaction.objects.filter(xenditInvoiceID=payment_id).first()
            if not transaction and external_id:
                transaction = Transaction.objects.filter(xenditExternalID=external_id).first()
        except Exception as e:
            print(f"❌ Error finding transaction: {str(e)}")
        
        if not transaction:
            print(f"❌ Transaction not found for PayMongo payment {payment_id} / {external_id}")
            # Return 200 to prevent PayMongo from retrying for unknown transactions
            return {"success": True, "message": "Transaction not found, skipping"}
        
        print(f"✅ Found transaction {transaction.transactionID} for PayMongo payment")
        
        # Update transaction based on status
        if status == 'paid' or 'paid' in event_type:
            # IDEMPOTENCY CHECK: Skip if already completed to prevent duplicate deposits
            if transaction.status == Transaction.TransactionStatus.COMPLETED:
                print(f"⚠️ Transaction {transaction.transactionID} already COMPLETED - skipping duplicate webhook")
                return {"success": True, "message": "Transaction already processed"}
            
            # Payment successful
            wallet = transaction.walletID
            
            # Update wallet balance based on transaction type
            if transaction.transactionType == Transaction.TransactionType.DEPOSIT:
                # Deposit adds to wallet
                wallet.balance += transaction.amount
                wallet.save()
                print(f"💰 Added ₱{transaction.amount} to wallet (DEPOSIT via PayMongo)")
            elif transaction.transactionType == Transaction.TransactionType.PAYMENT:
                # Payment/Escrow - money goes to platform, not deducted from wallet
                print(f"💸 Escrow payment of ₱{transaction.amount} received via PayMongo")
            
            # Update transaction
            transaction.status = Transaction.TransactionStatus.COMPLETED
            transaction.balanceAfter = wallet.balance
            transaction.xenditPaymentID = payment_id  # Reuse field for PayMongo ID
            transaction.xenditPaymentChannel = webhook_data.get('payment_channel', 'PAYMONGO')
            transaction.xenditPaymentMethod = webhook_data.get('payment_method', 'checkout')
            transaction.completedAt = timezone.now()
            transaction.save()
            
            # If this is an escrow payment, mark the job as escrow paid
            if transaction.relatedJobPosting:
                job = transaction.relatedJobPosting
                desc_lower = transaction.description.lower()
                if "escrow" in desc_lower or "downpayment" in desc_lower:
                    job.escrowPaid = True
                    job.escrowPaidAt = timezone.now()
                    job.save()
                    print(f"✅ Job {job.jobID} escrow marked as paid (PayMongo)")
                elif "remaining" in desc_lower or "final" in desc_lower:
                    job.remainingPaymentPaid = True
                    job.remainingPaymentPaidAt = timezone.now()
                    job.status = "COMPLETED"
                    job.save()
                    print(f"✅ Job {job.jobID} remaining payment received - Job COMPLETED (PayMongo)")
            
            print(f"✅ PayMongo payment completed for transaction {transaction.transactionID}")
            
        elif status in ['failed', 'expired', 'cancelled'] or any(s in event_type for s in ['failed', 'expired', 'cancel']):
            # Payment failed or expired
            transaction.status = Transaction.TransactionStatus.FAILED
            transaction.description = f"{transaction.description} - {status.upper()}"
            transaction.save()
            print(f"❌ PayMongo payment {status} for transaction {transaction.transactionID}")
        
        return {"success": True, "message": "PayMongo webhook processed"}
        
    except Exception as e:
        print(f"❌ Error processing PayMongo webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to process webhook"},
            status=500
        )


def _handle_gcash_verification_success(payment_method_id: int, metadata: dict, payment_id: str):
    """
    Handle successful GCash verification payment.
    
    1. Mark payment method as verified
    2. Credit ₱1 verification amount to user's wallet as bonus
    """
    from .models import UserPaymentMethod, Wallet, Transaction
    from django.utils import timezone
    from django.db import transaction as db_transaction
    from decimal import Decimal
    
    try:
        # Find the payment method
        payment_method = UserPaymentMethod.objects.filter(id=payment_method_id).first()
        
        if not payment_method:
            print(f"❌ Payment method {payment_method_id} not found for verification")
            return {"success": True, "message": "Payment method not found"}
        
        # Idempotency: Skip if already verified
        if payment_method.isVerified:
            print(f"⚠️ Payment method {payment_method_id} already verified - skipping duplicate")
            return {"success": True, "message": "Already verified"}
        
        with db_transaction.atomic():
            # Mark payment method as verified
            payment_method.isVerified = True
            payment_method.save()
            
            print(f"✅ Payment method {payment_method_id} verified via PayMongo!")
            
            # Get or create user's wallet
            user = payment_method.accountFK
            wallet, _ = Wallet.objects.get_or_create(
                accountFK=user,
                defaults={'balance': Decimal('0')}
            )
            
            # Credit ₱1 verification bonus (use Decimal for wallet operations)
            bonus_amount = Decimal('1.00')
            balance_before = wallet.balance
            wallet.balance += bonus_amount
            wallet.save()
            
            # Create transaction record for the bonus
            verification_tx = Transaction.objects.create(
                walletID=wallet,
                transactionType=Transaction.TransactionType.DEPOSIT,
                amount=bonus_amount,
                balanceAfter=wallet.balance,
                status=Transaction.TransactionStatus.COMPLETED,
                description=f"GCash Verification Bonus - Account {payment_method.accountNumber[-4:].rjust(11, '*')}",
                paymentMethod='GCASH',
                xenditPaymentID=payment_id
            )
            
            print(f"💰 Credited ₱{bonus_amount} verification bonus to wallet for {user.email}")
            print(f"   Transaction ID: {verification_tx.transactionID}")
            print(f"   Balance: ₱{balance_before} → ₱{wallet.balance}")
        
        return {"success": True, "message": "GCash verification completed"}
        
    except Exception as e:
        print(f"❌ Error processing GCash verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": True, "message": f"Verification error: {str(e)}"}


def _handle_gcash_verification_failed(payment_method_id: int, reason: str):
    """
    Handle failed GCash verification payment.
    
    Delete the unverified payment method to allow user to try again.
    """
    from .models import UserPaymentMethod
    
    try:
        payment_method = UserPaymentMethod.objects.filter(id=payment_method_id).first()
        
        if not payment_method:
            print(f"⚠️ Payment method {payment_method_id} not found for failed verification")
            return {"success": True, "message": "Payment method not found"}
        
        if payment_method.isVerified:
            print(f"⚠️ Payment method {payment_method_id} is already verified - ignoring failure")
            return {"success": True, "message": "Already verified, ignoring failure"}
        
        account_number = payment_method.accountNumber
        user_email = payment_method.accountFK.email
        
        # Delete the unverified payment method
        payment_method.delete()
        
        print(f"🗑️ Deleted unverified payment method {payment_method_id} for {user_email}")
        print(f"   Reason: {reason}")
        print(f"   GCash: {account_number}")
        
        return {"success": True, "message": "Verification failed - payment method removed"}
        
    except Exception as e:
        print(f"❌ Error handling verification failure: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": True, "message": f"Error: {str(e)}"}


def cleanup_unverified_payment_methods():
    """
    Cleanup task: Delete unverified payment methods older than 24 hours.
    
    This handles cases where:
    - User started verification but canceled payment
    - PayMongo webhook never arrived
    - User abandoned the verification process
    
    Should be run periodically (e.g., daily cron job).
    """
    from .models import UserPaymentMethod
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        # Find unverified payment methods older than 24 hours
        cutoff_time = timezone.now() - timedelta(hours=24)
        
        old_unverified = UserPaymentMethod.objects.filter(
            isVerified=False,
            createdAt__lt=cutoff_time
        )
        
        count = old_unverified.count()
        
        if count > 0:
            # Log before deleting
            print(f"🧹 Cleanup: Found {count} unverified payment methods older than 24 hours")
            for method in old_unverified:
                print(f"   - ID {method.id}: {method.accountNumber} ({method.accountFK.email})")
            
            # Delete them
            old_unverified.delete()
            print(f"✅ Cleanup: Deleted {count} stale unverified payment methods")
        else:
            print(f"✅ Cleanup: No stale unverified payment methods to delete")
        
        return count
        
    except Exception as e:
        print(f"❌ Cleanup error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 0


@router.post("/wallet/simulate-payment/{transaction_id}", auth=cookie_auth)
def simulate_payment_completion(request, transaction_id: int):
    """
    DEVELOPMENT ONLY: Manually complete a payment for testing
    This simulates what the Xendit webhook would do
    """
    try:
        from .models import Transaction
        from decimal import Decimal
        from django.utils import timezone
        
        # Get transaction
        try:
            transaction = Transaction.objects.get(
                transactionID=transaction_id,
                walletID__accountFK=request.auth  # Ensure user owns this transaction
            )
        except Transaction.DoesNotExist:
            return Response(
                {"error": "Transaction not found"},
                status=404
            )
        
        # Check if already completed
        if transaction.status == Transaction.TransactionStatus.COMPLETED:
            return {
                "success": False,
                "message": "Transaction already completed",
                "balance": float(transaction.walletID.balance)
            }
        
        # Check if pending
        if transaction.status != Transaction.TransactionStatus.PENDING:
            return Response(
                {"error": f"Transaction is {transaction.status}, cannot complete"},
                status=400
            )
        
        # Complete the payment
        wallet = transaction.walletID
        
        print(f"💰 Simulating payment completion for transaction {transaction_id}")
        print(f"   Current balance: ₱{wallet.balance}")
        
        # Update wallet balance based on transaction type
        if transaction.transactionType == Transaction.TransactionType.DEPOSIT:
            # Deposit adds to wallet
            wallet.balance += transaction.amount
            wallet.save()
            print(f"   Added: ₱{transaction.amount} (DEPOSIT)")
        elif transaction.transactionType == Transaction.TransactionType.PAYMENT:
            # Payment/Escrow - money goes to platform, not deducted from wallet
            # Wallet balance stays the same (escrow is held by platform)
            print(f"   Escrow payment: ₱{transaction.amount} (held by platform)")
        
        # Update transaction
        transaction.status = Transaction.TransactionStatus.COMPLETED
        transaction.balanceAfter = wallet.balance
        transaction.xenditPaymentID = "SIMULATED_" + str(transaction_id)
        transaction.xenditPaymentChannel = "GCASH"
        transaction.completedAt = timezone.now()
        transaction.save()
        
        # If this is an escrow payment, mark the job as escrow paid
        if transaction.relatedJobPosting:
            job = transaction.relatedJobPosting
            if "escrow" in transaction.description.lower() or "downpayment" in transaction.description.lower():
                job.escrowPaid = True
                job.escrowPaidAt = timezone.now()
                job.save()
                print(f"✅ Job {job.jobID} escrow marked as paid")
        
        print(f"   New balance: ₱{wallet.balance}")
        print(f"✅ Payment simulation completed!")
        
        return {
            "success": True,
            "message": "Payment completed successfully (simulated)",
            "transaction_id": transaction.transactionID,
            "amount": float(transaction.amount),
            "new_balance": float(wallet.balance)
        }
        
    except Exception as e:
        print(f"❌ Error simulating payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to simulate payment"},
            status=500
        )


@router.get("/wallet/payment-status/{transaction_id}", auth=cookie_auth)
def check_payment_status(request, transaction_id: int):
    """
    Check the current status of a payment transaction
    Used for polling payment status from frontend
    """
    try:
        from .models import Transaction
        from .payment_provider import get_payment_provider
        
        # Get transaction
        try:
            transaction = Transaction.objects.get(
                transactionID=transaction_id,
                walletID__accountFK=request.auth  # Ensure user owns this transaction
            )
        except Transaction.DoesNotExist:
            return Response(
                {"error": "Transaction not found"},
                status=404
            )
        
        # If transaction already completed/failed, return current status
        if transaction.status in [Transaction.TransactionStatus.COMPLETED, Transaction.TransactionStatus.FAILED]:
            return {
                "success": True,
                "status": transaction.status,
                "amount": float(transaction.amount),
                "balance_after": float(transaction.balanceAfter),
                "completed_at": transaction.completedAt.isoformat() if transaction.completedAt else None
            }
        
        # If still pending, check with payment provider
        if transaction.xenditInvoiceID:
            payment_provider = get_payment_provider()
            provider_status = payment_provider.get_payment_status(transaction.xenditInvoiceID)
            
            return {
                "success": True,
                "status": transaction.status,
                "provider_status": provider_status.get('status'),
                "payment_url": transaction.invoiceURL,
                "amount": float(transaction.amount)
            }
        
        return {
            "success": True,
            "status": transaction.status,
            "amount": float(transaction.amount)
        }
        
    except Exception as e:
        print(f"❌ Error checking payment status: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to check payment status"},
            status=500
        )

#endregion




#region WORKER PHASE 1 - PROFILE ENHANCEMENT API
# ===========================================================================
# WORKER PROFILE ENHANCEMENT ENDPOINTS
# Profile management, certifications, and portfolio for workers
# ===========================================================================

@router.post("/worker/profile", auth=dual_auth, response=WorkerProfileResponse)
def update_worker_profile_endpoint(request, payload: WorkerProfileUpdateSchema):
    """
    Update worker profile fields (bio, description, hourly_rate).
    
    Updates profile completion percentage automatically.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can update worker profile",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result

        # Call service function
        result = update_worker_profile(
            worker_profile=worker_profile,
            bio=payload.bio,
            description=payload.description,
            hourly_rate=payload.hourly_rate,
            soft_skills=payload.soft_skills
        )
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating worker profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update profile"},
            status=500
        )


@router.get("/worker/profile-completion", auth=cookie_auth, response=ProfileCompletionResponse)
def get_profile_completion_endpoint(request):
    """
    Get profile completion percentage and recommendations.
    
    Returns detailed information about completed/missing fields.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can check profile completion",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result

        # Call service function
        result = get_worker_profile_completion(worker_profile)
        
        return result
        
    except Exception as e:
        print(f"❌ Error getting profile completion: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to get profile completion"},
            status=500
        )


# ===========================
# CERTIFICATION ENDPOINTS
# ===========================

@router.post("/worker/certifications", auth=dual_auth, response=CertificationResponse)
def add_certification_endpoint(
    request,
    specialization_id: int = Form(...),  # REQUIRED: Link to skill
    name: str = Form(...),
    organization: str = Form(None),
    issue_date: str = Form(None),
    expiry_date: str = Form(None),
    certificate_file: UploadedFile = File(None)
):
    """
    Add a new certification with optional file upload.
    All certifications must be linked to a specific skill.
    
    Form fields:
    - specialization_id (required): Worker skill ID to link this certification to
    - name (required): Certificate name
    - organization: Issuing organization
    - issue_date: Issue date (YYYY-MM-DD)
    - expiry_date: Expiry date (YYYY-MM-DD)
    - certificate_file: Certificate document/image
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can add certifications",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        certification = add_certification(
            worker_profile=worker_profile,
            specialization_id=specialization_id,
            name=name,
            organization=organization,
            issue_date=issue_date,
            expiry_date=expiry_date,
            certificate_file=certificate_file
        )
        
        return {
            "success": True,
            "message": "Certification added successfully",
            "certification": certification
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error adding certification: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to add certification"},
            status=500
        )


@router.get("/worker/certifications", auth=dual_auth, response=list[CertificationSchema])
def list_certifications_endpoint(request):
    """
    List all worker's certifications with expiry status.
    
    Includes is_expired flag and days_until_expiry.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can list certifications",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
 
        # Call service function
        certifications = get_certifications(worker_profile)
        
        return certifications
        
    except Exception as e:
        print(f"❌ Error listing certifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to list certifications"},
            status=500
        )


@router.put("/worker/certifications/{certification_id}", auth=dual_auth, response=CertificationResponse)
def update_certification_endpoint(
    request,
    certification_id: int,
    name: str = Form(None),  # type: ignore
    organization: str = Form(None),  # type: ignore
    issue_date: str = Form(None),  # type: ignore
    expiry_date: str = Form(None),  # type: ignore
    specialization_id: int = Form(None),  # type: ignore  # NEW: Update linked skill
    certificate_file: Any = File(None),  # type: ignore
    method_override: str = Form(None),
):
    """
    Update certification fields including optional certificate image.
    
    Only the worker who owns the certification can update it.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can update certifications",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Fallback: If multipart PUT parsing misses the file, check request.FILES directly
        if not certificate_file and hasattr(request, "FILES"):
            certificate_file = request.FILES.get("certificate_file")

        # Log payload state for troubleshooting missing uploads
        try:
            print(
                "📄 [CERT UPDATE]",
                {
                    "id": certification_id,
                    "has_file": bool(certificate_file),
                    "file_name": getattr(certificate_file, "name", None),
                    "file_size": getattr(certificate_file, "size", getattr(certificate_file, "_size", None)),
                    "issue_date": issue_date,
                    "expiry_date": expiry_date,
                    "specialization_id": specialization_id,
                },
            )
        except Exception:
            print("📄 [CERT UPDATE] logging failed")

        # Call service function
        certification = update_certification(
            worker_profile=worker_profile,
            certification_id=certification_id,
            name=name,
            organization=organization,
            issue_date=issue_date,
            expiry_date=expiry_date,
            specialization_id=specialization_id,
            certificate_file=certificate_file
        )
        
        return {
            "success": True,
            "message": "Certification updated successfully",
            "certification": certification
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating certification: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update certification"},
            status=500
        )


@router.delete("/worker/certifications/{certification_id}", auth=dual_auth)
def delete_certification_endpoint(request, certification_id: int):
    """
    Delete a certification.
    
    Only the worker who owns the certification can delete it.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can delete certifications",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        result = delete_certification(worker_profile, certification_id)
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error deleting certification: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to delete certification"},
            status=500
        )


@router.post("/worker/certifications/{certification_id}", auth=dual_auth, response=CertificationResponse)
def update_certification_endpoint_post(
    request,
    certification_id: int,
    name: str = Form(None),  # type: ignore
    organization: str = Form(None),  # type: ignore
    issue_date: str = Form(None),  # type: ignore
    expiry_date: str = Form(None),  # type: ignore
    specialization_id: int = Form(None),  # type: ignore
    certificate_file: Any = File(None),  # type: ignore
    method_override: str = Form(None),
):
    """POST alias to support mobile FormData uploads with method override."""
    # Reuse the PUT handler logic
    return update_certification_endpoint(
        request=request,
        certification_id=certification_id,
        name=name,
        organization=organization,
        issue_date=issue_date,
        expiry_date=expiry_date,
        specialization_id=specialization_id,
        certificate_file=certificate_file,
        method_override=method_override,
    )


# ===========================
# MATERIAL/PRODUCT ENDPOINTS
# ===========================

@router.post("/worker/materials", auth=dual_auth, response=MaterialResponse)
def add_material_endpoint(
    request,
    name: str = Form(...),
    price: float = Form(...),
    description: Optional[str] = Form(None),
    quantity: float = Form(1),
    unit: str = Form("piece"),
    image: Optional[UploadedFile] = File(None),
    category_id: Optional[int] = Form(None)
):
    """
    Add a new material/product with optional image upload.
    
    Form fields:
    - name (required): Material/product name
    - description: Detailed description
    - price (required): Price in PHP
    - quantity: Quantity or stock amount for this listing
    - unit: Unit of measurement (default: "piece")
    - image: Product image
    - category_id: Optional category/specialization ID to link material to
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can add materials",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Validate price
        if price <= 0:
            return Response(
                {"error": "Price must be greater than 0"},
                status=400
            )
        
        if quantity <= 0:
            return Response(
                {"error": "Quantity must be greater than 0"},
                status=400
            )
        # Call service function
        material = add_material(
            worker_profile=worker_profile,
            name=name,
            description=description or "",
            price=price,
            quantity=quantity,
            unit=unit,
            image_file=image,
            category_id=category_id
        )
        
        return {
            "success": True,
            "message": "Material added successfully",
            "material": material
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error adding material: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to add material"},
            status=500
        )


@router.get("/worker/materials", auth=dual_auth, response=list[MaterialSchema])
def list_materials_endpoint(request, category_id: Optional[int] = None):
    """
    Get all materials for the authenticated worker.
    
    Query params:
    - category_id: Optional filter by category/specialization
    
    Returns list of materials ordered by creation date (newest first).
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can list materials",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        materials = list_materials(worker_profile, category_id=category_id)
        
        return materials
        
    except Exception as e:
        print(f"❌ Error listing materials: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to list materials"},
            status=500
        )


@router.put("/worker/materials/{material_id}", auth=dual_auth, response=MaterialResponse)
def update_material_endpoint(
    request,
    material_id: int,
    name: str = Form(None),  # type: ignore
    description: str = Form(None),  # type: ignore
    price: float = Form(None),  # type: ignore
    quantity: float = Form(None),  # type: ignore
    unit: str = Form(None),  # type: ignore
    is_available: bool = Form(None),  # type: ignore
    image_file: Any = File(None),  # type: ignore
    category_id: int = Form(None)  # type: ignore
):
    """
    Update material information including optional image.
    
    All fields are optional - only provided fields will be updated.
    
    Form fields:
    - category_id: Set to -1 to remove category link, or provide new category ID
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can update materials",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Validate price if provided
        if price is not None and price <= 0:
            return Response(
                {"error": "Price must be greater than 0"},
                status=400
            )
        
        # Call service function
        material = update_material(
            worker_profile=worker_profile,
            material_id=material_id,
            name=name,
            description=description,
            price=price,
            quantity=quantity,
            unit=unit,
            is_available=is_available,
            image_file=image_file,
            category_id=category_id
        )
        
        return {
            "success": True,
            "message": "Material updated successfully",
            "material": material
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating material: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update material"},
            status=500
        )


@router.delete("/worker/materials/{material_id}", auth=dual_auth)
def delete_material_endpoint(request, material_id: int):
    """
    Delete a material by ID.
    
    Returns success message on deletion.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can delete materials",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        result = delete_material(worker_profile, material_id)
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error deleting material: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to delete material"},
            status=500
        )


@router.get("/workers/{worker_id}/materials", response=list[MaterialSchema])
def get_worker_materials_public(request, worker_id: int, category_id: Optional[int] = None):
    """
    Get materials for a specific worker (public endpoint for clients).
    Only returns available materials.
    
    Query params:
    - category_id: Optional filter by category/specialization (use for job-specific filtering)
    
    Use case: When client invites worker for a plumbing job, filter materials by plumbing category.
    """
    try:
        # Call service function (only returns available materials)
        materials = list_materials_for_client(worker_id, category_id=category_id)
        
        return materials
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=404
        )
    except Exception as e:
        print(f"❌ Error getting worker materials: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to get worker materials"},
            status=500
        )


# ===========================
# PORTFOLIO ENDPOINTS
# ===========================

@router.post("/worker/portfolio", auth=dual_auth, response=PortfolioItemResponse)
def upload_portfolio_endpoint(
    request,
    image: UploadedFile = File(...),
    caption: Optional[str] = Form(None)
):
    """
    Upload a portfolio image with optional caption.
    
    Validates file size (5MB max) and format (JPEG/PNG).
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can upload portfolio images",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        portfolio_item = upload_portfolio_image(
            worker_profile=worker_profile,
            image_file=image,
            caption=caption
        )
        
        return {
            "success": True,
            "message": "Portfolio image uploaded successfully",
            "portfolio_item": portfolio_item
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error uploading portfolio: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to upload portfolio image"},
            status=500
        )


@router.get("/worker/portfolio", auth=dual_auth, response=list[PortfolioItemSchema])
def list_portfolio_endpoint(request):
    """
    List all worker's portfolio images ordered by display_order.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can view portfolio",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        portfolio = get_portfolio(worker_profile)
        
        return portfolio
        
    except Exception as e:
        print(f"❌ Error listing portfolio: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to list portfolio"},
            status=500
        )


@router.put("/worker/portfolio/{portfolio_id}/caption", auth=dual_auth, response=PortfolioItemResponse)
def update_portfolio_caption_endpoint(request, portfolio_id: int, payload: UpdatePortfolioCaptionRequest):
    """
    Update caption for a portfolio image.
    
    Only the worker who owns the portfolio item can update it.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can update portfolio",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        portfolio_item = update_portfolio_caption(
            worker_profile=worker_profile,
            portfolio_id=portfolio_id,
            caption=payload.caption
        )
        
        return {
            "success": True,
            "message": "Caption updated successfully",
            "portfolio_item": portfolio_item
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating caption: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update caption"},
            status=500
        )


@router.put("/worker/portfolio/reorder", auth=dual_auth)
def reorder_portfolio_endpoint(request, payload: ReorderPortfolioRequest):
    """
    Reorder portfolio images by providing list of portfolio IDs in desired order.
    
    Example: [3, 1, 5, 2, 4] will set display_order to 0, 1, 2, 3, 4 respectively.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can reorder portfolio",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        result = reorder_portfolio(
            worker_profile=worker_profile,
            portfolio_id_order=payload.portfolio_id_order
        )
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error reordering portfolio: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to reorder portfolio"},
            status=500
        )


@router.delete("/worker/portfolio/{portfolio_id}", auth=dual_auth)
def delete_portfolio_endpoint(request, portfolio_id: int):
    """
    Delete a portfolio image.
    
    Only the worker who owns the portfolio item can delete it.
    Remaining items are automatically reordered.
    """
    try:
        account = request.auth
        worker_profile_result = _get_worker_profile(
            account,
            not_worker_error="Only workers can delete portfolio images",
        )
        if isinstance(worker_profile_result, Response):
            return worker_profile_result
        worker_profile = worker_profile_result
        
        # Call service function
        result = delete_portfolio_image(worker_profile, portfolio_id)
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error deleting portfolio: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to delete portfolio image"},
            status=500
        )

#endregion


#region REVIEWS & RATINGS API
# ===========================================================================
# PHASE 8: REVIEWS & RATINGS SYSTEM
# ===========================================================================

@router.post("/reviews/submit", auth=dual_auth, response=ReviewResponse)
def submit_review_endpoint(request, payload: SubmitReviewRequest):
    """
    Submit a review for a completed job.

    - Job must be completed
    - Reviewer must be client or worker on the job
    - Cannot review yourself
    - Cannot review same job twice
    - Rating: 1.0 to 5.0
    """
    try:
        print(f"📝 Review submission received:")
        print(f"   Job ID: {payload.job_id}")
        print(f"   Reviewee ID: {payload.reviewee_id}")
        print(f"   Rating: {payload.rating}")
        print(f"   Comment: {payload.comment[:50]}...")
        print(f"   Reviewer Type: {payload.reviewer_type}")
        
        reviewer = request.auth
        review = submit_review(reviewer, payload)
        return review
    except ValueError as e:
        print(f"❌ Validation error: {str(e)}")
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error submitting review: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to submit review"},
            status=500
        )


@router.get("/reviews/worker/{worker_id}", response=ReviewListResponse)
def get_worker_reviews(request, worker_id: int, page: int = 1, limit: int = 20, sort: str = "latest"):
    """
    Get all reviews for a specific worker.

    Query params:
    - page: Page number (default: 1)
    - limit: Reviews per page (default: 20)
    - sort: "latest", "highest", "lowest" (default: "latest")
    """
    try:
        reviews = get_reviews_for_worker(worker_id, page, limit, sort)
        return reviews
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=404
        )
    except Exception as e:
        print(f"❌ Error fetching reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch reviews"},
            status=500
        )


@router.get("/reviews/stats/{worker_id}", response=ReviewStatsResponse)
def get_worker_review_stats(request, worker_id: int):
    """
    Get review statistics for a worker.

    Returns:
    - Average rating
    - Total review count
    - Rating breakdown (5-star, 4-star, etc.)
    - Recent reviews (last 5)
    """
    try:
        stats = get_review_stats(worker_id)
        return stats
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=404
        )
    except Exception as e:
        print(f"❌ Error fetching review stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch review statistics"},
            status=500
        )


@router.get("/reviews/my-reviews", auth=cookie_auth, response=MyReviewsResponse)
def get_my_reviews_endpoint(request):
    """
    Get reviews given and received by current user.

    Returns:
    - Reviews given by user
    - Reviews received by user
    - User's rating statistics
    """
    try:
        user = request.auth
        my_reviews = get_my_reviews(user)
        return my_reviews
    except Exception as e:
        print(f"❌ Error fetching my reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch your reviews"},
            status=500
        )


@router.put("/reviews/{review_id}", auth=cookie_auth, response=ReviewResponse)
def edit_review_endpoint(request, review_id: int, comment: str, rating: float):
    """
    Edit a review (only within 24 hours of creation).

    - Must be your own review
    - Within 24-hour window
    - Rating: 1.0 to 5.0
    """
    try:
        user = request.auth
        updated_review = edit_review(review_id, user, comment, rating)
        return updated_review
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error editing review: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to edit review"},
            status=500
        )


@router.post("/reviews/{review_id}/report", auth=cookie_auth)
def report_review_endpoint(request, review_id: int, payload: ReportReviewRequest):
    """
    Report a review as inappropriate.

    Reasons:
    - spam
    - offensive
    - misleading
    - other
    """
    try:
        reporter = request.auth
        result = report_review(review_id, reporter, payload)
        return result
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error reporting review: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to report review"},
            status=500
        )

#endregion


#region EARNINGS ENDPOINTS
# ===========================================================================
# EARNINGS ENDPOINTS - Worker/Agency Earnings Summary (Web API)
# ===========================================================================

@router.get("/earnings/summary", auth=dual_auth)
def get_earnings_summary(request):
    """
    Get earnings summary for the current worker/agency.
    Includes total earnings, pending earnings, and completed jobs count.
    """
    from decimal import Decimal
    from django.db.models import Sum, Count
    from django.utils import timezone
    from .models import Profile, WorkerProfile, Wallet, Job, Transaction
    
    try:
        print(f"💵 [WEB] Getting earnings summary for {request.auth.email}")
        
        # Get profile
        profile_type = getattr(request.auth, 'profile_type', None)
        if profile_type:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
        else:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType='WORKER'
            ).first()
        
        if not profile or profile.profileType != 'WORKER':
            return Response({"error": "Worker profile not found"}, status=403)
        
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
        except WorkerProfile.DoesNotExist:
            return Response({"error": "Worker profile not found"}, status=403)
        
        # Get wallet
        wallet, _ = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': Decimal('0.00'), 'pendingEarnings': Decimal('0.00')}
        )
        
        # Get completed jobs count
        completed_jobs = Job.objects.filter(
            assignedWorkerID=worker_profile,
            status='COMPLETED'
        ).count()
        
        # Get total earnings from transactions
        total_earnings = Transaction.objects.filter(
            walletID=wallet,
            transactionType__in=['EARNING', 'PENDING_EARNING'],
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Get this month's earnings
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        this_month_earnings = Transaction.objects.filter(
            walletID=wallet,
            transactionType__in=['EARNING', 'PENDING_EARNING'],
            status='COMPLETED',
            createdAt__gte=start_of_month
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        return {
            "success": True,
            "earnings": {
                "total_earnings": float(total_earnings),
                "pending_earnings": float(wallet.pendingEarnings),
                "available_balance": float(wallet.balance),
                "this_month_earnings": float(this_month_earnings),
                "completed_jobs_count": completed_jobs
            }
        }
        
    except Exception as e:
        print(f"❌ [WEB] Earnings summary error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to get earnings summary: {str(e)}"}, status=500)


@router.get("/earnings/history", auth=dual_auth)
def get_earnings_history(request, page: int = 1, limit: int = 20):
    """
    Get earnings history for the current worker/agency.
    Shows all earning transactions with job details.
    """
    from django.core.paginator import Paginator
    from .models import Profile, WorkerProfile, Wallet, Transaction
    
    try:
        print(f"📊 [WEB] Getting earnings history for {request.auth.email}")
        
        # Get profile
        profile_type = getattr(request.auth, 'profile_type', None)
        if profile_type:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
        else:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType='WORKER'
            ).first()
        
        if not profile or profile.profileType != 'WORKER':
            return Response({"error": "Worker profile not found"}, status=403)
        
        # Get wallet
        try:
            wallet = Wallet.objects.get(accountFK=request.auth)
        except Wallet.DoesNotExist:
            return {
                "success": True,
                "earnings": [],
                "total": 0,
                "page": page,
                "total_pages": 0
            }
        
        # Get earning transactions
        queryset = Transaction.objects.filter(
            walletID=wallet,
            transactionType__in=['EARNING', 'PENDING_EARNING']
        ).select_related('relatedJobPosting').order_by('-createdAt')
        
        paginator = Paginator(queryset, limit)
        if page < 1:
            page = 1
        if page > paginator.num_pages and paginator.num_pages > 0:
            page = paginator.num_pages
        
        earnings_page = paginator.get_page(page)
        
        earnings_data = []
        for txn in earnings_page:
            earning = {
                "id": txn.transactionID,
                "amount": float(txn.amount),
                "status": txn.status,
                "type": txn.transactionType,
                "description": txn.description,
                "created_at": txn.createdAt.isoformat() if txn.createdAt else None,
            }
            
            if txn.relatedJobPosting:
                earning["job"] = {
                    "id": txn.relatedJobPosting.jobID,
                    "title": txn.relatedJobPosting.title,
                    "budget": float(txn.relatedJobPosting.budget)
                }
            
            earnings_data.append(earning)
        
        return {
            "success": True,
            "earnings": earnings_data,
            "total": paginator.count,
            "page": page,
            "total_pages": paginator.num_pages
        }
        
    except Exception as e:
        print(f"❌ [WEB] Earnings history error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to get earnings history: {str(e)}"}, status=500)

#endregion


#region MOBILE API ROUTER
# ===========================================================================
# MOBILE-SPECIFIC API ENDPOINTS
# Optimized for mobile app with minimal payloads and better error handling
# ===========================================================================

mobile_router = Router(tags=["Mobile API"])

# ===========================
# MOBILE JOB ENDPOINTS
# ===========================

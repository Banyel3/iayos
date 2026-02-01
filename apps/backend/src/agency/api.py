from ninja import Router, Form
from ninja.responses import Response
from accounts.authentication import cookie_auth
from . import services, schemas
from .fast_upload_service import upload_agency_kyc_fast, extract_ocr_for_autofill
import logging

router = Router()
logger = logging.getLogger(__name__)


@router.post("/upload", auth=cookie_auth, response=schemas.AgencyKYCUploadResponse)
def upload_agency_kyc(request):
    """
    Upload agency KYC documents to Supabase (FAST - no AI validation).
    
    AI validation already happened in per-step validation (/kyc/validate-document).
    This endpoint ONLY uploads files to storage and saves to database.
    
    Request: multipart/form-data with:
    - business_permit, rep_front, rep_back (required files)
    - address_proof, auth_letter (optional files)
    - file_hashes: JSON object mapping document_type -> file_hash from validation
    - rep_id_type: ID type for rep front (PHILSYS_ID, etc.)
    - business_type: Business type (SOLE_PROPRIETORSHIP, etc.)
    
    Response time: ~5-10 seconds (vs 25-45s with AI validation)
    """
    try:
        # Get account ID from authenticated user
        account_id = request.auth.accountID
        business_name = request.POST.get("businessName")
        business_desc = request.POST.get("businessDesc")
        rep_id_type = request.POST.get("rep_id_type", "PHILSYS_ID")
        business_type = request.POST.get("business_type", "SOLE_PROPRIETORSHIP")
        
        # Get file hashes from validation step (JSON string)
        # Frontend sends 'file_hashes_json' field with JSON-encoded hashes
        import json
        file_hashes_raw = request.POST.get("file_hashes_json", "{}")
        try:
            file_hashes = json.loads(file_hashes_raw)
        except json.JSONDecodeError:
            file_hashes = {}
        
        class Payload:
            def __init__(self, accountID, businessName=None, businessDesc=None, rep_id_type=None, business_type=None, file_hashes=None):
                self.accountID = accountID
                self.businessName = businessName
                self.businessDesc = businessDesc
                self.rep_id_type = rep_id_type
                self.business_type = business_type
                self.file_hashes = file_hashes or {}

        payload = Payload(
            accountID=account_id,
            businessName=business_name,
            businessDesc=business_desc,
            rep_id_type=rep_id_type,
            business_type=business_type,
            file_hashes=file_hashes
        )

        # Read uploaded files from request.FILES
        business_permit = request.FILES.get("business_permit")
        rep_front = request.FILES.get("rep_front")
        rep_back = request.FILES.get("rep_back")
        address_proof = request.FILES.get("address_proof")
        auth_letter = request.FILES.get("auth_letter")

        # Call optimized upload service (skips AI validation)
        result = upload_agency_kyc_fast(payload, business_permit, rep_front, rep_back, address_proof, auth_letter)

        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error in upload_agency_kyc: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Internal server error"}, status=500)


@router.get("/status", auth=cookie_auth, response=schemas.AgencyKYCStatusResponse)
def agency_kyc_status(request):
    try:
        account_id = request.auth.accountID
        result = services.get_agency_kyc_status(account_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency kyc status: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.delete("/kyc/files", auth=cookie_auth)
def delete_agency_kyc_files(request):
    """
    Delete all agency KYC files for clean resubmission.
    
    Deletes:
    - All files from Supabase storage (agency bucket)
    - All AgencyKycFile database records
    - Resets AgencyKYC status to PENDING
    
    Allows unlimited resubmissions.
    """
    import re
    from agency.models import AgencyKYC, AgencyKycFile
    from iayos_project.utils import delete_storage_file
    
    try:
        account_id = request.auth.accountID
        
        # Find KYC record
        kyc_record = AgencyKYC.objects.filter(accountFK_id=account_id).first()
        
        if not kyc_record:
            return {"success": True, "message": "No KYC records found", "deleted_count": 0}
        
        def extract_file_path_for_delete(url_or_path):
            """Extract file path from URL for deletion."""
            if not url_or_path:
                return None
            if not url_or_path.startswith('http') and '/object/' not in url_or_path:
                return url_or_path
            match = re.search(r'(agency_\d+/kyc/[^?]+)', url_or_path)
            if match:
                return match.group(1)
            match = re.search(r'/agency/(.+?)(?:\?|$)', url_or_path)
            if match:
                return match.group(1)
            return url_or_path
        
        # Delete files from Supabase storage
        old_files = AgencyKycFile.objects.filter(agencyKyc=kyc_record)
        old_files_count = old_files.count()
        deleted_count = 0
        
        for f in old_files:
            if f.fileURL:
                file_path = extract_file_path_for_delete(f.fileURL)
                if file_path:
                    print(f"🗑️ Deleting agency KYC file: {file_path}")
                    if delete_storage_file("agency", file_path):
                        deleted_count += 1
        
        # Delete all file records from database
        AgencyKycFile.objects.filter(agencyKyc=kyc_record).delete()
        
        # Reset KYC status and increment resubmission count
        kyc_record.status = 'PENDING'
        kyc_record.notes = 'Files cleared for resubmission'
        kyc_record.resubmissionCount = kyc_record.resubmissionCount + 1
        kyc_record.rejectionReason = ''
        kyc_record.rejectionCategory = ''
        kyc_record.save()
        
        print(f"✅ Agency KYC files cleared: {deleted_count}/{old_files_count} from Supabase, DB records deleted")
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} files from storage and cleared {old_files_count} database records",
            "deleted_count": deleted_count,
            "db_records_cleared": old_files_count,
            "resubmission_count": kyc_record.resubmissionCount
        }
        
    except Exception as e:
        print(f"❌ Error deleting agency KYC files: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@router.post("/kyc/extract-ocr", auth=cookie_auth)
def extract_ocr_from_documents(request):
    """
    Extract OCR text from uploaded documents for business form autofill.
    
    This endpoint runs AFTER validation and provides extracted data for
    the Business Description Forms where users can edit the OCR text.
    
    Request: multipart/form-data with:
    - business_permit: Business permit image (required for business name/address)
    - rep_id_front: Representative ID front (optional, for rep name/ID number)
    - business_type: Business type (SOLE_PROPRIETORSHIP, etc.)
    
    Response:
    - extracted_data: dict with business_name, business_address, rep_name, etc.
    - confidence: float (0-1) for OCR quality
    
    Response time: ~3-5 seconds for OCR processing
    """
    try:
        account_id = request.auth.accountID
        business_type = request.POST.get("business_type", "SOLE_PROPRIETORSHIP")
        rep_id_type = request.POST.get("rep_id_type", "")
        
        # Get uploaded documents
        business_permit = request.FILES.get("business_permit")
        rep_id_front = request.FILES.get("rep_id_front")
        
        if not business_permit:
            return Response({"error": "Business permit is required for OCR extraction"}, status=400)
        
        # Run OCR extraction service (imported directly from fast_upload_service)
        result = extract_ocr_for_autofill(
            business_permit=business_permit,
            rep_id_front=rep_id_front,
            business_type=business_type,
            rep_id_type=rep_id_type
        )
        
        return result
        
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error in extract_ocr_from_documents: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "OCR extraction failed. Please fill the form manually."}, status=500)


@router.post("/kyc/autofill-business", auth=cookie_auth)
def autofill_business_from_ocr(request):
    """
    Extract and return BUSINESS-related fields from business permit OCR.

    Used in Agency KYC Step 3 (Business Information) to auto-populate:
    - business_name, business_address, business_type
    - permit_number, dti_number, sec_number, tin
    - permit_issue_date, permit_expiry_date

    Request: multipart/form-data with:
    - business_permit: Business permit image (required)
    - business_type: Business type hint (SOLE_PROPRIETORSHIP, PARTNERSHIP, CORPORATION, COOPERATIVE)

    Response:
    - success: bool
    - fields: dict with business fields
    - confidence: float (0-1) for OCR quality
    """
    try:
        from .kyc_extraction_parser import get_agency_kyc_parser
        from accounts.document_verification_service import DocumentVerificationService
        from PIL import Image
        import io
        from django.utils import timezone

        business_permit = request.FILES.get("business_permit")
        business_type = request.POST.get("business_type", "SOLE_PROPRIETORSHIP")

        if not business_permit:
            return Response({"success": False, "error": "Business permit is required"}, status=400)

        print("📝 [AUTOFILL-BUSINESS] Extracting business data from permit...")

        business_permit.seek(0)
        permit_bytes = business_permit.read()

        doc_service = DocumentVerificationService(skip_face_service=True)
        permit_img = Image.open(io.BytesIO(permit_bytes))
        ocr_result = doc_service._extract_text(permit_img)
        ocr_text = ocr_result.get("text", "")

        print(
            f"   📄 Business permit OCR: {len(ocr_text)} chars, confidence={ocr_result.get('confidence', 0):.2f}"
        )

        parser = get_agency_kyc_parser()
        parsed_business = parser.parse_ocr_text(ocr_text, "BUSINESS_PERMIT")

        fields = {
            "business_name": parsed_business.business_name.value or "",
            "business_address": parsed_business.business_address.value or "",
            "business_type": business_type,
            "permit_number": parsed_business.permit_number.value or "",
            "dti_number": parsed_business.dti_number.value or "",
            "sec_number": parsed_business.sec_number.value or "",
            "tin": parsed_business.tin.value or "",
            "permit_issue_date": parsed_business.permit_issue_date.value or "",
            "permit_expiry_date": parsed_business.permit_expiry_date.value or "",
        }

        print(
            f"✅ [AUTOFILL-BUSINESS] Extracted: name='{fields['business_name'][:30]}...', dti={fields['dti_number']}, permit={fields['permit_number']}"
        )

        return {
            "success": True,
            "fields": fields,
            "confidence": parsed_business.overall_confidence,
            "extracted_at": timezone.now().isoformat(),
        }

    except Exception as e:
        print(f"❌ [AUTOFILL-BUSINESS] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"success": False, "error": "Failed to extract business data"}, status=500)


@router.post("/kyc/autofill-id", auth=cookie_auth)
def autofill_id_from_ocr(request):
    """
    Extract and return REPRESENTATIVE ID fields from ID document OCR.

    Used in Agency KYC Step 4 (Representative ID) to auto-populate:
    - rep_full_name, rep_id_number, rep_id_type
    - rep_birth_date, rep_address

    Also usable in Mobile KYC for ID autofill.

    Request: multipart/form-data with:
    - id_front: ID front image (required)
    - id_type: ID type hint (PHILSYS_ID, DRIVERS_LICENSE, PASSPORT, etc.)

    Response:
    - success: bool
    - fields: dict with ID fields
    - confidence: float (0-1) for OCR quality
    """
    try:
        from .kyc_extraction_parser import get_agency_kyc_parser
        from accounts.document_verification_service import DocumentVerificationService
        from PIL import Image
        import io
        from django.utils import timezone

        id_front = request.FILES.get("id_front")
        id_type = request.POST.get("id_type", "PHILSYS_ID")

        if not id_front:
            return Response({"success": False, "error": "ID front image is required"}, status=400)

        print(f"📝 [AUTOFILL-ID] Extracting ID data (type: {id_type})...")

        id_front.seek(0)
        id_bytes = id_front.read()

        doc_service = DocumentVerificationService(skip_face_service=True)
        id_img = Image.open(io.BytesIO(id_bytes))
        ocr_result = doc_service._extract_text(id_img)
        ocr_text = ocr_result.get("text", "")

        print(
            f"   🪪 ID OCR: {len(ocr_text)} chars, confidence={ocr_result.get('confidence', 0):.2f}"
        )

        parser = get_agency_kyc_parser()
        parsed_id = parser.parse_ocr_text(ocr_text, id_type.upper())

        fields = {
            "rep_full_name": parsed_id.rep_full_name.value or "",
            "rep_id_number": parsed_id.rep_id_number.value or "",
            "rep_id_type": id_type,
            "rep_birth_date": parsed_id.rep_birth_date.value or "",
            "rep_address": parsed_id.rep_address.value or "",
        }

        print(
            f"✅ [AUTOFILL-ID] Extracted: name='{fields['rep_full_name']}', id_num={fields['rep_id_number']}"
        )

        return {
            "success": True,
            "fields": fields,
            "confidence": parsed_id.overall_confidence,
            "extracted_at": timezone.now().isoformat(),
        }

    except Exception as e:
        print(f"❌ [AUTOFILL-ID] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"success": False, "error": "Failed to extract ID data"}, status=500)


# ============================================
# KYC AI VERIFICATION ENDPOINTS
# ============================================

@router.post("/kyc/validate-document", auth=cookie_auth)
def validate_agency_document(request):
    """
    Per-step validation for agency KYC uploads with Redis caching.
    Validates document quality (resolution, blur) and face detection (for rep ID).
    
    Results are cached in Redis for 5 minutes to avoid re-validation during upload.
    
    Request: multipart/form-data with:
    - file: The document to validate
    - document_type: BUSINESS_PERMIT, REP_ID_FRONT, REP_ID_BACK, ADDRESS_PROOF, AUTH_LETTER
    - rep_id_type: (optional) ID type for REP_ID_FRONT (PHILSYS_ID, DRIVERS_LICENSE, etc.)
    
    Response:
    - valid: bool - whether document passes validation
    - error: str - user-friendly error message if invalid
    - details: dict - validation details (resolution, quality_score, face_detected, etc.)
    - file_hash: str - SHA-256 hash for cache key (returned to frontend)
    """
    try:
        # Get uploaded file first (fast operation)
        file = request.FILES.get("file")
        document_type = request.POST.get("document_type", "").upper()
        
        if not file:
            return Response({"valid": False, "error": "No file provided"}, status=400)
        
        if not document_type:
            return Response({"valid": False, "error": "document_type is required"}, status=400)
        
        valid_types = ['BUSINESS_PERMIT', 'REP_ID_FRONT', 'REP_ID_BACK', 'ADDRESS_PROOF', 'AUTH_LETTER']
        if document_type not in valid_types:
            return Response({"valid": False, "error": f"Invalid document_type. Must be one of: {', '.join(valid_types)}"}, status=400)
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        if file.content_type not in allowed_types:
            # PDFs skip validation
            if file.content_type == 'application/pdf':
                return {
                    "valid": True,
                    "error": None,
                    "details": {"skipped": True, "reason": "PDF files skip image validation"},
                    "file_hash": None
                }
            return Response({"valid": False, "error": "Only JPEG and PNG images are supported for validation"}, status=400)
        
        # Read file data
        file_data = file.read()
        
        # Generate file hash for caching
        from .validation_cache import generate_file_hash, cache_validation_result, get_cached_validation
        file_hash = generate_file_hash(file_data)
        
        # Get rep_id_type BEFORE cache check - needed for composite cache key
        # This fixes bug where changing ID type dropdown didn't invalidate cached validation
        rep_id_type = request.POST.get("rep_id_type", "").upper()
        
        # Create composite cache key for rep ID documents (includes ID type)
        # e.g., "REP_ID_FRONT:PHILSYS_ID" vs "REP_ID_FRONT:DRIVERS_LICENSE"
        cache_doc_type = f"{document_type}:{rep_id_type}" if rep_id_type and document_type in ['REP_ID_FRONT', 'REP_ID_BACK'] else document_type
        
        # Check cache first using composite key
        cached_result = get_cached_validation(file_hash, cache_doc_type)
        if cached_result:
            print(f"✅ [CACHE HIT] Using cached validation for {cache_doc_type}")
            return {
                "valid": cached_result.get('ai_status') != 'FAILED',
                "error": cached_result.get('ai_rejection_message'),
                "details": cached_result,
                "file_hash": file_hash,
                "cached": True
            }
        
        # Determine if face detection is required (front ID only)
        require_face = document_type in ['REP_ID_FRONT']
        
        # Map to verification service document type
        doc_type_mapping = {
            'BUSINESS_PERMIT': 'BUSINESS_PERMIT',
            'REP_ID_FRONT': rep_id_type if rep_id_type else 'FRONTID',
            'REP_ID_BACK': 'BACKID',
            'ADDRESS_PROOF': 'ADDRESS_PROOF',
            'AUTH_LETTER': 'AUTH_LETTER',
        }
        verification_doc_type = doc_type_mapping.get(document_type, document_type)
        
        print(f"🔍 [AGENCY] Validating {document_type} as {verification_doc_type}, require_face={require_face}")
        
        # Import and run validation
        try:
            from accounts.document_verification_service import DocumentVerificationService, TEXT_ONLY_DOCUMENTS, should_auto_reject
            from django.utils import timezone
            
            # TEXT-ONLY DOCUMENTS: Use lightweight validation path (no face detection service)
            # This prevents InsightFace cold-start timeout for permits, clearances, etc.
            if document_type in ['BUSINESS_PERMIT', 'ADDRESS_PROOF', 'AUTH_LETTER']:
                print(f"📄 [AGENCY] Using fast text-only validation for {document_type}")
                # Skip face service initialization entirely
                service = DocumentVerificationService(skip_face_service=True)
                result = service.validate_text_only_document(
                    file_data=file_data,
                    document_type=verification_doc_type,
                    skip_keyword_check=True  # Just verify readable text, allow manual review
                )
                
                # Prepare result for caching (text-only format)
                validation_data = {
                    'ai_status': 'PASSED' if result.get('valid') else 'FAILED',
                    'face_detected': False,
                    'face_count': 0,
                    'face_confidence': 0,
                    'quality_score': result.get('details', {}).get('quality_score', 0),
                    'ai_confidence_score': result.get('details', {}).get('ocr_confidence', 0),
                    'ai_warnings': result.get('details', {}).get('warnings', []),
                    'ai_details': result.get('details', {}),
                    'ai_rejection_reason': None,
                    'ai_rejection_message': result.get('error'),
                    'text_only_validation': True,
                }
                
                # Cache the result using composite key
                cache_validation_result(file_hash, cache_doc_type, validation_data)
                
                return {
                    "valid": result.get('valid', False),
                    "error": result.get('error'),
                    "details": validation_data,
                    "file_hash": file_hash,
                    "cached": False
                }
            
            # ID DOCUMENTS: Full validation with face detection
            service = DocumentVerificationService()
            
            # Run full validation (face detection + quality checks)
            result = service.verify_document(
                file_data=file_data,
                document_type=verification_doc_type,
                file_name=f"{document_type}.jpg"
            )
            
            # Get proper rejection message using should_auto_reject
            _, rejection_message = should_auto_reject(result)
            
            # Prepare result for caching
            validation_data = {
                'ai_status': result.status.value,
                'face_detected': result.face_detected,
                'face_count': result.face_count,
                'face_confidence': result.details.get('face_detection', {}).get('confidence', 0) if result.details else 0,
                'quality_score': result.quality_score,
                'ai_confidence_score': result.confidence_score,
                'ai_warnings': result.warnings or [],
                'ai_details': result.details or {},
                'ai_rejection_reason': result.rejection_reason.value if result.rejection_reason else None,
                'ai_rejection_message': rejection_message if rejection_message else None,
            }
            
            # Cache the result using composite key
            cache_validation_result(file_hash, cache_doc_type, validation_data)
            
            # Return response
            return {
                "valid": result.status.value != 'FAILED',
                "error": validation_data.get('ai_rejection_message'),
                "details": validation_data,
                "file_hash": file_hash,
                "cached": False
            }
            
        except Exception as init_error:
            print(f"⚠️ DocumentVerificationService error: {init_error}")
            import traceback
            traceback.print_exc()
            # Return valid with manual review flag if AI service fails
            return {
                "valid": True,
                "error": None,
                "details": {
                    "skipped": True,
                    "reason": "AI verification temporarily unavailable - document accepted for manual review",
                    "needs_manual_review": True
                }
            }
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"Error in validate_agency_document: {error_msg}")
        traceback.print_exc()
        return Response({
            "valid": False, 
            "error": f"Validation failed: {error_msg}" if error_msg else "Validation failed. Please try again.",
            "details": {"exception": error_msg}
        }, status=500)


@router.get("/kyc/autofill", auth=cookie_auth)
def get_agency_kyc_autofill(request):
    """
    Get auto-filled business data from OCR extraction.
    
    Returns structured extracted data from business permit and representative ID
    that can be used to pre-fill agency profile fields.
    
    Response:
    - success: bool
    - has_extracted_data: bool - Whether extraction data exists
    - extraction_status: PENDING | EXTRACTED | CONFIRMED | FAILED
    - needs_confirmation: bool - Whether user needs to review/confirm data
    - extracted_at: ISO timestamp - When extraction completed
    - confirmed_at: ISO timestamp - When user confirmed data
    - fields: dict with extracted field values and confidence scores
        - Each field: {value: str, confidence: float, source: "ocr" | "confirmed"}
        - business_name, business_type, business_address, permit_number, etc.
    - user_edited_fields: list[str] - Fields that user manually edited
    """
    try:
        from .models import AgencyKYC, AgencyKYCExtractedData
        
        account_id = request.auth.accountID
        print(f"🔍 [AGENCY KYC AUTOFILL] Fetching auto-fill data for accountID: {account_id}")
        
        # Get AgencyKYC record
        try:
            kyc_record = AgencyKYC.objects.get(accountFK_id=account_id)
        except AgencyKYC.DoesNotExist:
            return {
                "success": True,
                "has_extracted_data": False,
                "message": "No Agency KYC submission found"
            }
        
        # Get extracted data
        try:
            extracted = AgencyKYCExtractedData.objects.get(agencyKyc=kyc_record)
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
            
        except AgencyKYCExtractedData.DoesNotExist:
            return {
                "success": True,
                "has_extracted_data": False,
                "message": "No extracted data available yet"
            }
            
    except Exception as e:
        print(f"❌ [AGENCY KYC AUTOFILL] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch auto-fill data"}



@router.post("/kyc/confirm", auth=cookie_auth)
def confirm_agency_kyc_data(request):
    """
    Confirm or edit OCR-extracted business data.
    
    Request body (JSON):
    - business_name: str
    - business_type: str (NEW: SOLE_PROPRIETORSHIP, PARTNERSHIP, CORPORATION, COOPERATIVE)
    - business_address: str
    - permit_number: str
    - tin: str
    - rep_full_name: str
    - rep_id_number: str
    - rep_birth_date: str (YYYY-MM-DD)
    - rep_address: str
    - edited_fields: list[str]
    
    This updates AgencyKYCExtractedData with user-confirmed data.
    """
    try:
        import json
        from .models import AgencyKYC, AgencyKYCExtractedData
        from django.utils import timezone
        from datetime import datetime
        
        account_id = request.auth.accountID
        
        # Parse JSON body
        try:
            body = json.loads(request.body)
        except:
            body = {}
        
        # Get AgencyKYC record
        try:
            kyc_record = AgencyKYC.objects.get(accountFK_id=account_id)
        except AgencyKYC.DoesNotExist:
            return Response({"success": False, "error": "No KYC submission found. Please upload documents first."}, status=404)
        
        # Get or create extracted data record
        extracted, created = AgencyKYCExtractedData.objects.get_or_create(
            agencyKyc=kyc_record,
            defaults={"extraction_status": "PENDING"}
        )
        
        # Track which fields were edited by user
        edited_fields = body.get("edited_fields", [])
        
        # Update confirmed fields
        if "business_name" in body:
            extracted.confirmed_business_name = body["business_name"]
        if "business_type" in body:
            extracted.confirmed_business_type = body["business_type"]
        if "business_address" in body:
            extracted.confirmed_business_address = body["business_address"]
        if "permit_number" in body:
            extracted.confirmed_permit_number = body["permit_number"]
        if "tin" in body:
            extracted.confirmed_tin = body["tin"]
        if "dti_number" in body:
            extracted.confirmed_dti_number = body["dti_number"]
        if "sec_number" in body:
            extracted.confirmed_sec_number = body["sec_number"]
        if "rep_full_name" in body:
            extracted.confirmed_rep_full_name = body["rep_full_name"]
        if "rep_id_number" in body:
            extracted.confirmed_rep_id_number = body["rep_id_number"]
        if "rep_address" in body:
            extracted.confirmed_rep_address = body["rep_address"]
        
        # Handle date fields
        if "rep_birth_date" in body and body["rep_birth_date"]:
            try:
                extracted.confirmed_rep_birth_date = datetime.strptime(body["rep_birth_date"], "%Y-%m-%d").date()
            except ValueError:
                pass
        
        if "permit_issue_date" in body and body["permit_issue_date"]:
            try:
                extracted.confirmed_permit_issue_date = datetime.strptime(body["permit_issue_date"], "%Y-%m-%d").date()
            except ValueError:
                pass
        
        if "permit_expiry_date" in body and body["permit_expiry_date"]:
            try:
                extracted.confirmed_permit_expiry_date = datetime.strptime(body["permit_expiry_date"], "%Y-%m-%d").date()
            except ValueError:
                pass
        
        # Update metadata
        extracted.extraction_status = "CONFIRMED"
        extracted.confirmed_at = timezone.now()
        extracted.user_edited_fields = edited_fields
        
        extracted.save()
        
        logger.info(f"Agency KYC data confirmed for accountID {account_id}")
        if "business_type" in body:
            logger.info(f"Business type confirmed as: {body['business_type']}")
        
        return {
            "success": True,
            "message": "Agency KYC data confirmed successfully",
            "extraction_status": extracted.extraction_status,
            "confirmed_at": extracted.confirmed_at.isoformat() if extracted.confirmed_at else None,
        }
        
    except Exception as e:
        logger.exception(f"Error in confirm_agency_kyc_data: {str(e)}")
        return Response({"success": False, "error": "Failed to confirm data"}, status=500)


# Employee management endpoints

@router.get("/employees", auth=cookie_auth)
def get_employees(request):
    """Get all employees for the authenticated agency."""
    try:
        account_id = request.auth.accountID
        employees = services.get_agency_employees(account_id)
        return {"employees": employees}
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching employees: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/employees", auth=cookie_auth)
def add_employee(request):
    """Add a new employee to the agency with name breakdown and multi-specializations."""
    try:
        import json
        account_id = request.auth.accountID
        firstName = request.POST.get("firstName")
        lastName = request.POST.get("lastName")
        middleName = request.POST.get("middleName", "")
        email = request.POST.get("email")
        
        # Handle specializations as JSON array
        specializations_raw = request.POST.get("specializations", "[]")
        try:
            specializations = json.loads(specializations_raw)
        except json.JSONDecodeError:
            # Fallback: treat as single role (backward compatibility)
            role = request.POST.get("role", "")
            specializations = [role] if role else []
        
        avatar = request.POST.get("avatar")
        rating = float(request.POST.get("rating")) if request.POST.get("rating") else None
        
        result = services.add_agency_employee(
            account_id, firstName, lastName, email, specializations,
            middleName=middleName, avatar=avatar, rating=rating
        )
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error adding employee: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.put("/employees/{employee_id}", auth=cookie_auth)
def update_employee(request, employee_id: int):
    """Update an existing employee's information."""
    try:
        import json
        account_id = request.auth.accountID
        
        # Parse JSON body for PUT request
        body = json.loads(request.body.decode('utf-8'))
        
        firstName = body.get("firstName")
        lastName = body.get("lastName")
        middleName = body.get("middleName")
        email = body.get("email")
        specializations = body.get("specializations")
        avatar = body.get("avatar")
        isActive = body.get("isActive")
        
        result = services.update_agency_employee(
            account_id, employee_id,
            firstName=firstName,
            lastName=lastName,
            middleName=middleName,
            email=email,
            specializations=specializations,
            avatar=avatar,
            isActive=isActive
        )
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON body"}, status=400)
    except Exception as e:
        print(f"Error updating employee: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.delete("/employees/{employee_id}", auth=cookie_auth)
def remove_employee(request, employee_id: int):
    """Remove an employee from the agency."""
    try:
        account_id = request.auth.accountID
        result = services.remove_agency_employee(account_id, employee_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error removing employee: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/profile", auth=cookie_auth)
def get_profile(request):
    """Get complete agency profile with statistics."""
    try:
        account_id = request.auth.accountID
        profile = services.get_agency_profile(account_id)
        return profile
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/analytics/revenue-trends", auth=cookie_auth)
def get_revenue_trends(request, weeks: int = 12):
    """
    Get weekly revenue and job completion trends for analytics charts.
    
    Query params:
        weeks: Number of weeks to fetch (default: 12, max: 52)
    
    Returns:
        List of weekly data points with date, revenue, and jobs completed
    """
    try:
        account_id = request.auth.accountID
        # Cap weeks at 52 (1 year)
        weeks = min(weeks, 52)
        trends = services.get_revenue_trends(account_id, weeks)
        return {"success": True, "trends": trends, "weeks": weeks}
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching revenue trends: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/profile/update", auth=cookie_auth)
def update_profile(request):
    """Update agency profile information."""
    try:
        account_id = request.auth.accountID
        business_name = request.POST.get("business_name")
        business_description = request.POST.get("business_description")
        contact_number = request.POST.get("contact_number")
        
        # Debug: print received values
        print(f"Received update request:")
        print(f"  business_name: {business_name}")
        print(f"  business_description: {business_description}")
        print(f"  contact_number: {contact_number}")
        
        result = services.update_agency_profile(
            account_id, 
            business_name=business_name,
            business_desc=business_description,
            contact_number=contact_number
        )
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error updating agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.put("/profile", auth=cookie_auth)
def update_profile_put(request):
    """Update agency profile information."""
    try:
        account_id = request.auth.accountID
        business_description = request.POST.get("business_description")
        contact_number = request.POST.get("contact_number")
        result = services.update_agency_profile(account_id, business_description, contact_number)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error updating agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


# Simplified agency job endpoints - Direct invite/hire model

@router.get("/jobs", auth=cookie_auth)
def get_agency_jobs(request, status: str | None = None, invite_status: str | None = None, page: int = 1, limit: int = 20):
    """
    Get all jobs assigned to this agency (direct hires/invites).
    
    Query Parameters:
    - status: Filter by job status (ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED)
    - invite_status: Filter by invite status (PENDING, ACCEPTED, REJECTED)
    - page: Page number for pagination (default: 1)
    - limit: Items per page (default: 20, max: 100)
    """
    try:
        account_id = request.auth.accountID
        
        # Validate limit
        if limit > 100:
            limit = 100
        
        result = services.get_agency_jobs(
            account_id=account_id,
            status_filter=status,
            invite_status_filter=invite_status,
            page=page,
            limit=limit
        )
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency jobs: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/jobs/{job_id}", auth=cookie_auth)
def get_agency_job_detail(request, job_id: int):
    """
    Get detailed information for a specific job assigned to this agency.
    """
    try:
        account_id = request.auth.accountID
        result = services.get_agency_job_detail(account_id, job_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=404)
    except Exception as e:
        print(f"Error fetching job detail: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/jobs/{job_id}/accept", auth=cookie_auth)
def accept_job_invite(request, job_id: int):
    """
    Agency accepts a job invitation
    - Updates inviteStatus to ACCEPTED
    - Job becomes ACTIVE and ready for work
    - Client is notified of acceptance
    """
    try:
        account_id = request.auth.accountID
        
        # Verify agency exists
        from accounts.models import Agency, Job, Notification
        try:
            agency = Agency.objects.get(accountFK=request.auth)
        except Agency.DoesNotExist:
            return Response(
                {"error": "Agency profile not found"},
                status=404
            )
        
        # Get the job
        try:
            job = Job.objects.get(jobID=job_id, assignedAgencyFK=agency)
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found or not assigned to your agency"},
                status=404
            )
        
        # Verify job is INVITE type
        if job.jobType != "INVITE":
            return Response(
                {"error": "This is not an INVITE-type job"},
                status=400
            )
        
        # Verify invite is still pending
        if job.inviteStatus != "PENDING":
            status_text = job.inviteStatus.lower() if job.inviteStatus else "processed"
            return Response(
                {"error": f"Invite has already been {status_text}"},
                status=400
            )
        
        # Verify escrow is paid
        if not job.escrowPaid:
            return Response(
                {"error": "Cannot accept job - escrow payment is pending"},
                status=400
            )
        
        # Update job status
        from django.utils import timezone
        job.inviteStatus = "ACCEPTED"
        job.inviteRespondedAt = timezone.now()
        # NOTE: Job stays ACTIVE until employees are assigned
        # Status changes to IN_PROGRESS only when assign_employees is called
        job.save()
        
        # Create conversation between client and agency for this job
        from profiles.models import Conversation
        try:
            conversation, created = Conversation.objects.get_or_create(
                relatedJobPosting=job,
                defaults={
                    'client': job.clientID.profileID,
                    'worker': None,  # For agency jobs, worker is None
                    'status': Conversation.ConversationStatus.ACTIVE
                }
            )
            if created:
                print(f"✅ Created conversation {conversation.conversationID} for INVITE job {job_id}")
            else:
                print(f"ℹ️ Conversation already exists for job {job_id}")
        except Exception as e:
            print(f"⚠️ Failed to create conversation: {str(e)}")
            # Don't fail the job acceptance if conversation creation fails
        
        # Send notification to client
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="JOB_INVITE_ACCEPTED",
            title=f"{agency.businessName} Accepted Your Invitation",
            message=f"{agency.businessName} has accepted your invitation for '{job.title}'. The job is now active!",
            relatedJobID=job.jobID
        )
        
        # Send confirmation to agency
        Notification.objects.create(
            accountFK=request.auth,
            notificationType="JOB_INVITE_ACCEPTED_CONFIRM",
            title=f"Job Accepted: {job.title}",
            message=f"You've accepted the job invitation for '{job.title}'. Start working on the project!",
            relatedJobID=job.jobID
        )
        
        print(f"✅ Agency {agency.agencyId} accepted job {job_id}")
        
        return {
            "success": True,
            "message": "Job invitation accepted successfully!",
            "job_id": job.jobID,
            "invite_status": "ACCEPTED",
            "job_status": "ACTIVE"
        }
        
    except Exception as e:
        print(f"❌ Error accepting job invite: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to accept job invite: {str(e)}"},
            status=500
        )


@router.post("/jobs/{job_id}/reject", auth=cookie_auth)
def reject_job_invite(request, job_id: int, reason: str | None = None):
    """
    Agency rejects a job invitation
    - Updates inviteStatus to REJECTED
    - Refunds escrow to client (if paid)
    - Client is notified with rejection reason
    """
    try:
        account_id = request.auth.accountID
        
        # Verify agency exists
        from accounts.models import Agency, Job, Notification, Wallet, Transaction
        try:
            agency = Agency.objects.get(accountFK=request.auth)
        except Agency.DoesNotExist:
            return Response(
                {"error": "Agency profile not found"},
                status=404
            )
        
        # Get the job
        try:
            job = Job.objects.get(jobID=job_id, assignedAgencyFK=agency)
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found or not assigned to your agency"},
                status=404
            )
        
        # Verify job is INVITE type
        if job.jobType != "INVITE":
            return Response(
                {"error": "This is not an INVITE-type job"},
                status=400
            )
        
        # Verify invite is still pending
        if job.inviteStatus != "PENDING":
            status_text = job.inviteStatus.lower() if job.inviteStatus else "processed"
            return Response(
                {"error": f"Invite has already been {status_text}"},
                status=400
            )
        
        # Update job status
        from django.utils import timezone
        from django.db import transaction as db_transaction
        
        with db_transaction.atomic():
            job.inviteStatus = "REJECTED"
            job.inviteRejectionReason = reason or "No reason provided"
            job.inviteRespondedAt = timezone.now()
            job.status = "CANCELLED"  # Job is cancelled since agency rejected
            job.save()
            
            # Refund escrow to client if it was paid
            if job.escrowPaid:
                try:
                    client_wallet = Wallet.objects.get(accountFK=job.clientID.profileID.accountFK)
                    refund_amount = job.escrowAmount
                    
                    # Refund to wallet
                    client_wallet.balance += refund_amount
                    client_wallet.save()
                    
                    # Create refund transaction
                    Transaction.objects.create(
                        walletID=client_wallet,
                        transactionType=Transaction.TransactionType.REFUND,
                        amount=refund_amount,
                        balanceAfter=client_wallet.balance,
                        status=Transaction.TransactionStatus.COMPLETED,
                        description=f"Refund for rejected INVITE job: {job.title}",
                        relatedJobID=job,
                        completedAt=timezone.now(),
                        referenceNumber=f"REFUND-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                    )
                    
                    print(f"💰 Refunded ₱{refund_amount} to client wallet")
                except Wallet.DoesNotExist:
                    print(f"⚠️ Wallet not found for client, skipping refund")
        
        # Send notification to client
        rejection_msg = f"{agency.businessName} has declined your invitation for '{job.title}'."
        if reason:
            rejection_msg += f" Reason: {reason}"
        rejection_msg += " Your escrow payment has been refunded."
        
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="JOB_INVITE_REJECTED",
            title=f"{agency.businessName} Declined Your Invitation",
            message=rejection_msg,
            relatedJobID=job.jobID
        )
        
        # Send confirmation to agency
        Notification.objects.create(
            accountFK=request.auth,
            notificationType="JOB_INVITE_REJECTED_CONFIRM",
            title=f"Job Declined: {job.title}",
            message=f"You've declined the job invitation for '{job.title}'.",
            relatedJobID=job.jobID
        )
        
        print(f"✅ Agency {agency.agencyId} rejected job {job_id}")
        
        return {
            "success": True,
            "message": "Job invitation rejected. Client has been notified and refunded.",
            "job_id": job.jobID,
            "invite_status": "REJECTED",
            "refund_processed": job.escrowPaid
        }
        
    except Exception as e:
        print(f"❌ Error rejecting job invite: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to reject job invite: {str(e)}"},
            status=500
        )


# Agency Phase 2 - Employee Management Endpoints

@router.put("/employees/{employee_id}/rating", auth=cookie_auth, response=schemas.UpdateEmployeeRatingResponse)
def update_employee_rating(request, employee_id: int, rating: float, reason: str | None = None):
    """
    Update an employee's rating manually.
    
    Args:
        employee_id: ID of the employee to update
        rating: New rating (0.00 to 5.00)
        reason: Optional reason for the rating update
    
    Returns:
        Updated employee rating info
    """
    try:
        account_id = request.auth.accountID
        result = services.update_employee_rating(account_id, employee_id, rating, reason)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error updating employee rating: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/employees/{employee_id}/set-eotm", auth=cookie_auth, response=schemas.SetEmployeeOfMonthResponse)
def set_employee_of_month(request, employee_id: int, payload: schemas.SetEmployeeOfMonthSchema):
    """
    Set an employee as Employee of the Month.
    Only one employee can be EOTM per agency at a time.
    
    Args:
        employee_id: ID of the employee to set as EOTM
        payload: Request body containing reason for selection
    
    Returns:
        Updated employee EOTM info
    """
    try:
        account_id = request.auth.accountID
        result = services.set_employee_of_month(account_id, employee_id, payload.reason)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error setting employee of month: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/employees/{employee_id}/performance", auth=cookie_auth, response=schemas.EmployeePerformanceResponse)
def get_employee_performance(request, employee_id: int):
    """
    Get comprehensive performance statistics for an employee.
    
    Args:
        employee_id: ID of the employee
    
    Returns:
        Employee performance statistics including jobs, earnings, ratings
    """
    try:
        account_id = request.auth.accountID
        result = services.get_employee_performance(account_id, employee_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching employee performance: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/employees/leaderboard", auth=cookie_auth, response=schemas.EmployeeLeaderboardResponse)
def get_employee_leaderboard(request, sort_by: str = 'rating'):
    """
    Get employee leaderboard sorted by various metrics.
    Only includes active employees.
    
    Query Parameters:
        sort_by: Sort metric ('rating', 'jobs', 'earnings') - default: 'rating'
    
    Returns:
        Ranked list of employees with their performance metrics
    """
    try:
        account_id = request.auth.accountID
        result = services.get_employee_leaderboard(account_id, sort_by)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching employee leaderboard: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/jobs/{job_id}/assign-employee", auth=cookie_auth)
def assign_job_to_employee_endpoint(
    request,
    job_id: int,
    employee_id: int = Form(...),
    assignment_notes: str | None = Form(None)
):
    """
    Assign an accepted job to a specific employee

    POST /api/agency/jobs/{job_id}/assign-employee
    Body (FormData):
        - employee_id: int (required)
        - assignment_notes: str (optional)
    """
    try:
        result = services.assign_job_to_employee(
            agency_account=request.auth,
            job_id=job_id,
            employee_id=employee_id,
            assignment_notes=assignment_notes
        )
        return Response(result, status=200)

    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error assigning job to employee: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


@router.post("/jobs/{job_id}/unassign-employee", auth=cookie_auth)
def unassign_job_from_employee_endpoint(
    request,
    job_id: int,
    reason: str | None = Form(None)
):
    """
    Unassign an employee from a job

    POST /api/agency/jobs/{job_id}/unassign-employee
    Body (FormData):
        - reason: str (optional)
    """
    try:
        result = services.unassign_job_from_employee(
            agency_account=request.auth,
            job_id=job_id,
            reason=reason
        )
        return Response(result, status=200)

    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error unassigning employee: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


@router.get("/employees/{employee_id}/workload", auth=cookie_auth)
def get_employee_workload_endpoint(request, employee_id: int):
    """
    Get current workload for an employee

    GET /api/agency/employees/{employee_id}/workload
    """
    try:
        result = services.get_employee_workload(
            agency_account=request.auth,
            employee_id=employee_id
        )
        return Response(result, status=200)

    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error getting employee workload: {str(e)}")
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


# ============================================================
# Multi-Employee Assignment Endpoints (NEW)
# ============================================================

@router.post("/jobs/{job_id}/assign-employees", auth=cookie_auth)
def assign_employees_to_job_endpoint(request, job_id: int):
    """
    Assign multiple employees to a job.
    
    POST /api/agency/jobs/{job_id}/assign-employees
    Body (JSON):
        - employee_ids: list[int] (required) - List of employee IDs to assign
        - primary_contact_id: int (optional) - ID of employee to be team lead
        - assignment_notes: str (optional)
    """
    import json
    try:
        data = json.loads(request.body)
        employee_ids = data.get('employee_ids', [])
        primary_contact_id = data.get('primary_contact_id')
        assignment_notes = data.get('assignment_notes', '')
        
        if not employee_ids:
            return Response({'success': False, 'error': 'employee_ids is required'}, status=400)
        
        result = services.assign_employees_to_job(
            agency_account=request.auth,
            job_id=job_id,
            employee_ids=employee_ids,
            primary_contact_id=primary_contact_id,
            assignment_notes=assignment_notes
        )
        return Response(result, status=200)
    
    except json.JSONDecodeError:
        return Response({'success': False, 'error': 'Invalid JSON body'}, status=400)
    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error assigning employees to job: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


@router.delete("/jobs/{job_id}/employees/{employee_id}", auth=cookie_auth)
def remove_employee_from_job_endpoint(request, job_id: int, employee_id: int):
    """
    Remove a single employee from a multi-employee job.
    
    DELETE /api/agency/jobs/{job_id}/employees/{employee_id}
    Query params:
        - reason: str (optional)
    """
    try:
        reason = request.GET.get('reason', '')
        
        result = services.remove_employee_from_job(
            agency_account=request.auth,
            job_id=job_id,
            employee_id=employee_id,
            reason=reason
        )
        return Response(result, status=200)
    
    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error removing employee from job: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


@router.get("/jobs/{job_id}/employees", auth=cookie_auth)
def get_job_employees_endpoint(request, job_id: int):
    """
    Get all employees assigned to a job.
    
    GET /api/agency/jobs/{job_id}/employees
    """
    try:
        result = services.get_job_assigned_employees(
            agency_account=request.auth,
            job_id=job_id
        )
        return Response(result, status=200)
    
    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error getting job employees: {str(e)}")
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


@router.put("/jobs/{job_id}/primary-contact/{employee_id}", auth=cookie_auth)
def set_primary_contact_endpoint(request, job_id: int, employee_id: int):
    """
    Change the primary contact/team lead for a job.
    
    PUT /api/agency/jobs/{job_id}/primary-contact/{employee_id}
    """
    try:
        result = services.set_primary_contact(
            agency_account=request.auth,
            job_id=job_id,
            employee_id=employee_id
        )
        return Response(result, status=200)
    
    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error setting primary contact: {str(e)}")
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


# ============================================================
# Agency Chat/Messaging Endpoints
# ============================================================

@router.get("/conversations", auth=cookie_auth)
def get_agency_conversations(request, filter: str = "all"):
    """
    Get all conversations for jobs managed by this agency.
    Shows conversations where agency employees are assigned.
    
    Query params:
    - filter: 'all', 'unread', or 'archived' (default: 'all')
    """
    try:
        from profiles.models import Conversation, Message
        from accounts.models import Job, Profile
        from django.db.models import Q, Count, Max
        
        account = request.auth
        
        # Verify user is an agency (has AgencyKYC)
        from .models import AgencyKYC, AgencyEmployee
        agency_kyc = AgencyKYC.objects.filter(accountFK=account).first()
        if not agency_kyc:
            return Response({"error": "Agency account not found"}, status=400)
        
        print(f"\n🏢 === AGENCY CONVERSATIONS DEBUG ===")
        print(f"📧 Agency account: {account.email}")
        
        # Get all employees of this agency
        agency_employees = AgencyEmployee.objects.filter(agency=account)
        print(f"👥 Agency employees: {agency_employees.count()}")
        
        # Get agency's profile (to find conversations where agency is worker)
        agency_profile = Profile.objects.filter(accountFK=account).first()
        
        # Find all jobs where:
        # 1. Job was sent to agency (inviteStatus = ACCEPTED, invitedAgencyID exists)
        # 2. Or job has an assigned employee from this agency
        from .models import AgencyEmployee
        
        # Get conversations where agency is the worker (for INVITE jobs)
        conversations_query = Conversation.objects.filter(
            Q(worker=agency_profile) |  # Agency is in worker role
            Q(relatedJobPosting__assignedEmployeeID__agency=account)  # Employee from this agency is assigned
        ).select_related(
            'client__accountFK',
            'worker__accountFK',
            'relatedJobPosting',
            'relatedJobPosting__assignedEmployeeID',
            'lastMessageSender'
        ).distinct()
        
        print(f"💬 Total conversations found: {conversations_query.count()}")
        
        # Apply filters
        if filter == "archived":
            # For agencies, use worker archived status
            conversations_query = conversations_query.filter(archivedByWorker=True)
        else:
            conversations_query = conversations_query.filter(archivedByWorker=False)
            
            if filter == "unread":
                conversations_query = conversations_query.filter(unreadCountWorker__gt=0)
        
        conversations = conversations_query.order_by('-updatedAt')
        
        print(f"📊 After filters: {conversations.count()} conversations")
        
        result = []
        for conv in conversations:
            job = conv.relatedJobPosting
            client_profile = conv.client
            
            # Get assigned employee info if exists (legacy single employee)
            assigned_employee = None
            if job.assignedEmployeeID:
                emp = job.assignedEmployeeID
                assigned_employee = {
                    "employeeId": emp.employeeID,
                    "name": emp.name,
                    "email": emp.email,
                    "role": emp.role,
                    "avatar": emp.avatar,
                    "rating": float(emp.rating) if emp.rating else None,
                    "totalJobsCompleted": emp.totalJobsCompleted,
                    "totalEarnings": float(emp.totalEarnings) if emp.totalEarnings else 0,
                    "employeeOfTheMonth": emp.employeeOfTheMonth,
                    "rank": 0
                }
            
            # Get ALL assigned employees from M2M (multi-employee support)
            from accounts.models import JobEmployeeAssignment
            assigned_employees = []
            assignments = JobEmployeeAssignment.objects.filter(
                job=job,
                status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
            ).select_related('employee').order_by('-isPrimaryContact', 'assignedAt')
            
            for assignment in assignments:
                emp = assignment.employee
                assigned_employees.append({
                    "employeeId": emp.employeeID,
                    "name": emp.name,
                    "email": emp.email,
                    "role": emp.role,
                    "avatar": emp.avatar,
                    "rating": float(emp.rating) if emp.rating else None,
                    "isPrimaryContact": assignment.isPrimaryContact,
                    "status": assignment.status,
                })
            
            # Fallback: if no M2M assignments but legacy field is set
            if not assigned_employees and job.assignedEmployeeID:
                emp = job.assignedEmployeeID
                assigned_employees.append({
                    "employeeId": emp.employeeID,
                    "name": emp.name,
                    "email": emp.email,
                    "role": emp.role,
                    "avatar": emp.avatar,
                    "rating": float(emp.rating) if emp.rating else None,
                    "isPrimaryContact": True,
                    "status": "ASSIGNED",
                })
            
            # Get client info
            client_info = {
                "name": f"{client_profile.firstName} {client_profile.lastName}".strip() or client_profile.accountFK.email,
                "avatar": client_profile.profileImg,
                "profile_type": "CLIENT",
                "location": client_profile.location if hasattr(client_profile, 'location') else None,
                "job_title": None
            }
            
            # Count unread (agency is worker side)
            unread_count = conv.unreadCountWorker
            is_archived = conv.archivedByWorker
            
            # Check review status
            from accounts.models import JobReview
            worker_reviewed = JobReview.objects.filter(jobID=job, reviewerID=account).exists()
            client_reviewed = JobReview.objects.filter(jobID=job, reviewerID=client_profile.accountFK).exists()
            
            result.append({
                "id": conv.conversationID,
                "job": {
                    "id": job.jobID,
                    "title": job.title,
                    "status": job.status,
                    "budget": float(job.budget),
                    "location": job.location,
                    "workerMarkedComplete": job.workerMarkedComplete,
                    "clientMarkedComplete": job.clientMarkedComplete,
                    "workerReviewed": worker_reviewed,
                    "clientReviewed": client_reviewed,
                    "assignedEmployeeId": job.assignedEmployeeID.employeeID if job.assignedEmployeeID else None,
                    "assignedEmployeeName": job.assignedEmployeeID.name if job.assignedEmployeeID else None
                },
                "client": client_info,
                "assigned_employee": assigned_employee,
                "assigned_employees": assigned_employees,  # Multi-employee support
                "last_message": conv.lastMessageText,
                "last_message_time": conv.updatedAt.isoformat() if conv.updatedAt else None,
                "unread_count": unread_count,
                "is_archived": is_archived,
                "status": conv.status,
                "created_at": conv.createdAt.isoformat()
            })
        
        return Response({
            "success": True,
            "conversations": result,
            "total": len(result)
        })
        
    except Exception as e:
        print(f"❌ Error getting agency conversations: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Internal server error"}, status=500)


@router.get("/conversations/{conversation_id}/messages", auth=cookie_auth)
def get_agency_conversation_messages(request, conversation_id: int):
    """
    Get messages for a specific conversation.
    Marks messages as read for the agency.
    """
    try:
        from profiles.models import Conversation, Message
        from accounts.models import Profile
        from .models import AgencyKYC
        
        account = request.auth
        
        # Verify agency
        agency_kyc = AgencyKYC.objects.filter(accountFK=account).first()
        if not agency_kyc:
            return Response({"error": "Agency account not found"}, status=400)
        
        agency_profile = Profile.objects.filter(accountFK=account).first()
        
        # Get conversation
        conv = Conversation.objects.filter(
            conversationID=conversation_id
        ).select_related(
            'client__accountFK',
            'worker__accountFK',
            'relatedJobPosting',
            'relatedJobPosting__assignedEmployeeID'
        ).first()
        
        if not conv:
            return Response({"error": "Conversation not found"}, status=404)
        
        # Verify agency has access (via agency field on conversation)
        job = conv.relatedJobPosting
        from accounts.models import Agency
        agency = Agency.objects.filter(accountFK=account).first()
        has_access = (
            (conv.agency and conv.agency == agency) or
            (conv.worker and conv.worker == agency_profile) or 
            (job.assignedAgencyFK and job.assignedAgencyFK == agency)
        )
        
        if not has_access:
            return Response({"error": "Access denied"}, status=403)
        
        # Get messages
        messages = Message.objects.filter(
            conversationID=conv
        ).select_related('sender__accountFK', 'senderAgency').order_by('createdAt')
        
        # Mark messages as read (agency is worker side)
        Message.objects.filter(
            conversationID=conv,
            isRead=False
        ).exclude(sender=agency_profile).update(isRead=True)
        
        # Reset unread count
        conv.unreadCountWorker = 0
        conv.save(update_fields=['unreadCountWorker'])
        
        # Build response
        client_profile = conv.client
        client_info = {
            "name": f"{client_profile.firstName} {client_profile.lastName}".strip() or client_profile.accountFK.email,
            "avatar": client_profile.profileImg,
            "profile_type": "CLIENT",
            "location": client_profile.location if hasattr(client_profile, 'location') else None,
            "job_title": None
        }
        
        # Get assigned employee (legacy single employee)
        assigned_employee = None
        if job.assignedEmployeeID:
            emp = job.assignedEmployeeID
            assigned_employee = {
                "employeeId": emp.employeeID,
                "name": emp.name,
                "email": emp.email,
                "role": emp.role,
                "avatar": emp.avatar,
                "rating": float(emp.rating) if emp.rating else None,
                "totalJobsCompleted": emp.totalJobsCompleted,
                "totalEarnings": float(emp.totalEarnings) if emp.totalEarnings else 0,
                "employeeOfTheMonth": emp.employeeOfTheMonth,
                "rank": 0
            }
        
        # Get ALL assigned employees from M2M (multi-employee support)
        from accounts.models import JobEmployeeAssignment
        assigned_employees = []
        assignments = JobEmployeeAssignment.objects.filter(
            job=job,
            status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
        ).select_related('employee').order_by('-isPrimaryContact', 'assignedAt')
        
        for assignment in assignments:
            emp = assignment.employee
            assigned_employees.append({
                "employeeId": emp.employeeID,
                "name": emp.name,
                "email": emp.email,
                "role": emp.role,
                "avatar": emp.avatar,
                "rating": float(emp.rating) if emp.rating else None,
                "isPrimaryContact": assignment.isPrimaryContact,
                "status": assignment.status,
            })
        
        # Fallback: if no M2M assignments but legacy field is set
        if not assigned_employees and job.assignedEmployeeID:
            emp = job.assignedEmployeeID
            assigned_employees.append({
                "employeeId": emp.employeeID,
                "name": emp.name,
                "email": emp.email,
                "role": emp.role,
                "avatar": emp.avatar,
                "rating": float(emp.rating) if emp.rating else None,
                "isPrimaryContact": True,
                "status": "ASSIGNED",
            })
        
        # Check review status
        from accounts.models import JobReview
        worker_reviewed = JobReview.objects.filter(jobID=job, reviewerID=account).exists()
        client_reviewed = JobReview.objects.filter(jobID=job, reviewerID=client_profile.accountFK).exists()
        
        messages_list = []
        
        # Build base URL for media files from request
        # This ensures URLs work from any client (web on localhost, mobile on IP)
        scheme = request.scheme if hasattr(request, 'scheme') else 'http'
        host = request.get_host() if hasattr(request, 'get_host') else 'localhost:8000'
        base_url = f"{scheme}://{host}"
        
        for msg in messages:
            # Check if message is from agency (either via senderAgency or via agency_profile)
            is_mine = (msg.senderAgency and msg.senderAgency == agency) or (msg.sender and msg.sender == agency_profile)
            sent_by_agency = is_mine
            
            # Get sender name from either Profile or Agency
            sender_name = msg.get_sender_name() if hasattr(msg, 'get_sender_name') else (
                f"{msg.sender.firstName} {msg.sender.lastName}".strip() if msg.sender else 
                (msg.senderAgency.businessName if msg.senderAgency else "Unknown")
            )
            sender_avatar = msg.sender.profileImg if msg.sender else None
            
            # For IMAGE messages, get the image URL from attachment
            message_text = msg.messageText
            if msg.messageType == "IMAGE":
                from profiles.models import MessageAttachment
                attachment = MessageAttachment.objects.filter(messageID=msg).first()
                if attachment:
                    file_url = attachment.fileURL
                    # Convert relative URL to absolute if needed
                    if file_url and file_url.startswith('/'):
                        file_url = f"{base_url}{file_url}"
                    message_text = file_url
            
            messages_list.append({
                "message_id": msg.messageID,
                "sender_name": sender_name,
                "sender_avatar": sender_avatar,
                "message_text": message_text,
                "message_type": msg.messageType,
                "is_read": msg.isRead,
                "created_at": msg.createdAt.isoformat(),
                "is_mine": is_mine,
                "sent_by_agency": sent_by_agency
            })
        
        return Response({
            "conversation_id": conv.conversationID,
            "job": {
                "id": job.jobID,
                "title": job.title,
                "status": job.status,
                "budget": float(job.budget),
                "location": job.location,
                "clientConfirmedWorkStarted": job.clientConfirmedWorkStarted,
                "workerMarkedComplete": job.workerMarkedComplete,
                "clientMarkedComplete": job.clientMarkedComplete,
                "workerReviewed": worker_reviewed,
                "clientReviewed": client_reviewed,
                "assignedEmployeeId": job.assignedEmployeeID.employeeID if job.assignedEmployeeID else None,
                "assignedEmployeeName": job.assignedEmployeeID.name if job.assignedEmployeeID else None
            },
            "client": client_info,
            "assigned_employee": assigned_employee,
            "assigned_employees": assigned_employees,  # Multi-employee support
            "messages": messages_list,
            "total_messages": len(messages_list),
            "status": conv.status
        })
        
    except Exception as e:
        print(f"❌ Error getting conversation messages: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Internal server error"}, status=500)


@router.post("/conversations/{conversation_id}/send", auth=cookie_auth)
def send_agency_message(request, conversation_id: int, payload: schemas.AgencySendMessageSchema):
    """
    Send a message in a conversation on behalf of the agency.
    """
    try:
        from profiles.models import Conversation, Message
        from accounts.models import Profile, Agency
        from .models import AgencyKYC
        
        account = request.auth
        
        # Verify agency exists
        agency = Agency.objects.filter(accountFK=account).first()
        if not agency:
            return Response({"error": "Agency account not found"}, status=400)
        
        # Agency profile is optional (agency users may not have one)
        agency_profile = Profile.objects.filter(accountFK=account).first()
        
        # Get conversation
        conv = Conversation.objects.filter(
            conversationID=conversation_id
        ).select_related(
            'client__accountFK',
            'worker__accountFK',
            'agency',
            'relatedJobPosting',
            'relatedJobPosting__assignedAgencyFK'
        ).first()
        
        if not conv:
            return Response({"error": "Conversation not found"}, status=404)
        
        # Verify agency has access (via agency field on conversation)
        job = conv.relatedJobPosting
        has_access = (
            (conv.agency and conv.agency == agency) or
            (conv.worker and agency_profile and conv.worker == agency_profile) or 
            (job.assignedAgencyFK and job.assignedAgencyFK == agency)
        )
        
        if not has_access:
            return Response({"error": "Access denied"}, status=403)
        
        # Create message - use senderAgency for agency users without profile
        message = Message.objects.create(
            conversationID=conv,
            sender=agency_profile,  # May be None
            senderAgency=agency if not agency_profile else None,  # Use agency if no profile
            messageText=payload.message_text,
            messageType=payload.message_type,
            isRead=False
        )
        
        # Update conversation - Note: Message.save() already handles some of this
        conv.lastMessageText = payload.message_text[:100] if len(payload.message_text) > 100 else payload.message_text
        conv.lastMessageSender = agency_profile  # May be None for agency users
        conv.unreadCountClient += 1  # Increment client's unread
        conv.save(update_fields=['lastMessageText', 'lastMessageSender', 'unreadCountClient', 'updatedAt'])
        
        # Get sender name
        sender_name = agency.businessName
        if agency_profile:
            sender_name = f"{agency_profile.firstName} {agency_profile.lastName}".strip() or agency.businessName
        
        # Send WebSocket notification (if available)
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"chat_{conv.conversationID}",
                    {
                        "type": "chat_message",
                        "message": {
                            "conversation_id": conv.conversationID,
                            "message_id": message.messageID,
                            "sender_name": sender_name,
                            "sender_avatar": agency_profile.profileImg if agency_profile else None,
                            "message": message.messageText,
                            "type": message.messageType,
                            "created_at": message.createdAt.isoformat(),
                            "is_mine": False
                        }
                    }
                )
        except Exception as ws_error:
            print(f"⚠️ WebSocket notification failed: {ws_error}")
        
        return Response({
            "success": True,
            "message": {
                "message_id": message.messageID,
                "sender_name": sender_name,
                "sender_avatar": agency_profile.profileImg if agency_profile else None,
                "message_text": message.messageText,
                "message_type": message.messageType,
                "is_read": False,
                "created_at": message.createdAt.isoformat(),
                "is_mine": True,
                "sent_by_agency": True
            }
        })
        
    except Exception as e:
        print(f"❌ Error sending message: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Internal server error"}, status=500)


@router.post("/conversations/{conversation_id}/upload-image", auth=cookie_auth)
def upload_agency_chat_image(request, conversation_id: int):
    """
    Upload an image to an agency chat conversation.
    Creates a new IMAGE type message with the uploaded image URL.
    
    Args:
        conversation_id: ID of the conversation
        image: Image file (JPEG, PNG, JPG, max 5MB) from request.FILES
    
    Returns:
        success: bool
        message_id: int
        image_url: string
        uploaded_at: datetime
    """
    try:
        from django.conf import settings
        from django.utils import timezone
        from ninja import File, UploadedFile
        from profiles.models import Conversation, Message, MessageAttachment
        from accounts.models import Profile, Agency
        import os
        
        account = request.auth
        
        # Verify agency - get Agency directly from account
        try:
            agency = Agency.objects.get(accountFK=account)
        except Agency.DoesNotExist:
            return Response({"error": "Agency account not found"}, status=400)
        
        agency_profile = Profile.objects.filter(accountFK=account).first()
        
        # Get image from request.FILES
        image = request.FILES.get('image')
        if not image:
            return Response({"error": "No image file provided"}, status=400)
        
        # Get the conversation
        try:
            conversation = Conversation.objects.select_related(
                'client',
                'agency',
                'worker__accountFK',
                'relatedJobPosting',
                'relatedJobPosting__assignedAgencyFK'
            ).get(conversationID=conversation_id)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=404)
        
        # Verify agency has access (same logic as send_message)
        job = conversation.relatedJobPosting
        has_access = (
            (conversation.agency and conversation.agency == agency) or
            (conversation.worker and agency_profile and conversation.worker == agency_profile) or 
            (job and job.assignedAgencyFK and job.assignedAgencyFK == agency)
        )
        
        if not has_access:
            return Response(
                {"error": "You are not authorized to access this conversation"},
                status=403
            )
        
        # Validate file size (5MB max)
        if image.size > 5 * 1024 * 1024:
            return Response({"error": "Image size must be less than 5MB"}, status=400)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if image.content_type not in allowed_types:
            return Response(
                {"error": "Invalid file type. Allowed: JPEG, PNG, JPG, WEBP"},
                status=400
            )
        
        # Check if storage is configured
        if not settings.STORAGE:
            return Response({"error": "File storage not configured"}, status=500)
        
        # Generate unique filename
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        file_extension = os.path.splitext(image.name)[1] if image.name else '.jpg'
        filename = f"agency_message_{timestamp}_{agency.agencyId}{file_extension}"
        
        # Storage path
        storage_path = f"chat/conversation_{conversation_id}/images/{filename}"
        
        try:
            # Read file content
            file_content = image.read()
            
            # Upload using unified STORAGE adapter
            upload_response = settings.STORAGE.storage().from_('iayos_files').upload(
                storage_path,
                file_content,
                {"upsert": "true"}
            )
            
            # Check for upload error
            if isinstance(upload_response, dict) and 'error' in upload_response:
                raise Exception(f"Upload failed: {upload_response['error']}")
            
            # Get public URL (relative for local storage)
            # Get signed URL for private bucket (24 hour expiry)
            signed_url_response = settings.STORAGE.storage().from_('iayos_files').create_signed_url(
                storage_path, 
                expires_in=86400  # 24 hours
            )
            if signed_url_response.get('error'):
                raise Exception(f"Failed to create signed URL: {signed_url_response['error']}")
            public_url = signed_url_response.get('signedURL')
            
            # Create IMAGE type message (from agency)
            message = Message.objects.create(
                conversationID=conversation,
                sender=None,  # Agency messages have no Profile sender
                senderAgency=agency,
                messageText="",  # Empty text for image messages
                messageType="IMAGE"
            )
            
            # Create message attachment record
            MessageAttachment.objects.create(
                messageID=message,
                fileURL=public_url,
                fileType="IMAGE"
            )
            
            # Build full URL for response
            scheme = request.scheme if hasattr(request, 'scheme') else 'http'
            host = request.get_host() if hasattr(request, 'get_host') else 'localhost:8000'
            base_url = f"{scheme}://{host}"
            full_url = f"{base_url}{public_url}" if public_url.startswith('/') else public_url
            
            print(f"✅ Agency chat image uploaded: {full_url}")
            
            # Send WebSocket notification
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f"chat_{conversation.conversationID}",
                        {
                            "type": "chat_message",
                            "message": {
                                "conversation_id": conversation.conversationID,
                                "message_id": message.messageID,
                                "sender_name": agency.businessName,
                                "sender_avatar": None,
                                "message": "",
                                "type": "IMAGE",
                                "image_url": full_url,
                                "created_at": message.createdAt.isoformat(),
                                "is_mine": False
                            }
                        }
                    )
            except Exception as ws_error:
                print(f"⚠️ WebSocket notification failed: {ws_error}")
            
            return {
                "success": True,
                "message_id": message.messageID,
                "image_url": full_url,
                "uploaded_at": message.createdAt.isoformat(),
                "conversation_id": conversation_id
            }
            
        except Exception as upload_error:
            print(f"❌ Agency image upload error: {str(upload_error)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to upload image: {str(upload_error)}"},
                status=500
            )
    
    except Exception as e:
        print(f"❌ Error in agency chat image upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Internal server error"}, status=500)


@router.post("/conversations/{conversation_id}/toggle-archive", auth=cookie_auth)
def toggle_agency_archive(request, conversation_id: int):
    """Toggle archive status for a conversation."""
    try:
        from profiles.models import Conversation
        from accounts.models import Profile
        from .models import AgencyKYC
        
        account = request.auth
        
        # Verify agency
        agency_kyc = AgencyKYC.objects.filter(accountFK=account).first()
        if not agency_kyc:
            return Response({"error": "Agency account not found"}, status=400)
        
        agency_profile = Profile.objects.filter(accountFK=account).first()
        
        # Get conversation
        conv = Conversation.objects.filter(conversationID=conversation_id).first()
        if not conv:
            return Response({"error": "Conversation not found"}, status=404)
        
        # Toggle archive (agency is worker side)
        conv.archivedByWorker = not conv.archivedByWorker
        conv.save(update_fields=['archivedByWorker'])
        
        return Response({
            "success": True,
            "is_archived": conv.archivedByWorker,
            "message": "Conversation archived" if conv.archivedByWorker else "Conversation unarchived"
        })
        
    except Exception as e:
        print(f"❌ Error toggling archive: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


# ============================================
# AGENCY PAYMENT METHODS MANAGEMENT
# ============================================

@router.get("/payment-methods", auth=cookie_auth)
def get_agency_payment_methods(request):
    """Get agency's verified payment methods for withdrawals"""
    try:
        from accounts.models import UserPaymentMethod
        from .models import AgencyKYC
        
        account = request.auth
        
        # Verify this is an agency account
        agency = AgencyKYC.objects.filter(accountFK=account).first()
        if not agency:
            return Response({"error": "Agency account not found"}, status=400)
        
        # Only show verified payment methods
        # Unverified methods are pending verification or were canceled
        methods = UserPaymentMethod.objects.filter(
            accountFK=account,
            isVerified=True
        )
        
        payment_methods = []
        for method in methods:
            payment_methods.append({
                'id': method.id,
                'type': method.methodType,
                'account_name': method.accountName,
                'account_number': method.accountNumber,
                'bank_name': method.bankName,
                'is_primary': method.isPrimary,
                'is_verified': method.isVerified,
                'created_at': method.createdAt.isoformat() if method.createdAt else None
            })
        
        return {
            'payment_methods': payment_methods
        }
    except Exception as e:
        print(f"❌ Get agency payment methods error: {str(e)}")
        return Response(
            {"error": "Failed to fetch payment methods"},
            status=500
        )


@router.post("/payment-methods", auth=cookie_auth)
def add_agency_payment_method(request):
    """
    Add a new GCash payment method with PayMongo verification.
    
    Flow:
    1. Agency submits GCash account details
    2. We create a ₱1 verification checkout via PayMongo
    3. User pays ₱1 using their GCash account
    4. PayMongo webhook confirms payment + verifies account
    5. ₱1 is credited to wallet as bonus
    6. Payment method is marked as verified
    """
    try:
        from accounts.models import UserPaymentMethod
        from accounts.paymongo_service import PayMongoService
        from .models import AgencyKYC
        from django.db import transaction as db_transaction
        from django.conf import settings
        import json
        
        account = request.auth
        
        # Verify this is an agency account
        agency = AgencyKYC.objects.filter(accountFK=account).first()
        if not agency:
            return Response({"error": "Agency account not found"}, status=400)
        
        # Parse request body
        try:
            data = json.loads(request.body)
        except:
            return Response({"error": "Invalid JSON body"}, status=400)
        
        account_name = data.get('account_name', '').strip()
        account_number = data.get('account_number', '').strip()
        method_type = data.get('type', 'GCASH')
        
        # For now, only GCash is supported
        if method_type != 'GCASH':
            return Response(
                {"error": "Invalid payment method type. Only GCash is supported."},
                status=400
            )
        
        # Validate required fields
        if not account_name or not account_number:
            return Response(
                {"error": "Account name and number are required"},
                status=400
            )
        
        # Validate and clean GCash number format
        clean_number = account_number.replace(' ', '').replace('-', '')
        if not clean_number.startswith('09') or len(clean_number) != 11:
            return Response(
                {"error": "Invalid GCash number format (must be 11 digits starting with 09)"},
                status=400
            )
        
        # Check for duplicate GCash number
        existing = UserPaymentMethod.objects.filter(
            accountFK=account,
            accountNumber=clean_number
        ).first()
        
        if existing:
            if existing.isVerified:
                return Response(
                    {"error": "This GCash number is already verified on your account"},
                    status=400
                )
            else:
                # Delete unverified duplicate and create new
                existing.delete()
        
        with db_transaction.atomic():
            # Check if this is the first payment method
            has_existing = UserPaymentMethod.objects.filter(accountFK=account).exists()
            is_first = not has_existing
            
            # Create payment method in PENDING state
            method = UserPaymentMethod.objects.create(
                accountFK=account,
                methodType='GCASH',
                accountName=account_name,
                accountNumber=clean_number,
                bankName=None,
                isPrimary=is_first,
                isVerified=False  # Will be verified after PayMongo checkout
            )
            
            print(f"📱 Agency payment method created (pending verification): {method.id} for {account.email}")
        
        # Create PayMongo verification checkout
        paymongo = PayMongoService()
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        result = paymongo.create_verification_checkout(
            user_email=account.email,
            user_name=account_name,
            payment_method_id=method.id,
            account_number=clean_number,
            success_url=f"{frontend_url}/agency/profile?verify=success&method_id={method.id}",
            failure_url=f"{frontend_url}/agency/profile?verify=failed&method_id={method.id}"
        )
        
        if not result.get("success"):
            # Cleanup the pending method if checkout creation failed
            method.delete()
            return Response(
                {"error": result.get("error", "Failed to create verification checkout")},
                status=500
            )
        
        print(f"✅ Verification checkout created for agency method {method.id}: {result.get('checkout_id')}")
        
        return {
            'success': True,
            'message': 'Please complete GCash verification to activate this payment method',
            'method_id': method.id,
            'verification_required': True,
            'checkout_url': result.get('checkout_url'),
            'checkout_id': result.get('checkout_id'),
            'verification_amount': 1.00,
            'note': 'The ₱1 verification fee will be credited to your wallet after successful verification'
        }
        
    except Exception as e:
        print(f"❌ Add agency payment method error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to add payment method"},
            status=500
        )


@router.delete("/payment-methods/{method_id}", auth=cookie_auth)
def delete_agency_payment_method(request, method_id: int):
    """Delete an agency payment method"""
    try:
        from accounts.models import UserPaymentMethod
        from .models import AgencyKYC
        from django.db import transaction as db_transaction
        
        account = request.auth
        
        # Verify this is an agency account
        agency = AgencyKYC.objects.filter(accountFK=account).first()
        if not agency:
            return Response({"error": "Agency account not found"}, status=400)
        
        method = UserPaymentMethod.objects.filter(
            id=method_id,
            accountFK=account
        ).first()
        
        if not method:
            return Response(
                {"error": "Payment method not found"},
                status=404
            )
        
        was_primary = method.isPrimary
        
        with db_transaction.atomic():
            method.delete()
            
            # If deleted method was primary, set another method as primary
            if was_primary:
                next_method = UserPaymentMethod.objects.filter(
                    accountFK=account
                ).first()
                
                if next_method:
                    next_method.isPrimary = True
                    next_method.save()
                    print(f"✅ Set new primary payment method: {next_method.id}")
        
        print(f"✅ Agency payment method deleted: {method_id} for {account.email}")
        
        return {
            'success': True,
            'message': 'Payment method removed successfully'
        }
    except Exception as e:
        print(f"❌ Delete agency payment method error: {str(e)}")
        return Response(
            {"error": "Failed to remove payment method"},
            status=500
        )


@router.post("/payment-methods/{method_id}/set-primary", auth=cookie_auth)
def set_primary_agency_payment_method(request, method_id: int):
    """Set an agency payment method as primary"""
    try:
        from accounts.models import UserPaymentMethod
        from .models import AgencyKYC
        from django.db import transaction as db_transaction
        
        account = request.auth
        
        # Verify this is an agency account
        agency = AgencyKYC.objects.filter(accountFK=account).first()
        if not agency:
            return Response({"error": "Agency account not found"}, status=400)
        
        method = UserPaymentMethod.objects.filter(
            id=method_id,
            accountFK=account
        ).first()
        
        if not method:
            return Response(
                {"error": "Payment method not found"},
                status=404
            )
        
        with db_transaction.atomic():
            # Remove primary from all other methods
            UserPaymentMethod.objects.filter(
                accountFK=account
            ).update(isPrimary=False)
            
            # Set this method as primary
            method.isPrimary = True
            method.save()
        
        print(f"✅ Set primary agency payment method: {method_id} for {account.email}")
        
        return {
            'success': True,
            'message': 'Primary payment method updated'
        }
    except Exception as e:
        print(f"❌ Set primary agency payment method error: {str(e)}")
        return Response(
            {"error": "Failed to update primary payment method"},
            status=500
        )


# ============================================
# AGENCY WALLET WITHDRAWAL (with Xendit)
# ============================================

@router.post("/wallet/withdraw", auth=cookie_auth)
def agency_withdraw_funds(request):
    """
    Withdraw funds from agency wallet to GCash via Xendit Disbursement.
    Requires a saved payment method (GCash account).
    Deducts balance immediately and creates Xendit disbursement request.
    """
    try:
        from accounts.models import Wallet, Transaction, UserPaymentMethod
        from .models import AgencyKYC
        from decimal import Decimal
        from django.utils import timezone
        from django.db import transaction as db_transaction
        import json
        
        account = request.auth
        
        # Verify this is an agency account
        agency = AgencyKYC.objects.filter(accountFK=account).first()
        if not agency:
            return Response({"error": "Agency account not found"}, status=400)
        
        # Parse request body
        try:
            data = json.loads(request.body)
        except:
            return Response({"error": "Invalid JSON body"}, status=400)
        
        amount = data.get('amount', 0)
        payment_method_id = data.get('payment_method_id')
        notes = data.get('notes', '')
        
        print(f"💸 [Agency] Withdraw request: ₱{amount} to payment method {payment_method_id} from {account.email}")
        
        # Validate amount
        if not amount or amount <= 0:
            return Response(
                {"error": "Amount must be greater than 0"},
                status=400
            )
        
        # Minimum withdrawal of ₱100
        if amount < 100:
            return Response(
                {"error": "Minimum withdrawal amount is ₱100"},
                status=400
            )
        
        # BLOCKER: Require payment method
        if not payment_method_id:
            return Response(
                {"error": "Payment method is required. Please add a GCash account first."},
                status=400
            )
        
        # Get wallet
        try:
            wallet = Wallet.objects.get(accountFK=account)
        except Wallet.DoesNotExist:
            return Response(
                {"error": "Wallet not found"},
                status=404
            )
        
        # Check sufficient balance
        if wallet.balance < Decimal(str(amount)):
            return Response(
                {"error": f"Insufficient balance. Available: ₱{wallet.balance}"},
                status=400
            )
        
        # Get payment method and validate ownership
        try:
            payment_method = UserPaymentMethod.objects.get(
                id=payment_method_id,
                accountFK=account
            )
        except UserPaymentMethod.DoesNotExist:
            return Response(
                {"error": "Payment method not found. Please add a GCash account."},
                status=404
            )
        
        # Only GCash supported for now
        if payment_method.methodType != 'GCASH':
            return Response(
                {"error": "Only GCash withdrawals are currently supported"},
                status=400
            )
        
        # Get agency business name from Agency model (not AgencyKYC)
        from accounts.models import Agency as AgencyModel
        agency_profile = AgencyModel.objects.filter(accountFK=account).first()
        business_name = (agency_profile.businessName if agency_profile else None) or account.email.split('@')[0]
        
        print(f"💰 Agency balance: ₱{wallet.balance}")
        
        # Use atomic transaction to ensure consistency
        with db_transaction.atomic():
            # Deduct balance immediately
            old_balance = wallet.balance
            wallet.balance -= Decimal(str(amount))
            wallet.save()
            
            # Create pending withdrawal transaction
            transaction = Transaction.objects.create(
                walletID=wallet,
                transactionType='WITHDRAWAL',
                amount=Decimal(str(amount)),
                balanceAfter=wallet.balance,
                status='PENDING',
                description=f"Withdrawal to GCash - {payment_method.accountNumber}",
                paymentMethod="GCASH"
            )
            
            print(f"✅ New balance: ₱{wallet.balance}")
            print(f"📤 Creating disbursement via payment provider...")
            
            # Create disbursement using configured payment provider
            from accounts.payment_provider import get_payment_provider
            payment_provider = get_payment_provider()
            provider_name = payment_provider.provider_name
            
            disbursement_result = payment_provider.create_disbursement(
                amount=amount,
                currency="PHP",
                recipient_name=payment_method.accountName,
                account_number=payment_method.accountNumber,
                channel_code="GCASH",
                transaction_id=transaction.transactionID,
                description=notes or f"Agency withdrawal - {business_name} - ₱{amount}",
                metadata={"agency_name": business_name}
            )
            
            if not disbursement_result.get("success"):
                # Rollback balance deduction
                wallet.balance = old_balance
                wallet.save()
                transaction.delete()
                
                print(f"❌ {provider_name.upper()} disbursement failed: {disbursement_result.get('error')}")
                return Response(
                    {"error": f"Failed to process withdrawal: {disbursement_result.get('error', 'Payment provider error')}"},
                    status=500
                )
            
            # Update transaction with disbursement details
            transaction.xenditInvoiceID = disbursement_result.get('disbursement_id', '')
            transaction.xenditExternalID = disbursement_result.get('external_id', '')
            transaction.xenditPaymentChannel = "GCASH"
            transaction.xenditPaymentMethod = provider_name.upper()
            
            # Mark as completed if disbursement is successful
            if disbursement_result.get('status') in ['COMPLETED', 'completed']:
                transaction.status = 'COMPLETED'
                transaction.completedAt = timezone.now()
            
            transaction.save()
            
            print(f"📄 {provider_name.upper()} disbursement created: {disbursement_result.get('disbursement_id')}")
            print(f"📊 Status: {disbursement_result.get('status')}")
            if disbursement_result.get('invoice_url'):
                print(f"🔗 Invoice URL: {disbursement_result.get('invoice_url')}")
        
        # Build response with invoice URL for test mode
        response_data = {
            "success": True,
            "transaction_id": transaction.transactionID,
            "disbursement_id": disbursement_result.get('disbursement_id'),
            "amount": amount,
            "new_balance": float(wallet.balance),
            "status": disbursement_result.get('status', 'PENDING'),
            "recipient": payment_method.accountNumber,
            "recipient_name": payment_method.accountName,
            "message": "Withdrawal request submitted successfully. Funds will be transferred to your GCash within 1-3 business days."
        }
        
        # Include invoice URL for test mode (allows user to see/pay the test invoice)
        if disbursement_result.get('invoice_url'):
            response_data['invoice_url'] = disbursement_result.get('invoice_url')
            response_data['test_mode'] = disbursement_result.get('test_mode', False)
            if disbursement_result.get('test_mode'):
                response_data['message'] = "TEST MODE: Withdrawal invoice created. In production, funds would be sent directly to your GCash."
        
        return response_data
        
    except Exception as e:
        print(f"❌ [Agency] Error withdrawing funds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to process withdrawal"},
            status=500
        )


@router.get("/reviews", auth=cookie_auth, response=schemas.AgencyReviewsListResponse)
def get_agency_reviews_endpoint(request, page: int = 1, limit: int = 10, review_type: str = None):
    """
    Get reviews for the authenticated agency.
    
    GET /api/agency/reviews
    Query params:
        - page: int (default 1)
        - limit: int (default 10, max 50)
        - review_type: str (optional) - 'AGENCY', 'EMPLOYEE', or None for all
    
    Returns reviews for both the agency and its employees.
    """
    try:
        # Validate pagination
        if page < 1:
            page = 1
        if limit < 1:
            limit = 10
        if limit > 50:
            limit = 50
        
        # Validate review_type
        if review_type and review_type not in ['AGENCY', 'EMPLOYEE']:
            review_type = None
        
        result = services.get_agency_reviews(
            account_id=request.auth.accountID,
            page=page,
            limit=limit,
            review_type=review_type
        )
        return result
    
    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error fetching agency reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


# =============================================================================
# AGENCY SUPPORT TICKETS
# =============================================================================

@router.post("/support/ticket", auth=cookie_auth)
def create_agency_support_ticket(request):
    """
    Create a new support ticket from agency portal.
    
    Request JSON:
    - subject: str (required)
    - category: str (kyc, employees, payments, jobs, account, other)
    - description: str (required, min 20 chars)
    - contact_email: str (optional)
    """
    try:
        from accounts.models import Agency
        from adminpanel.models import SupportTicket, SupportTicketReply
        from django.utils import timezone
        import json
        
        user = request.auth
        
        # Get agency for this user
        try:
            agency = Agency.objects.get(accountFK=user)
        except Agency.DoesNotExist:
            return Response({'success': False, 'error': 'Agency not found for this account'}, status=404)
        
        # Parse request body
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'success': False, 'error': 'Invalid JSON'}, status=400)
        
        subject = body.get('subject', '').strip()
        category = body.get('category', 'general').strip()
        description = body.get('description', '').strip()
        contact_email = body.get('contact_email', '').strip()
        
        # Validation
        if not subject:
            return Response({'success': False, 'error': 'Subject is required'}, status=400)
        if len(subject) > 200:
            return Response({'success': False, 'error': 'Subject must be 200 characters or less'}, status=400)
        if not description:
            return Response({'success': False, 'error': 'Description is required'}, status=400)
        if len(description) < 20:
            return Response({'success': False, 'error': 'Description must be at least 20 characters'}, status=400)
        
        # Map frontend categories to backend categories
        category_map = {
            'kyc': 'kyc',
            'employees': 'employees',
            'payments': 'payment',
            'jobs': 'jobs',
            'account': 'account',
            'other': 'general',
            'general': 'general',
        }
        db_category = category_map.get(category, 'general')
        
        # Create ticket with agency context
        ticket = SupportTicket.objects.create(
            userFK=user,
            agencyFK=agency,
            ticketType='agency',
            subject=subject,
            category=db_category,
            priority='medium',
            status='open',
            platform='agency_portal',
        )
        
        # Create initial reply with description
        SupportTicketReply.objects.create(
            ticketFK=ticket,
            senderFK=user,
            content=description,
        )
        
        ticket.lastReplyAt = timezone.now()
        ticket.save()
        
        logger.info(f"✅ Agency support ticket #{ticket.ticketID} created by agency {agency.agencyID}")
        
        return {
            'success': True,
            'ticket_id': str(ticket.ticketID),
            'message': 'Support ticket submitted successfully',
        }
        
    except Exception as e:
        logger.error(f"❌ Error creating agency support ticket: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'success': False, 'error': 'Internal server error'}, status=500)


@router.get("/support/tickets", auth=cookie_auth)
def get_agency_support_tickets(request, page: int = 1, limit: int = 20, status: str = None):
    """
    Get list of support tickets submitted by this agency.
    """
    try:
        from accounts.models import Agency
        from adminpanel.models import SupportTicket
        
        user = request.auth
        
        # Get agency for this user
        try:
            agency = Agency.objects.get(accountFK=user)
        except Agency.DoesNotExist:
            return Response({'success': False, 'error': 'Agency not found'}, status=404)
        
        # Query tickets for this agency
        queryset = SupportTicket.objects.filter(agencyFK=agency).order_by('-createdAt')
        
        if status and status != 'all':
            queryset = queryset.filter(status=status)
        
        total = queryset.count()
        total_pages = (total + limit - 1) // limit
        
        offset = (page - 1) * limit
        tickets = queryset[offset:offset + limit]
        
        return {
            'success': True,
            'tickets': [
                {
                    'id': str(t.ticketID),
                    'subject': t.subject,
                    'category': t.category,
                    'priority': t.priority,
                    'status': t.status,
                    'created_at': t.createdAt.isoformat(),
                    'last_reply_at': t.lastReplyAt.isoformat() if t.lastReplyAt else t.createdAt.isoformat(),
                    'reply_count': t.reply_count,
                }
                for t in tickets
            ],
            'total': total,
            'page': page,
            'total_pages': total_pages,
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching agency tickets: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'success': False, 'error': 'Internal server error'}, status=500)


@router.get("/support/tickets/{ticket_id}", auth=cookie_auth)
def get_agency_ticket_detail(request, ticket_id: int):
    """
    Get detailed view of a support ticket including all replies.
    """
    try:
        from accounts.models import Agency
        from adminpanel.models import SupportTicket
        
        user = request.auth
        
        # Get agency for this user
        try:
            agency = Agency.objects.get(accountFK=user)
        except Agency.DoesNotExist:
            return Response({'success': False, 'error': 'Agency not found'}, status=404)
        
        # Get ticket and verify ownership
        try:
            ticket = SupportTicket.objects.select_related('assignedTo').get(ticketID=ticket_id, agencyFK=agency)
        except SupportTicket.DoesNotExist:
            return Response({'success': False, 'error': 'Ticket not found'}, status=404)
        
        replies = ticket.replies.select_related('senderFK').all().order_by('createdAt')
        
        return {
            'success': True,
            'ticket': {
                'id': str(ticket.ticketID),
                'subject': ticket.subject,
                'category': ticket.category,
                'priority': ticket.priority,
                'status': ticket.status,
                'assigned_to_name': ticket.assignedTo.email.split('@')[0] if ticket.assignedTo else None,
                'created_at': ticket.createdAt.isoformat(),
                'updated_at': ticket.updatedAt.isoformat(),
                'last_reply_at': ticket.lastReplyAt.isoformat() if ticket.lastReplyAt else None,
                'resolved_at': ticket.resolvedAt.isoformat() if ticket.resolvedAt else None,
            },
            'messages': [
                {
                    'id': str(r.replyID),
                    'sender_name': r.senderFK.email.split('@')[0] if r.senderFK else 'Unknown',
                    'is_admin': r.senderFK_id != user.accountID if r.senderFK else False,
                    'content': r.content,
                    'is_system_message': r.isSystemMessage,
                    'created_at': r.createdAt.isoformat(),
                }
                for r in replies
            ],
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching ticket detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'success': False, 'error': 'Internal server error'}, status=500)


@router.post("/support/tickets/{ticket_id}/reply", auth=cookie_auth)
def reply_to_agency_ticket(request, ticket_id: int):
    """
    Add a reply to an existing support ticket.
    """
    try:
        from accounts.models import Agency
        from adminpanel.models import SupportTicket, SupportTicketReply
        from django.utils import timezone
        import json
        
        user = request.auth
        
        # Get agency for this user
        try:
            agency = Agency.objects.get(accountFK=user)
        except Agency.DoesNotExist:
            return Response({'success': False, 'error': 'Agency not found'}, status=404)
        
        # Get ticket and verify ownership
        try:
            ticket = SupportTicket.objects.get(ticketID=ticket_id, agencyFK=agency)
        except SupportTicket.DoesNotExist:
            return Response({'success': False, 'error': 'Ticket not found'}, status=404)
        
        # Check if ticket is closed
        if ticket.status == 'closed':
            return Response({'success': False, 'error': 'Cannot reply to a closed ticket'}, status=400)
        
        # Parse request body
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'success': False, 'error': 'Invalid JSON'}, status=400)
        
        content = body.get('content', '').strip()
        
        if not content:
            return Response({'success': False, 'error': 'Reply content is required'}, status=400)
        if len(content) < 5:
            return Response({'success': False, 'error': 'Reply must be at least 5 characters'}, status=400)
        
        # Create reply
        reply = SupportTicketReply.objects.create(
            ticketFK=ticket,
            senderFK=user,
            content=content,
        )
        
        # Update ticket
        ticket.lastReplyAt = timezone.now()
        # If ticket was waiting_user, set back to open
        if ticket.status == 'waiting_user':
            ticket.status = 'open'
        ticket.save()
        
        logger.info(f"✅ Reply added to ticket #{ticket_id} by agency")
        
        return {
            'success': True,
            'reply_id': str(reply.replyID),
            'message': 'Reply sent successfully',
        }
        
    except Exception as e:
        logger.error(f"❌ Error replying to ticket: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'success': False, 'error': 'Internal server error'}, status=500)

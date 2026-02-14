"""
Fast upload service for agency KYC - skips AI validation.

This service ONLY uploads files to Supabase and saves to database.
AI validation already happened in per-step validation endpoint.
"""

from .models import AgencyKYC, AgencyKycFile
from accounts.models import Accounts, Notification
from iayos_project.utils import upload_agency_doc, delete_storage_file
from django.utils import timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid
import os
import re


def upload_agency_kyc_fast(payload, business_permit, rep_front, rep_back, address_proof, auth_letter, rep_selfie=None):
    """
    FAST upload for agency KYC - skips AI validation (already done per-step).
    
    Uses cached validation results from Redis to avoid re-processing.
    Uploads files in parallel to Supabase for faster completion.
    
    Response time: ~5-10 seconds (vs 25-45s with AI validation)
    """
    try:
        print(f"🚀 [FAST UPLOAD] Starting optimized KYC upload for accountID: {payload.accountID}")
        user = Accounts.objects.get(accountID=payload.accountID)

        files_map = {
            'BUSINESS_PERMIT': business_permit,
            'REP_ID_FRONT': rep_front,
            'REP_ID_BACK': rep_back,
            'REP_SELFIE': rep_selfie,
            'ADDRESS_PROOF': address_proof,
            'AUTH_LETTER': auth_letter,
        }
        
        # Log which files were received
        received_files = [key for key, file in files_map.items() if file]
        print(f"📎 Files received: {', '.join(received_files) if received_files else 'NONE'}")

        allowed_mime_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        max_size = 15 * 1024 * 1024  # 15 MB

        # Get or create AgencyKYC
        kyc_record, created = AgencyKYC.objects.get_or_create(
            accountFK=user,
            defaults={'status': 'PENDING', 'notes': ''}
        )

        # Save business_type from payload
        business_type = getattr(payload, 'business_type', None)
        if business_type:
            print(f"💼 Business type: {business_type}")

        if not created:
            # Remove previous files and reset status
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
            
            # Delete old files from Supabase
            old_files = AgencyKycFile.objects.filter(agencyKyc=kyc_record)
            old_files_count = old_files.count()
            deleted_count = 0
            for f in old_files:
                if f.fileURL:
                    file_path = extract_file_path_for_delete(f.fileURL)
                    if file_path:
                        if delete_storage_file("agency", file_path):
                            deleted_count += 1
            
            AgencyKycFile.objects.filter(agencyKyc=kyc_record).delete()
            kyc_record.status = 'PENDING'
            kyc_record.notes = 'Re-submitted'
            kyc_record.resubmissionCount = kyc_record.resubmissionCount + 1
            kyc_record.save()
            print(f"♻️ Reset to PENDING (resubmission #{kyc_record.resubmissionCount}), deleted {deleted_count}/{old_files_count} old files")

        uploaded_files = []
        file_hashes = getattr(payload, 'file_hashes', {})
        
        # ============================================
        # PARALLEL FILE UPLOAD TO SUPABASE
        # ============================================
        print(f"⚡ Uploading {len(received_files)} files in parallel...")
        
        def upload_single_file(key, file):
            """Upload a single file and return result."""
            try:
                # Basic validation
                if file.content_type not in allowed_mime_types:
                    raise ValueError(f"{key}: Invalid file type")
                if file.size > max_size:
                    raise ValueError(f"{key}: File too large (max 15MB)")
                
                ext = os.path.splitext(file.name)[1]
                unique_name = f"{key.lower()}_{uuid.uuid4().hex}{ext}"
                
                # Upload to Supabase
                file_url = upload_agency_doc(file=file, file_name=unique_name, user_id=user.accountID)
                
                if not file_url:
                    raise ValueError(f"Failed to upload {key}")
                
                print(f"✅ Uploaded {key}: {file_url}")
                
                # Get cached validation result from Redis
                from .validation_cache import get_cached_validation, generate_file_hash
                
                file_hash = file_hashes.get(key)
                cached_validation = None
                
                if file_hash:
                    cached_validation = get_cached_validation(file_hash, key)
                else:
                    # Fallback: generate hash from file data if not provided
                    file.seek(0)
                    file_data = file.read()
                    file.seek(0)
                    file_hash = generate_file_hash(file_data)
                    cached_validation = get_cached_validation(file_hash, key)
                
                # Extract validation results from cache (or use defaults)
                ai_status = 'PENDING'
                ai_rejection_reason = None
                ai_rejection_message = None
                face_detected = None
                face_count = None
                face_confidence = None
                ocr_text = None
                ocr_confidence = None
                quality_score = None
                ai_confidence_score = None
                ai_warnings = []
                ai_details = {}
                verified_at = timezone.now()
                
                if cached_validation:
                    print(f"✅ [CACHE] Using validation for {key}")
                    ai_status = cached_validation.get('ai_status', 'PENDING')
                    face_detected = cached_validation.get('face_detected')
                    face_count = cached_validation.get('face_count')
                    face_confidence = cached_validation.get('face_confidence')
                    ocr_text = cached_validation.get('ocr_text')
                    ocr_confidence = cached_validation.get('ocr_confidence')
                    quality_score = cached_validation.get('quality_score')
                    ai_confidence_score = cached_validation.get('ai_confidence_score')
                    ai_warnings = cached_validation.get('ai_warnings', [])
                    ai_details = cached_validation.get('ai_details', {})
                    ai_rejection_reason = cached_validation.get('ai_rejection_reason')
                    ai_rejection_message = cached_validation.get('ai_rejection_message')
                else:
                    print(f"⚠️ No cached validation for {key}, using PENDING status")
                    # For PDFs, skip validation
                    if file.content_type == 'application/pdf':
                        ai_status = 'SKIPPED'
                        ai_details = {'reason': 'PDF file - validation not applicable'}
                
                return {
                    'key': key,
                    'file_url': file_url,
                    'unique_name': unique_name,
                    'file_size': file.size,
                    'ai_status': ai_status,
                    'face_detected': face_detected,
                    'face_count': face_count,
                    'face_confidence': face_confidence,
                    'ocr_text': ocr_text,
                    'ocr_confidence': ocr_confidence,
                    'quality_score': quality_score,
                    'ai_confidence_score': ai_confidence_score,
                    'ai_rejection_reason': ai_rejection_reason,
                    'ai_rejection_message': ai_rejection_message,
                    'ai_warnings': ai_warnings,
                    'ai_details': ai_details,
                    'verified_at': verified_at,
                }
                
            except Exception as e:
                print(f"❌ Upload failed for {key}: {str(e)}")
                raise
        
        # Upload files in parallel using ThreadPoolExecutor
        upload_results = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_key = {executor.submit(upload_single_file, key, file): key for key, file in files_map.items() if file}
            
            for future in as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    result = future.result()
                    upload_results.append(result)
                except Exception as e:
                    print(f"❌ Parallel upload error for {key}: {str(e)}")
                    raise ValueError(f"Upload failed for {key}: {str(e)}")
        
        print(f"✅ All files uploaded in parallel ({len(upload_results)} files)")
        
        # ============================================
        # SAVE TO DATABASE
        # ============================================
        any_failed = False
        failure_messages = []
        
        for result in upload_results:
            # Defensive: ensure fileType is valid
            valid_types = {c[0] for c in AgencyKycFile.FileType.choices}
            if result['key'] not in valid_types:
                raise ValueError(f"{result['key']} is not a valid fileType")
            
            # Create AgencyKycFile with cached validation results
            AgencyKycFile.objects.create(
                agencyKyc=kyc_record,
                fileType=result['key'],
                fileURL=result['file_url'],
                fileName=result['unique_name'],
                fileSize=result['file_size'],
                # AI Verification Fields (from cache)
                ai_verification_status=result['ai_status'],
                face_detected=result['face_detected'],
                face_count=result['face_count'],
                face_confidence=result['face_confidence'],
                ocr_text=result['ocr_text'],
                ocr_confidence=result['ocr_confidence'],
                quality_score=result['quality_score'],
                ai_confidence_score=result['ai_confidence_score'],
                ai_rejection_reason=result['ai_rejection_reason'],
                ai_rejection_message=result['ai_rejection_message'],
                ai_warnings=result['ai_warnings'],
                ai_details=result['ai_details'],
                verified_at=result['verified_at'],
            )
            
            # Check if any documents failed validation
            if result['ai_status'] == 'FAILED':
                any_failed = True
                failure_messages.append(result['ai_rejection_message'] or f"{result['key']} failed validation")
            
            uploaded_files.append({
                "file_type": result['key'].lower(),
                "file_url": result['file_url'],
                "file_name": result['unique_name'],
                "file_size": result['file_size'],
                "ai_status": result['ai_status'],
                "ai_confidence": result['ai_confidence_score'],
            })
        
        # Auto-reject if any document failed
        if any_failed:
            kyc_record.status = 'REJECTED'
            kyc_record.rejectionCategory = 'INVALID_DOCUMENT'
            kyc_record.rejectionReason = '\n'.join(failure_messages)
            kyc_record.notes = 'Auto-rejected by cached AI validation'
            kyc_record.save()
            print(f"❌ KYC auto-rejected: {failure_messages}")
            
            Notification.objects.create(
                accountFK=user,
                title="KYC Documents Rejected",
                message=f"Your agency KYC documents were rejected. Reason: {failure_messages[0]}",
                notificationType="KYC_REJECTED"
            )
            
            return {
                "message": "Agency KYC documents rejected - validation failed",
                "agency_kyc_id": kyc_record.agencyKycID,
                "status": "REJECTED",
                "rejection_reasons": failure_messages,
                "files": uploaded_files
            }
        
        # ============================================
        # FACE MATCHING: Compare rep_selfie with rep_id_front
        # ============================================
        face_match_ok = False
        face_match_score = None

        if rep_front and rep_selfie:
            print("🔍 [AGENCY] Starting face matching between rep_id_front and rep_selfie...")
            try:
                from accounts.document_verification_service import verify_face_match
                rep_front.seek(0)
                rep_selfie.seek(0)
                id_bytes = rep_front.read()
                selfie_bytes = rep_selfie.read()

                fm_result = verify_face_match(
                    id_image_data=id_bytes,
                    selfie_image_data=selfie_bytes,
                    similarity_threshold=0.55,
                )

                face_match_score = fm_result.get('similarity', 0)
                is_match = fm_result.get('match', False)
                print(f"   Face match result: match={is_match}, similarity={face_match_score:.2f}")

                if is_match:
                    face_match_ok = True
                elif face_match_score < 0.40:
                    # Hard reject: clearly different people
                    any_failed = True
                    failure_messages.append(
                        f"FACE_MATCH: Representative selfie does not match ID photo "
                        f"(similarity: {face_match_score:.0%})"
                    )
                    print(f"   ❌ Face match hard-reject: {face_match_score:.2f} < 0.40")
                else:
                    # Borderline — let admin review
                    print(f"   ⚠️ Face match borderline: {face_match_score:.2f} (needs manual review)")
            except Exception as fm_err:
                print(f"   ⚠️ Face matching error (non-blocking): {fm_err}")
        else:
            if not rep_selfie:
                print("⏭️ Skipping face matching — rep_selfie not provided")

        # ============================================
        # AUTO-APPROVAL CHECK
        # ============================================
        # If all documents passed AI validation, check if we should auto-approve
        final_status = "PENDING"
        auto_approved = False
        
        try:
            from adminpanel.models import PlatformSettings
            settings = PlatformSettings.objects.first()
            
            if settings and settings.autoApproveKYC:
                # Check if all required docs passed with sufficient confidence
                all_passed = all(
                    r['ai_status'] in ('PASSED', 'SKIPPED') 
                    for r in upload_results
                )
                
                # Check if rep_id_front has face detected (required for agency KYC)
                rep_id_front_result = next(
                    (r for r in upload_results if r['key'] == 'REP_ID_FRONT'), 
                    None
                )
                face_detected = rep_id_front_result and rep_id_front_result.get('face_detected', False)
                
                # Calculate average confidence
                confidence_scores = [
                    r.get('ai_confidence_score') or 0 
                    for r in upload_results 
                    if r.get('ai_confidence_score') is not None
                ]
                avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
                
                min_confidence = float(settings.kycAutoApproveMinConfidence or 0.7)
                
                print(f"   🔍 [AUTO-APPROVAL] Checking eligibility...")
                print(f"      - autoApproveKYC: {settings.autoApproveKYC}")
                print(f"      - all_passed: {all_passed}")
                print(f"      - face_detected: {face_detected}")
                print(f"      - face_match_ok: {face_match_ok}")
                print(f"      - avg_confidence: {avg_confidence:.2f}")
                print(f"      - min_confidence: {min_confidence:.2f}")
                
                if all_passed and face_detected and face_match_ok and avg_confidence >= min_confidence:
                    kyc_record.status = 'APPROVED'
                    kyc_record.reviewedBy = None  # Will store as system approval
                    kyc_record.reviewedAt = timezone.now()
                    kyc_record.notes = f"Auto-approved: All AI checks passed, confidence={avg_confidence:.2f}"
                    kyc_record.save()
                    
                    final_status = "APPROVED"
                    auto_approved = True
                    print(f"   🎉 [AUTO-APPROVAL] Agency KYC auto-approved!")
                    
                    # Create success notification
                    Notification.objects.create(
                        accountFK=user,
                        title="Agency Verified! ✅",
                        message="Your agency KYC has been automatically verified. You can now access all platform features.",
                        notificationType="KYC_APPROVED"
                    )
                else:
                    print(f"   ⏳ [AUTO-APPROVAL] Thresholds not met, pending manual review")
        except Exception as e:
            print(f"   ⚠️ [AUTO-APPROVAL] Check failed (will default to PENDING): {e}")
        
        print(f"✅ [FAST UPLOAD] KYC uploaded successfully in ~5-10s (cached validation)")
        
        return {
            "message": "Agency KYC uploaded successfully",
            "agency_kyc_id": kyc_record.agencyKycID,
            "status": final_status,
            "auto_approved": auto_approved,
            "files": uploaded_files,
            "upload_time": "fast",
            "note": "OCR extraction will run separately - check autofill endpoint" if not auto_approved else "Auto-approved by AI verification"
        }

    except Accounts.DoesNotExist:
        raise ValueError("User not found")
    except Exception as e:
        print(f"❌ Fast upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def extract_ocr_for_autofill(business_permit, rep_id_front, business_type, rep_id_type: str = ""):
    """
    Extract OCR text from business permit and representative ID for form autofill.
    
    This function runs AFTER upload and provides extracted data for editing.
    Results are cached in Redis for 10 minutes.
    
    OPTIMIZED: Runs OCR extraction in parallel for faster completion.
    
    Returns:
        dict: Extracted business data (name, address, rep_name, etc.)
    """
    try:
        print(f"📝 [OCR] Extracting text for autofill (business_type: {business_type})")
        
        from .kyc_extraction_parser import get_agency_kyc_parser
        parser = get_agency_kyc_parser()
        
        # Prepare images for parallel processing
        permit_bytes = None
        rep_bytes = None
        
        if business_permit:
            business_permit.seek(0)
            permit_bytes = business_permit.read()
            
        if rep_id_front:
            rep_id_front.seek(0)
            rep_bytes = rep_id_front.read()
        
        def extract_permit_ocr(image_bytes):
            """Extract OCR from business permit."""
            if not image_bytes:
                return {}
            try:
                from accounts.document_verification_service import DocumentVerificationService
                from PIL import Image
                import io
                
                doc_service = DocumentVerificationService()
                permit_img = Image.open(io.BytesIO(image_bytes))
                ocr_result = doc_service._extract_text(permit_img)
                ocr_text = ocr_result.get('text', '')
                
                print(f"   📄 Business permit OCR: {len(ocr_text)} chars, confidence={ocr_result.get('confidence', 0):.2f}")
                
                parsed_business = parser.parse_ocr_text(ocr_text, "BUSINESS_PERMIT")
                return {
                    "business_name": parsed_business.business_name.value or "",
                    "business_address": parsed_business.business_address.value or "",
                    "permit_number": parsed_business.permit_number.value or "",
                    "dti_number": parsed_business.dti_number.value or "",
                    "sec_number": parsed_business.sec_number.value or "",
                    "tin": parsed_business.tin.value or "",
                    "permit_issue_date": parsed_business.permit_issue_date.value or "",
                    "permit_expiry_date": parsed_business.permit_expiry_date.value or "",
                    "confidence": parsed_business.overall_confidence,
                }
            except Exception as e:
                print(f"   ❌ Permit OCR error: {e}")
                return {"confidence": 0}
        
        def extract_rep_id_ocr(image_bytes, doc_type):
            """Extract OCR from representative ID."""
            if not image_bytes:
                return {}
            try:
                from accounts.document_verification_service import DocumentVerificationService
                from PIL import Image
                import io
                
                doc_service = DocumentVerificationService()
                rep_img = Image.open(io.BytesIO(image_bytes))
                ocr_result = doc_service._extract_text(rep_img)
                ocr_text = ocr_result.get('text', '')
                
                print(f"   🪪 Rep ID OCR: {len(ocr_text)} chars, confidence={ocr_result.get('confidence', 0):.2f}")
                
                parsed_rep = parser.parse_ocr_text(ocr_text, doc_type)
                return {
                    "rep_full_name": parsed_rep.rep_full_name.value or "",
                    "rep_id_number": parsed_rep.rep_id_number.value or "",
                    "rep_id_type": parsed_rep.rep_id_type.value or doc_type,
                    "rep_birth_date": parsed_rep.rep_birth_date.value or "",
                    "rep_address": parsed_rep.rep_address.value or "",
                    "confidence": parsed_rep.overall_confidence,
                }
            except Exception as e:
                print(f"   ❌ Rep ID OCR error: {e}")
                return {"confidence": 0}
        
        # Run OCR extraction in parallel for better performance
        rep_doc_type = (rep_id_type or "REP_ID_FRONT").upper()
        permit_data = {}
        rep_data = {}
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            permit_future = executor.submit(extract_permit_ocr, permit_bytes)
            rep_future = executor.submit(extract_rep_id_ocr, rep_bytes, rep_doc_type)
            
            # Wait for both to complete
            permit_data = permit_future.result()
            rep_data = rep_future.result()
        
        # Merge results
        selected_business_type = business_type or permit_data.get("business_type") or ""

        extracted_data = {
            **permit_data,
            **rep_data,
            "business_type": selected_business_type,
            "extracted_at": timezone.now().isoformat(),
        }
        
        print(f"✅ [OCR] Parallel extraction complete: {len(extracted_data)} fields")
        
        return {
            "success": True,
            "extracted_data": extracted_data,
            "confidence": max(permit_data.get("confidence", 0), rep_data.get("confidence", 0)),
            "message": "OCR extraction successful. Please review and edit the autofilled data."
        }
        
    except Exception as e:
        print(f"❌ OCR extraction error: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return empty data on error - user will fill manually
        return {
            "success": False,
            "extracted_data": {},
            "confidence": 0,
            "message": "OCR extraction failed. Please fill the form manually.",
            "error": str(e)
        }

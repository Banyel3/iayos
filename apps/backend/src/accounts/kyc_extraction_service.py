"""
KYC Extraction Service

Handles populating KYCExtractedData model with structured data from OCR.
Called after KYC document upload to parse and store extracted fields.
"""

import logging
from typing import Optional, Dict, Any
from django.utils import timezone

from .models import kyc, kycFiles, KYCExtractedData
from .kyc_extraction_parser import get_kyc_parser, ParsedKYCData

logger = logging.getLogger(__name__)


def process_kyc_extraction(kyc_record: kyc) -> Optional[KYCExtractedData]:
    """
    Process OCR text from KYC files and populate KYCExtractedData model.
    
    This function:
    1. Finds the FRONTID file with OCR text
    2. Parses the OCR text using KYCExtractionParser
    3. Creates/updates KYCExtractedData record with extracted fields
    
    Args:
        kyc_record: The KYC record to process
        
    Returns:
        KYCExtractedData record if successful, None if no OCR data available
    """
    try:
        logger.info(f"🔍 [KYC EXTRACTION] Processing KYC {kyc_record.kycID}")
        
        # Get KYC files with OCR text - prioritize FRONTID
        kyc_files = kycFiles.objects.filter(kycID=kyc_record)
        
        # Find the best file with OCR text (prefer FRONTID for name/address extraction)
        best_file = None
        best_ocr_text = ""
        document_type = ""
        
        for kf in kyc_files:
            if kf.ocr_text and len(kf.ocr_text) > len(best_ocr_text):
                if kf.idType and kf.idType.upper() in ['PASSPORT', 'NATIONALID', 'UMID', 'PHILHEALTH', 'DRIVERSLICENSE']:
                    best_file = kf
                    best_ocr_text = kf.ocr_text
                    document_type = kf.idType.upper()
        
        # Fallback to any file with OCR text
        if not best_file:
            for kf in kyc_files:
                if kf.ocr_text and len(kf.ocr_text) > len(best_ocr_text):
                    best_file = kf
                    best_ocr_text = kf.ocr_text
                    document_type = kf.idType.upper() if kf.idType else "UNKNOWN"
        
        if not best_ocr_text:
            logger.warning(f"   ⚠️ No OCR text found for KYC {kyc_record.kycID}")
            return None
        
        logger.info(f"   📝 Found OCR text ({len(best_ocr_text)} chars) from {document_type}")
        
        # Parse OCR text
        parser = get_kyc_parser()
        parsed_data = parser.parse_ocr_text(best_ocr_text, document_type)
        
        # Get or create extraction record
        extracted, created = KYCExtractedData.objects.get_or_create(
            kycID=kyc_record,
            defaults={"extraction_status": "PENDING"}
        )
        
        if not created:
            logger.info(f"   ℹ️ Updating existing KYCExtractedData record")
        else:
            logger.info(f"   ✅ Created new KYCExtractedData record")
        
        # Populate extracted fields
        extracted.extracted_full_name = parsed_data.full_name.value or ""
        extracted.extracted_first_name = parsed_data.first_name.value or ""
        extracted.extracted_middle_name = parsed_data.middle_name.value or ""
        extracted.extracted_last_name = parsed_data.last_name.value or ""
        extracted.extracted_address = parsed_data.address.value or ""
        extracted.extracted_id_number = parsed_data.id_number.value or ""
        extracted.extracted_id_type = parsed_data.id_type.value or document_type
        extracted.extracted_nationality = parsed_data.nationality.value or ""
        extracted.extracted_sex = parsed_data.sex.value or ""
        
        # Parse date fields
        if parsed_data.birth_date.value:
            try:
                from datetime import datetime
                extracted.extracted_birth_date = datetime.strptime(
                    parsed_data.birth_date.value, "%Y-%m-%d"
                ).date()
            except ValueError:
                logger.warning(f"   ⚠️ Could not parse birth date: {parsed_data.birth_date.value}")
        
        if parsed_data.expiry_date.value:
            try:
                from datetime import datetime
                extracted.extracted_expiry_date = datetime.strptime(
                    parsed_data.expiry_date.value, "%Y-%m-%d"
                ).date()
            except ValueError:
                logger.warning(f"   ⚠️ Could not parse expiry date: {parsed_data.expiry_date.value}")
        
        # Populate confidence scores
        extracted.confidence_full_name = parsed_data.full_name.confidence
        extracted.confidence_birth_date = parsed_data.birth_date.confidence
        extracted.confidence_address = parsed_data.address.confidence
        extracted.confidence_id_number = parsed_data.id_number.confidence
        extracted.overall_confidence = parsed_data.overall_confidence
        
        # Update metadata
        extracted.extraction_status = "EXTRACTED" if parsed_data.overall_confidence > 0.3 else "FAILED"
        extracted.extraction_source = parsed_data.extraction_source
        extracted.extracted_at = timezone.now()
        extracted.raw_extraction_data = parsed_data.to_dict()
        
        extracted.save()
        
        logger.info(f"   ✅ Extraction complete: status={extracted.extraction_status}, confidence={extracted.overall_confidence:.2f}")
        logger.info(f"      Name: {extracted.extracted_full_name}")
        logger.info(f"      DOB: {extracted.extracted_birth_date}")
        logger.info(f"      ID#: {extracted.extracted_id_number}")
        
        return extracted
        
    except Exception as e:
        logger.error(f"❌ [KYC EXTRACTION] Error processing KYC {kyc_record.kycID}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Create failed extraction record
        try:
            extracted, _ = KYCExtractedData.objects.get_or_create(
                kycID=kyc_record,
                defaults={"extraction_status": "FAILED"}
            )
            extracted.extraction_status = "FAILED"
            extracted.raw_extraction_data = {"error": str(e)}
            extracted.save()
        except:
            pass
        
        return None


def get_kyc_autofill_data_for_user(user) -> Dict[str, Any]:
    """
    Get auto-fill data for a user's KYC.
    
    Args:
        user: The user account
        
    Returns:
        Dictionary with auto-fill fields for mobile app
    """
    try:
        kyc_record = kyc.objects.get(accountFK=user)
    except kyc.DoesNotExist:
        return {
            "has_extracted_data": False,
            "message": "No KYC submission found"
        }
    
    try:
        extracted = KYCExtractedData.objects.get(kycID=kyc_record)
        
        # If extraction hasn't been done yet, try to process it
        if extracted.extraction_status == "PENDING":
            extracted = process_kyc_extraction(kyc_record)
            if not extracted:
                return {
                    "has_extracted_data": False,
                    "message": "Extraction processing failed"
                }
        
        return {
            "has_extracted_data": True,
            "extraction_status": extracted.extraction_status,
            "needs_confirmation": extracted.extraction_status == "EXTRACTED",
            "fields": extracted.get_autofill_data(),
            "extracted_at": extracted.extracted_at.isoformat() if extracted.extracted_at else None,
            "confirmed_at": extracted.confirmed_at.isoformat() if extracted.confirmed_at else None,
            "user_edited_fields": extracted.user_edited_fields or []
        }
        
    except KYCExtractedData.DoesNotExist:
        # Try to create extraction record
        extracted = process_kyc_extraction(kyc_record)
        
        if extracted:
            return {
                "has_extracted_data": True,
                "extraction_status": extracted.extraction_status,
                "needs_confirmation": extracted.extraction_status == "EXTRACTED",
                "fields": extracted.get_autofill_data(),
                "extracted_at": extracted.extracted_at.isoformat() if extracted.extracted_at else None
            }
        
        return {
            "has_extracted_data": False,
            "message": "No extracted data available"
        }


def trigger_kyc_extraction_after_upload(kyc_record: kyc) -> None:
    """
    Trigger extraction processing after KYC upload completes.
    Called from upload_kyc_document() after files are saved.
    
    Args:
        kyc_record: The KYC record that was just uploaded
    """
    try:
        logger.info(f"🚀 [KYC EXTRACTION] Triggering extraction for KYC {kyc_record.kycID}")
        process_kyc_extraction(kyc_record)
    except Exception as e:
        logger.error(f"❌ [KYC EXTRACTION] Failed to trigger extraction: {str(e)}")
        # Don't raise - extraction failure shouldn't block KYC upload

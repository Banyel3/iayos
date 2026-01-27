"""
Agency KYC Extraction Service

Handles populating AgencyKYCExtractedData model with structured data from OCR.
Called after Agency KYC document upload to parse and store extracted fields.
"""

import logging
from typing import Optional
from django.utils import timezone

from .models import AgencyKYC, AgencyKycFile, AgencyKYCExtractedData
from .kyc_extraction_parser import get_agency_kyc_parser, ParsedAgencyKYCData

logger = logging.getLogger(__name__)


def process_agency_kyc_extraction(agency_kyc_record: AgencyKYC, business_type: str = None) -> Optional[AgencyKYCExtractedData]:
    """
    Process OCR text from Agency KYC files and populate AgencyKYCExtractedData model.
    
    This function:
    1. Finds the BUSINESS_PERMIT file with OCR text
    2. Finds the REP_ID files with OCR text  
    3. Parses the OCR text using AgencyKYCExtractionParser
    4. Creates/updates AgencyKYCExtractedData record with extracted fields
    
    Args:
        agency_kyc_record: The AgencyKYC record to process
        business_type: Optional user-selected business type (SOLE_PROPRIETORSHIP, etc.)
        
    Returns:
        AgencyKYCExtractedData record if successful, None if no OCR data available
    """
    try:
        logger.info(f"🔍 [AGENCY KYC EXTRACTION] Processing AgencyKYC {agency_kyc_record.agencyKycID}")
        
        # Get all files with OCR text
        kyc_files = AgencyKycFile.objects.filter(agencyKyc=agency_kyc_record)
        
        # Find business permit (primary source for business data)
        business_permit_file = kyc_files.filter(fileType="BUSINESS_PERMIT").first()
        rep_id_front_file = kyc_files.filter(fileType="REP_ID_FRONT").first()
        rep_id_back_file = kyc_files.filter(fileType="REP_ID_BACK").first()
        
        # Get or create extraction record
        extracted, created = AgencyKYCExtractedData.objects.get_or_create(
            agencyKyc=agency_kyc_record,
            defaults={"extraction_status": "PENDING"}
        )
        
        # Save user-selected business_type if provided
        if business_type:
            extracted.confirmed_business_type = business_type
            logger.info(f"   💼 Saving user-selected business_type: {business_type}")
        
        if not created:
            logger.info(f"   ℹ️ Updating existing AgencyKYCExtractedData record")
        else:
            logger.info(f"   ✅ Created new AgencyKYCExtractedData record")
        
        parser = get_agency_kyc_parser()
        overall_confidence_scores = []
        
        # ============================================================
        # Parse Business Permit
        # ============================================================
        if business_permit_file and business_permit_file.ocr_text:
            logger.info(f"   📝 Found Business Permit OCR text ({len(business_permit_file.ocr_text)} chars)")
            
            parsed_business = parser.parse_ocr_text(
                business_permit_file.ocr_text,
                "BUSINESS_PERMIT"
            )
            
            # Populate business fields
            extracted.extracted_business_name = parsed_business.business_name.value or ""
            extracted.extracted_business_type = parsed_business.business_type.value or ""
            extracted.extracted_business_address = parsed_business.business_address.value or ""
            extracted.extracted_permit_number = parsed_business.permit_number.value or ""
            extracted.extracted_dti_number = parsed_business.dti_number.value or ""
            extracted.extracted_sec_number = parsed_business.sec_number.value or ""
            extracted.extracted_tin = parsed_business.tin.value or ""
            
            # Parse date fields
            if parsed_business.permit_issue_date.value:
                try:
                    from datetime import datetime
                    extracted.extracted_permit_issue_date = datetime.strptime(
                        parsed_business.permit_issue_date.value, "%Y-%m-%d"
                    ).date()
                except ValueError:
                    logger.warning(f"   ⚠️ Could not parse permit issue date: {parsed_business.permit_issue_date.value}")
            
            if parsed_business.permit_expiry_date.value:
                try:
                    from datetime import datetime
                    extracted.extracted_permit_expiry_date = datetime.strptime(
                        parsed_business.permit_expiry_date.value, "%Y-%m-%d"
                    ).date()
                except ValueError:
                    logger.warning(f"   ⚠️ Could not parse permit expiry date: {parsed_business.permit_expiry_date.value}")
            
            # Store confidence scores
            extracted.confidence_business_name = parsed_business.business_name.confidence
            extracted.confidence_business_address = parsed_business.business_address.confidence
            extracted.confidence_permit_number = parsed_business.permit_number.confidence
            
            overall_confidence_scores.append(parsed_business.overall_confidence)
            
            logger.info(f"      Business Name: {extracted.extracted_business_name}")
            logger.info(f"      Permit Number: {extracted.extracted_permit_number}")
            logger.info(f"      TIN: {extracted.extracted_tin}")
        else:
            logger.warning(f"   ⚠️ No OCR text found for Business Permit")
        
        # ============================================================
        # Parse Representative ID (Front)
        # ============================================================
        if rep_id_front_file and rep_id_front_file.ocr_text:
            logger.info(f"   📝 Found Rep ID Front OCR text ({len(rep_id_front_file.ocr_text)} chars)")
            
            parsed_rep_front = parser.parse_ocr_text(
                rep_id_front_file.ocr_text,
                "REP_ID_FRONT"
            )
            
            # Populate representative fields
            extracted.extracted_rep_full_name = parsed_rep_front.rep_full_name.value or ""
            extracted.extracted_rep_id_number = parsed_rep_front.rep_id_number.value or ""
            extracted.extracted_rep_id_type = parsed_rep_front.rep_id_type.value or ""
            
            # Parse rep birth date
            if parsed_rep_front.rep_birth_date.value:
                try:
                    from datetime import datetime
                    extracted.extracted_rep_birth_date = datetime.strptime(
                        parsed_rep_front.rep_birth_date.value, "%Y-%m-%d"
                    ).date()
                except ValueError:
                    logger.warning(f"   ⚠️ Could not parse rep birth date: {parsed_rep_front.rep_birth_date.value}")
            
            extracted.confidence_rep_name = parsed_rep_front.rep_full_name.confidence
            
            overall_confidence_scores.append(parsed_rep_front.overall_confidence)
            
            logger.info(f"      Rep Name: {extracted.extracted_rep_full_name}")
            logger.info(f"      Rep ID: {extracted.extracted_rep_id_number}")
        else:
            logger.warning(f"   ⚠️ No OCR text found for Rep ID Front")
        
        # ============================================================
        # Parse Representative ID (Back)
        # ============================================================
        if rep_id_back_file and rep_id_back_file.ocr_text:
            logger.info(f"   📝 Found Rep ID Back OCR text ({len(rep_id_back_file.ocr_text)} chars)")
            
            parsed_rep_back = parser.parse_ocr_text(
                rep_id_back_file.ocr_text,
                "REP_ID_BACK"
            )
            
            # Populate representative address
            extracted.extracted_rep_address = parsed_rep_back.rep_address.value or ""
            
            overall_confidence_scores.append(parsed_rep_back.overall_confidence)
            
            logger.info(f"      Rep Address: {extracted.extracted_rep_address}")
        else:
            logger.warning(f"   ⚠️ No OCR text found for Rep ID Back")
        
        # ============================================================
        # Calculate Overall Confidence & Update Status
        # ============================================================
        if overall_confidence_scores:
            extracted.overall_confidence = sum(overall_confidence_scores) / len(overall_confidence_scores)
        else:
            extracted.overall_confidence = 0.0
        
        # Update metadata
        extracted.extraction_status = "EXTRACTED" if extracted.overall_confidence > 0.3 else "FAILED"
        extracted.extraction_source = "Tesseract OCR"
        extracted.extracted_at = timezone.now()
        
        # Store raw extraction data for debugging
        raw_data = {}
        if business_permit_file and business_permit_file.ocr_text:
            raw_data["business_permit_ocr"] = business_permit_file.ocr_text[:500]
        if rep_id_front_file and rep_id_front_file.ocr_text:
            raw_data["rep_id_front_ocr"] = rep_id_front_file.ocr_text[:500]
        extracted.raw_extraction_data = raw_data
        
        extracted.save()
        
        logger.info(f"   ✅ Extraction complete: status={extracted.extraction_status}, confidence={extracted.overall_confidence:.2f}")
        
        return extracted
        
    except Exception as e:
        logger.error(f"❌ [AGENCY KYC EXTRACTION] Error processing AgencyKYC {agency_kyc_record.agencyKycID}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Create failed extraction record
        try:
            extracted, _ = AgencyKYCExtractedData.objects.get_or_create(
                agencyKyc=agency_kyc_record,
                defaults={"extraction_status": "FAILED"}
            )
            extracted.extraction_status = "FAILED"
            extracted.raw_extraction_data = {"error": str(e)}
            extracted.save()
        except:
            pass
        
        return None


def trigger_agency_kyc_extraction_after_upload(agency_kyc_record: AgencyKYC, business_type: str = None) -> None:
    """
    Trigger extraction processing after Agency KYC upload completes.
    Called from upload_agency_kyc() after files are saved.
    
    Args:
        agency_kyc_record: The AgencyKYC record that was just uploaded
        business_type: Optional user-selected business type for OCR filtering
    """
    try:
        logger.info(f"🚀 [AGENCY KYC EXTRACTION] Triggering extraction for AgencyKYC {agency_kyc_record.agencyKycID}")
        process_agency_kyc_extraction(agency_kyc_record, business_type)
    except Exception as e:
        logger.error(f"❌ [AGENCY KYC EXTRACTION] Failed to trigger extraction: {str(e)}")
        # Don't raise - extraction failure shouldn't block KYC upload

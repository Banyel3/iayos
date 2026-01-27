"""
Agency KYC Extraction Parser

Parses OCR text from business documents to extract structured fields:
- Business name, type, address
- Permit number, issue/expiry dates
- DTI/SEC registration numbers
- TIN (Tax Identification Number)
- Representative information from ID

Supports:
- Business Permits (Mayor's Permit)
- DTI Registration
- SEC Registration
- Representative IDs (Philippine IDs)
"""

import re
import logging
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional, Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


@dataclass
class ExtractionResult:
    """Result of field extraction with confidence score"""
    value: str = ""
    confidence: float = 0.0
    source_text: str = ""  # The raw text snippet that was matched
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "value": self.value,
            "confidence": self.confidence,
            "source_text": self.source_text[:100] if self.source_text else ""
        }


@dataclass
class ParsedAgencyKYCData:
    """Complete parsed Agency KYC data from OCR extraction"""
    # Business Information
    business_name: ExtractionResult = field(default_factory=ExtractionResult)
    business_type: ExtractionResult = field(default_factory=ExtractionResult)
    business_address: ExtractionResult = field(default_factory=ExtractionResult)
    permit_number: ExtractionResult = field(default_factory=ExtractionResult)
    permit_issue_date: ExtractionResult = field(default_factory=ExtractionResult)
    permit_expiry_date: ExtractionResult = field(default_factory=ExtractionResult)
    dti_number: ExtractionResult = field(default_factory=ExtractionResult)
    sec_number: ExtractionResult = field(default_factory=ExtractionResult)
    tin: ExtractionResult = field(default_factory=ExtractionResult)
    
    # Representative Information (from ID)
    rep_full_name: ExtractionResult = field(default_factory=ExtractionResult)
    rep_id_number: ExtractionResult = field(default_factory=ExtractionResult)
    rep_id_type: ExtractionResult = field(default_factory=ExtractionResult)
    rep_birth_date: ExtractionResult = field(default_factory=ExtractionResult)
    rep_address: ExtractionResult = field(default_factory=ExtractionResult)
    
    # Metadata
    overall_confidence: float = 0.0
    extraction_source: str = "Tesseract OCR"
    raw_text: str = ""
    document_type: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "business_name": self.business_name.to_dict(),
            "business_type": self.business_type.to_dict(),
            "business_address": self.business_address.to_dict(),
            "permit_number": self.permit_number.to_dict(),
            "permit_issue_date": self.permit_issue_date.to_dict(),
            "permit_expiry_date": self.permit_expiry_date.to_dict(),
            "dti_number": self.dti_number.to_dict(),
            "sec_number": self.sec_number.to_dict(),
            "tin": self.tin.to_dict(),
            "rep_full_name": self.rep_full_name.to_dict(),
            "rep_id_number": self.rep_id_number.to_dict(),
            "rep_id_type": self.rep_id_type.to_dict(),
            "rep_birth_date": self.rep_birth_date.to_dict(),
            "rep_address": self.rep_address.to_dict(),
            "overall_confidence": self.overall_confidence,
            "extraction_source": self.extraction_source,
            "document_type": self.document_type
        }
    
    def calculate_overall_confidence(self) -> float:
        """Calculate weighted overall confidence from extracted fields"""
        weights = {
            "business_name": 0.25,
            "business_address": 0.15,
            "permit_number": 0.20,
            "tin": 0.10,
            "rep_full_name": 0.15,
            "rep_id_number": 0.15,
        }
        
        total = 0.0
        for field_name, weight in weights.items():
            field_result = getattr(self, field_name, ExtractionResult())
            total += field_result.confidence * weight
        
        self.overall_confidence = total
        return total


class AgencyKYCExtractionParser:
    """Parser for business documents and representative IDs"""
    
    def __init__(self):
        # Common business permit keywords for validation
        self.business_permit_keywords = [
            "mayor", "permit", "business", "municipality", "city",
            "barangay", "owner", "proprietor"
        ]
        
        # DTI/SEC patterns
        self.dti_pattern = re.compile(r'DTI[:\s-]*([A-Z0-9-]+)', re.IGNORECASE)
        self.sec_pattern = re.compile(r'SEC[:\s-]*([A-Z0-9-]+)', re.IGNORECASE)
        
        # TIN patterns (XXX-XXX-XXX-XXX or XXXXXXXXXXXX)
        self.tin_pattern = re.compile(r'\b(\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{3})\b')
        
        # DTI Certificate-specific patterns (Department of Trade and Industry)
        # Matches "Business Name No.7663018" or "Business Name No. 7663018"
        self.dti_business_name_pattern = re.compile(r'Business\s+Name\s+No\.?\s*(\d+)', re.IGNORECASE)
        # Matches "BPXW658418425073" (4 letters + 12 digits) - DTI certificate ID format
        self.dti_certificate_id_pattern = re.compile(r'\b([A-Z]{4}\d{12})\b')
        # Matches "issued to VANIEL JOHN GARCIA CORNELIO" or "This certificate issued to NAME"
        self.issued_to_pattern = re.compile(r'(?:This\s+certificate\s+)?issued\s+to\s+([A-Z\s]+?)(?:\n|is\s+valid|subject\s+to)', re.IGNORECASE)
        # Matches "valid from January 06, 2026 to January 06, 2031"
        self.valid_from_to_pattern = re.compile(
            r'valid\s+from\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})',
            re.IGNORECASE
        )
        # Matches "DEVANTE SOFTWARE DEVELOPMENT SERVICES" after "This certifies that"
        self.certifies_that_pattern = re.compile(r'This\s+certifies\s+that\s+([A-Z\s&-]+?)(?:\n|\()', re.IGNORECASE)
        
        # Date patterns (various formats)
        self.date_patterns = [
            (re.compile(r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b'), "%d/%m/%Y"),  # DD/MM/YYYY or DD-MM-YYYY
            (re.compile(r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b'), "%Y/%m/%d"),  # YYYY/MM/DD or YYYY-MM-DD
            (re.compile(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b', re.IGNORECASE), "%B %d %Y"),
        ]
    
    def parse_ocr_text(self, ocr_text: str, document_type: str = "BUSINESS_PERMIT") -> ParsedAgencyKYCData:
        """
        Main parsing method for agency KYC documents
        
        Args:
            ocr_text: Raw OCR text from document
            document_type: Type of document (BUSINESS_PERMIT, REP_ID_FRONT, REP_ID_BACK, etc.)
            
        Returns:
            ParsedAgencyKYCData object with extracted fields
        """
        result = ParsedAgencyKYCData()
        result.raw_text = ocr_text
        result.document_type = document_type
        
        if not ocr_text or not ocr_text.strip():
            logger.warning("Empty OCR text provided for agency KYC parsing")
            return result
        
        logger.info(f"📄 Parsing {document_type} OCR text ({len(ocr_text)} chars)")
        
        # Parse based on document type
        if document_type == "BUSINESS_PERMIT":
            self._parse_business_permit(ocr_text, result)
        elif document_type in ["REP_ID_FRONT", "FRONTID"]:
            # Parse representative ID using personal KYC parser
            self._parse_representative_id(ocr_text, result)
        elif document_type in ["REP_ID_BACK", "BACKID"]:
            # Parse back of representative ID (address usually)
            self._parse_representative_id_back(ocr_text, result)
        
        # Calculate overall confidence
        result.calculate_overall_confidence()
        
        logger.info(f"   Overall confidence: {result.overall_confidence:.2f}")
        return result
    
    def _parse_business_permit(self, text: str, result: ParsedAgencyKYCData):
        """Parse business permit document"""
        lines = text.split('\n')
        text_upper = text.upper()
        
        # Extract business name (usually one of the first capitalized lines)
        for i, line in enumerate(lines[:10]):  # Check first 10 lines
            line = line.strip()
            # Business name is usually in ALL CAPS and not a header
            if (line.isupper() and len(line) > 5 and 
                not any(kw in line.upper() for kw in ["PERMIT", "MAYOR", "CITY", "MUNICIPALITY", "REPUBLIC"])):
                result.business_name = ExtractionResult(
                    value=line.title(),  # Convert to Title Case
                    confidence=0.7,
                    source_text=line
                )
                logger.info(f"   Business Name: {result.business_name.value}")
                break
        
        # Extract business type (look for keywords like "sole proprietor", "corporation")
        business_type_keywords = {
            "SOLE PROPRIETOR": "Sole Proprietorship",
            "CORPORATION": "Corporation",
            "PARTNERSHIP": "Partnership",
            "COOPERATIVE": "Cooperative",
        }
        for keyword, btype in business_type_keywords.items():
            if keyword in text_upper:
                result.business_type = ExtractionResult(
                    value=btype,
                    confidence=0.8,
                    source_text=keyword
                )
                break
        
        # Extract permit number (look for patterns like "No.", "Permit No", etc.)
        permit_patterns = [
            re.compile(r'PERMIT\s*(?:NO\.?|NUMBER)[:\s]*([A-Z0-9-]+)', re.IGNORECASE),
            re.compile(r'BUSINESS\s*(?:NO\.?|NUMBER)[:\s]*([A-Z0-9-]+)', re.IGNORECASE),
            re.compile(r'(?:NO\.?|NUMBER)[:\s]*([A-Z0-9-]{5,})', re.IGNORECASE),
        ]
        for pattern in permit_patterns:
            match = pattern.search(text)
            if match:
                result.permit_number = ExtractionResult(
                    value=match.group(1).strip(),
                    confidence=0.85,
                    source_text=match.group(0)
                )
                logger.info(f"   Permit Number: {result.permit_number.value}")
                break
        
        # Extract dates
        dates_found = self._extract_dates(text)
        if len(dates_found) >= 2:
            # Usually issue date comes before expiry date
            result.permit_issue_date = ExtractionResult(
                value=dates_found[0],
                confidence=0.7,
                source_text="date extraction"
            )
            result.permit_expiry_date = ExtractionResult(
                value=dates_found[1],
                confidence=0.7,
                source_text="date extraction"
            )
        
        # Extract DTI number
        dti_match = self.dti_pattern.search(text)
        if dti_match:
            result.dti_number = ExtractionResult(
                value=dti_match.group(1).strip(),
                confidence=0.85,
                source_text=dti_match.group(0)
            )
            logger.info(f"   DTI Number: {result.dti_number.value}")
        
        # Extract DTI Business Name Number (DTI Certificate format fallback)
        if not result.dti_number.value:
            dti_bn_match = self.dti_business_name_pattern.search(text)
            if dti_bn_match:
                result.dti_number = ExtractionResult(
                    value=f"BN-{dti_bn_match.group(1).strip()}",
                    confidence=0.8,
                    source_text=dti_bn_match.group(0)
                )
                logger.info(f"   DTI Business Name Number: {result.dti_number.value}")
        
        # Extract DTI Certificate ID (store as permit number since it's the certificate identifier)
        cert_id_match = self.dti_certificate_id_pattern.search(text)
        if cert_id_match and not result.permit_number.value:
            result.permit_number = ExtractionResult(
                value=cert_id_match.group(1).strip().upper(),
                confidence=0.85,
                source_text=cert_id_match.group(0)
            )
            logger.info(f"   DTI Certificate ID: {result.permit_number.value}")
        
        # Extract "issued to" name for business owner verification
        issued_to_match = self.issued_to_pattern.search(text)
        if issued_to_match:
            issued_name = issued_to_match.group(1).strip()
            logger.info(f"   Issued To (Owner): {issued_name}")
        
        # Extract validity dates with "valid from/to" format (DTI Certificate format)
        if not result.permit_issue_date.value or not result.permit_expiry_date.value:
            validity_match = self.valid_from_to_pattern.search(text)
            if validity_match:
                issue_date_str = validity_match.group(1).strip()
                expiry_date_str = validity_match.group(2).strip()
                try:
                    # Try parsing with comma: "January 06, 2026"
                    issue_date = datetime.strptime(issue_date_str, "%B %d, %Y")
                    expiry_date = datetime.strptime(expiry_date_str, "%B %d, %Y")
                    if not result.permit_issue_date.value:
                        result.permit_issue_date = ExtractionResult(
                            value=issue_date.strftime("%Y-%m-%d"),
                            confidence=0.85,
                            source_text=validity_match.group(0)
                        )
                    if not result.permit_expiry_date.value:
                        result.permit_expiry_date = ExtractionResult(
                            value=expiry_date.strftime("%Y-%m-%d"),
                            confidence=0.85,
                            source_text=validity_match.group(0)
                        )
                    logger.info(f"   Valid From: {result.permit_issue_date.value} To: {result.permit_expiry_date.value}")
                except ValueError:
                    # Try without comma: "January 06 2026"
                    try:
                        issue_date = datetime.strptime(issue_date_str.replace(',', ''), "%B %d %Y")
                        expiry_date = datetime.strptime(expiry_date_str.replace(',', ''), "%B %d %Y")
                        if not result.permit_issue_date.value:
                            result.permit_issue_date = ExtractionResult(
                                value=issue_date.strftime("%Y-%m-%d"),
                                confidence=0.8,
                                source_text=validity_match.group(0)
                            )
                        if not result.permit_expiry_date.value:
                            result.permit_expiry_date = ExtractionResult(
                                value=expiry_date.strftime("%Y-%m-%d"),
                                confidence=0.8,
                                source_text=validity_match.group(0)
                            )
                        logger.info(f"   Valid From: {result.permit_issue_date.value} To: {result.permit_expiry_date.value}")
                    except ValueError as e:
                        logger.warning(f"Failed to parse DTI validity dates: {e}")
        
        # Extract business name from "This certifies that" pattern (DTI Certificate format)
        if not result.business_name.value:
            certifies_match = self.certifies_that_pattern.search(text)
            if certifies_match:
                business_name = certifies_match.group(1).strip()
                result.business_name = ExtractionResult(
                    value=business_name.title(),
                    confidence=0.8,
                    source_text=certifies_match.group(0)
                )
                logger.info(f"   Business Name (from 'certifies that'): {result.business_name.value}")
        
        # Extract SEC number
        sec_match = self.sec_pattern.search(text)
        if sec_match:
            result.sec_number = ExtractionResult(
                value=sec_match.group(1).strip(),
                confidence=0.85,
                source_text=sec_match.group(0)
            )
            logger.info(f"   SEC Number: {result.sec_number.value}")
        
        # Extract TIN
        tin_match = self.tin_pattern.search(text)
        if tin_match:
            result.tin = ExtractionResult(
                value=tin_match.group(1).strip(),
                confidence=0.8,
                source_text=tin_match.group(0)
            )
            logger.info(f"   TIN: {result.tin.value}")
        
        # Extract business address (look for address keywords)
        address = self._extract_business_address(text)
        if address:
            result.business_address = ExtractionResult(
                value=address,
                confidence=0.7,
                source_text="address extraction"
            )
            logger.info(f"   Business Address: {result.business_address.value}")
    
    def _parse_representative_id(self, text: str, result: ParsedAgencyKYCData):
        """Parse representative's ID front (reuse personal KYC parser logic)"""
        # Import and use the personal KYC parser for name, ID number, birth date
        from accounts.kyc_extraction_parser import get_kyc_parser
        
        kyc_parser = get_kyc_parser()
        parsed_personal = kyc_parser.parse_ocr_text(text, "NATIONALID")
        
        # Map personal KYC fields to representative fields
        result.rep_full_name = ExtractionResult(
            value=parsed_personal.full_name.value,
            confidence=parsed_personal.full_name.confidence,
            source_text=parsed_personal.full_name.source_text
        )
        result.rep_id_number = ExtractionResult(
            value=parsed_personal.id_number.value,
            confidence=parsed_personal.id_number.confidence,
            source_text=parsed_personal.id_number.source_text
        )
        result.rep_id_type = ExtractionResult(
            value=parsed_personal.id_type.value or "NATIONALID",
            confidence=0.9,
            source_text=""
        )
        result.rep_birth_date = ExtractionResult(
            value=parsed_personal.birth_date.value,
            confidence=parsed_personal.birth_date.confidence,
            source_text=parsed_personal.birth_date.source_text
        )
        
        logger.info(f"   Rep Name: {result.rep_full_name.value}")
        logger.info(f"   Rep ID: {result.rep_id_number.value}")
    
    def _parse_representative_id_back(self, text: str, result: ParsedAgencyKYCData):
        """Parse representative's ID back (usually has address)"""
        from accounts.kyc_extraction_parser import get_kyc_parser
        
        kyc_parser = get_kyc_parser()
        parsed_personal = kyc_parser.parse_ocr_text(text, "NATIONALID")
        
        # Extract address from back of ID
        result.rep_address = ExtractionResult(
            value=parsed_personal.address.value,
            confidence=parsed_personal.address.confidence,
            source_text=parsed_personal.address.source_text
        )
        
        logger.info(f"   Rep Address: {result.rep_address.value}")
    
    def _extract_dates(self, text: str) -> List[str]:
        """Extract dates from text and return in YYYY-MM-DD format"""
        dates = []
        
        for pattern, date_format in self.date_patterns:
            for match in pattern.finditer(text):
                try:
                    # Check if this is a month name pattern (contains text like Jan, Feb)
                    if "%B" in date_format or "%b" in date_format:
                        # Month name format
                        month_str, day_str, year_str = match.groups()
                        date_obj = datetime.strptime(f"{month_str} {day_str} {year_str}", "%B %d %Y")
                    else:
                        # Numeric format
                        date_str = match.group(0)
                        date_obj = datetime.strptime(date_str, date_format)
                    
                    dates.append(date_obj.strftime("%Y-%m-%d"))
                except ValueError:
                    continue
        
        return dates
    
    def _extract_business_address(self, text: str) -> str:
        """Extract business address from text"""
        # Look for lines containing address keywords
        address_keywords = ["barangay", "brgy", "street", "st.", "avenue", "ave", "city", "municipality"]
        lines = text.split('\n')
        
        address_lines = []
        for line in lines:
            line_lower = line.lower()
            if any(kw in line_lower for kw in address_keywords):
                # Clean up the line
                clean_line = line.strip()
                if len(clean_line) > 10:  # Ignore very short lines
                    address_lines.append(clean_line)
        
        # Combine address lines
        if address_lines:
            return " ".join(address_lines[:3])  # Max 3 lines
        
        return ""


# Singleton instance
_parser_instance = None

def get_agency_kyc_parser() -> AgencyKYCExtractionParser:
    """Get singleton parser instance"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = AgencyKYCExtractionParser()
    return _parser_instance

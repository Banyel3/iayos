"""
KYC Extraction Parser Service

Parses OCR text from Philippine government IDs to extract structured fields:
- Name (full, first, middle, last)
- Birth date
- Address
- ID number
- Nationality
- Sex/Gender

Supports:
- Philippine Passport
- PhilSys National ID
- Driver's License (LTO)
- UMID
- PhilHealth ID
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
class ParsedKYCData:
    """Complete parsed KYC data from OCR extraction"""
    full_name: ExtractionResult = field(default_factory=ExtractionResult)
    first_name: ExtractionResult = field(default_factory=ExtractionResult)
    middle_name: ExtractionResult = field(default_factory=ExtractionResult)
    last_name: ExtractionResult = field(default_factory=ExtractionResult)
    birth_date: ExtractionResult = field(default_factory=ExtractionResult)
    address: ExtractionResult = field(default_factory=ExtractionResult)
    id_number: ExtractionResult = field(default_factory=ExtractionResult)
    id_type: ExtractionResult = field(default_factory=ExtractionResult)
    expiry_date: ExtractionResult = field(default_factory=ExtractionResult)
    nationality: ExtractionResult = field(default_factory=ExtractionResult)
    sex: ExtractionResult = field(default_factory=ExtractionResult)
    
    # Metadata
    overall_confidence: float = 0.0
    extraction_source: str = "Tesseract OCR"
    raw_text: str = ""
    id_type_detected: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "full_name": self.full_name.to_dict(),
            "first_name": self.first_name.to_dict(),
            "middle_name": self.middle_name.to_dict(),
            "last_name": self.last_name.to_dict(),
            "birth_date": self.birth_date.to_dict(),
            "address": self.address.to_dict(),
            "id_number": self.id_number.to_dict(),
            "id_type": self.id_type.to_dict(),
            "expiry_date": self.expiry_date.to_dict(),
            "nationality": self.nationality.to_dict(),
            "sex": self.sex.to_dict(),
            "overall_confidence": self.overall_confidence,
            "extraction_source": self.extraction_source,
            "id_type_detected": self.id_type_detected
        }
    
    def calculate_overall_confidence(self) -> float:
        """Calculate weighted overall confidence from extracted fields"""
        weights = {
            "full_name": 0.25,
            "birth_date": 0.20,
            "id_number": 0.20,
            "address": 0.15,
            "sex": 0.10,
            "nationality": 0.10
        }
        
        total = 0.0
        for field_name, weight in weights.items():
            field_result = getattr(self, field_name, ExtractionResult())
            total += field_result.confidence * weight
        
        self.overall_confidence = total
        return total


class KYCExtractionParser:
    """
    Parser for extracting structured KYC data from OCR text.
    Handles various Philippine government ID formats.
    """
    
    # Common patterns for Philippine IDs
    PATTERNS = {
        # Date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, etc.
        "date": [
            r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})',  # DD/MM/YYYY or MM/DD/YYYY
            r'(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})',  # YYYY/MM/DD
            r'(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s*(\d{4})',  # DD MON YYYY
            r'(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s*(\d{1,2})[,\s]+(\d{4})',  # MON DD, YYYY
        ],
        
        # ID number patterns for different document types
        "passport": r'[A-Z]{1,2}\d{7,8}',  # Philippine passport: P followed by 7-8 digits
        "philsys": r'PSN[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}',  # PhilSys National ID
        "drivers_license": r'[A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6,7}',  # LTO format
        "umid": r'CRN[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d{1}',  # UMID CRN number
        "philhealth": r'(\d{2}[-\s]?\d{9}[-\s]?\d{1})|(\d{12})',  # PhilHealth Member ID
        
        # Sex/Gender
        "sex": r'\b(MALE|FEMALE|M|F)\b',
        
        # Address keywords
        "address_keywords": [
            "ADDRESS", "RESIDENCE", "LUGAR NG KAPANGANAKAN", "BIRTHPLACE",
            "TIRAHAN", "CITY", "MUNICIPALITY", "BARANGAY", "BRGY"
        ],
        
        # Philippine provinces/cities for address detection
        "ph_locations": [
            "MANILA", "QUEZON CITY", "MAKATI", "CEBU", "DAVAO", "CALOOCAN",
            "ZAMBOANGA", "PASIG", "TAGUIG", "VALENZUELA", "PARANAQUE",
            "LAS PINAS", "MUNTINLUPA", "MARIKINA", "PASAY", "MALABON",
            "MANDALUYONG", "SAN JUAN", "NAVOTAS", "PATEROS"
        ]
    }
    
    # Month name to number mapping
    MONTH_MAP = {
        "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
        "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
        "JANUARY": 1, "FEBRUARY": 2, "MARCH": 3, "APRIL": 4, "JUNE": 6,
        "JULY": 7, "AUGUST": 8, "SEPTEMBER": 9, "OCTOBER": 10, "NOVEMBER": 11, "DECEMBER": 12
    }
    
    def __init__(self):
        """Initialize the parser"""
        pass
    
    def parse_ocr_text(self, ocr_text: str, document_type: str = "") -> ParsedKYCData:
        """
        Parse OCR text and extract structured KYC fields.
        
        Args:
            ocr_text: Raw OCR text from document
            document_type: Type of document (PASSPORT, NATIONALID, etc.)
            
        Returns:
            ParsedKYCData with extracted fields and confidence scores
        """
        logger.info(f"🔍 Parsing KYC data from OCR text ({len(ocr_text)} chars), type={document_type}")
        
        result = ParsedKYCData()
        result.raw_text = ocr_text
        
        if not ocr_text or len(ocr_text) < 10:
            logger.warning("   ⚠️ OCR text too short for parsing")
            return result
        
        # Normalize text for easier parsing
        text_upper = ocr_text.upper()
        text_lines = [line.strip() for line in ocr_text.split('\n') if line.strip()]
        
        # Detect document type if not provided
        if not document_type:
            document_type = self._detect_document_type(text_upper)
        
        result.id_type_detected = document_type
        result.id_type = ExtractionResult(
            value=document_type,
            confidence=0.8 if document_type else 0.0
        )
        
        # Extract fields based on document type
        result.full_name = self._extract_name(text_upper, text_lines, document_type)
        self._split_name(result)  # Parse into first/middle/last
        
        result.birth_date = self._extract_birth_date(text_upper, text_lines)
        result.id_number = self._extract_id_number(text_upper, document_type)
        result.address = self._extract_address(text_upper, text_lines)
        result.sex = self._extract_sex(text_upper)
        result.nationality = self._extract_nationality(text_upper)
        result.expiry_date = self._extract_expiry_date(text_upper, text_lines)
        
        # Calculate overall confidence
        result.calculate_overall_confidence()
        
        logger.info(f"   ✅ Extraction complete: overall_confidence={result.overall_confidence:.2f}")
        logger.info(f"   📋 Name: {result.full_name.value}, DOB: {result.birth_date.value}, ID: {result.id_number.value}")
        
        return result
    
    def _detect_document_type(self, text_upper: str) -> str:
        """Detect the type of government ID from OCR text"""
        
        # Check for Passport
        if "PASAPORTE" in text_upper or ("PASSPORT" in text_upper and "PILIPINAS" in text_upper):
            return "PASSPORT"
        
        # Check for PhilSys National ID
        if "PHILSYS" in text_upper or "PSN" in text_upper or "PHILIPPINE IDENTIFICATION" in text_upper:
            return "NATIONALID"
        
        # Check for Driver's License
        if "DRIVER" in text_upper and ("LICENSE" in text_upper or "LTO" in text_upper):
            return "DRIVERSLICENSE"
        
        # Check for UMID
        if "UMID" in text_upper or "UNIFIED MULTI-PURPOSE" in text_upper:
            return "UMID"
        
        # Check for PhilHealth
        if "PHILHEALTH" in text_upper or "PHIC" in text_upper:
            return "PHILHEALTH"
        
        # Generic Philippine ID
        if "PILIPINAS" in text_upper or "PHILIPPINES" in text_upper or "REPUBLIKA" in text_upper:
            return "PHILIPPINE_ID"
        
        return "UNKNOWN"
    
    def _extract_name(self, text_upper: str, text_lines: List[str], document_type: str) -> ExtractionResult:
        """Extract full name from document"""
        
        # Common name field labels
        name_labels = [
            "SURNAME", "FAMILY NAME", "LAST NAME", "GIVEN NAME", "FIRST NAME", 
            "MIDDLE NAME", "NAME", "PANGALAN", "APELYIDO", "GITNANG PANGALAN",
            "FULL NAME", "COMPLETE NAME"
        ]
        
        # Look for labeled name fields
        for i, line in enumerate(text_lines):
            line_upper = line.upper()
            
            # Check if this line contains a name label
            for label in name_labels:
                if label in line_upper:
                    # Name might be on this line after the label, or on next line
                    after_label = line_upper.split(label)[-1].strip()
                    after_label = re.sub(r'^[:\s/]+', '', after_label)  # Remove leading : / etc.
                    
                    if after_label and len(after_label) > 2:
                        return ExtractionResult(
                            value=self._clean_name(after_label),
                            confidence=0.85,
                            source_text=line
                        )
                    
                    # Check next line
                    if i + 1 < len(text_lines):
                        next_line = text_lines[i + 1].strip()
                        if next_line and len(next_line) > 2 and not any(lbl in next_line.upper() for lbl in name_labels):
                            return ExtractionResult(
                                value=self._clean_name(next_line),
                                confidence=0.75,
                                source_text=next_line
                            )
        
        # Passport specific: look for names between known fields
        if document_type == "PASSPORT":
            # Look for line after "SURNAME" and before next field
            found_surname = False
            for i, line in enumerate(text_lines):
                if "SURNAME" in line.upper() or "APELYIDO" in line.upper():
                    found_surname = True
                    continue
                if found_surname and line.strip():
                    # This should be the surname
                    return ExtractionResult(
                        value=self._clean_name(line),
                        confidence=0.8,
                        source_text=line
                    )
        
        # Last resort: Look for title-case names (multiple capitalized words)
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b'
        matches = re.findall(name_pattern, text_upper)
        if matches:
            # Pick the longest match that looks like a name
            best_match = max(matches, key=len)
            return ExtractionResult(
                value=self._clean_name(best_match),
                confidence=0.5,
                source_text=best_match
            )
        
        return ExtractionResult()
    
    def _clean_name(self, name: str) -> str:
        """Clean and normalize a name string"""
        # Remove common non-name patterns
        name = re.sub(r'\d+', '', name)  # Remove numbers
        name = re.sub(r'[^\w\s\-\.]', '', name)  # Keep only letters, spaces, hyphens, dots
        name = re.sub(r'\s+', ' ', name)  # Normalize spaces
        name = name.strip()
        
        # Title case
        name = name.title()
        
        return name
    
    def _split_name(self, result: ParsedKYCData) -> None:
        """Split full name into first, middle, and last name"""
        full_name = result.full_name.value
        if not full_name:
            return
        
        parts = full_name.split()
        confidence = result.full_name.confidence * 0.8  # Reduce confidence for parsed components
        
        if len(parts) == 1:
            result.first_name = ExtractionResult(value=parts[0], confidence=confidence)
        elif len(parts) == 2:
            result.first_name = ExtractionResult(value=parts[0], confidence=confidence)
            result.last_name = ExtractionResult(value=parts[1], confidence=confidence)
        elif len(parts) >= 3:
            result.first_name = ExtractionResult(value=parts[0], confidence=confidence)
            result.middle_name = ExtractionResult(value=' '.join(parts[1:-1]), confidence=confidence * 0.9)
            result.last_name = ExtractionResult(value=parts[-1], confidence=confidence)
    
    def _extract_birth_date(self, text_upper: str, text_lines: List[str]) -> ExtractionResult:
        """Extract birth date from document"""
        
        # Look for date labels
        date_labels = [
            "DATE OF BIRTH", "BIRTHDAY", "BIRTHDATE", "BORN", "DOB",
            "PETSA NG KAPANGANAKAN", "KAPANGANAKAN", "KAARAWAN"
        ]
        
        for i, line in enumerate(text_lines):
            line_upper = line.upper()
            
            for label in date_labels:
                if label in line_upper:
                    # Try to find date on this line or next
                    date_result = self._parse_date_from_text(line_upper)
                    if date_result:
                        return ExtractionResult(
                            value=date_result,
                            confidence=0.9,
                            source_text=line
                        )
                    
                    # Check next line
                    if i + 1 < len(text_lines):
                        next_date = self._parse_date_from_text(text_lines[i + 1].upper())
                        if next_date:
                            return ExtractionResult(
                                value=next_date,
                                confidence=0.85,
                                source_text=text_lines[i + 1]
                            )
        
        # Fall back to finding any date in the text
        all_dates = self._find_all_dates(text_upper)
        if all_dates:
            # Pick the date that looks most like a birth date (not future, reasonable age)
            today = date.today()
            for date_str, parsed_date in all_dates:
                try:
                    if parsed_date < today:
                        age = (today - parsed_date).days // 365
                        if 10 < age < 100:  # Reasonable age range
                            return ExtractionResult(
                                value=date_str,
                                confidence=0.6,
                                source_text=date_str
                            )
                except:
                    continue
        
        return ExtractionResult()
    
    def _parse_date_from_text(self, text: str) -> Optional[str]:
        """Try to parse a date from text"""
        
        # Pattern: DD/MM/YYYY or DD-MM-YYYY
        match = re.search(r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})', text)
        if match:
            day, month, year = match.groups()
            try:
                parsed = date(int(year), int(month), int(day))
                return parsed.strftime("%Y-%m-%d")
            except ValueError:
                # Try swapping day/month
                try:
                    parsed = date(int(year), int(day), int(month))
                    return parsed.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        
        # Pattern: DD MON YYYY (e.g., "15 JAN 1990")
        match = re.search(r'(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s*(\d{4})', text)
        if match:
            day, month_str, year = match.groups()
            month = self.MONTH_MAP.get(month_str[:3], 0)
            if month:
                try:
                    parsed = date(int(year), month, int(day))
                    return parsed.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        
        # Pattern: MON DD, YYYY (e.g., "January 15, 1990")
        match = re.search(r'(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s*(\d{1,2})[,\s]+(\d{4})', text)
        if match:
            month_str, day, year = match.groups()
            month = self.MONTH_MAP.get(month_str[:3], 0)
            if month:
                try:
                    parsed = date(int(year), month, int(day))
                    return parsed.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        
        return None
    
    def _find_all_dates(self, text: str) -> List[Tuple[str, date]]:
        """Find all dates in text"""
        dates = []
        
        # Find all date-like patterns
        for pattern in self.PATTERNS["date"]:
            matches = re.finditer(pattern, text)
            for match in matches:
                date_str = self._parse_date_from_text(match.group(0))
                if date_str:
                    try:
                        parsed = datetime.strptime(date_str, "%Y-%m-%d").date()
                        dates.append((date_str, parsed))
                    except:
                        pass
        
        return dates
    
    def _extract_id_number(self, text_upper: str, document_type: str) -> ExtractionResult:
        """Extract ID/document number based on document type"""
        
        patterns = {
            "PASSPORT": (self.PATTERNS["passport"], 0.9),
            "NATIONALID": (self.PATTERNS["philsys"], 0.9),
            "DRIVERSLICENSE": (self.PATTERNS["drivers_license"], 0.85),
            "UMID": (self.PATTERNS["umid"], 0.9),
            "PHILHEALTH": (self.PATTERNS["philhealth"], 0.85),
        }
        
        pattern, confidence = patterns.get(document_type, (None, 0.5))
        
        if pattern:
            match = re.search(pattern, text_upper)
            if match:
                return ExtractionResult(
                    value=match.group(0),
                    confidence=confidence,
                    source_text=match.group(0)
                )
        
        # Generic ID number patterns
        generic_patterns = [
            r'NO\.?\s*[:\s]?\s*([A-Z0-9\-]{8,15})',
            r'ID\s*NO\.?\s*[:\s]?\s*([A-Z0-9\-]{8,15})',
            r'([A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6,7})',  # Common Philippine ID format
        ]
        
        for pattern in generic_patterns:
            match = re.search(pattern, text_upper)
            if match:
                return ExtractionResult(
                    value=match.group(1) if match.lastindex else match.group(0),
                    confidence=0.6,
                    source_text=match.group(0)
                )
        
        return ExtractionResult()
    
    def _extract_address(self, text_upper: str, text_lines: List[str]) -> ExtractionResult:
        """Extract address from document"""
        
        # Look for address labels
        for i, line in enumerate(text_lines):
            line_upper = line.upper()
            
            for keyword in self.PATTERNS["address_keywords"]:
                if keyword in line_upper:
                    # Collect address lines
                    address_parts = []
                    
                    # Check if address is on same line
                    after_keyword = line_upper.split(keyword)[-1].strip()
                    after_keyword = re.sub(r'^[:\s/]+', '', after_keyword)
                    if after_keyword and len(after_keyword) > 5:
                        address_parts.append(after_keyword)
                    
                    # Collect subsequent lines that look like address parts
                    for j in range(i + 1, min(i + 4, len(text_lines))):
                        next_line = text_lines[j].strip()
                        if next_line and len(next_line) > 3:
                            # Stop if we hit another label
                            if any(lbl in next_line.upper() for lbl in ["NAME", "DATE", "SEX", "BORN", "NUMBER"]):
                                break
                            address_parts.append(next_line)
                    
                    if address_parts:
                        full_address = ', '.join(address_parts)
                        return ExtractionResult(
                            value=self._clean_address(full_address),
                            confidence=0.8,
                            source_text=full_address[:100]
                        )
        
        # Look for Philippine location names
        for location in self.PATTERNS["ph_locations"]:
            if location in text_upper:
                # Find the line containing this location
                for line in text_lines:
                    if location in line.upper():
                        return ExtractionResult(
                            value=self._clean_address(line),
                            confidence=0.5,
                            source_text=line
                        )
        
        return ExtractionResult()
    
    def _clean_address(self, address: str) -> str:
        """Clean and normalize address string"""
        address = re.sub(r'\s+', ' ', address)
        address = address.strip(' ,.')
        return address.title()
    
    def _extract_sex(self, text_upper: str) -> ExtractionResult:
        """Extract sex/gender from document"""
        
        # Look for explicit sex labels
        patterns = [
            r'SEX[:\s]*([MF]|MALE|FEMALE)',
            r'KASARIAN[:\s]*([MF]|LALAKI|BABAE)',
            r'GENDER[:\s]*([MF]|MALE|FEMALE)',
            r'\b(MALE|FEMALE)\b',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text_upper)
            if match:
                value = match.group(1)
                # Normalize to MALE/FEMALE
                if value in ['M', 'LALAKI']:
                    value = 'MALE'
                elif value in ['F', 'BABAE']:
                    value = 'FEMALE'
                
                return ExtractionResult(
                    value=value,
                    confidence=0.9,
                    source_text=match.group(0)
                )
        
        return ExtractionResult()
    
    def _extract_nationality(self, text_upper: str) -> ExtractionResult:
        """Extract nationality from document"""
        
        # Common nationality patterns
        patterns = [
            r'NATIONALITY[:\s]*(FILIPINO|FILIPINA|PHILIPPINE|PH)',
            r'NASYONALIDAD[:\s]*(PILIPINO|PILIPINA)',
            r'CITIZEN[:\s]*(FILIPINO|FILIPINA|PHILIPPINE)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text_upper)
            if match:
                return ExtractionResult(
                    value="FILIPINO",
                    confidence=0.95,
                    source_text=match.group(0)
                )
        
        # If document is Philippine ID, assume Filipino
        if "PILIPINAS" in text_upper or "REPUBLIKA NG PILIPINAS" in text_upper:
            return ExtractionResult(
                value="FILIPINO",
                confidence=0.7,
                source_text="PILIPINAS"
            )
        
        return ExtractionResult()
    
    def _extract_expiry_date(self, text_upper: str, text_lines: List[str]) -> ExtractionResult:
        """Extract document expiry date"""
        
        expiry_labels = [
            "EXPIRY", "EXPIRATION", "VALID UNTIL", "VALID THRU",
            "DATE OF EXPIRY", "EXPIRES", "EXP"
        ]
        
        for i, line in enumerate(text_lines):
            line_upper = line.upper()
            
            for label in expiry_labels:
                if label in line_upper:
                    date_result = self._parse_date_from_text(line_upper)
                    if date_result:
                        return ExtractionResult(
                            value=date_result,
                            confidence=0.85,
                            source_text=line
                        )
                    
                    # Check next line
                    if i + 1 < len(text_lines):
                        next_date = self._parse_date_from_text(text_lines[i + 1].upper())
                        if next_date:
                            return ExtractionResult(
                                value=next_date,
                                confidence=0.8,
                                source_text=text_lines[i + 1]
                            )
        
        return ExtractionResult()


# Singleton instance
_parser_instance = None

def get_kyc_parser() -> KYCExtractionParser:
    """Get or create singleton parser instance"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = KYCExtractionParser()
    return _parser_instance


def parse_kyc_document(ocr_text: str, document_type: str = "") -> Dict[str, Any]:
    """
    Convenience function to parse KYC document OCR text.
    
    Args:
        ocr_text: Raw OCR text from document
        document_type: Type of document (optional)
        
    Returns:
        Dictionary with extracted fields
    """
    parser = get_kyc_parser()
    result = parser.parse_ocr_text(ocr_text, document_type)
    return result.to_dict()

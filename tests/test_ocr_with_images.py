#!/usr/bin/env python
"""
Test OCR Extraction with Actual Test Images

This script runs Tesseract OCR on actual test images and verifies
the extraction parsers correctly extract fields from real OCR output.

Test Images:
- 620624480_1560717208471655_2408114603641535058_n.png = DTI Certificate
- 622328121_2839006803157680_1149058521371295726_n.jpg = Driver's License

Expected Results:
DTI Certificate:
- Business Name: DEVANTE SOFTWARE DEVELOPMENT SERVICES
- DTI Number: 7663018
- Certificate ID: BPXW658418425073
- Valid: 2026-01-06 to 2031-01-06

Driver's License:
- Full Name: Edris Sappayani Bakaun
- License No: J13-20-010162
- Birth Date: 2002/06/09 or 2002-06-09
- Address: SAN ROQUE, ZAMBOANGA CITY
"""

import os
import sys

# Add backend src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'backend', 'src'))

# Import Django settings to initialize
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
import django
django.setup()

from PIL import Image
import pytesseract
from agency.kyc_extraction_parser import AgencyKYCExtractionParser
from accounts.kyc_extraction_parser import KYCExtractionParser


def run_ocr_on_image(image_path: str, document_type: str = None) -> str:
    """Run Tesseract OCR on an image and return the text
    
    Args:
        image_path: Path to image file
        document_type: Document type to optimize PSM mode:
            - BUSINESS_PERMIT, DTI, SEC: Use PSM 12 (sparse text)
            - ID documents: Use PSM 6 (uniform block)
    """
    try:
        img = Image.open(image_path)
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Select PSM based on document type
        doc_type_upper = (document_type or '').upper()
        if doc_type_upper in ['BUSINESS_PERMIT', 'DTI', 'SEC', 'PERMIT', 'CERTIFICATE']:
            psm_mode = 12  # Sparse text with OSD
        else:
            psm_mode = 6   # Uniform block of text
        
        # Run OCR with custom config
        custom_config = f'--psm {psm_mode} --oem 3'
        text = pytesseract.image_to_string(img, config=custom_config)
        return text
    except Exception as e:
        print(f"❌ OCR Error: {e}")
        return ""


def test_dti_certificate():
    """Test DTI Certificate extraction with actual image OCR"""
    print("=" * 70)
    print("TEST 1: DTI Certificate Extraction (Real OCR)")
    print("=" * 70)
    
    # DTI Certificate image
    image_path = os.path.join(os.path.dirname(__file__), 
                              'test_images', 
                              '620624480_1560717208471655_2408114603641535058_n.png')
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    print(f"\n📁 Image: {os.path.basename(image_path)}")
    print(f"📊 Size: {os.path.getsize(image_path)} bytes")
    
    # Run OCR with PSM 12 (sparse text) for certificates
    print("\n🔍 Running Tesseract OCR (PSM 12 for certificates)...")
    ocr_text = run_ocr_on_image(image_path, document_type='BUSINESS_PERMIT')
    
    if not ocr_text.strip():
        print("❌ OCR returned empty text")
        return False
    
    print(f"\n📝 OCR Text (first 500 chars):")
    print("-" * 50)
    print(ocr_text[:500])
    print("-" * 50)
    
    # Parse with AgencyKYCExtractionParser
    print("\n🔧 Parsing with AgencyKYCExtractionParser...")
    parser = AgencyKYCExtractionParser()
    result = parser.parse_ocr_text(ocr_text, 'BUSINESS_PERMIT')
    
    print(f"\n📋 Extracted Fields:")
    print(f"   Business Name: '{result.business_name.value}' (conf: {result.business_name.confidence})")
    print(f"   DTI Number: '{result.dti_number.value}' (conf: {result.dti_number.confidence})")
    print(f"   Permit/Cert ID: '{result.permit_number.value}' (conf: {result.permit_number.confidence})")
    print(f"   Issue Date: '{result.permit_issue_date.value}'")
    print(f"   Expiry Date: '{result.permit_expiry_date.value}'")
    
    # Validate results
    print("\n📊 Test Results:")
    all_passed = True
    
    # Business Name check
    if result.business_name.value and 'DEVANTE' in result.business_name.value.upper():
        print("   ✅ Business Name: Contains 'DEVANTE'")
    else:
        print(f"   ❌ Business Name: Expected to contain 'DEVANTE', got '{result.business_name.value}'")
        all_passed = False
    
    # DTI Number check
    if result.dti_number.value and '7663018' in str(result.dti_number.value):
        print("   ✅ DTI Number: Contains '7663018'")
    else:
        print(f"   ❌ DTI Number: Expected to contain '7663018', got '{result.dti_number.value}'")
        all_passed = False
    
    # Permit/Certificate ID check
    if result.permit_number.value and 'BPX' in str(result.permit_number.value).upper():
        print("   ✅ Certificate ID: Contains 'BPX'")
    else:
        print(f"   ❌ Certificate ID: Expected to contain 'BPX', got '{result.permit_number.value}'")
        all_passed = False
    
    # Dates check
    if result.permit_issue_date.value and '2026' in str(result.permit_issue_date.value):
        print("   ✅ Issue Date: Contains '2026'")
    else:
        print(f"   ⚠️  Issue Date: Expected to contain '2026', got '{result.permit_issue_date.value}'")
    
    if result.permit_expiry_date.value and '2031' in str(result.permit_expiry_date.value):
        print("   ✅ Expiry Date: Contains '2031'")
    else:
        print(f"   ⚠️  Expiry Date: Expected to contain '2031', got '{result.permit_expiry_date.value}'")
    
    return all_passed


def test_drivers_license():
    """Test Driver's License extraction with actual image OCR"""
    print("\n" + "=" * 70)
    print("TEST 2: Driver's License Extraction (Real OCR)")
    print("=" * 70)
    
    # Driver's License image
    image_path = os.path.join(os.path.dirname(__file__), 
                              'test_images', 
                              '622328121_2839006803157680_1149058521371295726_n.jpg')
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    print(f"\n📁 Image: {os.path.basename(image_path)}")
    print(f"📊 Size: {os.path.getsize(image_path)} bytes")
    
    # Run OCR with PSM 6 (uniform block) for ID cards
    print("\n🔍 Running Tesseract OCR (PSM 6 for ID cards)...")
    ocr_text = run_ocr_on_image(image_path, document_type='DRIVERSLICENSE')
    
    if not ocr_text.strip():
        print("❌ OCR returned empty text")
        return False
    
    print(f"\n📝 OCR Text (first 500 chars):")
    print("-" * 50)
    print(ocr_text[:500])
    print("-" * 50)
    
    # Parse with KYCExtractionParser
    print("\n🔧 Parsing with KYCExtractionParser...")
    parser = KYCExtractionParser()
    result = parser.parse_ocr_text(ocr_text, 'DRIVERSLICENSE')
    
    print(f"\n📋 Extracted Fields:")
    print(f"   Full Name: '{result.full_name.value}' (conf: {result.full_name.confidence})")
    print(f"   First Name: '{result.first_name.value}'")
    print(f"   Middle Name: '{result.middle_name.value}'")
    print(f"   Last Name: '{result.last_name.value}'")
    print(f"   ID Number: '{result.id_number.value}' (conf: {result.id_number.confidence})")
    print(f"   Birth Date: '{result.birth_date.value}'")
    print(f"   Address: '{result.address.value}'")
    print(f"   Expiry Date: '{result.expiry_date.value}'")
    
    # Validate results
    print("\n📊 Test Results:")
    all_passed = True
    
    # Name check - look for any part of the name
    name_value = (result.full_name.value or '').upper()
    if 'BAKAUN' in name_value or 'EDRIS' in name_value:
        print("   ✅ Full Name: Contains expected name parts")
    else:
        print(f"   ❌ Full Name: Expected 'BAKAUN' or 'EDRIS', got '{result.full_name.value}'")
        all_passed = False
    
    # License Number check
    id_value = result.id_number.value or ''
    if 'J13' in id_value or '010162' in id_value:
        print("   ✅ License Number: Contains expected pattern")
    else:
        print(f"   ❌ License Number: Expected 'J13' or '010162', got '{result.id_number.value}'")
        all_passed = False
    
    # Birth Date check
    birth_value = result.birth_date.value or ''
    if '2002' in birth_value or '06' in birth_value:
        print("   ✅ Birth Date: Contains expected year/month")
    else:
        print(f"   ⚠️  Birth Date: Expected '2002' or '06', got '{result.birth_date.value}'")
    
    # Address check
    addr_value = (result.address.value or '').upper()
    if 'ZAMBOANGA' in addr_value or 'SAN ROQUE' in addr_value.replace(' ', ''):
        print("   ✅ Address: Contains 'ZAMBOANGA' or 'SAN ROQUE'")
    else:
        print(f"   ⚠️  Address: Expected 'ZAMBOANGA' or 'SAN ROQUE', got '{result.address.value}'")
    
    return all_passed


def main():
    print("\n" + "🔍 " * 20)
    print("\n🔍 OCR EXTRACTION TEST WITH ACTUAL IMAGES")
    print("   Testing Tesseract OCR → Parser Pipeline")
    print("\n" + "🔍 " * 20)
    
    dti_passed = test_dti_certificate()
    dl_passed = test_drivers_license()
    
    print("\n" + "=" * 70)
    print("FINAL SUMMARY")
    print("=" * 70)
    
    if dti_passed and dl_passed:
        print("✅ ALL TESTS PASSED - OCR extraction working correctly!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Review extraction results above")
        if not dti_passed:
            print("   - DTI Certificate extraction needs fixes")
        if not dl_passed:
            print("   - Driver's License extraction needs fixes")
        return 1


if __name__ == '__main__':
    sys.exit(main())

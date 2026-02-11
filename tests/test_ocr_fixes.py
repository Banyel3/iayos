"""
Test OCR extraction fixes for DTI Certificate and Driver's License
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'backend', 'src'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from agency.kyc_extraction_parser import AgencyKYCExtractionParser
from accounts.kyc_extraction_parser import KYCExtractionParser


def test_dti_certificate():
    """Test DTI Certificate of Business Name Registration extraction"""
    print("=" * 60)
    print("TEST 1: DTI Certificate Extraction")
    print("=" * 60)
    
    # Simulated OCR text from the uploaded DTI certificate image
    dti_text = """dti
BAGONG PILIPINAS

This certifies that

DEVANTE SOFTWARE DEVELOPMENT SERVICES
(BARANGAY)

PASOBOLONG, CITY OF ZAMBOANGA REGION IX (ZAMBOANGA PENINSULA)

is a business name registered in this office pursuant to the provisions of Act 3883, as amended by Act
4147 and Republic Act No. 863, and in compliance with the applicable rules and regulations
prescribed by the Department of Trade and Industry.
This certificate issued to

VANIEL JOHN GARCIA CORNELIO

is valid from January 06, 2026 to January 06, 2031 subject to continuing compliance
with the above-mentioned laws and all applicable laws of the Philippines, unless
voluntarily cancelled

In testimony whereof, I hereby sign this

Certificate of Business Name Registration

and issue the same on January 06, 2026 in the Philippines.

MA. CRISTINA A. ROQUE
Secretary

Business Name No.7663018

This certificate is not a license to engage in any kind of business and valid only at the
scope indicated herein.

BPXW658418425073

Documentary Stamp Tax Paid Php 30.00
"""

    parser = AgencyKYCExtractionParser()
    result = parser.parse_ocr_text(dti_text, 'BUSINESS_PERMIT')
    
    print(f"\n📋 Extracted Fields:")
    print(f"   Business Name: '{result.business_name.value}'")
    print(f"   Confidence: {result.business_name.confidence}")
    print(f"   DTI Number: '{result.dti_number.value}'")
    print(f"   Permit Number: '{result.permit_number.value}'")
    print(f"   Issue Date: '{result.permit_issue_date.value}'")
    print(f"   Expiry Date: '{result.permit_expiry_date.value}'")
    
    # Validate expected values
    errors = []
    
    expected_business_name = "DEVANTE SOFTWARE DEVELOPMENT SERVICES"
    if expected_business_name.lower() not in result.business_name.value.lower():
        errors.append(f"Business Name: Expected '{expected_business_name}', got '{result.business_name.value}'")
    
    if "7663018" not in result.dti_number.value:
        errors.append(f"DTI Number: Expected contains '7663018', got '{result.dti_number.value}'")
    
    if result.permit_issue_date.value != "2026-01-06":
        errors.append(f"Issue Date: Expected '2026-01-06', got '{result.permit_issue_date.value}'")
    
    if result.permit_expiry_date.value != "2031-01-06":
        errors.append(f"Expiry Date: Expected '2031-01-06', got '{result.permit_expiry_date.value}'")
    
    print("\n📊 Test Results:")
    if not errors:
        print("   ✅ ALL DTI TESTS PASSED")
        return True
    else:
        for error in errors:
            print(f"   ❌ {error}")
        return False


def test_drivers_license():
    """Test Driver's License extraction"""
    print("\n" + "=" * 60)
    print("TEST 2: Driver's License Extraction")
    print("=" * 60)
    
    # Simulated OCR text from the uploaded Driver's License image
    dl_text = """REPUBLIC OF THE PHILIPPINES
DEPARTMENT OF TRANSPORTATION
LAND TRANSPORTATION OFFICE

DRIVER'S LICENSE

Last Name. First Name. Middle Name
BAKAUN, EDRIS SAPPAYANI

Nationality Sex Date of Birth Weight(kg) Height(m)
PHL M 2002/06/09 68 1.65

Address
SAN ROQUE, ZAMBOANGA CITY

License No. Expiration Date Agency Code
J13-20-010162 2034/06/09 J04

Blood Type Eyes Color
BROWN

DL Codes Conditions
A,A1,B,B1,B2 NONE

Signature of Licensee

ATTY. VIGOR D. MENDOZA II
Assistant Secretary
"""

    parser = KYCExtractionParser()
    result = parser.parse_ocr_text(dl_text, 'DRIVERSLICENSE')
    
    print(f"\n📋 Extracted Fields:")
    print(f"   Full Name: '{result.full_name.value}'")
    print(f"   First Name: '{result.first_name.value}'")
    print(f"   Middle Name: '{result.middle_name.value}'")
    print(f"   Last Name: '{result.last_name.value}'")
    print(f"   ID Number: '{result.id_number.value}'")
    print(f"   Birth Date: '{result.birth_date.value}'")
    print(f"   Address: '{result.address.value}'")
    print(f"   Expiry Date: '{result.expiry_date.value}'")
    print(f"   Confidence: {result.full_name.confidence}")
    
    # Validate expected values
    errors = []
    
    # Name should be parsed as "Edris Sappayani Bakaun"
    if "edris" not in result.full_name.value.lower():
        errors.append(f"Full Name missing 'Edris': got '{result.full_name.value}'")
    if "bakaun" not in result.full_name.value.lower():
        errors.append(f"Full Name missing 'Bakaun': got '{result.full_name.value}'")
    if "sappayani" not in result.full_name.value.lower():
        errors.append(f"Full Name missing 'Sappayani': got '{result.full_name.value}'")
    
    if "J13-20-010162" not in result.id_number.value.upper().replace(" ", "-"):
        errors.append(f"License No: Expected 'J13-20-010162', got '{result.id_number.value}'")
    
    if result.birth_date.value != "2002-06-09":
        errors.append(f"Birth Date: Expected '2002-06-09', got '{result.birth_date.value}'")
    
    if "zamboanga" not in result.address.value.lower():
        errors.append(f"Address: Expected contains 'ZAMBOANGA', got '{result.address.value}'")
    
    print("\n📊 Test Results:")
    if not errors:
        print("   ✅ ALL DRIVER'S LICENSE TESTS PASSED")
        return True
    else:
        for error in errors:
            print(f"   ❌ {error}")
        return False


def main():
    print("\n🔍 OCR EXTRACTION FIX VERIFICATION")
    print("Testing DTI Certificate and Driver's License extraction\n")
    
    dti_passed = test_dti_certificate()
    dl_passed = test_drivers_license()
    
    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    
    if dti_passed and dl_passed:
        print("✅ ALL TESTS PASSED - OCR extraction working correctly!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Fixes needed")
        if not dti_passed:
            print("   - DTI Certificate extraction needs fixes")
        if not dl_passed:
            print("   - Driver's License extraction needs fixes")
        return 1


if __name__ == "__main__":
    sys.exit(main())

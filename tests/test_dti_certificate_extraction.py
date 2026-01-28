"""
Test DTI Certificate of Business Name Registration extraction

This test verifies that the OCR parser correctly extracts all fields
from a DTI (Department of Trade and Industry) Certificate of Business Name Registration.

Example certificate format from user submission:
- Business Name No.7663018
- Business name: DEVANTE SOFTWARE DEVELOPMENT SERVICES
- Location: PASOBOLONG, CITY OF ZAMBOANGA REGION IX
- Issued to: VANIEL JOHN GARCIA CORNELIO
- Valid from January 06, 2026 to January 06, 2031
- Certificate ID: BPXW658418425073
"""

import sys
import os

# Add backend src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'backend', 'src'))

from agency.kyc_extraction_parser import AgencyKYCExtractionParser


def test_dti_certificate_extraction():
    """Test extraction from actual DTI certificate text"""
    
    # Actual DTI certificate text from user submission
    dti_certificate_text = """
Documentary Stamp Tax Paid Php 30.00
This certifies that
DEVANTE SOFTWARE DEVELOPMENT SERVICES
(BARANGAY)
PASOBOLONG, CITY OF ZAMBOANGA REGION IX (ZAMBOANGA PENINSULA)
is a business name registered in this office pursuant to the provisions of Act 3883, as amended by Act4147 and Republic Act No. 863, and in compliance with the applicable rules and regulationsprescribed by the Department of Trade and Industry.
This certificate issued to
VANIEL JOHN GARCIA CORNELIO
is valid from January 06, 2026 to January 06, 2031 subject to continuing compliancewith the above-mentioned laws and all applicable laws of the Philippines, unlessvoluntarily cancelled
In testimony whereof, I hereby sign this
Certificate of Business Name Registration
and issue the same on January 06, 2026 in the Philippines.
MA. CRISTINA A. ROQUE
Secretary
Business Name No.7663018
This certificate is not a license to engage in any kind of business and valid only at thescope indicated herein.
BPXW658418425073
"""
    
    parser = AgencyKYCExtractionParser()
    result = parser.parse_ocr_text(dti_certificate_text, "BUSINESS_PERMIT")
    
    print("\n" + "="*80)
    print("DTI CERTIFICATE EXTRACTION TEST RESULTS")
    print("="*80)
    
    # Test Business Name extraction
    print(f"\n📋 Business Name:")
    print(f"   Expected: DEVANTE SOFTWARE DEVELOPMENT SERVICES (or title case)")
    print(f"   Got: {result.business_name.value if result.business_name.value else 'NOT FOUND ❌'}")
    print(f"   Confidence: {result.business_name.confidence if result.business_name.confidence else 'N/A'}")
    if result.business_name.value:
        print("   ✅ PASS")
    else:
        print("   ❌ FAIL")
    
    # Test DTI Business Name Number extraction
    print(f"\n🔢 DTI Business Name Number:")
    print(f"   Expected: BN-7663018")
    print(f"   Got: {result.dti_number.value if result.dti_number.value else 'NOT FOUND ❌'}")
    print(f"   Confidence: {result.dti_number.confidence if result.dti_number.confidence else 'N/A'}")
    if result.dti_number.value and '7663018' in result.dti_number.value:
        print("   ✅ PASS")
    else:
        print("   ❌ FAIL")
    
    # Test Certificate ID extraction
    print(f"\n🆔 DTI Certificate ID:")
    print(f"   Expected: BPXW658418425073")
    print(f"   Got: {result.permit_number.value if result.permit_number.value else 'NOT FOUND ❌'}")
    print(f"   Confidence: {result.permit_number.confidence if result.permit_number.confidence else 'N/A'}")
    if result.permit_number.value == 'BPXW658418425073':
        print("   ✅ PASS")
    else:
        print("   ❌ FAIL")
    
    # Test Issue Date extraction
    print(f"\n📅 Issue Date (Valid From):")
    print(f"   Expected: 2026-01-06")
    print(f"   Got: {result.permit_issue_date.value if result.permit_issue_date.value else 'NOT FOUND ❌'}")
    print(f"   Confidence: {result.permit_issue_date.confidence if result.permit_issue_date.confidence else 'N/A'}")
    if result.permit_issue_date.value == '2026-01-06':
        print("   ✅ PASS")
    else:
        print("   ❌ FAIL")
    
    # Test Expiry Date extraction
    print(f"\n📅 Expiry Date (Valid To):")
    print(f"   Expected: 2031-01-06")
    print(f"   Got: {result.permit_expiry_date.value if result.permit_expiry_date.value else 'NOT FOUND ❌'}")
    print(f"   Confidence: {result.permit_expiry_date.confidence if result.permit_expiry_date.confidence else 'N/A'}")
    if result.permit_expiry_date.value == '2031-01-06':
        print("   ✅ PASS")
    else:
        print("   ❌ FAIL")
    
    # Test Address extraction (should contain location)
    print(f"\n📍 Business Address:")
    print(f"   Expected: Contains 'PASOBOLONG' or 'ZAMBOANGA'")
    print(f"   Got: {result.business_address.value if result.business_address.value else 'NOT FOUND ❌'}")
    print(f"   Confidence: {result.business_address.confidence if result.business_address.confidence else 'N/A'}")
    if result.business_address.value and ('PASOBOLONG' in result.business_address.value.upper() or 'ZAMBOANGA' in result.business_address.value.upper()):
        print("   ✅ PASS")
    else:
        print("   ⚠️  PARTIAL (address extraction may need enhancement)")
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    
    # Count passes
    tests_passed = 0
    tests_total = 5  # Business name, DTI number, Certificate ID, Issue date, Expiry date
    
    if result.business_name.value:
        tests_passed += 1
    if result.dti_number.value and '7663018' in result.dti_number.value:
        tests_passed += 1
    if result.permit_number.value == 'BPXW658418425073':
        tests_passed += 1
    if result.permit_issue_date.value == '2026-01-06':
        tests_passed += 1
    if result.permit_expiry_date.value == '2031-01-06':
        tests_passed += 1
    
    print(f"\nTests Passed: {tests_passed}/{tests_total}")
    
    if tests_passed == tests_total:
        print("✅ ALL TESTS PASSED - DTI extraction working correctly!")
    elif tests_passed >= 3:
        print("⚠️  PARTIAL SUCCESS - Core fields extracted but some missing")
    else:
        print("❌ TESTS FAILED - DTI extraction needs fixes")
    
    print("\n" + "="*80)
    
    return tests_passed == tests_total


if __name__ == "__main__":
    success = test_dti_certificate_extraction()
    sys.exit(0 if success else 1)

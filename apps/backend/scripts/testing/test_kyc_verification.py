#!/usr/bin/env python
"""
KYC Document Verification Test Script
=====================================
Tests the document verification service with generated test images.

Run inside Docker container:
  docker exec -it iayos-backend-dev python /app/scripts/test_kyc_verification.py

Or from host (will exec into container):
  python scripts/test_kyc_verification.py
"""
import sys
import os

# Add backend src to path
sys.path.insert(0, '/app/apps/backend/src')
os.chdir('/app/apps/backend/src')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

import django
django.setup()

from PIL import Image, ImageDraw, ImageFont
import io
from datetime import datetime

print("=" * 70)
print(" KYC DOCUMENT VERIFICATION TEST SUITE")
print(f" Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

# Import verification service
from accounts.document_verification_service import (
    DocumentVerificationService,
    verify_kyc_document,
    should_auto_reject,
    DOCUMENT_KEYWORDS,
    TESSERACT_AVAILABLE,
    FACE_REQUIRED_DOCUMENTS,
    VerificationStatus,
    RejectionReason
)

print(f"\n📋 Configuration:")
print(f"   TESSERACT_AVAILABLE: {TESSERACT_AVAILABLE}")
print(f"   FACE_REQUIRED_DOCUMENTS: {FACE_REQUIRED_DOCUMENTS}")
print(f"   DOCUMENT_KEYWORDS types: {list(DOCUMENT_KEYWORDS.keys())}")

# Initialize service
service = DocumentVerificationService()

def create_test_image(width=1200, height=900, text="", has_face_placeholder=False):
    """Create a test image with optional text and face placeholder"""
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Add border
    draw.rectangle([10, 10, width-10, height-10], outline='black', width=2)
    
    # Add text
    if text:
        lines = text.split('\n')
        y = 50
        for line in lines:
            draw.text((50, y), line, fill='black')
            y += 30
    
    # Add a simple oval as face placeholder
    if has_face_placeholder:
        face_x = width // 2
        face_y = height // 3
        face_w = 100
        face_h = 130
        draw.ellipse([face_x - face_w//2, face_y - face_h//2, 
                      face_x + face_w//2, face_y + face_h//2], 
                     fill='peachpuff', outline='black')
        # Eyes
        draw.ellipse([face_x - 25, face_y - 20, face_x - 15, face_y - 10], fill='black')
        draw.ellipse([face_x + 15, face_y - 20, face_x + 25, face_y - 10], fill='black')
        # Mouth
        draw.arc([face_x - 20, face_y + 10, face_x + 20, face_y + 40], 0, 180, fill='black')
    
    # Convert to bytes
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=95)
    return buffer.getvalue()


def run_test(test_name, document_type, image_data, expected_pass):
    """Run a single verification test"""
    print(f"\n{'='*60}")
    print(f"🧪 TEST: {test_name}")
    print(f"   Document Type: {document_type}")
    print(f"   Expected Result: {'✅ PASS' if expected_pass else '❌ REJECT'}")
    print("-" * 60)
    
    try:
        result = verify_kyc_document(
            file_data=image_data,
            document_type=document_type,
            file_name=f"test_{document_type.lower()}.jpg"
        )
        
        should_reject, rejection_msg = should_auto_reject(result)
        actual_pass = not should_reject
        
        print(f"\n📊 RESULT:")
        print(f"   Status: {result.status.value}")
        print(f"   Should Auto-Reject: {should_reject}")
        if should_reject:
            print(f"   Rejection Reason: {result.rejection_reason.value if result.rejection_reason else 'N/A'}")
            print(f"   Rejection Message: {rejection_msg}")
        print(f"   Face Detected: {result.face_detected}")
        print(f"   Face Count: {result.face_count}")
        print(f"   Quality Score: {result.quality_score:.2f}")
        print(f"   Confidence: {result.confidence_score:.2f}")
        
        if result.extracted_text:
            text_preview = result.extracted_text[:200].replace('\n', ' ')
            print(f"   OCR Text Preview: {text_preview}...")
        
        if result.details.get('keyword_check'):
            kc = result.details['keyword_check']
            print(f"   Keywords Found: {kc.get('found_keywords', [])}")
            print(f"   Keywords Missing: {kc.get('missing_groups', [])}")
        
        if result.details.get('ocr'):
            ocr = result.details['ocr']
            print(f"   OCR Skipped: {ocr.get('skipped')}")
            print(f"   OCR Error: {ocr.get('error')}")
        
        # Check if result matches expectation
        test_passed = actual_pass == expected_pass
        print(f"\n   {'✅ TEST PASSED' if test_passed else '❌ TEST FAILED'} (Expected: {'PASS' if expected_pass else 'REJECT'}, Got: {'PASS' if actual_pass else 'REJECT'})")
        
        return test_passed, result
        
    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        return False, None


# ============================================================
# TEST CASES
# ============================================================

test_results = []

# Test 1: Valid Philippine Passport (with keywords)
print("\n" + "=" * 70)
print(" TEST CATEGORY: PASSPORT")
print("=" * 70)

passport_valid = create_test_image(
    width=1200, height=900,
    text="""REPUBLIKA NG PILIPINAS
REPUBLIC OF THE PHILIPPINES

PASAPORTE / PASSPORT

Type/Uri: P
Country Code/Kodigo ng Bansa: PHL
Passport No./Numero ng Pasaporte: P1234567A

Surname/Apelyido: DELA CRUZ
Given Names/Mga Pangalan: JUAN MIGUEL

Nationality/Nasyonalidad: FILIPINO
Date of Birth/Petsa ng Kapanganakan: 01 JAN 1990
Sex/Kasarian: M

PILIPINAS
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Valid Philippine Passport with Keywords",
    "PASSPORT",
    passport_valid,
    expected_pass=True  # Should pass if OCR finds PASAPORTE and PILIPINAS
)
test_results.append(("Passport - Valid", passed))


# Test 2: Invalid Passport (missing keywords)
passport_invalid = create_test_image(
    width=1200, height=900,
    text="""UNITED STATES OF AMERICA

PASSPORT

Type: P
Passport No.: 123456789

Surname: SMITH
Given Names: JOHN

Nationality: AMERICAN
Date of Birth: 01 JAN 1990
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Invalid Passport - Missing Philippine Keywords",
    "PASSPORT",
    passport_invalid,
    expected_pass=False  # Should reject - no PILIPINAS/PASAPORTE
)
test_results.append(("Passport - Invalid (US)", passed))


# Test 3: Valid NBI Clearance
print("\n" + "=" * 70)
print(" TEST CATEGORY: NBI CLEARANCE")
print("=" * 70)

nbi_valid = create_test_image(
    width=1200, height=900,
    text="""REPUBLIKA NG PILIPINAS
NATIONAL BUREAU OF INVESTIGATION

NBI CLEARANCE

This is to certify that the person whose name,
photograph and right thumbprint appear hereon
has no derogatory record on file as of the date
of this clearance.

Name: JUAN DELA CRUZ
Date of Birth: January 1, 1990
Valid Until: December 31, 2025

CLEARANCE NUMBER: NBI-2025-12345678
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Valid NBI Clearance with Keywords",
    "NBI",
    nbi_valid,
    expected_pass=True  # Should pass - has NBI and CLEARANCE
)
test_results.append(("NBI - Valid", passed))


# Test 4: Invalid NBI (missing clearance text)
nbi_invalid = create_test_image(
    width=1200, height=900,
    text="""NATIONAL BUREAU OF INVESTIGATION

CERTIFICATE OF APPEARANCE

This is to certify that JUAN DELA CRUZ
appeared at our office on December 12, 2025.

NBI Office - Manila
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Invalid NBI - Missing CLEARANCE keyword",
    "NBI",
    nbi_invalid,
    expected_pass=False  # Should reject - no CLEARANCE keyword
)
test_results.append(("NBI - Invalid (missing CLEARANCE)", passed))


# Test 5: Valid National ID
print("\n" + "=" * 70)
print(" TEST CATEGORY: NATIONAL ID (PhilSys)")
print("=" * 70)

nationalid_valid = create_test_image(
    width=1200, height=900,
    text="""REPUBLIKA NG PILIPINAS
PHILIPPINE IDENTIFICATION SYSTEM

PHILSYS ID

PSN: 1234-5678-9012-3456

Surname: DELA CRUZ
First Name: JUAN
Middle Name: MIGUEL

Date of Birth: 01 JAN 1990
Sex: MALE
Address: Manila, Philippines

PILIPINAS
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Valid Philippine National ID",
    "NATIONALID",
    nationalid_valid,
    expected_pass=True  # Should pass
)
test_results.append(("National ID - Valid", passed))


# Test 6: Invalid National ID (foreign ID)
nationalid_invalid = create_test_image(
    width=1200, height=900,
    text="""UNITED STATES

SOCIAL SECURITY CARD

SSN: 123-45-6789

Name: JOHN SMITH
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Invalid National ID - US Social Security Card",
    "NATIONALID",
    nationalid_invalid,
    expected_pass=False  # Should reject - not Philippine
)
test_results.append(("National ID - Invalid (US)", passed))


# Test 7: Valid Driver's License
print("\n" + "=" * 70)
print(" TEST CATEGORY: DRIVER'S LICENSE")
print("=" * 70)

license_valid = create_test_image(
    width=1200, height=900,
    text="""REPUBLIKA NG PILIPINAS
LAND TRANSPORTATION OFFICE

DRIVER'S LICENSE

License No.: N01-12-345678
Name: DELA CRUZ, JUAN M.
Address: Manila, Philippines

Expiry: 2028-12-31
Restriction: NON-PROFESSIONAL

PILIPINAS
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Valid Philippine Driver's License",
    "DRIVERSLICENSE",
    license_valid,
    expected_pass=True  # Should pass
)
test_results.append(("Driver's License - Valid", passed))


# Test 8: Random image (no face, no keywords)
print("\n" + "=" * 70)
print(" TEST CATEGORY: INVALID DOCUMENTS")
print("=" * 70)

random_image = create_test_image(
    width=800, height=600,
    text="""RANDOM DOCUMENT

This is just a random piece of paper
with some text on it.

Nothing important here.
""",
    has_face_placeholder=False  # No face
)
passed, result = run_test(
    "Random Document - No Face, No Keywords",
    "PASSPORT",
    random_image,
    expected_pass=False  # Should reject - no face for passport
)
test_results.append(("Random Doc - Passport Type", passed))


# Test 9: Low resolution image
print("\n" + "=" * 70)
print(" TEST CATEGORY: IMAGE QUALITY")
print("=" * 70)

low_res = create_test_image(
    width=200, height=150,  # Below 640px minimum
    text="PILIPINAS PASAPORTE",
    has_face_placeholder=True
)
passed, result = run_test(
    "Low Resolution Image",
    "PASSPORT",
    low_res,
    expected_pass=False  # Should reject - resolution too low
)
test_results.append(("Low Resolution", passed))


# Test 10: Police Clearance
print("\n" + "=" * 70)
print(" TEST CATEGORY: POLICE CLEARANCE")
print("=" * 70)

police_valid = create_test_image(
    width=1200, height=900,
    text="""REPUBLIKA NG PILIPINAS
PHILIPPINE NATIONAL POLICE

POLICE CLEARANCE CERTIFICATE

This is to certify that as per records
available in this office, the person whose
name and signature appear below has no
derogatory record.

Name: JUAN DELA CRUZ
Address: Manila, Philippines
Purpose: Employment

PNP CLEARANCE NUMBER: PNP-2025-12345
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Valid Police Clearance",
    "POLICE",
    police_valid,
    expected_pass=True  # Should pass
)
test_results.append(("Police Clearance - Valid", passed))


# Test 11: UMID
print("\n" + "=" * 70)
print(" TEST CATEGORY: UMID")
print("=" * 70)

umid_valid = create_test_image(
    width=1200, height=900,
    text="""REPUBLIKA NG PILIPINAS

UNIFIED MULTI-PURPOSE ID

UMID

SSS CRN: 01-2345678-9

Name: DELA CRUZ, JUAN M.
Date of Birth: 01-01-1990
Sex: M

PILIPINAS
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Valid UMID",
    "UMID",
    umid_valid,
    expected_pass=True  # Should pass
)
test_results.append(("UMID - Valid", passed))


# Test 12: PhilHealth
print("\n" + "=" * 70)
print(" TEST CATEGORY: PHILHEALTH")
print("=" * 70)

philhealth_valid = create_test_image(
    width=1200, height=900,
    text="""REPUBLIKA NG PILIPINAS

PHILHEALTH
PHILIPPINE HEALTH INSURANCE CORPORATION

MEMBER ID CARD

PIN: 01-234567890-1
Name: DELA CRUZ, JUAN
Category: EMPLOYED

PILIPINAS
""",
    has_face_placeholder=True
)
passed, result = run_test(
    "Valid PhilHealth ID",
    "PHILHEALTH",
    philhealth_valid,
    expected_pass=True  # Should pass
)
test_results.append(("PhilHealth - Valid", passed))


# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 70)
print(" TEST SUMMARY")
print("=" * 70)

passed_count = sum(1 for _, passed in test_results if passed)
total_count = len(test_results)

print(f"\n📊 Results: {passed_count}/{total_count} tests passed\n")

for test_name, passed in test_results:
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"   {status} - {test_name}")

print("\n" + "=" * 70)
print(" REJECTION REASONS DOCUMENTATION")
print("=" * 70)
print("""
📋 KYC DOCUMENT REJECTION REASONS:

1. NO_FACE_DETECTED
   - Applies to: PASSPORT, NATIONALID, UMID, PHILHEALTH, DRIVERSLICENSE, FRONTID, SELFIE
   - Cause: CompreFace could not detect a face in the image
   - Fix: Upload a clearer photo with face visible

2. FACE_TOO_SMALL
   - Applies to: All documents requiring face
   - Cause: Face is less than 5% of image area
   - Fix: Take photo closer or with higher resolution

3. MISSING_REQUIRED_TEXT (OCR Failed)
   - Applies to: NBI, POLICE, PASSPORT, NATIONALID, DRIVERSLICENSE, UMID, PHILHEALTH
   - Cause: Tesseract OCR didn't find required keywords
   - Keywords by document type:
     * NBI: ["NBI" or "NATIONAL BUREAU OF INVESTIGATION"] + ["CLEARANCE"]
     * POLICE: ["POLICE" or "PNP" or "PHILIPPINE NATIONAL POLICE"] + ["CLEARANCE" or "CERTIFICATE"]
     * PASSPORT: ["PASAPORTE" or "PASSPORT"] + ["PILIPINAS" or "PHILIPPINES" or "REPUBLIKA"]
     * NATIONALID: ["PHILSYS" or "PHILIPPINE IDENTIFICATION" or "NATIONAL ID" or "PSN"] + ["PILIPINAS" or "PHILIPPINES" or "REPUBLIKA"]
     * DRIVERSLICENSE: ["DRIVER" or "LICENSE" or "LTO" or "LAND TRANSPORTATION"] + ["PILIPINAS" or etc.]
     * UMID: ["UMID" or "UNIFIED MULTI-PURPOSE" or "MULTI PURPOSE"] + ["SSS" or "GSIS" or etc.]
     * PHILHEALTH: ["PHILHEALTH" or "PHILIPPINE HEALTH" or "PHIC"] + ["MEMBER" or "ID" or etc.]
   - Fix: Upload clear, high-resolution image of valid Philippine document

4. UNREADABLE_DOCUMENT (OCR Error)
   - Applies to: All document types requiring OCR
   - Cause: Tesseract failed to process the image (crashed or unavailable)
   - Fix: Try again, or contact support

5. IMAGE_TOO_BLURRY
   - Applies to: All documents
   - Cause: Laplacian variance below threshold (blur detected)
   - Fix: Take a clearer, sharper photo

6. RESOLUTION_TOO_LOW
   - Applies to: All documents
   - Cause: Image width or height below 640px
   - Fix: Upload higher resolution image

7. FACE_MISMATCH
   - Applies to: Selfie vs Front ID comparison
   - Cause: Face similarity score below 80%
   - Fix: Ensure selfie matches the person on ID

📋 ACCEPTANCE CRITERIA:

For a document to PASS verification:
1. Resolution >= 640px on both dimensions
2. Not blurry (Laplacian variance > threshold)
3. Face detected (for IDs and selfie)
4. Face large enough (>5% of image area)
5. Required keywords found via OCR (for applicable document types)
6. Selfie matches ID photo (similarity >= 80%)
""")

print("\n" + "=" * 70)
print(" TEST COMPLETE")
print("=" * 70)

#!/usr/bin/env python
"""
KYC Services Quick Test Script
Run with: docker exec -w /app/apps/backend/src iayos-backend-dev python test_kyc_services.py
"""

import os
import sys
import io

# Add backend src to path
sys.path.insert(0, '/app/apps/backend/src')

# Set Django settings - MUST be iayos_project.settings (not api.settings)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

import django
django.setup()

from PIL import Image, ImageDraw


def create_test_id_image():
    """Create a test ID image with face and Philippine ID text"""
    img = Image.new('RGB', (800, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Header with text for OCR
    draw.rectangle([0, 0, 800, 60], fill=(0, 51, 102))
    draw.text((50, 15), "REPUBLIKA NG PILIPINAS", fill='white')
    draw.text((50, 35), "PHILIPPINE IDENTIFICATION SYSTEM - PHILSYS", fill='white')
    
    # Face placeholder
    face_x, face_y = 120, 200
    draw.ellipse([face_x - 50, face_y - 65, face_x + 50, face_y + 65], 
                 fill=(255, 220, 185), outline=(100, 100, 100))
    
    # Eyes
    for offset in [-20, 20]:
        draw.ellipse([face_x + offset - 8, face_y - 15 - 8, 
                     face_x + offset + 8, face_y - 15 + 8], 
                     fill='white', outline='black')
        draw.ellipse([face_x + offset - 3, face_y - 15 - 3,
                     face_x + offset + 3, face_y - 15 + 3], fill='black')
    
    # Personal info for OCR
    info = [
        "PSN: 1234-5678-9012-3456",
        "SURNAME: DELA CRUZ",
        "GIVEN NAME: JUAN SANTOS",
        "DATE OF BIRTH: 1990-01-15",
        "ADDRESS: ZAMBOANGA CITY"
    ]
    y = 100
    for line in info:
        draw.text((250, y), line, fill='black')
        y += 30
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    return buf.getvalue()


def create_test_selfie():
    """Create a test selfie image with face"""
    img = Image.new('RGB', (600, 800), color=(200, 220, 240))
    draw = ImageDraw.Draw(img)
    
    # Face
    face_x, face_y = 300, 350
    draw.ellipse([face_x - 90, face_y - 115, face_x + 90, face_y + 115], 
                 fill=(255, 220, 185), outline=(150, 130, 110))
    
    # Eyes
    for offset in [-30, 30]:
        draw.ellipse([face_x + offset - 12, face_y - 25 - 12,
                     face_x + offset + 12, face_y - 25 + 12], 
                     fill='white', outline='black')
        draw.ellipse([face_x + offset - 4, face_y - 25 - 4,
                     face_x + offset + 4, face_y - 25 + 4], fill='black')
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    return buf.getvalue()


def create_test_clearance():
    """Create a test NBI clearance with OCR text"""
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Header
    draw.rectangle([0, 0, 800, 80], fill=(0, 51, 102))
    draw.text((200, 20), "NATIONAL BUREAU OF INVESTIGATION", fill='white')
    draw.text((320, 50), "NBI CLEARANCE", fill='yellow')
    
    # Content
    content = [
        "REPUBLIKA NG PILIPINAS",
        "CLEARANCE CERTIFICATE",
        "",
        "NBI CLEARANCE NO: 2024-12345678",
        "NAME: DELA CRUZ, JUAN SANTOS",
        "DATE OF BIRTH: JANUARY 15, 1990",
        "ADDRESS: ZAMBOANGA CITY",
        "",
        "NO DEROGATORY RECORD",
        "",
        "DATE ISSUED: JANUARY 20, 2025",
        "VALID UNTIL: JULY 20, 2025"
    ]
    y = 120
    for line in content:
        draw.text((50, y), line, fill='black')
        y += 40
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    return buf.getvalue()


def test_face_service_status():
    """Test 1: Check face service availability"""
    print("\n" + "=" * 60)
    print("TEST 1: Face Detection Service Status")
    print("=" * 60)
    
    from accounts.face_detection_service import check_face_services_available
    
    status = check_face_services_available()
    
    print(f"\nDeepFace Available:  {status.get('deepface_available', False)}")
    print(f"Face Detection:      {status.get('face_detection_available', False)}")
    print(f"Face Comparison:     {status.get('face_comparison_available', False)}")
    print(f"Model:               {status.get('model', 'N/A')}")
    print(f"Detector:            {status.get('detector', 'N/A')}")
    print(f"Threshold:           {status.get('threshold', 'N/A')}")
    
    return status.get('deepface_available', False)


def test_face_detection():
    """Test 2: Detect face in test images"""
    print("\n" + "=" * 60)
    print("TEST 2: Face Detection")
    print("=" * 60)
    
    from accounts.face_detection_service import get_face_service
    
    service = get_face_service()
    
    # Test ID image
    print("\n[ID Front Image]")
    id_image = create_test_id_image()
    result = service.detect_face(id_image)
    print(f"  Detected:   {result.detected}")
    print(f"  Count:      {result.count}")
    print(f"  Confidence: {result.confidence:.2f}")
    print(f"  Error:      {result.error}")
    
    # Test selfie
    print("\n[Selfie Image]")
    selfie = create_test_selfie()
    result = service.detect_face(selfie)
    print(f"  Detected:   {result.detected}")
    print(f"  Count:      {result.count}")
    print(f"  Confidence: {result.confidence:.2f}")
    print(f"  Error:      {result.error}")
    
    return True


def test_face_comparison():
    """Test 3: Compare faces between ID and selfie"""
    print("\n" + "=" * 60)
    print("TEST 3: Face Comparison (ID vs Selfie)")
    print("=" * 60)
    
    from accounts.face_detection_service import get_face_service
    from accounts.document_verification_service import verify_face_match
    
    id_image = create_test_id_image()
    selfie = create_test_selfie()
    
    # Direct comparison - returns FaceComparisonResult dataclass
    print("\n[Direct Comparison via service.compare_faces()]")
    service = get_face_service()
    result = service.compare_faces(id_image, selfie)
    
    # FaceComparisonResult is a dataclass, use attribute access
    print(f"  Match:      {result.match}")
    print(f"  Similarity: {result.similarity:.2%}")
    print(f"  Distance:   {result.distance}")
    print(f"  Threshold:  {result.threshold}")
    print(f"  ID Face:    {result.id_has_face}")
    print(f"  Selfie:     {result.selfie_has_face}")
    print(f"  Model:      {result.model}")
    print(f"  Skipped:    {result.skipped}")
    print(f"  Error:      {result.error}")
    
    # verify_face_match function (used by KYC upload) - returns a dict
    print("\n[verify_face_match() - Used by KYC Upload]")
    match_result = verify_face_match(id_image, selfie, similarity_threshold=0.40)
    
    print(f"  Match:      {match_result.get('match', 'N/A')}")
    print(f"  Similarity: {match_result.get('similarity', 0):.2%}")
    print(f"  Method:     {match_result.get('method', 'N/A')}")
    print(f"  Skipped:    {match_result.get('skipped', False)}")
    
    return True


def test_ocr_extraction():
    """Test 4: OCR text extraction"""
    print("\n" + "=" * 60)
    print("TEST 4: OCR Text Extraction (Tesseract)")
    print("=" * 60)
    
    from accounts.document_verification_service import DocumentVerificationService, TESSERACT_AVAILABLE
    
    print(f"\nTesseract Available: {TESSERACT_AVAILABLE}")
    
    if not TESSERACT_AVAILABLE:
        print("OCR not available - skipping")
        return True
    
    service = DocumentVerificationService()
    
    # Test ID OCR
    print("\n[ID Front - OCR]")
    id_image = create_test_id_image()
    result = service._extract_text(Image.open(io.BytesIO(id_image)))
    text = result.get('text', '')
    print(f"  Text Length:  {len(text)}")
    print(f"  Confidence:   {result.get('confidence', 0):.2f}")
    print(f"  Skipped:      {result.get('skipped', False)}")
    if text:
        preview = text[:200].replace('\n', ' ')
        print(f"  Preview:      \"{preview}...\"")
        # Check keywords
        keywords = ['PILIPINAS', 'PHILIPPINE', 'PHILSYS', 'DELA CRUZ']
        found = [k for k in keywords if k.upper() in text.upper()]
        print(f"  Keywords:     {found}")
    
    # Test clearance OCR
    print("\n[NBI Clearance - OCR]")
    clearance = create_test_clearance()
    result = service._extract_text(Image.open(io.BytesIO(clearance)))
    text = result.get('text', '')
    print(f"  Text Length:  {len(text)}")
    print(f"  Confidence:   {result.get('confidence', 0):.2f}")
    if text:
        preview = text[:200].replace('\n', ' ')
        print(f"  Preview:      \"{preview}...\"")
        # Check keywords
        keywords = ['NBI', 'NATIONAL BUREAU', 'CLEARANCE', 'DEROGATORY']
        found = [k for k in keywords if k.upper() in text.upper()]
        print(f"  Keywords:     {found}")
    
    return True


def test_document_verification():
    """Test 5: Full document verification flow"""
    print("\n" + "=" * 60)
    print("TEST 5: Full Document Verification")
    print("=" * 60)
    
    from accounts.document_verification_service import DocumentVerificationService
    
    service = DocumentVerificationService()
    
    # Verify ID front
    print("\n[Verifying ID Front]")
    id_image = create_test_id_image()
    result = service.verify_document(id_image, "FRONTID", "test_id_front.png")
    
    print(f"  Status:        {result.status}")
    print(f"  Quality Score: {result.quality_score:.2f}")
    print(f"  Face Detected: {result.face_detected}")
    print(f"  Face Count:    {result.face_count}")
    print(f"  Confidence:    {result.confidence_score:.2f}")
    print(f"  Warnings:      {result.warnings}")
    if result.rejection_reason:
        print(f"  Rejection:     {result.rejection_reason}")
    
    # Verify clearance
    print("\n[Verifying NBI Clearance]")
    clearance = create_test_clearance()
    result = service.verify_document(clearance, "NBI", "test_nbi_clearance.png")
    
    print(f"  Status:        {result.status}")
    print(f"  Quality Score: {result.quality_score:.2f}")
    print(f"  Confidence:    {result.confidence_score:.2f}")
    print(f"  Warnings:      {result.warnings}")
    if result.extracted_text:
        print(f"  OCR Length:    {len(result.extracted_text)} chars")
    if result.rejection_reason:
        print(f"  Rejection:     {result.rejection_reason}")
    
    return True


def main():
    print("\n" + "=" * 60)
    print("iAyos KYC Services Quick Test")
    print("=" * 60)
    
    results = {}
    
    try:
        results['face_service'] = test_face_service_status()
    except Exception as e:
        print(f"\nERROR: {e}")
        results['face_service'] = False
    
    try:
        results['face_detection'] = test_face_detection()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        results['face_detection'] = False
    
    try:
        results['face_comparison'] = test_face_comparison()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        results['face_comparison'] = False
    
    try:
        results['ocr'] = test_ocr_extraction()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        results['ocr'] = False
    
    try:
        results['verification'] = test_document_verification()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        results['verification'] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test}: {status}")
    
    if all(results.values()):
        print("\n✅ All service tests passed!")
        return 0
    else:
        print("\n❌ Some tests failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())

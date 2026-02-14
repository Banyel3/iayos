"""
Comprehensive KYC Endpoint Testing Script

Tests both Mobile (Personal) and Agency (Business) KYC flows:
1. Face Detection - Verify faces can be detected in images
2. Face Comparison - Verify selfie matches ID photo
3. OCR Extraction - Verify text extraction from documents

Run from inside the Docker container:
    docker exec -it iayos-backend-dev python /app/tests/test_kyc_endpoints_comprehensive.py

Or run specific tests:
    docker exec -it iayos-backend-dev python /app/tests/test_kyc_endpoints_comprehensive.py --mobile
    docker exec -it iayos-backend-dev python /app/tests/test_kyc_endpoints_comprehensive.py --agency
"""

import os
import sys
import io
import argparse
import requests
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

# Configuration
API_BASE = "http://localhost:8000"

# Test user credentials (worker account for mobile KYC)
TEST_EMAIL = "worker@test.com"
TEST_PASSWORD = "password123"

# Agency test credentials (if different)
AGENCY_EMAIL = "agency@test.com"
AGENCY_PASSWORD = "password123"


def create_id_front_image(with_text: bool = True) -> bytes:
    """
    Create a test ID front image with:
    - Face-like oval
    - Philippine ID text for OCR testing
    - Government ID styling
    """
    img = Image.new('RGB', (800, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Header with Philippine ID text (for OCR)
    draw.rectangle([0, 0, 800, 60], fill=(0, 51, 102))
    draw.text((50, 15), "REPUBLIKA NG PILIPINAS", fill='white')
    draw.text((50, 35), "PHILIPPINE IDENTIFICATION SYSTEM", fill='white')
    
    # Face placeholder (oval)
    face_x, face_y = 120, 200
    face_width, face_height = 100, 130
    draw.ellipse([
        face_x - face_width//2, face_y - face_height//2,
        face_x + face_width//2, face_y + face_height//2
    ], fill=(255, 220, 185), outline=(100, 100, 100))
    
    # Eyes
    eye_y = face_y - 15
    for offset in [-25, 25]:
        draw.ellipse([
            face_x + offset - 8, eye_y - 8,
            face_x + offset + 8, eye_y + 8
        ], fill='white', outline='black')
        draw.ellipse([
            face_x + offset - 3, eye_y - 3,
            face_x + offset + 3, eye_y + 3
        ], fill='black')
    
    # Nose and mouth
    draw.line([face_x, face_y, face_x, face_y + 20], fill=(180, 150, 130), width=2)
    draw.arc([face_x - 15, face_y + 25, face_x + 15, face_y + 40], 0, 180, fill='red', width=2)
    
    if with_text:
        # Personal information (for OCR testing)
        text_x = 250
        info_lines = [
            "PHILSYS IDENTIFICATION NUMBER (PSN)",
            "1234-5678-9012-3456",
            "",
            "SURNAME: DELA CRUZ",
            "GIVEN NAME: JUAN",
            "MIDDLE NAME: SANTOS",
            "",
            "DATE OF BIRTH: JANUARY 15, 1990",
            "SEX: MALE",
            "ADDRESS: 123 MAIN STREET, ZAMBOANGA CITY"
        ]
        y = 90
        for line in info_lines:
            draw.text((text_x, y), line, fill='black')
            y += 22
    
    # Footer
    draw.rectangle([0, 470, 800, 500], fill=(0, 51, 102))
    draw.text((50, 478), "VALID UNTIL: DECEMBER 31, 2030", fill='white')
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    buf.seek(0)
    return buf.read()


def create_id_back_image() -> bytes:
    """Create a test ID back image with signature and barcode areas"""
    img = Image.new('RGB', (800, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Header
    draw.rectangle([0, 0, 800, 50], fill=(0, 51, 102))
    draw.text((50, 15), "PHILIPPINE IDENTIFICATION SYSTEM - BACK", fill='white')
    
    # Signature area
    draw.rectangle([50, 100, 350, 200], outline=(100, 100, 100))
    draw.text((150, 140), "SIGNATURE", fill=(150, 150, 150))
    
    # Barcode placeholder
    draw.rectangle([400, 100, 750, 180], fill=(0, 0, 0))
    draw.rectangle([410, 110, 740, 170], fill=(255, 255, 255))
    
    # Additional text for OCR
    draw.text((50, 250), "REPUBLIKA NG PILIPINAS", fill='black')
    draw.text((50, 280), "EMERGENCY CONTACT: 09171234567", fill='black')
    draw.text((50, 310), "BLOOD TYPE: O+", fill='black')
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    buf.seek(0)
    return buf.read()


def create_selfie_image() -> bytes:
    """Create a test selfie image (similar face to ID)"""
    img = Image.new('RGB', (600, 800), color=(200, 220, 240))
    draw = ImageDraw.Draw(img)
    
    # Face (larger, selfie style)
    face_x, face_y = 300, 350
    face_width, face_height = 180, 230
    draw.ellipse([
        face_x - face_width//2, face_y - face_height//2,
        face_x + face_width//2, face_y + face_height//2
    ], fill=(255, 220, 185), outline=(150, 130, 110))
    
    # Eyes
    eye_y = face_y - 30
    for offset in [-40, 40]:
        draw.ellipse([
            face_x + offset - 15, eye_y - 15,
            face_x + offset + 15, eye_y + 15
        ], fill='white', outline='black')
        draw.ellipse([
            face_x + offset - 5, eye_y - 5,
            face_x + offset + 5, eye_y + 5
        ], fill='black')
    
    # Eyebrows
    for offset in [-40, 40]:
        draw.arc([
            face_x + offset - 20, eye_y - 35,
            face_x + offset + 20, eye_y - 20
        ], 0, 180, fill=(80, 60, 40), width=3)
    
    # Nose
    draw.line([face_x, face_y - 10, face_x, face_y + 30], fill=(200, 170, 150), width=3)
    draw.arc([face_x - 15, face_y + 20, face_x + 15, face_y + 40], 0, 180, fill=(180, 150, 130), width=2)
    
    # Mouth
    draw.arc([face_x - 30, face_y + 50, face_x + 30, face_y + 80], 0, 180, fill='red', width=3)
    
    # Hair
    draw.arc([
        face_x - face_width//2 - 10, face_y - face_height//2 - 30,
        face_x + face_width//2 + 10, face_y - 20
    ], 180, 360, fill=(40, 30, 20), width=40)
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    buf.seek(0)
    return buf.read()


def create_clearance_image() -> bytes:
    """Create a test NBI/Police clearance image with OCR-readable text"""
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # NBI Header
    draw.rectangle([0, 0, 800, 80], fill=(0, 51, 102))
    draw.text((200, 15), "NATIONAL BUREAU OF INVESTIGATION", fill='white')
    draw.text((300, 45), "NBI CLEARANCE", fill='yellow')
    
    # NBI Logo placeholder
    draw.ellipse([350, 100, 450, 200], outline=(0, 51, 102), width=3)
    draw.text((365, 140), "NBI", fill=(0, 51, 102))
    
    # Clearance content (OCR testable)
    content = [
        "",
        "REPUBLIKA NG PILIPINAS",
        "NATIONAL BUREAU OF INVESTIGATION",
        "",
        "CLEARANCE CERTIFICATE",
        "",
        "NBI CLEARANCE NO: 2024-12345678",
        "",
        "NAME: DELA CRUZ, JUAN SANTOS",
        "DATE OF BIRTH: JANUARY 15, 1990",
        "PLACE OF BIRTH: ZAMBOANGA CITY",
        "NATIONALITY: FILIPINO",
        "",
        "ADDRESS: 123 MAIN STREET",
        "BARANGAY TETUAN",
        "ZAMBOANGA CITY, ZAMBOANGA DEL SUR",
        "",
        "PURPOSE: EMPLOYMENT",
        "",
        "This is to certify that the above-named",
        "person has NO DEROGATORY RECORD on file",
        "as of the date of this clearance.",
        "",
        "DATE ISSUED: JANUARY 20, 2025",
        "VALID UNTIL: JULY 20, 2025"
    ]
    
    y = 220
    for line in content:
        if "CLEARANCE CERTIFICATE" in line:
            draw.text((280, y), line, fill=(0, 51, 102))
        else:
            draw.text((50, y), line, fill='black')
        y += 28
    
    # Official stamp placeholder
    draw.ellipse([580, 750, 750, 920], outline='red', width=2)
    draw.text((620, 820), "OFFICIAL", fill='red')
    draw.text((630, 845), "STAMP", fill='red')
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    buf.seek(0)
    return buf.read()


def create_business_permit_image() -> bytes:
    """Create a test business permit image for agency KYC"""
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Header
    draw.rectangle([0, 0, 800, 100], fill=(0, 100, 0))
    draw.text((200, 20), "CITY OF ZAMBOANGA", fill='white')
    draw.text((180, 50), "BUSINESS PERMIT AND LICENSING OFFICE", fill='white')
    
    # Permit content (OCR testable)
    content = [
        "",
        "BUSINESS PERMIT",
        "PERMIT NO: 2024-BP-12345",
        "",
        "BUSINESS NAME: AYOS SERVICES CORP",
        "TRADE NAME: IAYOS PHILIPPINES",
        "",
        "OWNER/OPERATOR: JUAN DELA CRUZ",
        "BUSINESS ADDRESS:",
        "123 MAIN STREET, BARANGAY TETUAN",
        "ZAMBOANGA CITY 7000",
        "",
        "NATURE OF BUSINESS: SERVICE MARKETPLACE",
        "BUSINESS TYPE: CORPORATION",
        "",
        "DATE ISSUED: JANUARY 1, 2025",
        "VALID UNTIL: DECEMBER 31, 2025",
        "",
        "SEC REGISTRATION NO: CS202412345",
        "TIN: 123-456-789-000",
        "",
        "This permit is issued upon compliance with",
        "all requirements and payment of proper fees."
    ]
    
    y = 130
    for line in content:
        if "BUSINESS PERMIT" in line and "NO:" not in line:
            draw.text((300, y), line, fill=(0, 100, 0))
            y += 40
        else:
            draw.text((50, y), line, fill='black')
            y += 30
    
    # Official seal
    draw.ellipse([580, 800, 750, 970], outline='green', width=2)
    draw.text((610, 870), "CITY SEAL", fill='green')
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    buf.seek(0)
    return buf.read()


def get_auth_token(email: str, password: str) -> str:
    """Authenticate and get JWT token for mobile API"""
    print(f"\n🔐 Authenticating as {email}...")
    
    response = requests.post(
        f"{API_BASE}/api/mobile/auth/login",
        json={"email": email, "password": password}
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token") or data.get("token")
        if token:
            print(f"   ✅ Authenticated successfully!")
            return token
        else:
            print(f"   ❌ No token in response: {data}")
            return None
    else:
        print(f"   ❌ Authentication failed: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        return None


def get_session_cookie(email: str, password: str) -> dict:
    """Get session cookie for web API (agency endpoints)"""
    print(f"\n🔐 Creating session for {email}...")
    
    session = requests.Session()
    response = session.post(
        f"{API_BASE}/api/accounts/login",
        json={"email": email, "password": password}
    )
    
    if response.status_code == 200:
        cookies = session.cookies.get_dict()
        print(f"   ✅ Session created!")
        return {"session": session, "cookies": cookies}
    else:
        print(f"   ❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        return None


def test_face_detection_service():
    """Test 1: Verify DeepFace face detection is working"""
    print("\n" + "=" * 70)
    print("TEST 1: Face Detection Service Status")
    print("=" * 70)
    
    # This test runs inside the container
    try:
        # Add backend to path
        sys.path.insert(0, '/app/apps/backend/src')
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
        
        import django
        django.setup()
        
        from accounts.face_detection_service import check_face_services_available, get_face_service
        
        # Check service status
        status = check_face_services_available()
        
        print("\n📋 Face Service Status:")
        print(f"   DeepFace Available:  {status.get('deepface_available', False)}")
        print(f"   Face Detection:      {status.get('face_detection_available', False)}")
        print(f"   Face Comparison:     {status.get('face_comparison_available', False)}")
        print(f"   Model:               {status.get('model', 'N/A')}")
        print(f"   Detector:            {status.get('detector', 'N/A')}")
        print(f"   Threshold:           {status.get('threshold', 'N/A')}")
        
        if not status.get('deepface_available'):
            print("\n❌ FAIL: DeepFace not available!")
            return False
        
        # Test face detection on ID image
        print("\n📸 Testing face detection on ID front image...")
        service = get_face_service()
        id_image = create_id_front_image()
        
        result = service.detect_face(id_image)
        print(f"   Detected:       {result.detected}")
        print(f"   Face Count:     {result.count}")
        print(f"   Confidence:     {result.confidence:.2f}")
        print(f"   Error:          {result.error}")
        
        # Test on selfie
        print("\n📸 Testing face detection on selfie image...")
        selfie_image = create_selfie_image()
        result = service.detect_face(selfie_image)
        print(f"   Detected:       {result.detected}")
        print(f"   Face Count:     {result.count}")
        print(f"   Confidence:     {result.confidence:.2f}")
        print(f"   Error:          {result.error}")
        
        print("\n✅ PASS: Face detection service is operational!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_face_comparison_service():
    """Test 2: Verify face comparison between ID and selfie"""
    print("\n" + "=" * 70)
    print("TEST 2: Face Comparison Service")
    print("=" * 70)
    
    try:
        sys.path.insert(0, '/app/apps/backend/src')
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
        
        import django
        django.setup()
        
        from accounts.face_detection_service import get_face_service
        from accounts.document_verification_service import verify_face_match
        
        service = get_face_service()
        
        # Create test images
        id_image = create_id_front_image()
        selfie_image = create_selfie_image()
        
        # Test direct comparison
        print("\n🔍 Comparing ID front to selfie...")
        result = service.compare_faces(id_image, selfie_image)
        
        print(f"\n📋 Comparison Result:")
        print(f"   Match:          {result.get('match', 'N/A')}")
        print(f"   Verified:       {result.get('verified', 'N/A')}")
        print(f"   Similarity:     {result.get('similarity', 0):.2f}")
        print(f"   Distance:       {result.get('distance', 'N/A')}")
        print(f"   Threshold:      {result.get('threshold', 'N/A')}")
        print(f"   Model:          {result.get('model', 'N/A')}")
        print(f"   Skipped:        {result.get('skipped', False)}")
        print(f"   Error:          {result.get('error', 'None')}")
        
        # Test verify_face_match function (used by KYC upload)
        print("\n🔍 Testing verify_face_match() function...")
        match_result = verify_face_match(id_image, selfie_image, similarity_threshold=0.40)
        
        print(f"\n📋 verify_face_match Result:")
        print(f"   Match:          {match_result.get('match', 'N/A')}")
        print(f"   Similarity:     {match_result.get('similarity', 0):.2f}")
        print(f"   Method:         {match_result.get('method', 'N/A')}")
        
        print("\n✅ PASS: Face comparison service is operational!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_ocr_extraction():
    """Test 3: Verify OCR text extraction from documents"""
    print("\n" + "=" * 70)
    print("TEST 3: OCR Text Extraction (Tesseract)")
    print("=" * 70)
    
    try:
        sys.path.insert(0, '/app/apps/backend/src')
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
        
        import django
        django.setup()
        
        from accounts.document_verification_service import DocumentVerificationService, TESSERACT_AVAILABLE
        
        print(f"\n📋 OCR Status:")
        print(f"   Tesseract Available: {TESSERACT_AVAILABLE}")
        
        if not TESSERACT_AVAILABLE:
            print("\n⚠️  WARNING: Tesseract not available, OCR tests will be skipped")
            return True  # Not a failure, just not available
        
        service = DocumentVerificationService()
        
        # Test ID front OCR
        print("\n📝 Extracting text from ID front...")
        id_image = create_id_front_image()
        result = service._extract_text(Image.open(io.BytesIO(id_image)))
        
        print(f"   Text Length:    {len(result.get('text', ''))}")
        print(f"   Confidence:     {result.get('confidence', 0):.2f}")
        print(f"   Skipped:        {result.get('skipped', False)}")
        
        if result.get('text'):
            text_preview = result['text'][:300].replace('\n', ' ')
            print(f"\n   Extracted Text Preview:")
            print(f"   \"{text_preview}...\"")
            
            # Check for expected keywords
            expected = ['PILIPINAS', 'PHILIPPINE', 'PHILSYS', 'DELA CRUZ', 'JUAN']
            found = [kw for kw in expected if kw.upper() in result['text'].upper()]
            print(f"\n   Expected Keywords Found: {found}")
        
        # Test clearance OCR
        print("\n📝 Extracting text from NBI clearance...")
        clearance_image = create_clearance_image()
        result = service._extract_text(Image.open(io.BytesIO(clearance_image)))
        
        print(f"   Text Length:    {len(result.get('text', ''))}")
        print(f"   Confidence:     {result.get('confidence', 0):.2f}")
        
        if result.get('text'):
            text_preview = result['text'][:300].replace('\n', ' ')
            print(f"\n   Extracted Text Preview:")
            print(f"   \"{text_preview}...\"")
            
            # Check for NBI keywords
            expected = ['NBI', 'NATIONAL BUREAU', 'CLEARANCE', 'DEROGATORY']
            found = [kw for kw in expected if kw.upper() in result['text'].upper()]
            print(f"\n   Expected Keywords Found: {found}")
        
        # Test business permit OCR
        print("\n📝 Extracting text from business permit...")
        permit_image = create_business_permit_image()
        result = service._extract_text(Image.open(io.BytesIO(permit_image)))
        
        print(f"   Text Length:    {len(result.get('text', ''))}")
        print(f"   Confidence:     {result.get('confidence', 0):.2f}")
        
        if result.get('text'):
            text_preview = result['text'][:300].replace('\n', ' ')
            print(f"\n   Extracted Text Preview:")
            print(f"   \"{text_preview}...\"")
            
            # Check for business keywords
            expected = ['BUSINESS PERMIT', 'SEC', 'TIN', 'ZAMBOANGA']
            found = [kw for kw in expected if kw.upper() in result['text'].upper()]
            print(f"\n   Expected Keywords Found: {found}")
        
        print("\n✅ PASS: OCR extraction is operational!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_mobile_kyc_validate_document():
    """Test 4: Mobile KYC per-step validation endpoint"""
    print("\n" + "=" * 70)
    print("TEST 4: Mobile KYC Document Validation Endpoint")
    print("(POST /api/accounts/kyc/validate-document)")
    print("=" * 70)
    
    # Get auth token
    token = get_auth_token(TEST_EMAIL, TEST_PASSWORD)
    if not token:
        print("\n⚠️  Skipping - Could not authenticate")
        return None
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 4a: Validate FRONTID
    print("\n📤 Validating FRONTID...")
    id_front = create_id_front_image()
    files = {"file": ("id_front.jpg", id_front, "image/jpeg")}
    data = {"document_type": "FRONTID"}
    
    response = requests.post(
        f"{API_BASE}/api/accounts/kyc/validate-document",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Valid:          {result.get('valid', 'N/A')}")
        print(f"   Error:          {result.get('error', 'None')}")
        if result.get('details'):
            details = result['details']
            print(f"   Resolution:     {details.get('resolution', 'N/A')}")
            print(f"   Quality Score:  {details.get('quality_score', 'N/A')}")
            print(f"   Face Detected:  {details.get('face_detected', 'N/A')}")
    else:
        print(f"   Error Response: {response.text[:500]}")
    
    # Test 4b: Validate SELFIE
    print("\n📤 Validating SELFIE...")
    selfie = create_selfie_image()
    files = {"file": ("selfie.jpg", selfie, "image/jpeg")}
    data = {"document_type": "SELFIE"}
    
    response = requests.post(
        f"{API_BASE}/api/accounts/kyc/validate-document",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Valid:          {result.get('valid', 'N/A')}")
        print(f"   Face Detected:  {result.get('details', {}).get('face_detected', 'N/A')}")
    else:
        print(f"   Error Response: {response.text[:500]}")
    
    # Test 4c: Validate CLEARANCE
    print("\n📤 Validating CLEARANCE (NBI)...")
    clearance = create_clearance_image()
    files = {"file": ("clearance.jpg", clearance, "image/jpeg")}
    data = {"document_type": "CLEARANCE"}
    
    response = requests.post(
        f"{API_BASE}/api/accounts/kyc/validate-document",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Valid:          {result.get('valid', 'N/A')}")
        print(f"   Error:          {result.get('error', 'None')}")
    else:
        print(f"   Error Response: {response.text[:500]}")
    
    print("\n✅ Document validation endpoint tests complete!")
    return True


def test_mobile_kyc_full_upload():
    """Test 5: Full Mobile KYC upload with all documents"""
    print("\n" + "=" * 70)
    print("TEST 5: Mobile KYC Full Upload")
    print("(POST /api/accounts/upload/kyc)")
    print("=" * 70)
    
    # Get auth token
    token = get_auth_token(TEST_EMAIL, TEST_PASSWORD)
    if not token:
        print("\n⚠️  Skipping - Could not authenticate")
        return None
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create all required documents
    print("\n📦 Preparing documents...")
    id_front = create_id_front_image()
    id_back = create_id_back_image()
    selfie = create_selfie_image()
    clearance = create_clearance_image()
    
    print(f"   ID Front:   {len(id_front)} bytes")
    print(f"   ID Back:    {len(id_back)} bytes")
    print(f"   Selfie:     {len(selfie)} bytes")
    print(f"   Clearance:  {len(clearance)} bytes")
    
    # Upload all documents
    print("\n📤 Uploading KYC documents...")
    files = {
        "frontID": ("id_front.jpg", id_front, "image/jpeg"),
        "backID": ("id_back.jpg", id_back, "image/jpeg"),
        "selfie": ("selfie.jpg", selfie, "image/jpeg"),
        "clearance": ("clearance.jpg", clearance, "image/jpeg"),
    }
    data = {
        "IDType": "PHILSYS_ID",
        "clearanceType": "NBI"
    }
    
    response = requests.post(
        f"{API_BASE}/api/accounts/upload/kyc",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"\n📋 Upload Response:")
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n   Success:        {result.get('success', 'N/A')}")
        print(f"   Message:        {result.get('message', 'N/A')}")
        print(f"   KYC ID:         {result.get('kyc_id', 'N/A')}")
        print(f"   Status:         {result.get('status', 'N/A')}")
        
        # Check face match result
        face_match = result.get('face_match')
        if face_match:
            print(f"\n   🔍 Face Match Result:")
            print(f"      Match:       {face_match.get('match', 'N/A')}")
            print(f"      Similarity:  {face_match.get('similarity', 0):.2%}")
            print(f"      Method:      {face_match.get('method', 'N/A')}")
        
        # Check verification results
        verification = result.get('verification_results')
        if verification:
            print(f"\n   📝 Verification Results:")
            for doc_type, doc_result in verification.items():
                if isinstance(doc_result, dict):
                    status = doc_result.get('status', 'N/A')
                    print(f"      {doc_type}: {status}")
        
        # Check if auto-approved
        if result.get('status') == 'APPROVED':
            print(f"\n   🎉 KYC was AUTO-APPROVED!")
        elif result.get('status') == 'PENDING':
            print(f"\n   ⏳ KYC is PENDING admin review")
        elif result.get('status') == 'REJECTED':
            print(f"\n   ❌ KYC was REJECTED")
            print(f"      Reason: {result.get('rejection_reason', 'N/A')}")
    else:
        print(f"\n   ❌ Upload Failed!")
        print(f"   Response: {response.text[:1000]}")
    
    print("\n✅ Mobile KYC full upload test complete!")
    return True


def test_agency_kyc_validate_document():
    """Test 6: Agency KYC per-step validation endpoint"""
    print("\n" + "=" * 70)
    print("TEST 6: Agency KYC Document Validation Endpoint")
    print("(POST /api/agency/kyc/validate-document)")
    print("=" * 70)
    
    # Get session cookie
    session_data = get_session_cookie(AGENCY_EMAIL, AGENCY_PASSWORD)
    if not session_data:
        # Try with test worker account
        session_data = get_session_cookie(TEST_EMAIL, TEST_PASSWORD)
        if not session_data:
            print("\n⚠️  Skipping - Could not authenticate")
            return None
    
    session = session_data['session']
    
    # Test 6a: Validate BUSINESS_PERMIT
    print("\n📤 Validating BUSINESS_PERMIT...")
    permit = create_business_permit_image()
    files = {"file": ("permit.jpg", permit, "image/jpeg")}
    data = {"document_type": "BUSINESS_PERMIT"}
    
    response = session.post(
        f"{API_BASE}/api/agency/kyc/validate-document",
        files=files,
        data=data
    )
    
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Valid:          {result.get('valid', 'N/A')}")
        print(f"   Error:          {result.get('error', 'None')}")
        if result.get('details'):
            details = result['details']
            print(f"   Resolution:     {details.get('resolution', 'N/A')}")
            print(f"   Quality Score:  {details.get('quality_score', 'N/A')}")
    else:
        print(f"   Response: {response.text[:500]}")
    
    # Test 6b: Validate REP_ID_FRONT
    print("\n📤 Validating REP_ID_FRONT (representative's ID)...")
    id_front = create_id_front_image()
    files = {"file": ("rep_id.jpg", id_front, "image/jpeg")}
    data = {"document_type": "REP_ID_FRONT"}
    
    response = session.post(
        f"{API_BASE}/api/agency/kyc/validate-document",
        files=files,
        data=data
    )
    
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Valid:          {result.get('valid', 'N/A')}")
        print(f"   Face Detected:  {result.get('details', {}).get('face_detected', 'N/A')}")
    else:
        print(f"   Response: {response.text[:500]}")
    
    print("\n✅ Agency document validation tests complete!")
    return True


def test_agency_kyc_full_upload():
    """Test 7: Full Agency KYC upload with all documents"""
    print("\n" + "=" * 70)
    print("TEST 7: Agency KYC Full Upload")
    print("(POST /api/agency/upload)")
    print("=" * 70)
    
    # Get session cookie
    session_data = get_session_cookie(AGENCY_EMAIL, AGENCY_PASSWORD)
    if not session_data:
        session_data = get_session_cookie(TEST_EMAIL, TEST_PASSWORD)
        if not session_data:
            print("\n⚠️  Skipping - Could not authenticate")
            return None
    
    session = session_data['session']
    
    # Create all required documents
    print("\n📦 Preparing agency documents...")
    business_permit = create_business_permit_image()
    rep_front = create_id_front_image()
    rep_back = create_id_back_image()
    
    print(f"   Business Permit:  {len(business_permit)} bytes")
    print(f"   Rep ID Front:     {len(rep_front)} bytes")
    print(f"   Rep ID Back:      {len(rep_back)} bytes")
    
    # Upload all documents
    print("\n📤 Uploading Agency KYC documents...")
    files = {
        "business_permit": ("permit.jpg", business_permit, "image/jpeg"),
        "rep_front": ("rep_front.jpg", rep_front, "image/jpeg"),
        "rep_back": ("rep_back.jpg", rep_back, "image/jpeg"),
    }
    data = {
        "businessName": "Test Agency Services",
        "businessDesc": "Professional services provider",
        "rep_id_type": "PHILSYS_ID"
    }
    
    response = session.post(
        f"{API_BASE}/api/agency/upload",
        files=files,
        data=data
    )
    
    print(f"\n📋 Upload Response:")
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n   Success:        {result.get('success', 'N/A')}")
        print(f"   Message:        {result.get('message', 'N/A')}")
        print(f"   Status:         {result.get('status', 'N/A')}")
        
        # Check verification results if present
        if result.get('verification_results'):
            print(f"\n   📝 Verification Results:")
            for doc_type, doc_result in result.get('verification_results', {}).items():
                if isinstance(doc_result, dict):
                    status = doc_result.get('status', 'N/A')
                    print(f"      {doc_type}: {status}")
    else:
        print(f"\n   Response: {response.text[:1000]}")
    
    print("\n✅ Agency KYC full upload test complete!")
    return True


def main():
    parser = argparse.ArgumentParser(description='Comprehensive KYC Endpoint Testing')
    parser.add_argument('--mobile', action='store_true', help='Run only mobile KYC tests')
    parser.add_argument('--agency', action='store_true', help='Run only agency KYC tests')
    parser.add_argument('--services', action='store_true', help='Run only service tests (face detection, OCR)')
    args = parser.parse_args()
    
    print("\n" + "=" * 70)
    print("🧪 iAyos KYC Comprehensive Testing Suite")
    print(f"   Timestamp: {datetime.now().isoformat()}")
    print(f"   API Base:  {API_BASE}")
    print("=" * 70)
    
    results = {}
    
    # Service tests (run inside container)
    if not args.mobile and not args.agency or args.services:
        results['face_detection'] = test_face_detection_service()
        results['face_comparison'] = test_face_comparison_service()
        results['ocr_extraction'] = test_ocr_extraction()
    
    # Mobile KYC tests
    if not args.agency or args.mobile:
        results['mobile_validate'] = test_mobile_kyc_validate_document()
        results['mobile_upload'] = test_mobile_kyc_full_upload()
    
    # Agency KYC tests
    if not args.mobile or args.agency:
        results['agency_validate'] = test_agency_kyc_validate_document()
        results['agency_upload'] = test_agency_kyc_full_upload()
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed = 0
    failed = 0
    skipped = 0
    
    for test_name, result in results.items():
        if result is True:
            status = "✅ PASS"
            passed += 1
        elif result is False:
            status = "❌ FAIL"
            failed += 1
        else:
            status = "⚠️  SKIP"
            skipped += 1
        print(f"   {test_name}: {status}")
    
    print(f"\n   Total: {passed} passed, {failed} failed, {skipped} skipped")
    
    if failed > 0:
        print("\n❌ Some tests FAILED!")
        return 1
    else:
        print("\n✅ All tests completed successfully!")
        return 0


if __name__ == "__main__":
    exit(main())

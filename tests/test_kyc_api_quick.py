#!/usr/bin/env python3
"""
Quick KYC API Test Script
Tests Mobile KYC upload with face detection, comparison, and OCR
"""
import requests
import io
from PIL import Image, ImageDraw, ImageFont
import random
import json

# Configuration
API_BASE = "http://localhost:8000"
TEST_EMAIL = "testworker@example.com"
TEST_PASSWORD = "test123"

def create_simple_face_circle(x, y, size):
    """Create a simple face-like circle shape"""
    return [
        (x - size, y - size, x + size, y + size)  # Main face circle
    ]

def create_test_id_image():
    """Generate a synthetic ID front image with face and text"""
    img = Image.new('RGB', (800, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Blue header bar
    draw.rectangle([0, 0, 800, 80], fill=(0, 51, 102))
    
    # Title text
    draw.text((20, 15), "REPUBLIKA NG PILIPINAS", fill=(255, 255, 255))
    draw.text((20, 45), "PHILIPPINE IDENTIFICATION SYSTEM", fill=(255, 215, 0))
    
    # Photo area - simple face representation
    photo_x, photo_y = 100, 180
    draw.rectangle([50, 100, 250, 350], outline=(0, 0, 0), width=2)
    
    # Simple face (circle with features)
    draw.ellipse([70, 120, 230, 330], fill=(255, 218, 185))  # Face
    draw.ellipse([110, 180, 140, 210], fill=(139, 90, 43))   # Left eye
    draw.ellipse([160, 180, 190, 210], fill=(139, 90, 43))   # Right eye
    draw.arc([120, 250, 180, 290], 0, 180, fill=(139, 90, 43), width=2)  # Mouth
    
    # ID details
    draw.text((280, 120), "PSN: 1234-5678-9012-3456", fill=(0, 0, 0))
    draw.text((280, 160), "SURNAME", fill=(100, 100, 100))
    draw.text((280, 180), "DELA CRUZ", fill=(0, 0, 0))
    draw.text((280, 220), "GIVEN NAME", fill=(100, 100, 100))
    draw.text((280, 240), "JUAN SANTOS", fill=(0, 0, 0))
    draw.text((280, 280), "DATE OF BIRTH", fill=(100, 100, 100))
    draw.text((280, 300), "1990-01-15", fill=(0, 0, 0))
    draw.text((280, 340), "ADDRESS", fill=(100, 100, 100))
    draw.text((280, 360), "ZAMBOANGA CITY", fill=(0, 0, 0))
    
    # Convert to bytes
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def create_test_selfie():
    """Generate a synthetic selfie image with face"""
    img = Image.new('RGB', (600, 800), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    
    # Add background variation
    for _ in range(50):
        x = random.randint(0, 600)
        y = random.randint(0, 800)
        r = random.randint(5, 15)
        shade = random.randint(230, 250)
        draw.ellipse([x-r, y-r, x+r, y+r], fill=(shade, shade, shade))
    
    # Draw a face in center
    center_x, center_y = 300, 350
    
    # Face outline (oval)
    draw.ellipse([150, 180, 450, 520], fill=(255, 218, 185))
    
    # Eyes
    draw.ellipse([220, 300, 270, 350], fill=(255, 255, 255))  # Left eye white
    draw.ellipse([330, 300, 380, 350], fill=(255, 255, 255))  # Right eye white
    draw.ellipse([235, 310, 265, 340], fill=(139, 90, 43))    # Left iris
    draw.ellipse([345, 310, 375, 340], fill=(139, 90, 43))    # Right iris
    
    # Eyebrows
    draw.arc([210, 270, 280, 310], 0, 180, fill=(139, 90, 43), width=3)
    draw.arc([320, 270, 390, 310], 0, 180, fill=(139, 90, 43), width=3)
    
    # Nose
    draw.line([300, 340, 290, 400], fill=(200, 180, 160), width=2)
    draw.line([290, 400, 300, 410], fill=(200, 180, 160), width=2)
    draw.line([300, 410, 310, 400], fill=(200, 180, 160), width=2)
    
    # Mouth
    draw.arc([250, 420, 350, 470], 0, 180, fill=(220, 150, 150), width=3)
    
    # Hair
    draw.arc([150, 100, 450, 300], 180, 0, fill=(50, 30, 20), width=40)
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def create_test_id_back():
    """Generate a synthetic ID back image"""
    img = Image.new('RGB', (800, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Header
    draw.rectangle([0, 0, 800, 60], fill=(0, 51, 102))
    draw.text((20, 15), "PHILIPPINE IDENTIFICATION SYSTEM - BACK", fill=(255, 255, 255))
    
    # QR code area (simulated)
    draw.rectangle([50, 100, 200, 250], fill=(0, 0, 0))
    for i in range(10):
        for j in range(10):
            if random.random() > 0.5:
                draw.rectangle([55 + i*14, 105 + j*14, 65 + i*14, 115 + j*14], fill=(255, 255, 255))
    
    # Barcode
    draw.rectangle([50, 300, 750, 350], fill=(255, 255, 255))
    for x in range(50, 750, 4):
        if random.random() > 0.5:
            draw.rectangle([x, 300, x+2, 350], fill=(0, 0, 0))
    
    # Additional info
    draw.text((250, 120), "EMERGENCY CONTACT", fill=(100, 100, 100))
    draw.text((250, 140), "Maria Dela Cruz", fill=(0, 0, 0))
    draw.text((250, 180), "BLOOD TYPE", fill=(100, 100, 100))
    draw.text((250, 200), "O+", fill=(0, 0, 0))
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def create_test_clearance():
    """Generate a synthetic NBI clearance image"""
    img = Image.new('RGB', (700, 900), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # NBI Header
    draw.rectangle([0, 0, 700, 120], fill=(0, 0, 128))
    draw.text((50, 20), "REPUBLIKA NG PILIPINAS", fill=(255, 215, 0))
    draw.text((50, 50), "NATIONAL BUREAU OF INVESTIGATION", fill=(255, 255, 255))
    draw.text((50, 85), "NBI CLEARANCE", fill=(255, 215, 0))
    
    # Clearance number
    draw.text((50, 150), "NBI CLEARANCE NO:", fill=(0, 0, 0))
    draw.text((220, 150), "2024-12345678", fill=(0, 0, 128))
    
    # Photo placeholder
    draw.rectangle([50, 200, 200, 380], outline=(0, 0, 0), width=2)
    draw.text((80, 280), "PHOTO", fill=(150, 150, 150))
    
    # Personal info
    draw.text((230, 200), "NAME:", fill=(100, 100, 100))
    draw.text((230, 220), "DELA CRUZ, JUAN SANTOS", fill=(0, 0, 0))
    
    draw.text((230, 260), "DATE OF BIRTH:", fill=(100, 100, 100))
    draw.text((230, 280), "JANUARY 15, 1990", fill=(0, 0, 0))
    
    draw.text((230, 320), "ADDRESS:", fill=(100, 100, 100))
    draw.text((230, 340), "ZAMBOANGA CITY", fill=(0, 0, 0))
    
    # Status
    draw.rectangle([50, 420, 650, 520], outline=(0, 128, 0), width=3)
    draw.text((100, 450), "NO DEROGATORY RECORD", fill=(0, 128, 0))
    draw.text((100, 480), "AS OF THIS DATE", fill=(0, 128, 0))
    
    # Validity
    draw.text((50, 550), "DATE ISSUED:", fill=(100, 100, 100))
    draw.text((160, 550), "JANUARY 20, 2025", fill=(0, 0, 0))
    
    draw.text((50, 580), "VALID UNTIL:", fill=(100, 100, 100))
    draw.text((160, 580), "JULY 20, 2025", fill=(0, 0, 0))
    
    # Footer warning
    draw.text((50, 650), "WARNING: Any alteration shall render this clearance void.", fill=(255, 0, 0))
    draw.text((50, 680), "Verify authenticity at www.nbi.gov.ph", fill=(100, 100, 100))
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()


def login():
    """Authenticate and get JWT token"""
    print("🔐 Authenticating...")
    response = requests.post(
        f"{API_BASE}/api/accounts/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        print(f"   ❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None
    
    data = response.json()
    token = data.get("access")
    print(f"   ✅ Login successful!")
    print(f"   User: {data.get('user', {}).get('email')}")
    return token


def test_kyc_validate_document(token):
    """Test the per-document validation endpoint"""
    print("\n" + "=" * 60)
    print("TEST: Mobile KYC Document Validation")
    print("POST /api/accounts/kyc/validate-document")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Validate ID Front
    print("\n📤 Validating ID Front (FRONTID)...")
    id_front = create_test_id_image()
    
    # The endpoint expects 'file' not 'document'
    files = {"file": ("id_front.png", id_front, "image/png")}
    data = {"document_type": "FRONTID"}
    
    response = requests.post(
        f"{API_BASE}/api/accounts/kyc/validate-document",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Valid: {result.get('valid', False)}")
        if result.get('details'):
            details = result.get('details', {})
            print(f"   Quality Score: {details.get('quality_score', 0):.2f}")
            print(f"   Face Detected: {details.get('face_detected', 'N/A')}")
            print(f"   Resolution: {details.get('resolution', 'N/A')}")
        if result.get('warnings'):
            print(f"   Warnings: {result.get('warnings')}")
        if result.get('error'):
            print(f"   Error: {result.get('error')}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")
    
    # Test 2: Validate Selfie
    print("\n📤 Validating Selfie (SELFIE)...")
    selfie = create_test_selfie()
    
    files = {"file": ("selfie.png", selfie, "image/png")}
    data = {"document_type": "SELFIE"}
    
    response = requests.post(
        f"{API_BASE}/api/accounts/kyc/validate-document",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Valid: {result.get('valid', False)}")
        if result.get('details'):
            details = result.get('details', {})
            print(f"   Face Detected: {details.get('face_detected', 'N/A')}")
            print(f"   Quality Score: {details.get('quality_score', 0):.2f}")
        if result.get('error'):
            print(f"   Error: {result.get('error')}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")
    
    # Test 3: Validate NBI Clearance (OCR test)
    print("\n📤 Validating NBI Clearance (NBI)...")
    clearance = create_test_clearance()
    
    files = {"file": ("nbi_clearance.png", clearance, "image/png")}
    data = {"document_type": "CLEARANCE"}  # Use CLEARANCE not NBI
    
    response = requests.post(
        f"{API_BASE}/api/accounts/kyc/validate-document",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Valid: {result.get('valid', False)}")
        if result.get('details'):
            details = result.get('details', {})
            print(f"   Quality Score: {details.get('quality_score', 0):.2f}")
        if result.get('error'):
            print(f"   Error: {result.get('error')}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")


def test_kyc_full_upload(token):
    """Test the full KYC upload endpoint with all documents"""
    print("\n" + "=" * 60)
    print("TEST: Mobile KYC Full Upload")
    print("POST /api/accounts/upload/kyc")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Generate all test documents
    print("\n📦 Generating test documents...")
    id_front = create_test_id_image()
    id_back = create_test_id_back()
    selfie = create_test_selfie()
    clearance = create_test_clearance()
    
    print(f"   ID Front:   {len(id_front):,} bytes")
    print(f"   ID Back:    {len(id_back):,} bytes")
    print(f"   Selfie:     {len(selfie):,} bytes")
    print(f"   Clearance:  {len(clearance):,} bytes")
    
    # Prepare multipart form data
    files = {
        "frontID": ("id_front.png", id_front, "image/png"),
        "backID": ("id_back.png", id_back, "image/png"),
        "selfie": ("selfie.png", selfie, "image/png"),
        "clearance": ("nbi_clearance.png", clearance, "image/png"),
    }
    
    # Required fields: IDType and clearanceType
    data = {
        "IDType": "NATIONALID",
        "clearanceType": "NBI"
    }
    
    print("\n📤 Uploading KYC documents...")
    print(f"   IDType: {data['IDType']}")
    print(f"   clearanceType: {data['clearanceType']}")
    
    response = requests.post(
        f"{API_BASE}/api/accounts/upload/kyc",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"\n📋 Response:")
    print(f"   Status Code: {response.status_code}")
    
    try:
        result = response.json()
        print(f"\n   Full Response:")
        print(json.dumps(result, indent=4, default=str))
        
        if response.status_code == 200 and not result.get('error'):
            print("\n   ✅ KYC Upload Successful!")
            if result.get('face_match'):
                print(f"\n   🔍 Face Comparison Results:")
                face_match = result.get('face_match', {})
                print(f"      Match: {face_match.get('match', 'N/A')}")
                print(f"      Similarity: {face_match.get('similarity', 0):.2%}")
                print(f"      Method: {face_match.get('method', 'N/A')}")
            
            if result.get('verification_details'):
                print(f"\n   📊 Verification Details:")
                details = result.get('verification_details', {})
                for doc_type, doc_result in details.items():
                    print(f"\n      [{doc_type}]")
                    print(f"         Status: {doc_result.get('status', 'N/A')}")
                    print(f"         Quality: {doc_result.get('quality_score', 0):.2f}")
                    if doc_result.get('face_detected'):
                        print(f"         Face: {doc_result.get('face_count', 0)} detected")
        else:
            print(f"\n   ❌ Upload Failed or has errors")
            if result.get('error'):
                print(f"   Error: {result.get('error')}")
    except json.JSONDecodeError:
        print(f"   Raw Response: {response.text[:500]}")


def main():
    print("\n" + "=" * 60)
    print("🧪 iAyos KYC API Quick Test")
    print("=" * 60)
    
    # Login first
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return 1
    
    # Test document validation endpoint
    test_kyc_validate_document(token)
    
    # Test full upload
    test_kyc_full_upload(token)
    
    print("\n" + "=" * 60)
    print("✅ KYC API Tests Complete!")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    exit(main())

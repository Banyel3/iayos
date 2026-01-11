"""
Test Script for CompreFace and Tesseract OCR Integration in KYC Upload
Verifies that face detection, face matching, and OCR are being called during KYC upload

Run: python scripts/test_kyc_ai_verification.py
"""
import requests
import json
import time
import base64
import io
from PIL import Image, ImageDraw, ImageFont
import os

BASE_URL = "http://localhost:8000/api"
COMPREFACE_URL = "http://localhost:8100"

# Test credentials
TEST_EMAIL = "testclient_team@test.com"
TEST_PASSWORD = "test123456"

def print_section(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

def print_result(name, response, show_body=True):
    status = "✅" if response.status_code in [200, 201] else "❌"
    print(f"\n{status} {name}: HTTP {response.status_code}")
    if show_body:
        try:
            body = response.json()
            print(json.dumps(body, indent=2)[:3000])
        except:
            print(response.text[:1000] if response.text else "(empty response)")
    return response.status_code in [200, 201]

def login(email, password):
    """Login and get access token"""
    print(f"  Attempting login for: {email}")
    response = requests.post(
        f"{BASE_URL}/mobile/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token") or data.get("access") or data.get("token")
        if token:
            print(f"  ✅ Login successful")
            return token
    print(f"  ❌ Login failed: {response.status_code}")
    return None

def create_test_id_image():
    """Create a test ID image with a face-like shape and text"""
    # Create a simple ID card image
    img = Image.new('RGB', (800, 500), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw ID card border
    draw.rectangle([10, 10, 790, 490], outline='black', width=3)
    
    # Draw a face placeholder (oval)
    draw.ellipse([50, 100, 250, 350], fill='#FFE4C4', outline='black', width=2)
    # Eyes
    draw.ellipse([100, 180, 130, 210], fill='white', outline='black')
    draw.ellipse([170, 180, 200, 210], fill='white', outline='black')
    draw.ellipse([110, 190, 120, 200], fill='black')
    draw.ellipse([180, 190, 190, 200], fill='black')
    # Nose
    draw.line([150, 220, 150, 260], fill='black', width=2)
    # Mouth
    draw.arc([120, 270, 180, 310], 0, 180, fill='black', width=2)
    
    # Add text (simulating ID information)
    try:
        font = ImageFont.truetype("arial.ttf", 24)
        small_font = ImageFont.truetype("arial.ttf", 18)
    except:
        font = ImageFont.load_default()
        small_font = font
    
    draw.text((300, 100), "REPUBLIC OF THE PHILIPPINES", fill='black', font=small_font)
    draw.text((300, 130), "NATIONAL ID", fill='blue', font=font)
    draw.text((300, 180), "NAME: Juan Dela Cruz", fill='black', font=small_font)
    draw.text((300, 210), "DOB: January 1, 1990", fill='black', font=small_font)
    draw.text((300, 240), "SEX: Male", fill='black', font=small_font)
    draw.text((300, 270), "ID NO: 1234-5678-9012-3456", fill='black', font=small_font)
    draw.text((300, 320), "ADDRESS: 123 Main St, Manila", fill='black', font=small_font)
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=95)
    img_bytes.seek(0)
    return img_bytes.getvalue()

def create_test_selfie_image():
    """Create a test selfie image with a face"""
    img = Image.new('RGB', (600, 800), color='#E8E8E8')
    draw = ImageDraw.Draw(img)
    
    # Draw a larger face (selfie style)
    # Face oval
    draw.ellipse([150, 150, 450, 550], fill='#FFE4C4', outline='#DEB887', width=3)
    # Eyes
    draw.ellipse([220, 280, 270, 330], fill='white', outline='black')
    draw.ellipse([330, 280, 380, 330], fill='white', outline='black')
    draw.ellipse([235, 295, 255, 315], fill='#4B3621')
    draw.ellipse([345, 295, 365, 315], fill='#4B3621')
    # Eyebrows
    draw.arc([210, 250, 280, 290], 180, 360, fill='#4B3621', width=3)
    draw.arc([320, 250, 390, 290], 180, 360, fill='#4B3621', width=3)
    # Nose
    draw.line([300, 320, 300, 400], fill='#DEB887', width=3)
    draw.arc([270, 380, 330, 420], 0, 180, fill='#DEB887', width=2)
    # Mouth
    draw.arc([250, 430, 350, 500], 0, 180, fill='#CD5C5C', width=4)
    # Hair
    draw.arc([140, 100, 460, 350], 180, 360, fill='#4B3621', width=50)
    
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=95)
    img_bytes.seek(0)
    return img_bytes.getvalue()

def create_test_clearance_image():
    """Create a test clearance document image"""
    img = Image.new('RGB', (800, 1000), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw document border
    draw.rectangle([20, 20, 780, 980], outline='black', width=2)
    
    try:
        font = ImageFont.truetype("arial.ttf", 28)
        small_font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
        small_font = font
    
    # Header
    draw.text((200, 50), "REPUBLIC OF THE PHILIPPINES", fill='black', font=small_font)
    draw.text((250, 90), "POLICE CLEARANCE", fill='blue', font=font)
    
    # Content
    draw.text((50, 180), "This is to certify that:", fill='black', font=small_font)
    draw.text((50, 220), "Name: JUAN DELA CRUZ", fill='black', font=small_font)
    draw.text((50, 260), "Address: 123 Main Street, Manila, Philippines", fill='black', font=small_font)
    draw.text((50, 300), "Date of Birth: January 1, 1990", fill='black', font=small_font)
    draw.text((50, 340), "Place of Birth: Manila, Philippines", fill='black', font=small_font)
    draw.text((50, 400), "has no derogatory record on file as of this date.", fill='black', font=small_font)
    draw.text((50, 480), "Purpose: EMPLOYMENT", fill='black', font=small_font)
    draw.text((50, 520), "Valid Until: December 31, 2025", fill='black', font=small_font)
    draw.text((50, 600), "Control No: PC-2025-123456", fill='black', font=small_font)
    draw.text((50, 700), "Issued by: Philippine National Police", fill='black', font=small_font)
    draw.text((50, 740), "Date Issued: January 1, 2025", fill='black', font=small_font)
    
    # Signature line
    draw.line([500, 850, 700, 850], fill='black', width=1)
    draw.text((520, 860), "Authorized Signature", fill='black', font=small_font)
    
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=95)
    img_bytes.seek(0)
    return img_bytes.getvalue()

# =============================================================================
# TEST 1: Direct CompreFace API Test
# =============================================================================

def test_compreface_directly():
    """Test CompreFace face detection API directly"""
    print_section("TEST 1: DIRECT COMPREFACE API TEST")
    
    results = {}
    
    # Check if CompreFace is running
    print("\n📋 1.1 CompreFace Health Check")
    try:
        response = requests.get(f"{COMPREFACE_URL}/api/v1/detection/detect", timeout=10)
        # 405 means endpoint exists but needs POST
        results["compreface_available"] = response.status_code in [200, 405, 400]
        print(f"  {'✅' if results['compreface_available'] else '❌'} CompreFace detection endpoint: HTTP {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("  ❌ CompreFace not reachable on port 8100")
        results["compreface_available"] = False
        return results
    except Exception as e:
        print(f"  ❌ CompreFace error: {e}")
        results["compreface_available"] = False
        return results
    
    # Test face detection with test image
    print("\n📋 1.2 Face Detection API Test")
    test_image = create_test_selfie_image()
    
    try:
        files = {'file': ('test_face.jpg', test_image, 'image/jpeg')}
        response = requests.post(
            f"{COMPREFACE_URL}/api/v1/detection/detect",
            files=files,
            params={'limit': 1, 'det_prob_threshold': 0.5},
            timeout=30
        )
        results["face_detection"] = print_result("POST /api/v1/detection/detect", response)
        
        if response.status_code == 200:
            data = response.json()
            faces = data.get('result', [])
            print(f"  📌 Faces detected: {len(faces)}")
            if faces:
                print(f"  📌 First face box: {faces[0].get('box', {})}")
                print(f"  📌 Detection probability: {faces[0].get('box', {}).get('probability', 'N/A')}")
    except Exception as e:
        print(f"  ❌ Face detection error: {e}")
        results["face_detection"] = False
    
    # Test recognition API (for face embedding/matching)
    print("\n📋 1.3 Face Recognition/Embedding API Test")
    test_image = create_test_selfie_image()
    
    try:
        files = {'file': ('test_face.jpg', test_image, 'image/jpeg')}
        response = requests.post(
            f"{COMPREFACE_URL}/api/v1/recognition/faces",
            files=files,
            params={'limit': 1, 'det_prob_threshold': 0.5},
            timeout=30
        )
        results["face_recognition"] = response.status_code in [200, 400, 404]  # 404 may mean no subjects
        print(f"  {'✅' if results['face_recognition'] else '❌'} Recognition API: HTTP {response.status_code}")
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"  📌 Response: {json.dumps(data, indent=2)[:500]}")
            except:
                pass
    except Exception as e:
        print(f"  ❌ Face recognition error: {e}")
        results["face_recognition"] = False
    
    return results

# =============================================================================
# TEST 2: KYC Upload with AI Verification
# =============================================================================

def test_kyc_upload_with_ai(token):
    """Test KYC upload to see if CompreFace and Tesseract are called"""
    print_section("TEST 2: KYC UPLOAD WITH AI VERIFICATION")
    
    results = {}
    
    # Generate test images
    print("\n📋 2.1 Generating test images...")
    front_id = create_test_id_image()
    back_id = create_test_id_image()  # Same as front for testing
    clearance = create_test_clearance_image()
    selfie = create_test_selfie_image()
    
    print(f"  ✅ Front ID: {len(front_id)} bytes")
    print(f"  ✅ Back ID: {len(back_id)} bytes")
    print(f"  ✅ Clearance: {len(clearance)} bytes")
    print(f"  ✅ Selfie: {len(selfie)} bytes")
    
    # Upload KYC documents
    print("\n📋 2.2 Uploading KYC documents...")
    
    files = {
        'frontID': ('front_id.jpg', front_id, 'image/jpeg'),
        'backID': ('back_id.jpg', back_id, 'image/jpeg'),
        'clearance': ('clearance.jpg', clearance, 'image/jpeg'),
        'selfie': ('selfie.jpg', selfie, 'image/jpeg'),
    }
    
    data = {
        'IDType': 'NATIONALID',
        'clearanceType': 'POLICE',
    }
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        print("  ⏳ Uploading... (AI verification may take 10-30 seconds)")
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/accounts/upload/kyc",
            headers=headers,
            files=files,
            data=data,
            timeout=120  # Long timeout for AI processing
        )
        
        elapsed = time.time() - start_time
        print(f"  ⏱️  Upload took {elapsed:.2f} seconds")
        
        results["kyc_upload"] = print_result("POST /accounts/upload/kyc", response)
        
        if response.status_code == 200:
            try:
                data = response.json()
                
                # Check for face_match field (our new implementation)
                if 'face_match' in data:
                    print("\n  🔍 FACE MATCHING RESULT:")
                    face_match = data['face_match']
                    if face_match:
                        print(f"     Match: {face_match.get('match', 'N/A')}")
                        print(f"     Similarity: {face_match.get('similarity', 'N/A')}")
                        print(f"     Threshold: {face_match.get('threshold', 'N/A')}")
                        print(f"     ID Face Detected: {face_match.get('id_face_detected', 'N/A')}")
                        print(f"     Selfie Face Detected: {face_match.get('selfie_face_detected', 'N/A')}")
                        results["face_matching_executed"] = True
                    else:
                        print("     ⚠️ face_match is null (CompreFace may not be running)")
                        results["face_matching_executed"] = False
                else:
                    print("\n  ⚠️ No face_match field in response (face matching may not be implemented)")
                    results["face_matching_executed"] = False
                
                # Check for rejection reasons (may include OCR/face detection failures)
                if 'rejection_reasons' in data:
                    print("\n  🔍 REJECTION REASONS (AI Verification):")
                    for reason in data['rejection_reasons']:
                        print(f"     - {reason}")
                        # Check if OCR was attempted
                        if 'text' in reason.lower() or 'ocr' in reason.lower():
                            results["ocr_executed"] = True
                        if 'face' in reason.lower():
                            results["face_detection_executed"] = True
                
                # Check files for verification results
                if 'files' in data:
                    print("\n  🔍 UPLOADED FILES:")
                    for f in data['files']:
                        print(f"     - {f.get('type', 'unknown')}: {f.get('url', 'N/A')[:50]}...")
                        
            except Exception as e:
                print(f"  ❌ Error parsing response: {e}")
    
    except requests.exceptions.Timeout:
        print("  ❌ Request timed out (AI verification may be slow)")
        results["kyc_upload"] = False
    except Exception as e:
        print(f"  ❌ Upload error: {e}")
        results["kyc_upload"] = False
    
    return results

# =============================================================================
# TEST 3: Check Backend Logs for AI Calls
# =============================================================================

def test_backend_ai_service_status(token):
    """Check if AI services are configured in backend"""
    print_section("TEST 3: AI SERVICE CONFIGURATION CHECK")
    
    results = {}
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Check recent KYC to see AI verification notes
    print("\n📋 3.1 Checking recent KYC submissions for AI verification traces...")
    
    response = requests.get(f"{BASE_URL}/adminpanel/kyc/all", headers=headers)
    if response.status_code == 200:
        data = response.json()
        kyc_list = data.get('kyc', [])
        
        ai_rejection_found = False
        for kyc in kyc_list[:5]:  # Check last 5
            notes = kyc.get('notes', '')
            status = kyc.get('kycStatus', '')
            kyc_id = kyc.get('kycID', '')
            
            print(f"\n  KYC #{kyc_id} - Status: {status}")
            if notes:
                print(f"     Notes: {notes[:200]}...")
                if 'auto-rejected' in notes.lower() or 'ai verification' in notes.lower():
                    ai_rejection_found = True
                    print("     ✅ AI Verification was triggered!")
                if 'face' in notes.lower():
                    print("     ✅ Face detection was triggered!")
                    results["face_detection_in_logs"] = True
                if 'text' in notes.lower() or 'ocr' in notes.lower():
                    print("     ✅ OCR was triggered!")
                    results["ocr_in_logs"] = True
        
        results["ai_rejection_found"] = ai_rejection_found
    else:
        print(f"  ❌ Could not fetch KYC list: HTTP {response.status_code}")
    
    return results

# =============================================================================
# MAIN
# =============================================================================

def main():
    print("\n" + "=" * 70)
    print(" COMPREFACE & TESSERACT OCR INTEGRATION TEST")
    print(f" Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" Backend: {BASE_URL}")
    print(f" CompreFace: {COMPREFACE_URL}")
    print("=" * 70)
    
    all_results = {}
    
    # Test 1: Direct CompreFace test
    all_results["compreface_direct"] = test_compreface_directly()
    
    # Login for authenticated tests
    print_section("AUTHENTICATION")
    token = login(TEST_EMAIL, TEST_PASSWORD)
    
    if not token:
        print("\n❌ Login failed! Cannot proceed with KYC upload test.")
        return
    
    # Test 2: KYC Upload with AI
    all_results["kyc_upload"] = test_kyc_upload_with_ai(token)
    
    # Test 3: Check backend logs
    all_results["backend_logs"] = test_backend_ai_service_status(token)
    
    # Summary
    print_section("TEST SUMMARY")
    
    print("\n📊 CompreFace Status:")
    print(f"   Service Available: {'✅' if all_results.get('compreface_direct', {}).get('compreface_available') else '❌'}")
    print(f"   Face Detection API: {'✅' if all_results.get('compreface_direct', {}).get('face_detection') else '❌'}")
    print(f"   Face Recognition API: {'✅' if all_results.get('compreface_direct', {}).get('face_recognition') else '❌'}")
    
    print("\n📊 KYC AI Verification:")
    print(f"   KYC Upload: {'✅' if all_results.get('kyc_upload', {}).get('kyc_upload') else '❌'}")
    print(f"   Face Matching Executed: {'✅' if all_results.get('kyc_upload', {}).get('face_matching_executed') else '❌ (check CompreFace)'}")
    
    print("\n📊 Backend AI Traces:")
    print(f"   AI Rejection Found in Logs: {'✅' if all_results.get('backend_logs', {}).get('ai_rejection_found') else '❌'}")
    print(f"   Face Detection in Logs: {'✅' if all_results.get('backend_logs', {}).get('face_detection_in_logs') else '❌'}")
    print(f"   OCR in Logs: {'✅' if all_results.get('backend_logs', {}).get('ocr_in_logs') else '❌'}")
    
    print("\n" + "=" * 70)
    
if __name__ == "__main__":
    main()

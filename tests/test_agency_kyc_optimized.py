"""
Test script for optimized agency KYC upload endpoints.

Tests the 3-step flow:
1. Validate documents (cache results)
2. Extract OCR (autofill business form)
3. Upload (use cached validation, no AI re-processing)
"""

import requests
import time
import json
import hashlib
from pathlib import Path

BASE_URL = "http://localhost:8000"

def generate_test_file_hash(file_path):
    """Generate SHA-256 hash of file for testing."""
    with open(file_path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()

def test_login():
    """Test 1: Login to get authentication cookie."""
    print("\n" + "="*60)
    print("TEST 1: Login")
    print("="*60)
    
    url = f"{BASE_URL}/api/accounts/login"
    payload = {
        "email": "agency@example.com",
        "password": "password123"
    }
    
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}")
    
    if response.status_code == 200:
        cookies = response.cookies
        print(f"✅ Login successful - cookie obtained")
        return cookies
    else:
        print(f"❌ Login failed")
        return None


def test_validate_document(cookies, file_path, doc_type):
    """Test 2: Validate single document."""
    print(f"\n" + "="*60)
    print(f"TEST 2: Validate Document - {doc_type}")
    print("="*60)
    
    url = f"{BASE_URL}/api/agency/kyc/validate-document"
    
    # Check if file exists
    if not Path(file_path).exists():
        print(f"⚠️ Test file not found: {file_path}")
        print(f"Creating dummy file for testing...")
        # Create a small dummy image for testing
        file_path = "test_dummy.jpg"
        with open(file_path, 'wb') as f:
            # Write minimal JPEG header
            f.write(bytes([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]))
            f.write(b'JFIF' + bytes([0] * 100))
    
    with open(file_path, 'rb') as f:
        files = {
            'document': (Path(file_path).name, f, 'image/jpeg')
        }
        data = {
            'document_type': doc_type
        }
        
        start_time = time.time()
        response = requests.post(url, files=files, data=data, cookies=cookies)
        elapsed = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Time: {elapsed:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Validation successful")
            print(f"   File hash: {result.get('file_hash', 'N/A')[:16]}...")
            print(f"   AI status: {result.get('ai_status', 'N/A')}")
            print(f"   Quality: {result.get('quality_score', 'N/A')}")
            return result.get('file_hash')
        elif response.status_code == 401:
            print(f"❌ Unauthorized - authentication required")
        else:
            print(f"❌ Validation failed")
            print(f"   Response: {response.text[:300]}")
        
        return None


def test_extract_ocr(cookies):
    """Test 3: Extract OCR for autofill."""
    print(f"\n" + "="*60)
    print(f"TEST 3: Extract OCR for Autofill")
    print("="*60)
    
    url = f"{BASE_URL}/api/agency/kyc/extract-ocr"
    
    # Use dummy files for testing
    permit_file = "test_permit.jpg"
    rep_file = "test_rep.jpg"
    
    # Create dummy files if they don't exist
    for file_path in [permit_file, rep_file]:
        if not Path(file_path).exists():
            with open(file_path, 'wb') as f:
                f.write(bytes([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]))
                f.write(b'JFIF' + bytes([0] * 100))
    
    with open(permit_file, 'rb') as bp, open(rep_file, 'rb') as rf:
        files = {
            'business_permit': (Path(permit_file).name, bp, 'image/jpeg'),
            'rep_id_front': (Path(rep_file).name, rf, 'image/jpeg')
        }
        data = {
            'business_type': 'SOLE_PROPRIETORSHIP'
        }
        
        start_time = time.time()
        response = requests.post(url, files=files, data=data, cookies=cookies)
        elapsed = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Time: {elapsed:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ OCR extraction successful")
            print(f"   Success: {result.get('success', False)}")
            print(f"   Confidence: {result.get('confidence', 0)}%")
            extracted = result.get('extracted_data', {})
            print(f"   Fields extracted: {len(extracted)}")
            print(f"   Sample data: {list(extracted.keys())[:3]}")
        elif response.status_code == 401:
            print(f"❌ Unauthorized")
        else:
            print(f"❌ OCR extraction failed")
            print(f"   Response: {response.text[:300]}")


def test_upload_fast(cookies, file_hashes):
    """Test 4: Fast upload (uses cached validation)."""
    print(f"\n" + "="*60)
    print(f"TEST 4: Fast Upload (Cached Validation)")
    print("="*60)
    
    url = f"{BASE_URL}/api/agency/upload"
    
    # Use dummy files for testing
    permit_file = "test_permit.jpg"
    rep_front_file = "test_rep_front.jpg"
    rep_back_file = "test_rep_back.jpg"
    
    # Create dummy files if they don't exist
    for file_path in [permit_file, rep_front_file, rep_back_file]:
        if not Path(file_path).exists():
            with open(file_path, 'wb') as f:
                f.write(bytes([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]))
                f.write(b'JFIF' + bytes([0] * 100))
    
    # Prepare file_hashes JSON
    hashes_json = json.dumps({
        "BUSINESS_PERMIT": file_hashes.get('BUSINESS_PERMIT', 'test_hash_1'),
        "REP_ID_FRONT": file_hashes.get('REP_ID_FRONT', 'test_hash_2'),
        "REP_ID_BACK": file_hashes.get('REP_ID_BACK', 'test_hash_3'),
    })
    
    with open(permit_file, 'rb') as bp, \
         open(rep_front_file, 'rb') as rf, \
         open(rep_back_file, 'rb') as rb:
        
        files = {
            'business_permit': (Path(permit_file).name, bp, 'image/jpeg'),
            'rep_front': (Path(rep_front_file).name, rf, 'image/jpeg'),
            'rep_back': (Path(rep_back_file).name, rb, 'image/jpeg'),
        }
        data = {
            'file_hashes_json': hashes_json,
            'rep_id_type': 'PHILSYS_ID',
            'business_type': 'SOLE_PROPRIETORSHIP'
        }
        
        start_time = time.time()
        response = requests.post(url, files=files, data=data, cookies=cookies)
        elapsed = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Time: {elapsed:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Fast upload successful")
            print(f"   KYC ID: {result.get('agency_kyc_id', 'N/A')}")
            print(f"   Status: {result.get('status', 'N/A')}")
            print(f"   Files uploaded: {len(result.get('files', []))}")
            print(f"   Upload time: {result.get('upload_time', 'N/A')}")
        elif response.status_code == 401:
            print(f"❌ Unauthorized")
        else:
            print(f"❌ Upload failed")
            print(f"   Response: {response.text[:500]}")


def test_unauthorized():
    """Test 5: Unauthorized access (no cookie)."""
    print(f"\n" + "="*60)
    print(f"TEST 5: Unauthorized Access")
    print("="*60)
    
    url = f"{BASE_URL}/api/agency/kyc/validate-document"
    
    # Create dummy file
    file_path = "test_dummy.jpg"
    if not Path(file_path).exists():
        with open(file_path, 'wb') as f:
            f.write(bytes([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]))
            f.write(b'JFIF' + bytes([0] * 100))
    
    with open(file_path, 'rb') as f:
        files = {
            'document': (Path(file_path).name, f, 'image/jpeg')
        }
        data = {
            'document_type': 'BUSINESS_PERMIT'
        }
        
        response = requests.post(url, files=files, data=data)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print(f"✅ Correctly rejected unauthorized request")
        else:
            print(f"❌ Should have returned 401, got {response.status_code}")


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("🚀 AGENCY KYC OPTIMIZED ENDPOINT TESTS")
    print("="*60)
    
    # Test 1: Login
    cookies = test_login()
    if not cookies:
        print("\n❌ Cannot proceed without authentication")
        return
    
    # Test 2: Validate documents
    file_hashes = {}
    hash1 = test_validate_document(cookies, "test_permit.jpg", "BUSINESS_PERMIT")
    if hash1:
        file_hashes['BUSINESS_PERMIT'] = hash1
    
    hash2 = test_validate_document(cookies, "test_rep_front.jpg", "REP_ID_FRONT")
    if hash2:
        file_hashes['REP_ID_FRONT'] = hash2
    
    hash3 = test_validate_document(cookies, "test_rep_back.jpg", "REP_ID_BACK")
    if hash3:
        file_hashes['REP_ID_BACK'] = hash3
    
    # Test 3: Extract OCR
    test_extract_ocr(cookies)
    
    # Test 4: Fast upload
    test_upload_fast(cookies, file_hashes)
    
    # Test 5: Unauthorized
    test_unauthorized()
    
    print("\n" + "="*60)
    print("✅ ALL TESTS COMPLETED")
    print("="*60)
    print("\nNOTE: Some tests may fail if:")
    print("- Test files don't exist")
    print("- Agency user account doesn't exist")
    print("- Backend services are not running")
    print("\nNext steps:")
    print("1. Create agency test account if needed")
    print("2. Use real image files for accurate validation")
    print("3. Monitor backend logs for detailed error messages")


if __name__ == "__main__":
    main()

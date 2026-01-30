"""
Test script for Mobile KYC Per-Step OCR Extraction
Tests the /api/accounts/kyc/extract-id and /api/accounts/kyc/extract-clearance endpoints
with actual test images (drivers_license.jpg and nbi_clearance.jpg)

Run this after the backend server is running:
    python tests/test_mobile_kyc_extraction.py

Prerequisites:
    - Backend running on localhost:8000
    - Valid JWT token (update TOKEN variable)
    - Test images in tests/test_images/
"""

import os
import sys
import json
import requests
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TOKEN = ""  # Will be obtained via login

# Test images
TEST_IMAGES_DIR = Path(__file__).parent / "test_images"
DRIVERS_LICENSE_PATH = TEST_IMAGES_DIR / "drivers_license.jpg"
NBI_CLEARANCE_PATH = TEST_IMAGES_DIR / "nbi_clearance.jpg"

# Test credentials - update as needed
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"


def get_auth_token():
    """Get JWT token via login"""
    global TOKEN
    
    print("\n" + "=" * 60)
    print("STEP 1: Getting Authentication Token")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/accounts/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code == 200:
            data = response.json()
            TOKEN = data.get("access_token") or data.get("token")
            if TOKEN:
                print(f"✅ Login successful, token obtained")
                print(f"   Token prefix: {TOKEN[:30]}...")
                return True
            else:
                print(f"❌ Login response missing token: {data}")
                return False
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False


def test_extract_id(image_path: Path, id_type: str = "DRIVERSLICENSE"):
    """Test the extract-id endpoint"""
    
    print("\n" + "=" * 60)
    print(f"STEP 2: Testing ID Extraction ({id_type})")
    print("=" * 60)
    
    if not image_path.exists():
        print(f"❌ Image not found: {image_path}")
        return None
    
    print(f"📁 Image: {image_path.name}")
    print(f"📊 Size: {image_path.stat().st_size} bytes")
    
    try:
        with open(image_path, 'rb') as f:
            files = {
                'id_front': (image_path.name, f, 'image/jpeg')
            }
            data = {
                'id_type': id_type
            }
            headers = {
                'Authorization': f'Bearer {TOKEN}'
            }
            
            response = requests.post(
                f"{BASE_URL}/api/accounts/kyc/extract-id",
                files=files,
                data=data,
                headers=headers
            )
        
        print(f"\n📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Extraction successful!")
            print(f"\n📋 Response:")
            print(json.dumps(result, indent=2))
            
            # Validate expected fields
            print("\n" + "-" * 40)
            print("Field Analysis:")
            print("-" * 40)
            
            if result.get('has_extraction') and result.get('fields'):
                fields = result['fields']
                expected_fields = ['full_name', 'id_number', 'birth_date', 'address', 'sex']
                
                for field_name in expected_fields:
                    field = fields.get(field_name, {})
                    value = field.get('value', 'NOT FOUND')
                    confidence = field.get('confidence', 0)
                    status = "✅" if value and value != 'NOT FOUND' else "⚠️"
                    conf_indicator = "🟢" if confidence >= 0.8 else ("🟡" if confidence >= 0.6 else "🔴")
                    print(f"  {status} {field_name}: {value}")
                    print(f"     {conf_indicator} Confidence: {confidence:.2f}")
            else:
                print("  ⚠️ No extraction data returned (manual entry required)")
            
            return result
        else:
            print(f"❌ Extraction failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_extract_clearance(image_path: Path, clearance_type: str = "NBI"):
    """Test the extract-clearance endpoint"""
    
    print("\n" + "=" * 60)
    print(f"STEP 3: Testing Clearance Extraction ({clearance_type})")
    print("=" * 60)
    
    if not image_path.exists():
        print(f"❌ Image not found: {image_path}")
        return None
    
    print(f"📁 Image: {image_path.name}")
    print(f"📊 Size: {image_path.stat().st_size} bytes")
    
    try:
        with open(image_path, 'rb') as f:
            files = {
                'clearance': (image_path.name, f, 'image/jpeg')
            }
            data = {
                'clearance_type': clearance_type
            }
            headers = {
                'Authorization': f'Bearer {TOKEN}'
            }
            
            response = requests.post(
                f"{BASE_URL}/api/accounts/kyc/extract-clearance",
                files=files,
                data=data,
                headers=headers
            )
        
        print(f"\n📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Extraction successful!")
            print(f"\n📋 Response:")
            print(json.dumps(result, indent=2))
            
            # Validate expected fields
            print("\n" + "-" * 40)
            print("Field Analysis:")
            print("-" * 40)
            
            if result.get('has_extraction') and result.get('fields'):
                fields = result['fields']
                expected_fields = ['holder_name', 'clearance_number', 'issue_date', 'validity_date', 'clearance_type']
                
                for field_name in expected_fields:
                    field = fields.get(field_name, {})
                    value = field.get('value', 'NOT FOUND')
                    confidence = field.get('confidence', 0)
                    status = "✅" if value and value != 'NOT FOUND' else "⚠️"
                    conf_indicator = "🟢" if confidence >= 0.8 else ("🟡" if confidence >= 0.6 else "🔴")
                    print(f"  {status} {field_name}: {value}")
                    print(f"     {conf_indicator} Confidence: {confidence:.2f}")
            else:
                print("  ⚠️ No extraction data returned (manual entry required)")
            
            return result
        else:
            print(f"❌ Extraction failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_unauthorized_access():
    """Test that endpoints require authentication"""
    
    print("\n" + "=" * 60)
    print("STEP 4: Testing Unauthorized Access (No Token)")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/accounts/kyc/extract-id",
            files={'id_front': ('test.jpg', b'fake data', 'image/jpeg')},
            data={'id_type': 'NATIONALID'}
            # No Authorization header
        )
        
        if response.status_code == 401:
            print("✅ Correctly returns 401 Unauthorized without token")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    
    print("\n" + "=" * 60)
    print("MOBILE KYC PER-STEP OCR EXTRACTION TEST")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Images Directory: {TEST_IMAGES_DIR}")
    
    # Check test images exist
    print("\n📁 Checking test images...")
    images_ok = True
    if DRIVERS_LICENSE_PATH.exists():
        print(f"  ✅ drivers_license.jpg ({DRIVERS_LICENSE_PATH.stat().st_size} bytes)")
    else:
        print(f"  ❌ drivers_license.jpg NOT FOUND")
        images_ok = False
        
    if NBI_CLEARANCE_PATH.exists():
        print(f"  ✅ nbi_clearance.jpg ({NBI_CLEARANCE_PATH.stat().st_size} bytes)")
    else:
        print(f"  ❌ nbi_clearance.jpg NOT FOUND")
        images_ok = False
    
    if not images_ok:
        print("\n⚠️ Some test images are missing. Tests may fail.")
    
    # Get auth token
    if not get_auth_token():
        print("\n⚠️ Could not get auth token. Running tests without authentication...")
        print("   (Tests requiring auth will fail with 401)")
    
    results = []
    
    # Test 1: Unauthorized access
    results.append(("Unauthorized Access Test", test_unauthorized_access()))
    
    # Test 2: Driver's License extraction
    id_result = test_extract_id(DRIVERS_LICENSE_PATH, "DRIVERSLICENSE")
    results.append(("Driver's License Extraction", id_result is not None))
    
    # Test 3: NBI Clearance extraction
    clearance_result = test_extract_clearance(NBI_CLEARANCE_PATH, "NBI")
    results.append(("NBI Clearance Extraction", clearance_result is not None))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} - {test_name}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    
    # Return exit code
    return 0 if passed_count == total_count else 1


if __name__ == "__main__":
    sys.exit(main())

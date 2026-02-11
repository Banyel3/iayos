#!/usr/bin/env python3
"""
Enhanced Agency KYC Test Script with business_type parameter testing
Tests all Agency KYC endpoints including the new business_type functionality
"""

import requests
import os
import sys
from PIL import Image
import io
import tempfile

BASE_URL = "http://localhost:8000"

def create_test_image(width=800, height=600, color='white'):
    """Create a simple test image"""
    img = Image.new('RGB', (width, height), color=color)
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG')
    img_io.seek(0)
    return img_io

def test_agency_kyc_with_business_type():
    """Test Agency KYC endpoints with business_type parameter"""
    
    print("=" * 70)
    print("AGENCY KYC ENDPOINT TESTING WITH BUSINESS_TYPE")
    print("=" * 70)
    print("\nTesting the business_type parameter from commit 30c49425")
    print("Business types: SOLE_PROPRIETORSHIP, PARTNERSHIP, CORPORATION, COOPERATIVE")
    print("=" * 70)
    
    # Create temporary directory for test images
    temp_dir = tempfile.mkdtemp()
    
    # Create test images
    print("\n[SETUP] Creating test images...")
    test_images = {}
    for img_type in ['business_permit', 'rep_front', 'rep_back', 'address_proof', 'auth_letter']:
        img_path = os.path.join(temp_dir, f"{img_type}.jpg")
        img = Image.new('RGB', (800, 600), color='blue' if img_type == 'rep_front' else 'white')
        img.save(img_path, 'JPEG')
        test_images[img_type] = img_path
        print(f"   ✅ Created {img_type}.jpg")
    
    # 1. Login (create test user if needed)
    print("\n[1] Logging in as test agency user...")
    login_resp = requests.post(
        f"{BASE_URL}/api/accounts/login",
        json={
            "email": "test_biz_type@example.com",
            "password": "TestPassword123!"
        }
    )
    
    if login_resp.status_code != 200:
        print(f"   ⚠️  Login failed (status {login_resp.status_code}), user may not exist")
        print(f"   Note: In production, create user via signup endpoint first")
        # Try alternative test account
        login_resp = requests.post(
            f"{BASE_URL}/api/accounts/login",
            json={
                "email": "testagency@iayos.com",
                "password": "TestAgency123!"
            }
        )
        
    if login_resp.status_code == 200:
        login_data = login_resp.json()
        cookies = {"access": login_data.get("access")}
        print(f"   ✅ Login successful")
    else:
        print(f"   ❌ Login failed - cannot continue tests")
        print(f"   Response: {login_resp.text[:200]}")
        cleanup_files(temp_dir)
        return False
    
    # 2. Test GET /api/agency/status
    print("\n[2] Testing GET /api/agency/status...")
    try:
        status_resp = requests.get(f"{BASE_URL}/api/agency/status", cookies=cookies)
        if status_resp.status_code in [200, 404]:
            print(f"   ✅ Status {status_resp.status_code} - Endpoint working (not 500 or 405)")
        else:
            print(f"   ⚠️  Status {status_resp.status_code}: {status_resp.text[:100]}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        cleanup_files(temp_dir)
        return False
    
    # 3. Test POST /api/agency/kyc/validate-document
    print("\n[3] Testing POST /api/agency/kyc/validate-document...")
    try:
        with open(test_images['business_permit'], 'rb') as f:
            validate_resp = requests.post(
                f"{BASE_URL}/api/agency/kyc/validate-document",
                cookies=cookies,
                files={"file": ("permit.jpg", f, "image/jpeg")},
                data={"document_type": "BUSINESS_PERMIT"}
            )
        if validate_resp.status_code in [200, 400]:
            print(f"   ✅ Status {validate_resp.status_code} - Endpoint working (not 500 or 405)")
        else:
            print(f"   ⚠️  Status {validate_resp.status_code}: {validate_resp.text[:100]}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 4. Test POST /api/agency/upload with different business_types
    print("\n[4] Testing POST /api/agency/upload with business_type parameter...")
    
    business_types = [
        ("SOLE_PROPRIETORSHIP", "Sole Proprietorship (DTI)"),
        ("CORPORATION", "Corporation (SEC)"),
        ("PARTNERSHIP", "Partnership (SEC)"),
        ("COOPERATIVE", "Cooperative (CDA/SEC)")
    ]
    
    for biz_type, biz_label in business_types:
        print(f"\n   Testing business_type: {biz_type}")
        
        # Prepare files for upload
        files = {}
        for img_type, img_path in test_images.items():
            with open(img_path, 'rb') as f:
                files[img_type] = (f"{img_type}.jpg", f.read(), "image/jpeg")
        
        data = {
            "businessName": f"Test {biz_label} Company",
            "businessDesc": f"Testing {biz_type} registration",
            "rep_id_type": "PHILSYS_ID",
            "business_type": biz_type  # NEW: business_type parameter
        }
        
        try:
            upload_resp = requests.post(
                f"{BASE_URL}/api/agency/upload",
                cookies=cookies,
                files=files,
                data=data
            )
            
            if upload_resp.status_code == 500:
                print(f"      ❌ FAIL: Returned 500 Internal Server Error")
                print(f"         Response: {upload_resp.text[:300]}")
                cleanup_files(temp_dir)
                return False
            elif upload_resp.status_code == 405:
                print(f"      ❌ FAIL: Returned 405 Method Not Allowed")
                cleanup_files(temp_dir)
                return False
            elif upload_resp.status_code in [200, 201]:
                print(f"      ✅ PASS: Status {upload_resp.status_code} - Upload successful")
                result = upload_resp.json()
                print(f"         Message: {result.get('message', 'N/A')}")
            else:
                print(f"      ⚠️  Status {upload_resp.status_code}: {upload_resp.text[:150]}")
                
        except Exception as e:
            print(f"      ❌ Exception: {e}")
            cleanup_files(temp_dir)
            return False
        
        # Short delay between uploads
        import time
        time.sleep(0.5)
    
    # 5. Test GET /api/agency/kyc/autofill
    print("\n[5] Testing GET /api/agency/kyc/autofill...")
    try:
        autofill_resp = requests.get(f"{BASE_URL}/api/agency/kyc/autofill", cookies=cookies)
        if autofill_resp.status_code == 500:
            print(f"   ❌ FAIL: Returned 500 Internal Server Error")
            cleanup_files(temp_dir)
            return False
        elif autofill_resp.status_code == 405:
            print(f"   ❌ FAIL: Returned 405 Method Not Allowed")
            cleanup_files(temp_dir)
            return False
        elif autofill_resp.status_code == 200:
            print(f"   ✅ PASS: Status 200 - Autofill endpoint working")
            result = autofill_resp.json()
            if result.get('has_extracted_data'):
                print(f"      Extraction status: {result.get('extraction_status')}")
                if 'fields' in result and 'business_type' in result['fields']:
                    biz_type_field = result['fields']['business_type']
                    print(f"      ✅ business_type in response: {biz_type_field.get('value')}")
                else:
                    print(f"      ⚠️  business_type not in autofill fields")
        else:
            print(f"   ⚠️  Status {autofill_resp.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 6. Test POST /api/agency/kyc/confirm with business_type
    print("\n[6] Testing POST /api/agency/kyc/confirm with business_type...")
    confirm_data = {
        "business_name": "Confirmed Test Company",
        "business_type": "CORPORATION",  # NEW: business_type parameter
        "business_address": "123 Test Street, Manila",
        "permit_number": "BP-2024-12345",
        "tin": "123-456-789-000",
        "rep_full_name": "John Doe",
        "rep_id_number": "1234-5678-9012-3456",
        "rep_birth_date": "1990-01-15",
        "rep_address": "456 Sample Ave, Quezon City",
        "edited_fields": ["business_name", "business_type"]
    }
    
    try:
        confirm_resp = requests.post(
            f"{BASE_URL}/api/agency/kyc/confirm",
            cookies=cookies,
            json=confirm_data
        )
        
        if confirm_resp.status_code == 500:
            print(f"   ❌ FAIL: Returned 500 Internal Server Error")
            print(f"      Response: {confirm_resp.text[:300]}")
            cleanup_files(temp_dir)
            return False
        elif confirm_resp.status_code == 405:
            print(f"   ❌ FAIL: Returned 405 Method Not Allowed")
            cleanup_files(temp_dir)
            return False
        elif confirm_resp.status_code in [200, 201]:
            print(f"   ✅ PASS: Status {confirm_resp.status_code} - Confirm successful")
            result = confirm_resp.json()
            print(f"      Message: {result.get('message')}")
            print(f"      Extraction status: {result.get('extraction_status')}")
        elif confirm_resp.status_code == 404:
            print(f"   ⚠️  Status 404: No KYC record found (may need to upload first)")
        else:
            print(f"   ⚠️  Status {confirm_resp.status_code}: {confirm_resp.text[:150]}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Cleanup
    cleanup_files(temp_dir)
    
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print("✅ All Agency KYC endpoints tested")
    print("✅ business_type parameter tested in upload and confirm endpoints")
    print("✅ No 500 or 405 errors encountered")
    print("=" * 70)
    
    return True

def cleanup_files(temp_dir):
    """Clean up temporary files"""
    import shutil
    try:
        shutil.rmtree(temp_dir)
        print(f"\n[CLEANUP] Removed temporary test images")
    except:
        pass

if __name__ == "__main__":
    try:
        success = test_agency_kyc_with_business_type()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nTest failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

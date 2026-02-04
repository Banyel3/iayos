#!/usr/bin/env python3
"""
Test Agency KYC Process
Account: testagency@iayos.com / TestAgency123!
Account ID: 85, Agency ID: 12
"""

import requests
import os

BASE_URL = "http://localhost:8000"

def main():
    print("=" * 60)
    print("AGENCY KYC TEST")
    print("=" * 60)
    
    # 1. Login
    print("\n[1] Logging in as agency...")
    login_resp = requests.post(
        f"{BASE_URL}/api/accounts/login",
        json={
            "email": "testagency@iayos.com",
            "password": "TestAgency123!"
        }
    )
    print(f"   Status: {login_resp.status_code}")
    
    if login_resp.status_code != 200:
        print(f"   Error: {login_resp.text}")
        return
    
    login_data = login_resp.json()
    access_token = login_data.get("access")
    print(f"   ✅ Login successful, Account ID: {login_data.get('user', {}).get('accountID')}")
    
    # Set up headers with cookie
    cookies = {"access": access_token}
    
    # 2. Check current KYC status
    print("\n[2] Checking current KYC status...")
    status_resp = requests.get(
        f"{BASE_URL}/api/agency/status",
        cookies=cookies
    )
    print(f"   Status: {status_resp.status_code}")
    if status_resp.status_code == 200:
        print(f"   Response: {status_resp.json()}")
    else:
        print(f"   Note: {status_resp.text[:200] if len(status_resp.text) > 200 else status_resp.text}")
    
    # 3. Get test images - use absolute path in container
    test_images_dir = "/app/apps/backend/scripts/testing"
    
    test_id = os.path.join(test_images_dir, "test_id.jpg")
    test_id_face = os.path.join(test_images_dir, "test_id_face.jpg")
    test_nbi = os.path.join(test_images_dir, "test_nbi.jpg")
    
    print(f"\n[3] Checking test images...")
    for path, name in [(test_id, "test_id"), (test_id_face, "test_id_face"), (test_nbi, "test_nbi")]:
        if os.path.exists(path):
            size = os.path.getsize(path)
            print(f"   ✅ {name}.jpg exists ({size} bytes)")
        else:
            print(f"   ❌ {name}.jpg NOT FOUND at {path}")
            return
    
    # 4. Validate a document (business permit)
    print("\n[4] Validating business permit document...")
    with open(test_id, "rb") as f:
        validate_resp = requests.post(
            f"{BASE_URL}/api/agency/kyc/validate-document",
            cookies=cookies,
            files={"file": ("business_permit.jpg", f, "image/jpeg")},
            data={"document_type": "BUSINESS_PERMIT"}
        )
    print(f"   Status: {validate_resp.status_code}")
    if validate_resp.status_code == 200:
        result = validate_resp.json()
        print(f"   Valid: {result.get('valid')}")
        if result.get('details'):
            print(f"   Quality: {result['details'].get('quality_score', 'N/A')}")
    else:
        print(f"   Error: {validate_resp.text[:200]}")
    
    # 5. Validate rep ID front (should detect face)
    print("\n[5] Validating rep ID front (face detection)...")
    with open(test_id_face, "rb") as f:
        validate_resp = requests.post(
            f"{BASE_URL}/api/agency/kyc/validate-document",
            cookies=cookies,
            files={"file": ("rep_front.jpg", f, "image/jpeg")},
            data={"document_type": "REP_ID_FRONT"}
        )
    print(f"   Status: {validate_resp.status_code}")
    if validate_resp.status_code == 200:
        result = validate_resp.json()
        print(f"   Valid: {result.get('valid')}")
        if result.get('details'):
            print(f"   Face Detected: {result['details'].get('face_detected', 'N/A')}")
            print(f"   Quality: {result['details'].get('quality_score', 'N/A')}")
    else:
        print(f"   Error: {validate_resp.text[:200]}")
    
    # 6. Full Agency KYC Upload
    print("\n[6] Uploading full Agency KYC...")
    with open(test_id, "rb") as permit, \
         open(test_id_face, "rb") as rep_front, \
         open(test_id, "rb") as rep_back, \
         open(test_nbi, "rb") as address, \
         open(test_nbi, "rb") as auth:
        
        files = {
            "business_permit": ("permit.jpg", permit, "image/jpeg"),
            "rep_front": ("rep_front.jpg", rep_front, "image/jpeg"),
            "rep_back": ("rep_back.jpg", rep_back, "image/jpeg"),
            "address_proof": ("address.jpg", address, "image/jpeg"),
            "auth_letter": ("auth.jpg", auth, "image/jpeg"),
        }
        
        data = {
            "businessName": "Test Agency Services",
            "businessDesc": "Professional staffing and recruitment agency for testing",
            "rep_id_type": "PHILSYS_ID"
        }
        
        upload_resp = requests.post(
            f"{BASE_URL}/api/agency/upload",
            cookies=cookies,
            files=files,
            data=data
        )
    
    print(f"   Status: {upload_resp.status_code}")
    if upload_resp.status_code == 200:
        result = upload_resp.json()
        print(f"   ✅ KYC Upload Result: {result}")
    else:
        print(f"   Error: {upload_resp.text[:500]}")
    
    # 7. Check KYC status after upload
    print("\n[7] Checking KYC status after upload...")
    status_resp = requests.get(
        f"{BASE_URL}/api/agency/status",
        cookies=cookies
    )
    print(f"   Status: {status_resp.status_code}")
    if status_resp.status_code == 200:
        print(f"   ✅ Response: {status_resp.json()}")
    else:
        print(f"   Note: {status_resp.text[:300]}")
    
    print("\n" + "=" * 60)
    print("AGENCY KYC TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()

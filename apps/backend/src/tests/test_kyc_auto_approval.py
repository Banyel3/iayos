"""
Test KYC Auto-Approval Flow

Tests:
1. Upload KYC documents (FRONTID, BACKID, SELFIE)
2. Verify face_match_score is stored
3. Confirm OCR extracted data
4. Verify auto-approval triggers when thresholds met
"""

import os
import sys
import requests
from io import BytesIO
from PIL import Image

# Add backend to path
sys.path.insert(0, '/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

import django
django.setup()

from accounts.models import Accounts, Profile, kyc, kycFiles, KYCExtractedData

# Test config
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "kycautotest@test.com"
TEST_PASSWORD = "TestPass123!"


def create_test_image(width=400, height=300, color=(100, 150, 200)):
    """Create a simple test image"""
    img = Image.new('RGB', (width, height), color=color)
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=85)
    buf.seek(0)
    return buf


def get_or_create_test_user():
    """Get or create test user for KYC testing"""
    try:
        user = Accounts.objects.get(email=TEST_EMAIL)
        print(f"✓ Found existing user: {user.email}")
    except Accounts.DoesNotExist:
        user = Accounts.objects.create_user(
            email=TEST_EMAIL,
            password=TEST_PASSWORD,
            first_name="KYC",
            last_name="TestUser",
            isVerified=True
        )
        # Create profile
        Profile.objects.create(
            accountFK=user,
            first_name="KYC",
            last_name="TestUser",
            profileType="WORKER"
        )
        print(f"✓ Created new user: {user.email}")
    
    # Delete any existing KYC
    try:
        old_kyc = kyc.objects.get(accountFK=user)
        kycFiles.objects.filter(kycID=old_kyc).delete()
        KYCExtractedData.objects.filter(kycID=old_kyc).delete()
        old_kyc.delete()
        print(f"✓ Deleted existing KYC record")
    except kyc.DoesNotExist:
        pass
    
    return user


def login_user():
    """Login and get auth token"""
    resp = requests.post(f"{BASE_URL}/api/mobile/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if resp.status_code != 200:
        print(f"✗ Login failed: {resp.status_code} - {resp.text}")
        return None
    
    data = resp.json()
    token = data.get('token') or data.get('access_token')
    print(f"✓ Login successful, token: {token[:20]}...")
    return token


def upload_kyc_documents(token):
    """Upload KYC documents via mobile API"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create test images
    front_id = create_test_image(800, 500, (200, 200, 200))
    back_id = create_test_image(800, 500, (180, 180, 180))
    selfie = create_test_image(600, 800, (220, 180, 160))
    
    files = {
        'FRONTID': ('front_id.jpg', front_id, 'image/jpeg'),
        'BACKID': ('back_id.jpg', back_id, 'image/jpeg'),
        'SELFIE': ('selfie.jpg', selfie, 'image/jpeg'),
    }
    
    data = {
        'id_type': 'NATIONALID'
    }
    
    print("\n📤 Uploading KYC documents...")
    resp = requests.post(
        f"{BASE_URL}/api/mobile/kyc/upload",
        headers=headers,
        files=files,
        data=data
    )
    
    print(f"   Status: {resp.status_code}")
    if resp.status_code in [200, 201]:
        result = resp.json()
        print(f"   KYC ID: {result.get('kyc_id')}")
        print(f"   Status: {result.get('status')}")
        print(f"   Face Match: {result.get('face_match')}")
        return result
    else:
        print(f"   Error: {resp.text[:500]}")
        return None


def check_kyc_status():
    """Check KYC status and extraction data"""
    user = Accounts.objects.get(email=TEST_EMAIL)
    try:
        kyc_record = kyc.objects.get(accountFK=user)
        print(f"\n📋 KYC Record:")
        print(f"   ID: {kyc_record.kycID}")
        print(f"   Status: {kyc_record.kyc_status}")
        print(f"   Reviewed By: {kyc_record.reviewedBy}")
        print(f"   Notes: {kyc_record.notes}")
        
        try:
            extracted = KYCExtractedData.objects.get(kycID=kyc_record)
            print(f"\n📋 Extracted Data:")
            print(f"   Extraction Status: {extracted.extraction_status}")
            print(f"   Overall Confidence: {extracted.overall_confidence}")
            print(f"   Face Match Score: {extracted.face_match_score}")
            print(f"   Face Match Completed: {extracted.face_match_completed}")
            print(f"   ID Type: {extracted.extracted_id_type}")
            print(f"   Full Name: {extracted.extracted_full_name}")
            return kyc_record, extracted
        except KYCExtractedData.DoesNotExist:
            print(f"\n   ⚠️ No extraction data found")
            return kyc_record, None
            
    except kyc.DoesNotExist:
        print(f"\n   ⚠️ No KYC record found")
        return None, None


def confirm_kyc_data(token):
    """Confirm the OCR extracted data"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get autofill data first
    resp = requests.get(f"{BASE_URL}/api/mobile/kyc/autofill", headers=headers)
    print(f"\n📋 Autofill Data: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"   Extraction Status: {data.get('extraction_status')}")
        print(f"   Needs Confirmation: {data.get('needs_confirmation')}")
    
    # Confirm the data
    confirm_data = {
        "full_name": "Juan Dela Cruz",
        "first_name": "Juan",
        "middle_name": "Santos",
        "last_name": "Dela Cruz",
        "address": "123 Main St, Zamboanga City",
        "birth_date": "1990-01-15",
        "id_number": "1234-5678-9012",
        "id_type": "NATIONALID"
    }
    
    print(f"\n✍️ Confirming KYC data...")
    resp = requests.post(
        f"{BASE_URL}/api/mobile/kyc/confirm",
        headers=headers,
        json=confirm_data
    )
    
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        result = resp.json()
        print(f"   Message: {result.get('message')}")
        print(f"   Auto Approved: {result.get('auto_approved')}")
        print(f"   Approval Reason: {result.get('approval_reason')}")
        return result
    else:
        print(f"   Error: {resp.text[:500]}")
        return None


def run_tests():
    """Run the full test flow"""
    print("=" * 60)
    print("KYC AUTO-APPROVAL TEST")
    print("=" * 60)
    
    # Step 1: Create/get test user
    print("\n1️⃣ Setting up test user...")
    user = get_or_create_test_user()
    
    # Step 2: Login
    print("\n2️⃣ Logging in...")
    token = login_user()
    if not token:
        print("❌ Cannot continue without login")
        return
    
    # Step 3: Upload KYC documents
    print("\n3️⃣ Uploading KYC documents...")
    upload_result = upload_kyc_documents(token)
    if not upload_result:
        print("❌ Upload failed")
        return
    
    # Step 4: Check status
    print("\n4️⃣ Checking KYC status after upload...")
    kyc_record, extracted = check_kyc_status()
    
    # Step 5: Confirm data
    print("\n5️⃣ Confirming OCR extracted data...")
    confirm_result = confirm_kyc_data(token)
    
    # Step 6: Final status check
    print("\n6️⃣ Final KYC status...")
    check_kyc_status()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()

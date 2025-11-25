#!/usr/bin/env python3
"""
Create an INVITE-type job for Devante Agency
This script logs in as a client and creates a direct job invitation to the Devante agency
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API = f"{BASE_URL}/api"

# Client credentials (UPDATE if needed)
CLIENT_EMAIL = "dump.temp.27@gmail.com"
CLIENT_PASSWORD = "123456"

# Devante Agency details
AGENCY_NAME = "Devante"

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def login_client():
    """Login as client and get session"""
    print(f"\n🔐 Logging in as client: {CLIENT_EMAIL}")
    
    session = requests.Session()
    response = session.post(
        f"{API}/accounts/login",
        json={"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD}
    )
    
    if response.status_code == 200:
        print(f"✅ Login successful")
        return session
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def get_agencies(session):
    """Get list of agencies to find Devante"""
    print("\n📋 Fetching agencies list...")
    
    response = session.get(f"{API}/agency/agencies")
    
    if response.status_code == 200:
        data = response.json()
        agencies = data.get('agencies', [])
        print(f"✅ Found {len(agencies)} agencies")
        
        if agencies:
            print("\n   Available agencies:")
            for agency in agencies[:10]:
                print(f"   - ID: {agency.get('agencyId')}, Name: {agency.get('agencyName')}")
        
        return agencies
    else:
        print(f"❌ Failed to get agencies: {response.status_code}")
        print(f"   Response: {response.text}")
        return []

def find_agency_by_name(agencies, name):
    """Find agency by name (case-insensitive)"""
    for agency in agencies:
        if agency.get('agencyName', '').lower() == name.lower():
            return agency
    return None

def get_categories(session):
    """Get list of job categories"""
    print("\n📋 Fetching categories...")
    
    response = session.get(f"{API}/mobile/jobs/categories")
    
    if response.status_code == 200:
        data = response.json()
        categories = data.get('categories', [])
        print(f"✅ Found {len(categories)} categories")
        
        if categories:
            print("\n   Available categories:")
            for c in categories[:5]:
                print(f"   - ID: {c['id']}, Name: {c['name']}")
        
        return categories
    else:
        print(f"❌ Failed to get categories: {response.status_code}")
        return []

def create_agency_invite_job(session, agency_id, category_id):
    """Create an INVITE-type job for an agency"""
    print(f"\n📝 Creating INVITE job for agency ID: {agency_id}")
    
    job_payload = {
        "title": f"Agency Test Job - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "description": "This is a test job invitation to Devante Agency. We need skilled workers for a construction project. Please assign your best employee for this task.",
        "category_id": category_id,
        "budget": 5000.0,
        "location": "123 Main Street, Zamboanga City, Philippines",
        "urgency_level": "HIGH",
        "expected_duration": "1 week",
        "preferred_start_date": "2025-11-26",
        "materials_needed": ["Cement", "Sand", "Gravel", "Steel bars"],
        "agency_id": agency_id,
        "downpayment_method": "WALLET"
    }
    
    print(f"\n   Job Details:")
    print(f"   - Title: {job_payload['title']}")
    print(f"   - Budget: ₱{job_payload['budget']:,.2f}")
    print(f"   - Urgency: {job_payload['urgency_level']}")
    print(f"   - Duration: {job_payload['expected_duration']}")
    print(f"   - Category ID: {category_id}")
    print(f"   - Agency ID: {agency_id}")
    
    response = session.post(
        f"{API}/mobile/jobs/invite",
        json=job_payload
    )
    
    print(f"\n   Response Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        data = response.json()
        print(f"\n✅ Agency invite job created successfully!")
        print(f"   Job ID: {data.get('job_id')}")
        print(f"   Title: {data.get('title')}")
        print(f"   Status: {data.get('status')}")
        print(f"   Invite Status: {data.get('invite_status')}")
        
        if 'payment' in data:
            print(f"\n   Payment Details:")
            print(f"   - Downpayment: ₱{data['payment'].get('downpayment', 0):,.2f}")
            print(f"   - Commission: ₱{data['payment'].get('commission', 0):,.2f}")
            print(f"   - Total: ₱{data['payment'].get('total', 0):,.2f}")
        
        return data
    else:
        print(f"\n❌ Failed to create agency invite job")
        try:
            error_data = response.json()
            print(f"   Error: {error_data.get('error', 'Unknown error')}")
            if 'detail' in error_data:
                print(f"   Detail: {error_data['detail']}")
        except:
            print(f"   Raw response: {response.text}")
        return None

def verify_agency_invitation(session, job_id):
    """Verify the job appears in agency's pending invitations"""
    print(f"\n🔍 Verifying job ID {job_id} was sent to agency...")
    
    # Check client's jobs
    response = session.get(f"{API}/mobile/jobs/my-jobs?status=PENDING")
    
    if response.status_code == 200:
        data = response.json()
        jobs = data.get('jobs', [])
        
        for job in jobs:
            if job.get('id') == job_id:
                print(f"✅ Job found in client's list!")
                print(f"   - Type: {job.get('job_type')}")
                print(f"   - Invite Status: {job.get('invite_status')}")
                
                if 'assigned_agency' in job:
                    print(f"   - Assigned Agency: {job['assigned_agency'].get('name')}")
                
                return True
        
        print(f"⚠️  Job not found in client's list")
        return False
    else:
        print(f"❌ Failed to verify: {response.status_code}")
        return False

def main():
    print_section("CREATE AGENCY INVITATION - DEVANTE")
    print(f"API Base URL: {API}")
    print(f"Target Agency: {AGENCY_NAME}")
    
    # Step 1: Login as client
    print_section("STEP 1: CLIENT LOGIN")
    session = login_client()
    if not session:
        print("\n❌ Test aborted - Login failed")
        return
    
    # Step 2: Get agencies and find Devante
    print_section("STEP 2: FIND DEVANTE AGENCY")
    agencies = get_agencies(session)
    if not agencies:
        print(f"\n❌ No agencies found - cannot proceed")
        return
    
    devante = find_agency_by_name(agencies, AGENCY_NAME)
    if not devante:
        print(f"\n❌ Agency '{AGENCY_NAME}' not found!")
        print(f"   Available agencies: {[a.get('agencyName') for a in agencies[:5]]}")
        return
    
    agency_id = devante.get('agencyId')
    print(f"\n✅ Found Devante Agency!")
    print(f"   - Agency ID: {agency_id}")
    print(f"   - Name: {devante.get('agencyName')}")
    print(f"   - Email: {devante.get('email')}")
    print(f"   - Rating: {devante.get('rating', 0):.1f}")
    
    # Step 3: Get categories
    print_section("STEP 3: GET JOB CATEGORIES")
    categories = get_categories(session)
    if not categories:
        print("\n⚠️  No categories found - using default category ID 1")
        category_id = 1
    else:
        # Use first category or find a specific one
        category_id = categories[0]['id']
        print(f"\n✅ Selected category: {categories[0]['name']} (ID: {category_id})")
    
    # Step 4: Create agency invite job
    print_section("STEP 4: CREATE AGENCY INVITATION")
    job = create_agency_invite_job(session, agency_id, category_id)
    
    if job:
        print("\n✅ Agency invitation created successfully!")
        
        # Step 5: Verify invitation
        print_section("STEP 5: VERIFY INVITATION")
        verified = verify_agency_invitation(session, job.get('job_id'))
        
        if verified:
            print("\n✅ Invitation verified!")
        else:
            print("\n⚠️  Could not verify invitation")
    else:
        print("\n❌ Failed to create agency invitation")
    
    # Final summary
    print_section("SUMMARY")
    print("✅ Client login - PASSED")
    print("✅ Find Devante agency - PASSED" if devante else "❌ Find agency - FAILED")
    
    if job:
        print("✅ Create agency invitation - PASSED")
        print("\n📝 NEXT STEPS:")
        print("   1. Devante agency will see this invitation in their 'Pending Invites' tab")
        print("   2. Agency can accept or reject the invitation")
        print("   3. If accepted, agency can assign an employee to the job")
        print("   4. Assigned employee will perform the work")
        print("   5. After completion, final payment is released")
    else:
        print("❌ Create agency invitation - FAILED")
    
    print("\n" + "="*80)
    print("Script completed!")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()

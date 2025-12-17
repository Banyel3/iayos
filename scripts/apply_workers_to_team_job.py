"""
Apply 3 workers to a team job for testing conversation functionality
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

# Test users
CLIENT_EMAIL = "testclient_team@test.com"
CLIENT_PASSWORD = "test123456"

# Try multiple worker accounts
WORKER_ACCOUNTS = [
    ("testworker1_team@test.com", "test123456"),
    ("testworker2_team@test.com", "test123456"),
    ("testworker3_team@test.com", "test123456"),
    ("gamerofgames76@gmail.com", "admin123"),
    ("worker@test.com", "test123456"),
    ("worker1@test.com", "test123456"),
    ("worker2@test.com", "test123456"),
]

def login(email, password):
    """Login and get access token"""
    response = requests.post(
        f"{BASE_URL}/mobile/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token") or data.get("access") or data.get("token")
        if token:
            return token, data.get("user", {}).get("id")
    return None, None

def get_auth_header(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def main():
    print("="*70)
    print(" APPLY 3 WORKERS TO TEAM JOB")
    print("="*70)
    
    # Login as client first to create a team job
    print("\n📋 Step 1: Login as client")
    client_token, _ = login(CLIENT_EMAIL, CLIENT_PASSWORD)
    if not client_token:
        print("❌ Client login failed")
        return
    print(f"✅ Client logged in")
    
    # Get or create a team job
    print("\n📋 Step 2: Create fresh team job")
    team_job_data = {
        "title": f"Team Job Test {int(time.time())}",
        "description": "Testing team job conversations. Need 3 workers: 2 plumbers and 1 electrician.",
        "location": "123 Test Street, Tetuan, Zamboanga City",
        "total_budget": 15000,
        "budget_allocation_type": "EQUAL_PER_WORKER",
        "urgency_level": "MEDIUM",
        "preferred_start_date": "2025-12-20",
        "skill_slots": [
            {
                "specialization_id": 1,  # Plumbing
                "workers_needed": 2,
                "skill_level_required": "INTERMEDIATE",
                "notes": "Need 2 plumbers"
            },
            {
                "specialization_id": 2,  # Electrical
                "workers_needed": 1,
                "skill_level_required": "INTERMEDIATE", 
                "notes": "Need 1 electrician"
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/jobs/team/create",
        headers=get_auth_header(client_token),
        json=team_job_data
    )
    
    if response.status_code not in [200, 201]:
        print(f"❌ Failed to create team job: {response.status_code}")
        print(response.text[:500])
        return
    
    job_data = response.json()
    job_id = job_data.get("job_id") or job_data.get("job", {}).get("id")
    print(f"✅ Team job created: ID={job_id}")
    
    # Get skill slots
    slots = job_data.get("skill_slots", [])
    if not slots:
        # Fetch the job to get slots
        response = requests.get(
            f"{BASE_URL}/jobs/{job_id}/team",
            headers=get_auth_header(client_token)
        )
        if response.status_code == 200:
            slots = response.json().get("skill_slots", [])
    
    print(f"   Skill slots: {len(slots)}")
    for s in slots:
        print(f"   - Slot {s.get('id')}: {s.get('specialization', {}).get('name', 'Unknown')}, need {s.get('workers_needed')} workers")
    
    # Now login workers and apply
    print("\n📋 Step 3: Login workers and apply")
    
    worker_tokens = []
    for email, password in WORKER_ACCOUNTS:
        token, user_id = login(email, password)
        if token:
            worker_tokens.append((token, email, user_id))
            print(f"✅ Worker logged in: {email}")
        else:
            print(f"❌ Worker login failed: {email}")
        
        if len(worker_tokens) >= 3:
            break
    
    if len(worker_tokens) < 3:
        print(f"\n⚠️ Only {len(worker_tokens)} workers available. Creating test workers...")
        # Register new workers
        for i in range(3 - len(worker_tokens)):
            email = f"testworker{i+1}_new@test.com"
            response = requests.post(
                f"{BASE_URL}/mobile/auth/register",
                json={
                    "email": email,
                    "password": "test123456",
                    "first_name": f"Worker{i+1}",
                    "last_name": "Test",
                    "profile_type": "WORKER"
                }
            )
            if response.status_code in [200, 201]:
                token, user_id = login(email, "test123456")
                if token:
                    worker_tokens.append((token, email, user_id))
                    print(f"✅ Created and logged in: {email}")
    
    if len(worker_tokens) < 3:
        print(f"\n❌ Could not get 3 workers. Only have {len(worker_tokens)}")
        if len(worker_tokens) == 0:
            return
    
    # Apply workers to the job
    print(f"\n📋 Step 4: Apply {len(worker_tokens)} workers to team job {job_id}")
    
    applications = []
    for i, (token, email, user_id) in enumerate(worker_tokens):
        # Determine which slot to apply to
        slot_index = i % len(slots) if slots else 0
        slot_id = slots[slot_index].get("id") if slots else None
        
        apply_data = {
            "proposal_message": f"I am {email}, applying for this team job. I have relevant experience.",
            "proposed_budget": 5000,
        }
        if slot_id:
            apply_data["skill_slot_id"] = slot_id
        
        response = requests.post(
            f"{BASE_URL}/jobs/{job_id}/team/apply",
            headers=get_auth_header(token),
            json=apply_data
        )
        
        if response.status_code in [200, 201]:
            app_data = response.json()
            applications.append({
                "email": email,
                "token": token,
                "app_id": app_data.get("application_id") or app_data.get("application", {}).get("id")
            })
            print(f"✅ {email} applied successfully")
        else:
            print(f"❌ {email} application failed: {response.status_code}")
            print(f"   {response.text[:200]}")
    
    print(f"\n📋 Step 5: Client accepts applications")
    
    # Get applications
    response = requests.get(
        f"{BASE_URL}/jobs/{job_id}/team/applications",
        headers=get_auth_header(client_token)
    )
    
    if response.status_code == 200:
        apps_data = response.json()
        pending_apps = [a for a in apps_data.get("applications", []) if a.get("status") == "PENDING"]
        print(f"   Found {len(pending_apps)} pending applications")
        
        for app in pending_apps[:3]:
            app_id = app.get("id") or app.get("application_id")
            worker_name = app.get("worker", {}).get("name", "Unknown")
            
            # Accept the application
            response = requests.post(
                f"{BASE_URL}/jobs/{job_id}/applications/{app_id}/accept",
                headers=get_auth_header(client_token)
            )
            
            if response.status_code == 200:
                print(f"✅ Accepted application from {worker_name}")
            else:
                print(f"❌ Failed to accept {worker_name}: {response.status_code}")
                print(f"   {response.text[:200]}")
    
    print("\n" + "="*70)
    print(" DONE!")
    print("="*70)
    print(f"\n🎯 Team Job ID: {job_id}")
    print(f"📱 Now test conversations in the React Native app!")
    print(f"   - Login as client: {CLIENT_EMAIL}")
    print(f"   - Or login as any accepted worker")
    print(f"   - Check the conversations/messages tab")

if __name__ == "__main__":
    main()

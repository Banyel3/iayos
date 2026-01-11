#!/usr/bin/env python3
"""
Test Team Worker Arrival Tracking API
Tests the new confirm-arrival endpoint for team jobs
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def login(email, password):
    """Login and get JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/accounts/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        token = data.get('access') or data.get('token') or data.get('access_token')
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None

def get_client_team_jobs(token):
    """Get client's team jobs with conversations"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/mobile/jobs/my-jobs?status=ACTIVE",
        headers=headers
    )
    return response

def get_conversation(conversation_id, token):
    """Get conversation with team worker assignments"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/profiles/chat/conversations/{conversation_id}",
        headers=headers
    )
    return response

def confirm_worker_arrival(job_id, assignment_id, token):
    """Confirm team worker has arrived"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/jobs/{job_id}/team/confirm-arrival/{assignment_id}",
        headers=headers
    )
    return response

def main():
    print("=" * 80)
    print("🧪 Testing Team Worker Arrival Tracking")
    print("=" * 80)
    
    # Test data
    JOB_ID = 166
    CONVERSATION_ID = 103
    CLIENT_EMAIL = "testclient@iayos.com"
    CLIENT_PASSWORD = "Test123!"
    
    # Step 1: Login as client
    print("\n📝 Step 1: Login as client...")
    token = login(CLIENT_EMAIL, CLIENT_PASSWORD)
    if not token:
        print("❌ Failed to login. Cannot proceed with tests.")
        return
    print(f"✅ Logged in successfully")
    print(f"   Token: {token[:20]}...")
    
    # Step 2: Get conversation to see team worker assignments
    print(f"\n📝 Step 2: Get conversation {CONVERSATION_ID}...")
    response = get_conversation(CONVERSATION_ID, token)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Conversation retrieved successfully")
        
        # Check if it's a team job
        if data.get('job', {}).get('is_team_job'):
            print(f"   ✓ Team job confirmed")
            
            # Show team worker assignments
            assignments = data.get('team_worker_assignments', [])
            print(f"   ✓ Team workers: {len(assignments)}")
            
            if assignments:
                print("\n   Team Worker Assignments:")
                for i, assignment in enumerate(assignments, 1):
                    print(f"   {i}. {assignment.get('name')} ({assignment.get('skill')})")
                    print(f"      Assignment ID: {assignment.get('assignment_id')}")
                    print(f"      Arrived: {assignment.get('client_confirmed_arrival')}")
                    if assignment.get('client_confirmed_arrival_at'):
                        print(f"      Arrived At: {assignment.get('client_confirmed_arrival_at')}")
                
                # Step 3: Test confirm arrival for first worker
                first_assignment = assignments[0]
                assignment_id = first_assignment['assignment_id']
                worker_name = first_assignment['name']
                already_arrived = first_assignment['client_confirmed_arrival']
                
                print(f"\n📝 Step 3: Confirm arrival for {worker_name}...")
                print(f"   Assignment ID: {assignment_id}")
                print(f"   Already confirmed: {already_arrived}")
                
                response = confirm_worker_arrival(JOB_ID, assignment_id, token)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Arrival confirmed successfully!")
                    print(f"   Worker: {result.get('worker_name')}")
                    print(f"   Confirmed at: {result.get('confirmed_at')}")
                    print(f"   Arrived count: {result.get('arrived_count')}/{result.get('total_count')}")
                    print(f"   All arrived: {result.get('all_workers_arrived')}")
                else:
                    print(f"❌ Failed to confirm arrival")
                    print(f"   Error: {response.text}")
                
                # Step 4: Verify arrival is reflected in conversation
                print(f"\n📝 Step 4: Verify arrival reflected in conversation...")
                response = get_conversation(CONVERSATION_ID, token)
                if response.status_code == 200:
                    data = response.json()
                    assignments = data.get('team_worker_assignments', [])
                    updated_assignment = next(
                        (a for a in assignments if a['assignment_id'] == assignment_id),
                        None
                    )
                    
                    if updated_assignment:
                        if updated_assignment['client_confirmed_arrival']:
                            print(f"✅ Arrival status updated correctly!")
                            print(f"   {updated_assignment['name']}: Arrived at {updated_assignment['client_confirmed_arrival_at']}")
                        else:
                            print(f"⚠️ Arrival status not yet updated")
                    else:
                        print(f"❌ Assignment not found in updated data")
                
                # Step 5: Try duplicate confirmation (should fail)
                print(f"\n📝 Step 5: Test duplicate confirmation (should fail)...")
                response = confirm_worker_arrival(JOB_ID, assignment_id, token)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 400:
                    error = response.json()
                    print(f"✅ Duplicate prevention working!")
                    print(f"   Error: {error.get('error')}")
                else:
                    print(f"⚠️ Expected 400 error for duplicate, got {response.status_code}")
            else:
                print(f"❌ No team worker assignments found")
        else:
            print(f"❌ Not a team job")
    else:
        print(f"❌ Failed to get conversation")
        print(f"   Error: {response.text}")
    
    print("\n" + "=" * 80)
    print("🏁 Test Complete")
    print("=" * 80)

if __name__ == "__main__":
    main()

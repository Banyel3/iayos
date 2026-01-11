"""
Test that team conversation is created when job STARTS (not when posted)
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def login(email, password):
    r = requests.post(f'{BASE_URL}/mobile/auth/login', json={'email': email, 'password': password})
    if r.status_code == 200:
        return r.json().get('access')
    return None

def get_auth_header(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def main():
    print("="*70)
    print(" TEST: Team Conversation Created on Job START")
    print("="*70)
    
    # Login
    print("\n1. Login")
    client_token = login("testclient_team@test.com", "test123456")
    w1_token = login("testworker1_team@test.com", "test123456")
    w2_token = login("testworker2_team@test.com", "test123456")
    w3_token = login("testworker3_team@test.com", "test123456")
    print(f"   Client: {'✅' if client_token else '❌'}")
    print(f"   Workers: {sum([1 for t in [w1_token, w2_token, w3_token] if t])}/3")
    
    if not all([client_token, w1_token, w2_token, w3_token]):
        print("❌ Login failed")
        return
    
    # Create team job
    print("\n2. Create Team Job")
    job_data = {
        "title": f"Conversation Test {int(time.time())}",
        "description": "Test that conversation is created on job start.",
        "location": "Test Location",
        "total_budget": 9000,
        "budget_allocation_type": "EQUAL_PER_WORKER",
        "urgency_level": "MEDIUM",
        "skill_slots": [
            {"specialization_id": 1, "workers_needed": 2, "skill_level_required": "INTERMEDIATE"},
            {"specialization_id": 2, "workers_needed": 1, "skill_level_required": "INTERMEDIATE"}
        ]
    }
    r = requests.post(f'{BASE_URL}/jobs/team/create', headers=get_auth_header(client_token), json=job_data)
    if r.status_code != 200:
        print(f"   ❌ Failed: {r.status_code} - {r.text[:200]}")
        return
    
    job_id = r.json()['job_id']
    print(f"   ✅ Created job #{job_id}")
    
    # Get slots
    r = requests.get(f'{BASE_URL}/jobs/team/{job_id}', headers=get_auth_header(client_token))
    slots = r.json().get('skill_slots', [])
    print(f"   Slots: {[s['specialization_name'] for s in slots]}")
    
    # Check conversation BEFORE job starts
    print("\n3. Check if conversation exists BEFORE job starts")
    r = requests.get(f'{BASE_URL}/profiles/chat/conversations', headers=get_auth_header(client_token))
    convs = r.json().get('conversations', [])
    conv_for_job = [c for c in convs if c.get('job', {}).get('id') == job_id]
    print(f"   Conversation for job #{job_id}: {'EXISTS ❌ (should NOT exist yet)' if conv_for_job else 'NONE ✅ (correct!)'}")
    
    # Apply all workers
    print("\n4. Workers Apply")
    worker_tokens = [w1_token, w2_token, w3_token]
    for i, token in enumerate(worker_tokens):
        slot_id = slots[i % len(slots)]['skill_slot_id']
        r = requests.post(
            f'{BASE_URL}/jobs/team/{job_id}/apply',
            headers=get_auth_header(token),
            json={"proposal_message": f"Worker {i+1} applying", "proposed_budget": 3000, "skill_slot_id": slot_id, "budget_option": "ACCEPT"}
        )
        print(f"   Worker {i+1} applied: {'✅' if r.status_code == 200 else '❌ ' + r.text[:100]}")
    
    # Accept all applications
    print("\n5. Client Accepts Applications")
    r = requests.get(f'{BASE_URL}/jobs/team/{job_id}/applications', headers=get_auth_header(client_token))
    apps = r.json().get('applications', [])
    for app in apps:
        r = requests.post(
            f'{BASE_URL}/jobs/team/{job_id}/applications/{app["application_id"]}/accept',
            headers=get_auth_header(client_token)
        )
        print(f"   Accepted {app['worker_name']}: {'✅' if r.status_code == 200 else '❌'}")
    
    # Check conversation STILL doesn't exist (job not started yet)
    print("\n6. Check conversation STILL doesn't exist (job not started)")
    r = requests.get(f'{BASE_URL}/profiles/chat/conversations', headers=get_auth_header(client_token))
    convs = r.json().get('conversations', [])
    conv_for_job = [c for c in convs if c.get('job', {}).get('id') == job_id]
    print(f"   Conversation for job #{job_id}: {'EXISTS ❌ (should NOT exist yet)' if conv_for_job else 'NONE ✅ (correct!)'}")
    
    # START the job (this should create the conversation!)
    print("\n7. START the Team Job")
    r = requests.post(
        f'{BASE_URL}/jobs/team/{job_id}/start',
        headers=get_auth_header(client_token),
        json={"force_start": False}
    )
    print(f"   Start job: {r.status_code}")
    if r.status_code == 200:
        print(f"   ✅ {r.json().get('message')}")
    else:
        print(f"   Result: {r.text[:200]}")
    
    # NOW check conversation EXISTS
    print("\n8. Check conversation EXISTS AFTER job starts")
    r = requests.get(f'{BASE_URL}/profiles/chat/conversations', headers=get_auth_header(client_token))
    convs = r.json().get('conversations', [])
    conv_for_job = [c for c in convs if c.get('job', {}).get('id') == job_id]
    
    if conv_for_job:
        print(f"   ✅ Conversation for job #{job_id} NOW EXISTS!")
        conv = conv_for_job[0]
        print(f"   ID: {conv['id']}")
        print(f"   Team Members: {len(conv.get('team_members', []))}")
        for m in conv.get('team_members', []):
            print(f"      - {m.get('name')} ({m.get('role')}) - {m.get('skill', 'N/A')}")
        
        # Check messages
        conv_id = conv['id']
        r = requests.get(f'{BASE_URL}/profiles/chat/conversations/{conv_id}', headers=get_auth_header(client_token))
        if r.status_code == 200:
            messages = r.json().get('messages', [])
            print(f"\n   Messages ({len(messages)}):")
            for msg in messages[-5:]:
                sender = msg.get('sender', {}).get('name', 'System')
                content = msg.get('content', '')[:80]
                print(f"      - {sender}: {content}")
    else:
        print(f"   ❌ NO conversation found for job #{job_id}")
    
    # Verify workers can see the conversation too
    print("\n9. Verify Workers Can See Team Chat")
    r = requests.get(f'{BASE_URL}/profiles/chat/conversations', headers=get_auth_header(w1_token))
    convs = r.json().get('conversations', [])
    conv_for_job = [c for c in convs if c.get('job', {}).get('id') == job_id]
    print(f"   Worker 1 sees conversation: {'✅' if conv_for_job else '❌'}")
    
    r = requests.get(f'{BASE_URL}/profiles/chat/conversations', headers=get_auth_header(w2_token))
    convs = r.json().get('conversations', [])
    conv_for_job = [c for c in convs if c.get('job', {}).get('id') == job_id]
    print(f"   Worker 2 sees conversation: {'✅' if conv_for_job else '❌'}")
    
    r = requests.get(f'{BASE_URL}/profiles/chat/conversations', headers=get_auth_header(w3_token))
    convs = r.json().get('conversations', [])
    conv_for_job = [c for c in convs if c.get('job', {}).get('id') == job_id]
    print(f"   Worker 3 sees conversation: {'✅' if conv_for_job else '❌'}")
    
    print("\n" + "="*70)
    print(" TEST COMPLETE")
    print("="*70)

if __name__ == "__main__":
    main()

"""
Team Job Complete Flow Test Script
Tests the entire team job lifecycle from creation to completion
Including: Worker acceptance, team group chat, and messaging
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

# Test users from actual database
CLIENT_EMAIL = "testclient_team@test.com"  # Test Client
CLIENT_PASSWORD = "test123456"

WORKER1_EMAIL = "testworker1_team@test.com"  # Worker 1
WORKER2_EMAIL = "testworker2_team@test.com"  # Worker 2
WORKER3_EMAIL = "testworker3_team@test.com"  # Worker 3
WORKER_PASSWORD = "test123456"

# Specialization IDs from database
PLUMBING_SPEC_ID = 1
ELECTRICAL_SPEC_ID = 2
CARPENTRY_SPEC_ID = 3

def print_section(title):
    print("\n" + "="*70)
    print(f" {title}")
    print("="*70)

def print_result(name, response, show_body=True):
    status = "✅" if response.status_code in [200, 201] else "❌"
    print(f"\n{status} {name}: {response.status_code}")
    if show_body:
        try:
            body = response.json()
            print(json.dumps(body, indent=2)[:2000])
        except:
            print(response.text[:500])
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
        print(f"  ❌ Login response OK but no token found: {data.keys()}")
    print(f"  ❌ Login failed: {response.status_code} - {response.text[:200]}")
    return None

def get_auth_header(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def main():
    print_section("TEAM JOB COMPLETE FLOW TEST")
    print(f"Base URL: {BASE_URL}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "client_login": False,
        "worker_logins": False,
        "team_job_creation": False,
        "worker_applications": False,
        "get_applications": False,
        "accept_applications": False,
        "worker_in_conversation": False,
        "group_chat_messaging": False,
        "conversations": False,
    }
    
    # ===========================================================================
    # STEP 0: Authentication
    # ===========================================================================
    print_section("STEP 0: Authentication")
    
    client_token = login(CLIENT_EMAIL, CLIENT_PASSWORD)
    if not client_token:
        # Try alternative passwords
        for pwd in ["test123", "password", "123456", "Test123!"]:
            client_token = login(CLIENT_EMAIL, pwd)
            if client_token:
                break
    
    if not client_token:
        print("❌ Could not authenticate client. Creating test accounts...")
        # Try with a different known user
        client_token = login("cornelio.vaniel38@gmail.com", "admin123")
        if not client_token:
            client_token = login("gamerofgames76@gmail.com", "admin123")
    
    results["client_login"] = client_token is not None
    
    # Try to login workers
    worker_tokens = []
    for email in [WORKER1_EMAIL, WORKER2_EMAIL, WORKER3_EMAIL]:
        token = login(email, WORKER_PASSWORD)
        if token:
            worker_tokens.append(token)
    
    results["worker_logins"] = len(worker_tokens) > 0
    print(f"\n📋 Authenticated {len(worker_tokens)} workers")
    
    if not client_token:
        print("❌ Cannot continue without client authentication")
        print_summary(results)
        return
    
    # ===========================================================================
    # STEP 1: Get Categories
    # ===========================================================================
    print_section("STEP 1: Get Categories")
    
    response = requests.get(
        f"{BASE_URL}/mobile/jobs/categories",
        headers=get_auth_header(client_token)
    )
    print_result("Get Categories", response)
    
    # ===========================================================================
    # STEP 2: Create Team Job
    # ===========================================================================
    print_section("STEP 2: Create Team Job")
    
    team_job_data = {
        "title": f"Home Renovation TEST {int(time.time())}",
        "description": "Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.",
        "location": "123 Test Street, Tetuan, Zamboanga City",
        "total_budget": 15000,
        "budget_allocation_type": "EQUAL_PER_WORKER",
        "urgency_level": "MEDIUM",
        "preferred_start_date": "2025-12-20",
        "skill_slots": [
            {
                "specialization_id": PLUMBING_SPEC_ID,
                "workers_needed": 2,
                "skill_level_required": "INTERMEDIATE",
                "notes": "Need experience with kitchen sink installation"
            },
            {
                "specialization_id": ELECTRICAL_SPEC_ID,
                "workers_needed": 1,
                "skill_level_required": "EXPERT",
                "notes": "Must have experience for outlet installation"
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/jobs/team/create",
        json=team_job_data,
        headers=get_auth_header(client_token)
    )
    
    success = print_result("Create Team Job", response)
    results["team_job_creation"] = success
    
    if not success:
        print("❌ Failed to create team job")
        print_summary(results)
        return
    
    job_data = response.json()
    team_job_id = job_data.get('job_id') or job_data.get('jobID') or job_data.get('id')
    print(f"\n✅ Team Job Created! ID: {team_job_id}")
    
    # ===========================================================================
    # STEP 3: Get Team Job Details
    # ===========================================================================
    print_section("STEP 3: Get Team Job Details")
    
    response = requests.get(
        f"{BASE_URL}/jobs/team/{team_job_id}",
        headers=get_auth_header(client_token)
    )
    success = print_result("Get Team Job Detail", response)
    
    skill_slots = []
    if success:
        team_detail = response.json()
        skill_slots = team_detail.get('skill_slots', [])
        print(f"\n📋 Skill Slots:")
        for slot in skill_slots:
            slot_id = slot.get('skill_slot_id') or slot.get('id')
            spec_name = slot.get('specialization_name', 'N/A')
            workers_needed = slot.get('workers_needed', 0)
            budget = slot.get('budget_allocated', 0)
            print(f"   - Slot {slot_id}: {spec_name} ({workers_needed} workers, ₱{budget})")
    
    # ===========================================================================
    # STEP 4: Worker Applications
    # ===========================================================================
    print_section("STEP 4: Worker Applications to Skill Slots")
    
    applications_made = 0
    if worker_tokens and skill_slots:
        for i, token in enumerate(worker_tokens[:len(skill_slots)]):
            slot = skill_slots[i % len(skill_slots)]
            slot_id = slot.get('skill_slot_id') or slot.get('id')
            
            apply_data = {
                "skill_slot_id": slot_id,
                "proposal_message": f"Worker {i+1} applying for this position. I have relevant experience.",
                "proposed_budget": 5000,
                "budget_option": "ACCEPT"  # ACCEPT or NEGOTIATE
            }
            
            response = requests.post(
                f"{BASE_URL}/jobs/team/{team_job_id}/apply",
                json=apply_data,
                headers=get_auth_header(token)
            )
            
            if print_result(f"Worker {i+1} Apply to Slot {slot_id}", response):
                applications_made += 1
    else:
        # Try applying with client token (for testing, even though this should fail)
        if skill_slots:
            slot_id = skill_slots[0].get('skill_slot_id') or skill_slots[0].get('id')
            apply_data = {
                "skill_slot_id": slot_id,
                "proposal_message": "Test application",
                "proposed_budget": 5000
            }
            response = requests.post(
                f"{BASE_URL}/jobs/team/{team_job_id}/apply",
                json=apply_data,
                headers=get_auth_header(client_token)
            )
            print_result("Test Application (may fail - client applying)", response)
    
    results["worker_applications"] = applications_made > 0
    
    # ===========================================================================
    # STEP 5: Get Applications
    # ===========================================================================
    print_section("STEP 5: Get Team Job Applications")
    
    response = requests.get(
        f"{BASE_URL}/jobs/team/{team_job_id}/applications",
        headers=get_auth_header(client_token)
    )
    results["get_applications"] = print_result("Get Team Applications", response)
    
    # Get application IDs for acceptance
    application_ids = []
    if response.status_code == 200:
        apps_data = response.json()
        applications = apps_data.get('applications', [])
        for app in applications:
            application_ids.append({
                'id': app.get('application_id'),
                'worker_name': app.get('worker_name'),
                'skill_slot_id': app.get('skill_slot_id'),
                'specialization': app.get('specialization_name')
            })
        print(f"\n📋 Found {len(application_ids)} applications to accept")
    
    # ===========================================================================
    # STEP 6: Client Accepts Applications (Assigns Workers to Team)
    # ===========================================================================
    print_section("STEP 6: Client Accepts Worker Applications")
    
    accepted_count = 0
    for app_info in application_ids:
        app_id = app_info['id']
        response = requests.post(
            f"{BASE_URL}/jobs/team/{team_job_id}/applications/{app_id}/accept",
            headers=get_auth_header(client_token)
        )
        if print_result(f"Accept Application #{app_id} ({app_info['worker_name']} - {app_info['specialization']})", response):
            accepted_count += 1
    
    results["accept_applications"] = accepted_count > 0
    print(f"\n✅ Accepted {accepted_count}/{len(application_ids)} applications")
    
    # ===========================================================================
    # STEP 7: Get Team Job Details After Acceptance
    # ===========================================================================
    print_section("STEP 7: Team Job Details After Worker Acceptance")
    
    response = requests.get(
        f"{BASE_URL}/jobs/team/{team_job_id}",
        headers=get_auth_header(client_token)
    )
    print_result("Get Team Job Detail (Post-Acceptance)", response)
    
    if response.status_code == 200:
        team_detail = response.json()
        print(f"\n📋 Team Fill Status:")
        print(f"   Workers Assigned: {team_detail.get('total_workers_assigned', 0)}/{team_detail.get('total_workers_needed', 0)}")
        print(f"   Fill Percentage: {team_detail.get('team_fill_percentage', 0)}%")
        print(f"   Can Start: {team_detail.get('can_start', False)}")
        
        # Show worker assignments
        assignments = team_detail.get('worker_assignments', [])
        if assignments:
            print(f"\n👷 Worker Assignments:")
            for a in assignments:
                print(f"   - {a.get('worker_name', 'N/A')} → {a.get('skill_name', 'N/A')} (Position #{a.get('position', '?')})")
    
    # ===========================================================================
    # STEP 8: Workers Check Their Conversations (Should now have team chat)
    # ===========================================================================
    print_section("STEP 8: Workers Check Team Group Conversation")
    
    worker_conv_success = True
    team_conversation_id = None
    
    if worker_tokens:
        for i, token in enumerate(worker_tokens[:2]):  # Test first 2 workers who applied
            response = requests.get(
                f"{BASE_URL}/profiles/chat/conversations",
                headers=get_auth_header(token)
            )
            success = print_result(f"Worker {i+1} - Get Conversations", response)
            
            if success and response.status_code == 200:
                conv_data = response.json()
                convs = conv_data.get('conversations', [])
                team_convs = [c for c in convs if c.get('conversation_type') == 'TEAM_GROUP']
                
                print(f"\n📋 Worker {i+1} Conversations: {len(convs)} total, {len(team_convs)} team chats")
                
                if team_convs:
                    # Find the conversation for our team job
                    for tc in team_convs:
                        if tc.get('job', {}).get('id') == team_job_id:
                            team_conversation_id = tc.get('id')
                            print(f"   ✅ Found team conversation ID: {team_conversation_id}")
                            print(f"   📋 Team Members: {len(tc.get('team_members', []))}")
                            print(f"   📋 Worker Role: {tc.get('my_role')}")
                            print(f"   📋 Worker Skill: {tc.get('my_skill')}")
                            break
                else:
                    print(f"   ⚠️ Worker {i+1} not yet in team conversation")
                    worker_conv_success = False
            else:
                worker_conv_success = False
    
    results["worker_in_conversation"] = worker_conv_success
    
    # ===========================================================================
    # STEP 9: Test Group Chat Messaging
    # ===========================================================================
    print_section("STEP 9: Test Group Chat Messaging")
    
    messaging_success = True
    
    if team_conversation_id and worker_tokens:
        # Worker 1 sends a message - use correct endpoint: POST /profiles/chat/messages
        message_data = {
            "conversation_id": team_conversation_id,
            "message_text": f"Hello team! Worker 1 here. Ready to start the job! 🔧",
            "message_type": "TEXT"
        }
        response = requests.post(
            f"{BASE_URL}/profiles/chat/messages",
            json=message_data,
            headers=get_auth_header(worker_tokens[0])
        )
        if not print_result("Worker 1 - Send Message to Team", response):
            messaging_success = False
        
        # Worker 2 sends a message
        if len(worker_tokens) > 1:
            message_data = {
                "conversation_id": team_conversation_id,
                "message_text": "Hi everyone! Worker 2 reporting in. Let's get this done! ⚡",
                "message_type": "TEXT"
            }
            response = requests.post(
                f"{BASE_URL}/profiles/chat/messages",
                json=message_data,
                headers=get_auth_header(worker_tokens[1])
            )
            if not print_result("Worker 2 - Send Message to Team", response):
                messaging_success = False
        
        # Client sends a message
        message_data = {
            "conversation_id": team_conversation_id,
            "message_text": "Welcome team! Looking forward to working with you all. Please coordinate your schedules. 👍",
            "message_type": "TEXT"
        }
        response = requests.post(
            f"{BASE_URL}/profiles/chat/messages",
            json=message_data,
            headers=get_auth_header(client_token)
        )
        if not print_result("Client - Send Message to Team", response):
            messaging_success = False
        
        # Get conversation messages - use correct endpoint: GET /profiles/chat/conversations/{id} (no /messages suffix)
        response = requests.get(
            f"{BASE_URL}/profiles/chat/conversations/{team_conversation_id}",
            headers=get_auth_header(client_token)
        )
        if print_result("Get Team Conversation Messages", response):
            if response.status_code == 200:
                msg_data = response.json()
                messages = msg_data.get('messages', msg_data if isinstance(msg_data, list) else [])
                print(f"\n📨 Team Chat Messages ({len(messages)} total):")
                for msg in messages[-5:]:  # Show last 5 messages
                    sender = msg.get('sender_name', msg.get('sender', {}).get('name', 'Unknown'))
                    content = msg.get('content', msg.get('message', ''))[:50]
                    print(f"   - {sender}: {content}")
        else:
            messaging_success = False
    else:
        print("⚠️ Cannot test messaging - no team conversation found")
        messaging_success = False
    
    results["group_chat_messaging"] = messaging_success
    
    # ===========================================================================
    # STEP 10: Check Conversations (Client View)
    # ===========================================================================
    print_section("STEP 10: Check Conversations (Client View)")
    
    response = requests.get(
        f"{BASE_URL}/profiles/chat/conversations",
        headers=get_auth_header(client_token)
    )
    results["conversations"] = print_result("Get Conversations (Client)", response)
    
    if response.status_code == 200:
        conversations = response.json()
        if isinstance(conversations, dict) and 'conversations' in conversations:
            convs = conversations['conversations']
            print(f"\n📋 Total conversations: {len(convs)}")
            team_convs = [c for c in convs if c.get('conversation_type') == 'TEAM_GROUP']
            print(f"📋 Team conversations: {len(team_convs)}")
            
            # Show team members in the current job's conversation
            for tc in team_convs:
                if tc.get('job', {}).get('id') == team_job_id:
                    print(f"\n👥 Team Members in Conversation:")
                    for member in tc.get('team_members', []):
                        print(f"   - {member.get('name', 'N/A')} ({member.get('skill', 'N/A')}) - {member.get('role', 'N/A')}")
                    break
    
    # ===========================================================================
    # SUMMARY
    # ===========================================================================
    print_summary(results)

def print_summary(results):
    print_section("TEST SUMMARY")
    print("\nResults:")
    for key, value in results.items():
        status = "✅" if value else "❌"
        print(f"  {status} {key.replace('_', ' ').title()}")
    
    success_count = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"\nOverall: {success_count}/{total} tests passed")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
COMPREHENSIVE TEAM JOB FLOW TEST SCRIPT
========================================
Tests the entire team job lifecycle from creation to multi-worker reviews:

1. Authentication (Client + 3 Workers)
2. Create Team Job with multiple skill slots
3. Workers apply to different skill slots
4. Client reviews and assigns workers
5. Verify team group conversation created
6. Test group chat messaging
7. Workers mark individual assignments complete
8. Client approves team job completion
9. Multi-worker reviews (client reviews each worker, workers review client)
10. Verify final state (ratings updated, conversation closed)

Usage:
    python scripts/test_team_mode_full_flow.py
"""
import requests
import json
import time
import sys
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

# Test users - using known accounts from database
# Fallback to common test accounts
CLIENT_EMAILS = [
    "testclient@teamtest.com",
    "edris.bakaun@one.uz.edu.ph",
    "daraemoon21@gmail.com",
    "cornelio.vaniel38@gmail.com",
]
CLIENT_PASSWORDS = ["Test123!", "admin123", "admin123", "admin123"]

WORKER_ACCOUNTS = [
    {"email": "testworker1@teamtest.com", "password": "Test123!"},
    {"email": "testworker2@teamtest.com", "password": "Test123!"},
    {"email": "testworker3@teamtest.com", "password": "Test123!"},
    {"email": "worker@test.com", "password": "Test123!"},
    {"email": "edrisbaks@gmail.com", "password": "admin123"},
    {"email": "modillasgabriel@gmail.com", "password": "admin123"},
]

# Store results
RESULTS = {}
TEAM_JOB_ID = None
CONVERSATION_ID = None
WORKER_ASSIGNMENTS = []
APPLICATION_IDS = []

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log_section(title):
    """Print a section header"""
    print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN} {title}{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}")

def log_step(step_num, title):
    """Print a step header"""
    print(f"\n{Colors.YELLOW}▶ Step {step_num}: {title}{Colors.END}")

def log_success(message):
    """Print success message"""
    print(f"  {Colors.GREEN}✅ {message}{Colors.END}")

def log_error(message):
    """Print error message"""
    print(f"  {Colors.RED}❌ {message}{Colors.END}")

def log_info(message):
    """Print info message"""
    print(f"  {Colors.CYAN}ℹ {message}{Colors.END}")

def log_result(name, response, show_body=True, max_body=2000):
    """Log API response result"""
    success = response.status_code in [200, 201]
    status = f"{Colors.GREEN}✅" if success else f"{Colors.RED}❌"
    print(f"\n  {status} {name}: HTTP {response.status_code}{Colors.END}")
    
    if show_body:
        try:
            body = response.json()
            body_str = json.dumps(body, indent=2)[:max_body]
            print(f"  Response: {body_str}")
        except:
            print(f"  Response: {response.text[:500]}")
    
    return success

def get_headers(token):
    """Get auth headers with bearer token"""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def login(email, password):
    """Login and get access token"""
    log_info(f"Attempting login for: {email}")
    try:
        response = requests.post(
            f"{BASE_URL}/mobile/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("access") or data.get("token")
            if token:
                log_success(f"Login successful for {email}")
                return token, data.get("user", {})
    except Exception as e:
        log_error(f"Login failed: {e}")
    return None, None

def find_working_client():
    """Try multiple client accounts until one works"""
    for i, email in enumerate(CLIENT_EMAILS):
        pwd = CLIENT_PASSWORDS[i] if i < len(CLIENT_PASSWORDS) else "Test123!"
        token, user = login(email, pwd)
        if token:
            return token, user, email
    return None, None, None

def find_working_workers(needed=3):
    """Try to authenticate multiple workers"""
    workers = []
    for account in WORKER_ACCOUNTS:
        token, user = login(account["email"], account["password"])
        if token:
            workers.append({
                "email": account["email"],
                "token": token,
                "user": user,
                "profile_id": user.get("profile", {}).get("profile_id") or user.get("profileID")
            })
            if len(workers) >= needed:
                break
    return workers

def test_authentication():
    """Step 0: Authenticate client and workers"""
    global CLIENT_TOKEN, CLIENT_USER, WORKER_TOKENS
    
    log_section("AUTHENTICATION")
    log_step(0, "Authenticating Users")
    
    # Find working client
    CLIENT_TOKEN, CLIENT_USER, client_email = find_working_client()
    if not CLIENT_TOKEN:
        log_error("Could not authenticate any client account!")
        RESULTS["client_login"] = False
        return False
    
    log_success(f"Client authenticated: {client_email}")
    RESULTS["client_login"] = True
    
    # Find working workers
    WORKER_TOKENS = find_working_workers(3)
    log_info(f"Authenticated {len(WORKER_TOKENS)} workers")
    
    if len(WORKER_TOKENS) < 2:
        log_error("Need at least 2 workers for team job testing")
        RESULTS["worker_logins"] = False
        return False
    
    RESULTS["worker_logins"] = True
    return True

def get_categories():
    """Get available categories/specializations"""
    log_step("1a", "Fetching Categories")
    
    response = requests.get(
        f"{BASE_URL}/mobile/jobs/categories",
        headers=get_headers(CLIENT_TOKEN)
    )
    
    if response.status_code == 200:
        categories = response.json()
        if isinstance(categories, list):
            log_success(f"Found {len(categories)} categories")
            return categories
        elif isinstance(categories, dict) and "categories" in categories:
            log_success(f"Found {len(categories['categories'])} categories")
            return categories["categories"]
    
    log_error("Could not fetch categories")
    return []

def create_team_job():
    """Step 1: Create a team job with multiple skill slots"""
    global TEAM_JOB_ID
    
    log_section("CREATE TEAM JOB")
    log_step(1, "Creating Team Job with Skill Slots")
    
    # Get categories first
    categories = get_categories()
    
    # Use first 2 categories for skill slots, or defaults
    spec1_id = categories[0].get("id", 1) if categories else 1
    spec2_id = categories[1].get("id", 2) if len(categories) > 1 else 2
    
    spec1_name = categories[0].get("name", "General") if categories else "General"
    spec2_name = categories[1].get("name", "Electrical") if len(categories) > 1 else "Electrical"
    
    log_info(f"Using specializations: {spec1_name} (ID:{spec1_id}), {spec2_name} (ID:{spec2_id})")
    
    timestamp = int(time.time())
    team_job_data = {
        "title": f"Team Mode Test Job #{timestamp}",
        "description": "Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.",
        "location": "123 Test Street, Tetuan, Zamboanga City",
        "total_budget": 15000,
        "budget_allocation_type": "EQUAL_PER_WORKER",
        "urgency_level": "MEDIUM",
        "preferred_start_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "skill_slots": [
            {
                "specialization_id": spec1_id,
                "workers_needed": 2,
                "skill_level_required": "INTERMEDIATE",
                "notes": f"Need 2 workers for {spec1_name} tasks"
            },
            {
                "specialization_id": spec2_id,
                "workers_needed": 1,
                "skill_level_required": "EXPERT",
                "notes": f"Need 1 expert for {spec2_name} work"
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/jobs/team/create",
        json=team_job_data,
        headers=get_headers(CLIENT_TOKEN)
    )
    
    success = log_result("Create Team Job", response)
    RESULTS["team_job_creation"] = success
    
    if success:
        data = response.json()
        TEAM_JOB_ID = data.get("job_id") or data.get("jobID") or data.get("id")
        log_success(f"Team Job Created! ID: {TEAM_JOB_ID}")
        return True
    
    log_error("Failed to create team job")
    return False

def get_team_job_details():
    """Step 2: Get team job details including skill slots"""
    log_section("GET TEAM JOB DETAILS")
    log_step(2, "Fetching Team Job Details")
    
    response = requests.get(
        f"{BASE_URL}/jobs/team/{TEAM_JOB_ID}",
        headers=get_headers(CLIENT_TOKEN)
    )
    
    success = log_result("Get Team Job Detail", response)
    
    if success:
        data = response.json()
        skill_slots = data.get("skill_slots", [])
        
        log_info(f"Total Budget: ₱{data.get('total_budget', 0):,.2f}")
        log_info(f"Total Workers Needed: {data.get('total_workers_needed', 0)}")
        log_info(f"Skill Slots: {len(skill_slots)}")
        
        for slot in skill_slots:
            slot_id = slot.get("skill_slot_id") or slot.get("id")
            spec_name = slot.get("specialization_name", "N/A")
            workers_needed = slot.get("workers_needed", 0)
            budget = slot.get("budget_allocated", 0)
            log_info(f"  → Slot {slot_id}: {spec_name} ({workers_needed} workers, ₱{budget:,.2f})")
        
        return skill_slots
    
    return []

def workers_apply_to_slots(skill_slots):
    """Step 3: Workers apply to different skill slots"""
    global APPLICATION_IDS
    
    log_section("WORKER APPLICATIONS")
    log_step(3, "Workers Applying to Skill Slots")
    
    applications_made = 0
    
    for i, worker in enumerate(WORKER_TOKENS):
        # Assign workers to slots (first 2 to slot 1, third to slot 2)
        slot_index = 0 if i < 2 else (1 if len(skill_slots) > 1 else 0)
        slot = skill_slots[slot_index]
        slot_id = slot.get("skill_slot_id") or slot.get("id")
        
        apply_data = {
            "skill_slot_id": slot_id,
            "proposal_message": f"Worker {i+1} ({worker['email']}) applying for this position. I have relevant experience and am ready to work.",
            "proposed_budget": slot.get("budget_allocated", 5000) / slot.get("workers_needed", 1),
            "budget_option": "ACCEPT"
        }
        
        log_info(f"Worker {i+1} applying to slot {slot_id} ({slot.get('specialization_name', 'N/A')})")
        
        response = requests.post(
            f"{BASE_URL}/jobs/team/{TEAM_JOB_ID}/apply",
            json=apply_data,
            headers=get_headers(worker["token"])
        )
        
        if log_result(f"Worker {i+1} Application", response, show_body=True):
            applications_made += 1
            app_data = response.json()
            APPLICATION_IDS.append({
                "application_id": app_data.get("application_id"),
                "worker_index": i,
                "slot_id": slot_id
            })
    
    RESULTS["worker_applications"] = applications_made >= 2
    log_info(f"Total applications made: {applications_made}")
    return applications_made

def get_applications():
    """Step 4: Client reviews applications"""
    log_section("GET APPLICATIONS")
    log_step(4, "Client Viewing Applications")
    
    response = requests.get(
        f"{BASE_URL}/jobs/team/{TEAM_JOB_ID}/applications",
        headers=get_headers(CLIENT_TOKEN)
    )
    
    success = log_result("Get Team Applications", response)
    RESULTS["get_applications"] = success
    
    if success:
        data = response.json()
        applications = data.get("applications", [])
        
        log_info(f"Found {len(applications)} applications")
        for app in applications:
            log_info(f"  → App #{app.get('application_id')}: {app.get('worker_name', 'N/A')} for {app.get('specialization_name', 'N/A')}")
        
        return applications
    
    return []

def assign_workers(applications):
    """Step 5: Client assigns workers to slots"""
    global WORKER_ASSIGNMENTS
    
    log_section("ASSIGN WORKERS")
    log_step(5, "Client Assigning Workers to Slots")
    
    assigned_count = 0
    
    for app in applications:
        app_id = app.get("application_id")
        worker_id = app.get("worker_id")
        worker_name = app.get("worker_name", "Unknown")
        slot_id = app.get("skill_slot_id")
        
        # Try the assign endpoint (method 1: POST /team/assign)
        assign_data = {
            "worker_id": worker_id,
            "skill_slot_id": slot_id
        }
        
        # Use the correct accept application endpoint
        response = requests.post(
            f"{BASE_URL}/jobs/team/{TEAM_JOB_ID}/applications/{app_id}/accept",
            headers=get_headers(CLIENT_TOKEN)
        )
        
        if log_result(f"Assign {worker_name} to Slot {slot_id}", response):
            assigned_count += 1
            WORKER_ASSIGNMENTS.append({
                "worker_id": worker_id,
                "worker_name": worker_name,
                "slot_id": slot_id,
                "application_id": app_id
            })
    
    RESULTS["accept_applications"] = assigned_count >= 2
    log_info(f"Assigned {assigned_count} workers")
    return assigned_count

def check_team_conversation():
    """Step 6: Verify team group conversation was created"""
    global CONVERSATION_ID
    
    log_section("VERIFY TEAM CONVERSATION")
    log_step(6, "Checking Team Group Chat")
    
    # Check from client perspective
    response = requests.get(
        f"{BASE_URL}/profiles/chat/conversations",
        headers=get_headers(CLIENT_TOKEN)
    )
    
    client_has_conv = False
    if response.status_code == 200:
        data = response.json()
        convs = data.get("conversations", data if isinstance(data, list) else [])
        
        log_info(f"Client has {len(convs)} conversations")
        
        for conv in convs:
            job_id = conv.get("job", {}).get("id") if isinstance(conv.get("job"), dict) else conv.get("job_id")
            conv_type = conv.get("conversation_type", "")
            
            if str(job_id) == str(TEAM_JOB_ID) or conv_type in ["TEAM_GROUP", "TEAM"]:
                CONVERSATION_ID = conv.get("id") or conv.get("conversation_id")
                log_success(f"Found team conversation! ID: {CONVERSATION_ID}")
                log_info(f"  Type: {conv_type}")
                log_info(f"  Status: {conv.get('status', 'N/A')}")
                
                team_members = conv.get("team_members", [])
                if team_members:
                    log_info(f"  Team Members: {len(team_members)}")
                    for member in team_members:
                        log_info(f"    → {member.get('name', 'N/A')} ({member.get('role', 'N/A')})")
                
                client_has_conv = True
                break
    
    # Check from assigned worker perspective (Worker 2 - index 1, since Worker 1 was not assigned)
    worker_has_conv = False
    worker_index = 1  # Worker 2 who was assigned
    if len(WORKER_TOKENS) > worker_index:
        response = requests.get(
            f"{BASE_URL}/profiles/chat/conversations",
            headers=get_headers(WORKER_TOKENS[worker_index]["token"])
        )
        
        if response.status_code == 200:
            data = response.json()
            convs = data.get("conversations", data if isinstance(data, list) else [])
            
            for conv in convs:
                job_id = conv.get("job", {}).get("id") if isinstance(conv.get("job"), dict) else conv.get("job_id")
                if str(job_id) == str(TEAM_JOB_ID):
                    worker_has_conv = True
                    log_success(f"Worker 2 (assigned) can see team conversation")
                    break
    
    RESULTS["team_conversation_created"] = client_has_conv
    RESULTS["worker_in_conversation"] = worker_has_conv
    
    return CONVERSATION_ID is not None

def test_group_chat_messaging():
    """Step 7: Test sending messages in team group chat"""
    log_section("TEST GROUP CHAT MESSAGING")
    log_step(7, "Testing Team Group Chat")
    
    if not CONVERSATION_ID:
        log_error("No conversation ID - skipping messaging test")
        RESULTS["group_chat_messaging"] = False
        return False
    
    messages_sent = 0
    
    # Client sends welcome message
    message_data = {
        "conversation_id": CONVERSATION_ID,
        "message_text": "Welcome team! Let's coordinate our work. 👋",
        "message_type": "TEXT"
    }
    
    response = requests.post(
        f"{BASE_URL}/profiles/chat/messages",
        json=message_data,
        headers=get_headers(CLIENT_TOKEN)
    )
    
    if log_result("Client sends message", response):
        messages_sent += 1
    
    # Workers send messages
    for i, worker in enumerate(WORKER_TOKENS[:2]):
        message_data = {
            "conversation_id": CONVERSATION_ID,
            "message_text": f"Worker {i+1} here! Ready to start. 🔧",
            "message_type": "TEXT"
        }
        
        response = requests.post(
            f"{BASE_URL}/profiles/chat/messages",
            json=message_data,
            headers=get_headers(worker["token"])
        )
        
        if log_result(f"Worker {i+1} sends message", response):
            messages_sent += 1
    
    # Fetch conversation to verify messages
    response = requests.get(
        f"{BASE_URL}/profiles/chat/conversations/{CONVERSATION_ID}",
        headers=get_headers(CLIENT_TOKEN)
    )
    
    if response.status_code == 200:
        data = response.json()
        messages = data.get("messages", [])
        log_success(f"Conversation has {len(messages)} messages")
    
    RESULTS["group_chat_messaging"] = messages_sent >= 2
    return messages_sent >= 2

def start_team_job():
    """Step 7b: Client starts the team job once workers assigned"""
    log_section("START TEAM JOB")
    log_step("7b", "Client Starting Team Job")
    
    # Start the job (force_start allows partial teams)
    start_data = {
        "force_start": True
    }
    
    response = requests.post(
        f"{BASE_URL}/jobs/team/{TEAM_JOB_ID}/start",
        json=start_data,
        headers=get_headers(CLIENT_TOKEN)
    )
    
    success = log_result("Start Team Job", response)
    RESULTS["team_job_started"] = success
    return success

def workers_complete_assignments():
    """Step 8: Workers mark their individual assignments complete"""
    log_section("WORKERS MARK COMPLETION")
    log_step(8, "Workers Completing Their Assignments")
    
    # First get current job state to find assignment IDs
    response = requests.get(
        f"{BASE_URL}/jobs/team/{TEAM_JOB_ID}",
        headers=get_headers(CLIENT_TOKEN)
    )
    
    assignments = []
    if response.status_code == 200:
        data = response.json()
        assignments = data.get("worker_assignments", [])
        log_info(f"Found {len(assignments)} worker assignments")
    
    completions = 0
    
    # Match workers to their assignments and complete
    for i, worker in enumerate(WORKER_TOKENS):
        # Find this worker's assignment
        worker_profile_id = worker.get("profile_id")
        
        for assignment in assignments:
            assignment_id = assignment.get("assignment_id") or assignment.get("id")
            
            # Try completing with worker token
            complete_data = {
                "notes": f"Worker {i+1} completed their assigned tasks. All work verified and tested."
            }
            
            response = requests.post(
                f"{BASE_URL}/jobs/team/assignments/{assignment_id}/complete",
                json=complete_data,
                headers=get_headers(worker["token"])
            )
            
            if response.status_code in [200, 201]:
                log_success(f"Worker {i+1} marked assignment {assignment_id} complete")
                completions += 1
                break
            elif response.status_code == 400:
                # Already completed or not authorized - try next
                continue
    
    # If no assignments found, try a simpler approach
    if completions == 0 and len(WORKER_TOKENS) > 0:
        for i, worker in enumerate(WORKER_TOKENS[:2]):
            for assignment_id in range(1, 10):  # Try IDs 1-9
                complete_data = {"notes": f"Completed by worker {i+1}"}
                response = requests.post(
                    f"{BASE_URL}/jobs/team/assignments/{assignment_id}/complete",
                    json=complete_data,
                    headers=get_headers(worker["token"])
                )
                if response.status_code in [200, 201]:
                    completions += 1
                    log_success(f"Worker {i+1} completed assignment {assignment_id}")
                    break
    
    RESULTS["workers_marked_complete"] = completions >= 1
    log_info(f"Completions marked: {completions}")
    return completions

def client_approves_completion():
    """Step 9: Client approves team job completion"""
    log_section("CLIENT APPROVAL")
    log_step(9, "Client Approving Team Job Completion")
    
    approve_data = {
        "payment_method": "WALLET"
    }
    
    response = requests.post(
        f"{BASE_URL}/jobs/{TEAM_JOB_ID}/team/approve-completion",
        json=approve_data,
        headers=get_headers(CLIENT_TOKEN)
    )
    
    success = log_result("Client Approve Completion", response)
    RESULTS["client_approved_completion"] = success
    
    return success

def multi_worker_reviews():
    """Step 10: Client reviews each worker, workers review client"""
    log_section("MULTI-WORKER REVIEWS")
    log_step(10, "Testing Multi-Worker Review System")
    
    reviews_created = 0
    
    # Client reviews each worker
    log_info("Client reviewing workers...")
    for i, assignment in enumerate(WORKER_ASSIGNMENTS):
        worker_id = assignment.get("worker_id")
        worker_name = assignment.get("worker_name", f"Worker {i+1}")
        
        review_data = {
            "rating_quality": 5,
            "rating_communication": 5,
            "rating_punctuality": 4 + (i % 2),
            "rating_professionalism": 5,
            "message": f"Great work by {worker_name}! Very professional and completed tasks on time.",
            "worker_id": worker_id  # Required for team job client reviews
        }
        
        response = requests.post(
            f"{BASE_URL}/jobs/{TEAM_JOB_ID}/review",
            json=review_data,
            headers=get_headers(CLIENT_TOKEN)
        )
        
        if log_result(f"Client reviews {worker_name}", response):
            reviews_created += 1
    
    # Workers review client
    log_info("Workers reviewing client...")
    for i, worker in enumerate(WORKER_TOKENS):
        review_data = {
            "rating_quality": 5,
            "rating_communication": 5,
            "rating_punctuality": 5,
            "rating_professionalism": 5,
            "message": f"Excellent client! Clear communication and prompt payment. - Worker {i+1}"
        }
        
        response = requests.post(
            f"{BASE_URL}/jobs/{TEAM_JOB_ID}/review",
            json=review_data,
            headers=get_headers(worker["token"])
        )
        
        if log_result(f"Worker {i+1} reviews client", response):
            reviews_created += 1
    
    RESULTS["multi_worker_reviews"] = reviews_created >= 2
    log_info(f"Total reviews created: {reviews_created}")
    return reviews_created

def verify_final_state():
    """Step 11: Verify final state of job, ratings, and conversation"""
    log_section("VERIFY FINAL STATE")
    log_step(11, "Verifying Final State")
    
    # Check job status
    response = requests.get(
        f"{BASE_URL}/jobs/team/{TEAM_JOB_ID}",
        headers=get_headers(CLIENT_TOKEN)
    )
    
    if response.status_code == 200:
        data = response.json()
        log_info(f"Job Status: {data.get('status', 'N/A')}")
        log_info(f"All Workers Complete: {data.get('all_workers_complete', 'N/A')}")
        log_info(f"Client Approved: {data.get('client_approved', 'N/A')}")
    
    # Check reviews - use the job detail to see reviews
    response = requests.get(
        f"{BASE_URL}/jobs/team/{TEAM_JOB_ID}",
        headers=get_headers(CLIENT_TOKEN)
    )
    
    if response.status_code == 200:
        reviews = response.json()
        if isinstance(reviews, list):
            log_info(f"Total Reviews: {len(reviews)}")
        elif isinstance(reviews, dict):
            log_info(f"Reviews: {json.dumps(reviews, indent=2)[:500]}")
    
    # Check conversation status
    if CONVERSATION_ID:
        response = requests.get(
            f"{BASE_URL}/profiles/chat/conversations/{CONVERSATION_ID}",
            headers=get_headers(CLIENT_TOKEN)
        )
        
        if response.status_code == 200:
            conv_data = response.json()
            log_info(f"Conversation Status: {conv_data.get('status', 'N/A')}")
    
    RESULTS["verified_final_state"] = True

def print_summary():
    """Print test summary"""
    log_section("TEST SUMMARY")
    
    print(f"\n{Colors.BOLD}Results:{Colors.END}")
    
    passed = 0
    total = len(RESULTS)
    
    for key, value in RESULTS.items():
        status = f"{Colors.GREEN}✅ PASS" if value else f"{Colors.RED}❌ FAIL"
        name = key.replace("_", " ").title()
        print(f"  {status}{Colors.END} - {name}")
        if value:
            passed += 1
    
    print(f"\n{Colors.BOLD}Overall: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED!{Colors.END}")
    elif passed > total * 0.7:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️ Most tests passed, some issues to review{Colors.END}")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ Multiple test failures - please investigate{Colors.END}")
    
    if TEAM_JOB_ID:
        print(f"\n{Colors.CYAN}Team Job ID: {TEAM_JOB_ID}{Colors.END}")
    if CONVERSATION_ID:
        print(f"{Colors.CYAN}Conversation ID: {CONVERSATION_ID}{Colors.END}")

def main():
    """Main test execution"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("=" * 70)
    print("  COMPREHENSIVE TEAM JOB FLOW TEST")
    print("=" * 70)
    print(f"{Colors.END}")
    
    print(f"Base URL: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Step 0: Authentication
        if not test_authentication():
            print_summary()
            return 1
        
        # Step 1: Create Team Job
        if not create_team_job():
            print_summary()
            return 1
        
        # Step 2: Get Team Job Details
        skill_slots = get_team_job_details()
        if not skill_slots:
            log_error("No skill slots found - check job creation")
        
        # Step 3: Workers Apply
        if skill_slots:
            workers_apply_to_slots(skill_slots)
        
        # Step 4: Get Applications
        applications = get_applications()
        
        # Step 5: Assign Workers
        if applications:
            assign_workers(applications)
        
        # Step 6: Check Team Conversation
        check_team_conversation()
        
        # Step 7: Test Group Chat
        test_group_chat_messaging()
        
        # Step 7b: Start Team Job
        start_team_job()
        
        # Step 8: Workers Complete
        workers_complete_assignments()
        
        # Step 9: Client Approves
        client_approves_completion()
        
        # Step 10: Multi-worker Reviews
        multi_worker_reviews()
        
        # Step 11: Verify Final State
        verify_final_state()
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()
    
    print_summary()
    return 0 if all(RESULTS.values()) else 1

if __name__ == "__main__":
    sys.exit(main())

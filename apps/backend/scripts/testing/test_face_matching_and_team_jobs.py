"""
Test Script for Face Matching KYC and Team Job APIs
Tests the new implementations:
1. Face Matching in KYC Upload (document_verification_service.py)
2. Team Job Multi-Skill Multi-Worker endpoints

Run: python scripts/test_face_matching_and_team_jobs.py
"""
import requests
import json
import time
import os
from pathlib import Path

BASE_URL = "http://localhost:8000/api"

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123456"

# Alternative test users
CLIENT_EMAIL = "testclient_team@test.com"
WORKER_EMAIL = "testworker1_team@test.com"
WORKER_PASSWORD = "test123456"

def print_section(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

def print_result(name, response, show_body=True):
    status = "✅" if response.status_code in [200, 201] else "❌"
    print(f"\n{status} {name}: HTTP {response.status_code}")
    if show_body:
        try:
            body = response.json()
            print(json.dumps(body, indent=2)[:2000])
        except:
            print(response.text[:500] if response.text else "(empty response)")
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
        print(f"  ❌ Login response OK but no token found: {list(data.keys())}")
    print(f"  ❌ Login failed: {response.status_code} - {response.text[:200]}")
    return None

def get_auth_header(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# =============================================================================
# PART 1: FACE MATCHING KYC TESTS
# =============================================================================

def test_face_matching_service_endpoint(token):
    """Test if the document verification service with face matching is accessible"""
    print_section("FACE MATCHING / KYC ENDPOINTS")
    
    results = {}
    headers = get_auth_header(token)
    
    # Test 1: Check KYC Status endpoint
    print("\n📋 Test 1: KYC Status Endpoint")
    response = requests.get(f"{BASE_URL}/accounts/kyc-status", headers=headers)
    results["kyc_status"] = print_result("GET /accounts/kyc-status", response)
    
    # Test 2: Check KYC History endpoint
    print("\n📋 Test 2: KYC History Endpoint")
    response = requests.get(f"{BASE_URL}/accounts/kyc/history", headers=headers)
    results["kyc_history"] = print_result("GET /accounts/kyc/history", response)
    
    # Test 3: Check if upload endpoint is accessible (without actual upload)
    print("\n📋 Test 3: KYC Upload Endpoint (OPTIONS/availability check)")
    try:
        response = requests.options(f"{BASE_URL}/accounts/upload/kyc", headers=headers)
        results["kyc_upload_available"] = response.status_code in [200, 204, 405]
        print(f"  {'✅' if results['kyc_upload_available'] else '❌'} Upload endpoint reachable: HTTP {response.status_code}")
    except Exception as e:
        results["kyc_upload_available"] = False
        print(f"  ❌ Upload endpoint error: {e}")
    
    # Test 4: Check CompreFace service availability
    print("\n📋 Test 4: CompreFace Service Check")
    try:
        # CompreFace runs on port 8100
        compreface_response = requests.get("http://localhost:8100/api/v1/recognition/status", timeout=5)
        results["compreface_available"] = compreface_response.status_code in [200, 404]
        print(f"  {'✅' if results['compreface_available'] else '⚠️'} CompreFace service: HTTP {compreface_response.status_code}")
    except requests.exceptions.ConnectionError:
        results["compreface_available"] = False
        print("  ⚠️ CompreFace service not running (port 8100) - Face matching will be skipped")
    except Exception as e:
        results["compreface_available"] = False
        print(f"  ⚠️ CompreFace check error: {e}")
    
    # Test 5: Admin KYC endpoints (if admin)
    # Correct endpoints based on adminpanel/api.py:
    # GET /adminpanel/kyc/all
    # POST /adminpanel/kyc/approve
    # POST /adminpanel/kyc/reject
    # GET /adminpanel/kyc/logs
    print("\n📋 Test 5: Admin KYC Endpoints")
    response = requests.get(f"{BASE_URL}/adminpanel/kyc/all", headers=headers)
    results["admin_kyc_all"] = print_result("GET /adminpanel/kyc/all", response)
    
    response = requests.get(f"{BASE_URL}/adminpanel/kyc/logs", headers=headers)
    results["admin_kyc_logs"] = print_result("GET /adminpanel/kyc/logs", response)
    
    return results

# =============================================================================
# PART 2: TEAM JOB ENDPOINTS TESTS
# =============================================================================

def test_team_job_endpoints(token):
    """Test all team job related endpoints"""
    print_section("TEAM JOB ENDPOINTS")
    
    results = {}
    headers = get_auth_header(token)
    
    # Correct endpoints based on jobs/api.py:
    # POST /jobs/team/create
    # GET /jobs/team/{job_id}
    # POST /jobs/team/{job_id}/apply
    # POST /jobs/team/{job_id}/applications/{application_id}/accept
    # POST /jobs/team/{job_id}/applications/{application_id}/reject
    # POST /jobs/team/{job_id}/start
    # POST /jobs/team/assignments/{assignment_id}/complete
    # GET /jobs/team/{job_id}/applications
    # POST /jobs/{job_id}/team/approve-completion
    # POST /jobs/{job_id}/team/worker-complete/{assignment_id}
    
    # Test 1: Team Job Creation endpoint check
    print("\n📋 Test 1: Team Job Creation Endpoint")
    test_team_job_payload = {
        "title": "TEST - Team Job API Check",
        "description": "This is a test to verify the team job creation endpoint is working. Need multiple skilled workers for this project.",
        "total_budget": 5000,
        "budget_allocation_type": "EQUAL_PER_WORKER",
        "location": "Test Location, Zamboanga City",
        "skill_slots": [
            {
                "specialization_id": 1,
                "workers_needed": 2,
                "skill_level": "INTERMEDIATE"
            }
        ]
    }
    response = requests.post(
        f"{BASE_URL}/jobs/team/create",  # Correct: /jobs/team/create
        headers=headers,
        json=test_team_job_payload
    )
    results["team_job_create"] = print_result("POST /jobs/team/create", response)
    
    # Extract job ID if created successfully
    team_job_id = None
    if response.status_code in [200, 201]:
        try:
            data = response.json()
            team_job_id = data.get("job_id") or data.get("id")
            print(f"  📌 Created team job ID: {team_job_id}")
        except:
            pass
    
    # Test 2: Get Team Job Details
    print("\n📋 Test 2: Team Job Details Endpoint")
    if team_job_id:
        response = requests.get(f"{BASE_URL}/jobs/team/{team_job_id}", headers=headers)
        results["team_job_details"] = print_result(f"GET /jobs/team/{team_job_id}", response)
    else:
        # Try with a generic ID to check endpoint existence
        response = requests.get(f"{BASE_URL}/jobs/team/1", headers=headers)
        results["team_job_details"] = print_result("GET /jobs/team/1 (test)", response)
    
    # Test 3: Team Job Applications endpoint
    print("\n📋 Test 3: Team Job Applications Endpoint")
    test_job_id = team_job_id or 1
    response = requests.get(f"{BASE_URL}/jobs/team/{test_job_id}/applications", headers=headers)
    results["team_applications"] = print_result(f"GET /jobs/team/{test_job_id}/applications", response)
    
    # Test 4: Team Job Apply endpoint (structure check)
    print("\n📋 Test 4: Team Job Apply Endpoint")
    apply_payload = {
        "skill_slot_id": 1,
        "cover_letter": "Test application for team job"
    }
    response = requests.post(
        f"{BASE_URL}/jobs/team/{test_job_id}/apply",  # Correct: /jobs/team/{job_id}/apply
        headers=headers,
        json=apply_payload
    )
    results["team_apply"] = print_result(f"POST /jobs/team/{test_job_id}/apply", response)
    
    # Test 5: Team Job Start endpoint (start with available workers)
    print("\n📋 Test 5: Team Job Start Endpoint")
    response = requests.post(
        f"{BASE_URL}/jobs/team/{test_job_id}/start",  # Correct: /jobs/team/{job_id}/start
        headers=headers
    )
    results["team_start"] = print_result(f"POST /jobs/team/{test_job_id}/start", response)
    
    # Test 6: Worker Complete Assignment endpoint (via assignments)
    print("\n📋 Test 6: Worker Complete Assignment Endpoint")
    response = requests.post(
        f"{BASE_URL}/jobs/team/assignments/1/complete",  # Correct: /jobs/team/assignments/{assignment_id}/complete
        headers=headers,
        json={"completion_notes": "Test completion"}
    )
    results["team_assignment_complete"] = print_result("POST /jobs/team/assignments/1/complete", response)
    
    # Test 7: Worker Complete (alternative endpoint)
    print("\n📋 Test 7: Worker Complete Alternative Endpoint")
    response = requests.post(
        f"{BASE_URL}/jobs/{test_job_id}/team/worker-complete/1",
        headers=headers,
        json={"completion_notes": "Test completion"}
    )
    results["team_worker_complete"] = print_result(f"POST /jobs/{test_job_id}/team/worker-complete/1", response)
    
    # Test 8: Client Approve Team Job endpoint
    print("\n📋 Test 8: Client Approve Team Job Endpoint")
    response = requests.post(
        f"{BASE_URL}/jobs/{test_job_id}/team/approve-completion",
        headers=headers
    )
    results["team_approve"] = print_result(f"POST /jobs/{test_job_id}/team/approve-completion", response)
    
    # Test 9: Accept Application endpoint
    print("\n📋 Test 9: Accept Application Endpoint")
    response = requests.post(
        f"{BASE_URL}/jobs/team/{test_job_id}/applications/1/accept",
        headers=headers
    )
    results["team_accept_application"] = print_result(f"POST /jobs/team/{test_job_id}/applications/1/accept", response)
    
    # Test 10: Reject Application endpoint
    print("\n📋 Test 10: Reject Application Endpoint")
    response = requests.post(
        f"{BASE_URL}/jobs/team/{test_job_id}/applications/1/reject",
        headers=headers,
        json={"reason": "Test rejection"}
    )
    results["team_reject_application"] = print_result(f"POST /jobs/team/{test_job_id}/applications/1/reject", response)
    
    # Cleanup: Delete test job if created
    if team_job_id:
        print(f"\n🧹 Cleaning up test job {team_job_id}...")
        # Note: May need admin endpoint or direct DB cleanup
    
    return results

# =============================================================================
# PART 3: GENERAL API HEALTH CHECK
# =============================================================================

def test_api_health():
    """Test general API health"""
    print_section("API HEALTH CHECK")
    
    results = {}
    
    # Test 1: Backend health
    print("\n📋 Test 1: Backend Health")
    try:
        response = requests.get(f"{BASE_URL.replace('/api', '')}/health", timeout=5)
        results["backend_health"] = response.status_code == 200
        print(f"  {'✅' if results['backend_health'] else '❌'} Backend: HTTP {response.status_code}")
    except:
        # Try alternative health check
        try:
            response = requests.get(f"{BASE_URL}/mobile/specializations", timeout=5)
            results["backend_health"] = response.status_code == 200
            print(f"  {'✅' if results['backend_health'] else '❌'} Backend (via specializations): HTTP {response.status_code}")
        except Exception as e:
            results["backend_health"] = False
            print(f"  ❌ Backend unreachable: {e}")
    
    # Test 2: Database connectivity (via categories)
    print("\n📋 Test 2: Database Connectivity")
    try:
        response = requests.get(f"{BASE_URL}/mobile/categories", timeout=5)
        results["database"] = response.status_code == 200
        print(f"  {'✅' if results['database'] else '❌'} Database (via categories): HTTP {response.status_code}")
    except Exception as e:
        results["database"] = False
        print(f"  ❌ Database check failed: {e}")
    
    return results

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    print("\n" + "=" * 70)
    print(" FACE MATCHING & TEAM JOB API TESTS")
    print(f" Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" Base URL: {BASE_URL}")
    print("=" * 70)
    
    all_results = {}
    
    # Step 0: Health check
    all_results["health"] = test_api_health()
    
    # Step 1: Login
    print_section("AUTHENTICATION")
    token = login(TEST_EMAIL, TEST_PASSWORD)
    
    if not token:
        print("\n⚠️ Primary login failed, trying alternative credentials...")
        token = login(CLIENT_EMAIL, WORKER_PASSWORD)
    
    if not token:
        print("\n❌ All logins failed! Cannot proceed with authenticated tests.")
        print("   Please ensure test users exist in the database.")
        print("   Run: python scripts/create_test_users.py")
        return
    
    all_results["auth"] = {"login": True}
    
    # Step 2: Test Face Matching KYC endpoints
    all_results["face_matching"] = test_face_matching_service_endpoint(token)
    
    # Step 3: Test Team Job endpoints
    all_results["team_jobs"] = test_team_job_endpoints(token)
    
    # Summary
    print_section("TEST SUMMARY")
    
    total_tests = 0
    passed_tests = 0
    
    for category, results in all_results.items():
        print(f"\n📂 {category.upper()}:")
        for test_name, passed in results.items():
            total_tests += 1
            if passed:
                passed_tests += 1
            status = "✅" if passed else "❌"
            print(f"   {status} {test_name}")
    
    print(f"\n{'='*70}")
    print(f" TOTAL: {passed_tests}/{total_tests} tests passed ({100*passed_tests//total_tests if total_tests else 0}%)")
    print(f"{'='*70}")
    
    # Return success/failure
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

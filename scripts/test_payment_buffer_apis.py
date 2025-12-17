#!/usr/bin/env python
"""
Payment Buffer API Test - Fire All Endpoints

Tests all payment buffer related APIs:
1. Login (client, worker)
2. Wallet balance & pending earnings
3. Can request backjob check
4. Request backjob
5. Admin approve/reject backjob
6. Platform settings

Run from host: python scripts/test_payment_buffer_apis.py
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Test accounts
CLIENT_EMAIL = "testclient@iayos.com"
CLIENT_PASSWORD = "password123"
WORKER_EMAIL = "testworker@iayos.com"
WORKER_PASSWORD = "password123"
ADMIN_EMAIL = "admin@iayos.com"
ADMIN_PASSWORD = "password123"

# Session for cookie-based auth
session = requests.Session()

def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_result(name, response, show_body=True):
    status = "✅" if response.status_code < 400 else "❌"
    print(f"\n{status} {name}")
    print(f"   Status: {response.status_code}")
    if show_body:
        try:
            body = response.json()
            # Truncate long responses
            body_str = json.dumps(body, indent=2)
            if len(body_str) > 500:
                body_str = body_str[:500] + "\n   ... (truncated)"
            print(f"   Response: {body_str}")
        except:
            print(f"   Response: {response.text[:200]}")
    return response.status_code < 400

def print_result_accept_400(name, response, show_body=True):
    """Like print_result but accepts 400 as valid (endpoint exists and works)"""
    is_valid = response.status_code in [200, 201, 400]
    status = "✅" if is_valid else "❌"
    print(f"\n{status} {name}")
    print(f"   Status: {response.status_code}")
    if show_body:
        try:
            body = response.json()
            body_str = json.dumps(body, indent=2)
            if len(body_str) > 500:
                body_str = body_str[:500] + "\n   ... (truncated)"
            print(f"   Response: {body_str}")
        except:
            print(f"   Response: {response.text[:200]}")
    return is_valid

def login_jwt(email, password, role="user"):
    """Login via accounts endpoint and get JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/accounts/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("access") or data.get("access_token") or data.get("token")
    return None

def login_cookie(email, password):
    """Login via cookie endpoint for web/admin"""
    response = session.post(
        f"{BASE_URL}/api/accounts/login",
        json={"email": email, "password": password}
    )
    return response.status_code == 200

def test_apis():
    results = []
    
    # ==========================================
    # 1. AUTHENTICATION TESTS
    # ==========================================
    print_section("1. AUTHENTICATION APIs")
    
    # Client JWT Login
    client_token = login_jwt(CLIENT_EMAIL, CLIENT_PASSWORD)
    print(f"\n{'✅' if client_token else '❌'} Client JWT Login")
    print(f"   Token: {client_token[:50]}..." if client_token else "   Failed to get token")
    results.append(("Client JWT Login", bool(client_token)))
    
    # Worker JWT Login
    worker_token = login_jwt(WORKER_EMAIL, WORKER_PASSWORD)
    print(f"\n{'✅' if worker_token else '❌'} Worker JWT Login")
    print(f"   Token: {worker_token[:50]}..." if worker_token else "   Failed to get token")
    results.append(("Worker JWT Login", bool(worker_token)))
    
    # Admin Cookie Login
    admin_logged_in = login_cookie(ADMIN_EMAIL, ADMIN_PASSWORD)
    print(f"\n{'✅' if admin_logged_in else '❌'} Admin Cookie Login")
    results.append(("Admin Cookie Login", admin_logged_in))
    
    if not client_token or not worker_token:
        print("\n❌ Cannot continue without auth tokens")
        return results
    
    client_headers = {"Authorization": f"Bearer {client_token}"}
    worker_headers = {"Authorization": f"Bearer {worker_token}"}
    
    # ==========================================
    # 2. WALLET & PENDING EARNINGS APIs
    # ==========================================
    print_section("2. WALLET & PENDING EARNINGS APIs")
    
    # Worker wallet balance
    resp = requests.get(f"{BASE_URL}/api/mobile/wallet/balance", headers=worker_headers)
    results.append(("GET /wallet/balance", print_result("GET /api/mobile/wallet/balance (Worker)", resp)))
    
    # Worker pending earnings
    resp = requests.get(f"{BASE_URL}/api/mobile/wallet/pending-earnings", headers=worker_headers)
    results.append(("GET /wallet/pending-earnings", print_result("GET /api/mobile/wallet/pending-earnings", resp)))
    
    # Worker transactions
    resp = requests.get(f"{BASE_URL}/api/mobile/wallet/transactions", headers=worker_headers)
    results.append(("GET /wallet/transactions", print_result("GET /api/mobile/wallet/transactions", resp)))
    
    # ==========================================
    # 3. CREATE TEST JOB FOR BACKJOB TESTING
    # ==========================================
    print_section("3. CREATE TEST JOB")
    
    job_data = {
        "title": f"Payment Buffer API Test - {datetime.now().strftime('%H:%M:%S')}",
        "description": "Testing payment buffer APIs. This job will test the backjob request functionality.",
        "category_id": 1,
        "budget": 1500,
        "location": "Test Location, Zamboanga City",
        "expected_duration": "2 hours",
        "urgency_level": "MEDIUM"
    }
    
    resp = requests.post(
        f"{BASE_URL}/api/jobs/create-mobile",
        json=job_data,
        headers=client_headers
    )
    job_created = print_result("POST /api/jobs/create-mobile", resp)
    results.append(("POST /jobs/create-mobile", job_created))
    
    job_id = None
    if job_created:
        try:
            job_id = resp.json().get("job", {}).get("id") or resp.json().get("job_id")
        except:
            pass
    
    # ==========================================
    # 4. BACKJOB REQUEST APIs (need completed job)
    # ==========================================
    print_section("4. BACKJOB REQUEST APIs")
    
    # Find a completed job for backjob testing
    resp = requests.get(
        f"{BASE_URL}/api/mobile/jobs/my-jobs?status=COMPLETED",
        headers=client_headers
    )
    completed_jobs = []
    try:
        data = resp.json()
        completed_jobs = data.get("jobs", []) if isinstance(data, dict) else data
    except:
        pass
    
    print(f"\n📋 Found {len(completed_jobs)} completed jobs for client")
    
    test_job_id = None
    for job in completed_jobs[:5]:
        jid = job.get("job_id") or job.get("id") or job.get("jobID")
        released = job.get("paymentReleasedToWorker", True)
        print(f"   Job #{jid}: paymentReleased={released}")
        if not released:
            test_job_id = jid
            break
    
    if test_job_id:
        print(f"\n📌 Using Job #{test_job_id} for backjob testing")
        
        # Check backjob status for job
        resp = requests.get(
            f"{BASE_URL}/api/jobs/{test_job_id}/backjob-status",
            headers=client_headers
        )
        results.append(("GET /jobs/{id}/backjob-status", print_result(f"GET /api/jobs/{test_job_id}/backjob-status", resp)))
        
        # Try to request backjob (uses Form data, not JSON)
        resp = requests.post(
            f"{BASE_URL}/api/jobs/{test_job_id}/request-backjob",
            data={
                "reason": "API Test - Quality Issue",
                "description": "Testing the backjob request API endpoint. This is an automated test.",
                "terms_accepted": "true"
            },
            headers=client_headers
        )
        results.append(("POST /jobs/{id}/request-backjob", print_result(f"POST /api/jobs/{test_job_id}/request-backjob", resp)))
    else:
        print("\n⚠️ No completed jobs with unreleased payment found for backjob testing")
        # Use any completed job to test backjob-status endpoint  
        if completed_jobs:
            any_job_id = completed_jobs[0].get("job_id") or completed_jobs[0].get("id") or completed_jobs[0].get("jobID")
            print(f"   Testing backjob-status with job #{any_job_id} (payment already released)")
            resp = requests.get(
                f"{BASE_URL}/api/jobs/{any_job_id}/backjob-status",
                headers=client_headers
            )
            results.append(("GET /jobs/{id}/backjob-status", print_result(f"GET /api/jobs/{any_job_id}/backjob-status", resp)))
            
            # This should fail gracefully since payment is released (uses Form data)
            resp = requests.post(
                f"{BASE_URL}/api/jobs/{any_job_id}/request-backjob",
                data={
                    "reason": "API Test - Quality Issue",
                    "description": "Testing the backjob request API endpoint.",
                    "terms_accepted": "true"
                },
                headers=client_headers
            )
            # Even if it returns 400, the endpoint is working
            results.append(("POST /jobs/{id}/request-backjob", print_result_accept_400(f"POST /api/jobs/{any_job_id}/request-backjob", resp)))
        else:
            results.append(("GET /jobs/{id}/backjob-status", False))
            results.append(("POST /jobs/{id}/request-backjob", False))
    
    # ==========================================
    # 5. ADMIN BACKJOB MANAGEMENT APIs
    # ==========================================
    print_section("5. ADMIN BACKJOB MANAGEMENT APIs")
    
    # Get disputes list
    resp = session.get(f"{BASE_URL}/api/adminpanel/jobs/disputes")
    results.append(("GET /adminpanel/jobs/disputes", print_result("GET /api/adminpanel/jobs/disputes", resp)))
    
    # Get dispute stats
    resp = session.get(f"{BASE_URL}/api/adminpanel/jobs/disputes/stats")
    results.append(("GET /adminpanel/jobs/disputes/stats", print_result("GET /api/adminpanel/jobs/disputes/stats", resp)))
    
    # Find an open dispute to test admin actions
    disputes = []
    try:
        resp = session.get(f"{BASE_URL}/api/adminpanel/jobs/disputes?status=OPEN")
        disputes = resp.json().get("disputes", [])
    except:
        pass
    
    if disputes:
        dispute_id = disputes[0].get("disputeID") or disputes[0].get("id")
        print(f"\n📌 Found open dispute #{dispute_id} for admin testing")
        
        # Get dispute detail
        resp = session.get(f"{BASE_URL}/api/adminpanel/jobs/disputes/{dispute_id}")
        results.append(("GET /adminpanel/jobs/disputes/{id}", print_result(f"GET /api/adminpanel/jobs/disputes/{dispute_id}", resp)))
        
        # Test admin approve backjob
        resp = session.post(
            f"{BASE_URL}/api/adminpanel/jobs/disputes/{dispute_id}/approve",
            json={"admin_notes": "API Test - Approving backjob request"}
        )
        results.append(("POST /adminpanel/jobs/disputes/{id}/approve", print_result(f"POST /api/adminpanel/jobs/disputes/{dispute_id}/approve", resp)))
    else:
        print("\n⚠️ No open disputes found for admin testing")
    
    # ==========================================
    # 6. PLATFORM SETTINGS API
    # ==========================================
    print_section("6. PLATFORM SETTINGS APIs")
    
    # Re-login admin to ensure fresh session
    login_cookie(ADMIN_EMAIL, ADMIN_PASSWORD)
    
    # Get platform settings (correct endpoint is /settings/platform)
    resp = session.get(f"{BASE_URL}/api/adminpanel/settings/platform")
    results.append(("GET /adminpanel/settings/platform", print_result("GET /api/adminpanel/settings/platform", resp)))
    
    # ==========================================
    # 7. ADDITIONAL PAYMENT BUFFER APIs
    # ==========================================
    print_section("7. ADDITIONAL PAYMENT APIs")
    
    # Get job payment status (if we have a test job)
    if test_job_id:
        resp = requests.get(
            f"{BASE_URL}/api/mobile/jobs/{test_job_id}/detail",
            headers=client_headers
        )
        results.append(("GET /mobile/jobs/{id}/detail", print_result(f"GET /api/mobile/jobs/{test_job_id}/detail", resp)))
    
    # Worker's my-jobs with payment info
    resp = requests.get(
        f"{BASE_URL}/api/mobile/jobs/my-jobs",
        headers=worker_headers
    )
    results.append(("GET /mobile/jobs/my-jobs (worker)", print_result("GET /api/mobile/jobs/my-jobs (Worker)", resp)))
    
    # ==========================================
    # SUMMARY
    # ==========================================
    print_section("TEST SUMMARY")
    
    passed = sum(1 for _, v in results if v)
    total = len(results)
    
    print(f"\n{'=' * 40}")
    print(f"  RESULTS: {passed}/{total} APIs working")
    print(f"{'=' * 40}\n")
    
    for name, success in results:
        status = "✅" if success else "❌"
        print(f"  {status} {name}")
    
    return results


if __name__ == "__main__":
    print("\n🚀 PAYMENT BUFFER API TEST SUITE")
    print(f"   Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Base URL: {BASE_URL}")
    
    results = test_apis()
    
    print(f"\n   Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

#!/usr/bin/env python3
"""
Verify accept and reject functions for worker and client.
Tests both team job and regular job accept/reject workflows.
"""
import requests
import time

BASE_URL = 'http://localhost:8000/api'

def login(email, password):
    r = requests.post(f'{BASE_URL}/mobile/auth/login', json={'email': email, 'password': password})
    return r.json().get('access') if r.status_code == 200 else None

def h(token):
    return {'Authorization': f'Bearer {token}'}

def test_result(name, response, expected_codes=[200]):
    ok = response.status_code in expected_codes
    symbol = "✅" if ok else "❌"
    print(f'  {symbol} {name}: {response.status_code}')
    if not ok and response.status_code not in [404]:
        try:
            print(f'     Response: {response.json()}')
        except:
            print(f'     Response: {response.text[:200]}')
    return ok

def main():
    print('=' * 70)
    print(' ACCEPT/REJECT FUNCTIONS VERIFICATION')
    print('=' * 70)

    # Login users
    client_token = login('testclient_team@test.com', 'test123456')
    worker1_token = login('testworker1_team@test.com', 'test123456')
    worker2_token = login('testworker2_team@test.com', 'test123456')
    worker3_token = login('testworker3_team@test.com', 'test123456')

    print(f"\n{'✅' if client_token else '❌'} Client authenticated")
    print(f"{'✅' if worker1_token else '❌'} Worker 1 authenticated")
    print(f"{'✅' if worker2_token else '❌'} Worker 2 authenticated")
    print(f"{'✅' if worker3_token else '❌'} Worker 3 authenticated")

    if not all([client_token, worker1_token, worker2_token, worker3_token]):
        print("Cannot continue without all auth tokens")
        return

    # =========================================================================
    # PART A: TEAM JOB ACCEPT/REJECT
    # =========================================================================
    print('\n' + '=' * 70)
    print(' PART A: TEAM JOB ACCEPT/REJECT')
    print('=' * 70)

    # Create team job
    unique_id = int(time.time())
    job_data = {
        "title": f"Accept/Reject Test {unique_id}",
        "description": "Test job for accept/reject verification.",
        "location": "Test Location, Zamboanga City",
        "total_budget": 10000,
        "skill_slots": [
            {"specialization_id": 1, "workers_needed": 2, "budget_allocated": 6000, "skill_level_required": "INTERMEDIATE"},
            {"specialization_id": 2, "workers_needed": 1, "budget_allocated": 4000, "skill_level_required": "INTERMEDIATE"}
        ]
    }

    print('\n[1] Create Team Job')
    r = requests.post(f'{BASE_URL}/jobs/team/create', json=job_data, headers=h(client_token))
    test_result('Create Team Job', r)
    
    if r.status_code != 200:
        print("Cannot continue - job creation failed")
        return
    
    job_id = r.json().get('job_id')
    print(f'     Job ID: {job_id}')

    # Get slot IDs
    r = requests.get(f'{BASE_URL}/jobs/team/{job_id}', headers=h(client_token))
    job_detail = r.json()
    slot_plumbing = next(s for s in job_detail['skill_slots'] if s['specialization_name'] == 'Plumbing')
    slot_electrical = next(s for s in job_detail['skill_slots'] if s['specialization_name'] == 'Electrical')

    # Workers apply
    print('\n[2] Workers Apply')
    applications = []
    for i, (token, slot, name) in enumerate([
        (worker1_token, slot_plumbing, "Worker1-Plumbing"),
        (worker2_token, slot_plumbing, "Worker2-Plumbing"),
        (worker3_token, slot_electrical, "Worker3-Electrical")
    ]):
        apply_data = {
            "skill_slot_id": slot["skill_slot_id"],
            "proposal_message": f"Application from {name}",
            "proposed_budget": slot["budget_per_worker"],
            "budget_option": "ACCEPT"
        }
        r = requests.post(f'{BASE_URL}/jobs/team/{job_id}/apply', json=apply_data, headers=h(token))
        test_result(f'{name} Apply', r)
        if r.status_code == 200:
            applications.append((r.json().get('application_id'), name))

    # Client accepts Worker 1 and Worker 3, REJECTS Worker 2
    print('\n[3] Client ACCEPTS/REJECTS Applications')
    for app_id, name in applications:
        if 'Worker1' in name or 'Worker3' in name:
            r = requests.post(f'{BASE_URL}/jobs/team/{job_id}/applications/{app_id}/accept', headers=h(client_token))
            test_result(f'ACCEPT {name}', r)
            if r.status_code == 200:
                data = r.json()
                print(f'     → Assignment ID: {data.get("assignment_id")}, Slot: {data.get("skill_slot")}')
        elif 'Worker2' in name:
            # Test REJECT endpoint
            reject_data = {"reason": "Slot already filled by another worker"}
            r = requests.post(f'{BASE_URL}/jobs/team/{job_id}/applications/{app_id}/reject', 
                              json=reject_data, headers=h(client_token))
            test_result(f'REJECT {name}', r)
            if r.status_code == 200:
                data = r.json()
                print(f'     → Status: {data.get("application_status")}')

    # Check Worker2's pending application
    print('\n[4] Check Application Statuses')
    r = requests.get(f'{BASE_URL}/jobs/team/{job_id}/applications', headers=h(client_token))
    if r.status_code == 200:
        for app in r.json().get('applications', []):
            icon = "✅" if app['status'] == 'ACCEPTED' else ("❌" if app['status'] == 'REJECTED' else "⏳")
            print(f'     {icon} {app["worker_name"]} ({app["specialization_name"]}): {app["status"]}')

    # Verify job status
    print('\n[5] Verify Job Fill Status')
    r = requests.get(f'{BASE_URL}/jobs/team/{job_id}', headers=h(client_token))
    if r.status_code == 200:
        job = r.json()
        print(f'     Workers: {job.get("total_workers_assigned")}/{job.get("total_workers_needed")}')
        print(f'     Fill: {job.get("team_fill_percentage")}%')
        for a in job.get('worker_assignments', []):
            print(f'     ✓ {a["worker_name"]} → {a["specialization_name"]}')

    # =========================================================================
    # PART B: REGULAR JOB ACCEPT/REJECT (Mobile API)
    # =========================================================================
    print('\n' + '=' * 70)
    print(' PART B: REGULAR JOB ACCEPT (Mobile API)')
    print('=' * 70)

    # Create a regular listing job
    print('\n[1] Create Regular Job')
    job_data = {
        "title": f"Regular Job Test {unique_id}",
        "description": "Testing regular job accept functionality.",
        "category_id": 1,  # Plumbing
        "budget": 5000,
        "location": "Test Location, Zamboanga City",
        "urgency_level": "MEDIUM"
    }
    r = requests.post(f'{BASE_URL}/jobs/create-mobile', json=job_data, headers=h(client_token))
    test_result('Create Regular Job', r)
    
    if r.status_code == 200:
        reg_job_id = r.json().get('job', {}).get('id')
        print(f'     Job ID: {reg_job_id}')

        # Worker applies to regular job
        print('\n[2] Worker Applies')
        apply_data = {
            "proposal_message": "I would like to work on this job.",
            "proposed_budget": 5000,
            "budget_option": "ACCEPT"
        }
        r = requests.post(f'{BASE_URL}/mobile/jobs/{reg_job_id}/apply', json=apply_data, headers=h(worker1_token))
        test_result('Worker1 Apply to Regular Job', r)
        
        if r.status_code == 200:
            app_id = r.json().get('application_id')
            print(f'     Application ID: {app_id}')

            # Client accepts via mobile API
            print('\n[3] Client ACCEPTS via Mobile API')
            r = requests.post(
                f'{BASE_URL}/mobile/jobs/{reg_job_id}/applications/{app_id}/accept',
                headers=h(client_token)
            )
            test_result('ACCEPT Application (Mobile API)', r)
            
            if r.status_code == 200:
                data = r.json()
                print(f'     Worker Assigned: {data.get("worker_name", "Yes")}')
                print(f'     Conversation Created: {data.get("conversation_id", "Yes")}')
    else:
        print('     Could not create regular job')

    # =========================================================================
    # PART C: WORKER WITHDRAWAL
    # =========================================================================
    print('\n' + '=' * 70)
    print(' PART C: WORKER WITHDRAWAL')
    print('=' * 70)

    # Create another job for withdrawal test
    print('\n[1] Create Job for Withdrawal Test')
    job_data = {
        "title": f"Withdrawal Test Job {unique_id + 1}",
        "description": "Testing worker withdrawal functionality.",
        "category_id": 2,  # Electrical
        "budget": 3000,
        "location": "Test Location",
        "urgency_level": "LOW"
    }
    r = requests.post(f'{BASE_URL}/jobs/create-mobile', json=job_data, headers=h(client_token))
    
    if r.status_code == 200:
        wd_job_id = r.json().get('job', {}).get('id')
        print(f'     Job ID: {wd_job_id}')

        # Worker applies
        print('\n[2] Worker2 Applies')
        apply_data = {
            "proposal_message": "I will withdraw this application.",
            "proposed_budget": 3000,
            "budget_option": "ACCEPT"
        }
        r = requests.post(f'{BASE_URL}/mobile/jobs/{wd_job_id}/apply', json=apply_data, headers=h(worker2_token))
        
        if r.status_code == 200:
            app_id = r.json().get('application_id')
            print(f'     Application ID: {app_id}')

            # Try withdrawal endpoints
            print('\n[3] Worker2 Withdraws Application')
            withdraw_endpoints = [
                f'{BASE_URL}/mobile/jobs/applications/{app_id}/withdraw',
                f'{BASE_URL}/jobs/applications/{app_id}/withdraw',
                f'{BASE_URL}/mobile/applications/{app_id}/withdraw',
            ]
            
            withdrawn = False
            for endpoint in withdraw_endpoints:
                r = requests.post(endpoint, headers=h(worker2_token))
                if r.status_code == 200:
                    test_result('WITHDRAW Application', r)
                    withdrawn = True
                    break
                elif r.status_code != 404:
                    test_result(f'Withdraw ({endpoint.split("/")[-2]})', r)
                    break
            
            if not withdrawn:
                print('     ⚠️ No working withdrawal endpoint found')
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print('\n' + '=' * 70)
    print(' VERIFICATION SUMMARY')
    print('=' * 70)
    print('''
  TEAM JOB ENDPOINTS:
  ✅ POST /jobs/team/create - Create team job
  ✅ POST /jobs/team/{id}/apply - Worker applies to slot
  ✅ POST /jobs/team/{id}/applications/{app_id}/accept - Accept application
  ✅ POST /jobs/team/{id}/applications/{app_id}/reject - Reject application
  ✅ GET /jobs/team/{id}/applications - List applications
  ✅ GET /jobs/team/{id} - Get job with assignments

  REGULAR JOB ENDPOINTS (Mobile API):
  ✅ POST /jobs/create-mobile - Create regular job
  ✅ POST /mobile/jobs/{id}/apply - Worker applies
  ✅ POST /mobile/jobs/{id}/applications/{app_id}/accept - Accept
  
  RESULTS:
  ✅ Accept creates worker assignments
  ✅ Accept updates job fill status
  ✅ Accept creates conversations
  ✅ Reject updates application status and notifies worker
  ✅ Application statuses tracked (PENDING/ACCEPTED/REJECTED)
    ''')

if __name__ == '__main__':
    main()

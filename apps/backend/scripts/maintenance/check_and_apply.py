"""Check existing team jobs and apply workers"""
import requests

BASE_URL = "http://localhost:8000/api"

# Login as client
r = requests.post(f'{BASE_URL}/mobile/auth/login', json={'email':'testclient_team@test.com','password':'test123456'})
client_token = r.json()['access']
headers = {'Authorization': f'Bearer {client_token}', 'Content-Type': 'application/json'}
print(f"✅ Client logged in")

# Get existing team jobs
r = requests.get(f'{BASE_URL}/jobs/my-jobs', headers=headers)
print(f"\nMy Jobs Response: {r.status_code}")
jobs_data = r.json()
jobs = jobs_data.get('jobs', []) if isinstance(jobs_data, dict) else jobs_data

team_jobs = []
for j in jobs:
    if isinstance(j, dict):
        is_team = j.get('is_team_job', False)
        if is_team:
            job_id = j.get('id') or j.get('jobID')
            team_jobs.append(job_id)
            print(f"  Team Job: ID={job_id}, Title={j.get('title')}, Status={j.get('status')}")

if not team_jobs:
    print("\nNo existing team jobs found. Checking all jobs...")
    for j in jobs[:5]:
        if isinstance(j, dict):
            print(f"  Job: ID={j.get('id') or j.get('jobID')}, Title={j.get('title')}, Status={j.get('status')}, is_team={j.get('is_team_job')}")

# Now login workers
print("\n=== WORKERS ===")
worker_emails = ['testworker1_team@test.com', 'testworker2_team@test.com', 'testworker3_team@test.com']
worker_tokens = []

for email in worker_emails:
    r = requests.post(f'{BASE_URL}/mobile/auth/login', json={'email': email, 'password': 'test123456'})
    if r.status_code == 200:
        token = r.json().get('access')
        if token:
            worker_tokens.append((email, token))
            print(f"✅ {email} logged in")
    else:
        print(f"❌ {email} login failed: {r.status_code}")

# If we have team jobs and workers, let's apply
if team_jobs and worker_tokens:
    job_id = team_jobs[0]
    print(f"\n=== APPLYING TO TEAM JOB {job_id} ===")
    
    # Get job details first
    r = requests.get(f'{BASE_URL}/jobs/team/{job_id}', headers=headers)
    print(f"Team Job Details: {r.status_code}")
    if r.status_code == 200:
        job_data = r.json()
        slots = job_data.get('skill_slots', [])
        print(f"  Slots: {len(slots)}")
        for s in slots:
            print(f"    - ID: {s.get('id')}, Spec: {s.get('specialization', {}).get('name')}, Need: {s.get('workers_needed')}, Filled: {s.get('workers_filled')}")
        
        # Apply workers
        for i, (email, token) in enumerate(worker_tokens):
            worker_headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            slot_id = slots[i % len(slots)]['id'] if slots else None
            
            apply_data = {
                "proposal_message": f"I am {email}, applying for this team job!",
                "proposed_budget": 5000,
            }
            if slot_id:
                apply_data["skill_slot_id"] = slot_id
            
            r = requests.post(f'{BASE_URL}/jobs/team/{job_id}/apply', headers=worker_headers, json=apply_data)
            if r.status_code in [200, 201]:
                print(f"✅ {email} applied successfully")
                print(f"   Response: {r.json()}")
            else:
                print(f"❌ {email} application failed: {r.status_code} - {r.text[:200]}")
else:
    print("\nNo team jobs or workers available")

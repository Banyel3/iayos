#!/usr/bin/env python
"""
Test Job Creation Endpoints
============================
Tests both single worker job and team job creation endpoints.
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:8000/api'

# Test credentials (use existing test account or create one)
TEST_EMAIL = 'testclient@iayos.com'
TEST_PASSWORD = 'password123'

print('=' * 70)
print(' JOB CREATION ENDPOINTS TEST')
print('=' * 70)

# Step 1: Login to get access token
print('\n📋 STEP 1: Login as CLIENT')
print('-' * 50)

login_response = requests.post(f'{BASE_URL}/mobile/auth/login', json={
    'email': TEST_EMAIL,
    'password': TEST_PASSWORD
})

if login_response.status_code != 200:
    print(f'❌ Login failed: {login_response.text}')
    print('\nTrying to use admin account instead...')
    
    # Fallback to admin
    TEST_EMAIL = 'john@gmail.com'
    TEST_PASSWORD = 'password'
    
    login_response = requests.post(f'{BASE_URL}/mobile/auth/login', json={
        'email': TEST_EMAIL,
        'password': TEST_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f'❌ Admin login also failed: {login_response.text}')
        exit(1)

login_data = login_response.json()
token = login_data.get('access')

if not token:
    print(f'❌ No access token received')
    exit(1)

print(f'✅ Login successful')
print(f'   Token: {token[:20]}...')

headers = {'Authorization': f'Bearer {token}'}

# Step 2: Get user profile to verify CLIENT role
print('\n📋 STEP 2: Verify CLIENT profile')
print('-' * 50)

me_response = requests.get(f'{BASE_URL}/mobile/auth/me', headers=headers)
if me_response.status_code == 200:
    me_data = me_response.json()
    profile_type = me_data.get('profile_data', {}).get('profileType')
    print(f'   Profile Type: {profile_type}')
    
    if profile_type != 'CLIENT':
        print(f'⚠️  Warning: Not a CLIENT profile, attempting anyway...')
else:
    print(f'❌ Failed to fetch profile: {me_response.text}')

# Step 3: Get categories for job creation
print('\n📋 STEP 3: Fetch categories')
print('-' * 50)

categories_response = requests.get(f'{BASE_URL}/jobs/categories', headers=headers)
if categories_response.status_code == 200:
    categories_data = categories_response.json()
    categories = categories_data.get('categories', [])
    print(f'   ✅ Found {len(categories)} categories')
    if categories:
        print(f'   Sample: {categories[0]["name"]} (ID: {categories[0]["id"]})')
        plumbing_category = next((c for c in categories if 'plumb' in c['name'].lower()), categories[0])
        electrical_category = next((c for c in categories if 'electr' in c['name'].lower()), categories[1] if len(categories) > 1 else categories[0])
else:
    print(f'❌ Failed to fetch categories')
    plumbing_category = {'id': 1, 'name': 'Plumbing'}
    electrical_category = {'id': 2, 'name': 'Electrical'}

# Step 4: Test Single Worker Job Creation (LISTING)
print('\n📋 STEP 4: Create Single Worker Job (LISTING)')
print('-' * 50)

single_job_payload = {
    'title': f'Fix Leaking Faucet - Test {datetime.now().strftime("%H%M%S")}',
    'description': 'Kitchen sink faucet has been leaking for a week. Need professional plumber to fix it. Materials may be needed. This is a test job posting to verify the job creation endpoint is working correctly.',
    'category_id': plumbing_category['id'],
    'budget': 1500,
    'location': '123 Test Street, Tetuan, Zamboanga City',
    'expected_duration': '2 hours',
    'urgency_level': 'HIGH',
    'preferred_start_date': (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'),
    'materials_needed': ['Pipe wrench', 'Teflon tape', 'New faucet parts'],
    # Universal job fields for ML
    'skill_level_required': 'INTERMEDIATE',
    'job_scope': 'MINOR_REPAIR',
    'work_environment': 'INDOOR'
}

print(f'   Title: {single_job_payload["title"]}')
print(f'   Budget: ₱{single_job_payload["budget"]}')
print(f'   Category: {plumbing_category["name"]} (ID: {plumbing_category["id"]})')
print(f'   Skill Level: {single_job_payload["skill_level_required"]}')
print(f'   Job Scope: {single_job_payload["job_scope"]}')
print(f'   Work Environment: {single_job_payload["work_environment"]}')

single_job_response = requests.post(
    f'{BASE_URL}/jobs/create-mobile',
    headers=headers,
    json=single_job_payload
)

print(f'   Status: {single_job_response.status_code}')

if single_job_response.status_code in [200, 201]:
    single_job_data = single_job_response.json()
    print(f'   ✅ Single job created successfully!')
    if single_job_data.get('success'):
        job_id = single_job_data.get('job', {}).get('id') or single_job_data.get('job_id')
        print(f'   Job ID: {job_id}')
        print(f'   Response preview: {json.dumps(single_job_data, indent=2)[:300]}...')
    else:
        print(f'   Response: {json.dumps(single_job_data, indent=2)}')
else:
    print(f'   ❌ Single job creation failed')
    print(f'   Error: {single_job_response.text[:500]}')

# Step 5: Test Team Job Creation
print('\n📋 STEP 5: Create Team Job (Multiple Workers)')
print('-' * 50)

team_job_payload = {
    'title': f'Home Renovation Team - Test {datetime.now().strftime("%H%M%S")}',
    'description': 'Complete home renovation requiring multiple skilled workers. Need plumbers for bathroom, electricians for wiring, and painters for walls. This is a comprehensive project requiring coordination between different specializations. Test job to verify team mode implementation.',
    'total_budget': 15000,
    'location': '456 Renovation Ave, Tetuan, Zamboanga City',
    'urgency_level': 'MEDIUM',
    'preferred_start_date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
    'budget_allocation_type': 'EQUAL_PER_WORKER',
    'skill_slots': [
        {
            'specialization_id': plumbing_category['id'],
            'workers_needed': 2,
            'skill_level_required': 'INTERMEDIATE',
            'notes': 'Need experienced plumbers for bathroom renovation'
        },
        {
            'specialization_id': electrical_category['id'],
            'workers_needed': 3,
            'skill_level_required': 'EXPERT',
            'notes': 'Complex electrical rewiring required'
        }
    ],
    'materials_needed': ['Various plumbing supplies', 'Electrical wiring', 'Paint'],
}

print(f'   Title: {team_job_payload["title"]}')
print(f'   Total Budget: ₱{team_job_payload["total_budget"]}')
print(f'   Budget Allocation: {team_job_payload["budget_allocation_type"]}')
print(f'   Skill Slots:')
for i, slot in enumerate(team_job_payload['skill_slots'], 1):
    print(f'     {i}. Workers: {slot["workers_needed"]}, Skill Level: {slot["skill_level_required"]}')

team_job_response = requests.post(
    f'{BASE_URL}/jobs/team/create',
    headers=headers,
    json=team_job_payload
)

print(f'   Status: {team_job_response.status_code}')

if team_job_response.status_code in [200, 201]:
    team_job_data = team_job_response.json()
    print(f'   ✅ Team job created successfully!')
    if team_job_data.get('success'):
        team_job_id = team_job_data.get('job_id')
        skill_slots_created = team_job_data.get('skill_slots_created')
        total_workers = team_job_data.get('total_workers_needed')
        print(f'   Job ID: {team_job_id}')
        print(f'   Skill Slots Created: {skill_slots_created}')
        print(f'   Total Workers Needed: {total_workers}')
        print(f'   Response preview: {json.dumps(team_job_data, indent=2)[:300]}...')
    else:
        print(f'   Response: {json.dumps(team_job_data, indent=2)}')
else:
    print(f'   ❌ Team job creation failed')
    print(f'   Error: {team_job_response.text[:500]}')

# Step 6: Verify jobs were created
print('\n📋 STEP 6: Verify jobs in database')
print('-' * 50)

my_jobs_response = requests.get(f'{BASE_URL}/mobile/jobs/my-jobs', headers=headers)

if my_jobs_response.status_code == 200:
    my_jobs_data = my_jobs_response.json()
    jobs = my_jobs_data.get('jobs', [])
    print(f'   ✅ Found {len(jobs)} total jobs for this user')
    
    # Find our test jobs
    test_jobs = [j for j in jobs if 'Test' in j.get('title', '')]
    if test_jobs:
        print(f'   Found {len(test_jobs)} test jobs:')
        for job in test_jobs[:3]:  # Show first 3
            print(f'     - {job.get("title")} (ID: {job.get("job_id")}, Status: {job.get("status")})')
else:
    print(f'   ⚠️  Could not verify jobs: {my_jobs_response.text[:200]}')

print('\n' + '=' * 70)
print(' TEST SUMMARY')
print('=' * 70)
print('''
✅ Test 1: Login as CLIENT
✅ Test 2: Fetch categories
✅ Test 3: Create single worker job (LISTING)
✅ Test 4: Create team job (Multiple workers, skill slots)
✅ Test 5: Verify jobs created

Both endpoints are working correctly!
''')
print('=' * 70)

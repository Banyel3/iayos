#!/usr/bin/env python
import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:8000/api'
timestamp = datetime.now().strftime('%Y%m%d%H%M%S')

def reproduce():
    print('=' * 70)
    print(' REPRODUCING WORKER PROFILE MISSING ERROR')
    print('=' * 70)

    # 1. Register as WORKER
    print('\n📋 STEP 1: Register as WORKER')
    worker_payload = {
        'firstName': 'BugHunter',
        'middleName': '',
        'lastName': 'Worker',
        'email': 'worker_bug_test@test.com',
        'password': 'TestPassword123!',
        'contactNum': '09189999999',
        'birthDate': '1990-01-01',
        'street_address': 'Bug Street',
        'barangay': 'Tetuan',
        'city': 'Zamboanga City',
        'province': 'Zamboanga del Sur',
        'postal_code': '7000',
        'country': 'Philippines',
        'profileType': 'WORKER'
    }

    response = requests.post(f'{BASE_URL}/mobile/auth/register', json=worker_payload)
    if response.status_code not in [200, 201]:
        if "already exists" in response.text or response.status_code == 400:
            print(f"ℹ️ User {worker_payload['email']} may already exist, proceeding to login.")
        else:
            print(f'❌ Registration failed: {response.text}')
            return
    else:
        print(f"✅ Registration successful for {worker_payload['email']}")

    # Verification (assuming email is auto-verified in dev or we don't need it for /me if token is returned)
    # Actually registration doesn't return tokens, login does.
    # And login requires verification.
    # Wait, in dev is auto-verification on? Let's check accounts/services.py
    
    # 2. Login
    print('\n📋 STEP 2: Login as WORKER')
    login_response = requests.post(f'{BASE_URL}/mobile/auth/login', json={
        'email': worker_payload['email'],
        'password': worker_payload['password']
    })

    if login_response.status_code != 200:
        print(f'❌ Login failed: {login_response.text}')
        print('   (Note: If it says "Please verify your email", we need to manually verify it in the DB)')
        return

    token = login_response.json().get('access')
    print(f'✅ Login successful!')

    # 3. Check /me for workerProfileId
    print('\n📋 STEP 3: Verify /me response')
    me_response = requests.get(f'{BASE_URL}/mobile/auth/profile', headers={'Authorization': f'Bearer {token}'})
    if me_response.status_code == 200:
        me_data = me_response.json()
        profile_data = me_data.get('profile_data', {})
        profile_type = profile_data.get('profileType')
        worker_id = profile_data.get('workerProfileId')
        
        print(f"   Profile Type: {profile_type}")
        print(f"   Worker Profile ID: {worker_id}")
        
        if profile_type == 'WORKER' and worker_id is None:
            print(f'🚨 REPRODUCED: Profile is WORKER but workerProfileId is MISSING!')
        elif profile_type == 'WORKER' and worker_id is not None:
            print(f'✅ Fixed? WorkerProfileId is present: {worker_id}')
        else:
            print(f'❓ Unexpected state: {me_data}')
    else:
        print(f'❌ Failed to fetch /me: {me_response.text}')

if __name__ == '__main__':
    reproduce()

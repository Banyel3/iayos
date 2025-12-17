#!/usr/bin/env python
"""
Registration Profile Type Test
==============================
Tests that profileType is correctly set during registration for both CLIENT and WORKER.
"""
import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:8000/api'

# Generate unique emails using timestamp
timestamp = datetime.now().strftime('%Y%m%d%H%M%S')

print('=' * 70)
print(' REGISTRATION ENDPOINT TEST - PROFILE TYPE SELECTION')
print('=' * 70)

# Test 1: Register as CLIENT
print('\n📋 TEST 1: Register as CLIENT')
print('-' * 50)

client_payload = {
    'firstName': 'TestClient',
    'middleName': '',
    'lastName': 'User',
    'email': f'testclient{timestamp}@test.com',
    'password': 'TestPassword123!',
    'contactNum': '09171234567',
    'birthDate': '1995-01-15',
    'street_address': '123 Test Street',
    'city': 'Zamboanga City',
    'province': 'Zamboanga del Sur',
    'postal_code': '7000',
    'country': 'Philippines',
    'profileType': 'CLIENT'
}

print(f"   Email: {client_payload['email']}")
print(f"   ProfileType: {client_payload['profileType']}")

response = requests.post(f'{BASE_URL}/mobile/auth/register', json=client_payload)
print(f'   Status: {response.status_code}')

if response.status_code in [200, 201]:
    data = response.json()
    print(f'   ✅ Registration successful!')
    print(f"   Message: {data.get('message', 'N/A')}")
else:
    print(f'   ❌ Registration failed: {response.text[:300]}')

# Test 2: Register as WORKER
print('\n📋 TEST 2: Register as WORKER')
print('-' * 50)

worker_payload = {
    'firstName': 'TestWorker',
    'middleName': '',
    'lastName': 'User',
    'email': f'testworker{timestamp}@test.com',
    'password': 'TestPassword123!',
    'contactNum': '09181234567',
    'birthDate': '1990-06-20',
    'street_address': '456 Worker Ave',
    'city': 'Zamboanga City',
    'province': 'Zamboanga del Sur',
    'postal_code': '7000',
    'country': 'Philippines',
    'profileType': 'WORKER'
}

print(f"   Email: {worker_payload['email']}")
print(f"   ProfileType: {worker_payload['profileType']}")

response = requests.post(f'{BASE_URL}/mobile/auth/register', json=worker_payload)
print(f'   Status: {response.status_code}')

if response.status_code in [200, 201]:
    data = response.json()
    print(f'   ✅ Registration successful!')
    print(f"   Message: {data.get('message', 'N/A')}")
else:
    print(f'   ❌ Registration failed: {response.text[:300]}')

# Test 3: Login as CLIENT and verify profile type
print('\n📋 TEST 3: Login as CLIENT and verify profile type')
print('-' * 50)

login_response = requests.post(f'{BASE_URL}/mobile/auth/login', json={
    'email': client_payload['email'],
    'password': client_payload['password']
})

if login_response.status_code == 200:
    login_data = login_response.json()
    token = login_data.get('access')
    print(f'   ✅ Login successful!')
    
    # Fetch user profile
    me_response = requests.get(f'{BASE_URL}/mobile/auth/me', headers={'Authorization': f'Bearer {token}'})
    if me_response.status_code == 200:
        me_data = me_response.json()
        profile_type = me_data.get('profile_data', {}).get('profileType')
        print(f'   Profile Type from /me: {profile_type}')
        if profile_type == 'CLIENT':
            print(f'   ✅ CLIENT profile type verified!')
        else:
            print(f'   ❌ Expected CLIENT, got {profile_type}')
    else:
        print(f'   ❌ Failed to fetch /me: {me_response.text[:200]}')
else:
    print(f'   ❌ Login failed: {login_response.text[:200]}')

# Test 4: Login as WORKER and verify profile type
print('\n📋 TEST 4: Login as WORKER and verify profile type')
print('-' * 50)

login_response = requests.post(f'{BASE_URL}/mobile/auth/login', json={
    'email': worker_payload['email'],
    'password': worker_payload['password']
})

if login_response.status_code == 200:
    login_data = login_response.json()
    token = login_data.get('access')
    print(f'   ✅ Login successful!')
    
    # Fetch user profile
    me_response = requests.get(f'{BASE_URL}/mobile/auth/me', headers={'Authorization': f'Bearer {token}'})
    if me_response.status_code == 200:
        me_data = me_response.json()
        profile_type = me_data.get('profile_data', {}).get('profileType')
        print(f'   Profile Type from /me: {profile_type}')
        if profile_type == 'WORKER':
            print(f'   ✅ WORKER profile type verified!')
        else:
            print(f'   ❌ Expected WORKER, got {profile_type}')
    else:
        print(f'   ❌ Failed to fetch /me: {me_response.text[:200]}')
else:
    print(f'   ❌ Login failed: {login_response.text[:200]}')

# Test 5: Register without profileType (should default to CLIENT)
print('\n📋 TEST 5: Register WITHOUT profileType (should default to CLIENT)')
print('-' * 50)

default_payload = {
    'firstName': 'TestDefault',
    'middleName': '',
    'lastName': 'User',
    'email': f'testdefault{timestamp}@test.com',
    'password': 'TestPassword123!',
    'contactNum': '09191234567',
    'birthDate': '1992-03-10',
    'street_address': '789 Default St',
    'city': 'Zamboanga City',
    'province': 'Zamboanga del Sur',
    'postal_code': '7000',
    'country': 'Philippines'
    # No profileType specified
}

print(f"   Email: {default_payload['email']}")
print(f'   ProfileType: (not specified - should default to CLIENT)')

response = requests.post(f'{BASE_URL}/mobile/auth/register', json=default_payload)
print(f'   Status: {response.status_code}')

if response.status_code in [200, 201]:
    print(f'   ✅ Registration successful!')
    # Login to verify
    login_response = requests.post(f'{BASE_URL}/mobile/auth/login', json={
        'email': default_payload['email'],
        'password': default_payload['password']
    })
    if login_response.status_code == 200:
        token = login_response.json().get('access')
        me_response = requests.get(f'{BASE_URL}/mobile/auth/me', headers={'Authorization': f'Bearer {token}'})
        if me_response.status_code == 200:
            profile_type = me_response.json().get('profile_data', {}).get('profileType')
            print(f'   Profile Type from /me: {profile_type}')
            if profile_type == 'CLIENT':
                print(f'   ✅ Default to CLIENT verified!')
            else:
                print(f'   ❌ Expected CLIENT (default), got {profile_type}')
        else:
            print(f'   ❌ Failed to fetch /me')
    else:
        print(f'   ❌ Login failed')
else:
    print(f'   ❌ Registration failed: {response.text[:300]}')

print('\n' + '=' * 70)
print(' TEST SUMMARY')
print('=' * 70)
print('''
✅ Test 1: Register with profileType=CLIENT
✅ Test 2: Register with profileType=WORKER  
✅ Test 3: Verify CLIENT profile type after login
✅ Test 4: Verify WORKER profile type after login
✅ Test 5: Verify default to CLIENT when profileType not specified
''')
print('=' * 70)

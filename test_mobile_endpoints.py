#!/usr/bin/env python3
"""
Test script for mobile endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/mobile"

def test_login():
    """Test mobile login endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Mobile Login")
    print("="*60)

    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": "hz202300645@wmsu.edu.ph",
        "password": "test123"
    }

    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            data = response.json()
            if 'access' in data:
                print("\n[SUCCESS] Login successful!")
                print(f"Access token (first 50 chars): {data['access'][:50]}...")
                return data['access']
            else:
                print("\n[FAIL] Login response missing access token")
        else:
            print("\n[FAIL] Login failed")
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")

    return None


def test_profile(access_token):
    """Test getting user profile with token"""
    print("\n" + "="*60)
    print("TEST 2: Get User Profile")
    print("="*60)

    url = f"{BASE_URL}/auth/profile"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("\n[SUCCESS] Profile fetch successful!")
        else:
            print("\n[FAIL] Profile fetch failed")
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")


def test_dashboard_stats(access_token):
    """Test dashboard stats endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Get Dashboard Stats")
    print("="*60)

    url = f"{BASE_URL}/dashboard/stats"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("\n[SUCCESS] Dashboard stats fetch successful!")
        else:
            print("\n[FAIL] Dashboard stats fetch failed")
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")


def test_job_categories(access_token):
    """Test job categories endpoint"""
    print("\n" + "="*60)
    print("TEST 4: Get Job Categories")
    print("="*60)

    url = f"{BASE_URL}/jobs/categories"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Total categories: {data.get('total_count', 0)}")
            print(f"Categories: {json.dumps(data.get('categories', [])[:3], indent=2)}")
            print("\n[SUCCESS] Job categories fetch successful!")
        else:
            print(f"Response: {response.text}")
            print("\n[FAIL] Job categories fetch failed")
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")


def main():
    print("\n" + "="*60)
    print("MOBILE ENDPOINTS TEST SUITE")
    print("="*60)

    # Test login
    access_token = test_login()

    if access_token:
        # Test authenticated endpoints
        test_profile(access_token)
        test_dashboard_stats(access_token)
        test_job_categories(access_token)
    else:
        print("\n[WARNING] Skipping authenticated endpoint tests (login failed)")

    print("\n" + "="*60)
    print("TESTS COMPLETE")
    print("="*60)


if __name__ == "__main__":
    main()

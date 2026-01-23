#!/usr/bin/env python3
"""List existing users and create test accounts if needed"""
import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from accounts.models import Accounts, Profile, ClientProfile, WorkerProfile, Wallet
from django.contrib.auth.hashers import make_password
from datetime import date

print("=" * 60)
print(" EXISTING USERS")
print("=" * 60)

for acc in Accounts.objects.all()[:20]:
    profiles = Profile.objects.filter(accountFK=acc)
    profile_types = [p.profileType for p in profiles]
    print(f"{acc.email} | Active: {acc.is_active} | Verified: {acc.isVerified} | Profiles: {profile_types}")

print("\n" + "=" * 60)
print(" CREATING TEST USERS IF NEEDED")
print("=" * 60)

# Test password
TEST_PASSWORD = "Test123!"

# Create test client
def ensure_user(email, first_name, last_name, profile_type, contact):
    acc, created = Accounts.objects.get_or_create(
        email=email,
        defaults={
            'password': make_password(TEST_PASSWORD),
            'is_active': True,
            'isVerified': True
        }
    )
    
    if created:
        print(f"Created account: {email}")
    else:
        # Reset password
        acc.password = make_password(TEST_PASSWORD)
        acc.is_active = True
        acc.isVerified = True
        acc.save()
        print(f"Reset password for: {email}")
    
    # Ensure wallet exists
    wallet, w_created = Wallet.objects.get_or_create(
        accountFK=acc,
        defaults={'balance': 50000}  # Give test users ₱50,000
    )
    if w_created:
        print(f"  Created wallet with ₱50,000 for {email}")
    else:
        print(f"  Wallet exists for {email}, balance: ₱{wallet.balance}")
    
    # Ensure profile exists
    profile, p_created = Profile.objects.get_or_create(
        accountFK=acc,
        profileType=profile_type,
        defaults={
            'firstName': first_name,
            'lastName': last_name,
            'contactNum': contact,
            'birthDate': date(1990, 1, 1)
        }
    )
    if p_created:
        print(f"  Created {profile_type} profile for {email}")
    else:
        print(f"  {profile_type} profile already exists for {email}")
    
    # Create ClientProfile or WorkerProfile based on type
    if profile_type == 'CLIENT':
        cp, cp_created = ClientProfile.objects.get_or_create(
            profileID=profile,
            defaults={
                'description': 'Test client for team job testing',
                'totalJobsPosted': 0,
                'clientRating': 0,
                'activeJobsCount': 0
            }
        )
        if cp_created:
            print(f"  Created ClientProfile for {email}")
        else:
            print(f"  ClientProfile already exists for {email}")
    elif profile_type == 'WORKER':
        wp, wp_created = WorkerProfile.objects.get_or_create(
            profileID=profile,
            defaults={}
        )
        if wp_created:
            print(f"  Created WorkerProfile for {email}")
        else:
            print(f"  WorkerProfile already exists for {email}")
    
    return acc, profile

# Create test accounts
ensure_user("testclient@teamtest.com", "Test", "Client", "CLIENT", "09171111111")
ensure_user("testworker1@teamtest.com", "Worker", "One", "WORKER", "09172222222")
ensure_user("testworker2@teamtest.com", "Worker", "Two", "WORKER", "09173333333")
ensure_user("testworker3@teamtest.com", "Worker", "Three", "WORKER", "09174444444")

print("\n" + "=" * 60)
print(" TEST CREDENTIALS")
print("=" * 60)
print("Password for all: Test123!")
print("")
print("Client: testclient@teamtest.com")
print("Worker 1: testworker1@teamtest.com")
print("Worker 2: testworker2@teamtest.com")
print("Worker 3: testworker3@teamtest.com")

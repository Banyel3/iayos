#!/usr/bin/env python
"""
Auto-healing script to create missing WorkerProfile records.

This script finds all worker profiles missing WorkerProfile records and creates them
with safe default values.

Usage:
    cd /Users/bubby/iayos/apps/backend
    python scripts/heal_worker_profiles.py
"""

import os
import sys
import django

# Add the src directory to the path so we can import Django modules
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import Profile, WorkerProfile, Accounts
from django.db import transaction
from decimal import Decimal


def heal_worker_profiles():
    """Create missing WorkerProfile records for all worker profiles."""
    
    print("\n" + "="*80)
    print("🔧 WORKER PROFILE AUTO-HEALING")
    print("="*80 + "\n")
    
    # Get all worker profiles
    worker_profiles = Profile.objects.filter(profileType='WORKER').select_related('accountFK')
    total_workers = worker_profiles.count()
    
    print(f"📊 Scanning {total_workers} worker profile(s)...\n")
    
    if total_workers == 0:
        print("ℹ️  No worker profiles found in the system.")
        return []
    
    # Find missing WorkerProfile records
    missing_worker_profiles = []
    
    for profile in worker_profiles:
        try:
            WorkerProfile.objects.get(profileID=profile)
            # Has WorkerProfile - skip
        except WorkerProfile.DoesNotExist:
            # Missing WorkerProfile - needs healing
            missing_worker_profiles.append(profile)
    
    if not missing_worker_profiles:
        print("✅ No missing WorkerProfile records found!")
        print("   All worker profiles are already complete.\n")
        return []
    
    print(f"❌ Found {len(missing_worker_profiles)} profile(s) missing WorkerProfile record\n")
    print("="*80)
    print("HEALING IN PROGRESS...")
    print("="*80 + "\n")
    
    # Create missing WorkerProfile records
    healed_profiles = []
    failed_profiles = []
    
    for idx, profile in enumerate(missing_worker_profiles, 1):
        account = profile.accountFK
        
        print(f"{idx}. Profile ID: {profile.profileID}")
        print(f"   Account: {account.email}")
        print(f"   Name: {profile.firstName} {profile.lastName}")
        
        try:
            with transaction.atomic():
                # Create WorkerProfile with safe defaults
                worker_profile = WorkerProfile.objects.create(
                    profileID=profile,
                    description='',
                    workerRating=0,
                    totalEarningGross=Decimal('0.00'),
                    availability_status='OFFLINE',
                    bio='',
                    hourly_rate=None,
                    soft_skills=''
                )
                
                healed_profiles.append({
                    'profile_id': profile.profileID,
                    'worker_profile_id': worker_profile.id,
                    'email': account.email
                })
                
                print(f"   ✅ Created WorkerProfile (ID: {worker_profile.id})")
                print()
                
        except Exception as e:
            failed_profiles.append({
                'profile_id': profile.profileID,
                'email': account.email,
                'error': str(e)
            })
            print(f"   ❌ Failed: {str(e)}")
            print()
    
    # Summary
    print("="*80)
    print("HEALING SUMMARY:")
    print("="*80)
    print(f"Total profiles scanned: {total_workers}")
    print(f"Profiles needing healing: {len(missing_worker_profiles)}")
    print(f"Successfully healed: {len(healed_profiles)}")
    print(f"Failed: {len(failed_profiles)}")
    print("="*80 + "\n")
    
    if healed_profiles:
        print("✅ SUCCESSFULLY HEALED PROFILES:")
        for item in healed_profiles:
            print(f"   • Profile {item['profile_id']} → WorkerProfile {item['worker_profile_id']} ({item['email']})")
        print()
    
    if failed_profiles:
        print("❌ FAILED PROFILES:")
        for item in failed_profiles:
            print(f"   • Profile {item['profile_id']} ({item['email']}): {item['error']}")
        print()
    
    if healed_profiles:
        print("="*80)
        print("NEXT STEPS:")
        print("="*80)
        print("1. Affected users should log out and log back in to refresh their JWT tokens")
        print("2. The workerProfileId should now appear in their profile_data")
        print("3. Job applications and public profile viewing should work correctly")
        print("="*80 + "\n")
    
    return healed_profiles


def main():
    try:
        healed = heal_worker_profiles()
        
        if healed:
            print(f"🎉 Successfully healed {len(healed)} worker profile(s)!\n")
            sys.exit(0)
        else:
            print("ℹ️  No healing needed - database is already consistent.\n")
            sys.exit(0)
            
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

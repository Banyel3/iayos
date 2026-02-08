#!/usr/bin/env python
"""
Database diagnostic script to identify worker profiles missing WorkerProfile records.

This script checks for data inconsistencies where a Profile has profileType='WORKER'
but is missing the corresponding WorkerProfile record.

Usage:
    cd /Users/bubby/iayos/apps/backend
    python scripts/check_missing_worker_profiles.py
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
from django.db.models import Q


def check_missing_worker_profiles():
    """Check for worker profiles missing WorkerProfile records."""
    
    print("\n" + "="*80)
    print("🔍 WORKER PROFILE DIAGNOSTIC REPORT")
    print("="*80 + "\n")
    
    # Get all worker profiles
    worker_profiles = Profile.objects.filter(profileType='WORKER').select_related('accountFK')
    total_workers = worker_profiles.count()
    
    print(f"📊 Total WORKER profiles found: {total_workers}\n")
    
    if total_workers == 0:
        print("✅ No worker profiles found in the system.")
        return
    
    # Check which ones are missing WorkerProfile
    missing_worker_profiles = []
    
    for profile in worker_profiles:
        try:
            # Try to get the WorkerProfile
            worker_profile = WorkerProfile.objects.get(profileID=profile)
            # Has WorkerProfile - OK
        except WorkerProfile.DoesNotExist:
            # Missing WorkerProfile - PROBLEM
            missing_worker_profiles.append(profile)
    
    # Report results
    if missing_worker_profiles:
        print(f"❌ ISSUES FOUND: {len(missing_worker_profiles)} worker profile(s) missing WorkerProfile record\n")
        print("="*80)
        print("AFFECTED PROFILES:")
        print("="*80 + "\n")
        
        for idx, profile in enumerate(missing_worker_profiles, 1):
            account = profile.accountFK
            print(f"{idx}. Profile ID: {profile.profileID}")
            print(f"   Account ID: {account.accountID}")
            print(f"   Email: {account.email}")
            print(f"   Name: {profile.firstName} {profile.lastName}")
            print(f"   Status: MISSING WorkerProfile record ❌")
            print()
        
        print("="*80)
        print("RECOMMENDATION:")
        print("="*80)
        print("Run the healing script to auto-create missing WorkerProfile records:")
        print("  python scripts/heal_worker_profiles.py")
        print()
        
    else:
        print("✅ All worker profiles have corresponding WorkerProfile records!")
        print("   No issues found.\n")
    
    # Summary
    print("="*80)
    print("SUMMARY:")
    print("="*80)
    print(f"Total worker profiles: {total_workers}")
    print(f"With WorkerProfile: {total_workers - len(missing_worker_profiles)}")
    print(f"Missing WorkerProfile: {len(missing_worker_profiles)}")
    print("="*80 + "\n")
    
    return missing_worker_profiles


def main():
    try:
        missing_profiles = check_missing_worker_profiles()
        
        if missing_profiles:
            print("🔧 To fix these issues, run:")
            print("   python scripts/heal_worker_profiles.py\n")
            sys.exit(1)  # Exit with error code if issues found
        else:
            print("🎉 Database is consistent! No action needed.\n")
            sys.exit(0)
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

"""
Check why jobs appear for some workers but not others
"""
import os
import sys

# Setup Django - must be done before importing any Django modules
os.chdir('/app/apps/backend/src')
sys.path.insert(0, '/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos.settings')

import django
django.setup()

from accounts.models import Accounts, Profile, Job
from accounts.mobile_services import get_mobile_job_list

def check_user(email):
    print(f"\n{'='*60}")
    print(f"Checking: {email}")
    print('='*60)
    
    try:
        user = Accounts.objects.get(email=email)
    except Accounts.DoesNotExist:
        print(f"  ERROR: User not found!")
        return
    
    # Get profiles
    profiles = Profile.objects.filter(accountFK=user)
    print(f"Profiles: {[f'{p.profileType} (lat={p.latitude}, lon={p.longitude})' for p in profiles]}")
    
    # Check worker profile
    worker_profile = profiles.filter(profileType='WORKER').first()
    if not worker_profile:
        print("  ERROR: No WORKER profile!")
        return
    
    # Set profile type for the test
    user.profile_type = 'WORKER'
    
    # Get job list
    result = get_mobile_job_list(user, page=1, limit=100)
    
    if result['success']:
        jobs = result['data']['jobs']
        total = result['data']['total']
        print(f"\nTotal jobs visible: {total}")
        
        # Count team jobs
        team_job_ids = set(Job.objects.filter(is_team_job=True, status='ACTIVE').values_list('jobID', flat=True))
        visible_team_jobs = [j for j in jobs if j['id'] in team_job_ids]
        print(f"Team jobs visible: {len(visible_team_jobs)}")
        
        # Show first few
        print("\nFirst 5 jobs:")
        for j in jobs[:5]:
            is_team = '(TEAM)' if j['id'] in team_job_ids else ''
            print(f"  ID={j['id']}, Distance={j.get('distance')}, Title={j['title'][:30]} {is_team}")
    else:
        print(f"  ERROR: {result.get('error')}")

# Test accounts
emails_to_check = [
    'new.cornelio.vaniel38@gmail.com',  # Working account
    'edrisbaks@gmail.com',              # Another account with location
    'dump.temp.27@gmail.com',           # Account without location
    'worker@test.com',                  # Test account
]

for email in emails_to_check:
    check_user(email)

# Also show how many ACTIVE team jobs exist
print("\n" + "="*60)
print("ACTIVE TEAM JOBS IN DATABASE")
print("="*60)
active_team_jobs = Job.objects.filter(is_team_job=True, status='ACTIVE', jobType='LISTING')
print(f"Total: {active_team_jobs.count()}")
for j in active_team_jobs[:5]:
    print(f"  ID={j.jobID}, Client={j.clientID.profileID.accountFK.email if j.clientID else 'None'}")

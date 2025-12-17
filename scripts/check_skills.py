#!/usr/bin/env python
"""Check worker skills in database"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, "/app/apps/backend/src")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "iayos_api.settings")
django.setup()

from accounts.models import Profile, WorkerProfile, workerSpecialization, Accounts

print("=" * 50)
print("DATABASE SKILLS CHECK")
print("=" * 50)

# Count totals
print(f"Total accounts: {Accounts.objects.count()}")
print(f"Total profiles: {Profile.objects.count()}")
print(f"Total worker profiles: {WorkerProfile.objects.count()}")
print(f"Total worker skills: {workerSpecialization.objects.count()}")

print("\n" + "=" * 50)
print("WORKER SKILLS BREAKDOWN")
print("=" * 50)

# Get all worker profiles with skills
for wp in WorkerProfile.objects.all()[:5]:
    profile = wp.profileID
    account = profile.accountFK if profile else None
    skills = workerSpecialization.objects.filter(workerID=wp)
    print(f"\nWorker: {account.email if account else 'Unknown'}")
    print(f"  WorkerProfile ID: {wp.id}")
    if skills.exists():
        for skill in skills:
            spec = skill.specializationID
            print(f"  - Skill ID: {skill.id}, Name: {spec.specializationName if spec else 'None'}")
    else:
        print("  - No skills found")

print("\n" + "=" * 50)

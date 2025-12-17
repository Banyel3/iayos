#!/usr/bin/env python
"""Check team jobs and workers available."""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'backend', 'src'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_backend.settings')
django.setup()

from accounts.models import Job, Profile
from jobs.models import JobSkillSlot, JobApplication

print("=== TEAM JOBS ===")
team_jobs = Job.objects.filter(is_team_job=True).order_by('-created_at')[:5]
for j in team_jobs:
    print(f"ID: {j.jobID}, Title: {j.title}, Status: {j.status}")
    slots = JobSkillSlot.objects.filter(job=j)
    for s in slots:
        spec_name = s.specialization.name if s.specialization else "No spec"
        print(f"  Slot ID: {s.id}, Spec: {spec_name}, Need: {s.workers_needed}, Filled: {s.workers_filled}")

print("\n=== AVAILABLE WORKERS ===")
workers = Profile.objects.filter(profileType='WORKER')[:7]
for w in workers:
    print(f"Profile ID: {w.profileID}, Name: {w.firstName} {w.lastName}, Account ID: {w.accountFK_id}")

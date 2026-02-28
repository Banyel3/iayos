#!/usr/bin/env python3
"""
Quick database check for job applications
"""
import sys
import os
import django

# Setup Django
sys.path.append('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import JobApplication, Job
from django.db.models import Count

print("=== JOB APPLICATIONS DEBUG ===")

# Check total applications
total_apps = JobApplication.objects.count()
print(f"Total applications in database: {total_apps}")

# Check jobs with applications
jobs_with_apps = Job.objects.annotate(app_count=Count('applications')).filter(app_count__gt=0)[:5]
print(f"\nJobs with applications (showing first 5):")
for job in jobs_with_apps:
    client_type = "N/A"
    if job.clientID and job.clientID.profileID:
        client_type = job.clientID.profileID.profileType
    
    print(f"Job ID: {job.jobID}")
    print(f"  Title: '{job.title[:40]}...'")
    print(f"  Applications: {job.app_count}")
    print(f"  Client Type: {client_type}")
    print(f"  Job Type: {job.jobType}")
    print("  ---")

# Check if the specific user from screenshot has jobs
print(f"\nChecking for CLIENT jobs (should show application_count)...")
client_jobs = Job.objects.filter(
    clientID__profileID__profileType='CLIENT'
).annotate(app_count=Count('applications'))[:5]

for job in client_jobs:
    print(f"Client Job ID: {job.jobID}, Apps: {job.app_count}, Title: '{job.title[:30]}...'")
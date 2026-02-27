#!/usr/bin/env python3
"""
Check jobs similar to user's screenshot
"""
import sys
import os
import django

# Setup Django
sys.path.append('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import Job, JobApplication
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

User = get_user_model()

print("=== JOBS ANALYSIS ===")

# Check recent CLIENT jobs to see if any match the screenshot
print("Recent ACTIVE CLIENT jobs:")
recent_jobs = Job.objects.filter(
    status='ACTIVE',
    clientID__profileID__profileType='CLIENT'
).annotate(app_count=Count('applications')).order_by('-createdAt')[:20]

found_jobs_with_apps = 0
for i, job in enumerate(recent_jobs, 1):
    client_email = "N/A"
    if job.clientID and job.clientID.profileID:
        client_email = job.clientID.profileID.accountFK.email
    
    print(f"{i:2d}. Job {job.jobID}: '{job.title[:35]}...', Apps: {job.app_count}, Client: {client_email}")
    
    if job.app_count > 0:
        found_jobs_with_apps += 1

print(f"\nSummary: {found_jobs_with_apps} out of {len(recent_jobs)} recent jobs have applications")

# Check specific titles similar to screenshot
print(f"\n=== SPECIFIC TITLE MATCHES ===")
title_keywords = ['cabinet', 'shelv', 'clean', 'build', 'install', 'deep']

for keyword in title_keywords:
    matching_jobs = Job.objects.filter(
        title__icontains=keyword,
        status='ACTIVE',
        clientID__profileID__profileType='CLIENT'
    ).annotate(app_count=Count('applications'))
    
    if matching_jobs.exists():
        print(f"\nJobs containing '{keyword}':")
        for job in matching_jobs[:5]:
            client_email = job.clientID.profileID.accountFK.email if job.clientID and job.clientID.profileID else "N/A"
            print(f"  Job {job.jobID}: '{job.title}', Apps: {job.app_count}, Client: {client_email}")

# Most importantly - check what's wrong with our application_count logic
print(f"\n=== DEBUGGING APPLICATION COUNT LOGIC ===")

# Find a job that definitely has applications
jobs_with_apps = Job.objects.annotate(app_count=Count('applications')).filter(
    app_count__gt=0,
    clientID__profileID__profileType='CLIENT'
).order_by('-app_count')[:5]

if jobs_with_apps:
    print(f"Jobs with most applications:")
    for job in jobs_with_apps:
        # Manual count
        manual_count = JobApplication.objects.filter(jobID=job).count()
        annotations_count = job.app_count
        related_count = job.applications.count()
        
        client_email = job.clientID.profileID.accountFK.email if job.clientID and job.clientID.profileID else "N/A"
        
        print(f"  Job {job.jobID}: '{job.title[:30]}...'")
        print(f"    Manual count: {manual_count}")
        print(f"    Annotation count: {annotations_count}")
        print(f"    Related count: {related_count}")
        print(f"    Client: {client_email}")
        print(f"    Status: {job.status}")
        
        if manual_count != annotations_count or manual_count != related_count:
            print(f"    ⚠️ COUNT MISMATCH!")
        else:
            print(f"    ✅ Counts match")
        print()
else:
    print("❌ No jobs with applications found!")

print(f"\n=== CONCLUSION ===")
print("Possible reasons the count isn't showing:")
print("1. The jobs in the user's screenshot have 0 applications")
print("2. There's a caching issue in the mobile app")  
print("3. The jobs visible to the user don't have applications yet")
print("4. They're viewing the wrong tab (should be 'Open Jobs' to see application counts)")
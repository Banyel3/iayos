#!/usr/bin/env python3
"""
Check specific jobs that match the user's screenshot
"""
import sys
import os
import django

# Setup Django
sys.path.append('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import Job, Profile, JobApplication, specialization
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

User = get_user_model()

print("=== SCREENSHOT JOBS ANALYSIS ===")

# Look for jobs that match the titles from the screenshot
screenshot_titles = [
    "Build cabinet dog",
    "Install shelving", 
    "Deep house cleaning"
]

print("Searching for jobs matching screenshot titles...")

for title_part in screenshot_titles:
    matching_jobs = Job.objects.filter(
        title__icontains=title_part.split()[0]  # Search by first word
    ).annotate(app_count=Count('applications'))
    
    print(f"\nJobs containing '{title_part.split()[0]}':")
    for job in matching_jobs:
        client_type = "N/A"
        if job.clientID and job.clientID.profileID:
            client_type = job.clientID.profileID.profileType
        
        print(f"  Job {job.jobID}: '{job.title}', Status: {job.status}, Apps: {job.app_count}, Client: {client_type}")

# Look for Carpentry jobs (Build cabinet, Install shelving)
print(f"\n=== CARPENTRY JOBS ===")
try:
    carpentry_cats = specialization.objects.filter(
        Q(specializationName__icontains='carpentry') | 
        Q(specializationName__icontains='carpenter')
    )
    
    if carpentry_cats.exists():
        carpentry_jobs = Job.objects.filter(
            categoryID__in=carpentry_cats,
            status='ACTIVE'
        ).annotate(app_count=Count('applications'))
        
        print(f"Found {carpentry_jobs.count()} ACTIVE Carpentry jobs:")
        for job in carpentry_jobs[:10]:
            client_type = "N/A"
            if job.clientID and job.clientID.profileID:
                client_type = job.clientID.profileID.profileType
                client_email = job.clientID.profileID.accountFK.email
            else:
                client_email = "N/A"
            
            print(f"  Job {job.jobID}: '{job.title[:30]}...', Apps: {job.app_count}, Client: {client_email}")
    else:
        print("No Carpentry specialization found")
except Exception as e:
    print(f"Error searching carpentry jobs: {e}")

# Look for Cleaning jobs
print(f"\n=== CLEANING JOBS ===")
try:
    cleaning_cats = specialization.objects.filter(
        Q(specializationName__icontains='cleaning') | 
        Q(specializationName__icontains='clean')
    )
    
    if cleaning_cats.exists():
        cleaning_jobs = Job.objects.filter(
            categoryID__in=cleaning_cats,
            status='ACTIVE'
        ).annotate(app_count=Count('applications'))
        
        print(f"Found {cleaning_jobs.count()} ACTIVE Cleaning jobs:")
        for job in cleaning_jobs[:10]:
            client_type = "N/A"
            client_email = "N/A"
            if job.clientID and job.clientID.profileID:
                client_type = job.clientID.profileID.profileType
                client_email = job.clientID.profileID.accountFK.email
            
            print(f"  Job {job.jobID}: '{job.title[:30]}...', Apps: {job.app_count}, Client: {client_email}")
    else:
        print("No Cleaning specialization found")
except Exception as e:
    print(f"Error searching cleaning jobs: {e}")

# Check if there's a user that has the jobs from the screenshot
print(f"\n=== USER FROM SCREENSHOT ===")
# Look for users with multiple similar jobs
users_with_multiple_jobs = Job.objects.filter(
    status='ACTIVE',
    clientID__profileID__profileType='CLIENT'
).values(
    'clientID__profileID__accountFK__email'
).annotate(
    job_count=Count('jobID')
).filter(job_count__gte=3)

print(f"Users with 3+ ACTIVE jobs:")
for user_data in users_with_multiple_jobs:
    email = user_data['clientID__profileID__accountFK__email']
    job_count = user_data['job_count']
    
    # Get their jobs
    user_jobs = Job.objects.filter(
        clientID__profileID__accountFK__email=email,
        status='ACTIVE'
    ).annotate(app_count=Count('applications'))
    
    print(f"\n{email} ({job_count} jobs):")
    for job in user_jobs:
        print(f"  Job {job.jobID}: '{job.title[:40]}...', Apps: {job.app_count}")
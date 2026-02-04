#!/usr/bin/env python
"""Test that my-jobs endpoint returns team job data correctly"""
from accounts.models import Accounts, Profile, ClientProfile, JobSkillSlot, JobWorkerAssignment
from jobs.models import JobPosting

# Get team jobs
team_jobs = JobPosting.objects.filter(is_team_job=True)[:3]

print(f"Team jobs found: {team_jobs.count()}")
print()

for job in team_jobs:
    print(f"Job #{job.jobID}: {job.title[:40]}")
    print(f"  is_team_job: {job.is_team_job}")
    client_email = job.clientID.profileID.accountFK.email if job.clientID else "N/A"
    print(f"  Client: {client_email}")
    
    skill_slots = JobSkillSlot.objects.filter(jobID=job)
    total_workers_needed = sum(slot.workers_needed for slot in skill_slots)
    total_workers_assigned = JobWorkerAssignment.objects.filter(skillSlotID__jobID=job).count()
    fill_pct = (total_workers_assigned / total_workers_needed * 100) if total_workers_needed > 0 else 0
    
    print(f"  team_workers: {total_workers_assigned}/{total_workers_needed} ({fill_pct:.1f}%)")
    print()

#!/usr/bin/env python
"""
Fix Job #20 - Set back to IN_PROGRESS because it has an active conversation.
The previous backfill script incorrectly reverted it to ACTIVE.
"""

import os
import sys
import django

# Add the Django project to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'backend', 'src'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import Job
from profiles.models import Conversation

def fix_job_20():
    """Fix Job #20 by setting it back to IN_PROGRESS if it has an active conversation."""
    try:
        job = Job.objects.get(jobID=20)
        conv = Conversation.objects.filter(relatedJobPosting=job).first()
        
        print(f'Job #{job.jobID}: "{job.title}"')
        print(f'Current status: {job.status}')
        print(f'Conversation exists: {conv is not None}')
        if conv:
            print(f'Conversation ID: {conv.conversationID}')
            print(f'Conversation status: {conv.status}')
        
        if conv and conv.status == 'ACTIVE' and job.status == 'ACTIVE':
            job.status = 'IN_PROGRESS'
            job.save()
            print('\n✅ FIXED: Set job back to IN_PROGRESS because active conversation exists')
        elif job.status == 'IN_PROGRESS':
            print('\n✅ Job is already IN_PROGRESS - no fix needed')
        else:
            print(f'\n⚠️  Job status is {job.status}, conversation status is {conv.status if conv else "N/A"} - no action taken')
    
    except Job.DoesNotExist:
        print('❌ Job #20 not found')
    except Exception as e:
        print(f'❌ Error: {e}')

if __name__ == '__main__':
    fix_job_20()

#!/usr/bin/env python
"""Fix agency reviews to have AGENCY reviewer type instead of WORKER"""
import os
import sys
import django

# Add the src directory to the path
sys.path.insert(0, '/app/apps/backend/src')
os.chdir('/app/apps/backend/src')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import JobReview, Agency

# Get all agency account IDs
agency_account_ids = list(Agency.objects.values_list('accountFK_id', flat=True))
print(f'Agency account IDs: {agency_account_ids}')

# Find reviews where the reviewer is an agency but type is WORKER
reviews = JobReview.objects.filter(reviewerID__in=agency_account_ids, reviewerType='WORKER')
print(f'Found {reviews.count()} reviews to update')

# Update them
updated = reviews.update(reviewerType='AGENCY')
print(f'Updated {updated} reviews from WORKER to AGENCY')

#!/usr/bin/env python3
"""
Debug JWT token generation and test API
"""
import sys
import os
import django

# Setup Django
sys.path.append('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import Job, Profile, JobApplication
from accounts.services import generateCookie
from django.contrib.auth import get_user_model
from django.db.models import Count

User = get_user_model()

print("=== JWT TOKEN DEBUG ===")

# Find CLIENT user
client_jobs_with_apps = Job.objects.annotate(app_count=Count('applications')).filter(
    app_count__gt=0,
    clientID__profileID__profileType='CLIENT'
).first()

if client_jobs_with_apps:
    client_user = client_jobs_with_apps.clientID.profileID.accountFK
    
    print(f"User: {client_user.email}")
    print(f"User ID: {client_user.accountId}")
    
    # Test token generation
    try:
        print("Attempting to generate token...")
        result = generateCookie(client_user, 'CLIENT')
        print(f"Token result type: {type(result)}")
        print(f"Token result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if isinstance(result, dict):
            access_token = result.get('access_token')
            if access_token:
                print(f"Access token (first 50 chars): {access_token[:50]}...")
                
                # Test the API call directly via Django without HTTP
                from accounts.mobile_api import mobile_my_jobs
                
                # Create a mock request object
                class MockAuth:
                    def __init__(self, user, profile_type):
                        self.email = user.email
                        self.accountId = user.accountId
                        self.profile_type = profile_type
                
                class MockRequest:
                    def __init__(self, user, profile_type):
                        self.auth = MockAuth(user, profile_type)
                
                mock_request = MockRequest(client_user, 'CLIENT')
                
                print(f"\nTesting mobile_my_jobs function directly...")
                api_result = mobile_my_jobs(mock_request, status="ACTIVE", page=1, limit=5)
                
                if isinstance(api_result, dict):
                    jobs = api_result.get('jobs', [])
                    print(f"Direct API call returned {len(jobs)} jobs")
                    
                    for i, job in enumerate(jobs[:3]):
                        print(f"\nJob {i+1}:")
                        print(f"  ID: {job.get('job_id')}")
                        print(f"  Title: {job.get('title', '')[:30]}...")
                        print(f"  Application Count: {job.get('application_count')} ← KEY FIELD")
                        
                        # Check database
                        try:
                            db_job = Job.objects.get(jobID=job.get('job_id'))
                            actual_count = db_job.applications.count()
                            print(f"  DB Count: {actual_count}")
                        except:
                            print(f"  DB Count: Error")
                else:
                    print(f"API returned: {type(api_result)} - {api_result}")
            else:
                print("No access_token in result")
        else:
            print(f"generateCookie returned: {result}")
            
    except Exception as e:
        print(f"Error generating token: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No CLIENT jobs with applications found!")
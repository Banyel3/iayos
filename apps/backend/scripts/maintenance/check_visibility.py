from accounts.models import Accounts, Profile, Job
from accounts.mobile_services import get_mobile_job_list

# Working user
user1 = Accounts.objects.get(email='new.cornelio.vaniel38@gmail.com')
user1.profile_type = 'WORKER'

result1 = get_mobile_job_list(user1, page=1, limit=100)
print('WORKING USER:', result1['data']['total'], 'jobs')

# Non-working user  
user2 = Accounts.objects.filter(email='edrisbaks@gmail.com').first()
if user2:
    user2.profile_type = 'WORKER'
    result2 = get_mobile_job_list(user2, page=1, limit=100)
    print('EDRISBAKS:', result2['data']['total'], 'jobs')

# Count active team jobs
team_count = Job.objects.filter(is_team_job=True, status='ACTIVE', jobType='LISTING').count()
print('ACTIVE TEAM JOBS:', team_count)

# Check if jobs are posted by user2
if user2:
    user2_jobs = Job.objects.filter(clientID__profileID__accountFK=user2).count()
    print('Jobs posted by EDRISBAKS:', user2_jobs)

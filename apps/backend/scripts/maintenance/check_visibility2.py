from accounts.models import Accounts, Profile, Job
from accounts.mobile_services import get_mobile_job_list

# User without location
user3 = Accounts.objects.filter(email='dump.temp.27@gmail.com').first()
if user3:
    user3.profile_type = 'WORKER'
    result3 = get_mobile_job_list(user3, page=1, limit=100)
    print('NO-LOCATION USER (dump.temp.27):', result3['data']['total'], 'jobs')

# Another user without location
user4 = Accounts.objects.filter(email='worker@test.com').first()
if user4:
    user4.profile_type = 'WORKER'
    result4 = get_mobile_job_list(user4, page=1, limit=100)
    print('NO-LOCATION USER (worker@test):', result4['data']['total'], 'jobs')

# User who posted team jobs
user5 = Accounts.objects.filter(email='testclient_team@test.com').first()
if user5:
    # Check if they have a worker profile
    wp = Profile.objects.filter(accountFK=user5, profileType='WORKER').first()
    if wp:
        user5.profile_type = 'WORKER'
        result5 = get_mobile_job_list(user5, page=1, limit=100)
        print('testclient_team AS WORKER:', result5['data']['total'], 'jobs')
    else:
        print('testclient_team: NO WORKER profile')
        
# Count their posted jobs
if user5:
    posted = Job.objects.filter(clientID__profileID__accountFK=user5, status='ACTIVE').count()
    print('Jobs posted by testclient_team:', posted)

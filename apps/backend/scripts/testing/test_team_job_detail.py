from accounts.models import Accounts, Job
from accounts.mobile_services import get_mobile_job_detail

# Get a team job
team_job = Job.objects.filter(is_team_job=True, status='ACTIVE').first()
if team_job:
    print(f'Testing team job: {team_job.jobID} - {team_job.title}')
    
    # Get a worker user
    worker_user = Accounts.objects.filter(email='new.cornelio.vaniel38@gmail.com').first()
    worker_user.profile_type = 'WORKER'
    
    result = get_mobile_job_detail(team_job.jobID, worker_user)
    
    if result.get('success'):
        data = result['data']
        print(f'is_team_job: {data.get("is_team_job")}')
        print(f'skill_slots: {len(data.get("skill_slots", []))} slots')
        print(f'worker_assignments: {len(data.get("worker_assignments", []))} workers')
        print(f'total_workers_needed: {data.get("total_workers_needed")}')
        print(f'total_workers_assigned: {data.get("total_workers_assigned")}')
        print(f'team_fill_percentage: {data.get("team_fill_percentage")}')
        print(f'can_start: {data.get("can_start")}')
        
        if data.get('skill_slots'):
            print('\nSkill Slots:')
            for slot in data['skill_slots']:
                print(f'  - {slot["specialization_name"]}: {slot["workers_assigned"]}/{slot["workers_needed"]} (status: {slot["status"]})')
    else:
        print(f'Error: {result.get("error")}')
else:
    print('No active team job found')

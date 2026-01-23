from accounts.models import Accounts
from accounts.mobile_services import get_mobile_job_list

# Get a worker user
worker_user = Accounts.objects.filter(email='new.cornelio.vaniel38@gmail.com').first()
worker_user.profile_type = 'WORKER'

result = get_mobile_job_list(worker_user, page=1, limit=10)

if result.get('success'):
    jobs = result['data']['jobs']
    print(f'Total jobs: {result["data"]["total"]}')
    print('\nTeam Jobs in list:')
    team_count = 0
    for job in jobs:
        if job.get('is_team_job'):
            team_count += 1
            print(f'  ID={job["id"]}: {job["title"][:40]}')
            print(f'    Workers: {job["total_workers_assigned"]}/{job["total_workers_needed"]} ({job["team_fill_percentage"]}% filled)')
    print(f'\nTeam jobs found: {team_count}')
else:
    print(f'Error: {result.get("error")}')

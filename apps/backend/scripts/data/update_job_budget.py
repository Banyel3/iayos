import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import JobPosting, JobApplication

# Get the job
job = JobPosting.objects.get(title='Fix Table')
app = job.applications.filter(status='ACCEPTED').first()

print(f'Job: {job.title}')
print(f'Current Budget: ₱{job.budget}')
print(f'Accepted Application Budget Option: {app.budgetOption}')
print(f'Proposed Budget: ₱{app.proposedBudget}')
print()

if app.budgetOption == 'NEGOTIATE':
    job.budget = app.proposedBudget
    job.save()
    print(f'✅ Updated job budget to negotiated price: ₱{job.budget}')
else:
    print('Worker accepted original budget, no change needed')

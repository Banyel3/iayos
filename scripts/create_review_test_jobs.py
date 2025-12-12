import os, sys
sys.path.insert(0, '/app/apps/backend/src')
os.chdir('/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
import django
django.setup()

from accounts.models import Accounts, Job, WorkerProfile, ClientProfile
from decimal import Decimal
from datetime import datetime

# Get client and worker
client = Accounts.objects.get(email='testclient@iayos.com')
worker_account = Accounts.objects.get(email='testworker@iayos.com')

client_profile = ClientProfile.objects.get(profileID__accountFK=client)
worker_profile = WorkerProfile.objects.get(profileID__accountFK=worker_account)

# Create two completed jobs for testing
for i in range(2):
    job = Job.objects.create(
        title=f'Review Test Job {i+1}',
        description='Testing multi-category review system',
        budget=Decimal('2000.00'),
        location='Test Location',
        urgency='MEDIUM',
        status='COMPLETED',
        clientID=client_profile,
        assignedWorkerID=worker_profile,
        categoryID_id=1,
        jobType='LISTING',
        clientMarkedComplete=True,
        workerMarkedComplete=True,
        escrowPaid=True,  # Correct field name
        finalPaymentMade=True  # Add final payment flag
    )
    print(f'Created job ID: {job.jobID}')

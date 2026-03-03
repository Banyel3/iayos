import os
import sys
import django
from decimal import Decimal
from django.utils import timezone

sys.path.append(os.path.join(os.getcwd(), 'apps/backend/src'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "iayos_project.settings")
django.setup()

from accounts.models import Accounts, Profile, Wallet, Job, JobApplication, Transaction
from profiles.models import Conversation
from django.contrib.auth.hashers import make_password

def run():
    # 1. Get worker
    worker_acc = Accounts.objects.get(email="test.withdraw.worker@example.com")
    worker_profile = Profile.objects.filter(accountFK=worker_acc, profileType='WORKER').first()
    
    # 2. Create client
    client_acc, _ = Accounts.objects.get_or_create(
        email="test.client.5k@example.com",
        defaults={
            'password': make_password("Password123!"),
            'isVerified': True,
        }
    )
    client_profile, _ = Profile.objects.get_or_create(
        accountFK=client_acc,
        defaults={
            'profileType': 'CLIENT',
            'firstName': 'Test',
            'lastName': 'Client',
            'contactNum': '09171234568',
        }
    )
    
    # 3. Create or get Category
    category, _ = JobCategory.objects.get_or_create(
        name="General Services",
        defaults={'description': 'General test category'}
    )
    
    # 4. Create Job in COMPLETED state
    job = Job.objects.create(
        clientID=client_profile,
        title="Fix my plumbing (5k dummy job)",
        description="This is a test job with a 5000 budget, automatically set to completed for feedback phase testing.",
        budget=Decimal("5000.00"),
        jobType="LISTING",
        status="COMPLETED",
        categoryID=category,
        urgencyLevel="MEDIUM",
        assignedWorkerID=worker_profile,
        workerMarkedComplete=True,
        clientMarkedComplete=True,
        clientConfirmedWorkStarted=True,
        workerReviewed=False,
        clientReviewed=False,
        location="123 Test St, Zamboanga City"
    )
    
    # 5. Create Job Application (ACCEPTED)
    app = JobApplication.objects.create(
        jobID=job,
        workerID=worker_profile,
        status="ACCEPTED",
        proposal="I can do this 5k job perfectly!"
    )
    
    # 6. Create Transaction (to show escrow released / payment made)
    Transaction.objects.create(
        walletID=worker_acc.wallet,
        transactionType="PAYMENT",
        amount=Decimal("5000.00"),
        status="COMPLETED",
        description=f"Payment for job: {job.title}",
        relatedJob=job
    )

    # Note: Adding funds to pendingEarnings
    # For completion "to the feedback phase", typically funds are placed in pendingEarnings waiting for the 7-day buffer.
    wallet = worker_acc.wallet
    wallet.pendingEarnings += Decimal("5000.00")
    wallet.save()

    # 7. Create Conversation so feedback/messages load correctly
    conv, _ = Conversation.objects.get_or_create(
        relatedJobPosting=job,
        defaults={
            'client': client_profile,
            'worker': worker_profile,
            'status': 'ACTIVE'
        }
    )
    
    print(f"✅ Successfully created completed 5k job!")
    print(f"Job ID: {job.jobID}")
    print(f"Title: {job.title}")
    print(f"Client Email: {client_acc.email}")
    print(f"Worker Wallet pendingEarnings: {wallet.pendingEarnings}")

if __name__ == "__main__":
    run()
#!/usr/bin/env python3
"""Set workers as KYC verified for testing purposes"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
sys.path.insert(0, '/app/apps/backend/src')
django.setup()

from accounts.models import WorkerProfile, Accounts

print("Setting all workers as KYC verified for testing...\n")

workers = WorkerProfile.objects.select_related('profileID__accountFK').all()

for worker in workers:
    account = worker.profileID.accountFK
    name = f"{worker.profileID.firstName} {worker.profileID.lastName}"
    
    if not account.KYCVerified:
        account.KYCVerified = True
        account.save()
        print(f"✅ Set worker ID {worker.id} ({name}) as KYC verified")
    else:
        print(f"✓  Worker ID {worker.id} ({name}) already KYC verified")

print(f"\n✅ All {workers.count()} workers are now KYC verified!")
print("\n📱 Refresh the mobile app to see all workers in the home page")

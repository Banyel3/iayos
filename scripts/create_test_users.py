"""Create test users for job flow testing"""
import os
import sys
import django

# Add the src directory to the path
sys.path.insert(0, '/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import Accounts, Profile
from django.contrib.auth.hashers import make_password

def create_test_users():
    # Create client account
    client, created = Accounts.objects.get_or_create(
        email='testclient@iayos.com',
        defaults={
            'password': make_password('Test123!'),
            'isActive': True,
            'isVerified': True,
            'is_email_verified': True
        }
    )
    if created:
        Profile.objects.create(
            accountFK=client,
            profileType='CLIENT',
            firstName='Test',
            lastName='Client',
            contactNumber='09171234567'
        )
        print(f'Created client: {client.email}')
    else:
        print(f'Client exists: {client.email}')

    # Create worker account
    worker, created = Accounts.objects.get_or_create(
        email='testworker@iayos.com',
        defaults={
            'password': make_password('Test123!'),
            'isActive': True,
            'isVerified': True,
            'is_email_verified': True
        }
    )
    if created:
        Profile.objects.create(
            accountFK=worker,
            profileType='WORKER',
            firstName='Test',
            lastName='Worker',
            contactNumber='09177654321',
            hourlyRate=500
        )
        print(f'Created worker: {worker.email}')
    else:
        # Ensure worker has profile
        if not Profile.objects.filter(accountFK=worker).exists():
            Profile.objects.create(
                accountFK=worker,
                profileType='WORKER',
                firstName='Test',
                lastName='Worker',
                contactNumber='09177654321',
                hourlyRate=500
            )
            print(f'Created worker profile for: {worker.email}')
        else:
            print(f'Worker exists: {worker.email}')

    print('\nTest credentials:')
    print('Client: testclient@iayos.com / Test123!')
    print('Worker: testworker@iayos.com / Test123!')

if __name__ == '__main__':
    create_test_users()

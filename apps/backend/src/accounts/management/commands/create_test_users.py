import os
from django.core.management.base import BaseCommand
from accounts.models import Accounts, Profile


class Command(BaseCommand):
    help = 'Create test users (worker and client) from environment variables for E2E testing'

    def handle(self, *args, **options):
        # Test Worker User
        worker_email = os.getenv('TEST_WORKER_EMAIL')
        worker_password = os.getenv('TEST_WORKER_PASSWORD')
        
        # Test Client User
        client_email = os.getenv('TEST_CLIENT_EMAIL')
        client_password = os.getenv('TEST_CLIENT_PASSWORD')
        
        created_count = 0
        
        # Create Worker Test User
        if worker_email and worker_password:
            created_count += self._create_test_user(
                email=worker_email,
                password=worker_password,
                profile_type='WORKER',
                first_name='Test',
                last_name='Worker'
            )
        else:
            self.stdout.write(self.style.WARNING(
                'TEST_WORKER_EMAIL and TEST_WORKER_PASSWORD not set. Skipping worker test user.'
            ))
        
        # Create Client Test User
        if client_email and client_password:
            created_count += self._create_test_user(
                email=client_email,
                password=client_password,
                profile_type='CLIENT',
                first_name='Test',
                last_name='Client'
            )
        else:
            self.stdout.write(self.style.WARNING(
                'TEST_CLIENT_EMAIL and TEST_CLIENT_PASSWORD not set. Skipping client test user.'
            ))
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS(
                f'✓ Created {created_count} test user(s)'
            ))
        else:
            self.stdout.write(self.style.NOTICE(
                'No new test users created (may already exist or env vars not set)'
            ))

    def _create_test_user(self, email: str, password: str, profile_type: str, first_name: str, last_name: str) -> int:
        """Create a test user with profile. Returns 1 if created, 0 if exists."""
        
        # Check if user already exists
        if Accounts.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(
                f'Test user {email} ({profile_type}) already exists. Skipping.'
            ))
            return 0
        
        try:
            # Create account
            account = Accounts.objects.create_user(
                email=email,
                password=password
            )
            # Mark as verified (test users are pre-verified)
            account.isVerified = True
            account.save()
            
            # Create profile
            Profile.objects.create(
                accountFK=account,
                profileType=profile_type,
                firstName=first_name,
                lastName=last_name,
                displayName=f'{first_name} {last_name}',
                phoneNumber='+639000000000',  # Placeholder phone
                isPhoneVerified=True,
            )
            
            self.stdout.write(self.style.SUCCESS(
                f'✓ Created test user: {email} ({profile_type})'
            ))
            return 1
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'✗ Failed to create test user {email}: {str(e)}'
            ))
            return 0

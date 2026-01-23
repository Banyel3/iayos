import os
from django.core.management.base import BaseCommand
from accounts.models import Accounts


class Command(BaseCommand):
    help = 'Create admin user from environment variables'

    def handle(self, *args, **options):
        admin_email = os.getenv('ADMIN_EMAIL')
        admin_password = os.getenv('ADMIN_PASSWORD')
        
        if not admin_email or not admin_password:
            self.stdout.write(self.style.WARNING(
                'ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set. Skipping admin creation.'
            ))
            return
        
        # Check if admin already exists
        if Accounts.objects.filter(email=admin_email).exists():
            self.stdout.write(self.style.SUCCESS(
                f'Admin user {admin_email} already exists. Skipping.'
            ))
            return
        
        # Create superuser
        try:
            admin = Accounts.objects.create_superuser(
                email=admin_email,
                password=admin_password
            )
            self.stdout.write(self.style.SUCCESS(
                f'✓ Successfully created admin user: {admin_email}'
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'✗ Failed to create admin user: {str(e)}'
            ))

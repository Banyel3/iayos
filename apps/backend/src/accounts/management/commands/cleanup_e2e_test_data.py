"""
Django management command to clean up E2E test data from database.

This command safely removes test accounts and all associated data created
during E2E testing to prevent database bloat in production.

Usage:
    python manage.py cleanup_e2e_test_data [--dry-run]
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import Accounts, Profile
from jobs.models import Jobs, JobApplications
from profiles.models import WorkerProfile, ClientProfile


class Command(BaseCommand):
    help = 'Clean up E2E test data (test accounts and associated records)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Delete specific test account by email (default: all test accounts)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        specific_email = options.get('email')

        # Define test account emails
        test_emails = [
            'client@test.com',
            'worker@test.com',
        ]

        if specific_email:
            test_emails = [specific_email]

        self.stdout.write(self.style.WARNING(
            '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        ))
        self.stdout.write(self.style.WARNING('  E2E Test Data Cleanup'))
        self.stdout.write(self.style.WARNING(
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
        ))

        if dry_run:
            self.stdout.write(self.style.NOTICE('🔍 DRY RUN MODE - No data will be deleted\n'))
        else:
            self.stdout.write(self.style.ERROR('⚠️  LIVE MODE - Data WILL BE DELETED!\n'))

        # Find test accounts
        test_accounts = Accounts.objects.filter(email__in=test_emails)
        
        if not test_accounts.exists():
            self.stdout.write(self.style.SUCCESS('✅ No test accounts found - database is clean!'))
            return

        self.stdout.write(f'Found {test_accounts.count()} test account(s):\n')
        
        total_deleted = {
            'accounts': 0,
            'profiles': 0,
            'worker_profiles': 0,
            'client_profiles': 0,
            'jobs': 0,
            'applications': 0,
        }

        for account in test_accounts:
            self.stdout.write(f'\n📧 Processing: {account.email}')
            
            try:
                profile = Profile.objects.get(accountFK=account)
                profile_type = profile.profileType
                
                # Count associated data
                if profile_type == 'WORKER':
                    worker_profile = WorkerProfile.objects.filter(profileID=profile).first()
                    if worker_profile:
                        applications_count = JobApplications.objects.filter(
                            workerProfileFK=worker_profile
                        ).count()
                        self.stdout.write(f'   - Worker profile with {applications_count} job application(s)')
                        total_deleted['applications'] += applications_count
                        total_deleted['worker_profiles'] += 1
                
                elif profile_type == 'CLIENT':
                    client_profile = ClientProfile.objects.filter(profileID=profile).first()
                    if client_profile:
                        jobs_count = Jobs.objects.filter(clientProfileFK=client_profile).count()
                        self.stdout.write(f'   - Client profile with {jobs_count} job posting(s)')
                        total_deleted['jobs'] += jobs_count
                        total_deleted['client_profiles'] += 1
                
                total_deleted['profiles'] += 1
                
            except Profile.DoesNotExist:
                self.stdout.write('   - No profile found')
            
            total_deleted['accounts'] += 1

        # Show summary
        self.stdout.write(self.style.WARNING('\n' + '='*50))
        self.stdout.write(self.style.WARNING('DELETION SUMMARY:'))
        self.stdout.write(self.style.WARNING('='*50))
        for key, count in total_deleted.items():
            if count > 0:
                self.stdout.write(f'  {key.replace("_", " ").title()}: {count}')

        if dry_run:
            self.stdout.write(self.style.NOTICE(
                '\n✅ Dry run complete - no data was deleted'
            ))
            self.stdout.write(self.style.NOTICE(
                'Run without --dry-run to actually delete this data'
            ))
            return

        # Confirm deletion
        self.stdout.write(self.style.ERROR(
            '\n⚠️  This will PERMANENTLY DELETE the above data!'
        ))
        confirm = input('Type "DELETE" to confirm: ')
        
        if confirm != 'DELETE':
            self.stdout.write(self.style.WARNING('❌ Deletion cancelled'))
            return

        # Perform deletion in transaction
        self.stdout.write('\n🗑️  Deleting data...')
        
        try:
            with transaction.atomic():
                # Delete accounts (CASCADE will handle related data)
                deleted_count = test_accounts.delete()[0]
                
                self.stdout.write(self.style.SUCCESS(
                    f'\n✅ Successfully deleted {deleted_count} account(s) and all associated data'
                ))
                
                self.stdout.write(self.style.SUCCESS(
                    '\nDatabase cleanup complete! 🎉'
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'\n❌ Error during deletion: {str(e)}'
            ))
            raise

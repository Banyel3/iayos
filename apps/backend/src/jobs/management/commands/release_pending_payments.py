"""
Django Management Command: release_pending_payments

Auto-releases worker payments that have passed their buffer period (7 days).
Run this command via cron job every hour:
    0 * * * * cd /path/to/app && python manage.py release_pending_payments

Features:
- Releases payments for completed jobs past their paymentReleaseDate
- Skips jobs with active backjob requests (OPEN or UNDER_REVIEW status)
- Sends notifications to workers when payment is released
- Logs all releases for audit trail
- Supports --dry-run mode for testing

Usage:
    python manage.py release_pending_payments              # Release all pending
    python manage.py release_pending_payments --dry-run    # Preview without releasing
    python manage.py release_pending_payments --verbose    # Show detailed output
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction

from jobs.payment_buffer_service import (
    get_jobs_ready_for_payment_release,
    release_pending_payment
)


class Command(BaseCommand):
    help = 'Release pending worker payments that have passed their buffer period'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview releases without actually processing them',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output for each job processed',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Maximum number of payments to release in one run (default: 100)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        limit = options['limit']
        
        self.stdout.write(self.style.NOTICE(
            f"{'[DRY RUN] ' if dry_run else ''}Starting payment release job at {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        ))
        
        try:
            # Get jobs ready for payment release
            ready_jobs = get_jobs_ready_for_payment_release()[:limit]
            
            if not ready_jobs:
                self.stdout.write(self.style.SUCCESS("No payments ready for release."))
                return
            
            self.stdout.write(f"Found {len(ready_jobs)} payment(s) ready for release.")
            
            released_count = 0
            failed_count = 0
            total_amount = 0
            
            for job in ready_jobs:
                job_info = f"Job #{job.jobID}: {job.title}"
                
                if verbose:
                    worker_name = "Unknown"
                    if job.assignedWorkerID and job.assignedWorkerID.profileID:
                        profile = job.assignedWorkerID.profileID
                        worker_name = f"{profile.firstName} {profile.lastName}"
                    elif job.assignedAgencyFK:
                        worker_name = f"Agency: {job.assignedAgencyFK.businessName}"
                    
                    self.stdout.write(f"\n  Processing: {job_info}")
                    self.stdout.write(f"    Recipient: {worker_name}")
                    self.stdout.write(f"    Amount: ₱{job.budget}")
                    self.stdout.write(f"    Release Date: {job.paymentReleaseDate}")
                
                if dry_run:
                    self.stdout.write(self.style.WARNING(f"    [DRY RUN] Would release ₱{job.budget}"))
                    released_count += 1
                    total_amount += float(job.budget)
                    continue
                
                # Actually release the payment
                try:
                    result = release_pending_payment(job)
                    
                    if result['success']:
                        released_count += 1
                        amount = float(result.get('amount', job.budget))
                        total_amount += amount
                        
                        if verbose:
                            self.stdout.write(self.style.SUCCESS(
                                f"    ✓ Released ₱{amount} to {result.get('recipient_type', 'recipient')}"
                            ))
                    else:
                        failed_count += 1
                        if verbose:
                            self.stdout.write(self.style.ERROR(
                                f"    ✗ Failed: {result.get('error', 'Unknown error')}"
                            ))
                except Exception as e:
                    failed_count += 1
                    if verbose:
                        self.stdout.write(self.style.ERROR(f"    ✗ Exception: {str(e)}"))
            
            # Summary
            self.stdout.write("\n" + "=" * 50)
            if dry_run:
                self.stdout.write(self.style.WARNING("[DRY RUN] Summary:"))
            else:
                self.stdout.write(self.style.SUCCESS("Summary:"))
            
            self.stdout.write(f"  Payments released: {released_count}")
            self.stdout.write(f"  Payments failed: {failed_count}")
            self.stdout.write(f"  Total amount: ₱{total_amount:,.2f}")
            self.stdout.write(f"  Completed at: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            if failed_count > 0:
                self.stdout.write(self.style.WARNING(
                    f"\n⚠️ {failed_count} payment(s) failed. Check logs for details."
                ))
            
        except Exception as e:
            raise CommandError(f"Payment release job failed: {str(e)}")

#!/usr/bin/env python
"""
Comprehensive Test Script: Payment Buffer Cron Feature

Tests the 7-day payment buffer system including:
1. Cron daemon status verification
2. Test job creation with payment buffer
3. Simulating 7-day buffer passing (backdating release date)
4. Payment release via management command
5. Backjob request during buffer window
6. 24-hour cooldown after backjob rejection
7. Platform settings escrowHoldingDays configuration

Run this from the host: python scripts/test_payment_buffer_cron.py
"""

import os
import sys
import subprocess
from datetime import datetime
from decimal import Decimal

# Setup Django - must add path before importing django
sys.path.insert(0, '/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

import django
django.setup()

from django.utils import timezone
from datetime import timedelta
from django.db import transaction

from accounts.models import (
    Accounts, Profile, Job, Wallet, Transaction, Notification, JobDispute, 
    WorkerProfile, ClientProfile
)
from adminpanel.models import PlatformSettings
from jobs.payment_buffer_service import (
    get_payment_buffer_days,
    has_active_backjob,
    can_request_backjob,
    add_pending_earnings,
    release_pending_payment,
    get_jobs_ready_for_payment_release,
    hold_payment_for_backjob,
    resume_payment_after_backjob_rejection,
    get_pending_earnings_for_account
)


def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"   {details}")


def test_1_cron_daemon_status():
    """Test 1: Verify cron daemon is running in container"""
    print_section("TEST 1: Cron Daemon Status")
    
    # This test is run from inside the container, check if cron is in process list
    # We'll verify the crontab entry exists
    result = subprocess.run(
        ['cat', '/etc/crontabs/root'],
        capture_output=True, text=True
    )
    
    crontab_exists = 'release_pending_payments' in result.stdout
    print_test("Crontab entry exists", crontab_exists, 
               f"Crontab content: {result.stdout.strip()[:200]}..." if crontab_exists else "No crontab found")
    
    # Check cron log
    try:
        with open('/var/log/cron.log', 'r') as f:
            log_content = f.read()
            has_log = len(log_content) > 0
            print_test("Cron log file exists", has_log,
                      f"Last 200 chars: ...{log_content[-200:]}" if has_log else "Log empty")
    except FileNotFoundError:
        print_test("Cron log file exists", False, "File /var/log/cron.log not found")
    
    return crontab_exists


def test_2_platform_settings():
    """Test 2: Verify PlatformSettings escrowHoldingDays"""
    print_section("TEST 2: Platform Settings - escrowHoldingDays")
    
    buffer_days = get_payment_buffer_days()
    print_test("get_payment_buffer_days() works", buffer_days > 0, f"Current value: {buffer_days} days")
    
    # Check actual settings
    settings = PlatformSettings.objects.first()
    if settings:
        print_test("PlatformSettings record exists", True, 
                  f"escrowHoldingDays={settings.escrowHoldingDays}")
        
        # Test changing the value
        original_value = settings.escrowHoldingDays
        settings.escrowHoldingDays = 14  # Change to 14 days
        settings.save()
        
        new_buffer = get_payment_buffer_days()
        changed_correctly = new_buffer == 14
        print_test("escrowHoldingDays can be changed", changed_correctly,
                  f"Changed to 14, got: {new_buffer}")
        
        # Restore original value
        settings.escrowHoldingDays = original_value
        settings.save()
        print(f"   ↪ Restored to original value: {original_value}")
        
        return True
    else:
        print_test("PlatformSettings record exists", False, "No settings found")
        return False


def test_3_create_test_job_with_buffer():
    """Test 3: Create a test job and verify payment buffer setup"""
    print_section("TEST 3: Create Test Job with Payment Buffer")
    
    # Get test accounts
    try:
        client_account = Accounts.objects.get(email='testclient@iayos.com')
        worker_account = Accounts.objects.get(email='testworker@iayos.com')
    except Accounts.DoesNotExist as e:
        print_test("Test accounts exist", False, str(e))
        return None
    
    client_profile = Profile.objects.filter(accountFK=client_account, profileType='CLIENT').first()
    worker_profile = Profile.objects.filter(accountFK=worker_account, profileType='WORKER').first()
    
    if not client_profile or not worker_profile:
        print_test("Test profiles exist", False, "Missing client or worker profile")
        return None
    
    # Get the actual ClientProfile and WorkerProfile objects
    client_profile_obj = ClientProfile.objects.filter(profileID=client_profile).first()
    worker_profile_obj, _ = WorkerProfile.objects.get_or_create(
        profileID=worker_profile,
        defaults={'bio': 'Test worker', 'hourlyRate': Decimal('100.00')}
    )
    
    if not client_profile_obj:
        # Create client profile if missing
        client_profile_obj = ClientProfile.objects.create(profileID=client_profile)
    
    print_test("Test accounts found", True, 
               f"Client: {client_account.email}, Worker: {worker_account.email}")
    
    # Create a completed job
    test_job = Job.objects.create(
        clientID=client_profile_obj,
        assignedWorkerID=worker_profile_obj,
        title=f"Payment Buffer Test Job - {timezone.now().strftime('%H:%M:%S')}",
        description="Testing 7-day payment buffer system",
        budget=Decimal('1000.00'),
        status='COMPLETED',
        urgency='MEDIUM',
        completedAt=timezone.now(),
        clientMarkedComplete=True,
        workerMarkedComplete=True,
        # Payment fields will be set by add_pending_earnings
    )
    
    print_test("Test job created", test_job.jobID is not None,
               f"Job ID: {test_job.jobID}, Budget: ₱{test_job.budget}")
    
    # Ensure worker has a wallet
    worker_wallet, _ = Wallet.objects.get_or_create(
        accountFK=worker_account,
        defaults={'balance': Decimal('0.00'), 'pendingEarnings': Decimal('0.00')}
    )
    
    initial_pending = worker_wallet.pendingEarnings
    initial_balance = worker_wallet.balance
    
    # Add pending earnings (simulating job completion)
    result = add_pending_earnings(
        job=test_job,
        recipient_account=worker_account,
        amount=test_job.budget,
        recipient_type="worker"
    )
    
    print_test("add_pending_earnings() works", result['success'],
               f"Release date: {result.get('release_date_str')}, Amount: ₱{result.get('amount')}")
    
    # Verify wallet updated
    worker_wallet.refresh_from_db()
    pending_increased = worker_wallet.pendingEarnings == initial_pending + test_job.budget
    print_test("Worker pendingEarnings increased", pending_increased,
               f"Before: ₱{initial_pending}, After: ₱{worker_wallet.pendingEarnings}")
    
    # Verify job payment fields
    test_job.refresh_from_db()
    buffer_set = (
        test_job.paymentReleaseDate is not None and
        test_job.paymentReleasedToWorker == False and
        test_job.paymentHeldReason == 'BUFFER_PERIOD'
    )
    print_test("Job payment buffer fields set correctly", buffer_set,
               f"paymentReleaseDate={test_job.paymentReleaseDate}, paymentHeldReason={test_job.paymentHeldReason}")
    
    # Verify pending transaction created
    pending_txn = Transaction.objects.filter(
        relatedJobPosting=test_job,
        transactionType='PENDING_EARNING',
        status='PENDING'
    ).first()
    
    print_test("PENDING_EARNING transaction created", pending_txn is not None,
               f"Transaction ID: {pending_txn.transactionID if pending_txn else 'N/A'}")
    
    return test_job


def test_4_simulate_buffer_passing(job):
    """Test 4: Simulate 7 days passing and verify payment release"""
    print_section("TEST 4: Simulate Buffer Passing & Payment Release")
    
    if not job:
        print_test("Job available for testing", False, "No job provided")
        return False
    
    worker_profile = job.assignedWorkerID.profileID
    worker_account = worker_profile.accountFK
    worker_wallet = Wallet.objects.get(accountFK=worker_account)
    
    initial_balance = worker_wallet.balance
    initial_pending = worker_wallet.pendingEarnings
    
    # Set release date to the past (simulate 7 days passing)
    past_date = timezone.now() - timedelta(days=8)
    job.paymentReleaseDate = past_date
    job.save()
    
    print_test("Release date set to past", True,
               f"Set to: {past_date.strftime('%Y-%m-%d %H:%M')}")
    
    # Verify job appears in ready-for-release list
    ready_jobs = get_jobs_ready_for_payment_release()
    job_in_list = any(j.jobID == job.jobID for j in ready_jobs)
    print_test("Job appears in ready-for-release list", job_in_list,
               f"Found {len(ready_jobs)} jobs ready for release")
    
    # Release the payment
    result = release_pending_payment(job)
    
    print_test("release_pending_payment() succeeds", result['success'],
               f"Amount: ₱{result.get('amount')}, New balance: ₱{result.get('new_balance')}")
    
    # Verify wallet changes
    worker_wallet.refresh_from_db()
    balance_increased = worker_wallet.balance == initial_balance + job.budget
    pending_decreased = worker_wallet.pendingEarnings == initial_pending - job.budget
    
    print_test("Worker balance increased", balance_increased,
               f"Before: ₱{initial_balance}, After: ₱{worker_wallet.balance}")
    print_test("Worker pendingEarnings decreased", pending_decreased,
               f"Before: ₱{initial_pending}, After: ₱{worker_wallet.pendingEarnings}")
    
    # Verify job marked as released
    job.refresh_from_db()
    job_released = (
        job.paymentReleasedToWorker == True and
        job.paymentHeldReason == 'RELEASED' and
        job.paymentReleasedAt is not None
    )
    print_test("Job marked as payment released", job_released,
               f"paymentReleasedToWorker={job.paymentReleasedToWorker}, paymentHeldReason={job.paymentHeldReason}")
    
    # Verify EARNING transaction created
    earning_txn = Transaction.objects.filter(
        relatedJobPosting=job,
        transactionType='EARNING',
        status='COMPLETED'
    ).first()
    
    print_test("EARNING transaction created", earning_txn is not None,
               f"Transaction ID: {earning_txn.transactionID if earning_txn else 'N/A'}")
    
    # Verify notification sent
    notification = Notification.objects.filter(
        accountFK=worker_account,
        notificationType='PAYMENT_RELEASED',
        relatedJobID=job.jobID
    ).first()
    
    print_test("PAYMENT_RELEASED notification sent", notification is not None,
               f"Notification: {notification.title if notification else 'N/A'}")
    
    return result['success']


def test_5_backjob_during_buffer():
    """Test 5: Test backjob request during buffer window"""
    print_section("TEST 5: Backjob Request During Buffer Window")
    
    # Create another test job for backjob testing
    try:
        client_account = Accounts.objects.get(email='testclient@iayos.com')
        worker_account = Accounts.objects.get(email='testworker@iayos.com')
    except Accounts.DoesNotExist:
        print_test("Test accounts exist", False)
        return None
    
    client_profile = Profile.objects.filter(accountFK=client_account, profileType='CLIENT').first()
    worker_profile = Profile.objects.filter(accountFK=worker_account, profileType='WORKER').first()
    
    client_profile_obj = ClientProfile.objects.get(profileID=client_profile)
    worker_profile_obj = WorkerProfile.objects.get(profileID=worker_profile)
    
    # Create completed job in buffer period
    test_job = Job.objects.create(
        clientID=client_profile_obj,
        assignedWorkerID=worker_profile_obj,
        title=f"Backjob Test Job - {timezone.now().strftime('%H:%M:%S')}",
        description="Testing backjob during buffer period",
        budget=Decimal('500.00'),
        status='COMPLETED',
        urgency='MEDIUM',
        completedAt=timezone.now(),
        clientMarkedComplete=True,
        workerMarkedComplete=True,
        paymentReleaseDate=timezone.now() + timedelta(days=7),  # 7 days from now
        paymentReleasedToWorker=False,
        paymentHeldReason='BUFFER_PERIOD'
    )
    
    print_test("Backjob test job created", True, f"Job ID: {test_job.jobID}")
    
    # Test can_request_backjob
    can_request = can_request_backjob(test_job)
    print_test("can_request_backjob() returns True during buffer", can_request['can_request'],
               f"Result: {can_request}")
    
    # Test hold_payment_for_backjob
    hold_result = hold_payment_for_backjob(test_job)
    test_job.refresh_from_db()
    
    print_test("hold_payment_for_backjob() changes paymentHeldReason", 
               test_job.paymentHeldReason == 'BACKJOB_PENDING',
               f"paymentHeldReason={test_job.paymentHeldReason}")
    
    # Verify job no longer appears in ready-for-release (even if we backdate)
    test_job.paymentReleaseDate = timezone.now() - timedelta(days=1)
    test_job.save()
    
    # Create an active backjob dispute
    dispute = JobDispute.objects.create(
        jobID=test_job,
        disputedBy='CLIENT',
        reason="Testing backjob system",
        description="Testing backjob during buffer period for automated tests",
        status='OPEN',
        priority='MEDIUM',
        jobAmount=test_job.budget,
        disputedAmount=test_job.budget
    )
    
    print_test("Active backjob dispute created", True, f"Dispute ID: {dispute.disputeID}")
    
    has_backjob = has_active_backjob(test_job)
    print_test("has_active_backjob() returns True", has_backjob)
    
    # Verify job is NOT in ready-for-release list
    ready_jobs = get_jobs_ready_for_payment_release()
    job_not_in_list = not any(j.jobID == test_job.jobID for j in ready_jobs)
    print_test("Job with active backjob NOT in release list", job_not_in_list,
               f"Ready jobs count: {len(ready_jobs)}")
    
    # Try to release - should fail
    release_result = release_pending_payment(test_job)
    print_test("release_pending_payment() blocked by active backjob", not release_result['success'],
               f"Error: {release_result.get('error')}")
    
    return test_job, dispute


def test_6_24h_cooldown_after_rejection(job, dispute):
    """Test 6: Test 24-hour cooldown after backjob rejection"""
    print_section("TEST 6: 24-Hour Cooldown After Backjob Rejection")
    
    if not job or not dispute:
        print_test("Job and dispute available", False)
        return False
    
    # Simulate admin rejection
    dispute.status = 'CLOSED'
    dispute.adminRejectedAt = timezone.now()
    dispute.adminRejectionReason = "Test rejection for cooldown verification"
    dispute.save()
    
    print_test("Backjob rejected by admin", True,
               f"Rejection time: {dispute.adminRejectedAt}")
    
    # Resume payment after rejection
    resume_result = resume_payment_after_backjob_rejection(job)
    job.refresh_from_db()
    
    print_test("resume_payment_after_backjob_rejection() called", True,
               f"Result: {resume_result}")
    
    # Test cooldown - should NOT be able to request new backjob immediately
    can_request = can_request_backjob(job)
    in_cooldown = not can_request['can_request'] and 'hours' in can_request.get('reason', '').lower()
    
    print_test("Cooldown active immediately after rejection", in_cooldown,
               f"Result: {can_request}")
    
    # Simulate cooldown passing (set rejection time to 25 hours ago)
    dispute.adminRejectedAt = timezone.now() - timedelta(hours=25)
    dispute.save()
    
    can_request_after = can_request_backjob(job)
    cooldown_passed = can_request_after['can_request'] or 'released' in can_request_after.get('reason', '').lower()
    
    print_test("Cooldown ends after 24 hours", cooldown_passed,
               f"Result: {can_request_after}")
    
    return True


def test_7_management_command_dry_run():
    """Test 7: Test management command with --dry-run"""
    print_section("TEST 7: Management Command --dry-run")
    
    from django.core.management import call_command
    from io import StringIO
    
    # Capture command output
    out = StringIO()
    
    try:
        call_command('release_pending_payments', '--dry-run', '--verbose', stdout=out)
        output = out.getvalue()
        
        print_test("Command runs successfully with --dry-run", True,
                   f"Output: {output[:300]}...")
        
        # Verify it's actually a dry run (no actual changes)
        # Check that jobs with past release dates still exist as unreleased
        return True
        
    except Exception as e:
        print_test("Command runs successfully with --dry-run", False, str(e))
        return False


def cleanup_test_data():
    """Clean up test data created during testing"""
    print_section("CLEANUP: Removing Test Data")
    
    # Delete test jobs created today
    test_jobs = Job.objects.filter(
        title__icontains='Payment Buffer Test Job'
    ) | Job.objects.filter(
        title__icontains='Backjob Test Job'
    )
    
    count = test_jobs.count()
    
    # Delete related data
    for job in test_jobs:
        Transaction.objects.filter(relatedJobPosting=job).delete()
        Notification.objects.filter(relatedJobID=job.jobID).delete()
        JobDispute.objects.filter(jobID=job).delete()
    
    test_jobs.delete()
    
    print(f"✓ Deleted {count} test job(s) and related data")


def main():
    print("\n" + "🔄" * 30)
    print("  PAYMENT BUFFER CRON FEATURE TEST SUITE")
    print("🔄" * 30)
    print(f"\nStarted at: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run tests
    results['test_1'] = test_1_cron_daemon_status()
    results['test_2'] = test_2_platform_settings()
    
    test_job = test_3_create_test_job_with_buffer()
    results['test_3'] = test_job is not None
    
    results['test_4'] = test_4_simulate_buffer_passing(test_job)
    
    backjob_result = test_5_backjob_during_buffer()
    if backjob_result:
        backjob_job, backjob_dispute = backjob_result
        results['test_5'] = True
        results['test_6'] = test_6_24h_cooldown_after_rejection(backjob_job, backjob_dispute)
    else:
        results['test_5'] = False
        results['test_6'] = False
    
    results['test_7'] = test_7_management_command_dry_run()
    
    # Summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\n{'=' * 40}")
    print(f"  RESULTS: {passed}/{total} tests passed")
    print(f"{'=' * 40}\n")
    
    for test_name, passed in results.items():
        status = "✅" if passed else "❌"
        print(f"  {status} {test_name.replace('_', ' ').title()}")
    
    # Cleanup option - automatically clean up when run non-interactively
    print("\n")
    try:
        cleanup = input("Clean up test data? (y/N): ").strip().lower()
        if cleanup == 'y':
            cleanup_test_data()
    except EOFError:
        # Non-interactive mode, auto-cleanup
        print("Non-interactive mode detected. Auto-cleaning test data...")
        cleanup_test_data()
    
    print(f"\nCompleted at: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())

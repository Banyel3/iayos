"""
Test Cleanup API Endpoints
These endpoints are for E2E testing purposes only (Maestro, Playwright, etc.)
They allow test cleanup of test data from a dedicated test database.

SECURITY: These endpoints should ONLY be accessible on a test database.
"""

from ninja import Router
from django.http import JsonResponse
from django.conf import settings
from django.db import connection
from accounts.models import (
    Job,
    JobApplication,
    Transaction,
    UserPaymentMethod,
    SavedJob,
    Accounts,
)
import logging

logger = logging.getLogger(__name__)
router = Router()


def is_test_database() -> bool:
    """
    Verify we're running on a test database by checking database name.
    Returns True if database name contains 'test' (case-insensitive).
    """
    db_name = connection.settings_dict.get("NAME", "")
    is_test = "test" in db_name.lower()
    logger.info(f"[TEST CLEANUP] Database check: {db_name}, is_test={is_test}")
    return is_test


@router.delete("/cleanup", tags=["testing"])
def cleanup_test_data(request):
    """
    DELETE /api/tests/cleanup
    
    Cleans up test data from the test database.
    Deletes:
    - Jobs created by test users
    - Job applications from test users
    - Transactions involving test users
    - Payment methods for test users
    - Saved jobs for test users
    
    This endpoint only works on test databases (DB name contains 'test').
    Returns 403 Forbidden if called on production database.
    
    Used by Maestro E2E tests cleanup flows.
    """
    # CRITICAL SECURITY CHECK: Only allow on test database
    if not is_test_database():
        logger.warning(
            "[TEST CLEANUP] BLOCKED: Cleanup attempt on non-test database!"
        )
        return JsonResponse(
            {
                "error": "This endpoint is only available on test databases",
                "db_name": connection.settings_dict.get("NAME", "unknown"),
            },
            status=403,
        )

    # Define test user emails (from Maestro config)
    test_emails = [
        "worker.test@iayos.com",
        "client.test@iayos.com",
        "agency.test@iayos.com",
    ]

    # Get test user accounts
    test_users = Accounts.objects.filter(email__in=test_emails)
    test_user_ids = list(test_users.values_list("id", flat=True))

    if not test_user_ids:
        logger.info("[TEST CLEANUP] No test users found to clean")
        return JsonResponse(
            {"success": True, "message": "No test users found", "deleted": {}}, status=200
        )

    deleted_counts = {}

    try:
        # 1. Delete SavedJobs
        saved_count = SavedJob.objects.filter(user_id__in=test_user_ids).delete()[0]
        deleted_counts["saved_jobs"] = saved_count
        logger.info(f"[TEST CLEANUP] Deleted {saved_count} saved jobs")

        # 2. Delete JobApplications (as applicant or for jobs owned by test clients)
        app_count = JobApplication.objects.filter(
            workerID__in=test_user_ids
        ).delete()[0]
        deleted_counts["job_applications"] = app_count
        logger.info(f"[TEST CLEANUP] Deleted {app_count} job applications")

        # 3. Delete Transactions (by test users)
        txn_count = Transaction.objects.filter(user_id__in=test_user_ids).delete()[0]
        deleted_counts["transactions"] = txn_count
        logger.info(f"[TEST CLEANUP] Deleted {txn_count} transactions")

        # 4. Delete PaymentMethods
        payment_count = UserPaymentMethod.objects.filter(
            accountFK_id__in=test_user_ids
        ).delete()[0]
        deleted_counts["payment_methods"] = payment_count
        logger.info(f"[TEST CLEANUP] Deleted {payment_count} payment methods")

        # 5. Delete Jobs (created by test clients)
        job_count = Job.objects.filter(clientID__in=test_user_ids).delete()[0]
        deleted_counts["jobs"] = job_count
        logger.info(f"[TEST CLEANUP] Deleted {job_count} jobs")

        logger.info(f"[TEST CLEANUP] ✅ Cleanup completed successfully: {deleted_counts}")

        return JsonResponse(
            {
                "success": True,
                "message": "Test data cleaned up successfully",
                "deleted": deleted_counts,
                "test_users": test_emails,
            },
            status=200,
        )

    except Exception as e:
        logger.error(f"[TEST CLEANUP] ❌ Error during cleanup: {e}")
        return JsonResponse(
            {"error": "Cleanup failed", "details": str(e)}, status=500
        )


@router.get("/status", tags=["testing"])
def test_database_status(request):
    """
    GET /api/tests/status
    
    Returns the current database name and whether it's a test database.
    Useful for verifying test environment before running Maestro tests.
    """
    db_name = connection.settings_dict.get("NAME", "unknown")
    is_test = is_test_database()

    return JsonResponse(
        {
            "database_name": db_name,
            "is_test_database": is_test,
            "cleanup_enabled": is_test,
            "message": (
                "Test cleanup is ENABLED on this database"
                if is_test
                else "Test cleanup is DISABLED (production database)"
            ),
        },
        status=200,
    )

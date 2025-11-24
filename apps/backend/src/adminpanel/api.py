from ninja import Router
# from .schemas import createAccountSchema, logInSchema, createAgencySchema, forgotPasswordSchema, resetPasswordSchema
# from .services import create_account_individ, create_account_agency, login_account, _verify_account, forgot_password_request, reset_password_verify, logout_account, refresh_token, fetch_currentUser, generateCookie
from ninja.responses import Response
from accounts.authentication import cookie_auth
from django.shortcuts import redirect
from django.urls import reverse
from .service import fetchAll_kyc, review_kyc_items, approve_kyc, reject_kyc, fetch_kyc_logs
from .service import approve_agency_kyc, reject_agency_kyc, get_admin_dashboard_stats
from .service import get_clients_list, get_workers_list, get_agencies_list
from .service import get_worker_detail, get_client_detail, get_agency_detail
from .service import get_jobs_list, get_job_applications_list, get_jobs_dashboard_stats
from .service import get_job_categories_list, get_job_disputes_list, get_disputes_dashboard_stats
from .service import get_all_reviews_list, get_job_reviews_list, get_reviews_dashboard_stats, get_flagged_reviews_list
from .account_actions import suspend_account, ban_account, activate_account, delete_account, get_account_status
from .payment_service import (
    get_transactions_list, get_transaction_statistics, get_transaction_detail,
    release_escrow, process_refund, get_escrow_payments, get_escrow_statistics,
    bulk_release_escrow, get_worker_earnings, get_worker_earnings_statistics,
    process_payout, get_disputes_list, get_dispute_detail, resolve_dispute,
    get_disputes_statistics, get_revenue_trends, get_payment_methods_breakdown,
    get_top_performers
)

router = Router(tags=["adminpanel"])


@router.get("/dashboard/stats")
def get_dashboard_stats(request):
    """Get comprehensive dashboard statistics."""
    try:
        stats = get_admin_dashboard_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        print(f"❌ Error in get_dashboard_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/kyc/all")
def get_all_kyc(request):
    try:
        data = fetchAll_kyc(request)
        return {"success": True, **data}
    except Exception as e:
        print(f"❌ Error in get_all_kyc: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
    
@router.post("/kyc/review")
def review_kyc(request):
    try:
        result = review_kyc_items(request)
        print(f"✅ Successfully generated signed URLs: {result}")
        return result
    except Exception as e:
        print(f"❌ Error in review_kyc: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
@router.post("/kyc/approve")
def approve_kyc_verification(request):
    try:
        result = approve_kyc(request)
        print(f"✅ Successfully approved KYC: {result}")
        return result
    except ValueError as e:
        print(f"❌ Validation error approving KYC: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error approving KYC Verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/kyc/approve-agency")
def approve_agency_kyc_verification(request):
    try:
        result = approve_agency_kyc(request)
        print(f"✅ Successfully approved Agency KYC: {result}")
        return result
    except ValueError as e:
        print(f"❌ Validation error approving Agency KYC: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error approving Agency KYC Verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@router.post("/kyc/reject")
def reject_kyc_verification(request):
    try:
        result = reject_kyc(request)
        print(f"✅ Successfully rejected KYC: {result}")
        return result
    except ValueError as e:
        print(f"❌ Validation error rejecting KYC: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error rejecting KYC Verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/kyc/reject-agency")
def reject_agency_kyc_verification(request):
    try:
        result = reject_agency_kyc(request)
        print(f"✅ Successfully rejected Agency KYC: {result}")
        return result
    except ValueError as e:
        print(f"❌ Validation error rejecting Agency KYC: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error rejecting Agency KYC Verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/kyc/create-agency")
def create_agency_kyc_from_paths(request):
    """Admin helper: create AgencyKYC and file records from already-uploaded Supabase paths.

    Expects JSON body: { accountID: int, businessName?: str, businessDesc?: str, files: { <FILE_TYPE>: <path>, ... } }
    FILE_TYPE values: BUSINESS_PERMIT, REP_ID_FRONT, REP_ID_BACK, ADDRESS_PROOF, AUTH_LETTER
    """
    import json
    try:
        body = json.loads(request.body.decode('utf-8'))
        account_id = body.get('accountID')
        businessName = body.get('businessName')
        businessDesc = body.get('businessDesc')
        files = body.get('files', {})

        if not account_id:
            return {"success": False, "error": "accountID is required"}

        from agency.services import create_agency_kyc_from_paths as svc
        result = svc(account_id, files, businessName=businessName, businessDesc=businessDesc)
        return {"success": True, **result}
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error in create_agency_kyc_from_paths: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@router.get("/kyc/logs")
def get_kyc_logs(request, action: str | None = None, limit: int = 100):
    """
    Get KYC audit logs with optional filtering.
    
    Query params:
    - action: Filter by "APPROVED" or "Rejected" (optional)
    - limit: Max number of logs to return (default 100, max 500)
    """
    try:
        # Validate limit
        if limit > 500:
            limit = 500
        
        result = fetch_kyc_logs(action_filter=action, limit=limit)
        print(f"✅ Successfully fetched {len(result)} KYC logs")
        return {"success": True, "logs": result, "count": len(result)}
    except Exception as e:
        print(f"❌ Error fetching KYC logs: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/users/clients")
def get_clients(request, page: int = 1, page_size: int = 50, search: str | None = None, status: str | None = None):
    """
    Get paginated list of client accounts.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 50)
    - search: Search by name or email
    - status: Filter by status (all, active, inactive)
    """
    try:
        result = get_clients_list(page=page, page_size=page_size, search=search, status_filter=status)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching clients: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/users/clients/{account_id}")
def get_client_by_id(request, account_id: str):
    """
    Get detailed information about a specific client.
    
    Path params:
    - account_id: The account ID of the client
    """
    try:
        client = get_client_detail(account_id)
        if client is None:
            return {"success": False, "error": "Client not found"}
        return {"success": True, "client": client}
    except Exception as e:
        print(f"❌ Error fetching client detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/users/workers")
def get_workers(request, page: int = 1, page_size: int = 50, search: str | None = None, status: str | None = None):
    """
    Get paginated list of worker accounts.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 50)
    - search: Search by name or email
    - status: Filter by status (all, active, inactive)
    """
    try:
        result = get_workers_list(page=page, page_size=page_size, search=search, status_filter=status)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching workers: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/users/workers/{account_id}")
def get_worker_by_id(request, account_id: str):
    """
    Get detailed information about a specific worker.
    
    Path params:
    - account_id: The account ID of the worker
    """
    try:
        worker = get_worker_detail(account_id)
        if worker is None:
            return {"success": False, "error": "Worker not found"}
        return {"success": True, "worker": worker}
    except Exception as e:
        print(f"❌ Error fetching worker detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/users/agencies")
def get_agencies(request, page: int = 1, page_size: int = 50, search: str | None = None, status: str | None = None):
    """
    Get paginated list of agency accounts.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 50)
    - search: Search by name or email
    - status: Filter by status (all, active, inactive)
    """
    try:
        result = get_agencies_list(page=page, page_size=page_size, search=search, status_filter=status)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching agencies: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/users/agencies/{account_id}")
def get_agency_by_id(request, account_id: str):
    """
    Get detailed information about a specific agency.
    
    Path params:
    - account_id: The account ID of the agency
    """
    try:
        agency = get_agency_detail(account_id)
        if agency is None:
            return {"success": False, "error": "Agency not found"}
        return {"success": True, "agency": agency}
    except Exception as e:
        print(f"❌ Error fetching agency detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# ==========================================
# JOBS MANAGEMENT ENDPOINTS
# ==========================================

@router.get("/jobs/dashboard-stats")
def get_jobs_dashboard_statistics(request):
    """
    Get statistics for jobs dashboard.
    """
    try:
        stats = get_jobs_dashboard_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        print(f"❌ Error fetching jobs dashboard stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/jobs/listings")
def get_job_listings(request, page: int = 1, page_size: int = 20, status: str | None = None, category_id: int | None = None):
    """
    Get paginated list of all job listings.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 20)
    - status: Filter by status (ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED)
    - category_id: Filter by category ID
    """
    try:
        result = get_jobs_list(page=page, page_size=page_size, status=status, category_id=category_id)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching jobs listings: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/jobs/listings/{job_id}")
def get_job_detail_endpoint(request, job_id: str):
    """
    Get detailed job information including timeline data.
    
    Path params:
    - job_id: Job ID
    """
    try:
        from adminpanel.service import get_job_detail
        job_detail = get_job_detail(job_id)
        return {"success": True, "data": job_detail}
    except Exception as e:
        print(f"❌ Error fetching job detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.delete("/jobs/listings/{job_id}", auth=cookie_auth)
def delete_job_endpoint(request, job_id: str):
    """
    Delete a job listing.
    
    Path params:
    - job_id: Job ID to delete
    """
    try:
        from adminpanel.service import delete_job
        result = delete_job(job_id)
        return result
    except Exception as e:
        print(f"❌ Error deleting job: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/jobs/applications")
def get_job_applications(request, page: int = 1, page_size: int = 20, status: str | None = None):
    """
    Get paginated list of all job applications.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 20)
    - status: Filter by status (PENDING, ACCEPTED, REJECTED, WITHDRAWN)
    """
    try:
        result = get_job_applications_list(page=page, page_size=page_size, status=status)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching job applications: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/jobs/categories")
def get_job_categories(request):
    """
    Get list of all job categories with statistics.
    """
    try:
        categories = get_job_categories_list()
        return {"success": True, "categories": categories}
    except Exception as e:
        print(f"❌ Error fetching job categories: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/jobs/disputes/stats")
def get_disputes_stats(request):
    """
    Get dispute statistics for the dashboard.
    """
    try:
        stats = get_disputes_dashboard_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        print(f"❌ Error fetching dispute stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/jobs/disputes")
def get_disputes(request, page: int = 1, page_size: int = 20, status: str | None = None, priority: str | None = None):
    """
    Get paginated list of job disputes.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 20)
    - status: Filter by status (OPEN, UNDER_REVIEW, RESOLVED, CLOSED)
    - priority: Filter by priority (LOW, MEDIUM, HIGH, CRITICAL)
    """
    try:
        result = get_job_disputes_list(page=page, page_size=page_size, status=status, priority=priority)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching disputes: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/reviews/stats")
def get_reviews_stats(request):
    """
    Get review statistics for the dashboard.
    """
    try:
        stats = get_reviews_dashboard_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        print(f"❌ Error fetching review stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/reviews/all")
def get_all_reviews(request, page: int = 1, page_size: int = 20, status: str | None = None, reviewer_type: str | None = None, min_rating: float | None = None):
    """
    Get paginated list of all general user reviews.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 20)
    - status: Filter by status (ACTIVE, FLAGGED, HIDDEN, DELETED)
    - reviewer_type: Filter by reviewer type (CLIENT, WORKER)
    - min_rating: Minimum rating filter (1.0 - 5.0)
    """
    try:
        result = get_all_reviews_list(page=page, page_size=page_size, status=status, reviewer_type=reviewer_type, min_rating=min_rating)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching all reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/reviews/by-job")
def get_reviews_by_job(request, page: int = 1, page_size: int = 20, status: str | None = None):
    """
    Get paginated list of reviews grouped by job.
    Shows both client and worker reviews for each completed job.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 20)
    - status: Filter by review status
    """
    try:
        result = get_job_reviews_list(page=page, page_size=page_size, status=status)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching job reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/reviews/flagged")
def get_flagged_reviews(request, page: int = 1, page_size: int = 20):
    """
    Get paginated list of flagged reviews.
    
    Query params:
    - page: Page number (default 1)
    - page_size: Items per page (default 20)
    """
    try:
        result = get_flagged_reviews_list(page=page, page_size=page_size)
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Error fetching flagged reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# =====================================================
# ACCOUNT MANAGEMENT ACTIONS
# =====================================================

@router.post("/users/{account_id}/suspend", auth=cookie_auth)
def suspend_user_account(request, account_id: str):
    """
    Suspend a user account temporarily.
    
    Body params:
    - reason: Reason for suspension
    """
    try:
        data = request.body if hasattr(request, 'body') else {}
        if isinstance(request.body, bytes):
            import json
            data = json.loads(request.body.decode('utf-8'))
        
        reason = data.get('reason', 'No reason provided')
        
        if not reason or not reason.strip():
            return {"success": False, "error": "Reason is required"}
        
        result = suspend_account(account_id, reason, request.auth)
        return result
        
    except Exception as e:
        print(f"❌ Error suspending account: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/users/{account_id}/ban", auth=cookie_auth)
def ban_user_account(request, account_id: str):
    """
    Ban a user account permanently.
    
    Body params:
    - reason: Reason for ban
    """
    try:
        data = request.body if hasattr(request, 'body') else {}
        if isinstance(request.body, bytes):
            import json
            data = json.loads(request.body.decode('utf-8'))
        
        reason = data.get('reason', 'No reason provided')
        
        if not reason or not reason.strip():
            return {"success": False, "error": "Reason is required"}
        
        result = ban_account(account_id, reason, request.auth)
        return result
        
    except Exception as e:
        print(f"❌ Error banning account: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/users/{account_id}/activate", auth=cookie_auth)
def activate_user_account(request, account_id: str):
    """
    Activate/reactivate a user account (remove suspension or ban).
    """
    try:
        result = activate_account(account_id, request.auth)
        return result
        
    except Exception as e:
        print(f"❌ Error activating account: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.delete("/users/{account_id}/delete", auth=cookie_auth)
def delete_user_account(request, account_id: str):
    """
    Soft delete a user account (mark as inactive/banned).
    """
    try:
        result = delete_account(account_id, request.auth)
        return result
        
    except Exception as e:
        print(f"❌ Error deleting account: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/users/{account_id}/status", auth=cookie_auth)
def get_user_account_status(request, account_id: str):
    """
    Get detailed account status information including suspension and ban status.
    """
    try:
        result = get_account_status(account_id)
        return result
        
    except Exception as e:
        print(f"❌ Error getting account status: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# ===============================
# Payment & Transaction Management
# ===============================

@router.get("/transactions/all", auth=cookie_auth)
def get_all_transactions(
    request,
    page: int = 1,
    limit: int = 50,
    status: str = None,
    payment_method: str = None,
    date_from: str = None,
    date_to: str = None,
    search: str = None
):
    """
    Get paginated list of all transactions with filtering.
    """
    try:
        result = get_transactions_list(
            page=page,
            limit=limit,
            status=status,
            payment_method=payment_method,
            date_from=date_from,
            date_to=date_to,
            search=search
        )
        return result
    except Exception as e:
        print(f"❌ Error in get_all_transactions: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/transactions/statistics", auth=cookie_auth)
def get_transactions_statistics(request):
    """
    Get overall transaction statistics.
    """
    try:
        result = get_transaction_statistics()
        return result
    except Exception as e:
        print(f"❌ Error in get_transactions_statistics: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/transactions/{transaction_id}/detail", auth=cookie_auth)
def get_transaction_details(request, transaction_id: int):
    """
    Get detailed information about a specific transaction.
    """
    try:
        result = get_transaction_detail(transaction_id)
        return result
    except Exception as e:
        print(f"❌ Error in get_transaction_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/transactions/{transaction_id}/release-escrow", auth=cookie_auth)
def release_escrow_payment(request, transaction_id: int):
    """
    Release escrow payment to worker.
    """
    try:
        body = request.data if hasattr(request, 'data') else {}
        reason = body.get('reason', None)
        result = release_escrow(transaction_id, reason)
        return result
    except Exception as e:
        print(f"❌ Error in release_escrow_payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/transactions/{transaction_id}/refund", auth=cookie_auth)
def refund_transaction(request, transaction_id: int):
    """
    Process refund for a transaction.
    """
    try:
        body = request.data if hasattr(request, 'data') else {}
        amount = body.get('amount')
        reason = body.get('reason')
        refund_to = body.get('refund_to', 'WALLET')
        
        if not amount or not reason:
            return {"success": False, "error": "Amount and reason are required"}
        
        result = process_refund(transaction_id, amount, reason, refund_to)
        return result
    except Exception as e:
        print(f"❌ Error in refund_transaction: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# ===============================
# Escrow Management
# ===============================

@router.get("/transactions/escrow", auth=cookie_auth)
def get_escrow_payments_list(
    request,
    status: str = None,
    search: str = None,
    page: int = 1,
    limit: int = 50
):
    """
    Get list of escrow payments (50% downpayments).
    """
    try:
        result = get_escrow_payments(status, search, page, limit)
        return result
    except Exception as e:
        print(f"❌ Error in get_escrow_payments_list: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/transactions/escrow/statistics", auth=cookie_auth)
def get_escrow_stats(request):
    """
    Get escrow payment statistics.
    """
    try:
        result = get_escrow_statistics()
        return result
    except Exception as e:
        print(f"❌ Error in get_escrow_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/transactions/escrow/bulk-release", auth=cookie_auth)
def bulk_release_escrow_payments(request):
    """
    Release multiple escrow payments at once.
    """
    try:
        body = request.data if hasattr(request, 'data') else {}
        escrow_ids = body.get('escrow_ids', [])
        reason = body.get('reason', None)
        
        if not escrow_ids:
            return {"success": False, "error": "No escrow IDs provided"}
        
        result = bulk_release_escrow(escrow_ids, reason)
        return result
    except Exception as e:
        print(f"❌ Error in bulk_release_escrow_payments: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# ===============================
# Worker Earnings & Payouts
# ===============================

@router.get("/transactions/worker-earnings", auth=cookie_auth)
def get_worker_earnings_list(
    request,
    search: str = None,
    page: int = 1,
    limit: int = 50
):
    """
    Get worker earnings aggregated by worker.
    """
    try:
        result = get_worker_earnings(search, page, limit)
        return result
    except Exception as e:
        print(f"❌ Error in get_worker_earnings_list: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/transactions/worker-earnings/statistics", auth=cookie_auth)
def get_worker_earnings_stats(request):
    """
    Get overall worker earnings statistics.
    """
    try:
        result = get_worker_earnings_statistics()
        return result
    except Exception as e:
        print(f"❌ Error in get_worker_earnings_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/transactions/payout", auth=cookie_auth)
def process_worker_payout(request):
    """
    Process payout to worker.
    """
    try:
        body = request.data if hasattr(request, 'data') else {}
        worker_id = body.get('worker_id')
        amount = body.get('amount')
        payout_method = body.get('payout_method')
        gcash_number = body.get('gcash_number', None)
        bank_details = body.get('bank_details', None)
        
        if not all([worker_id, amount, payout_method]):
            return {"success": False, "error": "Worker ID, amount, and payout method are required"}
        
        result = process_payout(worker_id, amount, payout_method, gcash_number, bank_details)
        return result
    except Exception as e:
        print(f"❌ Error in process_worker_payout: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# ===============================
# Dispute Management
# ===============================

@router.get("/transactions/disputes", auth=cookie_auth)
def get_disputes(
    request,
    status: str = None,
    priority: str = None,
    search: str = None,
    page: int = 1,
    limit: int = 50
):
    """
    Get list of job disputes.
    """
    try:
        result = get_disputes_list(status, priority, search, page, limit)
        return result
    except Exception as e:
        print(f"❌ Error in get_disputes: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/transactions/disputes/statistics", auth=cookie_auth)
def get_disputes_stats(request):
    """
    Get dispute statistics.
    """
    try:
        result = get_disputes_statistics()
        return result
    except Exception as e:
        print(f"❌ Error in get_disputes_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/transactions/disputes/{dispute_id}", auth=cookie_auth)
def get_dispute_details(request, dispute_id: int):
    """
    Get detailed information about a specific dispute.
    """
    try:
        result = get_dispute_detail(dispute_id)
        return result
    except Exception as e:
        print(f"❌ Error in get_dispute_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/transactions/disputes/{dispute_id}/resolve", auth=cookie_auth)
def resolve_job_dispute(request, dispute_id: int):
    """
    Resolve a job dispute.
    """
    try:
        body = request.data if hasattr(request, 'data') else {}
        resolution = body.get('resolution')
        decision = body.get('decision')
        refund_amount = body.get('refund_amount', None)
        
        if not all([resolution, decision]):
            return {"success": False, "error": "Resolution and decision are required"}
        
        result = resolve_dispute(dispute_id, resolution, decision, refund_amount)
        return result
    except Exception as e:
        print(f"❌ Error in resolve_job_dispute: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# ===============================
# Analytics
# ===============================

@router.get("/transactions/revenue-trends", auth=cookie_auth)
def get_revenue_trends_data(request, period: str = 'last_30_days'):
    """
    Get revenue trends over time.
    """
    try:
        result = get_revenue_trends(period)
        return result
    except Exception as e:
        print(f"❌ Error in get_revenue_trends_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/transactions/payment-methods-breakdown", auth=cookie_auth)
def get_payment_methods_data(request, period: str = 'last_30_days'):
    """
    Get payment methods breakdown by percentage.
    """
    try:
        result = get_payment_methods_breakdown(period)
        return result
    except Exception as e:
        print(f"❌ Error in get_payment_methods_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/transactions/top-performers", auth=cookie_auth)
def get_top_performers_data(request, period: str = 'last_30_days'):
    """
    Get top performing clients, workers, and categories.
    """
    try:
        result = get_top_performers(period)
        return result
    except Exception as e:
        print(f"❌ Error in get_top_performers_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}




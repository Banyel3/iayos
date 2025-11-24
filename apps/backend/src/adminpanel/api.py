from ninja import Router
# from .schemas import createAccountSchema, logInSchema, createAgencySchema, forgotPasswordSchema, resetPasswordSchema
# from .services import create_account_individ, create_account_agency, login_account, _verify_account, forgot_password_request, reset_password_verify, logout_account, refresh_token, fetch_currentUser, generateCookie
from ninja.responses import Response
from django.shortcuts import redirect
from django.urls import reverse
from .service import fetchAll_kyc, review_kyc_items, approve_kyc, reject_kyc, fetch_kyc_logs
from .service import approve_agency_kyc, reject_agency_kyc, get_admin_dashboard_stats
from .service import get_clients_list, get_workers_list, get_agencies_list
from .service import get_worker_detail, get_client_detail, get_agency_detail
from .service import get_jobs_list, get_job_applications_list, get_jobs_dashboard_stats
from .service import get_job_categories_list, get_job_disputes_list, get_disputes_dashboard_stats
from .service import get_all_reviews_list, get_job_reviews_list, get_reviews_dashboard_stats, get_flagged_reviews_list

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




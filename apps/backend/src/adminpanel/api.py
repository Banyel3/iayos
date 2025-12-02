from typing import List, Optional
from ninja import Router, Schema
# from .schemas import createAccountSchema, logInSchema, createAgencySchema, forgotPasswordSchema, resetPasswordSchema
# from .services import create_account_individ, create_account_agency, login_account, _verify_account, forgot_password_request, reset_password_verify, logout_account, refresh_token, fetch_currentUser, generateCookie
from ninja.responses import Response
from accounts.authentication import cookie_auth
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from .service import fetchAll_kyc, review_kyc_items, approve_kyc, reject_kyc, fetch_kyc_logs
from .service import approve_agency_kyc, reject_agency_kyc, get_admin_dashboard_stats
from .service import get_agency_kyc_list, review_agency_kyc
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
from .support_service import (
    get_tickets, get_ticket_detail, create_ticket, reply_to_ticket,
    update_ticket_status, assign_ticket, get_ticket_stats,
    get_canned_responses, create_canned_response, update_canned_response,
    delete_canned_response, increment_canned_response_usage,
    get_faqs, create_faq, update_faq, delete_faq, increment_faq_view,
    get_reports, get_report_detail, create_report, review_report, get_report_stats
)
from .audit_service import (
    log_action, get_audit_logs, get_audit_log_detail, export_audit_logs,
    get_admin_activity, get_audit_statistics
)
from .settings_service import (
    get_platform_settings, update_platform_settings,
    get_admins, get_admin_detail, create_admin, update_admin, delete_admin,
    update_admin_last_login, get_all_permissions, check_admin_permission
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


@router.get("/agency-kyc", auth=cookie_auth)
def get_agency_kyc_submissions(request, status: Optional[str] = None):
    """
    Get list of agency KYC submissions with optional status filtering.
    
    Query params:
    - status: Optional filter (PENDING, APPROVED, REJECTED)
    """
    try:
        submissions = get_agency_kyc_list(status_filter=status)
        return {
            "success": True,
            "submissions": submissions,
            "count": len(submissions)
        }
    except Exception as e:
        print(f"❌ Error in get_agency_kyc_submissions: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/agency-kyc/{agency_kyc_id}/review", auth=cookie_auth)
def review_agency_kyc_submission(request, agency_kyc_id: int):
    """
    Review (approve or reject) an agency KYC submission.
    
    Expects JSON body with:
    - status: 'APPROVED' or 'REJECTED'
    - notes: Optional review notes (required for rejection)
    """
    import json
    
    try:
        body = json.loads(request.body.decode('utf-8'))
        status = body.get('status')
        notes = body.get('notes', '')
        
        if not status:
            return {"success": False, "error": "status is required"}
        
        if status.upper() not in ['APPROVED', 'REJECTED']:
            return {"success": False, "error": "status must be 'APPROVED' or 'REJECTED'"}
        
        if status.upper() == 'REJECTED' and not notes:
            return {"success": False, "error": "notes are required when rejecting"}
        
        # Get reviewer from auth
        reviewer = request.auth
        if not reviewer:
            return {"success": False, "error": "authentication required"}
        
        result = review_agency_kyc(
            agency_kyc_id=agency_kyc_id,
            status=status.upper(),
            notes=notes,
            reviewer=reviewer
        )
        
        return result
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error in review_agency_kyc_submission: {str(e)}")
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


@router.get("/users/agencies/{account_id}/employees")
def get_agency_employees_admin(request, account_id: str):
    """
    Get all employees for a specific agency (admin access).
    
    This endpoint allows admins to view agency employees without requiring
    agency authentication. It reuses the agency service function but is
    accessible via admin authentication.
    
    Path params:
    - account_id: The account ID of the agency
    """
    try:
        # Import agency service function
        from agency.services import get_agency_employees
        
        # Fetch employees using agency service (reuse existing logic)
        employees = get_agency_employees(account_id)
        
        return {"success": True, "employees": employees}
    except ValueError as e:
        # User/agency not found
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error fetching agency employees (admin): {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch agency employees"}


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


@router.get("/jobs/{job_id}/invoice", auth=cookie_auth)
def get_job_invoice_endpoint(request, job_id: int):
    """
    Get invoice data for a completed job.
    Returns detailed invoice information including client, worker, 
    payment breakdown, and transaction details.
    """
    try:
        from adminpanel.service import get_job_invoice
        result = get_job_invoice(job_id)
        return result
    except Exception as e:
        print(f"❌ Error fetching job invoice: {str(e)}")
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


@router.post("/jobs/disputes/{dispute_id}/approve-backjob", auth=cookie_auth)
def approve_backjob(request, dispute_id: int):
    """
    Admin approves a backjob request.
    Changes status from OPEN to UNDER_REVIEW and notifies the worker/agency.
    """
    from accounts.models import JobDispute, Notification, Agency, JobLog
    
    try:
        body = request.data if hasattr(request, 'data') else {}
        admin_notes = body.get('notes', '')
        priority = body.get('priority', 'MEDIUM')
        
        dispute = JobDispute.objects.select_related(
            'jobID',
            'jobID__assignedWorkerID__profileID__accountFK',
            'jobID__assignedAgencyFK__accountFK',
            'jobID__clientID__profileID__accountFK'
        ).get(disputeID=dispute_id)
        
        if dispute.status != 'OPEN':
            return {"success": False, "error": "This backjob has already been processed"}
        
        # Store before state for audit
        before_state = {"status": dispute.status, "priority": dispute.priority}
        
        # Update dispute
        dispute.status = 'UNDER_REVIEW'
        dispute.priority = priority
        if admin_notes:
            dispute.resolution = f"Admin notes: {admin_notes}"
        dispute.save()
        
        job = dispute.jobID
        
        # Create job log
        JobLog.objects.create(
            jobID=job,
            oldStatus=job.status,
            newStatus="BACKJOB_APPROVED",
            changedBy=request.auth,
            notes=f"Admin approved backjob request. Priority: {priority}"
        )
        
        # Log audit trail
        log_action(
            admin=request.auth,
            action="backjob_approve",
            entity_type="job",
            entity_id=str(dispute_id),
            details={"job_id": job.jobID, "job_title": job.title, "priority": priority, "notes": admin_notes},
            before_value=before_state,
            after_value={"status": "UNDER_REVIEW", "priority": priority},
            request=request
        )
        
        # Notify the worker or agency
        notify_account = None
        if job.assignedAgencyFK:
            notify_account = job.assignedAgencyFK.accountFK
        elif job.assignedWorkerID:
            notify_account = job.assignedWorkerID.profileID.accountFK
        
        if notify_account:
            Notification.objects.create(
                accountFK=notify_account,
                notificationType="BACKJOB_APPROVED",
                title="New Backjob Assigned",
                message=f"You have a new backjob for '{job.title}'. The client has requested rework. Please review and complete.",
                relatedJobID=job.jobID
            )
        
        # Also notify the client that their backjob was approved
        if job.clientID:
            Notification.objects.create(
                accountFK=job.clientID.profileID.accountFK,
                notificationType="BACKJOB_APPROVED",
                title="Backjob Request Approved",
                message=f"Your backjob request for '{job.title}' has been approved. The worker/agency has been notified.",
                relatedJobID=job.jobID
            )
        
        return {
            "success": True,
            "message": "Backjob approved and assigned to worker/agency",
            "dispute_id": dispute.disputeID,
            "status": dispute.status
        }
        
    except JobDispute.DoesNotExist:
        return {"success": False, "error": "Dispute not found"}
    except Exception as e:
        print(f"❌ Error approving backjob: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/jobs/disputes/{dispute_id}/reject-backjob", auth=cookie_auth)
def reject_backjob(request, dispute_id: int):
    """
    Admin rejects a backjob request.
    Changes status from OPEN to CLOSED and notifies the client.
    """
    from accounts.models import JobDispute, Notification, JobLog
    
    try:
        body = request.data if hasattr(request, 'data') else {}
        rejection_reason = body.get('reason', 'Backjob request was not approved')
        
        if not rejection_reason or len(rejection_reason) < 10:
            return {"success": False, "error": "Please provide a valid rejection reason (at least 10 characters)"}
        
        dispute = JobDispute.objects.select_related(
            'jobID',
            'jobID__clientID__profileID__accountFK'
        ).get(disputeID=dispute_id)
        
        if dispute.status != 'OPEN':
            return {"success": False, "error": "This backjob has already been processed"}
        
        # Store before state for audit
        before_state = {"status": dispute.status}
        
        # Update dispute
        dispute.status = 'CLOSED'
        dispute.resolution = f"Rejected: {rejection_reason}"
        dispute.resolvedDate = timezone.now()
        dispute.save()
        
        job = dispute.jobID
        
        # Create job log
        JobLog.objects.create(
            jobID=job,
            oldStatus=job.status,
            newStatus="BACKJOB_REJECTED",
            changedBy=request.auth,
            notes=f"Admin rejected backjob request. Reason: {rejection_reason}"
        )
        
        # Log audit trail
        log_action(
            admin=request.auth,
            action="backjob_reject",
            entity_type="job",
            entity_id=str(dispute_id),
            details={"job_id": job.jobID, "job_title": job.title, "reason": rejection_reason},
            before_value=before_state,
            after_value={"status": "CLOSED", "reason": rejection_reason},
            request=request
        )
        
        # Notify the client
        if job.clientID:
            Notification.objects.create(
                accountFK=job.clientID.profileID.accountFK,
                notificationType="BACKJOB_REJECTED",
                title="Backjob Request Rejected",
                message=f"Your backjob request for '{job.title}' was not approved. Reason: {rejection_reason}",
                relatedJobID=job.jobID
            )
        
        return {
            "success": True,
            "message": "Backjob request rejected",
            "dispute_id": dispute.disputeID,
            "status": dispute.status
        }
        
    except JobDispute.DoesNotExist:
        return {"success": False, "error": "Dispute not found"}
    except Exception as e:
        print(f"❌ Error rejecting backjob: {str(e)}")
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
        
        result = suspend_account(account_id, reason, request.auth, request)
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
        
        result = ban_account(account_id, reason, request.auth, request)
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
        result = activate_account(account_id, request.auth, request)
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
        result = delete_account(account_id, request.auth, request)
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
        result = release_escrow(transaction_id, reason, admin=request.auth, request=request)
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
        
        result = process_refund(transaction_id, amount, reason, refund_to, admin=request.auth, request=request)
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
        
        result = resolve_dispute(dispute_id, resolution, decision, refund_amount, admin=request.auth, request=request)
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


# ============================================================
# MODULE 6: SETTINGS, AUDIT LOGS & ADMIN MANAGEMENT
# ============================================================

@router.get("/settings/audit-logs", auth=cookie_auth)
def get_audit_logs_endpoint(
    request,
    page: int = 1,
    limit: int = 100,
    admin_id: str | None = None,
    action_type: str | None = None,
    entity_type: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    search: str | None = None
):
    """
    Get audit logs with filtering and pagination.
    
    Tracks all admin actions including:
    - Login/logout events
    - KYC approvals/rejections
    - Payment releases/refunds
    - User bans/suspensions
    - Settings changes
    - Admin account management
    """
    try:
        result = get_audit_logs(
            page=page,
            limit=limit,
            admin_id=admin_id,
            action_type=action_type,
            entity_type=entity_type,
            date_from=date_from,
            date_to=date_to,
            search=search
        )
        return result
    except Exception as e:
        print(f"❌ Error in get_audit_logs_endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/settings/audit-logs/{log_id}", auth=cookie_auth)
def get_audit_log_detail_endpoint(request, log_id: int):
    """Get details of a specific audit log entry."""
    try:
        result = get_audit_log_detail(log_id)
        return result
    except Exception as e:
        print(f"❌ Error in get_audit_log_detail_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/settings/audit-logs/export", auth=cookie_auth)
def export_audit_logs_endpoint(
    request,
    admin_id: str | None = None,
    action_type: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None
):
    """Export audit logs to CSV format."""
    try:
        from django.http import HttpResponse
        
        csv_content = export_audit_logs(
            admin_id=admin_id,
            action_type=action_type,
            date_from=date_from,
            date_to=date_to
        )
        
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit-logs.csv"'
        return response
    except Exception as e:
        print(f"❌ Error in export_audit_logs_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/settings/audit-logs/statistics", auth=cookie_auth)
def get_audit_statistics_endpoint(request):
    """Get audit log statistics (total counts, top admins, top actions)."""
    try:
        result = get_audit_statistics()
        return result
    except Exception as e:
        print(f"❌ Error in get_audit_statistics_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/settings/audit-logs/admin/{admin_id}/activity", auth=cookie_auth)
def get_admin_activity_endpoint(request, admin_id: int, days: int = 30):
    """Get activity summary for a specific admin."""
    try:
        result = get_admin_activity(admin_id, days)
        return result
    except Exception as e:
        print(f"❌ Error in get_admin_activity_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


# Platform Settings endpoints
@router.get("/settings/platform", auth=cookie_auth)
def get_platform_settings_endpoint(request):
    """Get current platform settings."""
    try:
        result = get_platform_settings()
        return result
    except Exception as e:
        print(f"❌ Error in get_platform_settings_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


class PlatformSettingsSchema(Schema):
    platform_fee_percentage: Optional[float] = None
    escrow_holding_days: Optional[int] = None
    max_job_budget: Optional[float] = None
    min_job_budget: Optional[float] = None
    worker_verification_required: Optional[bool] = None
    auto_approve_kyc: Optional[bool] = None
    kyc_document_expiry_days: Optional[int] = None
    maintenance_mode: Optional[bool] = None
    session_timeout_minutes: Optional[int] = None
    max_upload_size_mb: Optional[int] = None


@router.put("/settings/platform", auth=cookie_auth)
def update_platform_settings_endpoint(request, data: PlatformSettingsSchema):
    """Update platform settings."""
    try:
        # Convert Schema to dict, excluding None values
        settings_data = {k: v for k, v in data.dict().items() if v is not None}
        
        result = update_platform_settings(
            admin=request.auth,
            data=settings_data,
            request=request
        )
        return result
    except Exception as e:
        print(f"❌ Error in update_platform_settings_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


# Admin Management endpoints
@router.get("/settings/admins", auth=cookie_auth)
def get_admins_endpoint(request):
    """Get list of all admin accounts."""
    try:
        result = get_admins(request.auth)
        return result
    except Exception as e:
        print(f"❌ Error in get_admins_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/settings/admins/{admin_id}", auth=cookie_auth)
def get_admin_detail_endpoint(request, admin_id: int):
    """Get details of a specific admin account."""
    try:
        result = get_admin_detail(admin_id)
        return result
    except Exception as e:
        print(f"❌ Error in get_admin_detail_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


class CreateAdminSchema(Schema):
    email: str
    password: str
    role: str = "moderator"
    permissions: List[str] = []
    send_welcome_email: bool = True


@router.post("/settings/admins", auth=cookie_auth)
def create_admin_endpoint(request, data: CreateAdminSchema):
    """Create a new admin account."""
    try:
        result = create_admin(
            creator=request.auth,
            email=data.email,
            password=data.password,
            role=data.role,
            permissions=data.permissions,
            request=request
        )
        return result
    except Exception as e:
        print(f"❌ Error in create_admin_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


class UpdateAdminSchema(Schema):
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


@router.put("/settings/admins/{admin_id}", auth=cookie_auth)
def update_admin_endpoint(request, admin_id: int, data: UpdateAdminSchema):
    """Update an admin account."""
    try:
        # Convert Schema to dict, excluding None values
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        
        result = update_admin(
            updater=request.auth,
            admin_id=admin_id,
            data=update_data,
            request=request
        )
        return result
    except Exception as e:
        print(f"❌ Error in update_admin_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.delete("/settings/admins/{admin_id}", auth=cookie_auth)
def delete_admin_endpoint(request, admin_id: int, reassign_to: int | None = None):
    """Delete an admin account. Optionally reassign tasks to another admin."""
    try:
        result = delete_admin(
            deleter=request.auth,
            admin_id=admin_id,
            reassign_to_id=reassign_to,
            request=request
        )
        return result
    except Exception as e:
        print(f"❌ Error in delete_admin_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


# Add endpoint for updating permissions specifically (used by frontend)
@router.put("/settings/admins/{admin_id}/permissions", auth=cookie_auth)
def update_admin_permissions_endpoint(request, admin_id: int, data: UpdateAdminSchema):
    """Update an admin's role and permissions."""
    try:
        # Convert Schema to dict, excluding None values
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        
        result = update_admin(
            updater=request.auth,
            admin_id=admin_id,
            data=update_data,
            request=request
        )
        return result
    except Exception as e:
        print(f"❌ Error in update_admin_permissions_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/settings/permissions", auth=cookie_auth)
def get_permissions_endpoint(request):
    """Get list of all available permissions."""
    try:
        permissions = get_all_permissions()
        return {"success": True, "permissions": permissions}
    except Exception as e:
        print(f"❌ Error in get_permissions_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


# ============================================================
# NOTE: MODULE 7 MOCK ENDPOINTS REMOVED
# Real Support & Help Center endpoints are defined below in
# "SUPPORT TICKETS API" section (after Analytics endpoints)
# ============================================================


# ============================================================================
# MODULE 8: ANALYTICS & REPORTS ENDPOINTS
# ============================================================================

# Analytics Overview Endpoint
@router.get("/analytics/overview", auth=cookie_auth)
def get_analytics_overview(request, period: str = "last_30_days"):
    """Get comprehensive analytics overview with real data."""
    try:
        overview = get_overview_data(period=period)
        # Transform 'overview' key to 'stats' for frontend compatibility
        if overview.get('success') and 'overview' in overview:
            return {
                "success": True,
                "stats": overview['overview'],
                "revenue_timeline": [],  # TODO: implement timeline data
                "user_timeline": [],  # TODO: implement timeline data
            }
        return overview
    except Exception as e:
        print(f"Error in get_analytics_overview: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# =============================================================================
# SUPPORT TICKETS API
# =============================================================================

@router.get("/support/tickets", auth=cookie_auth)
def get_support_tickets(
    request,
    page: int = 1,
    limit: int = 30,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[int] = None,
    search: Optional[str] = None,
):
    """Get paginated list of support tickets with filters."""
    try:
        return get_tickets(
            page=page,
            limit=limit,
            status=status,
            priority=priority,
            category=category,
            assigned_to=assigned_to,
            search=search,
        )
    except Exception as e:
        print(f"Error in get_support_tickets: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/support/tickets/stats", auth=cookie_auth)
def get_tickets_stats(request):
    """Get support ticket statistics."""
    try:
        return get_ticket_stats()
    except Exception as e:
        print(f"Error in get_tickets_stats: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/support/tickets/{ticket_id}", auth=cookie_auth)
def get_ticket_by_id(request, ticket_id: int):
    """Get detailed information about a specific ticket."""
    try:
        return get_ticket_detail(ticket_id)
    except Exception as e:
        print(f"Error in get_ticket_by_id: {str(e)}")
        return {"success": False, "error": str(e)}


class CreateTicketSchema(Schema):
    subject: str
    content: str
    category: str = "general"
    priority: str = "medium"


@router.post("/support/tickets", auth=cookie_auth)
def create_support_ticket(request, data: CreateTicketSchema):
    """Create a new support ticket."""
    try:
        return create_ticket(
            user=request.auth,
            subject=data.subject,
            content=data.content,
            category=data.category,
            priority=data.priority,
        )
    except Exception as e:
        print(f"Error in create_support_ticket: {str(e)}")
        return {"success": False, "error": str(e)}


class ReplyTicketSchema(Schema):
    content: Optional[str] = None
    message: Optional[str] = None  # Alias for content (frontend uses 'message')
    attachment_url: Optional[str] = None
    is_internal_note: bool = False


@router.post("/support/tickets/{ticket_id}/reply", auth=cookie_auth)
def reply_to_support_ticket(request, ticket_id: int, data: ReplyTicketSchema):
    """Add a reply to a support ticket."""
    try:
        # Use message if content not provided
        actual_content = data.content or data.message or ""
        if not actual_content:
            return {"success": False, "error": "Content or message is required"}
        
        return reply_to_ticket(
            ticket_id=ticket_id,
            sender=request.auth,
            content=actual_content,
            attachment_url=data.attachment_url,
        )
    except Exception as e:
        print(f"Error in reply_to_support_ticket: {str(e)}")
        return {"success": False, "error": str(e)}


class UpdateTicketStatusSchema(Schema):
    status: str


@router.put("/support/tickets/{ticket_id}/status", auth=cookie_auth)
def update_support_ticket_status(request, ticket_id: int, data: UpdateTicketStatusSchema):
    """Update ticket status."""
    try:
        return update_ticket_status(
            ticket_id=ticket_id,
            status=data.status,
            admin=request.auth,
        )
    except Exception as e:
        print(f"Error in update_support_ticket_status: {str(e)}")
        return {"success": False, "error": str(e)}


class AssignTicketSchema(Schema):
    admin_id: int


@router.put("/support/tickets/{ticket_id}/assign", auth=cookie_auth)
def assign_support_ticket(request, ticket_id: int, data: AssignTicketSchema):
    """Assign a ticket to an admin."""
    try:
        return assign_ticket(ticket_id=ticket_id, admin_id=data.admin_id)
    except Exception as e:
        print(f"Error in assign_support_ticket: {str(e)}")
        return {"success": False, "error": str(e)}


# =============================================================================
# CANNED RESPONSES API
# =============================================================================

@router.get("/support/canned-responses", auth=cookie_auth)
def get_all_canned_responses(request, category: Optional[str] = None, search: Optional[str] = None):
    """Get list of canned responses."""
    try:
        return get_canned_responses(category=category, search=search)
    except Exception as e:
        print(f"Error in get_all_canned_responses: {str(e)}")
        return {"success": False, "error": str(e)}


class CannedResponseSchema(Schema):
    title: str
    content: str
    category: str = "general"
    shortcuts: Optional[List[str]] = None


@router.post("/support/canned-responses", auth=cookie_auth)
def create_new_canned_response(request, data: CannedResponseSchema):
    """Create a new canned response."""
    try:
        return create_canned_response(
            title=data.title,
            content=data.content,
            category=data.category,
            shortcuts=data.shortcuts,
            created_by=request.auth,
        )
    except Exception as e:
        print(f"Error in create_new_canned_response: {str(e)}")
        return {"success": False, "error": str(e)}


@router.put("/support/canned-responses/{response_id}", auth=cookie_auth)
def update_existing_canned_response(request, response_id: int, data: CannedResponseSchema):
    """Update an existing canned response."""
    try:
        return update_canned_response(
            response_id=response_id,
            title=data.title,
            content=data.content,
            category=data.category,
            shortcuts=data.shortcuts,
        )
    except Exception as e:
        print(f"Error in update_existing_canned_response: {str(e)}")
        return {"success": False, "error": str(e)}


@router.delete("/support/canned-responses/{response_id}", auth=cookie_auth)
def delete_existing_canned_response(request, response_id: int):
    """Delete a canned response."""
    try:
        return delete_canned_response(response_id)
    except Exception as e:
        print(f"Error in delete_existing_canned_response: {str(e)}")
        return {"success": False, "error": str(e)}


@router.post("/support/canned-responses/{response_id}/use", auth=cookie_auth)
def use_canned_response(request, response_id: int):
    """Increment usage count when a canned response is used."""
    try:
        return increment_canned_response_usage(response_id)
    except Exception as e:
        print(f"Error in use_canned_response: {str(e)}")
        return {"success": False, "error": str(e)}


# =============================================================================
# FAQs API
# =============================================================================

@router.get("/support/faqs", auth=cookie_auth)
def get_all_faqs(request, category: Optional[str] = None, published_only: bool = False):
    """Get list of FAQs (admin sees all, including unpublished)."""
    try:
        return get_faqs(category=category, published_only=published_only)
    except Exception as e:
        print(f"Error in get_all_faqs: {str(e)}")
        return {"success": False, "error": str(e)}


class FAQSchema(Schema):
    question: str
    answer: str
    category: str = "general"
    sort_order: int = 0
    is_published: bool = True


@router.post("/support/faqs", auth=cookie_auth)
def create_new_faq(request, data: FAQSchema):
    """Create a new FAQ."""
    try:
        return create_faq(
            question=data.question,
            answer=data.answer,
            category=data.category,
            sort_order=data.sort_order,
            is_published=data.is_published,
        )
    except Exception as e:
        print(f"Error in create_new_faq: {str(e)}")
        return {"success": False, "error": str(e)}


@router.put("/support/faqs/{faq_id}", auth=cookie_auth)
def update_existing_faq(request, faq_id: int, data: FAQSchema):
    """Update an existing FAQ."""
    try:
        return update_faq(
            faq_id=faq_id,
            question=data.question,
            answer=data.answer,
            category=data.category,
            sort_order=data.sort_order,
            is_published=data.is_published,
        )
    except Exception as e:
        print(f"Error in update_existing_faq: {str(e)}")
        return {"success": False, "error": str(e)}


@router.delete("/support/faqs/{faq_id}", auth=cookie_auth)
def delete_existing_faq(request, faq_id: int):
    """Delete an FAQ."""
    try:
        return delete_faq(faq_id)
    except Exception as e:
        print(f"Error in delete_existing_faq: {str(e)}")
        return {"success": False, "error": str(e)}


@router.post("/support/faqs/{faq_id}/view")
def record_faq_view(request, faq_id: int):
    """Record a view of an FAQ (public endpoint)."""
    try:
        return increment_faq_view(faq_id)
    except Exception as e:
        print(f"Error in record_faq_view: {str(e)}")
        return {"success": False, "error": str(e)}


# =============================================================================
# USER REPORTS API
# =============================================================================

@router.get("/support/reports", auth=cookie_auth)
def get_user_reports(
    request,
    page: int = 1,
    limit: int = 30,
    status: Optional[str] = None,
    report_type: Optional[str] = None,
    type: Optional[str] = None,  # Alias for report_type (frontend uses 'type')
):
    """Get paginated list of user reports."""
    try:
        # Use 'type' parameter if report_type not specified
        actual_type = report_type or type
        return get_reports(
            page=page,
            limit=limit,
            status=status,
            report_type=actual_type,
        )
    except Exception as e:
        print(f"Error in get_user_reports: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/support/reports/stats", auth=cookie_auth)
def get_reports_stats(request):
    """Get user report statistics."""
    try:
        return get_report_stats()
    except Exception as e:
        print(f"Error in get_reports_stats: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/support/reports/{report_id}", auth=cookie_auth)
def get_report_by_id(request, report_id: int):
    """Get detailed information about a specific report."""
    try:
        return get_report_detail(report_id)
    except Exception as e:
        print(f"Error in get_report_by_id: {str(e)}")
        return {"success": False, "error": str(e)}


class ReviewReportSchema(Schema):
    status: str
    action_taken: str = "none"
    admin_notes: str = ""


class ReviewReportActionSchema(Schema):
    """Schema for frontend action-based review."""
    action: str  # warning, suspend, ban, dismiss, resolve
    notes: str = ""
    duration: Optional[int] = None  # For suspend action


@router.put("/support/reports/{report_id}/review", auth=cookie_auth)
def review_user_report(request, report_id: int, data: ReviewReportSchema):
    """Review and take action on a report."""
    try:
        return review_report(
            report_id=report_id,
            admin=request.auth,
            status=data.status,
            action_taken=data.action_taken,
            admin_notes=data.admin_notes,
        )
    except Exception as e:
        print(f"Error in review_user_report: {str(e)}")
        return {"success": False, "error": str(e)}


@router.post("/support/reports/{report_id}/review", auth=cookie_auth)
def review_user_report_action(request, report_id: int, data: ReviewReportActionSchema):
    """Review a report using action-based approach (frontend uses this)."""
    try:
        # Map action to status and action_taken
        action_mapping = {
            "warning": {"status": "resolved", "action_taken": "warning"},
            "suspend": {"status": "resolved", "action_taken": "suspended"},
            "ban": {"status": "resolved", "action_taken": "banned"},
            "dismiss": {"status": "dismissed", "action_taken": "none"},
            "resolve": {"status": "resolved", "action_taken": "none"},
            "investigate": {"status": "investigating", "action_taken": "none"},
        }
        
        mapping = action_mapping.get(data.action, {"status": "pending", "action_taken": "none"})
        
        return review_report(
            report_id=report_id,
            admin=request.auth,
            status=mapping["status"],
            action_taken=mapping["action_taken"],
            admin_notes=data.notes,
        )
    except Exception as e:
        print(f"Error in review_user_report_action: {str(e)}")
        return {"success": False, "error": str(e)}


# =============================================================================
# ANALYTICS API ENDPOINTS
# =============================================================================

from .analytics_service import (
    get_user_analytics, get_job_analytics, get_financial_analytics,
    get_geographic_analytics, get_engagement_analytics, get_support_statistics,
    get_analytics_overview as get_overview_data
)


@router.get("/analytics/users", auth=cookie_auth)
def get_user_analytics_endpoint(request, period: str = "last_30_days", segment: str = "all"):
    """Get comprehensive user analytics: DAU, WAU, MAU, demographics, growth trends."""
    try:
        analytics = get_user_analytics(period=period, segment=segment)
        return {"success": True, "analytics": analytics}
    except Exception as e:
        print(f"Error in get_user_analytics_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/analytics/jobs", auth=cookie_auth)
def get_job_analytics_endpoint(request, period: str = "last_30_days"):
    """Get job marketplace analytics: volume, completion rates, categories, timeline."""
    try:
        analytics = get_job_analytics(period=period)
        return {"success": True, "analytics": analytics}
    except Exception as e:
        print(f"Error in get_job_analytics_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/analytics/financial", auth=cookie_auth)
def get_financial_analytics_endpoint(request, period: str = "last_30_days"):
    """Get financial analytics: revenue, transactions, payment methods, trends."""
    try:
        analytics = get_financial_analytics(period=period)
        return {"success": True, "analytics": analytics}
    except Exception as e:
        print(f"Error in get_financial_analytics_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/analytics/geographic", auth=cookie_auth)
def get_geographic_analytics_endpoint(request):
    """Get geographic analytics: regional breakdown, city stats, heatmap data."""
    try:
        analytics = get_geographic_analytics()
        return {"success": True, "analytics": analytics}
    except Exception as e:
        print(f"Error in get_geographic_analytics_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/analytics/engagement", auth=cookie_auth)
def get_engagement_analytics_endpoint(request, period: str = "last_30_days"):
    """Get engagement metrics: session duration, pages/session, bounce rate, feature usage."""
    try:
        analytics = get_engagement_analytics(period=period)
        return {"success": True, "analytics": analytics}
    except Exception as e:
        print(f"Error in get_engagement_analytics_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/support/statistics", auth=cookie_auth)
def get_support_statistics_endpoint(request, range: str = "last_30_days"):
    """Get support ticket statistics for support analytics dashboard."""
    try:
        statistics = get_support_statistics(range_param=range)
        return {"success": True, "statistics": statistics}
    except Exception as e:
        print(f"Error in get_support_statistics_endpoint: {str(e)}")
        return {"success": False, "error": str(e)}





















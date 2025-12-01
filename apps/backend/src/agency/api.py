from ninja import Router, Form
from ninja.responses import Response
from accounts.authentication import cookie_auth
from . import services, schemas

router = Router()


@router.post("/upload", auth=cookie_auth, response=schemas.AgencyKYCUploadResponse)
def upload_agency_kyc(request):
    """Upload agency KYC documents. Expects multipart/form-data. Files are read from request.FILES to avoid bytes validation errors."""
    try:
        # Get account ID from authenticated user
        account_id = request.auth.accountID
        businessName = request.POST.get("businessName")
        businessDesc = request.POST.get("businessDesc")
        
        class Payload:
            def __init__(self, accountID, businessName=None, businessDesc=None):
                self.accountID = accountID
                self.businessName = businessName
                self.businessDesc = businessDesc

        payload = Payload(accountID=account_id, businessName=businessName, businessDesc=businessDesc)

        # Read uploaded files from request.FILES (Django's UploadedFile objects)
        business_permit = request.FILES.get("business_permit")
        rep_front = request.FILES.get("rep_front")
        rep_back = request.FILES.get("rep_back")
        address_proof = request.FILES.get("address_proof")
        auth_letter = request.FILES.get("auth_letter")

        result = services.upload_agency_kyc(payload, business_permit, rep_front, rep_back, address_proof, auth_letter)

        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error in upload_agency_kyc: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/status", auth=cookie_auth, response=schemas.AgencyKYCStatusResponse)
def agency_kyc_status(request):
    try:
        account_id = request.auth.accountID
        result = services.get_agency_kyc_status(account_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency kyc status: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


# Employee management endpoints

@router.get("/employees", auth=cookie_auth)
def get_employees(request):
    """Get all employees for the authenticated agency."""
    try:
        account_id = request.auth.accountID
        employees = services.get_agency_employees(account_id)
        return {"employees": employees}
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching employees: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/employees", auth=cookie_auth)
def add_employee(request):
    """Add a new employee to the agency."""
    try:
        account_id = request.auth.accountID
        name = request.POST.get("name")
        email = request.POST.get("email")
        role = request.POST.get("role")
        avatar = request.POST.get("avatar")
        rating = float(request.POST.get("rating")) if request.POST.get("rating") else None
        result = services.add_agency_employee(account_id, name, email, role, avatar, rating)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error adding employee: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.delete("/employees/{employee_id}", auth=cookie_auth)
def remove_employee(request, employee_id: int):
    """Remove an employee from the agency."""
    try:
        account_id = request.auth.accountID
        result = services.remove_agency_employee(account_id, employee_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error removing employee: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/profile", auth=cookie_auth)
def get_profile(request):
    """Get complete agency profile with statistics."""
    try:
        account_id = request.auth.accountID
        profile = services.get_agency_profile(account_id)
        return profile
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/profile/update", auth=cookie_auth)
def update_profile(request):
    """Update agency profile information."""
    try:
        account_id = request.auth.accountID
        business_name = request.POST.get("business_name")
        business_description = request.POST.get("business_description")
        contact_number = request.POST.get("contact_number")
        
        # Debug: print received values
        print(f"Received update request:")
        print(f"  business_name: {business_name}")
        print(f"  business_description: {business_description}")
        print(f"  contact_number: {contact_number}")
        
        result = services.update_agency_profile(
            account_id, 
            business_name=business_name,
            business_desc=business_description,
            contact_number=contact_number
        )
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error updating agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.put("/profile", auth=cookie_auth)
def update_profile_put(request):
    """Update agency profile information."""
    try:
        account_id = request.auth.accountID
        business_description = request.POST.get("business_description")
        contact_number = request.POST.get("contact_number")
        result = services.update_agency_profile(account_id, business_description, contact_number)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error updating agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


# Simplified agency job endpoints - Direct invite/hire model

@router.get("/jobs", auth=cookie_auth)
def get_agency_jobs(request, status: str | None = None, invite_status: str | None = None, page: int = 1, limit: int = 20):
    """
    Get all jobs assigned to this agency (direct hires/invites).
    
    Query Parameters:
    - status: Filter by job status (ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED)
    - invite_status: Filter by invite status (PENDING, ACCEPTED, REJECTED)
    - page: Page number for pagination (default: 1)
    - limit: Items per page (default: 20, max: 100)
    """
    try:
        account_id = request.auth.accountID
        
        # Validate limit
        if limit > 100:
            limit = 100
        
        result = services.get_agency_jobs(
            account_id=account_id,
            status_filter=status,
            invite_status_filter=invite_status,
            page=page,
            limit=limit
        )
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency jobs: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/jobs/{job_id}", auth=cookie_auth)
def get_agency_job_detail(request, job_id: int):
    """
    Get detailed information for a specific job assigned to this agency.
    """
    try:
        account_id = request.auth.accountID
        result = services.get_agency_job_detail(account_id, job_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=404)
    except Exception as e:
        print(f"Error fetching job detail: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/jobs/{job_id}/accept", auth=cookie_auth)
def accept_job_invite(request, job_id: int):
    """
    Agency accepts a job invitation
    - Updates inviteStatus to ACCEPTED
    - Job becomes ACTIVE and ready for work
    - Client is notified of acceptance
    """
    try:
        account_id = request.auth.accountID
        
        # Verify agency exists
        from accounts.models import Agency, Job, Notification
        try:
            agency = Agency.objects.get(accountFK=request.auth)
        except Agency.DoesNotExist:
            return Response(
                {"error": "Agency profile not found"},
                status=404
            )
        
        # Get the job
        try:
            job = Job.objects.get(jobID=job_id, assignedAgencyFK=agency)
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found or not assigned to your agency"},
                status=404
            )
        
        # Verify job is INVITE type
        if job.jobType != "INVITE":
            return Response(
                {"error": "This is not an INVITE-type job"},
                status=400
            )
        
        # Verify invite is still pending
        if job.inviteStatus != "PENDING":
            status_text = job.inviteStatus.lower() if job.inviteStatus else "processed"
            return Response(
                {"error": f"Invite has already been {status_text}"},
                status=400
            )
        
        # Verify escrow is paid
        if not job.escrowPaid:
            return Response(
                {"error": "Cannot accept job - escrow payment is pending"},
                status=400
            )
        
        # Update job status
        from django.utils import timezone
        job.inviteStatus = "ACCEPTED"
        job.inviteRespondedAt = timezone.now()
        # NOTE: Job stays ACTIVE until employees are assigned
        # Status changes to IN_PROGRESS only when assign_employees is called
        job.save()
        
        # Create conversation between client and agency for this job
        from profiles.models import Conversation
        try:
            conversation, created = Conversation.objects.get_or_create(
                relatedJobPosting=job,
                defaults={
                    'client': job.clientID.profileID,
                    'worker': None,  # For agency jobs, worker is None
                    'status': Conversation.ConversationStatus.ACTIVE
                }
            )
            if created:
                print(f"✅ Created conversation {conversation.conversationID} for INVITE job {job_id}")
            else:
                print(f"ℹ️ Conversation already exists for job {job_id}")
        except Exception as e:
            print(f"⚠️ Failed to create conversation: {str(e)}")
            # Don't fail the job acceptance if conversation creation fails
        
        # Send notification to client
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="JOB_INVITE_ACCEPTED",
            title=f"{agency.businessName} Accepted Your Invitation",
            message=f"{agency.businessName} has accepted your invitation for '{job.title}'. The job is now active!",
            relatedJobID=job.jobID
        )
        
        # Send confirmation to agency
        Notification.objects.create(
            accountFK=request.auth,
            notificationType="JOB_INVITE_ACCEPTED_CONFIRM",
            title=f"Job Accepted: {job.title}",
            message=f"You've accepted the job invitation for '{job.title}'. Start working on the project!",
            relatedJobID=job.jobID
        )
        
        print(f"✅ Agency {agency.agencyId} accepted job {job_id}")
        
        return {
            "success": True,
            "message": "Job invitation accepted successfully!",
            "job_id": job.jobID,
            "invite_status": "ACCEPTED",
            "job_status": "ACTIVE"
        }
        
    except Exception as e:
        print(f"❌ Error accepting job invite: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to accept job invite: {str(e)}"},
            status=500
        )


@router.post("/jobs/{job_id}/reject", auth=cookie_auth)
def reject_job_invite(request, job_id: int, reason: str | None = None):
    """
    Agency rejects a job invitation
    - Updates inviteStatus to REJECTED
    - Refunds escrow to client (if paid)
    - Client is notified with rejection reason
    """
    try:
        account_id = request.auth.accountID
        
        # Verify agency exists
        from accounts.models import Agency, Job, Notification, Wallet, Transaction
        try:
            agency = Agency.objects.get(accountFK=request.auth)
        except Agency.DoesNotExist:
            return Response(
                {"error": "Agency profile not found"},
                status=404
            )
        
        # Get the job
        try:
            job = Job.objects.get(jobID=job_id, assignedAgencyFK=agency)
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found or not assigned to your agency"},
                status=404
            )
        
        # Verify job is INVITE type
        if job.jobType != "INVITE":
            return Response(
                {"error": "This is not an INVITE-type job"},
                status=400
            )
        
        # Verify invite is still pending
        if job.inviteStatus != "PENDING":
            status_text = job.inviteStatus.lower() if job.inviteStatus else "processed"
            return Response(
                {"error": f"Invite has already been {status_text}"},
                status=400
            )
        
        # Update job status
        from django.utils import timezone
        from django.db import transaction as db_transaction
        
        with db_transaction.atomic():
            job.inviteStatus = "REJECTED"
            job.inviteRejectionReason = reason or "No reason provided"
            job.inviteRespondedAt = timezone.now()
            job.status = "CANCELLED"  # Job is cancelled since agency rejected
            job.save()
            
            # Refund escrow to client if it was paid
            if job.escrowPaid:
                try:
                    client_wallet = Wallet.objects.get(accountFK=job.clientID.profileID.accountFK)
                    refund_amount = job.escrowAmount
                    
                    # Refund to wallet
                    client_wallet.balance += refund_amount
                    client_wallet.save()
                    
                    # Create refund transaction
                    Transaction.objects.create(
                        walletID=client_wallet,
                        transactionType=Transaction.TransactionType.REFUND,
                        amount=refund_amount,
                        balanceAfter=client_wallet.balance,
                        status=Transaction.TransactionStatus.COMPLETED,
                        description=f"Refund for rejected INVITE job: {job.title}",
                        relatedJobID=job,
                        completedAt=timezone.now(),
                        referenceNumber=f"REFUND-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                    )
                    
                    print(f"💰 Refunded ₱{refund_amount} to client wallet")
                except Wallet.DoesNotExist:
                    print(f"⚠️ Wallet not found for client, skipping refund")
        
        # Send notification to client
        rejection_msg = f"{agency.businessName} has declined your invitation for '{job.title}'."
        if reason:
            rejection_msg += f" Reason: {reason}"
        rejection_msg += " Your escrow payment has been refunded."
        
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="JOB_INVITE_REJECTED",
            title=f"{agency.businessName} Declined Your Invitation",
            message=rejection_msg,
            relatedJobID=job.jobID
        )
        
        # Send confirmation to agency
        Notification.objects.create(
            accountFK=request.auth,
            notificationType="JOB_INVITE_REJECTED_CONFIRM",
            title=f"Job Declined: {job.title}",
            message=f"You've declined the job invitation for '{job.title}'.",
            relatedJobID=job.jobID
        )
        
        print(f"✅ Agency {agency.agencyId} rejected job {job_id}")
        
        return {
            "success": True,
            "message": "Job invitation rejected. Client has been notified and refunded.",
            "job_id": job.jobID,
            "invite_status": "REJECTED",
            "refund_processed": job.escrowPaid
        }
        
    except Exception as e:
        print(f"❌ Error rejecting job invite: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to reject job invite: {str(e)}"},
            status=500
        )


# Agency Phase 2 - Employee Management Endpoints

@router.put("/employees/{employee_id}/rating", auth=cookie_auth, response=schemas.UpdateEmployeeRatingResponse)
def update_employee_rating(request, employee_id: int, rating: float, reason: str | None = None):
	"""
	Update an employee's rating manually.
	
	Args:
		employee_id: ID of the employee to update
		rating: New rating (0.00 to 5.00)
		reason: Optional reason for the rating update
	
	Returns:
		Updated employee rating info
	"""
	try:
		account_id = request.auth.accountID
		result = services.update_employee_rating(account_id, employee_id, rating, reason)
		return result
	except ValueError as e:
		return Response({"error": str(e)}, status=400)
	except Exception as e:
		print(f"Error updating employee rating: {str(e)}")
		return Response({"error": "Internal server error"}, status=500)


@router.post("/employees/{employee_id}/set-eotm", auth=cookie_auth, response=schemas.SetEmployeeOfMonthResponse)
def set_employee_of_month(request, employee_id: int, payload: schemas.SetEmployeeOfMonthSchema):
	"""
	Set an employee as Employee of the Month.
	Only one employee can be EOTM per agency at a time.
	
	Args:
		employee_id: ID of the employee to set as EOTM
		payload: Request body containing reason for selection
	
	Returns:
		Updated employee EOTM info
	"""
	try:
		account_id = request.auth.accountID
		result = services.set_employee_of_month(account_id, employee_id, payload.reason)
		return result
	except ValueError as e:
		return Response({"error": str(e)}, status=400)
	except Exception as e:
		print(f"Error setting employee of month: {str(e)}")
		return Response({"error": "Internal server error"}, status=500)


@router.get("/employees/{employee_id}/performance", auth=cookie_auth, response=schemas.EmployeePerformanceResponse)
def get_employee_performance(request, employee_id: int):
	"""
	Get comprehensive performance statistics for an employee.
	
	Args:
		employee_id: ID of the employee
	
	Returns:
		Employee performance statistics including jobs, earnings, ratings
	"""
	try:
		account_id = request.auth.accountID
		result = services.get_employee_performance(account_id, employee_id)
		return result
	except ValueError as e:
		return Response({"error": str(e)}, status=400)
	except Exception as e:
		print(f"Error fetching employee performance: {str(e)}")
		return Response({"error": "Internal server error"}, status=500)


@router.get("/employees/leaderboard", auth=cookie_auth, response=schemas.EmployeeLeaderboardResponse)
def get_employee_leaderboard(request, sort_by: str = 'rating'):
	"""
	Get employee leaderboard sorted by various metrics.
	Only includes active employees.
	
	Query Parameters:
		sort_by: Sort metric ('rating', 'jobs', 'earnings') - default: 'rating'
	
	Returns:
		Ranked list of employees with their performance metrics
	"""
	try:
		account_id = request.auth.accountID
		result = services.get_employee_leaderboard(account_id, sort_by)
		return result
	except ValueError as e:
		return Response({"error": str(e)}, status=400)
	except Exception as e:
		print(f"Error fetching employee leaderboard: {str(e)}")
		return Response({"error": "Internal server error"}, status=500)


@router.post("/jobs/{job_id}/assign-employee", auth=cookie_auth)
def assign_job_to_employee_endpoint(
	request,
	job_id: int,
    employee_id: int = Form(...),
    assignment_notes: str | None = Form(None)
):
	"""
	Assign an accepted job to a specific employee

	POST /api/agency/jobs/{job_id}/assign-employee
	Body (FormData):
		- employee_id: int (required)
		- assignment_notes: str (optional)
	"""
	try:
		result = services.assign_job_to_employee(
			agency_account=request.auth,
			job_id=job_id,
			employee_id=employee_id,
			assignment_notes=assignment_notes
		)
		return Response(result, status=200)

	except ValueError as e:
		return Response({'success': False, 'error': str(e)}, status=400)
	except Exception as e:
		print(f"❌ Error assigning job to employee: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response(
			{'success': False, 'error': 'Internal server error'},
			status=500
		)


@router.post("/jobs/{job_id}/unassign-employee", auth=cookie_auth)
def unassign_job_from_employee_endpoint(
	request,
	job_id: int,
    reason: str | None = Form(None)
):
	"""
	Unassign an employee from a job

	POST /api/agency/jobs/{job_id}/unassign-employee
	Body (FormData):
		- reason: str (optional)
	"""
	try:
		result = services.unassign_job_from_employee(
			agency_account=request.auth,
			job_id=job_id,
			reason=reason
		)
		return Response(result, status=200)

	except ValueError as e:
		return Response({'success': False, 'error': str(e)}, status=400)
	except Exception as e:
		print(f"❌ Error unassigning employee: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response(
			{'success': False, 'error': 'Internal server error'},
			status=500
		)


@router.get("/employees/{employee_id}/workload", auth=cookie_auth)
def get_employee_workload_endpoint(request, employee_id: int):
	"""
	Get current workload for an employee

	GET /api/agency/employees/{employee_id}/workload
	"""
	try:
		result = services.get_employee_workload(
			agency_account=request.auth,
			employee_id=employee_id
		)
		return Response(result, status=200)

	except ValueError as e:
		return Response({'success': False, 'error': str(e)}, status=400)
	except Exception as e:
		print(f"❌ Error getting employee workload: {str(e)}")
		return Response(
			{'success': False, 'error': 'Internal server error'},
			status=500
		)


# ============================================================
# Multi-Employee Assignment Endpoints (NEW)
# ============================================================

@router.post("/jobs/{job_id}/assign-employees", auth=cookie_auth)
def assign_employees_to_job_endpoint(request, job_id: int):
	"""
	Assign multiple employees to a job.
	
	POST /api/agency/jobs/{job_id}/assign-employees
	Body (JSON):
		- employee_ids: list[int] (required) - List of employee IDs to assign
		- primary_contact_id: int (optional) - ID of employee to be team lead
		- assignment_notes: str (optional)
	"""
	import json
	try:
		data = json.loads(request.body)
		employee_ids = data.get('employee_ids', [])
		primary_contact_id = data.get('primary_contact_id')
		assignment_notes = data.get('assignment_notes', '')
		
		if not employee_ids:
			return Response({'success': False, 'error': 'employee_ids is required'}, status=400)
		
		result = services.assign_employees_to_job(
			agency_account=request.auth,
			job_id=job_id,
			employee_ids=employee_ids,
			primary_contact_id=primary_contact_id,
			assignment_notes=assignment_notes
		)
		return Response(result, status=200)
	
	except json.JSONDecodeError:
		return Response({'success': False, 'error': 'Invalid JSON body'}, status=400)
	except ValueError as e:
		return Response({'success': False, 'error': str(e)}, status=400)
	except Exception as e:
		print(f"❌ Error assigning employees to job: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response(
			{'success': False, 'error': 'Internal server error'},
			status=500
		)


@router.delete("/jobs/{job_id}/employees/{employee_id}", auth=cookie_auth)
def remove_employee_from_job_endpoint(request, job_id: int, employee_id: int):
	"""
	Remove a single employee from a multi-employee job.
	
	DELETE /api/agency/jobs/{job_id}/employees/{employee_id}
	Query params:
		- reason: str (optional)
	"""
	try:
		reason = request.GET.get('reason', '')
		
		result = services.remove_employee_from_job(
			agency_account=request.auth,
			job_id=job_id,
			employee_id=employee_id,
			reason=reason
		)
		return Response(result, status=200)
	
	except ValueError as e:
		return Response({'success': False, 'error': str(e)}, status=400)
	except Exception as e:
		print(f"❌ Error removing employee from job: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response(
			{'success': False, 'error': 'Internal server error'},
			status=500
		)


@router.get("/jobs/{job_id}/employees", auth=cookie_auth)
def get_job_employees_endpoint(request, job_id: int):
	"""
	Get all employees assigned to a job.
	
	GET /api/agency/jobs/{job_id}/employees
	"""
	try:
		result = services.get_job_assigned_employees(
			agency_account=request.auth,
			job_id=job_id
		)
		return Response(result, status=200)
	
	except ValueError as e:
		return Response({'success': False, 'error': str(e)}, status=400)
	except Exception as e:
		print(f"❌ Error getting job employees: {str(e)}")
		return Response(
			{'success': False, 'error': 'Internal server error'},
			status=500
		)


@router.put("/jobs/{job_id}/primary-contact/{employee_id}", auth=cookie_auth)
def set_primary_contact_endpoint(request, job_id: int, employee_id: int):
	"""
	Change the primary contact/team lead for a job.
	
	PUT /api/agency/jobs/{job_id}/primary-contact/{employee_id}
	"""
	try:
		result = services.set_primary_contact(
			agency_account=request.auth,
			job_id=job_id,
			employee_id=employee_id
		)
		return Response(result, status=200)
	
	except ValueError as e:
		return Response({'success': False, 'error': str(e)}, status=400)
	except Exception as e:
		print(f"❌ Error setting primary contact: {str(e)}")
		return Response(
			{'success': False, 'error': 'Internal server error'},
			status=500
		)


# ============================================================
# Agency Chat/Messaging Endpoints
# ============================================================

@router.get("/conversations", auth=cookie_auth)
def get_agency_conversations(request, filter: str = "all"):
	"""
	Get all conversations for jobs managed by this agency.
	Shows conversations where agency employees are assigned.
	
	Query params:
	- filter: 'all', 'unread', or 'archived' (default: 'all')
	"""
	try:
		from profiles.models import Conversation, Message
		from accounts.models import Job, Profile
		from django.db.models import Q, Count, Max
		
		account = request.auth
		
		# Verify user is an agency (has AgencyKYC)
		from .models import AgencyKYC, AgencyEmployee
		agency_kyc = AgencyKYC.objects.filter(accountFK=account).first()
		if not agency_kyc:
			return Response({"error": "Agency account not found"}, status=400)
		
		print(f"\n🏢 === AGENCY CONVERSATIONS DEBUG ===")
		print(f"📧 Agency account: {account.email}")
		
		# Get all employees of this agency
		agency_employees = AgencyEmployee.objects.filter(agency=account)
		print(f"👥 Agency employees: {agency_employees.count()}")
		
		# Get agency's profile (to find conversations where agency is worker)
		agency_profile = Profile.objects.filter(accountFK=account).first()
		
		# Find all jobs where:
		# 1. Job was sent to agency (inviteStatus = ACCEPTED, invitedAgencyID exists)
		# 2. Or job has an assigned employee from this agency
		from .models import AgencyEmployee
		
		# Get conversations where agency is the worker (for INVITE jobs)
		conversations_query = Conversation.objects.filter(
			Q(worker=agency_profile) |  # Agency is in worker role
			Q(relatedJobPosting__assignedEmployeeID__agency=account)  # Employee from this agency is assigned
		).select_related(
			'client__accountFK',
			'worker__accountFK',
			'relatedJobPosting',
			'relatedJobPosting__assignedEmployeeID',
			'lastMessageSender'
		).distinct()
		
		print(f"💬 Total conversations found: {conversations_query.count()}")
		
		# Apply filters
		if filter == "archived":
			# For agencies, use worker archived status
			conversations_query = conversations_query.filter(archivedByWorker=True)
		else:
			conversations_query = conversations_query.filter(archivedByWorker=False)
			
			if filter == "unread":
				conversations_query = conversations_query.filter(unreadCountWorker__gt=0)
		
		conversations = conversations_query.order_by('-updatedAt')
		
		print(f"📊 After filters: {conversations.count()} conversations")
		
		result = []
		for conv in conversations:
			job = conv.relatedJobPosting
			client_profile = conv.client
			
			# Get assigned employee info if exists (legacy single employee)
			assigned_employee = None
			if job.assignedEmployeeID:
				emp = job.assignedEmployeeID
				assigned_employee = {
					"employeeId": emp.employeeID,
					"name": emp.name,
					"email": emp.email,
					"role": emp.role,
					"avatar": emp.avatar,
					"rating": float(emp.rating) if emp.rating else None,
					"totalJobsCompleted": emp.totalJobsCompleted,
					"totalEarnings": float(emp.totalEarnings) if emp.totalEarnings else 0,
					"employeeOfTheMonth": emp.employeeOfTheMonth,
					"rank": 0
				}
			
			# Get ALL assigned employees from M2M (multi-employee support)
			from accounts.models import JobEmployeeAssignment
			assigned_employees = []
			assignments = JobEmployeeAssignment.objects.filter(
				job=job,
				status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
			).select_related('employee').order_by('-isPrimaryContact', 'assignedAt')
			
			for assignment in assignments:
				emp = assignment.employee
				assigned_employees.append({
					"employeeId": emp.employeeID,
					"name": emp.name,
					"email": emp.email,
					"role": emp.role,
					"avatar": emp.avatar,
					"rating": float(emp.rating) if emp.rating else None,
					"isPrimaryContact": assignment.isPrimaryContact,
					"status": assignment.status,
				})
			
			# Fallback: if no M2M assignments but legacy field is set
			if not assigned_employees and job.assignedEmployeeID:
				emp = job.assignedEmployeeID
				assigned_employees.append({
					"employeeId": emp.employeeID,
					"name": emp.name,
					"email": emp.email,
					"role": emp.role,
					"avatar": emp.avatar,
					"rating": float(emp.rating) if emp.rating else None,
					"isPrimaryContact": True,
					"status": "ASSIGNED",
				})
			
			# Get client info
			client_info = {
				"name": f"{client_profile.firstName} {client_profile.lastName}".strip() or client_profile.accountFK.email,
				"avatar": client_profile.profileImg,
				"profile_type": "CLIENT",
				"location": client_profile.location if hasattr(client_profile, 'location') else None,
				"job_title": None
			}
			
			# Count unread (agency is worker side)
			unread_count = conv.unreadCountWorker
			is_archived = conv.archivedByWorker
			
			# Check review status
			from accounts.models import JobReview
			worker_reviewed = JobReview.objects.filter(jobID=job, reviewerID=account).exists()
			client_reviewed = JobReview.objects.filter(jobID=job, reviewerID=client_profile.accountFK).exists()
			
			result.append({
				"id": conv.conversationID,
				"job": {
					"id": job.jobID,
					"title": job.title,
					"status": job.status,
					"budget": float(job.budget),
					"location": job.location,
					"workerMarkedComplete": job.workerMarkedComplete,
					"clientMarkedComplete": job.clientMarkedComplete,
					"workerReviewed": worker_reviewed,
					"clientReviewed": client_reviewed,
					"assignedEmployeeId": job.assignedEmployeeID.employeeID if job.assignedEmployeeID else None,
					"assignedEmployeeName": job.assignedEmployeeID.name if job.assignedEmployeeID else None
				},
				"client": client_info,
				"assigned_employee": assigned_employee,
				"assigned_employees": assigned_employees,  # Multi-employee support
				"last_message": conv.lastMessageText,
				"last_message_time": conv.updatedAt.isoformat() if conv.updatedAt else None,
				"unread_count": unread_count,
				"is_archived": is_archived,
				"status": conv.status,
				"created_at": conv.createdAt.isoformat()
			})
		
		return Response({
			"success": True,
			"conversations": result,
			"total": len(result)
		})
		
	except Exception as e:
		print(f"❌ Error getting agency conversations: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response({"error": "Internal server error"}, status=500)


@router.get("/conversations/{conversation_id}/messages", auth=cookie_auth)
def get_agency_conversation_messages(request, conversation_id: int):
	"""
	Get messages for a specific conversation.
	Marks messages as read for the agency.
	"""
	try:
		from profiles.models import Conversation, Message
		from accounts.models import Profile
		from .models import AgencyKYC
		
		account = request.auth
		
		# Verify agency
		agency_kyc = AgencyKYC.objects.filter(accountFK=account).first()
		if not agency_kyc:
			return Response({"error": "Agency account not found"}, status=400)
		
		agency_profile = Profile.objects.filter(accountFK=account).first()
		
		# Get conversation
		conv = Conversation.objects.filter(
			conversationID=conversation_id
		).select_related(
			'client__accountFK',
			'worker__accountFK',
			'relatedJobPosting',
			'relatedJobPosting__assignedEmployeeID'
		).first()
		
		if not conv:
			return Response({"error": "Conversation not found"}, status=404)
		
		# Verify agency has access (via agency field on conversation)
		job = conv.relatedJobPosting
		from accounts.models import Agency
		agency = Agency.objects.filter(accountFK=account).first()
		has_access = (
			(conv.agency and conv.agency == agency) or
			(conv.worker and conv.worker == agency_profile) or 
			(job.assignedAgencyFK and job.assignedAgencyFK == agency)
		)
		
		if not has_access:
			return Response({"error": "Access denied"}, status=403)
		
		# Get messages
		messages = Message.objects.filter(
			conversationID=conv
		).select_related('sender__accountFK', 'senderAgency').order_by('createdAt')
		
		# Mark messages as read (agency is worker side)
		Message.objects.filter(
			conversationID=conv,
			isRead=False
		).exclude(sender=agency_profile).update(isRead=True)
		
		# Reset unread count
		conv.unreadCountWorker = 0
		conv.save(update_fields=['unreadCountWorker'])
		
		# Build response
		client_profile = conv.client
		client_info = {
			"name": f"{client_profile.firstName} {client_profile.lastName}".strip() or client_profile.accountFK.email,
			"avatar": client_profile.profileImg,
			"profile_type": "CLIENT",
			"location": client_profile.location if hasattr(client_profile, 'location') else None,
			"job_title": None
		}
		
		# Get assigned employee (legacy single employee)
		assigned_employee = None
		if job.assignedEmployeeID:
			emp = job.assignedEmployeeID
			assigned_employee = {
				"employeeId": emp.employeeID,
				"name": emp.name,
				"email": emp.email,
				"role": emp.role,
				"avatar": emp.avatar,
				"rating": float(emp.rating) if emp.rating else None,
				"totalJobsCompleted": emp.totalJobsCompleted,
				"totalEarnings": float(emp.totalEarnings) if emp.totalEarnings else 0,
				"employeeOfTheMonth": emp.employeeOfTheMonth,
				"rank": 0
			}
		
		# Get ALL assigned employees from M2M (multi-employee support)
		from accounts.models import JobEmployeeAssignment
		assigned_employees = []
		assignments = JobEmployeeAssignment.objects.filter(
			job=job,
			status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
		).select_related('employee').order_by('-isPrimaryContact', 'assignedAt')
		
		for assignment in assignments:
			emp = assignment.employee
			assigned_employees.append({
				"employeeId": emp.employeeID,
				"name": emp.name,
				"email": emp.email,
				"role": emp.role,
				"avatar": emp.avatar,
				"rating": float(emp.rating) if emp.rating else None,
				"isPrimaryContact": assignment.isPrimaryContact,
				"status": assignment.status,
			})
		
		# Fallback: if no M2M assignments but legacy field is set
		if not assigned_employees and job.assignedEmployeeID:
			emp = job.assignedEmployeeID
			assigned_employees.append({
				"employeeId": emp.employeeID,
				"name": emp.name,
				"email": emp.email,
				"role": emp.role,
				"avatar": emp.avatar,
				"rating": float(emp.rating) if emp.rating else None,
				"isPrimaryContact": True,
				"status": "ASSIGNED",
			})
		
		# Check review status
		from accounts.models import JobReview
		worker_reviewed = JobReview.objects.filter(jobID=job, reviewerID=account).exists()
		client_reviewed = JobReview.objects.filter(jobID=job, reviewerID=client_profile.accountFK).exists()
		
		messages_list = []
		
		# Build base URL for media files from request
		# This ensures URLs work from any client (web on localhost, mobile on IP)
		scheme = request.scheme if hasattr(request, 'scheme') else 'http'
		host = request.get_host() if hasattr(request, 'get_host') else 'localhost:8000'
		base_url = f"{scheme}://{host}"
		
		for msg in messages:
			# Check if message is from agency (either via senderAgency or via agency_profile)
			is_mine = (msg.senderAgency and msg.senderAgency == agency) or (msg.sender and msg.sender == agency_profile)
			sent_by_agency = is_mine
			
			# Get sender name from either Profile or Agency
			sender_name = msg.get_sender_name() if hasattr(msg, 'get_sender_name') else (
				f"{msg.sender.firstName} {msg.sender.lastName}".strip() if msg.sender else 
				(msg.senderAgency.businessName if msg.senderAgency else "Unknown")
			)
			sender_avatar = msg.sender.profileImg if msg.sender else None
			
			# For IMAGE messages, get the image URL from attachment
			message_text = msg.messageText
			if msg.messageType == "IMAGE":
				from profiles.models import MessageAttachment
				attachment = MessageAttachment.objects.filter(messageID=msg).first()
				if attachment:
					file_url = attachment.fileURL
					# Convert relative URL to absolute if needed
					if file_url and file_url.startswith('/'):
						file_url = f"{base_url}{file_url}"
					message_text = file_url
			
			messages_list.append({
				"message_id": msg.messageID,
				"sender_name": sender_name,
				"sender_avatar": sender_avatar,
				"message_text": message_text,
				"message_type": msg.messageType,
				"is_read": msg.isRead,
				"created_at": msg.createdAt.isoformat(),
				"is_mine": is_mine,
				"sent_by_agency": sent_by_agency
			})
		
		return Response({
			"conversation_id": conv.conversationID,
			"job": {
				"id": job.jobID,
				"title": job.title,
				"status": job.status,
				"budget": float(job.budget),
				"location": job.location,
				"clientConfirmedWorkStarted": job.clientConfirmedWorkStarted,
				"workerMarkedComplete": job.workerMarkedComplete,
				"clientMarkedComplete": job.clientMarkedComplete,
				"workerReviewed": worker_reviewed,
				"clientReviewed": client_reviewed,
				"assignedEmployeeId": job.assignedEmployeeID.employeeID if job.assignedEmployeeID else None,
				"assignedEmployeeName": job.assignedEmployeeID.name if job.assignedEmployeeID else None
			},
			"client": client_info,
			"assigned_employee": assigned_employee,
			"assigned_employees": assigned_employees,  # Multi-employee support
			"messages": messages_list,
			"total_messages": len(messages_list),
			"status": conv.status
		})
		
	except Exception as e:
		print(f"❌ Error getting conversation messages: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response({"error": "Internal server error"}, status=500)


@router.post("/conversations/{conversation_id}/send", auth=cookie_auth)
def send_agency_message(request, conversation_id: int, payload: schemas.AgencySendMessageSchema):
	"""
	Send a message in a conversation on behalf of the agency.
	"""
	try:
		from profiles.models import Conversation, Message
		from accounts.models import Profile, Agency
		from .models import AgencyKYC
		
		account = request.auth
		
		# Verify agency exists
		agency = Agency.objects.filter(accountFK=account).first()
		if not agency:
			return Response({"error": "Agency account not found"}, status=400)
		
		# Agency profile is optional (agency users may not have one)
		agency_profile = Profile.objects.filter(accountFK=account).first()
		
		# Get conversation
		conv = Conversation.objects.filter(
			conversationID=conversation_id
		).select_related(
			'client__accountFK',
			'worker__accountFK',
			'agency',
			'relatedJobPosting',
			'relatedJobPosting__assignedAgencyFK'
		).first()
		
		if not conv:
			return Response({"error": "Conversation not found"}, status=404)
		
		# Verify agency has access (via agency field on conversation)
		job = conv.relatedJobPosting
		has_access = (
			(conv.agency and conv.agency == agency) or
			(conv.worker and agency_profile and conv.worker == agency_profile) or 
			(job.assignedAgencyFK and job.assignedAgencyFK == agency)
		)
		
		if not has_access:
			return Response({"error": "Access denied"}, status=403)
		
		# Create message - use senderAgency for agency users without profile
		message = Message.objects.create(
			conversationID=conv,
			sender=agency_profile,  # May be None
			senderAgency=agency if not agency_profile else None,  # Use agency if no profile
			messageText=payload.message_text,
			messageType=payload.message_type,
			isRead=False
		)
		
		# Update conversation - Note: Message.save() already handles some of this
		conv.lastMessageText = payload.message_text[:100] if len(payload.message_text) > 100 else payload.message_text
		conv.lastMessageSender = agency_profile  # May be None for agency users
		conv.unreadCountClient += 1  # Increment client's unread
		conv.save(update_fields=['lastMessageText', 'lastMessageSender', 'unreadCountClient', 'updatedAt'])
		
		# Get sender name
		sender_name = agency.businessName
		if agency_profile:
			sender_name = f"{agency_profile.firstName} {agency_profile.lastName}".strip() or agency.businessName
		
		# Send WebSocket notification (if available)
		try:
			from channels.layers import get_channel_layer
			from asgiref.sync import async_to_sync
			
			channel_layer = get_channel_layer()
			if channel_layer:
				async_to_sync(channel_layer.group_send)(
					f"chat_{conv.conversationID}",
					{
						"type": "chat_message",
						"message": {
							"conversation_id": conv.conversationID,
							"message_id": message.messageID,
							"sender_name": sender_name,
							"sender_avatar": agency_profile.profileImg if agency_profile else None,
							"message": message.messageText,
							"type": message.messageType,
							"created_at": message.createdAt.isoformat(),
							"is_mine": False
						}
					}
				)
		except Exception as ws_error:
			print(f"⚠️ WebSocket notification failed: {ws_error}")
		
		return Response({
			"success": True,
			"message": {
				"message_id": message.messageID,
				"sender_name": sender_name,
				"sender_avatar": agency_profile.profileImg if agency_profile else None,
				"message_text": message.messageText,
				"message_type": message.messageType,
				"is_read": False,
				"created_at": message.createdAt.isoformat(),
				"is_mine": True,
				"sent_by_agency": True
			}
		})
		
	except Exception as e:
		print(f"❌ Error sending message: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response({"error": "Internal server error"}, status=500)


@router.post("/conversations/{conversation_id}/upload-image", auth=cookie_auth)
def upload_agency_chat_image(request, conversation_id: int):
	"""
	Upload an image to an agency chat conversation.
	Creates a new IMAGE type message with the uploaded image URL.
	
	Args:
		conversation_id: ID of the conversation
		image: Image file (JPEG, PNG, JPG, max 5MB) from request.FILES
	
	Returns:
		success: bool
		message_id: int
		image_url: string
		uploaded_at: datetime
	"""
	try:
		from django.conf import settings
		from django.utils import timezone
		from ninja import File, UploadedFile
		from profiles.models import Conversation, Message, MessageAttachment
		from accounts.models import Profile, Agency
		import os
		
		account = request.auth
		
		# Verify agency - get Agency directly from account
		try:
			agency = Agency.objects.get(accountFK=account)
		except Agency.DoesNotExist:
			return Response({"error": "Agency account not found"}, status=400)
		
		agency_profile = Profile.objects.filter(accountFK=account).first()
		
		# Get image from request.FILES
		image = request.FILES.get('image')
		if not image:
			return Response({"error": "No image file provided"}, status=400)
		
		# Get the conversation
		try:
			conversation = Conversation.objects.select_related(
				'client',
				'agency',
				'worker__accountFK',
				'relatedJobPosting',
				'relatedJobPosting__assignedAgencyFK'
			).get(conversationID=conversation_id)
		except Conversation.DoesNotExist:
			return Response({"error": "Conversation not found"}, status=404)
		
		# Verify agency has access (same logic as send_message)
		job = conversation.relatedJobPosting
		has_access = (
			(conversation.agency and conversation.agency == agency) or
			(conversation.worker and agency_profile and conversation.worker == agency_profile) or 
			(job and job.assignedAgencyFK and job.assignedAgencyFK == agency)
		)
		
		if not has_access:
			return Response(
				{"error": "You are not authorized to access this conversation"},
				status=403
			)
		
		# Validate file size (5MB max)
		if image.size > 5 * 1024 * 1024:
			return Response({"error": "Image size must be less than 5MB"}, status=400)
		
		# Validate file type
		allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
		if image.content_type not in allowed_types:
			return Response(
				{"error": "Invalid file type. Allowed: JPEG, PNG, JPG, WEBP"},
				status=400
			)
		
		# Check if storage is configured
		if not settings.STORAGE:
			return Response({"error": "File storage not configured"}, status=500)
		
		# Generate unique filename
		timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
		file_extension = os.path.splitext(image.name)[1] if image.name else '.jpg'
		filename = f"agency_message_{timestamp}_{agency.agencyId}{file_extension}"
		
		# Storage path
		storage_path = f"chat/conversation_{conversation_id}/images/{filename}"
		
		try:
			# Read file content
			file_content = image.read()
			
			# Upload using unified STORAGE adapter
			upload_response = settings.STORAGE.storage().from_('iayos_files').upload(
				storage_path,
				file_content,
				{"upsert": "true"}
			)
			
			# Check for upload error
			if isinstance(upload_response, dict) and 'error' in upload_response:
				raise Exception(f"Upload failed: {upload_response['error']}")
			
			# Get public URL (relative for local storage)
			public_url = settings.STORAGE.storage().from_('iayos_files').get_public_url(storage_path)
			
			# Create IMAGE type message (from agency)
			message = Message.objects.create(
				conversationID=conversation,
				sender=None,  # Agency messages have no Profile sender
				senderAgency=agency,
				messageText="",  # Empty text for image messages
				messageType="IMAGE"
			)
			
			# Create message attachment record
			MessageAttachment.objects.create(
				messageID=message,
				fileURL=public_url,
				fileType="IMAGE"
			)
			
			# Build full URL for response
			scheme = request.scheme if hasattr(request, 'scheme') else 'http'
			host = request.get_host() if hasattr(request, 'get_host') else 'localhost:8000'
			base_url = f"{scheme}://{host}"
			full_url = f"{base_url}{public_url}" if public_url.startswith('/') else public_url
			
			print(f"✅ Agency chat image uploaded: {full_url}")
			
			# Send WebSocket notification
			try:
				from channels.layers import get_channel_layer
				from asgiref.sync import async_to_sync
				
				channel_layer = get_channel_layer()
				if channel_layer:
					async_to_sync(channel_layer.group_send)(
						f"chat_{conversation.conversationID}",
						{
							"type": "chat_message",
							"message": {
								"conversation_id": conversation.conversationID,
								"message_id": message.messageID,
								"sender_name": agency.businessName,
								"sender_avatar": None,
								"message": "",
								"type": "IMAGE",
								"image_url": full_url,
								"created_at": message.createdAt.isoformat(),
								"is_mine": False
							}
						}
					)
			except Exception as ws_error:
				print(f"⚠️ WebSocket notification failed: {ws_error}")
			
			return {
				"success": True,
				"message_id": message.messageID,
				"image_url": full_url,
				"uploaded_at": message.createdAt.isoformat(),
				"conversation_id": conversation_id
			}
			
		except Exception as upload_error:
			print(f"❌ Agency image upload error: {str(upload_error)}")
			import traceback
			traceback.print_exc()
			return Response(
				{"error": f"Failed to upload image: {str(upload_error)}"},
				status=500
			)
	
	except Exception as e:
		print(f"❌ Error in agency chat image upload: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response({"error": "Internal server error"}, status=500)


@router.post("/conversations/{conversation_id}/toggle-archive", auth=cookie_auth)
def toggle_agency_archive(request, conversation_id: int):
	"""Toggle archive status for a conversation."""
	try:
		from profiles.models import Conversation
		from accounts.models import Profile
		from .models import AgencyKYC
		
		account = request.auth
		
		# Verify agency
		agency_kyc = AgencyKYC.objects.filter(accountFK=account).first()
		if not agency_kyc:
			return Response({"error": "Agency account not found"}, status=400)
		
		agency_profile = Profile.objects.filter(accountFK=account).first()
		
		# Get conversation
		conv = Conversation.objects.filter(conversationID=conversation_id).first()
		if not conv:
			return Response({"error": "Conversation not found"}, status=404)
		
		# Toggle archive (agency is worker side)
		conv.archivedByWorker = not conv.archivedByWorker
		conv.save(update_fields=['archivedByWorker'])
		
		return Response({
			"success": True,
			"is_archived": conv.archivedByWorker,
			"message": "Conversation archived" if conv.archivedByWorker else "Conversation unarchived"
		})
		
	except Exception as e:
		print(f"❌ Error toggling archive: {str(e)}")
		return Response({"error": "Internal server error"}, status=500)


# ============================================
# AGENCY PAYMENT METHODS MANAGEMENT
# ============================================

@router.get("/payment-methods", auth=cookie_auth)
def get_agency_payment_methods(request):
	"""Get agency's payment methods for withdrawals"""
	try:
		from accounts.models import UserPaymentMethod
		from .models import AgencyKYC
		
		account = request.auth
		
		# Verify this is an agency account
		agency = AgencyKYC.objects.filter(accountFK=account).first()
		if not agency:
			return Response({"error": "Agency account not found"}, status=400)
		
		methods = UserPaymentMethod.objects.filter(accountFK=account)
		
		payment_methods = []
		for method in methods:
			payment_methods.append({
				'id': method.id,
				'type': method.methodType,
				'account_name': method.accountName,
				'account_number': method.accountNumber,
				'bank_name': method.bankName,
				'is_primary': method.isPrimary,
				'is_verified': method.isVerified,
				'created_at': method.createdAt.isoformat() if method.createdAt else None
			})
		
		return {
			'payment_methods': payment_methods
		}
	except Exception as e:
		print(f"❌ Get agency payment methods error: {str(e)}")
		return Response(
			{"error": "Failed to fetch payment methods"},
			status=500
		)


@router.post("/payment-methods", auth=cookie_auth)
def add_agency_payment_method(request):
	"""Add a new payment method for agency withdrawals"""
	try:
		from accounts.models import UserPaymentMethod
		from .models import AgencyKYC
		from django.db import transaction as db_transaction
		import json
		
		account = request.auth
		
		# Verify this is an agency account
		agency = AgencyKYC.objects.filter(accountFK=account).first()
		if not agency:
			return Response({"error": "Agency account not found"}, status=400)
		
		# Parse request body
		try:
			data = json.loads(request.body)
		except:
			return Response({"error": "Invalid JSON body"}, status=400)
		
		account_name = data.get('account_name', '').strip()
		account_number = data.get('account_number', '').strip()
		method_type = data.get('type', 'GCASH')
		
		# For now, only GCash is supported
		if method_type != 'GCASH':
			return Response(
				{"error": "Invalid payment method type. Only GCash is supported."},
				status=400
			)
		
		# Validate required fields
		if not account_name or not account_number:
			return Response(
				{"error": "Account name and number are required"},
				status=400
			)
		
		# Validate and clean GCash number format
		clean_number = account_number.replace(' ', '').replace('-', '')
		if not clean_number.startswith('09') or len(clean_number) != 11:
			return Response(
				{"error": "Invalid GCash number format (must be 11 digits starting with 09)"},
				status=400
			)
		
		with db_transaction.atomic():
			# Check if this is the first payment method (auto-set as primary)
			has_existing = UserPaymentMethod.objects.filter(accountFK=account).exists()
			is_first = not has_existing
			
			# Create payment method
			method = UserPaymentMethod.objects.create(
				accountFK=account,
				methodType='GCASH',
				accountName=account_name,
				accountNumber=clean_number,
				bankName=None,
				isPrimary=is_first,  # First one is automatically primary
				isVerified=False  # Will be verified later
			)
			
			print(f"✅ Agency payment method added: {method.methodType} for {account.email}")
		
		return {
			'success': True,
			'message': 'Payment method added successfully',
			'method_id': method.id,
			'is_primary': method.isPrimary
		}
	except Exception as e:
		print(f"❌ Add agency payment method error: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response(
			{"error": "Failed to add payment method"},
			status=500
		)


@router.delete("/payment-methods/{method_id}", auth=cookie_auth)
def delete_agency_payment_method(request, method_id: int):
	"""Delete an agency payment method"""
	try:
		from accounts.models import UserPaymentMethod
		from .models import AgencyKYC
		from django.db import transaction as db_transaction
		
		account = request.auth
		
		# Verify this is an agency account
		agency = AgencyKYC.objects.filter(accountFK=account).first()
		if not agency:
			return Response({"error": "Agency account not found"}, status=400)
		
		method = UserPaymentMethod.objects.filter(
			id=method_id,
			accountFK=account
		).first()
		
		if not method:
			return Response(
				{"error": "Payment method not found"},
				status=404
			)
		
		was_primary = method.isPrimary
		
		with db_transaction.atomic():
			method.delete()
			
			# If deleted method was primary, set another method as primary
			if was_primary:
				next_method = UserPaymentMethod.objects.filter(
					accountFK=account
				).first()
				
				if next_method:
					next_method.isPrimary = True
					next_method.save()
					print(f"✅ Set new primary payment method: {next_method.id}")
		
		print(f"✅ Agency payment method deleted: {method_id} for {account.email}")
		
		return {
			'success': True,
			'message': 'Payment method removed successfully'
		}
	except Exception as e:
		print(f"❌ Delete agency payment method error: {str(e)}")
		return Response(
			{"error": "Failed to remove payment method"},
			status=500
		)


@router.post("/payment-methods/{method_id}/set-primary", auth=cookie_auth)
def set_primary_agency_payment_method(request, method_id: int):
	"""Set an agency payment method as primary"""
	try:
		from accounts.models import UserPaymentMethod
		from .models import AgencyKYC
		from django.db import transaction as db_transaction
		
		account = request.auth
		
		# Verify this is an agency account
		agency = AgencyKYC.objects.filter(accountFK=account).first()
		if not agency:
			return Response({"error": "Agency account not found"}, status=400)
		
		method = UserPaymentMethod.objects.filter(
			id=method_id,
			accountFK=account
		).first()
		
		if not method:
			return Response(
				{"error": "Payment method not found"},
				status=404
			)
		
		with db_transaction.atomic():
			# Remove primary from all other methods
			UserPaymentMethod.objects.filter(
				accountFK=account
			).update(isPrimary=False)
			
			# Set this method as primary
			method.isPrimary = True
			method.save()
		
		print(f"✅ Set primary agency payment method: {method_id} for {account.email}")
		
		return {
			'success': True,
			'message': 'Primary payment method updated'
		}
	except Exception as e:
		print(f"❌ Set primary agency payment method error: {str(e)}")
		return Response(
			{"error": "Failed to update primary payment method"},
			status=500
		)


# ============================================
# AGENCY WALLET WITHDRAWAL (with Xendit)
# ============================================

@router.post("/wallet/withdraw", auth=cookie_auth)
def agency_withdraw_funds(request):
	"""
	Withdraw funds from agency wallet to GCash via Xendit Disbursement.
	Requires a saved payment method (GCash account).
	Deducts balance immediately and creates Xendit disbursement request.
	"""
	try:
		from accounts.models import Wallet, Transaction, UserPaymentMethod
		from accounts.xendit_service import XenditService
		from .models import AgencyKYC
		from decimal import Decimal
		from django.utils import timezone
		from django.db import transaction as db_transaction
		import json
		
		account = request.auth
		
		# Verify this is an agency account
		agency = AgencyKYC.objects.filter(accountFK=account).first()
		if not agency:
			return Response({"error": "Agency account not found"}, status=400)
		
		# Parse request body
		try:
			data = json.loads(request.body)
		except:
			return Response({"error": "Invalid JSON body"}, status=400)
		
		amount = data.get('amount', 0)
		payment_method_id = data.get('payment_method_id')
		notes = data.get('notes', '')
		
		print(f"💸 [Agency] Withdraw request: ₱{amount} to payment method {payment_method_id} from {account.email}")
		
		# Validate amount
		if not amount or amount <= 0:
			return Response(
				{"error": "Amount must be greater than 0"},
				status=400
			)
		
		# Minimum withdrawal of ₱100
		if amount < 100:
			return Response(
				{"error": "Minimum withdrawal amount is ₱100"},
				status=400
			)
		
		# BLOCKER: Require payment method
		if not payment_method_id:
			return Response(
				{"error": "Payment method is required. Please add a GCash account first."},
				status=400
			)
		
		# Get wallet
		try:
			wallet = Wallet.objects.get(accountFK=account)
		except Wallet.DoesNotExist:
			return Response(
				{"error": "Wallet not found"},
				status=404
			)
		
		# Check sufficient balance
		if wallet.balance < Decimal(str(amount)):
			return Response(
				{"error": f"Insufficient balance. Available: ₱{wallet.balance}"},
				status=400
			)
		
		# Get payment method and validate ownership
		try:
			payment_method = UserPaymentMethod.objects.get(
				id=payment_method_id,
				accountFK=account
			)
		except UserPaymentMethod.DoesNotExist:
			return Response(
				{"error": "Payment method not found. Please add a GCash account."},
				status=404
			)
		
		# Only GCash supported for now
		if payment_method.methodType != 'GCASH':
			return Response(
				{"error": "Only GCash withdrawals are currently supported"},
				status=400
			)
		
		# Get agency business name from Agency model (not AgencyKYC)
		from accounts.models import Agency as AgencyModel
		agency_profile = AgencyModel.objects.filter(accountFK=account).first()
		business_name = (agency_profile.businessName if agency_profile else None) or account.email.split('@')[0]
		
		print(f"💰 Agency balance: ₱{wallet.balance}")
		
		# Use atomic transaction to ensure consistency
		with db_transaction.atomic():
			# Deduct balance immediately
			old_balance = wallet.balance
			wallet.balance -= Decimal(str(amount))
			wallet.save()
			
			# Create pending withdrawal transaction
			transaction = Transaction.objects.create(
				walletID=wallet,
				transactionType='WITHDRAWAL',
				amount=Decimal(str(amount)),
				balanceAfter=wallet.balance,
				status='PENDING',
				description=f"Withdrawal to GCash - {payment_method.accountNumber}",
				paymentMethod="GCASH"
			)
			
			print(f"✅ New balance: ₱{wallet.balance}")
			print(f"📤 Creating Xendit disbursement for agency...")
			
			# Create Xendit disbursement
			disbursement_result = XenditService.create_disbursement(
				amount=amount,
				recipient_name=payment_method.accountName,
				account_number=payment_method.accountNumber,
				transaction_id=transaction.transactionID,
				notes=notes or f"Agency withdrawal - {business_name} - ₱{amount}"
			)
			
			if not disbursement_result.get("success"):
				# Rollback balance deduction
				wallet.balance = old_balance
				wallet.save()
				transaction.delete()
				
				print(f"❌ Xendit disbursement failed: {disbursement_result.get('error')}")
				return Response(
					{"error": f"Failed to process withdrawal: {disbursement_result.get('error', 'Payment provider error')}"},
					status=500
				)
			
			# Update transaction with Xendit details
			transaction.xenditInvoiceID = disbursement_result.get('disbursement_id', '')
			transaction.xenditExternalID = disbursement_result.get('external_id', '')
			transaction.xenditPaymentChannel = "GCASH"
			transaction.xenditPaymentMethod = "DISBURSEMENT"
			
			# Mark as completed if disbursement is successful
			if disbursement_result.get('status') == 'COMPLETED':
				transaction.status = 'COMPLETED'
				transaction.completedAt = timezone.now()
			
			transaction.save()
			
			print(f"📄 Disbursement created: {disbursement_result.get('disbursement_id')}")
			print(f"📊 Status: {disbursement_result.get('status')}")
		
		return {
			"success": True,
			"transaction_id": transaction.transactionID,
			"disbursement_id": disbursement_result.get('disbursement_id'),
			"amount": amount,
			"new_balance": float(wallet.balance),
			"status": disbursement_result.get('status', 'PENDING'),
			"recipient": payment_method.accountNumber,
			"recipient_name": payment_method.accountName,
			"message": "Withdrawal request submitted successfully. Funds will be transferred to your GCash within 1-3 business days."
		}
		
	except Exception as e:
		print(f"❌ [Agency] Error withdrawing funds: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response(
			{"error": "Failed to process withdrawal"},
			status=500
		)


@router.get("/reviews", auth=cookie_auth, response=schemas.AgencyReviewsListResponse)
def get_agency_reviews_endpoint(request, page: int = 1, limit: int = 10, review_type: str = None):
	"""
	Get reviews for the authenticated agency.
	
	GET /api/agency/reviews
	Query params:
		- page: int (default 1)
		- limit: int (default 10, max 50)
		- review_type: str (optional) - 'AGENCY', 'EMPLOYEE', or None for all
	
	Returns reviews for both the agency and its employees.
	"""
	try:
		# Validate pagination
		if page < 1:
			page = 1
		if limit < 1:
			limit = 10
		if limit > 50:
			limit = 50
		
		# Validate review_type
		if review_type and review_type not in ['AGENCY', 'EMPLOYEE']:
			review_type = None
		
		result = services.get_agency_reviews(
			account_id=request.auth.accountID,
			page=page,
			limit=limit,
			review_type=review_type
		)
		return result
	
	except ValueError as e:
		return Response({'success': False, 'error': str(e)}, status=400)
	except Exception as e:
		print(f"❌ Error fetching agency reviews: {str(e)}")
		import traceback
		traceback.print_exc()
		return Response(
			{'success': False, 'error': 'Internal server error'},
			status=500
		)

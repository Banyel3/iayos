from ninja import Router, Form
from ninja.responses import Response
from accounts.authentication import cookie_auth
from . import services, schemas

router = Router()


@router.post("/upload", auth=cookie_auth, response=schemas.AgencyKYCUploadResponse)
def upload_agency_kyc(request,
                      businessName: str = Form(None),
                      businessDesc: str = Form(None)):
    """Upload agency KYC documents. Expects multipart/form-data. Files are read from request.FILES to avoid bytes validation errors."""
    try:
        # Get account ID from authenticated user
        account_id = request.auth.accountID
        
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
def add_employee(request, name: str = Form(...), email: str = Form(...), role: str = Form(...), avatar: str = Form(None), rating: float = Form(None)):
    """Add a new employee to the agency."""
    try:
        account_id = request.auth.accountID
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
def update_profile(request, 
                   business_name: str = Form(None), 
                   business_description: str = Form(None), 
                   contact_number: str = Form(None)):
    """Update agency profile information."""
    try:
        account_id = request.auth.accountID
        
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
def update_profile(request, business_description: str = Form(None), contact_number: str = Form(None)):
    """Update agency profile information."""
    try:
        account_id = request.auth.accountID
        result = services.update_agency_profile(account_id, business_description, contact_number)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error updating agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


# Simplified agency job endpoints - Direct invite/hire model

@router.get("/jobs", auth=cookie_auth)
def get_agency_jobs(request, status: str = None, invite_status: str = None, page: int = 1, limit: int = 20):
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
            return Response(
                {"error": f"Invite has already been {job.inviteStatus.lower()}"},
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
        job.status = "ACTIVE"  # Job is now active and ready for work
        job.save()
        
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
def reject_job_invite(request, job_id: int, reason: str = None):
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
            return Response(
                {"error": f"Invite has already been {job.inviteStatus.lower()}"},
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

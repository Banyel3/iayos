import json
from ninja import Router, File, Form
from ninja.responses import Response
from ninja.files import UploadedFile
from accounts.authentication import cookie_auth, jwt_auth, dual_auth
from accounts.models import ClientProfile, Specializations, Profile, WorkerProfile, JobApplication, JobPhoto, Wallet, Transaction, Job, JobLog, Agency, JobDispute, DisputeEvidence, Notification
from accounts.xendit_service import XenditService
from .models import JobPosting
# Use Job directly for type checking (JobPosting is just an alias)
from .schemas import CreateJobPostingSchema, CreateJobPostingMobileSchema, JobPostingResponseSchema, JobApplicationSchema, SubmitReviewSchema, ApproveJobCompletionSchema
from datetime import datetime
from django.utils import timezone
from decimal import Decimal
from django.db import transaction as db_transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from typing import List, Optional
import os
from django.conf import settings

router = Router()


def get_user_profile(request):
    """
    Get the user's profile, handling users with multiple profiles by using
    the profile_type from JWT token.
    
    Returns:
        Profile instance or None if not found
    """
    profile_type = getattr(request.auth, 'profile_type', None)
    
    if profile_type:
        # User has profile_type in JWT (handles multiple profiles)
        return Profile.objects.filter(
            accountFK=request.auth,
            profileType=profile_type
        ).first()
    else:
        # Fallback for single profile users
        return Profile.objects.filter(accountFK=request.auth).first()


def broadcast_job_status_update(job_id, update_data):
    """
    Broadcast job status update via WebSocket
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'job_{job_id}',
                {
                    'type': 'job_status_update',
                    'data': update_data
                }
            )
            print(f"📡 Broadcasted job status update for job {job_id}: {update_data}")
        else:
            print(f"⚠️ No channel layer available for broadcasting")
    except Exception as e:
        print(f"❌ Error broadcasting job status: {str(e)}")
        import traceback
        traceback.print_exc()


@router.post("/create", auth=jwt_auth, response=JobPostingResponseSchema)
def create_job_posting(request, data: CreateJobPostingSchema):
    """
    Create a new job posting
    Only clients can create job postings
    Uses JWT Bearer token authentication for mobile compatibility
    """
    try:
        print(f"📝 Job posting creation request from {request.auth.email}")
        print(f"📋 Request data: {data.dict()}")
        
        # Check user's profile type first (handle users with multiple profiles)
        profile = get_user_profile(request)
        if not profile:
            print("❌ No profile found")
            return Response(
                {"error": "Profile not found. Please complete your profile first."},
                status=400
            )
        print(f"👤 User profile type: {profile.profileType}")
        
        # Get or create client profile using profileID (not accountFK)
        if profile.profileType != "CLIENT":
            return Response(
                {"error": f"Only clients can create job postings. Your profile type is: {profile.profileType}"},
                status=403
            )
        
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
            print(f"✅ Client profile found: ID={client_profile.profileID.profileID}")
        except ClientProfile.DoesNotExist:
            print(f"⚠️ Client profile not found, creating one...")
            # Create ClientProfile if it doesn't exist but user is a CLIENT
            client_profile = ClientProfile.objects.create(
                profileID=profile,
                description="",
                totalJobsPosted=0,
                clientRating=0
            )
            print(f"✅ Client profile created: ID={client_profile.profileID.profileID}")
        
        # Validate category exists
        try:
            category = Specializations.objects.get(specializationID=data.category_id)
        except Specializations.DoesNotExist:
            return Response(
                {"error": "Invalid category selected"},
                status=400
            )
        
        # Parse preferred start date if provided
        preferred_start_date = None
        if data.preferred_start_date:
            try:
                preferred_start_date = datetime.strptime(data.preferred_start_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=400
                )
        
        # Calculate 50% downpayment (escrow)
        downpayment = Decimal(str(data.budget)) * Decimal('0.5')
        remaining_payment = Decimal(str(data.budget)) * Decimal('0.5')
        
        # Calculate platform fee (10% of TOTAL BUDGET - this is our revenue)
        platform_fee = Decimal(str(data.budget)) * Decimal('0.10')  # 10% platform fee on total budget
        
        # Client pays: downpayment + platform fee upfront, then remaining payment at completion
        total_to_charge = downpayment + platform_fee  # Total amount to charge client for first payment
        
        print(f"💰 Payment breakdown:")
        print(f"   Total Budget: ₱{data.budget}")
        print(f"   Downpayment (50%): ₱{downpayment}")
        print(f"   Platform Fee (10% of budget): ₱{platform_fee}")
        print(f"   First Payment (downpayment + fee): ₱{total_to_charge}")
        print(f"   Remaining (50%): ₱{remaining_payment}")
        print(f"   Total Client Pays: ₱{Decimal(str(data.budget)) + platform_fee}")
        print(f"   Worker Receives: ₱{data.budget} (full budget)")
        
        # Get or create client's wallet
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': Decimal('0.00')}
        )
        
        if created:
            print(f"💼 New wallet created for {request.auth.email}")
        
        print(f"💳 Current wallet balance: ₱{wallet.balance}")
        
        # Get payment method (default to WALLET)
        payment_method = data.payment_method.upper() if data.payment_method else "WALLET"
        print(f"💳 Payment method selected: {payment_method}")
        
        # Handle payment based on method
        if payment_method == "WALLET":
            # Check if client has sufficient balance for total amount (escrow + platform fee)
            if wallet.balance < total_to_charge:
                return Response(
                    {
                        "error": "Insufficient wallet balance",
                        "required": float(total_to_charge),
                        "available": float(wallet.balance),
                        "message": f"You need ₱{total_to_charge} (₱{downpayment} escrow + ₱{platform_fee} platform fee), but only have ₱{wallet.balance}."
                    },
                    status=400
                )
            
            # Use database transaction to ensure atomicity
            with db_transaction.atomic():
                # Deduct total amount (escrow + platform fee) from wallet balance
                wallet.balance -= total_to_charge
                wallet.save()
                
                print(f"💸 Deducted ₱{total_to_charge} from wallet (₱{downpayment} escrow + ₱{platform_fee} fee). New balance: ₱{wallet.balance}")
                
                # Determine job type: INVITE if worker_id provided (direct hire), otherwise LISTING (open to all)
                job_type = JobPosting.JobType.INVITE if hasattr(data, 'worker_id') and data.worker_id else JobPosting.JobType.LISTING
                
                # Create job posting with escrowPaid=True (already deducted)
                job_posting = JobPosting.objects.create(
                    clientID=client_profile,
                    title=data.title,
                    description=data.description,
                    categoryID=category,
                    budget=data.budget,
                    escrowAmount=downpayment,
                    escrowPaid=True,  # Already deducted from wallet
                    escrowPaidAt=timezone.now(),
                    remainingPayment=remaining_payment,
                    location=data.location,
                    expectedDuration=data.expected_duration,
                    urgency=data.urgency.upper() if data.urgency else "MEDIUM",
                    preferredStartDate=preferred_start_date,
                    materialsNeeded=data.materials_needed if data.materials_needed else [],
                    jobType=job_type,
                    status=JobPosting.JobStatus.ACTIVE
                )
                
                print(f"📋 Job created as {job_type} (Web endpoint)")
                
                # Create completed transaction for escrow payment
                escrow_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    amount=downpayment,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.COMPLETED,
                    description=f"Escrow payment (50% downpayment) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    completedAt=timezone.now(),
                    referenceNumber=f"ESCROW-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                # Create platform fee transaction record (for revenue tracking)
                fee_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.FEE,
                    amount=platform_fee,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.COMPLETED,
                    description=f"Platform fee (10% of budget) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    completedAt=timezone.now(),
                    referenceNumber=f"FEE-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                print(f"✅ Job posting created: ID={job_posting.jobID}, Title='{job_posting.title}'")
                print(f"✅ Escrow transaction completed: ID={escrow_transaction.transactionID}")
                print(f"💰 Platform fee transaction recorded: ID={fee_transaction.transactionID}, Amount=₱{platform_fee}")

                # Create escrow payment notification for client
                from accounts.models import Notification
                Notification.objects.create(
                    accountFK=client_profile.profileID.accountFK,
                    notificationType="ESCROW_PAID",
                    title=f"Job Posted Successfully",
                    message=f"Your job '{job_posting.title}' is now live! Escrow payment of ₱{downpayment} has been deducted from your wallet.",
                    relatedJobID=job_posting.jobID
                )
                print(f"📬 Escrow payment notification sent to client {client_profile.profileID.accountFK.email}")

            return {
                "success": True,
                "requires_payment": False,
                "payment_method": "WALLET",
                "job_posting_id": job_posting.jobID,
                "escrow_amount": float(downpayment),
                "remaining_payment": float(remaining_payment),
                "new_wallet_balance": float(wallet.balance),
                "message": f"Job created successfully! ₱{downpayment} escrow deducted from your wallet."
            }
        
        else:
            return Response(
                {"error": f"Invalid payment method: {payment_method}. Only 'WALLET' is supported."},
                status=400
            )
            # Create job posting first (with escrowPaid=False)
            job_posting = JobPosting.objects.create(
                clientID=client_profile,
                title=data.title,
                description=data.description,
                categoryID=category,
                budget=data.budget,
                escrowAmount=downpayment,
                escrowPaid=False,  # Will be marked true after payment
                remainingPayment=remaining_payment,
                location=data.location,
                expectedDuration=data.expected_duration,
                urgency=data.urgency.upper() if data.urgency else "MEDIUM",
                preferredStartDate=preferred_start_date,
                materialsNeeded=data.materials_needed if data.materials_needed else [],
                status=JobPosting.JobStatus.ACTIVE
            )
            
            # Create pending transaction for escrow payment
            escrow_transaction = Transaction.objects.create(
                walletID=wallet,
                transactionType=Transaction.TransactionType.PAYMENT,
                amount=downpayment,
                balanceAfter=wallet.balance,  # Will update after payment
                status=Transaction.TransactionStatus.PENDING,
                description=f"Escrow payment (50% downpayment) for job: {job_posting.title}",
                relatedJobPosting=job_posting,
                referenceNumber=f"ESCROW-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            )
            
            print(f"✅ Job posting created: ID={job_posting.jobID}, Title='{job_posting.title}'")
            print(f"📋 Pending escrow transaction created: ID={escrow_transaction.transactionID}")
        
        # Get user profile for Xendit invoice
        profile = get_user_profile(request)
        if profile:
            user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or request.auth.email
        else:
            user_name = request.auth.email
        
        # Create Xendit invoice for escrow payment
        print(f"� Creating Xendit invoice for escrow payment...")
        xendit_result = XenditService.create_gcash_payment(
            amount=float(downpayment),
            user_email=request.auth.email,
            user_name=user_name,
            transaction_id=escrow_transaction.transactionID
        )
        
        if not xendit_result.get("success"):
            # If Xendit fails, delete the job and transaction
            job_posting.delete()
            escrow_transaction.delete()
            return Response(
                {"error": "Failed to create payment invoice", "details": xendit_result.get("error")},
                status=500
            )
        
        # Update transaction with Xendit details
        escrow_transaction.xenditInvoiceID = xendit_result['invoice_id']
        escrow_transaction.xenditExternalID = xendit_result['external_id']
        escrow_transaction.invoiceURL = xendit_result['invoice_url']
        escrow_transaction.xenditPaymentChannel = "GCASH"
        escrow_transaction.xenditPaymentMethod = "EWALLET"
        escrow_transaction.save()
        
        print(f"📄 Xendit invoice created: {xendit_result['invoice_id']}")
        print(f"🔗 Payment URL: {xendit_result['invoice_url']}")
        
        return {
            "success": True,
            "requires_payment": True,
            "job_posting_id": job_posting.jobID,
            "escrow_amount": float(downpayment),
            "remaining_payment": float(remaining_payment),
            "invoice_url": xendit_result['invoice_url'],
            "invoice_id": xendit_result['invoice_id'],
            "message": f"Job created. Please complete the ₱{downpayment} escrow payment via Xendit."
        }
        
    except Exception as e:
        print(f"❌ Error creating job posting: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to create job posting: {str(e)}"},
            status=500
        )


@router.post("/create-mobile", auth=jwt_auth, response=JobPostingResponseSchema)
def create_job_posting_mobile(request, data: CreateJobPostingMobileSchema):
    """
    Create a new job posting from mobile app with optional direct worker/agency assignment
    - If worker_id is provided, job is assigned to that specific worker
    - If agency_id is provided, job is assigned to that specific agency
    - Otherwise, works like regular job posting (open to all)
    Uses JWT Bearer token authentication for mobile compatibility
    """
    try:
        print(f"📱 MOBILE job posting creation request from {request.auth.email}")
        print(f"📋 Request data: {data.dict()}")
        
        if data.worker_id:
            print(f"👷 Direct hire for worker ID: {data.worker_id}")
        elif data.agency_id:
            print(f"🏢 Direct hire for agency ID: {data.agency_id}")
        else:
            print(f"📢 Open job posting (no specific worker/agency)")
        
        # Check user's profile type - use profile_type from JWT for users with multiple profiles
        try:
            profile_type = getattr(request.auth, 'profile_type', None)
            
            if profile_type:
                # User has profile_type in JWT (handles multiple profiles)
                profile = Profile.objects.filter(
                    accountFK=request.auth,
                    profileType=profile_type
                ).first()
            else:
                # Fallback for single profile users
                profile = Profile.objects.filter(accountFK=request.auth).first()
            
            if not profile:
                print("❌ No profile found")
                return Response(
                    {"error": "Profile not found. Please complete your profile first."},
                    status=400
                )
            
            print(f"👤 User profile type: {profile.profileType}")
        except Exception as e:
            print(f"❌ Error getting profile: {str(e)}")
            return Response(
                {"error": "Profile not found. Please complete your profile first."},
                status=400
            )
        
        # Get or create client profile using profileID (not accountFK)
        if profile.profileType != "CLIENT":
            return Response(
                {"error": f"Only clients can create job postings. Your profile type is: {profile.profileType}"},
                status=403
            )
        
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
            print(f"✅ Client profile found: ID={client_profile.profileID.profileID}")
        except ClientProfile.DoesNotExist:
            print(f"⚠️ Client profile not found, creating one...")
            client_profile = ClientProfile.objects.create(
                profileID=profile,
                description="",
                totalJobsPosted=0,
                clientRating=0
            )
            print(f"✅ Client profile created: ID={client_profile.profileID.profileID}")
        
        # Validate category exists
        try:
            category = Specializations.objects.get(specializationID=data.category_id)
        except Specializations.DoesNotExist:
            return Response(
                {"error": "Invalid category selected"},
                status=400
            )
        
        assigned_agency = None

        # If worker_id provided, validate worker exists
        if data.worker_id:
            try:
                worker_profile = WorkerProfile.objects.select_related('profileID').get(profileID__profileID=data.worker_id)
                print(f"✅ Worker validated: {worker_profile.profileID.firstName} {worker_profile.profileID.lastName}")
            except WorkerProfile.DoesNotExist:
                return Response(
                    {"error": f"Worker with ID {data.worker_id} not found"},
                    status=400
                )
        elif data.agency_id:
            try:
                assigned_agency = Agency.objects.select_related('accountFK').get(agencyId=data.agency_id)
                print(f"✅ Agency validated: {assigned_agency.businessName}")
            except Agency.DoesNotExist:
                return Response(
                    {"error": f"Agency with ID {data.agency_id} not found"},
                    status=400
                )
        
        # Parse preferred start date if provided
        preferred_start_date = None
        if data.preferred_start_date:
            try:
                preferred_start_date = datetime.strptime(data.preferred_start_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=400
                )
        
        # Calculate 50% downpayment (escrow)
        downpayment = Decimal(str(data.budget)) * Decimal('0.5')
        remaining_payment = Decimal(str(data.budget)) * Decimal('0.5')
        
        # Calculate platform fee (10% of TOTAL BUDGET - this is our revenue)
        platform_fee = Decimal(str(data.budget)) * Decimal('0.10')  # 10% platform fee on total budget
        
        # Client pays: downpayment + platform fee upfront, then remaining payment at completion
        total_to_charge = downpayment + platform_fee  # Total amount to charge client for first payment
        
        print(f"💰 Payment breakdown:")
        print(f"   Total Budget: ₱{data.budget}")
        print(f"   Downpayment (50%): ₱{downpayment}")
        print(f"   Platform Fee (10% of budget): ₱{platform_fee}")
        print(f"   First Payment (downpayment + fee): ₱{total_to_charge}")
        print(f"   Remaining (50%): ₱{remaining_payment}")
        print(f"   Total Client Pays: ₱{Decimal(str(data.budget)) + platform_fee}")
        print(f"   Worker Receives: ₱{data.budget} (full budget)")
        
        # Get or create client's wallet
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': Decimal('0.00')}
        )
        
        if created:
            print(f"💼 New wallet created for {request.auth.email}")
        
        print(f"💳 Current wallet balance: ₱{wallet.balance}")
        
        # Get payment method (default to WALLET)
        payment_method = data.payment_method.upper() if data.payment_method else "WALLET"
        print(f"💳 Payment method selected: {payment_method}")
        
        # Handle payment based on method
        if payment_method == "WALLET":
            # Check if client has sufficient balance for total amount (escrow + platform fee)
            if wallet.balance < total_to_charge:
                return Response(
                    {
                        "error": "Insufficient wallet balance",
                        "required": float(total_to_charge),
                        "available": float(wallet.balance),
                        "message": f"You need ₱{total_to_charge} (₱{downpayment} escrow + ₱{platform_fee} platform fee), but only have ₱{wallet.balance}."
                    },
                    status=400
                )
            
            # Use database transaction to ensure atomicity
            with db_transaction.atomic():
                # Deduct total amount from wallet balance  
                wallet.balance -= total_to_charge
                wallet.save()
                
                print(f"💸 Deducted ₱{total_to_charge} from wallet (₱{downpayment} escrow + ₱{platform_fee} fee). New balance: ₱{wallet.balance}")
                
                # Determine job type: INVITE if worker or agency direct hire
                job_type = JobPosting.JobType.INVITE if (data.worker_id or data.agency_id) else JobPosting.JobType.LISTING
                
                # Create job posting with escrowPaid=True (already deducted)
                job_posting = JobPosting.objects.create(
                    clientID=client_profile,
                    title=data.title,
                    description=data.description,
                    categoryID=category,
                    budget=data.budget,
                    escrowAmount=downpayment,
                    escrowPaid=True,
                    escrowPaidAt=timezone.now(),
                    remainingPayment=remaining_payment,
                    location=data.location,
                    expectedDuration=data.expected_duration,
                    urgency=data.urgency.upper() if data.urgency else "MEDIUM",
                    preferredStartDate=preferred_start_date,
                    materialsNeeded=data.materials_needed if data.materials_needed else [],
                    jobType=job_type,
                    inviteStatus=JobPosting.InviteStatus.PENDING if job_type == JobPosting.JobType.INVITE else None,
                    assignedWorkerID=worker_profile if data.worker_id else None,
                    assignedAgencyFK=assigned_agency if data.agency_id else None,
                    status=JobPosting.JobStatus.ACTIVE
                )
                
                print(f"📋 Job created as {job_type} (worker_id: {data.worker_id or 'None'})")
                
                # If worker_id provided, auto-create application and accept it
                if data.worker_id:
                    job_application = JobApplication.objects.create(
                        jobID=job_posting,
                        workerID=worker_profile,
                        proposalMessage=f"Direct hire by client",
                        proposedBudget=data.budget,
                        estimatedDuration=data.expected_duration or "As discussed",
                        budgetOption="ACCEPT",
                        status=JobApplication.ApplicationStatus.ACCEPTED
                    )
                    print(f"✅ Auto-created and accepted application for worker {data.worker_id}")
                    
                    # Notify worker
                    from accounts.models import Notification
                    Notification.objects.create(
                        accountFK=worker_profile.profileID.accountFK,
                        notificationType="JOB_ASSIGNED",
                        title=f"You've been hired!",
                        message=f"You've been directly hired for: {job_posting.title}",
                        relatedJobID=job_posting.jobID
                    )
                
                # Create completed transaction for escrow payment
                escrow_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    amount=downpayment,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.COMPLETED,
                    description=f"Escrow payment (50% downpayment) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    completedAt=timezone.now(),
                    referenceNumber=f"ESCROW-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                # Create platform fee transaction record (for revenue tracking)
                fee_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.FEE,
                    amount=platform_fee,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.COMPLETED,
                    description=f"Platform fee (10% of budget) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    completedAt=timezone.now(),
                    referenceNumber=f"FEE-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                print(f"✅ Job posting created: ID={job_posting.jobID}, Title='{job_posting.title}'")
                print(f"✅ Escrow transaction completed: ID={escrow_transaction.transactionID}")
                print(f"💰 Platform fee transaction recorded: ID={fee_transaction.transactionID}, Amount=₱{platform_fee}")

                # Create escrow payment notification for client
                from accounts.models import Notification
                
                # Different message for INVITE (direct hire) vs LISTING (public post)
                if data.worker_id:
                    notification_title = "Worker Requested"
                    worker_name = f"{worker_profile.profileID.firstName} {worker_profile.profileID.lastName}"
                    notification_message = f"You've hired {worker_name} for '{job_posting.title}'. Escrow payment of ₱{downpayment} has been deducted from your wallet."
                elif data.agency_id and assigned_agency:
                    notification_title = "Agency Requested"
                    notification_message = f"You've invited {assigned_agency.businessName} for '{job_posting.title}'. Escrow payment of ₱{downpayment} has been deducted from your wallet."
                else:
                    notification_title = "Job Posted Successfully"
                    notification_message = f"Your job '{job_posting.title}' is now live! Escrow payment of ₱{downpayment} has been deducted from your wallet."
                
                Notification.objects.create(
                    accountFK=client_profile.profileID.accountFK,
                    notificationType="ESCROW_PAID",
                    title=notification_title,
                    message=notification_message,
                    relatedJobID=job_posting.jobID
                )
                print(f"📬 Notification sent to client {client_profile.profileID.accountFK.email}")

            return {
                "success": True,
                "requires_payment": False,
                "payment_method": "WALLET",
                "job_posting_id": job_posting.jobID,
                "escrow_amount": float(downpayment),
                "commission_fee": float(platform_fee),
                "platform_fee": float(platform_fee),
                "downpayment_amount": float(total_to_charge),  # Total amount charged (escrow + platform fee)
                "total_amount": float(total_to_charge),
                "remaining_payment": float(remaining_payment),
                "new_wallet_balance": float(wallet.balance),
                "message": f"Job created successfully! ₱{total_to_charge} deducted from your wallet (₱{downpayment} escrow + ₱{platform_fee} platform fee)."
            }
        
        elif payment_method == "GCASH":
            # Use database transaction to ensure atomicity
            with db_transaction.atomic():
                # Determine job type: INVITE if worker/agency direct hire, otherwise LISTING
                job_type = JobPosting.JobType.INVITE if (data.worker_id or data.agency_id) else JobPosting.JobType.LISTING
                
                # Create job posting first (with escrowPaid=False)
                job_posting = JobPosting.objects.create(
                    clientID=client_profile,
                    title=data.title,
                    description=data.description,
                    categoryID=category,
                    budget=data.budget,
                    escrowAmount=downpayment,
                    escrowPaid=False,
                    remainingPayment=remaining_payment,
                    location=data.location,
                    expectedDuration=data.expected_duration,
                    urgency=data.urgency.upper() if data.urgency else "MEDIUM",
                    preferredStartDate=preferred_start_date,
                    materialsNeeded=data.materials_needed if data.materials_needed else [],
                    jobType=job_type,
                    inviteStatus=JobPosting.InviteStatus.PENDING if job_type == JobPosting.JobType.INVITE else None,
                    assignedAgencyFK=assigned_agency if data.agency_id else None,
                    status=JobPosting.JobStatus.ACTIVE
                )
                
                print(f"📋 Job created as {job_type} (worker_id: {data.worker_id or 'None'})")
                
                # If worker_id provided, auto-create application (but don't accept until payment)
                if data.worker_id:
                    worker_profile = WorkerProfile.objects.select_related('profileID').get(profileID__profileID=data.worker_id)
                    job_application = JobApplication.objects.create(
                        jobID=job_posting,
                        workerID=worker_profile,
                        proposalMessage=f"Direct hire by client (pending payment)",
                        proposedBudget=data.budget,
                        estimatedDuration=data.expected_duration or "As discussed",
                        budgetOption="ACCEPT",
                        status=JobApplication.ApplicationStatus.PENDING
                    )
                    print(f"✅ Auto-created application for worker {data.worker_id} (will accept after payment)")
                
                # Create pending transaction for escrow payment
                escrow_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    amount=downpayment,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.PENDING,
                    description=f"Escrow payment (50% downpayment) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    referenceNumber=f"ESCROW-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                print(f"✅ Job posting created: ID={job_posting.jobID}, Title='{job_posting.title}'")
                print(f"📋 Pending escrow transaction created: ID={escrow_transaction.transactionID}")
            
            # Get user profile for Xendit invoice
            profile = get_user_profile(request)
            if profile:
                user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or request.auth.email
            else:
                user_name = request.auth.email
            
            # Create Xendit invoice for escrow payment (including platform fee)
            print(f"💳 Creating Xendit invoice for escrow payment...")
            xendit_result = XenditService.create_gcash_payment(
                amount=float(total_to_charge),  # Include 5% platform fee
                user_email=request.auth.email,
                user_name=user_name,
                transaction_id=escrow_transaction.transactionID
            )
            
            if not xendit_result.get("success"):
                # If Xendit fails, delete the job and transaction
                job_posting.delete()
                escrow_transaction.delete()
                return Response(
                    {"error": "Failed to create payment invoice", "details": xendit_result.get("error")},
                    status=500
                )
            
            # Update transaction with Xendit details
            escrow_transaction.xenditInvoiceID = xendit_result['invoice_id']
            escrow_transaction.xenditExternalID = xendit_result['external_id']
            escrow_transaction.invoiceURL = xendit_result['invoice_url']
            escrow_transaction.xenditPaymentChannel = "GCASH"
            escrow_transaction.xenditPaymentMethod = "EWALLET"
            escrow_transaction.save()
            
            print(f"📄 Xendit invoice created: {xendit_result['invoice_id']}")
            print(f"🔗 Payment URL: {xendit_result['invoice_url']}")
            
            return {
                "success": True,
                "requires_payment": True,
                "payment_method": "GCASH",
                "job_posting_id": job_posting.jobID,
                "escrow_amount": float(downpayment),
                "commission_fee": float(platform_fee),
                "platform_fee": float(platform_fee),
                "downpayment_amount": float(total_to_charge),  # Total amount to charge (escrow + platform fee)
                "total_amount": float(total_to_charge),
                "remaining_payment": float(remaining_payment),
                "invoice_url": xendit_result['invoice_url'],
                "invoice_id": xendit_result['invoice_id'],
                "transaction_id": escrow_transaction.transactionID,
                "message": f"Job created successfully! Please complete the ₱{total_to_charge} GCash payment (₱{downpayment} escrow + ₱{platform_fee} platform fee) to confirm the job."
            }
        
        elif payment_method == "CASH":
            # Cash payment not allowed for initial escrow - only for final payment
            return Response(
                {"error": "Cash payment is not available for initial escrow payment. Please use WALLET. Cash payment can be used for the final 50% payment after job completion."},
                status=400
            )
        
        else:
            return Response(
                {"error": f"Invalid payment method: {payment_method}. Use 'WALLET' or 'GCASH'."},
                status=400
            )
        
    except Exception as e:
        print(f"❌ Error creating mobile job posting: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to create job posting: {str(e)}"},
            status=500
        )


@router.get("/my-jobs", auth=cookie_auth)
def get_my_job_postings(request):
    """
    Get all job postings created by the current client
    """
    try:
        print(f"📋 Fetching job postings for {request.auth.email}")
        
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get client profile
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Only clients can view job postings"},
                status=403
            )
        
        # Get all job postings for this client
        job_postings = JobPosting.objects.filter(
            clientID=client_profile
        ).select_related('categoryID').prefetch_related('photos').order_by('-createdAt')
        
        # Format the response
        jobs = []
        for job in job_postings:
            # Get job photos
            photos = [
                {
                    "id": photo.photoID,
                    "url": photo.photoURL,
                    "file_name": photo.fileName
                }
                for photo in job.photos.all()  # type: ignore[attr-defined]
            ]

            jobs.append({
                "id": job.jobID,
                "title": job.title,
                "description": job.description,
                "category": {
                    "id": job.categoryID.specializationID,
                    "name": job.categoryID.specializationName
                } if job.categoryID else None,
                "budget": float(job.budget),
                "location": job.location,
                "expected_duration": job.expectedDuration,
                "urgency": job.urgency,
                "preferred_start_date": job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                "materials_needed": job.materialsNeeded,
                "status": job.status,
                "created_at": job.createdAt.isoformat(),
                "updated_at": job.updatedAt.isoformat(),
                "photos": photos,
                # Payment information
                "payment_info": {
                    "escrow_amount": float(job.escrowAmount),
                    "escrow_paid": job.escrowPaid,
                    "escrow_paid_at": job.escrowPaidAt.isoformat() if job.escrowPaidAt else None,
                    "remaining_payment": float(job.remainingPayment),
                    "remaining_payment_paid": job.remainingPaymentPaid,
                    "remaining_payment_paid_at": job.remainingPaymentPaidAt.isoformat() if job.remainingPaymentPaidAt else None,
                    "final_payment_method": job.finalPaymentMethod,
                    "payment_method_selected_at": job.paymentMethodSelectedAt.isoformat() if job.paymentMethodSelectedAt else None,
                    "cash_payment_proof_url": job.cashPaymentProofUrl,
                    "cash_proof_uploaded_at": job.cashProofUploadedAt.isoformat() if job.cashProofUploadedAt else None,
                    "cash_payment_approved": job.cashPaymentApproved,
                    "cash_payment_approved_at": job.cashPaymentApprovedAt.isoformat() if job.cashPaymentApprovedAt else None,
                }
            })
        
        print(f"✅ Found {len(jobs)} job postings")
        
        return {
            "success": True,
            "jobs": jobs,
            "total": len(jobs)
        }
        
    except Exception as e:
        print(f"❌ Error fetching job postings: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch job postings: {str(e)}"},
            status=500
        )


@router.get("/available", auth=cookie_auth)
def get_available_jobs(request):
    """
    Get all available job postings for workers
    Sorted by proximity to worker's location (same city first)
    """
    try:
        # Get worker's city from the Accounts model (not Profile)
        worker_city = request.auth.city if request.auth.city else None
        
        # Verify worker profile exists (handle users with multiple profiles)
        profile = get_user_profile(request)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get all ACTIVE job postings with client info
        job_postings = JobPosting.objects.filter(
            status=JobPosting.JobStatus.ACTIVE
        ).select_related(
            'categoryID',
            'clientID__profileID__accountFK'
        ).prefetch_related('photos').order_by('-createdAt')
        
        # Format and sort jobs
        jobs = []
        same_city_jobs = []
        other_jobs = []
        
        for job in job_postings:
            # Get client info
            client_profile = job.clientID.profileID
            client_account = client_profile.accountFK
            
            # Get job photos
            photos = [
                {
                    "id": photo.photoID,
                    "url": photo.photoURL,
                    "file_name": photo.fileName
                }
                for photo in job.photos.all()  # type: ignore[attr-defined]
            ]
            
            job_data = {
                "id": job.jobID,
                "title": job.title,
                "description": job.description,
                "category": {
                    "id": job.categoryID.specializationID,
                    "name": job.categoryID.specializationName
                } if job.categoryID else None,
                "budget": float(job.budget),
                "location": job.location,
                "expected_duration": job.expectedDuration,
                "urgency": job.urgency,
                "preferred_start_date": job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                "materials_needed": job.materialsNeeded,
                "status": job.status,
                "created_at": job.createdAt.isoformat(),
                "updated_at": job.updatedAt.isoformat(),
                "photos": photos,
                "client": {
                    "name": f"{client_profile.firstName} {client_profile.lastName}",
                    "city": client_account.city,  # City is in Accounts model
                    "rating": job.clientID.clientRating if hasattr(job.clientID, 'clientRating') else 0,
                    "avatar": client_profile.profileImg or "/worker1.jpg"
                }
            }
            
            # Sort by city proximity
            job_location_lower = job.location.lower()
            if worker_city:
                worker_city_lower = worker_city.lower()
                # Check if worker's city is in the job location
                if worker_city_lower in job_location_lower:
                    same_city_jobs.append(job_data)
                else:
                    other_jobs.append(job_data)
            else:
                other_jobs.append(job_data)
        
        # Combine: same city first, then others
        sorted_jobs = same_city_jobs + other_jobs
        
        return {
            "success": True,
            "jobs": sorted_jobs,
            "total": len(sorted_jobs),
            "same_city_count": len(same_city_jobs),
            "worker_city": worker_city
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch available jobs: {str(e)}"},
            status=500
        )


@router.get("/in-progress", auth=cookie_auth)
def get_in_progress_jobs(request):
    """
    Get all in-progress jobs for the current user
    - For clients: jobs they posted that are IN_PROGRESS
    - For workers: jobs they're assigned to that are IN_PROGRESS
    """
    try:
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        jobs = []
        
        if profile.profileType == "CLIENT":
            # Get client's in-progress jobs
            try:
                client_profile = ClientProfile.objects.get(profileID=profile)
            except ClientProfile.DoesNotExist:
                return Response(
                    {"error": "Client profile not found"},
                    status=403
                )
            
            job_postings = JobPosting.objects.filter(
                clientID=client_profile,
                status=JobPosting.JobStatus.IN_PROGRESS
            ).select_related('categoryID', 'assignedWorkerID__profileID__accountFK').prefetch_related('photos').order_by('-updatedAt')
            
            for job in job_postings:
                # Get assigned worker info if exists
                worker_info = None
                if job.assignedWorkerID:
                    worker_profile = job.assignedWorkerID.profileID
                    worker_account = worker_profile.accountFK
                    worker_info = {
                        "id": job.assignedWorkerID.profileID.profileID,
                        "name": f"{worker_profile.firstName} {worker_profile.lastName}",
                        "avatar": worker_profile.profileImg or "/worker1.jpg",
                        "rating": job.assignedWorkerID.workerRating if hasattr(job.assignedWorkerID, 'workerRating') else 0,
                        "city": worker_account.city
                    }
                
                # Get job photos
                photos = [
                    {
                        "id": photo.photoID,
                        "url": photo.photoURL,
                        "file_name": photo.fileName
                    }
                    for photo in job.photos.all()  # type: ignore[attr-defined]
                ]
                
                jobs.append({
                    "id": job.jobID,
                    "title": job.title,
                    "description": job.description,
                    "category": {
                        "id": job.categoryID.specializationID,
                        "name": job.categoryID.specializationName
                    } if job.categoryID else None,
                    "budget": float(job.budget),
                    "location": job.location,
                    "expected_duration": job.expectedDuration,
                    "urgency": job.urgency,
                    "preferred_start_date": job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                    "materials_needed": job.materialsNeeded,
                    "status": job.status,
                    "created_at": job.createdAt.isoformat(),
                    "updated_at": job.updatedAt.isoformat(),
                    "assigned_worker": worker_info,
                    "photos": photos
                })
                
        elif profile.profileType == "WORKER":
            # Get jobs assigned to this worker that are in progress
            try:
                worker_profile = WorkerProfile.objects.get(profileID=profile)
            except WorkerProfile.DoesNotExist:
                return Response(
                    {"error": "Worker profile not found"},
                    status=403
                )
            
            job_postings = JobPosting.objects.filter(
                assignedWorkerID=worker_profile,
                status=JobPosting.JobStatus.IN_PROGRESS
            ).select_related('categoryID', 'clientID__profileID__accountFK').prefetch_related('photos').order_by('-updatedAt')
            
            for job in job_postings:
                # Get client info
                client_profile = job.clientID.profileID
                client_account = client_profile.accountFK
                
                # Get job photos
                photos = [
                    {
                        "id": photo.photoID,
                        "url": photo.photoURL,
                        "file_name": photo.fileName
                    }
                    for photo in job.photos.all()  # type: ignore[attr-defined]
                ]
                
                jobs.append({
                    "id": job.jobID,
                    "title": job.title,
                    "description": job.description,
                    "category": {
                        "id": job.categoryID.specializationID,
                        "name": job.categoryID.specializationName
                    } if job.categoryID else None,
                    "budget": float(job.budget),
                    "location": job.location,
                    "expected_duration": job.expectedDuration,
                    "urgency": job.urgency,
                    "preferred_start_date": job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                    "materials_needed": job.materialsNeeded,
                    "status": job.status,
                    "created_at": job.createdAt.isoformat(),
                    "updated_at": job.updatedAt.isoformat(),
                    "photos": photos,
                    "client": {
                        "name": f"{client_profile.firstName} {client_profile.lastName}",
                        "city": client_account.city,
                        "rating": job.clientID.clientRating if hasattr(job.clientID, 'clientRating') else 0,
                        "avatar": client_profile.profileImg or "/worker1.jpg"
                    }
                })
        
        return {
            "success": True,
            "jobs": jobs,
            "total": len(jobs)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch in-progress jobs: {str(e)}"},
            status=500
        )


@router.get("/completed", auth=cookie_auth)
def get_completed_jobs(request):
    """
    Get all completed jobs for the current user
    - For clients: jobs they posted that are COMPLETED
    - For workers: jobs they completed that are COMPLETED
    """
    try:
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        jobs = []
        
        if profile.profileType == "CLIENT":
            # Get client's completed jobs
            try:
                client_profile = ClientProfile.objects.get(profileID=profile)
            except ClientProfile.DoesNotExist:
                return Response(
                    {"error": "Client profile not found"},
                    status=403
                )
            
            job_postings = JobPosting.objects.filter(
                clientID=client_profile,
                status=JobPosting.JobStatus.COMPLETED
            ).select_related('categoryID', 'assignedWorkerID__profileID__accountFK').prefetch_related('photos').order_by('-updatedAt')
            
            for job in job_postings:
                # Get assigned worker info if exists
                worker_info = None
                if job.assignedWorkerID:
                    worker_profile = job.assignedWorkerID.profileID
                    worker_account = worker_profile.accountFK
                    worker_info = {
                        "id": job.assignedWorkerID.profileID.profileID,
                        "name": f"{worker_profile.firstName} {worker_profile.lastName}",
                        "avatar": worker_profile.profileImg or "/worker1.jpg",
                        "rating": job.assignedWorkerID.workerRating if hasattr(job.assignedWorkerID, 'workerRating') else 0,
                        "city": worker_account.city
                    }
                
                # Get job photos
                photos = [
                    {
                        "id": photo.photoID,
                        "url": photo.photoURL,
                        "file_name": photo.fileName
                    }
                    for photo in job.photos.all()  # type: ignore[attr-defined]
                ]
                
                jobs.append({
                    "id": job.jobID,
                    "title": job.title,
                    "description": job.description,
                    "category": {
                        "id": job.categoryID.specializationID,
                        "name": job.categoryID.specializationName
                    } if job.categoryID else None,
                    "budget": float(job.budget),
                    "location": job.location,
                    "expected_duration": job.expectedDuration,
                    "urgency": job.urgency,
                    "preferred_start_date": job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                    "materials_needed": job.materialsNeeded,
                    "status": job.status,
                    "created_at": job.createdAt.isoformat(),
                    "updated_at": job.updatedAt.isoformat(),
                    "assigned_worker": worker_info,
                    "photos": photos
                })
                
        elif profile.profileType == "WORKER":
            # Get jobs completed by this worker
            try:
                worker_profile = WorkerProfile.objects.get(profileID=profile)
            except WorkerProfile.DoesNotExist:
                return Response(
                    {"error": "Worker profile not found"},
                    status=403
                )
            
            job_postings = JobPosting.objects.filter(
                assignedWorkerID=worker_profile,
                status=JobPosting.JobStatus.COMPLETED
            ).select_related('categoryID', 'clientID__profileID__accountFK').prefetch_related('photos').order_by('-updatedAt')
            
            for job in job_postings:
                # Get client info
                client_profile = job.clientID.profileID
                client_account = client_profile.accountFK
                
                # Get job photos
                photos = [
                    {
                        "id": photo.photoID,
                        "url": photo.photoURL,
                        "file_name": photo.fileName
                    }
                    for photo in job.photos.all()  # type: ignore[attr-defined]
                ]
                
                jobs.append({
                    "id": job.jobID,
                    "title": job.title,
                    "description": job.description,
                    "category": {
                        "id": job.categoryID.specializationID,
                        "name": job.categoryID.specializationName
                    } if job.categoryID else None,
                    "budget": float(job.budget),
                    "location": job.location,
                    "expected_duration": job.expectedDuration,
                    "urgency": job.urgency,
                    "preferred_start_date": job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                    "materials_needed": job.materialsNeeded,
                    "status": job.status,
                    "created_at": job.createdAt.isoformat(),
                    "updated_at": job.updatedAt.isoformat(),
                    "photos": photos,
                    "client": {
                        "name": f"{client_profile.firstName} {client_profile.lastName}",
                        "city": client_account.city,
                        "rating": job.clientID.clientRating if hasattr(job.clientID, 'clientRating') else 0,
                        "avatar": client_profile.profileImg or "/worker1.jpg"
                    }
                })
        
        return {
            "success": True,
            "jobs": jobs,
            "total": len(jobs)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch completed jobs: {str(e)}"},
            status=500
        )


@router.get("/my-applications", auth=cookie_auth)
def get_my_applications(request):
    """
    Get all applications submitted by the current worker
    """
    try:
        print(f"📋 Fetching applications for {request.auth.email}")
        
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Only workers can view applications"},
                status=403
            )
        
        # Get all applications for this worker
        applications = JobApplication.objects.filter(
            workerID=worker_profile
        ).select_related('jobID').order_by('-createdAt')
        
        # Format the response
        applications_data = []
        for app in applications:
            applications_data.append({
                "id": app.applicationID,
                "job_id": app.jobID.jobID,
                "status": app.status,
                "created_at": app.createdAt.isoformat(),
            })
        
        print(f"✅ Found {len(applications_data)} applications")
        
        return {
            "success": True,
            "applications": applications_data,
            "total": len(applications_data)
        }
        
    except Exception as e:
        print(f"❌ Error fetching applications: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch applications: {str(e)}"},
            status=500
        )


@router.get("/{job_id}", auth=cookie_auth)
def get_job_posting(request, job_id: int):
    """
    Get details of a specific job posting
    """
    try:
        print(f"🔍 Fetching job posting {job_id} for {request.auth.email}")
        
        # Get the job posting
        try:
            job = JobPosting.objects.select_related(
                'categoryID',
                'clientID__profileID__accountFK',
                'assignedWorkerID__profileID__accountFK'
            ).prefetch_related('photos').get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # Get client info
        client_profile = job.clientID.profileID
        client_account = client_profile.accountFK
        
        # Calculate "posted at" time
        now = timezone.now()
        time_diff = now - job.createdAt
        hours_ago = int(time_diff.total_seconds() / 3600)
        days_ago = int(hours_ago / 24)
        
        if days_ago > 0:
            posted_at = f"{days_ago} day{'s' if days_ago > 1 else ''} ago"
        else:
            posted_at = f"{hours_ago} hour{'s' if hours_ago > 1 else ''} ago"
        
        # Get job photos
        photos = [
            {
                "id": photo.photoID,
                "url": photo.photoURL,
                "file_name": photo.fileName,
                "uploaded_at": photo.uploadedAt.isoformat()
            }
            for photo in job.photos.all()  # type: ignore[attr-defined]
        ]
        
        # Get assigned worker info if exists
        assigned_worker = None
        if job.assignedWorkerID:
            worker_profile = job.assignedWorkerID.profileID
            worker_account = worker_profile.accountFK
            assigned_worker = {
                "id": job.assignedWorkerID.profileID.profileID,
                "name": f"{worker_profile.firstName} {worker_profile.lastName}",
                "city": worker_account.city,
                "rating": job.assignedWorkerID.workerRating if hasattr(job.assignedWorkerID, 'workerRating') else 4.5,
                "avatar": worker_profile.profileImg or "/worker1.jpg"
            }
        
        job_data = {
            "id": job.jobID,
            "title": job.title,
            "description": job.description,
            "category": {
                "id": job.categoryID.specializationID,
                "name": job.categoryID.specializationName
            } if job.categoryID else None,
            "budget": f"₱{float(job.budget):,.2f}",
            "location": job.location,
            "expected_duration": job.expectedDuration,
            "urgency": job.urgency,
            "preferred_start_date": job.preferredStartDate.isoformat() if job.preferredStartDate else None,
            "materials_needed": job.materialsNeeded,
            "status": job.status,
            "created_at": job.createdAt.isoformat(),
            "posted_at": posted_at,
            "photos": photos,
            "client": {
                "name": f"{client_profile.firstName} {client_profile.lastName}",
                "city": client_account.city,
                "rating": job.clientID.clientRating if hasattr(job.clientID, 'clientRating') else 4.5,
                "avatar": client_profile.profileImg or "/worker1.jpg",
                "total_jobs_posted": job.clientID.totalJobsPosted if hasattr(job.clientID, 'totalJobsPosted') else 0
            },
            "assigned_worker": assigned_worker
        }
        
        print(f"✅ Successfully fetched job posting: {job.title} with {len(photos)} photos")
        
        return {
            "success": True,
            "job": job_data
        }
        
    except Exception as e:
        print(f"❌ Error fetching job posting: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch job posting: {str(e)}"},
            status=500
        )


@router.patch("/{job_id}/cancel", auth=cookie_auth)
def cancel_job_posting(request, job_id: int):
    """
    Cancel a job posting (update status to CANCELLED)
    Only the client who created the job can cancel it
    Only ACTIVE jobs can be cancelled
    """
    try:
        print(f"🚫 Cancelling job {job_id} for {request.auth.email}")
        
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get client profile
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Only clients can cancel job postings"},
                status=403
            )
        
        # Get the job posting
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # Verify this client owns the job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You can only cancel your own job postings"},
                status=403
            )
        
        # Check if job is already cancelled or completed
        if job.status == JobPosting.JobStatus.CANCELLED:
            return Response(
                {"error": "This job is already cancelled"},
                status=400
            )
        
        if job.status == JobPosting.JobStatus.COMPLETED:
            return Response(
                {"error": "Cannot cancel a completed job"},
                status=400
            )
        
        if job.status == JobPosting.JobStatus.IN_PROGRESS:
            return Response(
                {"error": "Cannot cancel a job that is in progress"},
                status=400
            )
        
        # Refund escrow to client if it was paid
        refund_amount = Decimal('0.00')
        if job.escrowPaid and job.escrowAmount > 0:
            print(f"💰 Refunding escrow amount: ₱{job.escrowAmount}")
            
            # Get client's wallet
            wallet = Wallet.objects.get(accountFK=request.auth)
            
            # Use database transaction for atomicity
            with db_transaction.atomic():
                # Add escrow back to wallet
                wallet.balance += job.escrowAmount
                wallet.save()
                
                # Create refund transaction
                refund_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.REFUND,
                    amount=job.escrowAmount,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.COMPLETED,
                    description=f"Escrow refund for cancelled job: {job.title}",
                    relatedJobPosting=job,
                    referenceNumber=f"REFUND-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                refund_amount = job.escrowAmount
                
                print(f"✅ Refunded ₱{job.escrowAmount} to wallet")
                print(f"💳 New balance: ₱{wallet.balance}")
                print(f"📝 Refund transaction created: ID={refund_transaction.transactionID}")
        
        # Update status to CANCELLED
        job.status = JobPosting.JobStatus.CANCELLED
        job.save()
        
        print(f"✅ Job {job_id} cancelled successfully")
        
        return {
            "success": True,
            "message": "Job posting cancelled successfully",
            "job_id": job_id,
            "refund_amount": float(refund_amount),
            "refunded": refund_amount > 0
        }
        
    except Exception as e:
        print(f"❌ Error cancelling job posting: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to cancel job posting: {str(e)}"},
            status=500
        )


@router.get("/{job_id}/applications", auth=cookie_auth)
def get_job_applications(request, job_id: int):
    """
    Get all applications for a specific job posting
    Only the client who created the job can view applications
    """
    try:
        print(f"📋 Fetching applications for job {job_id} by {request.auth.email}")
        
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get client profile
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Only clients can view job applications"},
                status=403
            )
        
        # Get the job posting
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # Verify this client owns the job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You can only view applications for your own job postings"},
                status=403
            )
        
        # Get all applications for this job
        applications = JobApplication.objects.filter(
            jobID=job
        ).select_related(
            'workerID__profileID__accountFK'
        ).order_by('-createdAt')
        
        # Format the response
        applications_data = []
        for app in applications:
            worker_profile = app.workerID.profileID
            worker_account = worker_profile.accountFK
            
            # Get worker's specialization (if any)
            worker_specialization = None
            try:
                from accounts.models import workerSpecialization
                spec = workerSpecialization.objects.filter(
                    workerID=app.workerID
                ).select_related('specializationID').first()
                if spec and spec.specializationID:
                    worker_specialization = spec.specializationID.specializationName
            except Exception:
                pass
            
            applications_data.append({
                "id": app.applicationID,
                "worker": {
                    "id": app.workerID.profileID.profileID,
                    "name": f"{worker_profile.firstName} {worker_profile.lastName}",
                    "avatar": worker_profile.profileImg or "/worker1.jpg",
                    "rating": app.workerID.workerRating if hasattr(app.workerID, 'workerRating') else 0,
                    "city": worker_account.city,
                    "specialization": worker_specialization
                },
                "proposal_message": app.proposalMessage,
                "proposed_budget": float(app.proposedBudget),
                "estimated_duration": app.estimatedDuration,
                "budget_option": app.budgetOption,
                "status": app.status,
                "created_at": app.createdAt.isoformat(),
                "updated_at": app.updatedAt.isoformat()
            })
        
        print(f"✅ Found {len(applications_data)} applications for job {job_id}")
        
        return {
            "success": True,
            "applications": applications_data,
            "total": len(applications_data)
        }
        
    except Exception as e:
        print(f"❌ Error fetching job applications: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch job applications: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/apply", auth=cookie_auth)
def apply_for_job(request, job_id: int, data: JobApplicationSchema):
    """
    Submit an application for a job posting
    Only workers can apply for jobs
    """
    try:
        print(f"📝 Worker {request.auth.email} applying for job {job_id}")
        
        # CRITICAL: Block agencies from applying to jobs
        from accounts.models import Agency
        if Agency.objects.filter(accountFK=request.auth).exists():
            return Response(
                {"error": "Agencies cannot apply to jobs. Please use the 'Accept Job' feature instead."},
                status=403
            )
        
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Only workers can apply for jobs"},
                status=403
            )
        
        # Get the job posting
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # CRITICAL: Prevent users from applying to their own jobs (self-hiring)
        if job.clientID.profileID.accountFK == request.auth:
            return Response(
                {"error": "You cannot apply to your own job posting"},
                status=403
            )
        
        # Check if job is still active
        if job.status != JobPosting.JobStatus.ACTIVE:
            return Response(
                {"error": "This job is no longer accepting applications"},
                status=400
            )
        
        # Check if worker already applied
        existing_application = JobApplication.objects.filter(
            jobID=job,
            workerID=worker_profile
        ).first()
        
        if existing_application:
            return Response(
                {"error": "You have already applied for this job"},
                status=400
            )
        
        # Validate budget option
        if data.budget_option not in ['ACCEPT', 'NEGOTIATE']:
            return Response(
                {"error": "Invalid budget option"},
                status=400
            )
        
        # Create the application
        application = JobApplication.objects.create(
            jobID=job,
            workerID=worker_profile,
            proposalMessage=data.proposal_message,
            proposedBudget=data.proposed_budget,
            estimatedDuration=data.estimated_duration or '',
            budgetOption=data.budget_option,
            status=JobApplication.ApplicationStatus.PENDING
        )

        print(f"✅ Application {application.applicationID} created successfully")

        # Create notification for the client
        from accounts.models import Notification
        worker_name = f"{worker_profile.profileID.firstName} {worker_profile.profileID.lastName}"
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="APPLICATION_RECEIVED",
            title=f"New Application for '{job.title}'",
            message=f"{worker_name} applied for your job posting. Review their proposal and qualifications.",
            relatedJobID=job.jobID,
            relatedApplicationID=application.applicationID
        )
        print(f"📬 Notification sent to client {job.clientID.profileID.accountFK.email}")

        return {
            "success": True,
            "message": "Application submitted successfully",
            "application_id": application.applicationID
        }
        
    except Exception as e:
        print(f"❌ Error submitting application: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to submit application: {str(e)}"},
            status=500
        )


# DEPRECATED: Agencies should NOT apply to LISTING jobs
# Agencies only work with INVITE-type jobs (direct invitations from clients)
# This endpoint has been removed to prevent confusion
# Workers apply to LISTING jobs via submit_application endpoint
# Agencies receive and accept INVITE jobs via /api/agency/jobs/{job_id}/accept


# OLD ENDPOINT REMOVED - Use /api/agency/jobs instead
# This endpoint used the old JobPosting model and complex agency browsing logic
# New simplified model: Clients create INVITE-type jobs with assignedAgencyFK directly


@router.post("/{job_id}/applications/{application_id}/accept", auth=cookie_auth)
def accept_application(request, job_id: int, application_id: int):
    """
    Accept a job application
    Only the client who owns the job can accept applications
    Creates a conversation when application is accepted
    """
    try:
        print(f"✅ Accepting application {application_id} for job {job_id} by {request.auth.email}")
        
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get client profile
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Only clients can accept applications"},
                status=403
            )
        
        # Get the job posting
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # Verify this client owns the job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You can only accept applications for your own job postings"},
                status=403
            )
        
        # Get the application
        try:
            application = JobApplication.objects.select_related(
                'workerID__profileID'
            ).get(applicationID=application_id, jobID=job)
        except JobApplication.DoesNotExist:
            return Response(
                {"error": "Application not found"},
                status=404
            )
        
        # Check if application is still pending
        if application.status != JobApplication.ApplicationStatus.PENDING:
            return Response(
                {"error": f"Application is already {application.status.lower()}"},
                status=400
            )
        
        # Update application status
        application.status = JobApplication.ApplicationStatus.ACCEPTED
        application.save()
        
        # Update job status to IN_PROGRESS and assign the worker
        job.status = JobPosting.JobStatus.IN_PROGRESS
        job.assignedWorkerID = application.workerID  # Assign the worker to the job
        
        # If worker negotiated a different budget and it was accepted, update the job budget
        if application.budgetOption == JobApplication.BudgetOption.NEGOTIATE:
            print(f"💰 Updating job budget from ₱{job.budget} to negotiated price ₱{application.proposedBudget}")
            job.budget = application.proposedBudget
        
        job.save()
        
        print(f"✅ Assigned worker {application.workerID.profileID.profileID} to job {job_id}")
        print(f"💵 Final job budget: ₱{job.budget}")
        
        # Create a conversation between client and worker
        from profiles.models import Conversation
        conversation, created = Conversation.objects.get_or_create(
            relatedJobPosting=job,
            defaults={
                'client': client_profile.profileID,
                'worker': application.workerID.profileID,
                'status': Conversation.ConversationStatus.ACTIVE
            }
        )
        
        if created:
            print(f"✅ Created conversation {conversation.conversationID} for job {job_id}")
            
            # Create a system message to start the conversation
            from profiles.models import Message
            Message.create_system_message(
                conversation=conversation,
                message_text=f"Application accepted! You can now chat about the job: {job.title}"
            )
        
        # Reject all other pending applications for this job
        other_applications = JobApplication.objects.filter(
            jobID=job,
            status=JobApplication.ApplicationStatus.PENDING
        ).exclude(
            applicationID=application_id
        ).select_related('workerID__profileID__accountFK')

        # Notify rejected workers
        from accounts.models import Notification
        for other_app in other_applications:
            Notification.objects.create(
                accountFK=other_app.workerID.profileID.accountFK,
                notificationType="APPLICATION_REJECTED",
                title=f"Application Not Selected",
                message=f"Unfortunately, your application for '{job.title}' was not selected. Keep applying to find more opportunities!",
                relatedJobID=job.jobID,
                relatedApplicationID=other_app.applicationID
            )
            print(f"📬 Rejection notification sent to worker {other_app.workerID.profileID.accountFK.email}")

        # Update status
        other_applications.update(status=JobApplication.ApplicationStatus.REJECTED)

        # Create notification for accepted worker
        client_name = f"{client_profile.profileID.firstName} {client_profile.profileID.lastName}"
        Notification.objects.create(
            accountFK=application.workerID.profileID.accountFK,
            notificationType="APPLICATION_ACCEPTED",
            title=f"Application Accepted! 🎉",
            message=f"{client_name} accepted your application for '{job.title}'. The job has started and you can now chat with the client.",
            relatedJobID=job.jobID,
            relatedApplicationID=application.applicationID
        )
        print(f"📬 Acceptance notification sent to worker {application.workerID.profileID.accountFK.email}")

        print(f"✅ Application {application_id} accepted, job status updated to IN_PROGRESS")

        return {
            "success": True,
            "message": "Application accepted successfully",
            "conversation_id": conversation.conversationID,
            "application": {
                "id": application.applicationID,
                "status": application.status,
                "proposed_budget": float(application.proposedBudget),
                "budget_option": application.budgetOption
            },
            "job": {
                "id": job.jobID,
                "final_budget": float(job.budget),
                "status": job.status
            }
        }
        
    except Exception as e:
        print(f"❌ Error accepting application: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to accept application: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/applications/{application_id}/reject", auth=cookie_auth)
def reject_application(request, job_id: int, application_id: int):
    """
    Reject a job application
    Only the client who owns the job can reject applications
    """
    try:
        print(f"❌ Rejecting application {application_id} for job {job_id} by {request.auth.email}")
        
        # Get user's profile
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get client profile
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Only clients can reject applications"},
                status=403
            )
        
        # Get the job posting
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # Verify this client owns the job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You can only reject applications for your own job postings"},
                status=403
            )
        
        # Get the application
        try:
            application = JobApplication.objects.get(
                applicationID=application_id,
                jobID=job
            )
        except JobApplication.DoesNotExist:
            return Response(
                {"error": "Application not found"},
                status=404
            )
        
        # Check if application is still pending
        if application.status != JobApplication.ApplicationStatus.PENDING:
            return Response(
                {"error": f"Application is already {application.status.lower()}"},
                status=400
            )
        
        # Update application status
        application.status = JobApplication.ApplicationStatus.REJECTED
        application.save()

        # Create notification for the worker
        from accounts.models import Notification
        Notification.objects.create(
            accountFK=application.workerID.profileID.accountFK,
            notificationType="APPLICATION_REJECTED",
            title=f"Application Not Selected",
            message=f"Your application for '{job.title}' was not selected. Don't worry, there are more opportunities waiting!",
            relatedJobID=job.jobID,
            relatedApplicationID=application.applicationID
        )
        print(f"📬 Rejection notification sent to worker {application.workerID.profileID.accountFK.email}")

        print(f"✅ Application {application_id} rejected")

        return {
            "success": True,
            "message": "Application rejected successfully",
            "application": {
                "id": application.applicationID,
                "status": application.status
            }
        }
        
    except Exception as e:
        print(f"❌ Error rejecting application: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to reject application: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/reject-invite", auth=dual_auth)
def reject_job_invite_worker(request, job_id: int, reason: str | None = None):
    """
    Worker rejects a job invitation
    - Updates inviteStatus to REJECTED
    - Refunds escrow to client (if paid)
    - Client is notified with rejection reason
    """
    try:
        # Verify user is a worker
        profile = get_user_profile(request)
        if profile is None or profile.profileType != "WORKER":
            return Response(
                {"error": "Only workers can reject job invitations"},
                status=403
            )
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Worker profile not found"},
                status=404
            )
        
        # Get the job
        try:
            from accounts.models import Job
            job = Job.objects.get(jobID=job_id, assignedWorkerID=worker_profile)
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found or not assigned to you"},
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
            job.status = "CANCELLED"  # Job is cancelled since worker rejected
            job.save()
            
            # Refund escrow to client if it was paid
            if job.escrowPaid:
                try:
                    from accounts.models import Wallet, Transaction
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
                except Exception as e:
                    print(f"⚠️ Refund error: {str(e)}")
        
        # Send notification to client
        from accounts.models import Notification
        worker_name = f"{profile.firstName} {profile.lastName}".strip()
        rejection_msg = f"{worker_name} has declined your invitation for '{job.title}'."
        if reason:
            rejection_msg += f" Reason: {reason}"
        rejection_msg += " Your escrow payment has been refunded."
        
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="JOB_INVITE_REJECTED",
            title=f"{worker_name} Declined Your Invitation",
            message=rejection_msg,
            relatedJobID=job.jobID
        )
        
        # Send confirmation to worker
        Notification.objects.create(
            accountFK=request.auth,
            notificationType="JOB_INVITE_REJECTED_CONFIRM",
            title=f"Job Declined: {job.title}",
            message=f"You've declined the job invitation for '{job.title}'.",
            relatedJobID=job.jobID
        )
        
        print(f"✅ Worker {worker_profile.profileID.profileID} rejected job {job_id}")
        
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


@router.post("/{job_id}/accept-invite", auth=dual_auth)
def accept_job_invite_worker(request, job_id: int):
    """
    Worker accepts a job invitation
    - Updates inviteStatus to ACCEPTED
    - Job becomes ACTIVE and ready for work
    - Client is notified of acceptance
    """
    try:
        # Verify user is a worker
        profile = get_user_profile(request)
        if profile is None or profile.profileType != "WORKER":
            return Response(
                {"error": "Only workers can accept job invitations"},
                status=403
            )
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Worker profile not found"},
                status=404
            )
        
        # Get the job
        try:
            job = Job.objects.get(jobID=job_id, assignedWorkerID=worker_profile)
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found or not assigned to you"},
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
        job.inviteStatus = "ACCEPTED"
        job.inviteRespondedAt = timezone.now()
        job.status = "IN_PROGRESS"  # Worker accepted, work is starting
        job.save()
        
        # Create conversation between client and worker for this job
        from profiles.models import Conversation
        try:
            conversation, created = Conversation.objects.get_or_create(
                relatedJobPosting=job,
                defaults={
                    'client': job.clientID.profileID,
                    'worker': worker_profile.profileID,
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
        from accounts.models import Notification
        worker_name = f"{profile.firstName} {profile.lastName}".strip()
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="JOB_INVITE_ACCEPTED",
            title=f"{worker_name} Accepted Your Invitation",
            message=f"{worker_name} has accepted your invitation for '{job.title}'. The job is now active!",
            relatedJobID=job.jobID
        )
        
        # Send confirmation to worker
        Notification.objects.create(
            accountFK=request.auth,
            notificationType="JOB_INVITE_ACCEPTED_CONFIRM",
            title=f"Job Accepted: {job.title}",
            message=f"You've accepted the job invitation for '{job.title}'. Start working on the project!",
            relatedJobID=job.jobID
        )
        
        print(f"✅ Worker {worker_profile.profileID.profileID} accepted job {job_id}")
        
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


#region JOB IMAGE UPLOAD

@router.post("/{job_id}/upload-image", auth=cookie_auth)
def upload_job_image(request, job_id: int, image: UploadedFile = File(...)):  # type: ignore[misc]
    """
    Upload image for a job posting to Supabase storage.
    
    Path structure: users/user_{userID}/job_{jobID}/image_filename.ext
    
    Args:
        job_id: ID of the job posting
        image: Image file (JPEG, PNG, JPG, WEBP, max 5MB)
    
    Returns:
        success: boolean
        message: string
        image_url: string (public URL)
    """
    try:
        from iayos_project.utils import upload_file
        
        # Validate job exists and user owns it
        profile = get_user_profile(request)
        if profile is None:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
            job = JobPosting.objects.get(jobID=job_id, clientID=client_profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"},
                status=404
            )
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job not found or you don't have permission to upload images for this job"},
                status=404
            )
        
        # Validate file
        allowed_mime_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        max_size = 5 * 1024 * 1024  # 5 MB
        
        if image.content_type not in allowed_mime_types:
            return Response(
                {"error": "Invalid file type. Allowed: JPEG, PNG, JPG, WEBP"},
                status=400
            )
        
        if image.size > max_size:
            return Response(
                {"error": "File too large. Maximum size is 5MB"},
                status=400
            )
        
        # Generate filename from original file
        import os
        file_extension = os.path.splitext(image.name)[1] or '.jpg'
        
        print(f"📸 Uploading image: {image.name} ({image.size} bytes)")
        print(f"   User ID: {user.accountID}, Job ID: {job_id}")
        print(f"   Path: user_{user.accountID}/job_{job_id}")
        
        # Upload to Supabase with structure: users/user_{userID}/job_{jobID}/filename.ext
        image_url = upload_file(
            file=image,
            bucket="users",
            path=f"user_{user.accountID}/job_{job_id}",
            public=True,
            custom_name=image.name
        )
        
        if not image_url:
            print(f"❌ upload_file returned None")
            return Response(
                {"error": "Failed to upload image to storage"},
                status=500
            )
        
        # Create JobPhoto record
        job_photo = JobPhoto.objects.create(
            jobID=job,
            photoURL=image_url,
            fileName=image.name
        )
        
        print(f"✅ Job image uploaded successfully for job {job_id}")
        print(f"   Image URL: {image_url}")
        
        return {
            "success": True,
            "message": "Image uploaded successfully",
            "image_url": image_url,
            "photo_id": job_photo.photoID
        }
        
    except Exception as e:
        print(f"❌ Exception in job image upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to upload image: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/confirm-work-started", auth=dual_auth)
def client_confirm_work_started(request, job_id: int):
    """
    Client confirms that worker has arrived and begun work
    This must be done before worker can mark job as complete
    """
    try:
        print(f"✅ Client confirming work started for job {job_id}")
        
        # Get client's profile
        try:
            client_profile = ClientProfile.objects.select_related('profileID__accountFK').get(
                profileID__accountFK=request.auth
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"},
                status=400
            )
        
        # Get the job
        try:
            job = JobPosting.objects.select_related(
                'assignedWorkerID__profileID__accountFK'
            ).get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job not found"},
                status=404
            )
        
        # Verify client owns this job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You are not the client for this job"},
                status=403
            )
        
        # Verify job is in progress
        if job.status != "IN_PROGRESS":
            return Response(
                {"error": f"Job must be IN_PROGRESS. Current status: {job.status}"},
                status=400
            )
        
        # Check if already confirmed
        if job.clientConfirmedWorkStarted:
            return Response(
                {"error": "Work start has already been confirmed"},
                status=400
            )
        
        # Confirm work has started
        job.clientConfirmedWorkStarted = True
        job.clientConfirmedWorkStartedAt = timezone.now()
        job.save()

        print(f"✅ Client confirmed work started for job {job_id}")
        
        # Log this action for admin verification and audit trail
        confirmation_time = timezone.now()
        JobLog.objects.create(
            jobID=job,
            notes=f"[{confirmation_time.strftime('%Y-%m-%d %I:%M:%S %p')}] Client {client_profile.profileID.firstName} {client_profile.profileID.lastName} confirmed that worker has arrived and work has started",
            changedBy=request.auth,
            oldStatus=job.status,
            newStatus=job.status  # Status stays IN_PROGRESS
        )

        # Create notification for the worker
        from accounts.models import Notification
        client_name = f"{client_profile.profileID.firstName} {client_profile.profileID.lastName}"
        if job.assignedWorkerID:
            Notification.objects.create(
                accountFK=job.assignedWorkerID.profileID.accountFK,
                notificationType="WORK_STARTED_CONFIRMED",
                title=f"Work Start Confirmed",
                message=f"{client_name} has confirmed you have arrived and started work on '{job.title}'. You can now mark the job as complete when finished.",
                relatedJobID=job.jobID
            )
            print(f"📬 Work started notification sent to worker {job.assignedWorkerID.profileID.accountFK.email}")

        # Broadcast job status update via WebSocket
        broadcast_job_status_update(job_id, {
            'event': 'work_started_confirmed',
            'job_id': job_id,
            'client_confirmed_work_started': True,
            'timestamp': timezone.now().isoformat()
        })
        
        return {
            "success": True,
            "message": "Work start confirmed. Worker can now mark job as complete.",
            "job_id": job_id,
            "client_confirmed_work_started": True,
            "client_confirmed_work_started_at": job.clientConfirmedWorkStartedAt.isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error confirming work started: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to confirm work started: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/mark-complete", auth=dual_auth)
def worker_mark_job_complete(request, job_id: int):
    """
    Worker or Agency marks the job as complete (phase 1 of two-phase completion)
    Sets workerMarkedComplete=True and timestamp
    Notifies client to verify completion
    
    Supports:
    - Regular workers marking their assigned jobs complete
    - Agency owners marking jobs complete for their assigned employees
    """
    try:
        print(f"✅ Marking job {job_id} as complete")
        
        # First, get the job to check if it's an agency job
        try:
            job = JobPosting.objects.select_related(
                'clientID__profileID__accountFK',
                'assignedWorkerID__profileID__accountFK',
                'assignedEmployeeID__agency'
            ).get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job not found"},
                status=404
            )
        
        # Check if this is an agency job (has assignedEmployeeID)
        is_agency_job = job.assignedEmployeeID is not None
        worker_name = None
        is_authorized = False
        
        if is_agency_job:
            # Agency job - verify the requesting user is the agency owner
            # Note: AgencyEmployee.agency is a FK to Accounts (the agency owner), not to Agency model
            print(f"📋 This is an agency job. Assigned employee: {job.assignedEmployeeID.name}")
            agency_owner_account = job.assignedEmployeeID.agency  # This IS the Accounts object
            
            print(f"📋 Agency owner account ID: {agency_owner_account.accountID}, Request auth ID: {request.auth.accountID}")
            
            if agency_owner_account.accountID == request.auth.accountID:
                is_authorized = True
                worker_name = job.assignedEmployeeID.name
                print(f"✅ Agency owner {request.auth.email} authorized to mark complete")
            else:
                return Response(
                    {"error": "Only the agency owner can mark this job as complete"},
                    status=403
                )
        else:
            # Regular worker job - verify worker is assigned
            profile_type = getattr(request.auth, 'profile_type', 'WORKER')
            try:
                profile = Profile.objects.filter(
                    accountFK=request.auth,
                    profileType=profile_type
                ).first()
                
                if not profile:
                    profile = Profile.objects.filter(accountFK=request.auth, profileType='WORKER').first()
                
                if not profile:
                    return Response(
                        {"error": "Worker profile not found"},
                        status=400
                    )
                
                worker_profile = WorkerProfile.objects.select_related('profileID__accountFK').get(
                    profileID=profile
                )
            except WorkerProfile.DoesNotExist:
                return Response(
                    {"error": "Worker profile not found"},
                    status=400
                )
            
            # Verify worker is assigned to this job
            if not job.assignedWorkerID or job.assignedWorkerID.profileID.profileID != worker_profile.profileID.profileID:
                return Response(
                    {"error": "You are not assigned to this job"},
                    status=403
                )
            
            is_authorized = True
            worker_name = f"{worker_profile.profileID.firstName} {worker_profile.profileID.lastName}"
        
        if not is_authorized:
            return Response(
                {"error": "You are not authorized to mark this job as complete"},
                status=403
            )
        
        # Verify job is in progress
        if job.status != "IN_PROGRESS":
            return Response(
                {"error": f"Job must be IN_PROGRESS to mark as complete. Current status: {job.status}"},
                status=400
            )
        
        # CRITICAL: Check if client has confirmed work started
        if not job.clientConfirmedWorkStarted:
            return Response(
                {"error": "Client must confirm that work has started before you can mark it as complete"},
                status=400
            )
        
        # Check if already marked complete by worker
        if job.workerMarkedComplete:
            return Response(
                {"error": "You have already marked this job as complete"},
                status=400
            )
        
        # Extract optional notes/photos from request body (mobile sends JSON)
        completion_notes = None
        completion_photos = []
        if hasattr(request, 'body') and request.body:
            try:
                payload = json.loads(request.body.decode('utf-8'))
                completion_notes = payload.get('notes')
                completion_photos = payload.get('photos', []) or []
                print(f"📝 Completion payload received - Notes: {bool(completion_notes)}, Photos: {len(completion_photos)}")
            except json.JSONDecodeError:
                print("⚠️ Could not parse completion payload JSON - continuing without notes/photos")

        # Mark as complete by worker
        job.workerMarkedComplete = True
        job.workerMarkedCompleteAt = timezone.now()
        job.save()

        print(f"✅ Job {job_id} marked as complete by {worker_name}. Waiting for client approval.")
        
        # Log this action for admin verification and audit trail
        completion_time = timezone.now()
        notes_text = completion_notes if completion_notes else "No completion notes provided"
        JobLog.objects.create(
            jobID=job,
            notes=f"[{completion_time.strftime('%Y-%m-%d %I:%M:%S %p')}] {worker_name} marked job as complete. Notes: {notes_text}",
            changedBy=request.auth,
            oldStatus=job.status,
            newStatus=job.status  # Status stays IN_PROGRESS until client approves
        )

        # Create notification for the client
        from accounts.models import Notification
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="JOB_COMPLETED_WORKER",
            title=f"Job Completion Pending Approval",
            message=f"{worker_name} has marked '{job.title}' as complete. Please review the work and approve if satisfied.",
            relatedJobID=job.jobID
        )
        print(f"📬 Completion notification sent to client {job.clientID.profileID.accountFK.email}")

        # Broadcast job status update via WebSocket
        broadcast_job_status_update(job_id, {
            'event': 'worker_marked_complete',
            'job_id': job_id,
            'worker_marked_complete': True,
            'client_marked_complete': False,
            'awaiting_client_verification': True,
            'timestamp': timezone.now().isoformat()
        })
        
        return {
            "success": True,
            "message": "Job marked as complete. Waiting for client to verify completion.",
            "job_id": job_id,
            "worker_marked_complete": True,
            "client_marked_complete": job.clientMarkedComplete,
            "awaiting_client_verification": not job.clientMarkedComplete
        }
        
    except Exception as e:
        print(f"❌ Error marking job as complete: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to mark job as complete: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/approve-completion", auth=dual_auth)
def client_approve_job_completion(
    request,
    job_id: int,
    payment_method: str = Form("WALLET"),
    cash_proof_image: UploadedFile = File(None)
):
    """
    Client approves job completion and selects payment method
    Payment methods: WALLET, GCASH, or CASH (with proof upload)
    
    Form data:
    - payment_method: "WALLET" | "GCASH" | "CASH" (required)
    - cash_proof_image: file upload (required if payment_method is CASH)
    """
    try:
        print(f"✅ Client approving job {job_id} completion")
        
        # Get payment method from form data (default to WALLET)
        payment_method_upper = payment_method.upper() if payment_method else 'WALLET'
        if payment_method_upper not in ['WALLET', 'GCASH', 'CASH']:
            return Response(
                {"error": "Invalid payment method. Choose WALLET, GCASH, or CASH"},
                status=400
            )
        
        print(f"💳 Payment method selected: {payment_method_upper}")
        
        # If CASH payment, validate proof image was uploaded
        if payment_method_upper == 'CASH' and not cash_proof_image:
            return Response(
                {"error": "Cash proof image is required for CASH payment method"},
                status=400
            )
        
        # Get client's profile (support dual profiles via profile_type in JWT)
        profile_type = getattr(request.auth, 'profile_type', 'CLIENT')
        try:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
            
            if not profile:
                profile = Profile.objects.filter(accountFK=request.auth, profileType='CLIENT').first()
            
            if not profile:
                return Response(
                    {"error": "Client profile not found"},
                    status=400
                )
            
            client_profile = ClientProfile.objects.select_related('profileID__accountFK').get(
                profileID=profile
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"},
                status=400
            )
        
        # Get the job
        try:
            job = JobPosting.objects.select_related(
                'assignedWorkerID__profileID__accountFK'
            ).get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job not found"},
                status=404
            )
        
        # Verify client owns this job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You are not the client for this job"},
                status=403
            )
        
        # Verify worker has marked complete first
        if not job.workerMarkedComplete:
            return Response(
                {"error": "Worker must mark the job as complete first"},
                status=400
            )
        
        # Verify job is still in progress
        if job.status not in ["IN_PROGRESS", "COMPLETED"]:
            return Response(
                {"error": f"Cannot approve completion for job with status: {job.status}"},
                status=400
            )
        
        # Check if already marked complete by client
        if job.clientMarkedComplete:
            return Response(
                {"error": "You have already approved this job completion"},
                status=400
            )
        
        # Upload cash proof image to Supabase if provided
        cash_proof_url = None
        if payment_method_upper == 'CASH' and cash_proof_image:
            try:
                from django.conf import settings
                from datetime import datetime
                import uuid
                
                # Read file content
                file_content = cash_proof_image.read()
                file_extension = cash_proof_image.name.split('.')[-1] if '.' in cash_proof_image.name else 'jpg'
                
                # Create organized path: users/{user_id}/jobs/{job_id}/proof/cash_proof_{timestamp}.{ext}
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_id = str(uuid.uuid4())[:8]
                file_path = f"users/{request.auth.accountID}/jobs/{job_id}/proof/cash_proof_{timestamp}_{unique_id}.{file_extension}"
                
                print(f"📤 Uploading cash proof to storage: {file_path}")
                
                # Upload using unified STORAGE adapter (local or Supabase based on USE_LOCAL_DB)
                if not settings.STORAGE:
                    raise Exception("Storage not configured")
                response = settings.STORAGE.storage().from_('user-uploads').upload(
                    file_path,
                    file_content,
                    {
                        'content-type': cash_proof_image.content_type or 'image/jpeg',
                        'upsert': 'true'
                    }
                )
                
                # Get public URL
                cash_proof_url = settings.STORAGE.storage().from_('user-uploads').get_public_url(file_path)
                print(f"✅ Cash proof uploaded successfully: {cash_proof_url}")
                
            except Exception as e:
                print(f"❌ Failed to upload cash proof image: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response(
                    {"error": f"Failed to upload cash proof image: {str(e)}"},
                    status=500
                )
        
        # Mark as complete by client and save payment method
        old_status = job.status
        job.clientMarkedComplete = True
        job.clientMarkedCompleteAt = timezone.now()
        job.finalPaymentMethod = payment_method_upper
        job.paymentMethodSelectedAt = timezone.now()
        
        # Save cash proof URL if provided
        if cash_proof_url:
            job.cashPaymentProofUrl = cash_proof_url
            job.cashProofUploadedAt = timezone.now()
        
        job.status = "COMPLETED"
        job.save()

        print(f"✅ Client approved job {job_id} completion with {payment_method_upper} payment.")
        
        # Close the conversation for this job
        from profiles.models import Conversation
        try:
            conversation = Conversation.objects.filter(relatedJobPosting=job).first()
            if conversation:
                conversation.status = Conversation.ConversationStatus.COMPLETED
                conversation.save()
                print(f"✅ Conversation {conversation.conversationID} closed for completed job {job_id}")
        except Exception as e:
            print(f"⚠️ Failed to close conversation: {str(e)}")
            # Don't fail job completion if conversation closing fails
        
        # Log this action for admin verification and audit trail
        approval_time = timezone.now()
        JobLog.objects.create(
            jobID=job,
            notes=f"[{approval_time.strftime('%Y-%m-%d %I:%M:%S %p')}] Client {client_profile.profileID.firstName} {client_profile.profileID.lastName} approved job completion. Payment method: {payment_method_upper}. Status changed to COMPLETED.",
            changedBy=request.auth,
            oldStatus=old_status,
            newStatus="COMPLETED"
        )

        # Create notification for the worker
        from accounts.models import Notification
        client_name = f"{client_profile.profileID.firstName} {client_profile.profileID.lastName}"
        if job.assignedWorkerID and job.assignedWorkerID.profileID:
            Notification.objects.create(
                accountFK=job.assignedWorkerID.profileID.accountFK,
                notificationType="JOB_COMPLETED_CLIENT",
                title=f"Job Completion Approved! 🎉",
                message=f"{client_name} has approved the completion of '{job.title}'. Awaiting final payment.",
                relatedJobID=job.jobID
            )
            print(f"📬 Client approval notification sent to worker {job.assignedWorkerID.profileID.accountFK.email}")

        # Broadcast job status update via WebSocket
        broadcast_job_status_update(job_id, {
            'event': 'client_approved_completion',
            'job_id': job_id,
            'worker_marked_complete': True,
            'client_marked_complete': True,
            'payment_method': payment_method_upper,
            'timestamp': timezone.now().isoformat()
        })
        
        # Check if remaining payment already paid
        if job.remainingPaymentPaid:
            print(f"✅ Remaining payment already paid for job {job_id}")
            return {
                "success": True,
                "message": "Job completion approved! You can now leave a review.",
                "job_id": job_id,
                "worker_marked_complete": job.workerMarkedComplete,
                "client_marked_complete": job.clientMarkedComplete,
                "status": job.status,
                "payment_method": payment_method_upper,
                "requires_payment": False,
                "payment_already_completed": True,
                "prompt_review": True,
                "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None
            }
        
        # Generate payment based on selected method
        try:
            from accounts.models import Wallet
            
            remaining_amount = job.remainingPayment
            
            # Handle WALLET payment (instant deduction)
            if payment_method == 'WALLET':
                print(f"💳 Wallet payment selected - checking balance")
                
                # Get or create wallet for client
                wallet, _ = Wallet.objects.get_or_create(
                    accountFK=client_profile.profileID.accountFK,
                    defaults={'balance': 0}
                )
                
                # Check if client has sufficient balance
                if wallet.balance < remaining_amount:
                    return Response({
                        "error": "Insufficient wallet balance",
                        "required": float(remaining_amount),
                        "available": float(wallet.balance),
                        "message": f"You need ₱{remaining_amount} but only have ₱{wallet.balance}. Please deposit more funds or use a different payment method."
                    }, status=400)
                
                # Deduct remaining payment from wallet
                wallet.balance -= remaining_amount
                wallet.save()
                
                print(f"💸 Deducted ₱{remaining_amount} from client wallet. New balance: ₱{wallet.balance}")
                
                # Create transaction record for client
                transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType="PAYMENT",
                    amount=remaining_amount,
                    balanceAfter=wallet.balance,
                    status="COMPLETED",
                    description=f"Remaining payment for job: {job.title} (Wallet)",
                    referenceNumber=f"JOB-{job.jobID}-FINAL-WALLET-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    relatedJobPosting=job
                )
                
                # Transfer FULL BUDGET to worker's/agency's wallet (they receive 100% of agreed budget)
                recipient_account = None
                recipient_type = None
                
                if job.assignedWorkerID and job.assignedWorkerID.profileID:
                    # Individual worker job
                    recipient_account = job.assignedWorkerID.profileID.accountFK
                    recipient_type = "worker"
                elif job.assignedAgencyFK:
                    # Agency job - payment goes to agency wallet (B2B partner)
                    recipient_account = job.assignedAgencyFK.accountFK
                    recipient_type = "agency"
                
                if recipient_account:
                    recipient_wallet, _ = Wallet.objects.get_or_create(
                        accountFK=recipient_account,
                        defaults={'balance': Decimal('0.00')}
                    )
                    
                    # Recipient receives the FULL budget amount (client pays budget + platform fee)
                    recipient_payment = job.budget
                    recipient_wallet.balance += recipient_payment
                    recipient_wallet.save()
                    
                    print(f"💰 Credited ₱{recipient_payment} (full budget) to {recipient_type} wallet. New balance: ₱{recipient_wallet.balance}")
                    
                    # Create earnings transaction record
                    Transaction.objects.create(
                        walletID=recipient_wallet,
                        transactionType="EARNINGS",
                        amount=recipient_payment,
                        balanceAfter=recipient_wallet.balance,
                        status="COMPLETED",
                        description=f"Payment received for job: {job.title}" + (f" (Agency: {job.assignedAgencyFK.businessName})" if recipient_type == "agency" else ""),
                        referenceNumber=f"JOB-{job.jobID}-EARNINGS-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                        relatedJobPosting=job
                    )
                
                # Mark payment as completed
                job.remainingPaymentPaid = True
                job.remainingPaymentPaidAt = timezone.now()
                job.status = "COMPLETED"
                job.save()

                print(f"✅ Job {job_id} marked as COMPLETED via WALLET payment")

                # Create payment notification for the worker/agency
                if recipient_account:
                    if recipient_type == "agency":
                        Notification.objects.create(
                            accountFK=recipient_account,
                            notificationType="PAYMENT_RELEASED",
                            title=f"Payment Received! 💰",
                            message=f"Your agency received ₱{job.budget} for '{job.title}'. The full amount has been added to your agency wallet!",
                            relatedJobID=job.jobID
                        )
                        print(f"📬 Payment notification sent to agency {recipient_account.email}")
                    else:
                        Notification.objects.create(
                            accountFK=recipient_account,
                            notificationType="PAYMENT_RELEASED",
                            title=f"Payment Received! 💰",
                            message=f"You received ₱{job.budget} for '{job.title}'. The full amount has been added to your wallet!",
                            relatedJobID=job.jobID
                        )
                        print(f"📬 Payment notification sent to worker {recipient_account.email}")

                # Create payment confirmation for the client
                Notification.objects.create(
                    accountFK=client_profile.profileID.accountFK,
                    notificationType="REMAINING_PAYMENT_PAID",
                    title=f"Payment Confirmed",
                    message=f"Your final payment of ₱{remaining_amount} for '{job.title}' was successful. Please leave a review!",
                    relatedJobID=job.jobID
                )
                print(f"📬 Payment confirmation sent to client {client_profile.profileID.accountFK.email}")

                return {
                    "success": True,
                    "message": "Payment successful! Job completed. Please leave a review for the worker.",
                    "job_id": job_id,
                    "worker_marked_complete": job.workerMarkedComplete,
                    "client_marked_complete": job.clientMarkedComplete,
                    "status": "COMPLETED",
                    "payment_method": "WALLET",
                    "requires_payment": False,
                    "payment_completed": True,
                    "prompt_review": True,
                    "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None,
                    "agency_id": job.assignedAgencyFK.agencyId if job.assignedAgencyFK else None,
                    "recipient_type": recipient_type,
                    "new_wallet_balance": float(wallet.balance)
                }
            
            # Handle CASH payment (manual with proof upload)
            if payment_method_upper == 'CASH':
                print(f"💵 Cash payment selected - proof uploaded to {cash_proof_url}")
                
                # For CASH: Worker/Agency receives physical cash from client (remaining 50%)
                # The downpayment (50%) was already held in escrow during job creation
                # We now transfer the downpayment to recipient's wallet AND log the cash payment
                # Recipient receives full budget: 50% in wallet (from escrow) + 50% physical cash = 100%
                
                cash_recipient_account = None
                cash_recipient_type = None
                
                if job.assignedWorkerID and job.assignedWorkerID.profileID:
                    # Individual worker job
                    cash_recipient_account = job.assignedWorkerID.profileID.accountFK
                    cash_recipient_type = "worker"
                elif job.assignedAgencyFK:
                    # Agency job - payment goes to agency wallet (B2B partner)
                    cash_recipient_account = job.assignedAgencyFK.accountFK
                    cash_recipient_type = "agency"
                
                if cash_recipient_account:
                    recipient_wallet, _ = Wallet.objects.get_or_create(
                        accountFK=cash_recipient_account,
                        defaults={'balance': Decimal('0.00')}
                    )
                    
                    # Transfer downpayment (50%) from escrow to recipient's wallet
                    downpayment = job.budget * Decimal('0.5')
                    recipient_wallet.balance += downpayment
                    recipient_wallet.save()
                    
                    print(f"💰 Transferred ₱{downpayment} (50% downpayment escrow) to {cash_recipient_type} wallet. New balance: ₱{recipient_wallet.balance}")
                    print(f"💵 {cash_recipient_type.capitalize()} received ₱{remaining_amount} (50% remaining) in physical cash from client")
                    print(f"✅ {cash_recipient_type.capitalize()} received full budget: ₱{downpayment} (wallet from escrow) + ₱{remaining_amount} (physical cash) = ₱{job.budget}")
                    
                    # Create earnings transaction record for the downpayment transfer (from escrow to wallet)
                    Transaction.objects.create(
                        walletID=recipient_wallet,
                        transactionType="EARNINGS",
                        amount=downpayment,
                        balanceAfter=recipient_wallet.balance,
                        status="COMPLETED",
                        description=f"Downpayment escrow released for job: {job.title}" + (f" (Agency: {job.assignedAgencyFK.businessName})" if cash_recipient_type == "agency" else ""),
                        referenceNumber=f"JOB-{job.jobID}-EARNINGS-ESCROW-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                        relatedJobPosting=job
                    )
                    print(f"📝 Downpayment escrow transaction recorded: ₱{downpayment} transferred to wallet")
                    
                    # Create CASH payment log (does NOT affect wallet balance - for audit trail only)
                    Transaction.objects.create(
                        walletID=recipient_wallet,
                        transactionType="EARNINGS",
                        amount=remaining_amount,
                        balanceAfter=recipient_wallet.balance,  # Balance stays same - this is just a log
                        status="COMPLETED",
                        description=f"Cash payment received for job: {job.title} (physical cash - not wallet deposit)" + (f" (Agency: {job.assignedAgencyFK.businessName})" if cash_recipient_type == "agency" else ""),
                        referenceNumber=f"JOB-{job.jobID}-CASH-PAYMENT-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                        relatedJobPosting=job
                    )
                    print(f"📝 Cash payment transaction logged: ₱{remaining_amount} received in physical cash (audit trail only)")
                    
                    # Create payment notification for the worker/agency
                    if cash_recipient_type == "agency":
                        Notification.objects.create(
                            accountFK=cash_recipient_account,
                            notificationType="PAYMENT_RELEASED",
                            title=f"Payment Received! 💰",
                            message=f"Your agency received ₱{job.budget} for '{job.title}': ₱{downpayment} added to agency wallet + ₱{remaining_amount} cash payment confirmed.",
                            relatedJobID=job.jobID
                        )
                        print(f"📬 Payment notification sent to agency {cash_recipient_account.email}")
                    else:
                        Notification.objects.create(
                            accountFK=cash_recipient_account,
                            notificationType="PAYMENT_RELEASED",
                            title=f"Payment Received! 💰",
                            message=f"You received ₱{job.budget} for '{job.title}': ₱{downpayment} added to wallet + ₱{remaining_amount} cash payment confirmed.",
                            relatedJobID=job.jobID
                        )
                        print(f"📬 Payment notification sent to worker {cash_recipient_account.email}")
                
                # Mark job as completed
                job.remainingPaymentPaid = True
                job.remainingPaymentPaidAt = timezone.now()
                job.status = "COMPLETED"
                job.save()
                
                print(f"✅ Job {job_id} marked as COMPLETED via CASH payment")
                
                # Create payment confirmation for the client
                Notification.objects.create(
                    accountFK=client_profile.profileID.accountFK,
                    notificationType="REMAINING_PAYMENT_PAID",
                    title=f"Payment Confirmed",
                    message=f"Your cash payment proof for '{job.title}' was uploaded successfully. Please leave a review!",
                    relatedJobID=job.jobID
                )
                print(f"📬 Payment confirmation sent to client {client_profile.profileID.accountFK.email}")
                
                return {
                    "success": True,
                    "message": "Job completion approved! Cash payment proof uploaded successfully. You can now leave a review.",
                    "job_id": job_id,
                    "worker_marked_complete": job.workerMarkedComplete,
                    "client_marked_complete": job.clientMarkedComplete,
                    "status": "COMPLETED",
                    "payment_method": "CASH",
                    "requires_payment": False,
                    "cash_proof_uploaded": True,
                    "payment_amount": float(remaining_amount),
                    "prompt_review": True,
                    "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None,
                    "agency_id": job.assignedAgencyFK.agencyId if job.assignedAgencyFK else None,
                    "recipient_type": cash_recipient_type if cash_recipient_account else None
                }
            
            # If not WALLET or CASH, return error
            return Response({
                "error": f"Invalid payment method: {payment_method_upper}. Only WALLET or CASH is supported."
            }, status=400)
                
        except Exception as payment_error:
            print(f"⚠️ Error processing payment: {str(payment_error)}")
            import traceback
            traceback.print_exc()
            # Allow proceeding with review even if payment fails
            return {
                "success": True,
                "message": "Job completion approved! Payment processing error, please contact support.",
                "job_id": job_id,
                "worker_marked_complete": job.workerMarkedComplete,
                "client_marked_complete": job.clientMarkedComplete,
                "status": job.status,
                "requires_payment": False,
                "payment_error": True,
                "prompt_review": True,
                "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None
            }
        
    except Exception as e:
        print(f"❌ Error approving job completion: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to approve job completion: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/upload-cash-proof", auth=cookie_auth)
def upload_cash_payment_proof(request, job_id: int):
    """
    Upload proof of cash payment for final 50% payment
    Client uploads screenshot/photo of cash payment receipt
    """
    try:
        print(f"💵 Uploading cash payment proof for job {job_id}")
        
        # Get client's profile
        try:
            client_profile = ClientProfile.objects.select_related('profileID__accountFK').get(
                profileID__accountFK=request.auth
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"},
                status=400
            )
        
        # Get the job
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job not found"},
                status=404
            )
        
        # Verify client owns this job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You are not the client for this job"},
                status=403
            )
        
        # Verify payment method is CASH
        if job.finalPaymentMethod != 'CASH':
            return Response(
                {"error": "This job is not set for cash payment"},
                status=400
            )
        
        # Verify not already approved
        if job.cashPaymentApproved:
            return Response(
                {"error": "Cash payment has already been approved"},
                status=400
            )
        
        # Get proof image from request
        proof_image = request.FILES.get('proof_image')
        if not proof_image:
            return Response(
                {"error": "Please provide proof_image file"},
                status=400
            )
        
        # Upload using unified STORAGE adapter (local or Supabase based on USE_LOCAL_DB)
        try:
            from django.conf import settings
            import uuid
            
            if not settings.STORAGE:
                raise Exception("Storage not configured")
            file_extension = proof_image.name.split('.')[-1]
            file_name = f"cash_proofs/{job_id}_{uuid.uuid4().hex}.{file_extension}"
            
            # Upload file
            result = settings.STORAGE.storage().from_('job-images').upload(
                file_name,
                proof_image.read(),
                {'content-type': proof_image.content_type}
            )
            
            # Get public URL
            proof_url = settings.STORAGE.storage().from_('job-images').get_public_url(file_name)
            
            # Save proof URL to job
            job.cashPaymentProofUrl = proof_url
            job.cashProofUploadedAt = timezone.now()
            job.save()
            
            print(f"✅ Cash payment proof uploaded: {proof_url}")
            
            return {
                "success": True,
                "message": "Proof of payment uploaded successfully! Waiting for admin verification.",
                "proof_url": proof_url,
                "job_id": job_id,
                "awaiting_admin_approval": True
            }
            
        except Exception as upload_error:
            print(f"❌ Error uploading proof: {str(upload_error)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to upload proof: {str(upload_error)}"},
                status=500
            )
    
    except Exception as e:
        print(f"❌ Error uploading cash proof: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to upload cash payment proof: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/review", auth=dual_auth)
def submit_job_review(request, job_id: int, data: SubmitReviewSchema):
    """
    Submit a review for a completed job
    Both client and worker can review each other after both mark the job complete
    Can only submit one review per job per person
    
    For agency jobs, the client must submit TWO reviews:
    1. review_target="EMPLOYEE" - Rate the assigned employee
    2. review_target="AGENCY" - Rate the agency itself
    """
    try:
        print(f"⭐ Submitting review for job {job_id}")
        
        # Get user's profile (may not exist for agency owners)
        profile = get_user_profile(request)
        # profile can be None for agency owners
        
        # Get the job with agency employee info
        try:
            job = JobPosting.objects.select_related(
                'clientID__profileID',
                'assignedWorkerID__profileID',
                'assignedEmployeeID__agency'
            ).get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job not found"},
                status=404
            )
        
        # Verify both parties have marked the job as complete
        if not (job.workerMarkedComplete and job.clientMarkedComplete):
            return Response(
                {"error": "Both parties must mark the job as complete before reviewing"},
                status=400
            )
        
        # Check if this is an agency job
        is_agency_job = job.assignedEmployeeID is not None
        
        # Determine reviewer type first to check payment requirement
        # Agency owners may not have a Profile, so check for None
        is_client = profile is not None and job.clientID.profileID.profileID == profile.profileID
        is_worker = profile is not None and job.assignedWorkerID and job.assignedWorkerID.profileID.profileID == profile.profileID
        is_agency_owner = is_agency_job and job.assignedEmployeeID.agency == request.auth
        
        if not (is_client or is_worker or is_agency_owner):
            return Response(
                {"error": "You are not part of this job"},
                status=403
            )
        
        # If client is reviewing, check if final payment has been made
        if is_client and not job.remainingPaymentPaid:
            return Response(
                {"error": "You must complete the final payment before leaving a review"},
                status=400
            )
        
        # Validate rating
        if data.rating < 1 or data.rating > 5:
            return Response(
                {"error": "Rating must be between 1 and 5 stars"},
                status=400
            )
        
        from accounts.models import JobReview, JobEmployeeAssignment
        from agency.models import AgencyEmployee
        
        # Handle agency job reviews (client rates employee + agency separately)
        if is_agency_job and is_client:
            review_target = data.review_target or "EMPLOYEE"  # Default to employee first
            
            if review_target == "EMPLOYEE":
                # Get all assigned employees (multi-employee support)
                assigned_employees = JobEmployeeAssignment.objects.filter(
                    job=job,
                    status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
                ).select_related('employee')
                
                # If employee_id is provided, review that specific employee
                # Otherwise, use legacy assignedEmployeeID (backward compatibility)
                if data.employee_id:
                    try:
                        assignment = assigned_employees.get(employee_id=data.employee_id)
                        employee = assignment.employee
                    except JobEmployeeAssignment.DoesNotExist:
                        return Response(
                            {"error": f"Employee {data.employee_id} is not assigned to this job"},
                            status=400
                        )
                else:
                    # Fallback to legacy single employee
                    employee = job.assignedEmployeeID
                    if not employee:
                        return Response(
                            {"error": "No employee assigned to this job"},
                            status=400
                        )
                
                # Check if this specific employee review already exists
                existing_employee_review = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=request.auth,
                    reviewerType="CLIENT",
                    revieweeEmployeeID=employee
                ).first()
                
                if existing_employee_review:
                    return Response(
                        {"error": f"You have already reviewed {employee.name}"},
                        status=400
                    )
                
                # Create employee review
                review = JobReview.objects.create(
                    jobID=job,
                    reviewerID=request.auth,
                    revieweeID=None,  # No Accounts for employee
                    revieweeEmployeeID=employee,
                    reviewerType="CLIENT",
                    rating=data.rating,
                    comment=data.message or "",
                    status="ACTIVE"
                )
                
                # Update employee's rating (simple average)
                from django.db.models import Avg
                employee_reviews = JobReview.objects.filter(
                    revieweeEmployeeID=employee,
                    status="ACTIVE"
                )
                avg_rating = employee_reviews.aggregate(avg=Avg('rating'))['avg']
                if avg_rating:
                    employee.rating = avg_rating
                    employee.save(update_fields=['rating'])
                
                print(f"✅ Employee review submitted: {employee.name} got {data.rating} stars")
                
                # Check which employees still need reviews
                all_assigned_employee_ids = list(assigned_employees.values_list('employee_id', flat=True))
                reviewed_employee_ids = list(JobReview.objects.filter(
                    jobID=job,
                    reviewerID=request.auth,
                    reviewerType="CLIENT",
                    revieweeEmployeeID__isnull=False
                ).values_list('revieweeEmployeeID', flat=True))
                
                employees_needing_review = [
                    eid for eid in all_assigned_employee_ids 
                    if eid not in reviewed_employee_ids
                ]
                
                # Check if agency review is still needed
                agency_review_exists = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=request.auth,
                    reviewerType="CLIENT",
                    revieweeAgencyID__isnull=False
                ).exists()
                
                # Build pending employees info
                pending_employees = []
                if employees_needing_review:
                    pending = AgencyEmployee.objects.filter(employeeID__in=employees_needing_review)
                    pending_employees = [
                        {"employee_id": emp.employeeID, "name": emp.name}
                        for emp in pending
                    ]
                
                all_employees_reviewed = len(employees_needing_review) == 0
                
                if all_employees_reviewed:
                    message = "All employees reviewed! Now please rate the agency."
                else:
                    message = f"Employee review submitted! {len(employees_needing_review)} more employee(s) to review."
                
                return {
                    "success": True,
                    "message": message,
                    "review_id": review.reviewID,
                    "rating": float(review.rating),
                    "reviewer_type": "CLIENT",
                    "review_target": "EMPLOYEE",
                    "employee_reviewed": {
                        "employee_id": employee.employeeID,
                        "name": employee.name
                    },
                    "all_employees_reviewed": all_employees_reviewed,
                    "pending_employee_reviews": pending_employees,
                    "needs_agency_review": not agency_review_exists,
                    "job_completed": False
                }
                
            elif review_target == "AGENCY":
                # Review the agency
                from accounts.models import Agency
                try:
                    agency = Agency.objects.get(accountFK=job.assignedEmployeeID.agency)
                except Agency.DoesNotExist:
                    return Response(
                        {"error": "Agency not found"},
                        status=400
                    )
                
                # Check if agency review already exists
                existing_agency_review = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=request.auth,
                    reviewerType="CLIENT",
                    revieweeAgencyID=agency
                ).first()
                
                if existing_agency_review:
                    return Response(
                        {"error": "You have already reviewed this agency"},
                        status=400
                    )
                
                # Create agency review
                review = JobReview.objects.create(
                    jobID=job,
                    reviewerID=request.auth,
                    revieweeID=None,
                    revieweeAgencyID=agency,
                    reviewerType="CLIENT",
                    rating=data.rating,
                    comment=data.message or "",
                    status="ACTIVE"
                )
                
                print(f"✅ Agency review submitted: {agency.businessName} got {data.rating} stars")
                
                # Check if ALL employees have been reviewed (multi-employee support)
                assigned_employees = JobEmployeeAssignment.objects.filter(
                    job=job,
                    status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
                ).values_list('employee_id', flat=True)
                
                reviewed_employees = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=request.auth,
                    reviewerType="CLIENT",
                    revieweeEmployeeID__isnull=False
                ).values_list('revieweeEmployeeID', flat=True)
                
                all_employees_reviewed = set(assigned_employees).issubset(set(reviewed_employees))
                
                # For backward compatibility, also check legacy single employee
                if not assigned_employees and job.assignedEmployeeID:
                    all_employees_reviewed = job.assignedEmployeeID.employeeID in reviewed_employees
                
                job_completed = False
                pending_employee_reviews = []
                
                if all_employees_reviewed:
                    # All reviews submitted - mark job complete
                    job.status = "COMPLETED"
                    job.completedAt = timezone.now()
                    job.save()
                    job_completed = True
                    print(f"🎉 All reviews submitted! Agency job {job_id} marked as COMPLETED.")
                    message = "Agency review submitted! Thank you for your feedback."
                else:
                    # Still have employees to review
                    unreviewed = set(assigned_employees) - set(reviewed_employees)
                    pending = AgencyEmployee.objects.filter(employeeID__in=unreviewed)
                    pending_employee_reviews = [
                        {"employee_id": emp.employeeID, "name": emp.name}
                        for emp in pending
                    ]
                    message = f"Agency review submitted! Please also review {len(pending_employee_reviews)} remaining employee(s)."
                
                return {
                    "success": True,
                    "message": message,
                    "review_id": review.reviewID,
                    "rating": float(review.rating),
                    "reviewer_type": "CLIENT",
                    "review_target": "AGENCY",
                    "needs_agency_review": False,
                    "pending_employee_reviews": pending_employee_reviews,
                    "job_completed": job_completed
                }
            else:
                return Response(
                    {"error": "Invalid review_target. Must be 'EMPLOYEE' or 'AGENCY'"},
                    status=400
                )
        
        # Handle agency reviewing client (agency owner on behalf of employee)
        elif is_agency_job and is_agency_owner:
            reviewee_profile = job.clientID.profileID
            reviewer_type = "AGENCY"  # Agency account reviewing client
            
            # Check if review already exists
            existing_review = JobReview.objects.filter(
                jobID=job,
                reviewerID=request.auth
            ).first()
            
            if existing_review:
                return Response(
                    {"error": "You have already submitted a review for this job"},
                    status=400
                )
            
            # Create the review
            review = JobReview.objects.create(
                jobID=job,
                reviewerID=request.auth,
                revieweeID=reviewee_profile.accountFK,
                reviewerType=reviewer_type,
                rating=data.rating,
                comment=data.message or "",
                status="ACTIVE"
            )
            
            print(f"✅ Agency review of client submitted for job {job_id}")
            
            return {
                "success": True,
                "message": "Review submitted successfully!",
                "review_id": review.reviewID,
                "rating": float(review.rating),
                "reviewer_type": reviewer_type,
                "job_completed": False  # Agency jobs complete after client reviews
            }
        
        # Regular job (non-agency) - original logic
        else:
            reviewer_profile = profile
            if is_client:
                if not job.assignedWorkerID or not job.assignedWorkerID.profileID:
                    return Response(
                        {"error": "Cannot review: No worker assigned to this job"},
                        status=400
                    )
                reviewee_profile = job.assignedWorkerID.profileID
                reviewer_type = "CLIENT"
            else:
                reviewee_profile = job.clientID.profileID
                reviewer_type = "WORKER"
            
            # Check if review already exists
            existing_review = JobReview.objects.filter(
                jobID=job,
                reviewerID=request.auth
            ).first()
            
            if existing_review:
                return Response(
                    {"error": "You have already submitted a review for this job"},
                    status=400
                )
            
            # Create the review
            review = JobReview.objects.create(
                jobID=job,
                reviewerID=request.auth,
                revieweeID=reviewee_profile.accountFK,
                reviewerType=reviewer_type,
                rating=data.rating,
                comment=data.message or "",
                status="ACTIVE"
            )
            
            print(f"✅ Review submitted successfully for job {job_id}")
            print(f"   Reviewer: {reviewer_profile.firstName} ({reviewer_type})")
            print(f"   Rating: {data.rating} stars")
            
            # Check if both parties have now submitted reviews
            total_reviews = JobReview.objects.filter(jobID=job).count()
            
            job_completed = False
            if total_reviews >= 2 and job.workerMarkedComplete and job.clientMarkedComplete:
                # Both reviews exist and both parties marked complete - NOW mark job as COMPLETED
                job.status = "COMPLETED"
                job.completedAt = timezone.now()
                job.save()
                job_completed = True
                print(f"🎉 Both reviews submitted! Job {job_id} marked as COMPLETED.")
            
            return {
                "success": True,
                "message": "Review submitted successfully!",
                "review_id": review.reviewID,
                "rating": float(review.rating),
                "reviewer_type": reviewer_type,
                "job_completed": job_completed
            }
        
    except Exception as e:
        print(f"❌ Error submitting review: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to submit review: {str(e)}"},
            status=500
        )


@router.get("/{job_id}/has-reviewed", auth=cookie_auth)
def check_user_review_status(request, job_id: int):
    """
    Check if the current user has already submitted a review for this job
    """
    try:
        from accounts.models import JobReview
        
        # Check if review exists
        review_exists = JobReview.objects.filter(
            jobID__jobID=job_id,
            reviewerID=request.auth
        ).exists()
        
        # Also check total reviews count
        total_reviews = JobReview.objects.filter(jobID__jobID=job_id).count()
        
        return {
            "success": True,
            "has_reviewed": review_exists,
            "total_reviews": total_reviews,
            "both_reviewed": total_reviews >= 2
        }
        
    except Exception as e:
        print(f"❌ Error checking review status: {str(e)}")
        return Response(
            {"error": f"Failed to check review status: {str(e)}"},
            status=500
        )


@router.post("/{job_id}/confirm-final-payment", auth=cookie_auth)
def confirm_final_payment(request, job_id: int):
    """
    Confirm that the final 50% payment has been completed
    This can be called manually or by a webhook after Xendit payment confirmation
    """
    try:
        print(f"💰 Confirming final payment for job {job_id}")
        
        # Get client's profile
        try:
            client_profile = ClientProfile.objects.select_related('profileID__accountFK').get(
                profileID__accountFK=request.auth
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"},
                status=400
            )
        
        # Get the job
        try:
            job = JobPosting.objects.select_related(
                'assignedWorkerID__profileID__accountFK'
            ).get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job not found"},
                status=404
            )
        
        # Verify client owns this job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You are not the client for this job"},
                status=403
            )
        
        # Verify completion has been approved
        if not job.clientMarkedComplete:
            return Response(
                {"error": "You must approve job completion first"},
                status=400
            )
        
        # Check if already paid
        if job.remainingPaymentPaid:
            return Response(
                {"error": "Final payment has already been confirmed"},
                status=400
            )
        
        # Mark payment as complete
        with db_transaction.atomic():
            job.remainingPaymentPaid = True
            job.remainingPaymentPaidAt = timezone.now()
            job.save()
            
            # Get client's wallet
            from accounts.models import Wallet
            try:
                wallet = Wallet.objects.get(accountFK=client_profile.profileID.accountFK)
                
                # Update the transaction status to COMPLETED
                Transaction.objects.filter(
                    walletID=wallet,
                    description__icontains=f"Remaining payment for job: {job.title}",
                    status="PENDING"
                ).update(
                    status="COMPLETED",
                    completedAt=timezone.now()
                )
            except Wallet.DoesNotExist:
                print(f"⚠️ Wallet not found for client, skipping transaction update")
        
        print(f"✅ Final payment confirmed for job {job_id}")
        
        return {
            "success": True,
            "message": "Final payment confirmed! You can now leave a review.",
            "job_id": job_id,
            "payment_confirmed": True,
            "prompt_review": True,
            "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None
        }
        
    except Exception as e:
        print(f"❌ Error confirming final payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to confirm final payment: {str(e)}"},
            status=500
        )


#endregion


#region INVITE Job Creation (Direct Hiring for Agencies/Workers)

@router.post("/create-invite", auth=cookie_auth)
def create_invite_job(
    request,
    title: str,
    description: str,
    category_id: int,
    budget: float,
    location: str,
    expected_duration: Optional[str] = None,
    urgency: str = "MEDIUM",
    preferred_start_date: Optional[str] = None,
    materials_needed: Optional[List[str]] = None,
    agency_id: Optional[int] = None,
    worker_id: Optional[int] = None,
    payment_method: str = "WALLET"
):
    """
    Create an INVITE-type job (direct hire for agency or worker)
    - Client selects an agency or worker to invite
    - 50% downpayment is held in escrow (pending agency/worker acceptance)
    - Agency/worker can accept or reject the invite
    - If accepted: job becomes ACTIVE, escrow released
    - If rejected: escrow refunded to client
    
    Required: Either agency_id OR worker_id (not both)
    """
    try:
        print(f"📝 INVITE job creation request from {request.auth.email}")
        
        # Validate that either agency_id or worker_id is provided (not both)
        if not agency_id and not worker_id:
            return Response(
                {"error": "Must provide either agency_id or worker_id"},
                status=400
            )
        if agency_id and worker_id:
            return Response(
                {"error": "Cannot invite both agency and worker. Choose one."},
                status=400
            )
        
        # Verify user is a client
        profile = get_user_profile(request)
        if profile is None or profile.profileType != "CLIENT":
            return Response(
                {"error": "Only clients can create INVITE jobs"},
                status=403
            )
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"},
                status=400
            )
        
        # Import Job model (not JobPosting)
        from accounts.models import Job, Agency, Notification
        
        # Verify agency or worker exists
        assigned_agency = None
        assigned_worker = None
        invite_target_name = ""
        
        if agency_id:
            try:
                assigned_agency = Agency.objects.get(agencyId=agency_id)
                invite_target_name = assigned_agency.businessName
                # Verify agency KYC is approved
                from agency.models import AgencyKYC
                try:
                    kyc = AgencyKYC.objects.get(agencyID=assigned_agency)
                    if kyc.status != "APPROVED":
                        return Response(
                            {"error": f"Agency KYC status is {kyc.status}. Can only invite APPROVED agencies."},
                            status=400
                        )
                except AgencyKYC.DoesNotExist:
                    return Response(
                        {"error": "Agency has not completed KYC verification"},
                        status=400
                    )
            except Agency.DoesNotExist:
                return Response(
                    {"error": "Agency not found"},
                    status=404
                )
        
        if worker_id:
            try:
                assigned_worker = WorkerProfile.objects.get(profileID__profileID=worker_id)
                invite_target_name = f"{assigned_worker.profileID.firstName} {assigned_worker.profileID.lastName}"
            except WorkerProfile.DoesNotExist:
                return Response(
                    {"error": "Worker not found"},
                    status=404
                )
        
        # Validate category
        try:
            category = Specializations.objects.get(specializationID=category_id)
        except Specializations.DoesNotExist:
            return Response(
                {"error": "Invalid category"},
                status=400
            )
        
        # Parse preferred start date
        preferred_start_date_obj = None
        if preferred_start_date:
            try:
                preferred_start_date_obj = datetime.strptime(preferred_start_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=400
                )
        
        # Calculate escrow (50% downpayment)
        total_budget = Decimal(str(budget))
        downpayment = total_budget * Decimal('0.5')
        remaining_payment = total_budget * Decimal('0.5')
        
        print(f"💰 Budget: ₱{total_budget} | Escrow: ₱{downpayment} | Remaining: ₱{remaining_payment}")
        
        # Get client wallet
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': Decimal('0.00')}
        )
        
        # Handle payment method
        payment_method = payment_method.upper()
        
        if payment_method == "WALLET":
            # Check wallet balance
            if wallet.balance < downpayment:
                return Response(
                    {
                        "error": "Insufficient wallet balance",
                        "required": float(downpayment),
                        "available": float(wallet.balance)
                    },
                    status=400
                )
            
            with db_transaction.atomic():
                # Deduct escrow from wallet
                wallet.balance -= downpayment
                wallet.save()
                
                # Create INVITE job with PENDING invite status
                job = Job.objects.create(
                    clientID=client_profile,
                    title=title,
                    description=description,
                    categoryID=category,
                    budget=total_budget,
                    escrowAmount=downpayment,
                    escrowPaid=True,
                    escrowPaidAt=timezone.now(),
                    remainingPayment=remaining_payment,
                    location=location,
                    expectedDuration=expected_duration,
                    urgency=urgency.upper(),
                    preferredStartDate=preferred_start_date_obj,
                    materialsNeeded=materials_needed or [],
                    jobType="INVITE",  # Set job type to INVITE
                    inviteStatus="PENDING",  # Agency/worker hasn't responded yet
                    status="ACTIVE",  # Job is created but awaiting acceptance
                    assignedAgencyFK=assigned_agency,
                    assignedWorkerID=assigned_worker
                )
                
                # Create escrow transaction
                Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    amount=downpayment,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.COMPLETED,
                    description=f"Escrow payment (50%) for INVITE job: {job.title}",
                    relatedJobID=job,
                    completedAt=timezone.now(),
                    referenceNumber=f"INVITE-ESCROW-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                # Send notification to agency/worker
                if assigned_agency:
                    target_account = assigned_agency.accountFK
                elif assigned_worker and assigned_worker.profileID:
                    target_account = assigned_worker.profileID.accountFK
                else:
                    return Response({"error": "Invalid invite target"}, status=400)
                    
                Notification.objects.create(
                    accountFK=target_account,
                    notificationType="JOB_INVITE",
                    title=f"New Job Invitation: {title}",
                    message=f"You've been invited to work on '{title}'. Budget: ₱{budget}. Review and respond to the invitation.",
                    relatedJobID=job.jobID
                )
                
                # Send confirmation to client
                Notification.objects.create(
                    accountFK=request.auth,
                    notificationType="JOB_INVITE_SENT",
                    title="Job Invitation Sent",
                    message=f"Your invitation to {invite_target_name} for '{title}' has been sent. Awaiting their response.",
                    relatedJobID=job.jobID
                )
                
                print(f"✅ INVITE job created: ID={job.jobID}, inviteStatus=PENDING")
            
            return {
                "success": True,
                "job_id": job.jobID,
                "job_type": "INVITE",
                "invite_status": "PENDING",
                "invite_target": invite_target_name,
                "escrow_paid": True,
                "escrow_amount": float(downpayment),
                "new_wallet_balance": float(wallet.balance),
                "message": f"Invitation sent to {invite_target_name}! Escrow of ₱{downpayment} deducted from your wallet."
            }
        
        elif payment_method == "GCASH":
            with db_transaction.atomic():
                # Create INVITE job with pending payment
                job = Job.objects.create(
                    clientID=client_profile,
                    title=title,
                    description=description,
                    categoryID=category,
                    budget=total_budget,
                    escrowAmount=downpayment,
                    escrowPaid=False,  # Will be marked true after payment
                    remainingPayment=remaining_payment,
                    location=location,
                    expectedDuration=expected_duration,
                    urgency=urgency.upper(),
                    preferredStartDate=preferred_start_date_obj,
                    materialsNeeded=materials_needed or [],
                    jobType="INVITE",
                    inviteStatus="PENDING",
                    status="ACTIVE",
                    assignedAgencyFK=assigned_agency,
                    assignedWorkerID=assigned_worker
                )
                
                # Create pending transaction
                transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    amount=downpayment,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.PENDING,
                    description=f"Escrow payment (50%) for INVITE job: {job.title}",
                    relatedJobID=job,
                    referenceNumber=f"INVITE-ESCROW-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
            
            # Create Xendit invoice
            user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or request.auth.email
            xendit_result = XenditService.create_gcash_payment(
                amount=float(downpayment),
                user_email=request.auth.email,
                user_name=user_name,
                transaction_id=transaction.transactionID
            )
            
            if not xendit_result.get("success"):
                job.delete()
                transaction.delete()
                return Response(
                    {"error": "Failed to create payment invoice"},
                    status=500
                )
            
            # Update transaction with Xendit details
            transaction.xenditInvoiceID = xendit_result['invoice_id']
            transaction.xenditExternalID = xendit_result['external_id']
            transaction.invoiceURL = xendit_result['invoice_url']
            transaction.xenditPaymentChannel = "GCASH"
            transaction.xenditPaymentMethod = "EWALLET"
            transaction.save()
            
            print(f"✅ INVITE job created: ID={job.jobID}, awaiting GCash payment")
            
            return {
                "success": True,
                "requires_payment": True,
                "job_id": job.jobID,
                "job_type": "INVITE",
                "invite_status": "PENDING",
                "invite_target": invite_target_name,
                "escrow_amount": float(downpayment),
                "invoice_url": xendit_result['invoice_url'],
                "invoice_id": xendit_result['invoice_id'],
                "transaction_id": transaction.transactionID,
                "message": f"Please complete the ₱{downpayment} escrow payment via GCash."
            }
        
        else:
            return Response(
                {"error": f"Invalid payment method: {payment_method}"},
                status=400
            )
        
    except Exception as e:
        print(f"❌ Error creating INVITE job: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to create INVITE job: {str(e)}"},
            status=500
        )


@router.get("/my-invite-jobs", auth=cookie_auth)
def get_my_invite_jobs(request, invite_status: str | None = None, page: int = 1, limit: int = 20):
    """
    Get client's INVITE-type jobs with optional invite status filter
    
    Query Parameters:
    - invite_status: Filter by PENDING, ACCEPTED, REJECTED
    - page: Page number
    - limit: Items per page
    """
    try:
        # Verify user is a client
        profile = get_user_profile(request)
        if profile is None or profile.profileType != "CLIENT":
            return Response(
                {"error": "Only clients can view INVITE jobs"},
                status=403
            )
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"},
                status=400
            )
        
        from accounts.models import Job
        
        # Base query: INVITE-type jobs for this client
        jobs_query = Job.objects.filter(
            clientID=client_profile,
            jobType="INVITE"
        )
        
        # Filter by invite status if provided
        if invite_status:
            jobs_query = jobs_query.filter(inviteStatus=invite_status.upper())
        
        # Order by creation date
        jobs_query = jobs_query.order_by('-createdAt')
        
        # Pagination
        total = jobs_query.count()
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        jobs_page = jobs_query[start_idx:end_idx]
        
        # Build response
        jobs_data = []
        for job in jobs_page:
            invite_target = None
            if job.assignedAgencyFK:
                invite_target = {
                    "type": "agency",
                    "id": job.assignedAgencyFK.agencyId,
                    "name": job.assignedAgencyFK.businessName
                }
            elif job.assignedWorkerID:
                invite_target = {
                    "type": "worker",
                    "id": job.assignedWorkerID.profileID.profileID,
                    "name": f"{job.assignedWorkerID.profileID.firstName} {job.assignedWorkerID.profileID.lastName}"
                }
            
            jobs_data.append({
                "job_id": job.jobID,
                "title": job.title,
                "description": job.description,
                "budget": float(job.budget),
                "location": job.location,
                "status": job.status,
                "invite_status": job.inviteStatus,
                "invite_target": invite_target,
                "invite_rejection_reason": job.inviteRejectionReason,
                "invite_responded_at": job.inviteRespondedAt,
                "escrow_paid": job.escrowPaid,
                "created_at": job.createdAt,
                "updated_at": job.updatedAt
            })
        
        total_pages = (total + limit - 1) // limit
        
        return {
            "jobs": jobs_data,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
        
    except Exception as e:
        print(f"❌ Error fetching INVITE jobs: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch INVITE jobs"},
            status=500
        )

#endregion


# ============================================================
# BACKJOB / DISPUTE ENDPOINTS
# ============================================================
#region Backjob Endpoints

@router.post("/{job_id}/request-backjob", auth=dual_auth)
def request_backjob(request, job_id: int, reason: str = Form(...), description: str = Form(...), images: List[UploadedFile] = File(default=None)):
    """
    Client requests a backjob (rework) on a completed job.
    Creates a dispute with evidence images.
    Admin must approve before it appears for worker/agency.
    """
    try:
        print(f"🔄 Backjob request for job {job_id} from user {request.auth.email}")
        
        # Get the job
        try:
            job = Job.objects.select_related(
                'clientID__profileID__accountFK',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK__accountFK'
            ).get(jobID=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)
        
        # Verify job is completed
        if job.status != "COMPLETED":
            return Response(
                {"error": "Backjob can only be requested for completed jobs"},
                status=400
            )
        
        # Verify requester is the client who owns this job
        if job.clientID.profileID.accountFK != request.auth:
            return Response(
                {"error": "Only the client who posted this job can request a backjob"},
                status=403
            )
        
        # Check if a dispute/backjob already exists for this job
        existing_dispute = JobDispute.objects.filter(jobID=job).first()
        if existing_dispute:
            return Response(
                {"error": "A backjob request already exists for this job", "dispute_id": existing_dispute.disputeID},
                status=400
            )
        
        # Validate inputs
        if len(reason) < 10:
            return Response({"error": "Reason must be at least 10 characters"}, status=400)
        if len(description) < 50:
            return Response({"error": "Description must be at least 50 characters"}, status=400)
        
        with db_transaction.atomic():
            # Create the dispute/backjob request
            dispute = JobDispute.objects.create(
                jobID=job,
                disputedBy="CLIENT",
                reason=reason,
                description=description,
                status="OPEN",  # Will be UNDER_REVIEW once admin looks at it
                priority="MEDIUM",
                jobAmount=job.budget,
                disputedAmount=Decimal('0.00'),  # Client is not disputing payment, just requesting rework
            )
            
            # Upload and store evidence images
            uploaded_images = []
            if images:
                for idx, image in enumerate(images[:5]):  # Max 5 images
                    if image.size > 5 * 1024 * 1024:  # 5MB limit
                        continue
                    
                    # Validate file type
                    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
                    if image.content_type not in allowed_types:
                        continue
                    
                    # Generate filename
                    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
                    file_extension = os.path.splitext(image.name)[1] if image.name else '.jpg'
                    filename = f"backjob_{dispute.disputeID}_{idx}_{timestamp}{file_extension}"
                    storage_path = f"disputes/dispute_{dispute.disputeID}/{filename}"
                    
                    try:
                        file_content = image.read()
                        
                        if settings.STORAGE:
                            upload_response = settings.STORAGE.storage().from_('iayos_files').upload(
                                storage_path,
                                file_content,
                                {'content-type': image.content_type}
                            )
                            
                            image_url = settings.STORAGE.storage().from_('iayos_files').get_public_url(storage_path)
                            
                            # Create evidence record
                            evidence = DisputeEvidence.objects.create(
                                disputeID=dispute,
                                imageURL=image_url,
                                description=f"Evidence image {idx + 1}",
                                uploadedBy=request.auth
                            )
                            uploaded_images.append(image_url)
                    except Exception as upload_error:
                        print(f"⚠️ Failed to upload image {idx}: {upload_error}")
            
            # Notify admins about new backjob request
            # In a real system, you might have an admin notification channel
            # For now, just log it
            print(f"📢 New backjob request created: Dispute #{dispute.disputeID} for Job #{job.jobID}")
            
            # Create a log entry (newStatus max 15 chars)
            JobLog.objects.create(
                jobID=job,
                oldStatus=job.status,
                newStatus="BACKJOB",
                changedBy=request.auth,
                notes=f"Client requested backjob. Reason: {reason}"
            )
            
            # ============================================
            # REOPEN CONVERSATION FOR BACKJOB DISCUSSION
            # ============================================
            from profiles.models import Conversation, Message
            
            # Find existing conversation for this job
            conversation = Conversation.objects.filter(relatedJobPosting=job).first()
            
            if conversation:
                # Reopen the existing conversation
                old_status = conversation.status
                conversation.status = Conversation.ConversationStatus.ACTIVE
                conversation.save()
                print(f"🔄 Reopened conversation {conversation.conversationID} (was {old_status})")
            else:
                # Create a new conversation if none exists
                client_profile = job.clientID.profileID
                worker_profile = job.assignedWorkerID.profileID if job.assignedWorkerID else None
                agency = job.assignedAgencyFK
                
                conversation = Conversation.objects.create(
                    client=client_profile,
                    worker=worker_profile,
                    agency=agency,
                    relatedJobPosting=job,
                    status=Conversation.ConversationStatus.ACTIVE
                )
                print(f"💬 Created new conversation {conversation.conversationID} for backjob")
            
            # Add a system message indicating backjob was initiated
            Message.objects.create(
                conversationID=conversation,
                sender=None,  # System message has no sender
                senderAgency=None,
                messageText="🔄 Backjob Initiated - You can now discuss the backjob details here.",
                messageType=Message.MessageType.SYSTEM
            )
            print(f"📝 Added system message to conversation {conversation.conversationID}")
        
        return {
            "success": True,
            "message": "Backjob request submitted successfully. Our team will review it within 1-3 business days.",
            "dispute_id": dispute.disputeID,
            "status": dispute.status,
            "evidence_count": len(uploaded_images)
        }
        
    except Exception as e:
        print(f"❌ Error requesting backjob: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to submit backjob request: {str(e)}"}, status=500)


@router.get("/my-backjobs", auth=jwt_auth)
def get_my_backjobs(request, status: Optional[str] = None):
    """
    Get backjobs assigned to the current worker or agency.
    Only shows approved backjobs (UNDER_REVIEW status means admin approved and worker needs to action).
    """
    try:
        print(f"📋 Fetching backjobs for user {request.auth.email}")
        
        # Determine if user is worker or agency
        profile = Profile.objects.filter(accountFK=request.auth).first()
        agency = Agency.objects.filter(accountFK=request.auth).first()
        
        if not profile and not agency:
            return Response({"error": "Profile not found"}, status=404)
        
        # Build query for disputes where the related job was assigned to this worker/agency
        disputes_query = JobDispute.objects.select_related(
            'jobID',
            'jobID__clientID__profileID__accountFK',
            'jobID__assignedWorkerID__profileID',
            'jobID__assignedAgencyFK',
            'jobID__categoryID'
        ).prefetch_related('evidence')
        
        # Filter by jobs assigned to this user
        if agency:
            disputes_query = disputes_query.filter(jobID__assignedAgencyFK=agency)
        elif profile and profile.profileType == "WORKER":
            worker_profile = WorkerProfile.objects.filter(profileID=profile).first()
            if worker_profile:
                disputes_query = disputes_query.filter(jobID__assignedWorkerID=worker_profile)
            else:
                return {"backjobs": [], "total": 0}
        else:
            return {"backjobs": [], "total": 0}
        
        # Only show approved backjobs (UNDER_REVIEW means admin has reviewed and assigned to worker)
        # or show all if status filter provided
        if status:
            disputes_query = disputes_query.filter(status=status)
        else:
            # By default show UNDER_REVIEW (approved for action) and RESOLVED
            disputes_query = disputes_query.filter(status__in=["UNDER_REVIEW", "RESOLVED"])
        
        disputes = disputes_query.order_by('-openedDate')
        
        backjobs_data = []
        for dispute in disputes:
            job = dispute.jobID
            client = job.clientID.profileID if job.clientID else None
            
            evidence_urls = [e.imageURL for e in dispute.evidence.all()]
            
            backjobs_data.append({
                "dispute_id": dispute.disputeID,
                "job_id": job.jobID,
                "job_title": job.title,
                "job_description": job.description,
                "job_budget": float(job.budget),
                "job_location": job.location,
                "job_category": job.categoryID.name if job.categoryID else None,
                "reason": dispute.reason,
                "description": dispute.description,
                "status": dispute.status,
                "priority": dispute.priority,
                "opened_date": dispute.openedDate.isoformat() if dispute.openedDate else None,
                "resolution": dispute.resolution,
                "resolved_date": dispute.resolvedDate.isoformat() if dispute.resolvedDate else None,
                "evidence_images": evidence_urls,
                "client": {
                    "id": client.profileID if client else None,
                    "name": f"{client.firstName} {client.lastName}" if client else "Unknown",
                    "avatar": client.profileImg if client else None
                } if client else None
            })
        
        return {
            "backjobs": backjobs_data,
            "total": len(backjobs_data)
        }
        
    except Exception as e:
        print(f"❌ Error fetching backjobs: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to fetch backjobs"}, status=500)


@router.get("/{job_id}/backjob-status", auth=dual_auth)
def get_backjob_status(request, job_id: int):
    """
    Get the backjob/dispute status for a specific job.
    Useful for clients to check status of their backjob request.
    """
    try:
        # Get the job
        try:
            job = Job.objects.get(jobID=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)
        
        # Check if dispute exists
        dispute = JobDispute.objects.filter(jobID=job).prefetch_related('evidence').first()
        
        if not dispute:
            return {
                "has_backjob": False,
                "dispute": None
            }
        
        evidence_urls = [e.imageURL for e in dispute.evidence.all()]
        
        return {
            "has_backjob": True,
            "dispute": {
                "dispute_id": dispute.disputeID,
                "reason": dispute.reason,
                "description": dispute.description,
                "status": dispute.status,
                "priority": dispute.priority,
                "opened_date": dispute.openedDate.isoformat() if dispute.openedDate else None,
                "resolution": dispute.resolution,
                "resolved_date": dispute.resolvedDate.isoformat() if dispute.resolvedDate else None,
                "evidence_images": evidence_urls
            }
        }
        
    except Exception as e:
        print(f"❌ Error fetching backjob status: {str(e)}")
        return Response({"error": "Failed to fetch backjob status"}, status=500)


@router.post("/{job_id}/complete-backjob", auth=dual_auth)
def complete_backjob(request, job_id: int, notes: str = Form(default="")):
    """
    Worker/Agency marks a backjob as completed.
    """
    try:
        print(f"✅ Completing backjob for job {job_id}")
        
        # Get the job
        try:
            job = Job.objects.select_related(
                'clientID__profileID__accountFK',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK__accountFK'
            ).get(jobID=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)
        
        # Get the dispute
        dispute = JobDispute.objects.filter(jobID=job, status="UNDER_REVIEW").first()
        if not dispute:
            return Response({"error": "No active backjob found for this job"}, status=404)
        
        # Verify the user is the assigned worker or agency
        is_assigned_worker = (
            job.assignedWorkerID and 
            job.assignedWorkerID.profileID.accountFK == request.auth
        )
        is_assigned_agency = (
            job.assignedAgencyFK and 
            job.assignedAgencyFK.accountFK == request.auth
        )
        
        if not is_assigned_worker and not is_assigned_agency:
            return Response(
                {"error": "Only the assigned worker or agency can complete this backjob"},
                status=403
            )
        
        with db_transaction.atomic():
            # Update dispute status
            dispute.status = "RESOLVED"
            dispute.resolution = notes or "Backjob completed by worker/agency"
            dispute.resolvedDate = timezone.now()
            dispute.save()
            
            # Create job log
            JobLog.objects.create(
                jobID=job,
                action="BACKJOB_COMPLETED",
                performedBy=request.auth,
                notes=notes or "Backjob marked as completed"
            )
            
            # Notify the client
            Notification.objects.create(
                accountFK=job.clientID.profileID.accountFK,
                notificationType="BACKJOB_COMPLETED",
                title="Backjob Completed",
                message=f"The backjob for '{job.title}' has been completed. Please review the work.",
                relatedJobID=job.jobID
            )
        
        return {
            "success": True,
            "message": "Backjob marked as completed. The client has been notified.",
            "dispute_id": dispute.disputeID,
            "status": dispute.status
        }
        
    except Exception as e:
        print(f"❌ Error completing backjob: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to complete backjob: {str(e)}"}, status=500)

#endregion

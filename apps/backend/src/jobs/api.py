import json
from ninja import Router, File, Form
from ninja.responses import Response
from ninja.files import UploadedFile
from accounts.authentication import cookie_auth, jwt_auth, dual_auth
from accounts.models import ClientProfile, Specializations, Profile, WorkerProfile, JobApplication, JobPhoto, Wallet, Transaction, Job, JobLog, Agency, JobDispute, DisputeEvidence, Notification, JobSkillSlot
from accounts.payment_provider import get_payment_provider
from .models import JobPosting
# Use Job directly for type checking (JobPosting is just an alias)
from .schemas import (
    CreateJobPostingSchema, CreateJobPostingMobileSchema, JobPostingResponseSchema, 
    JobApplicationSchema, SubmitReviewSchema, ApproveJobCompletionSchema,
    LogAttendanceSchema, RequestExtensionSchema, RequestRateChangeSchema, CancelDailyJobSchema
)
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
        
        # Handle case where profileType is None (user hasn't selected a role)
        if profile.profileType is None:
            print("❌ Profile type is None - user needs to select a role")
            return Response(
                {"error": "Please select your account type (Client or Worker) before creating job postings.", "error_code": "PROFILE_TYPE_REQUIRED"},
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
            # Check if client has sufficient available balance for total amount (escrow + platform fee)
            # Available balance = balance - reservedBalance
            if wallet.availableBalance < total_to_charge:
                return Response(
                    {
                        "error": "Insufficient wallet balance",
                        "required": float(total_to_charge),
                        "available": float(wallet.availableBalance),
                        "reserved": float(wallet.reservedBalance),
                        "message": f"You need ₱{total_to_charge} (₱{downpayment} escrow + ₱{platform_fee} platform fee), but only have ₱{wallet.availableBalance} available."
                    },
                    status=400
                )
            
            # Use database transaction to ensure atomicity
            with db_transaction.atomic():
                # Determine job type: INVITE if worker_id provided (direct hire), otherwise LISTING (open to all)
                job_type = JobPosting.JobType.INVITE if hasattr(data, 'worker_id') and data.worker_id else JobPosting.JobType.LISTING
                
                # For LISTING jobs: Reserve funds (don't deduct yet)
                # For INVITE jobs: Deduct immediately (direct hire goes straight to work)
                if job_type == JobPosting.JobType.LISTING:
                    # Reserve funds instead of deducting
                    wallet.reservedBalance += total_to_charge
                    wallet.save()
                    escrow_paid = False
                    escrow_paid_at = None
                    transaction_status = Transaction.TransactionStatus.PENDING
                    print(f"🔒 Reserved ₱{total_to_charge} from wallet (₱{downpayment} escrow + ₱{platform_fee} fee). Available balance: ₱{wallet.availableBalance}")
                else:
                    # Direct hire - deduct immediately
                    wallet.balance -= total_to_charge
                    wallet.save()
                    escrow_paid = True
                    escrow_paid_at = timezone.now()
                    transaction_status = Transaction.TransactionStatus.COMPLETED
                    print(f"💸 Deducted ₱{total_to_charge} from wallet (₱{downpayment} escrow + ₱{platform_fee} fee). New balance: ₱{wallet.balance}")
                
                # Create job posting
                job_posting = JobPosting.objects.create(
                    clientID=client_profile,
                    title=data.title,
                    description=data.description,
                    categoryID=category,
                    budget=data.budget,
                    escrowAmount=downpayment,
                    escrowPaid=escrow_paid,
                    escrowPaidAt=escrow_paid_at,
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
                
                # Create transaction for escrow payment
                escrow_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    amount=downpayment,
                    balanceAfter=wallet.balance,
                    status=transaction_status,
                    description=f"Escrow payment (50% downpayment) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    completedAt=escrow_paid_at,
                    referenceNumber=f"ESCROW-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                # Create platform fee transaction record (for revenue tracking)
                fee_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.FEE,
                    amount=platform_fee,
                    balanceAfter=wallet.balance,
                    status=transaction_status,
                    description=f"Platform fee (10% of budget) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    completedAt=escrow_paid_at,
                    referenceNumber=f"FEE-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                print(f"✅ Job posting created: ID={job_posting.jobID}, Title='{job_posting.title}'")
                print(f"✅ Escrow transaction {'completed' if escrow_paid else 'reserved'}: ID={escrow_transaction.transactionID}")
                print(f"💰 Platform fee transaction {'completed' if escrow_paid else 'reserved'}: ID={fee_transaction.transactionID}, Amount=₱{platform_fee}")

                # Create notification for client
                from accounts.models import Notification
                if job_type == JobPosting.JobType.LISTING:
                    Notification.objects.create(
                        accountFK=client_profile.profileID.accountFK,
                        notificationType="JOB_POSTED",
                        title=f"Job Posted Successfully",
                        message=f"Your job '{job_posting.title}' is now live! ₱{total_to_charge} has been reserved from your wallet (will be charged when a worker is accepted).",
                        relatedJobID=job_posting.jobID
                    )
                else:
                    Notification.objects.create(
                        accountFK=client_profile.profileID.accountFK,
                        notificationType="ESCROW_PAID",
                        title=f"Job Posted Successfully",
                        message=f"Your job '{job_posting.title}' is now live! Escrow payment of ₱{downpayment} has been deducted from your wallet.",
                        relatedJobID=job_posting.jobID
                    )
                print(f"📬 Notification sent to client {client_profile.profileID.accountFK.email}")

            if job_type == JobPosting.JobType.LISTING:
                return {
                    "success": True,
                    "requires_payment": False,
                    "payment_method": "WALLET",
                    "job_posting_id": job_posting.jobID,
                    "escrow_amount": float(downpayment),
                    "remaining_payment": float(remaining_payment),
                    "reserved_amount": float(total_to_charge),
                    "available_balance": float(wallet.availableBalance),
                    "message": f"Job created successfully! ₱{total_to_charge} reserved from your wallet (will be charged when a worker is accepted)."
                }
            else:
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
        
        # Get user profile for payment invoice
        profile = get_user_profile(request)
        if profile:
            user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or request.auth.email
        else:
            user_name = request.auth.email
        
        # Create payment invoice for escrow using configured provider
        payment_provider = get_payment_provider()
        provider_name = payment_provider.provider_name
        print(f"💳 Creating {provider_name.upper()} invoice for escrow payment...")
        
        payment_result = payment_provider.create_gcash_payment(
            amount=float(downpayment),
            user_email=request.auth.email,
            user_name=user_name,
            transaction_id=escrow_transaction.transactionID
        )
        
        if not payment_result.get("success"):
            # If payment provider fails, delete the job and transaction
            job_posting.delete()
            escrow_transaction.delete()
            return Response(
                {"error": "Failed to create payment invoice", "details": payment_result.get("error")},
                status=500
            )
        
        # Update transaction with payment provider details
        escrow_transaction.xenditInvoiceID = payment_result.get('checkout_id') or payment_result.get('invoice_id')
        escrow_transaction.xenditExternalID = payment_result.get('external_id')
        escrow_transaction.invoiceURL = payment_result.get('checkout_url') or payment_result.get('invoice_url')
        escrow_transaction.xenditPaymentChannel = "GCASH"
        escrow_transaction.xenditPaymentMethod = provider_name.upper()
        escrow_transaction.save()
        
        print(f"📄 {provider_name.upper()} invoice created: {escrow_transaction.xenditInvoiceID}")
        print(f"🔗 Payment URL: {escrow_transaction.invoiceURL}")
        
        return {
            "success": True,
            "requires_payment": True,
            "job_posting_id": job_posting.jobID,
            "escrow_amount": float(downpayment),
            "remaining_payment": float(remaining_payment),
            "invoice_url": escrow_transaction.invoiceURL,
            "invoice_id": escrow_transaction.xenditInvoiceID,
            "provider": provider_name,
            "message": f"Job created. Please complete the ₱{downpayment} escrow payment."
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
        
        # Determine payment model
        payment_model = (data.payment_model or "PROJECT").upper()
        
        # Calculate payment based on payment model
        if payment_model == "DAILY":
            # DAILY payment model: 100% escrow upfront + 10% platform fee
            if not data.daily_rate or not data.duration_days:
                return Response(
                    {"error": "daily_rate and duration_days are required for DAILY payment model"},
                    status=400
                )
            
            total_budget = Decimal(str(data.daily_rate)) * Decimal(str(data.duration_days))
            downpayment = total_budget  # 100% escrow for DAILY jobs
            remaining_payment = Decimal('0.00')  # No remaining payment - paid daily as work is completed
            platform_fee = total_budget * Decimal('0.10')  # 10% platform fee
            total_to_charge = downpayment + platform_fee
            
            print(f"💰 DAILY Payment breakdown:")
            print(f"   Daily Rate: ₱{data.daily_rate}/day")
            print(f"   Duration: {data.duration_days} days")
            print(f"   Total Budget: ₱{total_budget}")
            print(f"   Escrow (100%): ₱{downpayment}")
            print(f"   Platform Fee (10%): ₱{platform_fee}")
            print(f"   Total to Charge: ₱{total_to_charge}")
            print(f"   Worker Receives: ₱{total_budget} (released daily as attendance confirmed)")
        else:
            # PROJECT payment model: 50% escrow + 5% platform fee
            if not data.budget:
                return Response(
                    {"error": "budget is required for PROJECT payment model"},
                    status=400
                )
            
            total_budget = Decimal(str(data.budget))
            downpayment = total_budget * Decimal('0.5')  # 50% escrow
            remaining_payment = total_budget * Decimal('0.5')  # 50% at completion
            platform_fee = total_budget * Decimal('0.05')  # 5% platform fee
            total_to_charge = downpayment + platform_fee
            
            print(f"💰 PROJECT Payment breakdown:")
            print(f"   Total Budget: ₱{total_budget}")
            print(f"   Downpayment (50%): ₱{downpayment}")
            print(f"   Platform Fee (5%): ₱{platform_fee}")
            print(f"   First Payment (downpayment + fee): ₱{total_to_charge}")
            print(f"   Remaining (50%): ₱{remaining_payment}")
            print(f"   Total Client Pays: ₱{total_budget + platform_fee}")
            print(f"   Worker Receives: ₱{total_budget} (full budget)")
        
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
            # Check if client has sufficient available balance for total amount (escrow + platform fee)
            # Available balance = balance - reservedBalance
            if wallet.availableBalance < total_to_charge:
                return Response(
                    {
                        "error": "Insufficient wallet balance",
                        "required": float(total_to_charge),
                        "available": float(wallet.availableBalance),
                        "reserved": float(wallet.reservedBalance),
                        "message": f"You need ₱{total_to_charge} (₱{downpayment} escrow + ₱{platform_fee} platform fee), but only have ₱{wallet.availableBalance} available."
                    },
                    status=400
                )
            
            # Use database transaction to ensure atomicity
            with db_transaction.atomic():
                # Determine job type: INVITE if worker or agency direct hire
                job_type = JobPosting.JobType.INVITE if (data.worker_id or data.agency_id) else JobPosting.JobType.LISTING
                
                # For LISTING jobs: Reserve funds (don't deduct yet)
                # For INVITE jobs: Deduct immediately (direct hire goes straight to work)
                if job_type == JobPosting.JobType.LISTING:
                    # Reserve funds instead of deducting
                    wallet.reservedBalance += total_to_charge
                    wallet.save()
                    escrow_paid = False
                    escrow_paid_at = None
                    transaction_status = Transaction.TransactionStatus.PENDING
                    print(f"🔒 Reserved ₱{total_to_charge} from wallet (₱{downpayment} escrow + ₱{platform_fee} fee). Available balance: ₱{wallet.availableBalance}")
                else:
                    # Direct hire - deduct immediately
                    wallet.balance -= total_to_charge
                    wallet.save()
                    escrow_paid = True
                    escrow_paid_at = timezone.now()
                    transaction_status = Transaction.TransactionStatus.COMPLETED
                    print(f"💸 Deducted ₱{total_to_charge} from wallet (₱{downpayment} escrow + ₱{platform_fee} fee). New balance: ₱{wallet.balance}")
                
                # Determine if this is a team job (agency with skill slots)
                is_team_job = bool(data.agency_id and data.skill_slots and len(data.skill_slots) > 0)
                
                # Support frontend field aliases: urgency_level → urgency
                urgency_value = (data.urgency_level or data.urgency or "MEDIUM").upper()
                
                # Create job posting
                job_posting = JobPosting.objects.create(
                    clientID=client_profile,
                    title=data.title,
                    description=data.description,
                    categoryID=category,
                    budget=float(total_budget),
                    escrowAmount=downpayment,
                    escrowPaid=escrow_paid,
                    escrowPaidAt=escrow_paid_at,
                    remainingPayment=remaining_payment,
                    location=data.location,
                    expectedDuration=data.expected_duration,
                    urgency=urgency_value,
                    preferredStartDate=preferred_start_date,
                    materialsNeeded=data.materials_needed if data.materials_needed else [],
                    jobType=job_type,
                    inviteStatus=JobPosting.InviteStatus.PENDING if job_type == JobPosting.JobType.INVITE else None,
                    assignedWorkerID=worker_profile if data.worker_id else None,
                    assignedAgencyFK=assigned_agency if data.agency_id else None,
                    status=JobPosting.JobStatus.ACTIVE,
                    is_team_job=is_team_job,
                    payment_model=payment_model,
                    daily_rate_agreed=float(data.daily_rate) if payment_model == "DAILY" and data.daily_rate else None,
                    duration_days=data.duration_days if payment_model == "DAILY" else None
                )
                
                print(f"📋 Job created as {job_type} (worker_id: {data.worker_id or 'None'}, is_team_job: {is_team_job})")
                
                # If DAILY payment model, set up daily payment schedule and attendance tracking
                if payment_model == "DAILY":
                    from jobs.daily_payment_service import DailyPaymentService
                    num_workers = 1  # Default to 1 worker for single hire
                    if is_team_job and data.skill_slots:
                        num_workers = sum(slot.workers_needed for slot in data.skill_slots)
                    
                    DailyPaymentService.setup_daily_job(
                        job=job_posting,
                        daily_rate=Decimal(str(data.daily_rate)),
                        num_workers=num_workers,
                        duration_days=data.duration_days
                    )
                    print(f"✅ Daily payment schedule created: {num_workers} worker(s) × ₱{data.daily_rate}/day × {data.duration_days} days")
                
                # Create skill slots for team jobs
                if is_team_job and data.skill_slots:
                    total_workers = sum(slot.workers_needed for slot in data.skill_slots)
                    num_slots = len(data.skill_slots)
                    budget_per_slot = total_budget / Decimal(str(num_slots)) if num_slots > 0 else Decimal('0')
                    
                    print(f"👷 Creating {num_slots} skill slots for {total_workers} total workers")
                    
                    for slot_data in data.skill_slots:
                        try:
                            slot_specialization = Specializations.objects.get(
                                specializationID=slot_data.specialization_id
                            )
                            JobSkillSlot.objects.create(
                                jobID=job_posting,
                                specializationID=slot_specialization,
                                workers_needed=slot_data.workers_needed,
                                budget_allocated=budget_per_slot,
                                skill_level_required=slot_data.skill_level_required.upper() if slot_data.skill_level_required else 'ENTRY',
                                notes=slot_data.notes or '',
                                status='OPEN'
                            )
                            print(f"   ✅ Created slot: {slot_specialization.specializationName} x{slot_data.workers_needed}")
                        except Specializations.DoesNotExist:
                            print(f"   ⚠️ Specialization {slot_data.specialization_id} not found, skipping slot")
                
                # If worker_id provided (direct hire), auto-create application and accept it
                if data.worker_id:
                    job_application = JobApplication.objects.create(
                        jobID=job_posting,
                        workerID=worker_profile,
                        proposalMessage=f"Direct hire by client",
                        proposedBudget=float(total_budget),
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
                
                # Create transaction for escrow payment
                escrow_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    amount=downpayment,
                    balanceAfter=wallet.balance,
                    status=transaction_status,
                    description=f"Escrow payment (50% downpayment) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    completedAt=escrow_paid_at,
                    referenceNumber=f"ESCROW-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                # Create platform fee transaction record (for revenue tracking)
                fee_transaction = Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.FEE,
                    amount=platform_fee,
                    balanceAfter=wallet.balance,
                    status=transaction_status,
                    description=f"Platform fee (10% of budget) for job: {job_posting.title}",
                    relatedJobPosting=job_posting,
                    completedAt=escrow_paid_at,
                    referenceNumber=f"FEE-{job_posting.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                print(f"✅ Job posting created: ID={job_posting.jobID}, Title='{job_posting.title}'")
                print(f"✅ Escrow transaction {'completed' if escrow_paid else 'reserved'}: ID={escrow_transaction.transactionID}")
                print(f"💰 Platform fee transaction {'completed' if escrow_paid else 'reserved'}: ID={fee_transaction.transactionID}, Amount=₱{platform_fee}")

                # Create notification for client
                from accounts.models import Notification
                
                # Different message for INVITE (direct hire) vs LISTING (public post)
                if data.worker_id:
                    notification_title = "Worker Requested"
                    worker_name = f"{worker_profile.profileID.firstName} {worker_profile.profileID.lastName}"
                    notification_message = f"You've hired {worker_name} for '{job_posting.title}'. Escrow payment of ₱{downpayment} has been deducted from your wallet."
                    notification_type = "ESCROW_PAID"
                elif data.agency_id and assigned_agency:
                    notification_title = "Agency Requested"
                    notification_message = f"You've invited {assigned_agency.businessName} for '{job_posting.title}'. Escrow payment of ₱{downpayment} has been deducted from your wallet."
                    notification_type = "ESCROW_PAID"
                else:
                    # LISTING job - funds are reserved, not deducted
                    notification_title = "Job Posted Successfully"
                    notification_message = f"Your job '{job_posting.title}' is now live! ₱{total_to_charge} has been reserved from your wallet (will be charged when a worker is accepted)."
                    notification_type = "JOB_POSTED"
                
                Notification.objects.create(
                    accountFK=client_profile.profileID.accountFK,
                    notificationType=notification_type,
                    title=notification_title,
                    message=notification_message,
                    relatedJobID=job_posting.jobID
                )
                print(f"📬 Notification sent to client {client_profile.profileID.accountFK.email}")

            # Return different response based on job type
            if job_type == JobPosting.JobType.LISTING:
                return {
                    "success": True,
                    "requires_payment": False,
                    "payment_method": "WALLET",
                    "job_posting_id": job_posting.jobID,
                    "escrow_amount": float(downpayment),
                    "commission_fee": float(platform_fee),
                    "platform_fee": float(platform_fee),
                    "downpayment_amount": float(total_to_charge),
                    "total_amount": float(total_to_charge),
                    "remaining_payment": float(remaining_payment),
                    "reserved_amount": float(total_to_charge),
                    "available_balance": float(wallet.availableBalance),
                    "new_wallet_balance": float(wallet.balance),
                    "message": f"Job created successfully! ₱{total_to_charge} reserved from your wallet (will be charged when a worker is accepted)."
                }
            else:
                return {
                    "success": True,
                    "requires_payment": False,
                    "payment_method": "WALLET",
                    "job_posting_id": job_posting.jobID,
                    "escrow_amount": float(downpayment),
                    "commission_fee": float(platform_fee),
                    "platform_fee": float(platform_fee),
                    "downpayment_amount": float(total_to_charge),
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
                
                # Support frontend field aliases
                urgency_value = (data.urgency_level or data.urgency or "MEDIUM").upper()
                
                # Create job posting first (with escrowPaid=False)
                job_posting = JobPosting.objects.create(
                    clientID=client_profile,
                    title=data.title,
                    description=data.description,
                    categoryID=category,
                    budget=float(total_budget),
                    escrowAmount=downpayment,
                    escrowPaid=False,
                    remainingPayment=remaining_payment,
                    location=data.location,
                    expectedDuration=data.expected_duration,
                    urgency=urgency_value,
                    preferredStartDate=preferred_start_date,
                    materialsNeeded=data.materials_needed if data.materials_needed else [],
                    jobType=job_type,
                    inviteStatus=JobPosting.InviteStatus.PENDING if job_type == JobPosting.JobType.INVITE else None,
                    assignedAgencyFK=assigned_agency if data.agency_id else None,
                    status=JobPosting.JobStatus.ACTIVE,
                    payment_model=payment_model,
                    daily_rate_agreed=float(data.daily_rate) if payment_model == "DAILY" and data.daily_rate else None,
                    duration_days=data.duration_days if payment_model == "DAILY" else None
                )
                
                print(f"📋 Job created as {job_type} (worker_id: {data.worker_id or 'None'})")
                
                # If DAILY payment model, set up daily payment schedule and attendance tracking
                if payment_model == "DAILY":
                    from jobs.daily_payment_service import DailyPaymentService
                    num_workers = 1  # Default to 1 worker for single hire (agencies not supported via GCASH yet)
                    
                    DailyPaymentService.setup_daily_job(
                        job=job_posting,
                        daily_rate=Decimal(str(data.daily_rate)),
                        num_workers=num_workers,
                        duration_days=data.duration_days
                    )
                    print(f"✅ Daily payment schedule created: {num_workers} worker(s) × ₱{data.daily_rate}/day × {data.duration_days} days")
                
                # If worker_id provided, auto-create application (but don't accept until payment)
                if data.worker_id:
                    worker_profile = WorkerProfile.objects.select_related('profileID').get(profileID__profileID=data.worker_id)
                    job_application = JobApplication.objects.create(
                        jobID=job_posting,
                        workerID=worker_profile,
                        proposalMessage=f"Direct hire by client (pending payment)",
                        proposedBudget=float(total_budget),
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
            
            # Get user profile for payment invoice
            profile = get_user_profile(request)
            if profile:
                user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or request.auth.email
            else:
                user_name = request.auth.email
            
            # Create payment invoice for escrow (including platform fee) using configured provider
            payment_provider = get_payment_provider()
            provider_name = payment_provider.provider_name
            print(f"💳 Creating {provider_name.upper()} invoice for escrow payment...")
            
            payment_result = payment_provider.create_gcash_payment(
                amount=float(total_to_charge),  # Include 5% platform fee
                user_email=request.auth.email,
                user_name=user_name,
                transaction_id=escrow_transaction.transactionID
            )
            
            if not payment_result.get("success"):
                # If payment provider fails, delete the job and transaction
                job_posting.delete()
                escrow_transaction.delete()
                return Response(
                    {"error": "Failed to create payment invoice", "details": payment_result.get("error")},
                    status=500
                )
            
            # Update transaction with payment provider details
            escrow_transaction.xenditInvoiceID = payment_result.get('checkout_id') or payment_result.get('invoice_id')
            escrow_transaction.xenditExternalID = payment_result.get('external_id')
            escrow_transaction.invoiceURL = payment_result.get('checkout_url') or payment_result.get('invoice_url')
            escrow_transaction.xenditPaymentChannel = "GCASH"
            escrow_transaction.xenditPaymentMethod = provider_name.upper()
            escrow_transaction.save()
            
            print(f"📄 {provider_name.upper()} invoice created: {escrow_transaction.xenditInvoiceID}")
            print(f"🔗 Payment URL: {escrow_transaction.invoiceURL}")
            
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
                "invoice_url": escrow_transaction.invoiceURL,
                "invoice_id": escrow_transaction.xenditInvoiceID,
                "transaction_id": escrow_transaction.transactionID,
                "provider": provider_name,
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
        
        # Get all ACTIVE job postings (exclude INVITE jobs with PENDING status)
        # LISTING jobs: inviteStatus is null, show if ACTIVE
        # INVITE jobs: only show if ACCEPTED (not PENDING or REJECTED)
        from django.db.models import Q
        
        job_postings = JobPosting.objects.filter(
            Q(status=JobPosting.JobStatus.ACTIVE) &
            (
                Q(jobType='LISTING') |  # LISTING jobs (open to all workers)
                Q(jobType='INVITE', inviteStatus='ACCEPTED')  # INVITE jobs only if accepted
            )
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


# NOTE: This route MUST be defined BEFORE /{job_id} to avoid route matching conflict!
# Otherwise "my-backjobs" gets parsed as a job_id integer and fails.
@router.get("/my-backjobs", auth=dual_auth)
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
                "job_category": job.categoryID.specializationName if job.categoryID else None,
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
        
        # Get client's wallet
        wallet = Wallet.objects.get(accountFK=request.auth)
        
        # Handle refund/release based on escrowPaid status
        refund_amount = Decimal('0.00')
        released_amount = Decimal('0.00')
        
        # Use database transaction for atomicity
        with db_transaction.atomic():
            if job.escrowPaid and job.escrowAmount > 0:
                # Escrow was actually deducted (direct hire) - refund to balance
                print(f"💰 Refunding escrow amount: ₱{job.escrowAmount}")
                
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
            
            elif not job.escrowPaid:
                # Escrow was reserved but not deducted (LISTING job) - release from reservedBalance
                # Calculate the total reserved (escrow + platform fee)
                escrow_amount = job.escrowAmount
                platform_fee = Decimal(str(job.budget)) * Decimal('0.10')
                total_reserved = escrow_amount + platform_fee
                
                print(f"🔓 Releasing reserved funds: ₱{total_reserved}")
                
                # Release from reserved balance
                wallet.reservedBalance -= total_reserved
                if wallet.reservedBalance < 0:
                    wallet.reservedBalance = Decimal('0.00')  # Safety check
                wallet.save()
                
                released_amount = total_reserved
                
                # Cancel the pending transactions
                Transaction.objects.filter(
                    relatedJobPosting=job,
                    status=Transaction.TransactionStatus.PENDING
                ).update(status=Transaction.TransactionStatus.CANCELLED)
                
                print(f"✅ Released ₱{total_reserved} from reserved balance")
                print(f"💳 Available balance now: ₱{wallet.availableBalance}")
            
            # Update status to CANCELLED
            job.status = JobPosting.JobStatus.CANCELLED
            job.save()
        
        print(f"✅ Job {job_id} cancelled successfully")
        
        return {
            "success": True,
            "message": "Job posting cancelled successfully",
            "job_id": job_id,
            "refund_amount": float(refund_amount),
            "released_amount": float(released_amount),
            "refunded": refund_amount > 0,
            "released": released_amount > 0,
            "available_balance": float(wallet.availableBalance)
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
        
        # CRITICAL: Prevent workers from applying if they have an active job
        # Check both regular jobs (assignedWorkerID) and team jobs (JobWorkerAssignment)
        from accounts.models import JobWorkerAssignment
        
        # Check for active regular job
        active_regular_job = JobPosting.objects.filter(
            assignedWorkerID=worker_profile,
            status=JobPosting.JobStatus.IN_PROGRESS
        ).first()
        
        if active_regular_job:
            return Response(
                {
                    "error": f"You already have an active job: '{active_regular_job.title}'. Complete it before applying to new jobs.",
                    "active_job_id": active_regular_job.jobID,
                    "active_job_title": active_regular_job.title
                },
                status=400
            )
        
        # Check for active team job assignment
        active_team_assignment = JobWorkerAssignment.objects.filter(
            workerID=worker_profile,
            assignment_status='ACTIVE'
        ).select_related('jobID').first()
        
        if active_team_assignment:
            return Response(
                {
                    "error": f"You are currently assigned to a team job: '{active_team_assignment.jobID.title}'. Complete it before applying to new jobs.",
                    "active_job_id": active_team_assignment.jobID.jobID,
                    "active_job_title": active_team_assignment.jobID.title
                },
                status=400
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
        
        # CRITICAL: Prevent accepting application if worker already has an active job
        # This prevents race condition where worker applies to multiple jobs
        from accounts.models import JobWorkerAssignment
        
        worker = application.workerID
        
        # Check for active regular job
        active_regular_job = JobPosting.objects.filter(
            assignedWorkerID=worker,
            status=JobPosting.JobStatus.IN_PROGRESS
        ).first()
        
        if active_regular_job:
            worker_name = f"{worker.profileID.firstName} {worker.profileID.lastName}"
            return Response(
                {
                    "error": f"{worker_name} is already assigned to another job: '{active_regular_job.title}'. They must complete it before starting a new job.",
                    "worker_active_job_id": active_regular_job.jobID,
                    "worker_active_job_title": active_regular_job.title
                },
                status=400
            )
        
        # Check for active team job assignment
        active_team_assignment = JobWorkerAssignment.objects.filter(
            workerID=worker,
            assignment_status='ACTIVE'
        ).select_related('jobID').first()
        
        if active_team_assignment:
            worker_name = f"{worker.profileID.firstName} {worker.profileID.lastName}"
            return Response(
                {
                    "error": f"{worker_name} is already assigned to a team job: '{active_team_assignment.jobID.title}'. They must complete it before starting a new job.",
                    "worker_active_job_id": active_team_assignment.jobID.jobID,
                    "worker_active_job_title": active_team_assignment.jobID.title
                },
                status=400
            )
        
        # Use database transaction for atomicity
        with db_transaction.atomic():
            # Update application status
            application.status = JobApplication.ApplicationStatus.ACCEPTED
            application.save()
            
            # Update job status to IN_PROGRESS and assign the worker
            job.status = JobPosting.JobStatus.IN_PROGRESS
            job.assignedWorkerID = application.workerID  # Assign the worker to the job
            
            # If worker negotiated a different budget and it was accepted, update the job budget
            original_budget = job.budget
            if application.budgetOption == JobApplication.BudgetOption.NEGOTIATE:
                print(f"💰 Updating job budget from ₱{job.budget} to negotiated price ₱{application.proposedBudget}")
                job.budget = application.proposedBudget
                
                # Recalculate escrow and fees based on new budget
                job.escrowAmount = Decimal(str(job.budget)) * Decimal('0.5')
                job.remainingPayment = Decimal(str(job.budget)) * Decimal('0.5')
            
            # Process payment: Convert reservation to actual deduction (for LISTING jobs)
            # LISTING jobs have escrowPaid=False and funds are reserved
            if not job.escrowPaid:
                # Get client's wallet
                wallet = Wallet.objects.get(accountFK=request.auth)
                
                # Calculate the total to charge (50% escrow + 10% platform fee)
                escrow_amount = job.escrowAmount
                platform_fee = Decimal(str(job.budget)) * Decimal('0.10')
                total_to_charge = escrow_amount + platform_fee
                
                # Calculate original reserved amount (based on original budget before negotiation)
                original_escrow = Decimal(str(original_budget)) * Decimal('0.5')
                original_fee = Decimal(str(original_budget)) * Decimal('0.10')
                original_reserved = original_escrow + original_fee
                
                print(f"💳 Processing payment for accepted application:")
                print(f"   Original budget: ₱{original_budget}, reserved: ₱{original_reserved}")
                print(f"   Final budget: ₱{job.budget}, to charge: ₱{total_to_charge}")
                
                # Release the original reservation
                wallet.reservedBalance -= original_reserved
                
                # If negotiated price is different, check if we have enough balance
                if total_to_charge > original_reserved:
                    additional_needed = total_to_charge - original_reserved
                    if wallet.balance - wallet.reservedBalance < additional_needed:
                        # Restore the reservation and abort
                        wallet.reservedBalance += original_reserved
                        return Response(
                            {
                                "error": "Insufficient balance for negotiated price",
                                "required": float(total_to_charge),
                                "available": float(wallet.balance - wallet.reservedBalance),
                                "message": f"The negotiated price requires ₱{total_to_charge} but you only have ₱{wallet.balance - wallet.reservedBalance} available."
                            },
                            status=400
                        )
                
                # Deduct the actual amount from balance
                wallet.balance -= total_to_charge
                wallet.save()
                
                print(f"💸 Deducted ₱{total_to_charge} from wallet. New balance: ₱{wallet.balance}")
                
                # Update job escrow status
                job.escrowPaid = True
                job.escrowPaidAt = timezone.now()
                
                # Update pending transactions to completed
                from accounts.models import Transaction
                pending_escrow = Transaction.objects.filter(
                    relatedJobPosting=job,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    status=Transaction.TransactionStatus.PENDING
                ).first()
                
                if pending_escrow:
                    pending_escrow.status = Transaction.TransactionStatus.COMPLETED
                    pending_escrow.completedAt = timezone.now()
                    pending_escrow.amount = escrow_amount  # Update if negotiated
                    pending_escrow.balanceAfter = wallet.balance
                    pending_escrow.save()
                    print(f"✅ Updated escrow transaction {pending_escrow.transactionID} to COMPLETED")
                
                pending_fee = Transaction.objects.filter(
                    relatedJobPosting=job,
                    transactionType=Transaction.TransactionType.FEE,
                    status=Transaction.TransactionStatus.PENDING
                ).first()
                
                if pending_fee:
                    pending_fee.status = Transaction.TransactionStatus.COMPLETED
                    pending_fee.completedAt = timezone.now()
                    pending_fee.amount = platform_fee  # Update if negotiated
                    pending_fee.balanceAfter = wallet.balance
                    pending_fee.save()
                    print(f"✅ Updated fee transaction {pending_fee.transactionID} to COMPLETED")
                
                # Create escrow payment notification
                from accounts.models import Notification
                Notification.objects.create(
                    accountFK=request.auth,
                    notificationType="ESCROW_PAID",
                    title=f"Payment Processed",
                    message=f"₱{total_to_charge} has been deducted from your wallet for '{job.title}' (₱{escrow_amount} escrow + ₱{platform_fee} platform fee).",
                    relatedJobID=job.jobID
                )
            
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
        
        # Only reject other applications for non-team (single-worker) jobs
        # Team jobs use separate team job acceptance endpoint and should not auto-reject
        if not job.is_team_job:
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


@router.post("/{job_id}/upload-completion-photo", auth=dual_auth)
def upload_completion_photo(request, job_id: int, image: UploadedFile = File(...)):  # type: ignore[misc]
    """
    Upload completion photo for a job (Worker or Agency action).
    
    This endpoint allows workers and agencies to upload photos documenting 
    completed work before or after marking the job as complete.
    
    Path structure: users/user_{userID}/job_{jobID}/completion_filename.ext
    
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
        
        # Validate job exists
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
        
        # Verify authorization - worker or agency owner
        is_authorized = False
        uploader_name = "Unknown"
        
        # Check if this is an agency job
        if job.assignedEmployeeID is not None:
            # Agency job - verify requesting user is the agency owner
            agency_owner_account = job.assignedEmployeeID.agency
            if agency_owner_account.accountID == request.auth.accountID:
                is_authorized = True
                uploader_name = f"Agency ({job.assignedEmployeeID.name})"
        
        # Check if user is the assigned worker
        if not is_authorized and job.assignedWorkerID:
            profile_type = getattr(request.auth, 'profile_type', 'WORKER')
            try:
                profile = Profile.objects.filter(
                    accountFK=request.auth,
                    profileType=profile_type
                ).first() or Profile.objects.filter(
                    accountFK=request.auth, 
                    profileType='WORKER'
                ).first()
                
                if profile:
                    try:
                        worker_profile = WorkerProfile.objects.get(profileID=profile)
                        if job.assignedWorkerID.profileID.profileID == worker_profile.profileID.profileID:
                            is_authorized = True
                            uploader_name = f"{profile.firstName} {profile.lastName}"
                    except WorkerProfile.DoesNotExist:
                        pass
            except Exception:
                pass
        
        if not is_authorized:
            return Response(
                {"error": "You are not authorized to upload photos for this job"},
                status=403
            )
        
        # Verify job is in appropriate state
        if job.status not in ["IN_PROGRESS", "ACTIVE"]:
            return Response(
                {"error": f"Cannot upload photos. Job status must be IN_PROGRESS or ACTIVE. Current: {job.status}"},
                status=400
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
        
        # Generate filename
        import os
        from datetime import datetime
        file_extension = os.path.splitext(image.name)[1] or '.jpg'
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        completion_filename = f"completion_{timestamp}{file_extension}"
        
        print(f"📸 Uploading completion photo: {image.name} ({image.size} bytes)")
        print(f"   Uploader: {uploader_name}, Job ID: {job_id}")
        
        # Upload to Supabase - use job client's user ID for path consistency
        client_user_id = job.clientID.profileID.accountFK.accountID
        image_url = upload_file(
            file=image,
            bucket="users",
            path=f"user_{client_user_id}/job_{job_id}/completion",
            public=True,
            custom_name=completion_filename
        )
        
        if not image_url:
            print(f"❌ upload_file returned None")
            return Response(
                {"error": "Failed to upload image to storage"},
                status=500
            )
        
        # Create JobPhoto record with completion flag
        job_photo = JobPhoto.objects.create(
            jobID=job,
            photoURL=image_url,
            fileName=completion_filename
        )
        
        print(f"✅ Completion photo uploaded successfully for job {job_id} by {uploader_name}")
        print(f"   Image URL: {image_url}")
        
        return {
            "success": True,
            "message": "Completion photo uploaded successfully",
            "image_url": image_url,
            "photo_id": job_photo.photoID
        }
        
    except Exception as e:
        print(f"❌ Exception in completion photo upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to upload completion photo: {str(e)}"},
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
        
        # ==========================================================================
        # CRITICAL: Pre-validate wallet balance BEFORE marking job as complete
        # This prevents the bug where job is marked COMPLETED but payment fails
        # ==========================================================================
        if payment_method_upper == 'WALLET':
            from accounts.models import Wallet
            
            # Get client profile first to check wallet
            profile_type_check = getattr(request.auth, 'profile_type', 'CLIENT')
            profile_check = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type_check
            ).first() or Profile.objects.filter(accountFK=request.auth, profileType='CLIENT').first()
            
            if profile_check:
                # Get or create wallet for client
                wallet_check, _ = Wallet.objects.get_or_create(
                    accountFK=request.auth,
                    defaults={'balance': 0}
                )
                
                # Get the job to check remaining payment
                try:
                    job_check = JobPosting.objects.get(jobID=job_id)
                    remaining_amount = job_check.remainingPayment
                    
                    # Check if client has sufficient balance BEFORE proceeding
                    if wallet_check.balance < remaining_amount:
                        print(f"❌ Wallet balance check FAILED: Need ₱{remaining_amount}, have ₱{wallet_check.balance}")
                        return Response({
                            "error": "Insufficient wallet balance",
                            "required": float(remaining_amount),
                            "available": float(wallet_check.balance),
                            "message": f"You need ₱{remaining_amount:,.2f} but only have ₱{wallet_check.balance:,.2f}. Please deposit more funds or choose CASH payment."
                        }, status=400)
                    
                    print(f"✅ Wallet balance check PASSED: Need ₱{remaining_amount}, have ₱{wallet_check.balance}")
                except JobPosting.DoesNotExist:
                    pass  # Will be caught later in the flow
        
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
        # NOTE: Payment now goes to pendingEarnings (7-day buffer) instead of immediate wallet credit
        try:
            from accounts.models import Wallet
            from jobs.payment_buffer_service import add_pending_earnings, get_payment_buffer_days
            
            remaining_amount = job.remainingPayment
            buffer_days = get_payment_buffer_days()
            
            # Handle WALLET payment (instant deduction from client, but pending for worker)
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
                
                # ============================================================
                # PAYMENT BUFFER: Add to pendingEarnings instead of immediate credit
                # Worker receives payment after 7-day buffer (configurable)
                # ============================================================
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
                
                pending_result = None
                if recipient_account:
                    # Add to pending earnings (Due Balance) - NOT immediate wallet credit
                    recipient_payment = job.budget
                    pending_result = add_pending_earnings(
                        job=job,
                        recipient_account=recipient_account,
                        amount=recipient_payment,
                        recipient_type=recipient_type
                    )
                    
                    print(f"⏳ Added ₱{recipient_payment} to {recipient_type} pendingEarnings. Release date: {pending_result['release_date_str']}")
                
                # Mark payment as completed (client has paid, worker payment is pending)
                job.remainingPaymentPaid = True
                job.remainingPaymentPaidAt = timezone.now()
                job.status = "COMPLETED"
                job.save()

                print(f"✅ Job {job_id} marked as COMPLETED via WALLET payment (worker payment pending {buffer_days} days)")

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
                    "message": f"Payment successful! Job completed. Worker payment is pending for {buffer_days} days. Please leave a review.",
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
                    "new_wallet_balance": float(wallet.balance),
                    # Payment buffer info
                    "payment_buffer_days": buffer_days,
                    "worker_payment_pending": True,
                    "worker_payment_release_date": pending_result['release_date'].isoformat() if pending_result else None,
                    "worker_payment_release_date_formatted": pending_result['release_date_str'] if pending_result else None
                }
            
            # Handle CASH payment (manual with proof upload)
            if payment_method_upper == 'CASH':
                print(f"💵 Cash payment selected - proof uploaded to {cash_proof_url}")
                
                # For CASH: Worker/Agency receives physical cash from client (remaining 50%)
                # The downpayment (50%) was already held in escrow during job creation
                # Downpayment goes to pendingEarnings (7-day buffer), cash portion is logged
                # Recipient receives full budget: 50% pending (from escrow) + 50% physical cash = 100%
                
                from jobs.payment_buffer_service import add_pending_earnings, get_payment_buffer_days
                buffer_days = get_payment_buffer_days()
                
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
                
                cash_pending_result = None
                if cash_recipient_account:
                    recipient_wallet, _ = Wallet.objects.get_or_create(
                        accountFK=cash_recipient_account,
                        defaults={'balance': Decimal('0.00'), 'pendingEarnings': Decimal('0.00')}
                    )
                    
                    # Downpayment (50% escrow) goes to pendingEarnings with buffer
                    downpayment = job.budget * Decimal('0.5')
                    cash_pending_result = add_pending_earnings(
                        job=job,
                        recipient_account=cash_recipient_account,
                        amount=downpayment,
                        recipient_type=cash_recipient_type
                    )
                    
                    print(f"⏳ Added ₱{downpayment} (50% escrow) to {cash_recipient_type} pendingEarnings. Release: {cash_pending_result['release_date_str']}")
                    print(f"💵 {cash_recipient_type.capitalize()} received ₱{remaining_amount} (50% remaining) in physical cash from client")
                    print(f"✅ {cash_recipient_type.capitalize()} total: ₱{downpayment} (pending) + ₱{remaining_amount} (cash) = ₱{job.budget}")
                    
                    # Create CASH payment log (does NOT affect wallet balance - for audit trail only)
                    Transaction.objects.create(
                        walletID=recipient_wallet,
                        transactionType="EARNING",
                        amount=remaining_amount,
                        balanceAfter=recipient_wallet.balance,  # Balance unchanged - this is just a log
                        status="COMPLETED",
                        description=f"Cash payment received for job: {job.title} (physical cash - not wallet deposit)" + (f" (Agency: {job.assignedAgencyFK.businessName})" if cash_recipient_type == "agency" else ""),
                        referenceNumber=f"JOB-{job.jobID}-CASH-PAYMENT-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                        relatedJobPosting=job
                    )
                    print(f"📝 Cash payment transaction logged: ₱{remaining_amount} received in physical cash")
                
                # Mark job as completed
                job.remainingPaymentPaid = True
                job.remainingPaymentPaidAt = timezone.now()
                job.status = "COMPLETED"
                job.save()
                
                print(f"✅ Job {job_id} marked as COMPLETED via CASH payment (escrow pending {buffer_days} days)")
                
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
                    "message": f"Job completion approved! Cash payment confirmed. Escrow payment pending for {buffer_days} days. Please leave a review.",
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
                    "recipient_type": cash_recipient_type if cash_recipient_account else None,
                    # Payment buffer info
                    "payment_buffer_days": buffer_days,
                    "worker_payment_pending": True,
                    "worker_payment_release_date": cash_pending_result['release_date'].isoformat() if cash_pending_result else None,
                    "worker_payment_release_date_formatted": cash_pending_result['release_date_str'] if cash_pending_result else None
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
        
        # For team jobs, check if worker is part of the team via JobWorkerAssignment
        is_team_worker = False
        if job.is_team_job and profile is not None:
            from accounts.models import JobWorkerAssignment
            is_team_worker = JobWorkerAssignment.objects.filter(
                jobID=job,
                workerID__profileID=profile,
                assignment_status__in=['ACTIVE', 'COMPLETED']
            ).exists()
        
        if not (is_client or is_worker or is_agency_owner or is_team_worker):
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
        
        # Validate ratings (multi-criteria: 1-5 stars each)
        for rating_field in ['rating_quality', 'rating_communication', 'rating_punctuality', 'rating_professionalism']:
            rating_value = getattr(data, rating_field, None)
            if rating_value is None or rating_value < 1 or rating_value > 5:
                return Response(
                    {"error": f"{rating_field.replace('_', ' ').title()} must be between 1 and 5 stars"},
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
                # Calculate overall rating as average of criteria
                overall_rating = Decimal(str((data.rating_quality + data.rating_communication + data.rating_punctuality + data.rating_professionalism) / 4))
                review = JobReview.objects.create(
                    jobID=job,
                    reviewerID=request.auth,
                    revieweeID=None,  # No Accounts for employee
                    revieweeEmployeeID=employee,
                    reviewerType="CLIENT",
                    rating=overall_rating,
                    rating_quality=Decimal(str(data.rating_quality)),
                    rating_communication=Decimal(str(data.rating_communication)),
                    rating_punctuality=Decimal(str(data.rating_punctuality)),
                    rating_professionalism=Decimal(str(data.rating_professionalism)),
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
                # Calculate overall rating as average of criteria
                overall_rating = Decimal(str((data.rating_quality + data.rating_communication + data.rating_punctuality + data.rating_professionalism) / 4))
                review = JobReview.objects.create(
                    jobID=job,
                    reviewerID=request.auth,
                    revieweeID=None,
                    revieweeAgencyID=agency,
                    reviewerType="CLIENT",
                    rating=overall_rating,
                    rating_quality=Decimal(str(data.rating_quality)),
                    rating_communication=Decimal(str(data.rating_communication)),
                    rating_punctuality=Decimal(str(data.rating_punctuality)),
                    rating_professionalism=Decimal(str(data.rating_professionalism)),
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
            # Calculate overall rating as average of criteria
            overall_rating = Decimal(str((data.rating_quality + data.rating_communication + data.rating_punctuality + data.rating_professionalism) / 4))
            review = JobReview.objects.create(
                jobID=job,
                reviewerID=request.auth,
                revieweeID=reviewee_profile.accountFK,
                reviewerType=reviewer_type,
                rating=overall_rating,
                rating_quality=Decimal(str(data.rating_quality)),
                rating_communication=Decimal(str(data.rating_communication)),
                rating_punctuality=Decimal(str(data.rating_punctuality)),
                rating_professionalism=Decimal(str(data.rating_professionalism)),
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
        # This also handles team jobs now
        else:
            reviewer_profile = profile
            if is_client:
                # Team job client review - must specify which worker to review
                if job.is_team_job:
                    from accounts.models import JobWorkerAssignment
                    
                    if not data.worker_id:
                        # Get list of workers that can be reviewed
                        assignments = JobWorkerAssignment.objects.filter(
                            jobID=job,
                            assignment_status__in=['ACTIVE', 'COMPLETED']
                        ).select_related('workerID__profileID')
                        
                        # Check which workers haven't been reviewed yet
                        reviewed_worker_ids = JobReview.objects.filter(
                            jobID=job,
                            reviewerID=request.auth,
                            reviewerType="CLIENT"
                        ).values_list('revieweeID', flat=True)
                        
                        pending_workers = []
                        for assignment in assignments:
                            worker_account = assignment.workerID.profileID.accountFK
                            if worker_account.id not in reviewed_worker_ids:
                                pending_workers.append({
                                    "worker_id": assignment.workerID.workerID,
                                    "name": f"{assignment.workerID.profileID.firstName} {assignment.workerID.profileID.lastName}"
                                })
                        
                        return Response(
                            {
                                "error": "Team job requires worker_id to specify which worker to review",
                                "pending_worker_reviews": pending_workers
                            },
                            status=400
                        )
                    
                    # Find the assignment for the specified worker
                    try:
                        assignment = JobWorkerAssignment.objects.select_related(
                            'workerID__profileID__accountFK'
                        ).get(
                            jobID=job,
                            workerID_id=data.worker_id,
                            assignment_status__in=['ACTIVE', 'COMPLETED']
                        )
                        reviewee_profile = assignment.workerID.profileID
                    except JobWorkerAssignment.DoesNotExist:
                        return Response(
                            {"error": f"Worker {data.worker_id} is not assigned to this team job"},
                            status=400
                        )
                    
                    reviewer_type = "CLIENT"
                else:
                    # Regular (non-team) job
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
            
            # Check if review already exists for this specific reviewee
            # For team jobs, clients can review multiple workers, so we must check revieweeID
            existing_review = JobReview.objects.filter(
                jobID=job,
                reviewerID=request.auth,
                revieweeID=reviewee_profile.accountFK
            ).first()
            
            if existing_review:
                return Response(
                    {"error": "You have already submitted a review for this person on this job"},
                    status=400
                )
            
            # Create the review
            # Calculate overall rating as average of criteria
            overall_rating = Decimal(str((data.rating_quality + data.rating_communication + data.rating_punctuality + data.rating_professionalism) / 4))
            review = JobReview.objects.create(
                jobID=job,
                reviewerID=request.auth,
                revieweeID=reviewee_profile.accountFK,
                reviewerType=reviewer_type,
                rating=overall_rating,
                rating_quality=Decimal(str(data.rating_quality)),
                rating_communication=Decimal(str(data.rating_communication)),
                rating_punctuality=Decimal(str(data.rating_punctuality)),
                rating_professionalism=Decimal(str(data.rating_professionalism)),
                comment=data.message or "",
                status="ACTIVE"
            )
            
            print(f"✅ Review submitted successfully for job {job_id}")
            print(f"   Reviewer: {reviewer_profile.firstName} ({reviewer_type})")
            print(f"   Rating: {overall_rating} stars (Q:{data.rating_quality} C:{data.rating_communication} P:{data.rating_punctuality} PR:{data.rating_professionalism})")
            
            # For team jobs: update assignment's individual_rating
            if job.is_team_job and is_client and data.worker_id:
                from accounts.models import JobWorkerAssignment
                try:
                    assignment = JobWorkerAssignment.objects.get(
                        jobID=job,
                        workerID_id=data.worker_id
                    )
                    assignment.individual_rating = overall_rating
                    assignment.save(update_fields=['individual_rating'])
                    print(f"   ✅ Updated assignment #{assignment.assignmentID} individual_rating to {overall_rating}")
                except JobWorkerAssignment.DoesNotExist:
                    print(f"   ⚠️ Could not update assignment rating - assignment not found")
            
            # For team jobs: check pending workers and return info
            pending_team_workers = []
            all_team_workers_reviewed = False
            reviewed_worker_name = None
            
            if job.is_team_job and is_client:
                from accounts.models import JobWorkerAssignment
                # Get all assignments
                all_assignments = JobWorkerAssignment.objects.filter(
                    jobID=job,
                    assignment_status__in=['ACTIVE', 'COMPLETED']
                ).select_related('workerID__profileID__accountFK', 'skillSlotID__specializationID')
                
                # Get reviewed worker IDs
                reviewed_worker_account_ids = set(JobReview.objects.filter(
                    jobID=job,
                    reviewerID=request.auth,
                    reviewerType="CLIENT"
                ).values_list('revieweeID', flat=True))
                
                for a in all_assignments:
                    worker_profile = a.workerID.profileID
                    worker_account_id = worker_profile.accountFK.accountID
                    worker_name = f"{worker_profile.firstName} {worker_profile.lastName}"
                    
                    # Track the name of the worker just reviewed
                    if worker_account_id == reviewee_profile.accountFK.accountID:
                        reviewed_worker_name = worker_name
                    
                    # Check if still pending review
                    if worker_account_id not in reviewed_worker_account_ids:
                        pending_team_workers.append({
                            "worker_id": a.workerID.workerID,
                            "account_id": worker_account_id,
                            "name": worker_name,
                            "avatar": worker_profile.profileImg,
                            "skill": a.skillSlotID.specializationID.specializationName if a.skillSlotID else None,
                        })
                
                all_team_workers_reviewed = len(pending_team_workers) == 0
            
            # Check if both parties have now submitted reviews
            total_reviews = JobReview.objects.filter(jobID=job).count()
            
            job_completed = False
            # For team jobs: completed when all workers reviewed AND all workers have reviewed client
            if job.is_team_job:
                # Count client reviews (one per worker)
                client_reviews = JobReview.objects.filter(jobID=job, reviewerType="CLIENT").count()
                worker_reviews = JobReview.objects.filter(jobID=job, reviewerType="WORKER").count()
                total_workers = job.total_workers_needed
                
                if client_reviews >= total_workers and worker_reviews >= total_workers and job.workerMarkedComplete and job.clientMarkedComplete:
                    job.status = "COMPLETED"
                    job.completedAt = timezone.now()
                    job.save()
                    job_completed = True
                    print(f"🎉 All team reviews submitted! Job {job_id} marked as COMPLETED.")
            elif total_reviews >= 2 and job.workerMarkedComplete and job.clientMarkedComplete:
                # Regular job: Both reviews exist and both parties marked complete
                job.status = "COMPLETED"
                job.completedAt = timezone.now()
                job.save()
                job_completed = True
                print(f"🎉 Both reviews submitted! Job {job_id} marked as COMPLETED.")
            
            # Build response
            response = {
                "success": True,
                "message": "Review submitted successfully!",
                "review_id": review.reviewID,
                "rating": float(review.rating),
                "reviewer_type": reviewer_type,
                "job_completed": job_completed
            }
            
            # Add team job specific fields
            if job.is_team_job and is_client:
                response.update({
                    "reviewed_worker_name": reviewed_worker_name,
                    "pending_team_workers": pending_team_workers,
                    "all_team_workers_reviewed": all_team_workers_reviewed,
                    "total_team_workers": job.total_workers_needed,
                    "reviewed_count": job.total_workers_needed - len(pending_team_workers)
                })
            
            return response
        
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
            
            # Create payment invoice using configured provider
            user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or request.auth.email
            payment_provider = get_payment_provider()
            provider_name = payment_provider.provider_name
            
            payment_result = payment_provider.create_gcash_payment(
                amount=float(downpayment),
                user_email=request.auth.email,
                user_name=user_name,
                transaction_id=transaction.transactionID
            )
            
            if not payment_result.get("success"):
                job.delete()
                transaction.delete()
                return Response(
                    {"error": "Failed to create payment invoice"},
                    status=500
                )
            
            # Update transaction with payment provider details
            transaction.xenditInvoiceID = payment_result.get('checkout_id') or payment_result.get('invoice_id')
            transaction.xenditExternalID = payment_result.get('external_id')
            transaction.invoiceURL = payment_result.get('checkout_url') or payment_result.get('invoice_url')
            transaction.xenditPaymentChannel = "GCASH"
            transaction.xenditPaymentMethod = provider_name.upper()
            transaction.save()
            
            print(f"✅ INVITE job created: ID={job.jobID}, awaiting GCash payment via {provider_name.upper()}")
            
            return {
                "success": True,
                "requires_payment": True,
                "job_id": job.jobID,
                "job_type": "INVITE",
                "invite_status": "PENDING",
                "invite_target": invite_target_name,
                "escrow_amount": float(downpayment),
                "invoice_url": transaction.invoiceURL,
                "invoice_id": transaction.xenditInvoiceID,
                "transaction_id": transaction.transactionID,
                "provider": provider_name,
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
def request_backjob(request, job_id: int, reason: str = Form(...), description: str = Form(...), terms_accepted: bool = Form(...), images: List[UploadedFile] = File(default=None)):
    """
    Client requests a backjob (rework) on a completed job.
    Creates a dispute with evidence images.
    Admin must approve before it appears for worker/agency.
    Requires explicit terms acceptance for legal compliance.
    
    NEW: Backjob can only be requested during the 7-day payment buffer period
    (before payment is released to worker). Also enforces cooldown after rejection.
    """
    try:
        print(f"🔄 Backjob request for job {job_id} from user {request.auth.email}")
        
        # Validate terms acceptance (CRITICAL for legal compliance)
        if not terms_accepted:
            return Response(
                {"error": "You must accept the backjob agreement terms before submitting a request"},
                status=400
            )
        
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
        
        # ============================================================
        # PAYMENT BUFFER VALIDATION: Can only request backjob during buffer period
        # ============================================================
        from jobs.payment_buffer_service import can_request_backjob, hold_payment_for_backjob
        
        backjob_check = can_request_backjob(job)
        if not backjob_check['can_request']:
            return Response({
                "error": backjob_check['reason'],
                "remaining_hours": backjob_check.get('remaining_hours'),
                "cooldown_ends_at": backjob_check.get('cooldown_ends_at')
            }, status=400)
        # ============================================================
        
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
                # Terms acceptance tracking
                termsAccepted=terms_accepted,
                termsVersion="v1.0",
                termsAcceptedAt=timezone.now()
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
                            
                            # Get signed URL for private bucket (24 hour expiry)
                            signed_url_response = settings.STORAGE.storage().from_('iayos_files').create_signed_url(
                                storage_path, 
                                expires_in=86400  # 24 hours
                            )
                            if signed_url_response.get('error'):
                                raise Exception(f"Failed to create signed URL: {signed_url_response['error']}")
                            image_url = signed_url_response.get('signedURL')
                            
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
            
            # ============================================================
            # NOTIFY WORKER/AGENCY: Alert them about backjob request
            # ============================================================
            from accounts.models import Notification
            
            # Notify assigned worker if exists (individual job)
            if job.assignedWorkerID:
                Notification.objects.create(
                    accountFK=job.assignedWorkerID.profileID.accountFK,
                    notificationType="BACKJOB_REQUESTED",
                    title="Backjob Request Received",
                    message=f"📋 Client has requested a backjob for '{job.title}'. Admin is reviewing the request. Payment is on hold pending review.",
                    relatedJobID=job.jobID
                )
                print(f"📬 Notified worker {job.assignedWorkerID.profileID.accountFK.email} about backjob request")
            
            # Notify assigned agency if exists
            if job.assignedAgencyFK:
                Notification.objects.create(
                    accountFK=job.assignedAgencyFK.accountFK,
                    notificationType="BACKJOB_REQUESTED",
                    title="Backjob Request Received",
                    message=f"📋 Client has requested a backjob for '{job.title}'. Admin is reviewing the request. Payment is on hold pending review.",
                    relatedJobID=job.jobID
                )
                print(f"📬 Notified agency {job.assignedAgencyFK.businessName} about backjob request")
            # ============================================================
            
            # ============================================================
            # HOLD PAYMENT: Put payment on hold due to backjob request
            # ============================================================
            hold_payment_for_backjob(job)
            print(f"⏸️ Payment for job #{job.jobID} now on BACKJOB_PENDING hold")
            # ============================================================
            
            # Create a log entry (newStatus max 15 chars)
            JobLog.objects.create(
                jobID=job,
                oldStatus=job.status,
                newStatus="BACKJOB_REQ",
                changedBy=request.auth,
                notes=f"Client requested backjob. Reason: {reason}. Payment on hold."
            )
            
            # NOTE: Conversation reopening and system message are now sent
            # only when admin APPROVES the backjob request (in adminpanel/api.py)
        
        return {
            "success": True,
            "message": "Backjob request submitted successfully. Our team will review it within 1-3 business days. Worker payment has been put on hold.",
            "dispute_id": dispute.disputeID,
            "status": dispute.status,
            "evidence_count": len(uploaded_images),
            "payment_on_hold": True
        }
        
    except Exception as e:
        print(f"❌ Error requesting backjob: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to submit backjob request: {str(e)}"}, status=500)


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


@router.post("/{job_id}/backjob/confirm-started", auth=dual_auth)
def confirm_backjob_started(request, job_id: int):
    """
    Client confirms that worker has arrived and started the backjob work.
    This must be done before worker can mark backjob as complete.
    """
    try:
        print(f"✅ Client confirming backjob work started for job {job_id}")
        print(f"   Request auth: {request.auth}")
        
        # Get the job first
        try:
            job = Job.objects.select_related(
                'clientID__profileID__accountFK',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK__accountFK'
            ).get(jobID=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)
        
        # Verify the requesting user is the client for this job
        if job.clientID.profileID.accountFK != request.auth:
            print(f"   ❌ User {request.auth} is not the client for job {job_id}")
            print(f"   Job client account: {job.clientID.profileID.accountFK}")
            return Response({"error": "Only the client who posted this job can confirm backjob work started"}, status=403)
        
        print(f"   ✓ Verified user is the job client")
        
        # Get the active dispute (backjob)
        dispute = JobDispute.objects.filter(jobID=job, status="UNDER_REVIEW").first()
        if not dispute:
            print(f"   ❌ No active backjob (UNDER_REVIEW dispute) found for job {job_id}")
            return Response({"error": "No active backjob found for this job"}, status=404)
        
        print(f"   Found dispute {dispute.disputeID}, backjobStarted={dispute.backjobStarted}")
        
        # Check if already confirmed
        if dispute.backjobStarted:
            print(f"   ❌ Backjob already confirmed as started at {dispute.backjobStartedAt}")
            return Response({"error": "Backjob work has already been confirmed as started"}, status=400)
        
        # Confirm backjob work has started
        dispute.backjobStarted = True
        dispute.backjobStartedAt = timezone.now()
        dispute.save()
        
        print(f"✅ Client confirmed backjob work started for job {job_id}")
        
        # Create job log with distinct backjob status
        JobLog.objects.create(
            jobID=job,
            oldStatus=job.status,
            newStatus="BACKJOB_STARTED",
            changedBy=request.auth,
            notes="Client confirmed backjob work has started"
        )
        
        # Add system message to conversation
        from profiles.models import Conversation, Message
        conversation = Conversation.objects.filter(relatedJobPosting=job).first()
        if conversation:
            Message.objects.create(
                conversationID=conversation,
                sender=None,
                senderAgency=None,
                messageText="✅ Client confirmed backjob work has started. Worker can now mark backjob as complete when finished.",
                messageType="SYSTEM"
            )
        
        # Notify the worker/agency
        worker_account = None
        if job.assignedWorkerID:
            worker_account = job.assignedWorkerID.profileID.accountFK
        elif job.assignedAgencyFK:
            worker_account = job.assignedAgencyFK.accountFK
        
        if worker_account:
            Notification.objects.create(
                accountFK=worker_account,
                notificationType="BACKJOB_WORK_STARTED",
                title="Backjob Work Confirmed",
                message=f"Client confirmed you have started the backjob work for '{job.title}'. You can mark it complete when finished.",
                relatedJobID=job.jobID
            )
        
        return {
            "success": True,
            "message": "Backjob work start confirmed. Worker can now mark as complete when finished.",
            "job_id": job_id,
            "dispute_id": dispute.disputeID,
            "backjob_started": True,
            "backjob_started_at": dispute.backjobStartedAt.isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error confirming backjob started: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to confirm backjob started: {str(e)}"}, status=500)


@router.post("/{job_id}/backjob/mark-complete", auth=dual_auth)
def mark_backjob_complete(request, job_id: int):
    """
    Worker/Agency marks the backjob as complete.
    Requires client to have confirmed work started first.
    Notifies client to verify and confirm completion.
    """
    try:
        print(f"✅ Worker marking backjob complete for job {job_id}")
        
        # Parse notes from JSON body
        notes = ""
        try:
            import json
            body = json.loads(request.body)
            notes = body.get("notes", "")
        except:
            pass
        
        # Get the job
        try:
            job = Job.objects.select_related(
                'clientID__profileID__accountFK',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK__accountFK'
            ).get(jobID=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)
        
        # Get the active dispute (backjob)
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
                {"error": "Only the assigned worker or agency can mark this backjob as complete"},
                status=403
            )
        
        # Check if client confirmed work started
        if not dispute.backjobStarted:
            return Response(
                {"error": "Client must confirm backjob work has started before you can mark it complete"},
                status=400
            )
        
        # Check if already marked complete
        if dispute.workerMarkedBackjobComplete:
            return Response({"error": "Backjob has already been marked as complete"}, status=400)
        
        # Mark backjob as complete
        dispute.workerMarkedBackjobComplete = True
        dispute.workerMarkedBackjobCompleteAt = timezone.now()
        dispute.save()
        
        print(f"✅ Worker marked backjob complete for job {job_id}")
        
        # Create job log with distinct backjob status
        JobLog.objects.create(
            jobID=job,
            oldStatus="BACKJOB_STARTED",
            newStatus="BACKJOB_WORKER_DONE",
            changedBy=request.auth,
            notes=notes or "Worker marked backjob as completed"
        )
        
        # Add system message to conversation
        from profiles.models import Conversation, Message
        conversation = Conversation.objects.filter(relatedJobPosting=job).first()
        if conversation:
            Message.objects.create(
                conversationID=conversation,
                sender=None,
                senderAgency=None,
                messageText="🔧 Worker has marked the backjob as complete. Client, please verify and confirm completion.",
                messageType="SYSTEM"
            )
        
        # Notify the client
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="BACKJOB_MARKED_COMPLETE",
            title="Backjob Marked Complete",
            message=f"The worker has marked the backjob for '{job.title}' as complete. Please verify and confirm.",
            relatedJobID=job.jobID
        )
        
        return {
            "success": True,
            "message": "Backjob marked as complete. Client has been notified to verify.",
            "job_id": job_id,
            "dispute_id": dispute.disputeID,
            "worker_marked_complete": True,
            "worker_marked_complete_at": dispute.workerMarkedBackjobCompleteAt.isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error marking backjob complete: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to mark backjob complete: {str(e)}"}, status=500)


@router.post("/{job_id}/backjob/approve-completion", auth=dual_auth)
def approve_backjob_completion(request, job_id: int):
    """
    Client confirms the backjob is complete and satisfactory.
    This closes the conversation and marks the dispute as RESOLVED.
    No payment or reviews for backjobs.
    """
    try:
        print(f"✅ Client approving backjob completion for job {job_id}")
        print(f"   Request auth: {request.auth}")
        
        # Get the job first
        try:
            job = Job.objects.select_related(
                'clientID__profileID__accountFK',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK__accountFK'
            ).get(jobID=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)
        
        # Verify the requesting user is the client for this job
        if job.clientID.profileID.accountFK != request.auth:
            print(f"   ❌ User {request.auth} is not the client for job {job_id}")
            return Response({"error": "Only the client who posted this job can approve backjob completion"}, status=403)
        
        print(f"   ✓ Verified user is the job client")
        
        # Get the active dispute (backjob)
        dispute = JobDispute.objects.filter(jobID=job, status="UNDER_REVIEW").first()
        if not dispute:
            return Response({"error": "No active backjob found for this job"}, status=404)
        
        # Check if worker marked it complete
        if not dispute.workerMarkedBackjobComplete:
            return Response(
                {"error": "Worker must mark backjob as complete before client can approve"},
                status=400
            )
        
        # Check if already confirmed
        if dispute.clientConfirmedBackjob:
            return Response({"error": "Backjob has already been confirmed as complete"}, status=400)
        
        with db_transaction.atomic():
            # Mark client confirmation
            dispute.clientConfirmedBackjob = True
            dispute.clientConfirmedBackjobAt = timezone.now()
            
            # Mark dispute as resolved
            dispute.status = "RESOLVED"
            dispute.resolution = "Backjob completed and confirmed by client"
            dispute.resolvedDate = timezone.now()
            dispute.save()
            
            # Close the conversation
            from profiles.models import Conversation, Message
            conversation = Conversation.objects.filter(relatedJobPosting=job).first()
            if conversation:
                conversation.status = Conversation.ConversationStatus.COMPLETED
                conversation.save()
                
                # Add final system message
                Message.objects.create(
                    conversationID=conversation,
                    sender=None,
                    senderAgency=None,
                    messageText="✅ Backjob completed and confirmed! This conversation is now closed. Thank you for using iAyos!",
                    messageType="SYSTEM"
                )
            
            # Create job log with distinct backjob status
            JobLog.objects.create(
                jobID=job,
                oldStatus="BACKJOB_WORKER_DONE",
                newStatus="BACKJOB_RESOLVED",
                changedBy=request.auth,
                notes="Client confirmed backjob completion - dispute resolved"
            )
            
            # Notify the worker/agency
            worker_account = None
            if job.assignedWorkerID:
                worker_account = job.assignedWorkerID.profileID.accountFK
            elif job.assignedAgencyFK:
                worker_account = job.assignedAgencyFK.accountFK
            
            if worker_account:
                Notification.objects.create(
                    accountFK=worker_account,
                    notificationType="BACKJOB_CONFIRMED",
                    title="Backjob Confirmed Complete",
                    message=f"Client has confirmed the backjob for '{job.title}' is complete. Great job!",
                    relatedJobID=job.jobID
                )
        
        print(f"✅ Backjob completed and conversation closed for job {job_id}")
        
        return {
            "success": True,
            "message": "Backjob confirmed complete. The conversation has been closed.",
            "job_id": job_id,
            "dispute_id": dispute.disputeID,
            "status": "RESOLVED",
            "client_confirmed": True,
            "client_confirmed_at": dispute.clientConfirmedBackjobAt.isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error approving backjob completion: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to approve backjob completion: {str(e)}"}, status=500)


@router.post("/{job_id}/complete-backjob", auth=dual_auth)
def complete_backjob(request, job_id: int, notes: str = Form(default="")):
    """
    DEPRECATED: Use the new 3-phase backjob workflow instead:
    1. POST /{job_id}/backjob/confirm-started (Client)
    2. POST /{job_id}/backjob/mark-complete (Worker)
    3. POST /{job_id}/backjob/approve-completion (Client)
    
    This endpoint is kept for backward compatibility but redirects to mark-complete.
    """
    print(f"⚠️ Deprecated complete-backjob endpoint called for job {job_id}. Use new 3-phase workflow.")
    return mark_backjob_complete(request, job_id, notes)

#endregion


# ===========================================================================
# TEAM JOB ENDPOINTS - Multi-Skill Multi-Worker Support
# ===========================================================================
#region Team Jobs

from jobs.schemas import (
    CreateTeamJobSchema, TeamJobResponseSchema, TeamJobDetailSchema,
    TeamJobApplicationSchema, AssignWorkerToSlotSchema, UpdateSkillSlotSchema,
    TeamWorkerCompletionSchema, TeamJobStartSchema
)
from jobs.team_job_services import (
    create_team_job, get_team_job_detail, apply_to_skill_slot,
    accept_team_application, reject_team_application, start_team_job, worker_complete_team_assignment
)


@router.post("/team/create", auth=dual_auth)
def create_team_job_endpoint(request, payload: CreateTeamJobSchema):
    """
    Create a new team job with multiple skill slot requirements.
    
    Team jobs require:
    - At least one skill slot
    - At least 2 workers total across all slots
    - Budget and allocation type
    
    Escrow (50% of total budget) is held on creation.
    """
    try:
        print(f"📋 Creating team job: {payload.title}")
        print(f"   Skill slots: {len(payload.skill_slots)}")
        
        # Get client profile
        from accounts.models import Profile
        profile = Profile.objects.filter(accountFK=request.auth).first()
        if not profile:
            return Response({"error": "Profile not found"}, status=404)
        
        # Convert skill slots to dict format
        skill_slots_data = [
            {
                'specialization_id': slot.specialization_id,
                'workers_needed': slot.workers_needed,
                'budget_allocated': slot.budget_allocated,
                'skill_level_required': slot.skill_level_required or 'ENTRY',
                'notes': slot.notes
            }
            for slot in payload.skill_slots
        ]
        
        result = create_team_job(
            client_profile=profile,
            title=payload.title,
            description=payload.description,
            location=payload.location,
            total_budget=Decimal(str(payload.total_budget)),
            skill_slots_data=skill_slots_data,
            allocation_type=payload.budget_allocation_type or 'EQUAL_PER_WORKER',
            team_start_threshold=payload.team_start_threshold or 100.0,
            urgency=payload.urgency or 'MEDIUM',
            preferred_start_date=payload.preferred_start_date,
            materials_needed=payload.materials_needed,
            payment_method=payload.payment_method or 'WALLET'
        )
        
        if not result.get('success'):
            return Response(result, status=400)
        
        print(f"✅ Team job created: #{result['job_id']}")
        return result
        
    except Exception as e:
        print(f"❌ Error creating team job: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to create team job: {str(e)}"}, status=500)


@router.get("/team/{job_id}", auth=dual_auth)
def get_team_job_detail_endpoint(request, job_id: int):
    """
    Get full details of a team job including all skill slots and worker assignments.
    """
    try:
        result = get_team_job_detail(job_id, request.auth)
        
        if 'error' in result:
            return Response({"error": result['error']}, status=404)
        
        return result
        
    except Exception as e:
        print(f"❌ Error getting team job detail: {str(e)}")
        return Response({"error": str(e)}, status=500)


@router.post("/team/{job_id}/apply", auth=dual_auth)
def apply_to_team_job_endpoint(request, job_id: int, payload: TeamJobApplicationSchema):
    """
    Apply to a specific skill slot in a team job.
    
    Workers must specify which skill slot they're applying for.
    """
    try:
        print(f"📝 Worker applying to team job #{job_id}, slot #{payload.skill_slot_id}")
        
        # Get worker profile
        from accounts.models import WorkerProfile
        worker = WorkerProfile.objects.filter(profileID__accountFK=request.auth).first()
        if not worker:
            return Response({"error": "Worker profile not found"}, status=404)
        
        result = apply_to_skill_slot(
            worker_profile=worker,
            job_id=job_id,
            skill_slot_id=payload.skill_slot_id,
            proposal_message=payload.proposal_message,
            proposed_budget=Decimal(str(payload.proposed_budget)),
            budget_option=payload.budget_option,
            estimated_duration=payload.estimated_duration
        )
        
        if not result.get('success'):
            return Response(result, status=400)
        
        print(f"✅ Application submitted: #{result['application_id']}")
        return result
        
    except Exception as e:
        print(f"❌ Error applying to team job: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@router.post("/team/{job_id}/applications/{application_id}/accept", auth=dual_auth)
def accept_team_application_endpoint(request, job_id: int, application_id: int):
    """
    Client accepts a worker's application to a team job skill slot.
    
    Creates assignment and adds worker to team group conversation.
    """
    try:
        print(f"✅ Accepting team application #{application_id} for job #{job_id}")
        
        result = accept_team_application(
            job_id=job_id,
            application_id=application_id,
            client_user=request.auth
        )
        
        if not result.get('success'):
            return Response(result, status=400)
        
        return result
        
    except Exception as e:
        print(f"❌ Error accepting team application: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@router.post("/team/{job_id}/applications/{application_id}/reject", auth=dual_auth)
def reject_team_application_endpoint(request, job_id: int, application_id: int, payload: dict = None):
    """
    Client rejects a worker's application to a team job skill slot.
    
    The application status is set to REJECTED and the worker is notified.
    Optional rejection reason can be provided.
    """
    try:
        reason = payload.get('reason') if payload else None
        print(f"❌ Client rejecting application #{application_id} for team job #{job_id}")
        
        result = reject_team_application(
            job_id=job_id,
            application_id=application_id,
            client_user=request.auth,
            reason=reason
        )
        
        if not result.get('success'):
            return Response(result, status=400)
        
        return result
        
    except Exception as e:
        print(f"❌ Error rejecting team application: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@router.post("/team/{job_id}/start", auth=dual_auth)
def start_team_job_endpoint(request, job_id: int, payload: TeamJobStartSchema = None):
    """
    Start a team job.
    
    By default, requires team_start_threshold to be met.
    Set force_start=true to start with partial team (Option C).
    """
    try:
        force_start = payload.force_start if payload else False
        print(f"🚀 Starting team job #{job_id}, force={force_start}")
        
        result = start_team_job(
            job_id=job_id,
            client_user=request.auth,
            force_start=force_start
        )
        
        if not result.get('success'):
            return Response(result, status=400)
        
        return result
        
    except Exception as e:
        print(f"❌ Error starting team job: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@router.post("/team/assignments/{assignment_id}/complete", auth=dual_auth)
def worker_complete_assignment_endpoint(request, assignment_id: int, payload: TeamWorkerCompletionSchema = None):
    """
    Worker marks their individual assignment as complete in a team job.
    
    Each team member completes their own assignment independently.
    Client is notified when all team members have completed.
    """
    try:
        notes = payload.completion_notes if payload else None
        print(f"✅ Worker completing assignment #{assignment_id}")
        
        result = worker_complete_team_assignment(
            assignment_id=assignment_id,
            worker_user=request.auth,
            notes=notes
        )
        
        if not result.get('success'):
            return Response(result, status=400)
        
        return result
        
    except Exception as e:
        print(f"❌ Error completing assignment: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@router.get("/team/{job_id}/applications", auth=dual_auth)
def get_team_job_applications_endpoint(request, job_id: int, skill_slot_id: int = None):
    """
    Get applications for a team job, optionally filtered by skill slot.
    """
    try:
        job = Job.objects.get(jobID=job_id)
        
        # Verify authorization
        if job.clientID and job.clientID.profileID.accountFK != request.auth:
            return Response({"error": "Not authorized"}, status=403)
        
        applications = JobApplication.objects.filter(
            jobID=job
        ).select_related(
            'workerID__profileID', 'applied_skill_slot__specializationID'
        )
        
        if skill_slot_id:
            applications = applications.filter(applied_skill_slot_id=skill_slot_id)
        
        result = []
        for app in applications:
            slot = app.applied_skill_slot
            worker = app.workerID
            profile = worker.profileID if worker else None
            
            result.append({
                'application_id': app.applicationID,
                'worker_id': worker.id if worker else None,
                'worker_name': f"{profile.firstName} {profile.lastName}" if profile else "Unknown",
                'worker_avatar': profile.profileImg if profile else None,  # profileImg is a CharField (URL string), not FileField
                'worker_rating': float(worker.workerRating) if worker and worker.workerRating else None,
                'skill_slot_id': slot.skillSlotID if slot else None,
                'specialization_name': slot.specializationID.specializationName if slot else None,
                'proposal_message': app.proposalMessage,
                'proposed_budget': float(app.proposedBudget),
                'budget_option': app.budgetOption,
                'status': app.status,
                'created_at': app.createdAt.isoformat()
            })
        
        return {'applications': result, 'count': len(result)}
        
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    except Exception as e:
        print(f"❌ Error getting team applications: {str(e)}")
        return Response({"error": str(e)}, status=500)


@router.post("/{job_id}/team/confirm-arrival/{assignment_id}", auth=dual_auth)
def confirm_team_worker_arrival_endpoint(request, job_id: int, assignment_id: int):
    """
    Client confirms a team worker has arrived at the job site.
    Matches regular job workflow where client confirms arrival before work starts.
    """
    from jobs.team_job_services import confirm_team_worker_arrival
    
    result = confirm_team_worker_arrival(
        job_id=job_id,
        assignment_id=assignment_id,
        client_user=request.auth
    )
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to confirm arrival')}, status=400)
    
    return result


@router.post("/{job_id}/team/approve-completion", auth=dual_auth)
def approve_team_job_completion(request, job_id: int, payment_method: str = 'WALLET'):
    """
    Client approves team job completion after all workers have marked complete.
    This closes the job and team conversation.
    """
    from jobs.team_job_services import client_approve_team_job
    
    result = client_approve_team_job(
        job_id=job_id,
        client_user=request.auth,
        payment_method=payment_method
    )
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to approve team job')}, status=400)
    
    return result


@router.post("/{job_id}/team/worker-complete/{assignment_id}", auth=dual_auth)
def worker_mark_team_complete(request, job_id: int, assignment_id: int, notes: str = None):
    """
    Worker marks their individual assignment as complete in a team job.
    """
    from jobs.team_job_services import worker_complete_team_assignment
    
    result = worker_complete_team_assignment(
        assignment_id=assignment_id,
        worker_user=request.auth,
        notes=notes
    )
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to mark complete')}, status=400)
    
    return result

#endregion


# ============================================================================
# JOB RECEIPT / INVOICE ENDPOINTS
# ============================================================================
#region Receipt Endpoints

@router.get("/{job_id}/receipt", auth=dual_auth)
def get_job_receipt(request, job_id: int):
    """
    Get complete receipt/invoice data for a completed job.
    Works for all completed jobs, including those completed before this feature was added.
    
    Returns:
    - Job details (title, description, category, dates)
    - Payment breakdown (budget, escrow, platform fee, worker earnings)
    - Buffer status (release date, days remaining, payment released)
    - Worker/agency info
    - Transaction history for this job
    """
    from decimal import Decimal
    from django.utils import timezone
    from jobs.payment_buffer_service import get_payment_buffer_days
    
    try:
        # Get the job
        job = Job.objects.select_related(
            'clientID__profileID__accountFK',
            'assignedWorkerID__profileID__accountFK',
            'assignedAgencyFK__accountFK',
            'categoryID'
        ).get(jobID=job_id)
        
        # Verify user is client or assigned worker/agency for this job
        user = request.auth
        is_client = job.clientID.profileID.accountFK == user
        is_worker = (
            job.assignedWorkerID and 
            job.assignedWorkerID.profileID.accountFK == user
        )
        is_agency = (
            job.assignedAgencyFK and 
            job.assignedAgencyFK.accountFK == user
        )
        
        if not (is_client or is_worker or is_agency):
            return Response({"error": "You don't have access to this job's receipt"}, status=403)
        
        # Calculate payment breakdown
        budget = Decimal(str(job.budget))
        escrow_amount = budget * Decimal('0.5')  # 50% downpayment
        
        # Platform fee: 10% for regular jobs, 5% for team jobs
        platform_fee_rate = Decimal('0.05') if job.is_team_job else Decimal('0.10')
        platform_fee = budget * platform_fee_rate
        
        # Worker receives full budget (client pays budget + fee)
        worker_earnings = budget
        total_client_paid = budget + platform_fee
        
        # Get buffer period settings
        buffer_days = get_payment_buffer_days()
        
        # Calculate buffer dates and status
        buffer_start_date = job.clientMarkedCompleteAt or job.completedAt
        if buffer_start_date:
            from datetime import timedelta
            buffer_end_date = buffer_start_date + timedelta(days=buffer_days)
            now = timezone.now()
            remaining_days = max(0, (buffer_end_date - now).days) if not job.paymentReleasedToWorker else 0
        else:
            buffer_end_date = None
            remaining_days = None
        
        # Get related transactions for this job
        transactions = []
        try:
            # Get all transactions related to this job (from any wallet)
            from accounts.models import Transaction
            related_transactions = Transaction.objects.filter(
                relatedJobPosting=job
            ).order_by('-createdAt')[:10]  # Last 10 transactions
            
            for txn in related_transactions:
                transactions.append({
                    'id': txn.transactionID,
                    'type': txn.transactionType,
                    'amount': float(txn.amount),
                    'status': txn.status,
                    'description': txn.description,
                    'reference_number': txn.referenceNumber,
                    'payment_method': txn.paymentMethod,
                    'created_at': txn.createdAt.isoformat() if txn.createdAt else None,
                    'completed_at': txn.completedAt.isoformat() if txn.completedAt else None,
                })
        except Exception as e:
            print(f"⚠️ Error fetching transactions for receipt: {e}")
        
        # Build worker/agency info
        worker_info = None
        if job.assignedWorkerID:
            worker_profile = job.assignedWorkerID.profileID
            worker_info = {
                'type': 'WORKER',
                'id': job.assignedWorkerID.id,  # WorkerProfile uses 'id' as primary key
                'name': f"{worker_profile.firstName} {worker_profile.lastName}",
                'avatar': worker_profile.profileImg,
                'contact': worker_profile.contactNum,
            }
        elif job.assignedAgencyFK:
            agency = job.assignedAgencyFK
            worker_info = {
                'type': 'AGENCY',
                'id': agency.agencyId,
                'name': agency.businessName,
                'avatar': None,  # Agency model doesn't have profile image field
                'contact': agency.contactNumber,  # Fixed: was contactNum (wrong field name)
            }
        
        # Build client info
        client_profile = job.clientID.profileID
        client_info = {
            'id': client_profile.profileID,
            'name': f"{client_profile.firstName} {client_profile.lastName}",
            'avatar': client_profile.profileImg,
            'contact': client_profile.contactNum,
        }
        
        # Build the receipt response
        receipt_data = {
            'success': True,
            'receipt': {
                # Job info
                'job_id': job.jobID,
                'title': job.title,
                'description': job.description,
                'category': job.categoryID.specializationName if job.categoryID else None,
                'location': job.location,
                'is_team_job': job.is_team_job,
                'job_type': job.jobType,
                
                # Status and dates
                'status': job.status,
                'created_at': job.createdAt.isoformat() if job.createdAt else None,
                'started_at': job.clientConfirmedWorkStartedAt.isoformat() if job.clientConfirmedWorkStartedAt else None,
                'worker_completed_at': job.workerMarkedCompleteAt.isoformat() if job.workerMarkedCompleteAt else None,
                'client_approved_at': job.clientMarkedCompleteAt.isoformat() if job.clientMarkedCompleteAt else None,
                'completed_at': job.completedAt.isoformat() if job.completedAt else None,
                
                # Payment breakdown (all in PHP)
                'payment': {
                    'currency': 'PHP',
                    'budget': float(budget),
                    'escrow_amount': float(escrow_amount),
                    'final_payment': float(escrow_amount),  # Same as escrow (50/50 split)
                    'platform_fee': float(platform_fee),
                    'platform_fee_rate': f"{int(platform_fee_rate * 100)}%",
                    'worker_earnings': float(worker_earnings),
                    'total_client_paid': float(total_client_paid),
                    'escrow_paid': job.escrowPaid,
                    'escrow_paid_at': job.escrowPaidAt.isoformat() if job.escrowPaidAt else None,
                    'final_payment_paid': job.remainingPaymentPaid,
                    'final_payment_paid_at': job.remainingPaymentPaidAt.isoformat() if job.remainingPaymentPaidAt else None,
                    'payment_method': job.finalPaymentMethod,
                },
                
                # Buffer status (7-day holding period)
                'buffer': {
                    'buffer_days': buffer_days,
                    'start_date': buffer_start_date.isoformat() if buffer_start_date else None,
                    'end_date': buffer_end_date.isoformat() if buffer_end_date else None,
                    'remaining_days': remaining_days,
                    'is_released': job.paymentReleasedToWorker,
                    'released_at': job.paymentReleasedAt.isoformat() if job.paymentReleasedAt else None,
                    'hold_reason': job.paymentHeldReason,
                },
                
                # Parties involved
                'client': client_info,
                'worker': worker_info,
                
                # Transaction history
                'transactions': transactions,
                
                # Review status
                'reviews': {
                    'client_reviewed': job.clientReviewed if hasattr(job, 'clientReviewed') else False,
                    'worker_reviewed': job.workerReviewed if hasattr(job, 'workerReviewed') else False,
                },
            }
        }
        
        return receipt_data
        
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    except Exception as e:
        print(f"❌ Error generating receipt for job {job_id}: {e}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to generate receipt: {str(e)}"}, status=500)


@router.get("/{job_id}/payment-timeline", auth=dual_auth)
def get_job_payment_timeline(request, job_id: int):
    """
    Get the payment timeline for a job, showing all payment-related events.
    Useful for tracking payment progress from job creation to final release.
    """
    from django.utils import timezone
    from datetime import timedelta
    from jobs.payment_buffer_service import get_payment_buffer_days
    
    try:
        # Get the job
        job = Job.objects.select_related(
            'clientID__profileID__accountFK',
            'assignedWorkerID__profileID__accountFK',
            'assignedAgencyFK__accountFK'
        ).get(jobID=job_id)
        
        # Verify user is client or assigned worker/agency for this job
        user = request.auth
        is_client = job.clientID.profileID.accountFK == user
        is_worker = (
            job.assignedWorkerID and 
            job.assignedWorkerID.profileID.accountFK == user
        )
        is_agency = (
            job.assignedAgencyFK and 
            job.assignedAgencyFK.accountFK == user
        )
        
        if not (is_client or is_worker or is_agency):
            return Response({"error": "You don't have access to this job's payment timeline"}, status=403)
        
        # Build timeline events
        timeline = []
        now = timezone.now()
        
        # 1. Job Created
        timeline.append({
            "event": "JOB_CREATED",
            "title": "Job Posted",
            "description": f"Job '{job.title}' was posted",
            "date": job.createdAt.isoformat() if job.createdAt else None,
            "status": "completed",
            "amount": float(job.budget) if job.budget else 0
        })
        
        # 2. Escrow Payment
        if job.escrowPaid:
            timeline.append({
                "event": "ESCROW_PAID",
                "title": "Escrow Deposited",
                "description": "50% downpayment deposited in escrow",
                "date": job.escrowPaidAt.isoformat() if job.escrowPaidAt else None,
                "status": "completed",
                "amount": float(job.escrowAmount) if job.escrowAmount else 0
            })
        else:
            timeline.append({
                "event": "ESCROW_PENDING",
                "title": "Escrow Pending",
                "description": "Awaiting 50% downpayment",
                "date": None,
                "status": "pending" if job.status in ['ACTIVE', 'IN_PROGRESS'] else "skipped",
                "amount": float(job.budget) * 0.5 if job.budget else 0
            })
        
        # 3. Work Started
        if job.clientConfirmedWorkStarted:
            timeline.append({
                "event": "WORK_STARTED",
                "title": "Work Started",
                "description": "Client confirmed work has started",
                "date": job.clientConfirmedWorkStartedAt.isoformat() if job.clientConfirmedWorkStartedAt else None,
                "status": "completed"
            })
        
        # 4. Job Completion
        if job.workerMarkedComplete:
            timeline.append({
                "event": "WORKER_COMPLETED",
                "title": "Worker Marked Complete",
                "description": "Worker marked the job as complete",
                "date": job.workerMarkedCompleteAt.isoformat() if job.workerMarkedCompleteAt else None,
                "status": "completed"
            })
        
        if job.clientMarkedComplete:
            timeline.append({
                "event": "CLIENT_APPROVED",
                "title": "Client Approved",
                "description": "Client approved the completed work",
                "date": job.clientMarkedCompleteAt.isoformat() if job.clientMarkedCompleteAt else None,
                "status": "completed"
            })
        
        # 5. Final Payment
        if job.remainingPaymentPaid:
            timeline.append({
                "event": "FINAL_PAYMENT",
                "title": "Final Payment Made",
                "description": f"Remaining 50% paid via {job.finalPaymentMethod or 'wallet'}",
                "date": job.remainingPaymentPaidAt.isoformat() if job.remainingPaymentPaidAt else None,
                "status": "completed",
                "amount": float(job.remainingPayment) if job.remainingPayment else 0
            })
        elif job.status == 'COMPLETED':
            timeline.append({
                "event": "FINAL_PAYMENT_PENDING",
                "title": "Final Payment Pending",
                "description": "Awaiting final 50% payment",
                "date": None,
                "status": "pending",
                "amount": float(job.remainingPayment) if job.remainingPayment else (float(job.budget) * 0.5 if job.budget else 0)
            })
        
        # 6. Buffer Period
        buffer_days = get_payment_buffer_days()
        buffer_start = job.clientMarkedCompleteAt or job.completedAt
        
        if buffer_start:
            buffer_end = buffer_start + timedelta(days=buffer_days)
            remaining_days = max(0, (buffer_end - now).days)
            
            if job.paymentReleasedToWorker:
                timeline.append({
                    "event": "PAYMENT_RELEASED",
                    "title": "Payment Released",
                    "description": "Earnings released to worker's wallet",
                    "date": job.paymentReleasedAt.isoformat() if job.paymentReleasedAt else None,
                    "status": "completed",
                    "amount": float(job.budget) if job.budget else 0
                })
            else:
                timeline.append({
                    "event": "BUFFER_PERIOD",
                    "title": f"Buffer Period ({remaining_days} days remaining)",
                    "description": f"Payment will be released on {buffer_end.strftime('%b %d, %Y')}",
                    "date": buffer_end.isoformat(),
                    "status": "in_progress" if remaining_days > 0 else "pending",
                    "remaining_days": remaining_days
                })
        
        return {
            "success": True,
            "job_id": job.jobID,
            "job_title": job.title,
            "job_status": job.status,
            "total_budget": float(job.budget) if job.budget else 0,
            "timeline": timeline
        }
        
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    except Exception as e:
        print(f"❌ Error generating payment timeline for job {job_id}: {e}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to generate payment timeline: {str(e)}"}, status=500)

#endregion


# =============================================================================
# region Daily Payment Endpoints
# =============================================================================

@router.post("/{job_id}/daily/attendance", auth=dual_auth)
def log_daily_attendance(request, job_id: int, data: LogAttendanceSchema):
    """
    Log attendance for a day of work on a daily-rate job.
    
    For freelance workers: worker logs their own attendance
    For agency jobs: agency rep logs attendance for all employees
    
    Required fields:
        - work_date: str (YYYY-MM-DD)
        - status: str (PENDING, PRESENT, HALF_DAY, ABSENT)
    
    Optional fields:
        - time_in: str (ISO datetime)
        - time_out: str (ISO datetime)
        - notes: str
        - assignment_id: int (for team jobs)
        - employee_id: int (for agency jobs)
    """
    from jobs.daily_payment_service import DailyPaymentService
    from datetime import date
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    if job.payment_model != 'DAILY':
        return Response({"error": "This job is not a daily-rate job"}, status=400)
    
    # Determine worker type and validate access
    user = request.auth
    profile_type = getattr(user, 'profile_type', None)
    
    # Parse date
    work_date_str = data.work_date
    if not work_date_str:
        return Response({"error": "work_date is required"}, status=400)
    
    try:
        work_date = date.fromisoformat(work_date_str)
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
    
    status = data.status or 'PENDING'
    if status not in ['PENDING', 'PRESENT', 'HALF_DAY', 'ABSENT']:
        return Response({"error": "Invalid status. Use PENDING, PRESENT, HALF_DAY, or ABSENT"}, status=400)
    
    # Parse optional time fields
    time_in = None
    time_out = None
    if data.time_in:
        try:
            time_in = datetime.fromisoformat(data.time_in)
        except ValueError:
            pass
    if data.time_out:
        try:
            time_out = datetime.fromisoformat(data.time_out)
        except ValueError:
            pass
    
    # Get worker/assignment/employee
    worker = None
    assignment = None
    employee_id = data.employee_id
    
    if data.assignment_id:
        from accounts.models import JobWorkerAssignment
        try:
            assignment = JobWorkerAssignment.objects.get(
                assignmentID=data.assignment_id,
                jobID=job
            )
        except JobWorkerAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=404)
    elif not employee_id:
        # Single worker job - get assigned worker
        worker = job.assignedWorkerID
        if not worker:
            return Response({"error": "No worker assigned to this job"}, status=400)
    
    result = DailyPaymentService.log_attendance(
        job=job,
        work_date=work_date,
        worker=worker,
        assignment=assignment,
        employee_id=employee_id,
        time_in=time_in,
        time_out=time_out,
        status=status,
        notes=data.notes or ''
    )
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to log attendance')}, status=400)
    
    return result


@router.post("/{job_id}/daily/attendance/{attendance_id}/confirm-worker", auth=dual_auth)
def confirm_attendance_worker(request, job_id: int, attendance_id: int):
    """
    Worker confirms their attendance for a specific day.
    For agency jobs, agency rep confirms on behalf of employees.
    """
    from jobs.daily_payment_service import DailyPaymentService
    from accounts.models import DailyAttendance
    
    try:
        attendance = DailyAttendance.objects.get(
            attendanceID=attendance_id,
            jobID__jobID=job_id
        )
    except DailyAttendance.DoesNotExist:
        return Response({"error": "Attendance record not found"}, status=404)
    
    result = DailyPaymentService.confirm_attendance_worker(attendance, request.auth)
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to confirm attendance')}, status=400)
    
    return result


@router.post("/{job_id}/daily/attendance/{attendance_id}/confirm-client", auth=dual_auth)
def confirm_attendance_client(request, job_id: int, attendance_id: int, data: dict = None):
    """
    Client confirms attendance for a worker's day.
    Client can optionally adjust the attendance status.
    
    Optional fields:
        - approved_status: str (PRESENT, HALF_DAY, ABSENT)
    """
    from jobs.daily_payment_service import DailyPaymentService
    from accounts.models import DailyAttendance
    
    try:
        attendance = DailyAttendance.objects.get(
            attendanceID=attendance_id,
            jobID__jobID=job_id
        )
    except DailyAttendance.DoesNotExist:
        return Response({"error": "Attendance record not found"}, status=404)
    
    # Verify client ownership
    if attendance.jobID.clientID.profileID.accountFK != request.auth:
        return Response({"error": "Only the job client can confirm attendance"}, status=403)
    
    approved_status = data.get('approved_status') if data else None
    
    result = DailyPaymentService.confirm_attendance_client(
        attendance, 
        request.auth,
        approved_status=approved_status
    )
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to confirm attendance')}, status=400)
    
    return result


@router.get("/{job_id}/daily/attendance", auth=dual_auth)
def get_daily_attendance(request, job_id: int, start_date: str = None, end_date: str = None):
    """
    Get attendance records for a daily job.
    
    Optional filters:
        - start_date: str (YYYY-MM-DD)
        - end_date: str (YYYY-MM-DD)
    """
    from accounts.models import DailyAttendance
    from datetime import date
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    if job.payment_model != 'DAILY':
        return Response({"error": "This job is not a daily-rate job"}, status=400)
    
    queryset = DailyAttendance.objects.filter(jobID=job).order_by('-date')
    
    # Apply date filters
    if start_date:
        try:
            queryset = queryset.filter(date__gte=date.fromisoformat(start_date))
        except ValueError:
            pass
    if end_date:
        try:
            queryset = queryset.filter(date__lte=date.fromisoformat(end_date))
        except ValueError:
            pass
    
    records = []
    for attendance in queryset:
        worker_name = None
        if attendance.workerID:
            worker_name = f"{attendance.workerID.profileID.accountFK.firstName} {attendance.workerID.profileID.accountFK.lastName}"
        elif attendance.employeeID:
            worker_name = f"{attendance.employeeID.first_name} {attendance.employeeID.last_name}"
        
        records.append({
            'attendance_id': attendance.attendanceID,
            'date': str(attendance.date),
            'worker_name': worker_name,
            'status': attendance.status,
            'time_in': attendance.time_in.isoformat() if attendance.time_in else None,
            'time_out': attendance.time_out.isoformat() if attendance.time_out else None,
            'amount_earned': float(attendance.amount_earned),
            'worker_confirmed': attendance.worker_confirmed,
            'client_confirmed': attendance.client_confirmed,
            'payment_processed': attendance.payment_processed,
            'notes': attendance.notes,
        })
    
    return {
        'success': True,
        'job_id': job_id,
        'daily_rate': float(job.daily_rate_agreed or 0),
        'records': records,
        'total_records': len(records)
    }


@router.get("/{job_id}/daily/summary", auth=dual_auth)
def get_daily_job_summary(request, job_id: int):
    """
    Get a comprehensive summary of a daily-rate job.
    Includes attendance stats, payment info, and pending requests.
    """
    from jobs.daily_payment_service import DailyPaymentService
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    if job.payment_model != 'DAILY':
        return Response({"error": "This job is not a daily-rate job"}, status=400)
    
    return DailyPaymentService.get_daily_summary(job)


@router.post("/{job_id}/daily/extension", auth=dual_auth)
def request_daily_extension(request, job_id: int, data: RequestExtensionSchema):
    """
    Request an extension for a daily job.
    Requires mutual approval from both client and worker/agency.
    
    Required fields:
        - additional_days: int
        - reason: str
    """
    from jobs.daily_payment_service import DailyPaymentService
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    if job.payment_model != 'DAILY':
        return Response({"error": "This job is not a daily-rate job"}, status=400)
    
    additional_days = data.additional_days
    reason = data.reason
    
    if not additional_days or additional_days < 1:
        return Response({"error": "additional_days must be at least 1"}, status=400)
    
    if not reason:
        return Response({"error": "reason is required"}, status=400)
    
    # Determine who is requesting
    user = request.auth
    is_client = job.clientID.profileID.accountFK == user
    
    if is_client:
        requested_by = 'CLIENT'
    elif job.assignedAgencyFK and job.assignedAgencyFK.accountFK == user:
        requested_by = 'AGENCY'
    elif job.assignedWorkerID and job.assignedWorkerID.profileID.accountFK == user:
        requested_by = 'WORKER'
    else:
        return Response({"error": "Only the client, worker, or agency can request extensions"}, status=403)
    
    result = DailyPaymentService.request_extension(
        job=job,
        additional_days=additional_days,
        reason=reason,
        requested_by=requested_by,
        user=user
    )
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to request extension')}, status=400)
    
    return result


@router.post("/{job_id}/daily/extension/{extension_id}/approve", auth=dual_auth)
def approve_daily_extension(request, job_id: int, extension_id: int):
    """
    Approve an extension request.
    When both parties approve, additional escrow is collected and job is extended.
    """
    from jobs.daily_payment_service import DailyPaymentService
    from accounts.models import DailyJobExtension
    
    try:
        extension = DailyJobExtension.objects.get(
            extensionID=extension_id,
            jobID__jobID=job_id
        )
    except DailyJobExtension.DoesNotExist:
        return Response({"error": "Extension request not found"}, status=404)
    
    job = extension.jobID
    user = request.auth
    
    # Determine approver type
    is_client = job.clientID.profileID.accountFK == user
    
    if is_client:
        approver_type = 'CLIENT'
    elif job.assignedAgencyFK and job.assignedAgencyFK.accountFK == user:
        approver_type = 'AGENCY'
    elif job.assignedWorkerID and job.assignedWorkerID.profileID.accountFK == user:
        approver_type = 'WORKER'
    else:
        return Response({"error": "Only the client, worker, or agency can approve extensions"}, status=403)
    
    result = DailyPaymentService.approve_extension(extension, approver_type, user)
    
    if not result.get('success'):
        status_code = 402 if result.get('needs_top_up') else 400
        return Response({"error": result.get('error', 'Failed to approve extension')}, status=status_code)
    
    return result


@router.get("/{job_id}/daily/extensions", auth=dual_auth)
def get_daily_extensions(request, job_id: int):
    """
    Get all extension requests for a daily job.
    """
    from accounts.models import DailyJobExtension
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    extensions = DailyJobExtension.objects.filter(jobID=job).order_by('-created_at')
    
    records = []
    for ext in extensions:
        records.append({
            'extension_id': ext.extensionID,
            'additional_days': ext.additional_days,
            'additional_escrow': float(ext.additional_escrow),
            'reason': ext.reason,
            'requested_by': ext.requested_by,
            'status': ext.status,
            'client_approved': ext.client_approved,
            'worker_approved': ext.worker_approved,
            'created_at': ext.created_at.isoformat(),
        })
    
    return {
        'success': True,
        'job_id': job_id,
        'extensions': records,
        'total': len(records)
    }


@router.post("/{job_id}/daily/rate-change", auth=dual_auth)
def request_rate_change(request, job_id: int, data: RequestRateChangeSchema):
    """
    Request a rate change for a daily job.
    Requires mutual approval from both client and worker/agency.
    
    Required fields:
        - new_rate: float/decimal (new daily rate)
        - reason: str
        - effective_date: str (YYYY-MM-DD)
    """
    from jobs.daily_payment_service import DailyPaymentService
    from datetime import date
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    if job.payment_model != 'DAILY':
        return Response({"error": "This job is not a daily-rate job"}, status=400)
    
    new_rate = data.new_rate
    reason = data.reason
    effective_date_str = data.effective_date
    
    if not new_rate or Decimal(str(new_rate)) <= 0:
        return Response({"error": "new_rate must be positive"}, status=400)
    
    if not reason:
        return Response({"error": "reason is required"}, status=400)
    
    if not effective_date_str:
        return Response({"error": "effective_date is required"}, status=400)
    
    try:
        effective_date = date.fromisoformat(effective_date_str)
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
    
    # Determine who is requesting
    user = request.auth
    is_client = job.clientID.profileID.accountFK == user
    
    if is_client:
        requested_by = 'CLIENT'
    elif job.assignedAgencyFK and job.assignedAgencyFK.accountFK == user:
        requested_by = 'AGENCY'
    elif job.assignedWorkerID and job.assignedWorkerID.profileID.accountFK == user:
        requested_by = 'WORKER'
    else:
        return Response({"error": "Only the client, worker, or agency can request rate changes"}, status=403)
    
    result = DailyPaymentService.request_rate_change(
        job=job,
        new_rate=Decimal(str(new_rate)),
        reason=reason,
        effective_date=effective_date,
        requested_by=requested_by,
        user=user
    )
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to request rate change')}, status=400)
    
    return result


@router.post("/{job_id}/daily/rate-change/{change_id}/approve", auth=dual_auth)
def approve_rate_change(request, job_id: int, change_id: int):
    """
    Approve a rate change request.
    When both parties approve, job rate is updated and escrow adjusted.
    """
    from jobs.daily_payment_service import DailyPaymentService
    from accounts.models import DailyRateChange
    
    try:
        rate_change = DailyRateChange.objects.get(
            changeID=change_id,
            jobID__jobID=job_id
        )
    except DailyRateChange.DoesNotExist:
        return Response({"error": "Rate change request not found"}, status=404)
    
    job = rate_change.jobID
    user = request.auth
    
    # Determine approver type
    is_client = job.clientID.profileID.accountFK == user
    
    if is_client:
        approver_type = 'CLIENT'
    elif job.assignedAgencyFK and job.assignedAgencyFK.accountFK == user:
        approver_type = 'AGENCY'
    elif job.assignedWorkerID and job.assignedWorkerID.profileID.accountFK == user:
        approver_type = 'WORKER'
    else:
        return Response({"error": "Only the client, worker, or agency can approve rate changes"}, status=403)
    
    result = DailyPaymentService.approve_rate_change(rate_change, approver_type, user)
    
    if not result.get('success'):
        status_code = 402 if result.get('needs_top_up') else 400
        return Response({"error": result.get('error', 'Failed to approve rate change')}, status=status_code)
    
    return result


@router.get("/{job_id}/daily/rate-changes", auth=dual_auth)
def get_rate_changes(request, job_id: int):
    """
    Get all rate change requests for a daily job.
    """
    from accounts.models import DailyRateChange
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    rate_changes = DailyRateChange.objects.filter(jobID=job).order_by('-created_at')
    
    records = []
    for change in rate_changes:
        records.append({
            'change_id': change.changeID,
            'old_rate': float(change.old_rate),
            'new_rate': float(change.new_rate),
            'reason': change.reason,
            'effective_date': str(change.effective_date),
            'requested_by': change.requested_by,
            'status': change.status,
            'client_approved': change.client_approved,
            'worker_approved': change.worker_approved,
            'escrow_adjustment_amount': float(change.escrow_adjustment_amount),
            'created_at': change.created_at.isoformat(),
        })
    
    return {
        'success': True,
        'job_id': job_id,
        'rate_changes': records,
        'total': len(records)
    }


@router.post("/{job_id}/daily/cancel", auth=dual_auth)
def cancel_daily_job(request, job_id: int, data: CancelDailyJobSchema):
    """
    Cancel remaining days of a daily job.
    Refunds unused escrow to client.
    
    Required fields:
        - reason: str
    """
    from jobs.daily_payment_service import DailyPaymentService
    
    try:
        job = Job.objects.get(jobID=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    if job.payment_model != 'DAILY':
        return Response({"error": "This job is not a daily-rate job"}, status=400)
    
    reason = data.reason
    if not reason:
        return Response({"error": "reason is required"}, status=400)
    
    # Determine who is cancelling
    user = request.auth
    is_client = job.clientID.profileID.accountFK == user
    
    if is_client:
        cancelled_by = 'CLIENT'
    elif job.assignedAgencyFK and job.assignedAgencyFK.accountFK == user:
        cancelled_by = 'AGENCY'
    elif job.assignedWorkerID and job.assignedWorkerID.profileID.accountFK == user:
        cancelled_by = 'WORKER'
    else:
        return Response({"error": "Only the client, worker, or agency can cancel jobs"}, status=403)
    
    result = DailyPaymentService.cancel_remaining_days(
        job=job,
        reason=reason,
        cancelled_by=cancelled_by,
        user=user
    )
    
    if not result.get('success'):
        return Response({"error": result.get('error', 'Failed to cancel job')}, status=400)
    
    return result


@router.get("/daily/escrow-estimate", auth=dual_auth)
def get_daily_escrow_estimate(request, job_id: int = None, daily_rate: float = None, num_workers: int = 1, num_days: int = None):
    """
    Calculate escrow estimate for a daily job.
    Can be used before job creation to show client the cost.
    
    Query params:
        - daily_rate: float (required if no job_id)
        - num_workers: int (default 1)
        - num_days: int (required if no job_id)
    
    Or provide job_id to get estimate for an existing job.
    """
    from jobs.daily_payment_service import DailyPaymentService
    
    if job_id:
        try:
            job = Job.objects.get(jobID=job_id)
            daily_rate = float(job.daily_rate_agreed or 0)
            num_workers = job.total_workers_needed or 1
            num_days = job.duration_days or 0
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)
    
    if not daily_rate or not num_days:
        return Response({"error": "daily_rate and num_days are required"}, status=400)
    
    if daily_rate <= 0:
        return Response({"error": "daily_rate must be positive"}, status=400)
    
    if num_days < 1:
        return Response({"error": "num_days must be at least 1"}, status=400)
    
    result = DailyPaymentService.calculate_daily_escrow(
        Decimal(str(daily_rate)),
        num_workers,
        num_days
    )
    
    # Convert Decimals to floats for JSON
    return {
        'success': True,
        'daily_rate': float(result['daily_rate']),
        'num_workers': result['num_workers'],
        'num_days': result['num_days'],
        'escrow_amount': float(result['escrow_amount']),
        'platform_fee': float(result['platform_fee']),
        'total_required': float(result['total_required']),
        'breakdown': f"₱{result['daily_rate']} × {result['num_workers']} workers × {result['num_days']} days = ₱{result['escrow_amount']} + ₱{result['platform_fee']} fee = ₱{result['total_required']} total"
    }

# endregion

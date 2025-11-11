from ninja import Router, File
from ninja.responses import Response
from ninja.files import UploadedFile
from accounts.authentication import cookie_auth
from accounts.models import ClientProfile, Specializations, Profile, WorkerProfile, JobApplication, JobPhoto, Wallet, Transaction
from accounts.xendit_service import XenditService
from .models import JobPosting
from .schemas import CreateJobPostingSchema, JobPostingResponseSchema, JobApplicationSchema, SubmitReviewSchema, ApproveJobCompletionSchema
from datetime import datetime
from django.utils import timezone
from decimal import Decimal
from django.db import transaction as db_transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

router = Router()


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


@router.post("/create", auth=cookie_auth, response=JobPostingResponseSchema)
def create_job_posting(request, data: CreateJobPostingSchema):
    """
    Create a new job posting
    Only clients can create job postings
    """
    try:
        print(f"📝 Job posting creation request from {request.auth.email}")
        print(f"📋 Request data: {data.dict()}")
        
        # Check user's profile type first
        try:
            profile = Profile.objects.get(accountFK=request.auth)
            print(f"👤 User profile type: {profile.profileType}")
        except Profile.DoesNotExist:
            print("❌ No profile found")
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
        
        print(f"💰 Payment breakdown:")
        print(f"   Total Budget: ₱{data.budget}")
        print(f"   Downpayment (50%): ₱{downpayment}")
        print(f"   Remaining (50%): ₱{remaining_payment}")
        
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
            # Check if client has sufficient balance for escrow
            if wallet.balance < downpayment:
                return Response(
                    {
                        "error": "Insufficient wallet balance",
                        "required": float(downpayment),
                        "available": float(wallet.balance),
                        "message": f"You need ₱{downpayment} for the escrow payment, but only have ₱{wallet.balance}. Please deposit more funds or use GCash payment."
                    },
                    status=400
                )
            
            # Use database transaction to ensure atomicity
            with db_transaction.atomic():
                # Deduct escrow from wallet balance
                wallet.balance -= downpayment
                wallet.save()
                
                print(f"💸 Deducted ₱{downpayment} from wallet. New balance: ₱{wallet.balance}")
                
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
                    status=JobPosting.JobStatus.ACTIVE
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
                
                print(f"✅ Job posting created: ID={job_posting.jobID}, Title='{job_posting.title}'")
                print(f"✅ Escrow transaction completed: ID={escrow_transaction.transactionID}")

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
        
        elif payment_method == "GCASH":
            # Use database transaction to ensure atomicity
            with db_transaction.atomic():
                # Create job posting first (with escrowPaid=False)
                job_posting = JobPosting.objects.create(
                    clientID=client_profile,
                    title=data.title,
                    description=data.description,
                    categoryID=category,
                    budget=data.budget,
                    escrowAmount=downpayment,
                    escrowPaid=False,  # Will be marked true after Xendit payment
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
            try:
                profile = Profile.objects.get(accountFK=request.auth)
                user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or request.auth.email
            except Profile.DoesNotExist:
                user_name = request.auth.email
            
            # Create Xendit invoice for escrow payment
            print(f"💳 Creating Xendit invoice for escrow payment...")
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
                "payment_method": "GCASH",
                "job_posting_id": job_posting.jobID,
                "escrow_amount": float(downpayment),
                "remaining_payment": float(remaining_payment),
                "invoice_url": xendit_result['invoice_url'],
                "invoice_id": xendit_result['invoice_id'],
                "transaction_id": escrow_transaction.transactionID,
                "message": f"Job created. Please complete the ₱{downpayment} escrow payment via GCash."
            }
        
        else:
            return Response(
                {"error": f"Invalid payment method: {payment_method}. Use 'WALLET' or 'GCASH'."},
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
            user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or request.auth.email
        except Profile.DoesNotExist:
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


@router.get("/my-jobs", auth=cookie_auth)
def get_my_job_postings(request):
    """
    Get all job postings created by the current client
    """
    try:
        print(f"📋 Fetching job postings for {request.auth.email}")
        
        # Get user's profile
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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
                for photo in job.photos.all()
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
        
        # Verify worker profile exists
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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
                for photo in job.photos.all()
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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
                    for photo in job.photos.all()
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
                    for photo in job.photos.all()
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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
                    for photo in job.photos.all()
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
                    for photo in job.photos.all()
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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
            for photo in job.photos.all()
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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


@router.post("/{job_id}/accept", auth=cookie_auth)
def accept_job(request, job_id: int):
    """
    Agency accepts a job posting
    Only agencies can accept jobs (not apply like workers)
    This creates a relationship between the agency and the job
    """
    try:
        print(f"🏢 Agency {request.auth.email} accepting job {job_id}")
        
        # Verify user is an agency
        from accounts.models import Agency
        try:
            agency = Agency.objects.get(accountFK=request.auth)
        except Agency.DoesNotExist:
            return Response(
                {"error": "Only agencies can accept jobs. Individual workers should apply instead."},
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
        
        # Check if job is still active
        if job.status != JobPosting.JobStatus.ACTIVE:
            return Response(
                {"error": "This job is no longer available for acceptance"},
                status=400
            )
        
        # For now, we'll send a notification to the client about agency interest
        # Future: Add AgencyJobAcceptance model to track agency-job relationships
        from accounts.models import Notification
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="AGENCY_INTEREST",
            title=f"Agency Interested in '{job.title}'",
            message=f"Agency '{agency.businessName}' has expressed interest in your job posting. They will contact you to discuss details.",
            relatedJobID=job.jobID
        )
        print(f"📬 Notification sent to client {job.clientID.profileID.accountFK.email}")
        
        # Send notification to agency confirming their interest
        Notification.objects.create(
            accountFK=request.auth,
            notificationType="JOB_ACCEPTANCE_CONFIRMED",
            title=f"Interest Registered for '{job.title}'",
            message=f"Your interest in this job has been communicated to the client. They may reach out to discuss further details.",
            relatedJobID=job.jobID
        )

        return {
            "success": True,
            "message": "Job acceptance registered successfully. The client has been notified.",
            "job_id": job.jobID,
            "job_title": job.title
        }
        
    except Exception as e:
        print(f"❌ Error accepting job: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to accept job: {str(e)}"},
            status=500
        )


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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
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


#region JOB IMAGE UPLOAD

@router.post("/{job_id}/upload-image", auth=cookie_auth)
def upload_job_image(request, job_id: int, image: UploadedFile = File(...)):
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
        
        user = request.auth
        
        # Validate job exists and user owns it
        try:
            profile = Profile.objects.get(accountFK=user)
            client_profile = ClientProfile.objects.get(profileID=profile)
            job = JobPosting.objects.get(jobID=job_id, clientID=client_profile)
        except (Profile.DoesNotExist, ClientProfile.DoesNotExist):
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


@router.post("/{job_id}/mark-complete", auth=cookie_auth)
def worker_mark_job_complete(request, job_id: int):
    """
    Worker marks the job as complete (phase 1 of two-phase completion)
    Sets workerMarkedComplete=True and timestamp
    Notifies client to verify completion
    """
    try:
        print(f"✅ Worker marking job {job_id} as complete")
        
        # Get worker's profile
        try:
            worker_profile = WorkerProfile.objects.select_related('profileID__accountFK').get(
                profileID__accountFK=request.auth
            )
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Worker profile not found"},
                status=400
            )
        
        # Get the job
        try:
            job = JobPosting.objects.select_related('clientID__profileID__accountFK').get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job not found"},
                status=404
            )
        
        # Verify worker is assigned to this job
        if not job.assignedWorkerID or job.assignedWorkerID.profileID.profileID != worker_profile.profileID.profileID:
            return Response(
                {"error": "You are not assigned to this job"},
                status=403
            )
        
        # Verify job is in progress
        if job.status != "IN_PROGRESS":
            return Response(
                {"error": f"Job must be IN_PROGRESS to mark as complete. Current status: {job.status}"},
                status=400
            )
        
        # Check if already marked complete by worker
        if job.workerMarkedComplete:
            return Response(
                {"error": "You have already marked this job as complete"},
                status=400
            )
        
        # Mark as complete by worker
        job.workerMarkedComplete = True
        job.workerMarkedCompleteAt = timezone.now()
        job.save()

        print(f"✅ Worker marked job {job_id} as complete. Waiting for client approval.")

        # Create notification for the client
        from accounts.models import Notification
        worker_name = f"{worker_profile.profileID.firstName} {worker_profile.profileID.lastName}"
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


@router.post("/{job_id}/approve-completion", auth=cookie_auth)
def client_approve_job_completion(request, job_id: int, data: ApproveJobCompletionSchema):
    """
    Client approves job completion and selects payment method
    Payment methods: GCASH (online) or CASH (manual with proof upload)
    
    Request body (optional):
    {
        "payment_method": "GCASH" | "CASH"  // Optional, defaults to GCASH
    }
    """
    try:
        print(f"✅ Client approving job {job_id} completion")
        
        # Get payment method from request body (default to WALLET)
        payment_method = data.payment_method.upper() if data.payment_method else 'WALLET'
        if payment_method not in ['WALLET', 'GCASH', 'CASH']:
            return Response(
                {"error": "Invalid payment method. Choose WALLET, GCASH, or CASH"},
                status=400
            )
        
        print(f"💳 Payment method selected: {payment_method}")
        
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
        
        # Mark as complete by client and save payment method
        job.clientMarkedComplete = True
        job.clientMarkedCompleteAt = timezone.now()
        job.finalPaymentMethod = payment_method
        job.paymentMethodSelectedAt = timezone.now()
        job.save()

        print(f"✅ Client approved job {job_id} completion with {payment_method} payment.")

        # Create notification for the worker
        from accounts.models import Notification
        client_name = f"{client_profile.profileID.firstName} {client_profile.profileID.lastName}"
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
            'payment_method': payment_method,
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
                "payment_method": payment_method,
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
                
                print(f"💸 Deducted ₱{remaining_amount} from wallet. New balance: ₱{wallet.balance}")
                
                # Create transaction record
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
                
                # Mark payment as completed
                job.remainingPaymentPaid = True
                job.remainingPaymentPaidAt = timezone.now()
                job.status = "COMPLETED"
                job.save()

                print(f"✅ Job {job_id} marked as COMPLETED via WALLET payment")

                # Create payment notification for the worker
                Notification.objects.create(
                    accountFK=job.assignedWorkerID.profileID.accountFK,
                    notificationType="PAYMENT_RELEASED",
                    title=f"Payment Received! 💰",
                    message=f"You received ₱{remaining_amount} payment for '{job.title}'. The job is now complete!",
                    relatedJobID=job.jobID
                )
                print(f"📬 Payment notification sent to worker {job.assignedWorkerID.profileID.accountFK.email}")

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
                    "new_wallet_balance": float(wallet.balance)
                }
            
            # Handle CASH payment (manual with proof upload)
            if payment_method == 'CASH':
                print(f"💵 Cash payment selected - client needs to upload proof")
                return {
                    "success": True,
                    "message": "Job completion approved! Please upload proof of cash payment.",
                    "job_id": job_id,
                    "worker_marked_complete": job.workerMarkedComplete,
                    "client_marked_complete": job.clientMarkedComplete,
                    "status": job.status,
                    "payment_method": "CASH",
                    "requires_payment": True,
                    "requires_proof_upload": True,
                    "payment_amount": float(remaining_amount),
                    "prompt_review": False,  # Only after admin approves proof
                    "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None
                }
            
            # Handle GCASH payment (online via Xendit)
            from accounts.xendit_service import XenditService
            
            # Get or create wallet for client
            wallet, _ = Wallet.objects.get_or_create(
                accountFK=client_profile.profileID.accountFK,
                defaults={'balance': 0}
            )
            
            # Create a transaction record for the remaining payment
            transaction = Transaction.objects.create(
                walletID=wallet,
                transactionType="PAYMENT",
                amount=remaining_amount,
                balanceAfter=wallet.balance,  # Balance won't change yet (pending)
                status="PENDING",
                description=f"Remaining payment for job: {job.title} (GCash)",
                referenceNumber=f"JOB-{job.jobID}-FINAL-GCASH-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                relatedJobPosting=job
            )
            
            # Generate Xendit invoice
            client_name = f"{client_profile.profileID.firstName} {client_profile.profileID.lastName}".strip() or "Client"
            invoice_result = XenditService.create_gcash_payment(
                amount=float(remaining_amount),
                user_email=client_profile.profileID.accountFK.email,
                user_name=client_name,
                transaction_id=transaction.transactionID
            )
            
            if invoice_result:
                print(f"✅ Xendit invoice created for final payment: {invoice_result['invoice_id']}")
                
                # Store invoice details in transaction
                transaction.referenceNumber = f"{transaction.referenceNumber}-{invoice_result['invoice_id']}"
                transaction.save()
                
                return {
                    "success": True,
                    "message": "Job completion approved! Please complete the GCash payment.",
                    "job_id": job_id,
                    "worker_marked_complete": job.workerMarkedComplete,
                    "client_marked_complete": job.clientMarkedComplete,
                    "status": job.status,
                    "payment_method": "GCASH",
                    "requires_payment": True,
                    "requires_proof_upload": False,
                    "invoice_url": invoice_result["invoice_url"],
                    "invoice_id": invoice_result["invoice_id"],
                    "payment_amount": float(remaining_amount),
                    "prompt_review": False,  # Only after payment
                    "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None
                }
            else:
                # If invoice creation fails, allow proceeding without payment
                print(f"⚠️ Xendit invoice creation failed, allowing review without payment")
                return {
                    "success": True,
                    "message": "Job completion approved! Payment processing unavailable, please contact support.",
                    "job_id": job_id,
                    "worker_marked_complete": job.workerMarkedComplete,
                    "client_marked_complete": job.clientMarkedComplete,
                    "status": job.status,
                    "payment_method": "GCASH",
                    "requires_payment": False,
                    "payment_error": True,
                    "prompt_review": True,
                    "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None
                }
                
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
        
        # Upload to Supabase storage
        try:
            from django.conf import settings
            import uuid
            
            supabase = settings.SUPABASE
            file_extension = proof_image.name.split('.')[-1]
            file_name = f"cash_proofs/{job_id}_{uuid.uuid4().hex}.{file_extension}"
            
            # Upload file
            result = supabase.storage.from_('job-images').upload(
                file_name,
                proof_image.read(),
                {'content-type': proof_image.content_type}
            )
            
            # Get public URL
            proof_url = supabase.storage.from_('job-images').get_public_url(file_name)
            
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


@router.post("/{job_id}/review", auth=cookie_auth)
def submit_job_review(request, job_id: int, data: SubmitReviewSchema):
    """
    Submit a review for a completed job
    Both client and worker can review each other after both mark the job complete
    Can only submit one review per job per person
    """
    try:
        print(f"⭐ Submitting review for job {job_id}")
        
        # Get user's profile
        try:
            profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get the job
        try:
            job = JobPosting.objects.select_related(
                'clientID__profileID',
                'assignedWorkerID__profileID'
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
        
        # Determine reviewer type first to check payment requirement
        is_client = job.clientID.profileID.profileID == profile.profileID
        is_worker = job.assignedWorkerID and job.assignedWorkerID.profileID.profileID == profile.profileID
        
        if not (is_client or is_worker):
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
        
        # Job can be IN_PROGRESS or COMPLETED - we allow reviews once both marked complete
        # The job will transition to COMPLETED after both reviews are submitted
        
        reviewer_profile = profile
        if is_client:
            reviewee_profile = job.assignedWorkerID.profileID
            reviewer_type = "CLIENT"
        else:
            reviewee_profile = job.clientID.profileID
            reviewer_type = "WORKER"
        
        # Validate rating
        if data.rating < 1 or data.rating > 5:
            return Response(
                {"error": "Rating must be between 1 and 5 stars"},
                status=400
            )
        
        # Check if review already exists
        from accounts.models import JobReview
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
    expected_duration: str = None,
    urgency: str = "MEDIUM",
    preferred_start_date: str = None,
    materials_needed: list = None,
    agency_id: int = None,
    worker_id: int = None,
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
        try:
            profile = Profile.objects.get(accountFK=request.auth)
            if profile.profileType != "CLIENT":
                return Response(
                    {"error": "Only clients can create INVITE jobs"},
                    status=403
                )
            client_profile = ClientProfile.objects.get(profileID=profile)
        except (Profile.DoesNotExist, ClientProfile.DoesNotExist):
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
                target_account = assigned_agency.accountFK if assigned_agency else assigned_worker.profileID.accountFK
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
def get_my_invite_jobs(request, invite_status: str = None, page: int = 1, limit: int = 20):
    """
    Get client's INVITE-type jobs with optional invite status filter
    
    Query Parameters:
    - invite_status: Filter by PENDING, ACCEPTED, REJECTED
    - page: Page number
    - limit: Items per page
    """
    try:
        # Verify user is a client
        try:
            profile = Profile.objects.get(accountFK=request.auth)
            if profile.profileType != "CLIENT":
                return Response(
                    {"error": "Only clients can view INVITE jobs"},
                    status=403
                )
            client_profile = ClientProfile.objects.get(profileID=profile)
        except (Profile.DoesNotExist, ClientProfile.DoesNotExist):
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


from ninja import Router, File
from ninja.responses import Response
from ninja.files import UploadedFile
from accounts.authentication import cookie_auth
from accounts.models import ClientProfile, Specializations, Profile, WorkerProfile, JobApplication, JobPhoto, Wallet, Transaction
from accounts.xendit_service import XenditService
from .models import JobPosting
from .schemas import CreateJobPostingSchema, JobPostingResponseSchema, JobApplicationSchema, SubmitReviewSchema
from datetime import datetime
from django.utils import timezone
from decimal import Decimal
from django.db import transaction as db_transaction

router = Router()


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
                "photos": photos
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
        print(f"🔍 Fetching available jobs for {request.auth.email}")
        
        # Get worker's city from the Accounts model (not Profile)
        worker_city = request.auth.city if request.auth.city else None
        print(f"👤 Worker city: {worker_city}")
        
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
        
        print(f"📋 Found {job_postings.count()} active jobs")
        
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
        
        print(f"✅ Sorted: {len(same_city_jobs)} same city, {len(other_jobs)} other cities")
        
        return {
            "success": True,
            "jobs": sorted_jobs,
            "total": len(sorted_jobs),
            "same_city_count": len(same_city_jobs),
            "worker_city": worker_city
        }
        
    except Exception as e:
        print(f"❌ Error fetching available jobs: {str(e)}")
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
        print(f"🔄 Fetching in-progress jobs for {request.auth.email}")
        
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
        
        print(f"✅ Found {len(jobs)} in-progress jobs")
        
        return {
            "success": True,
            "jobs": jobs,
            "total": len(jobs)
        }
        
    except Exception as e:
        print(f"❌ Error fetching in-progress jobs: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch in-progress jobs: {str(e)}"},
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
        JobApplication.objects.filter(
            jobID=job,
            status=JobApplication.ApplicationStatus.PENDING
        ).exclude(
            applicationID=application_id
        ).update(status=JobApplication.ApplicationStatus.REJECTED)
        
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
def client_approve_job_completion(request, job_id: int):
    """
    Client approves job completion (phase 2 of two-phase completion)
    Sets clientMarkedComplete=True
    If both worker and client marked complete, changes status to COMPLETED
    Then both parties can review each other
    """
    try:
        print(f"✅ Client approving job {job_id} completion")
        
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
        
        # Mark as complete by client
        job.clientMarkedComplete = True
        job.clientMarkedCompleteAt = timezone.now()
        job.save()
        
        print(f"✅ Client approved job {job_id} completion.")
        
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
                "requires_payment": False,
                "payment_already_completed": True,
                "prompt_review": True,
                "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None
            }
        
        # Generate Xendit invoice for remaining 50% payment
        try:
            from accounts.xendit_service import XenditService
            
            remaining_amount = job.remainingPayment
            
            # Create a transaction record for the remaining payment
            transaction = Transaction.objects.create(
                accountID=client_profile.profileID.accountFK,
                transactionType="PAYMENT",
                amount=remaining_amount,
                status="PENDING",
                description=f"Remaining payment for job: {job.title}",
                referenceNumber=f"JOB-{job.jobID}-FINAL-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            )
            
            # Generate Xendit invoice
            invoice_result = XenditService.create_gcash_payment(
                amount=float(remaining_amount),
                customer_email=client_profile.profileID.accountFK.email,
                description=f"Final Payment (50%) for Job: {job.title}",
                external_id=f"FINAL-{job.jobID}-{transaction.transactionID}"
            )
            
            if invoice_result:
                print(f"✅ Xendit invoice created for final payment: {invoice_result['invoice_id']}")
                
                # Store invoice details in transaction
                transaction.referenceNumber = f"{transaction.referenceNumber}-{invoice_result['invoice_id']}"
                transaction.save()
                
                return {
                    "success": True,
                    "message": "Job completion approved! Please complete the final payment.",
                    "job_id": job_id,
                    "worker_marked_complete": job.workerMarkedComplete,
                    "client_marked_complete": job.clientMarkedComplete,
                    "status": job.status,
                    "requires_payment": True,
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
                    "requires_payment": False,
                    "payment_error": True,
                    "prompt_review": True,
                    "worker_id": job.assignedWorkerID.profileID.accountFK.accountID if job.assignedWorkerID else None
                }
                
        except Exception as payment_error:
            print(f"⚠️ Error creating payment invoice: {str(payment_error)}")
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
            
            # Update the transaction status to COMPLETED
            Transaction.objects.filter(
                accountID=client_profile.profileID.accountFK,
                description__icontains=f"Remaining payment for job: {job.title}",
                status="PENDING"
            ).update(
                status="COMPLETED",
                timestamp=timezone.now()
            )
        
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


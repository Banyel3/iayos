from ninja import Router
from ninja.responses import Response
from accounts.authentication import cookie_auth
from accounts.models import ClientProfile, Specializations, Profile, WorkerProfile, JobApplication
from .models import JobPosting
from .schemas import CreateJobPostingSchema, JobPostingResponseSchema, JobApplicationSchema
from datetime import datetime
from django.utils import timezone

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
        
        # Create job posting
        job_posting = JobPosting.objects.create(
            clientID=client_profile,
            title=data.title,
            description=data.description,
            categoryID=category,
            budget=data.budget,
            location=data.location,
            expectedDuration=data.expected_duration,
            urgency=data.urgency.upper(),
            preferredStartDate=preferred_start_date,
            materialsNeeded=data.materials_needed if data.materials_needed else [],
            status=JobPosting.JobStatus.ACTIVE
        )
        
        print(f"✅ Job posting created: ID={job_posting.jobID}, Title='{job_posting.title}'")
        
        return {
            "success": True,
            "job_posting_id": job_posting.jobID,
            "message": "Job posting created successfully"
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
        ).select_related('categoryID').order_by('-createdAt')
        
        # Format the response
        jobs = []
        for job in job_postings:
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
                "updated_at": job.updatedAt.isoformat()
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
        ).order_by('-createdAt')
        
        print(f"📋 Found {job_postings.count()} active jobs")
        
        # Format and sort jobs
        jobs = []
        same_city_jobs = []
        other_jobs = []
        
        for job in job_postings:
            # Get client info
            client_profile = job.clientID.profileID
            client_account = client_profile.accountFK
            
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
            ).select_related('categoryID', 'assignedWorkerID__profileID__accountFK').order_by('-updatedAt')
            
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
                    "assigned_worker": worker_info
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
            ).select_related('categoryID', 'clientID__profileID__accountFK').order_by('-updatedAt')
            
            for job in job_postings:
                # Get client info
                client_profile = job.clientID.profileID
                client_account = client_profile.accountFK
                
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
                'clientID__profileID__accountFK'
            ).get(jobID=job_id)
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
            "client": {
                "name": f"{client_profile.firstName} {client_profile.lastName}",
                "city": client_account.city,
                "rating": job.clientID.clientRating if hasattr(job.clientID, 'clientRating') else 4.5,
                "avatar": client_profile.profileImg or "/worker1.jpg",
                "total_jobs_posted": job.clientID.totalJobsPosted if hasattr(job.clientID, 'totalJobsPosted') else 0
            }
        }
        
        print(f"✅ Successfully fetched job posting: {job.title}")
        
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
        
        # Update status to CANCELLED
        job.status = JobPosting.JobStatus.CANCELLED
        job.save()
        
        print(f"✅ Job {job_id} cancelled successfully")
        
        return {
            "success": True,
            "message": "Job posting cancelled successfully",
            "job_id": job_id
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

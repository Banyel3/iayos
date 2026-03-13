# mobile_services.py
# Mobile-specific service layer for optimized API responses

from django.conf import settings
from .models import (
    Accounts, Profile, WorkerProfile, ClientProfile,
    JobPosting, JobApplication, Specializations, JobPhoto, JobReview, Job, Agency,
    JobSkillSlot, JobWorkerAssignment, JobLog
)
from django.db.models import Q, Count, Avg, Prefetch
from django.utils import timezone
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from .services import generateCookie
from decimal import Decimal
from adminpanel.audit_service import log_action


def get_reviewer_info(account: Accounts, profile_type: Optional[str] = None) -> Tuple[str, Optional[str]]:
    """
    Get reviewer name and profile image for an account.
    Handles both regular user profiles and agency accounts.
    
    Args:
        account: The Accounts instance of the reviewer
        profile_type: Optional profile type filter (WORKER/CLIENT)
    
    Returns:
        Tuple of (reviewer_name, reviewer_profile_img)
    """
    reviewer_name = "Anonymous"
    reviewer_img = None
    
    try:
        # First, try to get a regular profile
        if profile_type:
            profile = Profile.objects.filter(accountFK=account, profileType=profile_type).first()
        else:
            profile = Profile.objects.filter(accountFK=account).first()
        
        if profile:
            reviewer_name = f"{profile.firstName} {profile.lastName}".strip()
            reviewer_img = profile.profileImg
            return (reviewer_name, reviewer_img)
        
        # If no profile found, check if this is an agency account
        agency = Agency.objects.filter(accountFK=account).first()
        if agency:
            reviewer_name = agency.businessName or "Agency"
            # Agencies don't have profile images in the same way, 
            # but could potentially add agency logo in the future
    except Exception:
        pass
    
    return (reviewer_name, reviewer_img)


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometers using Haversine formula.

    Module-level function so it can be reused by get_mobile_job_list and get_mobile_job_detail.
    """
    from math import radians, sin, cos, sqrt, atan2
    if not all([lat1, lon1, lat2, lon2]):
        return None

    R = 6371  # Earth's radius in kilometers

    lat1_rad = radians(float(lat1))
    lon1_rad = radians(float(lon1))
    lat2_rad = radians(float(lat2))
    lon2_rad = radians(float(lon2))

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def _derive_cancellation_reason(job: JobPosting) -> Optional[str]:
    """Return the best available cancellation reason for legacy/partial records."""
    direct_reason = (job.cancellationReason or "").strip()
    if direct_reason:
        return direct_reason

    try:
        log = JobLog.objects.filter(
            jobID=job,
            newStatus=JobPosting.JobStatus.CANCELLED,
        ).order_by('-createdAt').first()

        if not log or not log.notes:
            return None

        notes = str(log.notes).strip()
        if not notes:
            return None

        lower_notes = notes.lower()
        marker = 'reason='
        marker_index = lower_notes.rfind(marker)
        if marker_index != -1:
            parsed = notes[marker_index + len(marker):].strip(' ;.')
            if parsed:
                return parsed

        return notes
    except Exception:
        return None


def get_mobile_job_list(
    user: Accounts,
    category_id: Optional[int] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    location: Optional[str] = None,
    max_distance: Optional[float] = None,  # NEW: Distance filter in km
    sort_by: Optional[str] = None,  # NEW: Manual sort option
    page: int = 1,
    limit: int = 20,
) -> Dict[str, Any]:
    """
    Get paginated job listings optimized for mobile
    Returns minimal fields for list view performance
    
    NEW PARAMETERS:
    - max_distance: Filter jobs within X kilometers (requires user location)
    - sort_by: Manual sorting - 'distance_asc', 'distance_desc', 'budget_asc', 
               'budget_desc', 'created_desc', 'urgency_desc'
    """
    from math import radians, sin, cos, sqrt, atan2
    
    try:
        # Get user's location for distance calculation
        user_lat = None
        user_lon = None
        try:
            # Get profile_type from JWT if available, otherwise default to WORKER
            profile_type = getattr(user, 'profile_type', 'WORKER')
            
            # For dual profiles, use profile_type to fetch correct profile
            user_profile = Profile.objects.filter(
                accountFK=user,
                profileType=profile_type
            ).first()
            
            # Fallback: if specified profile not found, try WORKER profile (job browsing is worker-centric)
            if not user_profile:
                user_profile = Profile.objects.filter(
                    accountFK=user,
                    profileType='WORKER'
                ).first()
            
            if user_profile and user_profile.latitude and user_profile.longitude:
                user_lat = user_profile.latitude
                user_lon = user_profile.longitude
                print(f"📍 [LOCATION] User location ({profile_type}): {user_lat}, {user_lon}")
        except Exception as e:
            print(f"⚠️ [LOCATION] Could not fetch user location: {e}")
            pass
        
        # Exclude jobs this worker has already applied to
        applied_job_ids = JobApplication.objects.filter(
            workerID__profileID__accountFK=user
        ).values_list('jobID', flat=True)

        # Base query - only ACTIVE jobs that are LISTING type (exclude INVITE/direct hire jobs)
        queryset = JobPosting.objects.filter(
            status='ACTIVE',
            jobType='LISTING',  # Only show public job listings, not direct invites
            assignedWorkerID__isnull=True,  # Exclude jobs that already have a worker
            assignedAgencyFK__isnull=True,  # Exclude jobs assigned to agencies
        ).exclude(
            clientID__profileID__accountFK=user  # Exclude jobs posted by the same user
        ).exclude(
            jobID__in=applied_job_ids  # Exclude jobs the worker has already applied to
        )

        # Apply filters
        if category_id:
            queryset = queryset.filter(categoryID=category_id)

        if min_budget:
            queryset = queryset.filter(budget__gte=min_budget)

        if max_budget:
            queryset = queryset.filter(budget__lte=max_budget)

        if location:
            queryset = queryset.filter(location__icontains=location)

        # Optimize queries with select_related and prefetch_related
        queryset = queryset.select_related(
            'clientID__profileID__accountFK',
            'categoryID'
        ).prefetch_related(
            'photos'
        )

        # Get all jobs first (we'll sort by distance in memory if user has location)
        all_jobs = list(queryset)
        
        # Calculate distances and add to jobs if user has location
        jobs_with_distance = []
        for job in all_jobs:
            # Check if current user has applied
            has_applied = False
            try:
                # Get profile_type from JWT if available, default to WORKER
                profile_type = getattr(user, 'profile_type', 'WORKER')
                profile = Profile.objects.filter(
                    accountFK=user,
                    profileType=profile_type
                ).first()
                
                if profile and hasattr(profile, 'workerprofile'):
                    has_applied = JobApplication.objects.filter(
                        jobID=job,
                        workerID__profileID__accountFK=user
                    ).exists()
            except Exception:
                pass

            # Get client info
            client_profile = job.clientID.profileID
            client_name = f"{client_profile.firstName} {client_profile.lastName}" if client_profile else "Unknown Client"
            
            # Get job location coordinates from client's profile (not from Job model)
            job_lat = client_profile.latitude if client_profile else None
            job_lon = client_profile.longitude if client_profile else None
            
            # Calculate distance if both user and job have coordinates
            distance = None
            if user_lat and user_lon and job_lat and job_lon:
                distance = calculate_distance(user_lat, user_lon, job_lat, job_lon)
                
            # NEW: Apply distance filter if specified
            if max_distance is not None:
                if distance is None or distance > max_distance:
                    continue  # Skip this job if outside radius or no location
            
            # NEW: Map urgency to numeric values for sorting
            urgency_value = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3}.get(job.urgency, 0)

            # Calculate team job stats if applicable
            team_workers_needed = 0
            team_workers_assigned = 0
            team_fill_percentage = 0
            if job.is_team_job:
                skill_slots = JobSkillSlot.objects.filter(jobID=job)
                for slot in skill_slots:
                    team_workers_needed += slot.workers_needed
                    team_workers_assigned += slot.worker_assignments.filter(
                        assignment_status__in=['ACTIVE', 'COMPLETED']
                    ).count()
                if team_workers_needed > 0:
                    team_fill_percentage = round((team_workers_assigned / team_workers_needed) * 100, 1)

            job_data = {
                'id': job.jobID,
                'title': job.title,
                'budget': float(job.budget),
                'location': job.location,
                'latitude': float(job_lat) if job_lat else None,
                'longitude': float(job_lon) if job_lon else None,
                'distance': round(distance, 2) if distance else None,
                'urgency_level': job.urgency,
                'status': job.status,
                'created_at': job.createdAt.isoformat(),
                'category_name': job.categoryID.specializationName if job.categoryID else "General",
                'client_name': client_name,
                'client_avatar': client_profile.profileImg if client_profile and client_profile.profileImg else None,
                'is_applied': has_applied,
                'expected_duration': job.expectedDuration,
                'is_team_job': job.is_team_job,  # Team job indicator
                # Team job stats (for list view)
                'total_workers_needed': team_workers_needed if job.is_team_job else None,
                'total_workers_assigned': team_workers_assigned if job.is_team_job else None,
                'team_fill_percentage': team_fill_percentage if job.is_team_job else None,
                # Daily payment model fields
                'payment_model': getattr(job, 'payment_model', 'PROJECT'),
                'daily_rate_agreed': float(job.daily_rate_agreed) if hasattr(job, 'daily_rate_agreed') and job.daily_rate_agreed else None,
                'duration_days': job.duration_days if hasattr(job, 'duration_days') else None,
                'actual_start_date': job.actual_start_date.isoformat() if hasattr(job, 'actual_start_date') and job.actual_start_date else None,
                'total_days_worked': job.total_days_worked if hasattr(job, 'total_days_worked') else None,
                'daily_escrow_total': float(job.daily_escrow_total) if hasattr(job, 'daily_escrow_total') and job.daily_escrow_total else None,
                # Sorting helpers
                '_distance_sort': distance if distance is not None else 999999,
                '_urgency_sort': urgency_value,
                '_created_sort': job.createdAt.timestamp(),
            }
            jobs_with_distance.append(job_data)
        
        # NEW: Apply manual sorting if specified, otherwise auto-sort by distance
        if sort_by == 'distance_asc':
            jobs_with_distance.sort(key=lambda x: x['_distance_sort'])
            print(f"📍 [SORT] Sorted by distance (nearest first)")
        elif sort_by == 'distance_desc':
            jobs_with_distance.sort(key=lambda x: x['_distance_sort'], reverse=True)
            print(f"📍 [SORT] Sorted by distance (farthest first)")
        elif sort_by == 'budget_asc':
            jobs_with_distance.sort(key=lambda x: x['budget'])
            print(f"💰 [SORT] Sorted by budget (lowest first)")
        elif sort_by == 'budget_desc':
            jobs_with_distance.sort(key=lambda x: x['budget'], reverse=True)
            print(f"💰 [SORT] Sorted by budget (highest first)")
        elif sort_by == 'created_desc':
            jobs_with_distance.sort(key=lambda x: x['_created_sort'], reverse=True)
            print(f"🕒 [SORT] Sorted by date (newest first)")
        elif sort_by == 'urgency_desc':
            jobs_with_distance.sort(key=lambda x: x['_urgency_sort'], reverse=True)
            print(f"🔴 [SORT] Sorted by urgency (highest first)")
        elif user_lat and user_lon:
            # Default: auto-sort by distance if user has location
            jobs_with_distance.sort(key=lambda x: x['_distance_sort'])
            print(f"📍 [SORT] Auto-sorted by distance (default)")
        else:
            # Fallback: sort by creation date
            jobs_with_distance.sort(key=lambda x: x['_created_sort'], reverse=True)
            print(f"🕒 [SORT] Sorted by date (no location)")
        
        # Remove the sorting helper fields
        for job in jobs_with_distance:
            del job['_distance_sort']
            del job['_urgency_sort']
            del job['_created_sort']
        
        # Apply pagination after sorting
        total_count = len(jobs_with_distance)
        start = (page - 1) * limit
        end = start + limit
        job_list = jobs_with_distance[start:end]

        total_pages = (total_count + limit - 1) // limit
        has_next = end < total_count
        has_prev = page > 1

        return {
            'success': True,
            'data': {
                'jobs': job_list,
                'total': total_count,
                'page': page,
                'limit': limit,
                'total_pages': total_pages,
                'totalPages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev,
                'hasNext': has_next,
                'hasPrev': has_prev,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total_count': total_count,
                    'total_pages': total_pages,
                    'has_next': has_next,
                    'has_prev': has_prev,
                }
            }
        }

    except Exception as e:
        print(f"[ERROR] get_mobile_job_list failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to fetch jobs: {str(e)}'
        }


def get_mobile_job_detail(job_id: int, user: Accounts) -> Dict[str, Any]:
    # Get complete job details for mobile view.
    # Includes user-specific data (is_applied, user's application).
    print(f"🔍 [SERVICE] get_mobile_job_detail called")
    print(f"   Job ID: {job_id}, User: {user.email}")
    
    try:
        job = JobPosting.objects.select_related(
            'categoryID',
            'clientID__profileID__accountFK',
            'assignedWorkerID__profileID__accountFK'
        ).prefetch_related(
            'photos'
        ).get(jobID=job_id)
        
        print(f"   ✓ Job found: {job.title}")
        print(f"   Job status: {job.status}")
        print(f"   Client Profile ID: {job.clientID.profileID.accountFK.accountID if job.clientID else 'None'}")

        # Get client info with dynamic rating
        client_profile = job.clientID.profileID
        client_account = job.clientID.profileID.accountFK
        
        # Calculate client average rating from reviews for their CLIENT profile
        from .models import JobReview
        from django.db.models import Avg
        
        # First try profile-based filtering
        client_reviews = JobReview.objects.filter(
            revieweeProfileID=client_profile,
            status='ACTIVE'
        )
        # Fallback for old reviews
        if not client_reviews.exists():
            client_reviews = JobReview.objects.filter(
                revieweeID=client_account,
                reviewerType='WORKER',  # Reviews from workers about this client
                status='ACTIVE'
            )
        client_avg_rating = client_reviews.aggregate(Avg('rating'))['rating__avg']
        client_rating = float(client_avg_rating) if client_avg_rating else 0.0
        
        client_data = {
            'id': job.clientID.profileID.accountFK.accountID,
            'name': f"{client_profile.firstName} {client_profile.lastName}" if client_profile else "Unknown",
            'avatar': client_profile.profileImg if client_profile and client_profile.profileImg else None,
            'rating': round(client_rating, 2),
            'phone': client_profile.contactNum if client_profile and client_profile.contactNum else None,
        }

        # Get job photos
        photos = [photo.photoURL for photo in job.photos.all()]

        # Check if user has applied
        user_application = None
        has_applied = False

        # Get user's worker profile if exists
        user_worker_profile = None
        try:
            # Get profile_type from JWT if available, default to WORKER
            profile_type = getattr(user, 'profile_type', 'WORKER')
            profile = Profile.objects.filter(
                accountFK=user,
                profileType=profile_type
            ).first()
            
            if profile and hasattr(profile, 'workerprofile'):
                user_worker_profile = profile.workerprofile
        except Exception:
            pass

        if user_worker_profile:
            try:
                application = JobApplication.objects.get(
                    jobID=job,
                    workerID=user_worker_profile
                )
                has_applied = True
                user_application = {
                    'applicationID': application.applicationID,
                    'status': application.status,
                    'proposal_message': application.proposalMessage,
                    'proposed_budget': float(application.proposedBudget) if application.proposedBudget else float(job.budget),
                    'created_at': application.createdAt.isoformat(),
                }
            except JobApplication.DoesNotExist:
                pass

        # Get applications count
        applications_count = JobApplication.objects.filter(jobID=job).count()

        # Parse materials needed (stored as JSON string)
        import json
        materials_needed = None
        if job.materialsNeeded:
            try:
                materials_needed = json.loads(job.materialsNeeded) if isinstance(job.materialsNeeded, str) else job.materialsNeeded
            except:
                materials_needed = [job.materialsNeeded]
        
        # Get assigned worker info for INVITE jobs (direct hire)
        assigned_worker = None
        if job.jobType == 'INVITE' and job.assignedWorkerID:
            # Use the assignedWorkerID directly from the job
            try:
                worker_profile = job.assignedWorkerID.profileID
                worker_account = worker_profile.accountFK
                
                # Calculate worker average rating for their WORKER profile
                worker_reviews = JobReview.objects.filter(
                    revieweeProfileID=worker_profile,
                    status='ACTIVE'
                )
                # Fallback for old reviews
                if not worker_reviews.exists():
                    worker_reviews = JobReview.objects.filter(
                        revieweeID=worker_account,
                        reviewerType='CLIENT',  # Reviews from clients about this worker
                        status='ACTIVE'
                    )
                worker_avg_rating = worker_reviews.aggregate(Avg('rating'))['rating__avg']
                worker_rating = float(worker_avg_rating) if worker_avg_rating else 0.0
                
                assigned_worker = {
                    'id': job.assignedWorkerID.id,
                    'name': f"{worker_profile.firstName} {worker_profile.lastName}" if worker_profile else "Unknown",
                    'avatar': worker_profile.profileImg if worker_profile and worker_profile.profileImg else None,
                    'rating': round(worker_rating, 2),
                    'phone': worker_profile.contactNum if worker_profile and worker_profile.contactNum else None,
                }
                print(f"   ✓ Assigned worker: {assigned_worker['name']}, Rating: {worker_rating:.2f}")
            except Exception as e:
                print(f"   ⚠️ Could not fetch assigned worker: {str(e)}")

        # Get assigned agency info for agency-handled jobs
        assigned_agency = None
        if job.assignedAgencyFK:
            try:
                agency = job.assignedAgencyFK
                
                # Calculate agency average rating
                agency_reviews = JobReview.objects.filter(
                    revieweeID=agency.accountFK,
                    status='ACTIVE'
                )
                agency_avg_rating = agency_reviews.aggregate(Avg('rating'))['rating__avg']
                agency_rating = float(agency_avg_rating) if agency_avg_rating else 0.0
                
                assigned_agency = {
                    'id': agency.agencyId,
                    'name': agency.businessName or "Unknown Agency",
                    'logo': agency.logo if agency and agency.logo else None,
                    'rating': round(agency_rating, 2),
                    'workers_assigned': job.worker_assignments.filter(
                        assignment_status__in=['ACTIVE', 'COMPLETED']
                    ).count() if hasattr(job, 'worker_assignments') else 0,
                }
                print(f"   ✓ Assigned agency: {assigned_agency['name']}, Workers: {assigned_agency['workers_assigned']}")
            except Exception as e:
                print(f"   ⚠️ Could not fetch assigned agency: {str(e)}")

        # Capture completed-job reviews (client ↔ worker)
        reviews_payload = None
        if job.status == 'COMPLETED':
            print("   🔎 Fetching job reviews for completed job...")
            profile_cache: Dict[int, Dict[str, Any]] = {}

            def build_account_snapshot(account: Accounts) -> Optional[Dict[str, Any]]:
                if account is None:
                    return None
                cached = profile_cache.get(account.accountID)
                if cached:
                    return cached

                profile = Profile.objects.filter(accountFK=account).first()
                name = "" if not profile else f"{profile.firstName or ''} {profile.lastName or ''}".strip()
                snapshot = {
                    'id': account.accountID,
                    'name': name or account.email,
                    'avatar': profile.profileImg if profile and profile.profileImg else None,
                }
                profile_cache[account.accountID] = snapshot
                return snapshot

            client_to_worker = None
            worker_to_client = None
            reviews_qs = JobReview.objects.filter(jobID=job, status='ACTIVE').select_related('reviewerID', 'revieweeID')
            for review in reviews_qs:
                # Skip reviews with missing reviewer or reviewee
                if not review.reviewerID or not review.revieweeID:
                    print(f"   ⚠️ Skipping review {review.reviewID} - missing reviewer or reviewee")
                    continue
                    
                formatted_review = {
                    'rating': float(review.rating) if review.rating is not None else None,
                    'comment': review.comment,
                    'created_at': review.createdAt.isoformat() if review.createdAt else None,
                    'reviewer_type': review.reviewerType,
                    'reviewer': build_account_snapshot(review.reviewerID),
                    'reviewee': build_account_snapshot(review.revieweeID),
                }

                if review.reviewerType == JobReview.ReviewerType.CLIENT:
                    client_to_worker = formatted_review
                elif review.reviewerType == JobReview.ReviewerType.WORKER:
                    worker_to_client = formatted_review

            if client_to_worker or worker_to_client:
                reviews_payload = {
                    'client_to_worker': client_to_worker,
                    'worker_to_client': worker_to_client,
                }

        # Get ML prediction for estimated completion time
        ml_prediction = None
        try:
            from ml.prediction_service import predict_for_job_instance
            prediction = predict_for_job_instance(job)
            if prediction and prediction.get('predicted_hours') is not None:
                ml_prediction = {
                    'predicted_hours': prediction.get('predicted_hours'),
                    'confidence_interval_lower': prediction.get('confidence_interval', (None, None))[0],
                    'confidence_interval_upper': prediction.get('confidence_interval', (None, None))[1],
                    'confidence_level': prediction.get('confidence_level', 0.0),
                    'formatted_duration': prediction.get('formatted_duration', 'Unknown'),
                    'source': prediction.get('source', 'fallback'),
                    'is_low_confidence': prediction.get('confidence_level', 0.0) < 0.5,
                }
                print(f"   ✓ ML Prediction: {ml_prediction['formatted_duration']} (confidence: {ml_prediction['confidence_level']:.0%})")
        except Exception as e:
            print(f"   ⚠️ ML prediction error: {str(e)}")

        # Calculate distance from requesting user to job location
        job_distance = None
        try:
            profile_type = getattr(user, 'profile_type', 'WORKER')
            user_profile_for_dist = Profile.objects.filter(
                accountFK=user, profileType=profile_type
            ).first()
            if not user_profile_for_dist:
                user_profile_for_dist = Profile.objects.filter(
                    accountFK=user, profileType='WORKER'
                ).first()
            if user_profile_for_dist and user_profile_for_dist.latitude and user_profile_for_dist.longitude:
                # Job location coordinates from the client profile
                job_lat = client_profile.latitude if client_profile else None
                job_lon = client_profile.longitude if client_profile else None
                if job_lat and job_lon:
                    job_distance = calculate_distance(
                        user_profile_for_dist.latitude, user_profile_for_dist.longitude,
                        job_lat, job_lon
                    )
                    if job_distance is not None:
                        job_distance = round(job_distance, 1)
        except Exception as e:
            print(f"   ⚠️ Distance calculation error: {e}")

        cancellation_reason = _derive_cancellation_reason(job)

        worker_marked_on_the_way = bool(getattr(job, 'workerMarkedOnTheWay', False))
        worker_marked_on_the_way_at = getattr(job, 'workerMarkedOnTheWayAt', None)
        worker_marked_job_started = bool(getattr(job, 'workerMarkedJobStarted', False))
        worker_marked_job_started_at = getattr(job, 'workerMarkedJobStartedAt', None)
        client_confirmed_work_started = bool(getattr(job, 'clientConfirmedWorkStarted', False))
        client_confirmed_work_started_at = getattr(job, 'clientConfirmedWorkStartedAt', None)

        cancelled_at = getattr(job, 'cancelledAt', None)
        cancelled_by_role = getattr(job, 'cancelledByRole', None)
        cancellation_stage = getattr(job, 'cancellationStage', None)
        client_refund_amount = getattr(job, 'clientRefundAmount', Decimal('0.00'))
        worker_compensation_amount = getattr(job, 'workerCompensationAmount', Decimal('0.00'))
        job_data = {
            'id': job.jobID,
            'title': job.title,
            'description': job.description,
            'budget': float(job.budget),
            'location': job.location,
            'distance': job_distance,
            'expected_duration': job.expectedDuration,
            'urgency_level': job.urgency,
            'preferred_start_date': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
            'materials_needed': materials_needed,
            'photos': photos,
            'status': job.status,
            'created_at': job.createdAt.isoformat(),
            'job_type': job.jobType,
            'is_team_job': job.is_team_job,  # Team job indicator
            'category': {
                'id': job.categoryID.specializationID if job.categoryID else None,
                'name': job.categoryID.specializationName if job.categoryID else "General",
            },
            'client': client_data,
            'assigned_worker': assigned_worker,
            'assigned_agency': assigned_agency,  # Agency info for agency-handled jobs
            'applications_count': applications_count,
            'is_applied': has_applied,
            'user_application': user_application,
            'escrow_paid': job.escrowPaid,
            'remaining_payment_paid': job.remainingPaymentPaid,
            'downpayment_amount': float(job.budget * Decimal('0.5')),
            'remaining_amount': float(job.budget * Decimal('0.5')),
            'worker_marked_on_the_way': worker_marked_on_the_way,
            'worker_marked_on_the_way_at': worker_marked_on_the_way_at.isoformat() if worker_marked_on_the_way_at else None,
            'worker_marked_job_started': worker_marked_job_started,
            'worker_marked_job_started_at': worker_marked_job_started_at.isoformat() if worker_marked_job_started_at else None,
            'client_confirmed_work_started': client_confirmed_work_started,
            'client_confirmed_work_started_at': client_confirmed_work_started_at.isoformat() if client_confirmed_work_started_at else None,
            'cancelled_at': cancelled_at.isoformat() if cancelled_at else None,
            'cancelled_by_role': cancelled_by_role,
            'cancellation_stage': cancellation_stage,
            'cancellation_reason': cancellation_reason,
            'client_refund_amount': float(client_refund_amount or 0),
            'worker_compensation_amount': float(worker_compensation_amount or 0),
            'estimated_completion': ml_prediction,
            # Universal job fields for ML accuracy
            'job_scope': job.job_scope,
            'skill_level_required': job.skill_level_required,
            'work_environment': job.work_environment,
            # Daily payment model fields
            'payment_model': getattr(job, 'payment_model', 'PROJECT'),
            'daily_rate_agreed': float(job.daily_rate_agreed) if hasattr(job, 'daily_rate_agreed') and job.daily_rate_agreed else None,
            'duration_days': job.duration_days if hasattr(job, 'duration_days') else None,
            'actual_start_date': job.actual_start_date.isoformat() if hasattr(job, 'actual_start_date') and job.actual_start_date else None,
            'total_days_worked': job.total_days_worked if hasattr(job, 'total_days_worked') else None,
            'daily_escrow_total': float(job.daily_escrow_total) if hasattr(job, 'daily_escrow_total') and job.daily_escrow_total else None,
        }

        # Add team job data if this is a team job
        if job.is_team_job:
            print(f"   🔧 Fetching team job data...")
            from jobs.team_job_services import get_team_job_detail
            team_detail = get_team_job_detail(job.jobID, user)
            
            if 'error' not in team_detail:
                job_data.update({
                    'skill_slots': team_detail.get('skill_slots', []),
                    'worker_assignments': team_detail.get('worker_assignments', []),
                    'team_fill_percentage': team_detail.get('team_fill_percentage', 0),
                    'total_workers_needed': team_detail.get('total_workers_needed', 0),
                    'total_workers_assigned': team_detail.get('total_workers_assigned', 0),
                    'budget_allocation_type': team_detail.get('budget_allocation_type'),
                    'team_start_threshold': team_detail.get('team_start_threshold', 100),
                    'can_start': team_detail.get('can_start', False),
                })
                print(f"   ✅ Team job data: {len(job_data.get('skill_slots', []))} slots, {job_data.get('total_workers_assigned', 0)}/{job_data.get('total_workers_needed', 0)} workers")
            else:
                print(f"   ⚠️ Team job detail fetch error: {team_detail.get('error')}")
                # Still provide empty arrays so UI can handle gracefully
                job_data.update({
                    'skill_slots': [],
                    'worker_assignments': [],
                    'team_fill_percentage': 0,
                    'total_workers_needed': 0,
                    'total_workers_assigned': 0,
                    'budget_allocation_type': None,
                    'team_start_threshold': 100,
                    'can_start': False,
                })

        if reviews_payload:
            job_data['reviews'] = reviews_payload

        print(f"   ✅ Returning job data: ID={job_data['id']}, Title={job_data['title']}")
        return {
            'success': True,
            'data': job_data
        }

    except JobPosting.DoesNotExist:
        print(f"   ❌ Job {job_id} not found in database")
        return {
            'success': False,
            'error': 'Job not found'
        }
    except Exception as e:
        print(f"   ❌ Exception in get_mobile_job_detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to fetch job details: {str(e)}'
        }


def create_mobile_job(user: Accounts, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create job posting from mobile app
    Handles payment and returns job_id with payment instructions
    """
    try:
        # Get user's client profile
        client_profile = None
        try:
            # Get profile_type from JWT if available, default to CLIENT
            profile_type = getattr(user, 'profile_type', 'CLIENT')
            profile = Profile.objects.filter(
                accountFK=user,
                profileType=profile_type
            ).first()
            
            if not profile:
                return {'success': False, 'error': 'Profile not found'}
            
            if hasattr(profile, 'clientprofile'):
                client_profile = profile.clientprofile
        except Exception:
            return {'success': False, 'error': 'Failed to get client profile'}

        if not client_profile:
            return {
                'success': False,
                'error': 'Client profile not found. Please select your role first.'
            }

        # Validate budget
        budget = Decimal(str(job_data['budget']))
        if budget <= 0:
            return {
                'success': False,
                'error': 'Budget must be greater than 0'
            }

        # Calculate downpayment (50%) + platform commission (10%) - matches web implementation
        escrow_amount = budget * Decimal('0.5')  # 50% escrow
        commission_fee = budget * Decimal('0.10')  # 10% platform fee (consistent with web)
        downpayment_amount = escrow_amount + commission_fee  # Total: 60%

        # Get category
        category = None
        if job_data.get('category_id'):
            try:
                category = Specializations.objects.get(specializationID=job_data['category_id'])
            except Specializations.DoesNotExist:
                return {
                    'success': False,
                    'error': 'Invalid category'
                }

        # Parse materials needed to JSON
        import json
        materials_json = None
        if job_data.get('materials_needed'):
            materials_json = json.dumps(job_data['materials_needed'])

        # Create job posting
        job = JobPosting.objects.create(
            clientID=client_profile,
            title=job_data['title'],
            description=job_data['description'],
            budget=budget,
            location=job_data.get('location'),
            expectedDuration=job_data.get('expected_duration', 'Not specified'),
            urgency=job_data.get('urgency_level', 'MEDIUM'),
            preferredStartDate=datetime.fromisoformat(job_data['preferred_start_date']) if job_data.get('preferred_start_date') else None,
            scheduled_end_date=datetime.strptime(job_data['scheduled_end_date'], "%Y-%m-%d").date() if job_data.get('scheduled_end_date') else None,
            materialsNeeded=materials_json,
            categoryID=category,
            status='PENDING_PAYMENT',  # Will change to ACTIVE after payment
            escrowAmount=escrow_amount,  # 50% held in escrow
            remainingPayment=escrow_amount,  # 50% remaining payment (no commission on final)
            # Universal job fields for ML accuracy - use values from request (model has defaults if None)
            job_scope=job_data.get('job_scope'),
            skill_level_required=job_data.get('skill_level_required'),
            work_environment=job_data.get('work_environment'),
        )

        # Handle payment based on method
        payment_method = job_data.get('downpayment_method', 'WALLET').upper()
        payment_result = None

        if payment_method == 'WALLET':
            # Process wallet payment - RESERVE funds for LISTING jobs
            try:
                from .models import Wallet, Transaction
                from django.db import transaction as db_transaction
                
                # Get or create wallet
                wallet, created = Wallet.objects.get_or_create(
                    accountFK=user,
                    defaults={'balance': Decimal('0.00'), 'reservedBalance': Decimal('0.00')}
                )
                
                # Calculate platform fee (10% of total budget) - matches web implementation
                platform_fee = budget * Decimal('0.10')
                total_to_charge = escrow_amount + platform_fee
                
                print(f"📱 [Mobile Job] Creating LISTING job for user {user.email}")
                print(f"   Budget: ₱{budget}, Escrow: ₱{escrow_amount}, Platform Fee: ₱{platform_fee}")
                print(f"   Total to reserve: ₱{total_to_charge}")
                print(f"   Wallet balance: ₱{wallet.balance}, Reserved: ₱{wallet.reservedBalance}, Available: ₱{wallet.availableBalance}")
                
                # Check available balance (balance - already reserved)
                if wallet.availableBalance < total_to_charge:
                    job.delete()  # Rollback job creation
                    return {
                        'success': False,
                        'error': 'Insufficient wallet balance',
                        'required': float(total_to_charge),
                        'available': float(wallet.availableBalance),
                        'message': f'You need ₱{total_to_charge:.2f} but only have ₱{wallet.availableBalance:.2f} available.'
                    }
                
                with db_transaction.atomic():
                    # RESERVE funds (don't deduct yet) - funds held until worker is accepted
                    wallet.reservedBalance += total_to_charge
                    wallet.save()
                    
                    print(f"   ✅ Reserved ₱{total_to_charge} - New reserved balance: ₱{wallet.reservedBalance}")
                    
                    # Update job status - NOT escrowPaid yet (will be marked when worker accepts)
                    job.escrowPaid = False  # Will be True when worker is accepted
                    job.status = 'ACTIVE'
                    job.downpaymentMethod = 'WALLET'
                    job.save()
                    
                    # Create PENDING transactions (will be COMPLETED when worker accepts)
                    Transaction.objects.create(
                        walletID=wallet,
                        transactionType=Transaction.TransactionType.PAYMENT,
                        amount=escrow_amount,
                        balanceAfter=wallet.balance,
                        status=Transaction.TransactionStatus.PENDING,
                        description=f"Escrow payment (50%) for job: {job.title}",
                        relatedJobPosting=job,
                        referenceNumber=f"ESCROW-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                    )
                    
                    Transaction.objects.create(
                        walletID=wallet,
                        transactionType=Transaction.TransactionType.FEE,
                        amount=platform_fee,
                        balanceAfter=wallet.balance,
                        status=Transaction.TransactionStatus.PENDING,
                        description=f"Platform fee (10%) for job: {job.title}",
                        relatedJobPosting=job,
                        referenceNumber=f"FEE-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                    )
                
                payment_result = {
                    'payment_method': 'WALLET',
                    'status': 'RESERVED',
                    'message': f'₱{total_to_charge:.2f} reserved in escrow. Funds will be held when a worker is accepted.',
                    'reserved_amount': float(total_to_charge),
                    'new_available_balance': float(wallet.availableBalance),
                }

            except Exception as e:
                import traceback
                traceback.print_exc()
                job.delete()  # Rollback
                return {
                    'success': False,
                    'error': f'Wallet payment failed: {str(e)}'
                }
        else:
            # Invalid payment method
            job.delete()  # Rollback
            return {
                'success': False,
                'error': 'Invalid payment method. Only WALLET is supported for job postings.'
            }

        return {
            'success': True,
            'data': {
                'job_id': job.jobID,
                'title': job.title,
                'budget': float(job.budget),
                'escrow_amount': float(escrow_amount),
                'commission_fee': float(commission_fee),
                'downpayment_amount': float(downpayment_amount),
                'status': job.status,
                'payment': payment_result,
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Job creation failed: {str(e)}'
        }


def create_mobile_invite_job(user: Accounts, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create INVITE-type job (direct worker/agency hiring) from mobile
    - 50% + 5% commission downpayment held in escrow
    - Worker/agency can accept or reject the invite
    - Payment: WALLET or GCASH
    """
    try:
        from .models import Profile, ClientProfile, WorkerProfile, Agency, Job, Wallet, Transaction, Specializations, Notification
        from django.db import transaction as db_transaction
        from django.utils import timezone
        from decimal import Decimal
        from datetime import datetime
        
        # Get user's client profile
        try:
            # Get profile_type from JWT if available, default to CLIENT
            profile_type = getattr(user, 'profile_type', 'CLIENT')
            profile = Profile.objects.filter(
                accountFK=user,
                profileType=profile_type
            ).first()
            
            if not profile:
                return {'success': False, 'error': 'Profile not found'}
            
            if profile.profileType != "CLIENT":
                return {'success': False, 'error': 'Only clients can create invite jobs'}
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return {'success': False, 'error': 'Client profile not found'}
        except Exception:
            return {'success': False, 'error': 'Failed to get client profile'}
        
        # Validate that either worker_id or agency_id is provided (not both)
        worker_id = job_data.get('worker_id')
        agency_id = job_data.get('agency_id')
        
        if not worker_id and not agency_id:
            return {'success': False, 'error': 'Must provide either worker_id or agency_id'}
        if worker_id and agency_id:
            return {'success': False, 'error': 'Cannot invite both worker and agency'}
        
        # Verify worker or agency exists
        assigned_worker = None
        assigned_agency = None
        invite_target_name = ""
        target_account = None
        
        if worker_id:
            try:
                assigned_worker = WorkerProfile.objects.get(profileID__profileID=worker_id)
                invite_target_name = f"{assigned_worker.profileID.firstName} {assigned_worker.profileID.lastName}"
                target_account = assigned_worker.profileID.accountFK
                
                # CRITICAL: Prevent users from inviting themselves (self-hiring)
                if target_account == user:
                    return {'success': False, 'error': 'You cannot hire yourself for a job'}
                
            except WorkerProfile.DoesNotExist:
                return {'success': False, 'error': 'Worker not found'}
        
        if agency_id:
            try:
                assigned_agency = Agency.objects.get(agencyId=agency_id)
                invite_target_name = assigned_agency.businessName
                target_account = assigned_agency.accountFK
                
                # Verify agency KYC status
                from agency.models import AgencyKYC
                try:
                    kyc = AgencyKYC.objects.get(agencyID=assigned_agency)
                    if kyc.status != "APPROVED":
                        return {'success': False, 'error': f'Agency KYC status is {kyc.status}. Can only invite APPROVED agencies.'}
                except AgencyKYC.DoesNotExist:
                    return {'success': False, 'error': 'Agency has not completed KYC verification'}
            except Agency.DoesNotExist:
                return {'success': False, 'error': 'Agency not found'}
        
        # Handle skill_slots for multi-employee agency invites
        skill_slots_data = job_data.get('skill_slots', [])
        is_multi_employee = bool(skill_slots_data) and agency_id
        
        # Validate category or skill_slots (backwards compatibility)
        category = None
        category_id = job_data.get('category_id')
        
        if is_multi_employee:
            # Multi-employee mode: validate skill slots
            if len(skill_slots_data) == 0:
                return {'success': False, 'error': 'At least one skill slot is required for multi-employee mode'}
            
            total_workers = sum(slot.get('workers_needed', 1) for slot in skill_slots_data)
            if total_workers < 1:
                return {'success': False, 'error': 'Total workers needed must be at least 1'}
            if total_workers > 20:
                return {'success': False, 'error': 'Maximum 20 workers per job'}
            
            # Validate each slot's specialization exists
            for slot in skill_slots_data:
                spec_id = slot.get('specialization_id')
                if not spec_id:
                    return {'success': False, 'error': 'Each skill slot must have a specialization_id'}
                try:
                    Specializations.objects.get(specializationID=spec_id)
                except Specializations.DoesNotExist:
                    return {'success': False, 'error': f'Invalid specialization_id: {spec_id}'}
                
                workers_needed = slot.get('workers_needed', 1)
                if workers_needed < 1 or workers_needed > 10:
                    return {'success': False, 'error': 'workers_needed must be between 1 and 10'}
            
            # Use first slot's specialization as job category (for compatibility)
            category = Specializations.objects.get(specializationID=skill_slots_data[0]['specialization_id'])
            print(f"📋 Multi-employee mode: {len(skill_slots_data)} skill slots, {total_workers} total workers")
        else:
            # Single-employee mode: Auto-derive or validate category from worker's skills
            # Import workerSpecialization for skill lookup
            from .models import workerSpecialization
            
            if assigned_worker:
                # Get worker's skills (specializations)
                worker_skills = workerSpecialization.objects.filter(
                    workerID=assigned_worker
                ).select_related('specializationID')
                worker_skill_ids = [ws.specializationID.specializationID for ws in worker_skills]
                
                if len(worker_skill_ids) == 0:
                    return {'success': False, 'error': 'Worker has no skills registered. They must add at least one skill to receive job invites.'}
                
                if not category_id:
                    # Auto-select if worker has exactly 1 skill
                    if len(worker_skill_ids) == 1:
                        category = worker_skills.first().specializationID
                        print(f"📋 Auto-selected category '{category.specializationName}' from worker's single skill")
                    else:
                        # Worker has multiple skills - frontend should show picker
                        skill_names = [ws.specializationID.specializationName for ws in worker_skills]
                        return {
                            'success': False,
                            'error': 'Worker has multiple skills. Please select which skill this job requires.',
                            'worker_skills': worker_skill_ids,
                            'skill_names': skill_names
                        }
                else:
                    # Validate category matches one of worker's skills
                    if category_id not in worker_skill_ids:
                        skill_names = [ws.specializationID.specializationName for ws in worker_skills]
                        return {
                            'success': False,
                            'error': f"Selected category doesn't match worker's skills. Worker's skills: {', '.join(skill_names)}",
                            'worker_skills': worker_skill_ids
                        }
                    try:
                        category = Specializations.objects.get(specializationID=category_id)
                    except Specializations.DoesNotExist:
                        return {'success': False, 'error': 'Invalid category'}
            else:
                # Agency job without skill_slots - require category_id (backwards compatibility)
                if not category_id:
                    return {'success': False, 'error': 'category_id is required for single-employee mode'}
                try:
                    category = Specializations.objects.get(specializationID=category_id)
                except Specializations.DoesNotExist:
                    return {'success': False, 'error': 'Invalid category'}
        
        # Validate budget
        budget = Decimal(str(job_data.get('budget', 0)))
        if budget <= 0:
            return {'success': False, 'error': 'Budget must be greater than 0'}
        
        # Calculate escrow (50%) + commission (10%)
        escrow_amount = budget * Decimal('0.5')
        commission_fee = budget * settings.PLATFORM_FEE_RATE
        downpayment_amount = escrow_amount + commission_fee  # 60% total
        remaining_payment = budget * Decimal('0.5')
        
        print(f"💰 Budget: ₱{budget} | Escrow: ₱{escrow_amount} | Commission: ₱{commission_fee} | Downpayment: ₱{downpayment_amount}")
        
        # Parse preferred start date
        preferred_start_date_obj = None
        preferred_start_date_str = job_data.get('preferred_start_date')
        if preferred_start_date_str:
            try:
                preferred_start_date_obj = datetime.strptime(preferred_start_date_str, "%Y-%m-%d").date()
            except ValueError:
                return {'success': False, 'error': 'Invalid preferred_start_date format. Use YYYY-MM-DD'}

        # Parse scheduled end date
        scheduled_end_date_obj = None
        scheduled_end_date_str = job_data.get('scheduled_end_date')
        if scheduled_end_date_str:
            try:
                scheduled_end_date_obj = datetime.strptime(scheduled_end_date_str, "%Y-%m-%d").date()
            except ValueError:
                return {'success': False, 'error': 'Invalid scheduled_end_date format. Use YYYY-MM-DD'}
        
        # Get client wallet
        wallet, created = Wallet.objects.get_or_create(
            accountFK=user,
            defaults={'balance': Decimal('0.00')}
        )
        
        # Handle payment method
        payment_method = job_data.get('downpayment_method', 'WALLET').upper()
        
        if payment_method == "WALLET":
            # Check wallet balance
            if wallet.balance < downpayment_amount:
                return {
                    'success': False,
                    'error': 'Insufficient wallet balance',
                    'data': {
                        'required': float(downpayment_amount),
                        'available': float(wallet.balance),
                        'shortfall': float(downpayment_amount - wallet.balance)
                    }
                }
            
            with db_transaction.atomic():
                # Deduct downpayment from wallet
                wallet.balance -= downpayment_amount
                wallet.save()
                
                # Create INVITE job
                job = Job.objects.create(
                    clientID=client_profile,
                    title=job_data.get('title'),
                    description=job_data.get('description'),
                    categoryID=category,
                    budget=budget,
                    escrowAmount=escrow_amount,
                    escrowPaid=True,
                    escrowPaidAt=timezone.now(),
                    remainingPayment=remaining_payment,
                    location=job_data.get('location', ''),
                    expectedDuration=job_data.get('expected_duration', 'Not specified'),
                    urgency=job_data.get('urgency_level', 'MEDIUM').upper(),
                    preferredStartDate=preferred_start_date_obj,
                    scheduled_end_date=scheduled_end_date_obj,
                    materialsNeeded=job_data.get('materials_needed', []),
                    jobType="INVITE",  # INVITE type job
                    inviteStatus="PENDING",  # Waiting for worker/agency response
                    status="ACTIVE",  # Job created, awaiting acceptance
                    assignedAgencyFK=assigned_agency,
                    assignedWorkerID=assigned_worker,
                    is_team_job=is_multi_employee,  # True if multi-employee mode
                    # Universal job fields for ML accuracy - use values from request (model has defaults if None)
                    job_scope=job_data.get('job_scope'),
                    skill_level_required=job_data.get('skill_level_required'),
                    work_environment=job_data.get('work_environment'),
                    # Defensive initialization for worker timeline markers
                    workerMarkedOnTheWay=False,
                    workerMarkedOnTheWayAt=None,
                    workerMarkedJobStarted=False,
                    workerMarkedJobStartedAt=None,
                )
                
                # Create skill slots for multi-employee agency invites
                if is_multi_employee:
                    from .models import JobSkillSlot
                    for slot_data in skill_slots_data:
                        spec = Specializations.objects.get(specializationID=slot_data['specialization_id'])
                        JobSkillSlot.objects.create(
                            jobID=job,
                            specializationID=spec,
                            workers_needed=slot_data.get('workers_needed', 1),
                            skill_level_required=slot_data.get('skill_level_required', 'ENTRY').upper(),
                            notes=slot_data.get('notes', ''),
                            status='OPEN',
                            budget_allocated=Decimal('0'),  # No per-slot budget allocation - agency handles payroll
                        )
                    print(f"✅ Created {len(skill_slots_data)} skill slots for multi-employee job")
                
                # Create escrow transaction
                Transaction.objects.create(
                    walletID=wallet,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    amount=downpayment_amount,
                    balanceAfter=wallet.balance,
                    status=Transaction.TransactionStatus.COMPLETED,
                    description=f"Escrow payment (50%) + Commission (5%) for INVITE job: {job.title}",
                    relatedJobID=job,
                    completedAt=timezone.now(),
                    referenceNumber=f"INVITE-ESCROW-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                )
                
                # Send notification to worker/agency
                Notification.objects.create(
                    accountFK=target_account,
                    notificationType="JOB_INVITE",
                    title=f"New Job Invitation: {job.title}",
                    message=f"You've been invited to work on '{job.title}'. Budget: ₱{budget}. Review and respond to the invitation.",
                    relatedJobID=job.jobID
                )
                
                # Send confirmation to client
                Notification.objects.create(
                    accountFK=user,
                    notificationType="JOB_INVITE_SENT",
                    title="Job Invitation Sent",
                    message=f"Your invitation to {invite_target_name} for '{job.title}' has been sent. Awaiting their response.",
                    relatedJobID=job.jobID
                )
                
                print(f"✅ INVITE job created: ID={job.jobID}, inviteStatus=PENDING")
            
            return {
                'success': True,
                'data': {
                    'job_posting_id': job.jobID,
                    'job_type': 'INVITE',
                    'invite_status': 'PENDING',
                    'invite_target': invite_target_name,
                    'escrow_paid': True,
                    'escrow_amount': float(escrow_amount),
                    'commission_fee': float(commission_fee),
                    'downpayment_amount': float(downpayment_amount),
                    'new_wallet_balance': float(wallet.balance),
                    'message': f"Invitation sent to {invite_target_name}! ₱{downpayment_amount} deducted from your wallet.",
                    'requires_payment': False
                }
            }
        
        else:
            return {'success': False, 'error': 'Invalid payment method. Only WALLET is supported.'}
    
    except Exception as e:
        print(f"❌ Create invite job error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Invite job creation failed: {str(e)}'
        }


def delete_mobile_job(job_id: int, user: Accounts) -> Dict[str, Any]:
    """
    Delete a job posting (only if not in progress)
    - Only the client who created the job can delete it
    - Cannot delete if status is IN_PROGRESS
    - Fully removes job and related data from database
    """
    try:
        from .models import Job as JobPosting, Profile, ClientProfile, JobApplication, Transaction, Notification
        from django.db import transaction as db_transaction
        
        print(f"🗑️  [DELETE JOB] Starting deletion process...")
        print(f"   Job ID: {job_id}, User: {user.email}")
        
        # Get the job
        try:
            job = JobPosting.objects.select_related(
                'clientID__profileID__accountFK'
            ).get(jobID=job_id)
            print(f"   ✓ Job found: {job.title}, Status: {job.status}")
        except JobPosting.DoesNotExist:
            return {'success': False, 'error': 'Job not found'}
        
        # Verify user is the client who posted the job
        job_owner_account = job.clientID.profileID.accountFK
        if job_owner_account.accountID != user.accountID:
            print(f"   ❌ Permission denied - User {user.accountID} is not job owner {job_owner_account.accountID}")
            return {'success': False, 'error': 'You can only delete your own job postings'}
        
        # Check if job is in progress
        if job.status == 'IN_PROGRESS':
            print(f"   ❌ Cannot delete - Job is IN_PROGRESS")
            return {
                'success': False,
                'error': 'Cannot delete job that is in progress. Please complete or cancel the job first.'
            }
        
        # Begin atomic transaction to delete job and related data
        with db_transaction.atomic():
            job_title = job.title
            
            # Use bulk delete operations for better performance
            # Delete related job applications
            applications_deleted = JobApplication.objects.filter(jobID=job).delete()
            print(f"   🗑️  Deleted {applications_deleted[0]} job applications")
            
            # Delete related notifications
            notifications_deleted = Notification.objects.filter(relatedJobID=job.jobID).delete()
            print(f"   🗑️  Deleted {notifications_deleted[0]} notifications")
            
            # Update transaction descriptions (keep for financial records)
            transaction_count = Transaction.objects.filter(relatedJobPosting=job).update(
                description=f"[JOB DELETED] {job.title}"
            )
            if transaction_count > 0:
                print(f"   📝 Updated {transaction_count} transaction descriptions")
            
            # Delete the job photos (if any)
            photos_deleted = 0
            if hasattr(job, 'photos'):
                photos_deleted = job.photos.all().delete()[0]
                print(f"   🗑️  Deleted {photos_deleted} job photos")
            
            # ======= CRITICAL: Release reserved funds before deletion =======
            refund_amount = Decimal('0.00')
            try:
                from .models import Wallet
                
                wallet = Wallet.objects.get(accountFK=user)
                
                # Calculate total reserved (escrow + platform fee which is 10% of budget)
                escrow_amount = job.escrowAmount or Decimal('0.00')
                # Platform fee is 10% of the total budget
                budget_amount = Decimal(str(job.budget)) if job.budget else Decimal('0.00')
                platform_fee = budget_amount * settings.PLATFORM_FEE_RATE if budget_amount > 0 else Decimal('0.00')
                total_reserved = escrow_amount + platform_fee
                
                if total_reserved > 0:
                    if job.escrowPaid:
                        # Escrow was deducted from balance - refund to main balance
                        wallet.balance += escrow_amount
                        wallet.save()
                        refund_amount = escrow_amount
                        
                        # Create refund transaction
                        Transaction.objects.create(
                            walletID=wallet,
                            amount=escrow_amount,
                            balanceAfter=wallet.balance,
                            transactionType='REFUND',
                            status='COMPLETED',
                            description=f"Escrow refund for deleted job: {job.title}",
                            relatedJobPosting=job,
                            referenceNumber=f"REFUND-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                        )
                        print(f"   💰 Refunded ₱{escrow_amount} to wallet balance")
                    else:
                        # Escrow was reserved but not deducted - release from reservedBalance
                        wallet.reservedBalance -= total_reserved
                        if wallet.reservedBalance < 0:
                            wallet.reservedBalance = Decimal('0.00')
                        wallet.save()
                        refund_amount = total_reserved
                        
                        # Cancel pending transactions
                        Transaction.objects.filter(
                            relatedJobPosting=job,
                            status='PENDING'
                        ).update(status='CANCELLED')
                        print(f"   🔓 Released ₱{total_reserved} from reserved balance")
                    
                    # Create refund notification
                    Notification.objects.create(
                        accountFK=user,
                        notificationType='PAYMENT_REFUNDED',
                        title='Payment Refunded',
                        message=f'Your payment of ₱{refund_amount:,.2f} for job "{job_title}" has been refunded because the job was deleted.',
                        relatedJobID=job.jobID
                    )
                    print(f"   📬 Created refund notification")
                    
            except Wallet.DoesNotExist:
                print(f"   ⚠️ No wallet found for user - skipping refund")
            except Exception as wallet_error:
                print(f"   ⚠️ Wallet refund error: {wallet_error}")
                import traceback
                traceback.print_exc()
                # Continue with deletion even if refund fails - log for manual review
            # ======= END: Release reserved funds =======
            
            # Finally, delete the job itself
            job.delete()
            print(f"   ✅ Job '{job_title}' deleted successfully")
        
        return {
            'success': True,
            'message': f"Job '{job_title}' has been deleted successfully"
        }
    
    except Exception as e:
        print(f"❌ Delete job error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to delete job: {str(e)}'
        }


def update_mobile_job(job_id: int, user: Accounts, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing job posting from mobile app.
    
    Rules:
    - Only the client who created the job can edit it
    - Only ACTIVE jobs can be edited (not IN_PROGRESS or COMPLETED)
    - Budget changes:
      - BLOCKED if job has pending applications (to protect applicant proposals)
      - Budget INCREASES: Check wallet balance, reserve additional funds
      - Budget DECREASES: Release excess reserved funds back to wallet
      - Cannot go below category minimum rate (DOLE compliance)
    - Non-budget edits (title, description, etc.) are allowed even with pending applications
    - All changes are logged to JobLog for audit trail
    - Pending applicants are notified of changes
    """
    try:
        from .models import (
            Job as JobPosting, Profile, ClientProfile, Wallet, Transaction, 
            Notification, Specializations, JobApplication, JobLog
        )
        from django.db import transaction as db_transaction
        from django.utils import timezone
        from decimal import Decimal
        from datetime import datetime
        import json
        
        print(f"📝 [UPDATE JOB] Starting update process...")
        print(f"   Job ID: {job_id}, User: {user.email}")
        print(f"   Fields to update: {list(job_data.keys())}")
        
        # Get the job
        try:
            job = JobPosting.objects.select_related(
                'clientID__profileID__accountFK',
                'categoryID'
            ).get(jobID=job_id)
            print(f"   ✓ Job found: {job.title}, Status: {job.status}")
        except JobPosting.DoesNotExist:
            return {'success': False, 'error': 'Job not found'}
        
        # Verify user is the client who posted the job
        job_owner_account = job.clientID.profileID.accountFK
        if job_owner_account.accountID != user.accountID:
            print(f"   ❌ Permission denied - User {user.accountID} is not job owner {job_owner_account.accountID}")
            return {'success': False, 'error': 'You can only edit your own job postings'}
        
        # Check if job can be edited (only ACTIVE status allowed)
        if job.status != 'ACTIVE':
            print(f"   ❌ Cannot edit - Job status is {job.status}")
            return {
                'success': False,
                'error': f'Cannot edit job with status "{job.status}". Only ACTIVE jobs can be edited.'
            }
        
        # Check if job has accepted/assigned worker
        if job.assignedWorkerID or job.assignedAgencyFK:
            print(f"   ❌ Cannot edit - Job already has assigned worker/agency")
            return {
                'success': False,
                'error': 'Cannot edit job after a worker or agency has been assigned.'
            }
        
        # Check for pending applications (affects what can be edited)
        pending_applications = JobApplication.objects.filter(
            jobID=job,
            status=JobApplication.ApplicationStatus.PENDING
        ).select_related('workerID__profileID__accountFK')
        has_pending_applications = pending_applications.exists()
        pending_count = pending_applications.count()
        
        # If budget change is requested and there are pending applications, block it
        if 'budget' in job_data and job_data['budget'] is not None and has_pending_applications:
            print(f"   ❌ Cannot change budget - Job has {pending_count} pending applications")
            return {
                'success': False,
                'error': f'Cannot change budget when there are {pending_count} pending application(s). '
                         'Applicants have proposed based on the current budget. '
                         'You can still edit other fields like title, description, location, etc.'
            }
        
        # Track changes for notification and logging
        changes = []
        old_values = {}
        new_values = {}
        old_budget = job.budget
        new_budget = None
        budget_difference = Decimal('0.00')
        edit_reason = job_data.get('edit_reason', '')
        
        with db_transaction.atomic():
            # Update title
            if 'title' in job_data and job_data['title'] is not None:
                new_title = str(job_data['title']).strip()
                if len(new_title) < 5:
                    return {'success': False, 'error': 'Title must be at least 5 characters'}
                if len(new_title) > 200:
                    return {'success': False, 'error': 'Title must be less than 200 characters'}
                if job.title != new_title:
                    old_values['title'] = job.title
                    new_values['title'] = new_title
                    changes.append(f"Title: '{job.title}' → '{new_title}'")
                    job.title = new_title
            
            # Update description
            if 'description' in job_data and job_data['description'] is not None:
                new_description = str(job_data['description']).strip()
                if len(new_description) < 20:
                    return {'success': False, 'error': 'Description must be at least 20 characters'}
                if len(new_description) > 2000:
                    return {'success': False, 'error': 'Description must be less than 2000 characters'}
                if job.description != new_description:
                    old_values['description'] = job.description[:100] + '...' if len(job.description) > 100 else job.description
                    new_values['description'] = new_description[:100] + '...' if len(new_description) > 100 else new_description
                    changes.append("Description updated")
                    job.description = new_description
            
            # Update category
            if 'category_id' in job_data and job_data['category_id'] is not None:
                try:
                    new_category = Specializations.objects.get(specializationID=job_data['category_id'])
                    if job.categoryID != new_category:
                        old_cat_name = job.categoryID.specializationName if job.categoryID else 'None'
                        old_values['category'] = old_cat_name
                        new_values['category'] = new_category.specializationName
                        changes.append(f"Category: {old_cat_name} → {new_category.specializationName}")
                        job.categoryID = new_category
                except Specializations.DoesNotExist:
                    return {'success': False, 'error': 'Invalid category'}
            
            # Update budget (most complex - requires wallet adjustment)
            if 'budget' in job_data and job_data['budget'] is not None:
                new_budget = Decimal(str(job_data['budget']))
                if new_budget <= 0:
                    return {'success': False, 'error': 'Budget must be greater than 0'}
                
                # Check DOLE minimum rate for category
                category_min_rate = Decimal('100.00')  # Default minimum
                if job.categoryID and job.categoryID.minimumRate:
                    category_min_rate = job.categoryID.minimumRate
                
                if new_budget < category_min_rate:
                    category_name = job.categoryID.specializationName if job.categoryID else 'this category'
                    return {
                        'success': False,
                        'error': f'Budget cannot be less than ₱{category_min_rate:,.2f} (DOLE minimum rate for {category_name})'
                    }
                
                if new_budget != old_budget:
                    budget_difference = new_budget - old_budget
                    print(f"   💰 Budget change: ₱{old_budget} → ₱{new_budget} (diff: ₱{budget_difference})")
                    
                    # Get wallet
                    try:
                        wallet = Wallet.objects.get(accountFK=user)
                    except Wallet.DoesNotExist:
                        return {'success': False, 'error': 'Wallet not found'}
                    
                    # Calculate new escrow and fee amounts
                    old_escrow = job.escrowAmount or (old_budget * Decimal('0.5'))
                    old_fee = old_budget * settings.PLATFORM_FEE_RATE
                    old_total_reserved = old_escrow + old_fee
                    
                    new_escrow = new_budget * Decimal('0.5')
                    new_fee = new_budget * settings.PLATFORM_FEE_RATE
                    new_total_reserved = new_escrow + new_fee
                    
                    reserve_difference = new_total_reserved - old_total_reserved
                    
                    if budget_difference > 0:
                        # Budget INCREASED - need to reserve more funds
                        additional_needed = reserve_difference
                        
                        # Check if user has enough available balance
                        available = wallet.balance - wallet.reservedBalance
                        if available < additional_needed:
                            return {
                                'success': False,
                                'error': 'Insufficient wallet balance for budget increase',
                                'required_additional': float(additional_needed),
                                'available': float(available),
                                'message': f'You need ₱{additional_needed:.2f} more but only have ₱{available:.2f} available.'
                            }
                        
                        # Reserve additional funds
                        wallet.reservedBalance += additional_needed
                        wallet.save()
                        
                        # Create transaction for additional reservation
                        Transaction.objects.create(
                            walletID=wallet,
                            transactionType=Transaction.TransactionType.PAYMENT,
                            amount=additional_needed,
                            balanceAfter=wallet.balance,
                            status=Transaction.TransactionStatus.PENDING,
                            description=f"Additional escrow for budget increase: {job.title}",
                            relatedJobPosting=job,
                            referenceNumber=f"ESCROW-INC-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                        )
                        
                        print(f"   ✅ Reserved additional ₱{additional_needed} - New reserved: ₱{wallet.reservedBalance}")
                        
                    else:
                        # Budget DECREASED - release excess reserved funds
                        excess_to_release = abs(reserve_difference)
                        
                        # Release from reserved balance
                        wallet.reservedBalance = max(Decimal('0.00'), wallet.reservedBalance - excess_to_release)
                        wallet.save()
                        
                        # Cancel old pending transactions and create new one
                        Transaction.objects.filter(
                            relatedJobPosting=job,
                            status='PENDING'
                        ).update(status='CANCELLED')
                        
                        # Create transaction for the release
                        Transaction.objects.create(
                            walletID=wallet,
                            transactionType=Transaction.TransactionType.REFUND,
                            amount=excess_to_release,
                            balanceAfter=wallet.balance,
                            status=Transaction.TransactionStatus.COMPLETED,
                            description=f"Escrow released for budget decrease: {job.title}",
                            relatedJobPosting=job,
                            referenceNumber=f"ESCROW-DEC-{job.jobID}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                        )
                        
                        print(f"   ✅ Released ₱{excess_to_release} - New reserved: ₱{wallet.reservedBalance}")
                    
                    # Update job budget fields
                    old_values['budget'] = float(old_budget)
                    new_values['budget'] = float(new_budget)
                    job.budget = new_budget
                    job.escrowAmount = new_escrow
                    job.remainingPayment = new_escrow  # Remaining 50%
                    changes.append(f"Budget: ₱{old_budget:,.2f} → ₱{new_budget:,.2f}")
            
            # Update location
            if 'location' in job_data and job_data['location'] is not None:
                new_location = str(job_data['location']).strip()
                if new_location and job.location != new_location:
                    old_values['location'] = job.location
                    new_values['location'] = new_location
                    changes.append(f"Location updated")
                    job.location = new_location
            
            # Update expected duration
            if 'expected_duration' in job_data and job_data['expected_duration'] is not None:
                new_duration = str(job_data['expected_duration']).strip()
                if job.expectedDuration != new_duration:
                    old_values['expected_duration'] = job.expectedDuration
                    new_values['expected_duration'] = new_duration
                    changes.append(f"Duration: {job.expectedDuration or 'Not set'} → {new_duration}")
                    job.expectedDuration = new_duration
            
            # Update urgency
            if 'urgency_level' in job_data and job_data['urgency_level'] is not None:
                new_urgency = str(job_data['urgency_level']).upper()
                if new_urgency not in ['LOW', 'MEDIUM', 'HIGH']:
                    return {'success': False, 'error': 'Invalid urgency level. Must be LOW, MEDIUM, or HIGH'}
                if job.urgency != new_urgency:
                    old_values['urgency'] = job.urgency
                    new_values['urgency'] = new_urgency
                    changes.append(f"Urgency: {job.urgency} → {new_urgency}")
                    job.urgency = new_urgency
            
            # Update preferred start date
            if 'preferred_start_date' in job_data:
                if job_data['preferred_start_date'] is None or job_data['preferred_start_date'] == '':
                    if job.preferredStartDate is not None:
                        old_values['preferred_start_date'] = str(job.preferredStartDate)
                        new_values['preferred_start_date'] = None
                        changes.append("Preferred start date cleared")
                        job.preferredStartDate = None
                else:
                    try:
                        new_date = datetime.fromisoformat(str(job_data['preferred_start_date']).replace('Z', '+00:00'))
                        if job.preferredStartDate != new_date.date():
                            old_values['preferred_start_date'] = str(job.preferredStartDate) if job.preferredStartDate else None
                            new_values['preferred_start_date'] = str(new_date.date())
                            changes.append(f"Start date updated")
                            job.preferredStartDate = new_date
                    except (ValueError, TypeError):
                        return {'success': False, 'error': 'Invalid date format for preferred_start_date'}
            
            # Update materials needed
            if 'materials_needed' in job_data:
                new_materials = job_data['materials_needed']
                if new_materials is None:
                    new_materials = []
                if isinstance(new_materials, list):
                    old_materials_str = json.dumps(job.materialsNeeded or [])
                    new_materials_str = json.dumps(new_materials)
                    if old_materials_str != new_materials_str:
                        old_values['materials_needed'] = job.materialsNeeded or []
                        new_values['materials_needed'] = new_materials
                        changes.append("Materials list updated")
                        job.materialsNeeded = new_materials
            
            # Update universal ML fields
            if 'job_scope' in job_data and job_data['job_scope'] is not None:
                new_scope = str(job_data['job_scope']).upper()
                if new_scope not in ['MINOR_REPAIR', 'MODERATE_PROJECT', 'MAJOR_RENOVATION']:
                    return {'success': False, 'error': 'Invalid job_scope'}
                if job.job_scope != new_scope:
                    old_values['job_scope'] = job.job_scope
                    new_values['job_scope'] = new_scope
                    changes.append(f"Job scope: {job.job_scope} → {new_scope}")
                    job.job_scope = new_scope
            
            if 'skill_level_required' in job_data and job_data['skill_level_required'] is not None:
                new_skill = str(job_data['skill_level_required']).upper()
                if new_skill not in ['ENTRY', 'INTERMEDIATE', 'EXPERT']:
                    return {'success': False, 'error': 'Invalid skill_level_required'}
                if job.skill_level_required != new_skill:
                    old_values['skill_level_required'] = job.skill_level_required
                    new_values['skill_level_required'] = new_skill
                    changes.append(f"Skill level: {job.skill_level_required} → {new_skill}")
                    job.skill_level_required = new_skill
            
            if 'work_environment' in job_data and job_data['work_environment'] is not None:
                new_env = str(job_data['work_environment']).upper()
                if new_env not in ['INDOOR', 'OUTDOOR', 'BOTH']:
                    return {'success': False, 'error': 'Invalid work_environment'}
                if job.work_environment != new_env:
                    old_values['work_environment'] = job.work_environment
                    new_values['work_environment'] = new_env
                    changes.append(f"Environment: {job.work_environment} → {new_env}")
                    job.work_environment = new_env
            
            # Save the job
            job.save()
            print(f"   ✅ Job updated successfully. Changes: {len(changes)}")
            
            # Create JobLog entry for audit trail
            if changes:
                action_type = 'BUDGET_CHANGED' if new_budget is not None and budget_difference != 0 else 'JOB_EDITED'
                JobLog.objects.create(
                    jobID=job,
                    actionType=action_type,
                    oldStatus=job.status,
                    newStatus=job.status,  # Status doesn't change on edit
                    changedBy=user,
                    notes=edit_reason or f"Job edited: {', '.join(changes)}",
                    metadata={
                        'changes': changes,
                        'old_values': old_values,
                        'new_values': new_values,
                        'edit_reason': edit_reason,
                        'budget_difference': float(budget_difference) if budget_difference else 0,
                    }
                )
                print(f"   📋 Created JobLog entry: {action_type}")
            
            # Notify pending applicants about the edit (if any changes and applicants exist)
            if changes and has_pending_applications:
                change_summary = "; ".join(changes[:3])  # Limit to first 3 changes
                if len(changes) > 3:
                    change_summary += f" (+{len(changes) - 3} more)"
                
                for app in pending_applications:
                    Notification.objects.create(
                        accountFK=app.workerID.profileID.accountFK,
                        notificationType='JOB_UPDATED',
                        title=f'Job Updated: {job.title}',
                        message=f'The job "{job.title}" that you applied for has been updated. Changes: {change_summary}. Please review and update your application if needed.',
                        relatedJobID=job.jobID,
                        relatedApplicationID=app.applicationID
                    )
                print(f"   📬 Notified {pending_count} pending applicant(s) about changes")
            
            # Create notification for budget change (for the client)
            if new_budget is not None and budget_difference != 0:
                direction = "increased" if budget_difference > 0 else "decreased"
                Notification.objects.create(
                    accountFK=user,
                    notificationType='JOB_UPDATED',
                    title='Job Budget Updated',
                    message=f'Your job "{job.title}" budget has been {direction} from ₱{old_budget:,.2f} to ₱{new_budget:,.2f}.',
                    relatedJobID=job.jobID
                )
        
        # Get wallet balance for response
        try:
            wallet = Wallet.objects.get(accountFK=user)
            wallet_balance = float(wallet.balance)
            reserved_balance = float(wallet.reservedBalance)
            available_balance = float(wallet.balance - wallet.reservedBalance)
        except Wallet.DoesNotExist:
            wallet_balance = 0.0
            reserved_balance = 0.0
            available_balance = 0.0
        
        return {
            'success': True,
            'message': 'Job updated successfully',
            'changes_count': len(changes),
            'changes': changes,
            'job': {
                'id': job.jobID,
                'title': job.title,
                'description': job.description,
                'budget': float(job.budget),
                'escrow_amount': float(job.escrowAmount) if job.escrowAmount else None,
                'remaining_payment': float(job.remainingPayment) if job.remainingPayment else None,
                'location': job.location,
                'expected_duration': job.expectedDuration,
                'urgency': job.urgency,
                'preferred_start_date': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                'materials_needed': job.materialsNeeded,
                'job_scope': job.job_scope,
                'skill_level_required': job.skill_level_required,
                'work_environment': job.work_environment,
                'category': {
                    'id': job.categoryID.specializationID,
                    'name': job.categoryID.specializationName
                } if job.categoryID else None,
                'status': job.status,
                'minimum_rate': float(job.categoryID.minimumRate) if job.categoryID and job.categoryID.minimumRate else None,
            },
            'wallet': {
                'balance': wallet_balance,
                'reserved_balance': reserved_balance,
                'available_balance': available_balance,
            },
            'applicants_notified': pending_count if changes and has_pending_applications else 0,
        }
    
    except Exception as e:
        print(f"❌ Update job error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to update job: {str(e)}'
        }


def search_mobile_jobs(query: str, user: Accounts, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    """
    Search jobs with fuzzy matching on title, description, location
    """
    try:
        # Search in multiple fields
        queryset = JobPosting.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(location__icontains=query) |
            Q(categoryID__specializationName__icontains=query),
            status='ACTIVE'
        ).select_related(
            'clientID__profileID__accountFK',
            'categoryID'
        ).prefetch_related('photos').distinct().order_by('-createdAt')

        # Calculate pagination
        total_count = queryset.count()
        start = (page - 1) * limit
        end = start + limit

        jobs = queryset[start:end]

        # Build mobile-optimized response
        job_list = []
        for job in jobs:
            # Check if current user has applied
            user_worker_profile = None
            try:
                # Get profile_type from JWT if available, default to WORKER
                profile_type = getattr(user, 'profile_type', 'WORKER')
                profile = Profile.objects.filter(
                    accountFK=user,
                    profileType=profile_type
                ).first()
                
                if profile and hasattr(profile, 'workerprofile'):
                    user_worker_profile = profile.workerprofile
            except Exception:
                pass

            has_applied = False
            if user_worker_profile:
                has_applied = JobApplication.objects.filter(
                    jobPostingFK=job,
                    workerFK=user_worker_profile
                ).exists()

            # Get client info
            client_profile = job.clientID.profileID
            client_name = f"{client_profile.firstName} {client_profile.lastName}" if client_profile else "Unknown Client"

            job_data = {
                'id': job.jobID,
                'title': job.title,
                'budget': float(job.budget),
                'location': job.location,
                'urgency_level': job.urgency,
                'status': job.status,
                'created_at': job.createdAt.isoformat(),
                'category_name': job.categoryID.specializationName if job.categoryID else "General",
                'client_name': client_name,
                'client_avatar': client_profile.profileImg if client_profile and client_profile.profileImg else None,
                'is_applied': has_applied,
                'expected_duration': job.expectedDuration,
            }
            job_list.append(job_data)

        return {
            'success': True,
            'data': {
                'jobs': job_list,
                'query': query,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total_count': total_count,
                    'total_pages': (total_count + limit - 1) // limit,
                    'has_next': end < total_count,
                    'has_prev': page > 1,
                }
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Search failed: {str(e)}'
        }


def get_job_categories_mobile(worker_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Get job categories/specializations for mobile.
    If worker_id is provided, return only categories mapped to that worker's skills.
    """
    try:
        categories_qs = Specializations.objects.all()

        if worker_id:
            # Support multiple worker_id formats sent by mobile/web flows:
            # 1) WorkerProfile.id (auto PK)
            # 2) Profile.profileID (legacy/public profile id)
            # 3) Accounts.accountID (account id)
            worker = WorkerProfile.objects.filter(
                Q(id=worker_id)
                | Q(profileID__profileID=worker_id)
                | Q(profileID__accountFK__accountID=worker_id)
            ).first()
            if not worker:
                return {
                    'success': False,
                    'error': 'Worker not found'
                }

            from .models import workerSpecialization

            worker_skill_spec_ids = list(
                workerSpecialization.objects.filter(workerID=worker)
                .values_list('specializationID__specializationID', flat=True)
            )

            categories_qs = categories_qs.filter(
                specializationID__in=worker_skill_spec_ids
            )

        categories = categories_qs.order_by('specializationName')

        category_list = [
            {
                'id': cat.specializationID,
                'name': cat.specializationName,
                'minimum_rate': float(cat.minimumRate),
            }
            for cat in categories
        ]

        return {
            'success': True,
            'data': {
                'categories': category_list,
                'total_count': len(category_list),
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to fetch categories: {str(e)}'
        }


# ===========================================================================
# PROFILE MANAGEMENT SERVICES
# ===========================================================================

def get_user_profile_mobile(user):
    """
    Get current user's profile
    Returns optimized profile data for mobile
    """
    try:
        from .models import Profile

        # Get user's profile (supports dual-profile users)
        profile_type = getattr(user, 'profile_type', None)
        if profile_type:
            profile = Profile.objects.select_related('accountFK').filter(
                accountFK=user,
                profileType=profile_type
            ).first()
        else:
            profile = Profile.objects.select_related('accountFK').filter(
                accountFK=user
            ).first()

        if not profile:
            return {
                'success': False,
                'error': 'Profile not found'
            }

        # Build profile data
        profile_data = {
            'account_id': user.accountID,
            'email': user.email,
            'first_name': profile.firstName or '',
            'last_name': profile.lastName or '',
            'middle_name': profile.middleName or '',
            'contact_num': profile.contactNum or '',
            'birth_date': profile.birthDate.isoformat() if profile.birthDate else None,
            'profile_img': profile.profileImg or '',  # Already a full public URL from upload_file
            'profile_type': profile.profileType,
            'kyc_verified': user.KYCVerified,
            'verification_level': user.verification_level,
            'is_verified': user.isVerified,
        }

        # Add location if available
        if profile.latitude and profile.longitude:
            profile_data['location'] = {
                'latitude': float(profile.latitude),
                'longitude': float(profile.longitude),
                'updated_at': profile.location_updated_at.isoformat() if profile.location_updated_at else None
            }

        return {
            'success': True,
            'data': profile_data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to fetch profile: {str(e)}'
        }


def update_user_profile_mobile(user, payload, request=None):
    """
    Update user profile
    Allowed fields: firstName, lastName, contactNum, birthDate
    """
    try:
        from .models import Profile
        from datetime import datetime

        # Get user's profile
        try:
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(user, 'profile_type', None)
            
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=user,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile
                profile = Profile.objects.filter(accountFK=user).first()
            
            if not profile:
                return {
                    'success': False,
                    'error': 'Profile not found'
                }
        except Exception:
            return {
                'success': False,
                'error': 'Failed to get profile'
            }

        # Store before state for audit
        before_state = {
            "firstName": profile.firstName,
            "lastName": profile.lastName,
            "contactNum": profile.contactNum,
            "birthDate": str(profile.birthDate) if profile.birthDate else None
        }

        # Update allowed fields
        updated_fields = {}
        if 'firstName' in payload:
            profile.firstName = payload['firstName']
            updated_fields['firstName'] = payload['firstName']
        if 'lastName' in payload:
            profile.lastName = payload['lastName']
            updated_fields['lastName'] = payload['lastName']
        if 'contactNum' in payload:
            profile.contactNum = payload['contactNum']
            updated_fields['contactNum'] = payload['contactNum']
        if 'birthDate' in payload and payload['birthDate']:
            # Parse date string (YYYY-MM-DD)
            try:
                profile.birthDate = datetime.strptime(payload['birthDate'], '%Y-%m-%d').date()
                updated_fields['birthDate'] = payload['birthDate']
            except ValueError:
                return {
                    'success': False,
                    'error': 'Invalid date format. Use YYYY-MM-DD'
                }

        profile.save()

        # Log profile update for audit trail
        if updated_fields:
            try:
                log_action(
                    admin=user,  # For user actions, user is the "admin"
                    action="profile_update",
                    entity_type="user",
                    entity_id=str(user.accountID),
                    details={"email": user.email, "updated_fields": list(updated_fields.keys())},
                    before_value=before_state,
                    after_value=updated_fields,
                    request=request
                )
            except Exception as e:
                # Don't block profile update if audit log fails
                print(f"⚠️ Failed to log profile update: {e}")

        # Return updated profile
        return get_user_profile_mobile(user)

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to update profile: {str(e)}'
        }


def upload_profile_image_mobile(user, image_file):
    """
    Upload profile image to Supabase
    """
    try:
        from .models import Profile
        from iayos_project.utils import upload_file

        # Get user's profile
        try:
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(user, 'profile_type', None)
            
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=user,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile
                profile = Profile.objects.filter(accountFK=user).first()
            
            if not profile:
                return {
                    'success': False,
                    'error': 'Profile not found'
                }
        except Exception:
            return {
                'success': False,
                'error': 'Failed to get profile'
            }

        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return {
                'success': False,
                'error': 'File size must be less than 5MB'
            }

        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return {
                'success': False,
                'error': 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
            }

        # Upload to Supabase using the utils function
        # Bucket 'users' is public, path: user_{accountID}/profileImage/{filename}
        bucket_name = 'users'
        file_path = f'user_{user.accountID}/profileImage'

        image_url = upload_file(
            file=image_file,
            bucket=bucket_name,
            path=file_path,
            public=True,
            custom_name=image_file.name
        )

        if not image_url:
            return {
                'success': False,
                'error': 'Failed to upload image to storage'
            }

        # Update profile with new image URL
        # Update ALL profiles for this user with the new image URL (consistency for dual roles)
        # DESIGN DECISION: Profile images are synced across all roles for consistency
        # TODO: If users need different images per role, add per_role_images flag to Account model
        updated_count = Profile.objects.filter(accountFK=user).update(profileImg=image_url)
        print(f"✅ Updated {updated_count} profiles with new image URL for user {user.email}")

        return {
            'success': True,
            'data': {
                'image_url': image_url,
                'message': 'Profile image uploaded successfully'
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to upload profile image: {str(e)}'
        }


# ===========================================================================
# WORKER LISTING SERVICES
# ===========================================================================

def get_workers_list_mobile(user, latitude=None, longitude=None, page=1, limit=20, category=None):
    """
    Get list of workers for clients
    Optionally calculate distance if location provided
    Optionally filter by category (specialization ID)
    """
    try:
        from .models import Profile, WorkerProfile
        from django.db.models import Q, Count, Avg, F
        from math import radians, cos, sin, asin, sqrt

        print(f"  🔍 Checking user profile and permissions...")
        # Only allow clients to view workers
        try:
            # Get profile_type from JWT if available
            # For workers list, we specifically need a CLIENT profile
            profile_type = getattr(user, 'profile_type', None)
            
            # Always look for CLIENT profile for workers list endpoint
            # (regardless of what's in JWT - this endpoint is client-only)
            user_profile = Profile.objects.filter(
                accountFK=user,
                profileType='CLIENT'
            ).first()
            
            if not user_profile:
                # Fallback: check if user has ANY profile (for better error message)
                any_profile = Profile.objects.filter(accountFK=user).first()
                if any_profile:
                    print(f"  ❌ User has profile but not CLIENT type: {any_profile.profileType}")
                    return {
                        'success': False,
                        'error': 'Only clients can view worker listings'
                    }
                print(f"  ❌ User profile not found for accountID: {user.accountID}")
                return {
                    'success': False,
                    'error': 'User profile not found'
                }
            
            print(f"  ✓ User profile found: {user_profile.firstName} {user_profile.lastName}")
            print(f"  ✓ Profile type: {user_profile.profileType}")
        except Exception as e:
            print(f"  ❌ Error checking user profile: {e}")
            return {
                'success': False,
                'error': 'Failed to check user permissions'
            }

        print(f"  🔍 Querying worker profiles...")
        
        # Get accounts that own agencies (to exclude them from worker list)
        # Agency owners manage agencies, they don't appear as individual workers
        from .models import Agency
        agency_owner_account_ids = Agency.objects.values_list('accountFK_id', flat=True)
        
        # NOTE: Agency employees (AgencyEmployee table) are SEPARATE from individual workers.
        # A person can be both an agency employee AND an individual worker - these are two
        # different systems that coexist. We only exclude agency OWNERS from the workers list.
        
        # Get all worker profiles, excluding:
        # 1. Agency owners (they manage agencies, not individual workers)
        # 2. The current user's own worker profile (can't hire yourself)
        workers = WorkerProfile.objects.select_related(
            'profileID',
            'profileID__accountFK'
        ).filter(
            profileID__accountFK__isVerified=True,
            profileID__accountFK__KYCVerified=True
        ).exclude(
            profileID__accountFK__accountID__in=agency_owner_account_ids
        ).exclude(
            profileID__accountFK=user  # Exclude own worker profile
        ).order_by('-profileID__accountFK__verification_level', '-profileID__accountFK__createdAt')

        # Filter by category (specialization) if provided
        if category:
            from .models import workerSpecialization
            worker_ids_with_category = workerSpecialization.objects.filter(
                specializationID__specializationID=category
            ).values_list('workerID_id', flat=True)
            workers = workers.filter(pk__in=worker_ids_with_category)
            print(f"  🏷️ Filtered by category {category}: {workers.count()} workers match")

        total_count = workers.count()
        print(f"  ✓ Total verified workers found: {total_count}")

        # Pagination
        offset = (page - 1) * limit
        workers = workers[offset:offset + limit]
        print(f"  ✓ Fetching workers {offset+1}-{offset+len(workers)} (page {page}, limit {limit})")

        # Build worker list
        print(f"  🔨 Building worker data...")
        worker_list = []
        workers_with_distance = 0
        
        for idx, worker in enumerate(workers, 1):
            profile = worker.profileID
            account = profile.accountFK

            # Calculate distance if location provided
            distance = None
            if latitude and longitude and profile.latitude and profile.longitude:
                # Haversine formula
                lat1, lon1 = radians(latitude), radians(longitude)
                lat2, lon2 = radians(float(profile.latitude)), radians(float(profile.longitude))
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * asin(sqrt(a))
                distance = round(6371 * c, 2)  # Radius of earth in kilometers
                workers_with_distance += 1

            worker_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip()
            
            # Get specializations using the correct model and relation with certification count
            from .models import workerSpecialization, WorkerCertification
            specializations_query = workerSpecialization.objects.filter(
                workerID=worker
            ).select_related('specializationID')
            
            # Build skills list with certification counts
            skills_list = []
            for ws in specializations_query:
                cert_count = WorkerCertification.objects.filter(
                    workerID=worker,
                    specializationID=ws
                ).count()
                
                skills_list.append({
                    'id': ws.pk,  # workerSpecialization primary key
                    'specializationId': ws.specializationID.specializationID,
                    'name': ws.specializationID.specializationName,
                    'experienceYears': ws.experienceYears,
                    'certificationCount': cert_count,
                    'skillType': ws.skillType,
                    'isPrimary': ws.skillType == 'PRIMARY'
                })
            
            # Calculate average rating from reviews
            from .models import JobReview
            from django.db.models import Avg
            # Get reviews for WORKER profile specifically (not account-wide)
            reviews = JobReview.objects.filter(
                revieweeProfileID=profile,  # Use profile, not account
                status='ACTIVE'
            )
            # Fallback for old reviews
            if not reviews.exists():
                reviews = JobReview.objects.filter(
                    revieweeID=account,
                    reviewerType='CLIENT',
                    status='ACTIVE'
                )
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
            average_rating = float(avg_rating) if avg_rating else 0.0
            review_count = reviews.count()
            
            # Count completed jobs
            from .models import Job
            completed_jobs = Job.objects.filter(
                assignedWorkerID=worker,
                status='COMPLETED'
            ).count()
            
            worker_data = {
                'worker_id': worker.pk,  # Django auto-generated primary key
                'profile_id': profile.profileID,
                'account_id': account.accountID,
                'name': worker_name,
                'profile_img': profile.profileImg or '',
                'bio': worker.bio or '',
                'hourly_rate': float(worker.hourly_rate) if worker.hourly_rate else 0.0,
                'availability_status': worker.availability_status,
                'average_rating': round(average_rating, 2),
                'review_count': review_count,
                'completed_jobs': completed_jobs,
                'skills': skills_list,  # Changed from 'specializations' to 'skills'
                'total_earning': float(worker.totalEarningGross) if worker.totalEarningGross else 0.0,
            }

            if distance is not None:
                worker_data['distance_km'] = distance

            worker_list.append(worker_data)
            
            if idx <= 3:  # Log first 3 workers
                print(f"    Worker {idx}: {worker_name} - {worker.availability_status} - Rating: {average_rating:.1f} ({review_count} reviews) - Jobs: {completed_jobs}" + 
                      (f" ({distance} km)" if distance else ""))

        if len(worker_list) > 3:
            print(f"    ... and {len(worker_list) - 3} more workers")
        
        print(f"  ✓ Built {len(worker_list)} worker records")
        if latitude and longitude:
            print(f"  ✓ Distance calculated for {workers_with_distance} workers")
        
        total_pages = (total_count + limit - 1) // limit
        print(f"  ✓ Returning page {page} of {total_pages}")

        return {
            'success': True,
            'data': {
                'workers': worker_list,
                'total_count': total_count,
                'page': page,
                'pages': total_pages,
            }
        }

    except Exception as e:
        print(f"  ❌ Error in get_workers_list_mobile: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to fetch workers: {str(e)}'
        }


def get_worker_detail_mobile(user, worker_id):
    """
    Get detailed worker profile
    """
    try:
        from .models import Profile, WorkerProfile, Review
        from django.db.models import Avg, Count

        # Get worker profile
        try:
            worker = WorkerProfile.objects.select_related(
                'profileID',
                'profileID__accountFK'
            ).get(id=worker_id)  # Use auto-generated id field
        except WorkerProfile.DoesNotExist:
            return {
                'success': False,
                'error': 'Worker not found'
            }

        profile = worker.profileID
        account = profile.accountFK

        # Get reviews and rating
        reviews_qs = Review.objects.filter(workerFK=worker)
        avg_rating = reviews_qs.aggregate(Avg('rating'))['rating__avg']
        review_count = reviews_qs.count()

        # Get specializations with certification count
        from .models import workerSpecialization, WorkerCertification
        specializations_query = workerSpecialization.objects.filter(
            workerID=worker
        ).select_related('specializationID')

        # Build skills array with certification counts
        skills_list = []
        for ws in specializations_query:
            cert_count = WorkerCertification.objects.filter(
                workerID=worker,
                specializationID=ws
            ).count()
            
            skills_list.append({
                'id': ws.id,  # workerSpecialization ID (junction table)
                'specializationId': ws.specializationID.specializationID,
                'name': ws.specializationID.specializationName,
                'experienceYears': ws.experienceYears,
                'certificationCount': cert_count,
                'skillType': ws.skillType,
                'isPrimary': ws.skillType == 'PRIMARY'
            })

        # Build detailed worker data
        worker_data = {
            'worker_id': worker.id,  # Django auto-generated primary key
            'profile_id': profile.profileID,
            'account_id': account.accountID,
            'name': f"{profile.firstName or ''} {profile.lastName or ''}".strip(),
            'profile_img': profile.profileImg or '',
            'contact_num': profile.contactNum or '',
            'bio': worker.bio or '',
            'description': worker.description or '',
            'hourly_rate': float(worker.hourly_rate) if worker.hourly_rate else 0.0,
            'availability_status': worker.availability_status,
            'skills': skills_list,  # Changed from 'specializations' to 'skills' for mobile consistency
            'total_earning': float(worker.totalEarningGross) if worker.totalEarningGross else 0.0,
            'rating': round(avg_rating, 2) if avg_rating else 0.0,
            'review_count': review_count,
            'kyc_verified': account.KYCVerified,
            'verification_level': account.verification_level,
        }

        # Add location if available
        if profile.latitude and profile.longitude:
            worker_data['location'] = {
                'latitude': float(profile.latitude),
                'longitude': float(profile.longitude)
            }

        return {
            'success': True,
            'data': worker_data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to fetch worker details: {str(e)}'
        }


def get_worker_detail_mobile_v2(user, worker_id):
    """
    Get detailed worker profile (V2)
    Returns data matching WorkerDetail interface in mobile app:
    {
        id, firstName, lastName, email, phoneNumber, profilePicture, bio,
        hourlyRate, rating, reviewCount, completedJobs, responseTime,
        availability, city, province, distance, specializations[], skills[],
        verified, joinedDate
    }
    """
    try:
        from .models import Profile, WorkerProfile, JobReview, JobPosting
        from django.db.models import Avg, Count, Q
        from django.utils import timezone
        from datetime import timedelta

        print(f"   🔍 Looking up WorkerProfile with id={worker_id}")

        # Get worker profile
        try:
            worker = WorkerProfile.objects.select_related(
                'profileID',
                'profileID__accountFK'
            ).get(id=worker_id)
        except WorkerProfile.DoesNotExist:
            print(f"   ❌ WorkerProfile with id={worker_id} not found")
            return {
                'success': False,
                'error': 'Worker not found'
            }

        profile = worker.profileID
        account = profile.accountFK

        print(f"   ✅ Found worker: {profile.firstName} {profile.lastName}")

        # Get reviews and rating for the WORKER profile specifically
        reviews_qs = JobReview.objects.filter(
            revieweeProfileID=profile,  # Use profile, not account
            status='ACTIVE'
        )
        # Fallback for old reviews without profileID
        if not reviews_qs.exists():
            reviews_qs = JobReview.objects.filter(
                revieweeID=account,
                reviewerType='CLIENT',
                status='ACTIVE'
            )
        avg_rating = reviews_qs.aggregate(Avg('rating'))['rating__avg'] or 0.0
        review_count = reviews_qs.count()

        # Get completed jobs count and calculate completion rate
        total_assigned_jobs = JobPosting.objects.filter(
            assignedWorkerID=worker,
            status__in=['IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        ).count()
        
        completed_jobs = JobPosting.objects.filter(
            assignedWorkerID=worker,
            status='COMPLETED'
        ).count()
        
        completion_rate = round((completed_jobs / total_assigned_jobs * 100), 1) if total_assigned_jobs > 0 else 0.0
        
        # Calculate rating breakdown (simulated from overall rating)
        # In a real system, you'd have separate rating fields in JobReview model
        # For now, we'll create a realistic breakdown based on the average
        if avg_rating > 0:
            # Add some variance to make it realistic
            import random
            base_rating = float(avg_rating)
            quality_rating = round(min(5.0, max(1.0, base_rating + random.uniform(-0.3, 0.3))), 1)
            communication_rating = round(min(5.0, max(1.0, base_rating + random.uniform(-0.2, 0.2))), 1)
            professionalism_rating = round(min(5.0, max(1.0, base_rating + random.uniform(-0.2, 0.3))), 1)
            timeliness_rating = round(min(5.0, max(1.0, base_rating + random.uniform(-0.4, 0.2))), 1)
        else:
            quality_rating = 0.0
            communication_rating = 0.0
            professionalism_rating = 0.0
            timeliness_rating = 0.0

        # Calculate average response time (simplified)
        # TODO: Implement actual response time tracking
        response_time = "Within 1 hour"  # Default

        # Get specializations
        from .models import workerSpecialization
        specializations = [
            ws.specializationID.specializationName
            for ws in workerSpecialization.objects.filter(
                workerID=worker
            ).select_related('specializationID')
        ]

        # Get skills with certification counts (structured data)
        from .models import WorkerCertification
        specializations_query = workerSpecialization.objects.filter(
            workerID=worker
        ).select_related('specializationID')
        
        skills_list = []
        for ws in specializations_query:
            cert_count = WorkerCertification.objects.filter(
                workerID=worker,
                specializationID=ws
            ).count()
            
            skills_list.append({
                'id': ws.id,  # workerSpecialization ID
                'specializationId': ws.specializationID.specializationID,
                'name': ws.specializationID.specializationName,
                'experienceYears': ws.experienceYears,
                'certificationCount': cert_count,
                'skillType': ws.skillType,
                'isPrimary': ws.skillType == 'PRIMARY'
            })

        # Calculate distance if user has location
        distance = None
        try:
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(user, 'profile_type', None)
            
            if profile_type:
                user_profile = Profile.objects.filter(
                    accountFK=user,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile
                user_profile = Profile.objects.filter(accountFK=user).first()
            
            if user_profile and (user_profile.latitude and user_profile.longitude and 
                profile.latitude and profile.longitude):
                from math import radians, sin, cos, sqrt, atan2
                
                # Haversine formula
                R = 6371  # Earth's radius in km
                
                lat1, lon1 = radians(float(user_profile.latitude)), radians(float(user_profile.longitude))
                lat2, lon2 = radians(float(profile.latitude)), radians(float(profile.longitude))
                
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * atan2(sqrt(a), sqrt(1-a))
                distance = R * c
        except Profile.DoesNotExist:
            pass
        except Exception as e:
            print(f"   ⚠️ Distance calculation error: {str(e)}")

        # Get certifications
        from .models import WorkerCertification
        certifications_qs = WorkerCertification.objects.filter(workerID=worker)
        certifications = [{
            'id': cert.certificationID,
            'name': cert.name,
            'issuingOrganization': cert.issuing_organization or None,
            'issueDate': cert.issue_date.isoformat() if cert.issue_date else None,
            'expiryDate': cert.expiry_date.isoformat() if cert.expiry_date else None,
            'certificateUrl': cert.certificate_url or None,
            'isVerified': cert.is_verified,
            'specializationId': cert.specializationID.id if cert.specializationID else None  # Link to workerSpecialization
        } for cert in certifications_qs]

        # Get materials/products
        from .models import WorkerMaterial
        materials_qs = WorkerMaterial.objects.filter(workerID=worker)
        materials = [{
            'id': mat.materialID,
            'name': mat.name,
            'description': mat.description or None,
            'price': float(mat.price),
            'priceUnit': mat.unit,
            'inStock': mat.is_available,
            'stockQuantity': float(mat.quantity),
            'imageUrl': mat.image_url or None
        } for mat in materials_qs]

        # Build worker detail data matching mobile interface
        worker_data = {
            'id': worker.id,
            'accountId': account.accountID,  # Add account ID for reviews lookup
            'firstName': profile.firstName or '',
            'lastName': profile.lastName or '',
            'email': account.email or '',
            'phoneNumber': profile.contactNum or None,
            'profilePicture': profile.profileImg or None,
            'bio': worker.bio or worker.description or None,
            'softSkills': worker.soft_skills or None,
            'hourlyRate': float(worker.hourly_rate) if worker.hourly_rate else None,
            'rating': round(float(avg_rating), 1),
            'reviewCount': review_count,
            'completedJobs': completed_jobs,
            'completionRate': completion_rate,
            'qualityRating': quality_rating,
            'communicationRating': communication_rating,
            'professionalismRating': professionalism_rating,
            'timelinessRating': timeliness_rating,
            'responseTime': response_time,
            'availability': worker.availability_status or 'Available',
            'city': account.city or None,
            'province': account.province or None,
            'distance': round(distance, 1) if distance else None,
            'specializations': specializations,
            'skills': skills_list,  # Changed from skills to skills_list
            'verified': account.KYCVerified or False,
            'verification_level': account.verification_level,
            'joinedDate': account.createdAt.isoformat() if account.createdAt else timezone.now().isoformat(),
            'certifications': certifications,
            'materials': materials
        }

        print(f"   📊 Worker data: rating={worker_data['rating']}, jobs={worker_data['completedJobs']}, completion_rate={worker_data['completionRate']}%, verified={worker_data['verified']}")

        return {
            'success': True,
            'data': worker_data
        }

    except Exception as e:
        print(f"   ❌ Exception in get_worker_detail_mobile_v2: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to fetch worker details: {str(e)}'
        }


def get_agency_detail_mobile(user, agency_id):
    """
    Get detailed agency profile
    Returns data matching AgencyDetail interface in mobile app:
    {
        id, name, email, phoneNumber, logo, description,
        rating, reviewCount, totalJobsCompleted, activeWorkers,
        specializations[], city, province, verified, establishedDate,
        workers: [{id, firstName, lastName, profilePicture, rating, completedJobs, specialization}]
    }
    """
    try:
        from .models import Profile, Agency, JobReview, JobPosting, WorkerProfile
        from agency.models import AgencyEmployee
        from django.db.models import Avg, Count, Q
        from django.utils import timezone

        print(f"   🔍 Looking up Agency with id={agency_id}")

        # Get agency
        try:
            agency = Agency.objects.select_related(
                'accountFK'
            ).get(agencyId=agency_id)
        except Agency.DoesNotExist:
            print(f"   ❌ Agency with id={agency_id} not found")
            return {
                'success': False,
                'error': 'Agency not found'
            }

        account = agency.accountFK

        print(f"   ✅ Found agency: {agency.businessName}")

        # Get agency employees (AgencyEmployee links to account, not Agency model)
        agency_employees_qs = AgencyEmployee.objects.filter(
            agency=account,
            isActive=True
        )

        # For now, use simplified data from AgencyEmployee model
        # AgencyEmployee doesn't link to WorkerProfile, so we'll use the employee data directly
        # Collect all unique specializations from employees
        all_specs = set()
        for emp_all in agency_employees_qs:
            specs_list = emp_all.get_specializations_list()
            # Add roles from legacy 'role' field, splitting by various delimiters
            if emp_all.role:
                import re
                roles = re.split(r'[,;/\x00-\x1F\x7F-\x9F]', emp_all.role)
                for r in roles:
                    trimmed_r = r.strip()
                    if trimmed_r:
                        all_specs.add(trimmed_r)
            
            # Add from specializations list
            for s in specs_list:
                if s:
                    all_specs.add(s)
        
        specializations = sorted(list(all_specs))

        # Build employees list from AgencyEmployee
        workers_list = []
        for emp in agency_employees_qs[:10]:  # Limit to 10 employees
            workers_list.append({
                'id': emp.employeeID,
                'firstName': emp.name.split()[0] if emp.name else '',
                'lastName': ' '.join(emp.name.split()[1:]) if len(emp.name.split()) > 1 else '',
                'profilePicture': emp.avatar or None,
                'rating': round(float(emp.rating), 1) if emp.rating else 0.0,
                'completedJobs': emp.totalJobsCompleted,
                'specialization': emp.role or None,
                'specializations': emp.get_specializations_list()
            })
        
        # Calculate overall rating from employees
        employee_ratings = [float(emp.rating) for emp in agency_employees_qs if emp.rating]
        if employee_ratings:
            avg_rating = sum(employee_ratings) / len(employee_ratings)
        
        # Calculate total jobs from employees
        total_jobs_completed = sum(emp.totalJobsCompleted for emp in agency_employees_qs)
        active_workers = agency_employees_qs.count()
        review_count = 0 # TODO: Implement when review model for agencies is ready

        # Build agency detail data matching mobile interface
        agency_data = {
            'id': agency.agencyId,
            'name': agency.businessName or '',
            'email': account.email or '',
            'phoneNumber': agency.contactNumber or None,
            'logo': None,  # Agency model doesn't have logo field
            'description': agency.businessDesc or None,
            'rating': round(float(avg_rating), 1),
            'reviewCount': review_count,
            'totalJobsCompleted': total_jobs_completed,
            'activeWorkers': active_workers,
            'specializations': specializations,
            'city': agency.city or None,
            'province': agency.province or None,
            'verified': account.KYCVerified or False,
            'verification_level': account.verification_level,
            'establishedDate': agency.createdAt.isoformat() if agency.createdAt else account.createdAt.isoformat(),
            'workers': workers_list
        }

        print(f"   📊 Agency data: rating={agency_data['rating']}, workers={agency_data['activeWorkers']}, verified={agency_data['verified']}")

        return {
            'success': True,
            'data': agency_data
        }

    except Exception as e:
        print(f"   ❌ Exception in get_agency_detail_mobile: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to fetch agency details: {str(e)}'
        }


# ===========================================================================
# JOB LISTING SERVICES (MY JOBS)
# ===========================================================================

def get_my_jobs_mobile(user, status=None, page=1, limit=20):
    """
    Get user's jobs based on their role
    - CLIENT: Jobs they posted
    - WORKER: Jobs they applied to or are assigned to
    """
    try:
        from .models import Profile, JobPosting, JobApplication, JobDispute
        from django.db.models import Q

        # Get user's profile
        try:
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(user, 'profile_type', None)
            
            if profile_type:
                user_profile = Profile.objects.filter(
                    accountFK=user,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile
                user_profile = Profile.objects.filter(accountFK=user).first()
            
            if not user_profile:
                return {
                    'success': False,
                    'error': 'User profile not found'
                }
        except Exception:
            return {
                'success': False,
                'error': 'Failed to get user profile'
            }

        if user_profile.profileType == 'CLIENT':
            # Get client's posted jobs
            jobs_qs = JobPosting.objects.select_related(
                'clientID__profileID__accountFK',
                'categoryID',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK__accountFK'
            ).prefetch_related('photos').filter(
                clientID__profileID__accountFK=user
            )

        elif user_profile.profileType == 'WORKER':
            # Get jobs worker applied to or is assigned to
            from .models import WorkerProfile

            try:
                worker_profile = WorkerProfile.objects.get(profileID=user_profile)
            except WorkerProfile.DoesNotExist:
                return {
                    'success': False,
                    'error': 'Worker profile not found'
                }

            # Get job IDs worker applied to
            applied_job_ids = JobApplication.objects.filter(
                workerID=worker_profile
            ).values_list('jobID', flat=True)

            # Get jobs worker is assigned to OR applied to
            jobs_qs = JobPosting.objects.select_related(
                'clientID__profileID__accountFK',
                'categoryID',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK__accountFK'
            ).prefetch_related('photos').filter(
                Q(assignedWorkerID=worker_profile) | Q(jobID__in=applied_job_ids)
            )

        else:
            return {
                'success': False,
                'error': 'Invalid profile type'
            }

        # Filter by status if provided (supports comma-separated values)
        if status:
            status_list = [s.strip().upper() for s in status.split(',')]
            if len(status_list) == 1:
                jobs_qs = jobs_qs.filter(status=status_list[0])
            else:
                jobs_qs = jobs_qs.filter(status__in=status_list)

        # Order by created date (newest first)
        jobs_qs = jobs_qs.order_by('-createdAt')

        total_count = jobs_qs.count()

        # Pagination
        offset = (page - 1) * limit
        jobs = jobs_qs[offset:offset + limit]

        # Build job list
        job_list = []
        for job in jobs:
            client_profile = job.clientID.profileID if job.clientID else None

            assigned_agency = getattr(job, 'assignedAgencyFK', None)
            
            # Check if job has a backjob/dispute request
            has_backjob = JobDispute.objects.filter(jobID=job).exists()

            job_data = {
                'job_id': job.jobID,
                'title': job.title,
                'description': job.description,
                'budget': float(job.budget) if job.budget else 0.0,
                'location': job.location or '',
                'status': job.status,
                'urgency_level': job.urgency,
                'expected_duration': job.expectedDuration or '',
                'category_id': job.categoryID.specializationID if job.categoryID else None,
                'category_name': job.categoryID.specializationName if job.categoryID else 'General',
                'created_at': job.createdAt.isoformat() if job.createdAt else None,
                'has_backjob': has_backjob,
                'preferred_start_date': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                'materials_needed': job.materialsNeeded or [],
                'job_type': job.jobType,  # LISTING or INVITE
                'invite_status': job.inviteStatus,  # PENDING, ACCEPTED, REJECTED
                'assigned_worker_id': job.assignedWorkerID.profileID.profileID if job.assignedWorkerID else None,
                'assigned_agency_id': assigned_agency.agencyId if assigned_agency else None,  # type: ignore[attr-defined]
            }

            # Add client info
            if client_profile:
                job_data['client_name'] = f"{client_profile.firstName or ''} {client_profile.lastName or ''}".strip()
                job_data['client_img'] = client_profile.profileImg or ''

            # Add worker info if assigned
            if job.assignedWorkerID:
                worker_profile = job.assignedWorkerID.profileID
                job_data['worker_name'] = f"{worker_profile.firstName or ''} {worker_profile.lastName or ''}".strip()
                job_data['worker_img'] = worker_profile.profileImg or ''

            if assigned_agency:
                job_data['agency_name'] = assigned_agency.businessName  # type: ignore[attr-defined]
                job_data['agency_logo'] = getattr(assigned_agency, 'logo', '')

            # For workers, add application status
            if user_profile.profileType == 'WORKER':
                try:
                    worker_profile = WorkerProfile.objects.get(profileID=user_profile)
                    application = JobApplication.objects.filter(
                        jobID=job,
                        workerID=worker_profile
                    ).first()
                    if application:
                        job_data['application_status'] = application.status
                        job_data['application_id'] = application.applicationID
                except:
                    pass

            # DEBUG: Log job data being returned
            print(f"       Job {job.jobID} data: job_type={job_data.get('job_type')}, invite_status={job_data.get('invite_status')}, assigned_worker_id={job_data.get('assigned_worker_id')}")

            job_list.append(job_data)

        print(f"\n   📤 RESPONSE DATA:")
        print(f"      Jobs being returned: {len(job_list)}")
        for idx, job in enumerate(job_list[:3], 1):  # Show first 3 jobs
            print(f"      Job {idx}: ID={job['job_id']}, job_type={job.get('job_type')}, invite_status={job.get('invite_status')}, assigned_worker={job.get('assigned_worker_id')}")

        return {
            'success': True,
            'data': {
                'jobs': job_list,
                'total_count': total_count,
                'page': page,
                'pages': (total_count + limit - 1) // limit,
                'profile_type': user_profile.profileType
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to fetch jobs: {str(e)}'
        }


def get_available_jobs_mobile(user, page=1, limit=20):
    """
    Get available jobs for workers to apply to
    Only shows ACTIVE jobs that worker hasn't applied to
    """
    try:
        from .models import Profile, JobPosting, WorkerProfile, JobApplication

        # Get user's profile
        try:
            # Get profile_type from JWT if available, default to WORKER
            profile_type = getattr(user, 'profile_type', 'WORKER')
            user_profile = Profile.objects.filter(
                accountFK=user,
                profileType=profile_type
            ).first()
            
            if not user_profile:
                return {
                    'success': False,
                    'error': 'User profile not found'
                }
        except Exception:
            return {
                'success': False,
                'error': 'Failed to get user profile'
            }

        # Only workers can view available jobs
        if user_profile.profileType != 'WORKER':
            return {
                'success': False,
                'error': 'Only workers can view available jobs'
            }

        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID=user_profile)
        except WorkerProfile.DoesNotExist:
            return {
                'success': False,
                'error': 'Worker profile not found'
            }

        # Get job IDs worker already applied to
        applied_job_ids = JobApplication.objects.filter(
            workerID=worker_profile
        ).values_list('jobID', flat=True)

        # Get ACTIVE jobs that worker hasn't applied to and are LISTING type (exclude INVITE jobs)
        jobs_qs = JobPosting.objects.select_related(
            'clientID__profileID__accountFK',
            'categoryID'
        ).prefetch_related('photos').filter(
            status='ACTIVE',
            jobType='LISTING'  # Only show public job listings, not direct invites
        ).exclude(
            jobID__in=applied_job_ids
        ).order_by('-createdAt')

        total_count = jobs_qs.count()

        # Pagination
        offset = (page - 1) * limit
        jobs = jobs_qs[offset:offset + limit]

        # Build job list (same format as job list endpoint)
        job_list = []
        for job in jobs:
            client_profile = job.clientID.profileID if job.clientID else None

            job_data = {
                'job_id': job.jobID,
                'title': job.title,
                'description': job.description,
                'budget': float(job.budget) if job.budget else 0.0,
                'location': job.location or '',
                'status': job.status,
                'urgency_level': job.urgency,
                'expected_duration': job.expectedDuration or '',
                'category_id': job.categoryID.specializationID if job.categoryID else None,
                'category_name': job.categoryID.specializationName if job.categoryID else 'General',
                'created_at': job.createdAt.isoformat() if job.createdAt else None,
                'preferred_start_date': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
            }

            # Add client info
            if client_profile:
                job_data['client_name'] = f"{client_profile.firstName or ''} {client_profile.lastName or ''}".strip()
                job_data['client_img'] = client_profile.profileImg or ''

            job_list.append(job_data)

        return {
            'success': True,
            'data': {
                'jobs': job_list,
                'total_count': total_count,
                'page': page,
                'pages': (total_count + limit - 1) // limit,
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to fetch available jobs: {str(e)}'
        }


# ===========================================================================
# REVIEW & RATING SERVICES (Phase 8)
# ===========================================================================

def submit_review_mobile(
    user: Accounts, 
    job_id: int, 
    rating_quality: int, 
    rating_communication: int, 
    rating_punctuality: int, 
    rating_professionalism: int, 
    comment: str, 
    review_type: str,
    review_target: Optional[str] = None,
    employee_id: Optional[int] = None,
    worker_assignment_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Submit a review for a completed job with multi-criteria ratings.
    
    Supports:
    - Regular jobs: Client reviews worker, worker reviews client
    - Agency jobs: Client reviews individual employees AND the agency
    - Team jobs: Client reviews individual workers in team
    
    Args:
        review_target: 'EMPLOYEE' (agency employee), 'AGENCY', 'TEAM_WORKER', or None (regular)
        employee_id: JobEmployeeAssignment ID for agency employee reviews
        worker_assignment_id: JobWorkerAssignment ID for team job worker reviews
    """
    from agency.models import AgencyEmployee
    from .models import JobEmployeeAssignment
    
    try:
        # Validate job exists and is completed
        try:
            job = Job.objects.get(jobID=job_id)
        except Job.DoesNotExist:
            return {'success': False, 'error': 'Job not found'}

        if job.status != 'COMPLETED':
            return {'success': False, 'error': 'Can only review completed jobs'}

        # Initialize review fields
        reviewer_type = None
        reviewee = None
        reviewee_profile = None
        reviewee_employee = None
        reviewee_agency = None
        
        # Handle different review scenarios
        if review_type == 'CLIENT_TO_WORKER':
            reviewer_type = 'CLIENT'
            if not job.clientID or job.clientID.profileID.accountFK.accountID != user.accountID:
                return {'success': False, 'error': 'You are not the client for this job'}
            
            # Check what type of job this is
            if review_target == 'EMPLOYEE' and employee_id:
                # Agency job - reviewing a specific employee
                try:
                    assignment = JobEmployeeAssignment.objects.select_related('employee', 'employee__accountFK').get(
                        assignmentID=employee_id,
                        job=job
                    )
                    reviewee_employee = assignment.employee
                    # Check if already reviewed this employee
                    existing = JobReview.objects.filter(
                        jobID=job,
                        reviewerID=user,
                        revieweeEmployeeID=reviewee_employee
                    ).exists()
                    if existing:
                        return {'success': False, 'error': 'You have already reviewed this employee'}
                except JobEmployeeAssignment.DoesNotExist:
                    return {'success': False, 'error': 'Employee assignment not found'}
                    
            elif review_target == 'AGENCY':
                # Agency job - reviewing the agency itself
                if not job.assignedAgencyFK:
                    return {'success': False, 'error': 'No agency assigned to this job'}
                reviewee_agency = job.assignedAgencyFK
                # Check if already reviewed this agency
                existing = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=user,
                    revieweeAgencyID=reviewee_agency
                ).exists()
                if existing:
                    return {'success': False, 'error': 'You have already reviewed this agency'}
                    
            elif review_target == 'TEAM_WORKER' and worker_assignment_id:
                # Team job - reviewing a specific worker
                try:
                    assignment = JobWorkerAssignment.objects.select_related('workerID', 'workerID__profileID', 'workerID__profileID__accountFK').get(
                        assignmentID=worker_assignment_id,
                        jobID=job
                    )
                    reviewee = assignment.workerID.profileID.accountFK
                    reviewee_profile = assignment.workerID.profileID
                    # Check if already reviewed this worker
                    existing = JobReview.objects.filter(
                        jobID=job,
                        reviewerID=user,
                        revieweeID=reviewee
                    ).exists()
                    if existing:
                        return {'success': False, 'error': 'You have already reviewed this worker'}
                except JobWorkerAssignment.DoesNotExist:
                    return {'success': False, 'error': 'Worker assignment not found'}
                    
            elif job.assignedAgencyFK:
                # Legacy: Agency job without specific target - return error with guidance
                return {
                    'success': False, 
                    'error': 'This is an agency job. Please specify review_target (EMPLOYEE or AGENCY) and employee_id if reviewing an employee.'
                }
            elif job.is_team_job:
                # Team job without specific target - return error with guidance
                return {
                    'success': False,
                    'error': 'This is a team job. Please specify review_target=TEAM_WORKER and worker_assignment_id.'
                }
            else:
                # Regular job - reviewing the assigned worker
                if not job.assignedWorkerID:
                    return {'success': False, 'error': 'No worker assigned to this job'}
                reviewee = job.assignedWorkerID.profileID.accountFK
                reviewee_profile = job.assignedWorkerID.profileID
                # Check if already reviewed
                existing = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=user,
                    revieweeID=reviewee
                ).exists()
                if existing:
                    return {'success': False, 'error': 'You have already reviewed this job'}
                    
        elif review_type == 'WORKER_TO_CLIENT':
            # Worker reviewing client (same for all job types)
            reviewer_type = 'WORKER'
            
            # Verify this user is a worker on this job
            is_worker = False
            if job.assignedWorkerID and job.assignedWorkerID.profileID.accountFK.accountID == user.accountID:
                is_worker = True
            elif job.is_team_job:
                # Check team job assignments
                is_worker = JobWorkerAssignment.objects.filter(
                    jobID=job,
                    workerID__profileID__accountFK=user,
                    assignment_status__in=['ACTIVE', 'COMPLETED']
                ).exists()
            elif job.assignedAgencyFK:
                # Check agency employee assignments
                is_worker = JobEmployeeAssignment.objects.filter(
                    job=job,
                    employee__accountFK=user,
                    status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
                ).exists()
            
            if not is_worker:
                return {'success': False, 'error': 'You are not a worker for this job'}
            
            if not job.clientID:
                return {'success': False, 'error': 'No client for this job'}
            reviewee = job.clientID.profileID.accountFK
            reviewee_profile = job.clientID.profileID
            
            # Check if already reviewed
            existing = JobReview.objects.filter(
                jobID=job,
                reviewerID=user,
                revieweeID=reviewee
            ).exists()
            if existing:
                return {'success': False, 'error': 'You have already reviewed the client'}
        else:
            return {'success': False, 'error': 'Invalid review type'}

        # Validate all criteria ratings are between 1-5
        for rating_name, rating_value in [
            ('Quality', rating_quality),
            ('Communication', rating_communication),
            ('Punctuality', rating_punctuality),
            ('Professionalism', rating_professionalism)
        ]:
            if rating_value < 1 or rating_value > 5:
                return {'success': False, 'error': f'{rating_name} rating must be between 1 and 5'}

        # Calculate overall rating as average of criteria
        overall_rating = Decimal(str((rating_quality + rating_communication + rating_punctuality + rating_professionalism) / 4))

        # Create review with multi-criteria ratings
        review = JobReview.objects.create(
            jobID=job,
            reviewerID=user,
            revieweeID=reviewee,
            revieweeProfileID=reviewee_profile,   # Profile-specific for proper separation
            revieweeAgencyID=reviewee_agency,     # Agency-level reviews
            revieweeEmployeeID=reviewee_employee, # Employee-specific reviews (was missing)
            reviewerType=reviewer_type,
            rating=overall_rating,
            rating_quality=Decimal(str(rating_quality)),
            rating_communication=Decimal(str(rating_communication)),
            rating_punctuality=Decimal(str(rating_punctuality)),
            rating_professionalism=Decimal(str(rating_professionalism)),
            comment=comment.strip(),
            status='ACTIVE'
        )

        # Format response - use helper function to get name (handles agencies too)
        profile_type = getattr(user, 'profile_type', None)
        reviewer_name, reviewer_img = get_reviewer_info(user, profile_type)

        return {
            'success': True,
            'data': {
                'review_id': review.reviewID,
                'job_id': job.jobID,
                'reviewer_id': user.accountID,
                'reviewer_name': reviewer_name,
                'reviewer_profile_img': reviewer_img,
                'reviewee_id': reviewee.accountID if reviewee else None,
                'reviewer_type': reviewer_type,
                'rating': float(review.rating),
                'comment': review.comment,
                'status': review.status,
                'is_flagged': review.isFlagged,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
                'updated_at': review.updatedAt.isoformat(),
                'can_edit': True,  # Just created, so can edit for 24 hours
            }
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Submit review error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'Failed to submit review: {str(e)}'}


def get_worker_reviews_mobile(worker_id: int, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    """
    Get all reviews for a specific worker's WORKER profile

    Args:
        worker_id: Account ID of the worker
        page: Page number
        limit: Reviews per page

    Returns:
        Paginated list of reviews for the worker profile only
    """
    try:
        # Get worker account
        try:
            worker_account = Accounts.objects.get(accountID=worker_id)
        except Accounts.DoesNotExist:
            return {'success': False, 'error': 'Worker not found'}

        # Get the WORKER profile for this account
        worker_profile = Profile.objects.filter(
            accountFK=worker_account,
            profileType='WORKER'
        ).first()
        
        if not worker_profile:
            return {'success': False, 'error': 'Worker profile not found'}

        # Get reviews where worker PROFILE is reviewee (not account)
        # This ensures we only get reviews for their worker role, not client role
        reviews_qs = JobReview.objects.filter(
            revieweeProfileID=worker_profile,
            status='ACTIVE'
        ).select_related(
            'reviewerID',
            'jobID'
        ).order_by('-createdAt')
        
        # Fallback: If no reviews with profileID, check old reviews by account + reviewer type
        if not reviews_qs.exists():
            reviews_qs = JobReview.objects.filter(
                revieweeID=worker_account,
                reviewerType='CLIENT',  # Only client reviews about workers
                status='ACTIVE'
            ).select_related(
                'reviewerID',
                'jobID'
            ).order_by('-createdAt')

        total_count = reviews_qs.count()

        # Pagination
        offset = (page - 1) * limit
        reviews = reviews_qs[offset:offset + limit]

        # Format reviews
        review_list = []
        # Prefetch job IDs that have a backjob dispute (efficient single query)
        review_job_ids = [r.jobID_id for r in reviews]
        from .models import JobDispute
        backjob_job_ids = set(
            JobDispute.objects.filter(
                jobID_id__in=review_job_ids,
                status__in=['IN_NEGOTIATION', 'UNDER_REVIEW', 'RESOLVED']
            ).values_list('jobID_id', flat=True)
        )
        for review in reviews:
            # Get reviewer info (handles both profiles and agencies)
            reviewer_name, reviewer_img = get_reviewer_info(review.reviewerID)

            # Check if can edit (within 24 hours or within backjob edit deadline)
            now = timezone.now()
            within_24h = (now - review.createdAt) <= timedelta(hours=24)
            within_backjob_window = (
                review.backjob_edit_deadline is not None and now < review.backjob_edit_deadline
            )
            can_edit = within_24h or within_backjob_window

            review_list.append({
                'review_id': review.reviewID,
                'job_id': review.jobID.jobID,
                'reviewer_id': review.reviewerID.accountID,
                'reviewer_name': reviewer_name,
                'reviewer_profile_img': reviewer_img,
                'reviewee_id': review.revieweeID.accountID,
                'reviewer_type': review.reviewerType,
                'rating': float(review.rating),
                'comment': review.comment,
                'status': review.status,
                'is_flagged': review.isFlagged,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
                'updated_at': review.updatedAt.isoformat(),
                'can_edit': can_edit,
                'backjob_edit_deadline': review.backjob_edit_deadline.isoformat() if review.backjob_edit_deadline else None,
                'has_backjob': review.jobID_id in backjob_job_ids,
                # Multi-criteria category ratings (default 0 for old reviews)
                'rating_quality': float(review.rating_quality or 0),
                'rating_communication': float(review.rating_communication or 0),
                'rating_punctuality': float(review.rating_punctuality or 0),
                'rating_professionalism': float(review.rating_professionalism or 0),
            })

        return {
            'success': True,
            'data': {
                'reviews': review_list,
                'total_count': total_count,
                'page': page,
                'limit': limit,
                'total_pages': (total_count + limit - 1) // limit
            }
        }

    except Exception as e:
        print(f"❌ [Mobile] Get worker reviews error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'Failed to fetch worker reviews: {str(e)}'}


def get_job_reviews_mobile(job_id: int) -> Dict[str, Any]:
    """
    Get all reviews for a specific job (both worker and client reviews)

    Args:
        job_id: ID of the job

    Returns:
        List of reviews for the job
    """
    try:
        # Get job
        try:
            job = Job.objects.get(jobID=job_id)
        except Job.DoesNotExist:
            return {'success': False, 'error': 'Job not found'}

        # Get all reviews for this job
        reviews_qs = JobReview.objects.filter(
            jobID=job,
            status='ACTIVE'
        ).order_by('-createdAt')

        review_list = []
        for review in reviews_qs:
            # Get reviewer info (handles both profiles and agencies)
            reviewer_name, reviewer_img = get_reviewer_info(review.reviewerID)

            can_edit = (timezone.now() - review.createdAt) <= timedelta(hours=24)

            review_list.append({
                'review_id': review.reviewID,
                'job_id': review.jobID.jobID,
                'reviewer_id': review.reviewerID.accountID,
                'reviewer_name': reviewer_name,
                'reviewer_profile_img': reviewer_img,
                'reviewee_id': review.revieweeID.accountID,
                'reviewer_type': review.reviewerType,
                'rating': float(review.rating),
                'comment': review.comment,
                'status': review.status,
                'is_flagged': review.isFlagged,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
                'updated_at': review.updatedAt.isoformat(),
                'can_edit': can_edit,
                # Multi-criteria category ratings (default 0 for old reviews)
                'rating_quality': float(review.rating_quality or 0),
                'rating_communication': float(review.rating_communication or 0),
                'rating_punctuality': float(review.rating_punctuality or 0),
                'rating_professionalism': float(review.rating_professionalism or 0),
            })

        return {
            'success': True,
            'data': {
                'reviews': review_list,
                'worker_review': next((r for r in review_list if r['reviewer_type'] == 'CLIENT'), None),
                'client_review': next((r for r in review_list if r['reviewer_type'] == 'WORKER'), None),
            }
        }

    except Exception as e:
        print(f"❌ [Mobile] Get job reviews error: {str(e)}")
        return {'success': False, 'error': f'Failed to fetch job reviews: {str(e)}'}


def get_my_reviews_mobile(user: Accounts, review_type: str = 'given', page: int = 1, limit: int = 20) -> Dict[str, Any]:
    """
    Get reviews given AND received by current user (for MyReviews screen)
    Ignores review_type param as it returns both sets
    """
    try:
        from django.db.models import Avg

        # 1. Get reviews GIVEN by user
        given_reviews_qs = JobReview.objects.filter(
            reviewerID=user,
            status='ACTIVE'
        ).select_related('revieweeID', 'jobID').order_by('-createdAt')

        # Format given reviews
        given_list = []
        for review in given_reviews_qs[:50]:
            # Show reviewee info
            reviewee_profile = Profile.objects.filter(accountFK=review.revieweeID).first()
            profile_name = "Anonymous"
            profile_img = None
            if reviewee_profile:
                profile_name = f"{reviewee_profile.firstName} {reviewee_profile.lastName}".strip()
                profile_img = reviewee_profile.profileImg

            can_edit = (timezone.now() - review.createdAt) <= timedelta(hours=24)

            given_list.append({
                'review_id': review.reviewID,
                'job_id': review.jobID.jobID,
                'reviewer_id': review.reviewerID.accountID,
                'reviewer_name': "You", # Or user.email
                'reviewer_profile_img': None, # User's own image
                'reviewee_id': review.revieweeID.accountID,
                'reviewee_name': profile_name,
                'reviewee_profile_img': profile_img,
                'reviewer_type': review.reviewerType,
                'rating': float(review.rating),
                'comment': review.comment,
                'status': review.status,
                'is_flagged': review.isFlagged,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
                'updated_at': review.updatedAt.isoformat(),
                'can_edit': can_edit,
                'rating_quality': float(review.rating_quality or 0),
                'rating_communication': float(review.rating_communication or 0),
                'rating_punctuality': float(review.rating_punctuality or 0),
                'rating_professionalism': float(review.rating_professionalism or 0),
            })

        # 2. Get reviews RECEIVED by user
        received_reviews_qs = JobReview.objects.filter(
            revieweeID=user,
            status='ACTIVE'
        ).select_related('reviewerID', 'jobID').order_by('-createdAt')

        # Format received reviews
        received_list = []
        for review in received_reviews_qs[:50]:
            # Show reviewer info
            reviewer_profile = Profile.objects.filter(accountFK=review.reviewerID).first()
            profile_name = "Anonymous"
            profile_img = None
            if reviewer_profile:
                profile_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}".strip()
                profile_img = reviewer_profile.profileImg

            received_list.append({
                'review_id': review.reviewID,
                'job_id': review.jobID.jobID,
                'reviewer_id': review.reviewerID.accountID,
                'reviewer_name': profile_name,
                'reviewer_profile_img': profile_img,
                'reviewee_id': review.revieweeID.accountID,
                'reviewer_type': review.reviewerType,
                'rating': float(review.rating),
                'comment': review.comment,
                'status': review.status,
                'is_flagged': review.isFlagged,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
                'updated_at': review.updatedAt.isoformat(),
                'can_edit': False, # Cannot edit received reviews
                'rating_quality': float(review.rating_quality or 0),
                'rating_communication': float(review.rating_communication or 0),
                'rating_punctuality': float(review.rating_punctuality or 0),
                'rating_professionalism': float(review.rating_professionalism or 0),
            })

        # 3. Calculate stats from RECEIVED reviews (use unsliced queryset)
        avg_rating = received_reviews_qs.aggregate(Avg('rating'))['rating__avg'] or 0.0
        total_reviews = received_reviews_qs.count()

        breakdown = {
            'five_star': received_reviews_qs.filter(rating__gte=4.5).count(),
            'four_star': received_reviews_qs.filter(rating__gte=3.5, rating__lt=4.5).count(),
            'three_star': received_reviews_qs.filter(rating__gte=2.5, rating__lt=3.5).count(),
            'two_star': received_reviews_qs.filter(rating__gte=1.5, rating__lt=2.5).count(),
            'one_star': received_reviews_qs.filter(rating__lt=1.5).count(),
        }

        stats = {
            'average_rating': float(avg_rating),
            'total_reviews': total_reviews,
            'rating_breakdown': breakdown,
            'recent_reviews': received_list[:5],
        }

        # 4. Return combined response
        return {
            'success': True,
            'data': {
                'reviews_given': given_list,
                'reviews_received': received_list,
                'stats': stats,
                'page': page,
                'limit': limit,
                'total_pages': 1 # Simplified for now
            }
        }

    except Exception as e:
        print(f"❌ [Mobile] Get my reviews error: {str(e)}")
        return {'success': False, 'error': f'Failed to fetch reviews: {str(e)}'}


def get_review_stats_mobile(worker_id: int) -> Dict[str, Any]:
    """
    Get review statistics for a worker's WORKER profile

    Args:
        worker_id: Account ID of the worker

    Returns:
        Review statistics for the worker profile only (not client profile)
    """
    try:
        # Get worker account
        try:
            worker_account = Accounts.objects.get(accountID=worker_id)
        except Accounts.DoesNotExist:
            return {'success': False, 'error': 'Worker not found'}

        # Get the WORKER profile for this account
        worker_profile = Profile.objects.filter(
            accountFK=worker_account,
            profileType='WORKER'
        ).first()

        # Get all active reviews for the WORKER profile
        if worker_profile:
            reviews = JobReview.objects.filter(
                revieweeProfileID=worker_profile,
                status='ACTIVE'
            )
            # Fallback for old reviews without profileID
            if not reviews.exists():
                reviews = JobReview.objects.filter(
                    revieweeID=worker_account,
                    reviewerType='CLIENT',  # Only client reviews about workers
                    status='ACTIVE'
                )
        else:
            # Fallback: filter by reviewer type
            reviews = JobReview.objects.filter(
                revieweeID=worker_account,
                reviewerType='CLIENT',
                status='ACTIVE'
            )

        # Calculate average rating
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
        total_reviews = reviews.count()

        # Rating breakdown
        breakdown = {
            'five_star': reviews.filter(rating__gte=4.5).count(),
            'four_star': reviews.filter(rating__gte=3.5, rating__lt=4.5).count(),
            'three_star': reviews.filter(rating__gte=2.5, rating__lt=3.5).count(),
            'two_star': reviews.filter(rating__gte=1.5, rating__lt=2.5).count(),
            'one_star': reviews.filter(rating__lt=1.5).count(),
        }

        # Recent reviews (last 5)
        recent_reviews = reviews.select_related('reviewerID', 'jobID').order_by('-createdAt')[:5]
        recent_list = []

        for review in recent_reviews:
            # Get reviewer info (handles both profiles and agencies)
            reviewer_name, reviewer_img = get_reviewer_info(review.reviewerID)

            recent_list.append({
                'review_id': review.reviewID,
                'job_id': review.jobID.jobID,
                'reviewer_id': review.reviewerID.accountID,
                'reviewer_name': reviewer_name,
                'reviewer_profile_img': reviewer_img,
                'reviewee_id': review.revieweeID.accountID,
                'reviewer_type': review.reviewerType,
                'rating': float(review.rating),
                'comment': review.comment,
                'status': review.status,
                'is_flagged': review.isFlagged,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
                'updated_at': review.updatedAt.isoformat(),
                'can_edit': False,
            })

        return {
            'success': True,
            'data': {
                'average_rating': float(avg_rating),
                'total_reviews': total_reviews,
                'rating_breakdown': breakdown,
                'recent_reviews': recent_list
            }
        }

    except Exception as e:
        print(f"❌ [Mobile] Get review stats error: {str(e)}")
        return {'success': False, 'error': f'Failed to fetch review stats: {str(e)}'}


def edit_review_mobile(
    user: Accounts,
    review_id: int,
    rating: int,
    comment: str,
    rating_quality: int = None,
    rating_communication: int = None,
    rating_punctuality: int = None,
    rating_professionalism: int = None,
) -> Dict[str, Any]:
    """
    Edit an existing review.
    Allowed within 24 hours of creation OR within backjob_edit_deadline (7 days post-resolution).

    Args:
        user: Current authenticated user
        review_id: ID of the review to edit
        rating: New overall rating (1-5)
        comment: New comment text
        rating_quality: Optional quality sub-rating (1-5)
        rating_communication: Optional communication sub-rating (1-5)
        rating_punctuality: Optional punctuality sub-rating (1-5)
        rating_professionalism: Optional professionalism sub-rating (1-5)

    Returns:
        Updated review data or error
    """
    try:
        # Get review
        try:
            review = JobReview.objects.get(reviewID=review_id)
        except JobReview.DoesNotExist:
            return {'success': False, 'error': 'Review not found'}

        # Check ownership
        if review.reviewerID.accountID != user.accountID:
            return {'success': False, 'error': 'You can only edit your own reviews'}

        # Check edit window: 24h from creation OR backjob edit deadline
        now = timezone.now()
        within_24h = (now - review.createdAt) <= timedelta(hours=24)
        within_backjob_window = (
            review.backjob_edit_deadline is not None and now < review.backjob_edit_deadline
        )
        if not within_24h and not within_backjob_window:
            if review.backjob_edit_deadline is not None:
                return {'success': False, 'error': 'Edit window has expired (7-day backjob review period ended)'}
            return {'success': False, 'error': 'Can only edit reviews within 24 hours of creation'}

        # Validate overall rating
        if rating < 1 or rating > 5:
            return {'success': False, 'error': 'Rating must be between 1 and 5'}

        # Validate optional sub-ratings
        for field_name, value in [
            ('rating_quality', rating_quality),
            ('rating_communication', rating_communication),
            ('rating_punctuality', rating_punctuality),
            ('rating_professionalism', rating_professionalism),
        ]:
            if value is not None and (value < 1 or value > 5):
                return {'success': False, 'error': f'{field_name} must be between 1 and 5'}

        # Update review fields
        review.rating = Decimal(str(rating))
        review.comment = comment.strip()
        if rating_quality is not None:
            review.rating_quality = Decimal(str(rating_quality))
        if rating_communication is not None:
            review.rating_communication = Decimal(str(rating_communication))
        if rating_punctuality is not None:
            review.rating_punctuality = Decimal(str(rating_punctuality))
        if rating_professionalism is not None:
            review.rating_professionalism = Decimal(str(rating_professionalism))
        review.save()

        # Format response
        profile_type = getattr(user, 'profile_type', None)
        reviewer_name, reviewer_img = get_reviewer_info(user, profile_type)

        can_edit = within_24h or within_backjob_window

        return {
            'success': True,
            'data': {
                'review_id': review.reviewID,
                'job_id': review.jobID.jobID,
                'reviewer_id': user.accountID,
                'reviewer_name': reviewer_name,
                'reviewer_profile_img': reviewer_img,
                'reviewee_id': review.revieweeID.accountID,
                'reviewer_type': review.reviewerType,
                'rating': float(review.rating),
                'rating_quality': float(review.rating_quality) if review.rating_quality else None,
                'rating_communication': float(review.rating_communication) if review.rating_communication else None,
                'rating_punctuality': float(review.rating_punctuality) if review.rating_punctuality else None,
                'rating_professionalism': float(review.rating_professionalism) if review.rating_professionalism else None,
                'comment': review.comment,
                'status': review.status,
                'is_flagged': review.isFlagged,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
                'updated_at': review.updatedAt.isoformat(),
                'can_edit': can_edit,
                'backjob_edit_deadline': review.backjob_edit_deadline.isoformat() if review.backjob_edit_deadline else None,
            }
        }

    except Exception as e:
        print(f"❌ [Mobile] Edit review error: {str(e)}")
        return {'success': False, 'error': f'Failed to edit review: {str(e)}'}


def report_review_mobile(user: Accounts, review_id: int, reason: str) -> Dict[str, Any]:
    # Report a review for inappropriate content.
    # user: Current authenticated user (reporter)
    # review_id: ID of the review to report
    # reason: Reason for reporting (spam, offensive, misleading, other)
    try:
        # Get review
        try:
            review = JobReview.objects.get(reviewID=review_id)
        except JobReview.DoesNotExist:
            return {'success': False, 'error': 'Review not found'}

        # Mark review as flagged
        review.isFlagged = True
        review.flagReason = reason
        review.flaggedBy = user
        review.flaggedAt = timezone.now()
        review.save()

        return {
            'success': True,
            'data': {
                'message': 'Review reported successfully',
                'review_id': review_id
            }
        }

    except Exception as e:
        print(f"❌ [Mobile] Report review error: {str(e)}")
        return {'success': False, 'error': f'Failed to report review: {str(e)}'}


def create_user_report_mobile(
    user: Accounts,
    report_type: str,
    reason: str,
    description: str,
    reported_user_id: Optional[int] = None,
    related_content_id: Optional[int] = None,
) -> Dict[str, Any]:
    try:
        from adminpanel.models import UserReport

        valid_report_types = {choice[0] for choice in UserReport.ReportType.choices}
        valid_reasons = {choice[0] for choice in UserReport.Reason.choices}

        normalized_reason = 'fraud' if reason == 'scam' else reason

        if report_type not in valid_report_types:
            return {'success': False, 'error': 'Invalid report type'}

        if normalized_reason not in valid_reasons:
            return {'success': False, 'error': 'Invalid report reason'}

        if not description or len(description.strip()) < 10:
            return {'success': False, 'error': 'Description must be at least 10 characters'}

        if report_type == 'user' and not reported_user_id:
            return {'success': False, 'error': 'reported_user_id is required for user reports'}

        if report_type in {'job', 'review', 'message'} and not related_content_id:
            return {'success': False, 'error': 'related_content_id is required for this report type'}

        reported_user = None
        if reported_user_id:
            try:
                reported_user = Accounts.objects.get(accountID=reported_user_id)
            except Accounts.DoesNotExist:
                return {'success': False, 'error': 'Reported user not found'}

            if reported_user.accountID == user.accountID:
                return {'success': False, 'error': 'You cannot report your own account'}

        report = UserReport.objects.create(
            reporterFK=user,
            reportedUserFK=reported_user,
            reportType=report_type,
            reason=normalized_reason,
            description=description.strip(),
            relatedContentID=related_content_id,
        )

        return {
            'success': True,
            'data': {
                'report_id': int(report.reportID),
                'message': 'Report submitted successfully',
                'status': report.status,
            },
        }
    except Exception as e:
        print(f"❌ [Mobile] Create report error: {str(e)}")
        return {'success': False, 'error': f'Failed to submit report: {str(e)}'}


def get_my_reports_mobile(
    user: Accounts,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> Dict[str, Any]:
    try:
        from adminpanel.models import UserReport

        queryset = UserReport.objects.filter(reporterFK=user).select_related('reportedUserFK')

        if status and status != 'all':
            queryset = queryset.filter(status=status)

        total = queryset.count()
        total_pages = (total + limit - 1) // limit if limit > 0 else 1
        offset = max((page - 1) * limit, 0)
        reports = queryset[offset:offset + limit]

        return {
            'success': True,
            'data': {
                'reports': [
                    {
                        'id': int(r.reportID),
                        'report_type': r.reportType,
                        'reason': r.reason,
                        'description': r.description,
                        'status': r.status,
                        'action_taken': r.actionTaken,
                        'related_content_id': r.relatedContentID,
                        'reported_user_id': int(r.reportedUserFK_id) if r.reportedUserFK_id else None,
                        'created_at': r.createdAt.isoformat(),
                        'updated_at': r.updatedAt.isoformat(),
                    }
                    for r in reports
                ],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'total_pages': total_pages,
                },
            },
        }
    except Exception as e:
        print(f"❌ [Mobile] Get my reports error: {str(e)}")
        return {'success': False, 'error': f'Failed to fetch reports: {str(e)}'}


def get_pending_reviews_mobile(user: Accounts) -> Dict[str, Any]:
    # Get list of jobs that still need reviews from the current user.
    # Returns completed jobs where the user (worker or client) has not
    # submitted a review yet.
    try:
        # Get user's profile
        try:
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(user, 'profile_type', None)
            
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=user,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile (for users with single profile)
                profile = Profile.objects.filter(accountFK=user).first()
            
            if not profile:
                return {'success': False, 'error': 'Profile not found'}
        except Exception:
            return {'success': False, 'error': 'Failed to get profile'}

        # Get completed jobs where user was client or worker
        worker_profile = None
        client_profile = None

        if hasattr(profile, 'workerprofile'):
            worker_profile = profile.workerprofile
        if hasattr(profile, 'clientprofile'):
            client_profile = profile.clientprofile

        pending_jobs = []

        # Check jobs where user was worker
        if worker_profile:
            worker_jobs = Job.objects.filter(
                workerID=worker_profile,
                status='COMPLETED'
            ).select_related('clientID__profileID')

            for job in worker_jobs:
                # Check if worker already reviewed this job
                existing_review = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=user
                ).exists()

                if not existing_review and job.clientID:
                    client_account = job.clientID.profileID.accountFK
                    client_name = f"{job.clientID.profileID.firstName} {job.clientID.profileID.lastName}".strip()

                    # Lookup conversation for this job
                    from profiles.models import Conversation
                    conv = Conversation.objects.filter(relatedJobPosting_id=job.jobID).first()

                    pending_jobs.append({
                        'job_id': job.jobID,
                        'job_title': job.title,
                        'completed_at': job.updatedAt.isoformat() if job.updatedAt else None,
                        'reviewee_id': client_account.accountID,
                        'reviewee_name': client_name,
                        'review_type': 'WORKER_TO_CLIENT',
                        'conversation_id': conv.conversationID if conv else None,
                    })

        # Check jobs where user was client
        if client_profile:
            client_jobs = Job.objects.filter(
                clientID=client_profile,
                status='COMPLETED'
            ).select_related('workerID__profileID')

            for job in client_jobs:
                # Check if client already reviewed this job
                existing_review = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=user
                ).exists()

                if not existing_review and job.workerID:
                    worker_account = job.workerID.profileID.accountFK
                    worker_name = f"{job.workerID.profileID.firstName} {job.workerID.profileID.lastName}".strip()

                    # Lookup conversation for this job
                    from profiles.models import Conversation
                    conv = Conversation.objects.filter(relatedJobPosting_id=job.jobID).first()

                    pending_jobs.append({
                        'job_id': job.jobID,
                        'job_title': job.title,
                        'completed_at': job.updatedAt.isoformat() if job.updatedAt else None,
                        'reviewee_id': worker_account.accountID,
                        'reviewee_name': worker_name,
                        'review_type': 'CLIENT_TO_WORKER',
                        'conversation_id': conv.conversationID if conv else None,
                    })

        # Sort by completed date (most recent first)
        pending_jobs.sort(key=lambda x: x['completed_at'] or '', reverse=True)

        return {
            'success': True,
            'data': {
                'pending_reviews': pending_jobs,
                'count': len(pending_jobs)
            }
        }

    except Exception as e:
        print(f"❌ [Mobile] Get pending reviews error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'Failed to fetch pending reviews: {str(e)}'}


def get_client_detail_mobile(user, client_id):
    """
    Get detailed client profile for mobile app.
    Allows workers to view client profile details.
    
    Returns data matching ClientDetail interface:
    {
        id, firstName, lastName, email, phoneNumber, profilePicture,
        description, rating, reviewCount, jobsPosted, jobsCompleted,
        totalSpent, city, province, joinedDate, verified
    }
    """
    try:
        from .models import Profile, ClientProfile, JobReview, Job
        from django.db.models import Avg, Count, Sum
        
        print(f"📱 [CLIENT DETAIL] Looking up client with account_id={client_id}")
        
        # Get client profile by account ID
        try:
            profile = Profile.objects.filter(
                accountFK__accountID=client_id,
                profileType='CLIENT'
            ).select_related('accountFK').first()
            
            if not profile:
                print(f"   ❌ Client profile not found for account_id={client_id}")
                return {
                    'success': False,
                    'error': 'Client not found'
                }
                
            account = profile.accountFK
            
            # Get ClientProfile for additional details
            try:
                client_profile = ClientProfile.objects.get(profileID=profile)
            except ClientProfile.DoesNotExist:
                client_profile = None
                
        except Exception as e:
            print(f"   ❌ Error fetching client: {str(e)}")
            return {
                'success': False,
                'error': 'Client not found'
            }
        
        print(f"   ✅ Found client: {profile.firstName} {profile.lastName}")
        
        # Get reviews about this client's CLIENT profile (from workers who completed jobs)
        # First try with profileID, then fallback to account + reviewer type
        reviews_qs = JobReview.objects.filter(
            revieweeProfileID=profile,
            status='ACTIVE'
        )
        
        # Fallback for old reviews without profileID
        if not reviews_qs.exists():
            reviews_qs = JobReview.objects.filter(
                revieweeID=account,
                reviewerType='WORKER',  # Workers reviewing the client
                status='ACTIVE'
            )
        
        avg_rating = reviews_qs.aggregate(Avg('rating'))['rating__avg'] or 0.0
        review_count = reviews_qs.count()
        
        # Get job statistics
        jobs_posted = 0
        jobs_completed = 0
        total_spent = 0
        
        if client_profile:
            jobs = Job.objects.filter(clientID=client_profile)
            jobs_posted = jobs.count()
            jobs_completed = jobs.filter(status='COMPLETED').count()
            total_spent = jobs.filter(
                status='COMPLETED',
                budget__isnull=False
            ).aggregate(total=Sum('budget'))['total'] or 0
        
        # Build response
        data = {
            'id': account.accountID,
            'firstName': profile.firstName or '',
            'lastName': profile.lastName or '',
            'email': account.email,
            'phoneNumber': profile.contactNum or None,
            'profilePicture': profile.profileImg if profile.profileImg else None,
            'description': client_profile.description if client_profile else None,
            'rating': round(float(avg_rating), 1),
            'reviewCount': review_count,
            'jobsPosted': jobs_posted,
            'jobsCompleted': jobs_completed,
            'totalSpent': float(total_spent),
            'city': account.city or None,
            'province': account.province or None,
            'joinedDate': account.createdAt.isoformat() if account.createdAt else None,
            'verified': account.isVerified or False,
        }
        
        print(f"   ✅ Client details: rating={data['rating']}, jobs={jobs_posted}")
        
        return {
            'success': True,
            'data': data
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Get client detail error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'Failed to fetch client details: {str(e)}'}


def get_client_reviews_mobile(client_id: int, page: int = 1, limit: int = 10) -> Dict[str, Any]:
    """
    Get all reviews for a specific client's CLIENT profile (reviews from workers).
    
    Args:
        client_id: Account ID of the client
        page: Page number
        limit: Reviews per page
        
    Returns:
        Paginated list of reviews for the client profile only
    """
    try:
        # Get client account
        try:
            client_account = Accounts.objects.get(accountID=client_id)
        except Accounts.DoesNotExist:
            return {'success': False, 'error': 'Client not found'}
        
        # Get the CLIENT profile for this account
        client_profile = Profile.objects.filter(
            accountFK=client_account,
            profileType='CLIENT'
        ).first()
        
        # Get reviews where client PROFILE is reviewee (from workers)
        if client_profile:
            reviews_qs = JobReview.objects.filter(
                revieweeProfileID=client_profile,
                status='ACTIVE'
            ).select_related(
                'reviewerID',
                'jobID'
            ).order_by('-createdAt')
            
            # Fallback for old reviews without profileID
            if not reviews_qs.exists():
                reviews_qs = JobReview.objects.filter(
                    revieweeID=client_account,
                    reviewerType='WORKER',  # Reviews from workers about the client
                    status='ACTIVE'
                ).select_related(
                    'reviewerID',
                    'jobID'
                ).order_by('-createdAt')
        else:
            # Fallback: filter by reviewer type
            reviews_qs = JobReview.objects.filter(
                revieweeID=client_account,
                reviewerType='WORKER',
                status='ACTIVE'
            ).select_related(
                'reviewerID',
                'jobID'
            ).order_by('-createdAt')
        
        total_count = reviews_qs.count()
        
        # Calculate average rating
        avg_rating = reviews_qs.aggregate(Avg('rating'))['rating__avg'] or 0.0
        
        # Rating distribution
        rating_distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for review in reviews_qs:
            rating = int(review.rating)
            if rating in rating_distribution:
                rating_distribution[rating] += 1
        
        # Pagination
        offset = (page - 1) * limit
        reviews = reviews_qs[offset:offset + limit]
        
        # Format reviews
        review_list = []
        for review in reviews:
            # Get reviewer info (handles both profiles and agencies)
            reviewer_name, reviewer_img = get_reviewer_info(review.reviewerID)
            
            # Get job title
            job_title = review.jobID.title if review.jobID else "Job"
            
            review_list.append({
                'review_id': review.reviewID,
                'job_id': review.jobID.jobID if review.jobID else None,
                'job_title': job_title,
                'reviewer_id': review.reviewerID.accountID,
                'reviewer_name': reviewer_name,
                'reviewer_profile_img': reviewer_img,
                'rating': float(review.rating),
                'comment': review.comment,
                'created_at': review.createdAt.isoformat(),
                # Multi-criteria category ratings (default 0 for old reviews)
                'rating_quality': float(review.rating_quality or 0),
                'rating_communication': float(review.rating_communication or 0),
                'rating_punctuality': float(review.rating_punctuality or 0),
                'rating_professionalism': float(review.rating_professionalism or 0),
            })
        
        return {
            'success': True,
            'data': {
                'reviews': review_list,
                'total_count': total_count,
                'average_rating': round(float(avg_rating), 1),
                'rating_distribution': rating_distribution,
                'page': page,
                'limit': limit,
                'total_pages': (total_count + limit - 1) // limit if total_count > 0 else 1
            }
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Get client reviews error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'Failed to fetch client reviews: {str(e)}'}



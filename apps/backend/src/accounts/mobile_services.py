# mobile_services.py
# Mobile-specific service layer for optimized API responses

from .models import (
    Accounts, Profile, WorkerProfile, ClientProfile,
    JobPosting, JobApplication, Specializations, JobPhoto, JobReview, Job, Agency
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


def get_mobile_job_list(
    user: Accounts,
    category_id: Optional[int] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    location: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> Dict[str, Any]:
    """
    Get paginated job listings optimized for mobile
    Returns minimal fields for list view performance
    Automatically sorts by distance if user has location set
    """
    from math import radians, sin, cos, sqrt, atan2
    
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates in kilometers using Haversine formula"""
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
        
        # Base query - only ACTIVE jobs that are LISTING type (exclude INVITE/direct hire jobs)
        queryset = JobPosting.objects.filter(
            status='ACTIVE',
            jobType='LISTING',  # Only show public job listings, not direct invites
            assignedWorkerID__isnull=True,  # Exclude jobs that already have a worker
            assignedAgencyFK__isnull=True,  # Exclude jobs assigned to agencies
        ).exclude(
            clientID__profileID__accountFK=user  # Exclude jobs posted by the same user
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
                print(f"   Job {job.jobID}: distance = {distance:.2f} km" if distance else f"   Job {job.jobID}: no distance")

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
                '_distance_sort': distance if distance is not None else 999999,  # Large number for jobs without distance
            }
            jobs_with_distance.append(job_data)
        
        # Sort by distance if user has location, otherwise by creation date
        if user_lat and user_lon:
            jobs_with_distance.sort(key=lambda x: x['_distance_sort'])
            print(f"📍 [SORT] Sorted {len(jobs_with_distance)} jobs by distance")
        
        # Remove the sorting helper field
        for job in jobs_with_distance:
            del job['_distance_sort']
        
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
        
        # Calculate client average rating from reviews where they were reviewed
        from .models import JobReview
        from django.db.models import Avg
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
                
                # Calculate worker average rating from reviews where they were reviewed
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
                }
                print(f"   ✓ Assigned worker: {assigned_worker['name']}, Rating: {worker_rating:.2f}")
            except Exception as e:
                print(f"   ⚠️ Could not fetch assigned worker: {str(e)}")

        # Capture completed-job reviews (client ↔ worker)
        reviews_payload = None
        if job.status == 'COMPLETED':
            print("   🔎 Fetching job reviews for completed job...")
            profile_cache: Dict[int, Dict[str, Any]] = {}

            def build_account_snapshot(account: Accounts) -> Dict[str, Any]:
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

        job_data = {
            'id': job.jobID,
            'title': job.title,
            'description': job.description,
            'budget': float(job.budget),
            'location': job.location,
            'expected_duration': job.expectedDuration,
            'urgency_level': job.urgency,
            'preferred_start_date': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
            'materials_needed': materials_needed,
            'photos': photos,
            'status': job.status,
            'created_at': job.createdAt.isoformat(),
            'job_type': job.jobType,
            'category': {
                'id': job.categoryID.specializationID if job.categoryID else None,
                'name': job.categoryID.specializationName if job.categoryID else "General",
            },
            'client': client_data,
            'assigned_worker': assigned_worker,
            'applications_count': applications_count,
            'is_applied': has_applied,
            'user_application': user_application,
            'escrow_paid': job.escrowPaid,
            'remaining_payment_paid': job.remainingPaymentPaid,
            'downpayment_amount': float(job.budget * Decimal('0.5')),
            'remaining_amount': float(job.budget * Decimal('0.5')),
            'estimated_completion': ml_prediction,
        }

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

        # Calculate downpayment (50%) + platform commission (5%)
        escrow_amount = budget * Decimal('0.5')  # 50% escrow
        commission_fee = budget * Decimal('0.05')  # 5% platform fee
        downpayment_amount = escrow_amount + commission_fee  # Total: 52.5% (or 50% + 5%)

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
            materialsNeeded=materials_json,
            categoryID=category,
            status='PENDING_PAYMENT',  # Will change to ACTIVE after payment
            escrowAmount=escrow_amount,  # 50% held in escrow
            remainingPayment=escrow_amount,  # 50% remaining payment (no commission on final)
        )

        # Handle payment based on method
        payment_method = job_data.get('downpayment_method', 'WALLET')
        payment_result = None

        if payment_method == 'WALLET':
            # Process wallet payment
            try:
                # Deduct from wallet
                from .services import deduct_from_wallet
                deduct_result = deduct_from_wallet(user.accountID, float(downpayment_amount))

                if deduct_result.get('success'):
                    # Mark escrow as paid
                    job.escrowPaid = True
                    job.escrowPaidAt = timezone.now()
                    job.status = 'ACTIVE'
                    job.downpaymentMethod = 'WALLET'
                    job.save()

                    payment_result = {
                        'payment_method': 'WALLET',
                        'status': 'SUCCESS',
                        'message': 'Payment successful via wallet',
                    }
                else:
                    # Insufficient funds
                    job.delete()  # Rollback job creation
                    return {
                        'success': False,
                        'error': deduct_result.get('error', 'Insufficient wallet balance')
                    }

            except Exception as e:
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
                'error': 'Invalid payment method. Only WALLET is supported.'
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
        
        # Validate category
        category_id = job_data.get('category_id')
        try:
            category = Specializations.objects.get(specializationID=category_id)
        except Specializations.DoesNotExist:
            return {'success': False, 'error': 'Invalid category'}
        
        # Validate budget
        budget = Decimal(str(job_data.get('budget', 0)))
        if budget <= 0:
            return {'success': False, 'error': 'Budget must be greater than 0'}
        
        # Calculate escrow (50%) + commission (5%)
        escrow_amount = budget * Decimal('0.5')
        commission_fee = budget * Decimal('0.05')
        downpayment_amount = escrow_amount + commission_fee  # 52.5% total
        remaining_payment = budget * Decimal('0.5')
        
        print(f"💰 Budget: ₱{budget} | Escrow: ₱{escrow_amount} | Commission: ₱{commission_fee} | Downpayment: ₱{downpayment_amount}")
        
        # Parse preferred start date
        preferred_start_date_obj = None
        preferred_start_date_str = job_data.get('preferred_start_date')
        if preferred_start_date_str:
            try:
                preferred_start_date_obj = datetime.strptime(preferred_start_date_str, "%Y-%m-%d").date()
            except ValueError:
                return {'success': False, 'error': 'Invalid date format. Use YYYY-MM-DD'}
        
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
                    materialsNeeded=job_data.get('materials_needed', []),
                    jobType="INVITE",  # INVITE type job
                    inviteStatus="PENDING",  # Waiting for worker/agency response
                    status="ACTIVE",  # Job created, awaiting acceptance
                    assignedAgencyFK=assigned_agency,
                    assignedWorkerID=assigned_worker
                )
                
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


def get_job_categories_mobile() -> Dict[str, Any]:
    """
    Get all job categories/specializations for mobile
    """
    try:
        categories = Specializations.objects.all().order_by('specializationName')

        category_list = [
            {
                'id': cat.specializationID,
                'name': cat.specializationName,
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

        # Get user's profile
        try:
            profile = Profile.objects.select_related('accountFK').get(accountFK=user)
        except Profile.DoesNotExist:
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
        profile.profileImg = image_url
        profile.save()

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

def get_workers_list_mobile(user, latitude=None, longitude=None, page=1, limit=20):
    """
    Get list of workers for clients
    Optionally calculate distance if location provided
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
        
        # Get all worker profiles, excluding agency owners only
        workers = WorkerProfile.objects.select_related(
            'profileID',
            'profileID__accountFK'
        ).filter(
            profileID__accountFK__isVerified=True,
            profileID__accountFK__KYCVerified=True
        ).exclude(
            profileID__accountFK__accountID__in=agency_owner_account_ids
        ).order_by('-profileID__accountFK__createdAt')

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
            
            # Get specializations using the correct model and relation
            from .models import workerSpecialization
            specializations_query = workerSpecialization.objects.filter(
                workerID=worker
            ).select_related('specializationID')
            
            # Calculate average rating from reviews
            from .models import JobReview
            from django.db.models import Avg
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
                'worker_id': worker.id,  # Django auto-generated primary key
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
                'specializations': [
                    {'id': ws.specializationID.specializationID, 'name': ws.specializationID.specializationName}
                    for ws in specializations_query
                ],
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

        # Get specializations
        from .models import workerSpecialization
        specializations_query = workerSpecialization.objects.filter(
            workerID=worker
        ).select_related('specializationID')

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
            'specializations': [
                {'id': ws.specializationID.specializationID, 'name': ws.specializationID.specializationName}
                for ws in specializations_query
            ],
            'total_earning': float(worker.totalEarningGross) if worker.totalEarningGross else 0.0,
            'rating': round(avg_rating, 2) if avg_rating else 0.0,
            'review_count': review_count,
            'kyc_verified': account.KYCVerified,
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

        # Get reviews and rating
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

        # Get skills from bio/description (simplified)
        # TODO: Add proper skills table if needed
        skills = []
        if worker.description:
            # Extract skills from description
            common_skills = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 
                           'Welding', 'Masonry', 'Tiling', 'Roofing']
            skills = [skill for skill in common_skills if skill.lower() in worker.description.lower()]

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
            'isVerified': cert.is_verified
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
            'skills': skills,
            'verified': account.KYCVerified or False,
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
        avg_rating = 0.0
        review_count = 0
        total_jobs_completed = 0
        active_workers = agency_employees_qs.count()
        specializations = []  # TODO: Implement when employee-specialization relationship exists

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
                'specialization': emp.role or None
            })
        
        # Calculate overall rating from employees
        employee_ratings = [emp.rating for emp in agency_employees_qs if emp.rating]
        if employee_ratings:
            avg_rating = sum(employee_ratings) / len(employee_ratings)
        
        # Calculate total jobs from employees
        total_jobs_completed = sum(emp.totalJobsCompleted for emp in agency_employees_qs)

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

def submit_review_mobile(user: Accounts, job_id: int, rating: int, comment: str, review_type: str) -> Dict[str, Any]:
    # Submit a review for a completed job.
    # Validates job completion, reviewer eligibility, and creates review record.
    
    try:
        # Validate job exists and is completed
        try:
            job = Job.objects.get(jobID=job_id)
        except Job.DoesNotExist:
            return {'success': False, 'error': 'Job not found'}

        if job.status != 'COMPLETED':
            return {'success': False, 'error': 'Can only review completed jobs'}

        # Determine reviewer and reviewee based on review type
        if review_type == 'CLIENT_TO_WORKER':
            # Client reviewing worker
            reviewer_type = 'CLIENT'
            if not job.clientID or job.clientID.profileID.accountFK.accountID != user.accountID:
                return {'success': False, 'error': 'You are not the client for this job'}
            if not job.workerID:
                return {'success': False, 'error': 'No worker assigned to this job'}
            reviewee = job.workerID.profileID.accountFK
        elif review_type == 'WORKER_TO_CLIENT':
            # Worker reviewing client
            reviewer_type = 'WORKER'
            if not job.workerID or job.workerID.profileID.accountFK.accountID != user.accountID:
                return {'success': False, 'error': 'You are not the worker for this job'}
            if not job.clientID:
                return {'success': False, 'error': 'No client for this job'}
            reviewee = job.clientID.profileID.accountFK
        else:
            return {'success': False, 'error': 'Invalid review type'}

        # Check if review already exists
        existing_review = JobReview.objects.filter(
            jobID=job,
            reviewerID=user
        ).first()

        if existing_review:
            return {'success': False, 'error': 'You have already reviewed this job'}

        # Validate rating
        if rating < 1 or rating > 5:
            return {'success': False, 'error': 'Rating must be between 1 and 5'}

        # Create review
        review = JobReview.objects.create(
            jobID=job,
            reviewerID=user,
            revieweeID=reviewee,
            reviewerType=reviewer_type,
            rating=Decimal(str(rating)),
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
                'reviewee_id': reviewee.accountID,
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
    Get all reviews for a specific worker

    Args:
        worker_id: Account ID of the worker
        page: Page number
        limit: Reviews per page

    Returns:
        Paginated list of reviews
    """
    try:
        # Get worker account
        try:
            worker_account = Accounts.objects.get(accountID=worker_id)
        except Accounts.DoesNotExist:
            return {'success': False, 'error': 'Worker not found'}

        # Get reviews where worker is reviewee
        reviews_qs = JobReview.objects.filter(
            revieweeID=worker_account,
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
        for review in reviews:
            # Get reviewer info (handles both profiles and agencies)
            reviewer_name, reviewer_img = get_reviewer_info(review.reviewerID)

            # Check if can edit (within 24 hours)
            can_edit = False
            if (timezone.now() - review.createdAt) <= timedelta(hours=24):
                can_edit = True

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
    Get reviews given or received by current user

    Args:
        user: Current authenticated user
        review_type: 'given' or 'received'
        page: Page number
        limit: Reviews per page

    Returns:
        Paginated list of reviews
    """
    try:
        if review_type == 'given':
            reviews_qs = JobReview.objects.filter(
                reviewerID=user,
                status='ACTIVE'
            ).select_related('revieweeID__profile', 'jobID')
        else:  # received
            reviews_qs = JobReview.objects.filter(
                revieweeID=user,
                status='ACTIVE'
            ).select_related('reviewerID__profile', 'jobID')

        reviews_qs = reviews_qs.order_by('-createdAt')

        total_count = reviews_qs.count()

        # Pagination
        offset = (page - 1) * limit
        reviews = reviews_qs[offset:offset + limit]

        # Format reviews
        review_list = []
        for review in reviews:
            if review_type == 'given':
                # Show reviewee info
                profile = review.revieweeID.profile if hasattr(review.revieweeID, 'profile') else None
                profile_name = "Anonymous"
                profile_img = None
                if profile:
                    profile_name = f"{profile.firstName} {profile.lastName}".strip()
                    profile_img = profile.profileImg
            else:
                # Show reviewer info
                profile = review.reviewerID.profile if hasattr(review.reviewerID, 'profile') else None
                profile_name = "Anonymous"
                profile_img = None
                if profile:
                    profile_name = f"{profile.firstName} {profile.lastName}".strip()
                    profile_img = profile.profileImg

            can_edit = (timezone.now() - review.createdAt) <= timedelta(hours=24)

            review_list.append({
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
                'can_edit': can_edit and review_type == 'given',  # Can only edit own reviews
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
        print(f"❌ [Mobile] Get my reviews error: {str(e)}")
        return {'success': False, 'error': f'Failed to fetch reviews: {str(e)}'}


def get_review_stats_mobile(worker_id: int) -> Dict[str, Any]:
    """
    Get review statistics for a worker

    Args:
        worker_id: Account ID of the worker

    Returns:
        Review statistics including average rating, total reviews, breakdown
    """
    try:
        # Get worker account
        try:
            worker_account = Accounts.objects.get(accountID=worker_id)
        except Accounts.DoesNotExist:
            return {'success': False, 'error': 'Worker not found'}

        # Get all active reviews
        reviews = JobReview.objects.filter(
            revieweeID=worker_account,
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


def edit_review_mobile(user: Accounts, review_id: int, rating: int, comment: str) -> Dict[str, Any]:
    """
    Edit an existing review (only allowed within 24 hours)

    Args:
        user: Current authenticated user
        review_id: ID of the review to edit
        rating: New rating (1-5)
        comment: New comment text

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

        # Check 24-hour window
        time_since_creation = timezone.now() - review.createdAt
        if time_since_creation > timedelta(hours=24):
            return {'success': False, 'error': 'Can only edit reviews within 24 hours of creation'}

        # Validate rating
        if rating < 1 or rating > 5:
            return {'success': False, 'error': 'Rating must be between 1 and 5'}

        # Update review
        review.rating = Decimal(str(rating))
        review.comment = comment.strip()
        review.save()

        # Format response - use helper function to get name (handles agencies too)
        profile_type = getattr(user, 'profile_type', None)
        reviewer_name, reviewer_img = get_reviewer_info(user, profile_type)

        can_edit = (timezone.now() - review.createdAt) <= timedelta(hours=24)

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
                'comment': review.comment,
                'status': review.status,
                'is_flagged': review.isFlagged,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
                'updated_at': review.updatedAt.isoformat(),
                'can_edit': can_edit,
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

                    pending_jobs.append({
                        'job_id': job.jobID,
                        'job_title': job.title,
                        'completed_at': job.updatedAt.isoformat() if job.updatedAt else None,
                        'reviewee_id': client_account.accountID,
                        'reviewee_name': client_name,
                        'review_type': 'WORKER_TO_CLIENT'
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

                    pending_jobs.append({
                        'job_id': job.jobID,
                        'job_title': job.title,
                        'completed_at': job.updatedAt.isoformat() if job.updatedAt else None,
                        'reviewee_id': worker_account.accountID,
                        'reviewee_name': worker_name,
                        'review_type': 'CLIENT_TO_WORKER'
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
        
        # Get reviews about this client (from workers who completed jobs)
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
    Get all reviews for a specific client (reviews from workers about the client).
    
    Args:
        client_id: Account ID of the client
        page: Page number
        limit: Reviews per page
        
    Returns:
        Paginated list of reviews with reviewer info
    """
    try:
        # Get client account
        try:
            client_account = Accounts.objects.get(accountID=client_id)
        except Accounts.DoesNotExist:
            return {'success': False, 'error': 'Client not found'}
        
        # Get reviews where client is reviewee (from workers)
        reviews_qs = JobReview.objects.filter(
            revieweeID=client_account,
            reviewerType='WORKER',  # Reviews from workers about the client
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



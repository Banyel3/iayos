# mobile_services.py
# Mobile-specific service layer for optimized API responses

from .models import (
    Accounts, Profile, WorkerProfile, ClientProfile,
    JobPosting, JobApplication, Specializations, JobPhoto
)
from django.db.models import Q, Count, Avg, Prefetch
from django.utils import timezone
from datetime import datetime
from typing import Optional, List, Dict, Any
from .services import generateCookie
from decimal import Decimal


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
    """
    try:
        # Base query - only ACTIVE jobs
        queryset = JobPosting.objects.filter(status='ACTIVE')

        # Apply filters
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if min_budget:
            queryset = queryset.filter(budget__gte=min_budget)

        if max_budget:
            queryset = queryset.filter(budget__lte=max_budget)

        if location:
            queryset = queryset.filter(
                Q(location__icontains=location) |
                Q(street_address__icontains=location) |
                Q(city__icontains=location) |
                Q(province__icontains=location)
            )

        # Optimize queries with select_related and prefetch_related
        queryset = queryset.select_related(
            'clientFK__accountFK',
            'category'
        ).prefetch_related(
            'JobPhoto'
        )

        # Order by urgency and creation date
        urgency_order = {
            'HIGH': 1,
            'MEDIUM': 2,
            'LOW': 3,
        }
        queryset = queryset.order_by('-createdAt')

        # Calculate pagination
        total_count = queryset.count()
        start = (page - 1) * limit
        end = start + limit

        jobs = queryset[start:end]

        # Build mobile-optimized response
        job_list = []
        for job in jobs:
            # Check if current user has applied
            has_applied = JobApplication.objects.filter(
                jobPostingFK=job,
                workerFK__accountFK=user
            ).exists() if hasattr(user, 'profile') and hasattr(user.profile.first(), 'workerprofile') else False

            # Get client info
            client_profile = job.clientFK.accountFK.profile.first()
            client_name = f"{client_profile.firstName} {client_profile.lastName}" if client_profile else "Unknown Client"

            job_data = {
                'jobPostingID': job.jobPostingID,
                'title': job.title,
                'budget': float(job.budget),
                'location': job.location or f"{job.city}, {job.province}",
                'urgency_level': job.urgencyLevel,
                'created_at': job.createdAt.isoformat(),
                'category_name': job.category.specializationName if job.category else "General",
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
            'error': f'Failed to fetch jobs: {str(e)}'
        }


def get_mobile_job_detail(job_id: int, user: Accounts) -> Dict[str, Any]:
    """
    Get complete job details for mobile view
    Includes user-specific data (is_applied, user's application)
    """
    try:
        job = JobPosting.objects.select_related(
            'clientFK__accountFK',
            'assignedWorkerFK__accountFK',
            'category'
        ).prefetch_related(
            'JobPhoto',
            'specializations',
            'JobApplication'
        ).get(jobPostingID=job_id)

        # Get client info
        client_profile = job.clientFK.accountFK.profile.first()
        client_data = {
            'id': job.clientFK.accountFK.accountID,
            'name': f"{client_profile.firstName} {client_profile.lastName}" if client_profile else "Unknown",
            'avatar': client_profile.profileImg if client_profile and client_profile.profileImg else None,
            'rating': 0.0,  # TODO: Calculate from reviews
        }

        # Get job photos
        photos = [photo.photoURL for photo in job.JobPhoto.all()]

        # Check if user has applied
        user_application = None
        has_applied = False

        # Get user's worker profile if exists
        user_profiles = user.profile.all()
        user_worker_profile = None
        for profile in user_profiles:
            if hasattr(profile, 'workerprofile'):
                user_worker_profile = profile.workerprofile
                break

        if user_worker_profile:
            try:
                application = JobApplication.objects.get(
                    jobPostingFK=job,
                    workerFK=user_worker_profile
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
        applications_count = JobApplication.objects.filter(jobPostingFK=job).count()

        # Parse materials needed (stored as JSON string)
        import json
        materials_needed = None
        if job.materialsNeeded:
            try:
                materials_needed = json.loads(job.materialsNeeded) if isinstance(job.materialsNeeded, str) else job.materialsNeeded
            except:
                materials_needed = [job.materialsNeeded]

        job_data = {
            'jobPostingID': job.jobPostingID,
            'title': job.title,
            'description': job.description,
            'budget': float(job.budget),
            'location': job.location or f"{job.city}, {job.province}",
            'expected_duration': job.expectedDuration,
            'urgency_level': job.urgencyLevel,
            'preferred_start_date': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
            'materials_needed': materials_needed,
            'photos': photos,
            'status': job.status,
            'created_at': job.createdAt.isoformat(),
            'category': {
                'id': job.category.specializationID if job.category else None,
                'name': job.category.specializationName if job.category else "General",
            },
            'client': client_data,
            'applications_count': applications_count,
            'is_applied': has_applied,
            'user_application': user_application,
            'escrow_paid': job.escrowPaid,
            'remaining_payment_paid': job.remainingPaymentPaid,
            'downpayment_amount': float(job.budget * Decimal('0.5')),
            'remaining_amount': float(job.budget * Decimal('0.5')),
        }

        return {
            'success': True,
            'data': job_data
        }

    except JobPosting.DoesNotExist:
        return {
            'success': False,
            'error': 'Job not found'
        }
    except Exception as e:
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
        user_profiles = user.profile.all()
        client_profile = None
        for profile in user_profiles:
            if hasattr(profile, 'clientprofile'):
                client_profile = profile.clientprofile
                break

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

        # Calculate downpayment (50%)
        downpayment_amount = budget * Decimal('0.5')

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
            clientFK=client_profile,
            title=job_data['title'],
            description=job_data['description'],
            budget=budget,
            location=job_data.get('location'),
            expectedDuration=job_data.get('expected_duration', 'Not specified'),
            urgencyLevel=job_data.get('urgency_level', 'MEDIUM'),
            preferredStartDate=datetime.fromisoformat(job_data['preferred_start_date']) if job_data.get('preferred_start_date') else None,
            materialsNeeded=materials_json,
            category=category,
            status='PENDING_PAYMENT',  # Will change to ACTIVE after payment
            escrowAmount=downpayment_amount,
            remainingPayment=downpayment_amount,
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

        elif payment_method == 'GCASH':
            # Generate Xendit payment link
            try:
                from .xendit_service import create_xendit_payment

                xendit_result = create_xendit_payment(
                    amount=float(downpayment_amount),
                    description=f"Job Downpayment - {job.title}",
                    reference_id=f"JOB_{job.jobPostingID}",
                    customer_email=user.email,
                )

                if xendit_result.get('success'):
                    # Save payment URL
                    job.downpaymentMethod = 'GCASH'
                    job.save()

                    payment_result = {
                        'payment_method': 'GCASH',
                        'status': 'PENDING',
                        'payment_url': xendit_result['payment_url'],
                        'message': 'Please complete payment via GCash',
                    }
                else:
                    job.delete()  # Rollback
                    return {
                        'success': False,
                        'error': 'Failed to generate GCash payment link'
                    }

            except Exception as e:
                job.delete()  # Rollback
                return {
                    'success': False,
                    'error': f'GCash payment setup failed: {str(e)}'
                }

        return {
            'success': True,
            'data': {
                'job_id': job.jobPostingID,
                'title': job.title,
                'budget': float(job.budget),
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
            Q(city__icontains=query) |
            Q(category__specializationName__icontains=query),
            status='ACTIVE'
        ).select_related(
            'clientFK__accountFK',
            'category'
        ).distinct().order_by('-createdAt')

        # Calculate pagination
        total_count = queryset.count()
        start = (page - 1) * limit
        end = start + limit

        jobs = queryset[start:end]

        # Build mobile-optimized response
        job_list = []
        for job in jobs:
            # Check if current user has applied
            user_profiles = user.profile.all()
            user_worker_profile = None
            for profile in user_profiles:
                if hasattr(profile, 'workerprofile'):
                    user_worker_profile = profile.workerprofile
                    break

            has_applied = False
            if user_worker_profile:
                has_applied = JobApplication.objects.filter(
                    jobPostingFK=job,
                    workerFK=user_worker_profile
                ).exists()

            # Get client info
            client_profile = job.clientFK.accountFK.profile.first()
            client_name = f"{client_profile.firstName} {client_profile.lastName}" if client_profile else "Unknown Client"

            job_data = {
                'jobPostingID': job.jobPostingID,
                'title': job.title,
                'budget': float(job.budget),
                'location': job.location or f"{job.city}, {job.province}",
                'urgency_level': job.urgencyLevel,
                'created_at': job.createdAt.isoformat(),
                'category_name': job.category.specializationName if job.category else "General",
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
            'profile_img': profile.profileImg or '',
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


def update_user_profile_mobile(user, payload):
    """
    Update user profile
    Allowed fields: firstName, lastName, contactNum, birthDate
    """
    try:
        from .models import Profile
        from datetime import datetime

        # Get user's profile
        try:
            profile = Profile.objects.get(accountFK=user)
        except Profile.DoesNotExist:
            return {
                'success': False,
                'error': 'Profile not found'
            }

        # Update allowed fields
        if 'firstName' in payload:
            profile.firstName = payload['firstName']
        if 'lastName' in payload:
            profile.lastName = payload['lastName']
        if 'contactNum' in payload:
            profile.contactNum = payload['contactNum']
        if 'birthDate' in payload and payload['birthDate']:
            # Parse date string (YYYY-MM-DD)
            try:
                profile.birthDate = datetime.strptime(payload['birthDate'], '%Y-%m-%d').date()
            except ValueError:
                return {
                    'success': False,
                    'error': 'Invalid date format. Use YYYY-MM-DD'
                }

        profile.save()

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
        from .services import upload_file_to_supabase

        # Get user's profile
        try:
            profile = Profile.objects.get(accountFK=user)
        except Profile.DoesNotExist:
            return {
                'success': False,
                'error': 'Profile not found'
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

        # Upload to Supabase
        bucket_name = 'profile-images'
        file_path = f'users/{user.accountID}/{image_file.name}'

        image_url = upload_file_to_supabase(
            file_content=image_file.read(),
            bucket_name=bucket_name,
            file_path=file_path,
            content_type=image_file.content_type
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

        # Only allow clients to view workers
        try:
            user_profile = Profile.objects.get(accountFK=user)
            if user_profile.profileType != 'CLIENT':
                return {
                    'success': False,
                    'error': 'Only clients can view worker listings'
                }
        except Profile.DoesNotExist:
            return {
                'success': False,
                'error': 'User profile not found'
            }

        # Get all worker profiles
        workers = WorkerProfile.objects.select_related(
            'profileFK',
            'profileFK__accountFK'
        ).prefetch_related(
            'specializations'
        ).filter(
            profileFK__accountFK__isVerified=True,
            profileFK__accountFK__KYCVerified=True
        ).order_by('-profileFK__accountFK__createdAt')

        total_count = workers.count()

        # Pagination
        offset = (page - 1) * limit
        workers = workers[offset:offset + limit]

        # Build worker list
        worker_list = []
        for worker in workers:
            profile = worker.profileFK
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

            worker_data = {
                'worker_id': worker.workerID,
                'profile_id': profile.profileID,
                'account_id': account.accountID,
                'name': f"{profile.firstName or ''} {profile.lastName or ''}".strip(),
                'profile_img': profile.profileImg or '',
                'bio': worker.bio or '',
                'hourly_rate': float(worker.hourlyRate) if worker.hourlyRate else 0.0,
                'availability_status': worker.availabilityStatus,
                'specializations': [
                    {'id': s.specializationID, 'name': s.specializationName}
                    for s in worker.specializations.all()
                ],
                'verified_skills': worker.verifiedSkills or [],
                'total_earning': float(worker.totalEarningGross) if worker.totalEarningGross else 0.0,
            }

            if distance is not None:
                worker_data['distance_km'] = distance

            worker_list.append(worker_data)

        return {
            'success': True,
            'data': {
                'workers': worker_list,
                'total_count': total_count,
                'page': page,
                'pages': (total_count + limit - 1) // limit,
            }
        }

    except Exception as e:
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
                'profileFK',
                'profileFK__accountFK'
            ).prefetch_related(
                'specializations'
            ).get(workerID=worker_id)
        except WorkerProfile.DoesNotExist:
            return {
                'success': False,
                'error': 'Worker not found'
            }

        profile = worker.profileFK
        account = profile.accountFK

        # Get reviews and rating
        reviews_qs = Review.objects.filter(workerFK=worker)
        avg_rating = reviews_qs.aggregate(Avg('rating'))['rating__avg']
        review_count = reviews_qs.count()

        # Build detailed worker data
        worker_data = {
            'worker_id': worker.workerID,
            'profile_id': profile.profileID,
            'account_id': account.accountID,
            'name': f"{profile.firstName or ''} {profile.lastName or ''}".strip(),
            'profile_img': profile.profileImg or '',
            'contact_num': profile.contactNum or '',
            'bio': worker.bio or '',
            'description': worker.description or '',
            'hourly_rate': float(worker.hourlyRate) if worker.hourlyRate else 0.0,
            'availability_status': worker.availabilityStatus,
            'specializations': [
                {'id': s.specializationID, 'name': s.specializationName}
                for s in worker.specializations.all()
            ],
            'verified_skills': worker.verifiedSkills or [],
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
        from .models import Profile, JobPosting, JobApplication
        from django.db.models import Q

        # Get user's profile
        try:
            user_profile = Profile.objects.get(accountFK=user)
        except Profile.DoesNotExist:
            return {
                'success': False,
                'error': 'User profile not found'
            }

        if user_profile.profileType == 'CLIENT':
            # Get client's posted jobs
            jobs_qs = JobPosting.objects.select_related(
                'clientID',
                'clientID__profileFK',
                'categoryFK',
                'assignedWorkerID'
            ).filter(
                clientID__profileFK__accountFK=user
            )

        elif user_profile.profileType == 'WORKER':
            # Get jobs worker applied to or is assigned to
            from .models import WorkerProfile

            try:
                worker_profile = WorkerProfile.objects.get(profileFK=user_profile)
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
                'clientID',
                'clientID__profileFK',
                'categoryFK',
                'assignedWorkerID'
            ).filter(
                Q(assignedWorkerID=worker_profile) | Q(jobID__in=applied_job_ids)
            )

        else:
            return {
                'success': False,
                'error': 'Invalid profile type'
            }

        # Filter by status if provided
        if status:
            jobs_qs = jobs_qs.filter(status=status.upper())

        # Order by created date (newest first)
        jobs_qs = jobs_qs.order_by('-createdAt')

        total_count = jobs_qs.count()

        # Pagination
        offset = (page - 1) * limit
        jobs = jobs_qs[offset:offset + limit]

        # Build job list
        job_list = []
        for job in jobs:
            client_profile = job.clientID.profileFK if job.clientID else None

            job_data = {
                'job_id': job.jobID,
                'title': job.title,
                'description': job.description,
                'budget': float(job.budget) if job.budget else 0.0,
                'location': job.location or '',
                'status': job.status,
                'urgency_level': job.urgencyLevel,
                'expected_duration': job.expectedDuration or '',
                'category_id': job.categoryFK.specializationID if job.categoryFK else None,
                'category_name': job.categoryFK.specializationName if job.categoryFK else 'General',
                'created_at': job.createdAt.isoformat() if job.createdAt else None,
                'preferred_start_date': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
                'materials_needed': job.materialsNeeded or [],
            }

            # Add client info
            if client_profile:
                job_data['client_name'] = f"{client_profile.firstName or ''} {client_profile.lastName or ''}".strip()
                job_data['client_img'] = client_profile.profileImg or ''

            # Add worker info if assigned
            if job.assignedWorkerID:
                worker_profile = job.assignedWorkerID.profileFK
                job_data['worker_name'] = f"{worker_profile.firstName or ''} {worker_profile.lastName or ''}".strip()
                job_data['worker_img'] = worker_profile.profileImg or ''

            # For workers, add application status
            if user_profile.profileType == 'WORKER':
                try:
                    worker_profile = WorkerProfile.objects.get(profileFK=user_profile)
                    application = JobApplication.objects.filter(
                        jobID=job,
                        workerID=worker_profile
                    ).first()
                    if application:
                        job_data['application_status'] = application.status
                        job_data['application_id'] = application.applicationID
                except:
                    pass

            job_list.append(job_data)

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
            user_profile = Profile.objects.get(accountFK=user)
        except Profile.DoesNotExist:
            return {
                'success': False,
                'error': 'User profile not found'
            }

        # Only workers can view available jobs
        if user_profile.profileType != 'WORKER':
            return {
                'success': False,
                'error': 'Only workers can view available jobs'
            }

        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileFK=user_profile)
        except WorkerProfile.DoesNotExist:
            return {
                'success': False,
                'error': 'Worker profile not found'
            }

        # Get job IDs worker already applied to
        applied_job_ids = JobApplication.objects.filter(
            workerID=worker_profile
        ).values_list('jobID', flat=True)

        # Get ACTIVE jobs that worker hasn't applied to
        jobs_qs = JobPosting.objects.select_related(
            'clientID',
            'clientID__profileFK',
            'categoryFK'
        ).filter(
            status='ACTIVE'
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
            client_profile = job.clientID.profileFK if job.clientID else None

            job_data = {
                'job_id': job.jobID,
                'title': job.title,
                'description': job.description,
                'budget': float(job.budget) if job.budget else 0.0,
                'location': job.location or '',
                'status': job.status,
                'urgency_level': job.urgencyLevel,
                'expected_duration': job.expectedDuration or '',
                'category_id': job.categoryFK.specializationID if job.categoryFK else None,
                'category_name': job.categoryFK.specializationName if job.categoryFK else 'General',
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

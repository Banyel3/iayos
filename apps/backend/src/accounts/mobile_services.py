# mobile_services.py
# Mobile-specific service layer for optimized API responses

from .models import (
    Accounts, Profile, WorkerProfile, ClientProfile,
    JobPosting, JobApplication, Specializations, JobPhoto, JobReview, Job
)
from django.db.models import Q, Count, Avg, Prefetch
from django.utils import timezone
from datetime import datetime, timedelta
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
        from iayos_project.utils import upload_file

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


# ===========================================================================
# REVIEW & RATING SERVICES (Phase 8)
# ===========================================================================

def submit_review_mobile(user: Accounts, job_id: int, rating: int, comment: str, review_type: str) -> Dict[str, Any]:
    """
    Submit a review for a completed job

    Args:
        user: Current authenticated user (reviewer)
        job_id: ID of the job being reviewed
        rating: Rating from 1-5
        comment: Review text
        review_type: 'CLIENT_TO_WORKER' or 'WORKER_TO_CLIENT'

    Returns:
        Success response with review data or error
    """
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

        # Format response
        reviewer_profile = user.profile if hasattr(user, 'profile') else None
        reviewer_name = "Anonymous"
        reviewer_img = None

        if reviewer_profile:
            reviewer_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}".strip()
            reviewer_img = reviewer_profile.profileImg

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
            'reviewerID__profile',
            'jobID'
        ).order_by('-createdAt')

        total_count = reviews_qs.count()

        # Pagination
        offset = (page - 1) * limit
        reviews = reviews_qs[offset:offset + limit]

        # Format reviews
        review_list = []
        for review in reviews:
            reviewer_profile = review.reviewerID.profile if hasattr(review.reviewerID, 'profile') else None
            reviewer_name = "Anonymous"
            reviewer_img = None

            if reviewer_profile:
                reviewer_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}".strip()
                reviewer_img = reviewer_profile.profileImg

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
        ).select_related('reviewerID__profile').order_by('-createdAt')

        review_list = []
        for review in reviews_qs:
            reviewer_profile = review.reviewerID.profile if hasattr(review.reviewerID, 'profile') else None
            reviewer_name = "Anonymous"
            reviewer_img = None

            if reviewer_profile:
                reviewer_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}".strip()
                reviewer_img = reviewer_profile.profileImg

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
        recent_reviews = reviews.select_related('reviewerID__profile').order_by('-createdAt')[:5]
        recent_list = []

        for review in recent_reviews:
            reviewer_profile = review.reviewerID.profile if hasattr(review.reviewerID, 'profile') else None
            reviewer_name = "Anonymous"
            reviewer_img = None

            if reviewer_profile:
                reviewer_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}".strip()
                reviewer_img = reviewer_profile.profileImg

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

        # Format response
        reviewer_profile = user.profile if hasattr(user, 'profile') else None
        reviewer_name = "Anonymous"
        reviewer_img = None

        if reviewer_profile:
            reviewer_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}".strip()
            reviewer_img = reviewer_profile.profileImg

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
    """
    Report a review for inappropriate content

    Args:
        user: Current authenticated user (reporter)
        review_id: ID of the review to report
        reason: Reason for reporting (spam, offensive, misleading, other)

    Returns:
        Success message or error
    """
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
    """
    Get list of jobs that need reviews from the current user
    Returns completed jobs where user hasn't submitted a review yet

    Args:
        user: Current authenticated user

    Returns:
        List of jobs pending review
    """
    try:
        # Get user's profile
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return {'success': False, 'error': 'Profile not found'}

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

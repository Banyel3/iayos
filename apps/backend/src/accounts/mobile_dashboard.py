# mobile_dashboard.py
# Dashboard-specific service functions for mobile app

from .models import (
    Accounts, Profile, WorkerProfile, ClientProfile,
    JobPosting, JobApplication
)
from typing import Dict, Any


def get_dashboard_stats_mobile(user: Accounts) -> Dict[str, Any]:
    """
    Get dashboard statistics for mobile
    Different data for CLIENT vs WORKER
    """
    try:
        # Get user's profile
        user_profiles = user.profile_set.all()
        user_profile = user_profiles.first() if user_profiles.exists() else None

        if not user_profile:
            return {
                'success': False,
                'error': 'Profile not found'
            }

        stats = {
            'profile_type': user_profile.profileType,
        }

        # Worker statistics
        if hasattr(user_profile, 'workerprofile'):
            worker_profile = user_profile.workerprofile

            # Count jobs
            total_jobs = JobPosting.objects.filter(
                assignedWorkerID=worker_profile
            ).count()

            active_jobs = JobPosting.objects.filter(
                assignedWorkerID=worker_profile,
                status='IN_PROGRESS'
            ).count()

            completed_jobs = JobPosting.objects.filter(
                assignedWorkerID=worker_profile,
                status='COMPLETED'
            ).count()

            # Count applications
            pending_applications = JobApplication.objects.filter(
                workerID=worker_profile,
                status='PENDING'
            ).count()

            stats.update({
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'completed_jobs': completed_jobs,
                'pending_applications': pending_applications,
                'total_earnings': float(worker_profile.totalEarningGross or 0),
                'availability_status': worker_profile.availabilityStatus,
                'worker_rating': float(worker_profile.workerRating or 0),
            })

        # Client statistics
        elif hasattr(user_profile, 'clientprofile'):
            client_profile = user_profile.clientprofile

            # Count jobs
            total_jobs = JobPosting.objects.filter(
                clientID=client_profile
            ).count()

            active_jobs = JobPosting.objects.filter(
                clientID=client_profile,
                status__in=['ACTIVE', 'IN_PROGRESS']
            ).count()

            completed_jobs = JobPosting.objects.filter(
                clientID=client_profile,
                status='COMPLETED'
            ).count()

            # Get pending applications across all jobs
            pending_applications = JobApplication.objects.filter(
                jobID__clientID=client_profile,
                status='PENDING'
            ).count()

            stats.update({
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'completed_jobs': completed_jobs,
                'pending_applications': pending_applications,
            })

        return {
            'success': True,
            'data': stats
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to fetch dashboard stats: {str(e)}'
        }


def get_dashboard_recent_jobs_mobile(user: Accounts, limit: int = 5) -> Dict[str, Any]:
    """
    Get recent jobs for dashboard
    - Workers: Recent available jobs to apply to
    - Clients: Their recent posted jobs
    """
    try:
        user_profiles = user.profile_set.all()
        user_profile = user_profiles.first() if user_profiles.exists() else None

        if not user_profile:
            return {
                'success': False,
                'error': 'Profile not found'
            }

        jobs_list = []

        # Worker: Show recent ACTIVE LISTING jobs they can apply to (exclude INVITE jobs)
        if hasattr(user_profile, 'workerprofile'):
            worker_profile = user_profile.workerprofile

            # Get jobs they haven't applied to
            applied_job_ids = JobApplication.objects.filter(
                workerID=worker_profile
            ).values_list('jobID_id', flat=True)

            jobs = JobPosting.objects.filter(
                status='ACTIVE',
                jobType='LISTING'  # Only show public job listings, not direct invites
            ).exclude(
                jobID__in=applied_job_ids
            ).select_related(
                'clientID__accountFK',
                'categoryID'
            ).prefetch_related(
                'photos'
            ).order_by('-createdAt')[:limit]

        # Client: Show their recent posted jobs
        elif hasattr(user_profile, 'clientprofile'):
            client_profile = user_profile.clientprofile

            jobs = JobPosting.objects.filter(
                clientID=client_profile
            ).select_related(
                'assignedWorkerID__profileId__accountFK',
                'categoryID'
            ).prefetch_related(
                'photos',
                'applications'
            ).order_by('-createdAt')[:limit]

        else:
            return {
                'success': True,
                'data': {'jobs': []}
            }

        # Format jobs
        jobs_list = []
        for job in jobs:
            # Get client info
            client_profile_obj = job.clientID.accountFK.profile_set.first()
            client_name = f"{client_profile_obj.firstName} {client_profile_obj.lastName}" if client_profile_obj else "Unknown"

            # Count applications
            application_count = JobApplication.objects.filter(jobID=job).count()

            job_data = {
                'job_id': job.jobID,
                'title': job.title,
                'description': job.description[:100] + '...' if len(job.description) > 100 else job.description,
                'budget': float(job.budget),
                'location': job.location or 'Location not specified',
                'status': job.status,
                'urgency_level': job.urgency,
                'category_name': job.categoryID.specializationName if job.categoryID else 'General',
                'client_name': client_name,
                'created_at': job.createdAt.isoformat(),
                'application_count': application_count,
            }

            jobs_list.append(job_data)

        return {
            'success': True,
            'data': {'jobs': jobs_list}
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to fetch recent jobs: {str(e)}'
        }


def get_available_workers_mobile(user: Accounts, limit: int = 10) -> Dict[str, Any]:
    """
    Get available workers near user (for clients)
    """
    try:
        # Get user's profile to check they're a client
        user_profiles = user.profile_set.all()
        user_profile = user_profiles.first() if user_profiles.exists() else None

        if not user_profile or not hasattr(user_profile, 'clientprofile'):
            return {
                'success': False,
                'error': 'Only clients can view workers'
            }

        # Get available workers
        workers = WorkerProfile.objects.filter(
            availabilityStatus='AVAILABLE'
        ).select_related(
            'profileID__accountFK'
        ).prefetch_related(
            'specializations'
        )[:limit]

        workers_list = []
        for worker in workers:
            profile = worker.profileID
            account = profile.accountFK

            # Get specializations
            specializations = [spec.specializationName for spec in worker.specializations.all()[:3]]

            # Count completed jobs
            completed_jobs = JobPosting.objects.filter(
                assignedWorkerID=worker,
                status='COMPLETED'
            ).count()

            worker_data = {
                'worker_id': worker.workerID,
                'name': f"{profile.firstName} {profile.lastName}",
                'avatar': profile.profileImg,
                'specializations': specializations,
                'hourly_rate': float(worker.hourlyRate) if worker.hourlyRate else None,
                'rating': float(worker.workerRating or 0),
                'completed_jobs': completed_jobs,
                'is_available': worker.availabilityStatus == 'AVAILABLE',
                'bio': worker.bio[:100] + '...' if worker.bio and len(worker.bio) > 100 else worker.bio,
            }

            workers_list.append(worker_data)

        return {
            'success': True,
            'data': {
                'workers': workers_list,
                'total_count': len(workers_list)
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to fetch workers: {str(e)}'
        }

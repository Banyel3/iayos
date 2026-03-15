"""
Optimized Database Queries for Admin Panel

This module provides optimized query functions using:
- select_related() for ForeignKey relationships (single JOIN)
- prefetch_related() for reverse FK and M2M relationships
- Subqueries and annotations to avoid N+1 queries
- Database-level aggregations instead of Python-side loops
- Cached property calculations where possible

Usage: Import and use these functions in service.py to replace slow queries.
"""

from django.db import models
from django.db.models import (
    Count, Avg, Sum, Max, Min, F, Q, Value, Case, When,
    OuterRef, Subquery, Prefetch, ExpressionWrapper, FloatField, IntegerField, DecimalField
)
from django.db.models.functions import Coalesce, TruncDate, TruncMonth, Now
from django.core.paginator import Paginator
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from typing import Optional, Dict, Any, List

from accounts.models import (
    Accounts, Profile, Job, JobApplication, JobReview, Transaction,
    kyc, kycFiles, Wallet, WorkerProfile, ClientProfile, Specializations,
    workerSpecialization
)
from agency.models import AgencyKYC, AgencyKycFile, AgencyEmployee
from accounts.models import Agency
from adminpanel.models import KYCLogs


# =============================================================================
# DASHBOARD STATISTICS - OPTIMIZED
# =============================================================================

def get_dashboard_stats_optimized() -> Dict[str, Any]:
    """
    Get all dashboard statistics in minimal database queries.
    Uses annotations and aggregations to avoid multiple round trips.
    """
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Single query for user counts with conditional aggregation
    user_stats = Accounts.objects.aggregate(
        total_users=Count('accountID'),
        active_users=Count('accountID', filter=Q(isVerified=True)),
        new_this_month=Count('accountID', filter=Q(createdAt__gte=month_start)),
    )
    
    # Single query for profile type distribution
    profile_stats = Profile.objects.values('profileType').annotate(
        count=Count('profileID')
    )
    profile_counts = {p['profileType']: p['count'] for p in profile_stats}
    
    # Single query for agency count
    total_agencies = Agency.objects.count()
    
    # Single query for KYC pending counts
    pending_user_kyc = kyc.objects.filter(kyc_status='PENDING').count()
    pending_agency_kyc = AgencyKYC.objects.filter(status='PENDING').count()
    
    # Single query for job statistics with conditional aggregation
    job_stats = Job.objects.aggregate(
        total_jobs=Count('jobID'),
        active_jobs=Count('jobID', filter=Q(status='ACTIVE')),
        in_progress_jobs=Count('jobID', filter=Q(status='IN_PROGRESS')),
        completed_jobs=Count('jobID', filter=Q(status='COMPLETED')),
        cancelled_jobs=Count('jobID', filter=Q(status='CANCELLED')),
        new_jobs_this_month=Count('jobID', filter=Q(createdAt__gte=month_start)),
    )

    # Single aggregation for financial stats
    financial_stats = Transaction.objects.aggregate(
        total_revenue=Coalesce(Sum('amount', filter=Q(status='COMPLETED')), Value(0), output_field=DecimalField()),
        escrow_held=Coalesce(
            Sum('amount', filter=Q(transactionType='ESCROW', status='PENDING')),
            Value(0),
            output_field=DecimalField()
        ),
    )

    # Calculate global rating
    avg_rating = JobReview.objects.filter(status='ACTIVE').aggregate(
        avg=Avg('rating')
    )['avg'] or 0.0

    total_revenue = float(financial_stats['total_revenue'])
    platform_fees = round(total_revenue * float(getattr(settings, 'PLATFORM_FEE_RATE', 0.10)), 2)

    # --- New Metrics Calculations ---
    
    # 1. Platform Fee Trend (comparing this month to last month)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
    this_month_volume = Transaction.objects.filter(
        status='COMPLETED', createdAt__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    last_month_volume = Transaction.objects.filter(
        status='COMPLETED', createdAt__gte=last_month_start, createdAt__lt=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    this_month_fees = float(this_month_volume) * float(getattr(settings, 'PLATFORM_FEE_RATE', 0.10))
    last_month_fees = float(last_month_volume) * float(getattr(settings, 'PLATFORM_FEE_RATE', 0.10))
    
    platform_fee_trend = 0
    if last_month_fees > 0:
        platform_fee_trend = round(((this_month_fees - last_month_fees) / last_month_fees) * 100, 1)
    elif this_month_fees > 0:
        platform_fee_trend = 100.0  # Infinite increase, represented as 100%

    # 2. Top Job Categories
    top_categories_qs = Job.objects.filter(status='COMPLETED').values(
        'categoryID__specializationName'
    ).annotate(
        earnings=Sum('budget'),
        posts=Count('jobID')
    ).order_by('-earnings')[:5]
    
    top_job_categories = [
        {
            'name': cat['categoryID__specializationName'] or 'Uncategorized',
            'earnings': float(cat['earnings'] or 0),
            'posts': cat['posts']
        }
        for cat in top_categories_qs
    ]

    # 3. Revenue Chart Data
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    
    def fetch_revenue_data(start_date=None, group_by_month=False):
        qs = Transaction.objects.filter(status='COMPLETED')
        if start_date:
            qs = qs.filter(createdAt__gte=start_date)
            
        trunc_func = TruncMonth('createdAt') if group_by_month else TruncDate('createdAt')
        
        data = qs.annotate(
            date=trunc_func
        ).values('date').annotate(
            total=Sum('amount')
        ).order_by('date')
        
        formatted = []
        for d in data:
            if not d['date']:
                continue
            amt = float(d['total'] or 0)
            formatted.append({
                'name': d['date'].strftime('%b %Y') if group_by_month else d['date'].strftime('%a') if start_date == seven_days_ago else d['date'].strftime('%b %d'),
                'TotalRevenue': amt,
                'PlatformCut': round(amt * float(getattr(settings, 'PLATFORM_FEE_RATE', 0.10)), 2)
            })
        return formatted
        
    revenue_chart_data = {
        '7d': fetch_revenue_data(seven_days_ago, False),
        '30d': fetch_revenue_data(thirty_days_ago, False),
        'All': fetch_revenue_data(None, True),
    }

    return {
        'total_users': user_stats['total_users'],
        'total_clients': profile_counts.get('CLIENT', 0),
        'total_workers': profile_counts.get('WORKER', 0),
        'total_agencies': total_agencies,
        'active_users': user_stats['active_users'],
        'new_users_this_month': user_stats['new_this_month'],
        'pending_kyc': pending_user_kyc + pending_agency_kyc,
        'pending_individual_kyc': pending_user_kyc,
        'pending_agency_kyc': pending_agency_kyc,
        **job_stats,
        'open_jobs': job_stats['active_jobs'] + job_stats['in_progress_jobs'],
        # New business metrics
        'total_revenue': total_revenue,
        'escrow_held': float(financial_stats['escrow_held']),
        'platform_fees': platform_fees,
        'global_avg_rating': round(float(avg_rating), 1),
        'platform_fee_trend': platform_fee_trend,
        'top_job_categories': top_job_categories,
        'revenue_chart_data': revenue_chart_data,
    }


# =============================================================================
# KYC LIST - OPTIMIZED
# =============================================================================

def get_kyc_list_optimized(
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> Dict[str, Any]:
    """
    Get paginated KYC list with all related data in 2-3 queries max.
    """
    # Base queryset with all related data prefetched
    queryset = kyc.objects.select_related(
        'accountFK',
        'reviewedBy'
    ).prefetch_related(
        Prefetch(
            'kycfiles_set',
            queryset=kycFiles.objects.all()
        )
    ).order_by('-createdAt')
    
    # Apply status filter
    if status_filter:
        queryset = queryset.filter(kyc_status=status_filter.upper())
    
    # Get profiles for all accounts in one query
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    # Batch fetch profiles for all accounts on this page
    account_ids = [k.accountFK_id for k in page_obj]
    profiles = Profile.objects.filter(
        accountFK_id__in=account_ids
    ).select_related('accountFK')
    profile_map = {p.accountFK_id: p for p in profiles}
    
    # Build result
    kyc_list = []
    for record in page_obj:
        profile = profile_map.get(record.accountFK_id)
        files = list(record.kycfiles_set.all())  # Already prefetched
        
        kyc_list.append({
            'kycID': record.kycID,
            'accountID': record.accountFK_id,
            'email': record.accountFK.email,
            'firstName': profile.firstName if profile else '',
            'lastName': profile.lastName if profile else '',
            'kycStatus': record.kyc_status,
            'createdAt': record.createdAt.isoformat() if record.createdAt else None,
            'reviewedAt': record.reviewedAt.isoformat() if record.reviewedAt else None,
            'reviewedBy': record.reviewedBy.email if record.reviewedBy else None,
            'notes': record.notes,
            'files': [
                {
                    'fileID': f.kycFileID,
                    'idType': f.idType,
                    'fileName': f.fileName,
                    'fileURL': f.fileURL,
                }
                for f in files
            ],
            'fileCount': len(files),
        })
    
    return {
        'kyc': kyc_list,
        'total': paginator.count,
        'page': page,
        'totalPages': paginator.num_pages,
        'hasNext': page_obj.has_next(),
        'hasPrevious': page_obj.has_previous(),
    }


# =============================================================================
# USERS LIST - OPTIMIZED (Clients/Workers/Agencies)
# =============================================================================

def get_clients_list_optimized(
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated clients list with job stats in minimal queries.
    Uses subqueries and annotations to avoid N+1 queries.
    """
    # Jobs count subqueries - aggregate jobs per account
    jobs_total_sq = Job.objects.filter(
        clientID__profileID__accountFK=OuterRef('accountFK')
    ).values('clientID__profileID__accountFK').annotate(c=Count('jobID')).values('c')
    
    jobs_completed_sq = Job.objects.filter(
        clientID__profileID__accountFK=OuterRef('accountFK'),
        status='COMPLETED'
    ).values('clientID__profileID__accountFK').annotate(c=Count('jobID')).values('c')
    
    jobs_active_sq = Job.objects.filter(
        clientID__profileID__accountFK=OuterRef('accountFK'),
        status='ACTIVE'
    ).values('clientID__profileID__accountFK').annotate(c=Count('jobID')).values('c')
    
    # Reviews subqueries
    rating_sq = JobReview.objects.filter(
        revieweeID=OuterRef('accountFK'),
        status='ACTIVE'
    ).values('revieweeID').annotate(avg=Avg('rating')).values('avg')
    
    review_count_sq = JobReview.objects.filter(
        revieweeID=OuterRef('accountFK'),
        status='ACTIVE'
    ).values('revieweeID').annotate(c=Count('reviewID')).values('c')
    
    # KYC Status subquery
    kyc_status_sq = kyc.objects.filter(
        accountFK=OuterRef('accountFK')
    ).order_by('-createdAt').values('kyc_status')[:1]
    
    # Main query with annotations
    queryset = Profile.objects.filter(
        profileType='CLIENT'
    ).select_related(
        'accountFK'
    ).annotate(
        jobs_total=Coalesce(Subquery(jobs_total_sq), Value(0), output_field=IntegerField()),
        jobs_completed=Coalesce(Subquery(jobs_completed_sq), Value(0), output_field=IntegerField()),
        jobs_active=Coalesce(Subquery(jobs_active_sq), Value(0), output_field=IntegerField()),
        avg_rating=Coalesce(Subquery(rating_sq), Value(0.0), output_field=FloatField()),
        review_count=Coalesce(Subquery(review_count_sq), Value(0), output_field=IntegerField()),
        kyc_status=Subquery(kyc_status_sq),
    ).order_by('-accountFK__createdAt')
    
    # Apply filters
    if search:
        queryset = queryset.filter(
            Q(accountFK__email__icontains=search) |
            Q(firstName__icontains=search) |
            Q(lastName__icontains=search)
        )
    
    if status_filter and status_filter != 'all':
        if status_filter == 'active':
            queryset = queryset.filter(accountFK__isVerified=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(accountFK__isVerified=False)
    
    # Paginate
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    # Build result - annotations already computed, no extra queries
    clients_list = []
    for profile in page_obj:
        account = profile.accountFK
        clients_list.append({
            'id': str(account.accountID),
            'profile_id': str(profile.profileID),
            'email': account.email,
            'first_name': profile.firstName or '',
            'last_name': profile.lastName or '',
            'phone': profile.contactNum or '',
            'status': 'active' if account.isVerified else 'inactive',
            'join_date': account.createdAt.isoformat() if account.createdAt else None,
            'is_verified': account.isVerified,
            'is_suspended': account.is_suspended,
            'is_banned': account.is_banned,
            'jobs_posted': profile.jobs_total,
            'jobs_completed': profile.jobs_completed,
            'jobs_active': profile.jobs_active,
            'rating': round(float(profile.avg_rating), 1),
            'review_count': profile.review_count,
            'kyc_status': str(profile.kyc_status).upper() if profile.kyc_status else 'UNVERIFIED',
        })
    
    return {
        'clients': clients_list,
        'total': paginator.count,
        'page': page,
        'total_pages': paginator.num_pages,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }


def get_workers_list_optimized(
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    category_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Get paginated workers list with job stats and skills in minimal queries.
    """
    # Exclude agency owners
    agency_owner_ids = Agency.objects.values_list('accountFK_id', flat=True)
    
    # Subqueries for worker stats - aggregate by account
    jobs_total_sq = Job.objects.filter(
        assignedWorkerID__profileID__accountFK=OuterRef('accountFK')
    ).values('assignedWorkerID__profileID__accountFK').annotate(c=Count('jobID')).values('c')
    
    jobs_completed_sq = Job.objects.filter(
        assignedWorkerID__profileID__accountFK=OuterRef('accountFK'),
        status='COMPLETED'
    ).values('assignedWorkerID__profileID__accountFK').annotate(c=Count('jobID')).values('c')
    
    rating_sq = JobReview.objects.filter(
        revieweeID=OuterRef('accountFK'),
        status='ACTIVE'
    ).values('revieweeID').annotate(avg=Avg('rating')).values('avg')
    
    review_count_sq = JobReview.objects.filter(
        revieweeID=OuterRef('accountFK'),
        status='ACTIVE'
    ).values('revieweeID').annotate(c=Count('reviewID')).values('c')
    
    # KYC Status subquery
    kyc_status_sq = kyc.objects.filter(
        accountFK=OuterRef('accountFK')
    ).order_by('-createdAt').values('kyc_status')[:1]
    
    # Main query
    queryset = Profile.objects.filter(
        profileType='WORKER'
    ).exclude(
        accountFK_id__in=agency_owner_ids
    ).select_related(
        'accountFK'
    ).annotate(
        jobs_total=Coalesce(Subquery(jobs_total_sq), Value(0), output_field=IntegerField()),
        jobs_completed=Coalesce(Subquery(jobs_completed_sq), Value(0), output_field=IntegerField()),
        avg_rating=Coalesce(Subquery(rating_sq), Value(0.0), output_field=FloatField()),
        review_count=Coalesce(Subquery(review_count_sq), Value(0), output_field=IntegerField()),
        kyc_status=Subquery(kyc_status_sq),
    ).order_by('-accountFK__createdAt')
    
    # Apply filters
    if search:
        queryset = queryset.filter(
            Q(accountFK__email__icontains=search) |
            Q(firstName__icontains=search) |
            Q(lastName__icontains=search)
        )
    
    if status_filter and status_filter != 'all':
        if status_filter == 'active':
            queryset = queryset.filter(accountFK__isVerified=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(accountFK__isVerified=False)

    if category_id:
        worker_ids_with_category = workerSpecialization.objects.filter(
            specializationID_id=category_id
        ).values_list('workerID__profileID_id', flat=True)
        queryset = queryset.filter(profileID__in=worker_ids_with_category)

    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    # Batch fetch worker skills for all profiles on this page
    profile_ids = [p.profileID for p in page_obj]
    
    # Get WorkerProfile IDs - WorkerProfile uses 'id' as PK, not 'workerProfileID'
    worker_profiles = WorkerProfile.objects.filter(
        profileID_id__in=profile_ids
    ).values('profileID_id', 'id')
    wp_map = {wp['profileID_id']: wp['id'] for wp in worker_profiles}
    
    # Batch fetch skills
    wp_ids = list(wp_map.values())
    skills_qs = workerSpecialization.objects.filter(
        workerID_id__in=wp_ids
    ).select_related('specializationID')
    
    # Group skills by worker
    skills_map = {}
    for spec in skills_qs:
        wp_id = spec.workerID_id
        if wp_id not in skills_map:
            skills_map[wp_id] = []
        skills_map[wp_id].append({
            'name': spec.specializationID.specializationName,
            'experience_years': spec.experienceYears
        })
    
    # Build result
    workers_list = []
    for profile in page_obj:
        account = profile.accountFK
        wp_id = wp_map.get(profile.profileID)
        skills = skills_map.get(wp_id, []) if wp_id else []
        
        workers_list.append({
            'id': str(account.accountID),
            'profile_id': str(profile.profileID),
            'email': account.email,
            'first_name': profile.firstName or '',
            'last_name': profile.lastName or '',
            'phone': profile.contactNum or '',
            'status': 'active' if account.isVerified else 'inactive',
            'join_date': account.createdAt.isoformat() if account.createdAt else None,
            'is_verified': account.isVerified,
            'is_suspended': account.is_suspended,
            'is_banned': account.is_banned,
            'total_jobs': profile.jobs_total,
            'jobs_completed': profile.jobs_completed,
            'rating': round(float(profile.avg_rating), 1),
            'review_count': profile.review_count,
            'kyc_status': str(profile.kyc_status).upper() if profile.kyc_status else 'UNVERIFIED',
            'skills': skills,
            'skills_count': len(skills),
        })
    
    return {
        'workers': workers_list,
        'total': paginator.count,
        'page': page,
        'total_pages': paginator.num_pages,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }


def get_agencies_list_optimized(
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated agencies list with stats in minimal queries.
    """
    # Subqueries for agency stats
    employee_count_sq = AgencyEmployee.objects.filter(
        agency=OuterRef('accountFK'),
        isActive=True
    ).values('agency').annotate(c=Count('employeeID')).values('c')
    
    # Job.assignedAgencyFK links to Agency (not agencyFK)
    jobs_total_sq = Job.objects.filter(
        assignedAgencyFK=OuterRef('pk')
    ).values('assignedAgencyFK').annotate(c=Count('jobID')).values('c')
    
    jobs_completed_sq = Job.objects.filter(
        assignedAgencyFK=OuterRef('pk'),
        status='COMPLETED'
    ).values('assignedAgencyFK').annotate(c=Count('jobID')).values('c')
    
    rating_sq = JobReview.objects.filter(
        revieweeID=OuterRef('accountFK'),
        status='ACTIVE'
    ).values('revieweeID').annotate(avg=Avg('rating')).values('avg')
    
    # Agency KYC Status subquery
    # Both Agency and AgencyKYC share accountFK → Accounts; join on that field
    kyc_status_sq = AgencyKYC.objects.filter(
        accountFK=OuterRef('accountFK')
    ).order_by('-createdAt').values('status')[:1]
    
    # Main query
    queryset = Agency.objects.select_related(
        'accountFK'
    ).annotate(
        employee_count=Coalesce(Subquery(employee_count_sq), Value(0), output_field=IntegerField()),
        jobs_total=Coalesce(Subquery(jobs_total_sq), Value(0), output_field=IntegerField()),
        jobs_completed=Coalesce(Subquery(jobs_completed_sq), Value(0), output_field=IntegerField()),
        avg_rating=Coalesce(Subquery(rating_sq), Value(0.0), output_field=FloatField()),
        kyc_status=Subquery(kyc_status_sq),
    ).order_by('-accountFK__createdAt')
    
    # Apply filters
    if search:
        queryset = queryset.filter(
            Q(accountFK__email__icontains=search) |
            Q(businessName__icontains=search)
        )
    
    if status_filter and status_filter != 'all':
        if status_filter == 'active':
            queryset = queryset.filter(accountFK__isVerified=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(accountFK__isVerified=False)
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    # Build result
    agencies_list = []
    for agency in page_obj:
        account = agency.accountFK
        agencies_list.append({
            'id': str(agency.agencyId),
            'account_id': str(account.accountID),
            'email': account.email,
            'agency_name': agency.businessName or '',
            'phone': agency.contactNumber or '',
            'address': f"{agency.city or ''}, {agency.province or ''}".strip(', ') or 'N/A',
            'status': 'active' if account.isVerified else 'inactive',
            'join_date': account.createdAt.isoformat() if account.createdAt else None,
            'is_verified': account.isVerified,
            'total_workers': agency.employee_count,
            'total_jobs': agency.jobs_total,
            'completed_jobs': agency.jobs_completed,
            'rating': round(float(agency.avg_rating), 1),
            'kyc_status': str(agency.kyc_status).upper() if agency.kyc_status else 'UNVERIFIED',
        })
    
    return {
        'agencies': agencies_list,
        'total': paginator.count,
        'page': page,
        'total_pages': paginator.num_pages,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }


# =============================================================================
# JOBS LIST - OPTIMIZED
# =============================================================================

def get_jobs_list_optimized(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated jobs list with all related data in 1-2 queries.
    """
    # Applications count subquery
    apps_count_sq = JobApplication.objects.filter(
        jobID=OuterRef('pk')
    ).values('jobID').annotate(c=Count('applicationID')).values('c')
    
    # Main query with all relations and annotations
    queryset = Job.objects.select_related(
        'clientID__profileID__accountFK',
        'categoryID',
        'assignedWorkerID__profileID__accountFK',
        'assignedAgencyFK__accountFK'  # Changed from agencyFK to assignedAgencyFK
    ).annotate(
        applications_count=Coalesce(Subquery(apps_count_sq), Value(0), output_field=IntegerField())
    ).order_by('-createdAt')
    
    # Apply filters
    if status:
        queryset = queryset.filter(status=status.upper())
    
    if category_id:
        queryset = queryset.filter(categoryID_id=category_id)
    
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    jobs_list = []
    for job in page_obj:
        # Client info (already prefetched via select_related)
        client_profile = job.clientID.profileID if job.clientID else None
        client_account = client_profile.accountFK if client_profile else None
        
        client_info = None
        if client_account:
            client_info = {
                'id': str(client_account.accountID),
                'name': f"{client_profile.firstName or ''} {client_profile.lastName or ''}".strip() or 'Unknown',
                'rating': float(job.clientID.clientRating or 0)
            }
        
        # Worker info (already prefetched)
        worker_info = None
        if job.assignedWorkerID:
            wp = job.assignedWorkerID
            worker_profile = wp.profileID
            worker_account = worker_profile.accountFK
            worker_info = {
                'id': str(worker_account.accountID),
                'name': f"{worker_profile.firstName or ''} {worker_profile.lastName or ''}".strip() or 'Unknown',
                'rating': float(wp.workerRating or 0)
            }
        
        # Category info (already prefetched)
        category = None
        if job.categoryID:
            category = {
                'id': job.categoryID.specializationID,
                'name': job.categoryID.specializationName
            }
        
        jobs_list.append({
            'id': str(job.jobID),
            'title': job.title,
            'description': job.description[:200] if job.description else '',
            'category': category,
            'client': client_info,
            'worker': worker_info,
            'budget': float(job.budget or 0),
            'location': job.location,
            'urgency': job.urgency,
            'status': job.status,
            'job_type': job.jobType,
            'invite_status': job.inviteStatus if job.jobType == 'INVITE' else None,
            'applications_count': job.applications_count,
            'created_at': job.createdAt.isoformat() if job.createdAt else None,
            'updated_at': job.updatedAt.isoformat() if job.updatedAt else None,
            'completed_at': job.completedAt.isoformat() if job.completedAt else None,
        })
    
    return {
        'jobs': jobs_list,
        'total': paginator.count,
        'page': page,
        'total_pages': paginator.num_pages,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }


# =============================================================================
# TRANSACTIONS LIST - OPTIMIZED
# =============================================================================

def get_transactions_list_optimized(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    transaction_type: Optional[str] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated transactions with wallet owner info in minimal queries.
    """
    queryset = Transaction.objects.select_related(
        'walletID__accountFK',
        'relatedJobPosting'
    ).order_by('-createdAt')
    
    # Apply filters
    if status:
        queryset = queryset.filter(status=status.upper())
    
    if transaction_type:
        queryset = queryset.filter(transactionType=transaction_type.upper())
    
    if payment_method:
        queryset = queryset.filter(paymentMethod__iexact=payment_method)
    
    # Support both date parameter names
    effective_start = start_date or date_from
    effective_end = end_date or date_to
    
    if effective_start:
        queryset = queryset.filter(createdAt__date__gte=effective_start)
    
    if effective_end:
        queryset = queryset.filter(createdAt__date__lte=effective_end)
    
    if search:
        from django.db.models import Q
        queryset = queryset.filter(
            Q(walletID__accountFK__email__icontains=search) |
            Q(xenditPaymentID__icontains=search) |
            Q(paymongoPaymentId__icontains=search) |
            Q(referenceNumber__icontains=search)
        )
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    # Batch fetch profiles for all wallet owners
    account_ids = [
        t.walletID.accountFK_id for t in page_obj
        if t.walletID and t.walletID.accountFK_id
    ]
    profiles = Profile.objects.filter(accountFK_id__in=account_ids)
    profile_map = {p.accountFK_id: p for p in profiles}
    
    transactions_list = []
    for txn in page_obj:
        user_info = None
        if txn.walletID and txn.walletID.accountFK:
            account = txn.walletID.accountFK
            profile = profile_map.get(account.accountID)
            user_info = {
                'id': str(account.accountID),
                'email': account.email,
                'name': f"{profile.firstName or ''} {profile.lastName or ''}".strip() if profile else '',
            }
        
        transactions_list.append({
            'id': str(txn.transactionID),
            'type': txn.transactionType,
            'status': txn.status,
            'amount': float(txn.amount or 0),
            'currency': 'PHP',  # All transactions are in PHP
            'user': user_info,
            'job_id': str(txn.relatedJobPosting.jobID) if txn.relatedJobPosting else None,
            'job_title': txn.relatedJobPosting.title if txn.relatedJobPosting else None,
            'description': txn.description or None,
            'balance_after': float(txn.balanceAfter) if txn.balanceAfter is not None else None,
            'reference': txn.xenditPaymentID or txn.referenceNumber,
            'created_at': txn.createdAt.isoformat() if txn.createdAt else None,
            'completed_at': txn.completedAt.isoformat() if txn.completedAt else None,
        })
    
    return {
        'success': True,
        'transactions': transactions_list,
        'total': paginator.count,
        'page': page,
        'total_pages': paginator.num_pages,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }


# =============================================================================
# FINANCIAL STATISTICS - OPTIMIZED
# =============================================================================

def get_transaction_stats_optimized() -> Dict[str, Any]:
    """
    Get all transaction statistics in a single aggregation query.
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Single aggregation query for all stats
    stats = Transaction.objects.aggregate(
        # Total volume
        total_volume=Coalesce(Sum('amount', filter=Q(status='COMPLETED')), Value(0), output_field=DecimalField()),
        total_count=Count('transactionID'),
        
        # Pending
        pending_count=Count('transactionID', filter=Q(status='PENDING')),
        pending_amount=Coalesce(Sum('amount', filter=Q(status='PENDING')), Value(0), output_field=DecimalField()),
        
        # Escrow held
        escrow_held=Coalesce(
            Sum('amount', filter=Q(transactionType='ESCROW', status='PENDING')),
            Value(0),
            output_field=DecimalField()
        ),
        
        # Refunded
        refunded_amount=Coalesce(
            Sum('amount', filter=Q(transactionType='REFUND', status='COMPLETED')),
            Value(0),
            output_field=DecimalField()
        ),
        
        # Today's stats
        today_count=Count('transactionID', filter=Q(createdAt__gte=today_start)),
        today_volume=Coalesce(Sum('amount', filter=Q(createdAt__gte=today_start, status='COMPLETED')), Value(0), output_field=DecimalField()),
        
        # This month's stats
        month_count=Count('transactionID', filter=Q(createdAt__gte=month_start)),
        month_volume=Coalesce(Sum('amount', filter=Q(createdAt__gte=month_start, status='COMPLETED')), Value(0), output_field=DecimalField()),
    )
    
    total_count = stats['total_count']
    total_volume = float(stats['total_volume'])
    escrow_held = float(stats['escrow_held'])
    refunded_amount = float(stats['refunded_amount'])
    platform_fees = round(total_volume * float(settings.PLATFORM_FEE_RATE), 2)
    average_transaction = round(total_volume / total_count, 2) if total_count > 0 else 0.0

    return {
        'total_transactions': total_count,
        'total_volume': total_volume,
        'total_revenue': total_volume,        # alias
        'pending_count': stats['pending_count'],
        'pending_amount': float(stats['pending_amount']),
        'escrow_held': escrow_held,
        'refunded_amount': refunded_amount,
        # Aliases expected by the payments/analytics frontend
        'total_escrow_held': escrow_held,
        'total_refunded': refunded_amount,
        'platform_fees': platform_fees,
        'average_transaction': average_transaction,
        # Change-percent placeholders (historical comparison not yet implemented)
        'revenue_change_percent': 0.0,
        'transactions_change_percent': 0.0,
        'escrow_change_percent': 0.0,
        'refunded_change_percent': 0.0,
        'fees_change_percent': 0.0,
        'avg_transaction_change_percent': 0.0,
        'today_count': stats['today_count'],
        'today_volume': float(stats['today_volume']),
        'month_count': stats['month_count'],
        'month_volume': float(stats['month_volume']),
    }


# =============================================================================
# REVIEWS LIST - OPTIMIZED
# =============================================================================

def get_reviews_list_optimized(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    reviewer_type: Optional[str] = None,
    min_rating: Optional[float] = None,
    reviewee_id: Optional[str] = None,
    reviewer_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated reviews with all related data in minimal queries.
    """
    queryset = JobReview.objects.select_related(
        'reviewerID',
        'revieweeID',
        'jobID__clientID__profileID',
        'jobID__assignedWorkerID__profileID'
    ).order_by('-createdAt')
    
    if status and status != 'all':
        queryset = queryset.filter(status=status.upper())
    
    if reviewer_type and reviewer_type != 'all':
        queryset = queryset.filter(reviewerType=reviewer_type.upper())
    
    if min_rating is not None:
        queryset = queryset.filter(rating__gte=min_rating)

    if reviewee_id is not None and str(reviewee_id).lower() != 'all':
        queryset = queryset.filter(revieweeID_id=reviewee_id)

    if reviewer_id is not None and str(reviewer_id).lower() != 'all':
        queryset = queryset.filter(reviewerID_id=reviewer_id)
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    # Batch fetch profiles for reviewers and reviewees
    account_ids = set()
    for review in page_obj:
        if review.reviewerID_id:
            account_ids.add(review.reviewerID_id)
        if review.revieweeID_id:
            account_ids.add(review.revieweeID_id)
    
    profiles = Profile.objects.filter(accountFK_id__in=account_ids)
    profile_map = {p.accountFK_id: p for p in profiles}
    
    reviews_list = []
    for review in page_obj:
        reviewer_profile = profile_map.get(review.reviewerID_id)
        reviewee_profile = profile_map.get(review.revieweeID_id)
        
        reviewer_name = 'Unknown'
        if reviewer_profile:
            reviewer_name = f"{reviewer_profile.firstName or ''} {reviewer_profile.lastName or ''}".strip() or 'Unknown'

        reviewee_name = 'Unknown'
        if reviewee_profile:
            reviewee_name = f"{reviewee_profile.firstName or ''} {reviewee_profile.lastName or ''}".strip() or 'Unknown'
        
        reviews_list.append({
            'id': str(review.reviewID),
            'rating': float(review.rating),
            'comment': review.comment,
            'status': review.status,
            'is_flagged': review.status == 'FLAGGED',
            'is_hidden': review.status == 'HIDDEN',
            'reviewer_name': reviewer_name,
            'reviewee_name': reviewee_name,
            'reviewer_id': review.reviewerID_id,
            'reviewee_id': review.revieweeID_id,
            'job_id': review.jobID_id,
            'job_title': review.jobID.title if review.jobID else None,
            'created_at': review.createdAt.isoformat() if review.createdAt else None,
        })
    
    return {
        'reviews': reviews_list,
        'pagination': {
            'total': paginator.count,
            'page': page,
            'pages': paginator.num_pages,
            'hasNext': page_obj.has_next(),
            'hasPrevious': page_obj.has_previous(),
        }
    }


# =============================================================================
# WITHDRAWALS LIST - OPTIMIZED
# =============================================================================

def get_withdrawals_list_optimized(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    payment_method_filter: Optional[str] = None,
    search: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated withdrawal requests with user info in minimal queries.
    """
    from accounts.models import UserPaymentMethod
    from django.db.models import Q
    
    queryset = Transaction.objects.filter(
        transactionType='WITHDRAWAL'
    ).select_related(
        'walletID__accountFK'
    ).order_by('-createdAt')
    
    if status:
        queryset = queryset.filter(status=status.upper())
    
    if search:
        queryset = queryset.filter(
            Q(walletID__accountFK__email__icontains=search) |
            Q(referenceNumber__icontains=search)
        )
    
    # Note: payment_method_filter would filter by linked payment method type
    # This requires a subquery or post-filtering since payment methods are user-level
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    # Batch fetch profiles and payment methods
    account_ids = [
        t.walletID.accountFK_id for t in page_obj
        if t.walletID and t.walletID.accountFK_id
    ]
    
    profiles = Profile.objects.filter(accountFK_id__in=account_ids)
    profile_map = {p.accountFK_id: p for p in profiles}
    
    # Get payment methods
    payment_methods = UserPaymentMethod.objects.filter(accountFK_id__in=account_ids)
    pm_map = {pm.accountFK_id: pm for pm in payment_methods}
    
    withdrawals_list = []
    for txn in page_obj:
        user_info = None
        payment_method = None
        
        if txn.walletID and txn.walletID.accountFK:
            account = txn.walletID.accountFK
            profile = profile_map.get(account.accountID)
            pm = pm_map.get(account.accountID)
            
            user_info = {
                'id': str(account.accountID),
                'email': account.email,
                'name': f"{profile.firstName or ''} {profile.lastName or ''}".strip() if profile else '',
            }
            
            if pm:
                payment_method = {
                    'type': pm.methodType,
                    'account_name': pm.accountName,
                    'account_number': pm.accountNumber,
                }
        
        withdrawals_list.append({
            'id': str(txn.transactionID),
            'status': txn.status,
            'amount': float(txn.amount or 0),
            'currency': 'PHP',  # Default to PHP
            'user': user_info,
            'payment_method': payment_method,
            'description': txn.description,
            'reference_number': txn.referenceNumber,
            'created_at': txn.createdAt.isoformat() if txn.createdAt else None,
            'processed_at': txn.processedAt.isoformat() if txn.processedAt else None,
        })
    
    return {
        'success': True,
        'withdrawals': withdrawals_list,
        'total': paginator.count,
        'page': page,
        'total_pages': paginator.num_pages,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }

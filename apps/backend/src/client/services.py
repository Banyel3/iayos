from django.db.models import Q, Avg, Count, Case, When, IntegerField, F
from accounts.models import Agency, Job, JobReview, Profile
from agency.models import AgencyKYC, AgencyEmployee
from typing import Optional, List, Dict
import math


def browse_agencies(
    page: int = 1,
    limit: int = 20,
    city: Optional[str] = None,
    province: Optional[str] = None,
    min_rating: Optional[float] = None,
    kyc_status: str = "APPROVED",
    sort_by: str = "rating"  # rating, jobs, created
) -> Dict:
    """
    Browse agencies with filters and pagination
    
    Args:
        page: Page number (1-indexed)
        limit: Items per page
        city: Filter by city
        province: Filter by province
        min_rating: Minimum average rating
        kyc_status: KYC status (default: APPROVED for client safety)
        sort_by: Sort field (rating, jobs, created)
    
    Returns:
        Dict with agencies list, pagination info
    """
    # Base query - only show KYC approved agencies to clients by default
    # AgencyKYC links to Accounts (accountFK), so we join through accountFK
    agencies_query = Agency.objects.filter(
        accountFK__agencykyc__status=kyc_status
    )
    
    # Apply filters
    if city:
        agencies_query = agencies_query.filter(city__icontains=city)
    if province:
        agencies_query = agencies_query.filter(province__icontains=province)
    
    # Annotate with stats
    agencies_query = agencies_query.annotate(
        total_jobs=Count('assigned_jobs', distinct=True),
        completed_jobs=Count(
            Case(
                When(assigned_jobs__status='COMPLETED', then=1),
                output_field=IntegerField()
            )
        ),
        active_jobs=Count(
            Case(
                When(assigned_jobs__status__in=['ACTIVE', 'IN_PROGRESS'], then=1),
                output_field=IntegerField()
            )
        ),
        avg_rating=Avg('assigned_jobs__reviews__rating'),
        total_reviews=Count('assigned_jobs__reviews', distinct=True)
    )
    
    # Filter by minimum rating
    if min_rating:
        agencies_query = agencies_query.filter(avg_rating__gte=min_rating)
    
    # Sorting
    if sort_by == "rating":
        agencies_query = agencies_query.order_by(F('avg_rating').desc(nulls_last=True))
    elif sort_by == "jobs":
        agencies_query = agencies_query.order_by('-completed_jobs')
    elif sort_by == "created":
        agencies_query = agencies_query.order_by('-createdAt')
    else:
        agencies_query = agencies_query.order_by('-createdAt')
    
    # Get total count
    total = agencies_query.count()
    
    # Pagination
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    agencies_page = agencies_query[start_idx:end_idx]
    
    # Build response
    agencies_data = []
    for agency in agencies_page:
        # Get KYC status - both Agency and AgencyKYC link to Accounts via accountFK
        try:
            kyc_record = AgencyKYC.objects.get(accountFK=agency.accountFK)
            kyc_status_val = kyc_record.status
        except AgencyKYC.DoesNotExist:
            kyc_status_val = "PENDING"
        
        # Get specializations from completed jobs
        specializations = list(
            Job.objects.filter(
                assignedAgencyFK=agency,
                status='COMPLETED'
            ).values_list('categoryID__specializationName', flat=True).distinct()[:5]
        )
        
        agencies_data.append({
            "agencyId": agency.agencyId,
            "businessName": agency.businessName,
            "businessDesc": agency.businessDesc,
            "city": agency.city,
            "province": agency.province,
            "contactNumber": agency.contactNumber,
            "averageRating": float(getattr(agency, 'avg_rating', None) or 0) if getattr(agency, 'avg_rating', None) else None,
            "totalReviews": getattr(agency, 'total_reviews', 0),
            "completedJobs": getattr(agency, 'completed_jobs', 0),
            "activeJobs": getattr(agency, 'active_jobs', 0),
            "kycStatus": kyc_status_val,
            "specializations": [s for s in specializations if s]
        })
    
    total_pages = math.ceil(total / limit) if total > 0 else 1
    
    return {
        "agencies": agencies_data,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages
    }


def search_agencies(query: str, limit: int = 20) -> Dict:
    """
    Full-text search for agencies by name or description
    
    Args:
        query: Search query string
        limit: Maximum results
    
    Returns:
        Dict with matching agencies
    """
    # Search by business name or description
    agencies_query = Agency.objects.filter(
        Q(businessName__icontains=query) | Q(businessDesc__icontains=query),
        agencykyc__status="APPROVED"  # Only show approved agencies
    ).annotate(
        total_jobs=Count('assigned_jobs', distinct=True),
        completed_jobs=Count(
            Case(
                When(assigned_jobs__status='COMPLETED', then=1),
                output_field=IntegerField()
            )
        ),
        active_jobs=Count(
            Case(
                When(assigned_jobs__status__in=['ACTIVE', 'IN_PROGRESS'], then=1),
                output_field=IntegerField()
            )
        ),
        avg_rating=Avg('assigned_jobs__jobreview__rating'),
        total_reviews=Count('assigned_jobs__jobreview', distinct=True)
    ).order_by(F('avg_rating').desc(nulls_last=True))[:limit]
    
    # Build response
    agencies_data = []
    for agency in agencies_query:
        try:
            kyc_record = AgencyKYC.objects.get(agencyID=agency)
            kyc_status_val = kyc_record.status
        except AgencyKYC.DoesNotExist:
            kyc_status_val = "PENDING"
        
        specializations = list(
            Job.objects.filter(
                assignedAgencyFK=agency,
                status='COMPLETED'
            ).values_list('categoryID__categoryName', flat=True).distinct()[:5]
        )
        
        agencies_data.append({
            "agencyId": agency.agencyId,
            "businessName": agency.businessName,
            "businessDesc": agency.businessDesc,
            "city": agency.city,
            "province": agency.province,
            "contactNumber": agency.contactNumber,
            "averageRating": float(getattr(agency, 'avg_rating', None) or 0) if getattr(agency, 'avg_rating', None) else None,
            "totalReviews": getattr(agency, 'total_reviews', 0),
            "completedJobs": getattr(agency, 'completed_jobs', 0),
            "activeJobs": getattr(agency, 'active_jobs', 0),
            "kycStatus": kyc_status_val,
            "specializations": [s for s in specializations if s]
        })
    
    return {
        "agencies": agencies_data,
        "total": len(agencies_data),
        "query": query
    }


def get_agency_profile(agency_id: int) -> Dict:
    """
    Get detailed agency profile with stats and employees
    
    Args:
        agency_id: Agency ID
    
    Returns:
        Dict with complete agency profile
    """
    try:
        agency = Agency.objects.get(agencyId=agency_id)
    except Agency.DoesNotExist:
        raise ValueError("Agency not found")
    
    # Get KYC status - both Agency and AgencyKYC link to Accounts via accountFK
    try:
        kyc_record = AgencyKYC.objects.get(accountFK=agency.accountFK)
        kyc_status = kyc_record.status
    except AgencyKYC.DoesNotExist:
        kyc_status = "PENDING"
    
    # Calculate statistics
    jobs = Job.objects.filter(assignedAgencyFK=agency)
    total_jobs = jobs.count()
    completed_jobs = jobs.filter(status='COMPLETED').count()
    active_jobs = jobs.filter(status__in=['ACTIVE', 'IN_PROGRESS']).count()
    cancelled_jobs = jobs.filter(status='CANCELLED').count()
    
    # Get ratings - JobReview has 'rating' field, not 'agencyRating'
    reviews = JobReview.objects.filter(jobID__assignedAgencyFK=agency)
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
    total_reviews = reviews.count()
    
    # On-time completion rate (simplified)
    on_time_rate = (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0.0
    
    # Get employees - AgencyEmployee.agency links to Accounts (user), not Agency model
    employees_data = []
    employees = AgencyEmployee.objects.filter(agency=agency.accountFK)
    for emp in employees:
        employees_data.append({
            "employeeId": emp.employeeID,  # Note: model field is employeeID (uppercase)
            "name": emp.name,
            "email": emp.email,
            "role": emp.role,
            "avatar": emp.avatar,
            "rating": float(emp.rating) if emp.rating else None
        })
    
    # Get specializations - categoryID links to Specializations model with specializationName field
    specializations = list(
        Job.objects.filter(
            assignedAgencyFK=agency,
            status='COMPLETED'
        ).values_list('categoryID__specializationName', flat=True).distinct()
    )
    
    return {
        "agencyId": agency.agencyId,
        "businessName": agency.businessName,
        "businessDesc": agency.businessDesc,
        "street_address": agency.street_address,
        "city": agency.city,
        "province": agency.province,
        "postal_code": agency.postal_code,
        "country": agency.country,
        "contactNumber": agency.contactNumber,
        "kycStatus": kyc_status,
        "stats": {
            "totalJobs": total_jobs,
            "completedJobs": completed_jobs,
            "activeJobs": active_jobs,
            "cancelledJobs": cancelled_jobs,
            "averageRating": float(avg_rating),
            "totalReviews": total_reviews,
            "onTimeCompletionRate": round(on_time_rate, 2),
            "responseTime": "within 2 hours"  # Placeholder
        },
        "employees": employees_data,
        "specializations": [s for s in specializations if s],
        "createdAt": agency.createdAt
    }


def get_agency_reviews(agency_id: int, page: int = 1, limit: int = 10) -> Dict:
    """
    Get paginated reviews for an agency
    
    Args:
        agency_id: Agency ID
        page: Page number
        limit: Items per page
    
    Returns:
        Dict with paginated reviews
    """
    try:
        agency = Agency.objects.get(agencyId=agency_id)
    except Agency.DoesNotExist:
        raise ValueError("Agency not found")
    
    # Get reviews
    reviews_query = JobReview.objects.filter(
        jobID__assignedAgencyFK=agency
    ).select_related('jobID', 'clientID').order_by('-createdAt')
    
    total = reviews_query.count()
    
    # Pagination
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    reviews_page = reviews_query[start_idx:end_idx]
    
    # Build response
    reviews_data = []
    for review in reviews_page:
        # Get client name from reviewer (assuming client reviews agency)
        reviewer_profile = Profile.objects.filter(accountFK=review.reviewerID).first()
        client_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}" if reviewer_profile else "Unknown Client"
        
        reviews_data.append({
            "reviewId": review.reviewID,
            "jobTitle": review.jobID.title,
            "clientName": client_name,
            "rating": float(review.rating) if review.rating else 0.0,
            "comment": review.comment,
            "createdAt": review.createdAt
        })
    
    total_pages = math.ceil(total / limit) if total > 0 else 1
    
    # Calculate average rating
    avg_rating = reviews_query.aggregate(Avg('rating'))['rating__avg'] or 0.0
    
    return {
        "reviews": reviews_data,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
        "averageRating": float(avg_rating)
    }

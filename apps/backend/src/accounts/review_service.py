"""
Review Service Layer
Phase 8: Reviews & Ratings System

Business logic for reviews and ratings
"""
from decimal import Decimal
from datetime import datetime, timedelta
from django.db.models import Avg, Count, Q
from django.utils import timezone
from .models import JobReview, Job, Accounts, Profile
from .review_schemas import (
    SubmitReviewRequest, ReviewResponse, ReviewListResponse,
    ReviewStatsResponse, RatingBreakdown, AddReviewResponseRequest,
    ReportReviewRequest, MyReviewsResponse
)


# ===========================================================================
# REVIEW SUBMISSION
# ===========================================================================

def submit_review(reviewer: Accounts, payload: SubmitReviewRequest) -> ReviewResponse:
    """
    Submit a review for a completed job.

    Rules:
    - Job must be completed
    - Reviewer must be part of the job (client or worker)
    - Cannot review yourself
    - Cannot review same job twice
    - Rating must be 1-5
    """

    # Validate job exists and is completed
    try:
        job = Job.objects.get(jobID=payload.job_id)
    except Job.DoesNotExist:
        raise ValueError("Job not found")

    if job.status != "COMPLETED":
        raise ValueError("Can only review completed jobs")

    # Validate reviewee
    try:
        reviewee = Accounts.objects.get(accountID=payload.reviewee_id)
    except Accounts.DoesNotExist:
        raise ValueError("Reviewee not found")

    # Prevent self-review
    if reviewer.accountID == reviewee.accountID:
        raise ValueError("Cannot review yourself")

    # Validate reviewer is part of the job
    is_client = job.clientID.profileID.accountFK.accountID == reviewer.accountID
    is_worker = job.workerID and job.workerID.profileID.accountFK.accountID == reviewer.accountID

    if not (is_client or is_worker):
        raise ValueError("You are not part of this job")

    # Check for existing review
    existing_review = JobReview.objects.filter(
        jobID=job,
        reviewerID=reviewer
    ).first()

    if existing_review:
        raise ValueError("You have already reviewed this job")

    # Validate rating range
    if payload.rating < 1.0 or payload.rating > 5.0:
        raise ValueError("Rating must be between 1 and 5")

    # Create review
    review = JobReview.objects.create(
        jobID=job,
        reviewerID=reviewer,
        revieweeID=reviewee,
        reviewerType=payload.reviewer_type,
        rating=Decimal(str(payload.rating)),
        comment=payload.comment,
        status="ACTIVE"
    )

    return _format_review_response(review, reviewer)


# ===========================================================================
# REVIEW RETRIEVAL
# ===========================================================================

def get_reviews_for_worker(worker_account_id: int, page: int = 1, limit: int = 20, sort: str = "latest"):
    """Get all reviews for a specific worker"""

    try:
        worker_account = Accounts.objects.get(accountID=worker_account_id)
    except Accounts.DoesNotExist:
        raise ValueError("Worker not found")

    # Get reviews where worker is reviewee
    reviews_query = JobReview.objects.filter(
        revieweeID=worker_account,
        status="ACTIVE"
    )

    # Apply sorting
    if sort == "highest":
        reviews_query = reviews_query.order_by('-rating', '-createdAt')
    elif sort == "lowest":
        reviews_query = reviews_query.order_by('rating', '-createdAt')
    else:  # latest
        reviews_query = reviews_query.order_by('-createdAt')

    # Pagination
    total_count = reviews_query.count()
    offset = (page - 1) * limit
    reviews = reviews_query[offset:offset + limit]

    # Format responses
    review_responses = [
        _format_review_response(review, None) for review in reviews
    ]

    return ReviewListResponse(
        reviews=review_responses,
        total_count=total_count,
        page=page,
        limit=limit,
        total_pages=(total_count + limit - 1) // limit
    )


def get_review_stats(worker_account_id: int):
    """Get review statistics for a worker"""

    try:
        worker_account = Accounts.objects.get(accountID=worker_account_id)
    except Accounts.DoesNotExist:
        raise ValueError("Worker not found")

    # Get all active reviews
    reviews = JobReview.objects.filter(
        revieweeID=worker_account,
        status="ACTIVE"
    )

    # Calculate average rating
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
    total_reviews = reviews.count()

    # Rating breakdown
    rating_breakdown = RatingBreakdown(
        five_star=reviews.filter(rating__gte=4.5).count(),
        four_star=reviews.filter(rating__gte=3.5, rating__lt=4.5).count(),
        three_star=reviews.filter(rating__gte=2.5, rating__lt=3.5).count(),
        two_star=reviews.filter(rating__gte=1.5, rating__lt=2.5).count(),
        one_star=reviews.filter(rating__lt=1.5).count()
    )

    # Recent reviews (last 5)
    recent_reviews = reviews.order_by('-createdAt')[:5]
    recent_review_responses = [
        _format_review_response(review, None) for review in recent_reviews
    ]

    return ReviewStatsResponse(
        average_rating=float(avg_rating),
        total_reviews=total_reviews,
        rating_breakdown=rating_breakdown,
        recent_reviews=recent_review_responses
    )


def get_my_reviews(user: Accounts):
    """Get reviews given and received by current user"""

    # Reviews given by user
    reviews_given = JobReview.objects.filter(
        reviewerID=user,
        status="ACTIVE"
    ).order_by('-createdAt')

    # Reviews received by user
    reviews_received = JobReview.objects.filter(
        revieweeID=user,
        status="ACTIVE"
    ).order_by('-createdAt')

    # Format responses
    given_responses = [
        _format_review_response(review, user) for review in reviews_given
    ]
    received_responses = [
        _format_review_response(review, user) for review in reviews_received
    ]

    # Get stats for user
    stats = get_review_stats(user.accountID)

    return MyReviewsResponse(
        reviews_given=given_responses,
        reviews_received=received_responses,
        stats=stats
    )


# ===========================================================================
# REVIEW EDITING
# ===========================================================================

def edit_review(review_id: int, user: Accounts, new_comment: str, new_rating: float):
    """Edit a review (only within 24 hours)"""

    try:
        review = JobReview.objects.get(reviewID=review_id)
    except JobReview.DoesNotExist:
        raise ValueError("Review not found")

    # Check ownership
    if review.reviewerID.accountID != user.accountID:
        raise ValueError("You can only edit your own reviews")

    # Check 24-hour window
    time_since_creation = timezone.now() - review.createdAt
    if time_since_creation > timedelta(hours=24):
        raise ValueError("Can only edit reviews within 24 hours of creation")

    # Validate rating
    if new_rating < 1.0 or new_rating > 5.0:
        raise ValueError("Rating must be between 1 and 5")

    # Update review
    review.comment = new_comment
    review.rating = Decimal(str(new_rating))
    review.save()

    return _format_review_response(review, user)


# ===========================================================================
# REVIEW RESPONSES (WORKER REPLYING TO REVIEW)
# ===========================================================================

def add_review_response(review_id: int, worker: Accounts, payload: AddReviewResponseRequest):
    """Allow worker to respond to a review"""

    try:
        review = JobReview.objects.get(reviewID=review_id)
    except JobReview.DoesNotExist:
        raise ValueError("Review not found")

    # Check if user is the reviewee (person being reviewed)
    if review.revieweeID.accountID != worker.accountID:
        raise ValueError("You can only respond to reviews about you")

    # Check if already responded
    # Note: JobReview model doesn't have response fields in current schema
    # This would need to be added to the model
    # For now, we'll raise an error indicating this feature needs model update

    raise ValueError("Review responses require database schema update")


# ===========================================================================
# REVIEW REPORTING
# ===========================================================================

def report_review(review_id: int, reporter: Accounts, payload: ReportReviewRequest):
    """Report a review as inappropriate"""

    try:
        review = JobReview.objects.get(reviewID=review_id)
    except JobReview.DoesNotExist:
        raise ValueError("Review not found")

    # Update review flags
    review.isFlagged = True
    review.flagReason = f"{payload.reason}: {payload.details or ''}"
    review.flaggedBy = reporter
    review.flaggedAt = timezone.now()
    review.save()

    return {"message": "Review reported successfully"}


# ===========================================================================
# HELPER FUNCTIONS
# ===========================================================================

def _format_review_response(review: JobReview, current_user: Accounts = None) -> ReviewResponse:
    """Format a JobReview model into ReviewResponse schema"""

    # Get reviewer profile info
    reviewer_profile = None
    reviewer_name = "Anonymous"
    reviewer_profile_img = None

    if hasattr(review.reviewerID, 'profile'):
        profile = review.reviewerID.profile
        reviewer_name = f"{profile.firstName} {profile.lastName}"
        reviewer_profile_img = profile.profileImg

    # Check if current user can edit (within 24 hours)
    can_edit = False
    if current_user and review.reviewerID.accountID == current_user.accountID:
        time_since_creation = timezone.now() - review.createdAt
        can_edit = time_since_creation <= timedelta(hours=24)

    return ReviewResponse(
        review_id=review.reviewID,
        job_id=review.jobID.jobID,
        reviewer_id=review.reviewerID.accountID,
        reviewer_name=reviewer_name,
        reviewer_profile_img=reviewer_profile_img,
        reviewee_id=review.revieweeID.accountID,
        reviewer_type=review.reviewerType,
        rating=review.rating,
        comment=review.comment,
        status=review.status,
        is_flagged=review.isFlagged,
        helpful_count=review.helpfulCount,
        created_at=review.createdAt,
        updated_at=review.updatedAt,
        can_edit=can_edit,
        worker_response=None,  # TODO: Add to model
        worker_response_at=None  # TODO: Add to model
    )

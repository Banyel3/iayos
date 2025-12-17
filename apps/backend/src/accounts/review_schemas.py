"""
Review and Rating Schemas for API validation
Phase 8: Reviews & Ratings System
"""
from ninja import Schema
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ===========================================================================
# REVIEW SUBMISSION SCHEMAS
# ===========================================================================

class SubmitReviewRequest(Schema):
    """Request payload for submitting a review"""
    job_id: int
    reviewee_id: int  # Account ID of person being reviewed
    rating: float  # 1.0 to 5.0
    comment: str
    reviewer_type: str  # "CLIENT" or "WORKER"


class ReviewResponse(Schema):
    """Single review response"""
    review_id: int
    job_id: int
    reviewer_id: int
    reviewer_name: str
    reviewer_profile_img: Optional[str]
    reviewee_id: int
    reviewer_type: str
    rating: Decimal
    comment: str
    status: str
    is_flagged: bool
    helpful_count: int
    created_at: datetime
    updated_at: datetime
    can_edit: bool  # True if within 24 hours
    worker_response: Optional[str] = None
    worker_response_at: Optional[datetime] = None
    # Multi-criteria category ratings (only for worker reviews)
    rating_quality: Optional[Decimal] = None
    rating_communication: Optional[Decimal] = None
    rating_punctuality: Optional[Decimal] = None
    rating_professionalism: Optional[Decimal] = None


# ===========================================================================
# REVIEW LISTING SCHEMAS
# ===========================================================================

class ReviewListRequest(Schema):
    """Query parameters for fetching reviews"""
    worker_id: Optional[int] = None
    client_id: Optional[int] = None
    job_id: Optional[int] = None
    page: int = 1
    limit: int = 20
    sort: str = "latest"  # "latest", "highest", "lowest"


class ReviewListResponse(Schema):
    """Paginated list of reviews"""
    reviews: List[ReviewResponse]
    total_count: int
    page: int
    limit: int
    total_pages: int


# ===========================================================================
# RATING STATISTICS SCHEMAS
# ===========================================================================

class RatingBreakdown(Schema):
    """Star distribution"""
    five_star: int
    four_star: int
    three_star: int
    two_star: int
    one_star: int


class ReviewStatsResponse(Schema):
    """Review statistics for a worker or client"""
    average_rating: float
    total_reviews: int
    rating_breakdown: RatingBreakdown
    recent_reviews: List[ReviewResponse]


# ===========================================================================
# REVIEW RESPONSE (WORKER REPLYING TO REVIEW) SCHEMAS
# ===========================================================================

class AddReviewResponseRequest(Schema):
    """Request to respond to a review"""
    response_text: str


class ReviewResponseSuccess(Schema):
    """Success response for review actions"""
    message: str
    review: Optional[ReviewResponse] = None


# ===========================================================================
# REVIEW REPORTING SCHEMAS
# ===========================================================================

class ReportReviewRequest(Schema):
    """Report a review as inappropriate"""
    reason: str  # "spam", "offensive", "misleading", "other"
    details: Optional[str] = None


# ===========================================================================
# MY REVIEWS SCHEMAS
# ===========================================================================

class MyReviewsResponse(Schema):
    """Reviews given and received by current user"""
    reviews_given: List[ReviewResponse]
    reviews_received: List[ReviewResponse]
    stats: ReviewStatsResponse

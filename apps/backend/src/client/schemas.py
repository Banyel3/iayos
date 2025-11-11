from ninja import Schema
from typing import Optional, List
from datetime import datetime


# Agency Browse/Search Response Schemas

class AgencyCardSchema(Schema):
    """Agency preview card for browse/search results"""
    agencyId: int
    businessName: str
    businessDesc: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    contactNumber: Optional[str] = None
    averageRating: Optional[float] = None
    totalReviews: int = 0
    completedJobs: int = 0
    activeJobs: int = 0
    kycStatus: str  # PENDING, APPROVED, REJECTED
    specializations: List[str] = []


class AgencyBrowseResponse(Schema):
    """Paginated agency browse response"""
    agencies: List[AgencyCardSchema]
    total: int
    page: int
    limit: int
    totalPages: int


class AgencySearchResponse(Schema):
    """Full-text search response"""
    agencies: List[AgencyCardSchema]
    total: int
    query: str


# Agency Profile Response Schemas

class AgencyEmployeeSchema(Schema):
    """Agency employee details"""
    employeeId: int
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    rating: Optional[float] = None
    # Performance tracking (Agency Phase 2)
    employeeOfTheMonth: bool = False
    employeeOfTheMonthDate: Optional[str] = None
    employeeOfTheMonthReason: Optional[str] = None
    lastRatingUpdate: Optional[str] = None
    totalJobsCompleted: int = 0
    totalEarnings: float = 0.0
    isActive: bool = True


class AgencyStatsSchema(Schema):
    """Agency statistics"""
    totalJobs: int
    completedJobs: int
    activeJobs: int
    cancelledJobs: int
    averageRating: float
    totalReviews: int
    onTimeCompletionRate: float
    responseTime: str  # e.g., "within 2 hours"


class AgencyReviewSchema(Schema):
    """Agency review details"""
    reviewId: int
    jobTitle: str
    clientName: str
    rating: float
    comment: Optional[str] = None
    createdAt: datetime


class AgencyProfileResponse(Schema):
    """Detailed agency profile"""
    agencyId: int
    businessName: str
    businessDesc: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    contactNumber: Optional[str] = None
    kycStatus: str
    stats: AgencyStatsSchema
    employees: List[AgencyEmployeeSchema]
    specializations: List[str] = []
    createdAt: datetime


class AgencyReviewsResponse(Schema):
    """Paginated agency reviews"""
    reviews: List[AgencyReviewSchema]
    total: int
    page: int
    limit: int
    totalPages: int
    averageRating: float

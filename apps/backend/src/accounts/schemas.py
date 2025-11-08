from ninja import Schema
from datetime import datetime
from pydantic import EmailStr
from typing import Optional

class createAccountSchema(Schema):
    #profile table
    firstName: str
    middleName: Optional[str] = ""  # Made optional with default empty string
    lastName: str
    contactNum: str  # Changed from int to str to match Profile model CharField
    birthDate: str
    #accounts table
    email: EmailStr
    password: str
    street_address: str
    city: str             # "Zamboanga City"
    province: str        # "Zamboanga del Sur"
    postal_code: str    # Changed from int to str to match Accounts model CharField
    country: str = "Philippines"

class logInSchema(Schema):
    email: EmailStr
    password: str

class assignRoleSchema(Schema):
    email: EmailStr
    selectedType: str

class createAgencySchema(Schema):
    email: EmailStr
    password: str
    businessName: str
    street_address: str
    city: str             # "Zamboanga City"
    province: str        # "Zamboanga del Sur"
    postal_code: str    # "7000"


    createdAt: Optional[datetime] = datetime.utcnow()
    

class forgotPasswordSchema(Schema):
    email: EmailStr

class resetPasswordSchema(Schema):
    newPassword: str
    confirmPassword: str

class KYCUploadSchema(Schema):
    accountID: int
    IDType: str
    clearanceType: str

class KYCUploadResponse(Schema):
    message: str
    kyc_id: int
    file_url: str
    file_name: str

class KYCStatusResponse(Schema):
    kyc_id: int
    status: str
    notes: Optional[str]
    reviewed_at: Optional[datetime]
    files: list

# Location Tracking Schemas
class UpdateLocationSchema(Schema):
    """Schema for updating user's GPS location"""
    latitude: float
    longitude: float

class LocationResponseSchema(Schema):
    """Schema for location response"""
    profile_id: int
    latitude: Optional[float]
    longitude: Optional[float]
    location_updated_at: Optional[datetime]
    location_sharing_enabled: bool
    message: str

class ToggleLocationSharingSchema(Schema):
    """Schema for toggling location sharing"""
    enabled: bool

class NearbyWorkersSchema(Schema):
    """Schema for finding nearby workers"""
    latitude: float
    longitude: float
    radius_km: Optional[float] = 10.0  # Default 10km radius
    specialization_id: Optional[int] = None  # Optional filter by specialization

class WorkerLocationSchema(Schema):
    """Schema for worker location in search results"""
    profile_id: int
    worker_id: int
    first_name: str
    last_name: str
    profile_img: Optional[str]
    latitude: float
    longitude: float
    distance_km: float
    availability_status: str
    specializations: list

class DepositFundsSchema(Schema):
    """Schema for wallet deposit request"""
    amount: float
    payment_method: Optional[str] = "GCASH"

# ========================================
# MOBILE-SPECIFIC SCHEMAS
# ========================================

class CreateJobMobileSchema(Schema):
    """Mobile-optimized schema for job creation"""
    title: str
    description: str
    category_id: Optional[int] = None
    budget: float
    location: Optional[str] = None
    expected_duration: str
    urgency_level: str  # 'LOW' | 'MEDIUM' | 'HIGH'
    preferred_start_date: Optional[str] = None  # ISO format datetime string
    materials_needed: Optional[list] = None  # List of strings
    downpayment_method: str  # 'WALLET' | 'GCASH'

class ApplyJobMobileSchema(Schema):
    """Mobile-optimized schema for job application"""
    proposal_message: str
    budget_option: str  # 'ACCEPT' | 'NEGOTIATE'
    proposed_budget: Optional[float] = None  # Required if NEGOTIATE
    estimated_duration: str

class UpdateApplicationMobileSchema(Schema):
    """Schema for accepting/rejecting job application"""
    status: str  # 'ACCEPTED' | 'REJECTED'

class ApproveCompletionMobileSchema(Schema):
    """Schema for client approving job completion and paying remaining amount"""
    final_payment_method: str  # 'WALLET' | 'GCASH' | 'CASH'
    notes: Optional[str] = None

class SubmitReviewMobileSchema(Schema):
    """Schema for submitting review after job completion"""
    rating: int  # 1-5 stars
    comment: str
    review_type: str  # 'CLIENT_TO_WORKER' | 'WORKER_TO_CLIENT'

class SendMessageMobileSchema(Schema):
    """Schema for sending chat message"""
    text: str

class AssignRoleMobileSchema(Schema):
    """Mobile-specific schema for assigning role (uses authenticated user)"""
    profile_type: str  # 'WORKER' | 'CLIENT'
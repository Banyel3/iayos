from ninja import Schema
from datetime import datetime
from pydantic import EmailStr
from typing import Optional, Literal

class createAccountSchema(Schema):
    #profile table
    firstName: str
    middleName: Optional[str] = ""  # Made optional with default empty string
    lastName: str
    contactNum: str  # Changed from int to str to match Profile model CharField
    birthDate: str
    profileType: Optional[Literal["CLIENT", "WORKER"]] = "CLIENT"  # Default to CLIENT if not specified
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

class SwitchProfileSchema(Schema):
    profile_type: str

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

class SendVerificationEmailSchema(Schema):
    email: EmailStr
    verifyLink: str
    verifyLinkExpire: str

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
    """Schema for wallet deposit request - GCash only"""
    amount: float
    payment_method: Optional[str] = "GCASH"  # Only GCash supported

class WithdrawFundsSchema(Schema):
    """Schema for wallet withdrawal request"""
    amount: float
    payment_method_id: int
    notes: Optional[str] = None

class AddPaymentMethodSchema(Schema):
    """Schema for adding a payment method (GCash only)"""
    type: Literal["GCASH"] = "GCASH"
    account_name: str
    account_number: str
    bank_name: Optional[str] = None

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
    # Universal fields for ML accuracy
    job_scope: Optional[str] = "MINOR_REPAIR"  # 'MINOR_REPAIR' | 'MODERATE_PROJECT' | 'MAJOR_RENOVATION'
    skill_level_required: Optional[str] = "INTERMEDIATE"  # 'ENTRY' | 'INTERMEDIATE' | 'EXPERT'
    work_environment: Optional[str] = "INDOOR"  # 'INDOOR' | 'OUTDOOR' | 'BOTH'

class ApplyJobMobileSchema(Schema):
    """Mobile-optimized schema for job application"""
    proposal_message: str
    budget_option: str  # 'ACCEPT' | 'NEGOTIATE'
    proposed_budget: Optional[float] = None  # Required if NEGOTIATE
    estimated_duration: Optional[str] = None

class UpdateApplicationMobileSchema(Schema):
    """Schema for accepting/rejecting job application"""
    status: str  # 'ACCEPTED' | 'REJECTED'

class ApproveCompletionMobileSchema(Schema):
    """Schema for client approving job completion and paying remaining amount"""
    final_payment_method: str  # 'WALLET' | 'GCASH' | 'CASH'
    notes: Optional[str] = None

class MyJobsFilterSchema(Schema):
    """Schema for filtering my jobs"""
    status: Optional[str] = None  # 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED'
    page: int = 1
    limit: int = 20

class SubmitReviewMobileSchema(Schema):
    """Schema for submitting review after job completion"""
    # Multi-criteria ratings (1-5 stars each)
    rating_quality: int  # Quality of work
    rating_communication: int  # Communication
    rating_punctuality: int  # Punctuality/timeliness
    rating_professionalism: int  # Professionalism
    comment: str
    review_type: str  # 'CLIENT_TO_WORKER' | 'WORKER_TO_CLIENT'

class SendMessageMobileSchema(Schema):
    """Schema for sending chat message"""
    text: str

class AssignRoleMobileSchema(Schema):
    """Mobile-specific schema for assigning role (uses authenticated user)"""
    profile_type: str  # 'WORKER' | 'CLIENT'

# ========================================
# WORKER PHASE 1 SCHEMAS - Profile Enhancement
# ========================================

class WorkerProfileUpdateSchema(Schema):
    """Schema for updating worker profile"""
    bio: Optional[str] = None
    description: Optional[str] = None
    hourly_rate: Optional[float] = None
    soft_skills: Optional[str] = None

class WorkerProfileResponse(Schema):
    """Response schema for worker profile update"""
    success: bool
    message: str
    profile_completion_percentage: int
    bio: str
    description: str
    hourly_rate: Optional[float]
    soft_skills: str

class ProfileCompletionResponse(Schema):
    """Schema for profile completion details"""
    completion_percentage: int
    missing_fields: list
    recommendations: list
    completed_fields: list

class CertificationSchema(Schema):
    """Schema for certification data"""
    certificationID: int
    name: str
    issuing_organization: str
    issue_date: Optional[str]
    expiry_date: Optional[str]
    certificate_url: Optional[str]
    is_verified: bool
    is_expired: bool
    days_until_expiry: Optional[int]
    verified_at: Optional[str]
    createdAt: str
    updatedAt: str
    specializationId: Optional[int] = None  # NEW: Linked skill ID
    skillName: Optional[str] = None  # NEW: Skill name for display

class AddCertificationRequest(Schema):
    """Schema for adding certification (form data)"""
    name: str
    organization: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    specializationId: Optional[int] = None  # NEW: Link to specific skill (workerSpecialization ID)

class UpdateCertificationRequest(Schema):
    """Schema for updating certification"""
    name: Optional[str] = None
    organization: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    specializationId: Optional[int] = None  # NEW: Update linked skill

class CertificationResponse(Schema):
    """Response schema for certification operations"""
    success: bool
    message: str
    certification: Optional[CertificationSchema] = None

class MaterialSchema(Schema):
    """Schema for material/product data"""
    materialID: int
    name: str
    description: str
    price: float
    quantity: float
    unit: str
    image_url: Optional[str]
    is_available: bool
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    createdAt: str
    updatedAt: str

class AddMaterialRequest(Schema):
    """Schema for adding material (form data)"""
    name: str
    description: Optional[str] = None
    price: float
    quantity: float = 1.0
    unit: str = "piece"
    category_id: Optional[int] = None  # Optional link to specialization/category

class UpdateMaterialRequest(Schema):
    """Schema for updating material"""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    is_available: Optional[bool] = None
    category_id: Optional[int] = None  # Can update category link

class MaterialResponse(Schema):
    """Response schema for material operations"""
    success: bool
    message: str
    material: Optional[MaterialSchema] = None

class PortfolioItemSchema(Schema):
    """Schema for portfolio item data"""
    portfolioID: int
    image_url: str
    caption: str
    display_order: int
    file_name: str
    file_size: Optional[int]
    createdAt: str
    updatedAt: str

class UploadPortfolioRequest(Schema):
    """Schema for portfolio upload (form data)"""
    caption: Optional[str] = None

class UpdatePortfolioCaptionRequest(Schema):
    """Schema for updating portfolio caption"""
    caption: str

class PortfolioItemResponse(Schema):
    """Response schema for portfolio operations"""
    success: bool
    message: str
    portfolio_item: Optional[PortfolioItemSchema] = None

class ReorderPortfolioRequest(Schema):
    """Schema for reordering portfolio"""
    portfolio_id_order: list  # List of portfolio IDs in desired order

class CreateInviteJobMobileSchema(Schema):
    """Mobile schema for creating INVITE-type job (direct worker/agency hiring)"""
    title: str
    description: str
    category_id: int
    budget: float
    location: str
    expected_duration: Optional[str] = None
    urgency_level: str  # 'LOW' | 'MEDIUM' | 'HIGH'
    preferred_start_date: Optional[str] = None  # YYYY-MM-DD format
    materials_needed: Optional[list] = None  # List of strings
    worker_id: Optional[int] = None  # Either worker_id OR agency_id (not both)
    agency_id: Optional[int] = None
    downpayment_method: str  # 'WALLET' | 'GCASH'
    # Universal fields for ML accuracy
    job_scope: Optional[str] = "MINOR_REPAIR"  # 'MINOR_REPAIR' | 'MODERATE_PROJECT' | 'MAJOR_RENOVATION'
    skill_level_required: Optional[str] = "INTERMEDIATE"  # 'ENTRY' | 'INTERMEDIATE' | 'EXPERT'
    work_environment: Optional[str] = "INDOOR"  # 'INDOOR' | 'OUTDOOR' | 'BOTH'


# Skill Management Schemas
class AddSkillSchema(Schema):
    """Schema for adding a skill to worker profile"""
    specialization_id: int
    experience_years: int = 0


class UpdateSkillSchema(Schema):
    """Schema for updating skill experience years"""
    experience_years: int
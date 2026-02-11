from ninja import Schema
from typing import Optional


class CreateJobPostingSchema(Schema):
    title: str
    description: str
    category_id: int
    budget: float
    location: str
    expected_duration: Optional[str] = None
    urgency: Optional[str] = "MEDIUM"  # LOW, MEDIUM, HIGH (default MEDIUM)
    preferred_start_date: Optional[str] = None
    materials_needed: Optional[list[str]] = []
    payment_method: Optional[str] = "WALLET"  # WALLET or GCASH


class MobileSkillSlotSchema(Schema):
    """Schema for skill slots sent from mobile app"""
    specialization_id: int
    workers_needed: int = 1
    skill_level_required: Optional[str] = "ENTRY"  # ENTRY, INTERMEDIATE, EXPERT
    notes: Optional[str] = None


class CreateJobPostingMobileSchema(Schema):
    """Mobile-specific job posting schema with optional worker_id for direct hiring"""
    title: str
    description: str
    category_id: int
    budget: Optional[float] = None  # Required for PROJECT, not for DAILY
    location: str
    expected_duration: Optional[str] = None
    urgency: Optional[str] = "MEDIUM"  # LOW, MEDIUM, HIGH (default MEDIUM)
    urgency_level: Optional[str] = None  # Frontend alias for urgency
    preferred_start_date: Optional[str] = None
    materials_needed: Optional[list[str]] = []
    payment_method: Optional[str] = "WALLET"  # WALLET only
    downpayment_method: Optional[str] = None  # Frontend alias for payment_method
    worker_id: Optional[int] = None  # If provided, job is for specific worker
    agency_id: Optional[int] = None  # If provided, job is for specific agency
    skill_slots: Optional[list[MobileSkillSlotSchema]] = None  # For team hiring with multiple workers
    
    # Daily payment model fields
    payment_model: Optional[str] = "PROJECT"  # PROJECT or DAILY
    daily_rate: Optional[float] = None  # Required for DAILY model
    duration_days: Optional[int] = None  # Required for DAILY model
    
    # ML enhancement fields (from Mobile Phase 1)
    skill_level_required: Optional[str] = "INTERMEDIATE"  # ENTRY, INTERMEDIATE, EXPERT
    job_scope: Optional[str] = "MODERATE_PROJECT"  # MINOR_REPAIR, MODERATE_PROJECT, MAJOR_RENOVATION
    work_environment: Optional[str] = "INDOOR"  # INDOOR, OUTDOOR, BOTH


class JobPostingResponseSchema(Schema):
    success: bool
    job_posting_id: int
    requires_payment: Optional[bool] = None
    escrow_amount: Optional[float] = None
    remaining_payment: Optional[float] = None
    new_wallet_balance: Optional[float] = None
    invoice_url: Optional[str] = None
    invoice_id: Optional[str] = None
    message: str


class JobApplicationSchema(Schema):
    proposal_message: str
    proposed_budget: float
    estimated_duration: Optional[str] = None
    budget_option: str  # ACCEPT or NEGOTIATE


class SubmitReviewSchema(Schema):
    # Multi-criteria ratings (1-5 stars each)
    rating_quality: int  # Quality of work
    rating_communication: int  # Communication
    rating_punctuality: int  # Punctuality/timeliness
    rating_professionalism: int  # Professionalism
    message: Optional[str] = None  # Optional review message
    review_target: Optional[str] = None  # For agency jobs: "EMPLOYEE" or "AGENCY"
    employee_id: Optional[int] = None  # For multi-employee jobs: specific employee to review
    worker_id: Optional[int] = None  # For team jobs: specific worker to review (client reviews workers)


class ApproveJobCompletionSchema(Schema):
    payment_method: Optional[str] = "WALLET"  # WALLET or CASH only


# ===========================================================================
# TEAM MODE SCHEMAS - Multi-Skill Multi-Worker Support
# ===========================================================================

class SkillSlotSchema(Schema):
    """Schema for defining a skill requirement in a team job"""
    specialization_id: int  # FK to Specializations
    workers_needed: int  # Number of workers (1-10)
    budget_allocated: Optional[float] = None  # Budget for this slot (auto-calculated if not provided)
    skill_level_required: Optional[str] = "ENTRY"  # ENTRY, INTERMEDIATE, EXPERT
    notes: Optional[str] = None  # Additional requirements


class CreateTeamJobSchema(Schema):
    """Schema for creating a team job with multiple skill requirements"""
    title: str
    description: str
    location: str
    total_budget: float  # Total budget for entire job
    urgency: Optional[str] = "MEDIUM"  # LOW, MEDIUM, HIGH
    preferred_start_date: Optional[str] = None
    materials_needed: Optional[list[str]] = []
    budget_allocation_type: Optional[str] = "EQUAL_PER_WORKER"  # EQUAL_PER_SKILL, EQUAL_PER_WORKER, MANUAL_ALLOCATION, SKILL_WEIGHTED
    team_start_threshold: Optional[float] = 100.0  # Percentage of team needed to start (0-100)
    skill_slots: list[SkillSlotSchema]  # At least one skill slot required
    payment_method: Optional[str] = "WALLET"  # WALLET or GCASH

    # ML enhancement fields
    job_scope: Optional[str] = "MODERATE_PROJECT"  # MINOR_REPAIR, MODERATE_PROJECT, MAJOR_RENOVATION
    skill_level_required: Optional[str] = "INTERMEDIATE"  # ENTRY, INTERMEDIATE, EXPERT
    work_environment: Optional[str] = "INDOOR"  # INDOOR, OUTDOOR, BOTH


class TeamJobResponseSchema(Schema):
    """Response schema for team job creation"""
    success: bool
    job_id: int
    skill_slots_created: int
    total_workers_needed: int
    requires_payment: Optional[bool] = None
    escrow_amount: Optional[float] = None
    message: str


class SkillSlotDetailSchema(Schema):
    """Detailed skill slot info with workers and status"""
    skill_slot_id: int
    specialization_id: int
    specialization_name: str
    workers_needed: int
    workers_assigned: int
    openings_remaining: int
    budget_allocated: float
    budget_per_worker: float
    skill_level_required: str
    status: str  # OPEN, PARTIALLY_FILLED, FILLED, CLOSED
    notes: Optional[str] = None


class WorkerAssignmentSchema(Schema):
    """Schema for a worker's assignment to a skill slot"""
    assignment_id: int
    worker_id: int
    worker_name: str
    worker_avatar: Optional[str] = None
    worker_rating: Optional[float] = None
    skill_slot_id: int
    specialization_name: str
    slot_position: int
    assignment_status: str
    assigned_at: str
    worker_marked_complete: bool
    individual_rating: Optional[float] = None


class TeamJobDetailSchema(Schema):
    """Full team job detail with all skill slots and assignments"""
    job_id: int
    title: str
    description: str
    location: str
    total_budget: float
    status: str
    is_team_job: bool
    budget_allocation_type: str
    team_start_threshold: float
    total_workers_needed: int
    total_workers_assigned: int
    team_fill_percentage: float
    can_start: bool
    skill_slots: list[SkillSlotDetailSchema]
    worker_assignments: list[WorkerAssignmentSchema]
    client_id: int
    client_name: str
    created_at: str


class TeamJobApplicationSchema(Schema):
    """Schema for applying to a specific skill slot in a team job"""
    proposal_message: str
    proposed_budget: float
    estimated_duration: Optional[str] = None
    budget_option: str  # ACCEPT or NEGOTIATE
    skill_slot_id: int  # Which skill slot to apply for


class AssignWorkerToSlotSchema(Schema):
    """Schema for assigning an accepted worker to a skill slot"""
    application_id: int  # The accepted application
    skill_slot_id: int  # The slot to assign to
    slot_position: Optional[int] = None  # Position (auto-assigned if not provided)


class UpdateSkillSlotSchema(Schema):
    """Schema for updating a skill slot (before job starts)"""
    workers_needed: Optional[int] = None
    budget_allocated: Optional[float] = None
    skill_level_required: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None  # OPEN, CLOSED


class TeamWorkerCompletionSchema(Schema):
    """Schema for a worker marking their work complete in a team job"""
    completion_notes: Optional[str] = None


class TeamJobStartSchema(Schema):
    """Schema for starting a team job (when threshold reached or manually)"""
    force_start: bool = False  # True to start even if threshold not met


# ===========================================================================
# DAILY PAYMENT SCHEMAS - Daily Rate Job Support
# ===========================================================================

class LogAttendanceSchema(Schema):
    """Schema for logging daily attendance"""
    work_date: str  # YYYY-MM-DD format
    status: str  # PENDING, PRESENT, HALF_DAY, ABSENT
    time_in: Optional[str] = None  # ISO datetime
    time_out: Optional[str] = None  # ISO datetime
    notes: Optional[str] = None
    assignment_id: Optional[int] = None  # For team jobs
    employee_id: Optional[int] = None  # For agency jobs


class ConfirmAttendanceSchema(Schema):
    """Schema for confirming attendance (worker or client)"""
    adjusted_status: Optional[str] = None  # Optional status adjustment


class RequestExtensionSchema(Schema):
    """Schema for requesting a job extension"""
    additional_days: int
    reason: str


class ApproveExtensionSchema(Schema):
    """Schema for approving/rejecting extension"""
    approve: bool
    rejection_reason: Optional[str] = None


class RequestRateChangeSchema(Schema):
    """Schema for requesting a rate change"""
    new_rate: float  # new daily rate
    reason: str
    effective_date: str  # YYYY-MM-DD format


class ApproveRateChangeSchema(Schema):
    """Schema for approving/rejecting rate change"""
    approve: bool
    rejection_reason: Optional[str] = None


class CancelDailyJobSchema(Schema):
    """Schema for canceling a daily job"""
    reason: str

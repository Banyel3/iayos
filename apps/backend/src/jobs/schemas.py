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
    rating: int  # 1-5 stars
    message: Optional[str] = None  # Optional review message


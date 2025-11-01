from ninja import Schema
from typing import Optional


class CreateJobPostingSchema(Schema):
    title: str
    description: str
    category_id: int
    budget: float
    location: str
    expected_duration: Optional[str] = None
    urgency: str  # LOW, MEDIUM, HIGH
    preferred_start_date: Optional[str] = None
    materials_needed: Optional[list[str]] = []


class JobPostingResponseSchema(Schema):
    success: bool
    job_posting_id: int
    message: str


class JobApplicationSchema(Schema):
    proposal_message: str
    proposed_budget: float
    estimated_duration: Optional[str] = None
    budget_option: str  # ACCEPT or NEGOTIATE

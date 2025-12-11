from ninja import Schema
from typing import Optional

class CreateJobPostingSchema(Schema):
    """Schema for creating a new job posting"""
    title: str
    description: str
    category_id: int
    budget: float
    location: str
    expected_duration: Optional[str] = None
    urgency: str  # LOW, MEDIUM, HIGH
    preferred_start_date: Optional[str] = None  # YYYY-MM-DD format
    materials_needed: Optional[list[str]] = []

class JobPostingResponseSchema(Schema):
    """Schema for job posting response"""
    success: bool
    job_posting_id: int
    message: str

"""
Admin Panel API Schemas

This module defines Ninja schemas for admin panel API endpoints.
Uses Django Ninja's Schema class for request/response validation.
"""

from ninja import Schema
from typing import Optional, List
from datetime import date


# ==================== CERTIFICATION VERIFICATION SCHEMAS ====================

class PendingCertificationSchema(Schema):
    """Schema for a single pending certification in the list view."""
    certificationID: int
    name: str
    issuing_organization: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    certificate_url: Optional[str] = None
    is_expired: bool
    days_until_expiry: Optional[int] = None
    uploaded_at: Optional[str] = None
    worker_name: str
    worker_email: str
    worker_id: int
    skill_name: Optional[str] = None


class PendingCertificationsResponseSchema(Schema):
    """Paginated response for pending certifications list."""
    certifications: List[PendingCertificationSchema]
    total_count: int
    page: int
    page_size: int
    total_pages: int


class WorkerProfileSchema(Schema):
    """Worker profile information for certification detail."""
    worker_id: int
    account_id: int
    first_name: str
    last_name: str
    email: str
    contact_num: Optional[str] = None
    profile_img: Optional[str] = None


class CertificationSchema(Schema):
    """Full certification details."""
    certificationID: int
    name: str
    issuing_organization: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    certificate_url: Optional[str] = None
    is_verified: bool
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None
    is_expired: bool
    days_until_expiry: Optional[int] = None
    skill_name: Optional[str] = None


class VerificationHistorySchema(Schema):
    """Single verification history log entry."""
    certLogID: int
    action: str  # APPROVED or REJECTED
    reviewedBy: Optional[str] = None
    reviewedAt: str
    reason: str


class CertificationDetailSchema(Schema):
    """Complete certification detail response with context."""
    certification: CertificationSchema
    worker_profile: WorkerProfileSchema
    verification_history: List[VerificationHistorySchema]


class ApproveCertificationSchema(Schema):
    """Request payload for approving a certification."""
    notes: Optional[str] = None


class RejectCertificationSchema(Schema):
    """Request payload for rejecting a certification."""
    reason: str  # Required, minimum 10 characters


class VerificationStatsSchema(Schema):
    """Dashboard statistics for certification verification."""
    pending_count: int
    approved_today: int
    expiring_soon_count: int


class CertificationActionResponseSchema(Schema):
    """Response for approve/reject actions."""
    success: bool
    message: str
    certificationID: int
    worker_email: str
    certification_name: str
    is_verified: Optional[bool] = None
    verified_at: Optional[str] = None
    reason: Optional[str] = None


class VerificationHistoryListSchema(Schema):
    """List of verification history entries."""
    history: List[VerificationHistorySchema]


class CertificationHistoryRecordSchema(Schema):
    """Aggregated certification verification history record."""
    certLogID: int
    certification_id: int
    certification_name: str
    worker_name: str
    worker_email: str
    action: str
    reviewed_by_name: Optional[str] = None
    reviewed_at: str
    reason: Optional[str] = None


class PaginationMetadataSchema(Schema):
    """Pagination metadata returned with list responses."""
    page: int
    page_size: int
    total_records: int
    total_pages: int


class CertificationHistoryResponseSchema(Schema):
    """Response payload for the aggregated certification history endpoint."""
    history: List[CertificationHistoryRecordSchema]
    pagination: PaginationMetadataSchema

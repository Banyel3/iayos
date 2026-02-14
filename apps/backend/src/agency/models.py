from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
from decimal import Decimal

# Lightweight agency-specific KYC models mirroring accounts.kyc & kycFiles


class AgencyKYC(models.Model):
    """
    KYC records for agency accounts.
    """
    agencyKycID = models.BigAutoField(primary_key=True)
    # accountFK references Accounts model from accounts app
    accountFK = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    class AgencyKycStatus(models.TextChoices):
        PENDING = "PENDING", "pending"
        APPROVED = "APPROVED", "approved"
        REJECTED = "REJECTED", "rejected"

    class RejectionCategory(models.TextChoices):
        INVALID_DOCUMENT = "INVALID_DOCUMENT", "Invalid Document"
        EXPIRED_DOCUMENT = "EXPIRED_DOCUMENT", "Expired Document"
        UNCLEAR_IMAGE = "UNCLEAR_IMAGE", "Unclear/Blurry Image"
        MISMATCH_INFO = "MISMATCH_INFO", "Information Mismatch"
        INCOMPLETE = "INCOMPLETE", "Incomplete Submission"
        OTHER = "OTHER", "Other"

    status = models.CharField(max_length=10, choices=AgencyKycStatus.choices, default="PENDING", blank=True)
    reviewedAt = models.DateTimeField(null=True, blank=True)
    reviewedBy = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="reviewed_agency_kyc")
    notes = models.CharField(max_length=511, blank=True, default="")
    
    # KYC Enhancement fields (Module 6)
    rejectionCategory = models.CharField(
        max_length=30, 
        choices=RejectionCategory.choices, 
        null=True, 
        blank=True,
        help_text="Category of rejection reason"
    )
    rejectionReason = models.TextField(
        blank=True, 
        default="",
        help_text="Detailed rejection reason for the user"
    )
    resubmissionCount = models.IntegerField(
        default=0,
        help_text="Number of times the user has resubmitted KYC documents"
    )
    maxResubmissions = models.IntegerField(
        default=3,
        help_text="Maximum allowed resubmission attempts"
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    def can_resubmit(self):
        """Check if user can still resubmit KYC documents."""
        return self.status == 'REJECTED' and self.resubmissionCount < self.maxResubmissions
    
    def get_remaining_attempts(self):
        """Get number of remaining resubmission attempts."""
        return max(0, self.maxResubmissions - self.resubmissionCount)


class AgencyKycFile(models.Model):
    """Files uploaded for agency KYC submissions with AI verification."""
    fileID = models.BigAutoField(primary_key=True)
    agencyKyc = models.ForeignKey(AgencyKYC, on_delete=models.CASCADE)

    class FileType(models.TextChoices):
        BUSINESS_PERMIT = "BUSINESS_PERMIT", "business_permit"
        REP_ID_FRONT = "REP_ID_FRONT", "rep_id_front"
        REP_ID_BACK = "REP_ID_BACK", "rep_id_back"
        REP_SELFIE = "REP_SELFIE", "rep_selfie"
        ADDRESS_PROOF = "ADDRESS_PROOF", "address_proof"
        AUTH_LETTER = "AUTH_LETTER", "authorization_letter"

    class AIVerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Verification"
        PASSED = "PASSED", "AI Verification Passed"
        FAILED = "FAILED", "AI Verification Failed"
        WARNING = "WARNING", "Needs Manual Review"
        SKIPPED = "SKIPPED", "Verification Skipped"
    
    class AIRejectionReason(models.TextChoices):
        NO_FACE_DETECTED = "NO_FACE_DETECTED", "No Face Detected"
        MULTIPLE_FACES = "MULTIPLE_FACES", "Multiple Faces"
        FACE_TOO_SMALL = "FACE_TOO_SMALL", "Face Too Small"
        MISSING_REQUIRED_TEXT = "MISSING_REQUIRED_TEXT", "Missing Required Text"
        IMAGE_TOO_BLURRY = "IMAGE_TOO_BLURRY", "Image Too Blurry"
        RESOLUTION_TOO_LOW = "RESOLUTION_TOO_LOW", "Resolution Too Low"
        INVALID_ORIENTATION = "INVALID_ORIENTATION", "Invalid Orientation"
        UNREADABLE_DOCUMENT = "UNREADABLE_DOCUMENT", "Unreadable Document"

    # Core file fields
    fileType = models.CharField(max_length=30, choices=FileType.choices, null=True, blank=True)
    fileURL = models.CharField(max_length=1000)
    fileName = models.CharField(max_length=255, null=True, blank=True)
    fileSize = models.IntegerField(null=True, blank=True)
    uploadedAt = models.DateTimeField(auto_now_add=True)
    
    # AI Verification Fields (CompreFace + Tesseract OCR)
    ai_verification_status = models.CharField(
        max_length=20,
        choices=AIVerificationStatus.choices,
        default=AIVerificationStatus.PENDING,
        help_text='Result of automated AI verification'
    )
    face_detected = models.BooleanField(null=True, blank=True, help_text='Face detected in document')
    face_count = models.IntegerField(null=True, blank=True, help_text='Number of faces detected')
    face_confidence = models.FloatField(null=True, blank=True, help_text='Face detection confidence (0-1)')
    ocr_text = models.TextField(null=True, blank=True, help_text='Extracted text via OCR')
    ocr_confidence = models.FloatField(null=True, blank=True, help_text='OCR confidence (0-1)')
    quality_score = models.FloatField(null=True, blank=True, help_text='Image quality score (0-1)')
    ai_confidence_score = models.FloatField(null=True, blank=True, help_text='Overall AI confidence (0-1)')
    ai_rejection_reason = models.CharField(
        max_length=50,
        choices=AIRejectionReason.choices,
        null=True,
        blank=True,
        help_text='Reason for AI rejection'
    )
    ai_rejection_message = models.CharField(max_length=500, null=True, blank=True, help_text='User-facing rejection message')
    ai_warnings = models.JSONField(null=True, blank=True, default=list, help_text='Warnings from AI')
    ai_details = models.JSONField(null=True, blank=True, default=dict, help_text='Full AI verification details')
    verified_at = models.DateTimeField(null=True, blank=True, help_text='When AI verification completed')

    def clean(self):
        # Basic validation: ensure fileName exists for images
        if not self.fileURL:
            raise ValidationError({"fileURL": "fileURL is required"})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    class Meta:
        indexes = [
            models.Index(fields=['ai_verification_status'], name='agency_kyc_ai_status_idx'),
        ]


class AgencyEmployee(models.Model):
    """
    Employees managed by an agency account.
    """
    employeeID = models.BigAutoField(primary_key=True)
    # Link to the agency account (must be an agency type account)
    agency = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="agency_employees"
    )
    
    # Employee name breakdown (NEW)
    firstName = models.CharField(max_length=100, default="")
    middleName = models.CharField(max_length=100, blank=True, default="")
    lastName = models.CharField(max_length=100, default="")
    
    # Legacy name field (kept for backward compatibility during migration)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, blank=True, default="")
    # Mobile number for employee (E.164 or local format), added to support agency-managed contacts
    mobile = models.CharField(max_length=15, blank=True, default="", help_text="Employee mobile number")
    
    # Specializations as JSON array (NEW - replaces single role)
    specializations = models.TextField(default="[]", help_text="JSON array of specialization names")
    
    # Legacy role field (kept for backward compatibility during migration)
    role = models.CharField(max_length=100, blank=True, default="")
    avatar = models.CharField(max_length=1000, blank=True, null=True)  # URL to avatar image
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)  # 0.00 to 5.00
    
    # Rate fields for daily/hourly jobs
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Employee's hourly rate in PHP"
    )
    daily_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Employee's daily rate in PHP"
    )
    is_available_daily_jobs = models.BooleanField(
        default=True,
        help_text="Whether employee accepts daily rate jobs"
    )
    
    # Performance tracking fields (Agency Phase 2)
    employeeOfTheMonth = models.BooleanField(
        default=False,
        help_text="Whether this employee is currently Employee of the Month"
    )
    employeeOfTheMonthDate = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when employee was selected as EOTM"
    )
    employeeOfTheMonthReason = models.TextField(
        blank=True,
        default="",
        help_text="Reason for selecting as Employee of the Month"
    )
    lastRatingUpdate = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time the rating was manually updated by agency owner"
    )
    totalJobsCompleted = models.IntegerField(
        default=0,
        help_text="Total number of jobs completed by this employee"
    )
    totalEarnings = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total earnings generated by this employee"
    )
    isActive = models.BooleanField(
        default=True,
        help_text="Whether the employee is currently active"
    )
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "agency_employees"
        ordering = ["-rating", "name"]
        indexes = [
            models.Index(fields=['agency', 'isActive']),
            models.Index(fields=['agency', 'employeeOfTheMonth']),
            models.Index(fields=['-rating']),
            models.Index(fields=['-totalJobsCompleted']),
        ]
    
    def __str__(self):
        return f"{self.fullName} ({self.email}) - {self.agency.email}"

    @property
    def employeeId(self):
        """Alias with lowercase d for backward compatibility."""
        return self.employeeID

    @property
    def fullName(self):
        """Computed full name from firstName, middleName, lastName."""
        parts = [self.firstName or ""]
        if self.middleName:
            parts.append(self.middleName)
        if self.lastName:
            parts.append(self.lastName)
        full = " ".join(filter(None, parts))
        # Fallback to legacy name field if parts are empty
        return full if full.strip() else self.name
    
    def get_specializations_list(self):
        """Get specializations as Python list."""
        import json
        try:
            return json.loads(self.specializations or "[]")
        except json.JSONDecodeError:
            return [self.role] if self.role else []
    
    def set_specializations_list(self, specs_list):
        """Set specializations from Python list."""
        import json
        self.specializations = json.dumps(specs_list or [])
    
    def calculate_average_rating(self):
        """
        Calculate average rating from all job reviews for this employee.
        This method will be used when we implement job assignment tracking.
        """
        # TODO: Implement when job-employee assignment model is created
        # from jobs.models import JobAssignment
        # assignments = JobAssignment.objects.filter(employee=self)
        # if assignments.exists():
        #     avg = assignments.aggregate(Avg('review__rating'))['review__rating__avg']
        #     return round(avg, 2) if avg else None
        return self.rating
    
    def get_job_history(self, limit=10):
        """
        Get recent jobs completed by this employee.
        Returns a list of job dictionaries with basic info.
        """
        # TODO: Implement when job-employee assignment model is created
        # from jobs.models import JobAssignment
        # assignments = JobAssignment.objects.filter(
        #     employee=self,
        #     status='COMPLETED'
        # ).order_by('-completedAt')[:limit]
        # return [{
        #     'job_id': a.job.id,
        #     'title': a.job.title,
        #     'completed_at': a.completedAt,
        #     'rating': a.review.rating if hasattr(a, 'review') else None
        # } for a in assignments]
        return []
    
    def get_performance_stats(self):
        """
        Get comprehensive performance statistics for this employee.
        """
        return {
            'total_jobs': self.totalJobsCompleted,
            'total_earnings': float(self.totalEarnings),
            'average_rating': float(self.rating) if self.rating else 0.0,
            'is_employee_of_month': self.employeeOfTheMonth,
            'eotm_date': self.employeeOfTheMonthDate,
            'is_active': self.isActive,
            'jobs_history': self.get_job_history()
        }
    
    def update_totals(self, job_payment=None):
        """
        Update total jobs completed and earnings.
        Call this after a job is completed by this employee.
        """
        self.totalJobsCompleted += 1
        if job_payment:
            self.totalEarnings += job_payment
        self.save(update_fields=['totalJobsCompleted', 'totalEarnings', 'updatedAt'])


class AgencyKYCExtractedData(models.Model):
    """
    Structured storage for Agency KYC data extracted via AI/OCR from business documents.
    Similar to accounts.KYCExtractedData but for agency-specific fields.
    """
    extractedDataID = models.BigAutoField(primary_key=True)
    agencyKyc = models.OneToOneField(
        AgencyKYC,
        on_delete=models.CASCADE,
        related_name='extracted_data',
        help_text="Parent AgencyKYC record"
    )
    
    # ============================================================
    # BUSINESS INFORMATION (from Business Permit)
    # ============================================================
    extracted_business_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Business name extracted from permit"
    )
    extracted_business_type = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Type of business (e.g., Sole Proprietorship, Corporation)"
    )
    extracted_business_address = models.TextField(
        blank=True,
        default="",
        help_text="Business address extracted from permit"
    )
    extracted_permit_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Business permit number"
    )
    extracted_permit_issue_date = models.DateField(
        null=True,
        blank=True,
        help_text="Permit issue date"
    )
    extracted_permit_expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Permit expiry date"
    )
    extracted_dti_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="DTI registration number if present"
    )
    extracted_sec_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="SEC registration number if corporation"
    )
    extracted_tin = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Tax Identification Number (TIN)"
    )
    
    # ============================================================
    # REPRESENTATIVE INFORMATION (from Rep ID)
    # ============================================================
    extracted_rep_full_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Representative's full name from ID"
    )
    extracted_rep_id_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Representative's ID number"
    )
    extracted_rep_id_type = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Type of representative's ID"
    )
    extracted_rep_birth_date = models.DateField(
        null=True,
        blank=True,
        help_text="Representative's birth date"
    )
    extracted_rep_address = models.TextField(
        blank=True,
        default="",
        help_text="Representative's address from ID"
    )
    
    # ============================================================
    # CONFIRMED FIELDS (user-edited values)
    # ============================================================
    confirmed_business_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="User-confirmed business name"
    )
    confirmed_business_type = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )
    confirmed_business_address = models.TextField(
        blank=True,
        default=""
    )
    confirmed_permit_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )
    confirmed_permit_issue_date = models.DateField(
        null=True,
        blank=True
    )
    confirmed_permit_expiry_date = models.DateField(
        null=True,
        blank=True
    )
    confirmed_dti_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )
    confirmed_sec_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )
    confirmed_tin = models.CharField(
        max_length=50,
        blank=True,
        default=""
    )
    confirmed_rep_full_name = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )
    confirmed_rep_id_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )
    confirmed_rep_birth_date = models.DateField(
        null=True,
        blank=True
    )
    confirmed_rep_address = models.TextField(
        blank=True,
        default=""
    )
    
    # ============================================================
    # CONFIDENCE SCORES (0.0 to 1.0)
    # ============================================================
    confidence_business_name = models.FloatField(
        default=0.0,
        help_text="Confidence in extracted business name"
    )
    confidence_business_address = models.FloatField(
        default=0.0,
        help_text="Confidence in extracted business address"
    )
    confidence_permit_number = models.FloatField(
        default=0.0,
        help_text="Confidence in extracted permit number"
    )
    confidence_rep_name = models.FloatField(
        default=0.0,
        help_text="Confidence in extracted representative name"
    )
    overall_confidence = models.FloatField(
        default=0.0,
        help_text="Overall extraction confidence score"
    )
    
    # ============================================================
    # METADATA
    # ============================================================
    class ExtractionStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Extraction"
        EXTRACTED = "EXTRACTED", "Data Extracted"
        CONFIRMED = "CONFIRMED", "User Confirmed"
        FAILED = "FAILED", "Extraction Failed"
    
    extraction_status = models.CharField(
        max_length=20,
        choices=ExtractionStatus.choices,
        default=ExtractionStatus.PENDING,
        help_text="Current status of extraction process"
    )
    extraction_source = models.CharField(
        max_length=100,
        default="Tesseract OCR",
        help_text="Source of extraction (OCR engine used)"
    )
    extracted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When extraction completed"
    )
    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When user confirmed the data"
    )
    user_edited_fields = models.JSONField(
        default=list,
        blank=True,
        help_text="List of field names that user edited"
    )
    raw_extraction_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Raw extraction output for debugging"
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "agency_kyc_extracted_data"
        verbose_name = "Agency KYC Extracted Data"
        verbose_name_plural = "Agency KYC Extracted Data"
    
    def __str__(self):
        return f"Extracted Data for AgencyKYC #{self.agencyKyc.agencyKycID} - {self.extraction_status}"
    
    def get_autofill_data(self) -> dict:
        """
        Return data suitable for auto-filling agency KYC forms.
        Returns extracted values with confidence scores in the format expected by mobile app.
        """
        def _make_field(confirmed_val, extracted_val, confidence, default=""):
            """Helper to create field object with value, confidence, and source"""
            is_confirmed = confirmed_val is not None and str(confirmed_val).strip() != ""
            value = confirmed_val if is_confirmed else (extracted_val if extracted_val else default)
            # Convert to string for consistency
            if value is not None:
                value = str(value) if value else default
            return {
                "value": value,
                "confidence": confidence or 0.0,
                "source": "confirmed" if is_confirmed else "ocr"
            }
        
        return {
            # Business Information
            "business_name": _make_field(
                self.confirmed_business_name,
                self.extracted_business_name,
                self.confidence_business_name
            ),
            "business_type": _make_field(
                self.confirmed_business_type,
                self.extracted_business_type,
                0.7
            ),
            "business_address": _make_field(
                self.confirmed_business_address,
                self.extracted_business_address,
                self.confidence_business_address
            ),
            "permit_number": _make_field(
                self.confirmed_permit_number,
                self.extracted_permit_number,
                self.confidence_permit_number
            ),
            "permit_issue_date": _make_field(
                self.confirmed_permit_issue_date,
                self.extracted_permit_issue_date,
                0.7
            ),
            "permit_expiry_date": _make_field(
                self.confirmed_permit_expiry_date,
                self.extracted_permit_expiry_date,
                0.7
            ),
            "dti_number": _make_field(
                self.confirmed_dti_number,
                self.extracted_dti_number,
                0.8
            ),
            "sec_number": _make_field(
                self.confirmed_sec_number,
                self.extracted_sec_number,
                0.8
            ),
            "tin": _make_field(
                self.confirmed_tin,
                self.extracted_tin,
                0.8
            ),
            # Representative Information
            "rep_full_name": _make_field(
                self.confirmed_rep_full_name,
                self.extracted_rep_full_name,
                self.confidence_rep_name
            ),
            "rep_id_number": _make_field(
                self.confirmed_rep_id_number,
                self.extracted_rep_id_number,
                0.8
            ),
            "rep_id_type": _make_field(
                None,
                self.extracted_rep_id_type,
                0.9
            ),
            "rep_birth_date": _make_field(
                self.confirmed_rep_birth_date,
                self.extracted_rep_birth_date,
                0.7
            ),
            "rep_address": _make_field(
                self.confirmed_rep_address,
                self.extracted_rep_address,
                0.7
            ),
        }

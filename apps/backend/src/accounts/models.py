from django.db import models
from datetime import datetime
from decimal import Decimal
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError


class AccountsManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):

          # Remove fields that don't belong in Accounts
        extra_fields.pop("createdAt", None)
        extra_fields.pop("created_at", None)
        extra_fields.pop("updatedAt", None)
        extra_fields.pop("updated_at", None)

        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # properly hashes the password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("isVerified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class Accounts(AbstractBaseUser, PermissionsMixin):  # <-- include PermissionsMixin!
    accountID = models.BigAutoField(primary_key=True)
    email = models.EmailField(max_length=64, unique=True)
    password = models.CharField(max_length=128)
    isVerified = models.BooleanField(default=False)
    KYCVerified = models.BooleanField(default=False)

    # Required for Django admin + PermissionsMixin
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Account suspension and ban fields
    is_suspended = models.BooleanField(default=False)
    suspended_until = models.DateTimeField(null=True, blank=True)
    suspended_reason = models.TextField(null=True, blank=True)
    is_banned = models.BooleanField(default=False)
    banned_at = models.DateTimeField(null=True, blank=True)
    banned_reason = models.TextField(null=True, blank=True)
    banned_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='banned_accounts')

    verifyToken = models.CharField(max_length=255, null=True, blank=True)  # Changed to CharField for hash
    verifyTokenExpiry = models.DateTimeField(null=True, blank=True)
    street_address = models.CharField(max_length=255, default="", blank=True)   # "123 Main St"
    city = models.CharField(max_length=100, default="", blank=True)             # "Zamboanga City"
    province = models.CharField(max_length=100, default="", blank=True)         # "Zamboanga del Sur"
    postal_code = models.CharField(max_length=20, default="", blank=True)       # "7000"
    country = models.CharField(max_length=100, default="Philippines", blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # you can add fields here if you want during `createsuperuser`

    objects = AccountsManager()


class Profile(models.Model):
    profileID = models.BigAutoField(primary_key=True)
    profileImg = models.CharField(max_length=500, null=True, blank=True)  # Allow NULL for no image
    firstName = models.CharField(max_length=24)
    middleName = models.CharField(max_length=24, null=True, blank=True)
    lastName = models.CharField(max_length=24)
    contactNum = models.CharField(max_length=11)
    birthDate = models.DateField()

    class ProfileType(models.TextChoices):
        WORKER = "WORKER", "Worker"
        CLIENT = "CLIENT", "Client"

    profileType = models.CharField(
        max_length=10, choices=ProfileType.choices, null=True, blank=True
    )

    # GPS Location tracking fields
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=8, 
        null=True, 
        blank=True,
        help_text="Current latitude coordinate"
    )
    longitude = models.DecimalField(
        max_digits=11, 
        decimal_places=8, 
        null=True, 
        blank=True,
        help_text="Current longitude coordinate"
    )
    location_updated_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Timestamp of last location update"
    )
    location_sharing_enabled = models.BooleanField(
        default=False,
        help_text="Whether user has enabled location sharing"
    )

    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE)


class Agency(models.Model): 
    agencyId = models.BigAutoField(primary_key=True)
    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE)
    businessName = models.CharField(max_length=50)
    street_address = models.CharField(max_length=255, default="", blank=True)   # "123 Main St"
    city = models.CharField(max_length=100, default="", blank=True)             # "Zamboanga City"
    province = models.CharField(max_length=100, default="", blank=True)         # "Zamboanga del Sur"
    postal_code = models.CharField(max_length=20, default="", blank=True)
    country = models.CharField(max_length=100, default="Philippines", blank=True)
    
    businessDesc = models.CharField(max_length=255, default="", blank=True)
    contactNumber = models.CharField(max_length=11, default="", blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)




class WorkerProfile(models.Model):
    profileID = models.OneToOneField(Profile, on_delete=models.CASCADE)
    description = models.CharField(max_length=350, blank=True, default="")
    workerRating = models.IntegerField(default=0)
    totalEarningGross = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Worker Phase 1: Profile Enhancement Fields
    bio = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Short bio/tagline (max 200 chars)"
    )
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Worker's hourly rate in PHP"
    )
    profile_completion_percentage = models.IntegerField(
        default=0,
        help_text="Profile completion percentage (0-100)"
    )
    soft_skills = models.TextField(
        blank=True,
        default="",
        help_text="Comma-separated soft skills (e.g., 'Punctual, Team Player, Bilingual')"
    )
    
    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", 'available'
        BUSY = "BUSY", 'busy'
        OFFLINE = "OFFLINE", "offline"

    availability_status = models.CharField(
        max_length=10, choices=AvailabilityStatus.choices, default="OFFLINE", blank=True
    )
    
    def calculate_profile_completion(self):
        """
        Calculate profile completion percentage based on filled fields.
        Returns: int (0-100)
        """
        total_fields = 7
        completed_fields = 0
        
        # Check each field
        if self.bio and len(self.bio.strip()) > 0:
            completed_fields += 1
        if self.description and len(self.description.strip()) > 0:
            completed_fields += 1
        if self.hourly_rate and self.hourly_rate > 0:
            completed_fields += 1
        
        # Check related fields
        if self.profileID.profileImg:
            completed_fields += 1
        if workerSpecialization.objects.filter(workerID=self).exists():
            completed_fields += 1
        if hasattr(self, 'certifications') and self.certifications.exists():  # type: ignore[attr-defined]
            completed_fields += 1
        if hasattr(self, 'portfolio') and self.portfolio.exists():  # type: ignore[attr-defined]
            completed_fields += 1
        
        percentage = int((completed_fields / total_fields) * 100)
        return percentage
    
    def update_profile_completion(self):
        """Update and save the profile completion percentage"""
        self.profile_completion_percentage = self.calculate_profile_completion()
        self.save(update_fields=['profile_completion_percentage'])
        return self.profile_completion_percentage

class ClientProfile(models.Model):
    profileID = models.OneToOneField(Profile, on_delete=models.CASCADE)
    description = models.CharField(max_length=350)
    totalJobsPosted = models.IntegerField()
    clientRating = models.IntegerField(default=0)
    activeJobsCount = models.IntegerField(default=0)

class Specializations(models.Model):
    specializationID = models.BigAutoField(primary_key=True)
    specializationName = models.CharField(max_length=250)
    description = models.TextField(blank=True, null=True)
    minimumRate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    rateType = models.CharField(max_length=20, default='hourly')  # hourly, daily, fixed
    skillLevel = models.CharField(max_length=20, default='intermediate')  # entry, intermediate, expert
    averageProjectCostMin = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    averageProjectCostMax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    class Meta:
        db_table = 'specializations'

class InterestedJobs(models.Model):
    clientID = models.ForeignKey(ClientProfile, on_delete=models.CASCADE)
    specializationID = models.ForeignKey(Specializations, on_delete=models.CASCADE)


class workerSpecialization(models.Model):
    workerID = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE )
    specializationID = models.ForeignKey(Specializations, on_delete=models.CASCADE)
    experienceYears = models.IntegerField()
    certification = models.CharField(max_length=120)


# Worker Phase 1: Profile Enhancement Models

class WorkerCertification(models.Model):
    """
    Professional certifications and licenses for workers.
    Examples: TESDA certificates, professional licenses, training completion
    """
    certificationID = models.BigAutoField(primary_key=True)
    workerID = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name='certifications'
    )
    
    # Link to specific skill (REQUIRED - all certifications must be bound to a skill)
    specializationID = models.ForeignKey(
        'workerSpecialization',
        on_delete=models.CASCADE,
        related_name='certifications',
        help_text="The specific skill this certification is for (e.g., Plumbing, Electrical). All certifications must be linked to a skill."
    )
    
    name = models.CharField(
        max_length=255,
        help_text="Certificate name (e.g., 'TESDA Plumbing NC II')"
    )
    issuing_organization = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Organization that issued the certificate (e.g., 'TESDA')"
    )
    issue_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when certification was issued"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Expiration date (null if does not expire)"
    )
    certificate_url = models.CharField(
        max_length=1000,
        blank=True,
        default="",
        help_text="Supabase URL to certificate image/PDF"
    )
    
    # Verification status (for future admin verification)
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether admin has verified this certification"
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When certification was verified by admin"
    )
    verified_by = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_certifications',
        help_text="Admin who verified the certification"
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'worker_certifications'
        ordering = ['-issue_date', '-createdAt']
        indexes = [
            models.Index(fields=['workerID', '-issue_date']),
            models.Index(fields=['expiry_date']),  # For expiry alerts
        ]
    
    def __str__(self):
        return f"{self.name} - {self.workerID.profileID.firstName}"
    
    def is_expired(self):
        """Check if certification has expired"""
        if self.expiry_date:
            from django.utils import timezone
            return self.expiry_date < timezone.now().date()
        return False
    
    def clean(self):
        """Validate dates"""
        if self.issue_date and self.expiry_date:
            if self.expiry_date < self.issue_date:
                raise ValidationError({
                    'expiry_date': 'Expiry date cannot be before issue date'
                })


class WorkerMaterial(models.Model):
    """
    Materials/products offered by workers.
    Examples: Construction materials, spare parts, products they sell
    
    Materials can be linked to a specific specialization/category so clients
    only see relevant materials when hiring for a specific job type.
    """
    materialID = models.BigAutoField(primary_key=True)
    workerID = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name='materials'
    )
    
    # Optional link to specialization - allows filtering materials by job category
    categoryID = models.ForeignKey(
        Specializations,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='materials',
        help_text="The category/specialization this material is for (e.g., Plumbing, Electrical). Optional."
    )
    
    name = models.CharField(
        max_length=255,
        help_text="Material/product name (e.g., 'Cement 40kg bag', 'PVC Pipe 1 inch')"
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Detailed description of the material/product"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price in PHP"
    )
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1.00'),
        help_text="Quantity or stock count associated with the price"
    )
    unit = models.CharField(
        max_length=50,
        default="piece",
        help_text="Unit of measurement (e.g., 'piece', 'kg', 'meter', 'bag', 'box')"
    )
    image_url = models.CharField(
        max_length=1000,
        blank=True,
        default="",
        help_text="Supabase URL to product image"
    )
    is_available = models.BooleanField(
        default=True,
        help_text="Whether material is currently available for sale"
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'worker_materials'
        ordering = ['-createdAt']
        indexes = [
            models.Index(fields=['workerID', 'is_available']),
            models.Index(fields=['workerID', 'categoryID']),  # For filtering by category
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        category = f" [{self.categoryID.specializationName}]" if self.categoryID else ""
        return f"{self.name}{category} - ₱{self.price} for {self.quantity} {self.unit}"


class WorkerPortfolio(models.Model):
    """
    Portfolio images/work samples for workers to showcase their work.
    Helps clients see the quality and style of worker's previous projects.
    """
    portfolioID = models.BigAutoField(primary_key=True)
    workerID = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name='portfolio'
    )
    
    image_url = models.CharField(
        max_length=1000,
        help_text="Supabase URL to portfolio image"
    )
    caption = models.TextField(
        blank=True,
        default="",
        max_length=500,
        help_text="Description of the work shown (max 500 chars)"
    )
    display_order = models.IntegerField(
        default=0,
        help_text="Order in which to display (0 = first)"
    )
    
    # Image metadata
    file_name = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )
    file_size = models.IntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes"
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'worker_portfolio'
        ordering = ['display_order', '-createdAt']
        indexes = [
            models.Index(fields=['workerID', 'display_order']),
        ]
    
    def __str__(self):
        return f"Portfolio {self.portfolioID} - {self.workerID.profileID.firstName}"

class kyc(models.Model):
    kycID = models.BigAutoField(primary_key=True)
    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE)
    class KycStatus(models.TextChoices):
        PENDING = "PENDING", 'pending'
        APPROVED = "APPROVED", 'approved'
        REJECTED = "Rejected", "rejected"
    
    class RejectionCategory(models.TextChoices):
        INVALID_DOCUMENT = "INVALID_DOCUMENT", "Invalid Document"
        EXPIRED_DOCUMENT = "EXPIRED_DOCUMENT", "Expired Document"
        UNCLEAR_IMAGE = "UNCLEAR_IMAGE", "Unclear/Blurry Image"
        MISMATCH_INFO = "MISMATCH_INFO", "Information Mismatch"
        INCOMPLETE = "INCOMPLETE", "Incomplete Submission"
        OTHER = "OTHER", "Other"
    
    kyc_status = models.CharField(
        max_length=10, choices=KycStatus.choices, default="PENDING", blank=True
    )
    reviewedAt = models.DateTimeField(auto_now=True)
    reviewedBy = models.ForeignKey(
        Accounts, 
        on_delete=models.CASCADE, 
        null=True,
        blank=True,
        related_name="reviewed_kyc"
    )
    notes = models.TextField(blank=True, default="")  # Changed from CharField(211) to store AI rejection messages
    
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
        return self.kyc_status == 'REJECTED' and self.resubmissionCount < self.maxResubmissions
    
    def get_remaining_attempts(self):
        """Get number of remaining resubmission attempts."""
        return max(0, self.maxResubmissions - self.resubmissionCount)

class kycFiles(models.Model):
    kycFileID = models.BigAutoField(primary_key=True)
    kycID = models.ForeignKey(kyc, on_delete=models.CASCADE)
    
    class IDType(models.TextChoices):
        # ID Types
        PASSPORT = "PASSPORT", 'passport'
        NATIONALID = "NATIONALID", 'nationalid'
        UMID = "UMID", 'umid'
        PHILHEALTH = "PHILHEALTH", 'philhealth'
        DRIVERSLICENSE = "DRIVERSLICENSE", 'driverslicense'
        # Clearance Types
        POLICE = "POLICE", 'police'
        NBI = "NBI", 'nbi'

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

    idType = models.CharField(
        max_length=20, 
        choices=IDType.choices, 
        null=True,
        blank=True
    )
    fileURL = models.CharField(max_length=255)
    fileName = models.CharField(max_length=255, null=True, blank=True)
    fileSize = models.IntegerField(null=True, blank=True)  # Size in bytes
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
        """Validate that idType is provided for ID files"""
        # Simplified validation based on fileName patterns
        if self.fileName and ('frontid' in self.fileName.lower() or 'backid' in self.fileName.lower()):
            if not self.idType:
                raise ValidationError({
                    'idType': 'ID type is required for front/back ID files'
                })
    
    def save(self, *args, **kwargs):
        self.full_clean() 
        super().save(*args, **kwargs)
    
    class Meta:
        indexes = [
            models.Index(fields=['ai_verification_status'], name='kyc_ai_status_idx'),
        ]


class Notification(models.Model):
    """
    User notifications for important events (KYC updates, messages, etc.)
    """
    notificationID = models.BigAutoField(primary_key=True)
    accountFK = models.ForeignKey(
        Accounts, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    
    class NotificationType(models.TextChoices):
        # KYC Notifications
        KYC_APPROVED = "KYC_APPROVED", "KYC Approved"
        KYC_REJECTED = "KYC_REJECTED", "KYC Rejected"
        AGENCY_KYC_APPROVED = "AGENCY_KYC_APPROVED", "Agency KYC Approved"
        AGENCY_KYC_REJECTED = "AGENCY_KYC_REJECTED", "Agency KYC Rejected"

        # Job Application Notifications
        APPLICATION_RECEIVED = "APPLICATION_RECEIVED", "Application Received"
        APPLICATION_ACCEPTED = "APPLICATION_ACCEPTED", "Application Accepted"
        APPLICATION_REJECTED = "APPLICATION_REJECTED", "Application Rejected"

        # Job Status Notifications
        JOB_STARTED = "JOB_STARTED", "Job Started"
        JOB_COMPLETED_WORKER = "JOB_COMPLETED_WORKER", "Job Marked Complete by Worker"
        JOB_COMPLETED_CLIENT = "JOB_COMPLETED_CLIENT", "Job Approved by Client"
        JOB_CANCELLED = "JOB_CANCELLED", "Job Cancelled"

        # Payment Notifications
        PAYMENT_RECEIVED = "PAYMENT_RECEIVED", "Payment Received"
        ESCROW_PAID = "ESCROW_PAID", "Escrow Payment Confirmed"
        REMAINING_PAYMENT_PAID = "REMAINING_PAYMENT_PAID", "Final Payment Confirmed"
        PAYMENT_RELEASED = "PAYMENT_RELEASED", "Payment Released"

        # Message Notifications
        MESSAGE = "MESSAGE", "New Message"

        # Review Notifications
        REVIEW_RECEIVED = "REVIEW_RECEIVED", "Review Received"
        
        # Backjob/Dispute Notifications
        BACKJOB_REQUESTED = "BACKJOB_REQUESTED", "Backjob Requested"
        BACKJOB_APPROVED = "BACKJOB_APPROVED", "Backjob Approved"
        BACKJOB_REJECTED = "BACKJOB_REJECTED", "Backjob Rejected"
        BACKJOB_COMPLETED = "BACKJOB_COMPLETED", "Backjob Completed"

        # Certification Notifications
        CERTIFICATION_APPROVED = "CERTIFICATION_APPROVED", "Certification Approved"
        CERTIFICATION_REJECTED = "CERTIFICATION_REJECTED", "Certification Rejected"

        # System Notifications
        SYSTEM = "SYSTEM", "System"
    
    notificationType = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default="SYSTEM"
    )
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    isRead = models.BooleanField(default=False)

    # Optional: Link to related entities for context
    relatedKYCLogID = models.BigIntegerField(null=True, blank=True)
    relatedJobID = models.BigIntegerField(null=True, blank=True)
    relatedApplicationID = models.BigIntegerField(null=True, blank=True)
    
    createdAt = models.DateTimeField(auto_now_add=True)
    readAt = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-createdAt']
        indexes = [
            models.Index(fields=['accountFK', '-createdAt']),
            models.Index(fields=['accountFK', 'isRead']),
        ]
    
    def __str__(self):
        return f"{self.notificationType} - {self.accountFK.email} - {self.title}"


class PushToken(models.Model):
    """
    Stores Expo push tokens for mobile devices to send push notifications
    """
    tokenID = models.BigAutoField(primary_key=True)
    accountFK = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='push_tokens'
    )
    pushToken = models.CharField(max_length=500, unique=True)
    deviceType = models.CharField(max_length=20, choices=[('ios', 'iOS'), ('android', 'Android')], default='android')
    isActive = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    lastUsed = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-lastUsed']
        indexes = [
            models.Index(fields=['accountFK', 'isActive']),
            models.Index(fields=['pushToken']),
        ]

    def __str__(self):
        return f"{self.accountFK.email} - {self.deviceType} - {self.pushToken[:20]}..."


class NotificationSettings(models.Model):
    """
    User preferences for notification delivery
    """
    settingsID = models.BigAutoField(primary_key=True)
    accountFK = models.OneToOneField(
        Accounts,
        on_delete=models.CASCADE,
        related_name='notification_settings'
    )

    # Global settings
    pushEnabled = models.BooleanField(default=True)
    soundEnabled = models.BooleanField(default=True)

    # Category-specific settings
    jobUpdates = models.BooleanField(default=True)
    messages = models.BooleanField(default=True)
    payments = models.BooleanField(default=True)
    reviews = models.BooleanField(default=True)
    kycUpdates = models.BooleanField(default=True)

    # Do not disturb schedule (24-hour format HH:MM)
    doNotDisturbStart = models.TimeField(null=True, blank=True)
    doNotDisturbEnd = models.TimeField(null=True, blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification Settings - {self.accountFK.email}"


class Job(models.Model):
    """
    Jobs created by clients to hire workers
    """
    jobID = models.BigAutoField(primary_key=True)
    clientID = models.ForeignKey(
        ClientProfile,
        on_delete=models.CASCADE,
        related_name='jobs'
    )
    
    # Job Details
    title = models.CharField(max_length=200)
    description = models.TextField()
    categoryID = models.ForeignKey(
        Specializations,
        on_delete=models.SET_NULL,
        null=True,
        related_name='jobs'
    )
    
    # Budget (always project-based)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Escrow Payment Fields
    escrowAmount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Amount held in escrow (50% downpayment)"
    )
    escrowPaid = models.BooleanField(
        default=False,
        help_text="Whether the escrow downpayment has been paid"
    )
    escrowPaidAt = models.DateTimeField(null=True, blank=True)
    remainingPayment = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Remaining 50% to be paid upon completion"
    )
    remainingPaymentPaid = models.BooleanField(
        default=False,
        help_text="Whether the remaining 50% payment has been paid"
    )
    remainingPaymentPaidAt = models.DateTimeField(null=True, blank=True)
    
    # Payment Method Tracking (for final 50% payment)
    class PaymentMethod(models.TextChoices):
        GCASH = "GCASH", "GCash"
        CASH = "CASH", "Cash"
    
    finalPaymentMethod = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        null=True,
        blank=True,
        help_text="Payment method chosen for final 50% payment"
    )
    paymentMethodSelectedAt = models.DateTimeField(null=True, blank=True)
    
    # Cash Payment Proof (for cash payments)
    cashPaymentProofUrl = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        help_text="URL to proof of payment image (for cash payments)"
    )
    cashProofUploadedAt = models.DateTimeField(null=True, blank=True)
    
    # Admin verification for cash payments
    cashPaymentApproved = models.BooleanField(default=False)
    cashPaymentApprovedAt = models.DateTimeField(null=True, blank=True)
    cashPaymentApprovedBy = models.ForeignKey(
        'Accounts',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_cash_payments'
    )
    
    # Location
    location = models.CharField(max_length=255)
    
    # Duration and Urgency
    expectedDuration = models.CharField(max_length=100, null=True, blank=True)
    
    class UrgencyLevel(models.TextChoices):
        LOW = "LOW", "Low - Flexible timing"
        MEDIUM = "MEDIUM", "Medium - Within a week"
        HIGH = "HIGH", "High - ASAP"
    
    urgency = models.CharField(
        max_length=10,
        choices=UrgencyLevel.choices,
        default="MEDIUM"
    )
    
    # ============================================================
    # UNIVERSAL JOB FIELDS - For ML Price Prediction Accuracy
    # ============================================================
    class JobScope(models.TextChoices):
        MINOR_REPAIR = "MINOR_REPAIR", "Minor Repair (quick fix)"
        MODERATE_PROJECT = "MODERATE_PROJECT", "Moderate Project (few hours to a day)"
        MAJOR_RENOVATION = "MAJOR_RENOVATION", "Major Renovation (multi-day project)"
    
    job_scope = models.CharField(
        max_length=20,
        choices=JobScope.choices,
        default="MINOR_REPAIR",
        help_text="Scope/complexity of the job"
    )
    
    class SkillLevelRequired(models.TextChoices):
        ENTRY = "ENTRY", "Entry Level (basic skills)"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate (experienced)"
        EXPERT = "EXPERT", "Expert (specialized/licensed)"
    
    skill_level_required = models.CharField(
        max_length=15,
        choices=SkillLevelRequired.choices,
        default="INTERMEDIATE",
        help_text="Skill level required for this job"
    )
    
    class WorkEnvironment(models.TextChoices):
        INDOOR = "INDOOR", "Indoor"
        OUTDOOR = "OUTDOOR", "Outdoor"
        BOTH = "BOTH", "Both Indoor & Outdoor"
    
    work_environment = models.CharField(
        max_length=10,
        choices=WorkEnvironment.choices,
        default="INDOOR",
        help_text="Where the work will be performed"
    )
    # ============================================================
    
    # Preferred Start Date
    preferredStartDate = models.DateField(null=True, blank=True)
    
    # Materials Needed (stored as JSON array)
    materialsNeeded = models.JSONField(default=list, blank=True)
    
    # Job Type
    class JobType(models.TextChoices):
        LISTING = "LISTING", "Job Listing (Open for applications)"
        INVITE = "INVITE", "Direct Invite/Hire (Worker or Agency)"
    
    jobType = models.CharField(
        max_length=10,
        choices=JobType.choices,
        default="LISTING",
        help_text="LISTING = open job post, INVITE = direct hire"
    )
    
    # ============================================================
    # TEAM MODE FIELDS - Multi-Skill/Multi-Worker Support
    # ============================================================
    is_team_job = models.BooleanField(
        default=False,
        help_text="True if this job requires multiple workers/skills (team mode)"
    )
    
    class BudgetAllocationType(models.TextChoices):
        EQUAL_PER_SKILL = "EQUAL_PER_SKILL", "Equal budget per skill slot"
        EQUAL_PER_WORKER = "EQUAL_PER_WORKER", "Equal budget per worker (default)"
        MANUAL_ALLOCATION = "MANUAL_ALLOCATION", "Client manually allocates"
        SKILL_WEIGHTED = "SKILL_WEIGHTED", "Weighted by skill complexity"
    
    budget_allocation_type = models.CharField(
        max_length=20,
        choices=BudgetAllocationType.choices,
        default="EQUAL_PER_WORKER",
        help_text="How the total budget is distributed among skill slots/workers"
    )
    
    team_job_start_threshold = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100.00,
        help_text="Percentage of team positions that must be filled before job can start (0-100)"
    )
    
    @property
    def total_workers_needed(self):
        """Calculate total workers needed across all skill slots for team jobs."""
        if not self.is_team_job:
            return 1
        return self.skill_slots.aggregate(
            total=models.Sum('workers_needed')
        )['total'] or 0
    
    @property
    def total_workers_assigned(self):
        """Count of workers currently assigned to this team job."""
        if not self.is_team_job:
            return 1 if self.assignedWorkerID else 0
        return self.worker_assignments.filter(
            assignment_status='ACTIVE'
        ).count()
    
    @property
    def team_fill_percentage(self):
        """Percentage of team positions filled."""
        needed = self.total_workers_needed
        if needed == 0:
            return 0
        return round((self.total_workers_assigned / needed) * 100, 2)
    
    @property
    def can_start_team_job(self):
        """Check if team job has enough workers to start."""
        if not self.is_team_job:
            return self.assignedWorkerID is not None
        return self.team_fill_percentage >= float(self.team_job_start_threshold)
    # ============================================================
    
    # Job Status
    class JobStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
    
    status = models.CharField(
        max_length=15,
        choices=JobStatus.choices,
        default="ACTIVE"
    )
    
    # Invite Status (for INVITE-type jobs)
    class InviteStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Agency Response"
        ACCEPTED = "ACCEPTED", "Agency Accepted"
        REJECTED = "REJECTED", "Agency Rejected"
    
    inviteStatus = models.CharField(
        max_length=10,
        choices=InviteStatus.choices,
        null=True,
        blank=True,
        help_text="Status of agency/worker invite (only for INVITE-type jobs)"
    )
    inviteRejectionReason = models.TextField(
        null=True,
        blank=True,
        help_text="Reason provided by agency/worker for rejecting the invite"
    )
    inviteRespondedAt = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when agency/worker responded to invite"
    )
    
    # Assigned Worker or Agency
    assignedWorkerID = models.ForeignKey(
        'WorkerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_jobs',
        help_text="Worker assigned to this job (for individual workers)"
    )
    
    assignedAgencyFK = models.ForeignKey(
        'Agency',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_jobs',
        help_text="Agency assigned to this job (for agency hires)"
    )

    # LEGACY: Single employee assignment (kept for backward compatibility)
    # New jobs should use assignedEmployees (ManyToMany) instead
    assignedEmployeeID = models.ForeignKey(
        'agency.AgencyEmployee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='legacy_assigned_jobs',
        help_text="LEGACY: Single employee assignment. Use assignedEmployees for new jobs."
    )

    # NEW: Multiple employees can be assigned via through table
    assignedEmployees = models.ManyToManyField(
        'agency.AgencyEmployee',
        through='JobEmployeeAssignment',
        blank=True,
        related_name='assigned_jobs_multi',
        help_text="Multiple agency employees assigned to this job"
    )

    employeeAssignedAt = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When first employee was assigned by agency"
    )

    assignmentNotes = models.TextField(
        null=True,
        blank=True,
        help_text="Notes from agency about this assignment"
    )
    
    # Completion Details
    completedAt = models.DateTimeField(null=True, blank=True)
    cancellationReason = models.TextField(null=True, blank=True)
    
    # Work started tracking (client confirms worker has arrived)
    clientConfirmedWorkStarted = models.BooleanField(default=False)
    clientConfirmedWorkStartedAt = models.DateTimeField(null=True, blank=True)
    
    # Two-phase completion tracking
    workerMarkedComplete = models.BooleanField(default=False)
    clientMarkedComplete = models.BooleanField(default=False)
    workerMarkedCompleteAt = models.DateTimeField(null=True, blank=True)
    clientMarkedCompleteAt = models.DateTimeField(null=True, blank=True)
    
    # ============================================================
    # PAYMENT BUFFER SYSTEM - 7-Day Holding Period
    # Worker receives "Due Balance" which releases after buffer period
    # Client can request backjob during this window
    # ============================================================
    class PaymentHeldReason(models.TextChoices):
        BUFFER_PERIOD = "BUFFER_PERIOD", "Within buffer period (7 days)"
        BACKJOB_PENDING = "BACKJOB_PENDING", "Backjob request pending"
        ADMIN_HOLD = "ADMIN_HOLD", "Admin manually holding payment"
        RELEASED = "RELEASED", "Payment released to worker"
    
    paymentReleaseDate = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when payment will be released to worker (completedAt + buffer days)"
    )
    paymentReleasedToWorker = models.BooleanField(
        default=False,
        help_text="Whether the payment has been released to worker's wallet"
    )
    paymentReleasedAt = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when payment was released to worker"
    )
    paymentHeldReason = models.CharField(
        max_length=20,
        choices=PaymentHeldReason.choices,
        default="BUFFER_PERIOD",
        null=True,
        blank=True,
        help_text="Reason why payment is being held"
    )
    # ============================================================
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-createdAt']
        db_table = 'jobs'
        indexes = [
            models.Index(fields=['clientID', '-createdAt']),
            models.Index(fields=['status', '-createdAt']),
            models.Index(fields=['categoryID', 'status']),
            models.Index(fields=['urgency', '-createdAt']),
            models.Index(fields=['assignedWorkerID', 'status']),
            models.Index(fields=['assignedEmployeeID', 'status'], name='job_assign_emp_status_idx'),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.clientID.profileID.accountFK.email}"
    
    def save(self, *args, **kwargs):
        """Override save to create job log entry on status change"""
        # Check if this is an update (not a new instance)
        if self.pk:
            try:
                old_instance = Job.objects.get(pk=self.pk)
                # If status changed, create a log entry
                if old_instance.status != self.status:
                    # Import here to avoid circular dependency
                    from django.utils import timezone
                    
                    # Save the job first
                    super().save(*args, **kwargs)
                    
                    # Create log entry
                    JobLog.objects.create(
                        jobID=self,
                        oldStatus=old_instance.status,
                        newStatus=self.status,
                        changedBy=None,  # You can pass this through kwargs if needed
                        notes=f"Status changed from {old_instance.status} to {self.status}"
                    )
                    return
            except Job.DoesNotExist:
                pass
        
        # Normal save
        super().save(*args, **kwargs)


class JobEmployeeAssignment(models.Model):
    """
    Through table for many-to-many relationship between Jobs and AgencyEmployees.
    Allows multiple employees to be assigned to a single job.
    """
    assignmentID = models.BigAutoField(primary_key=True)
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='employee_assignments'
    )
    employee = models.ForeignKey(
        'agency.AgencyEmployee',
        on_delete=models.CASCADE,
        related_name='job_assignments'
    )
    
    # Assignment metadata
    assignedAt = models.DateTimeField(auto_now_add=True)
    assignedBy = models.ForeignKey(
        'Accounts',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee_assignments_made',
        help_text="The agency owner who made this assignment"
    )
    notes = models.TextField(blank=True, default="")
    
    # Role in the job
    isPrimaryContact = models.BooleanField(
        default=False,
        help_text="If true, this employee is the team lead/primary contact for this job"
    )
    
    # Status tracking
    class AssignmentStatus(models.TextChoices):
        ASSIGNED = "ASSIGNED", "Assigned"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        REMOVED = "REMOVED", "Removed from job"
    
    status = models.CharField(
        max_length=15,
        choices=AssignmentStatus.choices,
        default="ASSIGNED"
    )
    
    # Completion tracking per employee
    employeeMarkedComplete = models.BooleanField(default=False)
    employeeMarkedCompleteAt = models.DateTimeField(null=True, blank=True)
    completionNotes = models.TextField(blank=True, default="")
    
    class Meta:
        db_table = 'job_employee_assignments'
        unique_together = ['job', 'employee']  # Prevent duplicate assignments
        ordering = ['-isPrimaryContact', 'assignedAt']  # Primary contact first
        indexes = [
            models.Index(fields=['job', 'status']),
            models.Index(fields=['employee', 'status']),
        ]
    
    def __str__(self):
        return f"{self.employee.name} assigned to {self.job.title}"


class JobPhoto(models.Model):
    """
    Photos attached to jobs
    """
    photoID = models.BigAutoField(primary_key=True)
    jobID = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='photos'
    )
    
    photoURL = models.CharField(max_length=255)
    fileName = models.CharField(max_length=255, null=True, blank=True)
    uploadedAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'job_photos'
        ordering = ['-uploadedAt']
    
    def __str__(self):
        return f"Photo for {self.jobID.title}"


class JobLog(models.Model):
    """
    Tracks all status changes and important events for jobs
    """
    logID = models.BigAutoField(primary_key=True)
    jobID = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='logs'
    )
    
    # Status tracking
    oldStatus = models.CharField(max_length=30, null=True, blank=True)
    newStatus = models.CharField(max_length=30)
    
    # Who made the change
    changedBy = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='job_status_changes'
    )
    
    # Additional details
    notes = models.TextField(null=True, blank=True)
    
    # Timestamp
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'job_logs'
        ordering = ['-createdAt']
        indexes = [
            models.Index(fields=['jobID', '-createdAt']),
            models.Index(fields=['newStatus', '-createdAt']),
        ]
    
    def __str__(self):
        return f"Job #{self.jobID.jobID} - {self.oldStatus} → {self.newStatus}"


class JobApplication(models.Model):
    """
    Applications submitted by workers for jobs
    """
    applicationID = models.BigAutoField(primary_key=True)
    jobID = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    workerID = models.ForeignKey(
        'WorkerProfile',
        on_delete=models.CASCADE,
        related_name='job_applications'
    )
    
    # Team Mode: Skill Slot Reference (for team jobs)
    applied_skill_slot = models.ForeignKey(
        'JobSkillSlot',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
        help_text="Which skill slot this worker is applying for (team jobs only)"
    )
    
    # Proposal Details
    proposalMessage = models.TextField()
    proposedBudget = models.DecimalField(max_digits=10, decimal_places=2)
    estimatedDuration = models.CharField(max_length=100, blank=True, null=True)
    
    # Budget Option
    class BudgetOption(models.TextChoices):
        ACCEPT = "ACCEPT", "Accept Client's Budget"
        NEGOTIATE = "NEGOTIATE", "Negotiate Different Budget"
    
    budgetOption = models.CharField(
        max_length=20,
        choices=BudgetOption.choices,
        default="NEGOTIATE"
    )
    
    # Application Status
    class ApplicationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"
    
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default="PENDING"
    )
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_applications'
        ordering = ['-createdAt']
        indexes = [
            models.Index(fields=['jobID', '-createdAt']),
            models.Index(fields=['workerID', '-createdAt']),
            models.Index(fields=['status', '-createdAt']),
            models.Index(fields=['applied_skill_slot', 'status']),  # Team job applications
        ]
        # Prevent duplicate applications
        # For team jobs: worker can apply to different skill slots of same job
        # For non-team jobs: applied_skill_slot is NULL, so traditional constraint applies
        constraints = [
            models.UniqueConstraint(
                fields=['jobID', 'workerID', 'applied_skill_slot'],
                name='unique_job_skill_slot_application'
            ),
            # Also prevent duplicate NULL skill slot applications (non-team jobs)
            models.UniqueConstraint(
                fields=['jobID', 'workerID'],
                condition=models.Q(applied_skill_slot__isnull=True),
                name='unique_non_team_job_application'
            )
        ]
    
    def __str__(self):
        return f"Application by {self.workerID.profileID.firstName} for {self.jobID.title}"


class JobDispute(models.Model):
    """
    Disputes related to jobs between clients and workers
    """
    disputeID = models.BigAutoField(primary_key=True)
    jobID = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='disputes'
    )
    
    # Disputing Parties
    class DisputedBy(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        WORKER = "WORKER", "Worker"
    
    disputedBy = models.CharField(
        max_length=20,
        choices=DisputedBy.choices
    )
    
    # Dispute Details
    reason = models.CharField(max_length=200)
    description = models.TextField()
    
    # Status
    class DisputeStatus(models.TextChoices):
        OPEN = "OPEN", "Open"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"
    
    status = models.CharField(
        max_length=20,
        choices=DisputeStatus.choices,
        default="OPEN"
    )
    
    # Priority
    class DisputePriority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"
    
    priority = models.CharField(
        max_length=20,
        choices=DisputePriority.choices,
        default="MEDIUM"
    )
    
    # Amounts
    jobAmount = models.DecimalField(max_digits=10, decimal_places=2)
    disputedAmount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Resolution
    resolution = models.TextField(blank=True, null=True)
    resolvedDate = models.DateTimeField(blank=True, null=True)
    assignedTo = models.CharField(max_length=200, blank=True, null=True)
    
    # Backjob Workflow Tracking (similar to Job workflow)
    # Phase 1: Client confirms worker has started the backjob work
    backjobStarted = models.BooleanField(default=False)
    backjobStartedAt = models.DateTimeField(blank=True, null=True)
    # Phase 2: Worker marks backjob as done
    workerMarkedBackjobComplete = models.BooleanField(default=False)
    workerMarkedBackjobCompleteAt = models.DateTimeField(blank=True, null=True)
    # Phase 3: Client confirms backjob is complete
    clientConfirmedBackjob = models.BooleanField(default=False)
    clientConfirmedBackjobAt = models.DateTimeField(blank=True, null=True)
    
    # Terms Acceptance Tracking (for legal compliance)
    termsAccepted = models.BooleanField(default=False)
    termsVersion = models.CharField(max_length=20, blank=True, null=True)
    termsAcceptedAt = models.DateTimeField(blank=True, null=True)
    
    # Admin rejection tracking (for backjob cooldown)
    adminRejectedAt = models.DateTimeField(
        blank=True, 
        null=True,
        help_text="When admin rejected this backjob request (used for cooldown)"
    )
    adminRejectionReason = models.TextField(
        blank=True, 
        null=True,
        help_text="Reason for admin rejection"
    )
    
    # Timestamps
    openedDate = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_disputes'
        ordering = ['-openedDate']
        indexes = [
            models.Index(fields=['jobID', '-openedDate']),
            models.Index(fields=['status', '-openedDate']),
            models.Index(fields=['priority', '-openedDate']),
        ]
    
    def __str__(self):
        return f"Dispute #{self.disputeID} - {self.jobID.title}"


class DisputeEvidence(models.Model):
    """
    Evidence images attached to job disputes/backjob requests
    """
    evidenceID = models.BigAutoField(primary_key=True)
    disputeID = models.ForeignKey(
        JobDispute,
        on_delete=models.CASCADE,
        related_name='evidence'
    )
    imageURL = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    uploadedBy = models.ForeignKey(
        'Accounts',
        on_delete=models.SET_NULL,
        null=True,
        related_name='dispute_evidence'
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'dispute_evidence'
        ordering = ['-createdAt']
    
    def __str__(self):
        return f"Evidence #{self.evidenceID} for Dispute #{self.disputeID_id}"


class JobReview(models.Model):
    """
    Reviews and ratings for completed jobs
    Both clients and workers can review each other after job completion
    For agency jobs, clients can review both the employee AND the agency
    """
    reviewID = models.BigAutoField(primary_key=True)
    jobID = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    
    # Who gave the review
    reviewerID = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )
    
    # Who received the review (for regular worker/client reviews)
    revieweeID = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        null=True,
        blank=True
    )
    
    # Profile-specific reviewee (to separate WORKER vs CLIENT reviews for same account)
    revieweeProfileID = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        null=True,
        blank=True,
        help_text="The specific profile (WORKER or CLIENT) that received this review"
    )
    
    # For agency employee reviews
    revieweeEmployeeID = models.ForeignKey(
        'agency.AgencyEmployee',
        on_delete=models.CASCADE,
        related_name='reviews_received',
        null=True,
        blank=True
    )
    
    # For agency reviews
    revieweeAgencyID = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        null=True,
        blank=True
    )
    
    # Review Type (to identify if it's from client, worker, or agency)
    class ReviewerType(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        WORKER = "WORKER", "Worker"
        AGENCY = "AGENCY", "Agency"
    
    reviewerType = models.CharField(
        max_length=10,
        choices=ReviewerType.choices
    )
    
    # Rating (1-5 stars, decimal for precision)
    from django.core.validators import MinValueValidator, MaxValueValidator
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        help_text="Overall rating (auto-calculated as average of criteria)"
    )
    # Multi-criteria rating fields (1-5 stars each)
    rating_quality = models.DecimalField(
        max_digits=3, decimal_places=2, 
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True, blank=True, help_text="Quality of work rating"
    )
    rating_communication = models.DecimalField(
        max_digits=3, decimal_places=2, 
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True, blank=True, help_text="Communication rating"
    )
    rating_punctuality = models.DecimalField(
        max_digits=3, decimal_places=2, 
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True, blank=True, help_text="Punctuality rating"
    )
    rating_professionalism = models.DecimalField(
        max_digits=3, decimal_places=2, 
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True, blank=True, help_text="Professionalism rating"
    )
    
    # Review Content
    comment = models.TextField()
    
    # Review Status
    class ReviewStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        FLAGGED = "FLAGGED", "Flagged"
        HIDDEN = "HIDDEN", "Hidden"
        DELETED = "DELETED", "Deleted"
    
    status = models.CharField(
        max_length=10,
        choices=ReviewStatus.choices,
        default="ACTIVE"
    )
    
    # Moderation
    isFlagged = models.BooleanField(default=False)
    flagReason = models.TextField(blank=True, null=True)
    flaggedBy = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='flagged_reviews'
    )
    flaggedAt = models.DateTimeField(blank=True, null=True)
    
    # Helpful votes (optional feature)
    helpfulCount = models.IntegerField(default=0)
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_reviews'
        ordering = ['-createdAt']
        indexes = [
            models.Index(fields=['jobID', '-createdAt']),
            models.Index(fields=['reviewerID', '-createdAt']),
            models.Index(fields=['revieweeID', '-createdAt']),
            models.Index(fields=['revieweeProfileID', '-createdAt']),
            models.Index(fields=['revieweeEmployeeID', '-createdAt']),
            models.Index(fields=['revieweeAgencyID', '-createdAt']),
            models.Index(fields=['status', '-createdAt']),
            models.Index(fields=['isFlagged', '-createdAt']),
        ]
        # Note: Unique constraint removed to allow multiple reviews for agency jobs
        # (client reviews employee + agency separately)
        # Uniqueness is now enforced in the API layer
    
    def __str__(self):
        return f"Review by {self.reviewerID.email} for job #{self.jobID.jobID} - {self.rating}★"


class ReviewSkillTag(models.Model):
    """
    Junction table linking reviews to specific skills demonstrated in the job.
    Allows clients to rate workers on specific skills (e.g., 5★ for Plumbing, 4★ for Punctuality)
    """
    tagID = models.BigAutoField(primary_key=True)
    reviewID = models.ForeignKey(
        JobReview,
        on_delete=models.CASCADE,
        related_name='skill_tags'
    )
    workerSpecializationID = models.ForeignKey(
        'workerSpecialization',
        on_delete=models.CASCADE,
        related_name='review_tags',
        help_text="The specific skill being tagged (from worker's skill list)"
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_skill_tags'
        unique_together = [['reviewID', 'workerSpecializationID']]  # One tag per skill per review
        indexes = [
            models.Index(fields=['reviewID']),
            models.Index(fields=['workerSpecializationID']),
        ]
    
    def __str__(self):
        return f"Review #{self.reviewID.reviewID} tagged with skill #{self.workerSpecializationID.id}"


# Backward compatibility - keep old names as aliases
JobPosting = Job
JobPostingPhoto = JobPhoto


class Wallet(models.Model):
    """
    User wallet for managing funds
    """
    walletID = models.BigAutoField(primary_key=True)
    accountFK = models.OneToOneField(
        Accounts,
        on_delete=models.CASCADE,
        related_name='wallet'
    )
    
    # Balance
    balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Reserved balance (funds reserved for pending jobs, not yet deducted)
    reservedBalance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Pending Earnings (Due Balance) - funds from completed jobs awaiting release
    # This is the "7-day buffer" where payment is held before transferring to balance
    pendingEarnings = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Earnings from completed jobs pending release (7-day buffer)"
    )
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['accountFK']),
        ]
    
    @property
    def availableBalance(self):
        """Returns the balance available for new reservations (balance - reserved)"""
        return self.balance - self.reservedBalance
    
    @property
    def totalBalance(self):
        """Returns total balance including pending earnings (balance + pendingEarnings)"""
        return self.balance + self.pendingEarnings
    
    def __str__(self):
        pending_str = f" + ₱{self.pendingEarnings} pending" if self.pendingEarnings > 0 else ""
        return f"Wallet for {self.accountFK.email} - ₱{self.balance}{pending_str} (₱{self.reservedBalance} reserved)"


class Transaction(models.Model):
    """
    Transaction history for wallet operations
    """
    transactionID = models.BigAutoField(primary_key=True)
    walletID = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    
    # Transaction Type
    class TransactionType(models.TextChoices):
        DEPOSIT = "DEPOSIT", "Deposit"
        WITHDRAWAL = "WITHDRAWAL", "Withdrawal"
        PAYMENT = "PAYMENT", "Payment"
        REFUND = "REFUND", "Refund"
        EARNING = "EARNING", "Earning"
        PENDING_EARNING = "PENDING_EARNING", "Pending Earning (7-day buffer)"
        FEE = "FEE", "Platform Fee"
    
    transactionType = models.CharField(
        max_length=20,
        choices=TransactionType.choices
    )
    
    # Amount
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Balance after transaction
    balanceAfter = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Transaction Status
    class TransactionStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"
    
    status = models.CharField(
        max_length=15,
        choices=TransactionStatus.choices,
        default="COMPLETED"
    )
    
    # Description/Reference
    description = models.CharField(max_length=255, blank=True, null=True)
    referenceNumber = models.CharField(max_length=100, blank=True, null=True)
    
    # Optional: Link to job posting if transaction is job-related
    relatedJobPosting = models.ForeignKey(
        JobPosting,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    
    # Payment Method (for deposits/withdrawals)
    class PaymentMethod(models.TextChoices):
        WALLET = "WALLET", "Wallet"
        GCASH = "GCASH", "GCash"
        MAYA = "MAYA", "Maya"
        CARD = "CARD", "Credit/Debit Card"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
        CASH = "CASH", "Cash"
    
    paymentMethod = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default="WALLET",
        blank=True,
        null=True
    )
    
    # Xendit Integration Fields
    xenditInvoiceID = models.CharField(max_length=255, blank=True, null=True, unique=True)
    xenditPaymentID = models.CharField(max_length=255, blank=True, null=True)
    xenditPaymentChannel = models.CharField(max_length=50, blank=True, null=True)  # e.g., "GCASH"
    xenditPaymentMethod = models.CharField(max_length=50, blank=True, null=True)   # e.g., "EWALLET"
    invoiceURL = models.URLField(max_length=500, blank=True, null=True)  # Payment redirect URL
    xenditExternalID = models.CharField(max_length=255, blank=True, null=True)  # Our internal reference
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    completedAt = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-createdAt']
        indexes = [
            models.Index(fields=['walletID', '-createdAt']),
            models.Index(fields=['transactionType', '-createdAt']),
            models.Index(fields=['status', '-createdAt']),
            models.Index(fields=['referenceNumber']),
            models.Index(fields=['xenditInvoiceID']),
            models.Index(fields=['xenditExternalID']),
        ]
    
    def __str__(self):
        return f"{self.transactionType} - ₱{self.amount} - {self.status}"


class City(models.Model):
    """
    City model for location data
    Stores cities/municipalities in the Philippines
    """
    cityID = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    province = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    zipCode = models.CharField(max_length=10, null=True, blank=True)
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Cities'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['province']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.province}"


class Barangay(models.Model):
    """
    Barangay model for location data
    Stores barangays within cities/municipalities
    """
    barangayID = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='barangays')
    zipCode = models.CharField(max_length=10, null=True, blank=True)
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Barangays'
        unique_together = [['name', 'city']]
        indexes = [
            models.Index(fields=['city', 'name']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.city.name}"


class UserPaymentMethod(models.Model):
    """User's payment methods for withdrawals (GCash, Bank)"""
    
    class MethodType(models.TextChoices):
        GCASH = "GCASH", "GCash"
        BANK = "BANK", "Bank Account"
    
    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE, related_name='payment_methods')
    methodType = models.CharField(max_length=10, choices=MethodType.choices)
    accountName = models.CharField(max_length=255)  # Name on account
    accountNumber = models.CharField(max_length=50)  # GCash number or bank account number
    bankName = models.CharField(max_length=100, null=True, blank=True)  # Only for bank accounts
    isPrimary = models.BooleanField(default=False)
    isVerified = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-isPrimary', '-createdAt']
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'
    
    def __str__(self):
        return f"{self.methodType} - {self.accountName} ({self.accountNumber[-4:]})"


# ===========================================================================
# TEAM MODE MULTI-SKILL MULTI-WORKER MODELS
# ===========================================================================

class JobSkillSlot(models.Model):
    """
    Represents a skill requirement slot for a team job.
    Each slot specifies a specialization needed, number of workers, and budget allocation.
    Example: Job needs 2 Plumbers (₱3000) + 3 Electricians (₱4500)
    """
    skillSlotID = models.BigAutoField(primary_key=True)
    
    jobID = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='skill_slots'
    )
    
    specializationID = models.ForeignKey(
        Specializations,
        on_delete=models.CASCADE,
        related_name='job_skill_slots',
        help_text="The specialization/skill required"
    )
    
    # Number of workers needed for this skill
    workers_needed = models.PositiveIntegerField(
        default=1,
        help_text="Number of workers needed for this skill (1-10)"
    )
    
    # Budget allocated to this skill slot
    budget_allocated = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Budget allocated to this skill slot"
    )
    
    # Skill level requirement
    class SkillLevel(models.TextChoices):
        ENTRY = "ENTRY", "Entry Level"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate"
        EXPERT = "EXPERT", "Expert"
    
    skill_level_required = models.CharField(
        max_length=15,
        choices=SkillLevel.choices,
        default="ENTRY",
        help_text="Minimum skill level required"
    )
    
    # Slot fill status
    class SlotStatus(models.TextChoices):
        OPEN = "OPEN", "Open - Accepting Applications"
        PARTIALLY_FILLED = "PARTIALLY_FILLED", "Partially Filled"
        FILLED = "FILLED", "Fully Filled"
        CLOSED = "CLOSED", "Closed"
    
    status = models.CharField(
        max_length=20,
        choices=SlotStatus.choices,
        default="OPEN"
    )
    
    # Optional notes for this skill slot
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Additional requirements or notes for this skill slot"
    )
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_skill_slots'
        ordering = ['jobID', 'specializationID']
        indexes = [
            models.Index(fields=['jobID', 'status']),
            models.Index(fields=['specializationID', 'status']),
        ]
    
    @property
    def budget_per_worker(self):
        """Calculate budget per worker for this slot"""
        if self.workers_needed > 0:
            return self.budget_allocated / self.workers_needed
        return Decimal('0.00')
    
    @property
    def assigned_count(self):
        """Count of currently assigned workers in this slot"""
        return self.worker_assignments.filter(
            assignment_status__in=['ACTIVE', 'COMPLETED']
        ).count()
    
    @property
    def openings_remaining(self):
        """Number of openings still available"""
        return max(0, self.workers_needed - self.assigned_count)
    
    def update_status(self):
        """Update slot status based on assignments"""
        assigned = self.assigned_count
        if assigned == 0:
            self.status = self.SlotStatus.OPEN
        elif assigned < self.workers_needed:
            self.status = self.SlotStatus.PARTIALLY_FILLED
        else:
            self.status = self.SlotStatus.FILLED
        self.save(update_fields=['status', 'updatedAt'])
    
    def __str__(self):
        return f"{self.specializationID.specializationName} x{self.workers_needed} for Job #{self.jobID_id}"


class JobWorkerAssignment(models.Model):
    """
    Tracks individual worker assignments to skill slots in team jobs.
    Each worker occupies one position in a skill slot.
    """
    assignmentID = models.BigAutoField(primary_key=True)
    
    jobID = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='worker_assignments'
    )
    
    skillSlotID = models.ForeignKey(
        JobSkillSlot,
        on_delete=models.CASCADE,
        related_name='worker_assignments'
    )
    
    workerID = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name='team_job_assignments'
    )
    
    # Position within the slot (1st plumber, 2nd plumber, etc.)
    slot_position = models.PositiveIntegerField(
        default=1,
        help_text="Position number within this skill slot"
    )
    
    # Assignment status
    class AssignmentStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Actively Assigned"
        COMPLETED = "COMPLETED", "Work Completed"
        REMOVED = "REMOVED", "Removed from Job"
        WITHDRAWN = "WITHDRAWN", "Worker Withdrew"
    
    assignment_status = models.CharField(
        max_length=15,
        choices=AssignmentStatus.choices,
        default="ACTIVE"
    )
    
    # Worker completion tracking (for individual worker completion in team jobs)
    worker_marked_complete = models.BooleanField(default=False)
    worker_marked_complete_at = models.DateTimeField(null=True, blank=True)
    completion_notes = models.TextField(null=True, blank=True)
    
    # Individual worker rating (after job completion)
    individual_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Client's rating for this specific worker's contribution"
    )
    
    # Timestamps
    assignedAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_worker_assignments'
        ordering = ['jobID', 'skillSlotID', 'slot_position']
        indexes = [
            models.Index(fields=['jobID', 'assignment_status']),
            models.Index(fields=['workerID', 'assignment_status']),
            models.Index(fields=['skillSlotID', 'slot_position']),
        ]
        constraints = [
            # Prevent same worker assigned twice to same job
            models.UniqueConstraint(
                fields=['jobID', 'workerID'],
                name='unique_worker_per_job'
            ),
            # Prevent duplicate positions in same slot
            models.UniqueConstraint(
                fields=['skillSlotID', 'slot_position'],
                name='unique_slot_position'
            ),
        ]
    
    def save(self, *args, **kwargs):
        """Auto-assign slot position if not set"""
        if not self.slot_position:
            max_position = JobWorkerAssignment.objects.filter(
                skillSlotID=self.skillSlotID
            ).aggregate(models.Max('slot_position'))['slot_position__max'] or 0
            self.slot_position = max_position + 1
        super().save(*args, **kwargs)
        # Update slot status after saving
        self.skillSlotID.update_status()
    
    def __str__(self):
        return f"{self.workerID.profileID.firstName} - Position {self.slot_position} in {self.skillSlotID}"

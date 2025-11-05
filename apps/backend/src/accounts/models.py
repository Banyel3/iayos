from django.db import models
from datetime import datetime
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
    profileImg = models.CharField(max_length=500)  # Increased for Supabase storage URLs
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
    description = models.CharField(max_length=350)
    workerRating = models.IntegerField(default=0)
    totalEarningGross = models.DecimalField(max_digits=10, decimal_places=2)
    class availabilityStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", 'available'
        BUSY = "BUSY", 'busy'
        OFFLINE = "OFFLINE", "offline"

    availabilityStatus = models.CharField(
        max_length=10, choices=availabilityStatus.choices, default="OFFLINE", blank=True
    )

class ClientProfile(models.Model):
    profileID = models.OneToOneField(Profile, on_delete=models.CASCADE)
    description = models.CharField(max_length=350)
    totalJobsPosted = models.IntegerField()
    clientRating = models.IntegerField(default=0)
    activeJobsCount = models.IntegerField

class Specializations(models.Model):
    specializationID = models.BigAutoField(primary_key=True)
    specializationName = models.CharField(max_length=250)
    description = models.TextField(blank=True, null=True)
    minimumRate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rateType = models.CharField(max_length=20, default='hourly')  # hourly, daily, fixed
    skillLevel = models.CharField(max_length=20, default='intermediate')  # entry, intermediate, expert
    averageProjectCostMin = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    averageProjectCostMax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
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

class kyc(models.Model):
    kycID = models.BigAutoField(primary_key=True)
    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE)
    class kycStatus(models.TextChoices):
        PENDING = "PENDING", 'pending'
        APPROVED = "APPROVED", 'approved'
        REJECTED = "Rejected", "rejected"
    kycStatus = models.CharField(
        max_length=10, choices=kycStatus.choices, default="PENDING", blank=True
    )
    reviewedAt = models.DateTimeField(auto_now=True)
    reviewedBy = models.ForeignKey(
        Accounts, 
        on_delete=models.CASCADE, 
        null=True,
        blank=True,
        related_name="reviewed_kyc"
    )
    notes = models.CharField(max_length=211)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

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
        KYC_APPROVED = "KYC_APPROVED", "KYC Approved"
        KYC_REJECTED = "KYC_REJECTED", "KYC Rejected"
        MESSAGE = "MESSAGE", "Message"
        SYSTEM = "SYSTEM", "System"
    
    notificationType = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default="SYSTEM"
    )
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    isRead = models.BooleanField(default=False)
    
    # Optional: Link to related KYC log for context
    relatedKYCLogID = models.BigIntegerField(null=True, blank=True)
    
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
        default=0.00,
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
        default=0.00,
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
    
    # Preferred Start Date
    preferredStartDate = models.DateField(null=True, blank=True)
    
    # Materials Needed (stored as JSON array)
    materialsNeeded = models.JSONField(default=list, blank=True)
    
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
    
    # Assigned Worker (optional - for IN_PROGRESS jobs)
    assignedWorkerID = models.ForeignKey(
        'WorkerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_jobs'
    )
    
    # Completion Details
    completedAt = models.DateTimeField(null=True, blank=True)
    cancellationReason = models.TextField(null=True, blank=True)
    
    # Two-phase completion tracking
    workerMarkedComplete = models.BooleanField(default=False)
    clientMarkedComplete = models.BooleanField(default=False)
    workerMarkedCompleteAt = models.DateTimeField(null=True, blank=True)
    clientMarkedCompleteAt = models.DateTimeField(null=True, blank=True)
    
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
        ]
    
    def __str__(self):
        return f"{self.title} - {self.clientID.accountFK.email}"
    
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
    oldStatus = models.CharField(max_length=15, null=True, blank=True)
    newStatus = models.CharField(max_length=15)
    
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
        ]
        # Prevent duplicate applications
        constraints = [
            models.UniqueConstraint(
                fields=['jobID', 'workerID'],
                name='unique_job_application'
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
    disputedAmount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Resolution
    resolution = models.TextField(blank=True, null=True)
    resolvedDate = models.DateTimeField(blank=True, null=True)
    assignedTo = models.CharField(max_length=200, blank=True, null=True)
    
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


class JobReview(models.Model):
    """
    Reviews and ratings for completed jobs
    Both clients and workers can review each other after job completion
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
    
    # Who received the review
    revieweeID = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='reviews_received'
    )
    
    # Review Type (to identify if it's from client or worker)
    class ReviewerType(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        WORKER = "WORKER", "Worker"
    
    reviewerType = models.CharField(
        max_length=10,
        choices=ReviewerType.choices
    )
    
    # Rating (1-5 stars, decimal for precision)
    from django.core.validators import MinValueValidator, MaxValueValidator
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)]
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
            models.Index(fields=['status', '-createdAt']),
            models.Index(fields=['isFlagged', '-createdAt']),
        ]
        # Prevent duplicate reviews from same reviewer for same job
        constraints = [
            models.UniqueConstraint(
                fields=['jobID', 'reviewerID'],
                name='unique_job_reviewer'
            )
        ]
    
    def __str__(self):
        return f"Review by {self.reviewerID.firstName} for job #{self.jobID.jobID} - {self.rating}★"


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
        default=0.00
    )
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['accountFK']),
        ]
    
    def __str__(self):
        return f"Wallet for {self.accountFK.email} - ₱{self.balance}"


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
        FEE = "FEE", "Platform Fee"
    
    transactionType = models.CharField(
        max_length=15,
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

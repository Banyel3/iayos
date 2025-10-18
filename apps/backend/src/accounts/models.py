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


class JobPosting(models.Model):
    """
    Job postings created by clients to hire workers
    """
    jobPostingID = models.BigAutoField(primary_key=True)
    clientID = models.ForeignKey(
        ClientProfile,
        on_delete=models.CASCADE,
        related_name='job_postings'
    )
    
    # Job Details
    title = models.CharField(max_length=200)
    description = models.TextField()
    categoryID = models.ForeignKey(
        Specializations,
        on_delete=models.SET_NULL,
        null=True,
        related_name='job_postings'
    )
    
    # Budget (always project-based)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    
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
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-createdAt']
        indexes = [
            models.Index(fields=['clientID', '-createdAt']),
            models.Index(fields=['status', '-createdAt']),
            models.Index(fields=['categoryID', 'status']),
            models.Index(fields=['urgency', '-createdAt']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.clientID.accountFK.email}"


class JobPostingPhoto(models.Model):
    """
    Photos attached to job postings
    """
    photoID = models.BigAutoField(primary_key=True)
    jobPostingID = models.ForeignKey(
        JobPosting,
        on_delete=models.CASCADE,
        related_name='photos'
    )
    
    photoURL = models.CharField(max_length=255)
    fileName = models.CharField(max_length=255, null=True, blank=True)
    fileSize = models.IntegerField(null=True, blank=True)  # Size in bytes
    uploadedAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploadedAt']
    
    def __str__(self):
        return f"Photo for {self.jobPostingID.title}"


class Conversation(models.Model):
    """
    Represents a chat conversation between two users
    """
    conversationID = models.BigAutoField(primary_key=True)
    
    # Participants
    participant1 = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='conversations_as_participant1'
    )
    participant2 = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='conversations_as_participant2'
    )
    
    # Optional: Link to job posting if chat is about a specific job
    relatedJobPosting = models.ForeignKey(
        JobPosting,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    
    # Conversation Type
    class ConversationType(models.TextChoices):
        GENERAL = "GENERAL", "General"
        INVITE = "INVITE", "Invite"
        APPLICATION = "APPLICATION", "Application"
    
    conversationType = models.CharField(
        max_length=15,
        choices=ConversationType.choices,
        default="GENERAL"
    )
    
    # Last message info (for preview)
    lastMessageText = models.TextField(blank=True, null=True)
    lastMessageTime = models.DateTimeField(null=True, blank=True)
    lastMessageSender = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='last_messages_sent'
    )
    
    # Unread counts for each participant
    unreadCountParticipant1 = models.IntegerField(default=0)
    unreadCountParticipant2 = models.IntegerField(default=0)
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updatedAt']
        indexes = [
            models.Index(fields=['participant1', '-updatedAt']),
            models.Index(fields=['participant2', '-updatedAt']),
            models.Index(fields=['relatedJobPosting']),
        ]
        # Ensure unique conversation between two users
        constraints = [
            models.UniqueConstraint(
                fields=['participant1', 'participant2'],
                name='unique_conversation'
            )
        ]
    
    def __str__(self):
        return f"Conversation between {self.participant1.email} and {self.participant2.email}"
    
    def get_unread_count_for_user(self, user_id):
        """Get unread count for a specific user"""
        if self.participant1_id == user_id:
            return self.unreadCountParticipant1
        elif self.participant2_id == user_id:
            return self.unreadCountParticipant2
        return 0


class Message(models.Model):
    """
    Individual messages within a conversation
    """
    messageID = models.BigAutoField(primary_key=True)
    conversationID = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    # Message sender
    sender = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    
    # Message content
    messageText = models.TextField()
    
    # Message Type
    class MessageType(models.TextChoices):
        TEXT = "TEXT", "Text"
        SYSTEM = "SYSTEM", "System"  # For system messages like "Jane accepted your application"
        LOCATION = "LOCATION", "Location"  # For address sharing
        IMAGE = "IMAGE", "Image"
        FILE = "FILE", "File"
    
    messageType = models.CharField(
        max_length=10,
        choices=MessageType.choices,
        default="TEXT"
    )
    
    # Optional: For location/address messages
    locationAddress = models.CharField(max_length=500, null=True, blank=True)
    locationLandmark = models.CharField(max_length=255, null=True, blank=True)
    locationLatitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7, 
        null=True, 
        blank=True
    )
    locationLongitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7, 
        null=True, 
        blank=True
    )
    
    # Read status
    isRead = models.BooleanField(default=False)
    readAt = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['createdAt']
        indexes = [
            models.Index(fields=['conversationID', 'createdAt']),
            models.Index(fields=['sender', '-createdAt']),
            models.Index(fields=['isRead']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.email} at {self.createdAt}"


class MessageAttachment(models.Model):
    """
    File/image attachments for messages
    """
    attachmentID = models.BigAutoField(primary_key=True)
    messageID = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    
    fileURL = models.CharField(max_length=255)
    fileName = models.CharField(max_length=255, null=True, blank=True)
    fileSize = models.IntegerField(null=True, blank=True)  # Size in bytes
    fileType = models.CharField(max_length=50, null=True, blank=True)  # MIME type
    uploadedAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploadedAt']
    
    def __str__(self):
        return f"Attachment for message {self.messageID_id}"


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

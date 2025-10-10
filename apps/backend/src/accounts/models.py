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
    profileImg = models.CharField(max_length=50)
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

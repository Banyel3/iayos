from django.db import models
from accounts.models import Accounts, kyc

# Create your models here.


class KYCLogs(models.Model):
    """
    Audit log for all KYC reviews (approved or rejected).
    Records are tied to user Accounts (not KYC records) since accounts persist
    while KYC records are deleted after review for privacy.
    
    Each log entry captures the review decision, reviewer, timestamp, and
    a snapshot of the user's information at the time of review.
    """
    kycLogID = models.BigAutoField(primary_key=True)
    
    # Reference to the user whose KYC was reviewed (persists after KYC deletion)
    accountFK = models.ForeignKey(
        Accounts, 
        on_delete=models.CASCADE, 
        related_name='kyc_logs',
        help_text="The user account whose KYC was reviewed"
    )
    
    # Store KYC ID as integer since the original kyc record will be deleted
    kycID = models.BigIntegerField(
        help_text="Original KYC record ID (record deleted after review for privacy)"
    )
    
    class ReviewAction(models.TextChoices):
        APPROVED = "APPROVED", "Approved"
        REJECTED = "Rejected", "Rejected"
    
    action = models.CharField(
        max_length=10,
        choices=ReviewAction.choices,
        help_text="Whether the KYC was approved or rejected"
    )
    
    reviewedBy = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kyc_reviews_performed'
    )
    
    reviewedAt = models.DateTimeField(help_text="When the review decision was made")
    reason = models.TextField(
        blank=True,
        default="",
        help_text="Reason for rejection or additional notes"
    )
    
    # Snapshot of user info at time of review
    userEmail = models.EmailField(max_length=64)
    userAccountID = models.BigIntegerField()
    # Indicate whether the KYC was for a regular user or an agency
    class KYCSubject(models.TextChoices):
        USER = "USER", "User"
        AGENCY = "AGENCY", "Agency"

    kycType = models.CharField(
        max_length=10,
        choices=KYCSubject.choices,
        default=KYCSubject.USER,
        help_text="Indicates whether the KYC was for a user account or an agency"
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-reviewedAt']
        verbose_name = "KYC Log"
        verbose_name_plural = "KYC Logs"
        indexes = [
            models.Index(fields=['-reviewedAt']),
            models.Index(fields=['action']),
            models.Index(fields=['accountFK']),
        ]
    
    def __str__(self):
        return f"KYC {self.action} - {self.userEmail} (Log #{self.kycLogID})"


class SystemRoles(models.Model):
    systemRoleID = models.BigAutoField(primary_key=True)
    accountID = models.ForeignKey(Accounts, on_delete=models.CASCADE)
    class systemRole(models.TextChoices):
        ADMIN = "ADMIN", "admin"
        STAFF = "CLIENT", "client"

    systemRole = models.CharField(
        max_length=10, choices=systemRole.choices, null=False, blank=True
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

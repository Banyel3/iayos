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


class CertificationLog(models.Model):
    """
    Audit trail for certification verification actions.
    Tracks all approve/reject actions by admins on worker certifications.
    """
    class ReviewAction(models.TextChoices):
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    certLogID = models.BigAutoField(primary_key=True)
    
    # The certification that was reviewed
    certificationID = models.BigIntegerField(
        help_text="ID of the WorkerCertification that was reviewed"
    )
    
    # The worker who owns this certification
    workerID = models.ForeignKey(
        'accounts.WorkerProfile',
        on_delete=models.CASCADE,
        related_name='certification_logs',
        help_text="Worker profile this certification belongs to"
    )
    
    # Review details
    action = models.CharField(
        max_length=20,
        choices=ReviewAction.choices,
        help_text="APPROVED or REJECTED"
    )
    reviewedBy = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certification_reviews_performed',
        help_text="Admin who performed the verification"
    )
    reviewedAt = models.DateTimeField(
        help_text="Timestamp of verification action"
    )
    reason = models.TextField(
        blank=True,
        default="",
        help_text="Notes for approval or reason for rejection"
    )
    
    # Worker info (for easier querying without joins)
    workerEmail = models.EmailField(
        help_text="Email of the worker at time of verification"
    )
    workerAccountID = models.BigIntegerField(
        help_text="Account ID of the worker"
    )
    
    # Certification snapshot (for historical reference)
    certificationName = models.CharField(
        max_length=255,
        help_text="Name of the certification at time of verification"
    )

    class Meta:
        db_table = 'certification_logs'
        ordering = ['-reviewedAt']
        indexes = [
            models.Index(fields=['certificationID', 'reviewedAt']),
            models.Index(fields=['workerID', 'reviewedAt']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        admin_email = self.reviewedBy.email if self.reviewedBy else 'System'
        return f"Cert Log {self.certLogID} - {self.certificationName} {self.action} by {admin_email}"


# =============================================================================
# SUPPORT TICKET SYSTEM
# =============================================================================

class SupportTicket(models.Model):
    """
    Support tickets submitted by users for platform issues.
    """
    ticketID = models.BigAutoField(primary_key=True)
    
    # User who created the ticket
    userFK = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='support_tickets',
        help_text="User who submitted the ticket"
    )
    
    subject = models.CharField(max_length=200, help_text="Brief description of the issue")
    
    class Category(models.TextChoices):
        ACCOUNT = "account", "Account Issues"
        PAYMENT = "payment", "Payment Issues"
        TECHNICAL = "technical", "Technical Problems"
        FEATURE_REQUEST = "feature_request", "Feature Request"
        BUG_REPORT = "bug_report", "Bug Report"
        GENERAL = "general", "General Inquiry"
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL
    )
    
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"
    
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In Progress"
        WAITING_USER = "waiting_user", "Waiting for User"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"
    
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.OPEN
    )
    
    # Admin assigned to handle the ticket
    assignedTo = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        help_text="Admin handling this ticket"
    )
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    lastReplyAt = models.DateTimeField(null=True, blank=True)
    resolvedAt = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-createdAt']
        verbose_name = "Support Ticket"
        verbose_name_plural = "Support Tickets"
        indexes = [
            models.Index(fields=['-createdAt']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['category']),
            models.Index(fields=['assignedTo']),
        ]
    
    def __str__(self):
        return f"Ticket #{self.ticketID}: {self.subject[:50]}"
    
    @property
    def reply_count(self):
        return self.replies.count()


class SupportTicketReply(models.Model):
    """
    Replies/messages within a support ticket thread.
    """
    replyID = models.BigAutoField(primary_key=True)
    
    ticketFK = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    
    # Who sent this reply (user or admin)
    senderFK = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='ticket_replies'
    )
    
    content = models.TextField(help_text="Reply message content")
    
    # Is this a system-generated message?
    isSystemMessage = models.BooleanField(default=False)
    
    # Optional attachment
    attachmentURL = models.URLField(max_length=500, blank=True, null=True)
    
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['createdAt']
        verbose_name = "Ticket Reply"
        verbose_name_plural = "Ticket Replies"
    
    def __str__(self):
        return f"Reply to Ticket #{self.ticketFK_id} by {self.senderFK.email}"


class CannedResponse(models.Model):
    """
    Pre-written responses for common support issues.
    """
    responseID = models.BigAutoField(primary_key=True)
    
    title = models.CharField(max_length=100, help_text="Short title for the response")
    content = models.TextField(help_text="The full response text")
    
    class Category(models.TextChoices):
        ACCOUNT = "account", "Account Issues"
        PAYMENT = "payment", "Payment Issues"
        TECHNICAL = "technical", "Technical Problems"
        GENERAL = "general", "General"
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL
    )
    
    # Keywords/shortcuts to quickly find this response
    shortcuts = models.JSONField(
        default=list,
        blank=True,
        help_text="List of shortcut keywords"
    )
    
    # Usage tracking
    usageCount = models.IntegerField(default=0)
    
    # Who created this response
    createdBy = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_canned_responses'
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-usageCount', 'title']
        verbose_name = "Canned Response"
        verbose_name_plural = "Canned Responses"
    
    def __str__(self):
        return self.title


class FAQ(models.Model):
    """
    Frequently Asked Questions for the platform.
    """
    faqID = models.BigAutoField(primary_key=True)
    
    question = models.CharField(max_length=500)
    answer = models.TextField()
    
    class Category(models.TextChoices):
        GETTING_STARTED = "getting_started", "Getting Started"
        ACCOUNT = "account", "Account & Profile"
        JOBS = "jobs", "Jobs & Hiring"
        PAYMENTS = "payments", "Payments & Billing"
        WORKERS = "workers", "For Workers"
        CLIENTS = "clients", "For Clients"
        AGENCIES = "agencies", "For Agencies"
        SAFETY = "safety", "Safety & Security"
        GENERAL = "general", "General"
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL
    )
    
    # For ordering FAQs within a category
    sortOrder = models.IntegerField(default=0)
    
    # View count for analytics
    viewCount = models.IntegerField(default=0)
    
    # Is this FAQ published/visible?
    isPublished = models.BooleanField(default=True)
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'sortOrder']
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"
    
    def __str__(self):
        return self.question[:80]


class UserReport(models.Model):
    """
    Reports submitted by users about other users or content.
    """
    reportID = models.BigAutoField(primary_key=True)
    
    # Who submitted the report
    reporterFK = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        related_name='submitted_reports'
    )
    
    # Who is being reported (optional - could be content report)
    reportedUserFK = models.ForeignKey(
        Accounts,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reports_received'
    )
    
    class ReportType(models.TextChoices):
        USER = "user", "User Report"
        JOB = "job", "Job Posting"
        REVIEW = "review", "Review"
        MESSAGE = "message", "Message"
        OTHER = "other", "Other"
    
    reportType = models.CharField(
        max_length=10,
        choices=ReportType.choices,
        default=ReportType.USER
    )
    
    class Reason(models.TextChoices):
        SPAM = "spam", "Spam"
        HARASSMENT = "harassment", "Harassment"
        FRAUD = "fraud", "Fraud/Scam"
        INAPPROPRIATE = "inappropriate", "Inappropriate Content"
        FAKE_PROFILE = "fake_profile", "Fake Profile"
        OTHER = "other", "Other"
    
    reason = models.CharField(
        max_length=20,
        choices=Reason.choices
    )
    
    description = models.TextField(help_text="Detailed description of the issue")
    
    # Reference to the reported content (job ID, review ID, etc.)
    relatedContentID = models.BigIntegerField(null=True, blank=True)
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending Review"
        INVESTIGATING = "investigating", "Under Investigation"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"
    
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Admin handling the report
    reviewedBy = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_reports'
    )
    
    adminNotes = models.TextField(blank=True, default="")
    
    # Action taken
    class ActionTaken(models.TextChoices):
        NONE = "none", "No Action"
        WARNING = "warning", "Warning Issued"
        SUSPENDED = "suspended", "Account Suspended"
        BANNED = "banned", "Account Banned"
        CONTENT_REMOVED = "content_removed", "Content Removed"
    
    actionTaken = models.CharField(
        max_length=20,
        choices=ActionTaken.choices,
        default=ActionTaken.NONE
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    resolvedAt = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-createdAt']
        verbose_name = "User Report"
        verbose_name_plural = "User Reports"
        indexes = [
            models.Index(fields=['-createdAt']),
            models.Index(fields=['status']),
            models.Index(fields=['reportType']),
        ]
    
    def __str__(self):
        return f"Report #{self.reportID}: {self.reason}"


# =============================================================================
# AUDIT LOG SYSTEM
# =============================================================================

class AuditLog(models.Model):
    """
    Comprehensive audit log for tracking all admin actions in the platform.
    Records who did what, when, and the before/after states.
    """
    auditLogID = models.BigAutoField(primary_key=True)
    
    # Who performed the action
    adminFK = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        help_text="Admin who performed the action"
    )
    adminEmail = models.EmailField(
        max_length=64,
        help_text="Snapshot of admin email (in case account is deleted)"
    )
    
    # What action was performed
    class ActionType(models.TextChoices):
        # Admin actions
        LOGIN = "login", "Login"
        LOGOUT = "logout", "Logout"
        KYC_APPROVAL = "kyc_approval", "KYC Approval"
        KYC_REJECTION = "kyc_rejection", "KYC Rejection"
        PAYMENT_RELEASE = "payment_release", "Payment Release"
        PAYMENT_REFUND = "payment_refund", "Payment Refund"
        USER_BAN = "user_ban", "User Ban"
        USER_UNBAN = "user_unban", "User Unban"
        USER_SUSPEND = "user_suspend", "User Suspend"
        USER_ACTIVATE = "user_activate", "User Activate"
        USER_DELETE = "user_delete", "User Delete"
        SETTINGS_CHANGE = "settings_change", "Settings Change"
        ADMIN_CREATE = "admin_create", "Admin Create"
        ADMIN_UPDATE = "admin_update", "Admin Update"
        ADMIN_DELETE = "admin_delete", "Admin Delete"
        JOB_UPDATE = "job_update", "Job Update"
        JOB_CANCEL = "job_cancel", "Job Cancel"
        TICKET_REPLY = "ticket_reply", "Ticket Reply"
        TICKET_CLOSE = "ticket_close", "Ticket Close"
        REPORT_REVIEW = "report_review", "Report Review"
        FAQ_CREATE = "faq_create", "FAQ Create"
        FAQ_UPDATE = "faq_update", "FAQ Update"
        FAQ_DELETE = "faq_delete", "FAQ Delete"
        BACKJOB_APPROVE = "backjob_approve", "Backjob Approve"
        BACKJOB_REJECT = "backjob_reject", "Backjob Reject"
        DISPUTE_RESOLVE = "dispute_resolve", "Dispute Resolve"
        # User actions (for tracking login, password, profile changes)
        USER_LOGIN = "user_login", "User Login"
        PASSWORD_RESET = "password_reset", "Password Reset"
        PROFILE_UPDATE = "profile_update", "Profile Update"
    
    action = models.CharField(
        max_length=30,
        choices=ActionType.choices,
        help_text="Type of action performed"
    )
    
    # What entity was affected
    class EntityType(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Admin"
        JOB = "job", "Job"
        KYC = "kyc", "KYC"
        PAYMENT = "payment", "Payment"
        TICKET = "ticket", "Support Ticket"
        REPORT = "report", "Report"
        SETTINGS = "settings", "Settings"
        FAQ = "faq", "FAQ"
        CATEGORY = "category", "Category"
    
    entityType = models.CharField(
        max_length=20,
        choices=EntityType.choices,
        help_text="Type of entity affected"
    )
    entityID = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="ID of the affected entity"
    )
    
    # Details and state changes
    details = models.JSONField(
        default=dict,
        help_text="Additional details about the action"
    )
    beforeValue = models.JSONField(
        null=True,
        blank=True,
        help_text="State before the change"
    )
    afterValue = models.JSONField(
        null=True,
        blank=True,
        help_text="State after the change"
    )
    
    # Request metadata
    ipAddress = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the admin"
    )
    userAgent = models.TextField(
        blank=True,
        default="",
        help_text="Browser/client user agent"
    )
    
    # Timestamp
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-createdAt']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=['-createdAt']),
            models.Index(fields=['action']),
            models.Index(fields=['adminFK']),
            models.Index(fields=['entityType']),
            models.Index(fields=['entityType', 'entityID']),
        ]
    
    def __str__(self):
        return f"[{self.createdAt.strftime('%Y-%m-%d %H:%M')}] {self.adminEmail}: {self.action}"


# =============================================================================
# PLATFORM SETTINGS (Singleton)
# =============================================================================

class PlatformSettings(models.Model):
    """
    Singleton model for storing platform-wide configuration settings.
    Only one instance should exist.
    """
    settingsID = models.BigAutoField(primary_key=True)
    
    # Financial Settings
    platformFeePercentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=5.00,
        help_text="Platform fee percentage (e.g., 5.00 for 5%)"
    )
    escrowHoldingDays = models.IntegerField(
        default=7,
        help_text="Days to hold funds in escrow before release"
    )
    maxJobBudget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=100000.00,
        help_text="Maximum allowed job budget"
    )
    minJobBudget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=100.00,
        help_text="Minimum allowed job budget"
    )
    
    # Verification Settings
    workerVerificationRequired = models.BooleanField(
        default=True,
        help_text="Require KYC verification for workers"
    )
    autoApproveKYC = models.BooleanField(
        default=False,
        help_text="Automatically approve KYC submissions"
    )
    kycDocumentExpiryDays = models.IntegerField(
        default=365,
        help_text="Days until KYC documents expire"
    )
    
    # System Settings
    maintenanceMode = models.BooleanField(
        default=False,
        help_text="Enable maintenance mode (blocks user access)"
    )
    sessionTimeoutMinutes = models.IntegerField(
        default=60,
        help_text="Session timeout in minutes"
    )
    maxUploadSizeMB = models.IntegerField(
        default=10,
        help_text="Maximum file upload size in MB"
    )
    
    # Metadata
    lastUpdated = models.DateTimeField(auto_now=True)
    updatedBy = models.ForeignKey(
        Accounts,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='settings_updates',
        help_text="Admin who last updated settings"
    )
    
    class Meta:
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"
    
    def save(self, *args, **kwargs):
        """Ensure only one instance exists (singleton pattern)."""
        if not self.pk and PlatformSettings.objects.exists():
            raise ValueError("Only one PlatformSettings instance allowed.")
        return super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance."""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
    
    def __str__(self):
        return f"Platform Settings (Updated: {self.lastUpdated.strftime('%Y-%m-%d %H:%M')})"


# =============================================================================
# ADMIN ROLES (Enhanced)
# =============================================================================

class AdminAccount(models.Model):
    """
    Extended admin account with roles and permissions.
    Links to the main Accounts model.
    """
    adminID = models.BigAutoField(primary_key=True)
    
    accountFK = models.OneToOneField(
        Accounts,
        on_delete=models.CASCADE,
        related_name='admin_profile',
        help_text="Linked user account"
    )
    
    class Role(models.TextChoices):
        SUPER_ADMIN = "super_admin", "Super Admin"
        ADMIN = "admin", "Admin"
        MODERATOR = "moderator", "Moderator"
    
    role = models.CharField(
        max_length=15,
        choices=Role.choices,
        default=Role.MODERATOR
    )
    
    # JSON list of permission strings
    permissions = models.JSONField(
        default=list,
        help_text="List of permission strings"
    )
    
    isActive = models.BooleanField(
        default=True,
        help_text="Whether this admin account is active"
    )
    
    lastLogin = models.DateTimeField(
        null=True,
        blank=True
    )
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Admin Account"
        verbose_name_plural = "Admin Accounts"
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['isActive']),
        ]
    
    def has_permission(self, permission: str) -> bool:
        """Check if admin has a specific permission."""
        if self.role == self.Role.SUPER_ADMIN:
            return True
        return permission in self.permissions
    
    def __str__(self):
        return f"{self.accountFK.email} ({self.role})"


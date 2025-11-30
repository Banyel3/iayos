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


from django.db import models
from accounts.models import Wallet, Transaction
from accounts.models import Profile


# Re-export models from accounts for backwards compatibility
# The actual models are defined in accounts.models to avoid migration issues
__all__ = ['Wallet', 'Transaction']


class WorkerProduct(models.Model):
	# Matches the existing migration (0001_initial.py)
	productID = models.BigAutoField(primary_key=True)
	productName = models.CharField(max_length=200)
	description = models.TextField(blank=True, null=True)
	price = models.DecimalField(max_digits=10, decimal_places=2)
	class PriceUnit(models.TextChoices):
		PIECE = ("PIECE", "Per Piece")
		SET = ("SET", "Per Set")
		LITER = ("LITER", "Per Liter")
		GALLON = ("GALLON", "Per Gallon")
		KG = ("KG", "Per Kilogram")
		METER = ("METER", "Per Meter")
		HOUR = ("HOUR", "Per Hour")
		SERVICE = ("SERVICE", "Per Service")

	priceUnit = models.CharField(max_length=20, choices=PriceUnit.choices, default=PriceUnit.PIECE)
	inStock = models.BooleanField(default=True)
	stockQuantity = models.IntegerField(blank=True, null=True)
	productImage = models.CharField(max_length=500, blank=True, null=True)
	isActive = models.BooleanField(default=True)
	createdAt = models.DateTimeField(auto_now_add=True)
	updatedAt = models.DateTimeField(auto_now=True)

	# Optional category relation (matches migration)
	from accounts.models import Specializations
	categoryID = models.ForeignKey(Specializations, blank=True, null=True, on_delete=models.SET_NULL, related_name='worker_products')

	# Worker relation - points to WorkerProfile (migration used 'workerID')
	from accounts.models import WorkerProfile
	workerID = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='products')

	def __str__(self):
		# Provide a friendly string repr; try to include worker name when available
		try:
			profile = self.workerID.profileID
			return f"{self.productName} ({profile.firstName} {profile.lastName})"
		except Exception:
			return self.productName

	# Backwards-compatible properties so existing code that expects `.name` works
	@property
	def name(self):
		return self.productName

	@property
	def profile(self):
		# Return underlying Profile instance similar to the old Product.profile
		return getattr(self.workerID, 'profileID', None)


class Conversation(models.Model):
    """
    Represents a chat conversation between a client and either a worker or agency for a specific job.
    Created automatically when a job application is accepted or agency invite is accepted.
    
    For regular jobs: client + worker (Profile)
    For agency jobs: client + agency (Agency model)
    """
    conversationID = models.BigAutoField(primary_key=True)
    
    # Client participant (always required)
    client = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='conversations_as_client'
    )
    
    # Worker participant (for regular jobs - nullable for agency jobs)
    worker = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='conversations_as_worker',
        null=True,
        blank=True
    )
    
    # Agency participant (for agency jobs - nullable for regular jobs)
    from accounts.models import Agency
    agency = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name='conversations_as_agency',
        null=True,
        blank=True
    )
    
    # Required: Link to job posting - each conversation is tied to a specific job
    from accounts.models import JobPosting
    relatedJobPosting = models.ForeignKey(
        JobPosting,
        on_delete=models.CASCADE,  # Changed to CASCADE - if job is deleted, conversation is deleted
        related_name='job_conversation'
    )
    
    # Last message info (for preview)
    lastMessageText = models.TextField(blank=True, null=True)
    lastMessageTime = models.DateTimeField(null=True, blank=True)
    lastMessageSender = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='last_messages_sent'
    )
    
    # Unread counts for each participant
    unreadCountClient = models.IntegerField(default=0)
    unreadCountWorker = models.IntegerField(default=0)  # Also used for agency
    
    # Archive flags - each participant can archive independently
    archivedByClient = models.BooleanField(default=False)
    archivedByWorker = models.BooleanField(default=False)  # Also used for agency
    
    # Conversation status
    class ConversationStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"  # Job is in progress
        COMPLETED = "COMPLETED", "Completed"  # Job completed
        ARCHIVED = "ARCHIVED", "Archived"  # Manually archived
    
    status = models.CharField(
        max_length=15,
        choices=ConversationStatus.choices,
        default="ACTIVE"
    )
    
    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversation'
        ordering = ['-updatedAt']
        indexes = [
            models.Index(fields=['client', '-updatedAt']),
            models.Index(fields=['worker', '-updatedAt']),
            models.Index(fields=['agency', '-updatedAt']),
            models.Index(fields=['relatedJobPosting']),
            models.Index(fields=['status']),
        ]
        # Ensure one conversation per job (unique job posting)
        constraints = [
            models.UniqueConstraint(
                fields=['relatedJobPosting'],
                name='unique_job_conversation'
            )
        ]
    
    @property
    def is_agency_conversation(self):
        """Check if this is an agency conversation"""
        return self.agency is not None
    
    @property
    def service_provider_name(self):
        """Get the name of the service provider (worker or agency)"""
        if self.agency:
            return self.agency.businessName
        elif self.worker:
            return f"{self.worker.firstName} {self.worker.lastName}"
        return "Unknown"
    
    def __str__(self):
        job_title = self.relatedJobPosting.title if self.relatedJobPosting else "Unknown Job"
        if self.agency:
            return f"Conversation for '{job_title}' between {self.client.firstName} (Client) and {self.agency.businessName} (Agency)"
        return f"Conversation for '{job_title}' between {self.client.firstName} (Client) and {self.worker.firstName} (Worker)"
    
    def get_unread_count_for_profile(self, profile_id):
        """Get unread count for a specific profile"""
        if self.client_id == profile_id:
            return self.unreadCountClient
        elif self.worker_id == profile_id:
            return self.unreadCountWorker
        return 0
    
    @classmethod
    def create_for_job(cls, job_posting, client_profile, worker_profile):
        """
        Create a conversation for an accepted job.
        Called when a job application is accepted.
        """
        conversation, created = cls.objects.get_or_create(
            relatedJobPosting=job_posting,
            defaults={
                'client': client_profile,
                'worker': worker_profile,
                'status': cls.ConversationStatus.ACTIVE
            }
        )
        return conversation, created


class Message(models.Model):
    """
    Individual messages within a job conversation.
    Supports both Profile senders (clients/workers) and Agency senders.
    """
    messageID = models.BigAutoField(primary_key=True)
    conversationID = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    # Message sender - Profile (for clients/workers)
    sender = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        null=True,
        blank=True
    )
    
    # Message sender - Agency (for agency users without profile)
    senderAgency = models.ForeignKey(
        'accounts.Agency',
        on_delete=models.CASCADE,
        related_name='sent_messages',
        null=True,
        blank=True
    )
    
    # Message content
    messageText = models.TextField()
    
    # Message Type
    class MessageType(models.TextChoices):
        TEXT = "TEXT", "Text"
        SYSTEM = "SYSTEM", "System"  # For system messages like "Job accepted", "Job started", "Job completed"
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
        db_table = 'message'
        ordering = ['createdAt']
        indexes = [
            models.Index(fields=['conversationID', 'createdAt']),
            models.Index(fields=['sender', '-createdAt']),
            models.Index(fields=['isRead']),
        ]
    
    def __str__(self):
        sender_name = self.get_sender_name()
        return f"Message from {sender_name} at {self.createdAt}"
    
    def get_sender_name(self):
        """Get sender name (works for both Profile and Agency senders)"""
        if self.sender:
            return f"{self.sender.firstName} {self.sender.lastName}"
        elif self.senderAgency:
            return self.senderAgency.businessName
        return "Unknown"
    
    def get_sender(self):
        """Get sender object (Profile or Agency)"""
        return self.sender or self.senderAgency
    
    def save(self, *args, **kwargs):
        """Update conversation's last message info"""
        super().save(*args, **kwargs)
        
        # Update conversation's last message info
        conv = self.conversationID
        conv.lastMessageText = self.messageText[:100]  # Store first 100 chars
        conv.lastMessageTime = self.createdAt
        conv.lastMessageSender = self.sender  # Note: This is still Profile-based
        
        # Update unread count for the recipient
        if self.sender:
            if self.sender == conv.client:
                # Client sent message, increment worker's unread count
                conv.unreadCountWorker += 1
            else:
                # Worker sent message, increment client's unread count
                conv.unreadCountClient += 1
        elif self.senderAgency:
            # Agency sent message, increment client's unread count
            conv.unreadCountClient += 1
        
        conv.save(update_fields=['lastMessageText', 'lastMessageTime', 'lastMessageSender', 'unreadCountClient', 'unreadCountWorker', 'updatedAt'])
    
    @classmethod
    def create_system_message(cls, conversation, message_text):
        """
        Create a system message (e.g., "Job started", "Job completed")
        System messages are sent by the client profile but marked as SYSTEM type
        """
        return cls.objects.create(
            conversationID=conversation,
            sender=conversation.client,  # System messages appear to come from client
            messageText=message_text,
            messageType=cls.MessageType.SYSTEM,
            isRead=False
        )


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
        db_table = 'message_attachment'
        ordering = ['uploadedAt']
    
    def __str__(self):
        return f"Attachment for message {self.messageID_id}"

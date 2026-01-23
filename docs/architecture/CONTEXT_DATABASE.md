# iAyos Database Schema & Relationships

**Generated**: November 20, 2025  
**Database**: PostgreSQL (Neon hosted)  
**ORM**: Django ORM  
**Total Models**: 34 models

---

## 📊 Database Overview

### Accounts Module (20 models)

**Core Models**:

1. `Accounts` - User authentication
2. `Profile` - User profiles with type (WORKER/CLIENT)
3. `WorkerProfile` - Worker-specific data
4. `ClientProfile` - Client-specific data
5. `Agency` - Agency organizations

**Worker Enhancement Models**: 6. `workerSpecialization` - Worker → Specializations mapping 7. `WorkerCertification` - Professional certifications 8. `WorkerPortfolio` - Work samples/images

**Job Models**: 9. `Job` - Job postings (formerly JobPosting) 10. `JobPhoto` - Job images 11. `JobLog` - Status change tracking 12. `JobApplication` - Worker applications 13. `JobDispute` - Client/worker disputes 14. `JobReview` - Rating system

**Financial Models**: 15. `Wallet` - User wallets 16. `Transaction` - Financial transactions

**Verification Models**: 17. `KYC` - KYC applications 18. `KYCFiles` - KYC document files

**Notification Models**: 19. `Notification` - User notifications 20. `PushToken` - Expo push tokens 21. `NotificationSettings` - User preferences

**Categories**: 22. `Specializations` - Job categories 23. `InterestedJobs` - Client → Specializations mapping

### Profiles Module (3 models)

24. `WorkerProduct` - Materials/supplies workers sell
25. `Conversation` - Chat conversations
26. `Message` - Chat messages
27. `MessageAttachment` - Message files

### Agency Module (2 models)

28. `AgencyEmployee` - Agency worker roster
29. `EmployeeOfTheMonth` - EOTM tracking

### Admin Module (2 models)

30. `KYCLogs` - KYC review audit trail

### Location Module (2 models)

31. `City` - Philippine cities
32. `Barangay` - City barangays

---

## 🔗 Core Relationships

### User → Profile → Type-Specific Profile

```
Accounts (authentication)
    ↓ 1:1 accountFK
Profile (user info + profileType)
    ↓ 1:1 profileID
    ├─→ WorkerProfile (if profileType = "WORKER")
    │   ├─→ workerSpecialization (N:N via FK)
    │   ├─→ WorkerCertification (1:N)
    │   ├─→ WorkerPortfolio (1:N)
    │   └─→ WorkerProduct (1:N)
    │
    ├─→ ClientProfile (if profileType = "CLIENT")
    │   └─→ InterestedJobs (N:N via FK)
    │
    └─→ Agency (if profile is agency)
        └─→ AgencyEmployee (1:N)
```

### Job Lifecycle Relationships

```
ClientProfile
    ↓ 1:N clientID
Job
    ├─→ JobPhoto (1:N)
    ├─→ JobLog (1:N) - Status changes
    ├─→ JobApplication (1:N)
    ├─→ JobDispute (1:N)
    ├─→ JobReview (1:N)
    ├─→ categoryID → Specializations (N:1)
    ├─→ assignedWorkerID → WorkerProfile (N:1, optional)
    └─→ assignedAgencyFK → Agency (N:1, optional)

JobApplication
    ├─→ jobID → Job (N:1)
    └─→ workerID → WorkerProfile (N:1)
```

### Wallet & Transactions

```
Accounts
    ↓ 1:1 accountFK
Wallet
    ↓ 1:N walletID
Transaction
    ├─→ transactionType (DEPOSIT, WITHDRAWAL, ESCROW, etc.)
    └─→ status (PENDING, COMPLETED, FAILED)
```

### Chat System

```
Conversation (between 2 users)
    ├─→ user1FK → Accounts (N:1)
    ├─→ user2FK → Accounts (N:1)
    └─→ Message (1:N)
        └─→ MessageAttachment (1:N)
```

---

## 📋 Model Details

### 1. Accounts Model

**Purpose**: Core authentication model  
**Extends**: `AbstractBaseUser`, `PermissionsMixin`  
**Table**: `accounts_accounts` (Django auto-naming)

```python
class Accounts(AbstractBaseUser, PermissionsMixin):
    accountID = models.BigAutoField(primary_key=True)
    email = models.EmailField(max_length=64, unique=True)
    password = models.CharField(max_length=128)  # Hashed
    isVerified = models.BooleanField(default=False)
    KYCVerified = models.BooleanField(default=False)

    # Required for admin + PermissionsMixin
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Password reset
    verifyToken = models.CharField(max_length=255, null=True, blank=True)
    verifyTokenExpiry = models.DateTimeField(null=True, blank=True)

    # Address fields
    street_address = models.CharField(max_length=255, default="", blank=True)
    city = models.CharField(max_length=100, default="", blank=True)
    province = models.CharField(max_length=100, default="", blank=True)
    postal_code = models.CharField(max_length=20, default="", blank=True)
    country = models.CharField(max_length=100, default="Philippines")

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
```

**Indexes**: None (email is unique key)

---

### 2. Profile Model

**Purpose**: User profile info with type distinction  
**Table**: `accounts_profile`

```python
class Profile(models.Model):
    profileID = models.BigAutoField(primary_key=True)
    profileImg = models.CharField(max_length=500, null=True, blank=True)
    firstName = models.CharField(max_length=24)
    middleName = models.CharField(max_length=24, null=True, blank=True)
    lastName = models.CharField(max_length=24)
    contactNum = models.CharField(max_length=11)
    birthDate = models.DateField()

    class ProfileType(models.TextChoices):
        WORKER = "WORKER", "Worker"
        CLIENT = "CLIENT", "Client"

    profileType = models.CharField(
        max_length=10,
        choices=ProfileType.choices,
        null=True,
        blank=True
    )

    # GPS Location tracking
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    location_updated_at = models.DateTimeField(null=True, blank=True)
    location_sharing_enabled = models.BooleanField(default=False)

    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE)
```

**Indexes**: None explicitly defined

---

### 3. WorkerProfile Model

**Purpose**: Worker-specific data and profile completion  
**Table**: `accounts_workerprofile`

```python
class WorkerProfile(models.Model):
    profileID = models.OneToOneField(Profile, on_delete=models.CASCADE)
    description = models.CharField(max_length=350, blank=True, default="")
    workerRating = models.IntegerField(default=0)
    totalEarningGross = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    # Worker Phase 1 fields
    bio = models.CharField(max_length=200, blank=True, default="")
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    profile_completion_percentage = models.IntegerField(default=0)

    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", 'available'
        BUSY = "BUSY", 'busy'
        OFFLINE = "OFFLINE", "offline"

    availability_status = models.CharField(
        max_length=10,
        choices=AvailabilityStatus.choices,
        default="OFFLINE"
    )

    def calculate_profile_completion(self):
        """Calculate completion based on 7 fields: bio, description, hourly_rate,
        profileImg, specializations, certifications, portfolio"""
        total_fields = 7
        completed_fields = 0
        # ... calculation logic
        return int((completed_fields / total_fields) * 100)
```

**Indexes**: None explicitly defined

---

### 4. WorkerCertification Model

**Purpose**: Professional certifications (TESDA, licenses)  
**Table**: `worker_certifications`

```python
class WorkerCertification(models.Model):
    certificationID = models.BigAutoField(primary_key=True)
    workerID = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='certifications')

    name = models.CharField(max_length=255)
    issuing_organization = models.CharField(max_length=255, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    certificate_url = models.CharField(max_length=1000, blank=True)

    # Admin verification
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(Accounts, on_delete=models.SET_NULL, null=True, blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def is_expired(self):
        """Check if certification has expired"""
        if self.expiry_date:
            from django.utils import timezone
            return self.expiry_date < timezone.now().date()
        return False
```

**Indexes**:

- `(workerID, -issue_date)`
- `(expiry_date)` - For expiry alerts

---

### 5. WorkerPortfolio Model

**Purpose**: Work samples/images  
**Table**: `worker_portfolio`

```python
class WorkerPortfolio(models.Model):
    portfolioID = models.BigAutoField(primary_key=True)
    workerID = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='portfolio')

    image_url = models.CharField(max_length=1000)
    caption = models.TextField(blank=True, default="", max_length=500)
    display_order = models.IntegerField(default=0)

    # Metadata
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(null=True, blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
```

**Indexes**:

- `(workerID, display_order)`

**Ordering**: `['display_order', '-createdAt']`

---

### 6. Job Model

**Purpose**: Job postings (both LISTING and INVITE types)  
**Table**: `jobs`  
**Alias**: `JobPosting` (for backward compatibility)

```python
class Job(models.Model):
    jobID = models.BigAutoField(primary_key=True)
    clientID = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='jobs')

    # Job Details
    title = models.CharField(max_length=200)
    description = models.TextField()
    categoryID = models.ForeignKey(Specializations, on_delete=models.SET_NULL, null=True)

    # Budget & Payment
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    escrowAmount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    escrowPaid = models.BooleanField(default=False)
    escrowPaidAt = models.DateTimeField(null=True, blank=True)
    remainingPayment = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    remainingPaymentPaid = models.BooleanField(default=False)
    remainingPaymentPaidAt = models.DateTimeField(null=True, blank=True)

    # Final Payment Method
    class PaymentMethod(models.TextChoices):
        GCASH = "GCASH", "GCash"
        CASH = "CASH", "Cash"

    finalPaymentMethod = models.CharField(max_length=20, choices=PaymentMethod.choices, null=True, blank=True)
    paymentMethodSelectedAt = models.DateTimeField(null=True, blank=True)

    # Cash Payment Proof
    cashPaymentProofUrl = models.CharField(max_length=500, null=True, blank=True)
    cashProofUploadedAt = models.DateTimeField(null=True, blank=True)
    cashPaymentApproved = models.BooleanField(default=False)
    cashPaymentApprovedAt = models.DateTimeField(null=True, blank=True)
    cashPaymentApprovedBy = models.ForeignKey('Accounts', on_delete=models.SET_NULL, null=True, blank=True)

    # Location & Timing
    location = models.CharField(max_length=255)
    expectedDuration = models.CharField(max_length=100, null=True, blank=True)

    class UrgencyLevel(models.TextChoices):
        LOW = "LOW", "Low - Flexible timing"
        MEDIUM = "MEDIUM", "Medium - Within a week"
        HIGH = "HIGH", "High - ASAP"

    urgency = models.CharField(max_length=10, choices=UrgencyLevel.choices, default="MEDIUM")
    preferredStartDate = models.DateField(null=True, blank=True)

    # Materials
    materialsNeeded = models.JSONField(default=list, blank=True)

    # Job Type
    class JobType(models.TextChoices):
        LISTING = "LISTING", "Job Listing (Open for applications)"
        INVITE = "INVITE", "Direct Invite/Hire (Worker or Agency)"

    jobType = models.CharField(max_length=10, choices=JobType.choices, default="LISTING")

    # Status
    class JobStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    status = models.CharField(max_length=15, choices=JobStatus.choices, default="ACTIVE")

    # Invite Status (for INVITE jobs)
    class InviteStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Agency Response"
        ACCEPTED = "ACCEPTED", "Agency Accepted"
        REJECTED = "REJECTED", "Agency Rejected"

    inviteStatus = models.CharField(max_length=10, choices=InviteStatus.choices, null=True, blank=True)
    inviteRejectionReason = models.TextField(null=True, blank=True)
    inviteRespondedAt = models.DateTimeField(null=True, blank=True)

    # Assigned Worker/Agency
    assignedWorkerID = models.ForeignKey('WorkerProfile', on_delete=models.SET_NULL, null=True, blank=True)
    assignedAgencyFK = models.ForeignKey('Agency', on_delete=models.SET_NULL, null=True, blank=True)

    # Completion
    completedAt = models.DateTimeField(null=True, blank=True)
    cancellationReason = models.TextField(null=True, blank=True)

    # Two-phase completion
    workerMarkedComplete = models.BooleanField(default=False)
    clientMarkedComplete = models.BooleanField(default=False)
    workerMarkedCompleteAt = models.DateTimeField(null=True, blank=True)
    clientMarkedCompleteAt = models.DateTimeField(null=True, blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
```

**Indexes**:

- `(clientID, -createdAt)`
- `(status, -createdAt)`
- `(categoryID, status)`
- `(urgency, -createdAt)`
- `(assignedWorkerID, status)`

**Ordering**: `['-createdAt']`

---

### 7. JobApplication Model

**Purpose**: Worker applications to LISTING-type jobs  
**Table**: `job_applications`

```python
class JobApplication(models.Model):
    applicationID = models.BigAutoField(primary_key=True)
    jobID = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    workerID = models.ForeignKey('WorkerProfile', on_delete=models.CASCADE, related_name='job_applications')

    # Proposal
    proposalMessage = models.TextField()
    proposedBudget = models.DecimalField(max_digits=10, decimal_places=2)
    estimatedDuration = models.CharField(max_length=100, blank=True, null=True)

    class BudgetOption(models.TextChoices):
        ACCEPT = "ACCEPT", "Accept Client's Budget"
        NEGOTIATE = "NEGOTIATE", "Negotiate Different Budget"

    budgetOption = models.CharField(max_length=20, choices=BudgetOption.choices, default="NEGOTIATE")

    # Status
    class ApplicationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"

    status = models.CharField(max_length=20, choices=ApplicationStatus.choices, default="PENDING")

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
```

**Indexes**:

- `(jobID, -createdAt)`
- `(workerID, -createdAt)`
- `(status, -createdAt)`

**Constraints**:

- Unique `(jobID, workerID)` - Prevent duplicate applications

**Ordering**: `['-createdAt']`

---

### 8. Wallet Model

**Purpose**: User wallet balances  
**Table**: `accounts_wallet`

```python
class Wallet(models.Model):
    walletID = models.BigAutoField(primary_key=True)
    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
```

**Indexes**: None explicitly defined

---

### 9. Transaction Model

**Purpose**: Financial transaction records  
**Table**: `accounts_transaction`

```python
class Transaction(models.Model):
    transactionID = models.BigAutoField(primary_key=True)
    walletID = models.ForeignKey(Wallet, on_delete=models.CASCADE)

    class TransactionType(models.TextChoices):
        DEPOSIT = "DEPOSIT", "Deposit"
        WITHDRAWAL = "WITHDRAWAL", "Withdrawal"
        ESCROW_HOLD = "ESCROW_HOLD", "Escrow Hold"
        ESCROW_RELEASE = "ESCROW_RELEASE", "Escrow Release"
        JOB_PAYMENT = "JOB_PAYMENT", "Job Payment"
        REFUND = "REFUND", "Refund"

    transactionType = models.CharField(max_length=20, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class TransactionStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    status = models.CharField(max_length=20, choices=TransactionStatus.choices, default="PENDING")

    # Xendit integration
    xenditExternalID = models.CharField(max_length=255, null=True, blank=True)
    xenditPaymentURL = models.CharField(max_length=500, null=True, blank=True)
    invoiceURL = models.CharField(max_length=500, null=True, blank=True)

    description = models.TextField(blank=True, null=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
```

**Indexes**:

- `(walletID, -createdAt)`
- `(status, -createdAt)`

---

## 🔢 Migration History

**Total Migrations**: 42+ files  
**Latest Migration**: `0042_add_city_barangay_models.py`

### Recent Major Migrations

**0037_worker_phase1_profile_enhancements.py**:

- Added `bio`, `hourly_rate`, `profile_completion_percentage` to WorkerProfile
- Created WorkerCertification model
- Created WorkerPortfolio model

**0041_notificationsettings_pushtoken.py**:

- Added NotificationSettings model
- Added PushToken model for Expo push notifications

**0042_add_city_barangay_models.py**:

- Added City model (Philippine cities)
- Added Barangay model (city subdivisions)

**0026_add_escrow_fields_to_job.py**:

- Added escrow payment fields to Job model
- Added remainingPayment tracking

**0028_add_payment_method_tracking.py**:

- Added finalPaymentMethod to Job
- Added cash payment proof fields

---

## 📈 Database Statistics

### Record Estimates (Production)

- Users (Accounts): 1,000+
- Profiles: 1,000+
- Workers: 600+
- Clients: 400+
- Jobs: 500+
- Applications: 2,000+
- Transactions: 3,000+
- Messages: 10,000+

### Table Sizes (Estimated)

- Large tables (10K+ rows): Message, Transaction, Notification
- Medium tables (1K-10K): Job, JobApplication, JobPhoto
- Small tables (<1K): Accounts, Profile, WorkerProfile

---

## 🔍 Query Optimization

### Indexed Fields

**High-traffic lookups**:

- `Accounts.email` (unique key)
- `Job.status + createdAt` (job listings)
- `JobApplication.status + createdAt` (applications)
- `Transaction.status + createdAt` (wallet)
- `Notification.accountFK + isRead` (notifications)

### Common Query Patterns

```python
# Get user with related profile
user = Accounts.objects.select_related('profile').get(email="user@example.com")

# Get worker with certifications and portfolio
worker = WorkerProfile.objects.prefetch_related(
    'certifications',
    'portfolio'
).get(profileID=profile)

# Get job with applications
job = Job.objects.prefetch_related(
    'applications__workerID__profileID',
    'photos'
).get(jobID=123)

# Get wallet with transactions
wallet = Wallet.objects.prefetch_related('transaction_set').get(accountFK=user)
```

---

**Last Updated**: November 20, 2025  
**Total Models**: 34  
**Database Size**: ~50MB (estimated)  
**Status**: ✅ Complete schema documentation

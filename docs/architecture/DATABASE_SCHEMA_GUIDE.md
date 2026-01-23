# Database Schema Guide - User Roles & Data Implementation

## Overview

This document outlines how user data is structured in the database for the 4 main user roles: **Admin**, **Client**, **Worker**, and **Agency**.

---

## 1. ADMIN User Role

### Primary Table: `Accounts`

- **accountID** (BigAutoField, PK)
- **email** (EmailField, unique)
- **password** (CharField)
- **isVerified** (BooleanField)
- **createdAt** (DateTimeField)
- **updatedAt** (DateTimeField)

### Role Assignment Table: `SystemRoles`

Located in: `adminpanel/models.py`

- **systemRoleID** (BigAutoField, PK)
- **accountID** (FK → Accounts)
- **systemRole** (CharField, choices: ADMIN, STAFF)
- **createdAt** (DateTimeField)
- **updatedAt** (DateTimeField)

### Special Access:

- Admins have access to `KYCLogs` table for reviewing all KYC submissions
- Can approve/reject KYC for both regular users and agencies

**Key Fields for Admin Identification:**

```python
SystemRoles.objects.filter(accountID=account, systemRole='ADMIN')
```

---

## 2. CLIENT User Role

### Primary Tables

#### 1. **Accounts** (Base Account)

- Same structure as Admin (see above)

#### 2. **Profile** (Personal Information)

Located in: `accounts/models.py`

- **profileID** (BigAutoField, PK)
- **accountFK** (FK → Accounts)
- **profileImg** (CharField, max_length=500) - Supabase URL
- **firstName** (CharField, max_length=24)
- **middleName** (CharField, max_length=24, nullable)
- **lastName** (CharField, max_length=24)
- **contactNum** (CharField, max_length=11)
- **birthDate** (DateField)
- **profileType** (CharField, choices: 'CLIENT' | 'WORKER')
- **latitude** (DecimalField, nullable) - GPS coordinate
- **longitude** (DecimalField, nullable) - GPS coordinate
- **location_updated_at** (DateTimeField, nullable)
- **location_sharing_enabled** (BooleanField, default=False)

**For CLIENT identification:**

```python
Profile.objects.filter(accountFK=account, profileType='CLIENT')
```

#### 3. **ClientProfile** (Client-Specific Data)

Located in: `accounts/models.py`

- **profileID** (OneToOneField → Profile, PK)
- **description** (CharField, max_length=350)
- **totalJobsPosted** (IntegerField)
- **clientRating** (IntegerField, default=0)
- **activeJobsCount** (IntegerField)

### KYC Tables

#### **kyc** (KYC Submissions)

Located in: `accounts/models.py`

- **kycID** (BigAutoField, PK)
- **accountFK** (FK → Accounts)
- **kycStatus** (CharField, choices: PENDING, APPROVED, REJECTED)
- **reviewedAt** (DateTimeField)
- **reviewedBy** (FK → Accounts, nullable)
- **notes** (CharField, max_length=511)
- **createdAt** (DateTimeField)
- **updatedAt** (DateTimeField)

#### **kycFiles** (KYC Document Files)

- **fileID** (BigAutoField, PK)
- **kycFK** (FK → kyc)
- **fileType** (CharField, choices: VALID_ID_FRONT, VALID_ID_BACK, SELFIE, ADDRESS_PROOF)
- **fileUrl** (CharField, max_length=500)
- **uploadedAt** (DateTimeField)

#### **KYCLogs** (Permanent KYC History)

Located in: `adminpanel/models.py`

- **kycLogID** (BigAutoField, PK)
- **accountFK** (FK → Accounts) - User whose KYC was reviewed
- **kycID** (BigIntegerField) - Original KYC record ID (deleted after review)
- **action** (CharField, choices: APPROVED, REJECTED)
- **reviewedBy** (FK → Accounts, nullable)
- **reviewedAt** (DateTimeField)
- **reason** (TextField) - Rejection reason or notes
- **userEmail** (EmailField) - Snapshot at time of review
- **userAccountID** (BigIntegerField)
- **kycType** (CharField, choices: USER, AGENCY)
- **createdAt** (DateTimeField)

**Important Notes:**

- After KYC approval/rejection, the original `kyc` record is DELETED for privacy
- KYC status should be checked from `KYCLogs.objects.filter(accountFK=account, kycType='USER').order_by('-reviewedAt').first()`
- If no log entry exists, check if pending KYC exists in `kyc` table

### Job-Related Tables

#### **InterestedJobs** (Client Job Categories)

- **clientID** (FK → ClientProfile)
- **specializationID** (FK → Specializations)

---

## 3. WORKER User Role

### Primary Tables

#### 1. **Accounts** (Base Account)

- Same as Client

#### 2. **Profile** (Personal Information)

- Same structure as Client
- **profileType** = 'WORKER'

**For WORKER identification:**

```python
Profile.objects.filter(accountFK=account, profileType='WORKER')
```

#### 3. **WorkerProfile** (Worker-Specific Data)

Located in: `accounts/models.py`

- **profileID** (OneToOneField → Profile, PK)
- **description** (CharField, max_length=350)
- **workerRating** (IntegerField, default=0)
- **totalEarningGross** (DecimalField, max_digits=10, decimal_places=2)
- **availabilityStatus** (CharField, choices: AVAILABLE, BUSY, OFFLINE, default=OFFLINE)

### Skills/Specializations

#### **workerSpecialization** (Worker Skills)

Located in: `accounts/models.py`

- **workerID** (FK → WorkerProfile)
- **specializationID** (FK → Specializations)
- **experienceYears** (IntegerField)
- **certification** (CharField, max_length=120)

#### **Specializations** (Skill Categories)

- **specializationID** (BigAutoField, PK)
- **specializationName** (CharField, max_length=250)

### KYC Tables

- Uses same **kyc**, **kycFiles**, and **KYCLogs** tables as Client
- In **KYCLogs**: `kycType='USER'`

---

## 4. AGENCY User Role

### Primary Tables

#### 1. **Accounts** (Base Account)

- Same structure as other roles

#### 2. **Agency** (Business Information)

Located in: `accounts/models.py`

- **agencyId** (BigAutoField, PK) - Note: lowercase 'd' in Id
- **accountFK** (FK → Accounts)
- **businessName** (CharField, max_length=50)
- **street_address** (CharField, max_length=255)
- **city** (CharField, max_length=100)
- **province** (CharField, max_length=100)
- **postal_code** (CharField, max_length=20)
- **country** (CharField, max_length=100, default="Philippines")
- **businessDesc** (CharField, max_length=255)
- **contactNumber** (CharField, max_length=11)
- **createdAt** (DateTimeField)

**For AGENCY identification:**

```python
Agency.objects.filter(accountFK=account)
```

### Agency Employees (Managed Workers)

#### **AgencyEmployee** (Internal Employees)

Located in: `agency/models.py`

- **employeeID** (BigAutoField, PK)
- **agency** (FK → Accounts) - Links to agency's account, NOT Agency model
- **name** (CharField, max_length=255)
- **email** (EmailField, max_length=255)
- **role** (CharField, max_length=100)
- **avatar** (CharField, max_length=1000, nullable) - URL
- **rating** (DecimalField, max_digits=3, decimal_places=2, nullable) - 0.00 to 5.00
- **createdAt** (DateTimeField)
- **updatedAt** (DateTimeField)

**Important Notes:**

- Agency employees are NOT in the `Profile` table
- They do NOT have user accounts
- They are display-only records managed by the agency
- To count employees: `AgencyEmployee.objects.filter(agency=account).count()`

### Agency KYC Tables

#### **AgencyKYC** (Agency KYC Submissions)

Located in: `agency/models.py`

- **agencyKycID** (BigAutoField, PK)
- **accountFK** (FK → Accounts) - Links to agency's account
- **status** (CharField, choices: PENDING, APPROVED, REJECTED, default=PENDING)
- **reviewedAt** (DateTimeField, nullable)
- **reviewedBy** (FK → Accounts, nullable)
- **notes** (CharField, max_length=511)
- **createdAt** (DateTimeField)
- **updatedAt** (DateTimeField)

#### **AgencyKycFile** (Agency KYC Documents)

Located in: `agency/models.py`

- **fileID** (BigAutoField, PK)
- **agencyKyc** (FK → AgencyKYC)
- **fileType** (CharField, choices: BUSINESS_PERMIT, REP_ID_FRONT, REP_ID_BACK, ADDRESS_PROOF, AUTH_LETTER)
- **fileUrl** (CharField, max_length=500)
- **uploadedAt** (DateTimeField)

#### **KYCLogs** (Agency KYC History)

Same table as regular users, but:

- **kycType** = 'AGENCY'
- After approval/rejection, `AgencyKYC` record is kept (unlike regular KYC)

**Checking Agency KYC Status:**

```python
# First check logs
latest_log = KYCLogs.objects.filter(
    accountFK=account,
    kycType='AGENCY'
).order_by('-reviewedAt').first()

if latest_log:
    kyc_status = latest_log.action  # APPROVED or REJECTED
else:
    # Check if pending submission exists
    try:
        agency_kyc = AgencyKYC.objects.get(accountFK=account)
        kyc_status = agency_kyc.status  # PENDING, APPROVED, REJECTED
    except AgencyKYC.DoesNotExist:
        kyc_status = 'NOT_SUBMITTED'
```

---

## Common Tables Across All Roles

### Job Management

#### **Job** (Job Postings)

Located in: `accounts/models.py`

- **jobID** (BigAutoField, PK)
- **clientFK** (FK → Profile) - Client who posted
- **workerFK** (FK → Profile, nullable) - Assigned worker
- **agencyFK** (FK → Agency, nullable) - If posted by agency
- **categoryFK** (FK → JobCategory)
- **status** (CharField, choices: ACTIVE, COMPLETED, CANCELLED, etc.)
- **createdAt** (DateTimeField)
- Various job-specific fields (title, description, payment, location, etc.)

**Relationships:**

- Clients can post jobs: `Job.objects.filter(clientFK=profile)`
- Workers can be assigned: `Job.objects.filter(workerFK=profile)`
- Agencies can post jobs: `Job.objects.filter(agencyFK=agency)`

---

## Key Naming Conventions

### Foreign Key Naming

**CRITICAL:** All foreign keys use the `FK` suffix:

- `accountFK` NOT `account`
- `profileFK` NOT `profile`
- `clientFK` NOT `client`
- `workerFK` NOT `worker`
- `agencyFK` NOT `agency`

### Primary Key Variations

- Most tables: `tableNameID` (e.g., `accountID`, `profileID`)
- **Exception:** `Agency` table uses `agencyId` (lowercase 'd')

### Field Name Conventions

- Snake_case for multi-word fields: `street_address`, `postal_code`, `business_description`
- CamelCase for model names: `AgencyEmployee`, `WorkerProfile`, `ClientProfile`

---

## Data Retrieval Patterns

### Getting User by Role

#### Admin:

```python
from adminpanel.models import SystemRoles
admin = SystemRoles.objects.filter(
    accountID=account,
    systemRole='ADMIN'
).exists()
```

#### Client:

```python
from accounts.models import Profile, ClientProfile
profile = Profile.objects.filter(
    accountFK=account,
    profileType='CLIENT'
).select_related('accountFK').first()

client_profile = ClientProfile.objects.get(profileID=profile)
```

#### Worker:

```python
from accounts.models import Profile, WorkerProfile
profile = Profile.objects.filter(
    accountFK=account,
    profileType='WORKER'
).select_related('accountFK').first()

worker_profile = WorkerProfile.objects.get(profileID=profile)
```

#### Agency:

```python
from accounts.models import Agency
agency = Agency.objects.filter(
    accountFK=account
).select_related('accountFK').first()
```

### Getting KYC Status (Universal Pattern)

```python
from adminpanel.models import KYCLogs
from accounts.models import kyc
from agency.models import AgencyKYC

def get_kyc_status(account, is_agency=False):
    kycType = 'AGENCY' if is_agency else 'USER'

    # Check logs first (most recent)
    latest_log = KYCLogs.objects.filter(
        accountFK=account,
        kycType=kycType
    ).order_by('-reviewedAt').first()

    if latest_log:
        return latest_log.action  # APPROVED or REJECTED

    # Check pending submission
    if is_agency:
        try:
            kyc_obj = AgencyKYC.objects.get(accountFK=account)
            return kyc_obj.status
        except AgencyKYC.DoesNotExist:
            return 'NOT_SUBMITTED'
    else:
        try:
            kyc_obj = kyc.objects.get(accountFK=account)
            return kyc_obj.kycStatus
        except kyc.DoesNotExist:
            return 'NOT_SUBMITTED'
```

---

## API Response Structures

### Admin Dashboard Stats

```python
{
    'total_users': int,
    'total_clients': int,
    'total_workers': int,
    'total_agencies': int,
    'pending_kyc': int,
    'approved_kyc': int,
    'rejected_kyc': int,
    'active_jobs': int,
    'completed_jobs': int,
    'total_revenue': float
}
```

### Client Detail Response

```python
{
    'id': str(account.accountID),
    'profile_id': str(profile.profileID),
    'email': str,
    'first_name': str,
    'last_name': str,
    'full_name': str,
    'phone': str,
    'birth_date': ISO date string,
    'profile_image': str (URL),
    'location': {
        'latitude': float,
        'longitude': float,
        'sharing_enabled': bool,
        'updated_at': ISO datetime string
    },
    'status': 'active' | 'inactive',
    'kyc_status': 'APPROVED' | 'REJECTED' | 'PENDING' | 'NOT_SUBMITTED',
    'join_date': ISO datetime string,
    'is_verified': bool,
    'client_data': {
        'description': str,
        'rating': int,
        'total_jobs_posted': int
    },
    'job_stats': {
        'total_jobs': int,
        'completed_jobs': int,
        'active_jobs': int,
        'cancelled_jobs': int,
        'completion_rate': float
    },
    'review_count': int
}
```

### Worker Detail Response

```python
{
    'id': str(account.accountID),
    'profile_id': str(profile.profileID),
    'email': str,
    'first_name': str,
    'last_name': str,
    'full_name': str,
    'phone': str,
    'birth_date': ISO date string,
    'profile_image': str (URL),
    'location': {
        'latitude': float,
        'longitude': float,
        'sharing_enabled': bool,
        'updated_at': ISO datetime string
    },
    'status': 'active' | 'inactive',
    'kyc_status': str,
    'join_date': ISO datetime string,
    'is_verified': bool,
    'worker_data': {
        'description': str,
        'rating': int,
        'availability_status': 'AVAILABLE' | 'BUSY' | 'OFFLINE',
        'total_earnings': float
    },
    'skills': [
        {
            'name': str,
            'experience_years': int,
            'certification': str
        }
    ],
    'job_stats': {
        'total_jobs': int,
        'completed_jobs': int,
        'active_jobs': int,
        'completion_rate': float
    },
    'review_count': int
}
```

### Agency Detail Response

```python
{
    'id': str(account.accountID),
    'agency_id': str(agency.agencyId),
    'email': str,
    'business_name': str,
    'phone': str,
    'address': {
        'street': str,
        'city': str,
        'province': str,
        'postal_code': str,
        'country': str,
        'full_address': str
    },
    'business_description': str,
    'status': 'active' | 'inactive',
    'kyc_status': str,
    'join_date': ISO datetime string,
    'is_verified': bool,
    'employee_stats': {
        'total_employees': int,
        'employees': [
            {
                'id': str,
                'name': str,
                'email': str,
                'role': str,
                'rating': float,
                'avatar': str (URL)
            }
        ]
    },
    'job_stats': {
        'total_jobs': int,
        'completed_jobs': int,
        'active_jobs': int,
        'completion_rate': float
    },
    'rating': float,
    'review_count': int
}
```

---

## Important Implementation Notes

### 1. KYC Flow

- **Submission:** Create record in `kyc` (user) or `AgencyKYC` (agency) with status='PENDING'
- **Review:** Admin approves/rejects via `adminpanel/service.py` functions
- **Logging:** Create entry in `KYCLogs` with action and details
- **Cleanup:** For regular users, delete `kyc` record after logging (privacy)
- **Status Check:** ALWAYS check `KYCLogs` first, then fall back to pending tables

### 2. Employee Management

- **Agency Employees:** Use `AgencyEmployee` model (no accounts, display-only)
- **Regular Workers:** Use `Profile` with profileType='WORKER' (have accounts)
- They are SEPARATE systems - don't mix them up

### 3. Job Relationships

- Jobs can be posted by: Clients (via clientFK) or Agencies (via agencyFK)
- Jobs can be assigned to: Workers (via workerFK)
- Always check which FK is populated to determine job type

### 4. Location Tracking

- GPS coordinates stored in `Profile` table (both clients and workers)
- `location_sharing_enabled` must be TRUE for coordinates to be valid
- `location_updated_at` shows freshness of location data

### 5. Query Optimization

- Always use `.select_related('accountFK')` when querying Profile/Agency
- Use `.prefetch_related()` for reverse relationships (jobs, skills, etc.)
- Index fields: accountID, profileType, kycStatus, status fields

---

## File Locations

### Backend Models

- `apps/backend/src/accounts/models.py` - Accounts, Profile, ClientProfile, WorkerProfile, Job, kyc
- `apps/backend/src/agency/models.py` - Agency (if separate), AgencyKYC, AgencyEmployee
- `apps/backend/src/adminpanel/models.py` - KYCLogs, SystemRoles

### Backend Services

- `apps/backend/src/adminpanel/service.py` - All admin panel business logic
- `apps/backend/src/adminpanel/api.py` - All admin API endpoints

### Frontend Pages

- `apps/frontend_web/app/admin/users/clients/` - Client management
- `apps/frontend_web/app/admin/users/workers/` - Worker management
- `apps/frontend_web/app/admin/users/agency/` - Agency management

---

## Migration Considerations

When adding new fields:

1. Add to model definition
2. Run `python manage.py makemigrations`
3. Run `python manage.py migrate`
4. Update service functions to include new fields
5. Update API response structures
6. Update frontend TypeScript interfaces

---

**Last Updated:** October 30, 2025
**Version:** 1.0
**Maintained By:** Development Team

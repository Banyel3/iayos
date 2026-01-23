# iAyos Mobile App - Complete Development Roadmap
## Backend + Frontend Integration Strategy

---

## 🎯 Development Strategy

### **Two-Track Approach**

1. **Backend Track:** Create mobile-specific API endpoints in Django
2. **Frontend Track:** Build Flutter screens that consume the mobile endpoints
3. **Integration:** Wire Flutter services to the new mobile endpoints

### **Why Separate Mobile Endpoints?**

- **Optimized responses** - Mobile needs minimal payloads for performance
- **Better error handling** - Mobile-specific error messages
- **Token delivery** - JSON body for mobile, cookies for web
- **Future scalability** - Independent versioning (e.g., /api/mobile/v2/)
- **Cleaner codebase** - Separation of concerns

---

## 📅 Week-by-Week Development Plan

---

## ✅ WEEK 1: Authentication & Foundation (COMPLETED)

### Backend Tasks ✅
- [x] Create mobile login endpoint `/api/mobile/auth/login`
- [x] Create mobile register endpoint `/api/mobile/auth/register`
- [x] Modify `generateCookie()` to return tokens in JSON body
- [x] Fix CORS configuration for mobile
- [x] Fix ALLOWED_HOSTS for emulator (10.0.2.2)
- [x] Extend refresh token to 7 days

### Frontend Tasks ✅
- [x] Create User, Job, JobApplication models
- [x] Create constants file with AppColors, AppTheme, API URLs
- [x] Build AuthService with login, register, logout methods
- [x] Build Login Screen with validation
- [x] Build Registration Screen (3-step flow)
- [x] Build Email Verification Screen
- [x] Build Role Selection Screen
- [x] Build Dashboard Screen with bottom navigation
- [x] Build Home, Requests, Inbox, Profile tab screens
- [x] Build Bottom Navigation Bar component
- [x] Fix navigation flow and success validation
- [x] Test complete authentication flow

### Testing Checklist ✅
- [x] Login with valid credentials navigates to dashboard
- [x] Login with invalid credentials shows error
- [x] Registration creates account and sends verification email
- [x] Role selection assigns CLIENT or WORKER role
- [x] Dashboard loads user profile from backend
- [x] Bottom navigation switches between tabs
- [x] Profile screen shows user data and wallet
- [x] Logout clears tokens and returns to welcome screen

---

## 🔨 WEEK 2: Job Posting & Browsing

### Backend Tasks

#### 1. Create Mobile Job Endpoints

**File:** `apps/backend/src/accounts/api.py`

Add new mobile router:
```python
mobile_router = Router(tags=["Mobile API"], auth=cookie_auth)

# Job Listing for Mobile
@mobile_router.get("/jobs/list")
def mobile_job_list(request,
                    category: int = None,
                    min_budget: float = None,
                    max_budget: float = None,
                    location: str = None,
                    page: int = 1,
                    limit: int = 20):
    """
    Mobile-optimized job listing with pagination
    Returns minimal fields for list view
    """
    pass

# Job Details for Mobile
@mobile_router.get("/jobs/{job_id}")
def mobile_job_detail(request, job_id: int):
    """
    Mobile-optimized job details
    Includes all fields needed for detail view
    """
    pass

# Create Job for Mobile
@mobile_router.post("/jobs/create")
def mobile_create_job(request, payload: CreateJobMobileSchema):
    """
    Mobile job creation with photo upload handling
    Returns job_id and payment instructions
    """
    pass

# Job Search for Mobile
@mobile_router.get("/jobs/search")
def mobile_job_search(request, query: str, page: int = 1, limit: int = 20):
    """
    Mobile-optimized search with fuzzy matching
    """
    pass
```

#### 2. Create Mobile Schemas

**File:** `apps/backend/src/accounts/schemas.py`

```python
from ninja import Schema
from typing import Optional, List
from datetime import datetime

class CreateJobMobileSchema(Schema):
    title: str
    description: str
    category_id: int
    budget: float
    location: str
    expected_duration: str
    urgency_level: str  # 'LOW' | 'MEDIUM' | 'HIGH'
    preferred_start_date: Optional[str] = None
    materials_needed: Optional[List[str]] = None
    downpayment_method: str  # 'WALLET' | 'GCASH'

class JobListItemMobileSchema(Schema):
    """Minimal job data for list view"""
    jobPostingID: int
    title: str
    budget: float
    location: str
    urgency_level: str
    created_at: datetime
    category_name: str
    client_name: str
    client_avatar: Optional[str]
    is_applied: bool  # Check if current user applied

class JobDetailMobileSchema(Schema):
    """Complete job data for detail view"""
    jobPostingID: int
    title: str
    description: str
    budget: float
    location: str
    expected_duration: str
    urgency_level: str
    preferred_start_date: Optional[datetime]
    materials_needed: Optional[List[str]]
    photos: List[str]  # URLs
    status: str
    created_at: datetime
    category: dict  # {id, name}
    client: dict  # {id, name, avatar, rating}
    applications_count: int
    is_applied: bool
    user_application: Optional[dict]  # Current user's application if exists
```

#### 3. Create Mobile Service Layer

**File:** `apps/backend/src/accounts/mobile_services.py` (NEW FILE)

```python
from .models import JobPosting, JobApplication, Profile, Accounts
from django.db.models import Q
from .services import deduct_from_wallet  # Reuse existing wallet logic

def get_mobile_job_list(user, filters):
    """
    Optimized job listing for mobile
    Returns paginated results with minimal fields
    """
    pass

def get_mobile_job_detail(job_id, user):
    """
    Get complete job details for mobile view
    Includes user-specific data (is_applied, etc.)
    """
    pass

def create_mobile_job(user, job_data):
    """
    Create job posting from mobile app
    Handles payment and returns job_id
    """
    pass

def search_mobile_jobs(query, user, page, limit):
    """
    Search jobs with fuzzy matching
    """
    pass
```

### Frontend Tasks

#### 1. Create JobService

**File:** `lib/services/job_service.dart`

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';
import '../models/job.dart';

class JobService {
  static final JobService _instance = JobService._internal();
  factory JobService() => _instance;
  JobService._internal();

  final _storage = const FlutterSecureStorage();

  // Get authorization headers
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Fetch job listings
  Future<Map<String, dynamic>> getJobs({
    int? categoryId,
    double? minBudget,
    double? maxBudget,
    String? location,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (categoryId != null) queryParams['category'] = categoryId.toString();
      if (minBudget != null) queryParams['min_budget'] = minBudget.toString();
      if (maxBudget != null) queryParams['max_budget'] = maxBudget.toString();
      if (location != null) queryParams['location'] = location;

      final uri = Uri.parse(ApiConfig.mobileJobList).replace(
        queryParameters: queryParams,
      );

      final response = await http.get(uri, headers: await _getHeaders());
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to fetch jobs'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // Get job details
  Future<Map<String, dynamic>> getJobDetails(int jobId) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.mobileJobDetail(jobId)),
        headers: await _getHeaders(),
      );
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to fetch job'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // Create job posting
  Future<Map<String, dynamic>> createJob({
    required String title,
    required String description,
    required int categoryId,
    required double budget,
    required String location,
    required String expectedDuration,
    required String urgencyLevel,
    required String downpaymentMethod,
    String? preferredStartDate,
    List<String>? materialsNeeded,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.mobileCreateJob),
        headers: await _getHeaders(),
        body: jsonEncode({
          'title': title,
          'description': description,
          'category_id': categoryId,
          'budget': budget,
          'location': location,
          'expected_duration': expectedDuration,
          'urgency_level': urgencyLevel,
          'downpayment_method': downpaymentMethod,
          'preferred_start_date': preferredStartDate,
          'materials_needed': materialsNeeded,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Job creation failed'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // Search jobs
  Future<Map<String, dynamic>> searchJobs({
    required String query,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final uri = Uri.parse(ApiConfig.mobileJobSearch).replace(
        queryParameters: {
          'query': query,
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      final response = await http.get(uri, headers: await _getHeaders());
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Search failed'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
}
```

#### 2. Update API Config

**File:** `lib/services/api_config.dart`

```dart
class ApiConfig {
  // Base URLs
  static const String baseUrl = 'http://10.0.2.2:8000/api';
  static const String mobileBaseUrl = '$baseUrl/mobile';

  // Mobile Auth Endpoints
  static const String mobileLogin = '$mobileBaseUrl/auth/login';
  static const String mobileRegister = '$mobileBaseUrl/auth/register';
  static const String mobileLogout = '$mobileBaseUrl/auth/logout';
  static const String mobileRefreshToken = '$mobileBaseUrl/auth/refresh';
  static const String mobileUserProfile = '$mobileBaseUrl/auth/profile';
  static const String mobileAssignRole = '$mobileBaseUrl/auth/assign-role';

  // Mobile Job Endpoints
  static const String mobileJobList = '$mobileBaseUrl/jobs/list';
  static String mobileJobDetail(int jobId) => '$mobileBaseUrl/jobs/$jobId';
  static const String mobileCreateJob = '$mobileBaseUrl/jobs/create';
  static const String mobileJobSearch = '$mobileBaseUrl/jobs/search';
  static String mobileJobApply(int jobId) => '$mobileBaseUrl/jobs/$jobId/apply';
  static String mobileJobApplications(int jobId) => '$mobileBaseUrl/jobs/$jobId/applications';

  // Helper method
  static String getUrl(String endpoint) => endpoint;
}
```

#### 3. Build Screens

**Screens to create:**
- `lib/screens/jobs/job_list_screen.dart` - Browse jobs
- `lib/screens/jobs/job_details_screen.dart` - View job details
- `lib/screens/jobs/post_job_screen.dart` - Create new job
- `lib/screens/jobs/search_jobs_screen.dart` - Search functionality

**Widgets to create:**
- `lib/widgets/cards/job_card.dart` - Job list item
- `lib/widgets/dialogs/payment_method_dialog.dart` - Payment selection

### Testing Checklist

Backend:
- [ ] `/api/mobile/jobs/list` returns paginated jobs
- [ ] `/api/mobile/jobs/{id}` returns complete job details
- [ ] `/api/mobile/jobs/create` creates job and processes payment
- [ ] `/api/mobile/jobs/search` returns matching jobs
- [ ] Endpoints return mobile-optimized payloads

Frontend:
- [ ] Job list screen displays jobs correctly
- [ ] Job details screen shows all information
- [ ] Post job screen validates all fields
- [ ] Payment method dialog shows wallet/GCash options
- [ ] Job creation with wallet payment succeeds
- [ ] Job creation with GCash redirects properly
- [ ] Search functionality works

---

## 🔨 WEEK 3: Job Applications & Management

### Backend Tasks

#### 1. Create Mobile Application Endpoints

```python
# Apply to Job
@mobile_router.post("/jobs/{job_id}/apply")
def mobile_apply_to_job(request, job_id: int, payload: ApplyJobMobileSchema):
    pass

# Get My Applications (Worker View)
@mobile_router.get("/applications/my-applications")
def mobile_my_applications(request, status: str = None, page: int = 1):
    pass

# Get Job Applications (Client View)
@mobile_router.get("/jobs/{job_id}/applications")
def mobile_job_applications(request, job_id: int):
    pass

# Accept/Reject Application
@mobile_router.put("/applications/{app_id}/status")
def mobile_update_application_status(request, app_id: int, payload: UpdateApplicationMobileSchema):
    pass

# Get My Posted Jobs (Client View)
@mobile_router.get("/jobs/my-jobs")
def mobile_my_jobs(request, status: str = None, page: int = 1):
    pass
```

#### 2. Create Mobile Schemas

```python
class ApplyJobMobileSchema(Schema):
    proposal_message: str
    budget_option: str  # 'ACCEPT' | 'NEGOTIATE'
    proposed_budget: Optional[float]
    estimated_duration: str

class UpdateApplicationMobileSchema(Schema):
    status: str  # 'ACCEPTED' | 'REJECTED'

class ApplicationMobileSchema(Schema):
    """Application data for mobile"""
    applicationID: int
    job: dict  # Minimal job info
    worker: dict  # Worker profile
    proposal_message: str
    proposed_budget: float
    status: str
    created_at: datetime
```

### Frontend Tasks

#### 1. Create Application Service

**File:** `lib/services/application_service.dart`

```dart
class ApplicationService {
  // Apply to job
  Future<Map<String, dynamic>> applyToJob({
    required int jobId,
    required String proposalMessage,
    required String budgetOption,
    double? proposedBudget,
    required String estimatedDuration,
  }) async {}

  // Get my applications (worker)
  Future<Map<String, dynamic>> getMyApplications({
    String? status,
    int page = 1,
  }) async {}

  // Get job applications (client)
  Future<Map<String, dynamic>> getJobApplications(int jobId) async {}

  // Accept/Reject application
  Future<Map<String, dynamic>> updateApplicationStatus({
    required int applicationId,
    required String status,
  }) async {}

  // Get my posted jobs (client)
  Future<Map<String, dynamic>> getMyJobs({
    String? status,
    int page = 1,
  }) async {}
}
```

#### 2. Build Screens

- `lib/screens/jobs/job_apply_screen.dart` - Application form
- `lib/screens/jobs/my_applications_screen.dart` - Worker's applications
- `lib/screens/jobs/job_applications_screen.dart` - Client reviews applications
- `lib/screens/jobs/my_jobs_screen.dart` - Client's posted jobs

### Testing Checklist

- [ ] Worker can apply to jobs
- [ ] Client can view applications
- [ ] Client can accept/reject applications
- [ ] Accepting application changes job status to IN_PROGRESS
- [ ] Worker can see their application history
- [ ] Client can see their posted jobs

---

## 🔨 WEEK 4: Job Completion & Payment

### Backend Tasks

#### 1. Create Mobile Job Status Endpoints

```python
# Worker marks job complete
@mobile_router.post("/jobs/{job_id}/mark-complete")
def mobile_worker_mark_complete(request, job_id: int):
    pass

# Client approves completion and pays remaining
@mobile_router.post("/jobs/{job_id}/approve-completion")
def mobile_client_approve_completion(request, job_id: int, payload: ApproveCompletionMobileSchema):
    pass

# Upload job completion photos
@mobile_router.post("/jobs/{job_id}/upload-photos")
def mobile_upload_job_photos(request, job_id: int):
    pass

# Cash payment proof upload
@mobile_router.post("/jobs/{job_id}/upload-payment-proof")
def mobile_upload_payment_proof(request, job_id: int):
    pass
```

#### 2. Create Mobile Schemas

```python
class ApproveCompletionMobileSchema(Schema):
    final_payment_method: str  # 'WALLET' | 'GCASH' | 'CASH'
    notes: Optional[str]
```

### Frontend Tasks

#### 1. Create Payment Service

**File:** `lib/services/payment_service.dart`

```dart
class PaymentService {
  // Pay escrow (50% downpayment)
  Future<Map<String, dynamic>> payEscrow({
    required int jobId,
    required String paymentMethod,
  }) async {}

  // Pay remaining (50% on completion)
  Future<Map<String, dynamic>> payRemaining({
    required int jobId,
    required String paymentMethod,
  }) async {}

  // Get wallet balance
  Future<Map<String, dynamic>> getWalletBalance() async {}

  // Add funds to wallet
  Future<Map<String, dynamic>> addFunds({
    required double amount,
    required String paymentMethod,
  }) async {}
}
```

#### 2. Build Screens

- `lib/screens/jobs/job_completion_screen.dart` - Worker marks complete
- `lib/screens/jobs/approve_completion_screen.dart` - Client approves
- `lib/screens/wallet/add_funds_screen.dart` - Top up wallet

### Testing Checklist

- [ ] Worker can mark job complete
- [ ] Client sees completion request
- [ ] Client can select final payment method
- [ ] Wallet payment deducts correctly
- [ ] GCash payment redirects to Xendit
- [ ] Cash payment uploads proof
- [ ] Both parties can review after payment

---

## 🔨 WEEK 5: Reviews & KYC

### Backend Tasks

```python
# Submit review
@mobile_router.post("/jobs/{job_id}/submit-review")
def mobile_submit_review(request, job_id: int, payload: ReviewMobileSchema):
    pass

# Get user reviews
@mobile_router.get("/users/{user_id}/reviews")
def mobile_get_user_reviews(request, user_id: int):
    pass

# Upload KYC documents
@mobile_router.post("/kyc/upload")
def mobile_upload_kyc(request):
    pass

# Check KYC status
@mobile_router.get("/kyc/status")
def mobile_kyc_status(request):
    pass
```

### Frontend Tasks

- Build review screens
- Build KYC upload flow
- Wire to mobile KYC endpoints

---

## 🔨 WEEK 6: Real-Time Chat

### Backend Tasks

```python
# Get conversations
@mobile_router.get("/chat/conversations")
def mobile_get_conversations(request):
    pass

# Get messages
@mobile_router.get("/chat/{conversation_id}/messages")
def mobile_get_messages(request, conversation_id: int):
    pass

# Send message
@mobile_router.post("/chat/{conversation_id}/send")
def mobile_send_message(request, conversation_id: int, payload: SendMessageMobileSchema):
    pass
```

### Frontend Tasks

- Create WebSocket service
- Build chat screens
- Implement real-time updates

---

## 📋 Mobile API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mobile/auth/login` | POST | Mobile login (returns tokens in JSON) |
| `/api/mobile/auth/register` | POST | Mobile registration |
| `/api/mobile/auth/profile` | GET | Get current user profile |
| `/api/mobile/auth/assign-role` | POST | Assign CLIENT/WORKER role |
| `/api/mobile/jobs/list` | GET | Paginated job listings |
| `/api/mobile/jobs/{id}` | GET | Job details |
| `/api/mobile/jobs/create` | POST | Create job posting |
| `/api/mobile/jobs/search` | GET | Search jobs |
| `/api/mobile/jobs/{id}/apply` | POST | Apply to job |
| `/api/mobile/applications/my-applications` | GET | Worker's applications |
| `/api/mobile/jobs/{id}/applications` | GET | Job applications (client) |
| `/api/mobile/applications/{id}/status` | PUT | Accept/reject application |
| `/api/mobile/jobs/{id}/mark-complete` | POST | Worker marks complete |
| `/api/mobile/jobs/{id}/approve-completion` | POST | Client approves & pays |
| `/api/mobile/jobs/{id}/submit-review` | POST | Submit review |
| `/api/mobile/kyc/upload` | POST | Upload KYC documents |
| `/api/mobile/chat/conversations` | GET | Get conversations |
| `/api/mobile/chat/{id}/messages` | GET | Get messages |

---

## 🎯 Current Status

### Completed ✅
- Week 1: Authentication & Foundation (Backend + Frontend)

### In Progress 🔨
- Week 2: Job Posting & Browsing (Starting backend endpoints)

### Upcoming 📋
- Week 3-6: Applications, Payment, Reviews, Chat

---

## 📝 Development Workflow

For each feature week:

1. **Backend First:**
   - Create mobile router endpoints in `api.py`
   - Create mobile schemas in `schemas.py`
   - Create mobile service functions in `mobile_services.py`
   - Test endpoints with Postman/curl

2. **Frontend Next:**
   - Create service class in `lib/services/`
   - Update `api_config.dart` with new endpoints
   - Build screens and widgets
   - Wire services to UI

3. **Integration:**
   - Test complete flow (backend → frontend)
   - Fix bugs and edge cases
   - Document any issues

4. **Testing:**
   - Manual testing on emulator
   - Test error scenarios
   - Verify payment flows

---

**Status:** Week 1 Complete ✅ | Week 2 In Progress 🔨
**Last Updated:** November 8, 2025

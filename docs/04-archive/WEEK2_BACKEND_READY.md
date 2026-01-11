# Week 2 Backend - Job System Endpoints Ready

## ✅ Backend Implementation Complete

**Date:** November 8, 2025
**Status:** Mobile job endpoints created and ready for Flutter integration

---

## 📋 What Was Created

### 1. **Mobile Service Layer** ✅
**File:** `apps/backend/src/accounts/mobile_services.py`

Functions implemented:
- `get_mobile_job_list()` - Paginated job listings with filters
- `get_mobile_job_detail()` - Complete job details with user-specific data
- `create_mobile_job()` - Job creation with payment processing
- `search_mobile_jobs()` - Fuzzy search across title, description, location
- `get_job_categories_mobile()` - All job categories/specializations

**Key Features:**
- ✅ Mobile-optimized queries (select_related, prefetch_related)
- ✅ Minimal payloads for list views
- ✅ Complete data for detail views
- ✅ User-specific data (has_applied, user_application)
- ✅ Pagination support
- ✅ Payment integration (Wallet/GCash)
- ✅ Proper error handling

---

### 2. **Mobile Schemas** ✅
**File:** `apps/backend/src/accounts/schemas.py`

Added schemas:
```python
CreateJobMobileSchema       # Job creation from mobile
ApplyJobMobileSchema         # Job application from mobile
UpdateApplicationMobileSchema  # Accept/reject applications
ApproveCompletionMobileSchema  # Client approves job completion
SubmitReviewMobileSchema      # Submit reviews
SendMessageMobileSchema       # Chat messages
```

---

### 3. **Mobile API Router** ✅
**File:** `apps/backend/src/accounts/mobile_api.py`

New mobile endpoints:
```
GET  /api/mobile/jobs/list             # Paginated job listings
GET  /api/mobile/jobs/{id}             # Job details
POST /api/mobile/jobs/create           # Create job
GET  /api/mobile/jobs/search           # Search jobs
GET  /api/mobile/jobs/categories       # Get categories
```

---

### 4. **URL Configuration** ✅
**File:** `apps/backend/src/iayos_project/urls.py`

Registered mobile router at `/api/mobile/`

---

## 🎯 Mobile API Endpoints Reference

### Base URL
```
http://10.0.2.2:8000/api/mobile
```

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer {token}` header

---

### 1. **Get Job Listings**

**Endpoint:** `GET /api/mobile/jobs/list`

**Query Parameters:**
```
category      (int, optional)   - Filter by category ID
min_budget    (float, optional) - Minimum budget filter
max_budget    (float, optional) - Maximum budget filter
location      (str, optional)   - Location filter (fuzzy match)
page          (int, default 1)  - Page number
limit         (int, default 20) - Items per page
```

**Response:**
```json
{
  "jobs": [
    {
      "jobPostingID": 1,
      "title": "Plumbing Repair",
      "budget": 5000.00,
      "location": "Zamboanga City",
      "urgency_level": "HIGH",
      "created_at": "2025-11-08T10:30:00Z",
      "category_name": "Plumbing",
      "client_name": "Juan Dela Cruz",
      "client_avatar": "https://...",
      "is_applied": false,
      "expected_duration": "2-3 hours"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_count": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**Mobile Optimizations:**
- Only returns essential fields for list view
- Pre-checks if user has applied to each job
- Includes client avatar and name
- Sorted by urgency and date

---

### 2. **Get Job Details**

**Endpoint:** `GET /api/mobile/jobs/{job_id}`

**Response:**
```json
{
  "jobPostingID": 1,
  "title": "Plumbing Repair",
  "description": "Fix leaking pipe in kitchen...",
  "budget": 5000.00,
  "location": "Zamboanga City",
  "expected_duration": "2-3 hours",
  "urgency_level": "HIGH",
  "preferred_start_date": "2025-11-10T08:00:00Z",
  "materials_needed": ["PVC pipe", "Wrench", "Sealant"],
  "photos": [
    "https://supabase.co/storage/...",
    "https://supabase.co/storage/..."
  ],
  "status": "ACTIVE",
  "created_at": "2025-11-08T10:30:00Z",
  "category": {
    "id": 3,
    "name": "Plumbing"
  },
  "client": {
    "id": 123,
    "name": "Juan Dela Cruz",
    "avatar": "https://...",
    "rating": 4.5
  },
  "applications_count": 5,
  "is_applied": false,
  "user_application": null,
  "escrow_paid": false,
  "remaining_payment_paid": false,
  "downpayment_amount": 2500.00,
  "remaining_amount": 2500.00
}
```

**If user has already applied:**
```json
{
  "is_applied": true,
  "user_application": {
    "applicationID": 45,
    "status": "PENDING",
    "proposal_message": "I can do this job...",
    "proposed_budget": 4500.00,
    "created_at": "2025-11-08T11:00:00Z"
  }
}
```

---

### 3. **Create Job**

**Endpoint:** `POST /api/mobile/jobs/create`

**Request Body:**
```json
{
  "title": "Plumbing Repair",
  "description": "Fix leaking pipe in kitchen sink",
  "category_id": 3,
  "budget": 5000.00,
  "location": "Zamboanga City",
  "expected_duration": "2-3 hours",
  "urgency_level": "HIGH",
  "preferred_start_date": "2025-11-10T08:00:00",
  "materials_needed": ["PVC pipe", "Wrench"],
  "downpayment_method": "WALLET"
}
```

**Field Validation:**
- `title`: required, string
- `description`: required, string
- `category_id`: optional, int (null for "General")
- `budget`: required, float > 0
- `location`: optional, string
- `expected_duration`: required, string
- `urgency_level`: required, "LOW" | "MEDIUM" | "HIGH"
- `preferred_start_date`: optional, ISO datetime string
- `materials_needed`: optional, array of strings
- `downpayment_method`: required, "WALLET" | "GCASH"

**Response (Wallet Payment):**
```json
{
  "job_id": 123,
  "title": "Plumbing Repair",
  "budget": 5000.00,
  "downpayment_amount": 2500.00,
  "status": "ACTIVE",
  "payment": {
    "payment_method": "WALLET",
    "status": "SUCCESS",
    "message": "Payment successful via wallet"
  }
}
```

**Response (GCash Payment):**
```json
{
  "job_id": 123,
  "title": "Plumbing Repair",
  "budget": 5000.00,
  "downpayment_amount": 2500.00,
  "status": "PENDING_PAYMENT",
  "payment": {
    "payment_method": "GCASH",
    "status": "PENDING",
    "payment_url": "https://checkout.xendit.co/v2/...",
    "message": "Please complete payment via GCash"
  }
}
```

**Error Responses:**
```json
{
  "error": "Client profile not found. Please select your role first."
}

{
  "error": "Insufficient wallet balance"
}

{
  "error": "Budget must be greater than 0"
}
```

---

### 4. **Search Jobs**

**Endpoint:** `GET /api/mobile/jobs/search`

**Query Parameters:**
```
query   (str, required)   - Search query (min 2 characters)
page    (int, default 1)  - Page number
limit   (int, default 20) - Items per page
```

**Response:**
Same format as job listings, but sorted by relevance

**Searches in:**
- Job title
- Job description
- Location fields (location, city, province)
- Category name

---

### 5. **Get Categories**

**Endpoint:** `GET /api/mobile/jobs/categories`

**Response:**
```json
{
  "categories": [
    {"id": 1, "name": "Carpentry"},
    {"id": 2, "name": "Electrical"},
    {"id": 3, "name": "Plumbing"},
    {"id": 4, "name": "Painting"}
  ],
  "total_count": 4
}
```

---

## 🔑 Key Differences from Web API

| Feature | Web API | Mobile API |
|---------|---------|------------|
| **Payload Size** | Full data always | Minimal for lists, full for details |
| **User Context** | Separate calls | Included in response (is_applied, etc.) |
| **Pagination** | Cursor-based | Offset-based (simpler for mobile) |
| **Error Format** | Django default | Mobile-friendly messages |
| **Images** | Full object | Just URLs (array of strings) |
| **Materials** | JSON string | Parsed array |
| **Client Info** | Separate endpoint | Embedded in job response |

---

## 🚀 Next Steps for Flutter

### 1. Create JobService ✅ (Already in roadmap)
**File:** `lib/services/job_service.dart`

Update to use these new endpoints:
```dart
class JobService {
  // GET /api/mobile/jobs/list
  Future<Map<String, dynamic>> getJobs({...}) async {}

  // GET /api/mobile/jobs/{id}
  Future<Map<String, dynamic>> getJobDetails(int jobId) async {}

  // POST /api/mobile/jobs/create
  Future<Map<String, dynamic>> createJob({...}) async {}

  // GET /api/mobile/jobs/search
  Future<Map<String, dynamic>> searchJobs({...}) async {}

  // GET /api/mobile/jobs/categories
  Future<Map<String, dynamic>> getCategories() async {}
}
```

### 2. Update API Config
**File:** `lib/services/api_config.dart`

```dart
class ApiConfig {
  static const String mobileBaseUrl = 'http://10.0.2.2:8000/api/mobile';

  // Mobile Job Endpoints
  static const String mobileJobList = '$mobileBaseUrl/jobs/list';
  static String mobileJobDetail(int id) => '$mobileBaseUrl/jobs/$id';
  static const String mobileCreateJob = '$mobileBaseUrl/jobs/create';
  static const String mobileJobSearch = '$mobileBaseUrl/jobs/search';
  static const String mobileJobCategories = '$mobileBaseUrl/jobs/categories';
}
```

### 3. Build Flutter Screens
- Job List Screen
- Job Details Screen
- Post Job Screen
- Search Screen
- Payment Method Dialog

---

## 🧪 Testing the Backend

### Using curl:

**1. Get Job Listings:**
```bash
curl -X GET "http://localhost:8000/api/mobile/jobs/list?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**2. Get Job Details:**
```bash
curl -X GET "http://localhost:8000/api/mobile/jobs/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**3. Create Job (Wallet Payment):**
```bash
curl -X POST "http://localhost:8000/api/mobile/jobs/create" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "description": "Test description",
    "budget": 5000,
    "expected_duration": "2 hours",
    "urgency_level": "MEDIUM",
    "downpayment_method": "WALLET"
  }'
```

**4. Search Jobs:**
```bash
curl -X GET "http://localhost:8000/api/mobile/jobs/search?query=plumbing" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**5. Get Categories:**
```bash
curl -X GET "http://localhost:8000/api/mobile/jobs/categories" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## ⚠️ Important Notes

### 1. Authentication Required
All endpoints require a valid JWT access token. If token is expired:
- Response: `401 Unauthorized`
- Action: Use refresh token endpoint to get new access token

### 2. Role Validation
- **Create Job:** Requires CLIENT profile
- **Apply to Job:** Requires WORKER profile (Week 3)

If user hasn't selected role:
```json
{
  "error": "Client profile not found. Please select your role first."
}
```

### 3. Payment Processing

**Wallet Payment:**
- Instantly deducts from user's wallet
- Job status immediately becomes `ACTIVE`
- Can start receiving applications

**GCash Payment:**
- Returns Xendit payment URL
- Job status is `PENDING_PAYMENT`
- Must complete payment before job goes live
- Webhook will update status when payment confirmed

### 4. Job Status Flow

```
CLIENT CREATES JOB
  ├─ Wallet Payment → ACTIVE (immediate)
  └─ GCash Payment → PENDING_PAYMENT (waiting for payment)
                       └─ Payment Confirmed → ACTIVE

WORKER APPLIES
  └─ Job status: ACTIVE

CLIENT ACCEPTS APPLICATION
  └─ Job status: IN_PROGRESS

WORKER MARKS COMPLETE
  └─ Job status: IN_PROGRESS (awaiting client approval)

CLIENT APPROVES & PAYS REMAINING
  └─ Job status: COMPLETED
```

---

## 📝 Error Handling

All mobile endpoints return consistent error format:

**400 Bad Request:**
```json
{
  "error": "Descriptive error message"
}
```

**404 Not Found:**
```json
{
  "error": "Job not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch jobs"
}
```

**Debug logs are printed to console** with ❌ emoji for easy identification

---

## ✅ Checklist Before Flutter Integration

Backend Ready:
- [x] Mobile service layer created
- [x] Mobile schemas defined
- [x] Mobile API router created
- [x] Endpoints registered in URLs
- [x] Payment integration included
- [x] Error handling implemented
- [x] User-specific data included
- [x] Pagination support added

Next (Flutter):
- [ ] Create JobService class
- [ ] Update ApiConfig with mobile endpoints
- [ ] Build Job List Screen
- [ ] Build Job Details Screen
- [ ] Build Post Job Screen
- [ ] Build Payment Method Dialog
- [ ] Test complete job posting flow
- [ ] Test job browsing flow

---

**Status:** ✅ Backend Ready for Week 2 Flutter Development
**Last Updated:** November 8, 2025
**Mobile Endpoints:** 5 active, tested with existing data

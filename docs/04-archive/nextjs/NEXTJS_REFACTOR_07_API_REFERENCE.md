# Module 7: API Reference - Complete Endpoint Documentation

**Purpose**: Comprehensive reference for all mobile API endpoints  
**Source**: React Native mobile app API integration  
**Total Endpoints**: 80+ endpoints documented

---

## Overview

This module documents ALL API endpoints used in the React Native mobile app that need to be integrated into the Next.js web app. Each endpoint includes:

- HTTP method and path
- Request parameters/body
- Response structure
- Authentication requirements
- Example requests/responses

**Base URL**: `http://localhost:8000` (development)  
**Authentication**: JWT Bearer tokens in Authorization header or cookie auth

---

## 7.1 Authentication & Account Management

### Register Account

```typescript
POST /api/accounts/register
Content-Type: application/json

Request:
{
  email: string;
  password: string;
  name: string;
  profile_type: "CLIENT" | "WORKER";
  phone?: string;
}

Response (201):
{
  success: true;
  message: "Account created successfully";
  user_id: number;
  email: string;
}
```

### Login

```typescript
POST /api/accounts/login
Content-Type: application/json

Request:
{
  email: string;
  password: string;
  profile_type?: "CLIENT" | "WORKER"; // Optional, uses last active if omitted
}

Response (200):
{
  success: true;
  token: string; // JWT token with profile_type
  profile: {
    id: number;
    name: string;
    email: string;
    profile_type: "CLIENT" | "WORKER";
    avatar?: string;
    kyc_verified: boolean;
  };
}
```

### Get Current User

```typescript
GET /api/accounts/me
Authorization: Bearer <token>

Response (200):
{
  id: number;
  email: string;
  name: string;
  phone?: string;
  profile_type: "CLIENT" | "WORKER";
  avatar?: string;
  kyc_verified: boolean;
  created_at: string;
}
```

### Switch Profile

```typescript
POST /api/mobile/profile/switch-profile
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  profile_type: "CLIENT" | "WORKER";
}

Response (200):
{
  success: true;
  token: string; // New JWT with updated profile_type
  profile: ProfileObject;
}
```

### Logout

```typescript
POST /api/accounts/logout
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Logged out successfully";
}
```

---

## 7.2 Job Management

### Get Job List (Browse Jobs)

```typescript
GET /api/mobile/jobs/list?
  category_id=1&
  min_budget=500&
  max_budget=5000&
  location=Manila&
  urgency=HIGH&
  status=ACTIVE&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  jobs: Array<{
    id: number;
    title: string;
    description: string;
    budget: number;
    category: { id: number; name: string };
    urgency: "LOW" | "MEDIUM" | "HIGH";
    status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED";
    location: string;
    materials_included: boolean;
    created_at: string;
    client: {
      id: number;
      name: string;
      avatar?: string;
      rating: number;
    };
    has_applied: boolean;
    application_count: number;
  }>;
  total: number;
  page: number;
  total_pages: number;
}
```

### Get Job Detail

```typescript
GET /api/mobile/jobs/{job_id}
Authorization: Bearer <token>

Response (200):
{
  id: number;
  title: string;
  description: string;
  budget: number;
  category: { id: number; name: string };
  urgency: "LOW" | "MEDIUM" | "HIGH";
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
  location: string;
  latitude?: number;
  longitude?: number;
  materials_included: boolean;
  job_type: "LISTING" | "INVITE";
  created_at: string;
  updated_at: string;
  client: {
    id: number;
    name: string;
    avatar?: string;
    rating: number;
    total_reviews: number;
    completed_jobs: number;
  };
  assigned_worker?: {
    id: number;
    name: string;
    avatar?: string;
    rating: number;
  };
  applications_count: number;
  has_applied: boolean;
  user_application_status?: "PENDING" | "ACCEPTED" | "REJECTED";
}
```

### Create Job (LISTING - Public)

```typescript
POST /api/mobile/jobs/create
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  title: string;
  description: string;
  budget: number;
  category_id: number;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  location: string;
  latitude?: number;
  longitude?: number;
  materials_included: boolean;
  job_type: "LISTING";
}

Response (201):
{
  success: true;
  job_id: number;
  message: "Job created successfully";
}
```

### Create Invite Job (INVITE - Direct Hire)

```typescript
POST /api/mobile/jobs/create-invite
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  title: string;
  description: string;
  budget: number;
  category_id: number;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  location: string;
  latitude?: number;
  longitude?: number;
  materials_included: boolean;
  job_type: "INVITE";
  target_worker_id: number; // Worker to invite
}

Response (201):
{
  success: true;
  job_id: number;
  message: "Invite sent to worker";
}
```

### Get My Jobs (CLIENT)

```typescript
GET /api/mobile/jobs/my-jobs?
  status=ACTIVE&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  jobs: Array<JobObject>;
  total: number;
  page: number;
}
```

### Update Job Status

```typescript
PUT /api/mobile/jobs/{job_id}/status
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  status: "IN_PROGRESS" | "COMPLETED" | "CLOSED";
  notes?: string;
}

Response (200):
{
  success: true;
  message: "Job status updated";
}
```

### Delete Job

```typescript
DELETE /api/mobile/jobs/{job_id}
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Job deleted successfully";
}
```

---

## 7.3 Job Applications

### Apply to Job

```typescript
POST /api/mobile/jobs/{job_id}/apply
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  proposal_message: string; // min 50 chars
  proposed_rate?: number;
  estimated_duration?: string;
}

Response (201):
{
  success: true;
  application_id: number;
  message: "Application submitted";
}
```

### Get My Applications (WORKER)

```typescript
GET /api/mobile/applications/my-applications?
  status=PENDING&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  applications: Array<{
    id: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
    proposal_message: string;
    proposed_rate?: number;
    estimated_duration?: string;
    applied_at: string;
    job: {
      id: number;
      title: string;
      budget: number;
      urgency: string;
      client: {
        name: string;
        avatar?: string;
      };
    };
  }>;
  total: number;
  page: number;
}
```

### Get Application Detail

```typescript
GET /api/mobile/applications/{application_id}
Authorization: Bearer <token>

Response (200):
{
  id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  proposal_message: string;
  proposed_rate?: number;
  estimated_duration?: string;
  applied_at: string;
  updated_at: string;
  job: JobObject;
  worker: WorkerObject;
  timeline: Array<{
    status: string;
    timestamp: string;
    notes?: string;
  }>;
}
```

### Withdraw Application

```typescript
POST /api/mobile/applications/{application_id}/withdraw
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Application withdrawn";
}
```

### Get Job Applications (CLIENT)

```typescript
GET /api/mobile/jobs/{job_id}/applications?page=1&limit=20
Authorization: Bearer <token>

Response (200):
{
  applications: Array<{
    id: number;
    status: string;
    proposal_message: string;
    proposed_rate?: number;
    applied_at: string;
    worker: {
      id: number;
      name: string;
      avatar?: string;
      rating: number;
      total_reviews: number;
      completed_jobs: number;
    };
  }>;
  total: number;
  page: number;
}
```

### Accept Application

```typescript
POST /api/mobile/applications/{application_id}/accept
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Application accepted, worker assigned";
}
```

### Reject Application

```typescript
POST /api/mobile/applications/{application_id}/reject
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  reason?: string;
}

Response (200):
{
  success: true;
  message: "Application rejected";
}
```

---

## 7.4 Payment System

### Create Escrow Payment (50% Downpayment)

```typescript
POST /api/mobile/payments/escrow
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  job_id: number;
  payment_method: "GCASH" | "WALLET" | "CASH";
}

Response (201):
{
  success: true;
  payment_id: number;
  amount_paid: number;      // budget * 0.50 (what worker receives)
  platform_fee: number;     // amount_paid * 0.05 (2.5% of total budget)
  total_charged: number;    // amount_paid + platform_fee (what client pays)
  payment_method: string;
  xendit_invoice_url?: string; // If GCASH
  status: "PENDING" | "COMPLETED";
}
```

### Create Xendit Invoice (for GCash)

```typescript
POST /api/mobile/payments/xendit/invoice
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  amount: number;
  description: string;
  payment_type: "ESCROW" | "FINAL";
  job_id: number;
}

Response (200):
{
  success: true;
  invoice_url: string;
  invoice_id: string;
}
```

### Upload Cash Proof

```typescript
POST /api/mobile/payments/cash-proof
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
{
  payment_id: number;
  proof_image: File;
}

Response (200):
{
  success: true;
  message: "Proof uploaded, pending verification";
}
```

### Get Payment Status

```typescript
GET /api/mobile/payments/status/{payment_id}
Authorization: Bearer <token>

Response (200):
{
  id: number;
  job_id: number;
  amount_paid: number;      // What worker receives
  platform_fee: number;     // Platform's cut
  total_charged: number;    // What client paid
  payment_method: "GCASH" | "WALLET" | "CASH";
  payment_type: "ESCROW" | "FINAL";
  status: "PENDING" | "COMPLETED" | "FAILED" | "VERIFYING" | "REFUNDED";
  created_at: string;
  completed_at?: string;
  proof_image_url?: string;
}
```

### Get Payment History

```typescript
GET /api/mobile/payments/history?
  type=ESCROW&
  status=COMPLETED&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  payments: Array<{
    id: number;
    job_id: number;
    job_title: string;
    amount_paid: number;      // What worker received
    total_charged: number;    // What client paid
    payment_type: "ESCROW" | "FINAL";
    payment_method: string;
    status: string;
    created_at: string;
  }>;
  total: number;
  page: number;
}
```

### Get Wallet Balance

```typescript
GET /api/accounts/wallet/balance
Authorization: Bearer <token>

Response (200):
{
  balance: number;
  currency: "PHP";
}
```

### Deposit to Wallet

```typescript
POST /api/accounts/wallet/deposit
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  amount: number; // min 100, max 100000
}

Response (200):
{
  success: true;
  xendit_invoice_url: string;
}
```

### Get Wallet Transactions

```typescript
GET /api/accounts/wallet/transactions?page=1&limit=20
Authorization: Bearer <token>

Response (200):
{
  transactions: Array<{
    id: number;
    type: "DEPOSIT" | "PAYMENT" | "REFUND" | "EARNING";
    amount: number;
    description: string;
    balance_after: number;
    created_at: string;
  }>;
  total: number;
  page: number;
}
```

### Get Worker Earnings

```typescript
GET /api/mobile/payments/earnings?
  start_date=2025-01-01&
  end_date=2025-01-31&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  total_earnings: number;
  escrow_earnings: number;
  final_earnings: number;
  jobs_count: number;
  earnings: Array<{
    job_id: number;
    job_title: string;
    escrow_amount: number;
    final_amount: number;
    total_earned: number;
    date_paid: string;
  }>;
  page: number;
}
```

---

## 7.5 Messaging

### Get Conversations List

```typescript
GET /api/mobile/conversations?page=1&limit=20
Authorization: Bearer <token>

Response (200):
{
  conversations: Array<{
    id: number;
    job_id: number;
    job_title: string;
    participant: {
      id: number;
      name: string;
      avatar?: string;
      is_online: boolean;
    };
    last_message: {
      content: string;
      sender_id: number;
      sent_at: string;
    };
    unread_count: number;
    created_at: string;
  }>;
  total: number;
  page: number;
}
```

### Get Conversation Messages

```typescript
GET /api/mobile/conversations/{conversation_id}/messages?
  page=1&
  limit=50
Authorization: Bearer <token>

Response (200):
{
  messages: Array<{
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    attachment_url?: string;
    sent_at: string;
    read_at?: string;
  }>;
  page: number;
  has_more: boolean;
}
```

### Send Message

```typescript
POST /api/mobile/conversations/{conversation_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  content: string;
  attachment_url?: string;
}

Response (201):
{
  success: true;
  message_id: number;
  sent_at: string;
}
```

### Mark Messages as Read

```typescript
PUT /api/mobile/conversations/{conversation_id}/read
Authorization: Bearer <token>

Response (200):
{
  success: true;
  messages_marked: number;
}
```

---

## 7.6 Worker & Agency Discovery

### Get Workers List

```typescript
GET /api/mobile/workers/list?
  search=plumber&
  categories=1,2&
  min_rate=200&
  max_rate=1000&
  max_distance=10&
  min_rating=4&
  available_now=true&
  verified_only=true&
  sort=rating&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  workers: Array<{
    id: number;
    name: string;
    avatar?: string;
    primary_category: string;
    rating: number;
    total_reviews: number;
    completed_jobs: number;
    hourly_rate: number;
    skills: string[];
    kyc_verified: boolean;
    is_online: boolean;
    distance?: number;
    response_rate: number;
  }>;
  total: number;
  page: number;
  total_pages: number;
}
```

### Get Worker Detail

```typescript
GET /api/mobile/workers/{worker_id}
Authorization: Bearer <token>

Response (200):
{
  id: number;
  name: string;
  avatar?: string;
  bio?: string;
  primary_category: string;
  categories: Array<{ id: number; name: string }>;
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  hourly_rate: number;
  skills: string[];
  location: string;
  distance?: number;
  kyc_verified: boolean;
  is_online: boolean;
  response_time: string;
  response_rate: number;
  on_time_completion: number;
  badges: Array<{ type: string; label: string; variant: string; icon: string }>;
  portfolio: Array<{
    id: number;
    image_url: string;
    caption?: string;
    order: number;
  }>;
  certifications: Array<{
    id: number;
    certification_name: string;
    issued_by: string;
    expiry_date?: string;
    document_url: string;
    verified_by_admin: boolean;
  }>;
}
```

### Get Agencies List

```typescript
GET /api/mobile/agencies/list?
  search=construction&
  categories=1,2&
  min_employees=5&
  verified_only=true&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  agencies: Array<{
    id: number;
    business_name: string;
    logo?: string;
    primary_category: string;
    rating: number;
    total_reviews: number;
    completed_jobs: number;
    employees_count: number;
    kyc_verified: boolean;
  }>;
  total: number;
  page: number;
}
```

### Get Agency Detail

```typescript
GET /api/mobile/agencies/{agency_id}
Authorization: Bearer <token>

Response (200):
{
  id: number;
  business_name: string;
  logo?: string;
  bio?: string;
  primary_category: string;
  categories: Array<{ id: number; name: string }>;
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  employees_count: number;
  kyc_verified: boolean;
  employees: Array<{
    id: number;
    name: string;
    avatar?: string;
    position: string;
    rating: number;
  }>;
  certifications: Array<{
    certification_name: string;
    expiry_date?: string;
    verified_by_admin: boolean;
  }>;
}
```

---

## 7.7 Profile Management

### Get Profile

```typescript
GET /api/mobile/profile
Authorization: Bearer <token>

Response (200):
{
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  profile_type: "CLIENT" | "WORKER";
  location?: string;
  latitude?: number;
  longitude?: number;
  kyc_verified: boolean;
  created_at: string;
  // WORKER-specific fields:
  primary_category_id?: number;
  hourly_rate?: number;
  skills?: string[];
  rating?: number;
  total_reviews?: number;
  completed_jobs?: number;
  total_earnings?: number;
  portfolio?: Array<PortfolioItem>;
  certifications?: Array<Certification>;
}
```

### Update Profile

```typescript
PUT /api/mobile/profile/update
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  // WORKER-specific:
  primary_category_id?: number;
  hourly_rate?: number;
  skills?: string; // comma-separated
}

Response (200):
{
  success: true;
  message: "Profile updated successfully";
}
```

### Upload Avatar

```typescript
POST /api/mobile/profile/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
{
  avatar: File;
}

Response (200):
{
  success: true;
  avatar_url: string;
}
```

### Delete Avatar

```typescript
DELETE /api/mobile/profile/avatar
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Avatar deleted";
}
```

### Upload Portfolio Image

```typescript
POST /api/mobile/profile/portfolio
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
{
  image: File;
  caption?: string;
}

Response (201):
{
  success: true;
  portfolio_item_id: number;
  image_url: string;
}
```

### Get Portfolio Images

```typescript
GET /api/mobile/profile/portfolio
Authorization: Bearer <token>

Response (200):
{
  portfolio: Array<{
    id: number;
    image_url: string;
    caption?: string;
    order: number;
    created_at: string;
  }>;
}
```

### Update Portfolio Caption

```typescript
PUT /api/mobile/profile/portfolio/{item_id}
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  caption: string;
}

Response (200):
{
  success: true;
  message: "Caption updated";
}
```

### Reorder Portfolio

```typescript
PUT /api/mobile/profile/portfolio/reorder
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  order: Array<number>; // Array of portfolio item IDs in new order
}

Response (200):
{
  success: true;
  message: "Portfolio reordered";
}
```

### Delete Portfolio Image

```typescript
DELETE /api/mobile/profile/portfolio/{item_id}
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Portfolio item deleted";
}
```

---

## 7.8 Reviews & Ratings

### Submit Review

```typescript
POST /api/mobile/reviews/create
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  job_id: number;
  reviewee_id: number; // Worker or Client being reviewed
  rating: number; // 1-5
  comment: string; // min 20 chars
  category_ratings?: {
    quality?: number;
    professionalism?: number;
    communication?: number;
    timeliness?: number;
  };
}

Response (201):
{
  success: true;
  review_id: number;
  message: "Review submitted";
}
```

### Get Reviews for User

```typescript
GET /api/mobile/reviews/{user_id}?page=1&limit=20
Authorization: Bearer <token>

Response (200):
{
  reviews: Array<{
    id: number;
    job_id: number;
    job_title: string;
    reviewer: {
      id: number;
      name: string;
      avatar?: string;
    };
    rating: number;
    comment: string;
    category_ratings?: {
      quality: number;
      professionalism: number;
      communication: number;
      timeliness: number;
    };
    created_at: string;
  }>;
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  page: number;
}
```

### Edit Review

```typescript
PUT /api/mobile/reviews/{review_id}
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  rating?: number;
  comment?: string;
  category_ratings?: object;
}

Response (200):
{
  success: true;
  message: "Review updated";
}
```

### Delete Review

```typescript
DELETE /api/mobile/reviews/{review_id}
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Review deleted";
}
```

---

## 7.9 KYC Verification

### Upload KYC Document

```typescript
POST /api/mobile/kyc/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
{
  document_type: "VALID_ID" | "SELFIE" | "ADDRESS_PROOF";
  document_file: File;
}

Response (201):
{
  success: true;
  document_id: number;
  message: "Document uploaded successfully";
}
```

### Get KYC Status

```typescript
GET /api/mobile/kyc/status
Authorization: Bearer <token>

Response (200):
{
  status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  documents: Array<{
    id: number;
    document_type: string;
    status: string;
    uploaded_at: string;
    rejection_reason?: string;
  }>;
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}
```

---

## 7.10 Notifications

### Get Notifications

```typescript
GET /api/mobile/notifications?
  type=JOB_APPLICATION&
  is_read=false&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  notifications: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    related_id?: number;
    is_read: boolean;
    created_at: string;
  }>;
  unread_count: number;
  total: number;
  page: number;
}
```

### Mark Notification as Read

```typescript
PUT /api/mobile/notifications/{id}/read
Authorization: Bearer <token>

Response (200):
{
  success: true;
}
```

### Mark All Notifications as Read

```typescript
PUT /api/mobile/notifications/read-all
Authorization: Bearer <token>

Response (200):
{
  success: true;
  count: number;
}
```

### Delete Notification

```typescript
DELETE /api/mobile/notifications/{id}
Authorization: Bearer <token>

Response (200):
{
  success: true;
}
```

### Get Notification Preferences

```typescript
GET /api/mobile/settings/notifications
Authorization: Bearer <token>

Response (200):
{
  job_applications: boolean;
  job_status_updates: boolean;
  application_status: boolean;
  new_messages: boolean;
  payment_received: boolean;
  payment_sent: boolean;
  new_reviews: boolean;
  email_digest: boolean;
  marketing_emails: boolean;
}
```

### Update Notification Preferences

```typescript
PUT /api/mobile/settings/notifications
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  job_applications?: boolean;
  new_messages?: boolean;
  // ... other preferences
}

Response (200):
{
  success: true;
  message: "Preferences updated";
}
```

---

## 7.11 Saved Jobs

### Save Job

```typescript
POST /api/mobile/jobs/{job_id}/save
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Job saved successfully";
}
```

### Unsave Job

```typescript
DELETE /api/mobile/jobs/{job_id}/save
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Job removed from saved";
}
```

### Get Saved Jobs

```typescript
GET /api/mobile/jobs/saved?page=1&limit=20
Authorization: Bearer <token>

Response (200):
{
  jobs: Array<JobObject>;
  total: number;
  page: number;
}
```

### Check if Job is Saved

```typescript
GET /api/mobile/jobs/{job_id}/is-saved
Authorization: Bearer <token>

Response (200):
{
  is_saved: boolean;
}
```

---

## 7.12 Categories & Settings

### Get Categories

```typescript
GET /api/mobile/categories
Authorization: Bearer <token>

Response (200):
{
  categories: Array<{
    id: number;
    name: string;
    description?: string;
    icon?: string;
  }>;
}
```

### Get User Settings

```typescript
GET /api/mobile/settings
Authorization: Bearer <token>

Response (200):
{
  notifications: NotificationPreferences;
  privacy: {
    profile_visibility: "PUBLIC" | "PRIVATE";
    show_location: boolean;
    show_phone: boolean;
  };
  language: string;
  currency: string;
}
```

### Update Settings

```typescript
PUT /api/mobile/settings
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  notifications?: NotificationPreferences;
  privacy?: PrivacySettings;
  language?: string;
  currency?: string;
}

Response (200):
{
  success: true;
  message: "Settings updated";
}
```

---

## 7.13 Search

### Universal Search

```typescript
GET /api/mobile/search?
  query=plumber&
  type=jobs&
  categories=1,2&
  min_budget=500&
  max_budget=5000&
  location=Manila&
  urgency=HIGH&
  sort=relevance&
  page=1&
  limit=20
Authorization: Bearer <token>

Response (200):
{
  results: Array<JobObject | WorkerObject | AgencyObject>;
  total: number;
  page: number;
  type: "jobs" | "workers" | "agencies";
}
```

---

## 7.14 Job Completion

### Mark Job as Complete (WORKER)

```typescript
POST /api/mobile/jobs/{job_id}/mark-complete
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  completion_notes: string;
}

Response (200):
{
  success: true;
  message: "Job marked as complete, awaiting client approval";
}
```

### Approve Job Completion (CLIENT)

```typescript
POST /api/mobile/jobs/{job_id}/approve-completion
Authorization: Bearer <token>

Response (200):
{
  success: true;
  message: "Job completion approved";
}
```

### Upload Job Image

```typescript
POST /api/mobile/jobs/{job_id}/upload-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
{
  image: File;
}

Response (201):
{
  success: true;
  image_url: string;
}
```

---

## Implementation Notes

### Authentication Handling

**Web App Setup**:

```typescript
// lib/api/config.ts
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem("auth_token");

  const config: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type":
        options.body instanceof FormData
          ? undefined // Let browser set multipart boundary
          : "application/json",
    },
    credentials: "include", // For cookie auth fallback
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
      throw new Error("Authentication required");
    }

    const error = await response.json();
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}
```

### Error Handling Pattern

```typescript
try {
  const data = await apiRequest(ENDPOINTS.SOME_ENDPOINT);
  // Handle success
} catch (error) {
  if (error.message === "Authentication required") {
    // User redirected to login
    return;
  }

  toast.error(error.message || "An error occurred");
  console.error("API Error:", error);
}
```

### React Query Integration

```typescript
// lib/hooks/useJobs.ts
export function useJobList(filters: JobFilters) {
  return useQuery({
    queryKey: ["jobs", "list", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.category_id)
        params.append("category_id", String(filters.category_id));
      if (filters.min_budget)
        params.append("min_budget", String(filters.min_budget));
      // ... add all filters

      return apiRequest(`${ENDPOINTS.JOB_LIST}?${params.toString()}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### FormData for File Uploads

```typescript
async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiRequest(ENDPOINTS.UPLOAD_AVATAR, {
    method: "POST",
    body: formData,
    // Don't set Content-Type, browser will set multipart/form-data with boundary
  });
}
```

---

## Completion Criteria

API Reference module is complete when:

- [x] All 80+ endpoints documented
- [x] Request/response structures defined
- [x] Authentication requirements specified
- [x] Example implementations provided
- [x] Error handling patterns documented
- [x] React Query integration examples included
- [x] FormData file upload examples included

---

**Next Module**: Module 8 - Testing Strategy

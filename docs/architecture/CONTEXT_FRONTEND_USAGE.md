# iAyos Frontend API Usage - Web & Mobile

**Generated**: November 20, 2025  
**Frontend Applications**: 2 (Web + Mobile)

---

## 📱 Mobile App API Usage

**Location**: `apps/frontend_mobile/iayos_mobile/`  
**Framework**: React Native (Expo) + TypeScript  
**API Config**: `lib/api/config.ts` (293 lines, 80+ endpoints)  
**State Management**: React Query (TanStack Query)

### Mobile API Configuration

```typescript
// Base URLs
const API_URL = __DEV__
  ? "http://192.168.1.117:8000" // Development
  : "https://api.iayos.com"; // Production

export const API_BASE_URL = `${API_URL}/api`;
export const WS_BASE_URL = __DEV__
  ? "ws://192.168.1.117:8001"
  : "wss://ws.iayos.com";
```

### Mobile Request Helper

```typescript
// Built-in timeout (15 seconds) and Bearer token injection
export const apiRequest = async (
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> => {
  // Auto-inject Bearer token from AsyncStorage
  const token = await AsyncStorage.getItem("access_token");

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string> | undefined),
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // 15-second timeout with AbortController
  // credentials: "include" for cookie fallback
  return fetch(url, { ...options, headers: defaultHeaders });
};
```

### Mobile Endpoint Definitions (80+ endpoints)

**Authentication** (5 endpoints):

```typescript
LOGIN: `${API_BASE_URL}/mobile/auth/login`,
LOGOUT: `${API_BASE_URL}/mobile/auth/logout`,
REGISTER: `${API_BASE_URL}/mobile/auth/register`,
ME: `${API_BASE_URL}/mobile/auth/profile`,
ASSIGN_ROLE: `${API_BASE_URL}/mobile/auth/assign-role`,
```

**Jobs** (14 endpoints):

```typescript
AVAILABLE_JOBS: `${API_BASE_URL}/mobile/jobs/available`,
MY_JOBS: (status?) => `${API_BASE_URL}/mobile/jobs/my-jobs${status ? `?status=${status}` : ''}`,
JOB_DETAILS: (id) => `${API_BASE_URL}/mobile/jobs/${id}`,
APPLY_JOB: (id) => `${API_BASE_URL}/jobs/${id}/apply`,
MY_APPLICATIONS: `${API_BASE_URL}/jobs/my-applications`,
MARK_COMPLETE: (id) => `${API_BASE_URL}/jobs/${id}/mark-complete`,
APPROVE_COMPLETION: (id) => `${API_BASE_URL}/jobs/${id}/approve-completion`,
ACTIVE_JOBS: `${API_BASE_URL}/jobs/my-active-jobs`,
UPLOAD_JOB_PHOTOS: (id) => `${API_BASE_URL}/jobs/${id}/upload-photos`,
```

**Phase 3: Job Browsing** (7 endpoints):

```typescript
JOB_CATEGORIES: `${API_BASE_URL}/mobile/jobs/categories`,
JOB_SEARCH: (query, page, limit) => `${API_BASE_URL}/mobile/jobs/search?query=${query}&page=${page}&limit=${limit}`,
JOB_LIST_FILTERED: (filters) => `${API_BASE_URL}/mobile/jobs/list?${params}`,
SAVE_JOB: (id) => `${API_BASE_URL}/mobile/jobs/${id}/save`,
UNSAVE_JOB: (id) => `${API_BASE_URL}/mobile/jobs/${id}/save`,
SAVED_JOBS: `${API_BASE_URL}/mobile/jobs/saved`,
```

**Phase 4: Worker Profile** (4 endpoints):

```typescript
WORKER_PROFILE: `${API_BASE_URL}/mobile/profile`,
UPDATE_WORKER_PROFILE: `${API_BASE_URL}/mobile/profile`,
APPLICATION_DETAIL: (id) => `${API_BASE_URL}/mobile/applications/${id}`,
WITHDRAW_APPLICATION: (id) => `${API_BASE_URL}/mobile/applications/${id}/withdraw`,
```

**Phase 5: Photo Upload** (7 endpoints):

```typescript
UPLOAD_AVATAR: `${API_BASE_URL}/mobile/profile/avatar`,
DELETE_AVATAR: `${API_BASE_URL}/mobile/profile/avatar`,
UPLOAD_PORTFOLIO_IMAGE: `${API_BASE_URL}/mobile/profile/portfolio`,
PORTFOLIO_LIST: `${API_BASE_URL}/mobile/profile/portfolio`,
PORTFOLIO_UPDATE: (id) => `${API_BASE_URL}/mobile/profile/portfolio/${id}`,
PORTFOLIO_REORDER: `${API_BASE_URL}/mobile/profile/portfolio/reorder`,
PORTFOLIO_DELETE: (id) => `${API_BASE_URL}/mobile/profile/portfolio/${id}`,
```

**Phase 6: Certifications & Materials** (4 endpoints):

```typescript
CERTIFICATIONS: `${API_BASE_URL}/mobile/profile/certifications`,
CERTIFICATION_DETAIL: (id) => `${API_BASE_URL}/mobile/profile/certifications/${id}`,
MATERIALS: `${API_BASE_URL}/mobile/profile/materials`,
MATERIAL_DETAIL: (id) => `${API_BASE_URL}/mobile/profile/materials/${id}`,
```

**Worker & Agency Discovery** (5 endpoints):

```typescript
NEARBY_WORKERS: `${API_BASE_URL}/mobile/workers/list`,
WORKER_DETAIL: (id) => `${API_BASE_URL}/mobile/workers/detail/${id}`,
AGENCY_DETAIL: (id) => `${API_BASE_URL}/mobile/agencies/detail/${id}`,
AGENCIES_LIST: `${API_BASE_URL}/mobile/agencies/list`,
```

**Locations** (2 endpoints):

```typescript
GET_CITIES: `${API_BASE_URL}/mobile/locations/cities`,
GET_BARANGAYS: (cityId) => `${API_BASE_URL}/mobile/locations/cities/${cityId}/barangays`,
```

**Wallet** (3 endpoints):

```typescript
WALLET_BALANCE: `${API_BASE_URL}/mobile/wallet/balance`,
TRANSACTIONS: `${API_BASE_URL}/mobile/wallet/transactions`,
DEPOSIT: `${API_BASE_URL}/mobile/wallet/deposit`,
```

**Phase 3: Escrow Payment** (10 endpoints):

```typescript
CREATE_ESCROW_PAYMENT: `${API_BASE_URL}/mobile/payments/escrow`,
CREATE_XENDIT_INVOICE: `${API_BASE_URL}/mobile/payments/xendit/invoice`,
UPLOAD_CASH_PROOF: `${API_BASE_URL}/mobile/payments/cash-proof`,
PAYMENT_STATUS: (id) => `${API_BASE_URL}/mobile/payments/status/${id}`,
PAYMENT_HISTORY: `${API_BASE_URL}/mobile/payments/history`,
WALLET_DEPOSIT: `${API_BASE_URL}/mobile/wallet/deposit`,
WALLET_TRANSACTIONS: `${API_BASE_URL}/mobile/wallet/transactions`,
CREATE_JOB_WITH_PAYMENT: `${API_BASE_URL}/jobs/create-mobile`,
XENDIT_WEBHOOK: `${API_BASE_URL}/payments/xendit/callback`,
PAYMENT_RECEIPT: (id) => `${API_BASE_URL}/mobile/payments/receipt/${id}`,
```

**Phase 4: Final Payment** (8 endpoints):

```typescript
CREATE_FINAL_PAYMENT: `${API_BASE_URL}/mobile/payments/final`,
JOB_PAYMENT_STATUS: (id) => `${API_BASE_URL}/jobs/${id}/payment-status`,
JOB_EARNINGS: (id) => `${API_BASE_URL}/jobs/${id}/earnings`,
PAYMENT_TIMELINE: (id) => `${API_BASE_URL}/jobs/${id}/payment-timeline`,
EARNINGS_SUMMARY: `${API_BASE_URL}/accounts/earnings/summary`,
EARNINGS_HISTORY: `${API_BASE_URL}/accounts/earnings/history`,
CASH_PAYMENT_STATUS: (id) => `${API_BASE_URL}/mobile/payments/cash-status/${id}`,
CREATE_PAYMENT_NOTIFICATION: `${API_BASE_URL}/notifications/payment`,
```

**Phase 5: Real-Time Chat** (4 endpoints):

```typescript
CONVERSATIONS: `${API_BASE_URL}/profiles/chat/conversations`,
CONVERSATION_MESSAGES: (id) => `${API_BASE_URL}/profiles/chat/conversations/${id}`,
SEND_MESSAGE: `${API_BASE_URL}/profiles/chat/messages`,
UPLOAD_MESSAGE_IMAGE: (convId) => `${API_BASE_URL}/profiles/chat/${convId}/upload-image`,
```

**Phase 9: Notifications** (8 endpoints):

```typescript
NOTIFICATIONS: `${API_BASE_URL}/accounts/notifications`,
MARK_NOTIFICATION_READ: (id) => `${API_BASE_URL}/accounts/notifications/${id}/mark-read`,
MARK_ALL_NOTIFICATIONS_READ: `${API_BASE_URL}/accounts/notifications/mark-all-read`,
UNREAD_NOTIFICATIONS_COUNT: `${API_BASE_URL}/accounts/notifications/unread-count`,
REGISTER_PUSH_TOKEN: `${API_BASE_URL}/accounts/register-push-token`,
UPDATE_NOTIFICATION_SETTINGS: `${API_BASE_URL}/accounts/notification-settings`,
GET_NOTIFICATION_SETTINGS: `${API_BASE_URL}/accounts/notification-settings`,
DELETE_NOTIFICATION: (id) => `${API_BASE_URL}/accounts/notifications/${id}/delete`,
```

**Phase 7: KYC** (3 endpoints):

```typescript
KYC_STATUS: `${API_BASE_URL}/accounts/kyc-status`,
UPLOAD_KYC: `${API_BASE_URL}/accounts/upload-kyc`,
KYC_APPLICATION_HISTORY: `${API_BASE_URL}/accounts/kyc-application-history`,
```

**Phase 8: Reviews** (6 endpoints):

```typescript
SUBMIT_REVIEW: `${API_BASE_URL}/accounts/reviews/submit`,
WORKER_REVIEWS: (workerId, page, limit, sort) => `${API_BASE_URL}/accounts/reviews/worker/${workerId}?...`,
REVIEW_STATS: (workerId) => `${API_BASE_URL}/accounts/reviews/stats/${workerId}`,
MY_REVIEWS: `${API_BASE_URL}/accounts/reviews/my-reviews`,
EDIT_REVIEW: (reviewId) => `${API_BASE_URL}/accounts/reviews/${reviewId}`,
REPORT_REVIEW: (reviewId) => `${API_BASE_URL}/accounts/reviews/${reviewId}/report`,
```

---

## 🌐 Web App API Usage

**Location**: `apps/frontend_web/`  
**Framework**: Next.js 15.5.3 + React 19 + TypeScript  
**API Modules**: 5 separate files in `lib/api/`

### Web API Configuration

```typescript
// lib/api/config.ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// All web requests use credentials: "include" for cookie-based auth
const response = await fetch(`${API_BASE_URL}/accounts/me`, {
  method: "GET",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
});
```

### Web API Modules

**1. Jobs API** (`lib/api/jobs.ts` - 602 lines)

```typescript
// Types
export interface JobPosting {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: string;
  location: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  // ... more fields
}

export interface WorkerListing {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  hourlyRate: string;
  // ... more fields
}

export interface AgencyListing {
  agencyId: number;
  businessName: string;
  averageRating: number;
  completedJobs: number;
  // ... more fields
}

// Functions (examples)
export async function fetchJobPostings(): Promise<JobPosting[]>;
export async function fetchWorkerListings(): Promise<WorkerListing[]>;
export async function fetchAgencies(): Promise<AgencyListing[]>;
export async function fetchAgencyProfile(id: number): Promise<AgencyProfile>;
export async function submitJobApplication(data: JobApplication): Promise<void>;
```

**2. Wallet API** (`lib/api/wallet.ts` - 123 lines)

```typescript
// Types
export interface WalletBalance {
  balance: number;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  // ... more fields
}

// Functions
export async function fetchWalletBalance(): Promise<number>;
export async function fetchWalletTransactions(): Promise<Transaction[]>;
export async function depositToWallet(
  amount: number,
  paymentMethod: string
): Promise<{
  success: boolean;
  payment_url?: string;
  new_balance?: number;
}>;
export async function requestWithdrawal(
  amount: number,
  bankAccount: string
): Promise<void>;
```

**3. Chat API** (`lib/api/chat.ts`)

```typescript
// Functions for messaging
export async function fetchConversations();
export async function fetchMessages(conversationId: number);
export async function sendMessage(data: MessageData);
export async function markMessagesAsRead(conversationId: number);
```

**4. Worker Profile API** (`lib/api/worker-profile.ts` - 353 lines)

```typescript
// Worker Phase 1 API functions
export async function updateWorkerProfile(data: WorkerProfileUpdate);
export async function getProfileCompletion(): Promise<number>;
export async function addCertification(data: CertificationData, file?: File);
export async function getCertifications(): Promise<Certification[]>;
export async function updateCertification(id: number, data: CertificationData);
export async function deleteCertification(id: number);
export async function uploadPortfolioImage(file: File, caption?: string);
export async function getPortfolio(): Promise<PortfolioImage[]>;
export async function updatePortfolioCaption(id: number, caption: string);
export async function reorderPortfolio(imageIds: number[]);
export async function deletePortfolioImage(id: number);
```

**5. Config** (`lib/api/config.ts`)

```typescript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Default fetch options for all web requests
export const defaultFetchOptions: RequestInit = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};
```

---

## 🔗 Mobile React Query Hooks

**Location**: `apps/frontend_mobile/iayos_mobile/lib/hooks/`  
**Total Hooks**: 20+ custom hooks using React Query

### Authentication Hooks

**`useAuth.ts`** - Not found (auth context used instead)  
**`useLogout.ts`** (59 lines):

```typescript
export const useLogout = () => {
  const { logout: contextLogout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.LOGOUT, {
        method: "POST",
      });
      // ... handle logout
    },
    onSuccess: () => {
      contextLogout(); // Clear AsyncStorage
      router.replace("/auth/login");
    },
  });
};
```

### Job Hooks

**`useJobs.ts`** (200+ lines):

```typescript
// Browse jobs with filters
export const useJobs = (filters: JobFilters) => {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      const url = ENDPOINTS.JOB_LIST_FILTERED(filters);
      const response = await apiRequest(url);
      return response.json();
    },
  });
};

// Get job details
export const useJobDetails = (jobId: string) => {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const url = ENDPOINTS.JOB_DETAILS(parseInt(jobId));
      const response = await apiRequest(url);
      return response.json();
    },
  });
};

// Get my applications
export const useMyApplications = () => {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const data = await fetchJson<any>(ENDPOINTS.MY_APPLICATIONS);
      return data.applications || [];
    },
  });
};
```

**`useJobSearch.ts`** (80 lines):

```typescript
export const useJobSearch = (query: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["job-search", query, page],
    queryFn: async () => {
      const url = ENDPOINTS.JOB_SEARCH(query, page, limit);
      const response = await apiRequest(url);
      return response.json();
    },
    enabled: query.length > 0,
  });
};
```

**`useSaveJob.ts`** (70 lines):

```typescript
export const useSaveJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(ENDPOINTS.SAVE_JOB(jobId), {
        method: "POST",
        credentials: "include",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });
};
```

**`useSavedJobs.ts`** (60 lines):

```typescript
export const useSavedJobs = () => {
  return useQuery({
    queryKey: ["saved-jobs"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.SAVED_JOBS);
      return response.json();
    },
  });
};
```

**`useMyJobs.ts`** (150 lines):

```typescript
export const useMyJobs = (status?: "ACTIVE" | "IN_PROGRESS" | "COMPLETED") => {
  return useQuery({
    queryKey: ["jobs", "my-jobs", status],
    queryFn: async () => {
      const endpoint = status
        ? `${ENDPOINTS.MY_JOBS}?status=${status}`
        : ENDPOINTS.MY_JOBS;
      const response = await apiRequest(endpoint);
      const data = await response.json();
      return data.jobs || [];
    },
  });
};
```

### Profile Hooks

**`useWorkerProfile.ts`** (238 lines):

```typescript
// Get worker profile
export const useWorkerProfile = () => {
  return useQuery({
    queryKey: ["worker-profile"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.WORKER_PROFILE);
      return response.json();
    },
  });
};

// Update worker profile
export const useUpdateWorkerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const response = await apiRequest(ENDPOINTS.UPDATE_WORKER_PROFILE, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
    },
  });
};
```

**`useImageUpload.ts`** (304 lines):

```typescript
// Upload with progress tracking
export const useImageUpload = () => {
  const [progress, setProgress] = useState(0);

  return useMutation({
    mutationFn: async ({ endpoint, file }: UploadParams) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgress(percent);
        });

        xhr.open("POST", endpoint);
        // ... handle upload
      });
    },
  });
};
```

### Certification & Portfolio Hooks

**`useCertifications.ts`** (268 lines):

```typescript
// List certifications
export const useCertifications = () => {
  return useQuery({
    queryKey: ["certifications"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.CERTIFICATIONS, {
        credentials: "include",
      });
      return response.json();
    },
  });
};

// Add certification
export const useAddCertification = () => {
  return useMutation({
    mutationFn: async (data: CertificationData) => {
      // FormData upload with file
    },
  });
};
```

**`usePortfolioManagement.ts`** (151 lines):

```typescript
// List portfolio images
export const usePortfolio = () => {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.PORTFOLIO_LIST, {
        credentials: "include",
      });
      return response.json();
    },
  });
};

// Reorder portfolio
export const useReorderPortfolio = () => {
  return useMutation({
    mutationFn: async (imageIds: number[]) => {
      const response = await fetch(ENDPOINTS.PORTFOLIO_REORDER, {
        method: "PUT",
        body: JSON.stringify({ image_ids: imageIds }),
      });
      return response.json();
    },
  });
};
```

### Chat Hooks

**`useConversations.ts`** (200+ lines):

```typescript
export const useConversations = (filter = "all") => {
  return useQuery({
    queryKey: ["conversations", filter],
    queryFn: async () => {
      const url = `${ENDPOINTS.CONVERSATIONS}?filter=${filter}`;
      const response = await fetch(url, { credentials: "include" });
      return response.json();
    },
  });
};
```

**`useMessages.ts`** (250+ lines):

```typescript
export const useMessages = (conversationId: number) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const url = ENDPOINTS.CONVERSATION_MESSAGES(conversationId);
      const response = await fetch(url, { credentials: "include" });
      return response.json();
    },
  });
};

export const useSendMessage = () => {
  return useMutation({
    mutationFn: async (data: MessageData) => {
      // Send message via WebSocket or HTTP
    },
  });
};
```

### Notification Hooks

**`useNotifications.ts`** (320+ lines):

```typescript
export const useNotifications = (limit = 50, unreadOnly = false) => {
  return useQuery({
    queryKey: ["notifications", limit, unreadOnly],
    queryFn: async () => {
      const url = `${ENDPOINTS.NOTIFICATIONS}?limit=${limit}&unread_only=${unreadOnly}`;
      const response = await fetch(url, { credentials: "include" });
      return response.json();
    },
  });
};

export const useMarkNotificationRead = () => {
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(
        ENDPOINTS.MARK_NOTIFICATION_READ(notificationId),
        { method: "POST", credentials: "include" }
      );
      return response.json();
    },
  });
};
```

### Review Hooks

**`useReviews.ts`** (220+ lines):

```typescript
export const useWorkerReviews = (
  workerId: number,
  page = 1,
  limit = 20,
  sort = "latest"
) => {
  return useQuery({
    queryKey: ["reviews", workerId, page, sort],
    queryFn: async () => {
      const response = await apiRequest(
        ENDPOINTS.WORKER_REVIEWS(workerId, page, limit, sort)
      );
      return response.json();
    },
  });
};

export const useSubmitReview = () => {
  return useMutation({
    mutationFn: async (data: ReviewData) => {
      const response = await apiRequest(ENDPOINTS.SUBMIT_REVIEW, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });
};
```

### Payment Hooks

**`usePayments.ts`** (planned):

```typescript
// Phase 3 payment hooks (to be implemented)
export const useCreateEscrowPayment = () => {
  /*...*/
};
export const usePaymentStatus = (paymentId: number) => {
  /*...*/
};
export const usePaymentHistory = () => {
  /*...*/
};
```

**`useFinalPayment.ts`** (planned):

```typescript
// Phase 4 final payment hooks (to be implemented)
export const useCreateFinalPayment = () => {
  /*...*/
};
export const useJobEarnings = (jobId: number) => {
  /*...*/
};
export const useEarningsSummary = () => {
  /*...*/
};
```

---

## 📊 API Usage Comparison

| Feature          | Mobile App          | Web App            | Backend Support  |
| ---------------- | ------------------- | ------------------ | ---------------- |
| Authentication   | ✅ JWT Bearer       | ✅ Cookie          | ✅ Both          |
| Job Browsing     | ✅ Full             | ✅ Full            | ✅ Complete      |
| Job Applications | ✅ Full             | ✅ Full            | ✅ Complete      |
| Worker Profiles  | ✅ Full             | ✅ Full            | ✅ Complete      |
| Certifications   | ✅ CRUD             | ✅ CRUD            | ✅ Complete      |
| Portfolio        | ✅ CRUD             | ✅ CRUD            | ✅ Complete      |
| Materials        | ✅ CRUD             | ❌ Not implemented | ✅ Backend ready |
| Wallet           | ✅ View/Deposit     | ✅ Full            | ✅ Complete      |
| Chat/Messaging   | ✅ Full             | ✅ Full            | ✅ Complete      |
| Notifications    | ✅ Push + In-app    | ✅ In-app          | ✅ Complete      |
| Reviews          | ✅ Full             | ✅ Full            | ✅ Complete      |
| KYC Upload       | ✅ Camera + Gallery | ✅ File upload     | ✅ Complete      |
| Payment (Escrow) | ⏳ Planned          | ❌ Not started     | ✅ Backend ready |
| Payment (Final)  | ⏳ Planned          | ❌ Not started     | ✅ Backend ready |

---

## 🔄 Request Flow Examples

### Mobile: Job Application Flow

```typescript
// 1. Browse jobs
const { data: jobs } = useJobs({ category: 1, location: "Zamboanga" });

// 2. View job details
const { data: job } = useJobDetails("123");

// 3. Apply to job
const applyMutation = useApplyJob();
await applyMutation.mutateAsync({
  jobId: 123,
  proposalMessage: "I can help!",
  proposedBudget: 1500,
});

// 4. Check application status
const { data: applications } = useMyApplications();
```

### Web: Worker Profile Management

```typescript
// 1. Update profile
await updateWorkerProfile({
  bio: "Experienced electrician",
  hourly_rate: 350,
});

// 2. Add certification
await addCertification(
  {
    name: "TESDA NC II",
    issuing_organization: "TESDA",
    issue_date: "2023-01-15",
  },
  certificateFile
);

// 3. Upload portfolio
await uploadPortfolioImage(imageFile, "Kitchen renovation project");

// 4. Check completion
const completion = await getProfileCompletion(); // Returns 0-100
```

---

**Last Updated**: November 20, 2025  
**Mobile Hooks**: 20+ React Query hooks  
**Web API Modules**: 5 dedicated files  
**Status**: ✅ Comprehensive frontend documentation

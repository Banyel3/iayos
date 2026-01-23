# iAyos System Architecture - Overview

**Generated**: November 20, 2025  
**Status**: Complete System Analysis  
**Purpose**: Comprehensive architectural context for AI agents and developers

---

## 📋 Document Structure

This architectural documentation is split into focused parts:

1. **CONTEXT_OVERVIEW.md** (this file) - High-level system summary
2. **CONTEXT_BACKEND_API.md** - Complete backend API inventory (140+ endpoints)
3. **CONTEXT_FRONTEND_USAGE.md** - Frontend API usage patterns (Web + Mobile)
4. **CONTEXT_DATABASE.md** - Database models, relationships, and migrations
5. **CONTEXT_INTEGRATION.md** - Integration points, flows, and patterns
6. **CONTEXT_ISSUES.md** - Unused endpoints, technical debt, recommendations

---

## 🎯 System Overview

**iAyos** is a comprehensive marketplace platform connecting clients with blue-collar service workers through a secure, feature-rich ecosystem.

### Tech Stack

- **Backend**: Django 5.2.8 + Django Ninja API + PostgreSQL (Neon) + Django Channels
- **Frontend Web**: Next.js 15.5.3 + React 19 + TypeScript + Tailwind CSS
- **Mobile**: React Native (Expo) with TypeScript
- **Infrastructure**: Docker + Turborepo monorepo + Daphne (ASGI)
- **Payments**: Xendit integration (GCash, invoices)
- **Storage**: Supabase (file uploads)
- **Email**: Resend service

### Project Structure

```
iayos/
├── apps/
│   ├── backend/src/              # Django 5.2 backend
│   │   ├── accounts/             # Auth, users, workers, KYC, reviews
│   │   ├── jobs/                 # Job postings (aliases to accounts.models.Job)
│   │   ├── profiles/             # Chat, wallet, products
│   │   ├── agency/               # Agency management
│   │   ├── client/               # Client-specific (agency discovery)
│   │   ├── adminpanel/           # Admin KYC review, analytics
│   │   └── iayos_project/        # Django settings, URL routing
│   ├── frontend_web/             # Next.js 15 web app
│   │   ├── app/                  # App router pages
│   │   ├── components/           # React components
│   │   ├── lib/api/              # API client functions
│   │   └── prisma/               # Prisma schema (unused, legacy)
│   └── frontend_mobile/          # React Native mobile
│       └── iayos_mobile/
│           ├── app/(tabs)/       # Main tab navigation
│           ├── app/jobs/         # Job-related screens
│           ├── app/profile/      # Profile screens
│           ├── components/       # Reusable components
│           └── lib/              # API config, hooks, utils
└── docs/                         # Comprehensive documentation
    ├── architecture/             # System architecture (this folder)
    ├── mobile/                   # Mobile implementation docs
    ├── features/                 # Feature implementation docs
    └── bug-fixes/                # Bug fix documentation
```

---

## 🔐 Authentication Architecture

### Dual Authentication System

**Web App (Cookie-based)**:

- Uses `cookie_auth` decorator
- JWT tokens stored in HttpOnly cookies
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Endpoints: `/api/accounts/login`, `/api/accounts/refresh`

**Mobile App (Bearer Token)**:

- Uses `jwt_auth` decorator
- JWT tokens stored in AsyncStorage
- Manual token management required
- Endpoints: `/api/mobile/auth/login`, `/api/mobile/auth/refresh`

### Token Structure

```python
# Access Token Payload
{
    "user_id": int,
    "email": str,
    "exp": datetime,  # 15 minutes
    "iat": datetime
}

# Refresh Token Payload
{
    "user_id": int,
    "exp": datetime,  # 7 days
    "iat": datetime,
    "type": "refresh"
}
```

---

## 👥 User Types & Profiles

### Account Types

1. **Individual Worker** - Self-employed service providers
2. **Agency** - Organizations managing multiple workers
3. **Client** - Customers posting jobs

### Profile System

```
Accounts (authentication)
    ├── Profile (user info + profileType)
    │   ├── WorkerProfile (for WORKER type)
    │   │   ├── WorkerCertification (1:N)
    │   │   ├── WorkerPortfolio (1:N)
    │   │   └── workerSpecialization (N:N with Specializations)
    │   ├── ClientProfile (for CLIENT type)
    │   └── Agency (for agency accounts)
    │       └── AgencyEmployee (agency workers)
    └── KYC + KYCFiles (verification documents)
```

---

## 💼 Core Business Flows

### 1. Job Creation & Application Flow

**LISTING Type (Open Applications)**:

```
Client creates job → ACTIVE status
  ↓
Workers apply with proposals
  ↓
Client reviews applications
  ↓
Client accepts one application
  ↓
Job status → IN_PROGRESS
  ↓
Work completion (two-phase)
  ↓
Job status → COMPLETED
```

**INVITE Type (Direct Hire)**:

```
Client creates job with assignedWorkerID or assignedAgencyFK
  ↓
jobType = "INVITE", inviteStatus = "PENDING"
  ↓
Worker/Agency accepts or rejects
  ↓
If accepted: status → IN_PROGRESS
  ↓
Work completion (two-phase)
  ↓
Job status → COMPLETED
```

### 2. Payment Flow (Escrow System)

**Escrow Downpayment (50%)**:

```
Job created with budget
  ↓
Calculate: escrowAmount = budget * 0.5
Platform fee = escrowAmount * 0.05 (5% revenue)
Total charge = escrowAmount + platform_fee
  ↓
Payment methods: WALLET, GCASH, CASH
  ↓
If WALLET: Deduct from client's wallet
If GCASH: Create Xendit invoice → redirect to payment
If CASH: Upload proof → admin verification
  ↓
escrowPaid = True, job can proceed
```

**Final Payment (Remaining 50%)**:

```
Worker marks job complete (workerMarkedComplete = True)
  ↓
Client approves completion (clientMarkedComplete = True)
  ↓
Calculate: remainingPayment = budget * 0.5
  ↓
Payment methods: GCASH or CASH
  ↓
If paid: remainingPaymentPaid = True
  ↓
Release escrowAmount to worker's wallet
  ↓
Job status → COMPLETED
```

### 3. KYC Verification Flow

```
User registers → isVerified = False, KYCVerified = False
  ↓
User uploads KYC documents (ID, clearance, selfie)
  ↓
kyc.kyc_status = "PENDING"
  ↓
Admin reviews in /adminpanel/kyc/all
  ↓
Admin approves → KYCVerified = True, access granted
OR
Admin rejects → User can resubmit
```

### 4. Review System Flow

```
Job completed (status = "COMPLETED")
  ↓
Client can review worker
Worker can review client
  ↓
JobReview created with:
  - rating (1-5 stars)
  - comment (optional)
  - reviewType (CLIENT_TO_WORKER or WORKER_TO_CLIENT)
  ↓
Reviews displayed on profiles
Average ratings calculated
```

---

## 📊 Key Database Tables

### Core Models (34 total)

**Accounts Module** (20 models):

- Accounts, Profile, WorkerProfile, ClientProfile, Agency
- WorkerCertification, WorkerPortfolio, workerSpecialization
- Job, JobPhoto, JobLog, JobApplication, JobDispute
- JobReview, Notification, PushToken, NotificationSettings
- KYC, KYCFiles, Wallet, Transaction

**Profiles Module** (3 models):

- WorkerProduct (materials/supplies)
- Conversation, Message, MessageAttachment

**Agency Module** (2 models):

- AgencyEmployee, EmployeeOfTheMonth

**Admin Module** (2 models):

- KYCLogs

**Location Module** (2 models):

- City, Barangay

---

## 🔌 API Organization

### Backend Routers (7 modules)

1. **/api/accounts/** - Authentication, users, workers, wallet, KYC, reviews (90+ endpoints)
2. **/api/mobile/** - Mobile-optimized endpoints with JWT auth (43 endpoints)
3. **/api/jobs/** - Job CRUD, applications, completion, reviews (45 endpoints)
4. **/api/profiles/** - Chat, products, wallet operations (15 endpoints)
5. **/api/agency/** - Agency management, employees, jobs (15 endpoints)
6. **/api/client/** - Agency discovery, search (4 endpoints)
7. **/api/adminpanel/** - Admin KYC review, analytics (25 endpoints)

**Total Backend Endpoints**: 140+ REST endpoints

### Frontend API Clients

**Web App** (5 API modules):

- `lib/api/config.ts` - Base configuration
- `lib/api/jobs.ts` - Job operations
- `lib/api/wallet.ts` - Wallet operations
- `lib/api/chat.ts` - Messaging
- `lib/api/worker-profile.ts` - Worker profile management

**Mobile App** (1 centralized config):

- `lib/api/config.ts` - All 80+ endpoint definitions
- `lib/hooks/` - 20+ React Query hooks for data fetching

---

## 🚀 Recent Major Features (2025)

### ✅ Completed

1. **Mobile Phase 2** - Two-phase job completion + photo upload
2. **Mobile Phase 3** - Job browsing, search, filtering, saved jobs
3. **Mobile Phase 4** - Worker profile management, applications
4. **Mobile Phase 5** - Avatar & portfolio photo upload
5. **Mobile Phase 6** - Certifications & materials management
6. **Worker Phase 1** - Web profile enhancements (backend + frontend)
7. **Agency Phase 2** - Employee rating management, EOTM
8. **Jobs Tab Redesign** - Universal tabbed interface (My Jobs, In Progress, Past)

### 🚧 Known Issues (Fixed)

1. **Jobs Tab 401 Auth** - Fixed by using `apiRequest()` instead of raw `fetch()`
2. **Jobs Tab 422 Error** - Fixed backend function signature `status: Optional[str] = None`
3. **Assigned Worker UI** - Fixed by adding `assignedWorker` field mapping

---

## 📈 System Scale & Metrics

- **Backend Code**: ~15,000+ lines (Django + services)
- **Frontend Web Code**: ~8,000+ lines (Next.js + React)
- **Mobile Code**: ~12,000+ lines (React Native + TypeScript)
- **Database Migrations**: 42+ migration files
- **API Endpoints**: 140+ REST endpoints
- **React Query Hooks**: 20+ custom hooks
- **TypeScript Interfaces**: 100+ type definitions

---

## 🔗 Related Documentation

- **[CONTEXT_BACKEND_API.md](./CONTEXT_BACKEND_API.md)** - Complete API endpoint inventory
- **[CONTEXT_FRONTEND_USAGE.md](./CONTEXT_FRONTEND_USAGE.md)** - Frontend API usage patterns
- **[CONTEXT_DATABASE.md](./CONTEXT_DATABASE.md)** - Database schema and relationships
- **[CONTEXT_INTEGRATION.md](./CONTEXT_INTEGRATION.md)** - Integration flows and patterns
- **[CONTEXT_ISSUES.md](./CONTEXT_ISSUES.md)** - Technical debt and recommendations

---

## 📝 Quick Reference

### Start Development Servers

```powershell
# Backend
docker-compose -f docker-compose.dev.yml up backend

# Frontend Web
cd apps/frontend_web
npm run dev

# Mobile
cd apps/frontend_mobile/iayos_mobile
npx expo start
```

### Common API Patterns

```typescript
// Mobile API call with auth
import { apiRequest, ENDPOINTS } from "@/lib/api/config";

const response = await apiRequest(ENDPOINTS.MY_JOBS("ACTIVE"), {
  method: "GET",
});

// Web API call with cookies
const response = await fetch("/api/accounts/me", {
  credentials: "include",
});
```

### Database Query Examples

```python
# Get user with related data
from accounts.models import Accounts, Profile, WorkerProfile

user = Accounts.objects.get(email="worker@example.com")
profile = Profile.objects.get(accountFK=user)
worker = WorkerProfile.objects.get(profileID=profile)

# Get job with applications
from accounts.models import Job, JobApplication

job = Job.objects.prefetch_related('applications').get(jobID=123)
applications = job.applications.filter(status="PENDING")
```

---

**Last Updated**: November 20, 2025  
**Status**: ✅ Complete and accurate as of analysis

# Next.js Web App Refactor: Client & Worker Migration Plan

**Status**: 🚧 Planned  
**Priority**: Critical  
**Estimated Duration**: 12-16 weeks  
**Source of Truth**: React Native Mobile App (`apps/frontend_mobile/iayos_mobile`)

---

## Executive Summary

Migrate **80+ features** from React Native mobile app to Next.js web application. The mobile app is the **source of truth** for all business logic, workflows, and API usage patterns.

### Current State Analysis

**Next.js Web App Progress**:

- ✅ Authentication & role selection (complete)
- ✅ Basic job browsing (workers view)
- ✅ INVITE job creation modal (partial - needs payment integration)
- ✅ React Query setup (hooks exist for some features)
- ⚠️ Job detail page (incomplete - missing status tracking, actions)
- ⚠️ My Requests page (3562 lines - needs splitting and refactoring)
- ⚠️ Home page (2032 lines - needs refactoring)
- ❌ Payment system (0% complete)
- ❌ Real-time messaging (0% complete)
- ❌ KYC upload (0% complete)
- ❌ Reviews & ratings (0% complete)
- ❌ Saved jobs (0% complete)
- ❌ Earnings dashboard (0% complete)

**React Native Mobile App** (Source of Truth):

- ✅ Complete job lifecycle (LISTING vs INVITE types)
- ✅ Escrow + Final payment flows (50% + 50% with 5% platform fee)
- ✅ Real-time WebSocket messaging
- ✅ KYC document upload & verification
- ✅ Review & rating system
- ✅ Worker/Agency discovery with filters
- ✅ Profile management (dual profiles, portfolio, certifications)
- ✅ Notifications & saved jobs
- ✅ Earnings tracking

---

## Module Breakdown

### Module 1: Job Workflows (Core Foundation)

**Priority**: Critical  
**Duration**: 2-3 weeks  
**Files**: ~15 new/modified  
**Dependencies**: None

**Features**: Job creation (LISTING/INVITE), browsing, filtering, application system, status management, my jobs list

### Module 2: Payment System (Escrow + Final)

**Priority**: Critical  
**Duration**: 3-4 weeks  
**Files**: ~12 new  
**Dependencies**: Module 1

**Features**: Wallet management, escrow payment (50%), final payment (50%), GCash/Wallet/Cash, Xendit integration, payment tracking

### Module 3: Real-Time Messaging

**Priority**: High  
**Duration**: 2-3 weeks  
**Files**: ~8 new  
**Dependencies**: Module 1

**Features**: WebSocket connection, conversations list, chat interface, image messages, typing indicators, job actions in chat

### Module 4: Trust & Safety (KYC + Reviews)

**Priority**: High  
**Duration**: 2-3 weeks  
**Files**: ~10 new  
**Dependencies**: Module 1

**Features**: KYC document upload, status tracking, review submission, review display, trust badges, moderation

### Module 5: Discovery & Profiles

**Priority**: Medium  
**Duration**: 2-3 weeks  
**Files**: ~12 new/modified  
**Dependencies**: Module 4

**Features**: Worker/Agency browsing with filters, detail pages, profile management, portfolio, certifications, dual profile switching

### Module 6: Engagement Features

**Priority**: Low  
**Duration**: 1-2 weeks  
**Files**: ~8 new  
**Dependencies**: All previous

**Features**: Notification center, saved jobs, earnings dashboard, job search, notification preferences

---

## Module Documentation Files

Each module has a comprehensive implementation guide:

1. **[Module 1: Job Workflows](./NEXTJS_REFACTOR_01_JOB_WORKFLOWS.md)** ✅ - Job creation, browsing, applications, status management
2. **[Module 2: Payment System](./NEXTJS_REFACTOR_02_PAYMENT_SYSTEM.md)** ✅ - Wallet, escrow, final payments, earnings
3. **[Module 3: Messaging](./NEXTJS_REFACTOR_03_MESSAGING.md)** ✅ - Real-time chat with WebSocket integration
4. **[Module 4: Trust & Safety](./NEXTJS_REFACTOR_04_TRUST_SAFETY.md)** ✅ - KYC verification, reviews, trust badges
5. **[Module 5: Discovery & Profiles](./NEXTJS_REFACTOR_05_DISCOVERY_PROFILES.md)** ✅ - Worker/agency browsing, profile management
6. **[Module 6: Engagement](./NEXTJS_REFACTOR_06_ENGAGEMENT.md)** ✅ - Notifications, saved jobs, advanced search
7. **[Module 7: API Reference](./NEXTJS_REFACTOR_07_API_REFERENCE.md)** ✅ - Complete endpoint documentation (80+ endpoints)
8. **[Module 8: Testing Strategy](./NEXTJS_REFACTOR_08_TESTING_STRATEGY.md)** ✅ - Unit, integration, E2E, manual tests

---

## Payment System Critical Details

### Platform Fee Structure (VERIFIED FROM RN APP)

**⚠️ CRITICAL: Worker receives 100% of job budget, client pays platform fee ON TOP**

```
Total Budget: ₱1,000 (listing price - what worker receives)

Downpayment Phase (50%):
├─ Escrow Amount (to worker): ₱500 (50% of budget)
├─ Platform Fee (5% of escrow): ₱25 (2.5% of total budget)
├─ Client Pays: ₱525 (escrow + platform fee)
└─ Worker Receives: ₱500 (full 50% of listing)

Final Payment Phase (50%):
├─ Final Amount (to worker): ₱500 (remaining 50%)
├─ Platform Fee (5% of final): ₱25 (2.5% of total budget)
├─ Client Pays: ₱525 (final + platform fee)
└─ Worker Receives: ₱500 (full 50% of listing)

Total Summary:
├─ Client Total Paid: ₱1,050 (105% of listing price)
├─ Worker Total Received: ₱1,000 (100% of listing price)
└─ Platform Total Earned: ₱50 (5% of listing price)
```

**Calculation Formula** (verified from `apps/frontend_mobile/iayos_mobile/lib/hooks/usePayments.ts`):

```typescript
const jobBudget = 1000; // Worker receives this amount

// Downpayment/Escrow Phase
const halfBudget = jobBudget * 0.5; // ₱500 to worker
const platformFee = halfBudget * 0.05; // ₱25 (5% of escrow = 2.5% of total)
const totalToCharge = halfBudget + platformFee; // ₱525 client pays

// Final Payment Phase (identical calculation)
const halfBudget2 = jobBudget * 0.5; // ₱500 to worker
const platformFee2 = halfBudget2 * 0.05; // ₱25
const totalToCharge2 = halfBudget2 + platformFee2; // ₱525 client pays

// Totals
const totalWorkerReceives = jobBudget; // ₱1,000 (100% of listing)
const totalPlatformFee = platformFee + platformFee2; // ₱50 (5% of listing)
const totalClientPays = totalToCharge + totalToCharge2; // ₱1,050 (105% of listing)
```

**Source Reference**:

- RN App: `apps/frontend_mobile/iayos_mobile/lib/hooks/usePayments.ts` lines 275-289
- Backend: `apps/backend/src/jobs/api.py` lines 108-114
- Comment: "Worker receives full job budget, client pays platform fee on top"

---

## Key Business Rules

### 1. Job Types

- **LISTING**: Public job post where workers apply, client selects winner
- **INVITE**: Direct hire where client invites specific worker or agency

### 2. Job Status Flow

```
ACTIVE
  ↓ [client accepts application OR worker accepts invite]
IN_PROGRESS
  ↓ [client confirms work started] (optional)
IN_PROGRESS (clientConfirmedWorkStarted = true)
  ↓ [worker marks complete]
IN_PROGRESS (workerMarkedComplete = true, awaiting client approval)
  ↓ [client approves completion + pays final payment]
COMPLETED
  ↓ [both parties leave reviews]
CLOSED
```

### 3. Payment Timing

- **INVITE jobs**: Escrow paid immediately when job created
- **LISTING jobs**: Escrow paid when client accepts application
- **Final payment**: Triggered when client approves job completion

### 4. Self-Hiring Prevention

Users cannot:

- Apply to their own job postings
- Be invited to their own jobs
- Hire themselves via dual profiles

### 5. Dual Profiles

- Users can have both CLIENT and WORKER profiles
- Switch seamlessly via `POST /api/mobile/profile/switch-profile`
- JWT token updated with new `profile_type` claim

### 6. Agency Restrictions

- Agencies CANNOT apply to LISTING jobs
- Agencies can ONLY accept INVITE jobs
- Agencies must have `kycStatus = "APPROVED"` to receive invites

### 7. Application Acceptance

- When client accepts an application:
  - Job status → IN_PROGRESS
  - Worker assigned to job
  - All other applications auto-rejected
  - Escrow payment required (if LISTING job)

---

## Implementation Strategy

### Approach

1. **Audit existing code** - Identify reusable vs rebuild
2. **Extract large files** - Split 2000+ line files into components
3. **Implement module** - Follow RN patterns exactly
4. **Test thoroughly** - E2E tests for critical paths
5. **Document deviations** - Note any differences from mobile

### Code Quality Standards

- **Max file size**: 500 lines (extract to components if larger)
- **Type safety**: Full TypeScript, no `any` types
- **Error handling**: Try-catch with user-friendly messages
- **Loading states**: Skeleton loaders preferred over spinners
- **Optimistic updates**: For mutations (save/unsave, like/unlike)
- **Accessibility**: ARIA labels, keyboard navigation, focus management

### Mobile App Parity Rules

- When in doubt, **always follow mobile app patterns**
- Use same API endpoints as mobile app
- Match same validation rules exactly
- Copy error messages verbatim
- Replicate same user flows step-by-step

---

## File Structure

### Existing Files to Refactor

```
apps/frontend_web/
├── app/
│   ├── dashboard/
│   │   ├── home/page.tsx (2032 lines → REFACTOR)
│   │   ├── myRequests/page.tsx (3562 lines → SPLIT)
│   │   ├── jobs/[id]/page.tsx (ENHANCE)
│   │   ├── workers/page.tsx (ENHANCE)
│   │   └── agencies/[id]/page.tsx (EXISTS)
│   └── components/
│       └── client/jobs/InviteJobCreationModal.tsx (823 lines → REFACTOR)
└── lib/
    ├── hooks/
    │   ├── useJobQueries.ts (EXISTS - extend)
    │   ├── useHomeData.ts (EXISTS - extend)
    │   └── useInboxQueries.ts (EXISTS - messaging base)
    └── api/
        └── jobs.ts (EXISTS - extend)
```

### New Files to Create

```
apps/frontend_web/
├── app/dashboard/
│   ├── jobs/
│   │   ├── create/
│   │   │   ├── listing/page.tsx (NEW)
│   │   │   └── invite/page.tsx (NEW)
│   │   ├── my-jobs/page.tsx (NEW)
│   │   ├── saved/page.tsx (NEW)
│   │   ├── search/page.tsx (NEW)
│   │   └── [id]/
│   │       ├── apply/page.tsx (NEW)
│   │       └── applications/page.tsx (NEW)
│   ├── applications/page.tsx (NEW)
│   ├── wallet/
│   │   ├── page.tsx (NEW)
│   │   └── deposit/page.tsx (NEW)
│   ├── payments/
│   │   ├── escrow/[jobId]/page.tsx (NEW)
│   │   ├── final/[jobId]/page.tsx (NEW)
│   │   ├── cash/[jobId]/page.tsx (NEW)
│   │   └── status/[paymentId]/page.tsx (NEW)
│   ├── messages/
│   │   ├── page.tsx (NEW)
│   │   └── [conversationId]/page.tsx (NEW)
│   ├── kyc/
│   │   ├── upload/page.tsx (NEW)
│   │   └── status/page.tsx (NEW)
│   ├── reviews/
│   │   ├── submit/[jobId]/page.tsx (NEW)
│   │   └── [userId]/page.tsx (NEW)
│   ├── earnings/page.tsx (NEW)
│   ├── notifications/page.tsx (NEW)
│   └── profile/
│       ├── portfolio/page.tsx (NEW)
│       └── certifications/page.tsx (NEW)
└── components/
    ├── jobs/
    │   ├── JobCard.tsx (EXTRACT from home)
    │   ├── JobFilters.tsx (NEW)
    │   ├── JobCreateForm.tsx (NEW)
    │   ├── JobStatusBadge.tsx (NEW)
    │   ├── JobActions.tsx (NEW)
    │   └── ApplicationCard.tsx (NEW)
    ├── payments/
    │   ├── PaymentSummary.tsx (NEW)
    │   ├── PaymentMethodSelector.tsx (NEW)
    │   ├── PaymentStatusBadge.tsx (NEW)
    │   └── PaymentTimeline.tsx (NEW)
    ├── wallet/
    │   ├── BalanceCard.tsx (NEW)
    │   └── TransactionHistory.tsx (NEW)
    ├── messaging/
    │   ├── ConversationCard.tsx (NEW)
    │   ├── MessageBubble.tsx (NEW)
    │   └── ChatInput.tsx (NEW)
    ├── profile/
    │   └── ProfileSwitcher.tsx (NEW - dual profile)
    └── shared/
        └── SkeletonLoader.tsx (NEW)
```

---

## Success Criteria

### Module 1 Complete When:

- [ ] Job creation (LISTING + INVITE) works end-to-end
- [ ] Job browsing with all filters functional
- [ ] Application submission and management works
- [ ] Job status updates work correctly
- [ ] All validation matches mobile app
- [ ] 0 TypeScript errors

### Module 2 Complete When:

- [ ] Wallet balance and transactions display
- [ ] Escrow payment (all 3 methods) works
- [ ] Final payment (all 3 methods) works
- [ ] Platform fee (5%) correctly calculated and displayed
- [ ] Payment status tracking real-time
- [ ] Xendit integration functional

### Module 3 Complete When:

- [ ] WebSocket connection stable
- [ ] Text and image messages work
- [ ] Typing indicators functional
- [ ] Job actions in chat work
- [ ] Offline queue implemented

### Module 4 Complete When:

- [ ] KYC upload and status tracking works
- [ ] Review submission works
- [ ] Review display with stats works
- [ ] Trust badges display correctly
- [ ] Moderation features work

### Module 5 Complete When:

- [ ] Worker/Agency browsing with filters works
- [ ] Detail pages complete with all info
- [ ] Profile editing works
- [ ] Portfolio management functional
- [ ] Dual profile switching works

### Module 6 Complete When:

- [ ] Notification center works
- [ ] Saved jobs functional
- [ ] Earnings dashboard displays correctly
- [ ] Job search works
- [ ] All features match mobile app

---

## Documentation Structure

Each module has a dedicated implementation guide:

```
docs/03-planned/
├── NEXTJS_REFACTOR_00_OVERVIEW.md (this file)
├── NEXTJS_REFACTOR_01_JOB_WORKFLOWS.md
├── NEXTJS_REFACTOR_02_PAYMENT_SYSTEM.md
├── NEXTJS_REFACTOR_03_MESSAGING.md
├── NEXTJS_REFACTOR_04_TRUST_SAFETY.md
├── NEXTJS_REFACTOR_05_DISCOVERY_PROFILES.md
├── NEXTJS_REFACTOR_06_ENGAGEMENT.md
├── NEXTJS_REFACTOR_07_API_REFERENCE.md
└── NEXTJS_REFACTOR_08_TESTING_STRATEGY.md
```

---

## Next Steps

1. **Review this overview** with team
2. **Start Module 1** implementation (Job Workflows)
3. **Set up E2E testing** with Playwright
4. **Create component library** for reusable components
5. **Implement incrementally** - test each module before moving forward

---

**Last Updated**: November 25, 2025  
**Next Action**: Begin Module 1 - Job Workflows Implementation

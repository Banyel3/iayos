# Mobile Phase: Client "My Requests" Feature - Progress Tracking

**Feature Name:** Client Job Management ("My Requests")
**Phase:** Client Features - Phase 1
**Started:** November 16, 2025
**Estimated Time:** 60-80 hours
**Platform:** React Native (Expo) - Mobile App

---

## Overview

Implement comprehensive job management features for CLIENT users in the mobile app, allowing them to:
- View all posted jobs (Active, In Progress, Completed)
- Create new job postings
- Review worker applications
- Accept/reject applications
- Track job progress and payments
- Manage job completion workflow

This feature brings parity with the Next.js web app's client dashboard and enables full client functionality on mobile.

---

## Feature Scope

### 1. Job List Management
- ✅ **Active Jobs** - Jobs accepting applications (ACTIVE status)
- ✅ **In Progress Jobs** - Jobs currently being worked on (IN_PROGRESS status)
- ✅ **Completed Jobs** - Finished jobs (COMPLETED status)
- ✅ **Cancelled Jobs** - Cancelled jobs (CANCELLED status)
- ✅ Tab-based navigation between statuses
- ✅ Pull-to-refresh functionality
- ✅ Infinite scroll/pagination
- ✅ Search/filter capabilities

### 2. Job Detail View
- ✅ Complete job information display
- ✅ Payment status breakdown (escrow, final payment)
- ✅ Applications list with count
- ✅ Accept/reject application actions
- ✅ Job cancellation (if ACTIVE)
- ✅ View worker profiles
- ✅ Contact worker (if IN_PROGRESS)

### 3. Job Creation Flow
- ✅ Multi-step job posting form
- ✅ Category selection
- ✅ Budget input with wallet validation
- ✅ Location selection (barangay/city)
- ✅ Photo upload from camera/gallery
- ✅ Materials needed (tag input)
- ✅ Duration and start date

### 4. Application Management
- ✅ View all applications across jobs
- ✅ Application detail view
- ✅ Worker profile preview
- ✅ Accept/reject with confirmation
- ✅ Notification on status changes

---

## Technical Architecture

### Backend API Endpoints (Existing)

All required endpoints already exist in Django backend:

#### Job Management
- `GET /api/jobs/my-jobs` - Get client's posted jobs
- `GET /api/jobs/{job_id}` - Get single job details
- `POST /api/jobs/create` - Create new job posting
- `DELETE /api/jobs/{job_id}` - Cancel job
- `POST /api/jobs/{job_id}/upload-image` - Upload job photos

#### Application Management
- `GET /api/jobs/{job_id}/applications` - Get applications for job
- `POST /api/jobs/{job_id}/applications/{application_id}/accept` - Accept application
- `POST /api/jobs/{job_id}/applications/{application_id}/reject` - Reject application

#### Worker Information
- `GET /api/accounts/users/workers/{user_id}` - Get worker profile

#### Payment Status
- `GET /api/jobs/{job_id}/payment-status` - Get payment status
- `GET /api/jobs/{job_id}/payment-timeline` - Get payment timeline

### Mobile App Structure

#### New Screens (to be created)

```
app/
├── client/
│   ├── my-requests.tsx              # Main job list screen with tabs
│   ├── job-detail/
│   │   └── [jobId].tsx              # Job detail screen
│   ├── create-job/
│   │   └── index.tsx                # Job creation flow
│   └── applications/
│       ├── index.tsx                # All applications view
│       └── [applicationId].tsx      # Single application detail
```

#### Components (to be created)

```
components/Client/
├── PostedJobCard.tsx                # Job card for client view
├── JobStatusBadge.tsx               # Status indicator (Active, In Progress, etc.)
├── ApplicantCard.tsx                # Worker application card
├── JobDetailHeader.tsx              # Job detail top section
├── JobPaymentInfo.tsx               # Payment status display
├── JobApplicationsList.tsx          # List of applications
├── EmptyJobsState.tsx               # Empty state for no jobs
├── ApplicationActionButtons.tsx    # Accept/Reject controls
└── JobCreationForm/
    ├── Step1_BasicInfo.tsx          # Title, category, description
    ├── Step2_Budget.tsx             # Budget and payment info
    ├── Step3_Location.tsx           # Location selection
    ├── Step4_Details.tsx            # Duration, materials, photos
    └── Step5_Review.tsx             # Review before posting
```

#### Custom Hooks (to be created)

```
lib/hooks/
├── useClientJobs.ts                 # Fetch client's posted jobs (with status filter)
├── useJobCreation.ts                # Create new job posting
├── useJobApplications.ts            # Fetch applications for a job
├── useAcceptApplication.ts          # Accept worker application
├── useRejectApplication.ts          # Reject worker application
├── useCancelJob.ts                  # Cancel a job
├── useWorkerProfile.ts              # Fetch worker details
```

#### Type Definitions (to be added)

```typescript
// Extend existing types in types/index.ts

export interface ClientJob {
  id: number;
  title: string;
  description: string;
  budget: number;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  expectedDuration?: string;
  materialsNeeded?: string[];
  photos?: JobPhoto[];
  specializations?: Specialization[];
  location: {
    city: string;
    barangay: string;
  };
  // Payment info
  escrowAmount: number;
  escrowPaid: boolean;
  escrowPaidAt?: string;
  remainingPayment: number;
  remainingPaymentPaid: boolean;
  remainingPaymentPaidAt?: string;
  finalPaymentMethod?: "GCASH" | "CASH";
  // Application stats
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  // Worker info (if accepted)
  assignedWorker?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImg?: string;
    rating?: number;
  };
}

export interface JobApplicationDetail {
  id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  proposalMessage: string;
  proposedBudget: number;
  budgetOption: "ACCEPT" | "NEGOTIATE";
  estimatedDuration?: string;
  appliedAt: string;
  job: {
    id: number;
    title: string;
    budget: number;
  };
  worker: {
    id: number;
    firstName: string;
    lastName: string;
    profileImg?: string;
    rating?: number;
    totalJobsCompleted: number;
    specializations: Specialization[];
    bio?: string;
  };
}

export interface CreateJobPayload {
  title: string;
  description: string;
  budget: number;
  category_id: number;
  location_city: string;
  location_barangay: string;
  expected_duration?: string;
  preferred_start_date?: string;
  materials_needed?: string[];
  urgency?: "LOW" | "MEDIUM" | "HIGH";
}
```

---

## Implementation Plan

### Phase 1: Core Job Listing (20-25 hours)
- ✅ Create custom hooks for job fetching
- ✅ Implement job list screen with tabs
- ✅ Create PostedJobCard component
- ✅ Create JobStatusBadge component
- ✅ Implement pull-to-refresh
- ✅ Implement pagination
- ✅ Add empty states

### Phase 2: Job Detail View (15-20 hours)
- ✅ Create job detail screen
- ✅ Implement JobDetailHeader component
- ✅ Implement JobPaymentInfo component
- ✅ Create JobApplicationsList component
- ✅ Add navigation from list to detail
- ✅ Implement cancellation logic

### Phase 3: Application Management (15-20 hours)
- ✅ Create ApplicantCard component
- ✅ Implement accept/reject hooks
- ✅ Create ApplicationActionButtons component
- ✅ Add worker profile preview
- ✅ Implement all applications view
- ✅ Add confirmation dialogs

### Phase 4: Job Creation Flow (20-25 hours)
- ✅ Design multi-step form flow
- ✅ Create form components for each step
- ✅ Implement image upload
- ✅ Implement category selection
- ✅ Add budget validation
- ✅ Implement location picker
- ✅ Add materials tag input
- ✅ Implement form submission
- ✅ Add success/error handling

### Phase 5: Navigation & Polish (5-10 hours)
- ✅ Update tab navigation for clients
- ✅ Add conditional rendering based on profileType
- ✅ Implement haptic feedback
- ✅ Add loading skeletons
- ✅ Optimize performance
- ✅ Test on both iOS and Android

---

## Files to Create/Modify

### New Files Created (to be tracked)

**Screens:**
1. `app/client/my-requests.tsx` - Main job list
2. `app/client/job-detail/[jobId].tsx` - Job detail
3. `app/client/create-job/index.tsx` - Job creation
4. `app/client/applications/index.tsx` - All applications
5. `app/client/applications/[applicationId].tsx` - Application detail

**Components:**
6. `components/Client/PostedJobCard.tsx`
7. `components/Client/JobStatusBadge.tsx`
8. `components/Client/ApplicantCard.tsx`
9. `components/Client/JobDetailHeader.tsx`
10. `components/Client/JobPaymentInfo.tsx`
11. `components/Client/JobApplicationsList.tsx`
12. `components/Client/EmptyJobsState.tsx`
13. `components/Client/ApplicationActionButtons.tsx`
14. `components/Client/JobCreationForm/Step1_BasicInfo.tsx`
15. `components/Client/JobCreationForm/Step2_Budget.tsx`
16. `components/Client/JobCreationForm/Step3_Location.tsx`
17. `components/Client/JobCreationForm/Step4_Details.tsx`
18. `components/Client/JobCreationForm/Step5_Review.tsx`

**Hooks:**
19. `lib/hooks/useClientJobs.ts`
20. `lib/hooks/useJobCreation.ts`
21. `lib/hooks/useJobApplications.ts`
22. `lib/hooks/useAcceptApplication.ts`
23. `lib/hooks/useRejectApplication.ts`
24. `lib/hooks/useCancelJob.ts`
25. `lib/hooks/useWorkerProfile.ts`

### Files to Modify

26. `types/index.ts` - Add client job types
27. `lib/api/config.ts` - Add client-specific endpoints
28. `app/(tabs)/_layout.tsx` - Update tab navigation logic
29. `app/(tabs)/index.tsx` - Conditional rendering for clients

**Total Files:** ~29 files (create/modify)

---

## Implementation Progress

### Phase 1: Core Job Listing
- [ ] 🚧 Create `useClientJobs.ts` hook
- [ ] ❌ Create `PostedJobCard.tsx` component
- [ ] ❌ Create `JobStatusBadge.tsx` component
- [ ] ❌ Create `EmptyJobsState.tsx` component
- [ ] ❌ Create `my-requests.tsx` screen
- [ ] ❌ Implement tab navigation (Active, In Progress, Completed)
- [ ] ❌ Add pull-to-refresh
- [ ] ❌ Add pagination
- [ ] ❌ Test on iOS
- [ ] ❌ Test on Android

### Phase 2: Job Detail View
- [ ] ❌ Create `JobDetailHeader.tsx` component
- [ ] ❌ Create `JobPaymentInfo.tsx` component
- [ ] ❌ Create `JobApplicationsList.tsx` component
- [ ] ❌ Create `job-detail/[jobId].tsx` screen
- [ ] ❌ Implement navigation from list
- [ ] ❌ Add cancel job functionality
- [ ] ❌ Test job detail flow

### Phase 3: Application Management
- [ ] ❌ Create `useJobApplications.ts` hook
- [ ] ❌ Create `useAcceptApplication.ts` hook
- [ ] ❌ Create `useRejectApplication.ts` hook
- [ ] ❌ Create `useWorkerProfile.ts` hook
- [ ] ❌ Create `ApplicantCard.tsx` component
- [ ] ❌ Create `ApplicationActionButtons.tsx` component
- [ ] ❌ Create `applications/index.tsx` screen
- [ ] ❌ Create `applications/[applicationId].tsx` screen
- [ ] ❌ Add confirmation dialogs
- [ ] ❌ Test accept/reject flow

### Phase 4: Job Creation Flow
- [ ] ❌ Create `useJobCreation.ts` hook
- [ ] ❌ Create `Step1_BasicInfo.tsx` component
- [ ] ❌ Create `Step2_Budget.tsx` component
- [ ] ❌ Create `Step3_Location.tsx` component
- [ ] ❌ Create `Step4_Details.tsx` component
- [ ] ❌ Create `Step5_Review.tsx` component
- [ ] ❌ Create `create-job/index.tsx` screen
- [ ] ❌ Implement multi-step form logic
- [ ] ❌ Add image upload
- [ ] ❌ Add form validation
- [ ] ❌ Test job creation flow

### Phase 5: Navigation & Polish
- [ ] ❌ Update tab layout for conditional rendering
- [ ] ❌ Add haptic feedback
- [ ] ❌ Add loading skeletons
- [ ] ❌ Optimize performance
- [ ] ❌ Final testing on both platforms

---

## API Endpoints to Add to config.ts

```typescript
// Client Job Management
CLIENT_MY_JOBS: `${API_BASE_URL}/jobs/my-jobs`,
CLIENT_JOB_DETAIL: (id: number) => `${API_BASE_URL}/jobs/${id}`,
CLIENT_CREATE_JOB: `${API_BASE_URL}/jobs/create`,
CLIENT_CANCEL_JOB: (id: number) => `${API_BASE_URL}/jobs/${id}/cancel`,
CLIENT_UPLOAD_JOB_PHOTOS: (id: number) => `${API_BASE_URL}/jobs/${id}/upload-image`,

// Application Management
CLIENT_JOB_APPLICATIONS: (jobId: number) => `${API_BASE_URL}/jobs/${jobId}/applications`,
CLIENT_ACCEPT_APPLICATION: (jobId: number, appId: number) =>
  `${API_BASE_URL}/jobs/${jobId}/applications/${appId}/accept`,
CLIENT_REJECT_APPLICATION: (jobId: number, appId: number) =>
  `${API_BASE_URL}/jobs/${jobId}/applications/${appId}/reject`,

// Worker Information
CLIENT_WORKER_PROFILE: (workerId: number) => `${API_BASE_URL}/accounts/users/workers/${workerId}`,
```

---

## Testing Checklist

### Functional Testing
- [ ] Client can view all posted jobs
- [ ] Jobs are filtered correctly by status
- [ ] Job details display correctly
- [ ] Applications list loads properly
- [ ] Accept application works correctly
- [ ] Reject application works correctly
- [ ] Job creation flow completes successfully
- [ ] Image upload works for job photos
- [ ] Job cancellation works
- [ ] Payment status displays correctly

### UI/UX Testing
- [ ] Tab navigation is smooth
- [ ] Pull-to-refresh works
- [ ] Loading states display
- [ ] Empty states display
- [ ] Error messages are clear
- [ ] Confirmation dialogs appear
- [ ] Haptic feedback works
- [ ] Forms validate properly

### Performance Testing
- [ ] Job list loads quickly
- [ ] Pagination works smoothly
- [ ] Images load optimally
- [ ] No memory leaks
- [ ] Smooth scrolling

### Platform Testing
- [ ] All features work on iOS
- [ ] All features work on Android
- [ ] Native UI components render correctly
- [ ] Navigation works on both platforms

---

## Known Issues/Limitations

(To be filled during implementation)

---

## Time Tracking

**Estimated:** 60-80 hours
**Actual:** (To be tracked)

### Time Breakdown:
- Phase 1 (Core Listing): 0h / 20-25h
- Phase 2 (Job Detail): 0h / 15-20h
- Phase 3 (Applications): 0h / 15-20h
- Phase 4 (Job Creation): 0h / 20-25h
- Phase 5 (Polish): 0h / 5-10h

**Total:** 0h / 60-80h

---

## Next Steps

1. ✅ Create progress tracking document (this file)
2. ⏭️ Create QA checklist document
3. ⏭️ Start Phase 1: Core Job Listing implementation
4. ⏭️ Begin with custom hooks for data fetching
5. ⏭️ Create reusable components
6. ⏭️ Implement main job list screen

---

## Notes

- This feature is critical for client users to manage their jobs on mobile
- Design should match Next.js web app but optimized for mobile
- Ensure proper caching with TanStack Query
- Use React Native Paper components for consistency
- Implement proper error handling throughout
- Add comprehensive testing before completion

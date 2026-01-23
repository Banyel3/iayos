# Module 1: Job Workflows Implementation

**Priority**: Critical (Foundation)  
**Duration**: 2-3 weeks  
**Dependencies**: None  
**Files**: ~15 new/modified

---

## Overview

Implement complete job lifecycle matching React Native mobile app patterns. This module is the foundation for all other features.

**RN Source Files**:

- `app/(tabs)/index.tsx` - Home/Browse
- `app/jobs/[id].tsx` - Job detail
- `app/jobs/create-request.tsx` - Job creation
- `app/jobs/browse/[categoryId].tsx` - Category browsing
- `app/applications/index.tsx` - Worker applications
- `app/(tabs)/jobs.tsx` - My Jobs (client view)

---

## 1.1 Job Creation (LISTING vs INVITE)

### Files to Create

```
app/dashboard/jobs/create/listing/page.tsx (NEW - 400 lines)
app/dashboard/jobs/create/invite/page.tsx (NEW - 450 lines)
components/jobs/JobCreateForm.tsx (NEW - 350 lines)
lib/hooks/useJobCreate.ts (NEW - 150 lines)
```

### Features

#### LISTING Job Creation (Public Posting)

Workers apply → Client selects winner → Payment on acceptance

**Form Fields**:

- [ ] **Title** - Text input (3-100 chars, required)
- [ ] **Description** - Textarea (50-1000 chars, required)
- [ ] **Category** - Dropdown (required, from `/api/mobile/jobs/categories`)
- [ ] **Budget** - Number input with ₱ prefix (min ₱100, required)
- [ ] **Location** - Autocomplete from barangays (required)
- [ ] **Expected Duration** - Number + Unit dropdown (hours/days/weeks)
- [ ] **Urgency Level** - Radio buttons (LOW/MEDIUM/HIGH)
- [ ] **Preferred Start Date** - Date picker (optional)
- [ ] **Materials Needed** - Array input with add/remove (optional)

**Validation Rules**:

```typescript
const validateListingJob = (data: JobFormData) => {
  if (data.title.length < 3 || data.title.length > 100) {
    return { error: "Title must be 3-100 characters" };
  }
  if (data.description.length < 50 || data.description.length > 1000) {
    return { error: "Description must be 50-1000 characters" };
  }
  if (data.budget < 100) {
    return { error: "Budget must be at least ₱100" };
  }
  if (!data.category_id) {
    return { error: "Please select a category" };
  }
  if (!data.location) {
    return { error: "Please select a location" };
  }
  return { valid: true };
};
```

**API Endpoint**:

```typescript
POST /api/mobile/jobs/create
{
  title: string;
  description: string;
  category_id: number;
  budget: number;
  location: string;
  expected_duration: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  preferred_start_date?: string;
  materials_needed?: string[];
}

Response:
{
  success: true;
  job_id: number;
  title: string;
  status: "ACTIVE";
  created_at: string;
}
```

#### INVITE Job Creation (Direct Hire)

Client invites specific worker/agency → Worker accepts → Payment immediately

**Additional Fields** (beyond LISTING fields):

- [ ] **Hire Type** - Radio buttons (Worker/Agency)
- [ ] **Select Worker/Agency** - Searchable dropdown with avatar & rating
- [ ] **Payment Method** - Radio buttons (Wallet/GCash/Cash)

**Worker Selection Component**:

```typescript
<WorkerSelector
  type="worker" // or "agency"
  onSelect={(workerId) => setSelectedWorker(workerId)}
  excludeSelf={true}  // Prevent self-hiring
/>
```

**Payment Method Selector**:

```typescript
<PaymentMethodSelector
  onSelect={(method) => setPaymentMethod(method)}
  walletBalance={walletBalance}
  requiredAmount={budget * 0.50}  // Escrow amount
/>
```

**API Endpoint**:

```typescript
POST /api/mobile/jobs/invite
{
  title: string;
  description: string;
  category_id: number;
  budget: number;
  location: string;
  expected_duration: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  preferred_start_date?: string;
  materials_needed?: string[];
  worker_id?: number;  // Either worker_id OR agency_id
  agency_id?: number;
  downpayment_method: "WALLET" | "GCASH" | "CASH";
}

Response:
{
  success: true;
  job_id: number;
  title: string;
  status: "ACTIVE";
  job_type: "INVITE";
  invite_status: "PENDING";
  escrow_amount: number;
  commission_fee: number;
  payment_method: string;
  // If GCASH, includes invoice_url
  invoice_url?: string;
}
```

### Self-Hiring Prevention

```typescript
// In worker/agency selector component
const filteredWorkers = workers.filter(
  (w) => w.account_id !== currentUser.accountID
);

// Backend also validates
if (target_account === user) {
  return { error: "You cannot hire yourself for a job" };
}
```

### Success Flow

**LISTING**:

1. Form submitted → Validation passes
2. API call → Job created with status ACTIVE
3. Toast: "Job posted successfully! Workers can now apply."
4. Redirect to `/dashboard/jobs/my-jobs`

**INVITE**:

1. Form submitted → Validation passes
2. API call → Job created with status ACTIVE, invite_status PENDING
3. If Wallet: Payment deducted, escrow held
4. If GCash: Redirect to Xendit invoice URL
5. If Cash: Redirect to proof upload page
6. Notification sent to worker/agency
7. Toast: "Invitation sent! Waiting for [Worker Name] to respond."
8. Redirect to `/dashboard/jobs/my-jobs`

---

## 1.2 Job Browsing & Filtering

### Files to Modify/Create

```
app/dashboard/home/page.tsx (REFACTOR - currently 2032 lines)
components/jobs/JobCard.tsx (EXTRACT - 200 lines)
components/jobs/JobFilters.tsx (NEW - 300 lines)
components/jobs/JobSkeleton.tsx (NEW - 50 lines)
lib/hooks/useJobsList.ts (ENHANCE existing)
```

### Features

#### Job List Display

- [ ] Grid layout (2 columns desktop, 1 mobile)
- [ ] Pagination (20 jobs per page)
- [ ] Skeleton loaders during fetch
- [ ] Empty state with "Post a Job" CTA
- [ ] Pull-to-refresh (refresh button desktop)

#### Job Card Component

```typescript
<JobCard>
  <JobImage src={job.photos[0]} />
  <JobTitle>{job.title}</JobTitle>
  <JobBudget>₱{job.budget}</JobBudget>
  <JobLocation distance={job.distance} location={job.location} />
  <JobUrgency level={job.urgency} />
  <JobCategory>{job.category}</JobCategory>
  <ClientInfo
    name={job.postedBy.name}
    avatar={job.postedBy.avatar}
    rating={job.postedBy.rating}
  />
  <JobActions>
    <ViewDetailsButton />
    <ApplyButton visible={canApply} />
  </JobActions>
</JobCard>
```

#### Filter Panel

**Category Filter** (Multi-select):

```typescript
<CategoryFilter
  categories={categories}
  selected={selectedCategories}
  onChange={setSelectedCategories}
/>
```

**Budget Range Filter**:

```typescript
<BudgetRangeFilter
  min={minBudget}
  max={maxBudget}
  onChange={(min, max) => {
    setMinBudget(min);
    setMaxBudget(max);
  }}
/>
```

**Location/Distance Filter**:

```typescript
<LocationFilter
  selectedLocation={location}
  maxDistance={maxDistance} // km slider 0-50
  onChange={(loc, dist) => {
    setLocation(loc);
    setMaxDistance(dist);
  }}
/>
```

**Urgency Filter** (Chips):

```typescript
<UrgencyFilter
  selected={selectedUrgency}
  options={['LOW', 'MEDIUM', 'HIGH']}
  onChange={setSelectedUrgency}
/>
```

**Sort Options**:

```typescript
<SortDropdown
  value={sortBy}
  options={[
    { value: 'latest', label: 'Latest' },
    { value: 'budget_high', label: 'Budget: High to Low' },
    { value: 'budget_low', label: 'Budget: Low to High' },
    { value: 'distance', label: 'Distance: Nearest First' },
  ]}
  onChange={setSortBy}
/>
```

#### Search Functionality

```typescript
<SearchBar
  placeholder="Search jobs by title or description..."
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={handleSearch}
  debounce={500}
/>
```

### API Endpoints

**Get Jobs List**:

```typescript
GET /api/mobile/jobs/list?
  category=1,2,3&
  min_budget=500&
  max_budget=5000&
  location=Zamboanga&
  urgency=MEDIUM,HIGH&
  page=1&
  limit=20&
  sort=latest

Response:
{
  jobs: JobPosting[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
}
```

**Search Jobs**:

```typescript
GET /api/mobile/jobs/search?query=plumbing&page=1&limit=20

Response: Same as above
```

### State Management with React Query

```typescript
const useJobsList = (filters: JobFilters) => {
  return useQuery({
    queryKey: ["jobs", "list", filters],
    queryFn: () => fetchJobs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true, // For smooth pagination
  });
};
```

---

## 1.3 Job Detail Page

### Files to Modify/Create

```
app/dashboard/jobs/[id]/page.tsx (ENHANCE existing)
components/jobs/JobStatusBadge.tsx (NEW - 80 lines)
components/jobs/JobActions.tsx (NEW - 250 lines)
components/jobs/JobPhotosGallery.tsx (NEW - 150 lines)
lib/hooks/useJobDetail.ts (NEW - 100 lines)
lib/hooks/useJobActions.ts (NEW - 200 lines)
```

### Features

#### Job Information Display

- [ ] Job title, description, budget
- [ ] Category and urgency badges
- [ ] Location with map preview
- [ ] Posted date (relative time)
- [ ] Expected duration
- [ ] Preferred start date
- [ ] Materials needed list
- [ ] Photo gallery with lightbox

#### Client Information Card

```typescript
<ClientCard>
  <Avatar src={client.avatar} />
  <Name>{client.name}</Name>
  <Rating value={client.rating} />
  <JobsCompleted>{client.completedJobs} jobs</JobsCompleted>
  <ViewProfileButton />
</ClientCard>
```

#### Worker Information Card (if assigned)

```typescript
<WorkerCard visible={job.assignedWorkerID}>
  <Avatar src={worker.avatar} />
  <Name>{worker.name}</Name>
  <Rating value={worker.rating} />
  <ContactButton onClick={openChat} />
</WorkerCard>
```

#### Status Badge

```typescript
<JobStatusBadge status={job.status}>
  {job.status === 'ACTIVE' && '🟢 Open for Applications'}
  {job.status === 'IN_PROGRESS' && '🔵 In Progress'}
  {job.status === 'COMPLETED' && '✅ Completed'}
</JobStatusBadge>
```

#### Role-Specific Actions

**Worker View (ACTIVE + LISTING job)**:

```typescript
{!job.has_applied && job.status === 'ACTIVE' && job.jobType === 'LISTING' && (
  <ApplyButton
    onClick={() => router.push(`/dashboard/jobs/${id}/apply`)}
  />
)}

{job.has_applied && (
  <Badge variant="info">Application Submitted</Badge>
)}
```

**Worker View (ACTIVE + INVITE job)**:

```typescript
{job.jobType === 'INVITE' && job.inviteStatus === 'PENDING' && (
  <div className="flex gap-2">
    <AcceptInviteButton onClick={handleAcceptInvite} />
    <RejectInviteButton onClick={handleRejectInvite} />
  </div>
)}
```

**Worker View (IN_PROGRESS + assigned)**:

```typescript
{job.status === 'IN_PROGRESS' && job.assignedWorkerID === currentUserId && (
  <>
    {!job.workerMarkedComplete && (
      <MarkCompleteButton onClick={handleMarkComplete} />
    )}
    {job.workerMarkedComplete && (
      <Badge variant="warning">Waiting for client approval</Badge>
    )}
  </>
)}
```

**Client View (ACTIVE + LISTING)**:

```typescript
{job.status === 'ACTIVE' && job.jobType === 'LISTING' && (
  <ViewApplicationsButton
    count={job.applicationsCount}
    onClick={() => router.push(`/dashboard/jobs/${id}/applications`)}
  />
)}
```

**Client View (ACTIVE + INVITE)**:

```typescript
{job.jobType === 'INVITE' && job.inviteStatus === 'PENDING' && (
  <Badge variant="info">Waiting for {job.assignedWorker.name} to respond</Badge>
)}
```

**Client View (IN_PROGRESS)**:

```typescript
{job.status === 'IN_PROGRESS' && (
  <>
    {!job.clientConfirmedWorkStarted && (
      <ConfirmWorkStartedButton onClick={handleConfirmStarted} />
    )}

    {job.workerMarkedComplete && !job.clientMarkedComplete && (
      <ApproveCompletionButton onClick={() => router.push(`/dashboard/payments/final/${id}`)} />
    )}
  </>
)}
```

### API Endpoints

**Get Job Detail**:

```typescript
GET /api/mobile/jobs/{id}

Response:
{
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED";
  jobType: "LISTING" | "INVITE";
  inviteStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  categoryName: string;
  expectedDuration: string;
  preferredStartDate: string;
  materialsNeeded: string[];
  photos: Array<{ id: number; url: string }>;
  postedBy: { name: string; avatar: string; rating: number };
  assignedWorker?: { id: number; name: string; avatar: string; rating: number };
  applicationsCount: number;
  has_applied: boolean; // User-specific
  clientConfirmedWorkStarted: boolean;
  workerMarkedComplete: boolean;
  clientMarkedComplete: boolean;
  createdAt: string;
}
```

---

## 1.4 Job Application System

### Files to Create

```
app/dashboard/jobs/[id]/apply/page.tsx (NEW - 350 lines)
app/dashboard/jobs/[id]/applications/page.tsx (NEW - 450 lines)
components/jobs/ApplicationForm.tsx (NEW - 300 lines)
components/jobs/ApplicationCard.tsx (NEW - 250 lines)
lib/hooks/useApplications.ts (NEW - 200 lines)
```

### Features

#### Application Form (Worker View)

**Form Fields**:

- [ ] **Proposal Message** - Textarea (50-500 chars, required)
- [ ] **Budget Option** - Radio (Accept/Negotiate)
- [ ] **Proposed Budget** - Number (if negotiating, must be ≤ client budget)
- [ ] **Estimated Duration** - Number + Unit
- [ ] **Previous Work** - Optional links/photos

**Validation**:

```typescript
const validateApplication = (data: ApplicationData, jobBudget: number) => {
  if (data.proposalMessage.length < 50 || data.proposalMessage.length > 500) {
    return { error: "Proposal must be 50-500 characters" };
  }
  if (data.budgetOption === "NEGOTIATE" && data.proposedBudget > jobBudget) {
    return { error: "Proposed budget cannot exceed client budget" };
  }
  if (!data.estimatedDuration) {
    return { error: "Please provide estimated duration" };
  }
  return { valid: true };
};
```

**API Endpoint**:

```typescript
POST /api/mobile/jobs/{job_id}/apply
{
  proposal_message: string;
  budget_option: "ACCEPT" | "NEGOTIATE";
  proposed_budget?: number;
  estimated_duration: string;
}

Response:
{
  success: true;
  application_id: number;
  status: "PENDING";
}
```

#### View Applications (Client View)

**Features**:

- [ ] List all applications for job
- [ ] Filter by status (All/Pending/Accepted/Rejected)
- [ ] Sort by date, rating, proposed budget
- [ ] Application cards with worker info

**Application Card**:

```typescript
<ApplicationCard>
  <WorkerInfo>
    <Avatar src={worker.avatar} />
    <Name>{worker.name}</Name>
    <Rating value={worker.rating} />
    <Stats completedJobs={worker.completedJobs} />
  </WorkerInfo>

  <ProposalSection>
    <ProposalMessage>{application.proposalMessage}</ProposalMessage>
    <BudgetInfo>
      {application.budgetOption === 'ACCEPT' ? (
        <Badge variant="success">Accepts your budget: ₱{job.budget}</Badge>
      ) : (
        <Badge variant="warning">Proposes: ₱{application.proposedBudget}</Badge>
      )}
    </BudgetInfo>
    <DurationInfo>{application.estimatedDuration}</DurationInfo>
  </ProposalSection>

  <Actions>
    <AcceptButton onClick={() => handleAccept(application.id)} />
    <RejectButton onClick={() => handleReject(application.id)} />
    <ViewProfileButton href={`/dashboard/workers/${worker.id}`} />
  </Actions>
</ApplicationCard>
```

**Accept Application Flow**:

1. Client clicks Accept
2. Confirmation dialog shows
3. API call to accept
4. Job status → IN_PROGRESS
5. Worker assigned
6. All other applications auto-rejected
7. **Escrow payment required** (redirect to payment page)
8. Notification sent to worker

**API Endpoints**:

```typescript
GET / api / mobile / jobs / { job_id } / applications;

Response: {
  applications: Array<{
    id: number;
    workerID: number;
    workerName: string;
    workerAvatar: string;
    workerRating: number;
    workerCompletedJobs: number;
    proposalMessage: string;
    budgetOption: "ACCEPT" | "NEGOTIATE";
    proposedBudget?: number;
    estimatedDuration: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    appliedAt: string;
  }>;
  total: number;
}

POST / api / jobs / { job_id } / applications / { application_id } / accept;

Response: {
  success: true;
  job_id: number;
  worker_id: number;
  requires_payment: true;
  escrow_amount: number;
}

POST / api / jobs / { job_id } / applications / { application_id } / reject;

Response: {
  success: true;
  application_id: number;
  status: "REJECTED";
}
```

---

## 1.5 My Applications Page (Worker)

### Files to Create

```
app/dashboard/applications/page.tsx (NEW - 400 lines)
components/applications/ApplicationCard.tsx (NEW - 200 lines)
lib/hooks/useMyApplications.ts (NEW - 100 lines)
```

### Features

#### Tab Filters

- [ ] **All** - Show all applications
- [ ] **Pending** - Awaiting client response
- [ ] **Accepted** - Client accepted (job assigned)
- [ ] **Rejected** - Client rejected
- [ ] **Withdrawn** - Worker withdrew application

#### Application Card

```typescript
<ApplicationCard>
  <JobInfo>
    <JobTitle>{job.title}</JobTitle>
    <JobBudget>₱{job.budget}</JobBudget>
    <JobLocation>{job.location}</JobLocation>
  </JobInfo>

  <StatusBadge status={application.status} />

  <ProposalSummary>
    <ProposalMessage truncated>{application.proposalMessage}</ProposalMessage>
    <BudgetInfo>
      {application.budgetOption === 'ACCEPT'
        ? 'Accepted client budget'
        : `Proposed ₱${application.proposedBudget}`
      }
    </BudgetInfo>
  </ProposalSummary>

  <Actions>
    <ViewJobButton href={`/dashboard/jobs/${job.id}`} />
    {application.status === 'PENDING' && (
      <WithdrawButton onClick={handleWithdraw} />
    )}
  </Actions>

  <Timestamp>{formatRelativeTime(application.appliedAt)}</Timestamp>
</ApplicationCard>
```

#### Withdraw Application

```typescript
const handleWithdraw = async (applicationId: number) => {
  if (!confirm("Are you sure you want to withdraw this application?")) return;

  await withdrawApplication(applicationId);
  toast.success("Application withdrawn");
  refetch();
};
```

### API Endpoint

```typescript
GET /api/mobile/jobs/applications/my?status=PENDING

Response:
{
  applications: Array<{
    id: number;
    jobID: number;
    jobTitle: string;
    jobBudget: number;
    jobLocation: string;
    proposalMessage: string;
    budgetOption: "ACCEPT" | "NEGOTIATE";
    proposedBudget?: number;
    estimatedDuration: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
    appliedAt: string;
  }>;
  total: number;
}

POST /api/jobs/applications/{application_id}/withdraw

Response:
{
  success: true;
  application_id: number;
  status: "WITHDRAWN";
}
```

---

## 1.6 Job Status Management

### Files to Modify

```
app/dashboard/jobs/[id]/page.tsx (add action handlers)
lib/hooks/useJobActions.ts (NEW - 200 lines)
```

### Features

#### Confirm Work Started (Client Action)

**When**: Job status = IN_PROGRESS, worker assigned, work not yet confirmed

**Flow**:

1. Client clicks "Confirm Work Started"
2. Confirmation dialog: "Confirm that [Worker Name] has arrived and started working?"
3. API call updates job
4. `clientConfirmedWorkStarted = true`
5. Toast: "Work confirmed as started"
6. Notification sent to worker

**API**:

```typescript
POST / api / jobs / { job_id } / confirm - work - started;

Response: {
  success: true;
  job_id: number;
  clientConfirmedWorkStarted: true;
}
```

#### Mark Complete (Worker Action)

**When**: Job status = IN_PROGRESS, worker is assigned

**Flow**:

1. Worker clicks "Mark as Complete"
2. Modal opens with completion notes (optional)
3. Option to upload completion photos
4. API call updates job
5. `workerMarkedComplete = true`
6. Toast: "Job marked as complete. Waiting for client approval."
7. Notification sent to client

**API**:

```typescript
POST /api/jobs/{job_id}/mark-complete
{
  completion_notes?: string;
}

Response:
{
  success: true;
  job_id: number;
  workerMarkedComplete: true;
  message: "Job marked as complete. Awaiting client approval.";
}
```

#### Approve Completion (Client Action)

**When**: Job status = IN_PROGRESS, worker marked complete

**Flow**:

1. Client clicks "Approve Completion"
2. Redirect to final payment page
3. Client selects payment method (Wallet/GCash/Cash)
4. Payment processed
5. Job status → COMPLETED
6. `clientMarkedComplete = true`
7. Worker receives payment to wallet
8. Both parties prompted to leave reviews

**API**:

```typescript
POST /api/jobs/{job_id}/approve-completion
{
  payment_method: "WALLET" | "GCASH" | "CASH";
  cash_proof_image?: File; // If CASH
}

Response:
{
  success: true;
  job_id: number;
  status: "COMPLETED";
  payment_method: string;
  requires_payment: boolean; // false if Wallet (instant)
  invoice_url?: string; // if GCash
  prompt_review: true;
}
```

### Job Status Flow Diagram

```
ACTIVE (job created)
  │
  ├─ LISTING: Worker applies
  │   └─ Client accepts application
  │       └─ Escrow payment required
  │           └─ IN_PROGRESS
  │
  └─ INVITE: Worker accepts invite
      └─ IN_PROGRESS

IN_PROGRESS
  │
  ├─ Client confirms work started (optional)
  │   └─ clientConfirmedWorkStarted = true
  │
  └─ Worker marks complete
      └─ workerMarkedComplete = true
          └─ Client approves completion
              └─ Final payment required
                  └─ COMPLETED

COMPLETED
  │
  └─ Both parties leave reviews
      └─ CLOSED
```

---

## 1.7 My Jobs Page (Client)

### Files to Refactor

```
app/dashboard/myRequests/page.tsx (REFACTOR - currently 3562 lines!)
  → Split into:
    app/dashboard/jobs/my-jobs/page.tsx (NEW - 400 lines)
    components/jobs/MyJobCard.tsx (NEW - 200 lines)
```

### Features

#### Tab Filters

- [ ] **Active** - ACTIVE status jobs (open for applications or pending invite response)
- [ ] **In Progress** - IN_PROGRESS status jobs (worker assigned, working)
- [ ] **Completed** - COMPLETED status jobs (finished, may need reviews)

#### Job Card (Client View)

```typescript
<MyJobCard>
  <JobInfo>
    <JobTitle>{job.title}</JobTitle>
    <JobBudget>₱{job.budget}</JobBudget>
    <JobType badge>{job.jobType}</JobType>
  </JobInfo>

  <StatusInfo>
    <StatusBadge status={job.status} />
    {job.jobType === 'LISTING' && (
      <ApplicationsBadge count={job.applicationsCount} />
    )}
    {job.jobType === 'INVITE' && (
      <InviteStatusBadge status={job.inviteStatus} />
    )}
  </StatusInfo>

  <WorkerInfo visible={job.assignedWorkerID}>
    <Avatar src={job.assignedWorker.avatar} />
    <Name>{job.assignedWorker.name}</Name>
    <ContactButton onClick={() => openChat(job.assignedWorker.id)} />
  </WorkerInfo>

  <Actions>
    <ViewJobButton href={`/dashboard/jobs/${job.id}`} />

    {job.status === 'ACTIVE' && job.jobType === 'LISTING' && (
      <ViewApplicationsButton href={`/dashboard/jobs/${job.id}/applications`} />
    )}

    {job.status === 'IN_PROGRESS' && !job.clientConfirmedWorkStarted && (
      <ConfirmStartedButton onClick={handleConfirmStarted} />
    )}

    {job.workerMarkedComplete && !job.clientMarkedComplete && (
      <ApproveButton onClick={() => router.push(`/dashboard/payments/final/${job.id}`)} />
    )}

    {job.status === 'COMPLETED' && !job.clientReviewed && (
      <LeaveReviewButton href={`/dashboard/reviews/submit/${job.id}`} />
    )}
  </Actions>

  <Timestamp>{formatRelativeTime(job.createdAt)}</Timestamp>
</MyJobCard>
```

### API Endpoint

```typescript
GET /api/mobile/jobs/my-jobs?status=ACTIVE

Response:
{
  jobs: Array<{
    id: number;
    title: string;
    budget: number;
    location: string;
    status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED";
    jobType: "LISTING" | "INVITE";
    inviteStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
    applicationsCount: number;
    assignedWorkerID?: number;
    assignedWorker?: {
      id: number;
      name: string;
      avatar: string;
      rating: number;
    };
    clientConfirmedWorkStarted: boolean;
    workerMarkedComplete: boolean;
    clientMarkedComplete: boolean;
    clientReviewed: boolean;
    createdAt: string;
  }>;
  total: number;
}
```

---

## Implementation Checklist

### Phase 1: Job Creation

- [ ] Create LISTING job creation page
- [ ] Create INVITE job creation page
- [ ] Build JobCreateForm component
- [ ] Implement category dropdown
- [ ] Implement location autocomplete
- [ ] Implement materials array input
- [ ] Add worker/agency selector (INVITE)
- [ ] Add payment method selector (INVITE)
- [ ] Wire up API endpoints
- [ ] Add form validation
- [ ] Add success redirects
- [ ] Test self-hiring prevention

### Phase 2: Job Browsing

- [ ] Refactor home page (extract components)
- [ ] Create JobCard component
- [ ] Create JobFilters component
- [ ] Implement category filter
- [ ] Implement budget range filter
- [ ] Implement location filter
- [ ] Implement urgency filter
- [ ] Implement sort dropdown
- [ ] Add search functionality
- [ ] Add pagination
- [ ] Add skeleton loaders
- [ ] Add empty states

### Phase 3: Job Detail & Applications

- [ ] Enhance job detail page
- [ ] Add role-specific actions
- [ ] Create application form page
- [ ] Create view applications page
- [ ] Build ApplicationCard component
- [ ] Implement accept application
- [ ] Implement reject application
- [ ] Add escrow payment trigger
- [ ] Create My Applications page
- [ ] Add withdraw functionality

### Phase 4: Status Management

- [ ] Add Confirm Work Started action
- [ ] Add Mark Complete action
- [ ] Add Approve Completion action
- [ ] Create JobStatusBadge component
- [ ] Wire up all status endpoints
- [ ] Add notifications
- [ ] Test status flow end-to-end

### Phase 5: My Jobs Refactor

- [ ] Split myRequests page
- [ ] Create my-jobs page
- [ ] Build MyJobCard component
- [ ] Add tab filters
- [ ] Add quick actions
- [ ] Test all job types
- [ ] Test all statuses

---

## Testing Strategy

### Unit Tests

- [ ] Form validation functions
- [ ] Budget calculation logic
- [ ] Date formatting utilities
- [ ] Filter logic

### Integration Tests

- [ ] Job creation flow (LISTING)
- [ ] Job creation flow (INVITE)
- [ ] Application submission
- [ ] Application acceptance
- [ ] Status update flow

### E2E Tests (Playwright)

```typescript
test("Client posts LISTING job and accepts application", async ({ page }) => {
  await loginAsClient(page);
  await page.goto("/dashboard/jobs/create/listing");
  await fillJobForm(page, listingJobData);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard/jobs/my-jobs");

  // Worker applies
  await loginAsWorker(page);
  await page.goto(`/dashboard/jobs/${jobId}`);
  await page.click('button:has-text("Apply")');
  await fillApplicationForm(page, applicationData);
  await page.click('button[type="submit"]');

  // Client accepts
  await loginAsClient(page);
  await page.goto(`/dashboard/jobs/${jobId}/applications`);
  await page.click('button:has-text("Accept")');
  await expect(page).toHaveURL(`/dashboard/payments/escrow/${jobId}`);
});
```

---

## Completion Criteria

Module 1 is complete when:

- [x] All 7 sections implemented
- [x] Job creation (LISTING + INVITE) works
- [x] Job browsing with filters works
- [x] Application system functional
- [x] Job status updates work
- [x] All validation matches mobile app
- [x] 0 TypeScript errors
- [x] All E2E tests pass
- [x] Code reviewed and refactored
- [x] No files >500 lines

---

**Next Module**: Module 2 - Payment System

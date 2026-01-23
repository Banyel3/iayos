# MyRequests Dynamic User Information & Tab Updates

## Overview

Updated the myRequests page to display different tab labels based on user type (Worker vs Client), dynamically render user information from JWT token, and added a "Requests" tab exclusively for clients to view worker applications.

---

## Changes Made

### 1. **Tab Labels Based on User Type**

#### Before

- All users saw: "My Requests" / "Past Requests"

#### After

**For Workers:**

- "My Jobs" (active jobs)
- "Past Jobs" (completed jobs)

**For Clients:**

- "My Requests" (active job posts)
- "Past Requests" (completed job posts)
- "Requests" (worker applications to their jobs) - **NEW**

#### Implementation

```typescript
// Tab state updated to include "requests" option
const [activeTab, setActiveTab] = useState<
  "myRequests" | "pastRequests" | "requests"
>("myRequests");

// Dynamic tab labels
{isWorker ? "My Jobs" : "My Requests"}
{isWorker ? "Past Jobs" : "Past Requests"}

// Third tab only for clients
{isClient && (
  <button onClick={() => setActiveTab("requests")}>
    Requests
  </button>
)}
```

---

### 2. **Dynamic User Information Rendering**

#### Client Information Section

**Logic:**

- If the current user is a CLIENT viewing their own job → Show "Your Information" with their name from JWT
- If the current user is a WORKER viewing a client's job → Show "Client Information" with client's name from job data

**Implementation:**

```typescript
{/* Client Info */}
{selectedJob.client && (
  <div className="bg-gray-50 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-3">
      {isClient ? "Your Information" : "Client Information"}
    </h4>
    <div className="flex items-center space-x-3">
      <Image
        src={selectedJob.client.avatar}
        alt={
          isClient && user?.profile_data?.firstName
            ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
            : selectedJob.client.name
        }
        width={48}
        height={48}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1">
        <p className="font-medium text-gray-900">
          {isClient && user?.profile_data?.firstName
            ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
            : selectedJob.client.name}
        </p>
        {/* Rating info */}
      </div>
    </div>
  </div>
)}
```

#### Worker Information Section

**Logic:**

- If the current user is a WORKER viewing their completed job → Show "Your Information" with their name from JWT
- If the current user is a CLIENT viewing a worker's completed job → Show "Worker Information" with worker's name from job data

**Implementation:**

```typescript
{/* Worker Info (for completed jobs) */}
{selectedJob.worker && selectedJob.status === "COMPLETED" && (
  <div className="bg-gray-50 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-3">
      {isWorker ? "Your Information" : "Worker Information"}
    </h4>
    <div className="flex items-center space-x-3">
      <Image
        src={selectedJob.worker.avatar}
        alt={
          isWorker && user?.profile_data?.firstName
            ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
            : selectedJob.worker.name
        }
        width={48}
        height={48}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1">
        <p className="font-medium text-gray-900">
          {isWorker && user?.profile_data?.firstName
            ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
            : selectedJob.worker.name}
        </p>
        {/* Rating info */}
      </div>
    </div>
  </div>
)}
```

---

### 3. **New "Requests" Tab for Clients**

#### Purpose

Allows clients to view worker applications to their posted jobs.

#### Features

- **Visibility:** Only shown to CLIENT accounts
- **Content:** List of workers who have applied to the client's job posts
- **Empty State:** Professional message when no applications exist

#### Implementation

```typescript
{/* CLIENT REQUESTS TAB - Worker Applications */}
{isClient && activeTab === "requests" && (
  <div>
    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
      Worker Applications
    </h2>
    <p className="text-sm text-gray-600 mb-4">
      View workers who have applied to your posted jobs
    </p>

    {/* Applications List */}
    <div className="space-y-3">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" /* ... icon ... */>
            {/* People/Users icon */}
          </svg>
        </div>
        <h3 className="text-gray-900 font-medium mb-2">
          No applications yet
        </h3>
        <p className="text-gray-600 text-sm">
          Worker applications to your jobs will appear here
        </p>
      </div>
    </div>
  </div>
)}
```

---

## User Data Source

### JWT Token (Cached User Info)

The user information is pulled from the authenticated user's JWT token via the `useAuth()` hook:

```typescript
const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
const user = authUser as RequestsUser;

// User data structure from JWT
interface RequestsUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
  };
}
```

### Dynamic Name Display

```typescript
// Client's own name
isClient && user?.profile_data?.firstName
  ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
  : selectedJob.client.name;

// Worker's own name
isWorker && user?.profile_data?.firstName
  ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
  : selectedJob.worker.name;
```

---

## User Experience Flows

### For Workers

**Tab Navigation:**

```
┌─────────────────────────────────────┐
│  [My Jobs]  [Past Jobs]             │
└─────────────────────────────────────┘
```

**My Jobs Tab:**

- Shows active jobs they've accepted
- Job details modal shows:
  - Client Information (other person)
  - "Your Information" section NOT shown (job incomplete)

**Past Jobs Tab:**

- Shows completed jobs
- Job details modal shows:
  - Client Information (other person)
  - "Your Information" (themselves, from JWT)
  - Full payment breakdown

### For Clients

**Tab Navigation:**

```
┌──────────────────────────────────────────────────┐
│  [My Requests]  [Past Requests]  [Requests]      │
└──────────────────────────────────────────────────┘
```

**My Requests Tab:**

- Shows active job posts
- Job details modal shows:
  - "Your Information" (themselves, from JWT)
  - Worker information NOT shown (job incomplete)

**Past Requests Tab:**

- Shows completed jobs
- Job details modal shows:
  - "Your Information" (themselves, from JWT)
  - Worker Information (person who completed job)
  - Full payment breakdown

**Requests Tab (NEW):**

- Shows worker applications to their posted jobs
- View applicant profiles
- Accept/Reject workers (future implementation)
- Empty state when no applications

---

## Key Benefits

### 1. **Personalized Experience**

- Workers see job-centric language ("My Jobs", "Past Jobs")
- Clients see request-centric language ("My Requests", "Past Requests")
- Clear distinction between user types

### 2. **Accurate Self-Identification**

- Users see "Your Information" when viewing their own profile
- Eliminates confusion about whose information is being displayed
- Data pulled from secure JWT token

### 3. **Better Organization for Clients**

- Separate "Requests" tab for managing worker applications
- Keeps active jobs separate from incoming applications
- Clearer workflow for hiring workers

### 4. **Dynamic & Secure**

- User names pulled from JWT (server-verified)
- No hardcoded or mock user data in production
- Falls back to job data if JWT data unavailable

---

## Technical Details

### State Management

```typescript
// Tab state with three options
const [activeTab, setActiveTab] = useState<
  "myRequests" | "pastRequests" | "requests"
>("myRequests");
```

### Conditional Rendering Logic

```typescript
// Tab visibility
{isWorker ? "My Jobs" : "My Requests"}  // First tab
{isWorker ? "Past Jobs" : "Past Requests"}  // Second tab
{isClient && <RequestsTab />}  // Third tab (clients only)

// User info display
{isClient ? "Your Information" : "Client Information"}
{isWorker ? "Your Information" : "Worker Information"}

// Name display
{isClient && user?.profile_data?.firstName
  ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
  : selectedJob.client.name}
```

### Data Flow

```
JWT Token (useAuth hook)
    ↓
user.profile_data.firstName
user.profile_data.lastName
user.profile_data.profileType
    ↓
Dynamic rendering in UI
```

---

## Future Enhancements

### Requests Tab Implementation

1. **Fetch Worker Applications**

   ```typescript
   GET / api / jobs / { jobId } / applications;
   ```

2. **Display Applicant Cards**
   - Worker name and avatar
   - Rating and reviews
   - Skills and experience
   - Proposed price (if negotiable)
   - Application message

3. **Action Buttons**
   - Accept Application → Move to active jobs
   - Reject Application → Send notification
   - View Profile → Navigate to worker profile
   - Message Worker → Open chat

4. **Filter & Sort**
   - Filter by job post
   - Sort by rating, date, price
   - Search by worker name

5. **Notifications**
   - Badge count on "Requests" tab
   - Real-time updates when new applications arrive

### Enhanced User Info Display

1. **Profile Pictures**
   - Fetch from user's uploaded avatar
   - Fallback to placeholder/initials

2. **Dynamic Ratings**
   - Pull from user's actual rating in database
   - Show review count

3. **Verification Badges**
   - KYC verified indicator
   - Email verified indicator
   - Phone verified indicator

---

## Testing Checklist

### Tab Navigation

- [ ] Worker sees "My Jobs" and "Past Jobs" tabs
- [ ] Client sees "My Requests", "Past Requests", and "Requests" tabs
- [ ] Worker does NOT see "Requests" tab
- [ ] Tab switching works correctly for all user types

### Dynamic User Info

- [ ] Client viewing their own job sees "Your Information" with their name from JWT
- [ ] Worker viewing their completed job sees "Your Information" with their name from JWT
- [ ] Client viewing worker's completed job sees "Worker Information" with worker's name
- [ ] Worker viewing client's job sees "Client Information" with client's name
- [ ] Name displays correctly with firstName + lastName
- [ ] Falls back to job data if JWT data unavailable

### Requests Tab (Client Only)

- [ ] Requests tab only visible to clients
- [ ] Empty state displays correctly
- [ ] Heading shows "Worker Applications"
- [ ] Description text is clear
- [ ] Icon displays properly

### Edge Cases

- [ ] User with no firstName shows fallback name
- [ ] User with only firstName (no lastName) displays correctly
- [ ] Job with missing client/worker data handles gracefully
- [ ] Tab state persists when opening/closing modals

---

## Related Files

- `apps/frontend_web/app/dashboard/myRequests/page.tsx` - Main implementation
- `apps/frontend_web/context/AuthContext.tsx` - JWT user data source
- `apps/frontend_web/types/auth.ts` - User interface definitions
- `TWO_PHASE_PAYMENT_SYSTEM.md` - Payment system context
- `PAYMENT_METHODS_UPDATE.md` - Payment UI updates

---

## API Requirements (Future)

### Get Worker Applications

```
GET /api/jobs/{jobId}/applications
```

**Response:**

```json
{
  "success": true,
  "applications": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "worker": {
        "id": "uuid",
        "firstName": "Pedro",
        "lastName": "Reyes",
        "avatar": "/avatars/pedro.jpg",
        "rating": 4.7,
        "total_reviews": 23,
        "skills": ["Plumbing", "Electrical"],
        "kycVerified": true
      },
      "message": "I'm interested in this job...",
      "proposed_price": 450.0,
      "status": "PENDING",
      "applied_at": "2025-10-12T10:30:00Z"
    }
  ]
}
```

### Accept/Reject Application

```
POST /api/applications/{applicationId}/accept
POST /api/applications/{applicationId}/reject
```

---

**Last Updated:** October 12, 2025  
**Status:** Frontend Implementation Complete  
**Next Steps:**

1. Backend API for fetching worker applications
2. Accept/Reject application functionality
3. Real-time notifications for new applications
4. Worker application flow (apply to jobs)

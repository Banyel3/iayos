# Admin Module 3: Jobs Management + Logistics Timeline

**Status**: 📋 PLANNED  
**Priority**: CRITICAL  
**Time Estimate**: 30-35 hours  
**Dependencies**: None (can start immediately)  
**Backend**: ✅ Most endpoints ready, timeline data may need verification

## Overview

Complete jobs management system with comprehensive logistics timeline visualization showing 6 key milestones in job lifecycle. This is critical for tracking job progress, resolving disputes, and providing transparency to admins on platform operations.

## Module Scope

### Pages to Implement

1. **Jobs Dashboard** (`admin/jobs/page.tsx`) - Overview with stats
2. **Job Listings** (`admin/jobs/listings/page.tsx`) - All jobs with filters
3. **Job Detail + Timeline** (`admin/jobs/listings/[id]/page.tsx`) - **NEW** 6-milestone visualization
4. **Job Applications** (`admin/jobs/applications/page.tsx`) - Application tracking
5. **Job Disputes** (`admin/jobs/disputes/page.tsx`) - Conflict resolution
6. **Job Categories** (`admin/jobs/categories/page.tsx`) - Category CRUD + minimum rates

### Key Features

- ✅ **6-Milestone Logistics Timeline** (primary feature)
- ✅ Job listings with category/status/urgency filters
- ✅ Application management with status tracking
- ✅ Dispute resolution with priority levels
- ✅ Category management with minimum rate configuration
- ✅ Budget breakdown display
- ✅ Client/worker info cards
- ✅ Photo gallery from job completion
- ✅ Timeline export to PDF

## 🎯 Logistics Timeline - Core Feature

### 6 Milestones Tracked

**Visual Timeline Progression:**

```
1. 📝 Job Posted
   ↓ (time elapsed)
2. 👷 Worker Assigned/Accepted
   ↓ (time elapsed)
3. ▶️ Client Initiated Start
   ↓ (time elapsed)
4. 📍 Worker Arrived On-Site
   ↓ (time elapsed)
5. ✅ Worker Marked Complete
   ↓ (time elapsed)
6. ✔️ Client Confirmed Completion
   ↓ (optional)
7. ⭐ Reviews Submitted (Both Parties)
```

### Milestone Data Structure

```typescript
interface JobTimeline {
  // Milestone 1: Job Posted
  job_posted: string; // ISO timestamp (Job.createdAt)

  // Milestone 2: Worker Assigned
  worker_assigned: string | null; // ISO timestamp (JobApplication.acceptedAt or Job.assignedAt)
  worker_name: string | null;

  // Milestone 3: Client Initiated Start
  start_initiated: string | null; // ISO timestamp (Job.startInitiatedAt)

  // Milestone 4: Worker Arrived On-Site
  worker_arrived: string | null; // ISO timestamp (Job.workerArrivedAt)
  arrival_location?: { lat: number; lng: number }; // Optional GPS coordinates

  // Milestone 5: Worker Marked Complete
  worker_marked_complete: string | null; // ISO timestamp (Job.workerCompletedAt)
  completion_photos: string[]; // Array of photo URLs
  completion_notes: string | null;

  // Milestone 6: Client Confirmed Completion
  client_confirmed: string | null; // ISO timestamp (Job.clientApprovedAt)

  // Milestone 7: Reviews (Optional)
  client_reviewed: string | null; // ISO timestamp (Review.createdAt)
  worker_reviewed: string | null; // ISO timestamp (Review.createdAt)
  reviews_complete: boolean; // Both parties reviewed
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  urgency: "LOW" | "MEDIUM" | "HIGH";
  budget: number;
  location: string;
  category: { id: number; name: string } | null;

  // Client info
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
  };

  // Worker info (if assigned)
  worker: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
  } | null;

  // Applications
  applications_count: number;
  applications: Array<{
    id: string;
    worker_name: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    applied_at: string;
  }>;

  // Timeline data
  timeline: JobTimeline;

  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}
```

### Timeline Component Structure

**File**: `apps/frontend_web/app/admin/jobs/components/JobTimelineVisualization.tsx`

```typescript
interface JobTimelineVisualizationProps {
  timeline: JobTimeline;
  jobStatus: string;
}

export function JobTimelineVisualization({ timeline, jobStatus }: JobTimelineVisualizationProps) {
  const milestones = [
    {
      id: 1,
      label: 'Job Posted',
      timestamp: timeline.job_posted,
      icon: FileText,
      status: 'completed', // Always completed if job exists
      color: 'green',
    },
    {
      id: 2,
      label: 'Worker Assigned',
      timestamp: timeline.worker_assigned,
      icon: UserCheck,
      status: timeline.worker_assigned ? 'completed' : 'pending',
      color: timeline.worker_assigned ? 'green' : 'gray',
      subtitle: timeline.worker_name,
    },
    {
      id: 3,
      label: 'Client Initiated Start',
      timestamp: timeline.start_initiated,
      icon: Play,
      status: timeline.start_initiated ? 'completed' :
              timeline.worker_assigned ? 'pending' : 'locked',
      color: timeline.start_initiated ? 'green' :
             timeline.worker_assigned ? 'blue' : 'gray',
    },
    {
      id: 4,
      label: 'Worker Arrived On-Site',
      timestamp: timeline.worker_arrived,
      icon: MapPin,
      status: timeline.worker_arrived ? 'completed' :
              timeline.start_initiated ? 'pending' : 'locked',
      color: timeline.worker_arrived ? 'green' :
             timeline.start_initiated ? 'blue' : 'gray',
    },
    {
      id: 5,
      label: 'Worker Marked Complete',
      timestamp: timeline.worker_marked_complete,
      icon: CheckCircle,
      status: timeline.worker_marked_complete ? 'completed' :
              timeline.worker_arrived ? 'pending' : 'locked',
      color: timeline.worker_marked_complete ? 'green' :
             timeline.worker_arrived ? 'blue' : 'gray',
      hasPhotos: timeline.completion_photos?.length > 0,
    },
    {
      id: 6,
      label: 'Client Confirmed',
      timestamp: timeline.client_confirmed,
      icon: CheckCircle2,
      status: timeline.client_confirmed ? 'completed' :
              timeline.worker_marked_complete ? 'pending' : 'locked',
      color: timeline.client_confirmed ? 'green' :
             timeline.worker_marked_complete ? 'blue' : 'gray',
    },
    {
      id: 7,
      label: 'Reviews Submitted',
      timestamp: timeline.reviews_complete
        ? (timeline.client_reviewed || timeline.worker_reviewed)
        : null,
      icon: Star,
      status: timeline.reviews_complete ? 'completed' :
              timeline.client_confirmed ? 'pending' : 'locked',
      color: timeline.reviews_complete ? 'green' :
             timeline.client_confirmed ? 'blue' : 'gray',
      subtitle: timeline.reviews_complete
        ? 'Both parties reviewed'
        : timeline.client_reviewed
          ? 'Client reviewed'
          : timeline.worker_reviewed
            ? 'Worker reviewed'
            : 'Awaiting reviews',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Progress Timeline</CardTitle>
        <CardDescription>
          Track key milestones from posting to completion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Milestones */}
          <div className="space-y-8">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              const nextMilestone = milestones[index + 1];
              const timeElapsed = milestone.timestamp && nextMilestone?.timestamp
                ? calculateTimeElapsed(milestone.timestamp, nextMilestone.timestamp)
                : null;

              return (
                <div key={milestone.id} className="relative">
                  {/* Icon Circle */}
                  <div className={`
                    absolute left-0 w-12 h-12 rounded-full flex items-center justify-center
                    ${milestone.status === 'completed' ? 'bg-green-100' :
                      milestone.status === 'pending' ? 'bg-blue-100' :
                      'bg-gray-100'}
                  `}>
                    <Icon className={`h-6 w-6 ${
                      milestone.status === 'completed' ? 'text-green-600' :
                      milestone.status === 'pending' ? 'text-blue-600' :
                      'text-gray-400'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="ml-16">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {milestone.label}
                        </h3>
                        {milestone.subtitle && (
                          <p className="text-sm text-gray-600 mt-1">
                            {milestone.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {milestone.timestamp ? (
                          <>
                            <p className="text-sm font-medium text-gray-900">
                              {formatTimestamp(milestone.timestamp)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(milestone.timestamp)}
                            </p>
                          </>
                        ) : (
                          <Badge variant={milestone.status === 'pending' ? 'warning' : 'secondary'}>
                            {milestone.status === 'pending' ? 'Pending' : 'Not Started'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Special content for certain milestones */}
                    {milestone.hasPhotos && timeline.completion_photos && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {timeline.completion_photos.slice(0, 4).map((photo, i) => (
                          <img
                            key={i}
                            src={photo}
                            alt={`Completion photo ${i + 1}`}
                            className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => openPhotoModal(photo)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Time Elapsed to Next Milestone */}
                    {timeElapsed && (
                      <div className="mt-2 text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {timeElapsed} until next milestone
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => exportTimelineToPDF(timeline)}>
            <Download className="h-4 w-4 mr-2" />
            Export Timeline as PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function calculateTimeElapsed(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  // Output: "Nov 24, 2025 3:45 PM"
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
```

## Backend API Endpoints

### Existing Endpoints (Ready to Use)

```typescript
// Jobs Dashboard Stats
GET /api/adminpanel/jobs/dashboard-stats
Response: {
  success: boolean;
  stats: {
    total_jobs: number;
    active_jobs: number;
    in_progress_jobs: number;
    completed_jobs: number;
    cancelled_jobs: number;
    total_applications: number;
    pending_applications: number;
    accepted_applications: number;
    total_budget: number;
    avg_budget: number;
    completion_rate: number;
  };
}

// Job Listings with Filters
GET /api/adminpanel/jobs/listings?page=1&page_size=20&status=ACTIVE&category_id=5
Response: {
  success: boolean;
  jobs: Array<{
    id: string;
    title: string;
    description: string;
    category: { id: number; name: string } | null;
    client: { id: string; name: string; rating: number };
    worker: { id: string; name: string; rating: number } | null;
    budget: number;
    location: string;
    urgency: string;
    status: string;
    applications_count: number;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  }>;
  total: number;
  page: number;
  total_pages: number;
}

// Job Applications
GET /api/adminpanel/jobs/applications?page=1&page_size=20&status=PENDING
Response: {
  success: boolean;
  applications: Array<{
    id: string;
    job_id: string;
    job_title: string;
    worker_id: string;
    worker_name: string;
    status: string;
    proposal: string;
    applied_at: string;
  }>;
  total: number;
  page: number;
  total_pages: number;
}

// Job Categories
GET /api/adminpanel/jobs/categories
Response: {
  success: boolean;
  categories: Array<{
    id: number;
    name: string;
    description: string;
    job_count: number;
    avg_budget: number;
  }>;
}

// Disputes
GET /api/adminpanel/jobs/disputes?page=1&page_size=20&status=OPEN&priority=HIGH
Response: {
  success: boolean;
  disputes: Array<{
    id: string;
    job_id: string;
    job_title: string;
    raised_by: string;
    against: string;
    reason: string;
    status: string;
    priority: string;
    created_at: string;
  }>;
  total: number;
  page: number;
  total_pages: number;
}
```

### Missing Endpoint - Job Detail with Timeline

**⚠️ NEEDS BACKEND IMPLEMENTATION**

```typescript
// NEW ENDPOINT NEEDED
GET / api / adminpanel / jobs / { id } / detail;
Response: {
  success: boolean;
  job: JobDetail; // Full job object
  timeline: JobTimeline; // All milestone timestamps
}
```

**Backend Implementation Required** (`apps/backend/src/adminpanel/service.py`):

```python
def get_job_detail_with_timeline(job_id: str):
    """
    Fetch job detail with complete timeline data for admin panel.

    Returns job info, client/worker details, and all milestone timestamps.
    """
    from jobs.models import Job, JobApplication
    from accounts.models import Review

    try:
        job = Job.objects.select_related(
            'clientID__profileID__accountFK',
            'categoryID'
        ).get(jobID=job_id)

        # Get assigned worker (if any)
        worker = None
        worker_assigned_at = None
        if job.workerID:
            worker = {
                'id': job.workerID.accountFK.accountID,
                'name': f"{job.workerID.firstName} {job.workerID.lastName}",
                'email': job.workerID.accountFK.email,
                'phone': job.workerID.contactNum,
                'rating': job.workerID.averageRating or 0.0,
            }

            # Find when worker was assigned (accepted application)
            app = JobApplication.objects.filter(
                jobID=job,
                workerID=job.workerID,
                status='ACCEPTED'
            ).first()
            worker_assigned_at = app.acceptedAt.isoformat() if app and app.acceptedAt else None

        # Get reviews
        reviews = Review.objects.filter(jobID=job)
        client_review = reviews.filter(reviewerID__profileID=job.clientID).first()
        worker_review = reviews.filter(revieweeID__profileID=job.workerID).first() if job.workerID else None

        # Build timeline
        timeline = {
            'job_posted': job.createdAt.isoformat(),
            'worker_assigned': worker_assigned_at,
            'worker_name': worker['name'] if worker else None,
            'start_initiated': job.startInitiatedAt.isoformat() if hasattr(job, 'startInitiatedAt') and job.startInitiatedAt else None,
            'worker_arrived': job.workerArrivedAt.isoformat() if hasattr(job, 'workerArrivedAt') and job.workerArrivedAt else None,
            'worker_marked_complete': job.workerCompletedAt.isoformat() if hasattr(job, 'workerCompletedAt') and job.workerCompletedAt else None,
            'completion_photos': [img.image for img in job.jobimages_set.all()] if hasattr(job, 'jobimages_set') else [],
            'completion_notes': job.completionNotes if hasattr(job, 'completionNotes') else None,
            'client_confirmed': job.clientApprovedAt.isoformat() if hasattr(job, 'clientApprovedAt') and job.clientApprovedAt else None,
            'client_reviewed': client_review.createdAt.isoformat() if client_review else None,
            'worker_reviewed': worker_review.createdAt.isoformat() if worker_review else None,
            'reviews_complete': bool(client_review and worker_review),
        }

        # Get applications
        applications = JobApplication.objects.filter(jobID=job).select_related('workerID__accountFK')

        return {
            'success': True,
            'job': {
                'id': str(job.jobID),
                'title': job.jobTitle,
                'description': job.jobDesc,
                'status': job.job_status,
                'urgency': job.urgencyLevel or 'MEDIUM',
                'budget': float(job.budget),
                'location': f"{job.barangayID.name}, {job.cityID.name}" if job.barangayID and job.cityID else 'Location not specified',
                'category': {
                    'id': job.categoryID.categoryID,
                    'name': job.categoryID.categoryName,
                } if job.categoryID else None,
                'client': {
                    'id': str(job.clientID.accountFK.accountID),
                    'name': f"{job.clientID.firstName} {job.clientID.lastName}",
                    'email': job.clientID.accountFK.email,
                    'phone': job.clientID.contactNum,
                    'rating': 0.0,  # TODO: Calculate client rating
                },
                'worker': worker,
                'applications_count': applications.count(),
                'applications': [
                    {
                        'id': str(app.applicationID),
                        'worker_name': f"{app.workerID.firstName} {app.workerID.lastName}",
                        'status': app.status,
                        'applied_at': app.createdAt.isoformat(),
                    }
                    for app in applications
                ],
                'timeline': timeline,
                'created_at': job.createdAt.isoformat(),
                'updated_at': job.updatedAt.isoformat() if job.updatedAt else None,
                'completed_at': job.completedAt.isoformat() if hasattr(job, 'completedAt') and job.completedAt else None,
            },
        }
    except Job.DoesNotExist:
        return {'success': False, 'error': 'Job not found'}
    except Exception as e:
        print(f"Error in get_job_detail_with_timeline: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}
```

**Add to `apps/backend/src/adminpanel/api.py`**:

```python
@router.get("/jobs/{job_id}/detail")
def get_job_detail(request, job_id: str):
    """Get detailed job information with timeline for admin panel."""
    try:
        result = get_job_detail_with_timeline(job_id)
        return result
    except Exception as e:
        print(f"❌ Error fetching job detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
```

## Implementation Tasks

### Task 3.1: Update Jobs Dashboard with Real Stats (2 hours)

**File**: `apps/frontend_web/app/admin/jobs/page.tsx`

**Current State**: Has basic structure, needs real API integration

**Prompt for AI Agent**:

```
Update apps/frontend_web/app/admin/jobs/page.tsx to fetch real stats from /api/adminpanel/jobs/dashboard-stats.

Requirements:
1. Remove any hardcoded/mock stats
2. Add state: const [stats, setStats] = useState<JobStats | null>(null);
3. Create fetchStats() function calling the API endpoint
4. Update all stat cards to display real data
5. Add loading state with skeleton cards
6. Add error state if API fails
7. Calculate derived metrics (completion rate, average budget)
8. Update "Recent Activity" section (if available from API)
9. Update "Top Categories" section (if available from API)

Ensure credentials: 'include' for cookie auth.
```

---

### Task 3.2: Enhance Job Listings Page (3 hours)

**File**: `apps/frontend_web/app/admin/jobs/listings/page.tsx`

**Current State**: Has some API integration, needs completion

**Prompt for AI Agent**:

```
Complete apps/frontend_web/app/admin/jobs/listings/page.tsx with full filtering and pagination.

Requirements:
1. Ensure API integration with /api/adminpanel/jobs/listings is working
2. Add filter dropdowns:
   - Status: All/ACTIVE/IN_PROGRESS/COMPLETED/CANCELLED
   - Category: Fetch from /api/adminpanel/jobs/categories
   - Urgency: All/LOW/MEDIUM/HIGH
3. Add search input (debounced, searches title/description)
4. Implement pagination controls (prev/next buttons)
5. Add "View Details" button on each row → navigate to /admin/jobs/listings/[id]
6. Display urgency with color indicators (HIGH=red, MEDIUM=orange, LOW=green)
7. Show application count badge on each job
8. Add loading state while fetching
9. Handle empty state (no jobs found)

Table should be responsive with horizontal scroll on mobile.
```

---

### Task 3.3: Create Job Detail Page with Timeline (8 hours)

**File**: `apps/frontend_web/app/admin/jobs/listings/[id]/page.tsx` (NEW)

**This is the main deliverable - 6-milestone timeline visualization**

**Prompt for AI Agent**:

```
Create apps/frontend_web/app/admin/jobs/listings/[id]/page.tsx with comprehensive job detail and 6-milestone timeline.

**CRITICAL**: First verify backend endpoint exists. If /api/adminpanel/jobs/{id}/detail doesn't exist, we need to implement it in Django first.

Requirements:

1. **Page Layout**:
   - Sidebar + main content area
   - Back button to listings page
   - Job title as page heading
   - 3-column grid: Job Info | Client Info | Worker Info (if assigned)

2. **Job Info Card**:
   - Title, description, category badge
   - Status badge with color coding
   - Budget (formatted as ₱XX,XXX.XX)
   - Location (city, barangay)
   - Urgency indicator
   - Created/Updated timestamps

3. **Client Info Card**:
   - Name, email, phone
   - User rating (stars)
   - "View Profile" button → /admin/users/clients/[id]

4. **Worker Info Card** (if assigned):
   - Name, email, phone
   - Worker rating (stars)
   - "View Profile" button → /admin/users/workers/[id]
   - Assignment date

5. **Timeline Visualization** (use JobTimelineVisualization component):
   - Vertical timeline with 6 milestones
   - Status icons: ⏳ (pending), 🔵 (in-progress), ✅ (completed)
   - Timestamps formatted as "Nov 24, 2025 3:45 PM"
   - Relative time (e.g., "2 days ago")
   - Time elapsed between milestones (e.g., "2h 15m")
   - Color coding: gray (not started) → blue (current) → green (completed)
   - Completion photos thumbnail grid (milestone 5)
   - Export to PDF button

6. **Applications Section**:
   - List all applications with status badges
   - Show worker name, applied date, status
   - Link to view application detail

7. **Data Fetching**:
   - Fetch from /api/adminpanel/jobs/{id}/detail
   - Handle loading state
   - Handle 404 (job not found)
   - Handle API errors

8. **Timeline Component** (create separately):
   - File: apps/frontend_web/app/admin/jobs/components/JobTimelineVisualization.tsx
   - Accepts timeline prop with all milestone timestamps
   - Renders vertical timeline with icons, timestamps, elapsed times
   - Handles missing timestamps (shows as "Pending")
   - Shows completion photos if available
   - Export functionality (jsPDF library)

Ensure mobile responsive design.
```

---

### Task 3.4: Create Job Applications Management (4 hours)

**File**: `apps/frontend_web/app/admin/jobs/applications/page.tsx` (NEW)

**Prompt for AI Agent**:

```
Create apps/frontend_web/app/admin/jobs/applications/page.tsx for application tracking.

Requirements:
1. Fetch from /api/adminpanel/jobs/applications
2. Display applications table with columns:
   - Application ID
   - Job Title (link to job detail)
   - Worker Name (link to worker profile)
   - Status badge (PENDING/ACCEPTED/REJECTED/WITHDRAWN)
   - Applied Date
   - Actions (View Details button)
3. Add status filter dropdown (all/pending/accepted/rejected/withdrawn)
4. Add search input (searches job title, worker name)
5. Add pagination controls
6. Add stats cards at top:
   - Total Applications
   - Pending Applications
   - Accepted Applications
   - Rejection Rate (calculated)
7. Add loading state
8. Handle empty state

Table should be responsive.
```

---

### Task 3.5: Create Disputes Management (5 hours)

**File**: `apps/frontend_web/app/admin/jobs/disputes/page.tsx` (NEW)

**Prompt for AI Agent**:

```
Create apps/frontend_web/app/admin/jobs/disputes/page.tsx for conflict resolution.

Requirements:
1. Fetch from /api/adminpanel/jobs/disputes
2. Display disputes table with columns:
   - Dispute ID
   - Job Title (link to job detail with timeline)
   - Raised By (client or worker)
   - Against (the other party)
   - Reason/Description
   - Priority badge (LOW/MEDIUM/HIGH/CRITICAL)
   - Status badge (OPEN/UNDER_REVIEW/RESOLVED/CLOSED)
   - Created Date
   - Actions (View Details, Resolve, Close)
3. Add filter dropdowns:
   - Status: all/open/under_review/resolved/closed
   - Priority: all/low/medium/high/critical
4. Add search input
5. Add pagination
6. Add stats cards:
   - Total Disputes
   - Open Disputes
   - Resolved This Month
   - Average Resolution Time
7. Priority color coding:
   - CRITICAL: red background
   - HIGH: orange background
   - MEDIUM: yellow background
   - LOW: green background
8. Create dispute detail modal with:
   - Full reason/description
   - Timeline of events
   - Link to job detail page
   - Resolution actions (Resolve, Close, Escalate)
   - Admin notes input
9. Add loading state
10. Handle empty state

Ensure disputes are prominently displayed (admin should address quickly).
```

---

### Task 3.6: Create Categories Management (4 hours)

**File**: `apps/frontend_web/app/admin/jobs/categories/page.tsx` (NEW)

**Prompt for AI Agent**:

```
Create apps/frontend_web/app/admin/jobs/categories/page.tsx for category CRUD and minimum rates.

Requirements:
1. Fetch from /api/adminpanel/jobs/categories
2. Display categories table with columns:
   - Category Name
   - Description
   - Job Count (total jobs in this category)
   - Average Budget (calculated from all jobs)
   - Minimum Rate (₱XX.XX per hour)
   - Actions (Edit, Delete)
3. Add "Create Category" button → opens modal
4. Create category modal with fields:
   - Name (required)
   - Description (optional)
   - Minimum Rate (required, number input)
   - Icon selection (optional)
5. Edit category modal (same fields, pre-filled)
6. Delete confirmation dialog
7. Add stats cards:
   - Total Categories
   - Most Popular Category (by job count)
   - Highest Average Budget Category
8. Sort by job count (descending) by default
9. Add search input (filters by name)
10. Add loading state
11. Handle empty state (no categories)

Note: Backend may need new endpoints for category CRUD (create, update, delete).
If endpoints don't exist, create TODO comment and skip CRUD actions for now.
```

---

### Task 3.7: Create Timeline Export to PDF (3 hours)

**File**: `apps/frontend_web/app/admin/jobs/components/TimelineExporter.ts`

**Prompt for AI Agent**:

````
Create apps/frontend_web/app/admin/jobs/components/TimelineExporter.ts for PDF export.

Requirements:
1. Install jsPDF library: npm install jspdf
2. Create exportTimelineToPDF() function:
   - Accepts JobTimeline and JobDetail objects
   - Generates PDF with:
     * Header: "Job Timeline Report - [Job Title]"
     * Job information section
     * Timeline milestones (all 6) with timestamps
     * Completion photos (embedded if available)
     * Footer: Generated date, admin name
3. Format PDF professionally:
   - Use consistent fonts (Helvetica)
   - Add iAyos logo (if available)
   - Color-coded milestone status
   - Page numbers if multi-page
4. Auto-download PDF when function called
5. Filename format: "job_timeline_{jobId}_{date}.pdf"

Example usage:
```typescript
import { exportTimelineToPDF } from './TimelineExporter';

<Button onClick={() => exportTimelineToPDF(job.timeline, job)}>
  <Download className="mr-2" />
  Export Timeline as PDF
</Button>
````

This feature is useful for dispute resolution and client records.

````

---

## Database Schema Verification

**⚠️ IMPORTANT**: Verify Job model has these timestamp fields:

```python
# apps/backend/src/jobs/models.py

class Job(models.Model):
    # ... existing fields ...

    # Timeline timestamps (verify these exist or add them)
    createdAt = models.DateTimeField(auto_now_add=True)  # Milestone 1: Job Posted
    startInitiatedAt = models.DateTimeField(null=True, blank=True)  # Milestone 3
    workerArrivedAt = models.DateTimeField(null=True, blank=True)  # Milestone 4
    workerCompletedAt = models.DateTimeField(null=True, blank=True)  # Milestone 5
    clientApprovedAt = models.DateTimeField(null=True, blank=True)  # Milestone 6
    completionNotes = models.TextField(null=True, blank=True)
    updatedAt = models.DateTimeField(auto_now=True)
    completedAt = models.DateTimeField(null=True, blank=True)
````

**If fields are missing**, create Django migration:

```bash
cd apps/backend
python manage.py makemigrations --name add_job_timeline_fields
python manage.py migrate
```

## Testing Checklist

After completing all tasks, verify:

- [ ] Jobs dashboard displays real stats from API
- [ ] Job listings page fetches and displays all jobs
- [ ] Filters work (status, category, urgency)
- [ ] Search filters jobs by title/description
- [ ] Pagination controls work
- [ ] Job detail page opens with full information
- [ ] **Timeline displays all 6 milestones correctly**
- [ ] **Milestone timestamps show formatted dates**
- [ ] **Time elapsed calculates between milestones**
- [ ] **Status icons show correct state (pending/in-progress/completed)**
- [ ] **Color coding matches milestone status**
- [ ] Completion photos display in thumbnail grid
- [ ] Photo thumbnails open full-size viewer
- [ ] Export to PDF button generates downloadable PDF
- [ ] PDF contains all timeline information
- [ ] Applications management page displays all applications
- [ ] Application filters and search work
- [ ] Disputes page displays open disputes prominently
- [ ] Dispute priority color coding works
- [ ] Categories page displays all categories
- [ ] Categories show job count and average budget
- [ ] Mobile responsive design works
- [ ] No TypeScript compilation errors
- [ ] No console errors during normal operation

## Success Criteria

Module 3 is complete when:

1. ✅ All 6 pages implemented and functional
2. ✅ **6-milestone timeline fully visualized**
3. ✅ Timeline shows elapsed time between steps
4. ✅ Completion photos embedded in timeline
5. ✅ PDF export generates complete timeline report
6. ✅ Real API integration (zero mock data)
7. ✅ Disputes management operational
8. ✅ Categories management functional
9. ✅ TypeScript compiles without errors
10. ✅ All 25 testing checklist items pass

## Next Steps

After Module 3 completion:

1. Update `AGENTS.md` with completed job tracking features
2. Test timeline with real in-progress jobs
3. Verify all milestone timestamps are captured correctly
4. Proceed to Module 4 (Reviews Management)

---

**Last Updated**: January 2025  
**Status**: Ready for implementation  
**Assigned Priority**: CRITICAL (Core feature: Timeline)

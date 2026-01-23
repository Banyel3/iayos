# Agency Module 4: Job Lifecycle Management

**Status**: 📋 PLANNED  
**Priority**: CRITICAL  
**Estimated Time**: 10-12 hours  
**Dependencies**: Module 1 (Employee Assignment System)

---

## Module Overview

Complete job lifecycle management for agency portal, integrating the two-phase completion workflow from mobile app. Enables agencies to monitor job progress from acceptance through completion, including work start confirmation, worker completion marking, and client approval phases.

### Scope

- Active jobs listing with status badges
- Job detail view with timeline visualization
- Two-phase completion workflow integration
- Photo gallery for completion proofs
- Status transition validations
- Real-time status updates
- Job history with search/filters
- Completion notes display

---

## Current State Analysis

### ✅ What Exists (Mobile App)

**Two-Phase Completion Workflow** (`apps/frontend_mobile/iayos_mobile/app/jobs/active/[id].tsx`):

```typescript
// Phase 1: Worker marks complete
const workerMarkComplete = async () => {
  const response = await apiRequest(ENDPOINTS.MARK_JOB_COMPLETE(jobId), {
    method: "POST",
    body: JSON.stringify({
      notes: completionNotes,
      photos: uploadedPhotos,
    }),
  });
  // Sets workerMarkedComplete=true
  // Sends notification to client
  // Job stays IN_PROGRESS
};

// Phase 2: Client approves
const clientApproveComplete = async () => {
  const response = await apiRequest(ENDPOINTS.APPROVE_JOB_COMPLETION(jobId), {
    method: "POST",
    body: JSON.stringify({
      payment_method: "WALLET", // or GCASH, CASH
      cash_proof_image: cashProof,
    }),
  });
  // Sets clientMarkedComplete=true
  // Changes status to COMPLETED
  // Releases escrow payment
};
```

**Backend Validation** (`apps/backend/src/jobs/api.py`):

```python
# Line 2337: Worker mark complete
@router.post("/jobs/{job_id}/mark-complete", auth=jwt_auth)
def worker_mark_job_complete(request, job_id: int, payload: WorkerMarkCompleteSchema):
    job = Job.objects.get(jobID=job_id)

    # CRITICAL: Must have work started confirmation first
    if not job.clientConfirmedWorkStarted:
        return Response({'error': 'Client has not confirmed work started'}, status=400)

    job.workerMarkedComplete = True
    job.workerMarkedCompleteAt = timezone.now()
    job.completionNotes = payload.notes
    # Job.status stays IN_PROGRESS
    job.save()

    # Notify client
    create_notification(job.clientID, 'Worker marked job complete')

# Line 2600: Client approve completion
@router.post("/jobs/{job_id}/approve-completion", auth=jwt_auth)
def client_approve_job_completion(request, job_id: int, payload: ClientApproveSchema):
    job = Job.objects.get(jobID=job_id)

    # CRITICAL: Must have worker mark first
    if not job.workerMarkedComplete:
        return Response({'error': 'Worker has not marked complete'}, status=400)

    job.clientMarkedComplete = True
    job.clientMarkedCompleteAt = timezone.now()
    job.status = 'COMPLETED'  # NOW it's completed
    job.completedAt = timezone.now()
    job.save()

    # Release escrow payment to worker
    release_escrow_payment(job)

    # Notify worker
    create_notification(job.assignedWorkerID, 'Job completed, payment released')
```

**Job Model Fields** (`apps/backend/src/accounts/models.py`):

```python
class Job(models.Model):
    # Milestone 1: Work start confirmation
    clientConfirmedWorkStarted = models.BooleanField(default=False)
    clientConfirmedWorkStartedAt = models.DateTimeField(null=True, blank=True)

    # Milestone 2: Worker completion
    workerMarkedComplete = models.BooleanField(default=False)
    workerMarkedCompleteAt = models.DateTimeField(null=True, blank=True)
    completionNotes = models.TextField(null=True, blank=True)

    # Milestone 3: Client approval
    clientMarkedComplete = models.BooleanField(default=False)
    clientMarkedCompleteAt = models.DateTimeField(null=True, blank=True)

    # Status field
    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE', 'Active'),
            ('IN_PROGRESS', 'In Progress'),
            ('COMPLETED', 'Completed'),
            ('CANCELLED', 'Cancelled')
        ]
    )

    # Photo uploads
    photos = models.JSONField(default=list, blank=True)  # Array of URLs
```

### ✅ What Exists (Agency Portal)

**Jobs Page** (`apps/frontend_web/app/agency/jobs/page.tsx` - 474 lines):

- Accept/reject invitations
- Job cards with basic info
- **Missing**: Active jobs view, status tracking, completion workflow

### ❌ What's Missing for Agency

1. **No active jobs page** - can't see in-progress jobs
2. **No status visualization** - no timeline or progress indicators
3. **No photo gallery** - can't view completion photos
4. **No completion monitoring** - can't see when worker marks complete
5. **No client approval tracking** - can't monitor final approval
6. **No job history page** - can't view completed jobs
7. **No status badges** - no visual status indicators

---

## Job Status Flow

```
┌──────────┐
│  ACTIVE  │ (Job posted by client)
└────┬─────┘
     │
     │ Agency accepts invitation
     ▼
┌──────────┐
│ ASSIGNED │ (Module 1: Employee assigned)
└────┬─────┘
     │
     │ Client confirms work started (clientConfirmedWorkStarted=true)
     ▼
┌──────────────┐
│ IN_PROGRESS  │
└────┬─────────┘
     │
     │ Worker marks complete (workerMarkedComplete=true)
     │ Status STAYS IN_PROGRESS
     ▼
┌────────────────────┐
│ PENDING_APPROVAL   │ (Visual status only, DB still IN_PROGRESS)
└────┬───────────────┘
     │
     │ Client approves completion (clientMarkedComplete=true)
     │ Status changes to COMPLETED
     │ Escrow payment released
     ▼
┌───────────┐
│ COMPLETED │
└───────────┘
```

---

## Implementation

### Task 1: Active Jobs Page ⏰ 3-4 hours

**File**: `apps/frontend_web/app/agency/jobs/active/page.tsx` (NEW)

```typescript
"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface ActiveJob {
  job_id: number;
  title: string;
  description: string;
  budget: number;
  status: string;
  urgency: string;
  client: { id: number; name: string; email: string };
  assigned_employee: { id: number; name: string; email: string } | null;
  location: string;
  created_at: string;
  accepted_at: string;
  client_confirmed_work_started: boolean;
  client_confirmed_work_started_at: string | null;
  worker_marked_complete: boolean;
  worker_marked_complete_at: string | null;
  client_marked_complete: boolean;
  client_marked_complete_at: string | null;
  completion_notes: string | null;
  photos: string[];
}

export default function ActiveJobsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'pending_approval'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['agency-active-jobs', statusFilter],
    queryFn: async () => {
      const response = await fetch('/api/agency/jobs/active', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const jobs: ActiveJob[] = data?.jobs || [];

  const getVisualStatus = (job: ActiveJob): string => {
    if (job.client_marked_complete) return 'COMPLETED';
    if (job.worker_marked_complete) return 'PENDING_APPROVAL';
    if (job.client_confirmed_work_started) return 'IN_PROGRESS';
    if (job.assigned_employee) return 'ASSIGNED';
    return 'ACTIVE';
  };

  const getStatusBadge = (job: ActiveJob) => {
    const visualStatus = getVisualStatus(job);

    const badges = {
      ACTIVE: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Active' },
      ASSIGNED: { color: 'bg-yellow-100 text-yellow-800', icon: User, label: 'Assigned' },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' },
      PENDING_APPROVAL: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Pending Approval' },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
    };

    const badge = badges[visualStatus as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[urgency as keyof typeof colors]}`}>
        {urgency}
      </span>
    );
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === 'in_progress') {
      return job.client_confirmed_work_started && !job.worker_marked_complete;
    }
    if (statusFilter === 'pending_approval') {
      return job.worker_marked_complete && !job.client_marked_complete;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Active Jobs</h1>
        <p className="text-gray-600">Monitor ongoing jobs and completions</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({jobs.length})
        </button>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            statusFilter === 'in_progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          In Progress ({jobs.filter(j => j.client_confirmed_work_started && !j.worker_marked_complete).length})
        </button>
        <button
          onClick={() => setStatusFilter('pending_approval')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            statusFilter === 'pending_approval'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending Approval ({jobs.filter(j => j.worker_marked_complete && !j.client_marked_complete).length})
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No active jobs</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.job_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
            >
              {/* Header Row */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(job)}
                    {getUrgencyBadge(job.urgency)}
                  </div>
                </div>
                <Link href={`/agency/jobs/active/${job.job_id}`}>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <Eye size={16} />
                    View Details
                  </button>
                </Link>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="text-gray-400" size={16} />
                  <span className="text-gray-700">₱{job.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="text-gray-400" size={16} />
                  <span className="text-gray-700 truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="text-gray-400" size={16} />
                  <span className="text-gray-700 truncate">{job.client.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-gray-400" size={16} />
                  <span className="text-gray-700">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Assigned Employee */}
              {job.assigned_employee && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Assigned to:</span> {job.assigned_employee.name}
                  </p>
                </div>
              )}

              {/* Progress Indicators */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`text-center p-3 rounded-lg ${
                  job.client_confirmed_work_started
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}>
                  <CheckCircle
                    className={job.client_confirmed_work_started ? 'text-green-600' : 'text-gray-400'}
                    size={20}
                  />
                  <p className="text-xs mt-1 font-medium">Work Started</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${
                  job.worker_marked_complete
                    ? 'bg-orange-100 border border-orange-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}>
                  <CheckCircle
                    className={job.worker_marked_complete ? 'text-orange-600' : 'text-gray-400'}
                    size={20}
                  />
                  <p className="text-xs mt-1 font-medium">Worker Complete</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${
                  job.client_marked_complete
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}>
                  <CheckCircle
                    className={job.client_marked_complete ? 'text-green-600' : 'text-gray-400'}
                    size={20}
                  />
                  <p className="text-xs mt-1 font-medium">Client Approved</p>
                </div>
              </div>

              {/* Worker Marked Complete Alert */}
              {job.worker_marked_complete && !job.client_marked_complete && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">
                        Worker marked this job as complete
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        Waiting for client approval to release payment
                      </p>
                      {job.completion_notes && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{job.completion_notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

### Task 2: Job Detail with Timeline ⏰ 4-5 hours

**File**: `apps/frontend_web/app/agency/jobs/active/[id]/page.tsx` (NEW)

```typescript
"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface JobDetail {
  job_id: number;
  title: string;
  description: string;
  budget: number;
  status: string;
  urgency: string;
  category: string;
  client: { id: number; name: string; email: string; phone: string };
  assigned_employee: { id: number; name: string; email: string } | null;
  location: string;
  latitude: number;
  longitude: number;
  created_at: string;
  accepted_at: string;
  assigned_at: string | null;
  client_confirmed_work_started: boolean;
  client_confirmed_work_started_at: string | null;
  worker_marked_complete: boolean;
  worker_marked_complete_at: string | null;
  client_marked_complete: boolean;
  client_marked_complete_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  photos: string[];
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['agency-job-detail', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/agency/jobs/${jobId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch job');
      return response.json();
    },
  });

  const job: JobDetail = data?.job;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-64 rounded-lg" />
          <div className="bg-gray-200 h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Job not found</p>
      </div>
    );
  }

  const timeline = [
    {
      label: 'Job Created',
      timestamp: job.created_at,
      completed: true,
      icon: FileText,
    },
    {
      label: 'Accepted by Agency',
      timestamp: job.accepted_at,
      completed: true,
      icon: CheckCircle,
    },
    {
      label: 'Employee Assigned',
      timestamp: job.assigned_at,
      completed: !!job.assigned_at,
      icon: User,
    },
    {
      label: 'Work Started',
      timestamp: job.client_confirmed_work_started_at,
      completed: job.client_confirmed_work_started,
      icon: Clock,
    },
    {
      label: 'Worker Marked Complete',
      timestamp: job.worker_marked_complete_at,
      completed: job.worker_marked_complete,
      icon: CheckCircle,
    },
    {
      label: 'Client Approved',
      timestamp: job.client_marked_complete_at,
      completed: job.client_marked_complete,
      icon: CheckCircle,
    },
    {
      label: 'Job Completed',
      timestamp: job.completed_at,
      completed: job.client_marked_complete,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="p-6">
      {/* Back Button */}
      <Link href="/agency/jobs/active">
        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft size={20} />
          Back to Active Jobs
        </button>
      </Link>

      {/* Job Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
        <p className="text-gray-700 mb-4">{job.description}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Budget</p>
            <p className="text-lg font-semibold text-gray-900">₱{job.budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="text-lg font-semibold text-gray-900">{job.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Urgency</p>
            <p className="text-lg font-semibold text-gray-900">{job.urgency}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-lg font-semibold text-gray-900 truncate">{job.location}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Progress Timeline</h2>
          <div className="space-y-4">
            {timeline.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  {/* Dot + Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.completed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={item.completed ? 'text-green-600' : 'text-gray-400'} size={20} />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className={`w-0.5 h-12 ${
                        item.completed ? 'bg-green-300' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <p className={`font-medium ${
                      item.completed ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </p>
                    {item.timestamp && (
                      <p className="text-sm text-gray-600">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-6">
          {/* Client */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Client</h2>
            <div className="space-y-2">
              <p className="text-gray-700"><span className="font-medium">Name:</span> {job.client.name}</p>
              <p className="text-gray-700"><span className="font-medium">Email:</span> {job.client.email}</p>
              <p className="text-gray-700"><span className="font-medium">Phone:</span> {job.client.phone}</p>
            </div>
          </div>

          {/* Assigned Employee */}
          {job.assigned_employee && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assigned Employee</h2>
              <div className="space-y-2">
                <p className="text-gray-700"><span className="font-medium">Name:</span> {job.assigned_employee.name}</p>
                <p className="text-gray-700"><span className="font-medium">Email:</span> {job.assigned_employee.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Notes */}
      {job.completion_notes && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Completion Notes</h2>
          <p className="text-gray-700 italic">"{job.completion_notes}"</p>
        </div>
      )}

      {/* Photo Gallery */}
      {job.photos && job.photos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon size={24} />
            Completion Photos ({job.photos.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {job.photos.map((photo, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo}
                  alt={`Completion photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
```

---

### Task 3: Backend API Endpoints ⏰ 2-3 hours

**File**: `apps/backend/src/agency/api.py` (ADD)

```python
@router.get("/jobs/active", auth=cookie_auth)
def get_active_jobs(request, page: int = 1, limit: int = 20):
    """
    Get all active/in-progress jobs for agency

    GET /api/agency/jobs/active?page=1&limit=20
    """
    try:
        agency = Agency.objects.get(accountFK=request.auth)
    except Agency.DoesNotExist:
        return Response({'error': 'Agency not found'}, status=404)

    # Get jobs where status is ACTIVE or IN_PROGRESS
    jobs = Job.objects.filter(
        assignedAgencyFK=agency,
        status__in=['ACTIVE', 'IN_PROGRESS']
    ).exclude(
        clientMarkedComplete=True
    ).select_related(
        'clientID',
        'assignedWorkerID__profileID__accountFK',
        'assignedEmployeeID'
    ).order_by('-createdAt')

    # Pagination
    total = jobs.count()
    start = (page - 1) * limit
    end = start + limit
    jobs_page = jobs[start:end]

    # Format jobs
    results = []
    for job in jobs_page:
        results.append({
            'job_id': job.jobID,
            'title': job.title,
            'description': job.description,
            'budget': float(job.budget),
            'status': job.status,
            'urgency': job.urgency,
            'client': {
                'id': job.clientID.accountID,
                'name': f"{job.clientID.firstName} {job.clientID.lastName}",
                'email': job.clientID.email
            },
            'assigned_employee': {
                'id': job.assignedEmployeeID.employeeID,
                'name': job.assignedEmployeeID.name,
                'email': job.assignedEmployeeID.email
            } if job.assignedEmployeeID else None,
            'location': job.location,
            'created_at': job.createdAt.isoformat(),
            'accepted_at': job.acceptedAt.isoformat() if job.acceptedAt else None,
            'client_confirmed_work_started': job.clientConfirmedWorkStarted,
            'client_confirmed_work_started_at': job.clientConfirmedWorkStartedAt.isoformat() if job.clientConfirmedWorkStartedAt else None,
            'worker_marked_complete': job.workerMarkedComplete,
            'worker_marked_complete_at': job.workerMarkedCompleteAt.isoformat() if job.workerMarkedCompleteAt else None,
            'client_marked_complete': job.clientMarkedComplete,
            'client_marked_complete_at': job.clientMarkedCompleteAt.isoformat() if job.clientMarkedCompleteAt else None,
            'completion_notes': job.completionNotes,
            'photos': job.photos if hasattr(job, 'photos') else []
        })

    return Response({
        'success': True,
        'jobs': results,
        'total': total,
        'page': page,
        'pages': (total + limit - 1) // limit
    })


@router.get("/jobs/{job_id}", auth=cookie_auth)
def get_job_detail(request, job_id: int):
    """
    Get detailed job information

    GET /api/agency/jobs/{id}
    """
    try:
        agency = Agency.objects.get(accountFK=request.auth)
    except Agency.DoesNotExist:
        return Response({'error': 'Agency not found'}, status=404)

    try:
        job = Job.objects.select_related(
            'clientID',
            'assignedWorkerID__profileID__accountFK',
            'assignedEmployeeID',
            'categoryID'
        ).get(
            jobID=job_id,
            assignedAgencyFK=agency
        )
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=404)

    return Response({
        'success': True,
        'job': {
            'job_id': job.jobID,
            'title': job.title,
            'description': job.description,
            'budget': float(job.budget),
            'status': job.status,
            'urgency': job.urgency,
            'category': job.categoryID.categoryName if job.categoryID else 'General',
            'client': {
                'id': job.clientID.accountID,
                'name': f"{job.clientID.firstName} {job.clientID.lastName}",
                'email': job.clientID.email,
                'phone': job.clientID.phoneNumber or 'N/A'
            },
            'assigned_employee': {
                'id': job.assignedEmployeeID.employeeID,
                'name': job.assignedEmployeeID.name,
                'email': job.assignedEmployeeID.email
            } if job.assignedEmployeeID else None,
            'location': job.location,
            'latitude': float(job.latitude) if job.latitude else None,
            'longitude': float(job.longitude) if job.longitude else None,
            'created_at': job.createdAt.isoformat(),
            'accepted_at': job.acceptedAt.isoformat() if job.acceptedAt else None,
            'assigned_at': job.employeeAssignedAt.isoformat() if hasattr(job, 'employeeAssignedAt') and job.employeeAssignedAt else None,
            'client_confirmed_work_started': job.clientConfirmedWorkStarted,
            'client_confirmed_work_started_at': job.clientConfirmedWorkStartedAt.isoformat() if job.clientConfirmedWorkStartedAt else None,
            'worker_marked_complete': job.workerMarkedComplete,
            'worker_marked_complete_at': job.workerMarkedCompleteAt.isoformat() if job.workerMarkedCompleteAt else None,
            'client_marked_complete': job.clientMarkedComplete,
            'client_marked_complete_at': job.clientMarkedCompleteAt.isoformat() if job.clientMarkedCompleteAt else None,
            'completed_at': job.completedAt.isoformat() if job.completedAt else None,
            'completion_notes': job.completionNotes,
            'photos': job.photos if hasattr(job, 'photos') else []
        }
    })
```

---

### Task 4: Job History Page ⏰ 2 hours

**File**: `apps/frontend_web/app/agency/jobs/history/page.tsx` (NEW)

Similar to active jobs page but filters for `status='COMPLETED'` and `clientMarkedComplete=true`. Add search by job title, client name, date range filter.

---

## Testing Checklist

### Backend Tests

- [ ] Active jobs API returns correct jobs
- [ ] Active jobs filters by status
- [ ] Job detail API returns complete data
- [ ] Job detail verifies agency ownership
- [ ] Timeline milestones return correct timestamps
- [ ] Photos array returns URLs
- [ ] Completion notes return correctly

### Frontend Tests

- [ ] Active jobs page loads
- [ ] Status filters work (all/in_progress/pending_approval)
- [ ] Status badges display correctly
- [ ] Visual status calculation correct
- [ ] Progress indicators show correct state
- [ ] Job detail page loads
- [ ] Timeline renders all milestones
- [ ] Timeline shows completed/incomplete states
- [ ] Photo gallery displays images
- [ ] Photo lightbox opens on click
- [ ] Completion notes display
- [ ] Back button navigates correctly

---

## Success Criteria

✅ Module 4 complete when:

1. Active jobs page created
2. Status badges working
3. Progress indicators displaying
4. Job detail page created
5. Timeline visualization working
6. Photo gallery functional
7. Completion notes showing
8. Backend APIs returning correct data
9. All tests passing
10. Zero errors

---

**Next Module**: Module 5 (Admin Integration) - Replace MOCK DATA in admin panel

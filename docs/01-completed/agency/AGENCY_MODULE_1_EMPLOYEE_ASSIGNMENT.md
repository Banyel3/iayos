# Agency Module 1: Employee Assignment System

**Status**: 📋 PLANNED  
**Priority**: HIGH  
**Estimated Time**: 8-12 hours  
**Dependencies**: None (uses existing agency infrastructure)

---

## Module Overview

Employee job assignment system allowing agencies to assign accepted INVITE-type jobs to specific employees. This is the **critical missing link** between job acceptance and worker execution—currently agencies can accept jobs but cannot assign them to workers, blocking the entire workflow.

### Scope

- Job-to-employee assignment interface
- Employee availability filtering
- Assignment notifications
- Database schema updates
- Assignment tracking and history
- Unassignment/reassignment capability

---

## Current State Analysis

### ✅ What Exists

**Agency Jobs Page** (`apps/frontend_web/app/agency/jobs/page.tsx` - 474 lines):

- Shows PENDING invitations (invite_status=PENDING)
- Accept/Reject functionality working
- Job cards with full details displayed
- API integration with `GET /api/agency/jobs`

**Backend APIs**:

```python
GET  /api/agency/jobs           # List jobs with filters
POST /api/agency/jobs/{id}/accept   # Accept invitation
POST /api/agency/jobs/{id}/reject   # Reject invitation
GET  /api/agency/employees      # List employees
```

**Database Models**:

```python
# Job model has:
- assignedWorkerID (FK to WorkerProfile)
- assignedAgencyFK (FK to Agency)
- inviteStatus (PENDING/ACCEPTED/REJECTED)

# AgencyEmployee model has:
- employeeId (PK)
- agencyFK (FK to Agency)
- name, email, role
- rating, totalJobsCompleted, totalEarnings
- isActive (Boolean)
```

### ❌ What's Missing

1. **No assigned_employee_id field** on Job model for agency worker assignment
2. **No assignment API endpoint** (`POST /api/agency/jobs/{id}/assign-employee`)
3. **No assignment UI** in jobs page
4. **No employee availability tracking** (available/busy status)
5. **No assignment notifications** to employees
6. **No assignment history/audit trail**

### Problem Statement

**Current Flow** (BROKEN):

```
Client invites agency → Agency accepts → ❌ STOPS HERE
```

**Expected Flow** (TO IMPLEMENT):

```
Client invites agency
  → Agency accepts
  → Agency assigns to employee
  → Employee sees job in mobile app
  → Employee works on job
  → Two-phase completion flow
```

---

## Backend Implementation

### Task 1: Database Migration ⏰ 1 hour

**Create Migration**: `0038_job_assigned_employee_tracking.py`

```python
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0037_worker_phase1_profile_enhancements'),
    ]

    operations = [
        # Add assigned employee field for agency job assignments
        migrations.AddField(
            model_name='job',
            name='assignedEmployeeID',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assigned_jobs',
                to='agency.agencyemployee',
                help_text='Specific agency employee assigned to this job'
            ),
        ),

        # Add assignment timestamp
        migrations.AddField(
            model_name='job',
            name='employeeAssignedAt',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='When employee was assigned by agency'
            ),
        ),

        # Add assignment notes
        migrations.AddField(
            model_name='job',
            name='assignmentNotes',
            field=models.TextField(
                blank=True,
                null=True,
                help_text='Notes from agency about this assignment'
            ),
        ),

        # Add index for performance
        migrations.AddIndex(
            model_name='job',
            index=models.Index(
                fields=['assignedEmployeeID', 'status'],
                name='job_assigned_employee_status_idx'
            ),
        ),
    ]
```

**Run Migration**:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### Task 2: Assignment Service Function ⏰ 2-3 hours

**File**: `apps/backend/src/agency/services.py`

**Add Function** (after existing `get_agency_jobs` function ~line 450):

```python
def assign_job_to_employee(
    agency_account,
    job_id: int,
    employee_id: int,
    assignment_notes: str = None
) -> dict:
    """
    Assign an accepted job to a specific agency employee

    Args:
        agency_account: The authenticated agency account
        job_id: ID of the job to assign
        employee_id: ID of the employee to assign
        assignment_notes: Optional notes about the assignment

    Returns:
        dict with success status and job details

    Raises:
        ValueError for validation errors
    """
    from accounts.models import Job, Notification, JobLog
    from agency.models import AgencyEmployee
    from django.utils import timezone
    from django.db import transaction

    try:
        # Get agency
        agency = Agency.objects.get(accountFK=agency_account)
    except Agency.DoesNotExist:
        raise ValueError("Agency account not found")

    # Get job and validate
    try:
        job = Job.objects.select_related(
            'clientID__profileID__accountFK',
            'assignedAgencyFK',
            'assignedWorkerID'
        ).get(jobID=job_id)
    except Job.DoesNotExist:
        raise ValueError(f"Job {job_id} not found")

    # Verify job belongs to this agency
    if job.assignedAgencyFK != agency:
        raise ValueError("This job is not assigned to your agency")

    # Verify job is in correct status
    if job.inviteStatus != 'ACCEPTED':
        raise ValueError(f"Cannot assign job with invite status: {job.inviteStatus}")

    if job.status not in ['ACTIVE', 'ASSIGNED']:
        raise ValueError(f"Cannot assign job with status: {job.status}")

    # Check if already assigned to an employee
    if job.assignedEmployeeID:
        raise ValueError(
            f"Job is already assigned to {job.assignedEmployeeID.name}. "
            "Please unassign first if you want to reassign."
        )

    # Get employee and validate
    try:
        employee = AgencyEmployee.objects.select_related(
            'agencyFK'
        ).get(employeeId=employee_id)
    except AgencyEmployee.DoesNotExist:
        raise ValueError(f"Employee {employee_id} not found")

    # Verify employee belongs to this agency
    if employee.agencyFK != agency:
        raise ValueError("This employee does not belong to your agency")

    # Verify employee is active
    if not employee.isActive:
        raise ValueError(f"Employee {employee.name} is not active")

    # TODO: Check employee availability (future enhancement)
    # active_jobs_count = Job.objects.filter(
    #     assignedEmployeeID=employee,
    #     status__in=['ACTIVE', 'IN_PROGRESS']
    # ).count()
    # if active_jobs_count >= 3:  # Example limit
    #     raise ValueError(f"Employee {employee.name} has too many active jobs")

    # Assign job to employee (atomic transaction)
    with transaction.atomic():
        # Update job
        job.assignedEmployeeID = employee
        job.employeeAssignedAt = timezone.now()
        job.assignmentNotes = assignment_notes or ""
        job.status = 'ASSIGNED'  # Update status to ASSIGNED
        job.save()

        # Create job log entry
        JobLog.objects.create(
            jobID=job,
            action='EMPLOYEE_ASSIGNED',
            notes=f"Agency '{agency.businessName}' assigned employee '{employee.name}' to job. Notes: {assignment_notes or 'None'}",
            changedBy=agency_account,
            oldStatus=job.status,
            newStatus='ASSIGNED'
        )

        # Get employee's account if exists (for notification)
        # NOTE: AgencyEmployee may not have linked accountFK yet
        # This will be added in future when employees can login
        employee_account = getattr(employee, 'accountFK', None)

        if employee_account:
            # Create notification for employee
            Notification.objects.create(
                accountFK=employee_account,
                notificationType='JOB_ASSIGNED',
                title=f'New Job Assignment: {job.title}',
                message=f'You have been assigned to work on "{job.title}" for client {job.clientID.profileID.firstName}. Budget: ₱{job.budget}',
                relatedJobID=job.jobID
            )

        # Create notification for client
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType='AGENCY_ASSIGNED_WORKER',
            title=f'Worker Assigned to Your Job',
            message=f'{agency.businessName} has assigned {employee.name} to work on "{job.title}".',
            relatedJobID=job.jobID
        )

        print(f"✅ Job {job_id} assigned to employee {employee.name} (ID: {employee_id})")

    return {
        'success': True,
        'message': f'Job successfully assigned to {employee.name}',
        'job_id': job.jobID,
        'employee_id': employee.employeeId,
        'employee_name': employee.name,
        'assigned_at': job.employeeAssignedAt.isoformat(),
        'status': job.status
    }


def unassign_job_from_employee(
    agency_account,
    job_id: int,
    reason: str = None
) -> dict:
    """
    Unassign a job from an employee (for reassignment or cancellation)

    Args:
        agency_account: The authenticated agency account
        job_id: ID of the job to unassign
        reason: Reason for unassignment

    Returns:
        dict with success status
    """
    from accounts.models import Job, Notification, JobLog
    from django.utils import timezone
    from django.db import transaction

    try:
        agency = Agency.objects.get(accountFK=agency_account)
    except Agency.DoesNotExist:
        raise ValueError("Agency account not found")

    try:
        job = Job.objects.select_related(
            'assignedEmployeeID',
            'assignedAgencyFK'
        ).get(jobID=job_id)
    except Job.DoesNotExist:
        raise ValueError(f"Job {job_id} not found")

    # Verify job belongs to this agency
    if job.assignedAgencyFK != agency:
        raise ValueError("This job is not assigned to your agency")

    # Check if job has an assigned employee
    if not job.assignedEmployeeID:
        raise ValueError("This job does not have an assigned employee")

    # Verify job hasn't started work yet
    if job.status == 'IN_PROGRESS':
        raise ValueError("Cannot unassign employee from job that is already in progress")

    if job.workerMarkedComplete or job.clientMarkedComplete:
        raise ValueError("Cannot unassign employee from completed job")

    employee_name = job.assignedEmployeeID.name
    employee_id = job.assignedEmployeeID.employeeId

    with transaction.atomic():
        # Clear assignment
        job.assignedEmployeeID = None
        job.employeeAssignedAt = None
        job.assignmentNotes = None
        job.status = 'ACTIVE'  # Revert to ACTIVE for reassignment
        job.save()

        # Create job log
        JobLog.objects.create(
            jobID=job,
            action='EMPLOYEE_UNASSIGNED',
            notes=f"Agency '{agency.businessName}' unassigned employee '{employee_name}'. Reason: {reason or 'Not specified'}",
            changedBy=agency_account,
            oldStatus='ASSIGNED',
            newStatus='ACTIVE'
        )

        print(f"✅ Employee {employee_name} (ID: {employee_id}) unassigned from job {job_id}")

    return {
        'success': True,
        'message': f'Employee {employee_name} unassigned from job',
        'job_id': job.jobID,
        'unassigned_employee': employee_name
    }


def get_employee_workload(agency_account, employee_id: int) -> dict:
    """
    Get current workload for an employee (for assignment decisions)

    Returns:
        dict with active jobs count, in-progress count, availability status
    """
    from accounts.models import Job

    try:
        agency = Agency.objects.get(accountFK=agency_account)
    except Agency.DoesNotExist:
        raise ValueError("Agency account not found")

    try:
        employee = AgencyEmployee.objects.get(
            employeeId=employee_id,
            agencyFK=agency
        )
    except AgencyEmployee.DoesNotExist:
        raise ValueError(f"Employee {employee_id} not found")

    # Count active and in-progress jobs
    active_jobs = Job.objects.filter(
        assignedEmployeeID=employee,
        status='ASSIGNED'
    ).count()

    in_progress_jobs = Job.objects.filter(
        assignedEmployeeID=employee,
        status='IN_PROGRESS'
    ).count()

    total_active = active_jobs + in_progress_jobs

    # Determine availability (simple logic for now)
    if not employee.isActive:
        availability = 'INACTIVE'
    elif total_active >= 3:
        availability = 'BUSY'
    elif total_active >= 1:
        availability = 'WORKING'
    else:
        availability = 'AVAILABLE'

    return {
        'employee_id': employee.employeeId,
        'employee_name': employee.name,
        'is_active': employee.isActive,
        'assigned_jobs_count': active_jobs,
        'in_progress_jobs_count': in_progress_jobs,
        'total_active_jobs': total_active,
        'availability': availability
    }
```

---

### Task 3: API Endpoints ⏰ 1-2 hours

**File**: `apps/backend/src/agency/api.py`

**Add Endpoints** (after existing job endpoints ~line 180):

```python
@router.post("/jobs/{job_id}/assign-employee", auth=cookie_auth)
def assign_job_to_employee_endpoint(
    request,
    job_id: int,
    employee_id: int = Form(...),
    assignment_notes: str = Form(None)
):
    """
    Assign an accepted job to a specific employee

    POST /api/agency/jobs/{job_id}/assign-employee
    Body (FormData):
      - employee_id: int (required)
      - assignment_notes: str (optional)
    """
    try:
        result = assign_job_to_employee(
            agency_account=request.auth,
            job_id=job_id,
            employee_id=employee_id,
            assignment_notes=assignment_notes
        )
        return Response(result, status=200)

    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error assigning job to employee: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


@router.post("/jobs/{job_id}/unassign-employee", auth=cookie_auth)
def unassign_job_from_employee_endpoint(
    request,
    job_id: int,
    reason: str = Form(None)
):
    """
    Unassign an employee from a job

    POST /api/agency/jobs/{job_id}/unassign-employee
    Body (FormData):
      - reason: str (optional)
    """
    try:
        result = unassign_job_from_employee(
            agency_account=request.auth,
            job_id=job_id,
            reason=reason
        )
        return Response(result, status=200)

    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error unassigning employee: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )


@router.get("/employees/{employee_id}/workload", auth=cookie_auth)
def get_employee_workload_endpoint(request, employee_id: int):
    """
    Get current workload for an employee

    GET /api/agency/employees/{employee_id}/workload
    """
    try:
        result = get_employee_workload(
            agency_account=request.auth,
            employee_id=employee_id
        )
        return Response(result, status=200)

    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        print(f"❌ Error getting employee workload: {str(e)}")
        return Response(
            {'success': False, 'error': 'Internal server error'},
            status=500
        )
```

---

## Frontend Implementation

### Task 4: Assignment Modal Component ⏰ 2-3 hours

**File**: `apps/frontend_web/components/agency/AssignEmployeeModal.tsx` (NEW)

```typescript
"use client";

import { useState, useEffect } from "react";
import { X, User, Briefcase, AlertCircle, CheckCircle } from "lucide-react";

interface Employee {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  totalJobsCompleted: number;
  isActive: boolean;
  workload?: {
    assigned_jobs_count: number;
    in_progress_jobs_count: number;
    total_active_jobs: number;
    availability: 'AVAILABLE' | 'WORKING' | 'BUSY' | 'INACTIVE';
  };
}

interface Job {
  jobID: number;
  title: string;
  budget: string;
  category: string;
  urgency: string;
}

interface AssignEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  employees: Employee[];
  onAssign: (employeeId: number, notes: string) => Promise<void>;
}

export default function AssignEmployeeModal({
  isOpen,
  onClose,
  job,
  employees,
  onAssign,
}: AssignEmployeeModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeWorkloads, setEmployeeWorkloads] = useState<Record<number, Employee['workload']>>({});

  // Fetch workload for each employee
  useEffect(() => {
    if (isOpen && employees.length > 0) {
      employees.forEach(async (employee) => {
        try {
          const response = await fetch(
            `/api/agency/employees/${employee.employeeId}/workload`,
            { credentials: "include" }
          );

          if (response.ok) {
            const data = await response.json();
            setEmployeeWorkloads(prev => ({
              ...prev,
              [employee.employeeId]: data
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch workload for employee ${employee.employeeId}:`, error);
        }
      });
    }
  }, [isOpen, employees]);

  const handleAssign = async () => {
    if (!selectedEmployeeId) {
      alert("Please select an employee");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssign(selectedEmployeeId, assignmentNotes);
      onClose();
      setSelectedEmployeeId(null);
      setAssignmentNotes("");
    } catch (error) {
      console.error("Assignment failed:", error);
      alert(error instanceof Error ? error.message : "Assignment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getAvailabilityBadge = (availability?: string) => {
    if (!availability) return null;

    const badges = {
      AVAILABLE: { color: "bg-green-100 text-green-800", text: "Available" },
      WORKING: { color: "bg-blue-100 text-blue-800", text: "Working" },
      BUSY: { color: "bg-orange-100 text-orange-800", text: "Busy" },
      INACTIVE: { color: "bg-gray-100 text-gray-800", text: "Inactive" },
    };

    const badge = badges[availability as keyof typeof badges];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // Filter active employees
  const activeEmployees = employees.filter(e => e.isActive);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assign Employee to Job</h2>
            <p className="text-sm text-gray-600 mt-1">{job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Job Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Budget:</span>
                <span className="ml-2 font-semibold text-gray-900">₱{job.budget}</span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-semibold text-gray-900">{job.category}</span>
              </div>
              <div>
                <span className="text-gray-600">Urgency:</span>
                <span className={`ml-2 font-semibold ${
                  job.urgency === 'HIGH' ? 'text-red-600' :
                  job.urgency === 'MEDIUM' ? 'text-orange-600' : 'text-green-600'
                }`}>{job.urgency}</span>
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Select Employee</h3>

            {activeEmployees.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-600">No active employees available</p>
              </div>
            ) : (
              activeEmployees.map((employee) => {
                const workload = employeeWorkloads[employee.employeeId];
                const isSelected = selectedEmployeeId === employee.employeeId;

                return (
                  <button
                    key={employee.employeeId}
                    onClick={() => setSelectedEmployeeId(employee.employeeId)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {employee.name.charAt(0)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                            {workload && getAvailabilityBadge(workload.availability)}
                          </div>

                          <p className="text-sm text-gray-600">{employee.role}</p>

                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              ⭐ {employee.rating.toFixed(1)}
                            </span>
                            <span className="flex items-center">
                              <Briefcase size={14} className="mr-1" />
                              {employee.totalJobsCompleted} jobs
                            </span>
                            {workload && (
                              <span className="flex items-center">
                                📋 {workload.total_active_jobs} active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle className="text-blue-500 flex-shrink-0" size={24} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Assignment Notes */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Assignment Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Add any specific instructions or notes for this assignment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedEmployeeId || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Assign Employee</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 5: Update Jobs Page ⏰ 2-3 hours

**File**: `apps/frontend_web/app/agency/jobs/page.tsx` (MODIFY - 474 lines)

**Changes Needed**:

1. **Add assignment state management** (after line 50):

```typescript
const [assignModalOpen, setAssignModalOpen] = useState(false);
const [selectedJobForAssignment, setSelectedJobForAssignment] =
  useState<any>(null);
```

2. **Add assignment mutation** (after accept/reject mutations ~line 80):

```typescript
const assignEmployeeMutation = useMutation({
  mutationFn: async ({
    jobId,
    employeeId,
    notes,
  }: {
    jobId: number;
    employeeId: number;
    notes: string;
  }) => {
    const formData = new FormData();
    formData.append("employee_id", employeeId.toString());
    if (notes) formData.append("assignment_notes", notes);

    const response = await fetch(`/api/agency/jobs/${jobId}/assign-employee`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to assign employee");
    }

    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["agency-jobs"] });
    setSuccessMessage("Employee assigned successfully!");
    setAssignModalOpen(false);
    setSelectedJobForAssignment(null);
  },
  onError: (error: Error) => {
    setErrorMessage(error.message);
  },
});
```

3. **Add "Assign Employee" button** in job card (after "Accept" button ~line 350):

```typescript
{/* Show Assign button for ACCEPTED jobs without employee assignment */}
{job.inviteStatus === 'ACCEPTED' && !job.assignedEmployeeID && (
  <button
    onClick={() => {
      setSelectedJobForAssignment(job);
      setAssignModalOpen(true);
    }}
    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
  >
    <User size={18} />
    <span>Assign Employee</span>
  </button>
)}

{/* Show assigned employee badge */}
{job.assignedEmployeeID && (
  <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
    <CheckCircle size={18} className="text-green-600" />
    <span className="text-sm text-green-700">
      Assigned to: <span className="font-semibold">{job.assignedEmployeeID.name}</span>
    </span>
  </div>
)}
```

4. **Add AssignEmployeeModal** (before return statement):

```typescript
<AssignEmployeeModal
  isOpen={assignModalOpen}
  onClose={() => {
    setAssignModalOpen(false);
    setSelectedJobForAssignment(null);
  }}
  job={selectedJobForAssignment}
  employees={employees || []}
  onAssign={async (employeeId, notes) => {
    await assignEmployeeMutation.mutateAsync({
      jobId: selectedJobForAssignment.jobID,
      employeeId,
      notes,
    });
  }}
/>
```

5. **Import component** (at top of file):

```typescript
import AssignEmployeeModal from "@/components/agency/AssignEmployeeModal";
```

---

## Testing Checklist

### Backend Tests

- [ ] Migration runs successfully without errors
- [ ] Job model has new fields (assignedEmployeeID, employeeAssignedAt, assignmentNotes)
- [ ] assign_job_to_employee validates agency ownership
- [ ] assign_job_to_employee validates employee belongs to agency
- [ ] assign_job_to_employee validates job status
- [ ] assign_job_to_employee prevents double assignment
- [ ] assign_job_to_employee creates JobLog entry
- [ ] assign_job_to_employee sends notifications
- [ ] unassign_job_from_employee works correctly
- [ ] unassign_job_from_employee prevents unassign of IN_PROGRESS jobs
- [ ] get_employee_workload returns correct counts
- [ ] API endpoints return proper status codes
- [ ] API endpoints validate authentication

### Frontend Tests

- [ ] AssignEmployeeModal renders correctly
- [ ] Employee list fetches and displays
- [ ] Employee workload displays (Available/Working/Busy badges)
- [ ] Employee selection works (radio button behavior)
- [ ] Assignment notes textarea accepts input
- [ ] "Assign Employee" button disabled when no selection
- [ ] Assignment mutation calls correct API
- [ ] Success message displays after assignment
- [ ] Error message displays on failure
- [ ] Modal closes after successful assignment
- [ ] Jobs list refreshes after assignment
- [ ] "Assign Employee" button shows for ACCEPTED jobs
- [ ] Assigned employee badge displays after assignment
- [ ] Cannot assign to already-assigned job

### Integration Tests

- [ ] End-to-end: Accept job → Assign employee → Employee sees job
- [ ] Job status changes to ASSIGNED after assignment
- [ ] Notifications sent to client and employee
- [ ] Reassignment works (unassign then assign again)
- [ ] Multiple agencies cannot assign same employee
- [ ] Employee from Agency A cannot be assigned to Agency B's job

---

## API Summary

| Endpoint                                  | Method | Purpose                    | Status    |
| ----------------------------------------- | ------ | -------------------------- | --------- |
| `/api/agency/jobs/{id}/assign-employee`   | POST   | Assign job to employee     | ❌ CREATE |
| `/api/agency/jobs/{id}/unassign-employee` | POST   | Unassign employee from job | ❌ CREATE |
| `/api/agency/employees/{id}/workload`     | GET    | Get employee workload      | ❌ CREATE |
| `/api/agency/employees`                   | GET    | List employees             | ✅ EXISTS |
| `/api/agency/jobs`                        | GET    | List jobs                  | ✅ EXISTS |

---

## Database Schema Changes

```sql
-- New fields on Job table
ALTER TABLE Job ADD COLUMN assignedEmployeeID INTEGER NULL;
ALTER TABLE Job ADD COLUMN employeeAssignedAt TIMESTAMP NULL;
ALTER TABLE Job ADD COLUMN assignmentNotes TEXT NULL;

-- Foreign key
ALTER TABLE Job ADD CONSTRAINT fk_assigned_employee
  FOREIGN KEY (assignedEmployeeID) REFERENCES AgencyEmployee(employeeId)
  ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_job_assigned_employee_status
  ON Job(assignedEmployeeID, status);
```

---

## Future Enhancements

### Phase 2 Improvements (Not in this module):

1. **Employee Availability System**
   - Real-time availability status (available/busy/offline)
   - Automatic status updates based on active jobs
   - Calendar integration for scheduled availability
   - GPS location tracking for field workers

2. **Smart Assignment Suggestions**
   - AI-powered employee matching based on:
     - Skills and job requirements
     - Location proximity
     - Past performance
     - Current workload
   - Auto-suggest best employee for each job

3. **Assignment Rules**
   - Max concurrent jobs per employee
   - Skill-based assignment restrictions
   - Location-based assignment (only nearby jobs)
   - Client preference matching

4. **Assignment Analytics**
   - Assignment success rate by employee
   - Average time to complete by employee
   - Client satisfaction correlation
   - Optimal workload analysis

5. **Mobile Worker App**
   - Employee login system
   - See assigned jobs in mobile app
   - Accept/decline assignments
   - Update job progress
   - Communication with agency

---

## Success Criteria

✅ Module 1 complete when:

1. Database migration applied successfully
2. Backend assignment APIs functional
3. AssignEmployeeModal component working
4. Jobs page shows "Assign Employee" button
5. Employee selection and assignment works
6. Notifications sent to client and employee
7. Job status updates to ASSIGNED
8. Assigned employee badge displays
9. Unassignment functionality works
10. All tests passing
11. Zero TypeScript/Python errors

---

**Implementation Priority**: 🔴 **CRITICAL - BLOCKING**

This module **MUST** be completed before Module 4 (Job Lifecycle) can function, as you cannot track job progress without employee assignment.

**Next Module**: Module 2 (Chat) or Module 4 (Job Lifecycle)

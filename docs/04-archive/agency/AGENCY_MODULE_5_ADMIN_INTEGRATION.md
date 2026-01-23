# Agency Module 5: Admin Integration - Replace Mock Data

**Status**: 📋 PLANNED  
**Priority**: HIGH  
**Estimated Time**: 4-6 hours  
**Dependencies**: None (existing admin panel)

---

## Module Overview

Complete the admin panel agency workers page by replacing MOCK DATA with real API integration. Enable bulk employee management, performance viewing, search/filter functionality, and CSV export.

### Scope

- Replace mock data with real API calls
- Connect to existing GET /api/agency/employees endpoint
- Implement bulk activation/deactivation
- Add performance modal with real metrics
- Enable search and status filtering
- Add CSV export functionality
- Display real employee statistics

---

## Current State Analysis

### ✅ What Exists

**Admin Agency Workers Page** (`apps/frontend_web/app/admin/users/agency/[id]/workers/page.tsx` - 376 lines):

```typescript
// Line 18-50: MOCK DATA (NEEDS REPLACEMENT)
const mockWorkers = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    role: "Plumber",
    rating: 4.8,
    jobsCompleted: 127,
    totalEarnings: 45000,
    status: "active",
    joinedDate: "2024-01-15",
  },
  // ... 9 more mock workers
];
```

**Features Already Implemented (UI only)**:

- Statistics cards (total, active, avg rating, total jobs)
- Search input
- Status filter dropdown
- Multi-select checkboxes
- Bulk action buttons (Activate, Deactivate)
- Worker cards with avatar, info, badges
- "View Performance" button (modal not implemented)
- Export CSV button (not functional)

### ✅ Backend APIs Available

**Phase 2 Part 2 APIs** (Already implemented):

```python
GET /api/agency/employees  # List all employees
GET /api/agency/employees/{id}/performance  # Employee performance metrics
PUT /api/agency/employees/{id}/rating  # Update rating
POST /api/agency/employees/{id}/set-eotm  # Set Employee of the Month
GET /api/agency/employees/leaderboard  # Ranked list
```

### ❌ What's Missing

1. **No API integration** - using hardcoded MOCK DATA
2. **No performance modal** - "View Performance" button does nothing
3. **No bulk actions backend** - activate/deactivate not connected
4. **No real statistics** - cards show mock numbers
5. **No CSV export logic** - button has no onClick
6. **No agency_id query** - not fetching specific agency's employees

---

## Implementation

### Task 1: Agency Employees API Hook ⏰ 1 hour

**File**: `apps/frontend_web/lib/hooks/useAdminAgency.ts` (NEW)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AgencyEmployee {
  employee_id: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  total_jobs_completed: number;
  total_earnings: number;
  is_active: boolean;
  joined_date: string;
}

interface EmployeePerformance {
  profile: {
    id: number;
    name: string;
    email: string;
    rating: number;
  };
  jobs: {
    completed: number;
    active: number;
    cancelled: number;
  };
  earnings: {
    total: number;
    this_month: number;
    last_month: number;
  };
  ratings: {
    average: number;
    count: number;
    breakdown: { [key: number]: number };
  };
  recent_jobs: Array<{
    job_id: number;
    title: string;
    client_name: string;
    completed_at: string;
    rating: number;
  }>;
}

export function useAgencyEmployees(agencyId: number) {
  return useQuery<AgencyEmployee[]>({
    queryKey: ["admin-agency-employees", agencyId],
    queryFn: async () => {
      // Fetch agency's employees via admin endpoint
      // Note: May need to create admin-specific endpoint
      // For now, use agency endpoint with impersonation
      const response = await fetch(
        `/api/agency/employees?agency_id=${agencyId}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();

      // Map to admin format
      return data.employees.map((emp: any) => ({
        employee_id: emp.employee_id,
        name: emp.name,
        email: emp.email,
        role: emp.role || "Worker",
        rating: emp.rating || 0,
        total_jobs_completed: emp.total_jobs_completed || 0,
        total_earnings: emp.total_earnings || 0,
        is_active: emp.is_active !== false, // Default to true
        joined_date: emp.joined_date || emp.created_at,
      }));
    },
    enabled: !!agencyId,
  });
}

export function useEmployeePerformance(employeeId: number) {
  return useQuery<EmployeePerformance>({
    queryKey: ["employee-performance", employeeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/agency/employees/${employeeId}/performance`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch performance");
      return response.json();
    },
    enabled: !!employeeId,
  });
}

export function useBulkUpdateEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeIds,
      action,
      agencyId,
    }: {
      employeeIds: number[];
      action: "activate" | "deactivate";
      agencyId: number;
    }) => {
      // Note: Backend endpoint may need to be created
      const response = await fetch("/api/admin/agency/employees/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employee_ids: employeeIds,
          action,
          agency_id: agencyId,
        }),
      });
      if (!response.ok) throw new Error("Failed to update employees");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-agency-employees", variables.agencyId],
      });
    },
  });
}
```

---

### Task 2: Replace Mock Data ⏰ 1 hour

**File**: `apps/frontend_web/app/admin/users/agency/[id]/workers/page.tsx` (MODIFY)

**Changes**:

1. Remove lines 18-50 (MOCK DATA)
2. Add hook usage
3. Update statistics calculations
4. Update worker list rendering

```typescript
"use client";

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAgencyEmployees, useBulkUpdateEmployees } from '@/lib/hooks/useAdminAgency';
import { Search, Filter, Download, Eye, UserCheck, UserX, Star, TrendingUp } from 'lucide-react';

export default function AgencyWorkersPage() {
  const params = useParams();
  const agencyId = parseInt(params.id as string);

  const { data: employees, isLoading } = useAgencyEmployees(agencyId);
  const bulkUpdate = useBulkUpdateEmployees();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedWorkers, setSelectedWorkers] = useState<Set<number>>(new Set());

  // Calculate real statistics
  const statistics = useMemo(() => {
    if (!employees) return { total: 0, active: 0, avgRating: 0, totalJobs: 0 };

    const active = employees.filter(e => e.is_active).length;
    const avgRating = employees.length > 0
      ? employees.reduce((sum, e) => sum + e.rating, 0) / employees.length
      : 0;
    const totalJobs = employees.reduce((sum, e) => sum + e.total_jobs_completed, 0);

    return {
      total: employees.length,
      active,
      avgRating: avgRating.toFixed(1),
      totalJobs,
    };
  }, [employees]);

  // Filter workers
  const filteredWorkers = useMemo(() => {
    if (!employees) return [];

    return employees.filter((worker) => {
      const matchesSearch =
        worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && worker.is_active) ||
        (statusFilter === 'inactive' && !worker.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedWorkers.size === 0) {
      alert('Please select at least one worker');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to ${action} ${selectedWorkers.size} worker(s)?`
    );
    if (!confirmed) return;

    try {
      await bulkUpdate.mutateAsync({
        employeeIds: Array.from(selectedWorkers),
        action,
        agencyId,
      });
      setSelectedWorkers(new Set());
      alert(`Successfully ${action}d ${selectedWorkers.size} worker(s)`);
    } catch (error) {
      alert(`Failed to ${action} workers`);
    }
  };

  const handleExportCSV = () => {
    if (!employees) return;

    const headers = ['Name', 'Email', 'Role', 'Rating', 'Jobs Completed', 'Total Earnings', 'Status', 'Joined Date'];
    const rows = filteredWorkers.map((worker) => [
      worker.name,
      worker.email,
      worker.role,
      worker.rating,
      worker.total_jobs_completed,
      `₱${worker.total_earnings.toLocaleString()}`,
      worker.is_active ? 'Active' : 'Inactive',
      new Date(worker.joined_date).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agency-${agencyId}-workers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg" />
            ))}
          </div>
          <div className="bg-gray-200 h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Workers</h3>
            <UserCheck className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{statistics.total}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Active Workers</h3>
            <UserCheck className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{statistics.active}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Avg Rating</h3>
            <Star className="text-yellow-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{statistics.avgRating}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Jobs</h3>
            <TrendingUp className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{statistics.totalJobs}</p>
        </div>
      </div>

      {/* Rest of the page remains the same... */}
      {/* Search, filters, bulk actions, worker cards */}
    </div>
  );
}
```

---

### Task 3: Performance Modal ⏰ 2 hours

**File**: `apps/frontend_web/components/admin/EmployeePerformanceModal.tsx` (NEW)

```typescript
"use client";

import { useEmployeePerformance } from '@/lib/hooks/useAdminAgency';
import { X, Star, TrendingUp, DollarSign, Briefcase } from 'lucide-react';

interface EmployeePerformanceModalProps {
  employeeId: number;
  employeeName: string;
  onClose: () => void;
}

export default function EmployeePerformanceModal({
  employeeId,
  employeeName,
  onClose,
}: EmployeePerformanceModalProps) {
  const { data: performance, isLoading } = useEmployeePerformance(employeeId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-8 rounded" />
            <div className="bg-gray-200 h-32 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!performance) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Performance: {employeeName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="text-blue-600" size={20} />
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {performance.jobs.completed}
            </p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-orange-600" size={20} />
              <h3 className="text-sm font-medium text-gray-600">Active</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {performance.jobs.active}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={20} />
              <h3 className="text-sm font-medium text-gray-600">Total Earnings</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₱{performance.earnings.total.toLocaleString()}
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-yellow-600" size={20} />
              <h3 className="text-sm font-medium text-gray-600">Avg Rating</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {performance.ratings.average.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Earnings Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-xl font-bold text-green-600">
                ₱{performance.earnings.this_month.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Month</p>
              <p className="text-xl font-bold text-gray-900">
                ₱{performance.earnings.last_month.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Rating Distribution ({performance.ratings.count} reviews)
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = performance.ratings.breakdown[stars] || 0;
              const percentage = performance.ratings.count > 0
                ? (count / performance.ratings.count) * 100
                : 0;

              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 w-8">
                    {stars}⭐
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-yellow-500 h-4 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Jobs */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Recent Jobs</h3>
          <div className="space-y-3">
            {performance.recent_jobs.slice(0, 5).map((job) => (
              <div
                key={job.job_id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600">
                      Client: {job.client_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(job.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  {job.rating && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                      <Star className="text-yellow-500 fill-yellow-500" size={14} />
                      <span className="text-sm font-medium text-gray-900">
                        {job.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Integrate Modal** in `workers/page.tsx`:

```typescript
import EmployeePerformanceModal from '@/components/admin/EmployeePerformanceModal';

// Add state
const [performanceModalEmployeeId, setPerformanceModalEmployeeId] = useState<number | null>(null);
const [performanceModalName, setPerformanceModalName] = useState<string>('');

// Update "View Performance" button onClick
<button
  onClick={() => {
    setPerformanceModalEmployeeId(worker.employee_id);
    setPerformanceModalName(worker.name);
  }}
  className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
>
  <Eye size={14} />
  View Performance
</button>

// Add modal at end of component
{performanceModalEmployeeId && (
  <EmployeePerformanceModal
    employeeId={performanceModalEmployeeId}
    employeeName={performanceModalName}
    onClose={() => {
      setPerformanceModalEmployeeId(null);
      setPerformanceModalName('');
    }}
  />
)}
```

---

### Task 4: Backend Bulk Update Endpoint (Optional) ⏰ 1 hour

**File**: `apps/backend/src/adminpanel/api.py` (ADD)

```python
@router.post("/agency/employees/bulk-update", auth=cookie_auth)
def bulk_update_employees(request, payload: BulkUpdateEmployeesSchema):
    """
    Bulk activate/deactivate agency employees

    POST /api/admin/agency/employees/bulk-update
    Body: {
        "employee_ids": [1, 2, 3],
        "action": "activate" | "deactivate",
        "agency_id": 5
    }
    """
    from agency.models import AgencyEmployee

    # Verify admin permission
    if not hasattr(request.auth, 'is_staff') or not request.auth.is_staff:
        return Response({'error': 'Admin access required'}, status=403)

    action = payload.action
    employee_ids = payload.employee_ids

    # Validate action
    if action not in ['activate', 'deactivate']:
        return Response({'error': 'Invalid action'}, status=400)

    # Update employees
    is_active = (action == 'activate')
    updated_count = AgencyEmployee.objects.filter(
        employeeID__in=employee_ids,
        agencyFK__agencyID=payload.agency_id
    ).update(isActive=is_active)

    return Response({
        'success': True,
        'updated': updated_count,
        'action': action
    })


class BulkUpdateEmployeesSchema(Schema):
    employee_ids: List[int]
    action: str
    agency_id: int
```

---

## Testing Checklist

### Backend Tests

- [ ] Agency employees API returns real data
- [ ] Performance API returns complete metrics
- [ ] Bulk update endpoint updates isActive
- [ ] Bulk update verifies admin permission
- [ ] Bulk update filters by agency_id

### Frontend Tests

- [ ] Statistics cards show real numbers
- [ ] Employee list renders real data
- [ ] Search filters correctly
- [ ] Status filter works
- [ ] Multi-select checkboxes work
- [ ] Bulk activate updates employees
- [ ] Bulk deactivate updates employees
- [ ] Performance modal opens
- [ ] Performance modal displays metrics
- [ ] Performance modal shows rating distribution
- [ ] Performance modal shows recent jobs
- [ ] CSV export downloads file
- [ ] CSV contains correct data
- [ ] Loading states display

---

## Success Criteria

✅ Module 5 complete when:

1. Mock data removed
2. Real API integration working
3. Statistics cards displaying accurate data
4. Performance modal functional
5. Bulk actions working
6. CSV export downloading
7. Search and filters operational
8. All tests passing
9. Zero TypeScript errors
10. Zero console errors

---

**Next Module**: Module 6 (KYC Enhancements) - Resubmission workflow

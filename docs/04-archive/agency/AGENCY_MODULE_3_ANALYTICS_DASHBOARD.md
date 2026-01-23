# Agency Module 3: Performance Analytics Dashboard

**Status**: 📋 PLANNED  
**Priority**: MEDIUM  
**Estimated Time**: 6-8 hours  
**Dependencies**: Phase 2 Part 2 APIs (already implemented)

---

## Module Overview

Comprehensive analytics dashboard visualizing agency performance, employee metrics, revenue trends, and job statistics. Leverages existing Phase 2 Part 2 backend APIs for employee performance tracking.

### Scope

- Revenue and earnings analytics
- Employee performance leaderboard
- Job completion statistics
- Visual charts (line, bar, pie)
- Date range filtering
- CSV export functionality
- Top performers highlighting
- Employee of the Month display

---

## Current State Analysis

### ✅ What Exists

**Phase 2 Part 2 APIs** (Implemented November 13, 2025):

```python
# apps/backend/src/agency/api.py

GET /api/agency/employees/leaderboard
- Query params: sort_by (rating/jobs/earnings), order (asc/desc), limit
- Returns: Ranked employee list with performance metrics
- Fields: name, rating, totalJobsCompleted, totalEarnings, rank

GET /api/agency/employees/{id}/performance
- Returns: Complete employee performance statistics
- Fields: profile, jobs (completed/active/cancelled), earnings, ratings, recent_jobs

GET /api/agency/profile
- Returns: Agency statistics including revenue
- Fields: totalJobs, completedJobs, activeJobs, totalRevenue, averageRating
```

**Existing Dashboard** (`apps/frontend_web/app/agency/dashboard/page.tsx` - 218 lines):

- Basic statistics cards
- Quick action buttons
- No charts or visualizations
- No detailed analytics

### ❌ What's Missing

1. **No analytics page** - no dedicated analytics route
2. **No chart visualizations** - no revenue/job trends
3. **No date range filters** - can't view historical data
4. **No CSV export** - can't export analytics data
5. **No employee comparison** - can't compare employee performance
6. **No category breakdown** - can't see job types distribution

---

## Technical Stack

**Charting Library Options**:

### Option 1: Recharts (RECOMMENDED)

**Pros**:

- React-native components
- Composable API
- Good TypeScript support
- Smaller bundle size (50KB)

**Installation**:

```bash
npm install recharts
```

### Option 2: Chart.js with react-chartjs-2

**Pros**:

- More powerful
- Better animations
- More chart types

**Cons**:

- Larger bundle (180KB)
- Not React-native

**DECISION**: **Recharts** for React-native API and bundle size

---

## Implementation

### Task 1: Install Dependencies ⏰ 5 minutes

```bash
cd apps/frontend_web
npm install recharts date-fns
```

---

### Task 2: Analytics API Hook ⏰ 1 hour

**File**: `apps/frontend_web/lib/hooks/useAnalytics.ts` (NEW)

```typescript
import { useQuery } from "@tanstack/react-query";

interface EmployeeLeaderboard {
  employee_id: number;
  name: string;
  email: string;
  rating: number;
  total_jobs_completed: number;
  total_earnings: number;
  rank: number;
}

interface AgencyStats {
  total_jobs: number;
  completed_jobs: number;
  active_jobs: number;
  total_revenue: number;
  average_rating: number;
}

export function useLeaderboard(
  sortBy: "rating" | "jobs" | "earnings" = "rating",
  order: "asc" | "desc" = "desc",
  limit: number = 10
) {
  return useQuery<EmployeeLeaderboard[]>({
    queryKey: ["agency-leaderboard", sortBy, order, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/agency/employees/leaderboard?sort_by=${sortBy}&order=${order}&limit=${limit}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      const data = await response.json();
      return data.leaderboard;
    },
  });
}

export function useEmployeePerformance(employeeId: number) {
  return useQuery({
    queryKey: ["employee-performance", employeeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/agency/employees/${employeeId}/performance`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch performance");
      return response.json();
    },
    enabled: !!employeeId,
  });
}

export function useAgencyStats() {
  return useQuery<AgencyStats>({
    queryKey: ["agency-stats"],
    queryFn: async () => {
      const response = await fetch("/api/agency/profile", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      return {
        total_jobs: data.statistics.totalJobs,
        completed_jobs: data.statistics.completedJobs,
        active_jobs: data.statistics.activeJobs,
        total_revenue: data.statistics.totalRevenue || 0,
        average_rating: data.statistics.averageRating || 0,
      };
    },
  });
}

// Mock function for revenue trends (backend API to be implemented)
export function useRevenueTrends(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["revenue-trends", startDate, endDate],
    queryFn: async () => {
      // TODO: Implement backend API
      // For now, return mock data
      const mockData = generateMockRevenueTrends(startDate, endDate);
      return mockData;
    },
  });
}

function generateMockRevenueTrends(startDate: Date, endDate: Date) {
  const data = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    data.push({
      date: currentDate.toISOString().split("T")[0],
      revenue: Math.floor(Math.random() * 10000) + 5000,
      jobs: Math.floor(Math.random() * 20) + 5,
    });
    currentDate.setDate(currentDate.getDate() + 7); // Weekly
  }

  return data;
}
```

---

### Task 3: Analytics Page ⏰ 4-5 hours

**File**: `apps/frontend_web/app/agency/analytics/page.tsx` (NEW)

```typescript
"use client";

import { useState } from 'react';
import { useLeaderboard, useAgencyStats, useRevenueTrends } from '@/lib/hooks/useAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Star,
  Award,
  Download,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 3),
    end: new Date(),
  });
  const [leaderboardSort, setLeaderboardSort] = useState<'rating' | 'jobs' | 'earnings'>('rating');

  const { data: stats, isLoading: statsLoading } = useAgencyStats();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(leaderboardSort);
  const { data: revenueTrends } = useRevenueTrends(dateRange.start, dateRange.end);

  if (statsLoading || leaderboardLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-32 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-200 h-64 rounded-lg" />
            <div className="bg-gray-200 h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const completionRate = stats
    ? Math.round((stats.completed_jobs / stats.total_jobs) * 100)
    : 0;

  const handleExportCSV = () => {
    if (!leaderboard) return;

    const headers = ['Rank', 'Name', 'Email', 'Rating', 'Jobs Completed', 'Total Earnings'];
    const rows = leaderboard.map((emp) => [
      emp.rank,
      emp.name,
      emp.email,
      emp.rating,
      emp.total_jobs_completed,
      `₱${emp.total_earnings.toLocaleString()}`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agency-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track performance and insights</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
            <DollarSign className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₱{stats?.total_revenue.toLocaleString() || 0}
          </p>
          <p className="text-sm text-green-600 mt-1">+12% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Jobs Completed</h3>
            <Briefcase className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.completed_jobs || 0}</p>
          <p className="text-sm text-gray-600 mt-1">{completionRate}% completion rate</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Active Jobs</h3>
            <TrendingUp className="text-orange-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.active_jobs || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Currently in progress</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Average Rating</h3>
            <Star className="text-yellow-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.average_rating.toFixed(1) || 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">Out of 5.0</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `₱${value.toLocaleString()}`}
                labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Job Completion by Week */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs Completed (Weekly)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
              />
              <Legend />
              <Bar dataKey="jobs" fill="#10B981" name="Jobs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Leaderboard */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Employee Leaderboard</h3>
          <select
            value={leaderboardSort}
            onChange={(e) => setLeaderboardSort(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="rating">Sort by Rating</option>
            <option value="jobs">Sort by Jobs</option>
            <option value="earnings">Sort by Earnings</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Employee
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Rating
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Jobs
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Earnings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard?.map((employee, index) => (
                <tr
                  key={employee.employee_id}
                  className={index < 3 ? 'bg-blue-50' : 'hover:bg-gray-50'}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Award className="text-yellow-500" size={20} />}
                      {index === 1 && <Award className="text-gray-400" size={20} />}
                      {index === 2 && <Award className="text-orange-600" size={20} />}
                      <span className="font-medium text-gray-900">{employee.rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="text-yellow-500 fill-yellow-500" size={16} />
                      <span className="font-medium text-gray-900">
                        {employee.rating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {employee.total_jobs_completed}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ₱{employee.total_earnings.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers Cards */}
      {leaderboard && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((employee, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const colors = ['yellow', 'gray', 'orange'];
            return (
              <div
                key={employee.employee_id}
                className={`bg-${colors[index]}-50 border-2 border-${colors[index]}-200 p-6 rounded-lg`}
              >
                <div className="text-4xl mb-2">{medals[index]}</div>
                <h4 className="font-bold text-gray-900 text-lg">{employee.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{employee.email}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Rating</p>
                    <p className="font-bold text-gray-900">{employee.rating.toFixed(1)} ⭐</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Jobs</p>
                    <p className="font-bold text-gray-900">{employee.total_jobs_completed}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Earnings</p>
                    <p className="font-bold text-gray-900">
                      ₱{employee.total_earnings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

### Task 4: Navigation Integration ⏰ 15 minutes

**File**: `apps/frontend_web/app/agency/dashboard/page.tsx` (MODIFY)

Add "View Analytics" button:

```typescript
<Link href="/agency/analytics">
  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    <TrendingUp size={16} />
    View Analytics
  </button>
</Link>
```

---

## Future Enhancements (Optional)

### Backend API for Revenue Trends ⏰ 2-3 hours

**File**: `apps/backend/src/agency/api.py` (ADD)

```python
@router.get("/analytics/revenue-trends", auth=cookie_auth)
def get_revenue_trends(
    request,
    start_date: str,  # YYYY-MM-DD
    end_date: str,
    interval: str = 'week'  # week, month
):
    """
    Get revenue trends over time

    GET /api/agency/analytics/revenue-trends?start_date=2025-01-01&end_date=2025-03-01&interval=week
    """
    from datetime import datetime, timedelta
    from django.db.models import Sum, Count
    from django.db.models.functions import TruncWeek, TruncMonth

    try:
        agency = Agency.objects.get(accountFK=request.auth)
    except Agency.DoesNotExist:
        return Response({'error': 'Agency not found'}, status=404)

    # Parse dates
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')

    # Get agency jobs in date range
    jobs = Job.objects.filter(
        assignedAgencyFK=agency,
        completedAt__gte=start,
        completedAt__lte=end,
        status='COMPLETED'
    )

    # Group by interval
    trunc_func = TruncWeek if interval == 'week' else TruncMonth

    trends = jobs.annotate(
        period=trunc_func('completedAt')
    ).values('period').annotate(
        revenue=Sum('totalCost'),
        jobs=Count('jobID')
    ).order_by('period')

    # Format results
    results = []
    for item in trends:
        results.append({
            'date': item['period'].isoformat().split('T')[0],
            'revenue': float(item['revenue'] or 0),
            'jobs': item['jobs']
        })

    return Response({
        'success': True,
        'trends': results,
        'total_revenue': sum(r['revenue'] for r in results),
        'total_jobs': sum(r['jobs'] for r in results)
    })
```

### Category Breakdown Chart

Add pie chart showing job distribution by category:

```typescript
const categoryData = [
  { name: 'Plumbing', value: 30, color: '#3B82F6' },
  { name: 'Electrical', value: 25, color: '#10B981' },
  { name: 'Carpentry', value: 20, color: '#F59E0B' },
  { name: 'Painting', value: 15, color: '#EF4444' },
  { name: 'Other', value: 10, color: '#8B5CF6' },
];

<PieChart width={400} height={300}>
  <Pie
    data={categoryData}
    cx="50%"
    cy="50%"
    labelLine={false}
    label={(entry) => `${entry.name}: ${entry.value}%`}
    outerRadius={80}
    fill="#8884d8"
    dataKey="value"
  >
    {categoryData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

---

## Testing Checklist

### Backend Tests

- [ ] Leaderboard API returns employees
- [ ] Leaderboard sorts correctly (rating/jobs/earnings)
- [ ] Performance API returns complete metrics
- [ ] Stats API returns accurate totals
- [ ] Revenue trends API groups by week/month (future)

### Frontend Tests

- [ ] Analytics page loads
- [ ] KPI cards display correct stats
- [ ] Revenue chart renders
- [ ] Jobs chart renders
- [ ] Leaderboard table renders
- [ ] Leaderboard sorting works
- [ ] Top performers cards display
- [ ] CSV export downloads
- [ ] CSV contains correct data
- [ ] Loading states display
- [ ] Navigation button works

---

## Success Criteria

✅ Module 3 complete when:

1. Analytics page created
2. KPI cards displaying stats
3. Revenue line chart working
4. Jobs bar chart working
5. Employee leaderboard displaying
6. Leaderboard sorting functional
7. Top performers cards showing
8. CSV export working
9. Navigation integrated
10. Zero errors

---

**Next Module**: Module 4 (Job Lifecycle Management) - Integrates mobile workflow

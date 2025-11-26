import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AgencyStats {
  total_jobs: number;
  completed_jobs: number;
  active_jobs: number;
  cancelled_jobs: number;
  total_revenue: number;
  average_rating: number;
}

interface LeaderboardEmployee {
  employee_id: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  total_jobs_completed: number;
  total_earnings: number;
  rank: number;
  is_employee_of_month: boolean;
}

interface RevenueTrendData {
  date: string;
  revenue: number;
  jobs: number;
}

/**
 * Fetch agency statistics (revenue, jobs, rating)
 */
export function useAgencyStats() {
  return useQuery<AgencyStats>({
    queryKey: ['agency', 'stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/agency/profile`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agency stats');
      }

      const data = await response.json();
      
      // Transform to stats format
      return {
        total_jobs: data.total_jobs || 0,
        completed_jobs: data.completed_jobs || 0,
        active_jobs: data.active_jobs || 0,
        cancelled_jobs: data.cancelled_jobs || 0,
        total_revenue: data.total_revenue || 0,
        average_rating: data.average_rating || 0,
      };
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch employee leaderboard
 */
export function useLeaderboard(
  sortBy: 'rating' | 'jobs' | 'earnings' = 'rating',
  limit: number = 10
) {
  return useQuery<LeaderboardEmployee[]>({
    queryKey: ['agency', 'leaderboard', sortBy, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        sort_by: sortBy === 'jobs' ? 'jobs' : sortBy === 'earnings' ? 'earnings' : 'rating',
        order: 'desc',
        limit: limit.toString(),
      });

      const response = await fetch(`${API_URL}/api/agency/employees/leaderboard?${params}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      return data.employees || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch revenue trends (mock data for now - can be replaced with real API)
 */
export function useRevenueTrends(startDate: Date, endDate: Date) {
  return useQuery<RevenueTrendData[]>({
    queryKey: ['agency', 'revenue-trends', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // For now, generate mock data
      // In production, this would call: GET /api/agency/analytics/revenue-trends?start=X&end=Y
      return generateMockRevenueTrends(startDate, endDate);
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Generate mock revenue trends data
 * TODO: Replace with real API endpoint when analytics backend is implemented
 */
function generateMockRevenueTrends(startDate: Date, endDate: Date): RevenueTrendData[] {
  const data: RevenueTrendData[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    data.push({
      date: currentDate.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 10000) + 5000,
      jobs: Math.floor(Math.random() * 20) + 5,
    });
    currentDate.setDate(currentDate.getDate() + 7); // Weekly intervals
  }

  return data;
}

/**
 * Export analytics data to CSV
 */
export function exportAnalyticsCSV(
  leaderboard: LeaderboardEmployee[],
  stats: AgencyStats,
  filename?: string
) {
  const timestamp = new Date().toISOString().split('T')[0];
  const fname = filename || `agency-analytics-${timestamp}.csv`;

  // Build CSV content
  const headers = ['Rank', 'Name', 'Email', 'Role', 'Rating', 'Jobs Completed', 'Total Earnings'];
  const rows = leaderboard.map((emp) => [
    emp.rank,
    emp.name,
    emp.email,
    emp.role,
    emp.rating.toFixed(2),
    emp.total_jobs_completed,
    emp.total_earnings.toFixed(2),
  ]);

  // Add summary section
  const summary = [
    [''],
    ['AGENCY SUMMARY'],
    ['Total Jobs', stats.total_jobs],
    ['Completed Jobs', stats.completed_jobs],
    ['Active Jobs', stats.active_jobs],
    ['Cancelled Jobs', stats.cancelled_jobs],
    ['Total Revenue', stats.total_revenue.toFixed(2)],
    ['Average Rating', stats.average_rating.toFixed(2)],
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
    ...summary.map((row) => row.join(',')),
  ].join('\n');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fname;
  link.click();
  window.URL.revokeObjectURL(url);
}

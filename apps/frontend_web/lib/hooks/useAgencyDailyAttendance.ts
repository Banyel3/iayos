import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/api/config";
import { toast } from "sonner";

interface DailyAttendanceRecord {
  attendance_id: number;
  employee_id: number;
  employee_name: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  worker_confirmed: boolean;
  client_confirmed: boolean;
  amount_earned: number;
}

interface DailyAttendanceResponse {
  success: boolean;
  job_id: number;
  date: string;
  records: DailyAttendanceRecord[];
  total_count: number;
}

interface MarkAttendanceResponse {
  success: boolean;
  message: string;
  attendance_id: number;
  employee_id: number;
  employee_name: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
}

/**
 * Fetch daily attendance records for a job
 */
export function useAgencyDailyAttendance(jobId: number, date?: string) {
  return useQuery<DailyAttendanceResponse>({
    queryKey: ["agency-daily-attendance", jobId, date || "today"],
    queryFn: async () => {
      const url = date
        ? `${API_BASE}/api/agency/jobs/${jobId}/daily-attendance?date=${date}`
        : `${API_BASE}/api/agency/jobs/${jobId}/daily-attendance`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch attendance records");
      }

      return response.json();
    },
    enabled: !!jobId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Mark employee arrival
 */
export function useMarkEmployeeArrival() {
  const queryClient = useQueryClient();

  return useMutation<
    MarkAttendanceResponse,
    Error,
    { jobId: number; employeeId: number }
  >({
    mutationFn: async ({ jobId, employeeId }) => {
      const response = await fetch(
        `${API_BASE}/api/agency/jobs/${jobId}/employees/${employeeId}/mark-arrival`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark arrival");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate attendance query to refresh list
      queryClient.invalidateQueries({
        queryKey: ["agency-daily-attendance", variables.jobId],
      });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Mark employee checkout
 */
export function useMarkEmployeeCheckout() {
  const queryClient = useQueryClient();

  return useMutation<
    MarkAttendanceResponse,
    Error,
    { jobId: number; employeeId: number }
  >({
    mutationFn: async ({ jobId, employeeId }) => {
      const response = await fetch(
        `${API_BASE}/api/agency/jobs/${jobId}/employees/${employeeId}/mark-checkout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark checkout");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate attendance query to refresh list
      queryClient.invalidateQueries({
        queryKey: ["agency-daily-attendance", variables.jobId],
      });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

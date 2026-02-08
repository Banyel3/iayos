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
 * Dispatch employee (mark as "on the way")
 * Client will verify arrival to start work timer
 */
export function useDispatchEmployee() {
  const queryClient = useQueryClient();

  return useMutation<
    MarkAttendanceResponse,
    Error,
    { jobId: number; employeeId: number }
  >({
    mutationFn: async ({ jobId, employeeId }) => {
      const response = await fetch(
        `${API_BASE}/api/agency/jobs/${jobId}/employees/${employeeId}/dispatch`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dispatch employee");
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
 * Dispatch employee for a PROJECT job (mark as "on the way")
 * Uses the /dispatch-project endpoint instead of the DAILY /dispatch endpoint
 */
export function useDispatchProjectEmployee() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string; employee_name: string },
    Error,
    { jobId: number; employeeId: number; conversationId?: number }
  >({
    mutationFn: async ({ jobId, employeeId }) => {
      const response = await fetch(
        `${API_BASE}/api/agency/jobs/${jobId}/employees/${employeeId}/dispatch-project`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dispatch employee");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate conversation messages to refresh employee dispatch status
      if (variables.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["agency-messages", variables.conversationId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["agency-conversations"] });
      toast.success(data.message || "Employee dispatched successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * @deprecated Client now marks checkout instead of agency
 * Kept for backward compatibility - will return error from backend
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

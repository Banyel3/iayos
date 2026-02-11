/**
 * Daily Rate Payment System Hooks
 * React Query hooks for daily attendance tracking, extensions, and rate changes
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "../api/config";
import { getErrorMessage } from "../utils/parse-api-error";
import Toast from "react-native-toast-message";

// ============================================================================
// Types
// ============================================================================

export type AttendanceStatus = "DISPATCHED" | "PENDING" | "PRESENT" | "HALF_DAY" | "ABSENT" | "DISPUTED";
export type ExtensionStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type RateChangeStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type RequestedBy = "CLIENT" | "WORKER" | "AGENCY";

export interface DailyAttendance {
  attendance_id: number;
  job_id: number;
  date: string;
  worker_name: string;
  worker_id?: number;
  status: AttendanceStatus;
  is_dispatched: boolean;  // True if employee is on the way but not yet arrived
  time_in?: string;
  time_out?: string;
  amount_earned: number;
  worker_confirmed: boolean;
  worker_confirmed_at?: string;
  client_confirmed: boolean;
  client_confirmed_at?: string;
  payment_processed: boolean;
  notes: string;
}

export interface DailyAttendanceResponse {
  success: boolean;
  job_id: number;
  daily_rate: number;
  records: DailyAttendance[];
  total_records: number;
}

export interface DailySummary {
  job_id: number;
  payment_model: "DAILY";
  daily_rate: number;
  duration_days: number;
  days_worked: number;
  remaining_days: number;
  attendance: {
    total_records: number;
    pending_confirmation: number;
    days_present: number;
    days_half: number;
    days_absent: number;
  };
  payments: {
    total_earned: number;
    escrow_total: number;
    escrow_remaining: number;
  };
  pending_requests: {
    extensions: number;
    rate_changes: number;
  };
}

export interface DailyExtension {
  extension_id: number;
  job_id: number;
  additional_days: number;
  additional_escrow: number;
  reason: string;
  status: ExtensionStatus;
  requested_by: RequestedBy;
  requested_by_name: string;
  client_approved: boolean;
  client_approved_at?: string;
  worker_approved: boolean;
  worker_approved_at?: string;
  escrow_collected: boolean;
  created_at: string;
}

export interface DailyRateChange {
  change_id: number;
  job_id: number;
  old_rate: number;
  new_rate: number;
  reason: string;
  effective_date: string;
  status: RateChangeStatus;
  requested_by: RequestedBy;
  requested_by_name: string;
  client_approved: boolean;
  client_approved_at?: string;
  worker_approved: boolean;
  worker_approved_at?: string;
  escrow_adjusted: boolean;
  escrow_adjustment_amount: number;
  created_at: string;
}

export interface EscrowEstimate {
  success: boolean;
  daily_rate: number;
  num_workers: number;
  num_days: number;
  escrow_amount: number;
  platform_fee: number;
  total_required: number;
}

// Mutation payloads
export interface LogAttendancePayload {
  jobId: number;
  work_date: string;
  status: AttendanceStatus;
  time_in?: string;
  time_out?: string;
  notes?: string;
  assignment_id?: number;
  employee_id?: number;
}

export interface ConfirmAttendancePayload {
  jobId: number;
  attendanceId: number;
  approved_status?: AttendanceStatus;
}

export interface RequestExtensionPayload {
  jobId: number;
  additional_days: number;
  reason: string;
}

export interface RequestRateChangePayload {
  jobId: number;
  new_rate: number;
  reason: string;
  effective_date: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch daily attendance records for a job
 */
export const useDailyAttendance = (
  jobId: number,
  options?: { startDate?: string; endDate?: string; enabled?: boolean }
) => {
  const { startDate, endDate, enabled = true } = options || {};

  return useQuery<DailyAttendanceResponse>({
    queryKey: ["dailyAttendance", jobId, startDate, endDate],
    queryFn: async () => {
      let url = ENDPOINTS.DAILY_ATTENDANCE(jobId);
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await apiRequest(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to fetch attendance"));
      }
      return response.json() as Promise<DailyAttendanceResponse>;
    },
    enabled: enabled && !!jobId,
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

/**
 * Fetch daily job summary
 */
export const useDailySummary = (jobId: number, enabled = true) => {
  return useQuery<DailySummary>({
    queryKey: ["dailySummary", jobId],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.DAILY_SUMMARY(jobId));
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to fetch daily summary"));
      }
      return response.json() as Promise<DailySummary>;
    },
    enabled: enabled && !!jobId,
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

/**
 * Fetch extensions for a job
 */
export const useDailyExtensions = (jobId: number, enabled = true) => {
  return useQuery<{ success: boolean; extensions: DailyExtension[] }>({
    queryKey: ["dailyExtensions", jobId],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.DAILY_EXTENSIONS(jobId));
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to fetch extensions"));
      }
      return response.json() as Promise<{ success: boolean; extensions: DailyExtension[] }>;
    },
    enabled: enabled && !!jobId,
  });
};

/**
 * Fetch rate changes for a job
 */
export const useDailyRateChanges = (jobId: number, enabled = true) => {
  return useQuery<{ success: boolean; rate_changes: DailyRateChange[] }>({
    queryKey: ["dailyRateChanges", jobId],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.DAILY_RATE_CHANGES(jobId));
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to fetch rate changes"));
      }
      return response.json() as Promise<{ success: boolean; rate_changes: DailyRateChange[] }>;
    },
    enabled: enabled && !!jobId,
  });
};

/**
 * Calculate escrow estimate
 */
export const useDailyEscrowEstimate = (
  dailyRate: number,
  numWorkers: number,
  numDays: number,
  enabled = true
) => {
  return useQuery<EscrowEstimate>({
    queryKey: ["dailyEscrowEstimate", dailyRate, numWorkers, numDays],
    queryFn: async () => {
      const params = new URLSearchParams({
        daily_rate: dailyRate.toString(),
        num_workers: numWorkers.toString(),
        num_days: numDays.toString(),
      });
      const response = await apiRequest(
        `${ENDPOINTS.DAILY_ESCROW_ESTIMATE}?${params.toString()}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to get escrow estimate"));
      }
      return response.json() as Promise<EscrowEstimate>;
    },
    enabled: enabled && dailyRate > 0 && numWorkers > 0 && numDays > 0,
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Log attendance for a day
 */
export const useLogAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LogAttendancePayload) => {
      const { jobId, ...body } = payload;
      const response = await apiRequest(ENDPOINTS.DAILY_ATTENDANCE(jobId), {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to log attendance"));
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.jobId] });

      Toast.show({
        type: "success",
        text1: "Attendance Logged",
        text2: `Recorded for ${variables.work_date}`,
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Failed to Log Attendance",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Worker confirms their attendance
 */
export const useConfirmAttendanceWorker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, attendanceId }: { jobId: number; attendanceId: number }): Promise<{ success: boolean; message?: string }> => {
      const response = await apiRequest(
        ENDPOINTS.DAILY_ATTENDANCE_CONFIRM_WORKER(jobId, attendanceId),
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to confirm attendance"));
      }
      return response.json() as Promise<{ success: boolean; message?: string }>;
    },
    onSuccess: (data: { success: boolean; message?: string }, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.jobId] });

      Toast.show({
        type: "success",
        text1: "Attendance Confirmed",
        text2: data.message || "Your attendance has been confirmed",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Confirmation Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Client confirms/adjusts attendance
 */
export const useConfirmAttendanceClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ConfirmAttendancePayload): Promise<{ success: boolean; message?: string }> => {
      const { jobId, attendanceId, approved_status } = payload;
      const response = await apiRequest(
        ENDPOINTS.DAILY_ATTENDANCE_CONFIRM_CLIENT(jobId, attendanceId),
        {
          method: "POST",
          body: approved_status ? JSON.stringify({ approved_status }) : undefined,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to confirm attendance"));
      }
      return response.json() as Promise<{ success: boolean; message?: string }>;
    },
    onSuccess: (data: { success: boolean; message?: string }, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      Toast.show({
        type: "success",
        text1: "Attendance Confirmed",
        text2: data.message || "Attendance has been confirmed and payment processed",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Confirmation Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Request job extension
 */
export const useRequestExtension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RequestExtensionPayload) => {
      const { jobId, ...body } = payload;
      const response = await apiRequest(ENDPOINTS.DAILY_EXTENSION_REQUEST(jobId), {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to request extension"));
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dailyExtensions", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.jobId] });

      Toast.show({
        type: "success",
        text1: "Extension Requested",
        text2: `Awaiting approval for ${variables.additional_days} additional days`,
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Request Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Approve extension request
 */
export const useApproveExtension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, extensionId }: { jobId: number; extensionId: number }) => {
      const response = await apiRequest(
        ENDPOINTS.DAILY_EXTENSION_APPROVE(jobId, extensionId),
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to approve extension"));
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dailyExtensions", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.jobId] });

      Toast.show({
        type: "success",
        text1: "Extension Approved",
        text2: "The job has been extended",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Approval Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Request rate change
 */
export const useRequestRateChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RequestRateChangePayload) => {
      const { jobId, ...body } = payload;
      const response = await apiRequest(ENDPOINTS.DAILY_RATE_CHANGE_REQUEST(jobId), {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to request rate change"));
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dailyRateChanges", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.jobId] });

      Toast.show({
        type: "success",
        text1: "Rate Change Requested",
        text2: `Awaiting approval for ₱${variables.new_rate}/day`,
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Request Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Approve rate change request
 */
export const useApproveRateChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, changeId }: { jobId: number; changeId: number }) => {
      const response = await apiRequest(
        ENDPOINTS.DAILY_RATE_CHANGE_APPROVE(jobId, changeId),
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to approve rate change"));
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dailyRateChanges", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.jobId] });

      Toast.show({
        type: "success",
        text1: "Rate Change Approved",
        text2: "The new rate is now effective",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Approval Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Cancel remaining days (get refund)
 */
export const useCancelDailyJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, reason }: { jobId: number; reason?: string }): Promise<{ success: boolean; message?: string }> => {
      const response = await apiRequest(ENDPOINTS.DAILY_CANCEL(jobId), {
        method: "POST",
        body: reason ? JSON.stringify({ reason }) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to cancel job"));
      }
      return response.json() as Promise<{ success: boolean; message?: string }>;
    },
    onSuccess: (data: { success: boolean; message?: string }, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dailySummary", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });

      Toast.show({
        type: "success",
        text1: "Job Cancelled",
        text2: data.message || "Unused escrow will be refunded",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Cancellation Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

// ============================================================================
// Daily Attendance Check-In/Out (Chat Screen Actions)
// ============================================================================

/**
 * Response for check-in/check-out actions
 */
export interface CheckInOutResponse {
  success: boolean;
  attendance_id: number;
  time_in?: string;
  time_out?: string;
  date: string;
  hours_worked?: number;
  message: string;
  awaiting_client_confirmation: boolean;
}

/**
 * Response for client confirmation action
 */
export interface ClientConfirmResponse {
  success: boolean;
  attendance_id: number;
  worker_name?: string;
  date: string;
  status: AttendanceStatus;
  amount_earned: number;
  payment_processed: boolean;
  message: string;
}

/**
 * Worker checks in for a daily job (from chat screen)
 * Creates attendance record with time_in.
 * Constraints: Only between 6 AM - 8 PM
 */
export const useWorkerCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number): Promise<CheckInOutResponse> => {
      const response = await apiRequest(ENDPOINTS.WORKER_CHECK_IN(jobId), {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Check-in failed"));
      }
      return response.json() as Promise<CheckInOutResponse>;
    },
    onSuccess: (data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance", jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", jobId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] }); // Refresh chat to show updated attendance

      Toast.show({
        type: "success",
        text1: "Checked In ✅",
        text2: data.message || "You've clocked in for today",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Check-in Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Worker checks out for a daily job (from chat screen)
 * Updates attendance record with time_out.
 * Constraints: Only between 6 AM - 8 PM, must have checked in first
 */
export const useWorkerCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number): Promise<CheckInOutResponse> => {
      const response = await apiRequest(ENDPOINTS.WORKER_CHECK_OUT(jobId), {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Check-out failed"));
      }
      return response.json() as Promise<CheckInOutResponse>;
    },
    onSuccess: (data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance", jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", jobId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] }); // Refresh chat to show updated attendance

      Toast.show({
        type: "success",
        text1: "Checked Out ✅",
        text2: data.message || "Awaiting client confirmation for payment",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Check-out Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Client confirms worker's attendance (from chat screen)
 * Triggers auto-payment when client confirms.
 */
export const useClientConfirmAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attendanceId,
      approvedStatus,
    }: {
      attendanceId: number;
      approvedStatus?: "PRESENT" | "HALF_DAY" | "ABSENT";
    }): Promise<ClientConfirmResponse> => {
      let url = ENDPOINTS.CLIENT_CONFIRM_ATTENDANCE(attendanceId);
      if (approvedStatus) {
        url += `?approved_status=${approvedStatus}`;
      }

      const response = await apiRequest(url, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Confirmation failed"));
      }
      return response.json() as Promise<ClientConfirmResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] }); // Refresh chat to show updated attendance
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      Toast.show({
        type: "success",
        text1: "Attendance Confirmed ✅",
        text2: data.payment_processed
          ? `Payment of ₱${data.amount_earned.toFixed(0)} processed`
          : "Awaiting worker confirmation",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Confirmation Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

// ============================================================================
// Client Verify Arrival
// Called when client confirms a dispatched employee has arrived on site
// ============================================================================

export interface VerifyArrivalResponse {
  success: boolean;
  message: string;
  attendance_id: number;
  employee_name: string;
  time_in: string;
  status: string;
}

export const useClientVerifyArrival = () => {
  const queryClient = useQueryClient();

  return useMutation<
    VerifyArrivalResponse,
    Error,
    { jobId: number; attendanceId: number }
  >({
    mutationFn: async ({ jobId, attendanceId }) => {
      const response = await apiRequest(
        ENDPOINTS.CLIENT_VERIFY_ARRIVAL(jobId, attendanceId),
        { method: "POST" }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to verify arrival"));
      }
      return response.json() as Promise<VerifyArrivalResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });

      Toast.show({
        type: "success",
        text1: "Arrival Verified ✅",
        text2: `${data.employee_name} has started working`,
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

// ============================================================================
// Client Mark Checkout
// Called when client marks an employee as done for the day
// ============================================================================

export interface MarkCheckoutResponse {
  success: boolean;
  message: string;
  attendance_id: number;
  employee_name: string;
  time_in: string;
  time_out: string;
  status: string;
}

export const useClientMarkCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation<
    MarkCheckoutResponse,
    Error,
    { jobId: number; attendanceId: number }
  >({
    mutationFn: async ({ jobId, attendanceId }) => {
      const response = await apiRequest(
        ENDPOINTS.CLIENT_MARK_CHECKOUT(jobId, attendanceId),
        { method: "POST" }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to mark checkout"));
      }
      return response.json() as Promise<MarkCheckoutResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });

      Toast.show({
        type: "success",
        text1: "Checkout Complete ✅",
        text2: `${data.employee_name} has finished for the day`,
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Checkout Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

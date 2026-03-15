/**
 * Daily Rate Payment System Hooks
 * React Query hooks for daily attendance tracking, extensions, and rate changes
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "../api/config";
import { getErrorMessage } from "../utils/parse-api-error";
import Toast from "react-native-toast-message";

function patchConversationOnTheWay(
  queryClient: ReturnType<typeof useQueryClient>,
  jobId: number,
  payload: CheckInOutResponse,
) {
  queryClient.setQueriesData(
    {
      predicate: (query) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === "messages",
    },
    (previous: any) => {
      if (!previous?.job || Number(previous.job.id) !== Number(jobId)) {
        return previous;
      }

      const attendanceId = Number(payload?.attendance_id);
      const nowIso = new Date().toISOString();
      const existing = Array.isArray(previous.attendance_today)
        ? previous.attendance_today
        : [];

      const updated = existing.some(
        (row: any) => Number(row?.attendance_id) === attendanceId,
      )
        ? existing.map((row: any) => {
            if (Number(row?.attendance_id) !== attendanceId) {
              return row;
            }

            return {
              ...row,
              status: "DISPATCHED",
              is_dispatched: true,
              worker_confirmed: true,
              worker_confirmed_at:
                row?.worker_confirmed_at ||
                payload?.worker_confirmed_at ||
                nowIso,
              time_in: null,
              time_out: null,
            };
          })
        : [
            {
              attendance_id: attendanceId,
              worker_id: payload?.worker_id,
              worker_account_id: payload?.worker_account_id,
              worker_name: "Worker",
              worker_avatar: null,
              date: payload?.date,
              time_in: null,
              time_out: null,
              status: "DISPATCHED",
              is_dispatched: true,
              worker_confirmed: true,
              worker_confirmed_at: payload?.worker_confirmed_at || nowIso,
              client_confirmed: false,
              client_confirmed_at: null,
              amount_earned: 0,
              payment_processed: false,
              notes: "",
            },
            ...existing,
          ];

      return {
        ...previous,
        attendance_today: updated,
      };
    },
  );
}

function patchConversationAttendanceById(
  queryClient: ReturnType<typeof useQueryClient>,
  attendanceId: number,
  updater: (row: any) => any,
  jobId?: number,
) {
  queryClient.setQueriesData(
    {
      predicate: (query) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === "messages",
    },
    (previous: any) => {
      if (!previous?.attendance_today) {
        return previous;
      }

      if (
        Number.isFinite(jobId) &&
        (!previous?.job || Number(previous.job.id) !== Number(jobId))
      ) {
        return previous;
      }

      const rows = Array.isArray(previous.attendance_today)
        ? previous.attendance_today
        : [];
      let hasChange = false;

      const updatedRows = rows.map((row: any) => {
        if (Number(row?.attendance_id) !== Number(attendanceId)) {
          return row;
        }

        hasChange = true;
        return updater(row);
      });

      if (!hasChange) {
        return previous;
      }

      return {
        ...previous,
        attendance_today: updatedRows,
      };
    },
  );
}

function patchConversationSkipRequestStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  jobId: number,
  skipRequestId: number,
  status: "PENDING" | "APPROVED" | "REJECTED",
  clientRejectionReason?: string | null,
) {
  queryClient.setQueriesData(
    {
      predicate: (query) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === "messages",
    },
    (previous: any) => {
      if (!previous?.job || Number(previous.job.id) !== Number(jobId)) {
        return previous;
      }

      const skipRows = Array.isArray(previous.daily_skip_requests_today)
        ? previous.daily_skip_requests_today
        : [];

      const updatedSkipRows = skipRows.map((row: any) => {
        if (Number(row?.skip_request_id) !== Number(skipRequestId)) {
          return row;
        }

        return {
          ...row,
          status,
          client_rejection_reason:
            status === "REJECTED" ? (clientRejectionReason ?? null) : null,
        };
      });

      return {
        ...previous,
        daily_skip_requests_today: updatedSkipRows,
      };
    },
  );
}

function patchConversationAttendanceRows(
  queryClient: ReturnType<typeof useQueryClient>,
  jobId: number,
  rows: Array<{
    attendance_id: number;
    worker_id?: number;
    worker_account_id?: number;
    status: string;
    client_confirmed: boolean;
    amount_earned: number;
    payment_processed: boolean;
    absent_penalty_amount?: number;
  }>,
) {
  if (!rows.length) {
    return;
  }

  queryClient.setQueriesData(
    {
      predicate: (query) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === "messages",
    },
    (previous: any) => {
      if (!previous?.job || Number(previous.job.id) !== Number(jobId)) {
        return previous;
      }

      const existingRows = Array.isArray(previous.attendance_today)
        ? previous.attendance_today
        : [];

      const byId = new Map<number, any>();
      for (const row of existingRows) {
        byId.set(Number(row?.attendance_id), row);
      }

      const nowIso = new Date().toISOString();
      for (const updated of rows) {
        const key = Number(updated.attendance_id);
        const current = byId.get(key);
        if (current) {
          byId.set(key, {
            ...current,
            status: updated.status,
            is_dispatched: false,
            client_confirmed: updated.client_confirmed,
            client_confirmed_at: current?.client_confirmed_at || nowIso,
            amount_earned: updated.amount_earned,
            payment_processed: updated.payment_processed,
            absent_penalty_amount:
              updated.absent_penalty_amount ??
              current?.absent_penalty_amount ??
              0,
          });
        } else {
          byId.set(key, {
            attendance_id: updated.attendance_id,
            worker_id: updated.worker_id,
            worker_account_id: updated.worker_account_id,
            worker_name: "Worker",
            worker_avatar: null,
            date: previous.effective_work_date || nowIso.split("T")[0],
            time_in: null,
            time_out: null,
            status: updated.status,
            is_dispatched: false,
            worker_confirmed: true,
            worker_confirmed_at: nowIso,
            client_confirmed: updated.client_confirmed,
            client_confirmed_at: nowIso,
            amount_earned: updated.amount_earned,
            payment_processed: updated.payment_processed,
            absent_penalty_amount: updated.absent_penalty_amount ?? 0,
            notes: "Skip day approved by client",
          });
        }
      }

      return {
        ...previous,
        attendance_today: Array.from(byId.values()),
      };
    },
  );
}

// ============================================================================
// Types
// ============================================================================

export type AttendanceStatus =
  | "DISPATCHED"
  | "PENDING"
  | "PRESENT"
  | "HALF_DAY"
  | "ABSENT"
  | "DISPUTED";
export type ExtensionStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type RateChangeStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
export type RequestedBy = "CLIENT" | "WORKER" | "AGENCY";

export interface DailyAttendance {
  attendance_id: number;
  job_id: number;
  date: string;
  worker_name: string;
  worker_id?: number;
  status: AttendanceStatus;
  is_dispatched: boolean; // True if employee is on the way but not yet arrived
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
    gross_expected_earnings?: number;
    absent_penalty_total?: number;
    net_expected_earnings?: number;
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
  options?: { startDate?: string; endDate?: string; enabled?: boolean },
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
        throw new Error(
          getErrorMessage(error, "Failed to fetch daily summary"),
        );
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
      return response.json() as Promise<{
        success: boolean;
        extensions: DailyExtension[];
      }>;
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
      return response.json() as Promise<{
        success: boolean;
        rate_changes: DailyRateChange[];
      }>;
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
  enabled = true,
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
        `${ENDPOINTS.DAILY_ESCROW_ESTIMATE}?${params.toString()}`,
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          getErrorMessage(error, "Failed to get escrow estimate"),
        );
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
      queryClient.invalidateQueries({
        queryKey: ["dailyAttendance", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });

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
    mutationFn: async ({
      jobId,
      attendanceId,
    }: {
      jobId: number;
      attendanceId: number;
    }): Promise<{ success: boolean; message?: string }> => {
      const response = await apiRequest(
        ENDPOINTS.DAILY_ATTENDANCE_CONFIRM_WORKER(jobId, attendanceId),
        { method: "POST" },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to confirm attendance"));
      }
      return response.json() as Promise<{ success: boolean; message?: string }>;
    },
    onSuccess: (data: { success: boolean; message?: string }, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyAttendance", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });

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
    mutationFn: async (
      payload: ConfirmAttendancePayload,
    ): Promise<{ success: boolean; message?: string }> => {
      const { jobId, attendanceId, approved_status } = payload;
      const response = await apiRequest(
        ENDPOINTS.DAILY_ATTENDANCE_CONFIRM_CLIENT(jobId, attendanceId),
        {
          method: "POST",
          body: approved_status
            ? JSON.stringify({ approved_status })
            : undefined,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to confirm attendance"));
      }
      return response.json() as Promise<{ success: boolean; message?: string }>;
    },
    onSuccess: (data: { success: boolean; message?: string }, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyAttendance", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      Toast.show({
        type: "success",
        text1: "Attendance Confirmed",
        text2:
          data.message || "Attendance has been confirmed and payment processed",
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
      const response = await apiRequest(
        ENDPOINTS.DAILY_EXTENSION_REQUEST(jobId),
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to request extension"));
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyExtensions", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });

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
    mutationFn: async ({
      jobId,
      extensionId,
    }: {
      jobId: number;
      extensionId: number;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.DAILY_EXTENSION_APPROVE(jobId, extensionId),
        { method: "POST" },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to approve extension"));
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyExtensions", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });

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
      const response = await apiRequest(
        ENDPOINTS.DAILY_RATE_CHANGE_REQUEST(jobId),
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          getErrorMessage(error, "Failed to request rate change"),
        );
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyRateChanges", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });

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
    mutationFn: async ({
      jobId,
      changeId,
    }: {
      jobId: number;
      changeId: number;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.DAILY_RATE_CHANGE_APPROVE(jobId, changeId),
        { method: "POST" },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          getErrorMessage(error, "Failed to approve rate change"),
        );
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyRateChanges", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });

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
export interface CancelDailyJobResponse {
  success: boolean;
  message?: string;
  cancelled_by?: string;
  cancellation_stage?: string;
  days_planned?: number;
  days_paid?: number;
  days_with_unprocessed_attendance?: number;
  days_completed?: number;
  total_paid_out?: number;
  escrow_collected?: number;
  refund_amount?: number;
  platform_fee_retained?: number;
  refunded_escrow_only?: boolean;
}

export const useCancelDailyJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      reason,
    }: {
      jobId: number;
      reason: string;
    }): Promise<CancelDailyJobResponse> => {
      const response = await apiRequest(ENDPOINTS.DAILY_CANCEL(jobId), {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to cancel job"));
      }
      return response.json() as Promise<CancelDailyJobResponse>;
    },
    onSuccess: (data: CancelDailyJobResponse, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });

      const refundAmount = Number(data.refund_amount || 0).toFixed(2);
      const retainedFee = Number(data.platform_fee_retained || 0).toFixed(2);
      const stageLabel = data.cancellation_stage
        ? data.cancellation_stage.replace(/_/g, " ").toLowerCase()
        : null;

      Toast.show({
        type: "success",
        text1: "Job Cancelled",
        text2:
          data.message ||
          `Unused escrow refunded: ₱${refundAmount}. Platform fee retained: ₱${retainedFee}.${stageLabel ? ` Stage: ${stageLabel}.` : ""}`,
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
  worker_id?: number;
  worker_account_id?: number;
  time_in?: string;
  time_out?: string;
  worker_confirmed_at?: string;
  date: string;
  hours_worked?: number;
  message: string;
  awaiting_client_confirmation: boolean;
  undo_window_seconds?: number;
}

export interface CancelCheckInResponse {
  success: boolean;
  attendance_id?: number;
  date: string;
  message: string;
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
  payment_method?: "WALLET" | "CASH";
  cash_payment_proof_url?: string | null;
  message: string;
}

export interface ClientMarkNoWorkResponse {
  success: boolean;
  attendance_id: number;
  worker_name: string;
  date: string;
  status: AttendanceStatus;
  amount_earned: number;
  payment_processed: boolean;
  message: string;
}

/**
 * Worker marks on-the-way for a daily job (from chat screen).
 * Creates/updates attendance in DISPATCHED state (time_in is set later by client verify-arrival).
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
        throw new Error(getErrorMessage(error, "Mark on-the-way failed"));
      }
      return response.json() as Promise<CheckInOutResponse>;
    },
    onSuccess: (data, jobId) => {
      patchConversationOnTheWay(queryClient, jobId, data);
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance", jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", jobId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] }); // Refresh chat to show updated attendance

      Toast.show({
        type: "success",
        text1: "On The Way ✅",
        text2: data.message || "Marked as on the way",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "On The Way Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

/**
 * Worker cancels on-the-way within 10-second grace window.
 */
export const useWorkerCancelCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number): Promise<CancelCheckInResponse> => {
      const response = await apiRequest(
        ENDPOINTS.WORKER_CANCEL_CHECK_IN(jobId),
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Cancel on-the-way failed"));
      }
      return response.json() as Promise<CancelCheckInResponse>;
    },
    onSuccess: (data, jobId) => {
      if (data?.attendance_id) {
        patchConversationAttendanceById(
          queryClient,
          data.attendance_id,
          (row) => ({
            ...row,
            is_dispatched: false,
            worker_confirmed: false,
            worker_confirmed_at: null,
          }),
          jobId,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["dailyAttendance", jobId] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", jobId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });

      Toast.show({
        type: "success",
        text1: "On The Way Cancelled",
        text2: data.message || "Your on-the-way status has been undone",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Undo Failed",
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
      patchConversationAttendanceById(
        queryClient,
        data.attendance_id,
        (row) => ({
          ...row,
          status: row?.status === "DISPATCHED" ? "PENDING" : row?.status,
          time_out: data?.time_out || row?.time_out,
        }),
        jobId,
      );

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
      paymentMethod,
      cashProofImage,
    }: {
      attendanceId: number;
      approvedStatus?: "PRESENT" | "HALF_DAY" | "ABSENT";
      paymentMethod?: "WALLET" | "CASH";
      cashProofImage?: {
        uri: string;
        name?: string;
        type?: string;
      };
    }): Promise<ClientConfirmResponse> => {
      const formData = new FormData();
      if (approvedStatus) {
        formData.append("approved_status", approvedStatus);
      }

      const selectedMethod = paymentMethod || "WALLET";
      formData.append("payment_method", selectedMethod);

      if (selectedMethod === "CASH" && cashProofImage?.uri) {
        formData.append("cash_proof_image", {
          uri: cashProofImage.uri,
          type: cashProofImage.type || "image/jpeg",
          name: cashProofImage.name || `daily_cash_proof_${attendanceId}.jpg`,
        } as any);
      }

      const response = await apiRequest(
        ENDPOINTS.CLIENT_CONFIRM_ATTENDANCE(attendanceId),
        {
        method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Confirmation failed"));
      }
      return response.json() as Promise<ClientConfirmResponse>;
    },
    onSuccess: (data) => {
      const nowIso = new Date().toISOString();
      patchConversationAttendanceById(
        queryClient,
        data.attendance_id,
        (row) => ({
          ...row,
          client_confirmed: true,
          client_confirmed_at: row?.client_confirmed_at || nowIso,
          status: data.status,
          amount_earned: data.amount_earned,
          payment_processed: data.payment_processed,
          payment_method: data.payment_method || row?.payment_method || "WALLET",
          cash_payment_proof_url:
            data.cash_payment_proof_url || row?.cash_payment_proof_url || null,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] }); // Refresh chat to show updated attendance
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      Toast.show({
        type: "success",
        text1: "Attendance Confirmed ✅",
        text2: data.payment_processed
          ? data.payment_method === "CASH"
            ? `Cash payout of ₱${data.amount_earned.toFixed(0)} released`
            : `Payment of ₱${data.amount_earned.toFixed(0)} processed`
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

/**
 * Client quick action: mark worker as no-work/absent for today.
 */
export const useClientMarkNoWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      workerId,
    }: {
      jobId: number;
      workerId?: number;
    }): Promise<ClientMarkNoWorkResponse> => {
      const response = await apiRequest(
        ENDPOINTS.CLIENT_MARK_NO_WORK(jobId, workerId),
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to mark no-work day"));
      }
      return response.json() as Promise<ClientMarkNoWorkResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });

      Toast.show({
        type: "success",
        text1: "Marked Absent",
        text2: data.message || "No payment recorded for today",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Action Failed",
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
  status: AttendanceStatus;
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
        { method: "POST" },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to verify arrival"));
      }
      return response.json() as Promise<VerifyArrivalResponse>;
    },
    onSuccess: (data, { jobId, attendanceId }) => {
      patchConversationAttendanceById(
        queryClient,
        attendanceId,
        (row) => ({
          ...row,
          is_dispatched: false,
          status: data.status,
          time_in: data.time_in || row?.time_in,
        }),
        jobId,
      );

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
  status: AttendanceStatus;
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
        { method: "POST" },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to mark checkout"));
      }
      return response.json() as Promise<MarkCheckoutResponse>;
    },
    onSuccess: (data, { jobId, attendanceId }) => {
      patchConversationAttendanceById(
        queryClient,
        attendanceId,
        (row) => ({
          ...row,
          status: data.status,
          time_out: data.time_out || row?.time_out,
        }),
        jobId,
      );

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

// ============================================================================
// Skip Day Workflow
// ============================================================================

export interface RequestDailySkipDayPayload {
  jobId: number;
  request_date: string;
}

export interface ClientReviewDailySkipDayPayload {
  jobId: number;
  skipRequestId: number;
  approve: boolean;
  reason?: string;
}

interface SkipDayReviewResponse {
  success: boolean;
  message?: string;
  skip_request?: {
    skip_request_id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    client_rejection_reason?: string | null;
  };
  processed_attendance?: Array<{
    attendance_id: number;
    worker_id?: number;
    worker_account_id?: number;
    status: string;
    client_confirmed: boolean;
    amount_earned: number;
    payment_processed: boolean;
    absent_penalty_amount?: number;
  }>;
}

export interface ClientQASkipNextDayPayload {
  jobId: number;
  reason?: string;
}

export interface DailyExtendOneDayResponse {
  success: boolean;
  message: string;
  job_id: number;
  additional_days: number;
  daily_rate: number;
  num_workers: number;
  additional_escrow: number;
  platform_fee: number;
  total_required: number;
  new_duration_days: number;
}

export interface DailyFinishJobResponse {
  success: boolean;
  message: string;
  job_id: number;
  status: string;
  client_marked_complete: boolean;
  worker_marked_complete: boolean;
  escrow_collected?: number;
  worker_compensation_paid?: number;
  refund_amount?: number;
}

export const useRequestDailySkipDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, request_date }: RequestDailySkipDayPayload) => {
      const response = await apiRequest(
        ENDPOINTS.DAILY_SKIP_DAY_REQUEST(jobId),
        {
          method: "POST",
          body: JSON.stringify({ request_date }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to request skip day"));
      }

      return response.json() as Promise<{ success: boolean; message?: string }>;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyAttendance", variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailySummary", variables.jobId],
      });
      queryClient.invalidateQueries({ queryKey: ["messages"] });

      Toast.show({
        type: "success",
        text1: "Skip Day Requested",
        text2: data.message || "Request submitted to client",
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

export const useClientReviewDailySkipDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      skipRequestId,
      approve,
      reason,
    }: ClientReviewDailySkipDayPayload) => {
      const response = await apiRequest(
        ENDPOINTS.DAILY_SKIP_DAY_REVIEW(jobId, skipRequestId),
        {
          method: "POST",
          body: JSON.stringify({
            action: approve ? "approve" : "reject",
            reason,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          getErrorMessage(error, "Failed to review skip day request"),
        );
      }

      return response.json() as Promise<SkipDayReviewResponse>;
    },
    onSuccess: (data, variables) => {
      const response = data;
      const skipStatus = response?.skip_request?.status;
      if (skipStatus) {
        patchConversationSkipRequestStatus(
          queryClient,
          variables.jobId,
          variables.skipRequestId,
          skipStatus,
          response?.skip_request?.client_rejection_reason ?? null,
        );
      }

      patchConversationAttendanceRows(
        queryClient,
        variables.jobId,
        response?.processed_attendance || [],
      );

      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });

      Toast.show({
        type: "success",
        text1: "Request Updated",
        text2: data.message || "Skip day request reviewed",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Review Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

export const useClientQASkipNextDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, reason }: ClientQASkipNextDayPayload) => {
      const response = await apiRequest(ENDPOINTS.JOB_QA_SKIP_NEXT_DAY(jobId), {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to advance QA day"));
      }

      return response.json() as Promise<{ success: boolean; message?: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });

      Toast.show({
        type: "success",
        text1: "QA Day Advanced",
        text2: data.message || "Moved to next effective day",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "QA Advance Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

export const useDailyExtendOneDay = () => {
  const queryClient = useQueryClient();

  return useMutation<DailyExtendOneDayResponse, Error, { jobId: number }>({
    mutationFn: async ({ jobId }) => {
      const response = await apiRequest(ENDPOINTS.DAILY_EXTEND_ONE_DAY(jobId), {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to extend daily job"));
      }

      return response.json() as Promise<DailyExtendOneDayResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      Toast.show({
        type: "success",
        text1: "Extended by 1 Day ✅",
        text2: data.message || "Additional escrow has been collected",
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Extension Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

export const useDailyFinishJob = () => {
  const queryClient = useQueryClient();

  return useMutation<DailyFinishJobResponse, Error, { jobId: number }>({
    mutationFn: async ({ jobId }) => {
      const response = await apiRequest(ENDPOINTS.DAILY_FINISH_JOB(jobId), {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to finish daily job"));
      }

      return response.json() as Promise<DailyFinishJobResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      const refundAmount = Number(data?.refund_amount || 0);

      Toast.show({
        type: "success",
        text1: "Job Finished ✅",
        text2:
          data.message ||
          (refundAmount > 0
            ? `Reviews unlocked. Refunded ₱${refundAmount.toFixed(2)} unused escrow.`
            : "Reviews can now be submitted"),
        position: "top",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Finish Failed",
        text2: error.message,
        position: "top",
      });
    },
  });
};

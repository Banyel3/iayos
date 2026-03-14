// React Query Hooks for Messages Management
// Handles fetching and sending messages

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { ENDPOINTS, apiRequest, getAbsoluteMediaUrl } from "../api/config";
import { parseApiError } from "../utils/parse-api-error";
import { useSendMessage } from "./useWebSocket";
import type { EstimatedCompletion } from "@/components/EstimatedTimeCard";

export class ApiResponseError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.statusText = statusText;
  }
}

export type MessageAttachment = {
  attachment_id: number;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_at: string;
};

export type Message = {
  sender_name: string;
  sender_avatar: string;
  message_text: string;
  message_type: "TEXT" | "IMAGE" | "SYSTEM" | "LOCATION" | "FILE";
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
  sender_type?: "profile" | "agency" | "admin" | "system";
  message_id?: number;
  attachments?: MessageAttachment[];
};

// Payment buffer info for completed jobs
export type PaymentBufferInfo = {
  buffer_days: number;
  payment_release_date: string | null;
  payment_release_date_formatted: string | null;
  is_payment_released: boolean;
  payment_released_at: string | null;
  payment_held_reason: string | null;
  remaining_days: number | null;
};

export type JobMaterialItem = {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  source: "FROM_PROFILE" | "TO_PURCHASE" | "PURCHASED";
  purchase_price: number | null;
  receipt_image_url: string | null;
  client_approved: boolean;
  client_approved_at: string | null;
  client_rejected: boolean;
  rejection_reason: string | null;
  added_by: "CLIENT_REQUEST" | "WORKER_SUPPLIED";
  worker_material_id: number | null;
  created_at: string;
};

export type ConversationDetail = {
  conversation_id: number;
  status?: string;
  is_archived?: boolean;
  job: {
    id: number;
    title: string;
    status: string;
    budget: number;
    location: string;
    preferred_start_date?: string;
    clientConfirmedWorkStarted: boolean;
    workerMarkedComplete: boolean;
    clientMarkedComplete: boolean;
    remainingPaymentPaid?: boolean;
    workerReviewed: boolean;
    clientReviewed: boolean;
    // Agency job review tracking - null for non-agency jobs
    employeeReviewed?: boolean | null;
    agencyReviewed?: boolean | null;
    next_review_action?: "EMPLOYEE" | "AGENCY" | null;
    review_progress?: {
      employees_required: number;
      employees_reviewed: number;
      employees_pending: number;
      agency_reviewed: boolean;
    } | null;
    assignedWorkerId?: number;
    clientId?: number;
    // ML-predicted estimated completion time
    estimatedCompletion?: EstimatedCompletion | null;
    // Payment buffer info for completed jobs
    paymentBuffer?: PaymentBufferInfo | null;
    // Daily payment model fields
    payment_model?: "PROJECT" | "DAILY";
    daily_rate?: number;
    duration_days?: number;
    total_days_worked?: number;
    // Materials purchasing workflow
    materials_status?:
      | "NONE"
      | "PENDING_PURCHASE"
      | "BUYING"
      | "PURCHASED"
      | "APPROVED";
    materials_cost?: number;
  };
  other_participant: {
    name: string;
    avatar: string;
    profile_type?: string;
    role?: string; // For agency: "AGENCY"
    city?: string | null;
    job_title?: string | null;
  } | null;
  assigned_employee?: {
    id: number;
    name: string;
    avatar: string;
    rating?: number | null;
  } | null;
  // Multi-employee support for agency jobs
  assigned_employees?: Array<{
    id: number;
    name: string;
    avatar: string;
    rating?: number | null;
    isPrimaryContact?: boolean;
    reviewSubmitted?: boolean;
    // PROJECT job workflow tracking (mirrors DAILY job DailyAttendance)
    dispatched?: boolean;
    dispatchedAt?: string | null;
    clientConfirmedArrival?: boolean;
    clientConfirmedArrivalAt?: string | null;
    agencyMarkedComplete?: boolean;
    agencyMarkedCompleteAt?: string | null;
    employeeMarkedComplete?: boolean;
    employeeMarkedCompleteAt?: string | null;
    marked_complete?: boolean;
    // Per-employee approval tracking
    paymentAmount?: number | null;
    clientApproved?: boolean;
    clientApprovedAt?: string | null;
  }>;
  pending_employee_reviews?: number[]; // Employee IDs not yet reviewed
  all_employees_reviewed?: boolean;
  is_agency_job?: boolean;
  // Team job support (multi-worker jobs)
  is_team_job?: boolean;
  team_worker_assignments?: Array<{
    worker_id: number;
    account_id: number;
    name: string;
    avatar: string;
    skill: string;
    assignment_id: number;
    is_reviewed: boolean;
    // Arrival tracking (3-phase workflow)
    client_confirmed_arrival: boolean;
    client_confirmed_arrival_at: string | null;
    // Completion tracking
    worker_marked_complete: boolean;
    worker_marked_complete_at: string | null;
  }>;
  pending_team_worker_reviews?: Array<{
    worker_id: number;
    account_id: number;
    name: string;
    avatar: string;
    skill?: string;
  }>;
  all_team_workers_reviewed?: boolean;
  // Backjob/dispute support
  backjob?: {
    has_backjob: boolean;
    dispute_id?: number;
    reason?: string;
    total_backjobs_for_job?: number;
    latest_dispute_status?:
      | "OPEN"
      | "IN_NEGOTIATION"
      | "UNDER_REVIEW"
      | "APPROVED"
      | "REJECTED"
      | "COMPLETED"
      | "RESOLVED"
      | "CLOSED";
    status?:
      | "OPEN"
      | "IN_NEGOTIATION"
      | "UNDER_REVIEW"
      | "APPROVED"
      | "REJECTED"
      | "COMPLETED"
      | "RESOLVED"
      | "CLOSED";
    scheduled_date?: string | null;
    worker_schedule_confirmed?: boolean;
    worker_schedule_confirmed_at?: string | null;
    team_schedule_total_workers?: number;
    team_schedule_confirmed_count?: number;
    my_schedule_confirmed?: boolean | null;
    backjob_started?: boolean;
    worker_marked_complete?: boolean;
    client_confirmed_complete?: boolean;
  } | null;
  // Daily attendance tracking for DAILY payment model jobs
  attendance_today?: Array<{
    attendance_id: number;
    worker_id?: number;
    worker_account_id?: number;
    worker_name?: string;
    worker_avatar?: string;
    date: string;
    time_in?: string;
    time_out?: string;
    status: string;
    amount_earned: number;
    worker_confirmed: boolean;
    client_confirmed: boolean;
    payment_processed: boolean;
  }>;
  daily_skip_requests_today?: Array<{
    skip_request_id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    request_date?: string;
    requested_count?: number;
    total_required?: number;
    requires_all_team_workers?: boolean;
    all_workers_requested?: boolean;
    my_worker_requested?: boolean;
    client_rejection_reason?: string | null;
  }>;
  effective_work_date?: string;
  qa_day_offset?: number;
  qa_testing_mode?: boolean;
  my_role: "CLIENT" | "WORKER" | "AGENCY";
  messages: Message[];
  total_messages: number;
  client_review?: {
    review_id?: number;
    reviewer_account_id?: number | null;
    reviewer_type?: "CLIENT" | "WORKER" | "AGENCY";
    reviewer_name?: string;
    reviewer_avatar?: string | null;
    rating_communication: number;
    rating_punctuality: number;
    rating_professionalism: number;
    rating_quality: number;
    comment: string;
    created_at: string;
  } | null;
  worker_review?: {
    review_id?: number;
    reviewer_account_id?: number | null;
    reviewer_type?: "CLIENT" | "WORKER" | "AGENCY";
    reviewer_name?: string;
    reviewer_avatar?: string | null;
    rating_communication: number;
    rating_punctuality: number;
    rating_professionalism: number;
    rating_quality: number;
    comment: string;
    created_at: string;
  } | null;
  counterparty_reviews?: Array<{
    review_id: number;
    reviewer_account_id?: number | null;
    reviewer_type?: "WORKER" | "AGENCY";
    reviewer_name?: string;
    reviewer_avatar?: string | null;
    rating_communication: number;
    rating_punctuality: number;
    rating_professionalism: number;
    rating_quality: number;
    comment: string;
    created_at: string;
  }>;
  my_editable_reviews?: Array<{
    review_id: number;
    target_type: "EMPLOYEE" | "AGENCY" | "TEAM_WORKER" | "USER";
    target_id: number | null;
    target_name: string;
    can_edit: boolean;
    rating_quality: number;
    rating_communication: number;
    rating_punctuality: number;
    rating_professionalism: number;
    comment: string;
    created_at: string | null;
    backjob_edit_deadline: string | null;
  }>;
  // Job materials purchasing workflow
  job_materials?: JobMaterialItem[];
};

/**
 * Fetch messages for a conversation
 * Auto-marks messages as read on fetch
 * Uses polling as fallback when WebSocket is unavailable
 */
export function useMessages(
  conversationId: number,
  viewerKey: string = "default",
) {
  return useQuery({
    queryKey: ["messages", conversationId, viewerKey],
    queryFn: async (): Promise<ConversationDetail> => {
      const url = ENDPOINTS.CONVERSATION_MESSAGES(conversationId);
      const response = await apiRequest(url);

      if (!response.ok) {
        const message = await parseApiError(response);
        throw new ApiResponseError(
          message,
          response.status,
          response.statusText,
        );
      }

      const data = (await response.json()) as ConversationDetail;
      // Transform avatar URLs to absolute URLs for local storage compatibility
      return {
        ...data,
        other_participant: data.other_participant
          ? {
              ...data.other_participant,
              avatar: getAbsoluteMediaUrl(data.other_participant.avatar) || "",
            }
          : null,
        assigned_employee: data.assigned_employee
          ? {
              ...data.assigned_employee,
              avatar: getAbsoluteMediaUrl(data.assigned_employee.avatar) || "",
            }
          : null,
        assigned_employees: data.assigned_employees?.map((emp: any) => ({
          ...emp,
          avatar: getAbsoluteMediaUrl(emp.avatar) || "",
        })),
        // Team worker assignments for team jobs
        team_worker_assignments: data.team_worker_assignments?.map(
          (worker: any) => ({
            ...worker,
            avatar: getAbsoluteMediaUrl(worker.avatar) || "",
          }),
        ),
        pending_team_worker_reviews: data.pending_team_worker_reviews?.map(
          (worker: any) => ({
            ...worker,
            avatar: getAbsoluteMediaUrl(worker.avatar) || "",
          }),
        ),
        client_review: data.client_review
          ? {
              ...data.client_review,
              reviewer_avatar:
                getAbsoluteMediaUrl(data.client_review.reviewer_avatar || null) ||
                "",
            }
          : null,
        worker_review: data.worker_review
          ? {
              ...data.worker_review,
              reviewer_avatar:
                getAbsoluteMediaUrl(data.worker_review.reviewer_avatar || null) ||
                "",
            }
          : null,
        counterparty_reviews: data.counterparty_reviews?.map((review: any) => ({
          ...review,
          reviewer_avatar: getAbsoluteMediaUrl(review.reviewer_avatar) || "",
        })),
        messages: data.messages.map((msg: Message) => ({
          ...msg,
          sender_avatar: getAbsoluteMediaUrl(msg.sender_avatar) || "",
        })),
      };
    },
    enabled: !!conversationId,
    // Keep WebSocket as primary realtime transport, but tighten fallback polling.
    staleTime: 5000,
    refetchInterval: 5000, // Poll every 5s when WebSocket events are missed
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Send a message (uses WebSocket with HTTP fallback)
 */
export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  const { sendMessage: sendViaWebSocket } = useSendMessage();

  const invalidateConversationMessages = (conversationId: number) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key[0] === "messages" &&
          key[1] === conversationId
        );
      },
    });
  };

  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
      type = "TEXT",
    }: {
      conversationId: number;
      text: string;
      type?: "TEXT" | "IMAGE";
    }) => {
      // Send via WebSocket (includes HTTP fallback)
      const success = await sendViaWebSocket(conversationId, text, type);

      if (!success) {
        throw new Error("Failed to send message");
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch
      invalidateConversationMessages(variables.conversationId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/**
 * Upload image message
 */
export function useUploadImageMessage() {
  const queryClient = useQueryClient();

  const invalidateConversationMessages = (conversationId: number) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key[0] === "messages" &&
          key[1] === conversationId
        );
      },
    });
  };

  return useMutation({
    mutationFn: async ({
      conversationId,
      imageUri,
      fileName,
    }: {
      conversationId: number;
      imageUri: string;
      fileName: string;
    }) => {
      const formData = new FormData();

      // Create file object from URI
      const file = {
        uri: imageUri,
        type: "image/jpeg",
        name: fileName,
      } as any;

      formData.append("image", file);

      const url = ENDPOINTS.UPLOAD_MESSAGE_IMAGE(conversationId);
      const response = await apiRequest(url, {
        method: "POST",
        body: formData as any,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateConversationMessages(variables.conversationId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/**
 * Get message statistics
 */
export function useMessageStats(conversationId: number) {
  const { data } = useMessages(conversationId);

  const stats = {
    total: data?.total_messages || 0,
    unread: data?.messages.filter((m) => !m.is_read && !m.is_mine).length || 0,
    mine: data?.messages.filter((m) => m.is_mine).length || 0,
    theirs: data?.messages.filter((m) => !m.is_mine).length || 0,
    images:
      data?.messages.filter((m) => m.message_type === "IMAGE").length || 0,
  };

  return stats;
}

/**
 * Infinite scroll hook for messages (for pagination in future)
 * Currently not implemented in backend but ready for when it is
 */
export function useInfiniteMessages(conversationId: number) {
  return useInfiniteQuery({
    queryKey: ["messages", "infinite", conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      // TODO: Update backend to support pagination
      // For now, just return all messages
      const url = ENDPOINTS.CONVERSATION_MESSAGES(conversationId);
      const response = await apiRequest(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = (await response.json()) as ConversationDetail;

      return {
        messages: data.messages,
        nextPage: null, // No pagination yet
        hasMore: false,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!conversationId,
  });
}

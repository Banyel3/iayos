// React Query Hooks for Agency Conversations
// Handles fetching, searching, and sending messages for agency portal
// Uses agency-specific API endpoints

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { API_BASE } from "@/lib/api/config";

// Types
export type AgencyConversationJob = {
  id: number;
  title: string;
  status: string;
  budget: number;
  location: string;
  clientConfirmedWorkStarted: boolean;
  workerMarkedComplete: boolean;
  clientMarkedComplete: boolean;
  workerReviewed: boolean;
  clientReviewed: boolean;
  assignedEmployeeId: number | null;
  assignedEmployeeName: string | null;
  payment_model?: "PROJECT" | "DAILY"; // Daily payment vs project payment
  daily_rate_agreed?: number; // Per worker per day rate
  duration_days?: number; // Expected duration
};

export type AgencyConversationParticipant = {
  name: string;
  avatar: string | null;
  profile_type: string;
  city: string | null;
  job_title: string | null;
};

export type AgencyEmployee = {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  rating: number | null;
  totalJobsCompleted: number;
  totalEarnings: number;
  employeeOfTheMonth: boolean;
  rank: number;
};

// For multi-employee assignment display
export type AssignedEmployee = {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  rating: number | null;
  isPrimaryContact: boolean;
  status: string;
  // PROJECT job workflow tracking
  dispatched?: boolean;
  dispatchedAt?: string | null;
  clientConfirmedArrival?: boolean;
  clientConfirmedArrivalAt?: string | null;
  agencyMarkedComplete?: boolean;
  agencyMarkedCompleteAt?: string | null;
};

// Backjob info returned from conversations API
export type BackjobInfo = {
  has_backjob: boolean;
  dispute_id: number | null;
  reason: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  opened_date: string | null;
  backjob_started: boolean;
  backjob_started_at: string | null;
  worker_marked_complete: boolean;
  worker_marked_complete_at: string | null;
  client_confirmed: boolean;
  client_confirmed_at: string | null;
};

export type AgencyConversation = {
  id: number;
  job: AgencyConversationJob;
  client: AgencyConversationParticipant;
  assigned_employee: AgencyEmployee | null;
  assigned_employees: AssignedEmployee[]; // Multi-employee support
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_archived: boolean;
  status: string;
  created_at: string;
  backjob?: BackjobInfo; // Optional backjob info
  my_role?: string; // Role in the conversation (CLIENT/WORKER/AGENCY)
};

export type AgencyConversationsResponse = {
  success: boolean;
  conversations: AgencyConversation[];
  total: number;
};

export type AgencyMessage = {
  message_id: number;
  sender_name: string;
  sender_avatar: string | null;
  message_text: string;
  message_type: "TEXT" | "IMAGE" | "SYSTEM";
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
  sent_by_agency: boolean;
};

export type AgencyConversationDetail = {
  conversation_id: number;
  job: AgencyConversationJob;
  client: AgencyConversationParticipant;
  assigned_employee: AgencyEmployee | null;
  assigned_employees: AssignedEmployee[]; // Multi-employee support
  messages: AgencyMessage[];
  total_messages: number;
  status: string;
  backjob?: BackjobInfo; // Optional backjob info
  my_role?: string; // Role in the conversation (CLIENT/WORKER/AGENCY)
};

/**
 * Fetch all agency conversations
 * @param filter - 'active', 'unread', or 'archived' (default: 'active')
 */
export function useAgencyConversations(
  filter: "active" | "unread" | "archived" = "active",
) {
  return useQuery({
    queryKey: ["agency-conversations", filter],
    queryFn: async (): Promise<AgencyConversationsResponse> => {
      const url = `${API_BASE}/api/agency/conversations?filter=${filter}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch agency conversations: ${response.statusText}`,
        );
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Search agency conversations by client name or job title
 */
export function useAgencyConversationSearch(searchQuery: string) {
  const { data: conversationsData, isLoading } =
    useAgencyConversations("active");

  const filteredConversations =
    conversationsData?.conversations.filter((conv) => {
      const query = searchQuery.toLowerCase();
      const clientName = conv.client.name.toLowerCase();
      const jobTitle = conv.job.title.toLowerCase();
      const employeeName = conv.assigned_employee?.name.toLowerCase() || "";

      return (
        clientName.includes(query) ||
        jobTitle.includes(query) ||
        employeeName.includes(query)
      );
    }) || [];

  return {
    conversations: filteredConversations,
    isLoading,
    total: filteredConversations.length,
  };
}

/**
 * Fetch messages for a specific agency conversation
 */
export function useAgencyMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ["agency-messages", conversationId],
    queryFn: async (): Promise<AgencyConversationDetail> => {
      const url = `${API_BASE}/api/agency/conversations/${conversationId}/messages`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!conversationId,
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Send a message in an agency conversation
 */
export function useAgencySendMessage() {
  const queryClient = useQueryClient();

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
      const response = await fetch(
        `${API_BASE}/api/agency/conversations/${conversationId}/send`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message_text: text,
            message_type: type,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate messages cache for this conversation
      queryClient.invalidateQueries({
        queryKey: ["agency-messages", variables.conversationId],
      });
      // Invalidate conversations list to update preview
      queryClient.invalidateQueries({ queryKey: ["agency-conversations"] });
    },
  });
}

/**
 * Toggle archive status for a conversation
 */
export function useAgencyArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: number }) => {
      const response = await fetch(
        `${API_BASE}/api/agency/conversations/${conversationId}/toggle-archive`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to toggle archive status: ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all conversation queries
      queryClient.invalidateQueries({ queryKey: ["agency-conversations"] });
    },
  });
}

/**
 * Upload a completion photo for a job (agency/worker action)
 */
export function useUploadCompletionPhoto() {
  return useMutation({
    mutationFn: async ({ jobId, file }: { jobId: number; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${API_BASE}/api/jobs/${jobId}/upload-completion-photo`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          getErrorMessage(
            error,
            `Failed to upload photo: ${response.statusText}`,
          ),
        );
      }

      return response.json();
    },
  });
}

/**
 * Mark a job as complete (agency/worker action)
 */
export function useAgencyMarkComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      completionNotes,
    }: {
      jobId: number;
      completionNotes?: string;
    }) => {
      const response = await fetch(
        `${API_BASE}/api/jobs/${jobId}/mark-complete`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completion_notes: completionNotes || "",
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          getErrorMessage(
            error,
            `Failed to mark complete: ${response.statusText}`,
          ),
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate messages cache to refresh job status
      queryClient.invalidateQueries({ queryKey: ["agency-messages"] });
      queryClient.invalidateQueries({ queryKey: ["agency-conversations"] });
    },
  });
}

/**
 * Submit a review for a completed job (agency action)
 */
export function useAgencySubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      rating_quality,
      rating_communication,
      rating_punctuality,
      rating_professionalism,
      reviewText,
    }: {
      jobId: number;
      rating_quality: number;
      rating_communication: number;
      rating_punctuality: number;
      rating_professionalism: number;
      reviewText: string;
    }) => {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating_quality,
          rating_communication,
          rating_punctuality,
          rating_professionalism,
          message: reviewText,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          getErrorMessage(
            error,
            `Failed to submit review: ${response.statusText}`,
          ),
        );
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate messages cache to refresh review status
      queryClient.invalidateQueries({ queryKey: ["agency-messages"] });
      queryClient.invalidateQueries({ queryKey: ["agency-conversations"] });
    },
  });
}

/**
 * Get unread count across all agency conversations
 */
export function useAgencyUnreadCount() {
  const { data } = useAgencyConversations("active");

  const unreadCount =
    data?.conversations.reduce((acc, conv) => acc + conv.unread_count, 0) || 0;

  return { unreadCount };
}

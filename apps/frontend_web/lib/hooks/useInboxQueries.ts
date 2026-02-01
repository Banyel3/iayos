import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  fetchMessages,
  Conversation,
  ChatMessage,
  ConversationFilter,
} from "@/lib/api/chat";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { API_BASE } from "@/lib/api/config";

const API_BASE_URL = API_BASE;

export type { ConversationFilter };

// Query Keys
export const inboxKeys = {
  all: ["inbox"] as const,
  conversations: (filter: ConversationFilter) =>
    [...inboxKeys.all, "conversations", filter] as const,
  conversation: (id: number) => [...inboxKeys.all, "conversation", id] as const,
  messages: (id: number) => [...inboxKeys.all, "messages", id] as const,
};

export const CONVERSATION_FILTERS: ConversationFilter[] = [
  "all",
  "unread",
  "archived",
];

/**
 * Hook to fetch and cache all conversations
 * Tier 3: Dynamic data - 10 minute background refresh
 */
export function useConversations(
  filter: ConversationFilter,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: inboxKeys.conversations(filter),
    queryFn: () => fetchConversations(filter),
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: 10 * 60 * 1000, // Background refresh every 10 minutes
    refetchIntervalInBackground: true,
  });
}

/**
 * Hook to fetch and cache messages for a specific conversation
 * Tier 4: Real-time data - WebSocket updates only, no auto-refresh
 */
export function useConversationMessages(conversationId: number | null) {
  return useQuery({
    queryKey: inboxKeys.messages(conversationId!),
    queryFn: () => fetchMessages(conversationId!),
    enabled: conversationId !== null,
    staleTime: Infinity, // Never auto-refetch (WebSocket handles updates)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: false, // No background refresh (WebSocket only)
    // Return the full response (messages + conversation metadata)
  });
}

/**
 * Hook to mark job as complete (worker)
 */
export function useMarkJobComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(
        `${API_BASE_URL}/api/jobs/${jobId}/mark-complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to mark job as complete"));
      }

      return response.json();
    },
    onSuccess: (data, jobId) => {
      // Invalidate conversations to refresh completion status
      CONVERSATION_FILTERS.forEach((filter) =>
        queryClient.invalidateQueries({
          queryKey: inboxKeys.conversations(filter),
        }),
      );
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages(jobId) });
    },
  });
}

/**
 * Hook to approve job completion (client)
 */
export function useApproveJobCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      paymentMethod = "WALLET",
    }: {
      jobId: number;
      paymentMethod?: "WALLET" | "GCASH" | "CASH";
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/api/jobs/${jobId}/approve-completion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ payment_method: paymentMethod }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to approve job completion"));
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      CONVERSATION_FILTERS.forEach((filter) =>
        queryClient.invalidateQueries({
          queryKey: inboxKeys.conversations(filter),
        }),
      );
      queryClient.invalidateQueries({
        queryKey: inboxKeys.messages(variables.jobId),
      });
    },
  });
}

/**
 * Hook to submit a review
 * Supports multi-employee agency jobs with review_target and employee_id
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      rating,
      message,
      review_target,
      employee_id,
    }: {
      jobId: number;
      rating: number;
      message: string;
      review_target?: "EMPLOYEE" | "AGENCY"; // For agency jobs
      employee_id?: number; // For multi-employee agency jobs
    }) => {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating,
          message: message.trim() || null,
          review_target,
          employee_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Failed to submit review"));
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch to get fresh review status
      CONVERSATION_FILTERS.forEach((filter) =>
        queryClient.invalidateQueries({
          queryKey: inboxKeys.conversations(filter),
        }),
      );
      queryClient.invalidateQueries({
        queryKey: inboxKeys.messages(variables.jobId),
      });
    },
  });
}

/**
 * Helper to update conversation cache with new message (optimistic update)
 */
export function useOptimisticMessageUpdate() {
  const queryClient = useQueryClient();

  return (conversationId: number, newMessage: ChatMessage) => {
    // Optimistically update the messages cache
    queryClient.setQueryData(
      inboxKeys.messages(conversationId),
      (old: { messages: ChatMessage[]; conversation: any } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, newMessage],
        };
      },
    );

    // Update conversation's last message
    CONVERSATION_FILTERS.forEach((filter) => {
      queryClient.setQueryData(
        inboxKeys.conversations(filter),
        (old: Conversation[] | undefined) => {
          if (!old) return old;
          return old.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  last_message: newMessage.message_text,
                  last_message_time: newMessage.created_at,
                }
              : conv,
          );
        },
      );
    });
  };
}

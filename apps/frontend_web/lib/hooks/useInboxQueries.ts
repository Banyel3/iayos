import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  fetchMessages,
  Conversation,
  ChatMessage,
} from "@/lib/api/chat";

// Query Keys
export const inboxKeys = {
  all: ["inbox"] as const,
  conversations: () => [...inboxKeys.all, "conversations"] as const,
  conversation: (id: number) => [...inboxKeys.all, "conversation", id] as const,
  messages: (id: number) => [...inboxKeys.all, "messages", id] as const,
};

/**
 * Hook to fetch and cache all conversations
 */
export function useConversations() {
  return useQuery({
    queryKey: inboxKeys.conversations(),
    queryFn: fetchConversations,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch and cache messages for a specific conversation
 */
export function useConversationMessages(conversationId: number | null) {
  return useQuery({
    queryKey: inboxKeys.messages(conversationId!),
    queryFn: () => fetchMessages(conversationId!),
    enabled: conversationId !== null,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
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
        `http://localhost:8000/api/jobs/${jobId}/mark-complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark job as complete");
      }

      return response.json();
    },
    onSuccess: (data, jobId) => {
      // Invalidate conversations to refresh completion status
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations() });
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
    mutationFn: async (jobId: number) => {
      const response = await fetch(
        `http://localhost:8000/api/jobs/${jobId}/approve-completion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve job completion");
      }

      return response.json();
    },
    onSuccess: (data, jobId) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages(jobId) });
    },
  });
}

/**
 * Hook to submit a review
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      rating,
      message,
    }: {
      jobId: number;
      rating: number;
      message: string;
    }) => {
      const response = await fetch(
        `http://localhost:8000/api/jobs/${jobId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ rating, message: message.trim() || null }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch to get fresh review status
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations() });
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
      }
    );

    // Update conversation's last message
    queryClient.setQueryData(
      inboxKeys.conversations(),
      (old: Conversation[] | undefined) => {
        if (!old) return old;
        return old.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                last_message: newMessage.message_text,
                last_message_time: newMessage.created_at,
              }
            : conv
        );
      }
    );
  };
}

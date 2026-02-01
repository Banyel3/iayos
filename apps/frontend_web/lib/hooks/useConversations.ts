// React Query Hooks for Conversations Management
// Handles fetching, searching, and filtering conversations
// Ported from React Native mobile app

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { API_BASE } from "@/lib/api/config";

const API_BASE_URL = API_BASE;

export type Conversation = {
  id: number;
  job: {
    id: number;
    title: string;
    status: string;
    budget: number;
    location: string;
    workerMarkedComplete: boolean;
    clientMarkedComplete: boolean;
    workerReviewed: boolean;
    clientReviewed: boolean;
    remainingPaymentPaid: boolean;
  };
  other_participant: {
    name: string;
    avatar: string;
    profile_type: string;
    city: string | null;
    job_title: string | null;
  };
  my_role: "CLIENT" | "WORKER";
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_archived: boolean;
  status: string;
  created_at: string;
};

export type ConversationsResponse = {
  success: boolean;
  conversations: Conversation[];
  total: number;
};

/**
 * Fetch conversations with optional filter
 * @param filter - 'all', 'unread', or 'archived'
 */
export function useConversations(
  filter: "all" | "unread" | "archived" = "all",
) {
  return useQuery({
    queryKey: ["conversations", filter],
    queryFn: async (): Promise<ConversationsResponse> => {
      const url = `${API_BASE_URL}/api/profiles/conversations?filter=${filter}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch conversations: ${response.statusText}`,
        );
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds - refresh frequently for real-time feel
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Search conversations by participant name or job title
 */
export function useConversationSearch(searchQuery: string) {
  const { data: conversationsData, isLoading } = useConversations("all");

  const filteredConversations =
    conversationsData?.conversations.filter((conv) => {
      const query = searchQuery.toLowerCase();
      const participantName = conv.other_participant.name.toLowerCase();
      const jobTitle = conv.job.title.toLowerCase();

      return participantName.includes(query) || jobTitle.includes(query);
    }) || [];

  return {
    conversations: filteredConversations,
    isLoading,
    total: filteredConversations.length,
  };
}

/**
 * Get conversation by ID
 */
export function useConversation(conversationId: number) {
  const { data } = useConversations("all");

  return {
    conversation: data?.conversations.find((c) => c.id === conversationId),
    isLoading: !data,
  };
}

/**
 * Archive/unarchive a conversation
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      archive,
    }: {
      conversationId: number;
      archive: boolean;
    }) => {
      console.log(
        `[useArchiveConversation] ${archive ? "Archiving" : "Unarchiving"} conversation ${conversationId}`,
      );

      // Call backend toggle archive endpoint
      const response = await fetch(
        `${API_BASE_URL}/api/profiles/conversations/${conversationId}/toggle-archive`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage(errorData, "Failed to toggle archive status"));
      }

      const data = await response.json();
      console.log(`[useArchiveConversation] Success: ${data.message}`, data);

      return data;
    },
    onSuccess: () => {
      // Invalidate all conversation queries
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      console.error("[useArchiveConversation] Error:", error);
    },
  });
}

/**
 * Get unread count across all conversations
 */
export function useUnreadCount() {
  const { data } = useConversations("all");

  const unreadCount =
    data?.conversations.reduce((acc, conv) => acc + conv.unread_count, 0) || 0;

  return { unreadCount };
}

// React Query Hooks for Conversations Management
// Handles fetching, searching, and filtering conversations

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "../api/config";

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
export function useConversations(filter: "all" | "unread" | "archived" = "all") {
  return useQuery({
    queryKey: ["conversations", filter],
    queryFn: async (): Promise<ConversationsResponse> => {
      const url = `${ENDPOINTS.CONVERSATIONS}?filter=${filter}`;
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
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
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async (): Promise<Conversation> => {
      const { data } = useConversations("all");
      const conversation = data?.conversations.find(
        (c) => c.id === conversationId
      );

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return conversation;
    },
    enabled: !!conversationId,
  });
}

/**
 * Archive/unarchive a conversation
 * Note: Backend API endpoint needed - placeholder for now
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
      // TODO: Implement backend endpoint
      // For now, just invalidate cache
      console.log(
        `[useArchiveConversation] ${archive ? "Archiving" : "Unarchiving"} conversation ${conversationId}`
      );

      // Placeholder - would call:
      // PUT /api/profiles/chat/conversations/{id}/archive
      // Body: { archived: true/false }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/**
 * Get unread conversations count
 */
export function useUnreadCount() {
  const { data: conversationsData } = useConversations("unread");

  const unreadCount = conversationsData?.total || 0;

  return { unreadCount };
}

/**
 * Hook to get conversation stats
 */
export function useConversationStats() {
  const { data: allData } = useConversations("all");
  const { data: unreadData } = useConversations("unread");
  const { data: archivedData } = useConversations("archived");

  return {
    total: allData?.total || 0,
    unread: unreadData?.total || 0,
    archived: archivedData?.total || 0,
    active: (allData?.total || 0) - (archivedData?.total || 0),
  };
}

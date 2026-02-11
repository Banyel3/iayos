// React Query Hooks for Conversations Management
// Handles fetching, searching, and filtering conversations

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest, getAbsoluteMediaUrl } from "../api/config";
import { getErrorMessage } from "../utils/parse-api-error";

export type TeamMember = {
  profile_id: number;
  name: string;
  avatar: string | null;
  role: string;
  skill: string | null;
};

export type Conversation = {
  id: number;
  conversation_type: "ONE_ON_ONE" | "TEAM_GROUP";
  job: {
    id: number;
    title: string;
    status: string;
    budget: number;
    location: string;
    workerMarkedComplete?: boolean;
    clientMarkedComplete?: boolean;
    workerReviewed?: boolean;
    clientReviewed?: boolean;
    remainingPaymentPaid?: boolean;
    is_team_job?: boolean;
    total_workers?: number;
  };
  // For ONE_ON_ONE conversations
  other_participant?: {
    name: string;
    avatar: string | null;
    profile_type: string;
    city: string | null;
    job_title: string | null;
  };
  // For TEAM_GROUP conversations
  team_members?: TeamMember[];
  my_skill?: string | null;
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
 * @param filter - 'active', 'unread', or 'archived'
 */
export function useConversations(
  filter: "active" | "unread" | "archived" = "active"
) {
  return useQuery({
    queryKey: ["conversations", filter],
    queryFn: async (): Promise<ConversationsResponse> => {
      const url = `${ENDPOINTS.CONVERSATIONS}?filter=${filter}`;
      const response = await apiRequest(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch conversations: ${response.statusText}`
        );
      }

      const data = (await response.json()) as ConversationsResponse;
      // Transform avatar URLs to absolute URLs for local storage compatibility
      return {
        ...data,
        conversations: data.conversations.map((conv: Conversation) => {
          // Handle team group conversations
          if (conv.conversation_type === "TEAM_GROUP") {
            return {
              ...conv,
              team_members: conv.team_members?.map((member: TeamMember) => ({
                ...member,
                avatar: getAbsoluteMediaUrl(member.avatar) as string | null,
              })),
            };
          }
          // Handle 1:1 conversations
          return {
            ...conv,
            other_participant: conv.other_participant
              ? {
                  ...conv.other_participant,
                  avatar: getAbsoluteMediaUrl(conv.other_participant.avatar) as
                    | string
                    | null,
                }
              : undefined,
          };
        }),
      };
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
      const jobTitle = conv.job.title.toLowerCase();

      // For team conversations, search in team member names
      if (conv.conversation_type === "TEAM_GROUP") {
        const teamMemberMatch = conv.team_members?.some((member) =>
          member.name.toLowerCase().includes(query)
        );
        return teamMemberMatch || jobTitle.includes(query);
      }

      // For 1:1 conversations
      const participantName = conv.other_participant?.name?.toLowerCase() || "";
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
        `[useArchiveConversation] ${archive ? "Archiving" : "Unarchiving"} conversation ${conversationId}`
      );

      // Call backend toggle archive endpoint
      const response = await apiRequest(
        `${ENDPOINTS.CONVERSATIONS}/${conversationId}/toggle-archive`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ error: "Unknown error" }))) as { error?: string };
        throw new Error(getErrorMessage(errorData, "Failed to toggle archive status"));
      }

      const data = (await response.json()) as { message: string };
      console.log(`[useArchiveConversation] Success: ${data.message}`, data);

      return data;
    },
    onSuccess: () => {
      // Invalidate conversations queries to reflect archive status change
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      console.error("[useArchiveConversation] Error:", error);
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

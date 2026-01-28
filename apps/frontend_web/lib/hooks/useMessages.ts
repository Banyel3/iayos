// React Query Hooks for Messages Management
// Handles fetching and sending messages
// Ported from React Native mobile app

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSendMessage } from "./useWebSocketHooks";
import { API_BASE } from "@/lib/api/config";

const API_BASE_URL = API_BASE;

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
  message_id?: number;
  attachments?: MessageAttachment[];
};

export type ConversationDetail = {
  conversation_id: number;
  job: {
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
    assignedWorkerId?: number;
    clientId?: number;
  };
  other_participant: {
    name: string;
    avatar: string;
    profile_type: string;
    city: string | null;
    job_title: string | null;
  };
  my_role: "CLIENT" | "WORKER";
  messages: Message[];
  total_messages: number;
};

/**
 * Fetch messages for a conversation
 * Auto-marks messages as read on fetch
 */
export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async (): Promise<ConversationDetail> => {
      const url = `${API_BASE_URL}/api/profiles/conversations/${conversationId}/messages`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    enabled: !!conversationId,
    staleTime: 10000, // 10 seconds
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
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/**
 * Upload image message
 */
export function useUploadImageMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      imageFile,
    }: {
      conversationId: number;
      imageFile: File;
    }) => {
      const formData = new FormData();
      formData.append("image", imageFile);

      const url = `${API_BASE_URL}/api/profiles/conversations/${conversationId}/upload-image`;
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/**
 * Get message statistics
 */
export function useMessageStats(conversationId: number | null) {
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

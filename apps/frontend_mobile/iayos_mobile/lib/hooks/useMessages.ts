// React Query Hooks for Messages Management
// Handles fetching and sending messages

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { ENDPOINTS, apiRequest, getAbsoluteMediaUrl } from "../api/config";
import { useSendMessage } from "./useWebSocket";
import type { EstimatedCompletion } from "@/components/EstimatedTimeCard";

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
    // Agency job review tracking - null for non-agency jobs
    employeeReviewed?: boolean | null;
    agencyReviewed?: boolean | null;
    assignedWorkerId?: number;
    clientId?: number;
    // ML-predicted estimated completion time
    estimatedCompletion?: EstimatedCompletion | null;
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
  }>;
  pending_employee_reviews?: number[]; // Employee IDs not yet reviewed
  all_employees_reviewed?: boolean;
  is_agency_job?: boolean;
  my_role: "CLIENT" | "WORKER" | "AGENCY";
  messages: Message[];
  total_messages: number;
};

/**
 * Fetch messages for a conversation
 * Auto-marks messages as read on fetch
 * Uses polling as fallback when WebSocket is unavailable
 */
export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async (): Promise<ConversationDetail> => {
      const url = ENDPOINTS.CONVERSATION_MESSAGES(conversationId);
      const response = await apiRequest(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      // Transform avatar URLs to absolute URLs for local storage compatibility
      return {
        ...data,
        other_participant: data.other_participant
          ? {
              ...data.other_participant,
              avatar: getAbsoluteMediaUrl(data.other_participant.avatar),
            }
          : null,
        assigned_employee: data.assigned_employee
          ? {
              ...data.assigned_employee,
              avatar: getAbsoluteMediaUrl(data.assigned_employee.avatar),
            }
          : null,
        assigned_employees: data.assigned_employees?.map((emp: any) => ({
          ...emp,
          avatar: getAbsoluteMediaUrl(emp.avatar),
        })),
        messages: data.messages.map((msg: Message) => ({
          ...msg,
          sender_avatar: getAbsoluteMediaUrl(msg.sender_avatar),
        })),
      };
    },
    enabled: !!conversationId,
    staleTime: 5000, // 5 seconds - consider data fresh for 5s
    refetchInterval: 3000, // Poll every 3 seconds as fallback for WebSocket
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

      const data: ConversationDetail = await response.json();

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

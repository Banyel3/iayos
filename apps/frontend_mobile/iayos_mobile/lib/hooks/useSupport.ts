import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "../api/config";
import Constants from "expo-constants";

// Types
export interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  created_at: string;
  last_reply_at: string | null;
  reply_count: number;
}

export interface TicketMessage {
  id: number;
  sender_name: string;
  sender_type: "user" | "admin";
  is_admin: boolean;
  content: string;
  is_system_message: boolean;
  created_at: string;
}

export interface TicketDetail {
  id: number;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  last_reply_at: string | null;
  resolved_at: string | null;
  messages: TicketMessage[];
}

export interface TicketsResponse {
  success: boolean;
  tickets: SupportTicket[];
  total: number;
  page: number;
  has_next: boolean;
  total_pages: number;
}

export interface CreateTicketPayload {
  subject: string;
  category: string;
  description: string;
}

export interface ReplyPayload {
  ticketId: number;
  content: string;
}

// Category configuration
export const TICKET_CATEGORIES = [
  { value: "account", label: "Account Issues", icon: "👤" },
  { value: "payment", label: "Payment Issues", icon: "💳" },
  { value: "technical", label: "Technical Problems", icon: "🔧" },
  { value: "feature_request", label: "Feature Request", icon: "💡" },
  { value: "bug_report", label: "Bug Report", icon: "🐛" },
  { value: "general", label: "General Inquiry", icon: "❓" },
] as const;

// Priority configuration
export const TICKET_PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  low: { label: "Low", color: "#6B7280", icon: "🟢" },
  medium: { label: "Medium", color: "#F59E0B", icon: "🟡" },
  high: { label: "High", color: "#F97316", icon: "🟠" },
  urgent: { label: "Urgent", color: "#EF4444", icon: "🔴" },
};

// Status configuration
export const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: "#3B82F6", bg: "#DBEAFE" },
  in_progress: { label: "In Progress", color: "#8B5CF6", bg: "#EDE9FE" },
  waiting_user: { label: "Awaiting Reply", color: "#F59E0B", bg: "#FEF3C7" },
  resolved: { label: "Resolved", color: "#10B981", bg: "#D1FAE5" },
  closed: { label: "Closed", color: "#6B7280", bg: "#F3F4F6" },
};

// Get app version for tracking
const getAppVersion = (): string => {
  try {
    return Constants.expoConfig?.version || "unknown";
  } catch {
    return "unknown";
  }
};

// Hooks

interface UseMyTicketsParams {
  page?: number;
  status?: string;
}

/**
 * Fetch list of user's support tickets
 */
export function useMyTickets(params: UseMyTicketsParams = {}) {
  const { page = 1, status } = params;
  const url =
    ENDPOINTS.MY_SUPPORT_TICKETS +
    `?page=${page}${status && status !== "all" ? `&status=${status}` : ""}`;

  return useQuery<TicketsResponse>({
    queryKey: ["supportTickets", page, status],
    queryFn: async (): Promise<TicketsResponse> => {
      const response = await apiRequest(url);
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      return response.json() as Promise<TicketsResponse>;
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch single ticket detail with messages
 */
export function useTicketDetail(ticketId: number) {
  interface TicketDetailApiResponse {
    success: boolean;
    ticket: Omit<TicketDetail, 'messages'>;
    messages: TicketMessage[];
  }

  return useQuery<TicketDetail>({
    queryKey: ["supportTicket", ticketId],
    queryFn: async (): Promise<TicketDetail> => {
      const response = await apiRequest(ENDPOINTS.SUPPORT_TICKET_DETAIL(ticketId));
      if (!response.ok) {
        throw new Error("Failed to fetch ticket");
      }
      const data = (await response.json()) as TicketDetailApiResponse;
      // Backend returns { success: true, ticket: {...}, messages: [...] }
      // Combine into single TicketDetail object
      return {
        ...data.ticket,
        messages: data.messages || [],
      };
    },
    enabled: !!ticketId,
    staleTime: 10000, // 10 seconds - refresh often for new replies
  });
}

/**
 * Create a new support ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; ticket_id: number; message: string }, Error, CreateTicketPayload>({
    mutationFn: async (payload: CreateTicketPayload): Promise<{ success: boolean; ticket_id: number; message: string }> => {
      const response = await apiRequest(ENDPOINTS.CREATE_SUPPORT_TICKET, {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          app_version: getAppVersion(),
        }),
      });

      const data = await response.json() as { success: boolean; ticket_id: number; message: string; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create ticket");
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate tickets list to show new ticket
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });
}

/**
 * Reply to an existing ticket
 */
export function useReplyToTicket() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; reply_id: number; message: string }, Error, ReplyPayload>({
    mutationFn: async (payload: ReplyPayload): Promise<{ success: boolean; reply_id: number; message: string }> => {
      const response = await apiRequest(ENDPOINTS.REPLY_TO_TICKET(payload.ticketId), {
        method: "POST",
        body: JSON.stringify({ content: payload.content }),
      });

      const data = await response.json() as { success: boolean; reply_id: number; message: string; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send reply");
      }
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate ticket detail to show new reply
      queryClient.invalidateQueries({ queryKey: ["supportTicket", variables.ticketId] });
      // Also invalidate list to update reply count
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });
}

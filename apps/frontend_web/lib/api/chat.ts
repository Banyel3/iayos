import { API_BASE_URL } from "./config";

export type ConversationFilter = "all" | "unread" | "archived";

// API Response types
export interface JobInfo {
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
}

export interface OtherParticipant {
  profile_id: number;
  name: string;
  avatar: string | null;
  profile_type: string;
  city: string | null;
}

export interface Conversation {
  id: number;
  job: JobInfo;
  other_participant: OtherParticipant;
  my_role: "CLIENT" | "WORKER";
  last_message: string | null;
  last_message_time: string | null;
  last_message_sender_id: number | null;
  unread_count: number;
  is_archived: boolean;
  status: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  message_text: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
}

interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  total: number;
}

interface MessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  conversation: {
    id: number;
    job: JobInfo;
    other_participant: OtherParticipant;
    my_role: "CLIENT" | "WORKER";
    status: string;
  };
}

interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
}

/**
 * Fetch all conversations for the authenticated user
 * @param filter - 'all', 'unread', or 'archived'
 */
export const fetchConversations = async (
  filter: ConversationFilter = "all"
): Promise<Conversation[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/profiles/chat/conversations?filter=${filter}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: Include cookies for Django session auth
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data: ConversationsResponse = await response.json();
    console.log(
      `✅ Fetched ${filter} conversations:`,
      data.conversations.length
    );
    return data.conversations;
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    throw error;
  }
};

/**
 * Fetch all messages for a specific conversation
 * Also marks messages as read
 */
export const fetchMessages = async (
  conversationId: number
): Promise<{
  messages: ChatMessage[];
  conversation: MessagesResponse["conversation"];
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/profiles/chat/conversations/${conversationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data: MessagesResponse = await response.json();
    console.log("✅ Fetched messages:", data.messages.length);
    return {
      messages: data.messages,
      conversation: data.conversation,
    };
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    throw error;
  }
};

/**
 * Send a message in a conversation
 * Note: This is a fallback for when WebSocket is not available
 * Prefer using WebSocket for real-time messaging
 */
export const sendMessage = async (
  conversationId: number,
  messageText: string
): Promise<ChatMessage> => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        conversation_id: conversationId,
        message_text: messageText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data: SendMessageResponse = await response.json();
    console.log("✅ Message sent:", data.message);
    return data.message;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
};

/**
 * Mark messages as read in a conversation
 */
export const markMessagesAsRead = async (
  conversationId: number
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/chat/mark-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    console.log("✅ Messages marked as read");
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    throw error;
  }
};

/**
 * Toggle archive status for a conversation
 */
export const toggleConversationArchive = async (
  conversationId: number
): Promise<{ is_archived: boolean; message: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/profiles/chat/conversations/${conversationId}/toggle-archive`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Toggled archive status:", data.message);
    return {
      is_archived: data.is_archived,
      message: data.message,
    };
  } catch (error) {
    console.error("❌ Error toggling archive status:", error);
    throw error;
  }
};

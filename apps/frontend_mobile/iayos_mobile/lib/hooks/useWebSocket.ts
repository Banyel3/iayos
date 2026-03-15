// WebSocket React Hooks for Real-Time Chat
// Connect components to WebSocket service with React lifecycle management

import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import websocketService, {
  WebSocketMessage,
  ChatMessage,
  ConnectionState,
} from "../services/websocket";

const CONTACT_INFO_BLOCKED_MESSAGE =
  "For safety, sharing phone numbers or email addresses in chat is not allowed.";
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PH_PHONE_REGEX = /\b(\+63|63|0)?9\d{9}\b/;

function containsContactInfo(text: string): boolean {
  if (!text) {
    return false;
  }

  return EMAIL_REGEX.test(text) || PH_PHONE_REGEX.test(text);
}

function invalidateConversationMessageQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: number,
) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return (
        Array.isArray(key) && key[0] === "messages" && key[1] === conversationId
      );
    },
  });
}

function patchConversationJobStateFromWs(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: number,
  payload: any,
) {
  const update = payload?.data ?? payload ?? {};
  const eventType = String(update?.event || "").toLowerCase();
  const jobIdFromEvent = update?.job_id;

  queryClient.setQueriesData(
    {
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) && key[0] === "messages" && key[1] === conversationId
        );
      },
    },
    (previous: any) => {
      if (!previous?.job) {
        return previous;
      }

      if (jobIdFromEvent && Number(previous.job.id) !== Number(jobIdFromEvent)) {
        return previous;
      }

      const jobPatch: Record<string, any> = {};

      if (eventType === "worker_marked_on_the_way" || update?.worker_marked_on_the_way === true) {
        jobPatch.workerMarkedOnTheWay = true;
        if (update?.timestamp) {
          jobPatch.workerMarkedOnTheWayAt = update.timestamp;
        }
      }

      if (eventType === "worker_marked_job_started" || update?.worker_marked_job_started === true) {
        jobPatch.workerMarkedJobStarted = true;
        if (update?.timestamp) {
          jobPatch.workerMarkedJobStartedAt = update.timestamp;
        }
      }

      if (eventType === "client_confirmed_work_started" || update?.client_confirmed_work_started === true) {
        jobPatch.clientConfirmedWorkStarted = true;
        if (update?.timestamp) {
          jobPatch.clientConfirmedWorkStartedAt = update.timestamp;
        }
      }

      if (Object.keys(jobPatch).length === 0) {
        return previous;
      }

      return {
        ...previous,
        job: {
          ...previous.job,
          ...jobPatch,
        },
      };
    },
  );
}

/**
 * Hook to manage WebSocket connection state
 * Automatically connects on mount and disconnects on unmount
 */
export function useWebSocketConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketService.getConnectionState()
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect on mount
    websocketService.connect().catch((error) => {
      console.error("[useWebSocket] Connection failed:", error);
    });

    // Subscribe to connection state changes
    const unsubConnect = websocketService.onConnect(() => {
      setConnectionState("connected");
      setIsConnected(true);
    });

    const unsubDisconnect = websocketService.onDisconnect(() => {
      setConnectionState("disconnected");
      setIsConnected(false);
    });

    // Update state periodically
    const interval = setInterval(() => {
      setConnectionState(websocketService.getConnectionState());
      setIsConnected(websocketService.isConnected());
    }, 1000);

    return () => {
      unsubConnect();
      unsubDisconnect();
      clearInterval(interval);
      // Don't disconnect on unmount - keep connection alive for app lifecycle
    };
  }, []);

  const reconnect = useCallback(() => {
    websocketService.disconnect();
    setTimeout(() => {
      websocketService.connect().catch((error) => {
        console.error("[useWebSocket] Reconnect failed:", error);
      });
    }, 1000);
  }, []);

  return {
    connectionState,
    isConnected,
    reconnect,
  };
}

/**
 * Hook to send messages via WebSocket
 * Falls back to HTTP if WebSocket is not connected
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  const sendMessage = useCallback(
    async (
      conversationId: number,
      text: string,
      type: "TEXT" | "IMAGE" = "TEXT"
    ): Promise<boolean> => {
      if (type === "TEXT" && containsContactInfo(text)) {
        Alert.alert("Message blocked", CONTACT_INFO_BLOCKED_MESSAGE);
        throw new Error("CONTACT_INFO_BLOCKED");
      }

      if (!websocketService.isConnected()) {
        try {
          await websocketService.connect();
        } catch (error) {
          console.warn(
            "[useSendMessage] Failed to establish WebSocket before send, using HTTP fallback:",
            error
          );
        }
      }

      // Try WebSocket first
      const sent = websocketService.sendMessage(conversationId, text, type);

      if (sent) {
        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        invalidateConversationMessageQueries(queryClient, conversationId);
        return true;
      }

      // WebSocket failed - fall back to HTTP
      console.warn(
        "[useSendMessage] WebSocket unavailable, using HTTP fallback"
      );
      try {
        const { ENDPOINTS, apiRequest } = await import("../api/config");
        const response = await apiRequest(ENDPOINTS.SEND_MESSAGE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            message_text: text,
            message_type: type,
          }),
        });

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          invalidateConversationMessageQueries(queryClient, conversationId);
          return true;
        }

        try {
          const errorData = await response.json();
          if (errorData?.error_code === "CONTACT_INFO_BLOCKED") {
            Alert.alert(
              "Message blocked",
              errorData.error || CONTACT_INFO_BLOCKED_MESSAGE
            );
            throw new Error("CONTACT_INFO_BLOCKED");
          }
        } catch {
          // Ignore non-JSON error bodies and continue to generic error handling.
        }

        console.error(
          "[useSendMessage] HTTP fallback failed:",
          response.status
        );
        return false;
      } catch (error) {
        console.error("[useSendMessage] HTTP fallback error:", error);
        return false;
      }
    },
    [queryClient]
  );

  return { sendMessage };
}

/**
 * Hook to listen for incoming messages
 * Updates React Query cache when new messages arrive
 */
export function useMessageListener(conversationId?: number) {
  const queryClient = useQueryClient();
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);

  // Subscribe to conversation group dynamically when entering a conversation
  // This ensures real-time delivery for conversations created after the WS connection
  useEffect(() => {
    if (conversationId && websocketService.isConnected()) {
      websocketService.subscribeToConversation(conversationId);
    }

    // Also subscribe when WS reconnects
    const unsubConnect = websocketService.onConnect(() => {
      if (conversationId) {
        websocketService.subscribeToConversation(conversationId);
      }
    });

    return () => {
      if (conversationId && websocketService.isConnected()) {
        websocketService.unsubscribeFromConversation(conversationId);
      }
      unsubConnect();
    };
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = websocketService.onMessage((data: WebSocketMessage) => {
      if (data.type === "chat_message" && data.message) {
        const message = data.message as ChatMessage;
        setLatestMessage(message);

        // Update conversations list cache
        queryClient.invalidateQueries({ queryKey: ["conversations"] });

        // Update messages cache if we're in this conversation
        if (conversationId && message.conversation_id === conversationId) {
          invalidateConversationMessageQueries(queryClient, conversationId);
        }
      }

      // Handle job status updates (worker marked complete, client approved, etc.)
      // Backend broadcasts these to chat_{conv_id} groups so InboxConsumer delivers them here
      if (data.type === "job_status_update") {
        if (conversationId) {
          patchConversationJobStateFromWs(queryClient, conversationId, data);
        }
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        if (conversationId) {
          invalidateConversationMessageQueries(queryClient, conversationId);
        }
      }

      if (data.type === "message_read" && conversationId) {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        invalidateConversationMessageQueries(queryClient, conversationId);
      }

      if (
        data.type === "error" &&
        (data as any).error_code === "CONTACT_INFO_BLOCKED"
      ) {
        Alert.alert(
          "Message blocked",
          (data as any).error || CONTACT_INFO_BLOCKED_MESSAGE
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, queryClient]);

  return { latestMessage };
}

/**
 * Hook to send and receive typing indicators
 */
export function useTypingIndicator(conversationId: number) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentTimeRef = useRef<number>(0);

  // Listen for typing indicators from other users
  useEffect(() => {
    const unsubscribe = websocketService.onMessage((data: WebSocketMessage) => {
      if (
        data.type === "typing_indicator" &&
        data.conversation_id === conversationId
      ) {
        setTypingUserId(data.user_id);
        setIsTyping(data.is_typing);

        // Auto-clear typing indicator after 5 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        if (data.is_typing) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingUserId(null);
          }, 5000) as any;
        }
      }
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  // Send typing indicator (debounced to every 2 seconds)
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentTimeRef.current < 2000) {
      return; // Don't send more than once every 2 seconds
    }

    websocketService.sendTyping(conversationId);
    lastSentTimeRef.current = now;
  }, [conversationId]);

  return {
    isTyping,
    typingUserId,
    sendTyping,
  };
}

/**
 * Hook to mark messages as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  const markAsRead = useCallback(
    (messageId: number, conversationId: number) => {
      websocketService.markAsRead(messageId);

      // Update cache optimistically
      invalidateConversationMessageQueries(queryClient, conversationId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    [queryClient]
  );

  return { markAsRead };
}

/**
 * Hook to listen for user online/offline status
 */
export function useUserStatus(userId?: number) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = websocketService.onMessage((data: WebSocketMessage) => {
      if (data.type === "user_status" && data.user_id === userId) {
        setIsOnline(data.online);
        if (!data.online && data.last_seen) {
          setLastSeen(data.last_seen);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { isOnline, lastSeen };
}

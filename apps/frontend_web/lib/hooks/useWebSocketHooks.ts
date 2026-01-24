// WebSocket React Hooks for Real-Time Chat
// Connect components to WebSocket service with React lifecycle management
// Ported from React Native mobile app

import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import websocketService, {
  WebSocketMessage,
  ChatMessage,
  ConnectionState,
} from "../services/websocket";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
      // Try WebSocket first
      const sent = websocketService.sendMessage(conversationId, text, type);

      if (sent) {
        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({
          queryKey: ["messages", conversationId],
        });
        return true;
      }

      // WebSocket failed - fall back to HTTP
      console.warn(
        "[useSendMessage] WebSocket unavailable, using HTTP fallback"
      );
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/profiles/send-message`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversation_id: conversationId,
              message_text: text,
              message_type: type,
            }),
          }
        );

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({
            queryKey: ["messages", conversationId],
          });
          return true;
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

  useEffect(() => {
    const unsubscribe = websocketService.onMessage((data: WebSocketMessage) => {
      if (data.type === "chat_message" && data.message) {
        const message = data.message as ChatMessage;
        setLatestMessage(message);

        // Update conversations list cache
        queryClient.invalidateQueries({ queryKey: ["conversations"] });

        // Update messages cache if we're in this conversation
        if (conversationId && message.conversation_id === conversationId) {
          queryClient.invalidateQueries({
            queryKey: ["messages", conversationId],
          });
        }
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
        setTypingUserId(data.user_id || null);
        setIsTyping(data.is_typing || false);

        // Auto-clear typing indicator after 5 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        if (data.is_typing) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingUserId(null);
          }, 5000);
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
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    [queryClient]
  );

  return { markAsRead };
}

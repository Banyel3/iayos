import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  message: string;
  sender_id?: number;
  sender_name?: string;
  sender_avatar?: string;
  created_at?: string;
  message_id?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
  lastMessage: WebSocketMessage | null;
}

export const useWebSocket = (
  conversationId: number | null,
  onMessage: (message: WebSocketMessage) => void
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!conversationId) {
      console.log("❌ No conversation ID provided");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("✅ WebSocket already connected");
      return;
    }

    setIsConnecting(true);
    setError(null);

    // Determine the WebSocket URL based on environment
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_BACKEND_WS_URL || "localhost:8000";
    const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/`;

    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log("📨 Received message:", data);
          setLastMessage(data);
          onMessage(data);
        } catch (err) {
          console.error("❌ Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("❌ WebSocket error:", event);
        setError("WebSocket connection error");
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log(
          `🔌 WebSocket closed: Code ${event.code}, Reason: ${event.reason}`
        );
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000
          );
          console.log(
            `🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError(
            "Failed to connect after multiple attempts. Please refresh the page."
          );
        }
      };
    } catch (err) {
      console.error("❌ Error creating WebSocket:", err);
      setError("Failed to create WebSocket connection");
      setIsConnecting(false);
    }
  }, [conversationId, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      console.log("🔌 Closing WebSocket connection");
      wsRef.current.close(1000, "Component unmounted");
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket is not connected");
      setError("Cannot send message: Not connected");
      return;
    }

    try {
      const payload = {
        message,
        type: "TEXT",
      };
      console.log("📤 Sending message:", payload);
      wsRef.current.send(JSON.stringify(payload));
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setError("Failed to send message");
    }
  }, []);

  // Connect when conversationId changes
  useEffect(() => {
    if (conversationId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    lastMessage,
  };
};

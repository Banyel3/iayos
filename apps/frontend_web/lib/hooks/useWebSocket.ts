import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  message: string;
  conversation_id?: number;
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
  sendMessage: (conversationId: number, message: string) => void;
  requestMessages: (conversationId: number) => void;
  lastMessage: WebSocketMessage | null;
  retry: () => void;
}

let globalWebSocket: WebSocket | null = null;
let globalConnectionState = {
  isConnecting: false,
  isConnected: false,
  reconnectAttempts: 0,
  error: null as string | null,
};

const globalMessageListeners = new Set<(msg: WebSocketMessage) => void>();
let backgroundReconnectTimer: NodeJS.Timeout | null = null;
const stateUpdateCallbacks = new Set<
  (state: typeof globalConnectionState) => void
>();

function notifyStateChange() {
  stateUpdateCallbacks.forEach((callback) =>
    callback({ ...globalConnectionState })
  );
}

function scheduleBackgroundReconnect(attemptNum: number) {
  if (backgroundReconnectTimer) {
    clearTimeout(backgroundReconnectTimer);
  }

  const delays = [500, 2000, 5000, 10000, 30000];
  const delay = delays[Math.min(attemptNum - 1, delays.length - 1)];

  backgroundReconnectTimer = setTimeout(() => {
    if (!globalConnectionState.isConnecting) {
      connectGlobalWebSocket(attemptNum);
    }
  }, delay);
}

function connectGlobalWebSocket(attemptNum: number = 1) {
  if (globalWebSocket?.readyState === WebSocket.OPEN) {
    globalConnectionState.isConnected = true;
    globalConnectionState.isConnecting = false;
    globalConnectionState.error = null;
    notifyStateChange();
    return;
  }

  if (globalConnectionState.isConnecting) {
    return;
  }

  globalConnectionState.isConnecting = true;
  globalConnectionState.reconnectAttempts = attemptNum;
  globalConnectionState.error = null;
  notifyStateChange();

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = process.env.NEXT_PUBLIC_BACKEND_WS_URL || "localhost:8000";
  const wsUrl = `${protocol}//${host}/ws/inbox/`;

  console.log(`[WebSocket] Attempting connection to: ${wsUrl}`);
  console.log(`[WebSocket] Current cookies:`, document.cookie);

  try {
    const ws = new WebSocket(wsUrl);
    globalWebSocket = ws;

    const connectionTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
      }
    }, 5000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      console.log("[WebSocket] ✅ Connection opened successfully");
      globalConnectionState.isConnected = true;
      globalConnectionState.isConnecting = false;
      globalConnectionState.reconnectAttempts = 0;
      globalConnectionState.error = null;
      notifyStateChange();

      if (backgroundReconnectTimer) {
        clearTimeout(backgroundReconnectTimer);
        backgroundReconnectTimer = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        globalMessageListeners.forEach((listener) => listener(data));
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    ws.onerror = (event) => {
      clearTimeout(connectionTimeout);
      console.error("[WebSocket] Connection error:", event);
      console.error("[WebSocket] ReadyState:", ws.readyState);

      const errorMsg =
        attemptNum === 1
          ? "Connection error - retrying in background..."
          : "Still trying to connect...";

      if (attemptNum === 1) {
        globalConnectionState.error = errorMsg;
        notifyStateChange();
      }

      globalConnectionState.isConnecting = false;
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      console.log(
        `[WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`
      );

      globalConnectionState.isConnected = false;
      globalConnectionState.isConnecting = false;
      globalWebSocket = null;
      notifyStateChange();

      if (event.code !== 1000) {
        if (attemptNum < 10) {
          if (attemptNum === 1) {
            globalConnectionState.error =
              "Connection lost - reconnecting in background...";
            notifyStateChange();
          }
          scheduleBackgroundReconnect(attemptNum + 1);
        } else {
          globalConnectionState.error =
            "Unable to connect. Please check your connection and refresh.";
          notifyStateChange();
        }
      }
    };
  } catch (err) {
    console.error("Error creating WebSocket:", err);
    globalConnectionState.error =
      "Failed to connect - retrying in background...";
    globalConnectionState.isConnecting = false;
    notifyStateChange();

    if (attemptNum < 10) {
      scheduleBackgroundReconnect(attemptNum + 1);
    }
  }
}

function disconnectGlobalWebSocket() {
  if (backgroundReconnectTimer) {
    clearTimeout(backgroundReconnectTimer);
    backgroundReconnectTimer = null;
  }

  if (globalMessageListeners.size === 0 && globalWebSocket) {
    globalWebSocket.close(1000, "No active listeners");
    globalWebSocket = null;
    globalConnectionState.isConnected = false;
    globalConnectionState.isConnecting = false;
    globalConnectionState.reconnectAttempts = 0;
    notifyStateChange();
  }
}

export const useWebSocket = (
  conversationId: number | null,
  onMessage: (message: WebSocketMessage) => void
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(
    globalConnectionState.isConnected
  );
  const [isConnecting, setIsConnecting] = useState(
    globalConnectionState.isConnecting
  );
  const [error, setError] = useState<string | null>(
    globalConnectionState.error
  );
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  // Use refs to avoid recreating handlers
  const onMessageRef = useRef(onMessage);
  const currentConversationIdRef = useRef(conversationId);

  // Update refs when props change (doesn't trigger effects)
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    currentConversationIdRef.current = conversationId;
  }, [conversationId]);

  // Create stable message handler (doesn't change)
  const filteredMessageHandler = useCallback((msg: WebSocketMessage) => {
    // If no specific conversation ID, pass all messages (inbox handles filtering)
    if (
      !currentConversationIdRef.current ||
      msg.conversation_id === currentConversationIdRef.current
    ) {
      setLastMessage(msg);
      onMessageRef.current(msg); // Use ref instead of direct dependency
    }
  }, []); // Empty deps = stable function

  useEffect(() => {
    const stateUpdateCallback = (state: typeof globalConnectionState) => {
      setIsConnected(state.isConnected);
      setIsConnecting(state.isConnecting);
      setError(state.error);
    };

    stateUpdateCallbacks.add(stateUpdateCallback);

    return () => {
      stateUpdateCallbacks.delete(stateUpdateCallback);
    };
  }, []);

  useEffect(() => {
    // Add message listener
    globalMessageListeners.add(filteredMessageHandler);

    // Connect if not already connected (for inbox page)
    if (
      !globalConnectionState.isConnected &&
      !globalConnectionState.isConnecting
    ) {
      connectGlobalWebSocket(1);
    }

    return () => {
      // Only remove the listener, DON'T disconnect the global WebSocket
      // The connection stays open for other components/conversations
      globalMessageListeners.delete(filteredMessageHandler);
      // NOTE: disconnectGlobalWebSocket() removed - connection persists
    };
  }, [filteredMessageHandler]);

  const sendMessage = useCallback((convId: number, message: string) => {
    if (!globalWebSocket || globalWebSocket.readyState !== WebSocket.OPEN) {
      setError("Not connected - message queued");
      return;
    }

    try {
      globalWebSocket.send(
        JSON.stringify({
          conversation_id: convId,
          message,
          type: "TEXT",
        })
      );
      setError(null);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Send failed");
    }
  }, []);

  const requestMessages = useCallback((convId: number) => {
    console.log(
      `[WebSocket] 📤 Attempting to request messages for conversation ${convId}`
    );
    console.log(
      `[WebSocket] Connection state - readyState: ${globalWebSocket?.readyState}, has WS: ${!!globalWebSocket}`
    );

    if (!globalWebSocket || globalWebSocket.readyState !== WebSocket.OPEN) {
      const state = globalWebSocket?.readyState;
      const stateNames = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
      console.warn(
        `[WebSocket] ❌ Cannot send - readyState: ${stateNames[state ?? 3]} (${state})`
      );
      return;
    }

    try {
      console.log(
        `[WebSocket] � Sending get_messages request for conversation ${convId}`
      );
      globalWebSocket.send(
        JSON.stringify({
          action: "get_messages",
          conversation_id: convId,
        })
      );
      console.log(`[WebSocket] ✅ Message sent successfully`);
    } catch (err) {
      console.error("[WebSocket] ❌ Failed to send request:", err);
    }
  }, []);

  const retry = useCallback(() => {
    if (globalWebSocket) {
      globalWebSocket.close();
      globalWebSocket = null;
    }

    if (backgroundReconnectTimer) {
      clearTimeout(backgroundReconnectTimer);
      backgroundReconnectTimer = null;
    }

    globalConnectionState.reconnectAttempts = 0;
    globalConnectionState.error = null;

    connectGlobalWebSocket(1);
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    requestMessages,
    lastMessage,
    retry,
  };
};

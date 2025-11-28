// WebSocket Service for Real-Time Chat
// Manages WebSocket connection lifecycle, message sending, and event handling
// Ported from React Native mobile app

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type ChatMessage = {
  conversation_id: number;
  sender_name: string;
  sender_avatar: string | null;
  message: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  created_at: string;
  is_mine: boolean;
};

export type WebSocketMessage = {
  type: "chat_message" | "typing_indicator" | "user_status" | "error";
  message?: ChatMessage;
  conversation_id?: number;
  user_id?: number;
  user_name?: string;
  is_typing?: boolean;
  is_online?: boolean;
  error?: string;
};

type EventCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Event listeners
  private messageListeners: Set<EventCallback> = new Set();
  private connectListeners: Set<EventCallback> = new Set();
  private disconnectListeners: Set<EventCallback> = new Set();
  private errorListeners: Set<EventCallback> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      // Reconnect on page visibility change
      document.addEventListener("visibilitychange", () => {
        if (
          document.visibilityState === "visible" &&
          this.connectionState === "disconnected"
        ) {
          console.log("[WebSocket] Page visible, reconnecting...");
          this.connect();
        }
      });
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WebSocket] Already connected");
      return;
    }

    if (this.connectionState === "connecting") {
      console.log("[WebSocket] Already connecting...");
      return;
    }

    this.connectionState = "connecting";
    console.log("[WebSocket] Connecting to inbox WebSocket...");

    try {
      // Get WebSocket URL from environment or default
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = process.env.NEXT_PUBLIC_WS_HOST || "localhost:8000";
      const wsUrl = `${wsProtocol}//${wsHost}/ws/inbox/`;

      console.log("[WebSocket] Connecting to:", wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[WebSocket] ✅ Connected successfully");
        this.connectionState = "connected";
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.notifyConnectListeners();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          console.log("[WebSocket] 📩 Message received:", data);
          this.notifyMessageListeners(data);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[WebSocket] ❌ Error:", error);
        this.connectionState = "error";
        this.notifyErrorListeners({ error: "WebSocket error occurred" });
      };

      this.ws.onclose = (event) => {
        console.log("[WebSocket] 🔌 Disconnected:", event.code, event.reason);
        this.connectionState = "disconnected";
        this.stopHeartbeat();
        this.notifyDisconnectListeners();

        // Auto-reconnect with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.log("[WebSocket] Max reconnect attempts reached");
        }
      };
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error);
      this.connectionState = "error";
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    console.log("[WebSocket] Manually disconnecting...");
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.connectionState = "disconnected";
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return; // Already scheduled
    }

    this.connectionState = "reconnecting";
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(
      `[WebSocket] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send a message
   */
  sendMessage(
    conversationId: number,
    text: string,
    type: "TEXT" | "IMAGE" = "TEXT"
  ): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocket] Cannot send message - not connected");
      return false;
    }

    const payload = {
      conversation_id: conversationId,
      message: text,
      type: type,
    };

    console.log("[WebSocket] 📤 Sending message:", payload);
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: number): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      action: "typing",
      conversation_id: conversationId,
      is_typing: true,
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: number): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      action: "mark_read",
      message_id: messageId,
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Event listener methods
  onMessage(callback: EventCallback): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onConnect(callback: EventCallback): () => void {
    this.connectListeners.add(callback);
    return () => this.connectListeners.delete(callback);
  }

  onDisconnect(callback: EventCallback): () => void {
    this.disconnectListeners.add(callback);
    return () => this.disconnectListeners.delete(callback);
  }

  onError(callback: EventCallback): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  private notifyMessageListeners(data: WebSocketMessage): void {
    this.messageListeners.forEach((callback) => callback(data));
  }

  private notifyConnectListeners(): void {
    this.connectListeners.forEach((callback) => callback({}));
  }

  private notifyDisconnectListeners(): void {
    this.disconnectListeners.forEach((callback) => callback({}));
  }

  private notifyErrorListeners(error: any): void {
    this.errorListeners.forEach((callback) => callback(error));
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;

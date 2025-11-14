// WebSocket Service for Real-Time Chat
// Manages WebSocket connection with auto-reconnect and heartbeat

import { WS_BASE_URL } from "../api/config";

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

export type WebSocketMessage = {
  type: "chat_message" | "typing_indicator" | "user_status" | "mark_read";
  [key: string]: any;
};

export type ChatMessage = {
  conversation_id: number;
  sender_name: string;
  sender_avatar: string | null;
  message_text: string;
  message_type: "TEXT" | "IMAGE";
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
  message_id?: number;
};

export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<ConnectionHandler> = new Set();
  private connectionState: ConnectionState = "disconnected";
  private isIntentionalClose = false;

  constructor() {
    // Use InboxConsumer (single user-level WebSocket for ALL conversations)
    this.url = `${WS_BASE_URL}/ws/inbox/`;
  }

  // Get current connection state
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Connect to WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log("[WebSocket] Already connected");
        resolve();
        return;
      }

      if (this.ws?.readyState === WebSocket.CONNECTING) {
        console.log("[WebSocket] Connection in progress");
        return;
      }

      console.log(`[WebSocket] Connecting to ${this.url}...`);
      this.connectionState = "connecting";
      this.isIntentionalClose = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("[WebSocket] ✅ Connected successfully");
          this.connectionState = "connected";
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startHeartbeat();
          this.notifyConnectionHandlers();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("[WebSocket] 📩 Message received:", data.type);
            this.notifyMessageHandlers(data);
          } catch (error) {
            console.error("[WebSocket] ❌ Failed to parse message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[WebSocket] ❌ Error:", error);
          this.connectionState = "error";
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log(`[WebSocket] Connection closed (code: ${event.code})`);
          this.connectionState = "disconnected";
          this.stopHeartbeat();
          this.notifyDisconnectionHandlers();

          // Auto-reconnect unless intentionally closed
          if (!this.isIntentionalClose) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        console.error("[WebSocket] ❌ Failed to create WebSocket:", error);
        this.connectionState = "error";
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect() {
    console.log("[WebSocket] Disconnecting...");
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimeout();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.connectionState = "disconnected";
  }

  // Send message via WebSocket
  sendMessage(conversationId: number, text: string, type: "TEXT" | "IMAGE" = "TEXT"): boolean {
    if (!this.isConnected()) {
      console.warn("[WebSocket] ⚠️ Not connected, cannot send message");
      return false;
    }

    try {
      const payload = {
        conversation_id: conversationId,
        message: text,
        type: type,
      };

      this.ws!.send(JSON.stringify(payload));
      console.log(`[WebSocket] 📤 Message sent to conversation ${conversationId}`);
      return true;
    } catch (error) {
      console.error("[WebSocket] ❌ Failed to send message:", error);
      return false;
    }
  }

  // Send typing indicator
  sendTyping(conversationId: number) {
    if (!this.isConnected()) return;

    try {
      const payload = {
        type: "typing",
        conversation_id: conversationId,
      };

      this.ws!.send(JSON.stringify(payload));
      console.log(`[WebSocket] ⌨️ Typing indicator sent for conversation ${conversationId}`);
    } catch (error) {
      console.error("[WebSocket] ❌ Failed to send typing indicator:", error);
    }
  }

  // Mark message as read
  markAsRead(messageId: number) {
    if (!this.isConnected()) return;

    try {
      const payload = {
        type: "mark_read",
        message_id: messageId,
      };

      this.ws!.send(JSON.stringify(payload));
      console.log(`[WebSocket] ✓ Mark as read sent for message ${messageId}`);
    } catch (error) {
      console.error("[WebSocket] ❌ Failed to mark as read:", error);
    }
  }

  // Check if WebSocket is connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Register message handler
  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // Register connection handler
  onConnect(handler: ConnectionHandler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  // Register disconnection handler
  onDisconnect(handler: ConnectionHandler) {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  // Notify all message handlers
  private notifyMessageHandlers(data: any) {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error("[WebSocket] ❌ Message handler error:", error);
      }
    });
  }

  // Notify all connection handlers
  private notifyConnectionHandlers() {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        console.error("[WebSocket] ❌ Connection handler error:", error);
      }
    });
  }

  // Notify all disconnection handlers
  private notifyDisconnectionHandlers() {
    this.disconnectionHandlers.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        console.error("[WebSocket] ❌ Disconnection handler error:", error);
      }
    });
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.ws!.send(JSON.stringify({ type: "ping" }));
          console.log("[WebSocket] 💓 Heartbeat sent");
        } catch (error) {
          console.error("[WebSocket] ❌ Heartbeat failed:", error);
          this.stopHeartbeat();
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Stop heartbeat
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocket] ❌ Max reconnection attempts reached");
      this.connectionState = "error";
      return;
    }

    this.clearReconnectTimeout();

    console.log(
      `[WebSocket] 🔄 Reconnecting in ${this.reconnectDelay / 1000}s (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch((error) => {
        console.error("[WebSocket] ❌ Reconnection failed:", error);
      });
    }, this.reconnectDelay);

    // Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (max)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  // Clear reconnect timeout
  private clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;

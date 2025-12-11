// Offline Queue Manager
// Handle message queueing when offline and sync when back online

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const QUEUE_KEY = "@iayos:offline_message_queue";

export type QueuedMessage = {
  id: string; // Temporary local ID
  conversationId: number;
  text: string;
  type: "TEXT" | "IMAGE";
  imageUri?: string;
  timestamp: string;
  retryCount: number;
  status: "pending" | "sending" | "failed";
};

/**
 * Get all queued messages
 */
export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  try {
    const json = await AsyncStorage.getItem(QUEUE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("[OfflineQueue] ❌ Failed to get queued messages:", error);
    return [];
  }
}

/**
 * Add message to offline queue
 */
export async function addToQueue(
  message: Omit<QueuedMessage, "id" | "timestamp" | "retryCount" | "status">
): Promise<QueuedMessage> {
  try {
    const queue = await getQueuedMessages();
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `temp_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending",
    };

    queue.push(queuedMessage);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    console.log("[OfflineQueue] ✅ Added message to queue:", queuedMessage.id);
    return queuedMessage;
  } catch (error) {
    console.error("[OfflineQueue] ❌ Failed to add to queue:", error);
    throw error;
  }
}

/**
 * Remove message from queue
 */
export async function removeFromQueue(messageId: string): Promise<void> {
  try {
    const queue = await getQueuedMessages();
    const filtered = queue.filter((msg) => msg.id !== messageId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));

    console.log("[OfflineQueue] ✅ Removed message from queue:", messageId);
  } catch (error) {
    console.error("[OfflineQueue] ❌ Failed to remove from queue:", error);
  }
}

/**
 * Update message status in queue
 */
export async function updateQueuedMessage(
  messageId: string,
  updates: Partial<QueuedMessage>
): Promise<void> {
  try {
    const queue = await getQueuedMessages();
    const index = queue.findIndex((msg) => msg.id === messageId);

    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      console.log("[OfflineQueue] ✅ Updated message in queue:", messageId);
    }
  } catch (error) {
    console.error("[OfflineQueue] ❌ Failed to update queue:", error);
  }
}

/**
 * Get pending messages for a conversation
 */
export async function getPendingMessages(
  conversationId: number
): Promise<QueuedMessage[]> {
  const queue = await getQueuedMessages();
  return queue.filter(
    (msg) => msg.conversationId === conversationId && msg.status === "pending"
  );
}

/**
 * Clear all queued messages
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log("[OfflineQueue] ✅ Cleared all queued messages");
  } catch (error) {
    console.error("[OfflineQueue] ❌ Failed to clear queue:", error);
  }
}

/**
 * Process offline queue when back online
 */
export async function processOfflineQueue(
  sendCallback: (message: QueuedMessage) => Promise<boolean>
): Promise<void> {
  console.log("[OfflineQueue] 🔄 Processing offline queue...");

  const queue = await getQueuedMessages();
  const pendingMessages = queue.filter((msg) => msg.status === "pending");

  if (pendingMessages.length === 0) {
    console.log("[OfflineQueue] ✅ No pending messages");
    return;
  }

  console.log(
    `[OfflineQueue] 📝 Processing ${pendingMessages.length} messages...`
  );

  for (const message of pendingMessages) {
    try {
      // Update status to sending
      await updateQueuedMessage(message.id, { status: "sending" });

      // Attempt to send
      const success = await sendCallback(message);

      if (success) {
        // Remove from queue on success
        await removeFromQueue(message.id);
        console.log(`[OfflineQueue] ✅ Sent message ${message.id}`);
      } else {
        // Increment retry count and mark as failed
        const retryCount = message.retryCount + 1;
        if (retryCount >= 3) {
          await updateQueuedMessage(message.id, {
            status: "failed",
            retryCount,
          });
          console.log(
            `[OfflineQueue] ❌ Message ${message.id} failed after 3 retries`
          );
        } else {
          await updateQueuedMessage(message.id, {
            status: "pending",
            retryCount,
          });
          console.log(
            `[OfflineQueue] ⚠️ Message ${message.id} retry ${retryCount}/3`
          );
        }
      }
    } catch (error) {
      console.error(`[OfflineQueue] ❌ Error processing ${message.id}:`, error);
      await updateQueuedMessage(message.id, {
        status: "pending",
        retryCount: message.retryCount + 1,
      });
    }
  }

  console.log("[OfflineQueue] ✅ Queue processing complete");
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected === true && netInfo.isInternetReachable === true;
}

/**
 * Set up network listener to auto-process queue
 */
export function setupNetworkListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const wasOnline = state.isConnected && state.isInternetReachable;

    if (wasOnline) {
      console.log("[OfflineQueue] 🌐 Device is online");
      onOnline();
    } else {
      console.log("[OfflineQueue] ⚠️ Device is offline");
      onOffline();
    }
  });

  return unsubscribe;
}

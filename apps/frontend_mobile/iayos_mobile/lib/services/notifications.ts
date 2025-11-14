// Push Notifications Service
// Handle local and push notifications for chat messages

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type NotificationData = {
  conversationId: number;
  senderId: number;
  senderName: string;
  messagePreview: string;
  type: "chat_message" | "typing";
};

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn(
      "[Notifications] ⚠️ Must use physical device for push notifications"
    );
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Notifications] ⚠️ Permission denied");
    return false;
  }

  console.log("[Notifications] ✅ Permission granted");
  return true;
}

/**
 * Get push notification token (Expo Push Token)
 */
export async function getPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn("[Notifications] ⚠️ No project ID found");
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[Notifications] ✅ Push token:", token.data);
    return token.data;
  } catch (error) {
    console.error("[Notifications] ❌ Failed to get push token:", error);
    return null;
  }
}

/**
 * Register device token with backend
 */
export async function registerPushToken(token: string): Promise<void> {
  try {
    // TODO: Call backend API to register token
    // await api.post('/api/mobile/notifications/register', { token });
    console.log("[Notifications] 📝 Register token:", token);
  } catch (error) {
    console.error("[Notifications] ❌ Failed to register token:", error);
  }
}

/**
 * Show local notification (when app is open/backgrounded)
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data: NotificationData
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as any,
        sound: true,
        badge: 1,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("[Notifications] ❌ Failed to show notification:", error);
  }
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error("[Notifications] ❌ Failed to clear badge:", error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("[Notifications] ❌ Failed to cancel notifications:", error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationTapped: (response: Notifications.NotificationResponse) => void
) {
  // Listen for notifications when app is open
  const receivedListener = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );

  // Listen for notification taps
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(onNotificationTapped);

  // Return cleanup function
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
}

/**
 * Configure notification channels (Android only)
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("chat", {
      name: "Chat Messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#54B7EC",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("typing", {
      name: "Typing Indicators",
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0],
      enableVibrate: false,
    });
  }
}

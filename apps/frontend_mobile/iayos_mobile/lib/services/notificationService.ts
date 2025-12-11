/**
 * Notification Service for Expo Push Notifications
 * Handles push token registration, notification permissions, and notification handling
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Newer versions of Expo expect these fields as well
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

export class NotificationService {
  private static notificationListener: Notifications.Subscription | null = null;
  private static responseListener: Notifications.Subscription | null = null;

  /**
   * Request notification permissions from the user
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn("Push notifications only work on physical devices");
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Failed to get push token for push notification!");
      return false;
    }

    return true;
  }

  /**
   * Get Expo Push Token for the device
   */
  static async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn("Must use physical device for Push Notifications");
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Resolve projectId from multiple possible locations in the manifest
      // Access projectId defensively; manifest typings may not include projectId
      const expoCfg: any = Constants.expoConfig;
      const easCfg: any = Constants.easConfig;
      const projectId =
        expoCfg?.projectId ??
        expoCfg?.extra?.eas?.projectId ??
        easCfg?.projectId;

      if (!projectId) {
        console.warn(
          "No Expo projectId found in manifest. Skipping push token request."
        );
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });

      console.log("Expo Push Token:", token.data);
      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  /**
   * Configure notification channels for Android
   */
  static async configureNotificationChannels() {
    if (Platform.OS === "android") {
      // Default channel
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#007AFF",
        sound: "notification.wav",
      });

      // Job updates channel
      await Notifications.setNotificationChannelAsync("job-updates", {
        name: "Job Updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#007AFF",
        sound: "notification.wav",
        description:
          "Notifications for job applications, status changes, and completions",
      });

      // Messages channel
      await Notifications.setNotificationChannelAsync("messages", {
        name: "Messages",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#007AFF",
        sound: "notification.wav",
        description: "New messages from clients and workers",
      });

      // Payments channel
      await Notifications.setNotificationChannelAsync("payments", {
        name: "Payments",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4CAF50",
        sound: "notification.wav",
        description: "Payment confirmations and updates",
      });

      // Reviews channel
      await Notifications.setNotificationChannelAsync("reviews", {
        name: "Reviews",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FFC107",
        sound: "notification.wav",
        description: "New reviews and ratings",
      });

      // KYC channel
      await Notifications.setNotificationChannelAsync("kyc", {
        name: "KYC Verification",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#9C27B0",
        sound: "notification.wav",
        description: "KYC verification status updates",
      });
    }
  }

  /**
   * Add notification received listener
   */
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  static addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Schedule a local notification (for testing)
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    channelId: string = "default"
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "notification.wav",
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Get notification channel for a notification type
   */
  static getChannelForNotificationType(type: string): string {
    const typeMap: Record<string, string> = {
      // KYC
      KYC_APPROVED: "kyc",
      KYC_REJECTED: "kyc",
      AGENCY_KYC_APPROVED: "kyc",
      AGENCY_KYC_REJECTED: "kyc",

      // Job Applications
      APPLICATION_RECEIVED: "job-updates",
      APPLICATION_ACCEPTED: "job-updates",
      APPLICATION_REJECTED: "job-updates",

      // Job Status
      JOB_STARTED: "job-updates",
      JOB_COMPLETED_WORKER: "job-updates",
      JOB_COMPLETED_CLIENT: "job-updates",
      JOB_CANCELLED: "job-updates",

      // Payments
      PAYMENT_RECEIVED: "payments",
      ESCROW_PAID: "payments",
      REMAINING_PAYMENT_PAID: "payments",
      PAYMENT_RELEASED: "payments",

      // Messages
      MESSAGE: "messages",

      // Reviews
      REVIEW_RECEIVED: "reviews",
    };

    return typeMap[type] || "default";
  }

  /**
   * Set badge count (iOS)
   */
  static async setBadgeCount(count: number) {
    if (Platform.OS === "ios") {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
    await this.setBadgeCount(0);
  }

  /**
   * Cancel a specific notification
   */
  static async cancelNotification(notificationId: string) {
    await Notifications.dismissNotificationAsync(notificationId);
  }

  /**
   * Initialize notification service
   */
  static async initialize() {
    try {
      await this.configureNotificationChannels();
      const token = await this.getExpoPushToken();
      return token;
    } catch (error) {
      console.error("Error initializing notification service:", error);
      return null;
    }
  }

  /**
   * Cleanup notification listeners
   */
  static cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }
}

export default NotificationService;

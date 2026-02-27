/**
 * Notification Service for Expo Push Notifications
 * Handles push token registration, notification permissions, and notification handling
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// ---------------------------------------------------------------------------
// Module-level cached notification settings
// Updated by NotificationService.updateCachedSettings / applyNotificationSettings
// so the foreground handler can check them without any async calls.
// ---------------------------------------------------------------------------
export interface CachedNotificationSettings {
  pushEnabled: boolean;
  soundEnabled: boolean;
  jobUpdates: boolean;
  messages: boolean;
  payments: boolean;
  reviews: boolean;
  kycUpdates: boolean;
  doNotDisturbStart: string | null;
  doNotDisturbEnd: string | null;
}

let _cachedSettings: CachedNotificationSettings | null = null;

/** Returns true when the current local time falls within the DND window. */
function _isInDndWindow(s: CachedNotificationSettings): boolean {
  if (!s.doNotDisturbStart || !s.doNotDisturbEnd) return false;
  const now = new Date();
  const current = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  const { doNotDisturbStart: start, doNotDisturbEnd: end } = s;
  // Same-day window (08:00–22:00) or overnight window (22:00–08:00)
  return start <= end
    ? current >= start && current < end
    : current >= start || current < end;
}

// Configure how notifications are handled when app is in foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      if (_cachedSettings) {
        // Honour the global push-enabled toggle
        if (!_cachedSettings.pushEnabled) {
          return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
        }
        // Honour Do Not Disturb schedule
        if (_isInDndWindow(_cachedSettings)) {
          return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
        }
      }
      return {
        shouldShowAlert: true,
        shouldPlaySound: _cachedSettings?.soundEnabled !== false,
        shouldSetBadge: true,
      };
    },
  });
} catch (error) {
  console.warn("[Notifications] Failed to set notification handler:", error);
}

export interface NotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

export class NotificationService {
  private static notificationListener: Notifications.Subscription | null = null;
  private static responseListener: Notifications.Subscription | null = null;

  /**
   * Default Android channel configurations.
   * Stored here so applyNotificationSettings can restore them when re-enabling a category.
   */
  private static readonly defaultChannelConfigs: Record<
    string,
    Notifications.NotificationChannelInput
  > = {
    default: {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#007AFF",
    },
    "job-updates": {
      name: "Job Updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#007AFF",
      description:
        "Notifications for job applications, status changes, and completions",
    },
    messages: {
      name: "Messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#007AFF",
      description: "New messages from clients and workers",
    },
    payments: {
      name: "Payments",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4CAF50",
      description: "Payment confirmations and updates",
    },
    reviews: {
      name: "Reviews",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FFC107",
      description: "New reviews and ratings",
    },
    kyc: {
      name: "KYC Verification",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#9C27B0",
      description: "KYC verification status updates",
    },
  };

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
   * Cache the user's notification settings so the foreground handler and DND
   * check can read them synchronously without extra async calls.
   */
  static updateCachedSettings(settings: CachedNotificationSettings): void {
    _cachedSettings = settings;
  }

  /**
   * Apply notification settings to Android notification channels.
   *
   * Android does not let apps lower a channel's importance once the user has
   * interacted with it.  The only reliable workaround is to delete the channel
   * and recreate it with the desired importance.  This resets any per-channel
   * customisations the user may have made in system settings, but it is the
   * only way to programmatically honour in-app preferences.
   *
   * On iOS this is a no-op; the OS controls notification delivery.
   */
  static async applyNotificationSettings(settings: {
    pushEnabled: boolean;
    soundEnabled: boolean;
    jobUpdates: boolean;
    messages: boolean;
    payments: boolean;
    reviews: boolean;
    kycUpdates: boolean;
    doNotDisturbStart?: string | null;
    doNotDisturbEnd?: string | null;
  }): Promise<void> {
    // Keep the in-memory cache in sync so the foreground handler is up-to-date.
    _cachedSettings = {
      pushEnabled: settings.pushEnabled,
      soundEnabled: settings.soundEnabled,
      jobUpdates: settings.jobUpdates,
      messages: settings.messages,
      payments: settings.payments,
      reviews: settings.reviews,
      kycUpdates: settings.kycUpdates,
      doNotDisturbStart:
        settings.doNotDisturbStart !== undefined
          ? settings.doNotDisturbStart
          : (_cachedSettings?.doNotDisturbStart ?? null),
      doNotDisturbEnd:
        settings.doNotDisturbEnd !== undefined
          ? settings.doNotDisturbEnd
          : (_cachedSettings?.doNotDisturbEnd ?? null),
    };

    if (Platform.OS !== "android") return;

    const channelSettings: Array<{ channelId: string; enabled: boolean }> = [
      { channelId: "default",     enabled: settings.pushEnabled },
      { channelId: "job-updates", enabled: settings.pushEnabled && settings.jobUpdates },
      { channelId: "messages",    enabled: settings.pushEnabled && settings.messages },
      { channelId: "payments",    enabled: settings.pushEnabled && settings.payments },
      { channelId: "reviews",     enabled: settings.pushEnabled && settings.reviews },
      { channelId: "kyc",         enabled: settings.pushEnabled && settings.kycUpdates },
    ];

    for (const { channelId, enabled } of channelSettings) {
      try {
        // Delete first so we can change the importance level.
        await Notifications.deleteNotificationChannelAsync(channelId);

        const base =
          this.defaultChannelConfigs[channelId] ??
          ({ name: channelId, importance: Notifications.AndroidImportance.DEFAULT } as Notifications.NotificationChannelInput);

        if (enabled) {
          await Notifications.setNotificationChannelAsync(channelId, {
            ...base,
            sound: settings.soundEnabled ? "notification.wav" : undefined,
            vibrationPattern: settings.soundEnabled
              ? (base.vibrationPattern ?? [0, 250, 250, 250])
              : [0],
            enableVibrate: settings.soundEnabled,
          });
        } else {
          // Recreate as a silent/hidden channel so push payloads targeting it
          // are still received by the OS but never shown to the user.
          await Notifications.setNotificationChannelAsync(channelId, {
            name: typeof base.name === "string" ? base.name : channelId,
            importance: Notifications.AndroidImportance.NONE,
          });
        }
      } catch (err) {
        console.warn(
          `[NotificationService] Could not update channel "${channelId}":`,
          err,
        );
      }
    }
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

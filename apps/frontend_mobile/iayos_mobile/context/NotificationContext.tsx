/**
 * Notification Context
 * Handles push notification initialization, listeners, and badge updates
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import NotificationService from "@/lib/services/notificationService";
import {
  useRegisterPushToken,
  useUnreadNotificationsCount,
} from "@/lib/hooks/useNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleNotificationDeepLink } from "@/lib/utils/deepLinkHandler";

interface NotificationContextType {
  expoPushToken: string | null;
  unreadCount: number;
  registerForPushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
  unreadCount: 0,
  registerForPushNotifications: async () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  const registerPushTokenMutation = useRegisterPushToken();
  const queryClient = useQueryClient();

  // Get unread count
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  // Update badge count whenever unread count changes
  useEffect(() => {
    NotificationService.setBadgeCount(unreadCount);
  }, [unreadCount]);

  // Register for push notifications
  const registerForPushNotifications = async () => {
    try {
      const token = await NotificationService.initialize();
      if (token) {
        setExpoPushToken(token);

        // Register token with backend
        // Only attempt backend registration if user is authenticated
        const accessToken = await AsyncStorage.getItem("access_token");
        if (!accessToken) {
          console.warn(
            "Skipping backend push token registration: user not authenticated"
          );
          return;
        }

        const deviceType = Platform.OS === "ios" ? "ios" : "android";
        registerPushTokenMutation.mutate(token, {
          onSuccess: () => {
            console.log("✅ Push token registered with backend");
          },
          onError: (error: any) => {
            // Log more detail when available
            try {
              console.error(
                "❌ Failed to register push token:",
                error?.message || error
              );
            } catch (e) {
              console.error("❌ Failed to register push token (unknown error)");
            }
          },
        });
      }
    } catch (error) {
      console.error("Error registering for push notifications:", error);
    }
  };

  // Initialize notifications on mount
  useEffect(() => {
    registerForPushNotifications();

    // Notification received listener (when app is in foreground)
    notificationListener.current =
      NotificationService.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification received in foreground:", notification);

        // Invalidate notifications query to refetch
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["unreadNotificationsCount"],
        });

        // Update badge count
        queryClient.invalidateQueries({
          queryKey: ["unreadNotificationsCount"],
        });
      });

    // Notification tapped listener (when user taps notification)
    responseListener.current =
      NotificationService.addNotificationResponseReceivedListener(
        (response) => {
          console.log("👆 Notification tapped:", response);

          const notificationData = response.notification.request.content.data;

          // Handle deep linking based on notification data
          if (notificationData) {
            try {
              // Parse notification data
              const notification = {
                notificationID: Number(notificationData.notificationID) || 0,
                notificationType: String(notificationData.notificationType) || "",
                title: String(notificationData.title) || "",
                message: String(notificationData.message) || "",
                isRead: false,
                createdAt: new Date().toISOString(),
                readAt: null,
                relatedJobID: notificationData.relatedJobID ? Number(notificationData.relatedJobID) : null,
                relatedApplicationID: notificationData.relatedApplicationID ? Number(notificationData.relatedApplicationID) : null,
                relatedKYCLogID: notificationData.relatedKYCLogID ? Number(notificationData.relatedKYCLogID) : null,
              };

              // Navigate to appropriate screen
              handleNotificationDeepLink(notification);
            } catch (error) {
              console.error("Error handling notification tap:", error);
              router.push("/notifications" as any);
            }
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({
            queryKey: ["unreadNotificationsCount"],
          });
        }
      );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const value: NotificationContextType = {
    expoPushToken,
    unreadCount,
    registerForPushNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

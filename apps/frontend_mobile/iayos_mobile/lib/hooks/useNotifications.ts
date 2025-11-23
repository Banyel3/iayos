/**
 * useNotifications Hook
 * Manages notification fetching, marking as read, and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS, apiRequest } from "../api/config";

export interface Notification {
  notificationID: number;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  relatedJobID: number | null;
  relatedApplicationID: number | null;
  relatedKYCLogID: number | null;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  jobUpdates: boolean;
  messages: boolean;
  payments: boolean;
  reviews: boolean;
  kycUpdates: boolean;
  soundEnabled: boolean;
  doNotDisturbStart: string | null;
  doNotDisturbEnd: string | null;
}

/**
 * Fetch all notifications
 */
export const useNotifications = (limit = 50, unreadOnly = false) => {
  return useQuery({
    queryKey: ["notifications", limit, unreadOnly],
    queryFn: async () => {
      const url = `${ENDPOINTS.NOTIFICATIONS}?limit=${limit}&unread_only=${unreadOnly}`;
      const response = await apiRequest(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch notifications");
      }

      const data = await response.json();
      return data.notifications as Notification[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

/**
 * Fetch unread notification count
 */
export const useUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: ["unreadNotificationsCount"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.UNREAD_NOTIFICATIONS_COUNT, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch unread count");
      }

      const data = await response.json();
      return data.unread_count as number;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 5000,
  });
};

/**
 * Mark a notification as read
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest(
        ENDPOINTS.MARK_NOTIFICATION_READ(notificationId),
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to mark notification as read"
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to mark all notifications as read"
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
    },
  });
};

/**
 * Register push notification token
 */
export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: async (pushToken: string) => {
      const response = await apiRequest(ENDPOINTS.REGISTER_PUSH_TOKEN, {
        method: "POST",
        body: JSON.stringify({ pushToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register push token");
      }

      return await response.json();
    },
  });
};

/**
 * Get notification settings
 */
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: ["notificationSettings"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.GET_NOTIFICATION_SETTINGS, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch notification settings"
        );
      }

      const data = await response.json();
      return data.settings as NotificationSettings;
    },
  });
};

/**
 * Update notification settings
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const response = await apiRequest(
        ENDPOINTS.UPDATE_NOTIFICATION_SETTINGS,
        {
          method: "PUT",
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update notification settings"
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationSettings"] });
    },
  });
};

/**
 * Delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest(
        ENDPOINTS.DELETE_NOTIFICATION(notificationId),
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete notification");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
    },
  });
};

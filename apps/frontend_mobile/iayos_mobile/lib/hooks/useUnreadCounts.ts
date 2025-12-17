import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ["unread-messages"],
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (!token) {
          return 0;
        }
        const response = await apiRequest(
          `${ENDPOINTS.CONVERSATIONS}?unread=true`,
          {
            timeout: 10000,
          }
        );

        if (!response.ok) {
          return 0;
        }

        const data = await response.json();
        // Count conversations with unread messages
        return (
          data.results?.filter((conv: any) => conv.unreadCount > 0).length || 0
        );
      } catch (error) {
        console.error("Failed to fetch unread message count:", error);
        return 0;
      }
    },
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 20000,
    retry: 1,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["unread-notifications"],
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (!token) {
          return 0;
        }
        const response = await apiRequest(
          ENDPOINTS.UNREAD_NOTIFICATIONS_COUNT,
          {
            timeout: 10000,
          }
        );

        if (!response.ok) {
          return 0;
        }

        const data = await response.json();
        return data.count || 0;
      } catch (error) {
        console.error("Failed to fetch unread notification count:", error);
        return 0;
      }
    },
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 20000,
    retry: 1,
  });
}

// Combined hook for convenience
export function useUnreadCounts() {
  const { data: messageCount = 0 } = useUnreadMessageCount();
  const { data: notificationCount = 0 } = useUnreadNotificationCount();

  return {
    messages: messageCount,
    notifications: notificationCount,
    total: messageCount + notificationCount,
  };
}

import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/utils/tokenStorage";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ["unread-messages"],
    queryFn: async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          return 0;
        }
        const response = await apiRequest(
          `${ENDPOINTS.CONVERSATIONS}?filter=unread`,
          {
            timeout: 120000, // 2 minute timeout (increased for slow networks)
          }
        );

        if (!response.ok) {
          return 0;
        }

        const data: any = await response.json();
        if (Array.isArray(data)) {
          return data.filter(
            (conv: any) =>
              Number(conv?.unread_count ?? conv?.unreadCount ?? 0) > 0
          ).length;
        }

        if (Array.isArray(data?.results)) {
          return data.results.filter(
            (conv: any) =>
              Number(conv?.unread_count ?? conv?.unreadCount ?? 0) > 0
          ).length;
        }

        return 0;
      } catch (error) {
        if (__DEV__) {
          console.warn("Failed to fetch unread message count:", error);
        }
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
        const token = await getAccessToken();
        if (!token) {
          return 0;
        }
        const response = await apiRequest(
          ENDPOINTS.UNREAD_NOTIFICATIONS_COUNT,
          {
            timeout: 120000, // 2 minute timeout (increased for slow networks)
          }
        );

        if (!response.ok) {
          return 0;
        }

        const data: any = await response.json();
        return Number(data?.unread_count ?? data?.count ?? data?.unreadCount ?? 0);
      } catch (error) {
        if (__DEV__) {
          console.warn("Failed to fetch unread notification count:", error);
        }
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

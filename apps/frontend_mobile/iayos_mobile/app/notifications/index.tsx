/**
 * Notifications Screen
 * Displays list of all notifications with filtering and actions
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Appbar,
  FAB,
  Portal,
  Dialog,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Colors, Typography, Spacing } from "@/constants/theme";

import NotificationCard from "@/components/Notifications/NotificationCard";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  Notification,
} from "@/lib/hooks/useNotifications";

export default function NotificationsScreen() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  // Fetch notifications based on filter
  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useNotifications(50, filter === "unread");

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // Handle notification tap - navigate to related screen
  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Mark as read if unread
      if (!notification.isRead) {
        markReadMutation.mutate(notification.notificationID);
      }

      // Navigate based on notification type and related entities
      if (notification.relatedJobID) {
        router.push(`/jobs/${notification.relatedJobID}` as any);
      } else if (notification.relatedApplicationID) {
        router.push(
          `/applications/${notification.relatedApplicationID}` as any
        );
      } else if (notification.notificationType === "MESSAGE") {
        router.push("/messages" as any);
      } else if (
        notification.notificationType?.includes("KYC") ||
        notification.notificationType?.includes("AGENCY_KYC")
      ) {
        router.push("/profile/kyc" as any);
      } else if (notification.notificationType?.includes("PAYMENT")) {
        router.push("/payments/history" as any);
      } else if (notification.notificationType?.includes("REVIEW")) {
        router.push("/profile/reviews" as any);
      }
    },
    [markReadMutation]
  );

  // Mark single notification as read
  const handleMarkRead = useCallback(
    (notificationId: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      markReadMutation.mutate(notificationId, {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Marked as read",
          });
        },
      });
    },
    [markReadMutation]
  );

  // Delete single notification
  const handleDelete = useCallback(
    (notificationId: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      deleteNotificationMutation.mutate(notificationId, {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Notification deleted",
          });
        },
      });
    },
    [deleteNotificationMutation]
  );

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "All notifications marked as read",
        });
      },
    });
  }, [markAllReadMutation]);

  // Render notification item
  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationCard
        notification={item}
        onPress={() => handleNotificationPress(item)}
        onMarkRead={
          !item.isRead ? () => handleMarkRead(item.notificationID) : undefined
        }
        onDelete={() => handleDelete(item.notificationID)}
      />
    ),
    [handleNotificationPress, handleMarkRead, handleDelete]
  );

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {filter === "unread"
          ? "No unread notifications"
          : "No notifications yet"}
      </Text>
      <Text style={styles.emptySubtext}>
        {filter === "unread"
          ? "All caught up!"
          : "You'll see notifications here when you have updates"}
      </Text>
    </View>
  );

  // Error state
  if (isError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Appbar.BackAction
              onPress={() => router.back()}
              color={Colors.textPrimary}
            />
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={{ width: 48 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load notifications</Text>
            <Text style={styles.errorSubtext}>{error?.message}</Text>
            <Button
              mode="contained"
              onPress={() => refetch()}
              buttonColor={Colors.primary}
            >
              Retry
            </Button>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Appbar.BackAction
            onPress={() => router.back()}
            color={Colors.textPrimary}
          />
          <Text style={styles.headerTitle}>Notifications</Text>
          <Appbar.Action
            icon="cog-outline"
            color={Colors.textPrimary}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/notifications/settings" as any);
            }}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              filter === "all" && styles.tabButtonActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.tabButtonText,
                filter === "all" && styles.tabButtonTextActive,
              ]}
            >
              All ({notifications?.length || 0})
            </Text>
            {filter === "all" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              filter === "unread" && styles.tabButtonActive,
            ]}
            onPress={() => setFilter("unread")}
          >
            <Text
              style={[
                styles.tabButtonText,
                filter === "unread" && styles.tabButtonTextActive,
              ]}
            >
              Unread ({unreadCount})
            </Text>
            {filter === "unread" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.notificationID.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        )}

        {/* Mark All Read FAB */}
        {unreadCount > 0 && (
          <FAB
            icon="check-all"
            label="Mark all read"
            style={styles.fab}
            color={Colors.white}
            onPress={handleMarkAllRead}
            loading={markAllReadMutation.isPending}
          />
        )}

        {/* Delete All Dialog */}
        <Portal>
          <Dialog
            visible={showDeleteAllDialog}
            onDismiss={() => setShowDeleteAllDialog(false)}
          >
            <Dialog.Title>Delete All Notifications?</Dialog.Title>
            <Dialog.Content>
              <Text>
                This will permanently delete all notifications. This action
                cannot be undone.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteAllDialog(false)}>
                Cancel
              </Button>
              <Button
                textColor={Colors.error}
                onPress={() => {
                  // Implement delete all functionality if needed
                  setShowDeleteAllDialog(false);
                }}
              >
                Delete All
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    // Active state - no additional styling needed, text color handles it
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: `${Colors.primary}99`, // 60% opacity (99 in hex = 60%)
  },
  tabButtonTextActive: {
    color: Colors.primary, // Full blue
  },
  tabIndicator: {
    position: "absolute",
    bottom: -Spacing.md,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 16,
    color: Colors.textSecondary,
    ...Typography.body,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.error,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  fab: {
    position: "absolute",
    margin: Spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});

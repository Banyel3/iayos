/**
 * Notifications Screen
 * Displays list of all notifications with filtering and actions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Text,
  Appbar,
  SegmentedButtons,
  FAB,
  Portal,
  Dialog,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import NotificationCard from '@/components/Notifications/NotificationCard';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  Notification,
} from '@/lib/hooks/useNotifications';

export default function NotificationsScreen() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  // Fetch notifications based on filter
  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useNotifications(50, filter === 'unread');

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // Handle notification tap - navigate to related screen
  const handleNotificationPress = useCallback((notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read if unread
    if (!notification.isRead) {
      markReadMutation.mutate(notification.notificationID);
    }

    // Navigate based on notification type and related entities
    if (notification.relatedJobID) {
      router.push(`/jobs/${notification.relatedJobID}` as any);
    } else if (notification.relatedApplicationID) {
      router.push(`/applications/${notification.relatedApplicationID}` as any);
    } else if (notification.notificationType === 'MESSAGE') {
      router.push('/messages' as any);
    } else if (
      notification.notificationType.includes('KYC') ||
      notification.notificationType.includes('AGENCY_KYC')
    ) {
      router.push('/profile/kyc' as any);
    } else if (notification.notificationType.includes('PAYMENT')) {
      router.push('/payments/history' as any);
    } else if (notification.notificationType.includes('REVIEW')) {
      router.push('/profile/reviews' as any);
    }
  }, [markReadMutation]);

  // Mark single notification as read
  const handleMarkRead = useCallback((notificationId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markReadMutation.mutate(notificationId, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'Marked as read',
        });
      },
    });
  }, [markReadMutation]);

  // Delete single notification
  const handleDelete = useCallback((notificationId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteNotificationMutation.mutate(notificationId, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'Notification deleted',
        });
      },
    });
  }, [deleteNotificationMutation]);

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'All notifications marked as read',
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
        {filter === 'unread'
          ? 'No unread notifications'
          : 'No notifications yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {filter === 'unread'
          ? 'All caught up!'
          : "You'll see notifications here when you have updates"}
      </Text>
    </View>
  );

  // Error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Notifications" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load notifications</Text>
          <Text style={styles.errorSubtext}>{error?.message}</Text>
          <Button mode="contained" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const unreadCount =
    notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Notifications" />
        <Appbar.Action
          icon="cog-outline"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/notifications/settings' as any);
          }}
        />
      </Appbar.Header>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as 'all' | 'unread')}
          buttons={[
            {
              value: 'all',
              label: `All (${notifications?.length || 0})`,
            },
            {
              value: 'unread',
              label: `Unread (${unreadCount})`,
            },
          ]}
        />
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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
              colors={['#007AFF']}
              tintColor="#007AFF"
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
              This will permanently delete all notifications. This action cannot be
              undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteAllDialog(false)}>Cancel</Button>
            <Button
              textColor="#F44336"
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
});

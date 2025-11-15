/**
 * NotificationCard Component
 * Displays a single notification with icon, title, message, and timestamp
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Card, Text, IconButton, Badge } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/lib/hooks/useNotifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
  onMarkRead?: () => void;
  onDelete?: () => void;
}

// Icon mapping for notification types
const getNotificationIcon = (type: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    // KYC
    KYC_APPROVED: 'check-circle',
    KYC_REJECTED: 'close-circle',
    AGENCY_KYC_APPROVED: 'check-circle',
    AGENCY_KYC_REJECTED: 'close-circle',

    // Job Applications
    APPLICATION_RECEIVED: 'briefcase-clock',
    APPLICATION_ACCEPTED: 'briefcase-check',
    APPLICATION_REJECTED: 'briefcase-remove',

    // Job Status
    JOB_STARTED: 'play-circle',
    JOB_COMPLETED_WORKER: 'check-circle-outline',
    JOB_COMPLETED_CLIENT: 'check-all',
    JOB_CANCELLED: 'cancel',

    // Payments
    PAYMENT_RECEIVED: 'cash-check',
    ESCROW_PAID: 'cash-lock',
    REMAINING_PAYMENT_PAID: 'cash-100',
    PAYMENT_RELEASED: 'cash-refund',

    // Messages
    MESSAGE: 'message-text',

    // Reviews
    REVIEW_RECEIVED: 'star',

    // System
    SYSTEM: 'bell',
  };

  return iconMap[type] || 'bell';
};

// Color mapping for notification types
const getNotificationColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    // KYC
    KYC_APPROVED: '#4CAF50',
    KYC_REJECTED: '#F44336',
    AGENCY_KYC_APPROVED: '#4CAF50',
    AGENCY_KYC_REJECTED: '#F44336',

    // Job Applications
    APPLICATION_RECEIVED: '#2196F3',
    APPLICATION_ACCEPTED: '#4CAF50',
    APPLICATION_REJECTED: '#F44336',

    // Job Status
    JOB_STARTED: '#2196F3',
    JOB_COMPLETED_WORKER: '#FFC107',
    JOB_COMPLETED_CLIENT: '#4CAF50',
    JOB_CANCELLED: '#9E9E9E',

    // Payments
    PAYMENT_RECEIVED: '#4CAF50',
    ESCROW_PAID: '#9C27B0',
    REMAINING_PAYMENT_PAID: '#4CAF50',
    PAYMENT_RELEASED: '#4CAF50',

    // Messages
    MESSAGE: '#2196F3',

    // Reviews
    REVIEW_RECEIVED: '#FFC107',

    // System
    SYSTEM: '#607D8B',
  };

  return colorMap[type] || '#607D8B';
};

export default function NotificationCard({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const icon = getNotificationIcon(notification.notificationType);
  const color = getNotificationColor(notification.notificationType);

  const relativeTime = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Card
        style={[
          styles.card,
          !notification.isRead && styles.unreadCard,
        ]}
        mode="outlined"
      >
        <View style={styles.content}>
          {/* Icon Section */}
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={color}
            />
          </View>

          {/* Content Section */}
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  !notification.isRead && styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {!notification.isRead && (
                <Badge size={8} style={styles.unreadBadge} />
              )}
            </View>

            <Text style={styles.message} numberOfLines={2}>
              {notification.message}
            </Text>

            <Text style={styles.timestamp}>{relativeTime}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!notification.isRead && onMarkRead && (
              <IconButton
                icon="check"
                size={20}
                iconColor="#4CAF50"
                onPress={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete-outline"
                size={20}
                iconColor="#F44336"
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    marginLeft: 6,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
});

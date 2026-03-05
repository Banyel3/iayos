import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/lib/hooks/useNotifications';
import { Colors } from '@/constants/theme';

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
  onMarkRead?: () => void;
  onDelete?: () => void;
}

export default function NotificationCard({
  notification,
  onPress,
}: NotificationCardProps) {
  const relativeTime = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const isRead = notification.isRead;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        !isRead && styles.unreadContainer
      ]}
    >
      {!isRead && (
        <View style={styles.indicatorContainer}>
          <View style={styles.unreadDot} />
        </View>
      )}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              isRead ? styles.readText : styles.unreadText,
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
        </View>

        <Text
          style={[
            styles.message,
            isRead ? styles.readText : styles.unreadText,
            { marginTop: 4 }
          ]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>

        <Text style={[
          styles.timestamp,
          isRead ? styles.readText : styles.unreadText,
          { opacity: 0.6, marginTop: 6 }
        ]}>
          {relativeTime}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Card styling
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  unreadContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#00BAF133', // Subtle blue border for unread
  },
  indicatorContainer: {
    marginTop: 6, // Align with title text
    paddingRight: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00BAF1',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  unreadText: {
    color: '#000000',
    fontWeight: '700',
  },
  readText: {
    color: '#666',
    fontWeight: '400',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
  },
});

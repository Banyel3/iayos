import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/lib/hooks/useNotifications';

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
        <View style={styles.unreadDot} />
      )}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              isRead ? styles.readText : styles.unreadTitleText,
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
        </View>

        <Text 
          style={[
            styles.message,
            isRead ? styles.readText : styles.unreadMessageText,
            { marginTop: 4 }
          ]} 
          numberOfLines={2}
        >
          {notification.message}
        </Text>

        <Text style={[
          styles.timestamp, 
          { marginTop: 6 }
        ]}>
          {relativeTime}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
  },
  unreadContainer: {
    backgroundColor: '#FAFAFA',
    paddingLeft: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00BAF1',
    marginRight: 12,
    marginTop: 6,
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
  unreadTitleText: {
    color: '#000000',
    fontWeight: '600',
  },
  unreadMessageText: {
    color: '#000000',
    fontWeight: '400',
  },
  readText: {
    color: '#8A8A8E',
    fontWeight: '400',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#8A8A8E',
    fontWeight: '400',
  },
});

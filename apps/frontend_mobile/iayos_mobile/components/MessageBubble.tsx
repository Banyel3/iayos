// MessageBubble Component
// Displays a single message in the chat interface

import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow, format, isSameDay } from "date-fns";
import { Message } from "../lib/hooks/useMessages";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";

type MessageBubbleProps = {
  message: Message;
  showTimestamp?: boolean;
  onImagePress?: () => void;
};

export default function MessageBubble({
  message,
  showTimestamp = false,
  onImagePress,
}: MessageBubbleProps) {
  const isMine = message.is_mine;
  const isImage = message.message_type === "IMAGE";

  // Format timestamp
  const messageDate = new Date(message.created_at);
  const timeString = format(messageDate, "HH:mm");
  const relativeTime = formatDistanceToNow(messageDate, { addSuffix: true });

  return (
    <View style={[styles.container, isMine && styles.containerMine]}>
      {/* Avatar (only for received messages) */}
      {!isMine && (
        <Image
          source={{ uri: message.sender_avatar }}
          style={styles.avatar}
        />
      )}

      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {/* Sender Name (only for received messages) */}
        {!isMine && (
          <Text style={styles.senderName}>{message.sender_name}</Text>
        )}

        {/* Image Message */}
        {isImage ? (
          <TouchableOpacity onPress={onImagePress} activeOpacity={0.8}>
            <Image
              source={{ uri: message.message_text }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          /* Text Message */
          <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
            {message.message_text}
          </Text>
        )}

        {/* Time + Read Receipt */}
        <View style={styles.metaRow}>
          <Text style={[styles.time, isMine && styles.timeMine]}>
            {showTimestamp ? relativeTime : timeString}
          </Text>
          {isMine && (
            <Ionicons
              name={message.is_read ? "checkmark-done" : "checkmark"}
              size={14}
              color={message.is_read ? Colors.primary : Colors.white}
              style={styles.readReceipt}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  containerMine: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    ...Typography.body.small,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  messageText: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  messageTextMine: {
    color: Colors.white,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  time: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  timeMine: {
    color: Colors.white,
    opacity: 0.8,
  },
  readReceipt: {
    marginLeft: 2,
  },
});

// ConversationCard Component
// Displays a single conversation item in the list

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { router } from "expo-router";
import { Conversation } from "../lib/hooks/useConversations";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";

type ConversationCardProps = {
  conversation: Conversation;
};

export default function ConversationCard({
  conversation,
}: ConversationCardProps) {
  const handlePress = () => {
    router.push(`/messages/${conversation.id}`);
  };

  // Format timestamp
  const formattedTime = conversation.last_message_time
    ? formatDistanceToNow(new Date(conversation.last_message_time), {
        addSuffix: true,
      })
    : null;

  // Truncate last message
  const truncatedMessage = conversation.last_message
    ? conversation.last_message.length > 50
      ? conversation.last_message.substring(0, 50) + "..."
      : conversation.last_message
    : "No messages yet";

  // Determine status color
  const getStatusColor = () => {
    switch (conversation.job.status) {
      case "ACTIVE":
      case "IN_PROGRESS":
        return Colors.success;
      case "COMPLETED":
        return Colors.primary;
      case "CANCELLED":
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: conversation.other_participant.avatar }}
          style={styles.avatar}
        />
        {conversation.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {conversation.unread_count > 99
                ? "99+"
                : conversation.unread_count}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Top Row: Name + Time */}
        <View style={styles.topRow}>
          <Text
            style={[
              styles.name,
              conversation.unread_count > 0 && styles.nameBold,
            ]}
            numberOfLines={1}
          >
            {conversation.other_participant.name}
          </Text>
          {formattedTime && <Text style={styles.time}>{formattedTime}</Text>}
        </View>

        {/* Job Title */}
        <View style={styles.jobRow}>
          <Ionicons
            name="briefcase-outline"
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.jobTitle} numberOfLines={1}>
            {conversation.job.title}
          </Text>
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
        </View>

        {/* Last Message */}
        <Text
          style={[
            styles.lastMessage,
            conversation.unread_count > 0 && styles.lastMessageBold,
          ]}
          numberOfLines={2}
        >
          {truncatedMessage}
        </Text>

        {/* Bottom Row: Budget + Location */}
        <View style={styles.bottomRow}>
          <View style={styles.budgetContainer}>
            <Ionicons
              name="cash-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.budget}>
              ₱{conversation.job.budget.toLocaleString()}
            </Text>
          </View>
          {conversation.job.location && (
            <View style={styles.locationContainer}>
              <Ionicons
                name="location-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.location} numberOfLines={1}>
                {conversation.job.location}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={Colors.textSecondary}
        style={styles.arrow}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundSecondary,
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  unreadText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameBold: {
    fontWeight: "700",
  },
  time: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  jobTitle: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  lastMessage: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  lastMessageBold: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  budgetContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  budget: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  location: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  arrow: {
    marginLeft: Spacing.sm,
  },
});

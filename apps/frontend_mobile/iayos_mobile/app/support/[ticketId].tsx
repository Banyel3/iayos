import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import {
  useTicketDetail,
  useReplyToTicket,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORIES,
} from "@/lib/hooks/useSupport";

export default function TicketDetailScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: ticket, isLoading, refetch } = useTicketDetail(Number(ticketId));
  const replyMutation = useReplyToTicket();

  const [replyText, setReplyText] = useState("");

  const isTicketClosed = ticket?.status === "closed" || ticket?.status === "resolved";

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (ticket?.messages?.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [ticket?.messages?.length]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !ticketId) return;

    try {
      await replyMutation.mutateAsync({
        ticketId: Number(ticketId),
        content: replyText.trim(),
      });

      setReplyText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to send reply");
    }
  };

  const getCategoryInfo = (category: string) => {
    return TICKET_CATEGORIES.find((c) => c.value === category) || {
      icon: "📝",
      label: category,
    };
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeGoBack(router, "/(tabs)/profile")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading ticket...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeGoBack(router, "/(tabs)/profile")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Ticket not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => safeGoBack(router, "/(tabs)/profile")}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = TICKET_STATUS_CONFIG[ticket.status] || {
    label: ticket.status,
    color: Colors.textSecondary,
    bg: Colors.surface,
  };
  const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority] || {
    label: ticket.priority,
    color: Colors.textSecondary,
  };
  const categoryInfo = getCategoryInfo(ticket.category);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack(router, "/(tabs)/profile")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket #{ticket.id}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Ticket Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.categoryRow}>
                <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                <Text style={styles.categoryLabel}>{categoryInfo.label}</Text>
              </View>
              <View style={styles.badgeRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
                <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                  {priorityConfig.icon} {priorityConfig.label}
                </Text>
              </View>
            </View>

            <Text style={styles.subject}>{ticket.subject}</Text>

            <View style={styles.infoMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>Created {formatDateTime(ticket.created_at)}</Text>
              </View>
              {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>Updated {formatDateTime(ticket.updated_at)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Messages Thread */}
          <View style={styles.messagesSection}>
            <Text style={styles.sectionTitle}>Conversation</Text>

            {ticket.messages && ticket.messages.length > 0 ? (
              ticket.messages.map((message, index) => {
                const isUser = message.sender_type === "user";
                const isFirst = index === 0;

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.adminBubble,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.senderInfo}>
                        <View
                          style={[
                            styles.senderAvatar,
                            isUser ? styles.userAvatar : styles.adminAvatar,
                          ]}
                        >
                          <Ionicons
                            name={isUser ? "person" : "headset"}
                            size={12}
                            color="#FFFFFF"
                          />
                        </View>
                        <Text style={styles.senderName}>
                          {isUser ? "You" : message.sender_name || "Support"}
                        </Text>
                        {isFirst && isUser && (
                          <View style={styles.originalBadge}>
                            <Text style={styles.originalBadgeText}>Original</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.messageTime}>
                        {formatTimeOnly(message.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.messageContent}>{message.content}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.noMessages}>
                <Ionicons name="chatbubbles-outline" size={32} color={Colors.textSecondary} />
                <Text style={styles.noMessagesText}>No messages yet</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Reply Input or Closed Notice */}
        {isTicketClosed ? (
          <View style={styles.closedNotice}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.closedNoticeText}>
              This ticket is {ticket.status}. No further replies can be added.
            </Text>
          </View>
        ) : (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply..."
              placeholderTextColor={Colors.textSecondary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!replyText.trim() || replyMutation.isPending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendReply}
              disabled={!replyText.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.body.small,
    fontWeight: "500",
  },
  priorityText: {
    ...Typography.body.small,
    fontWeight: "500",
  },
  subject: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  infoMeta: {
    gap: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  messagesSection: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  messageBubble: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  userBubble: {
    backgroundColor: Colors.primary + "10",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    marginLeft: Spacing.lg,
  },
  adminBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.lg,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  senderAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    backgroundColor: Colors.primary,
  },
  adminAvatar: {
    backgroundColor: Colors.success,
  },
  senderName: {
    ...Typography.body.small,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  originalBadge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  originalBadgeText: {
    ...Typography.body.small,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: "500",
  },
  messageTime: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  messageContent: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  noMessages: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  noMessagesText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  closedNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closedNoticeText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import {
  useMyTickets,
  SupportTicket,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORIES,
} from "@/lib/hooks/useSupport";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function MyTicketsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useMyTickets({
    page,
    status: statusFilter || undefined,
  });

  const tickets = data?.tickets || [];
  const hasMore = data?.has_next || false;

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const handleTicketPress = (ticket: SupportTicket) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/support/${ticket.id}` as any);
  };

  const getCategoryInfo = (category: string) => {
    return TICKET_CATEGORIES.find((c) => c.value === category) || {
      icon: "📝",
      label: category,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderTicketCard = ({ item: ticket }: { item: SupportTicket }) => {
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
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => handleTicketPress(ticket)}
        activeOpacity={0.7}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketMeta}>
            <Text style={styles.ticketId}>#{ticket.id}</Text>
            <Text style={styles.ticketDate}>{formatDate(ticket.created_at)}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bg },
              ]}
            >
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            <View style={styles.priorityBadge}>
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                {priorityConfig.icon}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ticketBody}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
            <Text style={styles.categoryLabel}>{categoryInfo.label}</Text>
          </View>
          <Text style={styles.ticketSubject} numberOfLines={2}>
            {ticket.subject}
          </Text>
        </View>

        <View style={styles.ticketFooter}>
          {ticket.last_reply_at ? (
            <View style={styles.replyInfo}>
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.replyText}>
                Last reply {formatDate(ticket.last_reply_at)}
              </Text>
            </View>
          ) : (
            <Text style={styles.noReplyText}>Awaiting response</Text>
          )}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="ticket-outline" size={48} color={Colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No tickets found</Text>
      <Text style={styles.emptyText}>
        {statusFilter
          ? `You don't have any ${statusFilter.replace("_", " ")} tickets.`
          : "You haven't created any support tickets yet."}
      </Text>
      {!statusFilter && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/support/create" as any)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Ticket</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <TouchableOpacity
          onPress={() => router.push("/support/create" as any)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              style={[
                styles.tab,
                statusFilter === tab.value && styles.tabActive,
              ]}
              onPress={() => {
                setStatusFilter(tab.value);
                setPage(1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  statusFilter === tab.value && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Tickets List */}
      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTicketCard}
          contentContainerStyle={[
            styles.listContent,
            tickets.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && page === 1}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && page > 1 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      )}
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
  addButton: {
    padding: Spacing.xs,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  listEmpty: {
    flex: 1,
  },
  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  ticketMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  ticketId: {
    ...Typography.body.small,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  ticketDate: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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
  priorityBadge: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityText: {
    fontSize: 14,
  },
  ticketBody: {
    padding: Spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  ticketSubject: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  replyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  replyText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  noReplyText: {
    ...Typography.body.small,
    color: Colors.warning,
    fontStyle: "italic",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    ...Typography.body.medium,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
});

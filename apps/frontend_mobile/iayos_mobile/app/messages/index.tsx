// Conversations List Screen
// Shows all conversations with search, filters, real-time updates, and offline support

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useConversations,
  useConversationSearch,
} from "../../lib/hooks/useConversations";
import {
  useWebSocketConnection,
  useMessageListener,
} from "../../lib/hooks/useWebSocket";
import ConversationCard from "../../components/ConversationCard";
import { Colors, Typography, Spacing } from "../../constants/theme";
import {
  setupNetworkListener,
  processOfflineQueue,
} from "../../lib/services/offline-queue";

type FilterType = "all" | "unread" | "archived";

export default function ConversationsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [queueCount, setQueueCount] = useState(0);

  // WebSocket connection
  const { isConnected, connectionState } = useWebSocketConnection();

  // Listen for new messages to trigger refetch
  useMessageListener();

  // Set up network listener for offline queue processing
  useEffect(() => {
    const unsubscribe = setupNetworkListener(
      // On online
      async () => {
        console.log("[Conversations] Device back online, processing queue...");
        await processOfflineQueue(async (message) => {
          // TODO: Send queued message via API
          console.log("[Conversations] Sending queued message:", message.id);
          return true; // Return true if sent successfully
        });
        refetch(); // Refresh conversations after queue processed
      },
      // On offline
      () => {
        console.log("[Conversations] Device offline");
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch conversations based on filter
  const {
    data: conversationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useConversations(activeFilter);

  // Search functionality
  const { conversations: searchResults } = useConversationSearch(searchQuery);

  // Determine which conversations to display
  const displayedConversations = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return conversationsData?.conversations || [];
  }, [searchQuery, searchResults, conversationsData]);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Render filter button
  const renderFilterButton = (
    filter: FilterType,
    label: string,
    count?: number
  ) => {
    const isActive = activeFilter === filter;

    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setActiveFilter(filter)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterButtonText,
            isActive && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Loading conversations...</Text>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyText}>No conversations found</Text>
          <Text style={styles.emptySubtext}>
            Try searching for a different name or job title
          </Text>
        </View>
      );
    }

    if (activeFilter === "archived") {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="archive-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyText}>No archived conversations</Text>
          <Text style={styles.emptySubtext}>
            Archived conversations will appear here
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="chatbubbles-outline"
          size={64}
          color={Colors.textSecondary}
        />
        <Text style={styles.emptyText}>No conversations yet</Text>
        <Text style={styles.emptySubtext}>
          Start by applying for jobs or accepting applications
        </Text>
      </View>
    );
  };

  // Render connection indicator
  const renderConnectionIndicator = () => {
    if (connectionState === "connecting") {
      return (
        <View style={styles.connectionBanner}>
          <ActivityIndicator size="small" color={Colors.white} />
          <Text style={styles.connectionText}>Connecting...</Text>
        </View>
      );
    }

    if (!isConnected && connectionState === "disconnected") {
      return (
        <View style={[styles.connectionBanner, styles.connectionBannerError]}>
          <Ionicons
            name="cloud-offline-outline"
            size={16}
            color={Colors.white}
          />
          <Text style={styles.connectionText}>
            Offline - Messages will be sent when reconnected
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {isConnected && (
          <View style={styles.connectedIndicator}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        )}
      </View>

      {/* Connection Banner */}
      {renderConnectionIndicator()}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {!searchQuery.trim() && (
        <View style={styles.filtersContainer}>
          {renderFilterButton("all", "All", conversationsData?.total)}
          {renderFilterButton(
            "unread",
            "Unread",
            conversationsData?.conversations.filter((c) => c.unread_count > 0)
              .length
          )}
          {renderFilterButton("archived", "Archived")}
        </View>
      )}

      {/* Conversations List */}
      <FlatList
        data={displayedConversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ConversationCard conversation={item} />}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={
          displayedConversations.length === 0 && styles.emptyListContent
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Results Count */}
      {!searchQuery.trim() && displayedConversations.length > 0 && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {displayedConversations.length}{" "}
            {displayedConversations.length === 1
              ? "conversation"
              : "conversations"}
          </Text>
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.heading.h2,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  connectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  connectedText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.success,
    fontWeight: "600",
  },
  connectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.warning,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
  },
  connectionBannerError: {
    backgroundColor: Colors.error,
  },
  connectionText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.white,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  filterBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    ...Typography.heading.h3,
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptySubtext: {
    ...Typography.body.medium,
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  emptyListContent: {
    flexGrow: 1,
  },
  resultsBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resultsText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});

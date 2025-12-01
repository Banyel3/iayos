import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Typography, BorderRadius, Spacing } from "@/constants/theme";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

interface BackjobItem {
  dispute_id: number;
  job_id: number;
  job_title: string;
  job_description: string;
  job_budget: number;
  job_location: string;
  job_category: string | null;
  reason: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  opened_date: string | null;
  resolution: string | null;
  resolved_date: string | null;
  evidence_images: string[];
  client: {
    id: number;
    name: string;
    avatar: string | null;
  } | null;
}

export default function MyBackjobsScreen() {
  const [backjobs, setBackjobs] = useState<BackjobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "UNDER_REVIEW" | "RESOLVED">(
    "all"
  );

  const fetchBackjobs = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      const url =
        filter === "all"
          ? ENDPOINTS.MY_BACKJOBS
          : `${ENDPOINTS.MY_BACKJOBS}?status=${filter}`;

      const response = await apiRequest(url);

      if (response.ok) {
        const data = await response.json();
        setBackjobs(data.backjobs || []);
      } else {
        console.error("Failed to fetch backjobs");
      }
    } catch (error) {
      console.error("Error fetching backjobs:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBackjobs();
    }, [filter])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBackjobs(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UNDER_REVIEW":
        return {
          label: "Action Required",
          color: Colors.warning,
          icon: "alert-circle",
        };
      case "RESOLVED":
        return {
          label: "Completed",
          color: Colors.success,
          icon: "checkmark-circle",
        };
      case "CLOSED":
        return {
          label: "Closed",
          color: Colors.textSecondary,
          icon: "close-circle",
        };
      default:
        return { label: "Pending", color: Colors.info, icon: "time" };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return { label: "Critical", color: Colors.error };
      case "HIGH":
        return { label: "High Priority", color: Colors.error };
      case "MEDIUM":
        return { label: "Medium", color: Colors.warning };
      default:
        return { label: "Low", color: Colors.textSecondary };
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderBackjobCard = ({ item }: { item: BackjobItem }) => {
    const statusBadge = getStatusBadge(item.status);
    const priorityBadge = getPriorityBadge(item.priority);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/jobs/backjob-detail",
            params: { disputeId: item.dispute_id, jobId: item.job_id },
          })
        }
      >
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusBadge.color}20` },
          ]}
        >
          <Ionicons
            name={statusBadge.icon as any}
            size={14}
            color={statusBadge.color}
          />
          <Text style={[styles.statusText, { color: statusBadge.color }]}>
            {statusBadge.label}
          </Text>
        </View>

        {/* Job Title */}
        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.job_title}
        </Text>

        {/* Reason */}
        <Text style={styles.reason} numberOfLines={2}>
          {item.reason}
        </Text>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="cash-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.metaText}>
              ₱{item.job_budget?.toLocaleString()}
            </Text>
          </View>
          {item.job_category && (
            <View style={styles.metaItem}>
              <Ionicons
                name="pricetag-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.metaText}>{item.job_category}</Text>
            </View>
          )}
        </View>

        {/* Client & Priority */}
        <View style={styles.footerRow}>
          {item.client && (
            <View style={styles.clientInfo}>
              {item.client.avatar ? (
                <Image
                  source={{ uri: item.client.avatar }}
                  style={styles.clientAvatar}
                />
              ) : (
                <View style={[styles.clientAvatar, styles.avatarPlaceholder]}>
                  <Ionicons
                    name="person"
                    size={12}
                    color={Colors.textSecondary}
                  />
                </View>
              )}
              <Text style={styles.clientName}>{item.client.name}</Text>
            </View>
          )}

          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: `${priorityBadge.color}15` },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityBadge.color }]}>
              {priorityBadge.label}
            </Text>
          </View>
        </View>

        {/* Date */}
        {item.opened_date && (
          <Text style={styles.dateText}>
            Requested: {formatDate(item.opened_date)}
          </Text>
        )}

        {/* Evidence Indicator */}
        {item.evidence_images && item.evidence_images.length > 0 && (
          <View style={styles.evidenceIndicator}>
            <Ionicons
              name="images-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.evidenceText}>
              {item.evidence_images.length} photo(s) attached
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name="checkmark-done-circle"
          size={64}
          color={Colors.success}
        />
      </View>
      <Text style={styles.emptyTitle}>No Backjobs</Text>
      <Text style={styles.emptyText}>
        You don't have any backjob requests at the moment. Great job keeping
        your clients happy!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Backjobs</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "UNDER_REVIEW" && styles.filterTabActive,
          ]}
          onPress={() => setFilter("UNDER_REVIEW")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "UNDER_REVIEW" && styles.filterTextActive,
            ]}
          >
            Action Required
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "RESOLVED" && styles.filterTabActive,
          ]}
          onPress={() => setFilter("RESOLVED")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "RESOLVED" && styles.filterTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading backjobs...</Text>
        </View>
      ) : (
        <FlatList
          data={backjobs}
          renderItem={renderBackjobCard}
          keyExtractor={(item) => item.dispute_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.background,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  reason: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  clientName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priorityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  evidenceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  evidenceText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.success}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

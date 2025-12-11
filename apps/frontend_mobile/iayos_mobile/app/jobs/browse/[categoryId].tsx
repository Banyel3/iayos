import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { JobCardSkeleton } from "@/components/ui/SkeletonLoader";

interface Job {
  job_id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  created_at: string;
  category_name: string;
  client_name: string;
  client_avatar: string | null;
  is_applied: boolean;
  expected_duration: string;
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export default function CategoryJobsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const categoryId = parseInt(params.categoryId as string);
  const categoryName = params.categoryName as string;

  const [refreshing, setRefreshing] = useState(false);

  // Fetch jobs with infinite scroll
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["jobs", "category", categoryId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiRequest(
        ENDPOINTS.JOB_LIST_FILTERED({
          category: categoryId,
          page: pageParam,
          limit: 20,
        })
      );

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      return await response.json();
    },
    getNextPageParam: (lastPage: JobsResponse) => {
      return lastPage.pagination.has_next
        ? lastPage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const jobs = data?.pages.flatMap((page) => page.jobs) || [];
  const totalCount = data?.pages[0]?.pagination.total_count || 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleJobPress = (jobId: number) => {
    router.push(`/jobs/${jobId}` as any);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "MEDIUM":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "LOW":
      default:
        return { bg: "#D1FAE5", text: "#065F46" };
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    const urgencyColors = getUrgencyColor(item.urgency_level);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => handleJobPress(item.job_id)}
        activeOpacity={0.7}
      >
        {/* Left urgency indicator */}
        <View
          style={[
            styles.urgencyIndicator,
            { backgroundColor: urgencyColors.text },
          ]}
        />

        <View style={styles.jobCardContent}>
          {/* Header */}
          <View style={styles.jobHeader}>
            <View style={styles.jobHeaderLeft}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {item.category_name}
                </Text>
              </View>
            </View>
            <View style={styles.budgetContainer}>
              <Text style={styles.budgetAmount}>
                ₱{item.budget.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.jobDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Details */}
          <View style={styles.jobDetails}>
            <View style={styles.detailItem}>
              <Ionicons
                name="location-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.detailText}>{item.expected_duration}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.jobFooter}>
            <View style={styles.clientInfo}>
              <View style={styles.clientAvatar}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
              <Text style={styles.clientName}>{item.client_name}</Text>
            </View>

            <View style={styles.footerRight}>
              <View
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: urgencyColors.bg },
                ]}
              >
                <Text
                  style={[
                    styles.urgencyBadgeText,
                    { color: urgencyColors.text },
                  ]}
                >
                  {item.urgency_level}
                </Text>
              </View>
              <Text style={styles.timeAgo}>
                {formatTimeAgo(item.created_at)}
              </Text>
            </View>
          </View>

          {/* Applied badge */}
          {item.is_applied && (
            <View style={styles.appliedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.success}
              />
              <Text style={styles.appliedBadgeText}>Applied</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>
            {totalCount} {totalCount === 1 ? "job" : "jobs"} available
          </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Jobs List */}
      {isLoading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load jobs</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="briefcase-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>
            No jobs available in this category
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Check back later for new opportunities
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.job_id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadMoreText}>Loading more...</Text>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  listContainer: {
    padding: Spacing.md,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadows.medium,
  },
  urgencyIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  jobCardContent: {
    padding: Spacing.md,
    paddingLeft: Spacing.md + 8, // Account for urgency indicator
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  jobHeaderLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  budgetContainer: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  budgetAmount: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.success,
  },
  jobDescription: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  jobDetails: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  detailText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  clientAvatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.xs,
  },
  clientName: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  urgencyBadgeText: {
    ...Typography.body.small,
    fontWeight: "600",
  },
  timeAgo: {
    ...Typography.body.small,
    color: Colors.textHint,
  },
  appliedBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
  },
  appliedBadgeText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "600",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    ...Typography.body.large,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    ...Typography.body.large,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  emptyStateSubtext: {
    ...Typography.body.medium,
    color: Colors.textHint,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  loadMoreContainer: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  loadMoreText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

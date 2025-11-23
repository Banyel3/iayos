import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "@/lib/api/config";
import SearchBar from "@/components/ui/SearchBar";
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
  saved_at: string;
}

export default function SavedJobsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch saved jobs
  const {
    data: savedJobsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jobs", "saved"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.SAVED_JOBS, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch saved jobs");
      return await response.json();
    },
  });

  const savedJobs: Job[] = savedJobsData?.jobs || [];

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return savedJobs;

    const query = searchQuery.toLowerCase();
    return savedJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.category_name.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)
    );
  }, [savedJobs, searchQuery]);

  // Unsave job mutation
  const unsaveMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(ENDPOINTS.UNSAVE_JOB(jobId), {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to unsave job");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleJobPress = (jobId: number) => {
    router.push(`/jobs/${jobId}` as any);
  };

  const handleUnsaveJob = (jobId: number, jobTitle: string) => {
    Alert.alert("Remove from Saved", `Remove "${jobTitle}" from saved jobs?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          unsaveMutation.mutate(jobId);
        },
      },
    ]);
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

  const formatSavedTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Saved just now";
    if (diffHours < 24) return `Saved ${diffHours}h ago`;
    if (diffDays === 1) return "Saved yesterday";
    return `Saved ${diffDays}d ago`;
  };

  const renderJobCard = (job: Job) => {
    const urgencyColors = getUrgencyColor(job.urgency_level);

    return (
      <View key={job.job_id} style={styles.jobCardWrapper}>
        <TouchableOpacity
          style={styles.jobCard}
          onPress={() => handleJobPress(job.job_id)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.urgencyIndicator,
              { backgroundColor: urgencyColors.text },
            ]}
          />

          <View style={styles.jobCardContent}>
            <View style={styles.jobHeader}>
              <View style={styles.jobHeaderLeft}>
                <Text style={styles.jobTitle} numberOfLines={2}>
                  {job.title}
                </Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {job.category_name}
                  </Text>
                </View>
              </View>
              <View style={styles.budgetContainer}>
                <Text style={styles.budgetAmount}>
                  ₱{job.budget.toLocaleString()}
                </Text>
              </View>
            </View>

            <Text style={styles.jobDescription} numberOfLines={2}>
              {job.description}
            </Text>

            <View style={styles.jobDetails}>
              <View style={styles.detailItem}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={Colors.textSecondary}
                />
                <Text style={styles.detailText}>{job.location}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={Colors.textSecondary}
                />
                <Text style={styles.detailText}>{job.expected_duration}</Text>
              </View>
            </View>

            <View style={styles.jobFooter}>
              <View style={styles.clientInfo}>
                <View style={styles.clientAvatar}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                </View>
                <Text style={styles.clientName}>{job.client_name}</Text>
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
                    {job.urgency_level}
                  </Text>
                </View>
                <Text style={styles.timeAgo}>
                  {formatTimeAgo(job.created_at)}
                </Text>
              </View>
            </View>

            {job.is_applied && (
              <View style={styles.appliedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={Colors.success}
                />
                <Text style={styles.appliedBadgeText}>Applied</Text>
              </View>
            )}

            <View style={styles.savedTimeBadge}>
              <Ionicons name="heart" size={12} color={Colors.error} />
              <Text style={styles.savedTimeText}>
                {formatSavedTime(job.saved_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Unsave Button */}
        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsaveJob(job.job_id, job.title)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="heart-dislike-outline"
            size={20}
            color={Colors.error}
          />
        </TouchableOpacity>
      </View>
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
          <Text style={styles.headerTitle}>Saved Jobs</Text>
          {savedJobs.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{savedJobs.length}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      {savedJobs.length > 0 && (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved jobs..."
          />
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3, 4].map((i) => (
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
          <Text style={styles.errorText}>Failed to load saved jobs</Text>
          <Text style={styles.errorSubtext}>
            Please check your connection and try again
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : savedJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="heart-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>No saved jobs yet</Text>
          <Text style={styles.emptyStateSubtext}>
            {"Save jobs you're interested in to easily find them later"}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/jobs/categories" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.browseButtonText}>Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="search-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>No results found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try adjusting your search query
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => setSearchQuery("")}
            activeOpacity={0.7}
          >
            <Text style={styles.browseButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        >
          {filteredJobs.map((job) => renderJobCard(job))}
        </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listContainer: {
    padding: Spacing.md,
  },
  jobCardWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  jobCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
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
    paddingLeft: Spacing.md + 8,
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
  savedTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  savedTimeText: {
    ...Typography.body.small,
    color: Colors.textHint,
    fontStyle: "italic",
  },
  unsaveButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
    ...Shadows.medium,
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
    textAlign: "center",
  },
  errorSubtext: {
    ...Typography.body.medium,
    color: Colors.textHint,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
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
  browseButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  browseButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
});

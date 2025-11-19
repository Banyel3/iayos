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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, fetchJson } from "@/lib/api/config";

interface MyJob {
  job_id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "PENDING";
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  category_name: string;
  created_at: string;
  client_name?: string;
  client_img?: string;
  worker_name?: string;
  worker_img?: string;
  application_status?: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
}

interface MyJobsResponse {
  jobs: MyJob[];
  total_count: number;
  page: number;
  pages: number;
  profile_type: string;
}

type TabType = "my" | "inProgress" | "past";

export default function JobsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("my");

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";

  // Map tabs to status filters
  const getStatusForTab = (tab: TabType): string => {
    switch (tab) {
      case "my":
        return "ACTIVE";
      case "inProgress":
        return "IN_PROGRESS";
      case "past":
        return "COMPLETED";
      default:
        return "ACTIVE";
    }
  };

  // Fetch jobs for active tab
  const {
    data: jobsData,
    isLoading,
    error,
    refetch,
  } = useQuery<MyJobsResponse>({
    queryKey: ["jobs", "my-jobs", activeTab],
    queryFn: async (): Promise<MyJobsResponse> => {
      const status = getStatusForTab(activeTab);

      // Build query params
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "20");

      if (status) {
        params.append("status", status);
      }

      const url = `${ENDPOINTS.MY_JOBS}?${params.toString()}`;
      const response = await fetchJson<MyJobsResponse>(url, {
        method: "GET",
      });

      return response;
    },
  });

  const jobs = jobsData?.jobs || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleJobPress = (jobId: number) => {
    router.push(`/jobs/${jobId}` as any);
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { bg: "#DBEAFE", text: "#1E40AF" };
      case "IN_PROGRESS":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "COMPLETED":
        return { bg: "#D1FAE5", text: "#065F46" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const renderJobCard = (job: MyJob) => {
    const urgencyColors = getUrgencyColor(job.urgency_level);
    const statusColors = getStatusBadgeColor(job.status);

    return (
      <TouchableOpacity
        key={job.job_id}
        style={styles.jobCard}
        onPress={() => handleJobPress(job.job_id)}
        activeOpacity={0.8}
      >
        {/* Status and Urgency Badges */}
        <View style={styles.badgesRow}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
          >
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {job.status.replace("_", " ")}
            </Text>
          </View>
          <View
            style={[styles.urgencyBadge, { backgroundColor: urgencyColors.bg }]}
          >
            <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
              {job.urgency_level}
            </Text>
          </View>
        </View>

        {/* Job Title and Category */}
        <Text style={styles.jobTitle} numberOfLines={2}>
          {job.title}
        </Text>
        <Text style={styles.jobCategory}>{job.category_name}</Text>
        <Text style={styles.jobDescription} numberOfLines={2}>
          {job.description}
        </Text>

        {/* Worker/Client Info */}
        {isClient && job.worker_name && (
          <View style={styles.userInfoContainer}>
            {job.worker_img ? (
              <Image
                source={{ uri: job.worker_img }}
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name="person"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.userTextContainer}>
              <Text style={styles.userLabel}>Worker</Text>
              <Text style={styles.userName}>{job.worker_name}</Text>
            </View>
          </View>
        )}

        {isWorker && job.client_name && (
          <View style={styles.userInfoContainer}>
            {job.client_img ? (
              <Image
                source={{ uri: job.client_img }}
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name="person"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.userTextContainer}>
              <Text style={styles.userLabel}>Client</Text>
              <Text style={styles.userName}>{job.client_name}</Text>
            </View>
          </View>
        )}

        {/* Location and Budget */}
        <View style={styles.jobFooter}>
          <View style={styles.locationContainer}>
            <Ionicons
              name="location-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {job.location}
            </Text>
          </View>
          <Text style={styles.budgetText}>₱{job.budget.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isClient ? "My Job Requests" : "My Jobs"}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/jobs/search" as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="search-outline"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/jobs/saved" as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="heart-outline" size={22} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "my" && styles.tabActive]}
            onPress={() => setActiveTab("my")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "my" && styles.tabTextActive,
              ]}
            >
              My {isClient ? "Requests" : "Jobs"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "inProgress" && styles.tabActive]}
            onPress={() => setActiveTab("inProgress")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "inProgress" && styles.tabTextActive,
              ]}
            >
              In Progress
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "past" && styles.tabActive]}
            onPress={() => setActiveTab("past")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "past" && styles.tabTextActive,
              ]}
            >
              Past {isClient ? "Requests" : "Jobs"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Jobs List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading jobs...</Text>
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
              {activeTab === "my"
                ? `No active ${isClient ? "requests" : "jobs"} yet`
                : activeTab === "inProgress"
                  ? "No jobs in progress"
                  : `No completed ${isClient ? "requests" : "jobs"} yet`}
            </Text>
            {activeTab === "my" && isClient && (
              <TouchableOpacity
                style={styles.createJobButton}
                onPress={() => router.push("/jobs/create" as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.createJobButtonText}>
                  Create Job Request
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.jobsList}>
            {jobs.map((job) => renderJobCard(job))}
          </View>
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 4,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  jobsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  badgesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  urgencyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
  },
  jobTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  jobCategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  jobDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  userTextContainer: {
    flex: 1,
  },
  userLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  locationContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  budgetText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.error,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
  },
  emptyStateText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  createJobButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  createJobButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
});

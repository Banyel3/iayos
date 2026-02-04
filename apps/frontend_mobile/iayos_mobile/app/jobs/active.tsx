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
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { JobCardSkeleton } from "@/components/ui/SkeletonLoader";

interface ActiveJob {
  id: string;
  title: string;
  category: string;
  budget: string;
  location_city: string;
  location_barangay: string;
  status: "ASSIGNED" | "IN_PROGRESS";
  worker_marked_complete: boolean;
  client_marked_complete: boolean;
  assigned_at: string;
  started_at: string | null;
  client: {
    name: string;
    avatar: string;
    phone: string;
  };
  // Team Job Fields
  is_team_job?: boolean;
  total_workers_needed?: number;
  total_workers_assigned?: number;
  team_fill_percentage?: number;
}

export default function ActiveJobsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const isWorker = user?.profile_data?.profileType === "WORKER";

  // Fetch active jobs
  const {
    data: jobs = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ActiveJob[], unknown, ActiveJob[]>({
    queryKey: ["jobs", "active"],
    queryFn: async (): Promise<ActiveJob[]> => {
      const endpoint = isWorker
        ? ENDPOINTS.ACTIVE_JOBS
        : `${ENDPOINTS.AVAILABLE_JOBS}/my-posted-jobs?status=IN_PROGRESS,ASSIGNED`;

      const response = await apiRequest(endpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch active jobs");
      }

      const data = (await response.json()) as any;
      return data.jobs || [];
    },
    enabled: !!user,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleJobPress = (job: ActiveJob) => {
    // Team jobs go to main job detail (has full team support)
    // Regular jobs go to active job detail (has completion workflow)
    if (job.is_team_job) {
      router.push(`/jobs/${job.id}` as any);
    } else {
      router.push(`/jobs/active/${job.id}` as any);
    }
  };

  const getStatusInfo = (job: ActiveJob) => {
    if (job.worker_marked_complete && !job.client_marked_complete) {
      return {
        label: "Pending Approval",
        color: "#FEF3C7",
        textColor: "#92400E",
        icon: "time",
      };
    }

    if (job.status === "IN_PROGRESS") {
      return {
        label: "In Progress",
        color: "#DBEAFE",
        textColor: "#1E40AF",
        icon: "construct",
      };
    }

    return {
      label: "Assigned",
      color: "#F3E8FF",
      textColor: "#6B21A8",
      icon: "checkmark-circle",
    };
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons
            name="person-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>
            Please log in to view active jobs
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Jobs</Text>
          <View style={{ width: 24 }} />
        </View>

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
            <Text style={styles.errorText}>Failed to load active jobs</Text>
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
              {isWorker
                ? "No active jobs. Browse and apply for jobs to get started!"
                : "No active jobs. Post a job to hire workers!"}
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() =>
                router.push(isWorker ? "/(tabs)/jobs" : ("/post-job" as any))
              }
              activeOpacity={0.8}
            >
              <Text style={styles.browseButtonText}>
                {isWorker ? "Browse Jobs" : "Post a Job"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.jobsList}>
            {jobs.map((job) => {
              const statusInfo = getStatusInfo(job);

              return (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobCard}
                  onPress={() => handleJobPress(job)}
                  activeOpacity={0.8}
                >
                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.color },
                    ]}
                  >
                    <Ionicons
                      name={statusInfo.icon as any}
                      size={16}
                      color={statusInfo.textColor}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusInfo.textColor },
                      ]}
                    >
                      {statusInfo.label}
                    </Text>
                  </View>

                  {/* Job Info */}
                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {job.title}
                  </Text>
                  <Text style={styles.jobCategory}>{job.category}</Text>

                  {/* Budget and Location */}
                  <View style={styles.jobMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="cash-outline"
                        size={16}
                        color={Colors.primary}
                      />
                      <Text style={styles.metaText}>{job.budget}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.metaText}>
                        {job.location_barangay}, {job.location_city}
                      </Text>
                    </View>
                  </View>

                  {/* Client/Worker Info */}
                  <View style={styles.userInfo}>
                    <Ionicons
                      name={isWorker ? "person-outline" : "hammer-outline"}
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.userName}>
                      {isWorker
                        ? `Client: ${job.client.name}`
                        : `Worker: ${job.client.name}`}
                    </Text>
                  </View>

                  {/* Completion Status (for workers) */}
                  {isWorker && job.worker_marked_complete && (
                    <View style={styles.completionBanner}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={Colors.success}
                      />
                      <Text style={styles.completionText}>
                        Marked complete - Awaiting client approval
                      </Text>
                    </View>
                  )}

                  {/* Completion Status (for clients) */}
                  {!isWorker &&
                    job.worker_marked_complete &&
                    !job.client_marked_complete && (
                      <View style={styles.actionBanner}>
                        <Ionicons
                          name="alert-circle"
                          size={20}
                          color={Colors.warning}
                        />
                        <Text style={styles.actionText}>
                          Worker marked complete - Review needed
                        </Text>
                      </View>
                    )}

                  {/* Team Job Badge */}
                  {job.is_team_job && (
                    <View style={styles.teamJobRow}>
                      <View style={styles.teamJobBadge}>
                        <Ionicons
                          name="people-circle"
                          size={14}
                          color={Colors.white}
                        />
                        <Text style={styles.teamJobBadgeText}>Team Job</Text>
                      </View>
                      <View style={styles.teamJobProgress}>
                        <View style={styles.teamJobProgressBar}>
                          <View
                            style={[
                              styles.teamJobProgressFill,
                              { width: `${job.team_fill_percentage || 0}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.teamJobProgressText}>
                          {job.total_workers_assigned || 0}/
                          {job.total_workers_needed || 0} workers
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Time Info */}
                  <Text style={styles.timeText}>
                    {job.started_at
                      ? `Started ${job.started_at}`
                      : `Assigned ${job.assigned_at}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  listContainer: {
    padding: 16,
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
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  jobsList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  statusText: {
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
    marginBottom: Spacing.md,
  },
  jobMeta: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  completionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#D1FAE5",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  completionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: "#065F46",
  },
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FEF3C7",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  actionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: "#92400E",
  },
  timeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textHint,
    marginTop: Spacing.xs,
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
    marginBottom: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  browseButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  browseButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
  // Team Job Styles
  teamJobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  teamJobBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  teamJobBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  teamJobProgress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamJobProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  teamJobProgressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  teamJobProgressText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    minWidth: 55,
  },
});

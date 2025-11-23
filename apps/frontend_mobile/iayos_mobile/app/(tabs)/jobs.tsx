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
  Alert,
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, fetchJson, apiRequest } from "@/lib/api/config";
import { JobCardSkeleton } from "@/components/ui/SkeletonLoader";

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
  job_type: "INVITE" | "LISTING";
  invite_status?: "PENDING" | "ACCEPTED" | "REJECTED";
  assigned_worker_id?: number | null;
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

interface MyApplication {
  application_id: number;
  job_id: number;
  job_title: string;
  job_description: string;
  job_budget: number;
  job_location: string;
  job_status: string;
  application_status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  proposal_message: string;
  proposed_budget?: number;
  estimated_duration?: string;
  budget_option: "ACCEPT" | "NEGOTIATE";
  created_at: string;
  client_name: string;
  client_img?: string;
}

type TabType = "open" | "pending" | "applications" | "inProgress" | "past";

export default function JobsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("open");

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";

  // Map tabs to status filters
  const getStatusForTab = (tab: TabType): string => {
    switch (tab) {
      case "open":
      case "pending":
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

  // Fetch worker applications
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    error: applicationsError,
    refetch: refetchApplications,
  } = useQuery<{ applications: MyApplication[]; total: number }>({
    queryKey: ["jobs", "my-applications"],
    queryFn: async () => {
      const response = await fetchJson<{
        applications: MyApplication[];
        total: number;
      }>(ENDPOINTS.MY_APPLICATIONS, { method: "GET" });
      return response;
    },
    enabled: isWorker && activeTab === "applications",
  });

  const applications = applicationsData?.applications || [];

  // Filter applications to show only PENDING
  const filteredApplications = applications.filter(
    (app) => app.application_status === "PENDING"
  );

  // DEBUG: Log job data to see what's being received
  console.log("📋 Jobs received from backend:", jobs.length);
  jobs.forEach((job, index) => {
    console.log(`  Job ${index + 1}:`, {
      id: job.job_id,
      title: job.title?.substring(0, 20),
      job_type: job.job_type,
      invite_status: job.invite_status,
      assigned_worker_id: job.assigned_worker_id,
      status: job.status,
    });
  });

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "open") {
      // Open Jobs: LISTING type with no assigned worker yet (open for applications)
      return isClient
        ? job.job_type === "LISTING" && !job.assigned_worker_id
        : true;
    }
    if (activeTab === "pending") {
      // Pending: INVITE type (job requests) with assigned worker, status ACTIVE (not yet accepted/in progress)
      // Note: invite_status field may be None/null in DB, so we check job.status === "ACTIVE" instead
      return isClient
        ? job.job_type === "INVITE" &&
            job.assigned_worker_id &&
            job.status === "ACTIVE"
        : false;
    }
    // For inProgress and past, show all job types
    return true;
  });

  console.log(`📊 Filtered jobs for ${activeTab} tab:`, filteredJobs.length);
  console.log("  Filter criteria:", {
    activeTab,
    isClient,
    isWorker,
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return await apiRequest(ENDPOINTS.DELETE_JOB(jobId), {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Invalidate cache - React Query will automatically refetch
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-jobs"] });
      Alert.alert("Success", "Job deleted successfully");
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.message || "Failed to delete job. Please try again."
      );
    },
  });

  const handleDeleteJob = (
    jobId: number,
    status: string,
    jobType: "INVITE" | "LISTING"
  ) => {
    // Prevent deletion of in-progress or completed jobs
    if (status === "IN_PROGRESS" || status === "COMPLETED") {
      Alert.alert(
        "Cannot Delete",
        "You cannot delete jobs that are in progress or completed"
      );
      return;
    }

    const jobTypeLabel = jobType === "INVITE" ? "job request" : "job post";
    const deleteMessage =
      jobType === "INVITE"
        ? "Are you sure you want to delete this job request? The invited worker will be notified. This action cannot be undone."
        : "Are you sure you want to delete this job post? All applications will be removed. This action cannot be undone.";

    Alert.alert(
      `Delete ${jobType === "INVITE" ? "Job Request" : "Job Post"}`,
      deleteMessage,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteJobMutation.mutate(jobId),
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "applications" && isWorker) {
      await refetchApplications();
    } else {
      await refetch();
    }
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
          <View style={styles.badgesLeft}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
            >
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {job.status.replace("_", " ")}
              </Text>
            </View>
            <View
              style={[
                styles.urgencyBadge,
                { backgroundColor: urgencyColors.bg },
              ]}
            >
              <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
                {job.urgency_level}
              </Text>
            </View>
            {/* Job Type Badge - Show for clients */}
            {isClient && (
              <View
                style={[
                  styles.jobTypeBadge,
                  {
                    backgroundColor:
                      job.job_type === "INVITE" ? "#E0E7FF" : "#F3F4F6",
                  },
                ]}
              >
                <Ionicons
                  name={job.job_type === "INVITE" ? "person" : "megaphone"}
                  size={10}
                  color={job.job_type === "INVITE" ? "#4F46E5" : "#6B7280"}
                  style={{ marginRight: 2 }}
                />
                <Text
                  style={[
                    styles.jobTypeText,
                    {
                      color: job.job_type === "INVITE" ? "#4F46E5" : "#6B7280",
                    },
                  ]}
                >
                  {job.job_type === "INVITE" ? "Request" : "Post"}
                </Text>
              </View>
            )}
          </View>

          {/* Delete Button (only for clients on non-in-progress/completed jobs) */}
          {isClient &&
            job.status !== "IN_PROGRESS" &&
            job.status !== "COMPLETED" && (
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  deleteJobMutation.isPending && styles.deleteButtonDisabled,
                ]}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent card press
                  if (!deleteJobMutation.isPending) {
                    handleDeleteJob(job.job_id, job.status, job.job_type);
                  }
                }}
                activeOpacity={0.7}
                disabled={deleteJobMutation.isPending}
              >
                {deleteJobMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.error}
                  />
                )}
              </TouchableOpacity>
            )}
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
            {isClient ? "My Jobs" : "My Jobs"}
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
          {isClient && (
            <TouchableOpacity
              style={[styles.tab, activeTab === "open" && styles.tabActive]}
              onPress={() => setActiveTab("open")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "open" && styles.tabTextActive,
                ]}
              >
                Open Jobs
              </Text>
            </TouchableOpacity>
          )}

          {isClient && (
            <TouchableOpacity
              style={[styles.tab, activeTab === "pending" && styles.tabActive]}
              onPress={() => setActiveTab("pending")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "pending" && styles.tabTextActive,
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
          )}

          {isWorker && (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "applications" && styles.tabActive,
              ]}
              onPress={() => setActiveTab("applications")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "applications" && styles.tabTextActive,
                ]}
              >
                Applications
              </Text>
            </TouchableOpacity>
          )}

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
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {/* Jobs List or Applications List */}
        {activeTab === "applications" && isWorker ? (
          // Applications Tab for Workers
          applicationsLoading ? (
            <View style={styles.listContainer}>
              {[1, 2, 3, 4].map((i) => (
                <JobCardSkeleton key={i} />
              ))}
            </View>
          ) : applicationsError ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={Colors.error}
              />
              <Text style={styles.errorText}>Failed to load applications</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetchApplications()}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredApplications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                No applications submitted yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Browse available jobs and apply to get started
              </Text>
              <TouchableOpacity
                style={styles.createJobButton}
                onPress={() => router.push("/jobs/categories" as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={20} color={Colors.white} />
                <Text style={styles.createJobButtonText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {filteredApplications.map((app) => (
                <TouchableOpacity
                  key={app.application_id}
                  style={styles.jobCard}
                  onPress={() => handleJobPress(app.job_id)}
                  activeOpacity={0.8}
                >
                  {/* Status Badge */}
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            app.application_status === "ACCEPTED"
                              ? "#D1FAE5"
                              : app.application_status === "REJECTED"
                                ? "#FEE2E2"
                                : app.application_status === "WITHDRAWN"
                                  ? "#F3F4F6"
                                  : "#DBEAFE",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              app.application_status === "ACCEPTED"
                                ? "#065F46"
                                : app.application_status === "REJECTED"
                                  ? "#991B1B"
                                  : app.application_status === "WITHDRAWN"
                                    ? "#6B7280"
                                    : "#1E40AF",
                          },
                        ]}
                      >
                        {app.application_status}
                      </Text>
                    </View>
                  </View>

                  {/* Job Title */}
                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {app.job_title}
                  </Text>

                  {/* Client Info */}
                  <View style={styles.clientInfo}>
                    {app.client_img ? (
                      <Image
                        source={{ uri: app.client_img }}
                        style={styles.clientAvatar}
                      />
                    ) : (
                      <View
                        style={[styles.clientAvatar, styles.avatarPlaceholder]}
                      >
                        <Ionicons
                          name="person"
                          size={16}
                          color={Colors.textSecondary}
                        />
                      </View>
                    )}
                    <Text style={styles.clientName} numberOfLines={1}>
                      {app.client_name}
                    </Text>
                  </View>

                  {/* Budget Info */}
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>
                      {app.budget_option === "NEGOTIATE"
                        ? "Your Offer:"
                        : "Client Budget:"}
                    </Text>
                    <Text style={styles.budgetText}>
                      ₱
                      {(app.budget_option === "NEGOTIATE" && app.proposed_budget
                        ? app.proposed_budget
                        : app.job_budget
                      ).toLocaleString()}
                    </Text>
                  </View>

                  {/* Location and Date */}
                  <View style={styles.locationRow}>
                    <View style={styles.locationInfo}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {app.job_location}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {new Date(app.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : // Regular Jobs List
        isLoading ? (
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
            <Text style={styles.errorText}>Failed to load jobs</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="briefcase-outline"
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              {activeTab === "open"
                ? "No open job posts yet"
                : activeTab === "pending"
                  ? "No pending job requests"
                  : activeTab === "inProgress"
                    ? "No jobs in progress"
                    : "No completed jobs yet"}
            </Text>
            {(activeTab === "open" || activeTab === "pending") && isClient && (
              <TouchableOpacity
                style={styles.createJobButton}
                onPress={() => router.push("/jobs/create" as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.createJobButtonText}>
                  {activeTab === "pending"
                    ? "Create Job Request"
                    : "Post a Job"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.jobsList}>
            {filteredJobs.map((job) => renderJobCard(job))}
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  badgesLeft: {
    flexDirection: "row",
    gap: Spacing.sm,
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
  jobTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  jobTypeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
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
  emptyStateSubtext: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textLight,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  budgetLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
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
  deleteButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    minHeight: 32,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});

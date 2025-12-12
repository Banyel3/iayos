import React, { useState, useEffect } from "react";
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
  Modal,
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
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PENDING";
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  category_name: string;
  created_at: string;
  job_type: "INVITE" | "LISTING";
  invite_status?: "PENDING" | "ACCEPTED" | "REJECTED";
  assigned_worker_id?: number | null;
  assigned_agency_id?: number | null;
  client_name?: string;
  client_img?: string;
  worker_name?: string;
  worker_img?: string;
  agency_name?: string;
  agency_logo?: string;
  application_status?: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  has_backjob?: boolean;
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
  assigned_agency_id?: number | null;
  client_name: string;
  client_img?: string;
}
type TabType =
  | "open"
  | "pending"
  | "requests"
  | "applications"
  | "inProgress"
  | "past";

export default function JobsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("open");
  const [showJobTypeModal, setShowJobTypeModal] = useState(false);

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";

  // Set default tab based on user type
  useEffect(() => {
    if (isWorker) {
      setActiveTab("requests");
    } else if (isClient) {
      setActiveTab("open");
    }
  }, [isWorker, isClient]);

  // Map tabs to status filters
  const getStatusForTab = (tab: TabType): string => {
    switch (tab) {
      case "open":
      case "pending":
      case "requests":
        return "ACTIVE";
      case "inProgress":
        return "IN_PROGRESS";
      case "past":
        // For past jobs, include both completed and cancelled
        return "COMPLETED,CANCELLED";
      default:
        return "ACTIVE";
    }
  };

  // Fetch pending backjobs count for badge (workers/agencies only)
  const { data: backjobsData } = useQuery<{ backjobs: any[]; total: number }>({
    queryKey: ["backjobs", "count"],
    queryFn: async () => {
      const response = await fetchJson<{ backjobs: any[]; total: number }>(
        `${ENDPOINTS.MY_BACKJOBS}?status=UNDER_REVIEW`,
        { method: "GET" }
      );
      return response;
    },
    enabled: isWorker, // Only fetch for workers
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pendingBackjobsCount = backjobsData?.backjobs?.length || 0;

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
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
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
  console.log("📋 Current user profile ID:", user?.profile_data?.id);
  console.log("📋 Active tab:", activeTab);
  jobs.forEach((job, index) => {
    console.log(`  Job ${index + 1}:`, {
      id: job.job_id,
      title: job.title?.substring(0, 20),
      job_type: job.job_type,
      invite_status: job.invite_status,
      assigned_worker_id: job.assigned_worker_id,
      assigned_agency_id: job.assigned_agency_id,
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
      // Pending: INVITE type job requests that already have an assignee (worker or agency)
      if (!isClient) {
        return false;
      }

      const hasAssignee = Boolean(
        job.assigned_worker_id || job.assigned_agency_id
      );

      if (!(job.job_type === "INVITE" && hasAssignee)) {
        return false;
      }

      // Prefer invite_status when populated, fallback to status for backwards compatibility
      if (job.invite_status) {
        return job.invite_status === "PENDING";
      }

      return job.status === "ACTIVE";
    }
    if (activeTab === "requests") {
      // Requests: INVITE type jobs assigned to this worker (worker job invitations)
      if (!isWorker) {
        console.log("  ❌ Not a worker, skipping requests filter");
        return false;
      }

      console.log(`\n  🔍 Checking job ${job.job_id} for requests tab:`);
      console.log(`     job_type: "${job.job_type}" (expected: "INVITE")`);
      console.log(`     assigned_worker_id: ${job.assigned_worker_id}`);
      console.log(`     my profile id: ${user?.profile_data?.id}`);
      console.log(
        `     invite_status: "${job.invite_status}" (expected: "PENDING")`
      );
      console.log(`     status: "${job.status}"`);

      // Must be INVITE type with this worker assigned and pending status
      const isInviteType = job.job_type === "INVITE";
      const isAssignedToMe = job.assigned_worker_id === user?.profile_data?.id;
      // Treat null invite_status as PENDING for backwards compatibility with old jobs
      const isPendingInvite =
        job.invite_status === "PENDING" ||
        (job.invite_status === null && job.status === "ACTIVE");
      const isActive = job.status === "ACTIVE";

      console.log(`     ✓ isInviteType: ${isInviteType}`);
      console.log(`     ✓ isAssignedToMe: ${isAssignedToMe}`);
      console.log(`     ✓ isPendingInvite: ${isPendingInvite}`);
      console.log(`     ✓ isActive: ${isActive}`);
      console.log(
        `     → WILL SHOW: ${isInviteType && isAssignedToMe && isPendingInvite}`
      );

      return isInviteType && isAssignedToMe && isPendingInvite;
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
      case "CANCELLED":
        return { bg: "#FEE2E2", text: "#991B1B" };
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

        {isClient && job.agency_name && (
          <View style={styles.userInfoContainer}>
            {job.agency_logo ? (
              <Image
                source={{ uri: job.agency_logo }}
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name="business"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.userTextContainer}>
              <Text style={styles.userLabel}>Agency</Text>
              <Text style={styles.userName}>{job.agency_name}</Text>
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

        {/* Request Backjob Button - Only for clients on completed jobs */}
        {isClient &&
          job.status === "COMPLETED" &&
          (job.has_backjob ? (
            // Backjob already requested - show disabled state
            <View style={styles.backjobRequestedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.backjobRequestedText}>Backjob Requested</Text>
            </View>
          ) : (
            // Allow requesting backjob
            <TouchableOpacity
              style={styles.backjobButton}
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: "/jobs/request-backjob",
                  params: { jobId: job.job_id.toString() },
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={18} color="#B45309" />
              <Text style={styles.backjobButtonText}>Request Backjob</Text>
            </TouchableOpacity>
          ))}

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
            {/* Backjobs Button - Show for workers with badge count */}
            {isWorker && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/jobs/my-backjobs" as any)}
                activeOpacity={0.7}
              >
                <View>
                  <Ionicons
                    name="alert-circle-outline"
                    size={22}
                    color={Colors.warning}
                  />
                  {pendingBackjobsCount > 0 && (
                    <View style={styles.backjobBadge}>
                      <Text style={styles.backjobBadgeText}>
                        {pendingBackjobsCount > 9 ? "9+" : pendingBackjobsCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
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
            {/* Post Job Button - Always visible for clients */}
            {isClient && (
              <TouchableOpacity
                style={styles.postJobButton}
                onPress={() => setShowJobTypeModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.postJobButtonText}>Post</Text>
              </TouchableOpacity>
            )}
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
              style={[styles.tab, activeTab === "requests" && styles.tabActive]}
              onPress={() => setActiveTab("requests")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "requests" && styles.tabTextActive,
                ]}
              >
                Requests
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
                onPress={() => router.push("/(tabs)/" as any)}
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
                  : activeTab === "requests"
                    ? "No job invitations yet"
                    : activeTab === "inProgress"
                      ? "No jobs in progress"
                      : "No completed jobs yet"}
            </Text>
            {activeTab === "open" && isClient && (
              <TouchableOpacity
                style={styles.createJobButton}
                onPress={() => setShowJobTypeModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.createJobButtonText}>Post a Job</Text>
              </TouchableOpacity>
            )}
            {activeTab === "pending" && isClient && (
              <TouchableOpacity
                style={styles.createJobButton}
                onPress={() => router.push("/(tabs)/" as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={20} color={Colors.white} />
                <Text style={styles.createJobButtonText}>Browse Workers</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.jobsList}>
            {filteredJobs.map((job) => renderJobCard(job))}
          </View>
        )}
      </ScrollView>

      {/* Job Type Selector Modal */}
      <Modal
        visible={showJobTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJobTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Job Type</Text>
              <TouchableOpacity
                onPress={() => setShowJobTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Job Type Options */}
            <View style={styles.jobTypeOptions}>
              {/* Single Job Option */}
              <TouchableOpacity
                style={styles.jobTypeCard}
                onPress={() => {
                  setShowJobTypeModal(false);
                  router.push("/jobs/create" as any);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.jobTypeIcon,
                    { backgroundColor: Colors.primary + "20" },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={32}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.jobTypeContent}>
                  <Text style={styles.jobTypeTitle}>Single Worker Job</Text>
                  <Text style={styles.jobTypeDescription}>
                    Hire one worker for a specific task
                  </Text>
                  <View style={styles.jobTypeFeatures}>
                    <View style={styles.jobTypeFeature}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.jobTypeFeatureText}>
                        Quick posting
                      </Text>
                    </View>
                    <View style={styles.jobTypeFeature}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.jobTypeFeatureText}>
                        Direct communication
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Team Job Option */}
              <TouchableOpacity
                style={styles.jobTypeCard}
                onPress={() => {
                  setShowJobTypeModal(false);
                  router.push("/jobs/create/team" as any);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.jobTypeIcon,
                    { backgroundColor: Colors.success + "20" },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={32}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.jobTypeContent}>
                  <Text style={styles.jobTypeTitle}>Team Job</Text>
                  <Text style={styles.jobTypeDescription}>
                    Hire multiple workers for different tasks
                  </Text>
                  <View style={styles.jobTypeFeatures}>
                    <View style={styles.jobTypeFeature}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.jobTypeFeatureText}>
                        Multiple specializations
                      </Text>
                    </View>
                    <View style={styles.jobTypeFeature}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={Colors.success}
                      />
                      <Text style={styles.jobTypeFeatureText}>
                        Flexible budget allocation
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  postJobButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 4,
    height: 40,
  },
  postJobButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
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
  backjobButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: 6,
  },
  backjobButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B45309",
  },
  backjobRequestedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: 6,
  },
  backjobRequestedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  backjobBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  backjobBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  // Job Type Selector Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    width: "100%",
    maxWidth: 500,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  jobTypeOptions: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  jobTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  jobTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  jobTypeContent: {
    flex: 1,
  },
  jobTypeTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  jobTypeDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  jobTypeFeatures: {
    gap: 4,
  },
  jobTypeFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  jobTypeFeatureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});

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
import { ENDPOINTS } from "@/lib/api/config";

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  job_category: string;
  job_budget: string;
  proposed_budget: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  proposal_message: string;
  estimated_duration: string | null;
  applied_at: string;
  client: {
    name: string;
    avatar: string;
  };
}

export default function MyApplicationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const isWorker = user?.profile_data?.profileType === "WORKER";

  // Fetch applications
  const {
    data: applications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Application[]>({
    queryKey: ["applications", "my"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.MY_APPLICATIONS, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();
      return data.applications || [];
    },
    enabled: isWorker,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}` as any);
  };

  // Filter applications by status
  const filteredApplications = selectedStatus
    ? applications.filter((app) => app.status === selectedStatus)
    : applications;

  // Count by status
  const statusCounts = {
    PENDING: applications.filter((app) => app.status === "PENDING").length,
    ACCEPTED: applications.filter((app) => app.status === "ACCEPTED").length,
    REJECTED: applications.filter((app) => app.status === "REJECTED").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return { bg: "#D1FAE5", text: "#065F46", icon: "checkmark-circle" };
      case "REJECTED":
        return { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle" };
      case "PENDING":
      default:
        return { bg: "#FEF3C7", text: "#92400E", icon: "time" };
    }
  };

  if (!isWorker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>
            This feature is only available for worker accounts
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
          <Text style={styles.headerTitle}>My Applications</Text>
          <Text style={styles.headerSubtitle}>
            {applications.length}{" "}
            {applications.length === 1 ? "application" : "applications"}
          </Text>
        </View>

        {/* Status Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !selectedStatus && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                !selectedStatus && styles.filterChipTextActive,
              ]}
            >
              All ({applications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStatus === "PENDING" && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus("PENDING")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === "PENDING" && styles.filterChipTextActive,
              ]}
            >
              Pending ({statusCounts.PENDING})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStatus === "ACCEPTED" && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus("ACCEPTED")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === "ACCEPTED" && styles.filterChipTextActive,
              ]}
            >
              Accepted ({statusCounts.ACCEPTED})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStatus === "REJECTED" && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus("REJECTED")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === "REJECTED" && styles.filterChipTextActive,
              ]}
            >
              Rejected ({statusCounts.REJECTED})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Applications List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading applications...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={Colors.error}
            />
            <Text style={styles.errorText}>Failed to load applications</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
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
              {selectedStatus
                ? `No ${selectedStatus.toLowerCase()} applications`
                : "You haven't applied to any jobs yet"}
            </Text>
            {!selectedStatus && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/(tabs)/jobs" as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.browseButtonText}>Browse Jobs</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.applicationsList}>
            {filteredApplications.map((application) => {
              const statusInfo = getStatusColor(application.status);

              return (
                <TouchableOpacity
                  key={application.id}
                  style={styles.applicationCard}
                  onPress={() => handleViewJob(application.job_id)}
                  activeOpacity={0.8}
                >
                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.bg },
                    ]}
                  >
                    <Ionicons
                      name={statusInfo.icon as any}
                      size={16}
                      color={statusInfo.text}
                    />
                    <Text
                      style={[styles.statusText, { color: statusInfo.text }]}
                    >
                      {application.status}
                    </Text>
                  </View>

                  {/* Job Info */}
                  <View style={styles.applicationHeader}>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {application.job_title}
                    </Text>
                    <Text style={styles.jobCategory}>
                      {application.job_category}
                    </Text>
                  </View>

                  {/* Budget Info */}
                  <View style={styles.budgetInfo}>
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Job Budget</Text>
                      <Text style={styles.budgetValue}>
                        {application.job_budget}
                      </Text>
                    </View>
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Your Proposal</Text>
                      <Text style={[styles.budgetValue, styles.proposedBudget]}>
                        {application.proposed_budget}
                      </Text>
                    </View>
                  </View>

                  {/* Proposal Message */}
                  <Text style={styles.proposalLabel}>Proposal</Text>
                  <Text style={styles.proposalMessage} numberOfLines={3}>
                    {application.proposal_message}
                  </Text>

                  {/* Client Info */}
                  <View style={styles.clientInfo}>
                    <Image
                      source={{
                        uri:
                          application.client.avatar ||
                          "https://via.placeholder.com/32",
                      }}
                      style={styles.clientAvatar}
                    />
                    <View style={styles.clientDetails}>
                      <Text style={styles.clientName}>
                        {application.client.name}
                      </Text>
                      <Text style={styles.appliedTime}>
                        Applied {application.applied_at}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() =>
                        router.push(`/applications/${application.id}` as any)
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="eye-outline"
                        size={16}
                        color={Colors.primary}
                      />
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.viewJobButton}
                      onPress={() => handleViewJob(application.job_id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewJobText}>View Job</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  applicationsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  applicationCard: {
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
  applicationHeader: {
    marginBottom: Spacing.md,
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
  },
  budgetInfo: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  budgetItem: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  proposedBudget: {
    color: Colors.primary,
  },
  proposalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  proposalMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  appliedTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewDetailsText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  viewJobButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  viewJobText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
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
    fontSize: Typography.fontSize.md,
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
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  browseButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  browseButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
});

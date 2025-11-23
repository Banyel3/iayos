// Application Detail Screen
// Shows detailed information about a job application with timeline and actions

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";

// ===== TYPES =====

interface ApplicationDetail {
  id: number;
  jobId: number;
  jobTitle: string;
  jobCategory: string;
  jobBudget: number;
  jobDescription: string;
  jobLocation: string;
  proposedBudget: number;
  proposalMessage: string;
  estimatedDuration: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  respondedAt: string | null;
  client: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  timeline: Array<{
    id: number;
    action: string;
    timestamp: string;
    description: string;
  }>;
}

// ===== HELPER FUNCTIONS =====

/**
 * Format currency value to PHP format
 */
const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
};

/**
 * Format date to relative time
 */
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
};

/**
 * Get status badge styling
 */
const getStatusStyle = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return {
        bg: Colors.successLight,
        text: Colors.success,
        icon: "checkmark-circle" as const,
        label: "Accepted",
      };
    case "REJECTED":
      return {
        bg: Colors.errorLight,
        text: Colors.error,
        icon: "close-circle" as const,
        label: "Rejected",
      };
    case "WITHDRAWN":
      return {
        bg: Colors.backgroundSecondary,
        text: Colors.textSecondary,
        icon: "arrow-back-circle" as const,
        label: "Withdrawn",
      };
    case "PENDING":
    default:
      return {
        bg: Colors.warningLight,
        text: Colors.warning,
        icon: "time" as const,
        label: "Pending",
      };
  }
};

// ===== MAIN COMPONENT =====

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();

  // Fetch application detail
  const {
    data: application,
    isLoading,
    error,
  } = useQuery<ApplicationDetail>({
    queryKey: ["application-detail", id],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.APPLICATION_DETAIL(Number(id)));
      if (!response.ok) {
        throw new Error("Failed to fetch application details");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Withdraw application mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.WITHDRAW_APPLICATION(Number(id)), {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to withdraw application");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] });

      Alert.alert("Success", "Application withdrawn successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Handle withdraw
  const handleWithdraw = () => {
    Alert.alert(
      "Withdraw Application",
      "Are you sure you want to withdraw this application? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: () => withdrawMutation.mutate(),
        },
      ]
    );
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading application details...</Text>
      </View>
    );
  }

  // ===== ERROR STATE =====
  if (error || !application) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load application</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusStyle = getStatusStyle(application.status);
  const canWithdraw = application.status === "PENDING";

  // ===== MAIN CONTENT =====
  return (
    <View style={styles.container}>
      {/* Header with Status */}
      <View style={styles.header}>
        <Pressable style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View
          style={[styles.statusBadgeLarge, { backgroundColor: statusStyle.bg }]}
        >
          <Ionicons
            name={statusStyle.icon}
            size={24}
            color={statusStyle.text}
          />
          <Text style={[styles.statusTextLarge, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Information</Text>
          <View style={styles.card}>
            <Text style={styles.jobTitle}>{application.jobTitle}</Text>
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText}>{application.jobCategory}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText}>{application.jobLocation}</Text>
              </View>
            </View>
            <Text style={styles.jobDescription}>
              {application.jobDescription}
            </Text>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Job Budget:</Text>
              <Text style={styles.budgetValue}>
                {formatCurrency(application.jobBudget)}
              </Text>
            </View>
          </View>
        </View>

        {/* Your Application */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Application</Text>
          <View style={styles.card}>
            <View style={styles.proposalRow}>
              <Text style={styles.proposalLabel}>Your Proposal:</Text>
              <Text style={styles.proposalValue}>
                {formatCurrency(application.proposedBudget)}
              </Text>
            </View>
            {application.estimatedDuration && (
              <View style={styles.durationRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.durationText}>
                  {application.estimatedDuration}
                </Text>
              </View>
            )}
            <Text style={styles.proposalMessage}>
              {application.proposalMessage}
            </Text>
            <View style={styles.appliedInfo}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.appliedText}>
                Applied {formatTimeAgo(application.appliedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.card}>
            <View style={styles.clientRow}>
              <View style={styles.clientAvatar}>
                {application.client.avatar ? (
                  <Ionicons
                    name="person"
                    size={24}
                    color={Colors.textSecondary}
                  />
                ) : (
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={Colors.textSecondary}
                  />
                )}
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{application.client.name}</Text>
                <Text style={styles.clientEmail}>
                  {application.client.email}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        {application.timeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.card}>
              {application.timeline.map((event: any, index: number) => (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <View style={styles.dotInner} />
                  </View>
                  {index < application.timeline.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineAction}>{event.action}</Text>
                    <Text style={styles.timelineDescription}>
                      {event.description}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatTimeAgo(event.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Pressable
            style={styles.viewJobButton}
            onPress={() => router.push(`/jobs/${application.jobId}` as any)}
          >
            <Ionicons name="eye-outline" size={20} color={Colors.primary} />
            <Text style={styles.viewJobButtonText}>View Job</Text>
          </Pressable>

          {application.status === "ACCEPTED" && (
            <Pressable style={styles.contactButton}>
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={Colors.textLight}
              />
              <Text style={styles.contactButtonText}>Contact Client</Text>
            </Pressable>
          )}

          {canWithdraw && (
            <Pressable
              style={[
                styles.withdrawButton,
                withdrawMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <>
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color={Colors.error}
                  />
                  <Text style={styles.withdrawButtonText}>
                    Withdraw Application
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body.large,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  backButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backIcon: {
    padding: Spacing.xs,
  },
  statusBadgeLarge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.large,
  },
  statusTextLarge: {
    ...Typography.heading.h4,
    fontWeight: "600",
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },

  // Job Info
  jobTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  jobMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  jobDescription: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  budgetLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  budgetValue: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    fontWeight: "bold",
  },

  // Proposal
  proposalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  proposalLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  proposalValue: {
    ...Typography.heading.h3,
    color: Colors.primary,
    fontWeight: "bold",
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  durationText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  proposalMessage: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  appliedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  appliedText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Client
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...Typography.body.large,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  clientEmail: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Timeline
  timelineItem: {
    flexDirection: "row",
    paddingBottom: Spacing.md,
    position: "relative",
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    zIndex: 1,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    position: "absolute",
    left: 11,
    top: 24,
    width: 2,
    height: "100%",
    backgroundColor: Colors.border,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineAction: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  timelineDescription: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timelineTime: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontSize: 12,
  },

  // Actions
  actionsSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  viewJobButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.large,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  viewJobButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
  },
  contactButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  withdrawButtonText: {
    ...Typography.body.medium,
    color: Colors.error,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

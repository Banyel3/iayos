/**
 * Client Job Applications Screen
 *
 * Shows all applicants for a specific job posting
 *
 * Features:
 * - List of all applicants with details
 * - Accept/Reject actions
 * - View worker profile
 * - Pull-to-refresh
 * - Empty state
 * - Confirmation modals
 */

import React, { useState } from "react";
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
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useJobApplications,
  useManageApplication,
} from "@/lib/hooks/useJobApplications";
import ApplicantCard from "@/components/Client/ApplicantCard";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonCard from "@/components/ui/SkeletonCard";
import Button from "@/components/ui/Button";

export default function JobApplicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = parseInt(params.jobId as string);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<{
    id: number;
    workerName: string;
    action: "ACCEPTED" | "REJECTED";
  } | null>(null);

  // Fetch job applications
  const {
    data: applicationsData,
    isLoading,
    error,
    refetch,
  } = useJobApplications(jobId);

  // Manage application mutation
  const manageMutation = useManageApplication();

  const applications = applicationsData?.applications || [];
  const jobTitle = applicationsData?.job_title || "Job";
  const platformEstimate = applicationsData?.estimated_completion || null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleViewProfile = (workerId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/worker/${workerId}` as any);
  };

  const handleAccept = (applicationId: number, workerName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedApplication({
      id: applicationId,
      workerName,
      action: "ACCEPTED",
    });
  };

  const handleReject = (applicationId: number, workerName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedApplication({
      id: applicationId,
      workerName,
      action: "REJECTED",
    });
  };

  const confirmAction = async () => {
    if (!selectedApplication) return;

    try {
      await manageMutation.mutateAsync({
        jobId,
        applicationId: selectedApplication.id,
        action: selectedApplication.action,
      });

      setSelectedApplication(null);

      Alert.alert(
        "Success",
        `Application ${selectedApplication.action.toLowerCase()} successfully!`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update application", [
        { text: "OK" },
      ]);
    }
  };

  const cancelAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedApplication(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => safeGoBack(router, "/(tabs)/jobs")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {jobTitle}
          </Text>
          {applications.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{applications.length}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load applications</Text>
          <Text style={styles.errorSubtext}>
            Please check your connection and try again
          </Text>
          <Button onPress={() => refetch()} variant="primary">
            Retry
          </Button>
        </View>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No applications yet"
          message="Workers haven't applied to this job yet. Check back later!"
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        >
          {applications.map((application: any) => (
            <ApplicantCard
              key={application.id}
              application={application}
              platformEstimate={platformEstimate}
              onViewProfile={() => handleViewProfile(application.worker.id)}
              onAccept={() =>
                handleAccept(application.id, application.worker.name)
              }
              onReject={() =>
                handleReject(application.id, application.worker.name)
              }
            />
          ))}
        </ScrollView>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={selectedApplication !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelAction}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons
                name={
                  selectedApplication?.action === "ACCEPTED"
                    ? "checkmark-circle-outline"
                    : "close-circle-outline"
                }
                size={48}
                color={
                  selectedApplication?.action === "ACCEPTED"
                    ? Colors.success
                    : Colors.error
                }
              />
            </View>

            <Text style={styles.modalTitle}>
              {selectedApplication?.action === "ACCEPTED"
                ? "Accept Application?"
                : "Reject Application?"}
            </Text>

            <Text style={styles.modalMessage}>
              {selectedApplication?.action === "ACCEPTED"
                ? `Are you sure you want to accept ${selectedApplication?.workerName}'s application? They will be notified immediately.`
                : `Are you sure you want to reject ${selectedApplication?.workerName}'s application? This action cannot be undone.`}
            </Text>

            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={cancelAction}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                variant={
                  selectedApplication?.action === "ACCEPTED"
                    ? "primary"
                    : "danger"
                }
                onPress={confirmAction}
                style={styles.modalButton}
                disabled={manageMutation.isPending}
              >
                {manageMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : selectedApplication?.action === "ACCEPTED" ? (
                  "Accept"
                ) : (
                  "Reject"
                )}
              </Button>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    maxWidth: "70%",
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
  listContainer: {
    padding: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body.large,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  errorSubtext: {
    ...Typography.body.medium,
    color: Colors.textHint,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 400,
    ...Shadows.lg,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

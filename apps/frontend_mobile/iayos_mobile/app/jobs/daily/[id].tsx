/**
 * Daily Job Detail Screen
 * Shows comprehensive view of a daily rate job with attendance tracking,
 * extensions, rate changes, and escrow management.
 */
import React, { useState, useCallback } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
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
import { format, parseISO } from "date-fns";
import {
  useDailyAttendance,
  useDailySummary,
  useDailyExtensions,
  useDailyRateChanges,
  useLogAttendance,
  useConfirmAttendanceWorker,
  useConfirmAttendanceClient,
  useRequestExtension,
  useApproveExtension,
  useRequestRateChange,
  useApproveRateChange,
  useCancelDailyJob,
  type DailyAttendance,
  type DailyExtension,
  type DailyRateChange,
  type AttendanceStatus,
} from "@/lib/hooks/useDailyPayment";
import {
  DailyJobSummaryCard,
  AttendanceCard,
  LogAttendanceModal,
  ConfirmAttendanceModal,
  RequestExtensionModal,
  RequestRateChangeModal,
} from "@/components/daily";

// ============================================================================
// Types
// ============================================================================

interface DailyJobDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: string;
  daily_rate: number;
  estimated_duration: number;
  location_city: string;
  location_barangay: string;
  status: string;
  urgency_level: string;
  start_date: string;
  client: {
    id: number;
    name: string;
    avatar: string;
    phone: string;
  };
  worker: {
    id: number;
    name: string;
    avatar: string;
    phone: string;
  } | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
};

// ============================================================================
// Component
// ============================================================================

export default function DailyJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Parse jobId to number for API calls
  const jobId = id ? parseInt(id, 10) : 0;

  // Modal states
  const [showLogAttendance, setShowLogAttendance] = useState(false);
  const [showConfirmAttendance, setShowConfirmAttendance] = useState(false);
  const [showRequestExtension, setShowRequestExtension] = useState(false);
  const [showRequestRateChange, setShowRequestRateChange] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<DailyAttendance | null>(null);
  const [activeTab, setActiveTab] = useState<"attendance" | "extensions" | "rates">("attendance");

  // Determine user role from profile_data
  const profileType = user?.profile_data?.profileType;
  const isWorker = profileType === "WORKER";
  const isClient = profileType === "CLIENT";

  // Fetch job details
  const {
    data: job,
    isLoading: isLoadingJob,
    refetch: refetchJob,
  } = useQuery<DailyJobDetail>({
    queryKey: ["daily-job-detail", jobId],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.JOB_DETAILS(jobId));
      const data = await response.json();
      return data as DailyJobDetail;
    },
    enabled: jobId > 0,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch daily payment data - hooks take number parameters
  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useDailySummary(jobId);
  const { data: attendanceRecords, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useDailyAttendance(jobId);
  const { data: extensions, refetch: refetchExtensions } = useDailyExtensions(jobId);
  const { data: rateChanges, refetch: refetchRateChanges } = useDailyRateChanges(jobId);

  // Mutations - these are hooks, we use mutateAsync with the payload
  const logAttendanceMutation = useLogAttendance();
  const confirmWorkerMutation = useConfirmAttendanceWorker();
  const confirmClientMutation = useConfirmAttendanceClient();
  const requestExtensionMutation = useRequestExtension();
  const approveExtensionMutation = useApproveExtension();
  const requestRateChangeMutation = useRequestRateChange();
  const approveRateChangeMutation = useApproveRateChange();
  const cancelJobMutation = useCancelDailyJob();

  // Refresh handler
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchJob(),
      refetchSummary(),
      refetchAttendance(),
      refetchExtensions(),
      refetchRateChanges(),
    ]);
    setRefreshing(false);
  }, [refetchJob, refetchSummary, refetchAttendance, refetchExtensions, refetchRateChanges]);

  // Handlers
  const handleLogAttendance = async (data: {
    date: string;
    status: AttendanceStatus;
    time_in?: string;
    time_out?: string;
    notes?: string;
  }) => {
    try {
      await logAttendanceMutation.mutateAsync({
        jobId,
        work_date: data.date,
        status: data.status,
        time_in: data.time_in,
        time_out: data.time_out,
        notes: data.notes,
      });
      setShowLogAttendance(false);
      Alert.alert("Success", "Attendance logged successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to log attendance";
      Alert.alert("Error", message);
    }
  };

  const handleConfirmAttendance = async (
    attendanceId: number,
    adjustedStatus?: AttendanceStatus
  ) => {
    try {
      if (isWorker) {
        await confirmWorkerMutation.mutateAsync({ jobId, attendanceId });
      } else {
        await confirmClientMutation.mutateAsync({
          jobId,
          attendanceId,
          approved_status: adjustedStatus,
        });
      }
      setShowConfirmAttendance(false);
      setSelectedAttendance(null);
      Alert.alert("Success", "Attendance confirmed");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to confirm attendance";
      Alert.alert("Error", message);
    }
  };

  const handleRequestExtension = async (additionalDays: number, reason: string) => {
    try {
      await requestExtensionMutation.mutateAsync({
        jobId,
        additional_days: additionalDays,
        reason,
      });
      setShowRequestExtension(false);
      Alert.alert("Success", "Extension request sent");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to request extension";
      Alert.alert("Error", message);
    }
  };

  const handleApproveExtension = async (extensionId: number) => {
    Alert.alert(
      "Approve Extension",
      "Are you sure you want to approve this extension?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await approveExtensionMutation.mutateAsync({ jobId, extensionId });
              Alert.alert("Success", "Extension approved");
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : "Failed to approve extension";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  };

  const handleRequestRateChange = async (
    newRate: number,
    reason: string,
    effectiveDate: string
  ) => {
    try {
      await requestRateChangeMutation.mutateAsync({
        jobId,
        new_rate: newRate,
        reason,
        effective_date: effectiveDate,
      });
      setShowRequestRateChange(false);
      Alert.alert("Success", "Rate change request sent");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to request rate change";
      Alert.alert("Error", message);
    }
  };

  const handleApproveRateChange = async (rateChangeId: number) => {
    Alert.alert(
      "Approve Rate Change",
      "Are you sure you want to approve this rate change?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await approveRateChangeMutation.mutateAsync({ jobId, changeId: rateChangeId });
              Alert.alert("Success", "Rate change approved");
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : "Failed to approve rate change";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  };

  const handleCancelJob = () => {
    Alert.alert(
      "Cancel Daily Job",
      "Are you sure you want to cancel this job? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel Job",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelJobMutation.mutateAsync({ jobId });
              Alert.alert("Success", "Job cancelled");
              safeGoBack(router, "/(tabs)/jobs");
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : "Failed to cancel job";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  };

  const handleAttendanceAction = (attendance: DailyAttendance) => {
    setSelectedAttendance(attendance);
    setShowConfirmAttendance(true);
  };

  // Loading state
  if (isLoadingJob || isLoadingSummary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Job not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => safeGoBack(router, "/(tabs)/jobs")}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const attendanceList = attendanceRecords?.records || [];
  const extensionList = extensions?.extensions || [];
  const rateChangeList = rateChanges?.rate_changes || [];

  // Calculate pending items requiring action
  const pendingAttendance = attendanceList.filter(
    (a: DailyAttendance) => (isWorker && !a.worker_confirmed) || (isClient && !a.client_confirmed)
  );
  const pendingExtensions = extensionList.filter(
    (e: DailyExtension) => e.status === "PENDING"
  );
  const pendingRateChanges = rateChangeList.filter(
    (r: DailyRateChange) => r.status === "PENDING"
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => safeGoBack(router, "/(tabs)/jobs")}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.dailyBadge}>
            <Ionicons name="calendar" size={14} color={Colors.white} />
            <Text style={styles.dailyBadgeText}>Daily Rate</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {job.title}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerMenuButton} onPress={handleCancelJob}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Summary Card */}
        {summary && (
          <DailyJobSummaryCard summary={summary} isWorker={isWorker} />
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "attendance" && styles.tabActive]}
            onPress={() => setActiveTab("attendance")}
          >
            <Ionicons
              name="time"
              size={18}
              color={activeTab === "attendance" ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === "attendance" && styles.tabTextActive]}>
              Attendance
            </Text>
            {pendingAttendance.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingAttendance.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "extensions" && styles.tabActive]}
            onPress={() => setActiveTab("extensions")}
          >
            <Ionicons
              name="add-circle"
              size={18}
              color={activeTab === "extensions" ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === "extensions" && styles.tabTextActive]}>
              Extensions
            </Text>
            {pendingExtensions.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingExtensions.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "rates" && styles.tabActive]}
            onPress={() => setActiveTab("rates")}
          >
            <Ionicons
              name="swap-horizontal"
              size={18}
              color={activeTab === "rates" ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === "rates" && styles.tabTextActive]}>
              Rate Changes
            </Text>
            {pendingRateChanges.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingRateChanges.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "attendance" && (
          <View style={styles.tabContent}>
            {isLoadingAttendance ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : attendanceList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>No attendance records yet</Text>
                {isWorker && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => setShowLogAttendance(true)}
                  >
                    <Text style={styles.emptyStateButtonText}>Log Attendance</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              attendanceList.map((attendance: DailyAttendance) => (
                <AttendanceCard
                  key={attendance.attendance_id}
                  attendance={attendance}
                  isWorker={isWorker}
                  onConfirm={() => handleAttendanceAction(attendance)}
                />
              ))
            )}
          </View>
        )}

        {activeTab === "extensions" && (
          <View style={styles.tabContent}>
            {extensionList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="add-circle-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>No extension requests</Text>
              </View>
            ) : (
              extensionList.map((extension: DailyExtension) => (
                <ExtensionCard
                  key={extension.extension_id}
                  extension={extension}
                  isWorker={isWorker}
                  onApprove={() => handleApproveExtension(extension.extension_id)}
                />
              ))
            )}
          </View>
        )}

        {activeTab === "rates" && (
          <View style={styles.tabContent}>
            {rateChangeList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="swap-horizontal-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>No rate change requests</Text>
              </View>
            ) : (
              rateChangeList.map((rateChange: DailyRateChange) => (
                <RateChangeCard
                  key={rateChange.change_id}
                  rateChange={rateChange}
                  isWorker={isWorker}
                  onApprove={() => handleApproveRateChange(rateChange.change_id)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB Buttons */}
      <View style={styles.fabContainer}>
        {isWorker && activeTab === "attendance" && (
          <TouchableOpacity
            style={[styles.fab, styles.fabPrimary]}
            onPress={() => setShowLogAttendance(true)}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
            <Text style={styles.fabText}>Log Attendance</Text>
          </TouchableOpacity>
        )}

        {activeTab === "extensions" && (
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            onPress={() => setShowRequestExtension(true)}
          >
            <Ionicons name="add-circle" size={24} color={Colors.white} />
            <Text style={styles.fabText}>Request Extension</Text>
          </TouchableOpacity>
        )}

        {activeTab === "rates" && (
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            onPress={() => setShowRequestRateChange(true)}
          >
            <Ionicons name="swap-horizontal" size={24} color={Colors.white} />
            <Text style={styles.fabText}>Request Rate Change</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <LogAttendanceModal
        visible={showLogAttendance}
        onClose={() => setShowLogAttendance(false)}
        onSubmit={(data) => handleLogAttendance({
          date: data.work_date,
          status: data.status,
          time_in: data.time_in,
          time_out: data.time_out,
          notes: data.notes,
        })}
        dailyRate={summary?.daily_rate || 0}
        isSubmitting={logAttendanceMutation.isPending}
      />

      <ConfirmAttendanceModal
        visible={showConfirmAttendance}
        onClose={() => {
          setShowConfirmAttendance(false);
          setSelectedAttendance(null);
        }}
        onConfirm={(adjustedStatus) => {
          if (selectedAttendance) {
            handleConfirmAttendance(selectedAttendance.attendance_id, adjustedStatus);
          }
        }}
        attendance={selectedAttendance}
        dailyRate={summary?.daily_rate || 0}
        isSubmitting={confirmWorkerMutation.isPending || confirmClientMutation.isPending}
      />

      <RequestExtensionModal
        visible={showRequestExtension}
        onClose={() => setShowRequestExtension(false)}
        onSubmit={handleRequestExtension}
        dailyRate={summary?.daily_rate || 0}
        currentDuration={summary?.duration_days || 0}
        daysWorked={summary?.days_worked || 0}
        isSubmitting={requestExtensionMutation.isPending}
      />

      <RequestRateChangeModal
        visible={showRequestRateChange}
        onClose={() => setShowRequestRateChange(false)}
        onSubmit={handleRequestRateChange}
        currentRate={summary?.daily_rate || 0}
        remainingDays={summary?.remaining_days || 0}
        isWorker={isWorker}
        isSubmitting={requestRateChangeMutation.isPending}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ExtensionCardProps {
  extension: DailyExtension;
  isWorker: boolean;
  onApprove: () => void;
}

function ExtensionCard({ extension, isWorker, onApprove }: ExtensionCardProps) {
  const isPending = extension.status === "PENDING";
  const canApprove = isPending && (
    (isWorker && extension.requested_by === "CLIENT") ||
    (!isWorker && extension.requested_by === "WORKER")
  );

  const getStatusColor = (status: string) => {
    if (status === "APPROVED") return Colors.success;
    if (status === "REJECTED") return Colors.error;
    return Colors.warning;
  };

  const getStatusBgColor = (status: string) => {
    if (status === "APPROVED") return `${Colors.success}20`;
    if (status === "REJECTED") return `${Colors.error}20`;
    return `${Colors.warning}20`;
  };

  return (
    <View style={extensionStyles.card}>
      <View style={extensionStyles.header}>
        <View style={extensionStyles.daysContainer}>
          <Text style={extensionStyles.daysValue}>+{extension.additional_days}</Text>
          <Text style={extensionStyles.daysLabel}>days</Text>
        </View>
        <View style={[extensionStyles.statusBadge, { backgroundColor: getStatusBgColor(extension.status) }]}>
          <Text style={[extensionStyles.statusText, { color: getStatusColor(extension.status) }]}>
            {extension.status}
          </Text>
        </View>
      </View>

      <Text style={extensionStyles.reason} numberOfLines={2}>
        {extension.reason}
      </Text>

      <View style={extensionStyles.footer}>
        <Text style={extensionStyles.requestedBy}>
          Requested by {extension.requested_by.toLowerCase()}
        </Text>
        <Text style={extensionStyles.date}>
          {formatDate(extension.created_at)}
        </Text>
      </View>

      {canApprove && (
        <TouchableOpacity style={extensionStyles.approveButton} onPress={onApprove}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
          <Text style={extensionStyles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface RateChangeCardProps {
  rateChange: DailyRateChange;
  isWorker: boolean;
  onApprove: () => void;
}

function RateChangeCard({ rateChange, isWorker, onApprove }: RateChangeCardProps) {
  const isPending = rateChange.status === "PENDING";
  const canApprove = isPending && (
    (isWorker && rateChange.requested_by === "CLIENT") ||
    (!isWorker && rateChange.requested_by === "WORKER")
  );

  const getStatusColor = (status: string) => {
    if (status === "APPROVED") return Colors.success;
    if (status === "REJECTED") return Colors.error;
    return Colors.warning;
  };

  const getStatusBgColor = (status: string) => {
    if (status === "APPROVED") return `${Colors.success}20`;
    if (status === "REJECTED") return `${Colors.error}20`;
    return `${Colors.warning}20`;
  };

  return (
    <View style={rateChangeStyles.card}>
      <View style={rateChangeStyles.header}>
        <View style={rateChangeStyles.ratesContainer}>
          <Text style={rateChangeStyles.oldRate}>₱{formatCurrency(rateChange.old_rate)}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
          <Text style={rateChangeStyles.newRate}>₱{formatCurrency(rateChange.new_rate)}</Text>
        </View>
        <View style={[rateChangeStyles.statusBadge, { backgroundColor: getStatusBgColor(rateChange.status) }]}>
          <Text style={[rateChangeStyles.statusText, { color: getStatusColor(rateChange.status) }]}>
            {rateChange.status}
          </Text>
        </View>
      </View>

      <Text style={rateChangeStyles.reason} numberOfLines={2}>
        {rateChange.reason}
      </Text>

      <View style={rateChangeStyles.footer}>
        <Text style={rateChangeStyles.effectiveDate}>
          Effective: {formatDate(rateChange.effective_date)}
        </Text>
        <Text style={rateChangeStyles.requestedBy}>
          By {rateChange.requested_by.toLowerCase()}
        </Text>
      </View>

      {canApprove && (
        <TouchableOpacity style={rateChangeStyles.approveButton} onPress={onApprove}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
          <Text style={rateChangeStyles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Main Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  dailyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  dailyBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  tabActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  tabBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyStateButton: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  emptyStateButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },

  // FAB
  fabContainer: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.md,
    left: Spacing.md,
    alignItems: "flex-end",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  fabPrimary: {
    backgroundColor: Colors.primary,
  },
  fabSecondary: {
    backgroundColor: Colors.primaryLight,
  },
  fabText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },
});

// ============================================================================
// Extension Card Styles
// ============================================================================

const extensionStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  daysValue: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  daysLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  reason: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  requestedBy: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  date: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  approveButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },
});

// ============================================================================
// Rate Change Card Styles
// ============================================================================

const rateChangeStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  ratesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  oldRate: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  newRate: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  reason: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  effectiveDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  requestedBy: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  approveButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },
});

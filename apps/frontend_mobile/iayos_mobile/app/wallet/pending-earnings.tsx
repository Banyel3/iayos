/**
 * Pending Earnings Screen (Due Balance)
 *
 * Displays all payments held in the 7-day buffer period.
 * Workers can see:
 * - Total pending amount
 * - Individual job payments with release dates
 * - Backjob status indicators
 * - Buffer period explanation
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { usePendingEarnings, PendingEarningItem } from "@/lib/hooks/useWallet";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function PendingEarningsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: pendingData, isLoading, error, refetch } = usePendingEarnings();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getHeldReasonText = (item: PendingEarningItem): string => {
    if (item.has_active_backjob) {
      return "On hold - Backjob request pending review";
    }
    if (item.days_until_release > 0) {
      return `Releases in ${item.days_until_release} day${item.days_until_release !== 1 ? "s" : ""}`;
    }
    return "Releasing soon...";
  };

  const getStatusColor = (item: PendingEarningItem): string => {
    if (item.has_active_backjob) return Colors.error;
    if (item.days_until_release <= 1) return Colors.success;
    return Colors.info;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => safeGoBack(router, "/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Due Balance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Failed to load pending earnings"
            message="Please try again later"
          />
        ) : !pendingData || pendingData.count === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="No pending earnings"
            message="Completed job payments will appear here during the 7-day hold period"
          />
        ) : (
          <>
            {/* Summary Card */}
            <Card style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Ionicons
                  name="hourglass-outline"
                  size={32}
                  color={Colors.warning}
                />
              </View>
              <Text style={styles.summaryLabel}>Total Due Balance</Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(pendingData.total_pending)}
              </Text>
              <Text style={styles.summaryCount}>
                {pendingData.count} pending payment
                {pendingData.count !== 1 ? "s" : ""}
              </Text>
            </Card>

            {/* Info Banner */}
            <Card style={styles.infoBanner}>
              <View style={styles.infoBannerHeader}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={Colors.info}
                />
                <Text style={styles.infoBannerTitle}>
                  {pendingData.buffer_days}-Day Hold Period
                </Text>
              </View>
              <Text style={styles.infoBannerText}>
                {pendingData.info_message}
              </Text>
            </Card>

            {/* Pending Payments List */}
            <Text style={styles.sectionTitle}>Pending Payments</Text>

            {pendingData.pending_earnings.map((item) => (
              <Card key={item.transaction_id} style={styles.pendingCard}>
                <View style={styles.pendingCardHeader}>
                  <View style={styles.jobTitleContainer}>
                    <Ionicons
                      name="briefcase-outline"
                      size={18}
                      color={Colors.textSecondary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {item.job_title}
                    </Text>
                  </View>
                  <Text style={styles.pendingAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>

                <View style={styles.pendingDetails}>
                  {/* Release Date */}
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.detailLabel}>Release Date:</Text>
                    <Text style={styles.detailValue}>
                      {item.release_date_formatted}
                    </Text>
                  </View>

                  {/* Status */}
                  <View style={styles.detailRow}>
                    <Ionicons
                      name={
                        item.has_active_backjob
                          ? "alert-circle"
                          : "time-outline"
                      }
                      size={14}
                      color={getStatusColor(item)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(item) },
                      ]}
                    >
                      {getHeldReasonText(item)}
                    </Text>
                  </View>
                </View>

                {/* Backjob Warning */}
                {item.has_active_backjob && (
                  <View style={styles.backjobWarning}>
                    <Ionicons name="warning" size={16} color={Colors.error} />
                    <Text style={styles.backjobWarningText}>
                      Payment is on hold while the client's backjob request is
                      being reviewed. You will be notified of the outcome.
                    </Text>
                  </View>
                )}

                {/* View Job Button */}
                <TouchableOpacity
                  style={styles.viewJobButton}
                  onPress={() => router.push(`/jobs/${item.job_id}` as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewJobButtonText}>View Job Details</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </Card>
            ))}
          </>
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
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  summaryCard: {
    alignItems: "center",
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderTopWidth: 4,
    borderTopColor: Colors.warning,
  },
  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.warning + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  summaryCount: {
    ...Typography.body.small,
    color: Colors.textHint,
  },
  infoBanner: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.info + "10",
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  infoBannerTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.info,
  },
  infoBannerText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  pendingCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pendingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  jobTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: Spacing.md,
  },
  jobTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.warning,
  },
  pendingDetails: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  detailLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  detailValue: {
    ...Typography.body.small,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  statusText: {
    ...Typography.body.small,
    fontWeight: "600",
    flex: 1,
  },
  backjobWarning: {
    flexDirection: "row",
    backgroundColor: Colors.error + "10",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
    alignItems: "flex-start",
  },
  backjobWarningText: {
    ...Typography.body.small,
    color: Colors.error,
    flex: 1,
    lineHeight: 18,
  },
  viewJobButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  viewJobButtonText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
    marginRight: 4,
  },
});

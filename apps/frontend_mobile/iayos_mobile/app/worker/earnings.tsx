import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, BorderRadius } from "../../constants/theme";
import { useEarningsSummary, useEarningsHistory, EarningsHistoryItem } from "../../lib/hooks/useWorkerEarnings";
import { format } from "date-fns";

export default function WorkerEarningsScreen() {
  const router = useRouter();
  const [filterPeriod, setFilterPeriod] = useState<"week" | "month" | "all">("month");

  const {
    data: summary,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useEarningsSummary();

  const {
    data: history,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useEarningsHistory({ period: filterPeriod });

  const isLoading = loadingSummary || loadingHistory;

  const handleRefresh = () => {
    refetchSummary();
    refetchHistory();
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return Colors.success;
      case "pending":
        return Colors.warning;
      case "failed":
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "failed":
        return "close-circle";
      default:
        return "ellipse";
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Earnings",
          headerShown: true,
          headerBackTitle: "Back",
          headerTitleStyle: { fontSize: 18, fontWeight: "600" },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          {/* Total Earnings Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="wallet" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={styles.summaryValue}>
              ₱{formatAmount(summary?.totalEarnings || 0)}
            </Text>
            <Text style={styles.summarySubtext}>
              From {summary?.completedJobs || 0} completed jobs
            </Text>
          </View>

          {/* Balance & Pending Row */}
          <View style={styles.summaryRow}>
            {/* Available Balance */}
            <View style={[styles.summaryCardSmall, styles.balanceCard]}>
              <View style={styles.smallCardHeader}>
                <Ionicons name="cash" size={24} color={Colors.success} />
                <Text style={styles.smallCardLabel}>Available</Text>
              </View>
              <Text style={styles.smallCardValue}>
                ₱{formatAmount(summary?.availableBalance || 0)}
              </Text>
            </View>

            {/* Pending Payments */}
            <View style={[styles.summaryCardSmall, styles.pendingCard]}>
              <View style={styles.smallCardHeader}>
                <Ionicons name="time" size={24} color={Colors.warning} />
                <Text style={styles.smallCardLabel}>Pending</Text>
              </View>
              <Text style={styles.smallCardValue}>
                ₱{formatAmount(summary?.pendingPayments || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/wallet/withdraw" as any)}
          >
            <Ionicons name="arrow-up-circle" size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/wallet/transactions" as any)}
          >
            <Ionicons name="list" size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Earnings History</Text>

            {/* Period Filter */}
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterPeriod === "week" && styles.filterButtonActive,
                ]}
                onPress={() => setFilterPeriod("week")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterPeriod === "week" && styles.filterButtonTextActive,
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterPeriod === "month" && styles.filterButtonActive,
                ]}
                onPress={() => setFilterPeriod("month")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterPeriod === "month" && styles.filterButtonTextActive,
                  ]}
                >
                  Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterPeriod === "all" && styles.filterButtonActive,
                ]}
                onPress={() => setFilterPeriod("all")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterPeriod === "all" && styles.filterButtonTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* History List */}
          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : history && history.earnings && history.earnings.length > 0 ? (
            history.earnings.map((item: EarningsHistoryItem) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() =>
                  router.push(`/payments/timeline/${item.jobId}` as any)
                }
              >
                <View style={styles.historyCardLeft}>
                  <View
                    style={[
                      styles.historyIcon,
                      { backgroundColor: `${getStatusColor(item.status)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(item.status) as any}
                      size={24}
                      color={getStatusColor(item.status)}
                    />
                  </View>

                  <View style={styles.historyCardInfo}>
                    <Text style={styles.historyJobTitle} numberOfLines={1}>
                      {item.jobTitle}
                    </Text>
                    <Text style={styles.historyDate}>
                      {format(new Date(item.date), "MMM dd, yyyy")}
                    </Text>
                    <View style={styles.historyMeta}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: `${getStatusColor(item.status)}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: getStatusColor(item.status) },
                          ]}
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.historyCardRight}>
                  <Text style={styles.historyAmount}>
                    ₱{formatAmount(item.amount)}
                  </Text>
                  <Text style={styles.historyNetAmount}>
                    Net: ₱{formatAmount(item.netAmount)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.textLight}
                    style={styles.historyChevron}
                  />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={Colors.textLight}
              />
              <Text style={styles.emptyStateTitle}>No earnings yet</Text>
              <Text style={styles.emptyStateText}>
                Complete jobs to start earning
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  summarySection: {
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  summarySubtext: {
    fontSize: 12,
    color: Colors.textLight,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryCardSmall: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  smallCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  smallCardLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  smallCardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  actionsSection: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  historySection: {
    marginBottom: Spacing.lg,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  filterButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  filterButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  historyCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  historyCardInfo: {
    flex: 1,
  },
  historyJobTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  historyCardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  historyNetAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyChevron: {
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
});

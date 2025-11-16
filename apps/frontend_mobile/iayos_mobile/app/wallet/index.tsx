/**
 * Wallet Dashboard Screen
 *
 * Features:
 * - Balance card with current balance and last updated timestamp
 * - Quick stats row (Pending, This Month, Total)
 * - Transaction history with tab filtering
 * - Pull-to-refresh
 * - Infinite scroll pagination
 * - Add funds and withdraw buttons
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
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useWallet } from "@/lib/hooks/useWallet";
import { useTransactions } from "@/lib/hooks/useTransactions";
import TransactionCard from "@/components/TransactionCard";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonCard from "@/components/ui/SkeletonCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type TransactionFilter = "all" | "deposit" | "payment" | "withdrawal";

export default function WalletScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("all");

  // Fetch wallet data
  const {
    data: walletData,
    isLoading: walletLoading,
    error: walletError,
    refetch: refetchWallet,
  } = useWallet();

  // Fetch transactions with filter
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactions(activeFilter);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchTransactions()]);
    setRefreshing(false);
  };

  const handleFilterChange = (filter: TransactionFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const handleAddFunds = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/payments/deposit" as any);
  };

  const handleWithdraw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement withdraw screen
    alert("Withdraw feature coming soon!");
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Flatten paginated transactions
  const allTransactions =
    transactionsData?.pages.flatMap((page) => page.results || []) || [];

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format last updated
  const formatLastUpdated = (dateString: string): string => {
    if (!dateString) return "Never";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card */}
        {walletLoading ? (
          <SkeletonCard />
        ) : walletError ? (
          <Card style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={Colors.error}
            />
            <Text style={styles.errorText}>Failed to load wallet</Text>
          </Card>
        ) : (
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(walletData?.balance || 0)}
            </Text>
            <Text style={styles.lastUpdated}>
              Last updated: {formatLastUpdated(walletData?.last_updated)}
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                variant="primary"
                onPress={handleAddFunds}
                style={styles.actionButton}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={Colors.white}
                  style={{ marginRight: 4 }}
                />
                Add Funds
              </Button>
              <Button
                variant="outline"
                onPress={handleWithdraw}
                style={styles.actionButton}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={18}
                  color={Colors.primary}
                  style={{ marginRight: 4 }}
                />
                Withdraw
              </Button>
            </View>
          </Card>
        )}

        {/* Quick Stats */}
        {!walletLoading && !walletError && (
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Ionicons
                name="time-outline"
                size={20}
                color={Colors.warning}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: Colors.warning }]}>
                {formatCurrency(walletData?.pending || 0)}
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.info}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>This Month</Text>
              <Text style={[styles.statValue, { color: Colors.info }]}>
                {formatCurrency(walletData?.this_month || 0)}
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <Ionicons
                name="trending-up-outline"
                size={20}
                color={Colors.success}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>Total</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {formatCurrency(walletData?.total_earned || 0)}
              </Text>
            </Card>
          </View>
        )}

        {/* Transaction History Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {(["all", "deposit", "payment", "withdrawal"] as TransactionFilter[]).map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  activeFilter === filter && styles.filterTabActive,
                ]}
                onPress={() => handleFilterChange(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === filter && styles.filterTabTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* Transaction List */}
        {transactionsLoading ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : transactionsError ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Failed to load transactions"
            message="Please try again later"
          />
        ) : allTransactions.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title={
              activeFilter === "all"
                ? "No transactions yet"
                : `No ${activeFilter} transactions`
            }
            message="Your transaction history will appear here"
          />
        ) : (
          <View style={styles.transactionList}>
            {allTransactions.map((transaction, index) => (
              <TransactionCard
                key={`${transaction.id}-${index}`}
                type={transaction.type}
                title={transaction.title}
                description={transaction.description}
                amount={transaction.amount}
                date={transaction.created_at}
                onPress={() => {
                  // Navigate to transaction details
                  // router.push(`/wallet/transaction/${transaction.id}` as any);
                }}
              />
            ))}

            {/* Load More */}
            {hasNextPage && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            )}
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
  },
  balanceCard: {
    alignItems: "center",
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  lastUpdated: {
    ...Typography.body.small,
    color: Colors.textHint,
    marginBottom: Spacing.lg,
  },
  actionButtons: {
    flexDirection: "row",
    width: "100%",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
  },
  statIcon: {
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.body.medium,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
  },
  filterTabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  transactionList: {
    gap: Spacing.sm,
  },
  loadingContainer: {
    gap: Spacing.md,
  },
  errorCard: {
    alignItems: "center",
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  loadMoreText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
});

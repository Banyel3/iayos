import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "../../constants/theme";
import { usePaymentHistory } from "../../lib/hooks/usePayments";
import TransactionCard from "../../components/TransactionCard";
import PaymentReceiptModal from "../../components/PaymentReceiptModal";
import { PaymentStatus } from "../../components/PaymentStatusBadge";

/**
 * Transaction History Screen
 *
 * Displays list of all payment transactions:
 * - Transaction cards with details
 * - Filter by status (all/pending/completed/failed)
 * - Pull-to-refresh
 * - Pagination (load more)
 * - Tap transaction to view receipt
 */

type FilterOption = "all" | "pending" | "completed" | "failed" | "verifying";

const filterOptions: { label: string; value: FilterOption }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Verifying", value: "verifying" },
  { label: "Failed", value: "failed" },
];

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  const { data, isLoading, refetch } = usePaymentHistory({
    status: selectedFilter === "all" ? undefined : selectedFilter,
    limit: 20,
  });

  const transactions = data?.transactions || [];

  const handleRefresh = () => {
    refetch();
  };

  const handleLoadMore = () => {
    // Pagination disabled for now - using simple query
    return;
  };

  const handleTransactionPress = (transaction: any) => {
    setSelectedReceipt(transaction);
    setReceiptModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <TransactionCard
      transaction={item}
      onPress={() => handleTransactionPress(item)}
    />
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>No Transactions Yet</Text>
        <Text style={styles.emptySubtitle}>
          {selectedFilter === "all"
            ? "Your payment history will appear here"
            : `No ${selectedFilter} transactions found`}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    // Pagination disabled
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Transaction Count */}
      {!isLoading && transactions.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Transaction List */}
      {isLoading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* Receipt Modal */}
      <PaymentReceiptModal
        visible={receiptModalVisible}
        receipt={selectedReceipt}
        onClose={() => {
          setReceiptModalVisible(false);
          setSelectedReceipt(null);
        }}
      />
    </View>
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
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  filterContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  countContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  footerLoaderText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});

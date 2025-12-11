import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "../constants/theme";
import { formatCurrency } from "../lib/hooks/usePayments";

interface WalletBalanceCardProps {
  balance: number | null;
  reservedBalance?: number | null;
  availableBalance?: number | null;
  isLoading: boolean;
  onRefresh?: () => void;
  onDeposit?: () => void;
  showDepositButton?: boolean;
}

export default function WalletBalanceCard({
  balance,
  reservedBalance = 0,
  availableBalance,
  isLoading,
  onRefresh,
  onDeposit,
  showDepositButton = true,
}: WalletBalanceCardProps) {
  // Calculate available if not provided
  const available = availableBalance ?? (balance ?? 0) - (reservedBalance ?? 0);
  const hasReserved = (reservedBalance ?? 0) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={24} color={Colors.white} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>Available Balance</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.balance}>
              {formatCurrency(available)}
            </Text>
          )}
        </View>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Reserved Balance Indicator */}
      {!isLoading && hasReserved && (
        <View style={styles.reservedContainer}>
          <View style={styles.reservedRow}>
            <Ionicons name="lock-closed" size={14} color={Colors.warning} />
            <Text style={styles.reservedLabel}>Reserved in Escrow:</Text>
            <Text style={styles.reservedAmount}>
              {formatCurrency(reservedBalance ?? 0)}
            </Text>
          </View>
          <Text style={styles.reservedHint}>
            Funds held for pending job postings
          </Text>
        </View>
      )}

      {showDepositButton && onDeposit && (
        <TouchableOpacity
          style={styles.depositButton}
          onPress={onDeposit}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.depositText}>Deposit Funds</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white + "CC",
    marginBottom: 4,
  },
  balance: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
    color: Colors.white,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  reservedContainer: {
    backgroundColor: Colors.warning + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reservedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reservedLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  reservedAmount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.warning,
  },
  reservedHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textHint,
    marginTop: 2,
    marginLeft: 20,
  },
  depositButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  depositText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
});

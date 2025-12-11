import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius } from "../constants/theme";
import { format, formatDistanceToNow } from "date-fns";

type EarningStatus = "completed" | "pending" | "failed" | "refunded";

interface EarningsHistoryItemProps {
  jobId: number;
  jobTitle: string;
  amount: number;
  netAmount: number;
  platformFee: number;
  status: EarningStatus;
  date: string;
  onPress?: () => void;
}

export default function EarningsHistoryItem({
  jobId,
  jobTitle,
  amount,
  netAmount,
  platformFee,
  status,
  date,
  onPress,
}: EarningsHistoryItemProps) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatusConfig = (status: EarningStatus) => {
    switch (status) {
      case "completed":
        return {
          icon: "checkmark-circle" as const,
          color: Colors.success,
          bgColor: Colors.successLight,
          label: "Completed",
        };
      case "pending":
        return {
          icon: "time" as const,
          color: Colors.warning,
          bgColor: Colors.warningLight,
          label: "Pending",
        };
      case "failed":
        return {
          icon: "close-circle" as const,
          color: Colors.error,
          bgColor: Colors.errorLight,
          label: "Failed",
        };
      case "refunded":
        return {
          icon: "return-up-back" as const,
          color: Colors.warning,
          bgColor: Colors.warningLight,
          label: "Refunded",
        };
      default:
        return {
          icon: "ellipse" as const,
          color: Colors.textSecondary,
          bgColor: Colors.background,
          label: "Unknown",
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.leftSection}>
        <View
          style={[styles.statusIcon, { backgroundColor: statusConfig.bgColor }]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={24}
            color={statusConfig.color}
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {jobTitle}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.dateText}>
              {formatDistanceToNow(new Date(date), { addSuffix: true })}
            </Text>
            <Text style={styles.dateSeparator}>•</Text>
            <Text style={styles.dateText}>
              {format(new Date(date), "MMM dd, yyyy")}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Text
              style={[styles.statusBadgeText, { color: statusConfig.color }]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.amountText}>₱{formatAmount(amount)}</Text>
        <Text style={styles.netAmountText}>
          Net: ₱{formatAmount(netAmount)}
        </Text>
        <Text style={styles.feeText}>Fee: ₱{formatAmount(platformFee)}</Text>

        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textLight}
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  infoSection: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dateSeparator: {
    fontSize: 12,
    color: Colors.textLight,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  netAmountText: {
    fontSize: 12,
    color: Colors.success,
    marginBottom: 2,
  },
  feeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  chevron: {
    marginTop: Spacing.xs,
  },
});

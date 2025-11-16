import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius } from "../constants/theme";

interface EarningsStatsCardProps {
  totalEarnings: number;
  completedJobs: number;
  averageEarnings: number;
  thisMonthEarnings?: number;
}

export default function EarningsStatsCard({
  totalEarnings,
  completedJobs,
  averageEarnings,
  thisMonthEarnings,
}: EarningsStatsCardProps) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  type IconName = "wallet-outline" | "briefcase-outline" | "trending-up-outline" | "calendar-outline";

  const stats: Array<{
    icon: IconName;
    label: string;
    value: string;
    color: string;
  }> = [
    {
      icon: "wallet-outline",
      label: "Total Earnings",
      value: `₱${formatAmount(totalEarnings)}`,
      color: Colors.primary,
    },
    {
      icon: "briefcase-outline",
      label: "Completed Jobs",
      value: completedJobs.toString(),
      color: Colors.success,
    },
    {
      icon: "trending-up-outline",
      label: "Avg per Job",
      value: `₱${formatAmount(averageEarnings)}`,
      color: Colors.info,
    },
  ];

  if (thisMonthEarnings !== undefined) {
    stats.push({
      icon: "calendar-outline",
      label: "This Month",
      value: `₱${formatAmount(thisMonthEarnings)}`,
      color: Colors.warning,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings Statistics</Text>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View
              style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}
            >
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});

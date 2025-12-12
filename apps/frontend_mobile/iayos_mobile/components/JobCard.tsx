/**
 * JobCard Component - Modern elevated card design inspired by Airbnb/TaskRabbit
 *
 * Features:
 * - Elevated card with pronounced shadow
 * - Horizontal layout with clear visual hierarchy
 * - Left side: Job info with icons
 * - Right side: Budget with gradient background
 * - Scale animation on press with haptic feedback
 * - Modern typography and spacing
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface JobCardProps {
  id: number;
  title: string;
  category?: string;
  location?: string;
  distance?: number;
  postedAt?: string | Date;
  budget: number | string;
  status?: "active" | "in_progress" | "completed" | "cancelled";
  applicationCount?: number;
  onPress?: () => void;
  // Team Job Fields
  isTeamJob?: boolean;
  totalWorkersNeeded?: number;
  totalWorkersAssigned?: number;
  teamFillPercentage?: number;
}

export default function JobCard({
  id,
  title,
  category,
  location,
  distance,
  postedAt,
  budget,
  status = "active",
  applicationCount,
  onPress,
  // Team Job Fields
  isTeamJob,
  totalWorkersNeeded,
  totalWorkersAssigned,
  teamFillPercentage,
}: JobCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  // Format posted date to relative time
  const formatPostedDate = (date: string | Date): string => {
    if (!date) return "Recently";

    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return posted.toLocaleDateString();
  };

  // Format budget
  const formatBudget = (amount: number | string): string => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `₱${numAmount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <Animated.View
      style={[{ transform: [{ scale: scaleAnim }] }, styles.cardWrapper]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.card}
      >
        {/* Left Side - Job Info */}
        <View style={styles.leftSection}>
          {/* Category Badge with Icon */}
          {category && (
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Ionicons name="briefcase" size={11} color={Colors.primary} />
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            </View>
          )}

          {/* Title with bold modern typography */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Location & Time Row with Icons */}
          <View style={styles.metaRow}>
            {location && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="location"
                  size={13}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {location}
                  {distance !== undefined && distance !== null && (
                    <Text style={styles.distanceText}>
                      {" "}
                      • {distance.toFixed(1)} km
                    </Text>
                  )}
                </Text>
              </View>
            )}
            {postedAt && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  {formatPostedDate(postedAt)}
                </Text>
              </View>
            )}
          </View>

          {/* Application Count Badge */}
          {typeof applicationCount === "number" && applicationCount > 0 && (
            <View style={styles.applicationBadgeRow}>
              <Ionicons name="people" size={13} color={Colors.primary} />
              <Text style={styles.applicationText}>
                {applicationCount}{" "}
                {applicationCount === 1 ? "applicant" : "applicants"}
              </Text>
            </View>
          )}

          {/* Team Job Badge */}
          {isTeamJob && (
            <View style={styles.teamJobBadgeRow}>
              <View style={styles.teamJobBadge}>
                <Ionicons name="people-circle" size={14} color={Colors.white} />
                <Text style={styles.teamJobBadgeText}>Team Job</Text>
              </View>
              <View style={styles.teamJobProgress}>
                <View style={styles.teamJobProgressBar}>
                  <View
                    style={[
                      styles.teamJobProgressFill,
                      { width: `${teamFillPercentage || 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.teamJobProgressText}>
                  {totalWorkersAssigned || 0}/{totalWorkersNeeded || 0} workers
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Right Side - Budget with Gradient */}
        <View style={styles.rightSection}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.budgetGradient}
          >
            <Text style={styles.budgetLabel}>BUDGET</Text>
            <Text style={styles.budgetAmount}>{formatBudget(budget)}</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {},

  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  leftSection: {
    flex: 1,
    gap: Spacing.xs,
  },
  categoryRow: {
    flexDirection: "row",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  distanceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  applicationBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: Spacing.xs,
  },
  applicationText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
  // Team Job Styles
  teamJobBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  teamJobBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  teamJobBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  teamJobProgress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamJobProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  teamJobProgressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  teamJobProgressText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textSecondary,
    minWidth: 55,
  },
  rightSection: {
    minWidth: 95,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  budgetGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
    minWidth: 95,
  },
  budgetLabel: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    opacity: 0.85,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  budgetAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
});

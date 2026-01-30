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
        {/* Job Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Location/Distance and Budget Row */}
        <View style={styles.infoRow}>
          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {location || "Location not specified"}
              </Text>
            </View>
            {distance !== undefined && distance !== null && (
              <Text style={styles.distanceText}>
                {distance.toFixed(1)} km away
              </Text>
            )}
          </View>

          <View style={styles.budgetSection}>
            <Text style={styles.budgetLabel}>BUDGET</Text>
            <Text style={styles.budgetAmount}>{formatBudget(budget)}</Text>
          </View>
        </View>

        {/* Team Job Badge and Progress - Only for team jobs */}
        {isTeamJob && (
          <View style={styles.teamJobFooter}>
            <View style={styles.teamJobBadge}>
              <Ionicons name="people" size={16} color={Colors.primary} />
              <Text style={styles.teamJobBadgeText}>TEAM JOB</Text>
            </View>
            <Text style={styles.teamJobProgressText}>
              {totalWorkersAssigned || 0} of {totalWorkersNeeded || 0} spots filled
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {},

  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 16,
    lineHeight: 30,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  locationSection: {
    flex: 1,
    marginRight: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 22, // Align with location text (icon width + gap)
  },
  budgetSection: {
    alignItems: "flex-end",
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.primary,
  },
  teamJobFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  teamJobBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  teamJobBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  teamJobProgressText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

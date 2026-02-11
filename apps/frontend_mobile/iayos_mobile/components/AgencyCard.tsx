/**
 * AgencyCard Component - Display agency information in a card
 *
 * Features:
 * - Agency name with verified badge
 * - Average rating and review count
 * - Completed and active jobs stats
 * - Location (city, province)
 * - Specializations tags (max 3)
 * - View Profile button
 * 
 * Modernized with:
 * - Scale animation on press
 * - Gradient accent bar
 * - Haptic feedback
 * - Enhanced shadows
 */

import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import type { Agency } from "@/lib/hooks/useAgencies";

interface AgencyCardProps {
  agency: Agency;
}

export default function AgencyCard({ agency }: AgencyCardProps) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/agencies/${agency.id}` as any);
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Gradient accent bar at top */}
        <LinearGradient
          colors={["#8B5CF6", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientAccent}
        />

        <View style={styles.cardContent}>
          {/* Agency Header */}
          <View style={styles.header}>
            {/* Agency Avatar (Generated) */}
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark || "#0EA5E9"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {agency.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>

            {/* Agency Info */}
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {agency.name}
                </Text>
                {agency.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={Colors.success}
                  />
                )}
              </View>

              {/* Rating */}
              {agency.rating > 0 ? (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.ratingText}>{agency.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewCount}>
                    ({agency.reviewCount} reviews)
                  </Text>
                </View>
              ) : (
                <Text style={styles.noReviews}>No reviews yet</Text>
              )}
            </View>
          </View>

          {/* Description */}
          {agency.description && (
            <Text style={styles.description} numberOfLines={2}>
              {agency.description}
            </Text>
          )}

          {/* Location */}
          {(agency.city || agency.province) && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {[agency.city, agency.province].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons
                name="briefcase-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.statValue}>{agency.completedJobs}</Text>
              <Text style={styles.statLabel}>completed</Text>
            </View>
            {agency.activeJobs > 0 && (
              <View style={styles.stat}>
                <Ionicons name="time-outline" size={16} color={Colors.success} />
                <Text style={[styles.statValue, { color: Colors.success }]}>
                  {agency.activeJobs}
                </Text>
                <Text style={styles.statLabel}>active</Text>
              </View>
            )}
          </View>

          {/* Specializations */}
          {agency.specializations && agency.specializations.length > 0 && (
            <View style={styles.specializationsRow}>
              {agency.specializations.slice(0, 3).map((spec, index) => (
                <View key={index} style={styles.specChip}>
                  <Text style={styles.specText} numberOfLines={1}>
                    {spec}
                  </Text>
                </View>
              ))}
              {agency.specializations.length > 3 && (
                <Text style={styles.moreSpecs}>
                  +{agency.specializations.length - 3} more
                </Text>
              )}
            </View>
          )}

          {/* View Profile Button */}
          <TouchableOpacity 
            style={styles.viewButton} 
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={styles.viewButtonText}>View Profile</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientAccent: {
    height: 4,
    width: "100%",
  },
  cardContent: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginRight: Spacing.xs,
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  noReviews: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  specializationsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Spacing.sm,
  },
  specChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  specText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "500",
  },
  moreSpecs: {
    fontSize: 11,
    color: Colors.textSecondary,
    alignSelf: "center",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
    marginRight: 4,
  },
});

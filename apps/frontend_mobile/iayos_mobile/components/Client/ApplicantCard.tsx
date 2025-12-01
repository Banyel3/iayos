/**
 * ApplicantCard Component
 *
 * Displays an applicant for a job with worker details and actions
 *
 * Features:
 * - Worker avatar, name, rating
 * - Proposed budget highlight
 * - Skills chips (max 3-4 visible)
 * - Application status badge
 * - Action buttons (View Profile, Accept, Reject)
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface EstimatedCompletion {
  predicted_hours: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  confidence_level: 'high' | 'medium' | 'low';
  formatted_duration: string;
  source: 'ml' | 'fallback';
}

interface ApplicantCardProps {
  application: {
    id: number;
    worker: {
      id: number;
      name: string;
      avatar: string | null;
      rating: number;
      skills: string[];
      profile_completion?: number;
    };
    proposed_budget: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    created_at: string;
    cover_letter?: string;
    estimated_duration?: string;
  };
  /** Platform ML-predicted completion time for comparison */
  platformEstimate?: EstimatedCompletion | null;
  onViewProfile: () => void;
  onAccept: () => void;
  onReject: () => void;
  style?: ViewStyle;
}

export default function ApplicantCard({
  application,
  platformEstimate,
  onViewProfile,
  onAccept,
  onReject,
  style,
}: ApplicantCardProps) {
  const { worker, proposed_budget, status, created_at, cover_letter, estimated_duration } = application;

  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewProfile();
  };

  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept();
  };

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReject();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={14} color={Colors.warning} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons
            key={i}
            name="star-half"
            size={14}
            color={Colors.warning}
          />
        );
      } else {
        stars.push(
          <Ionicons
            key={i}
            name="star-outline"
            size={14}
            color={Colors.textHint}
          />
        );
      }
    }

    return <View style={styles.starsContainer}>{stars}</View>;
  };

  // Get status badge variant
  const getStatusVariant = () => {
    switch (status) {
      case "ACCEPTED":
        return "success";
      case "REJECTED":
        return "danger";
      default:
        return "warning";
    }
  };

  // Visible skills (max 4)
  const visibleSkills = worker.skills.slice(0, 4);
  const remainingSkills = worker.skills.length - visibleSkills.length;

  return (
    <View style={[styles.card, style]}>
      {/* Header - Avatar, Name, Rating */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.workerInfo}
          onPress={handleViewProfile}
          activeOpacity={0.7}
        >
          {worker.avatar ? (
            <Image source={{ uri: worker.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={28} color={Colors.textSecondary} />
            </View>
          )}

          <View style={styles.workerDetails}>
            <Text style={styles.workerName} numberOfLines={1}>
              {worker.name}
            </Text>
            <View style={styles.ratingRow}>
              {renderStars(worker.rating)}
              <Text style={styles.ratingText}>
                ({worker.rating.toFixed(1)})
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Status Badge */}
        <Badge variant={getStatusVariant()} size="sm">
          {status}
        </Badge>
      </View>

      {/* Proposed Budget */}
      <View style={styles.budgetContainer}>
        <Text style={styles.budgetLabel}>Proposed Budget</Text>
        <Text style={styles.budgetAmount}>
          {formatCurrency(proposed_budget)}
        </Text>
      </View>

      {/* Estimate Comparison (Platform AI vs Worker) */}
      {(platformEstimate || estimated_duration) && (
        <View style={styles.estimateComparisonContainer}>
          <View style={styles.estimateHeader}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.estimateTitle}>Time Estimate</Text>
          </View>
          <View style={styles.estimateGrid}>
            {platformEstimate && (
              <View style={[styles.estimateBox, styles.platformEstimateBox]}>
                <Text style={styles.estimateLabel}>Platform AI</Text>
                <Text style={styles.platformEstimateValue}>
                  {platformEstimate.formatted_duration}
                </Text>
                <Text style={[
                  styles.confidenceText,
                  platformEstimate.confidence_level === 'high' && { color: Colors.success },
                  platformEstimate.confidence_level === 'medium' && { color: Colors.warning },
                  platformEstimate.confidence_level === 'low' && { color: Colors.error },
                ]}>
                  {platformEstimate.confidence_level} confidence
                </Text>
              </View>
            )}
            {estimated_duration && (
              <View style={[styles.estimateBox, styles.workerEstimateBox]}>
                <Text style={styles.estimateLabel}>Worker</Text>
                <Text style={styles.workerEstimateValue}>
                  {estimated_duration}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Skills */}
      {worker.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {visibleSkills.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {remainingSkills > 0 && (
            <View style={styles.skillChip}>
              <Text style={styles.skillText}>+{remainingSkills} more</Text>
            </View>
          )}
        </View>
      )}

      {/* Cover Letter (if exists) */}
      {cover_letter && (
        <View style={styles.coverLetterContainer}>
          <Text style={styles.coverLetterLabel}>Cover Letter</Text>
          <Text style={styles.coverLetterText} numberOfLines={2}>
            {cover_letter}
          </Text>
        </View>
      )}

      {/* Meta - Applied time */}
      <Text style={styles.appliedTime}>Applied {formatDate(created_at)}</Text>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button variant="outline" onPress={handleViewProfile} style={styles.actionButton}>
          <Ionicons
            name="person-outline"
            size={16}
            color={Colors.primary}
            style={{ marginRight: 4 }}
          />
          View Profile
        </Button>

        {status === "PENDING" && (
          <>
            <Button
              variant="success"
              onPress={handleAccept}
              style={styles.actionButton}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={Colors.white}
                style={{ marginRight: 4 }}
              />
              Accept
            </Button>
            <Button
              variant="danger"
              onPress={handleReject}
              style={styles.actionButton}
            >
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={Colors.white}
                style={{ marginRight: 4 }}
              />
              Reject
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  workerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    ...Typography.body.large,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  budgetContainer: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  budgetLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  budgetAmount: {
    ...Typography.heading.h3,
    color: Colors.primary,
    fontWeight: "700",
  },
  estimateComparisonContainer: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  estimateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  estimateTitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  estimateGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  estimateBox: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  platformEstimateBox: {
    backgroundColor: `${Colors.primary}15`,
  },
  workerEstimateBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  estimateLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  platformEstimateValue: {
    ...Typography.body.large,
    fontWeight: "700",
    color: Colors.primary,
  },
  workerEstimateValue: {
    ...Typography.body.large,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  confidenceText: {
    ...Typography.body.small,
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  coverLetterContainer: {
    marginBottom: Spacing.md,
  },
  coverLetterLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  coverLetterText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  appliedTime: {
    ...Typography.body.small,
    color: Colors.textHint,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

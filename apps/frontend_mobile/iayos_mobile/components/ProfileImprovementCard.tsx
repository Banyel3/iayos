/**
 * ProfileImprovementCard - Display AI-powered profile score and improvement suggestions
 *
 * Shows the worker's profile score (0-100) from the ML model with:
 * - Visual score indicator (circular progress)
 * - Rating category badge (Poor/Fair/Good/Excellent)
 * - Personalized improvement suggestions
 * - Progress to next tier visualization
 *
 * This is designed for workers viewing their OWN profile as a self-improvement tool,
 * NOT for clients judging workers.
 *
 * Usage:
 * ```tsx
 * <ProfileImprovementCard
 *   profileScore={75}
 *   ratingCategory="Good"
 *   improvementSuggestions={["Add more certifications", "Complete your bio"]}
 *   source="model"
 *   isLoading={false}
 * />
 * ```
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";
import {
  getScoreColor,
  getCategoryInfo,
  getMotivationalMessage,
  getProgressToNextTier,
} from "../lib/hooks/useWorkerProfileScore";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================================================
// Types
// ============================================================================

interface ProfileImprovementCardProps {
  profileScore?: number | null;
  ratingCategory?: "Poor" | "Fair" | "Good" | "Excellent" | "Unknown";
  improvementSuggestions?: string[];
  source?: "model" | "ml_service" | "fallback" | "error";
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function ProfileImprovementCard({
  profileScore,
  ratingCategory = "Unknown",
  improvementSuggestions = [],
  source = "fallback",
  isLoading = false,
  error = null,
  onRefresh,
}: ProfileImprovementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle suggestions expansion with animation
  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing your profile...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.containerError]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color={Colors.error} />
          <Text style={styles.errorText}>Unable to analyze profile</Text>
          {onRefresh && (
            <Pressable style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // No score state
  if (profileScore === null || profileScore === undefined) {
    return null;
  }

  const scoreColor = getScoreColor(profileScore);
  const categoryInfo = getCategoryInfo(ratingCategory);
  const motivationalMessage = getMotivationalMessage(profileScore);
  const progressInfo = getProgressToNextTier(profileScore);
  const isAIPowered = source === "model" || source === "ml_service";
  const hasSuggestions = improvementSuggestions.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={isAIPowered ? "sparkles" : "analytics"}
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.headerTitle}>Profile Score</Text>
        </View>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryInfo.color + "20" },
          ]}
        >
          <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
          <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
            {categoryInfo.label}
          </Text>
        </View>
      </View>

      {/* Score Display */}
      <View style={styles.scoreSection}>
        {/* Circular Score */}
        <View style={styles.scoreCircleContainer}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {Math.round(profileScore)}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
        </View>

        {/* Motivational Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.motivationalMessage}>{motivationalMessage}</Text>

          {/* Progress to Next Tier */}
          {progressInfo.nextTier !== "Max" && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                {progressInfo.pointsNeeded} points to {progressInfo.nextTier}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressInfo.progress}%`,
                      backgroundColor: scoreColor,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Improvement Suggestions */}
      {hasSuggestions && (
        <View style={styles.suggestionsSection}>
          <Pressable style={styles.suggestionsHeader} onPress={toggleExpanded}>
            <View style={styles.suggestionsHeaderLeft}>
              <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
              <Text style={styles.suggestionsTitle}>
                Improvement Tips ({improvementSuggestions.length})
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>

          {isExpanded && (
            <View style={styles.suggestionsList}>
              {improvementSuggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <View style={styles.suggestionBullet}>
                    <Text style={styles.suggestionBulletText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isAIPowered ? "Powered by AI Analysis" : "Based on Profile Data"}
        </Text>
        {onRefresh && (
          <Pressable onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={14} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.primary + "25",
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  containerError: {
    borderColor: Colors.error + "30",
    backgroundColor: Colors.error + "08",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerTitle: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: "600",
  },

  // Score Section
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  scoreCircleContainer: {
    alignItems: "center",
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  scoreMax: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  messageContainer: {
    flex: 1,
  },
  motivationalMessage: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Progress
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textHint,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Suggestions Section
  suggestionsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
    paddingTop: Spacing.sm,
  },
  suggestionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  suggestionsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  suggestionsTitle: {
    ...Typography.body.small,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  suggestionsList: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  suggestionBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionBulletText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
  },
  suggestionText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textHint,
  },
  refreshButton: {
    padding: 4,
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Error
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.error,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.error + "15",
    borderRadius: BorderRadius.medium,
  },
  retryButtonText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: "600",
  },
});

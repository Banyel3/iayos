/**
 * PriceSuggestionCard - Display AI-powered price suggestion for job creation
 *
 * Shows the predicted price range (min, suggested, max) from the ML model
 * with a visual indicator and option to apply the suggested price.
 *
 * Usage:
 * ```tsx
 * <PriceSuggestionCard
 *   minPrice={500}
 *   suggestedPrice={1000}
 *   maxPrice={1500}
 *   confidence={0.85}
 *   source="model"
 *   isLoading={false}
 *   onApplySuggested={(price) => setBudget(price.toString())}
 * />
 * ```
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";

// ============================================================================
// Types
// ============================================================================

interface PriceSuggestionCardProps {
  minPrice?: number;
  suggestedPrice?: number;
  maxPrice?: number;
  confidence?: number; // 0-1
  source?: "model" | "ml_service" | "fallback" | "error";
  isLoading?: boolean;
  error?: string | null;
  onApplySuggested?: (price: number) => void;
  compact?: boolean; // Smaller variant for inline display
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatPrice = (price: number): string => {
  return `₱${price.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getConfidenceInfo = (confidence: number) => {
  if (confidence >= 0.7) {
    return {
      label: "High Confidence",
      color: Colors.success,
      icon: "checkmark-circle" as const,
    };
  }
  if (confidence >= 0.4) {
    return {
      label: "Medium Confidence",
      color: Colors.warning,
      icon: "alert-circle" as const,
    };
  }
  return {
    label: "Low Confidence",
    color: Colors.error,
    icon: "help-circle" as const,
  };
};

const getSourceLabel = (source: string): string => {
  switch (source) {
    case "model":
      return "AI Prediction";
    case "ml_service":
      return "AI Service";
    case "fallback":
      return "Category Average";
    default:
      return "Estimate";
  }
};

// ============================================================================
// Component
// ============================================================================

export default function PriceSuggestionCard({
  minPrice,
  suggestedPrice,
  maxPrice,
  confidence = 0.5,
  source = "fallback",
  isLoading = false,
  error = null,
  onApplySuggested,
  compact = false,
}: PriceSuggestionCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Getting AI price suggestion...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.containerError,
          compact && styles.containerCompact,
        ]}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color={Colors.error} />
          <Text style={styles.errorText}>Unable to get price suggestion</Text>
        </View>
      </View>
    );
  }

  // No data state
  if (!suggestedPrice || !minPrice || !maxPrice) {
    return null; // Don't render if no prediction data
  }

  const confidenceInfo = getConfidenceInfo(confidence);
  const isAIPowered = source === "model" || source === "ml_service";

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={isAIPowered ? "sparkles" : "analytics"}
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.headerTitle}>
            {isAIPowered ? "AI Price Suggestion" : "Suggested Budget"}
          </Text>
        </View>
        <View style={styles.confidenceBadge}>
          <Ionicons
            name={confidenceInfo.icon}
            size={14}
            color={confidenceInfo.color}
          />
          <Text
            style={[styles.confidenceText, { color: confidenceInfo.color }]}
          >
            {Math.round(confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Price Range Display */}
      <View style={styles.priceContainer}>
        {/* Min Price */}
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Low</Text>
          <Text style={styles.priceValueMin}>{formatPrice(minPrice)}</Text>
        </View>

        {/* Suggested Price (Highlighted) */}
        <View style={[styles.priceColumn, styles.priceColumnCenter]}>
          <Text style={styles.priceLabelSuggested}>Suggested</Text>
          <Text style={styles.priceValueSuggested}>
            {formatPrice(suggestedPrice)}
          </Text>
          {onApplySuggested && (
            <Pressable
              style={styles.applyButton}
              onPress={() => onApplySuggested(suggestedPrice)}
            >
              <Text style={styles.applyButtonText}>Use This</Text>
            </Pressable>
          )}
        </View>

        {/* Max Price */}
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>High</Text>
          <Text style={styles.priceValueMax}>{formatPrice(maxPrice)}</Text>
        </View>
      </View>

      {/* Price Range Indicator Bar */}
      <View style={styles.rangeBar}>
        <View style={styles.rangeBarTrack}>
          <View
            style={[
              styles.rangeBarFill,
              {
                left: "0%",
                width: "100%",
              },
            ]}
          />
          {/* Suggested marker */}
          <View
            style={[
              styles.rangeBarMarker,
              {
                left: `${((suggestedPrice - minPrice) / (maxPrice - minPrice)) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Source Label */}
      <View style={styles.footer}>
        <Text style={styles.sourceText}>
          Based on: {getSourceLabel(source)}
        </Text>
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
    borderColor: Colors.primary + "30",
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  containerCompact: {
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
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
    marginBottom: Spacing.sm,
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
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
  },
  confidenceText: {
    ...Typography.caption,
    fontWeight: "600",
  },

  // Price Container
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  priceColumn: {
    flex: 1,
    alignItems: "center",
  },
  priceColumnCenter: {
    flex: 1.5,
    paddingHorizontal: Spacing.xs,
  },
  priceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceLabelSuggested: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  priceValueMin: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  priceValueSuggested: {
    ...Typography.heading.h3,
    color: Colors.primary,
    fontWeight: "700",
  },
  priceValueMax: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  applyButton: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  applyButtonText: {
    ...Typography.caption,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // Range Bar
  rangeBar: {
    marginBottom: Spacing.sm,
  },
  rangeBarTrack: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    position: "relative",
  },
  rangeBarFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary + "30",
    borderRadius: 3,
  },
  rangeBarMarker: {
    position: "absolute",
    top: -3,
    width: 12,
    height: 12,
    marginLeft: -6,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },

  // Footer
  footer: {
    alignItems: "center",
  },
  sourceText: {
    ...Typography.caption,
    color: Colors.textHint,
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.error,
  },
});

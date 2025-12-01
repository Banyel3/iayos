/**
 * EstimatedTimeCard Component
 * 
 * Displays ML-predicted job completion time with confidence indicator.
 * Shows time range, confidence level, and disclaimers for low confidence.
 * 
 * Used in:
 * - Job Detail screen
 * - Active Job screen (with countdown mode)
 * - Conversation header (compact mode)
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/theme';

export interface EstimatedCompletion {
  predicted_hours: number;
  confidence_interval_lower: number | null;
  confidence_interval_upper: number | null;
  confidence_level: number;
  formatted_duration: string;
  source: 'model' | 'microservice' | 'fallback';
  is_low_confidence: boolean;
}

interface EstimatedTimeCardProps {
  /** ML prediction data from backend */
  prediction: EstimatedCompletion | null;
  /** Compact mode for inline display (conversation header) */
  compact?: boolean;
  /** Show as countdown from job start time */
  countdownMode?: boolean;
  /** Job start time for countdown calculation */
  jobStartTime?: string;
  /** Worker's estimated duration for comparison */
  workerEstimate?: string;
  /** Custom container style */
  style?: ViewStyle;
}

/**
 * Format hours into human-readable duration
 */
function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h} hr`;
    return `${h}h ${m}m`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    if (remainingHours === 0) return `${days} day${days > 1 ? 's' : ''}`;
    return `${days}d ${remainingHours}h`;
  }
}

/**
 * Format time range from confidence interval
 */
function formatTimeRange(lower: number | null, upper: number | null): string {
  if (lower === null || upper === null) return '';
  return `${formatDuration(lower)} - ${formatDuration(upper)}`;
}

/**
 * Get confidence level label and color
 */
function getConfidenceInfo(level: number): { label: string; color: string; bgColor: string } {
  if (level >= 0.8) {
    return { label: 'High confidence', color: Colors.success, bgColor: Colors.successLight };
  } else if (level >= 0.5) {
    return { label: 'Moderate confidence', color: Colors.warning, bgColor: Colors.warningLight };
  } else {
    return { label: 'Limited data', color: Colors.textSecondary, bgColor: Colors.backgroundSecondary };
  }
}

/**
 * Calculate remaining time for countdown mode
 */
function calculateRemainingTime(
  predictedHours: number,
  jobStartTime: string
): { remainingHours: number; isOverdue: boolean } {
  const start = new Date(jobStartTime);
  const now = new Date();
  const elapsedHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  const remainingHours = predictedHours - elapsedHours;
  
  return {
    remainingHours: Math.max(0, remainingHours),
    isOverdue: remainingHours < 0,
  };
}

export function EstimatedTimeCard({
  prediction,
  compact = false,
  countdownMode = false,
  jobStartTime,
  workerEstimate,
  style,
}: EstimatedTimeCardProps) {
  if (!prediction || prediction.predicted_hours === null) {
    return null;
  }

  const confidenceInfo = getConfidenceInfo(prediction.confidence_level);
  const hasRange = prediction.confidence_interval_lower !== null && 
                   prediction.confidence_interval_upper !== null;
  
  // Calculate countdown if in countdown mode
  let countdownData = null;
  if (countdownMode && jobStartTime) {
    countdownData = calculateRemainingTime(prediction.predicted_hours, jobStartTime);
  }

  // Compact mode for conversation header
  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Ionicons name="time-outline" size={14} color={Colors.primary} />
        <Text style={styles.compactText}>
          {countdownMode && countdownData ? (
            countdownData.isOverdue ? (
              <Text style={styles.overdueText}>Overdue</Text>
            ) : (
              `ETA: ${formatDuration(countdownData.remainingHours)}`
            )
          ) : (
            `Est. ${prediction.formatted_duration}`
          )}
        </Text>
        {prediction.is_low_confidence && (
          <Text style={styles.compactDisclaimer}>(est.)</Text>
        )}
      </View>
    );
  }

  // Full card mode
  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="analytics-outline" size={20} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Estimated Completion Time</Text>
      </View>

      {/* Main prediction */}
      <View style={styles.predictionRow}>
        <View style={styles.mainPrediction}>
          {countdownMode && countdownData ? (
            <>
              {countdownData.isOverdue ? (
                <Text style={[styles.predictionValue, styles.overdueText]}>
                  Overdue by {formatDuration(Math.abs(countdownData.remainingHours))}
                </Text>
              ) : (
                <>
                  <Text style={styles.predictionValue}>
                    {formatDuration(countdownData.remainingHours)}
                  </Text>
                  <Text style={styles.predictionLabel}>remaining</Text>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.predictionValue}>
                {prediction.formatted_duration}
              </Text>
              {hasRange && (
                <Text style={styles.rangeText}>
                  ({formatTimeRange(
                    prediction.confidence_interval_lower,
                    prediction.confidence_interval_upper
                  )})
                </Text>
              )}
            </>
          )}
        </View>

        {/* Confidence badge */}
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceInfo.bgColor }]}>
          <View style={[styles.confidenceDot, { backgroundColor: confidenceInfo.color }]} />
          <Text style={[styles.confidenceText, { color: confidenceInfo.color }]}>
            {Math.round(prediction.confidence_level * 100)}%
          </Text>
        </View>
      </View>

      {/* Worker estimate comparison */}
      {workerEstimate && (
        <View style={styles.comparisonSection}>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Platform Estimate</Text>
              <Text style={styles.comparisonValue}>{prediction.formatted_duration}</Text>
            </View>
            <View style={styles.comparisonDivider} />
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Worker Estimate</Text>
              <Text style={styles.comparisonValue}>{workerEstimate}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Low confidence disclaimer */}
      {prediction.is_low_confidence && (
        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            Based on limited data. Actual time may vary.
          </Text>
        </View>
      )}

      {/* Source indicator (subtle) */}
      <Text style={styles.sourceText}>
        {prediction.source === 'model' || prediction.source === 'microservice'
          ? 'Powered by ML'
          : 'Statistical estimate'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.body.medium.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mainPrediction: {
    flex: 1,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  predictionLabel: {
    fontSize: Typography.body.sm.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rangeText: {
    fontSize: Typography.body.sm.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: Typography.body.sm.fontSize,
    fontWeight: '600',
  },
  comparisonSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: Typography.body.xs.fontSize,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: Typography.body.medium.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  comparisonDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  disclaimerText: {
    fontSize: Typography.body.xs.fontSize,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  sourceText: {
    fontSize: 10,
    color: Colors.textHint,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  overdueText: {
    color: Colors.error,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: Typography.body.sm.fontSize,
    color: Colors.primary,
    fontWeight: '500',
  },
  compactDisclaimer: {
    fontSize: Typography.body.xs.fontSize,
    color: Colors.textHint,
  },
});

export default EstimatedTimeCard;

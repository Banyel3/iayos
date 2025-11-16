/**
 * JobCard Component - Production-ready job listing card matching Next.js design
 *
 * Features:
 * - Horizontal layout (not vertical)
 * - Left side: Job info (title, category, location, posted date)
 * - Right side: Budget, status badge, application count
 * - White card with border radius 10px, subtle shadow
 * - Pressable with scale animation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Badge from '@/components/ui/Badge';
import * as Haptics from 'expo-haptics';

interface JobCardProps {
  id: number;
  title: string;
  category?: string;
  location?: string;
  postedAt?: string | Date;
  budget: number | string;
  status?: 'active' | 'in_progress' | 'completed' | 'cancelled';
  applicationCount?: number;
  onPress?: () => void;
}

export default function JobCard({
  id,
  title,
  category,
  location,
  postedAt,
  budget,
  status = 'active',
  applicationCount,
  onPress,
}: JobCardProps) {

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  // Format posted date to relative time (e.g., "2 hours ago")
  const formatPostedDate = (date: string | Date): string => {
    if (!date) return 'Recently';

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
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₱${numAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.95}
      style={styles.card}
    >
      {/* Left Side - Job Info */}
      <View style={styles.leftSection}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Category Badge */}
        {category && (
          <View style={styles.categoryContainer}>
            <Badge variant="info" size="sm">
              {category}
            </Badge>
          </View>
        )}

        {/* Location & Posted Date */}
        <View style={styles.metaRow}>
          {location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}

          {postedAt && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {formatPostedDate(postedAt)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right Side - Budget & Status */}
      <View style={styles.rightSection}>
        {/* Budget */}
        <Text style={styles.budget}>
          {formatBudget(budget)}
        </Text>

        {/* Status Badge */}
        <Badge variant={status} size="sm">
          {status.replace('_', ' ').toUpperCase()}
        </Badge>

        {/* Application Count */}
        {applicationCount !== undefined && applicationCount > 0 && (
          <View style={styles.applicationBadge}>
            <Ionicons name="people-outline" size={12} color={Colors.primary} />
            <Text style={styles.applicationCount}>
              {applicationCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  leftSection: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  categoryContainer: {
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  budget: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  applicationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  applicationCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
});

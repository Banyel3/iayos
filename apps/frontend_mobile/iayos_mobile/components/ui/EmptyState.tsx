/**
 * EmptyState Component - Production-ready empty state matching Next.js design
 *
 * Features:
 * - Illustration/icon at top
 * - Large title
 * - Secondary message
 * - Optional action button
 * - Reusable for all empty states
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import Button from './Button';

interface EmptyStateProps {
  // Content
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  illustration?: React.ReactNode;

  // Action
  actionLabel?: string;
  onActionPress?: () => void;

  // Styling
  style?: ViewStyle;
}

export default function EmptyState({
  title,
  message,
  icon,
  illustration,
  actionLabel,
  onActionPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Illustration or Icon */}
      {illustration ? (
        illustration
      ) : icon ? (
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={80}
            color={Colors.textHint}
          />
        </View>
      ) : null}

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}

      {/* Action Button */}
      {actionLabel && onActionPress && (
        <Button
          onPress={onActionPress}
          variant="primary"
          size="md"
          style={styles.button}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['4xl'],
    paddingVertical: Spacing['6xl'],
  },
  iconContainer: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  button: {
    marginTop: Spacing.md,
    minWidth: 200,
  },
});

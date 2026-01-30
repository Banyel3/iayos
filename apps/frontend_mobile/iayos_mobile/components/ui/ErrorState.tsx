/**
 * ErrorState Component - Production-ready error state matching Next.js design
 *
 * Features:
 * - Error icon (red)
 * - Error message
 * - Retry button
 * - Reusable for all error states
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
import { getErrorMessage } from '@/lib/utils/parse-api-error';

interface ErrorStateProps {
  // Content
  title?: string;
  message?: string | unknown;
  // Action
  onRetry?: () => void;
  retryLabel?: string;
  // Styling
  style?: ViewStyle;
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  style,
}: ErrorStateProps) {
  const errorMsg = typeof message === 'string'
    ? message
    : getErrorMessage(message, 'We encountered an error. Please try again.');
  return (
    <View style={[styles.container, style]}>
      {/* Error Icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={80}
          color={Colors.error}
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      {errorMsg && (
        <Text style={styles.message}>{errorMsg}</Text>
      )}

      {/* Retry Button */}
      {onRetry && (
        <Button
          onPress={onRetry}
          variant="primary"
          size="md"
          style={styles.button}
        >
          {retryLabel}
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

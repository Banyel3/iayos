/**
 * Badge Component - Production-ready status badge matching Next.js design
 *
 * Features:
 * - Status colors from theme
 * - Small text: 12px
 * - Padding: 4px 8px
 * - Border radius: 6px
 * - Variants: active, in_progress, completed, cancelled, pending, rejected
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

type BadgeVariant =
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'pending'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  children,
  variant = 'info',
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {

  // Get variant colors
  const getVariantColors = (): { background: string; text: string } => {
    switch (variant) {
      case 'active':
        return {
          background: `${Colors.primary}15`, // 15% opacity
          text: Colors.primary,
        };

      case 'in_progress':
        return {
          background: `${Colors.warning}15`,
          text: Colors.warning,
        };

      case 'completed':
      case 'success':
        return {
          background: `${Colors.success}15`,
          text: Colors.success,
        };

      case 'cancelled':
      case 'rejected':
      case 'error':
        return {
          background: `${Colors.error}15`,
          text: Colors.error,
        };

      case 'pending':
        return {
          background: '#6B728015', // gray-600 with 15% opacity
          text: '#6B7280',
        };

      case 'warning':
        return {
          background: `${Colors.warning}15`,
          text: Colors.warning,
        };

      case 'info':
      default:
        return {
          background: `${Colors.info}15`,
          text: Colors.info,
        };
    }
  };

  // Get size styles
  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: 6,
            paddingVertical: 2,
          },
          text: {
            fontSize: 10,
          },
        };

      case 'lg':
        return {
          container: {
            paddingHorizontal: 12,
            paddingVertical: 6,
          },
          text: {
            fontSize: 14,
          },
        };

      case 'md':
      default:
        return {
          container: {
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xs,
          },
          text: {
            fontSize: Typography.fontSize.xs,
          },
        };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        sizeStyles.container,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          sizeStyles.text,
          { color: colors.text },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
});

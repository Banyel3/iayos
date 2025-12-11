/**
 * Card Component - Production-ready card container matching Next.js design
 *
 * Features:
 * - White background with subtle shadow
 * - Border radius: 10px
 * - Padding: 16px
 * - Variants: default, outlined, elevated
 * - Pressable option for interactive cards
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

type CardVariant = 'default' | 'outlined' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  pressable?: boolean;
  style?: ViewStyle;
  hapticFeedback?: boolean;
}

export default function Card({
  children,
  variant = 'default',
  onPress,
  pressable = false,
  style,
  hapticFeedback = true,
}: CardProps) {

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  // Get variant styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: Colors.white,
          borderWidth: 1,
          borderColor: Colors.border,
          ...Shadows.none,
        };

      case 'elevated':
        return {
          backgroundColor: Colors.white,
          ...Shadows.lg,
        };

      case 'default':
      default:
        return {
          backgroundColor: Colors.white,
          ...Shadows.md,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // If pressable or has onPress, use TouchableOpacity
  if (pressable || onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.95}
        style={[styles.card, variantStyles, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Otherwise, use regular View
  return (
    <View style={[styles.card, variantStyles, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
});

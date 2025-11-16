/**
 * FilterChip Component - Production-ready filter chip matching Next.js design
 *
 * Features:
 * - Pressable chip for filters
 * - Selected state with different background
 * - Optional count badge
 * - Rounded pill shape
 * - Haptic feedback on press
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface FilterChipProps {
  // Content
  label: string;
  count?: number;

  // State
  selected?: boolean;
  onPress?: () => void;

  // Styling
  style?: ViewStyle;

  // Haptics
  hapticFeedback?: boolean;
}

export default function FilterChip({
  label,
  count,
  selected = false,
  onPress,
  style,
  hapticFeedback = true,
}: FilterChipProps) {

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.container,
        selected && styles.containerSelected,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
        ]}
      >
        {label}
      </Text>

      {count !== undefined && count > 0 && (
        <View style={[styles.badge, selected && styles.badgeSelected]}>
          <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  labelSelected: {
    color: Colors.white,
  },
  badge: {
    marginLeft: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: {
    backgroundColor: Colors.primaryDark,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
  badgeTextSelected: {
    color: Colors.white,
  },
});

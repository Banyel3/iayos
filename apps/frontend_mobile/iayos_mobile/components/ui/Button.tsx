/**
 * Button Component - Production-ready button matching Next.js design
 *
 * Features:
 * - Multiple variants (primary, secondary, outline, ghost, danger)
 * - Multiple sizes (sm, md, lg)
 * - States (default, pressed, disabled, loading)
 * - Haptic feedback on press
 * - Icon support (left/right)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  // Content
  children: React.ReactNode;
  onPress?: () => void;

  // Styling
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;

  // States
  disabled?: boolean;
  loading?: boolean;

  // Icons
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;

  // Haptics
  hapticFeedback?: boolean;

  // Custom styles
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  hapticFeedback = true,
  style,
  textStyle,
}: ButtonProps) {

  const handlePress = () => {
    if (hapticFeedback && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  // Get variant styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: Colors.primary,
            ...Shadows.sm,
          },
          text: {
            color: Colors.white,
          },
        };

      case 'secondary':
        return {
          container: {
            backgroundColor: Colors.backgroundSecondary,
            borderWidth: 1,
            borderColor: Colors.border,
          },
          text: {
            color: Colors.textPrimary,
          },
        };

      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: Colors.primary,
          },
          text: {
            color: Colors.primary,
          },
        };

      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: Colors.primary,
          },
        };

      case 'danger':
        return {
          container: {
            backgroundColor: Colors.error,
            ...Shadows.sm,
          },
          text: {
            color: Colors.white,
          },
        };

      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  // Get size styles
  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            height: 40,
            paddingHorizontal: Spacing.lg,
          },
          text: {
            fontSize: Typography.fontSize.sm,
          },
        };

      case 'md':
        return {
          container: {
            height: 48,
            paddingHorizontal: Spacing.xl,
          },
          text: {
            fontSize: Typography.fontSize.base,
          },
        };

      case 'lg':
        return {
          container: {
            height: 56,
            paddingHorizontal: Spacing['2xl'],
          },
          text: {
            fontSize: Typography.fontSize.lg,
          },
        };

      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? Colors.white : Colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}

          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              textStyle,
            ]}
          >
            {children}
          </Text>

          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});

/**
 * ModernCard Component - Elevated card design inspired by Airbnb/Uber
 *
 * Features:
 * - Pronounced shadows for depth
 * - Pressable with scale animation
 * - Optional gradient overlay
 * - Rounded corners with modern styling
 * - Haptic feedback
 */

import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface ModernCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined" | "gradient";
  disabled?: boolean;
  gradient?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
}

export default function ModernCard({
  children,
  onPress,
  style,
  variant = "elevated",
  disabled = false,
  gradient = false,
  gradientColors = [Colors.primary, Colors.primaryDark] as const,
}: ModernCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const getCardStyle = () => {
    switch (variant) {
      case "elevated":
        return [styles.card, styles.elevated];
      case "outlined":
        return [styles.card, styles.outlined];
      case "gradient":
        return [styles.card, styles.gradient];
      default:
        return styles.card;
    }
  };

  const cardStyle = [
    getCardStyle(),
    { transform: [{ scale: scaleAnim }] },
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={{ overflow: "hidden", borderRadius: BorderRadius.lg }}
      >
        <Animated.View style={cardStyle}>
          {gradient ? (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBg}
            >
              {children}
            </LinearGradient>
          ) : (
            children
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={cardStyle}>
      {gradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBg}
        >
          {children}
        </LinearGradient>
      ) : (
        children
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  elevated: {
    ...Shadows.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradient: {
    overflow: "hidden",
  },
  gradientBg: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

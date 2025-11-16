/**
 * FloatingActionButton (FAB) - Modern floating button inspired by Material Design 3
 *
 * Features:
 * - Pronounced shadow with blur
 * - Gradient background
 * - Scale animation on press
 * - Haptic feedback
 * - Extended variant with text
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Spacing, Shadows } from "@/constants/theme";

interface FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label?: string;
  position?: "bottom-right" | "bottom-center" | "bottom-left";
  variant?: "default" | "gradient";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
}

export default function FloatingActionButton({
  icon,
  onPress,
  label,
  position = "bottom-right",
  variant = "gradient",
  size = "medium",
  disabled = false,
}: FABProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scaleAnim, {
      toValue: 0.9,
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

  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  const getSize = () => {
    switch (size) {
      case "small":
        return { container: 48, icon: 20 };
      case "large":
        return { container: 72, icon: 32 };
      default:
        return { container: 56, icon: 24 };
    }
  };

  const sizes = getSize();
  const isExtended = !!label;

  const getPositionStyle = (): ViewStyle => {
    const base: ViewStyle = {
      position: "absolute" as const,
      bottom: Spacing.xl,
    };
    switch (position) {
      case "bottom-left":
        return { ...base, left: Spacing.lg };
      case "bottom-center":
        return { ...base, alignSelf: "center" as const };
      default:
        return { ...base, right: Spacing.lg };
    }
  };

  const content = (
    <>
      <Ionicons name={icon} size={sizes.icon} color={Colors.white} />
      {isExtended && <Text style={styles.label}>{label}</Text>}
    </>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        { transform: [{ scale: scaleAnim }] },
        disabled && styles.disabled,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          isExtended
            ? styles.extended
            : { width: sizes.container, height: sizes.container },
        ]}
      >
        {variant === "gradient" ? (
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientBg, isExtended && styles.extendedGradient]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[styles.solidBg, isExtended && styles.extendedSolid]}>
            {content}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  button: {
    borderRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  gradientBg: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  solidBg: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  extended: {
    paddingHorizontal: Spacing.xl,
    height: 56,
    borderRadius: 28,
  },
  extendedGradient: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  extendedSolid: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  label: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  disabled: {
    opacity: 0.5,
  },
});

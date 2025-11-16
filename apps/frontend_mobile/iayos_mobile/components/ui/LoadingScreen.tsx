/**
 * LoadingScreen Component - Production-ready loading screen matching Next.js design
 *
 * Features:
 * - Full-screen loader
 * - Logo/brand display
 * - Spinner/activity indicator
 * - Optional loading text
 * - Blocks user interaction
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface LoadingScreenProps {
  // Content
  text?: string;
  showLogo?: boolean;

  // Styling
  style?: ViewStyle;
}

export default function LoadingScreen({
  text,
  showLogo = true,
  style,
}: LoadingScreenProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Logo (optional) */}
      {showLogo && (
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>iAyos</Text>
        </View>
      )}

      {/* Activity Indicator */}
      <ActivityIndicator
        size="large"
        color={Colors.primary}
        style={styles.spinner}
      />

      {/* Loading Text */}
      {text && (
        <Text style={styles.text}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logoContainer: {
    marginBottom: Spacing['4xl'],
  },
  logo: {
    fontSize: Typography.fontSize['5xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  spinner: {
    marginVertical: Spacing['2xl'],
  },
  text: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
});

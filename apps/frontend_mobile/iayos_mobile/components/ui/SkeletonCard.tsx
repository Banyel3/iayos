/**
 * SkeletonCard Component - Production-ready skeleton loader matching Next.js design
 *
 * Features:
 * - Shimmer animation (60fps)
 * - Matches JobCard dimensions
 * - Reusable for different card types
 * - Smooth loading state
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface SkeletonCardProps {
  // Styling
  style?: ViewStyle;
  height?: number;
  width?: number | string;

  // Variant
  variant?: 'job' | 'conversation' | 'profile' | 'default';
}

export default function SkeletonCard({
  style,
  height = 180,
  width = '100%',
  variant = 'default',
}: SkeletonCardProps) {

  // Animation value for shimmer
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Render variant-specific skeleton
  const renderSkeleton = () => {
    switch (variant) {
      case 'job':
        return (
          <>
            <Animated.View style={[styles.skeletonLine, styles.titleLine, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.subtitleLine, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.bodyLine, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.bodyLine, { opacity: shimmerOpacity }]} />
            <View style={styles.bottomRow}>
              <Animated.View style={[styles.skeletonChip, { opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonChip, { opacity: shimmerOpacity }]} />
            </View>
          </>
        );

      case 'conversation':
        return (
          <View style={styles.conversationRow}>
            <Animated.View style={[styles.avatar, { opacity: shimmerOpacity }]} />
            <View style={styles.conversationContent}>
              <Animated.View style={[styles.skeletonLine, styles.titleLine, { opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.bodyLine, { opacity: shimmerOpacity }]} />
            </View>
          </View>
        );

      case 'profile':
        return (
          <View style={styles.profileRow}>
            <Animated.View style={[styles.avatarLarge, { opacity: shimmerOpacity }]} />
            <View style={styles.profileContent}>
              <Animated.View style={[styles.skeletonLine, styles.titleLine, { opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.subtitleLine, { opacity: shimmerOpacity }]} />
            </View>
          </View>
        );

      default:
        return (
          <>
            <Animated.View style={[styles.skeletonLine, styles.titleLine, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.bodyLine, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.bodyLine, { opacity: shimmerOpacity }]} />
          </>
        );
    }
  };

  return (
    <View style={[styles.container, { height, width }, style]}>
      {renderSkeleton()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
  },
  titleLine: {
    width: '70%',
    height: 16,
  },
  subtitleLine: {
    width: '50%',
  },
  bodyLine: {
    width: '90%',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  skeletonChip: {
    height: 28,
    width: 80,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.pill,
  },
  conversationRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
  },
  conversationContent: {
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.backgroundSecondary,
  },
  profileContent: {
    flex: 1,
  },
});

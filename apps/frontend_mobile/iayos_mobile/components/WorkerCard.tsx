/**
 * WorkerCard Component - Display worker information
 * 
 * Modernized with:
 * - Scale animation on press
 * - Haptic feedback
 * - Enhanced shadows
 */

import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import type { Worker } from "@/lib/hooks/useWorkers";
import { getAbsoluteMediaUrl } from "@/lib/api/config";

interface WorkerCardProps {
  worker: Worker;
  onPress: () => void;
}

export default function WorkerCard({ worker, onPress }: WorkerCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Use getAbsoluteMediaUrl for safety, though it should be handled in the hook
  const avatarUrl = getAbsoluteMediaUrl(worker.avatar);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={24} color={Colors.textSecondary} />
                </View>
              )}
              {worker.isAvailable && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.jobTitle} numberOfLines={1}>
                {worker.categories?.[0] || "General Worker"}
              </Text>
              <Text style={styles.name} numberOfLines={1}>
                {worker.name}
              </Text>
            </View>
            <View style={styles.rightSection}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.rating}>
                  {typeof worker.rating === "number"
                    ? worker.rating.toFixed(1)
                    : "0.0"}
                </Text>
              </View>
              {typeof worker.hourlyRate === "number" && worker.hourlyRate > 0 && (
                <Text style={styles.rightRate}>₱{worker.hourlyRate}/hr</Text>
              )}
            </View>
          </View>

          {worker.categories && worker.categories.length > 1 && (
            <View style={styles.categories}>
              {worker.categories.slice(1, 4).map((category, index) => (
                <View key={index} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
              {worker.categories.length > 4 && (
                <Text style={styles.moreCategories}>
                  +{worker.categories.length - 4}
                </Text>
              )}
            </View>
          )}

          <View style={styles.footer}>
            {typeof worker.distance === "number" && (
              <View style={styles.distanceSection}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.distance}>
                  {worker.distance.toFixed(1)} km away
                </Text>
              </View>
            )}
            {worker.isAvailable && (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    justifyContent: "center",
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 4,
    fontWeight: "600",
  },
  rightRate: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
  },
  availableBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full || 20,
  },
  availableText: {
    fontSize: 11,
    color: "#065F46",
    fontWeight: "600",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginRight: 6,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.textHint,
    fontWeight: "500",
  },
  moreCategories: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  distanceSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  distance: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});

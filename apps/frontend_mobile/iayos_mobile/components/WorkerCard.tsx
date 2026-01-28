/**
 * WorkerCard Component - Display worker information
 * 
 * Modernized with:
 * - Scale animation on press
 * - Gradient accent bar
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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import type { Worker } from "@/lib/hooks/useWorkers";

interface WorkerCardProps {
  worker: Worker;
  onPress: () => void;
}

export default function WorkerCard({ worker, onPress }: WorkerCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
        {/* Gradient accent bar at top */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark || "#0EA5E9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientAccent}
        />

        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: worker.avatar || "https://via.placeholder.com/50",
                }}
                style={styles.avatar}
              />
              {worker.isAvailable && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {worker.name}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.rating}>
                  {typeof worker.rating === "number"
                    ? worker.rating.toFixed(1)
                    : "0.0"}
                </Text>
                <Text style={styles.jobs}>
                  {" • "}
                  {typeof worker.completedJobs === "number"
                    ? worker.completedJobs
                    : 0}{" "}
                  jobs
                </Text>
              </View>
            </View>
            {worker.isAvailable && (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            )}
          </View>

          {worker.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {worker.bio}
            </Text>
          )}

          {worker.categories && worker.categories.length > 0 && (
            <View style={styles.categories}>
              {worker.categories.slice(0, 3).map((category, index) => (
                <View key={index} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
              {worker.categories.length > 3 && (
                <Text style={styles.moreCategories}>
                  +{worker.categories.length - 3}
                </Text>
              )}
            </View>
          )}

          <View style={styles.footer}>
            {typeof worker.hourlyRate === "number" && worker.hourlyRate > 0 && (
              <View style={styles.rateSection}>
                <Ionicons name="cash-outline" size={16} color={Colors.primary} />
                <Text style={styles.rate}>₱{worker.hourlyRate}/hr</Text>
              </View>
            )}
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
  gradientAccent: {
    height: 4,
    width: "100%",
  },
  cardContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginLeft: 4,
    fontWeight: "600",
  },
  jobs: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
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
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
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
    color: Colors.textSecondary,
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
  },
  rateSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  rate: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
    marginLeft: 4,
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

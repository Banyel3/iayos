/**
 * WorkerCard Component - Display worker information
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Image
          source={{
            uri: worker.avatar || "https://via.placeholder.com/50",
          }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {worker.name}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{worker.rating.toFixed(1)}</Text>
            <Text style={styles.jobs}>• {worker.completedJobs} jobs</Text>
          </View>
        </View>
        {worker.isAvailable && (
          <View style={styles.availableBadge}>
            <View style={styles.availableDot} />
            <Text style={styles.availableText}>Available</Text>
          </View>
        )}
      </View>

      {worker.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {worker.bio}
        </Text>
      )}

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

      <View style={styles.footer}>
        {worker.hourlyRate && (
          <View style={styles.rateSection}>
            <Ionicons name="cash-outline" size={16} color={Colors.primary} />
            <Text style={styles.rate}>₱{worker.hourlyRate}/hr</Text>
          </View>
        )}
        {worker.distance !== undefined && (
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 4,
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

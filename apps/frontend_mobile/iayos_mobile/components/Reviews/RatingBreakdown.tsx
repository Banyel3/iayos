/**
 * RatingBreakdown Component
 * Phase 8: Reviews & Ratings System
 *
 * Displays star distribution chart showing how many reviews for each rating
 * Example:
 * 5 ⭐ ████████████████ 120 (60%)
 * 4 ⭐ ████████         45  (22.5%)
 * 3 ⭐ ████             15  (7.5%)
 * 2 ⭐ ██               10  (5%)
 * 1 ⭐ ██               10  (5%)
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { RatingBreakdownProps } from "@/lib/types/review";

export default function RatingBreakdown({
  breakdown,
  totalReviews,
}: RatingBreakdownProps) {
  const ratings = [
    { stars: 5, count: breakdown.five_star },
    { stars: 4, count: breakdown.four_star },
    { stars: 3, count: breakdown.three_star },
    { stars: 2, count: breakdown.two_star },
    { stars: 1, count: breakdown.one_star },
  ];

  const renderRatingRow = (stars: number, count: number) => {
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

    return (
      <View key={stars} style={styles.row}>
        {/* Star label */}
        <View style={styles.starLabel}>
          <Text style={styles.starNumber}>{stars}</Text>
          <Ionicons name="star" size={16} color="#FFB800" />
        </View>

        {/* Progress bar */}
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              {
                width: `${percentage}%`,
                backgroundColor: getBarColor(stars),
              },
            ]}
          />
        </View>

        {/* Count and percentage */}
        <View style={styles.stats}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.percentage}>({percentage.toFixed(0)}%)</Text>
        </View>
      </View>
    );
  };

  const getBarColor = (stars: number): string => {
    if (stars >= 4) return "#4CAF50"; // Green for 4-5 stars
    if (stars === 3) return "#FFB800"; // Yellow for 3 stars
    return "#F44336"; // Red for 1-2 stars
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rating Distribution</Text>
      {ratings.map(({ stars, count }) => renderRatingRow(stars, count))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  starLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 50,
  },
  starNumber: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    overflow: "hidden",
    marginHorizontal: 12,
  },
  bar: {
    height: "100%",
    borderRadius: 6,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
  },
  count: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  percentage: {
    fontSize: 12,
    color: "#666",
  },
});

/**
 * StarRating Component
 * Phase 8: Reviews & Ratings System
 *
 * Interactive and display-only star rating component
 * Supports:
 * - Interactive mode (tappable for review submission)
 * - Display mode (read-only for showing ratings)
 * - Half stars for displaying averages
 * - Customizable size
 */

import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StarRatingProps } from "@/lib/types/review";

export default function StarRating({
  rating,
  onChange,
  size = 24,
  interactive = false,
  showHalfStars = true,
}: StarRatingProps) {
  const handleStarPress = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex + 1);
    }
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillPercentage = Math.min(Math.max(rating - index, 0), 1);

    let iconName: keyof typeof Ionicons.glyphMap;
    let color: string;

    if (fillPercentage >= 0.75) {
      // Full star
      iconName = "star";
      color = "#FFB800";
    } else if (fillPercentage >= 0.25 && showHalfStars) {
      // Half star
      iconName = "star-half";
      color = "#FFB800";
    } else {
      // Empty star
      iconName = "star-outline";
      color = "#CCCCCC";
    }

    const StarComponent = interactive ? TouchableOpacity : View;

    return (
      <StarComponent
        key={index}
        onPress={() => handleStarPress(index)}
        disabled={!interactive}
        style={styles.starContainer}
        activeOpacity={0.7}
      >
        <Ionicons name={iconName} size={size} color={color} />
      </StarComponent>
    );
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((index) => renderStar(index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starContainer: {
    marginHorizontal: 2,
  },
});

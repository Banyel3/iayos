// ReviewsSection Component
// Displays review statistics and list of reviews

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useReviewStats, useWorkerReviews } from "@/lib/hooks/useReviews";
import { ReviewCard } from "./ReviewCard";

interface ReviewsSectionProps {
  accountId: number;
  profileType: "WORKER" | "CLIENT";
}

export function ReviewsSection({
  accountId,
  profileType,
}: ReviewsSectionProps) {
  // Fetch review stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useReviewStats(accountId);

  // Fetch reviews (first page only for profile view)
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useWorkerReviews(accountId, 1, 10, "latest");

  if (statsLoading || reviewsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  if (statsError || reviewsError || !stats || !reviewsData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Unable to load reviews</Text>
      </View>
    );
  }

  const hasReviews = stats.total_reviews > 0;

  // Render rating breakdown bars
  const renderRatingBreakdown = () => {
    const { rating_breakdown } = stats;
    const ratings = [
      { stars: 5, count: rating_breakdown.five_star },
      { stars: 4, count: rating_breakdown.four_star },
      { stars: 3, count: rating_breakdown.three_star },
      { stars: 2, count: rating_breakdown.two_star },
      { stars: 1, count: rating_breakdown.one_star },
    ];

    return (
      <View style={styles.breakdownContainer}>
        {ratings.map(({ stars, count }) => {
          const percentage =
            stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;

          return (
            <View key={stars} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{stars}★</Text>
              <View style={styles.breakdownBarContainer}>
                <View
                  style={[styles.breakdownBarFill, { width: `${percentage}%` }]}
                />
              </View>
              <Text style={styles.breakdownCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Render stars display
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Ionicons key={i} name="star" size={20} color="#FFB800" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={20} color="#FFB800" />
        );
      } else {
        stars.push(
          <Ionicons
            key={i}
            name="star-outline"
            size={20}
            color={Colors.border}
          />
        );
      }
    }

    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
        {hasReviews && (
          <Text style={styles.reviewCount}>
            {stats.total_reviews}{" "}
            {stats.total_reviews === 1 ? "review" : "reviews"}
          </Text>
        )}
      </View>

      {hasReviews ? (
        <>
          {/* Rating Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.averageRating}>
                {stats.average_rating.toFixed(1)}
              </Text>
              {renderStars(stats.average_rating)}
              <Text style={styles.totalReviews}>
                Based on {stats.total_reviews}{" "}
                {stats.total_reviews === 1 ? "review" : "reviews"}
              </Text>
            </View>

            <View style={styles.summaryRight}>{renderRatingBreakdown()}</View>
          </View>

          {/* Reviews List */}
          <View style={styles.reviewsList}>
            <Text style={styles.reviewsListTitle}>Recent Reviews</Text>
            {reviewsData.reviews.map((review) => (
              <ReviewCard key={review.review_id} review={review} />
            ))}

            {/* Show More Button */}
            {stats.total_reviews > 10 && (
              <TouchableOpacity style={styles.showMoreButton}>
                <Text style={styles.showMoreText}>
                  View all {stats.total_reviews} reviews
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="chatbox-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyText}>
            {profileType === "WORKER"
              ? "Complete jobs to receive reviews from clients"
              : "Hire workers to leave reviews"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["2xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  reviewCount: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error,
    marginTop: Spacing.md,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLeft: {
    alignItems: "center",
    marginRight: Spacing.xl,
    minWidth: 100,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  totalReviews: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  summaryRight: {
    flex: 1,
  },
  breakdownContainer: {
    gap: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  breakdownLabel: {
    ...Typography.body.small,
    fontWeight: "600",
    color: Colors.textPrimary,
    width: 24,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownBarFill: {
    height: "100%",
    backgroundColor: "#FFB800",
    borderRadius: 4,
  },
  breakdownCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    width: 30,
    textAlign: "right",
  },
  reviewsList: {
    marginTop: Spacing.md,
  },
  reviewsListTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  showMoreText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
    marginRight: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});

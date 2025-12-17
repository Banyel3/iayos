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
import {
  useReviewStats,
  useWorkerReviews,
  useClientReviews,
} from "@/lib/hooks/useReviews";
import { ReviewCard } from "./ReviewCard";

interface ReviewsSectionProps {
  accountId: number;
  profileType: "WORKER" | "CLIENT";
}

export function ReviewsSection({
  accountId,
  profileType,
}: ReviewsSectionProps) {
  const [showAllReviews, setShowAllReviews] = React.useState(false);
  const INITIAL_REVIEW_LIMIT = 3;

  // Fetch review stats (only for workers - pass 0 to disable for clients)
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useReviewStats(profileType === "WORKER" ? accountId : 0);

  // Fetch reviews based on profile type
  // Workers get reviews from clients, Clients get reviews from workers
  // Pass 0 to disable the query we don't need (hooks have enabled: !!id check)
  const {
    data: workerReviewsData,
    isLoading: workerReviewsLoading,
    error: workerReviewsError,
  } = useWorkerReviews(
    profileType === "WORKER" ? accountId : 0,
    1,
    10,
    "latest"
  );

  const {
    data: clientReviewsData,
    isLoading: clientReviewsLoading,
    error: clientReviewsError,
  } = useClientReviews(profileType === "CLIENT" ? accountId : 0, 1, 10);

  // Select the correct reviews data based on profile type
  const reviewsData =
    profileType === "WORKER" ? workerReviewsData : clientReviewsData;
  const reviewsLoading =
    profileType === "WORKER" ? workerReviewsLoading : clientReviewsLoading;
  const reviewsError =
    profileType === "WORKER" ? workerReviewsError : clientReviewsError;

  // For CLIENT profiles, only wait for reviews (not stats)
  const isLoading =
    profileType === "WORKER" ? statsLoading || reviewsLoading : reviewsLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  // For CLIENT profiles, show a simplified view if no reviews data
  if (profileType === "CLIENT" && !reviewsData) {
    return (
      <View style={styles.noReviewsContainer}>
        <Ionicons name="star-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.noReviewsText}>No reviews yet</Text>
        <Text style={styles.noReviewsSubtext}>
          Reviews from workers will appear here
        </Text>
      </View>
    );
  }

  // For WORKER profiles, check both stats and reviews
  if (
    profileType === "WORKER" &&
    (statsError || reviewsError || !stats || !reviewsData)
  ) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Unable to load reviews</Text>
      </View>
    );
  }

  // For CLIENT profiles, just check reviews error
  if (profileType === "CLIENT" && reviewsError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Unable to load reviews</Text>
      </View>
    );
  }

  // Calculate hasReviews based on profile type
  const hasReviews =
    profileType === "WORKER"
      ? (stats?.total_reviews || 0) > 0
      : (reviewsData?.reviews?.length || 0) > 0;

  // Render rating breakdown bars (only for workers with stats)
  const renderRatingBreakdown = () => {
    if (!stats || !stats.rating_breakdown) return null;

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
        {hasReviews && profileType === "WORKER" && stats && (
          <Text style={styles.reviewCount}>
            {stats.total_reviews}{" "}
            {stats.total_reviews === 1 ? "review" : "reviews"}
          </Text>
        )}
        {hasReviews && profileType === "CLIENT" && reviewsData && (
          <Text style={styles.reviewCount}>
            {reviewsData.reviews.length}{" "}
            {reviewsData.reviews.length === 1 ? "review" : "reviews"}
          </Text>
        )}
      </View>

      {hasReviews ? (
        <>
          {/* Rating Summary Card - Only for WORKER profiles */}
          {profileType === "WORKER" && stats && (
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
          )}

          {/* Reviews List */}
          {reviewsData && reviewsData.reviews && (
            <View style={styles.reviewsList}>
              <Text style={styles.reviewsListTitle}>Recent Reviews</Text>
              {(showAllReviews
                ? reviewsData.reviews
                : reviewsData.reviews.slice(0, INITIAL_REVIEW_LIMIT)
              ).map((review) => (
                <ReviewCard key={review.review_id} review={review} />
              ))}

              {/* Show More/Less Button */}
              {reviewsData.reviews.length > INITIAL_REVIEW_LIMIT && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllReviews(!showAllReviews)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllReviews
                      ? "Show less reviews"
                      : `View ${reviewsData.reviews.length - INITIAL_REVIEW_LIMIT} more ${reviewsData.reviews.length - INITIAL_REVIEW_LIMIT === 1 ? "review" : "reviews"}`}
                  </Text>
                  <Ionicons
                    name={showAllReviews ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
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
  noReviewsContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
  },
  noReviewsText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  noReviewsSubtext: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
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

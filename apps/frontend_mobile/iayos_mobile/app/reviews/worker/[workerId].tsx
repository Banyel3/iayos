/**
 * Worker Reviews Screen
 * Phase 8: Reviews & Ratings System
 *
 * Displays all reviews for a specific worker
 * Features:
 * - Rating statistics and breakdown
 * - Filterable/sortable review list
 * - Pagination
 * - Pull-to-refresh
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  Card,
  SegmentedButtons,
  Divider,
} from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import {
  ReviewCard,
  StarRating,
  RatingBreakdown,
} from "@/components/Reviews";
import { useWorkerReviews, useReviewStats } from "@/lib/hooks/useReviews";

type SortType = "latest" | "highest" | "lowest";

export default function WorkerReviewsScreen() {
  const { workerId } = useLocalSearchParams();
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [page, setPage] = useState(1);

  const workerIdNum = Number(workerId);

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
    isRefetching,
  } = useWorkerReviews(workerIdNum, page, 20, sortBy);

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useReviewStats(workerIdNum);

  const isLoading = reviewsLoading || statsLoading;
  const error = reviewsError || statsError;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchReviews}
          />
        }
      >
        {/* Statistics Card */}
        {statsData && (
          <>
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={styles.statsHeader}>
                  <View style={styles.averageRating}>
                    <Text style={styles.ratingNumber}>
                      {statsData.average_rating.toFixed(1)}
                    </Text>
                    <StarRating
                      rating={statsData.average_rating}
                      size={28}
                      interactive={false}
                    />
                    <Text style={styles.totalReviews}>
                      Based on {statsData.total_reviews} reviews
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {statsData.total_reviews > 0 && (
              <RatingBreakdown
                breakdown={statsData.rating_breakdown}
                totalReviews={statsData.total_reviews}
              />
            )}

            <Divider style={styles.divider} />
          </>
        )}

        {/* Sort Controls */}
        {reviewsData && reviewsData.total_count > 0 && (
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <SegmentedButtons
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as SortType);
                setPage(1); // Reset to page 1 when sorting changes
              }}
              buttons={[
                { value: "latest", label: "Latest" },
                { value: "highest", label: "Highest" },
                { value: "lowest", label: "Lowest" },
              ]}
              style={styles.sortButtons}
            />
          </View>
        )}

        {/* Reviews List */}
        {reviewsData && reviewsData.reviews.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              All Reviews ({reviewsData.total_count})
            </Text>
            {reviewsData.reviews.map((review) => (
              <ReviewCard
                key={review.review_id}
                review={review}
                showActions={false}
              />
            ))}

            {/* Pagination Info */}
            {reviewsData.total_pages > 1 && (
              <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>
                  Page {reviewsData.page} of {reviewsData.total_pages}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>
              This worker hasn't received any reviews
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  statsCard: {
    margin: 16,
    marginBottom: 0,
  },
  statsHeader: {
    alignItems: "center",
  },
  averageRating: {
    alignItems: "center",
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  sortContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  sortButtons: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  paginationInfo: {
    padding: 16,
    alignItems: "center",
  },
  paginationText: {
    fontSize: 14,
    color: "#666",
  },
});

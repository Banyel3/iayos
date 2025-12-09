/**
 * Client Detail Screen - View client profile
 *
 * Features:
 * - Client avatar and basic info
 * - Rating and reviews from workers
 * - Jobs posted statistics
 * - Jobs completed count
 * - Total spent amount
 * - Reviews section with pagination
 * - Member since date
 * - Contact button (for active jobs)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, ENDPOINTS, getAbsoluteMediaUrl } from "@/lib/api/config";
import { useClientReviews } from "@/lib/hooks/useReviews";

interface ClientDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  description?: string;
  rating: number;
  reviewCount: number;
  jobsPosted: number;
  jobsCompleted: number;
  totalSpent: number;
  city?: string;
  province?: string;
  joinedDate?: string;
  verified: boolean;
}

// Skeleton component for loading state
const ClientDetailSkeleton = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Skeleton */}
        <View style={styles.heroSection}>
          <View style={[styles.skeletonCircle, styles.avatar]} />
          <View
            style={[
              styles.skeletonBox,
              { width: 180, height: 24, marginTop: 16 },
            ]}
          />
          <View
            style={[
              styles.skeletonBox,
              { width: 120, height: 20, marginTop: 8 },
            ]}
          />
        </View>

        {/* Stats Skeleton */}
        <View style={styles.statsSection}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.skeletonBox, { width: 40, height: 28 }]} />
              <View
                style={[
                  styles.skeletonBox,
                  { width: 60, height: 14, marginTop: 4 },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Info Skeleton */}
        <View style={styles.section}>
          <View style={[styles.skeletonBox, { width: 100, height: 20 }]} />
          <View
            style={[
              styles.skeletonBox,
              { width: "100%", height: 60, marginTop: 12 },
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reviewsPage, setReviewsPage] = useState(1);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(true);

  // Fetch client details
  const {
    data: clientData,
    isLoading,
    error,
    refetch,
  } = useQuery<ClientDetail>({
    queryKey: ["client", id],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.CLIENT_DETAIL(Number(id)));
      if (!response.ok) {
        throw new Error("Failed to fetch client details");
      }
      const data = (await response.json()) as { client: ClientDetail };
      // Transform profile picture URL for local storage compatibility
      return {
        ...data.client,
        profilePicture:
          getAbsoluteMediaUrl(data.client.profilePicture) || undefined,
      };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch client reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useClientReviews(
    Number(id),
    reviewsPage,
    5
  );

  if (isLoading) {
    return <ClientDetailSkeleton />;
  }

  if (error || !clientData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load client profile</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const client = clientData;
  const fullName = `${client.firstName} ${client.lastName}`.trim();
  const location =
    client.city && client.province
      ? `${client.city}, ${client.province}`
      : client.city || client.province || null;

  // Format joined date
  const formatJoinedDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{
              uri: client.profilePicture || "https://via.placeholder.com/120",
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{fullName || "Client"}</Text>

          {/* Verified Badge */}
          {client.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.success}
              />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          {/* Location */}
          {location && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {client.rating > 0 ? client.rating.toFixed(1) : "No ratings"}
            </Text>
            {client.reviewCount > 0 && (
              <Text style={styles.reviewCountText}>
                ({client.reviewCount} review
                {client.reviewCount !== 1 ? "s" : ""})
              </Text>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{client.jobsPosted}</Text>
            <Text style={styles.statLabel}>Jobs Posted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{client.jobsCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text
              style={[styles.statValue, { fontSize: Typography.fontSize.lg }]}
            >
              {formatCurrency(client.totalSpent)}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Description Section */}
        {client.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <Text style={styles.descriptionText}>{client.description}</Text>
            </View>
          </View>
        )}

        {/* Reviews Section - Collapsible */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setIsReviewsExpanded(!isReviewsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleTitleRow}>
              <Ionicons name="star" size={22} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Reviews from Workers</Text>
              <View style={styles.reviewCountBadge}>
                <Text style={styles.reviewCountBadgeText}>
                  {reviewsData?.total_count || client.reviewCount || 0}
                </Text>
              </View>
            </View>
            <Ionicons
              name={isReviewsExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {isReviewsExpanded && (
            <View style={styles.reviewsContent}>
              {isLoadingReviews ? (
                <View style={styles.reviewsLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.reviewsLoadingText}>
                    Loading reviews...
                  </Text>
                </View>
              ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                <>
                  {/* Rating Distribution */}
                  {reviewsData.rating_distribution && (
                    <View style={styles.ratingDistribution}>
                      <Text style={styles.distributionTitle}>
                        Rating Distribution
                      </Text>
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count =
                          reviewsData.rating_distribution?.[stars] || 0;
                        const total = reviewsData.total_count || 1;
                        const percentage = (count / total) * 100;
                        return (
                          <View key={stars} style={styles.distributionRow}>
                            <Text style={styles.distributionStars}>
                              {stars}
                            </Text>
                            <Ionicons
                              name="star"
                              size={12}
                              color={Colors.warning}
                            />
                            <View style={styles.distributionBarContainer}>
                              <View
                                style={[
                                  styles.distributionBar,
                                  { width: `${percentage}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.distributionCount}>
                              {count}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Review Cards */}
                  {reviewsData.reviews.map((review) => (
                    <View key={review.review_id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        {review.reviewer_profile_img ? (
                          <Image
                            source={{ uri: review.reviewer_profile_img }}
                            style={styles.reviewerAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.reviewerAvatar,
                              styles.reviewerAvatarPlaceholder,
                            ]}
                          >
                            <Text style={styles.reviewerAvatarText}>
                              {review.reviewer_name?.charAt(0) || "?"}
                            </Text>
                          </View>
                        )}
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>
                            {review.reviewer_name}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {new Date(review.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </Text>
                        </View>
                        <View style={styles.reviewRating}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={
                                star <= review.rating ? "star" : "star-outline"
                              }
                              size={14}
                              color={
                                star <= review.rating
                                  ? Colors.warning
                                  : Colors.textHint
                              }
                            />
                          ))}
                        </View>
                      </View>
                      {review.job_title && (
                        <Text style={styles.reviewJobTitle}>
                          Job: {review.job_title}
                        </Text>
                      )}
                      {review.comment && (
                        <Text style={styles.reviewComment}>
                          {review.comment}
                        </Text>
                      )}
                    </View>
                  ))}

                  {/* Pagination */}
                  {reviewsData.total_pages > 1 && (
                    <View style={styles.reviewsPagination}>
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          reviewsPage === 1 && styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          setReviewsPage(Math.max(1, reviewsPage - 1))
                        }
                        disabled={reviewsPage === 1}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={18}
                          color={
                            reviewsPage === 1 ? Colors.textHint : Colors.primary
                          }
                        />
                      </TouchableOpacity>
                      <Text style={styles.paginationText}>
                        {reviewsPage} of {reviewsData.total_pages}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          reviewsPage === reviewsData.total_pages &&
                            styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          setReviewsPage(
                            Math.min(reviewsData.total_pages, reviewsPage + 1)
                          )
                        }
                        disabled={reviewsPage === reviewsData.total_pages}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={
                            reviewsPage === reviewsData.total_pages
                              ? Colors.textHint
                              : Colors.primary
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color={Colors.textHint}
                  />
                  <Text style={styles.emptyStateText}>
                    No reviews yet. Workers who complete jobs for this client
                    can leave reviews.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Contact Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.card}>
            {client.phoneNumber && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.infoText}>{client.phoneNumber}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{client.email}</Text>
            </View>
          </View>
        </View>

        {/* Member Since Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Since</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.infoText}>
                {formatJoinedDate(client.joinedDate)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: "#ECFDF5",
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  locationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  ratingText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  reviewCountText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statsSection: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  descriptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  // Skeleton styles
  skeletonBox: {
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
  },
  skeletonCircle: {
    backgroundColor: Colors.border,
  },
  // Reviews Section styles
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  collapsibleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reviewCountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  reviewCountBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    color: Colors.white,
  },
  reviewsContent: {
    marginTop: Spacing.md,
  },
  reviewsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  reviewsLoadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  // Rating Distribution
  ratingDistribution: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  distributionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginVertical: 2,
  },
  distributionStars: {
    width: 12,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    textAlign: "right",
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginHorizontal: Spacing.xs,
  },
  distributionBar: {
    height: "100%",
    backgroundColor: Colors.warning,
    borderRadius: 4,
  },
  distributionCount: {
    width: 24,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: "right",
  },
  // Review Cards
  reviewCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  reviewerAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  reviewerAvatarText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  reviewerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  reviewDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewJobTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  reviewComment: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  // Pagination
  reviewsPagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  paginationButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  emptyStateText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

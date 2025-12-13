// ReviewCard Component
// Displays individual review with rating, comment, reviewer info, and category breakdown

import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Review } from "@/lib/types/review";

// Format relative time for review date
function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 30) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

interface ReviewCardProps {
  review: Review;
}

// Helper component for category rating row with inline stars
function CategoryRatingRow({
  label,
  rating,
}: {
  label: string;
  rating: number;
}) {
  const renderMiniStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={12}
          color={i <= rating ? "#FFB800" : Colors.border}
        />
      );
    }
    return <View style={styles.miniStarsContainer}>{stars}</View>;
  };

  return (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryLabel}>{label}</Text>
      <View style={styles.categoryRatingValue}>
        {renderMiniStars()}
        <Text style={styles.categoryRatingText}>{rating.toFixed(1)}</Text>
      </View>
    </View>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  // Category breakdown always shown - displays 0 stars for old reviews without category ratings

  const renderStars = () => {
    const stars = [];
    const rating = Number(review.rating);

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#FFB800" : Colors.border}
        />
      );
    }

    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      {/* Reviewer Info */}
      <View style={styles.header}>
        <View style={styles.reviewerInfo}>
          {review.reviewer_profile_img ? (
            <Image
              source={{ uri: review.reviewer_profile_img }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={Colors.textSecondary} />
            </View>
          )}

          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
            <View style={styles.metaRow}>
              {renderStars()}
              <Text style={styles.date}>
                {" "}
                · {formatReviewDate(review.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Reviewer Type Badge */}
        <View
          style={[
            styles.typeBadge,
            review.reviewer_type === "CLIENT"
              ? styles.clientBadge
              : styles.workerBadge,
          ]}
        >
          <Text
            style={[
              styles.typeText,
              review.reviewer_type === "CLIENT"
                ? styles.clientText
                : styles.workerText,
            ]}
          >
            {review.reviewer_type}
          </Text>
        </View>
      </View>

      {/* Review Comment */}
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}

      {/* Category Breakdown - Only for CLIENT reviews (clients rating workers) */}
      {review.reviewer_type === "CLIENT" && (
        <View style={styles.categoryBreakdown}>
          <CategoryRatingRow
            label="Quality of Work"
            rating={review.rating_quality ?? 0}
          />
          <CategoryRatingRow
            label="Communication"
            rating={review.rating_communication ?? 0}
          />
          <CategoryRatingRow
            label="Punctuality"
            rating={review.rating_punctuality ?? 0}
          />
          <CategoryRatingRow
            label="Professionalism"
            rating={review.rating_professionalism ?? 0}
          />
        </View>
      )}

      {/* Worker Response (if any) */}
      {review.worker_response && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <Ionicons name="arrow-undo" size={14} color={Colors.primary} />
            <Text style={styles.responseLabel}>Response from worker</Text>
          </View>
          <Text style={styles.responseText}>{review.worker_response}</Text>
          {review.worker_response_at && (
            <Text style={styles.responseDate}>
              {formatReviewDate(review.worker_response_at)}
            </Text>
          )}
        </View>
      )}

      {/* Flagged Warning (if flagged) */}
      {review.is_flagged && (
        <View style={styles.flaggedWarning}>
          <Ionicons name="flag" size={14} color={Colors.warning} />
          <Text style={styles.flaggedText}>
            This review has been flagged for moderation
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  date: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  clientBadge: {
    backgroundColor: "#E8F5E9",
  },
  workerBadge: {
    backgroundColor: "#E3F2FD",
  },
  typeText: {
    ...Typography.body.small,
    fontSize: 10,
    fontWeight: "700",
  },
  clientText: {
    color: "#2E7D32",
  },
  workerText: {
    color: "#1565C0",
  },
  comment: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  responseContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xs,
  },
  responseLabel: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  responseText: {
    ...Typography.body.small,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  responseDate: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  flaggedWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.sm,
  },
  flaggedText: {
    ...Typography.body.small,
    color: Colors.warning,
    flex: 1,
  },
  // Category breakdown styles
  categoryToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  categoryToggleText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
    marginRight: 4,
  },
  categoryBreakdown: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    flex: 1,
  },
  categoryRatingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniStarsContainer: {
    flexDirection: "row",
    gap: 1,
  },
  categoryRatingText: {
    ...Typography.body.small,
    color: Colors.textPrimary,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "right",
  },
});

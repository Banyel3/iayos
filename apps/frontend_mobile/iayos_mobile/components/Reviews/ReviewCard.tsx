/**
 * ReviewCard Component
 * Phase 8: Reviews & Ratings System
 *
 * Displays a single review with:
 * - Reviewer profile picture and name
 * - Star rating
 * - Review comment
 * - Date posted
 * - Action buttons (edit, report)
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Avatar, IconButton, Chip } from "react-native-paper";
import { ReviewCardProps } from "@/lib/types/review";
import StarRating from "./StarRating";
import { formatDistanceToNow } from "date-fns";

export default function ReviewCard({
  review,
  onReport,
  onEdit,
  showActions = false,
}: ReviewCardProps) {
  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
  });

  const getReviewerTypeColor = () => {
    return review.reviewer_type === "CLIENT" ? "#2196F3" : "#4CAF50";
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Reviewer Header */}
        <View style={styles.header}>
          <View style={styles.reviewerInfo}>
            <Avatar.Image
              size={40}
              source={
                review.reviewer_profile_img
                  ? { uri: review.reviewer_profile_img }
                  : require("@/assets/images/default-avatar.png")
              }
            />
            <View style={styles.reviewerDetails}>
              <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
          </View>
          {showActions && (
            <View style={styles.actions}>
              {review.can_edit && onEdit && (
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => onEdit(review.review_id)}
                />
              )}
              {onReport && (
                <IconButton
                  icon="flag"
                  size={20}
                  onPress={() => onReport(review.review_id)}
                />
              )}
            </View>
          )}
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <StarRating rating={review.rating} size={20} interactive={false} />
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
          <Chip
            mode="outlined"
            style={[
              styles.typeChip,
              { borderColor: getReviewerTypeColor() },
            ]}
            textStyle={{ color: getReviewerTypeColor(), fontSize: 10 }}
          >
            {review.reviewer_type}
          </Chip>
        </View>

        {/* Comment */}
        <Text style={styles.comment}>{review.comment}</Text>

        {/* Worker Response */}
        {review.worker_response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>Response from worker:</Text>
            <Text style={styles.responseText}>{review.worker_response}</Text>
            {review.worker_response_at && (
              <Text style={styles.responseTime}>
                {formatDistanceToNow(new Date(review.worker_response_at), {
                  addSuffix: true,
                })}
              </Text>
            )}
          </View>
        )}

        {/* Flags */}
        {review.is_flagged && (
          <Chip
            icon="alert"
            mode="flat"
            style={styles.flaggedChip}
            textStyle={styles.flaggedText}
          >
            Flagged for review
          </Chip>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reviewerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeAgo: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  typeChip: {
    marginLeft: 8,
    height: 24,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  responseContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
    borderRadius: 4,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#333",
  },
  responseTime: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  flaggedChip: {
    marginTop: 8,
    backgroundColor: "#FFF3E0",
    alignSelf: "flex-start",
  },
  flaggedText: {
    color: "#F57C00",
    fontSize: 11,
  },
});

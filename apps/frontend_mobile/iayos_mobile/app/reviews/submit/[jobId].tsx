/**
 * Review Submission Screen
 * Phase 8: Reviews & Ratings System - Multi-Criteria Reviews
 *
 * Allows users to submit a review for a completed job
 * Features:
 * - 4 separate rating categories (Quality, Communication, Punctuality, Professionalism)
 * - 5-star rating selector for each category
 * - Text review input with character limit
 * - Validation before submission
 * - Success/error handling
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Card,
  Divider,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { StarRating } from "@/components/Reviews";
import { useSubmitReview } from "@/lib/hooks/useReviews";
import { SubmitReviewRequest } from "@/lib/types/review";

const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 500;

// Rating category descriptions
const RATING_CATEGORIES = [
  {
    key: "quality" as const,
    label: "Quality of Work",
    description: "How well was the job completed?",
    icon: "🏆",
  },
  {
    key: "communication" as const,
    label: "Communication",
    description: "How responsive and clear were they?",
    icon: "💬",
  },
  {
    key: "punctuality" as const,
    label: "Punctuality",
    description: "Were they on time and met deadlines?",
    icon: "⏰",
  },
  {
    key: "professionalism" as const,
    label: "Professionalism",
    description: "How professional was their conduct?",
    icon: "👔",
  },
];

interface Ratings {
  quality: number;
  communication: number;
  punctuality: number;
  professionalism: number;
}

export default function SubmitReviewScreen() {
  const { jobId, revieweeId, revieweeName, reviewerType } =
    useLocalSearchParams();

  // Check if this is a client reviewing a worker (multi-criteria) or worker reviewing client (single rating)
  const isClientReviewingWorker = reviewerType === "CLIENT";

  const [ratings, setRatings] = useState<Ratings>({
    quality: 0,
    communication: 0,
    punctuality: 0,
    professionalism: 0,
  });
  const [singleRating, setSingleRating] = useState(0); // For worker reviewing client
  const [comment, setComment] = useState("");

  const submitReviewMutation = useSubmitReview();

  // Calculate overall rating based on review type
  const overallRating = isClientReviewingWorker
    ? (ratings.quality +
        ratings.communication +
        ratings.punctuality +
        ratings.professionalism) /
      4
    : singleRating;

  // Check if rating is complete based on review type
  const isRatingComplete = isClientReviewingWorker
    ? Object.values(ratings).every((r) => r > 0)
    : singleRating > 0;

  const handleRatingChange = (category: keyof Ratings, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = () => {
    // Validation based on review type
    if (!isRatingComplete) {
      Alert.alert(
        "Rating Required",
        isClientReviewingWorker
          ? "Please rate all categories before submitting"
          : "Please select a rating before submitting"
      );
      return;
    }

    if (comment.trim().length < MIN_COMMENT_LENGTH) {
      Alert.alert(
        "Review Too Short",
        `Please write at least ${MIN_COMMENT_LENGTH} characters`
      );
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      Alert.alert(
        "Review Too Long",
        `Please keep your review under ${MAX_COMMENT_LENGTH} characters`
      );
      return;
    }

    // Build review data based on review type
    const reviewData: SubmitReviewRequest = {
      job_id: Number(jobId),
      reviewee_id: Number(revieweeId),
      // For client reviewing worker: use category ratings
      // For worker reviewing client: use single rating for all categories (backend calculates overall)
      rating_quality: isClientReviewingWorker ? ratings.quality : singleRating,
      rating_communication: isClientReviewingWorker
        ? ratings.communication
        : singleRating,
      rating_punctuality: isClientReviewingWorker
        ? ratings.punctuality
        : singleRating,
      rating_professionalism: isClientReviewingWorker
        ? ratings.professionalism
        : singleRating,
      comment: comment.trim(),
      reviewer_type: reviewerType as "CLIENT" | "WORKER",
    };

    submitReviewMutation.mutate(reviewData, {
      onSuccess: () => {
        Alert.alert("Review Submitted", "Thank you for your feedback!", [
          {
            text: "OK",
            onPress: () => safeGoBack(router, "/(tabs)/jobs"),
          },
        ]);
      },
      onError: (error: Error) => {
        Alert.alert("Error", error.message);
      },
    });
  };

  const remainingChars = MAX_COMMENT_LENGTH - comment.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.title}>Write a Review</Text>
            <Text style={styles.subtitle}>
              How was your experience with {revieweeName}?
            </Text>
          </Card.Content>
        </Card>

        {/* Rating Section - Different UI based on reviewer type */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Rate your experience</Text>

            {isClientReviewingWorker ? (
              <>
                {/* Multi-Criteria Rating for CLIENT reviewing WORKER */}
                <Text style={styles.sectionSubtitle}>
                  Please rate each category from 1 to 5 stars
                </Text>

                {RATING_CATEGORIES.map((category, index) => (
                  <View key={category.key} style={styles.ratingRow}>
                    <View style={styles.ratingLabelContainer}>
                      <Text style={styles.ratingIcon}>{category.icon}</Text>
                      <View style={styles.ratingTextContainer}>
                        <Text style={styles.ratingLabel}>{category.label}</Text>
                        <Text style={styles.ratingDescription}>
                          {category.description}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.starContainer}>
                      <StarRating
                        rating={ratings[category.key]}
                        onChange={(value) =>
                          handleRatingChange(category.key, value)
                        }
                        size={28}
                        interactive={true}
                      />
                    </View>
                    {index < RATING_CATEGORIES.length - 1 && (
                      <Divider style={styles.ratingDivider} />
                    )}
                  </View>
                ))}

                {/* Overall Rating Summary for multi-criteria */}
                {isRatingComplete && (
                  <View style={styles.overallRatingContainer}>
                    <Divider style={styles.overallDivider} />
                    <View style={styles.overallRatingRow}>
                      <Text style={styles.overallRatingLabel}>
                        Overall Rating
                      </Text>
                      <View style={styles.overallRatingValue}>
                        <Text style={styles.overallRatingText}>
                          {overallRating.toFixed(1)}
                        </Text>
                        <Text style={styles.overallRatingStar}>⭐</Text>
                      </View>
                    </View>
                    <Text style={styles.overallRatingDescription}>
                      {getRatingLabel(overallRating)}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Single Rating for WORKER reviewing CLIENT */}
                <Text style={styles.sectionSubtitle}>
                  How was your experience working with this client?
                </Text>

                <View style={styles.singleRatingContainer}>
                  <StarRating
                    rating={singleRating}
                    onChange={setSingleRating}
                    size={40}
                    interactive={true}
                  />
                  {singleRating > 0 && (
                    <Text style={styles.singleRatingLabel}>
                      {getRatingLabel(singleRating)}
                    </Text>
                  )}
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Comment Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Share your experience</Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={6}
              value={comment}
              onChangeText={setComment}
              placeholder="Tell others about your experience..."
              maxLength={MAX_COMMENT_LENGTH}
              style={styles.textInput}
            />
            <View style={styles.charCounter}>
              <Text
                style={[
                  styles.charCountText,
                  remainingChars < 50 && styles.charCountWarning,
                ]}
              >
                {remainingChars} characters remaining
              </Text>
            </View>

            {/* Guidelines */}
            <Divider style={styles.divider} />
            <Text style={styles.guidelinesTitle}>Review Guidelines:</Text>
            <Text style={styles.guidelineItem}>
              • Be honest and specific about your experience
            </Text>
            <Text style={styles.guidelineItem}>
              • Focus on the work quality and professionalism
            </Text>
            <Text style={styles.guidelineItem}>
              • Avoid personal attacks or inappropriate language
            </Text>
            <Text style={styles.guidelineItem}>
              • You can edit your review within 24 hours
            </Text>
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={submitReviewMutation.isPending || !isRatingComplete}
            style={[
              styles.submitButton,
              !isRatingComplete && styles.submitButtonDisabled,
            ]}
            contentStyle={styles.submitButtonContent}
          >
            {submitReviewMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              "Submit Review"
            )}
          </Button>

          {!isRatingComplete && (
            <Text style={styles.incompleteText}>
              {isClientReviewingWorker
                ? "Please rate all categories to submit"
                : "Please select a rating to submit"}
            </Text>
          )}

          <Button
            mode="outlined"
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
            disabled={submitReviewMutation.isPending}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Fair";
  if (rating >= 1.5) return "Poor";
  return "Very Poor";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  ratingRow: {
    marginBottom: 8,
  },
  ratingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  ratingTextContainer: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  ratingDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  starContainer: {
    alignItems: "flex-start",
    marginLeft: 36,
    marginBottom: 8,
  },
  ratingDivider: {
    marginVertical: 12,
  },
  overallRatingContainer: {
    marginTop: 8,
  },
  overallDivider: {
    marginBottom: 16,
    backgroundColor: "#E0E0E0",
    height: 2,
  },
  overallRatingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overallRatingLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  overallRatingValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  overallRatingText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFB800",
    marginRight: 4,
  },
  overallRatingStar: {
    fontSize: 24,
  },
  overallRatingDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFB800",
    marginTop: 4,
  },
  singleRatingContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  singleRatingLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFB800",
    marginTop: 12,
  },
  textInput: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  charCounter: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  charCountText: {
    fontSize: 12,
    color: "#666",
  },
  charCountWarning: {
    color: "#F44336",
  },
  divider: {
    marginVertical: 16,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  guidelineItem: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  submitButton: {
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  incompleteText: {
    fontSize: 13,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 12,
  },
  cancelButton: {
    borderColor: "#999",
  },
});

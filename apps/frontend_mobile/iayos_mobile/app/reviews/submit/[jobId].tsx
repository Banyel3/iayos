/**
 * Review Submission Screen
 * Phase 8: Reviews & Ratings System
 *
 * Allows users to submit a review for a completed job
 * Features:
 * - 5-star rating selector
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
import { StarRating } from "@/components/Reviews";
import { useSubmitReview } from "@/lib/hooks/useReviews";
import { SubmitReviewRequest } from "@/lib/types/review";

const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 500;

export default function SubmitReviewScreen() {
  const { jobId, revieweeId, revieweeName, reviewerType } =
    useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitReviewMutation = useSubmitReview();

  const handleSubmit = () => {
    // Validation
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating");
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

    const reviewData: SubmitReviewRequest = {
      job_id: Number(jobId),
      reviewee_id: Number(revieweeId),
      rating: rating,
      comment: comment.trim(),
      reviewer_type: reviewerType as "CLIENT" | "WORKER",
    };

    submitReviewMutation.mutate(reviewData, {
      onSuccess: () => {
        Alert.alert("Review Submitted", "Thank you for your feedback!", [
          {
            text: "OK",
            onPress: () => router.back(),
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

        {/* Rating Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Rate your experience</Text>
            <View style={styles.ratingContainer}>
              <StarRating
                rating={rating}
                onChange={setRating}
                size={40}
                interactive={true}
              />
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {getRatingLabel(rating)} ({rating.toFixed(1)} stars)
              </Text>
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
            disabled={submitReviewMutation.isPending}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {submitReviewMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              "Submit Review"
            )}
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.back()}
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
    marginBottom: 16,
  },
  ratingContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFB800",
    textAlign: "center",
    marginTop: 8,
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
  submitButtonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    borderColor: "#999",
  },
});

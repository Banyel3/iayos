/**
 * My Reviews Screen
 * Phase 8: Reviews & Ratings System
 *
 * Shows reviews given and received by the current user
 * Features:
 * - Tab view (Given / Received)
 * - Review statistics
 * - Edit/delete own reviews (within 24 hours)
 * - Report inappropriate reviews
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  SegmentedButtons,
  ActivityIndicator,
  Card,
  Divider,
} from "react-native-paper";
import { ReviewCard, StarRating, RatingBreakdown } from "@/components/Reviews";
import {
  useMyReviews,
  useReportReview,
  useEditReview,
} from "@/lib/hooks/useReviews";
import { router } from "expo-router";

type TabType = "given" | "received";

export default function MyReviewsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("given");

  const [editingReview, setEditingReview] = useState<any>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(0);

  const { data, isLoading, error, refetch, isRefetching } = useMyReviews();
  const reportReview = useReportReview();
  const editReview = useEditReview();

  const handleReport = (reviewId: number) => {
    Alert.alert(
      "Report Review",
      "Why are you reporting this review?",
      [
        {
          text: "Spam",
          onPress: () => submitReport(reviewId, "spam"),
        },
        {
          text: "Offensive",
          onPress: () => submitReport(reviewId, "offensive"),
        },
        {
          text: "Misleading",
          onPress: () => submitReport(reviewId, "misleading"),
        },
        {
          text: "Other",
          onPress: () => submitReport(reviewId, "other"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const submitReport = (reviewId: number, reason: string) => {
    reportReview.mutate(
      { reviewId, reason: reason as any, details: "" },
      {
        onSuccess: () => {
          Alert.alert("Review Reported", "Thank you for your feedback");
          refetch();
        },
        onError: (error: Error) => {
          Alert.alert("Error", error.message);
        },
      }
    );
  };

  const handleEdit = (reviewId: number) => {
    const allReviews = data?.reviews_given || [];
    const review = allReviews.find((r) => r.review_id === reviewId);
    if (!review) return;
    setEditingReview(review);
    setEditComment(review.comment || "");
    setEditRating(review.rating || 0);
  };

  const submitEdit = () => {
    if (!editingReview) return;
    editReview.mutate(
      {
        reviewId: editingReview.review_id,
        comment: editComment,
        rating: editRating,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Review updated successfully");
          setEditingReview(null);
          refetch();
        },
        onError: (error: Error) => {
          Alert.alert("Error", error.message);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your reviews...</Text>
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

  const reviewsToShow =
    activeTab === "given" ? data?.reviews_given : data?.reviews_received;

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          buttons={[
            {
              value: "given",
              label: `Given (${data?.reviews_given.length || 0})`,
            },
            {
              value: "received",
              label: `Received (${data?.reviews_received.length || 0})`,
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Statistics (only show for received reviews) */}
        {activeTab === "received" && data?.stats && (
          <>
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={styles.statsHeader}>
                  <View style={styles.averageRating}>
                    <Text style={styles.ratingNumber}>
                      {data.stats.average_rating.toFixed(1)}
                    </Text>
                    <StarRating
                      rating={data.stats.average_rating}
                      size={24}
                      interactive={false}
                    />
                    <Text style={styles.totalReviews}>
                      {data.stats.total_reviews} reviews
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {data.stats.total_reviews > 0 && (
              <RatingBreakdown
                breakdown={data.stats.rating_breakdown}
                totalReviews={data.stats.total_reviews}
              />
            )}

            <Divider style={styles.divider} />
          </>
        )}

        {/* Reviews List */}
        {reviewsToShow && reviewsToShow.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {activeTab === "given"
                ? "Reviews you've written"
                : "Reviews about you"}
            </Text>
            {reviewsToShow.map((review) => (
              <ReviewCard
                key={review.review_id}
                review={review}
                onReport={activeTab === "received" ? handleReport : undefined}
                onEdit={activeTab === "given" ? handleEdit : undefined}
                showActions={true}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "given"
                ? "You haven't written any reviews yet"
                : "You haven't received any reviews yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === "given"
                ? "Complete jobs to leave reviews for clients"
                : "Complete more jobs to receive reviews"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Review Modal */}
      <Modal
        visible={!!editingReview}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingReview(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Review</Text>

            <Text style={styles.modalLabel}>Rating</Text>
            <StarRating
              rating={editRating}
              onChange={(r) => setEditRating(r)}
              size={32}
              interactive
            />

            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Comment</Text>
            <TextInput
              style={styles.editInput}
              value={editComment}
              onChangeText={setEditComment}
              multiline
              numberOfLines={4}
              placeholder="Update your review..."
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditingReview(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  editReview.isPending && { opacity: 0.6 },
                ]}
                onPress={submitEdit}
                disabled={editReview.isPending}
              >
                <Text style={styles.saveButtonText}>
                  {editReview.isPending ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  tabContainer: {
    padding: 16,
    backgroundColor: "#FFF",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    backgroundColor: "#F9F9F9",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

/**
 * My Reviews Screen
 * Shows reviews given and received by the current user in a single scroll view.
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
  Text,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ReviewCard, StarRating } from "@/components/Reviews";
import {
  useMyReviews,
  useEditReview,
} from "@/lib/hooks/useReviews";
import { router } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

export default function MyReviewsScreen() {
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(0);

  const { data, isLoading, error, refetch, isRefetching } = useMyReviews();
  const editReview = useEditReview();

  const openEdit = (reviewId: number) => {
    const review = (data?.reviews_given || []).find(
      (r) => r.review_id === reviewId
    );
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
          Alert.alert("Updated", "Your review has been updated.");
          setEditingReview(null);
          refetch();
        },
        onError: (err: Error) => Alert.alert("Error", err.message),
      }
    );
  };

  const reviewsGiven = data?.reviews_given || [];
  const reviewsReceived = data?.reviews_received || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF5350" />
          <Text style={styles.errorText}>Failed to load reviews.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* ── Reviews Received ── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionPill} />
            <Text style={styles.sectionTitle}>
              Reviews Received
              {reviewsReceived.length > 0 && (
                <Text style={styles.countSuffix}>
                  {"  "}({reviewsReceived.length})
                </Text>
              )}
            </Text>
          </View>

          {reviewsReceived.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="star-outline" size={28} color={Colors.border} />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            reviewsReceived.map((review) => (
              <ReviewCard key={review.review_id} review={review} />
            ))
          )}

          <View style={styles.divider} />

          {/* ── Reviews Given ── */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionPill, { backgroundColor: "#A78BFA" }]} />
            <Text style={styles.sectionTitle}>
              Reviews Given
              {reviewsGiven.length > 0 && (
                <Text style={styles.countSuffix}>
                  {"  "}({reviewsGiven.length})
                </Text>
              )}
            </Text>
          </View>

          {reviewsGiven.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="create-outline" size={28} color={Colors.border} />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            reviewsGiven.map((review) => (
              <ReviewCard
                key={review.review_id}
                review={review}
                onEdit={openEdit}
                showActions
              />
            ))
          )}
        </ScrollView>
      )}

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
            <View style={styles.dragHandle} />
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>Edit Review</Text>
              <TouchableOpacity onPress={() => setEditingReview(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <StarRating
              rating={editRating}
              onChange={(r) => setEditRating(r)}
              size={36}
              interactive
            />

            <TextInput
              style={styles.editInput}
              value={editComment}
              onChangeText={setEditComment}
              multiline
              numberOfLines={4}
              placeholder="Update your review..."
              placeholderTextColor={Colors.textSecondary}
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
                style={[styles.saveButton, editReview.isPending && { opacity: 0.6 }]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 15,
    color: "#EF5350",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionPill: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  countSuffix: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 28,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
  },
  modalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    backgroundColor: "#F9F9F9",
    color: Colors.textPrimary,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
});

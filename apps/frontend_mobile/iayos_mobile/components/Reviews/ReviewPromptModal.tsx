/**
 * ReviewPromptModal Component
 * Phase 8: Reviews & Ratings System
 *
 * Modal that prompts users to leave a review after job completion
 * Features:
 * - Appears after job is marked complete
 * - Quick star rating
 * - Navigate to full review form
 * - Dismiss option
 */

import React from "react";
import { View, StyleSheet, Modal } from "react-native";
import { Card, Text, Button, Portal, IconButton } from "react-native-paper";
import StarRating from "./StarRating";
import { router } from "expo-router";

interface ReviewPromptModalProps {
  visible: boolean;
  onDismiss: () => void;
  jobId: number;
  revieweeId: number;
  revieweeName: string;
  reviewerType: "CLIENT" | "WORKER";
}

export default function ReviewPromptModal({
  visible,
  onDismiss,
  jobId,
  revieweeId,
  revieweeName,
  reviewerType,
}: ReviewPromptModalProps) {
  const handleWriteReview = () => {
    onDismiss();
    router.push({
      pathname: "/reviews/submit/[jobId]",
      params: {
        jobId: jobId.toString(),
        revieweeId: revieweeId.toString(),
        revieweeName: revieweeName,
        reviewerType: reviewerType,
      },
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.overlay}>
          <Card style={styles.card}>
            {/* Close Button */}
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              style={styles.closeButton}
            />

            <Card.Content>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>⭐</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>How was your experience?</Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Help others by sharing your experience with {revieweeName}
              </Text>

              {/* Star Rating Preview */}
              <View style={styles.ratingContainer}>
                <StarRating rating={0} size={40} interactive={false} />
              </View>

              {/* Benefits */}
              <View style={styles.benefits}>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>
                    Help the community make informed decisions
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>
                    Improve service quality for everyone
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>
                    You can edit within 24 hours
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <Button
                mode="contained"
                onPress={handleWriteReview}
                style={styles.writeButton}
                contentStyle={styles.writeButtonContent}
              >
                Write a Review
              </Button>

              <Button mode="text" onPress={onDismiss} style={styles.laterButton}>
                Maybe Later
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  benefits: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 18,
    color: "#4CAF50",
    marginRight: 12,
    fontWeight: "bold",
  },
  benefitText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  writeButton: {
    marginBottom: 12,
  },
  writeButtonContent: {
    paddingVertical: 8,
  },
  laterButton: {
    marginBottom: 8,
  },
});

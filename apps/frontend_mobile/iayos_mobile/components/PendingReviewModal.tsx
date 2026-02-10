/**
 * PendingReviewModal
 * Full-screen blocking modal shown when user has pending reviews.
 * Cannot be dismissed - user MUST tap "Review Now" to navigate to the conversation.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";
import { PendingReview } from "../lib/hooks/useReviews";

interface PendingReviewModalProps {
  visible: boolean;
  pendingReview: PendingReview | null;
}

export default function PendingReviewModal({
  visible,
  pendingReview,
}: PendingReviewModalProps) {
  const router = useRouter();

  if (!pendingReview) return null;

  const handleReviewNow = () => {
    if (pendingReview.conversation_id) {
      router.push(`/messages/${pendingReview.conversation_id}` as any);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        // Block Android back button - cannot dismiss
      }}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            {/* Star Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={48} color="#FFB800" />
            </View>

            {/* Title */}
            <Text style={styles.title}>You have a pending review!</Text>

            {/* Job Info */}
            <Text style={styles.jobTitle}>{pendingReview.job_title}</Text>
            <Text style={styles.personName}>
              {pendingReview.review_type === "WORKER_TO_CLIENT"
                ? `Rate your client: ${pendingReview.reviewee_name}`
                : `Rate your worker: ${pendingReview.reviewee_name}`}
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              Please leave a review to complete this job. Your feedback helps
              improve the platform for everyone.
            </Text>

            {/* Review Now Button */}
            {pendingReview.conversation_id ? (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={handleReviewNow}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={20} color={Colors.white} />
                <Text style={styles.reviewButtonText}>Review Now</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noConversationText}>
                Unable to find conversation. Please contact support.
              </Text>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 380,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 4,
  },
  personName: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    gap: 8,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  noConversationText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: "center",
  },
});

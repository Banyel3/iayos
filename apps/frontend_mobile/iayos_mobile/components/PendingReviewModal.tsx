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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../constants/theme";
import { PendingReview } from "../lib/hooks/useReviews";

interface PendingReviewModalProps {
  visible: boolean;
  pendingReviews: PendingReview[];
}

export default function PendingReviewModal({
  visible,
  pendingReviews,
}: PendingReviewModalProps) {
  const router = useRouter();

  if (!pendingReviews || pendingReviews.length === 0) return null;

  const handleReviewNow = (pendingReview: PendingReview) => {
    if (pendingReview?.conversation_id) {
      router.push(`/conversation/${pendingReview.conversation_id}` as any);
    }
  };

  const getReviewInstruction = (pendingReview: PendingReview) => {
    switch (pendingReview.review_type) {
      case "WORKER_TO_CLIENT":
      case "AGENCY_TO_CLIENT":
        return `Rate your client: ${pendingReview.reviewee_name}`;
      case "CLIENT_TO_AGENCY":
        return `Rate the agency: ${pendingReview.reviewee_name}`;
      case "CLIENT_TO_AGENCY_EMPLOYEE":
        return `Rate employee: ${pendingReview.reviewee_name}`;
      default:
        return `Rate your worker: ${pendingReview.reviewee_name}`;
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
            <Text style={styles.title}>
              You have {pendingReviews.length} pending review
              {pendingReviews.length > 1 ? "s" : ""}!
            </Text>

            <ScrollView style={styles.listContainer}>
              {pendingReviews.map((pendingReview) => {
                const itemKey = `${pendingReview.job_id}-${pendingReview.review_type}-${pendingReview.reviewee_id ?? "x"}-${pendingReview.employee_id ?? "x"}-${pendingReview.worker_assignment_id ?? "x"}`;
                return (
                  <View key={itemKey} style={styles.reviewItem}>
                    <Text style={styles.jobTitle} numberOfLines={1}>
                      {pendingReview.job_title}
                    </Text>
                    <Text style={styles.personName} numberOfLines={2}>
                      {getReviewInstruction(pendingReview)}
                    </Text>

                    {pendingReview.conversation_id ? (
                      <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => handleReviewNow(pendingReview)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="star" size={18} color={Colors.white} />
                        <Text style={styles.reviewButtonText}>Review Now</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.noConversationText}>
                        Conversation unavailable. Please refresh and try again.
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Description */}
            <Text style={styles.description}>
              Please leave a review to complete this job. Your feedback helps
              improve the platform for everyone.
            </Text>
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
    alignItems: "stretch",
    width: "100%",
    maxWidth: 380,
    maxHeight: "85%",
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
  listContainer: {
    width: "100%",
    maxHeight: 290,
    gap: 10,
    marginBottom: 16,
  },
  reviewItem: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#F9FAFB",
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "left",
    marginBottom: 4,
  },
  personName: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "left",
    marginBottom: 10,
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

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

const FAQ_CATEGORIES = [
  {
    title: "Getting Started",
    icon: "rocket-outline",
    color: "#3B82F6",
    items: [
      {
        question: "How do I create a job posting?",
        answer:
          "Go to the Jobs tab, tap the + button, fill in job details (title, description, budget, location), and submit. Workers in your area will see your posting.",
      },
      {
        question: "How do I apply for jobs as a worker?",
        answer:
          "Browse available jobs in the Jobs tab. Tap on a job to view details, then tap 'Apply' to submit your application with a proposal message.",
      },
      {
        question: "What is KYC verification?",
        answer:
          "KYC (Know Your Customer) verification confirms your identity. You'll need to upload a valid ID and take a selfie. This helps keep the platform safe for everyone.",
      },
    ],
  },
  {
    title: "Payments",
    icon: "card-outline",
    color: "#10B981",
    items: [
      {
        question: "How does the payment system work?",
        answer:
          "We use an escrow system. Clients pay 50% upfront when accepting a worker, which is held securely. The remaining 50% is paid upon job completion. Workers receive payment after the client approves the work.",
      },
      {
        question: "How do I withdraw my earnings?",
        answer:
          "Go to your Wallet, tap Withdraw, enter the amount, and select your linked GCash account. Funds typically arrive within 1-3 business days.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "We currently support GCash for deposits and withdrawals. Wallet balance can be used for job payments.",
      },
    ],
  },
  {
    title: "Jobs & Work",
    icon: "briefcase-outline",
    color: "#8B5CF6",
    items: [
      {
        question: "What happens after a job is completed?",
        answer:
          "After you mark the job complete, the client reviews your work. Once approved, the remaining payment is released to your wallet. Both parties can then leave reviews.",
      },
      {
        question: "Can I cancel a job?",
        answer:
          "Jobs can be cancelled before work begins. Once work starts, contact support if there are issues. Cancellation policies may affect your ratings.",
      },
      {
        question: "How do reviews work?",
        answer:
          "After a job is completed, both the client and worker can leave reviews. Reviews include a star rating (1-5) and optional comment. Reviews are public and help build trust.",
      },
    ],
  },
  {
    title: "Account & Profile",
    icon: "person-outline",
    color: "#F59E0B",
    items: [
      {
        question: "How do I update my profile?",
        answer:
          "Go to your Profile tab, tap Edit Profile. You can update your bio, skills, hourly rate, certifications, and portfolio photos.",
      },
      {
        question: "Can I have both Worker and Client profiles?",
        answer:
          "Yes! You can create both profiles and switch between them. Tap your profile icon and select 'Switch Profile' to toggle roles.",
      },
      {
        question: "How do I reset my password?",
        answer:
          "On the login screen, tap 'Forgot Password'. Enter your email and we'll send a reset link. Check your spam folder if you don't see it.",
      },
    ],
  },
];

export default function SupportHubScreen() {
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = React.useState<number | null>(
    null
  );
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeGoBack(router, "/(tabs)/profile")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#3B82F6" }]}
            onPress={() => router.push("/support/create" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="create-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Create Ticket</Text>
            <Text style={styles.actionSubtitle}>Get help from our team</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#8B5CF6" }]}
            onPress={() => router.push("/support/tickets" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="list-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>My Tickets</Text>
            <Text style={styles.actionSubtitle}>View your requests</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSubtitle}>
            Quick answers to common questions
          </Text>

          {FAQ_CATEGORIES.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.faqCategory}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() =>
                  setExpandedCategory(
                    expandedCategory === categoryIndex ? null : categoryIndex
                  )
                }
              >
                <View style={styles.categoryLeft}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={category.color}
                    />
                  </View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                </View>
                <Ionicons
                  name={
                    expandedCategory === categoryIndex
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedCategory === categoryIndex && (
                <View style={styles.faqItems}>
                  {category.items.map((item, itemIndex) => {
                    const itemKey = `${categoryIndex}-${itemIndex}`;
                    return (
                      <View key={itemIndex} style={styles.faqItem}>
                        <TouchableOpacity
                          style={styles.faqQuestion}
                          onPress={() =>
                            setExpandedItem(
                              expandedItem === itemKey ? null : itemKey
                            )
                          }
                        >
                          <Text style={styles.questionText}>
                            {item.question}
                          </Text>
                          <Ionicons
                            name={
                              expandedItem === itemKey
                                ? "remove-circle-outline"
                                : "add-circle-outline"
                            }
                            size={20}
                            color={Colors.primary}
                          />
                        </TouchableOpacity>
                        {expandedItem === itemKey && (
                          <Text style={styles.answerText}>{item.answer}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Create a support ticket and our team will get back to you within 24
            hours.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push("/support/create" as any)}
          >
            <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 130,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    ...Typography.heading.h4,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  actionSubtitle: {
    ...Typography.body.small,
    color: "rgba(255,255,255,0.8)",
  },
  faqSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  faqCategory: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    ...Typography.body.large,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  faqItems: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  faqItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  questionText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  answerText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: Colors.primary + "10",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  contactTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  contactText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  contactButtonText: {
    ...Typography.body.medium,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

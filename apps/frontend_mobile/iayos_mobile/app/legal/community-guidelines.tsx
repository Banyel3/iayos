import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius } from "@/constants/theme";

export default function CommunityGuidelinesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => safeGoBack(router, "/(tabs)/profile")}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Guidelines</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.lastUpdated}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.lastUpdatedText}>
            Last updated: December 9, 2025
          </Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.paragraph}>
            Welcome to the iAyos community! Our platform connects clients with
            skilled workers across the Philippines. To ensure a safe,
            respectful, and productive environment for everyone, we ask all
            users to follow these Community Guidelines.
          </Text>
          <Text style={styles.paragraph}>
            By using iAyos, you agree to uphold these standards. Violations may
            result in warnings, account suspension, or permanent removal from
            the platform.
          </Text>
        </View>

        <Section title="1. Be Respectful and Professional">
          <Text style={styles.paragraph}>
            Treat all users with dignity and respect, regardless of their
            background, profession, or experience level.
          </Text>
          <DoItem text="Use polite and professional language in all communications" />
          <DoItem text="Respect other people's time and respond promptly to messages" />
          <DoItem text="Give constructive feedback in reviews" />
          <DoItem text="Honor agreements and commitments made through the platform" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="Use offensive, discriminatory, or abusive language" />
          <DontItem text="Harass, threaten, or bully other users" />
          <DontItem text="Make discriminatory comments based on race, religion, gender, age, or disability" />
          <DontItem text="Post content that is sexual, violent, or inappropriate" />
        </Section>

        <Section title="2. Be Honest and Transparent">
          <Text style={styles.paragraph}>
            Honesty builds trust in our community. Always provide accurate
            information and fulfill your commitments.
          </Text>
          <DoItem text="Provide accurate descriptions of your skills and experience" />
          <DoItem text="Post truthful job requirements and budget information" />
          <DoItem text="Upload real photos and legitimate documents for verification" />
          <DoItem text="Report issues or concerns honestly" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="Misrepresent your qualifications or work history" />
          <DontItem text="Post fake reviews or ratings" />
          <DontItem text="Use false identity documents for KYC verification" />
          <DontItem text="Create multiple accounts to manipulate the system" />
          <DontItem text="Exaggerate job requirements to attract more applicants" />
        </Section>

        <Section title="3. Ensure Safety and Security">
          <Text style={styles.paragraph}>
            Your safety is our priority. Follow these guidelines to protect
            yourself and others.
          </Text>
          <DoItem text="Complete KYC verification to build trust" />
          <DoItem text="Use the in-app messaging system for all communications" />
          <DoItem text="Keep payment transactions within the platform" />
          <DoItem text="Report suspicious behavior or safety concerns immediately" />
          <DoItem text="Meet in public places if in-person meetings are necessary" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="Share personal contact information publicly" />
          <DontItem text="Request or accept payments outside the platform" />
          <DontItem text="Meet alone in isolated or unsafe locations" />
          <DontItem text="Engage in activities that violate local laws" />
          <DontItem text="Share your account credentials with others" />
        </Section>

        <Section title="4. Respect Intellectual Property">
          <Text style={styles.paragraph}>
            Respect the creative work and intellectual property of others.
          </Text>
          <DoItem text="Only upload photos and content you own or have rights to use" />
          <DoItem text="Credit others' work when appropriate" />
          <DoItem text="Obtain permission before using others' images or content" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="Copy or use copyrighted materials without permission" />
          <DontItem text="Upload stock photos as your own work samples" />
          <DontItem text="Plagiarize job descriptions or profiles from other users" />
          <DontItem text="Share confidential client information or work materials" />
        </Section>

        <Section title="5. Fair Pricing and Payment">
          <Text style={styles.paragraph}>
            Maintain fair business practices and honor financial agreements.
          </Text>
          <DoItem text="Set reasonable and competitive prices for your services" />
          <DoItem text="Pay workers promptly upon job completion" />
          <DoItem text="Discuss pricing and scope before starting work" />
          <DoItem text="Use the escrow system as intended for mutual protection" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="Manipulate prices to exploit urgent situations" />
          <DontItem text="Request payment before work begins (except through escrow)" />
          <DontItem text="Refuse to pay for completed work without valid reason" />
          <DontItem text="Attempt to negotiate payments outside the platform" />
          <DontItem text="Abuse the dispute or backjob system" />
        </Section>

        <Section title="6. Quality Work and Professionalism">
          <Text style={styles.paragraph}>
            Deliver quality work and maintain professional standards.
          </Text>
          <DoItem text="Complete jobs to the best of your ability" />
          <DoItem text="Arrive on time for scheduled appointments" />
          <DoItem text="Communicate proactively if issues arise" />
          <DoItem text="Use proper tools and safety equipment" />
          <DoItem text="Clean up work areas after completion" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="Accept jobs you're not qualified to perform" />
          <DontItem text="Abandon jobs without valid reason" />
          <DontItem text="Provide substandard work intentionally" />
          <DontItem text="Miss scheduled appointments without notice" />
          <DontItem text="Leave work sites messy or damaged" />
        </Section>

        <Section title="7. Reviews and Ratings">
          <Text style={styles.paragraph}>
            Reviews help maintain quality and trust in our community. Use them
            responsibly.
          </Text>
          <DoItem text="Leave honest, constructive reviews based on actual experience" />
          <DoItem text="Focus on specific aspects of the work or interaction" />
          <DoItem text="Provide balanced feedback (mention both positives and areas for improvement)" />
          <DoItem text="Rate fairly based on the agreed-upon scope" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="Leave false or misleading reviews" />
          <DontItem text="Review jobs you didn't actually complete" />
          <DontItem text="Use reviews to harass or retaliate against others" />
          <DontItem text="Demand positive reviews in exchange for payment or favors" />
          <DontItem text="Leave reviews containing personal attacks or inappropriate content" />
        </Section>

        <Section title="8. Dispute Resolution">
          <Text style={styles.paragraph}>
            Disagreements happen. Handle them professionally and use our dispute
            resolution process.
          </Text>
          <DoItem text="Attempt to resolve issues directly with the other party first" />
          <DoItem text="Provide clear evidence when filing disputes (photos, messages)" />
          <DoItem text="Respond promptly to dispute inquiries from iAyos admins" />
          <DoItem text="Accept reasonable backjob requests when work is legitimately incomplete" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="File false or frivolous disputes" />
          <DontItem text="Refuse to communicate during the dispute process" />
          <DontItem text="Take matters into your own hands outside the platform" />
          <DontItem text="Abuse the backjob system to get free additional work" />
        </Section>

        <Section title="9. Account Security">
          <Text style={styles.paragraph}>
            Protect your account and respect the security of others.
          </Text>
          <DoItem text="Use a strong, unique password" />
          <DoItem text="Enable two-factor authentication if available" />
          <DoItem text="Log out on shared devices" />
          <DoItem text="Report unauthorized account access immediately" />

          <Text style={styles.dontTitle}>Don't:</Text>
          <DontItem text="Share your login credentials with anyone" />
          <DontItem text="Use someone else's account" />
          <DontItem text="Attempt to access other users' accounts" />
          <DontItem text="Create accounts with fake or misleading information" />
        </Section>

        <Section title="10. Prohibited Activities">
          <Text style={styles.paragraph}>
            The following activities are strictly prohibited and may result in
            immediate account termination:
          </Text>
          <BulletPoint text="Fraud, scams, or financial crimes" />
          <BulletPoint text="Identity theft or impersonation" />
          <BulletPoint text="Soliciting illegal services or activities" />
          <BulletPoint text="Promoting hate speech or violence" />
          <BulletPoint text="Selling or promoting illegal products" />
          <BulletPoint text="Spamming users with unsolicited messages" />
          <BulletPoint text="Using automated bots or scripts without authorization" />
          <BulletPoint text="Attempting to hack or compromise platform security" />
          <BulletPoint text="Circumventing platform fees by transacting off-platform" />
        </Section>

        <Section title="11. Reporting Violations">
          <Text style={styles.paragraph}>
            If you encounter behavior that violates these guidelines, please
            report it immediately.
          </Text>
          <DoItem text="Use the in-app report feature on profiles, messages, or jobs" />
          <DoItem text="Provide specific details and evidence when reporting" />
          <DoItem text="Contact support at support@iayos.ph for urgent matters" />
          <Text style={styles.paragraph}>
            All reports are reviewed by our team. We take violations seriously
            and will take appropriate action, which may include warnings,
            temporary suspension, or permanent account removal.
          </Text>
        </Section>

        <Section title="12. Consequences of Violations">
          <Text style={styles.paragraph}>
            Depending on the severity and frequency of violations, we may:
          </Text>
          <BulletPoint text="Issue a warning and require acknowledgment of guidelines" />
          <BulletPoint text="Temporarily suspend your account (7-30 days)" />
          <BulletPoint text="Permanently ban your account and associated payment methods" />
          <BulletPoint text="Report illegal activities to law enforcement" />
          <BulletPoint text="Withhold payments or earnings in cases of fraud" />
          <Text style={styles.paragraph}>
            We reserve the right to make final decisions on enforcement actions.
            Repeated violations will result in stricter penalties.
          </Text>
        </Section>

        <Section title="13. Updates to Guidelines">
          <Text style={styles.paragraph}>
            These Community Guidelines may be updated periodically. We will
            notify users of significant changes through the app. Continued use
            of iAyos after updates constitutes acceptance of the revised
            guidelines.
          </Text>
        </Section>

        <Section title="14. Contact Us">
          <Text style={styles.paragraph}>
            If you have questions about these guidelines or need to report a
            violation:
          </Text>
          <Text style={styles.contactInfo}>Email: community@iayos.ph</Text>
          <Text style={styles.contactInfo}>Support: support@iayos.ph</Text>
          <Text style={styles.contactInfo}>Phone: +63 XXX XXX XXXX</Text>
        </Section>

        <View style={styles.acknowledgment}>
          <Ionicons name="people-circle" size={24} color={Colors.primary} />
          <Text style={styles.acknowledgmentText}>
            Together, we build a trusted community. Thank you for being a
            respectful and responsible member of iAyos. May sira? May iAyos!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Components
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DoItem({ text }: { text: string }) {
  return (
    <View style={styles.doItem}>
      <View style={styles.doIcon}>
        <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
      </View>
      <Text style={styles.doText}>{text}</Text>
    </View>
  );
}

function DontItem({ text }: { text: string }) {
  return (
    <View style={styles.dontItem}>
      <View style={styles.dontIcon}>
        <Ionicons name="close-circle" size={18} color={Colors.error} />
      </View>
      <Text style={styles.dontText}>{text}</Text>
    </View>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletPoint}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
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
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    marginBottom: 8,
  },
  lastUpdatedText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  intro: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  dontTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  doItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingLeft: 8,
  },
  doIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  doText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  dontItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingLeft: 8,
  },
  dontIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  dontText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 12,
  },
  bullet: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginRight: 8,
    fontWeight: "600",
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  contactInfo: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.primary,
    marginBottom: 4,
    paddingLeft: 12,
  },
  acknowledgment: {
    flexDirection: "row",
    backgroundColor: `${Colors.primary}10`,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
    alignItems: "center",
  },
  acknowledgmentText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
});

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

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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

        <Section title="1. Agreement to Terms">
          <Text style={styles.paragraph}>
            By accessing and using iAyos ("the Platform"), you accept and agree
            to be bound by the terms and provisions of this agreement. If you do
            not agree to these terms, please do not use the Platform.
          </Text>
          <Text style={styles.paragraph}>
            iAyos is a marketplace platform connecting clients with skilled
            blue-collar workers in the Philippines. We facilitate connections
            but are not responsible for the actual services provided.
          </Text>
        </Section>

        <Section title="2. User Eligibility">
          <Text style={styles.paragraph}>To use iAyos, you must:</Text>
          <BulletPoint text="Be at least 18 years old" />
          <BulletPoint text="Have the legal capacity to enter into binding contracts" />
          <BulletPoint text="Provide accurate and complete registration information" />
          <BulletPoint text="Be a resident of the Philippines or legally authorized to work in the Philippines (for workers)" />
          <BulletPoint text="Comply with all local, national, and international laws" />
        </Section>

        <Section title="3. Account Registration and Security">
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Registration:</Text> You must create an
            account to use certain features. You agree to provide accurate,
            current, and complete information during registration.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Account Security:</Text> You are
            responsible for maintaining the confidentiality of your account
            credentials. You agree to notify us immediately of any unauthorized
            use of your account.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Account Types:</Text> Users can register
            as Clients (seeking services), Workers (providing services), or
            Agencies (managing multiple workers).
          </Text>
        </Section>

        <Section title="4. User Conduct and Responsibilities">
          <Text style={styles.paragraph}>You agree NOT to:</Text>
          <BulletPoint text="Provide false, misleading, or fraudulent information" />
          <BulletPoint text="Use the Platform for illegal activities" />
          <BulletPoint text="Harass, abuse, or harm other users" />
          <BulletPoint text="Circumvent or manipulate the Platform's fee structure" />
          <BulletPoint text="Post inappropriate, offensive, or discriminatory content" />
          <BulletPoint text="Attempt to gain unauthorized access to the Platform" />
          <BulletPoint text="Use automated systems (bots) without authorization" />
          <BulletPoint text="Solicit users to transact outside the Platform to avoid fees" />
        </Section>

        <Section title="5. Services and Marketplace">
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>For Clients:</Text> You can post job
            requests, review worker applications, hire workers, and pay for
            services through the Platform. You are responsible for providing
            accurate job descriptions and requirements.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>For Workers:</Text> You can browse
            available jobs, submit applications, and complete work assignments.
            You represent that you have the skills and qualifications stated in
            your profile.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Platform Role:</Text> iAyos acts as an
            intermediary and does not employ workers or guarantee the quality of
            services. We are not party to the actual service agreements between
            clients and workers.
          </Text>
        </Section>

        <Section title="6. Payment Terms">
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Escrow System:</Text> iAyos uses a secure
            escrow system. Clients pay a 50% downpayment when hiring a worker,
            which is held in escrow until job completion.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Platform Fee:</Text> A 5% platform fee is
            applied to the downpayment amount. This fee supports Platform
            operations, security, and customer support.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Payment Methods:</Text> We accept GCash,
            wallet deposits, and cash payments (with admin verification). All
            payments are processed securely through our payment partner.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Worker Earnings:</Text> Workers receive
            payment after successful job completion and client approval. Funds
            are transferred to worker wallets and can be withdrawn.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Refunds:</Text> Refund eligibility is
            determined on a case-by-case basis. See our Dispute Resolution
            section for details.
          </Text>
        </Section>

        <Section title="7. Job Completion and Disputes">
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Two-Phase Completion:</Text> Jobs require
            both worker and client confirmation before being marked complete.
            This ensures mutual satisfaction.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Backjob System:</Text> If a client is
            unsatisfied with completed work, they may request a "backjob"
            (remedial work) through the Platform. Workers must complete approved
            backjobs at no additional cost.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Dispute Resolution:</Text> Disputes are
            reviewed by iAyos administrators. We reserve the right to make final
            decisions on fund distribution in disputed cases.
          </Text>
        </Section>

        <Section title="8. KYC Verification">
          <Text style={styles.paragraph}>
            To ensure Platform safety, we require Know Your Customer (KYC)
            verification for:
          </Text>
          <BulletPoint text="All workers before they can apply for jobs" />
          <BulletPoint text="Agency owners and their employees" />
          <BulletPoint text="Clients making high-value transactions" />
          <Text style={styles.paragraph}>
            KYC requires government-issued ID and may include selfie
            verification. We store this data securely and use it only for
            verification purposes.
          </Text>
        </Section>

        <Section title="9. Reviews and Ratings">
          <Text style={styles.paragraph}>
            After job completion, both parties can leave reviews and ratings.
            Reviews must be honest, accurate, and not contain offensive content.
            We reserve the right to remove reviews that violate our Community
            Guidelines.
          </Text>
        </Section>

        <Section title="10. Intellectual Property">
          <Text style={styles.paragraph}>
            The iAyos Platform, including its design, features, and content, is
            owned by iAyos and protected by copyright and trademark laws. You
            may not copy, modify, or distribute our content without permission.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>User Content:</Text> By posting content
            (profiles, job descriptions, photos), you grant iAyos a
            non-exclusive license to use, display, and distribute this content
            on the Platform.
          </Text>
        </Section>

        <Section title="11. Privacy and Data Protection">
          <Text style={styles.paragraph}>
            Your privacy is important to us. Our collection and use of personal
            information is governed by our Privacy Policy. By using iAyos, you
            consent to our data practices as described in the Privacy Policy.
          </Text>
        </Section>

        <Section title="12. Limitation of Liability">
          <Text style={styles.paragraph}>iAyos is not liable for:</Text>
          <BulletPoint text="Quality, safety, legality, or timing of services provided by workers" />
          <BulletPoint text="Actions, conduct, or content of Platform users" />
          <BulletPoint text="Property damage or personal injury resulting from services" />
          <BulletPoint text="Unauthorized access to your account" />
          <BulletPoint text="Platform interruptions or technical errors" />
          <Text style={styles.paragraph}>
            Our total liability to you for any claims shall not exceed the
            amount of fees you paid to iAyos in the past 12 months.
          </Text>
        </Section>

        <Section title="13. Indemnification">
          <Text style={styles.paragraph}>
            You agree to indemnify and hold harmless iAyos, its officers,
            employees, and partners from any claims, damages, losses, or
            expenses arising from your use of the Platform, violation of these
            Terms, or infringement of any rights of another party.
          </Text>
        </Section>

        <Section title="14. Termination">
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your account at any
            time for:
          </Text>
          <BulletPoint text="Violation of these Terms of Service" />
          <BulletPoint text="Fraudulent or illegal activity" />
          <BulletPoint text="Failure to maintain account security" />
          <BulletPoint text="Repeated complaints from other users" />
          <Text style={styles.paragraph}>
            You may terminate your account at any time by contacting support.
            Upon termination, your wallet balance will be made available for
            withdrawal within 30 days.
          </Text>
        </Section>

        <Section title="15. Modifications to Terms">
          <Text style={styles.paragraph}>
            iAyos reserves the right to modify these Terms at any time. We will
            notify users of significant changes via email or in-app
            notification. Continued use of the Platform after changes
            constitutes acceptance of the modified Terms.
          </Text>
        </Section>

        <Section title="16. Governing Law">
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with
            the laws of the Republic of the Philippines. Any disputes arising
            from these Terms shall be subject to the exclusive jurisdiction of
            Philippine courts.
          </Text>
        </Section>

        <Section title="17. Contact Information">
          <Text style={styles.paragraph}>
            For questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>Email: support@iayos.ph</Text>
          <Text style={styles.contactInfo}>Phone: +63 XXX XXX XXXX</Text>
          <Text style={styles.contactInfo}>
            Address: Zamboanga City, Philippines
          </Text>
        </Section>

        <View style={styles.acknowledgment}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.acknowledgmentText}>
            By using iAyos, you acknowledge that you have read, understood, and
            agree to be bound by these Terms of Service.
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
  bold: {
    fontWeight: "600",
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
    backgroundColor: `${Colors.success}15`,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  acknowledgmentText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
});

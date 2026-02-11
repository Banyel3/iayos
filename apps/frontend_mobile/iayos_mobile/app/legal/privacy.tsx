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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
            At iAyos, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our mobile application and services.
          </Text>
          <Text style={styles.paragraph}>
            Please read this policy carefully. By using iAyos, you agree to the
            collection and use of information in accordance with this policy.
          </Text>
        </View>

        <Section title="1. Information We Collect">
          <Text style={styles.subsectionTitle}>1.1 Personal Information</Text>
          <Text style={styles.paragraph}>
            When you register and use iAyos, we collect:
          </Text>
          <BulletPoint text="Full name, email address, and phone number" />
          <BulletPoint text="Profile photos and avatar images" />
          <BulletPoint text="Government-issued ID for KYC verification" />
          <BulletPoint text="Selfie photos for identity verification" />
          <BulletPoint text="Work skills, certifications, and qualifications (for workers)" />
          <BulletPoint text="Business information (for agencies)" />

          <Text style={styles.subsectionTitle}>1.2 Location Information</Text>
          <Text style={styles.paragraph}>
            We collect your precise location data when you:
          </Text>
          <BulletPoint text="Enable location services in the app" />
          <BulletPoint text="Post job requests (to match with nearby workers)" />
          <BulletPoint text="Browse available jobs as a worker" />
          <Text style={styles.paragraph}>
            Location data helps us provide relevant job matches based on
            proximity. You can disable location access in your device settings,
            but this may limit certain features.
          </Text>

          <Text style={styles.subsectionTitle}>1.3 Payment Information</Text>
          <Text style={styles.paragraph}>
            For payment processing, we collect:
          </Text>
          <BulletPoint text="GCash account information" />
          <BulletPoint text="Wallet transaction history" />
          <BulletPoint text="Payment method details (stored securely via our payment processor)" />
          <BulletPoint text="Bank account information for withdrawals" />

          <Text style={styles.subsectionTitle}>1.4 Usage Data</Text>
          <Text style={styles.paragraph}>
            We automatically collect certain information when you use iAyos:
          </Text>
          <BulletPoint text="Device information (model, OS version, unique identifiers)" />
          <BulletPoint text="IP address and browser type" />
          <BulletPoint text="App usage statistics and feature interactions" />
          <BulletPoint text="Crash reports and performance data" />
          <BulletPoint text="Pages visited and time spent on the Platform" />

          <Text style={styles.subsectionTitle}>1.5 User-Generated Content</Text>
          <Text style={styles.paragraph}>
            We store content you create on the Platform:
          </Text>
          <BulletPoint text="Job descriptions and requirements" />
          <BulletPoint text="Job applications and proposals" />
          <BulletPoint text="Messages and communications with other users" />
          <BulletPoint text="Reviews and ratings" />
          <BulletPoint text="Portfolio images and work samples" />
          <BulletPoint text="Dispute evidence (photos and descriptions)" />
        </Section>

        <Section title="2. How We Use Your Information">
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <BulletPoint text="Create and manage your account" />
          <BulletPoint text="Facilitate job postings and worker-client matching" />
          <BulletPoint text="Process payments and manage your wallet" />
          <BulletPoint text="Verify your identity through KYC processes" />
          <BulletPoint text="Send notifications about jobs, applications, and messages" />
          <BulletPoint text="Provide customer support and resolve disputes" />
          <BulletPoint text="Improve Platform features and user experience" />
          <BulletPoint text="Detect and prevent fraud, abuse, and security incidents" />
          <BulletPoint text="Comply with legal obligations and enforce our Terms of Service" />
          <BulletPoint text="Send marketing communications (with your consent)" />
          <BulletPoint text="Analyze usage patterns and generate aggregate statistics" />
        </Section>

        <Section title="3. How We Share Your Information">
          <Text style={styles.subsectionTitle}>3.1 With Other Users</Text>
          <Text style={styles.paragraph}>
            When you use iAyos, certain information is visible to other users:
          </Text>
          <BulletPoint text="Workers: Profile photo, name, skills, ratings, location (city/barangay)" />
          <BulletPoint text="Clients: Name, profile photo, ratings, job history (for hired workers)" />
          <BulletPoint text="Messages are visible only to conversation participants" />

          <Text style={styles.subsectionTitle}>3.2 With Service Providers</Text>
          <Text style={styles.paragraph}>
            We share data with trusted third-party service providers who help us
            operate the Platform:
          </Text>
          <BulletPoint text="PayMongo (payment processing)" />
          <BulletPoint text="Supabase (file storage for images and documents)" />
          <BulletPoint text="Cloud hosting providers (AWS, Google Cloud, or similar)" />
          <BulletPoint text="Email service providers (for transactional emails)" />
          <BulletPoint text="Analytics providers (to improve app performance)" />
          <Text style={styles.paragraph}>
            These providers are contractually obligated to protect your data and
            use it only for specified purposes.
          </Text>

          <Text style={styles.subsectionTitle}>3.3 For Legal Reasons</Text>
          <Text style={styles.paragraph}>
            We may disclose your information if required by law or in response
            to:
          </Text>
          <BulletPoint text="Legal process (subpoenas, court orders, government requests)" />
          <BulletPoint text="Investigations of potential violations of our Terms" />
          <BulletPoint text="Protection of rights, property, or safety of iAyos, users, or the public" />
          <BulletPoint text="Compliance with Philippine laws and regulations" />

          <Text style={styles.subsectionTitle}>3.4 Business Transfers</Text>
          <Text style={styles.paragraph}>
            In the event of a merger, acquisition, or sale of assets, your
            information may be transferred to the acquiring entity. We will
            notify you of any such change.
          </Text>

          <Text style={styles.subsectionTitle}>3.5 With Your Consent</Text>
          <Text style={styles.paragraph}>
            We may share your information with other parties when you explicitly
            consent, such as when you choose to share your profile publicly or
            participate in promotional campaigns.
          </Text>
        </Section>

        <Section title="4. Data Security">
          <Text style={styles.paragraph}>
            We implement industry-standard security measures to protect your
            information:
          </Text>
          <BulletPoint text="Encryption of data in transit (HTTPS/TLS)" />
          <BulletPoint text="Secure storage of sensitive data (KYC documents, payment info)" />
          <BulletPoint text="Regular security audits and vulnerability assessments" />
          <BulletPoint text="Access controls limiting employee access to personal data" />
          <BulletPoint text="Two-factor authentication options for account protection" />
          <Text style={styles.paragraph}>
            However, no method of transmission or storage is 100% secure. While
            we strive to protect your data, we cannot guarantee absolute
            security.
          </Text>
        </Section>

        <Section title="5. Data Retention">
          <Text style={styles.paragraph}>
            We retain your information for as long as necessary to provide our
            services and comply with legal obligations:
          </Text>
          <BulletPoint text="Account data: Until you delete your account, plus 30 days" />
          <BulletPoint text="Transaction records: 7 years (for financial compliance)" />
          <BulletPoint text="KYC documents: 5 years after account closure (legal requirement)" />
          <BulletPoint text="Messages and content: Until deletion by user or account closure" />
          <BulletPoint text="Usage logs: 90 days" />
          <Text style={styles.paragraph}>
            After these periods, we securely delete or anonymize your data
            unless retention is required by law.
          </Text>
        </Section>

        <Section title="6. Your Privacy Rights">
          <Text style={styles.paragraph}>
            Under the Philippine Data Privacy Act of 2012, you have the
            following rights:
          </Text>
          <BulletPoint text="Access: Request a copy of your personal data we hold" />
          <BulletPoint text="Correction: Update or correct inaccurate information" />
          <BulletPoint text="Deletion: Request deletion of your account and data" />
          <BulletPoint text="Objection: Object to certain uses of your data (e.g., marketing)" />
          <BulletPoint text="Portability: Receive your data in a structured, machine-readable format" />
          <BulletPoint text="Withdraw Consent: Revoke consent for non-essential data processing" />
          <Text style={styles.paragraph}>
            To exercise these rights, contact us at privacy@iayos.ph. We will
            respond within 15 business days.
          </Text>
        </Section>

        <Section title="7. Children's Privacy">
          <Text style={styles.paragraph}>
            iAyos is not intended for users under 18 years old. We do not
            knowingly collect personal information from children. If we discover
            that a child has provided us with personal information, we will
            delete it immediately. Parents or guardians who believe their child
            has provided information should contact us.
          </Text>
        </Section>

        <Section title="8. Location Data and Permissions">
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Location Tracking:</Text> We use your
            location to match clients with nearby workers and show relevant job
            opportunities. Location data is collected only when the app is in
            use (not in the background).
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Disabling Location:</Text> You can disable
            location access in your device settings. However, this will limit
            job matching features and may affect user experience.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Other Permissions:</Text> The app may
            request permissions for camera (profile photos, KYC verification),
            storage (document uploads), and notifications (job alerts). You can
            manage these in your device settings.
          </Text>
        </Section>

        <Section title="9. Cookies and Tracking Technologies">
          <Text style={styles.paragraph}>
            The iAyos mobile app does not use cookies, but we use similar
            technologies:
          </Text>
          <BulletPoint text="Session tokens for authentication" />
          <BulletPoint text="Local storage for app preferences and cached data" />
          <BulletPoint text="Analytics SDKs to track app usage (anonymized when possible)" />
          <BulletPoint text="Crash reporting tools to improve stability" />
          <Text style={styles.paragraph}>
            You can opt out of analytics tracking in the app settings.
          </Text>
        </Section>

        <Section title="10. International Data Transfers">
          <Text style={styles.paragraph}>
            Your data is primarily stored and processed in the Philippines.
            However, some service providers (e.g., cloud hosting, payment
            processors) may transfer data to servers in other countries. We
            ensure that such transfers comply with Philippine data protection
            laws and that appropriate safeguards are in place.
          </Text>
        </Section>

        <Section title="11. Marketing Communications">
          <Text style={styles.paragraph}>
            We may send you promotional emails, push notifications, or SMS
            messages about:
          </Text>
          <BulletPoint text="New features and platform updates" />
          <BulletPoint text="Special offers and promotions" />
          <BulletPoint text="Tips for using iAyos effectively" />
          <Text style={styles.paragraph}>
            You can opt out of marketing communications at any time by:
          </Text>
          <BulletPoint text="Clicking 'Unsubscribe' in emails" />
          <BulletPoint text="Disabling push notifications in app settings" />
          <BulletPoint text="Replying 'STOP' to SMS messages" />
          <Text style={styles.paragraph}>
            Note: You cannot opt out of transactional messages (e.g., payment
            confirmations, security alerts).
          </Text>
        </Section>

        <Section title="12. Changes to This Privacy Policy">
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes via:
          </Text>
          <BulletPoint text="Email to your registered address" />
          <BulletPoint text="In-app notification" />
          <BulletPoint text="Notice on the app's settings page" />
          <Text style={styles.paragraph}>
            The "Last Updated" date at the top of this policy will reflect the
            most recent version. We encourage you to review this policy
            periodically.
          </Text>
        </Section>

        <Section title="13. Contact Us">
          <Text style={styles.paragraph}>
            If you have questions or concerns about this Privacy Policy or our
            data practices, please contact us:
          </Text>
          <Text style={styles.contactInfo}>Email: privacy@iayos.ph</Text>
          <Text style={styles.contactInfo}>Phone: +63 XXX XXX XXXX</Text>
          <Text style={styles.contactInfo}>
            Mailing Address:{"\n"}
            iAyos Data Privacy Officer{"\n"}
            Zamboanga City, Philippines
          </Text>
        </Section>

        <Section title="14. Data Privacy Officer">
          <Text style={styles.paragraph}>
            As required by the Philippine Data Privacy Act, we have designated a
            Data Privacy Officer (DPO) to oversee compliance with data
            protection laws. You can contact our DPO at dpo@iayos.ph for
            privacy-related inquiries.
          </Text>
        </Section>

        <View style={styles.acknowledgment}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
          <Text style={styles.acknowledgmentText}>
            Your privacy is important to us. We are committed to protecting your
            personal information and using it responsibly to provide you with
            the best possible service.
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
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
    backgroundColor: `${Colors.primary}10`,
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

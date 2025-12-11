import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius } from "@/constants/theme";

export default function AboutScreen() {
  const openWebsite = () => {
    Linking.openURL("https://iayos.ph");
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About iAyos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* App Logo/Icon Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="construct" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>iAyos</Text>
          <Text style={styles.tagline}>May sira? May iAyos.</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Mission Section */}
        <Section title="Our Mission">
          <Text style={styles.paragraph}>
            iAyos is on a mission to empower Filipino blue-collar workers by
            connecting them with clients who need their skills. We believe in
            fair pay, safe work environments, and creating economic
            opportunities for skilled workers across the Philippines.
          </Text>
          <Text style={styles.paragraph}>
            Whether it's fixing a leaking pipe, repairing electrical wiring, or
            renovating a home, iAyos makes it easy to find trusted professionals
            in your area.
          </Text>
        </Section>

        {/* What We Do */}
        <Section title="What We Do">
          <FeatureItem
            icon="people-outline"
            title="Connect People"
            description="We bridge the gap between clients who need services and skilled workers ready to help."
          />
          <FeatureItem
            icon="shield-checkmark-outline"
            title="Build Trust"
            description="Through KYC verification, ratings, and secure payments, we ensure safety and accountability."
          />
          <FeatureItem
            icon="wallet-outline"
            title="Secure Payments"
            description="Our escrow system protects both parties, ensuring fair payment for completed work."
          />
          <FeatureItem
            icon="location-outline"
            title="Local First"
            description="Find workers in your area quickly, reducing travel time and supporting local communities."
          />
        </Section>

        {/* Why Choose iAyos */}
        <Section title="Why Choose iAyos?">
          <BulletPoint text="Verified Workers: All service providers undergo KYC verification" />
          <BulletPoint text="Transparent Pricing: Clear costs with no hidden fees" />
          <BulletPoint text="Secure Escrow: Your payment is protected until work is complete" />
          <BulletPoint text="Real Reviews: Honest ratings from real clients and workers" />
          <BulletPoint text="Quick Response: Find available workers near you in minutes" />
          <BulletPoint text="Fair Platform: Only 5% platform fee on downpayment (2.5% of total job value)" />
        </Section>

        {/* How It Works */}
        <Section title="How It Works">
          <Text style={styles.stepTitle}>For Clients:</Text>
          <StepItem
            number={1}
            text="Post your job request with details and budget"
          />
          <StepItem
            number={2}
            text="Review applications from qualified workers"
          />
          <StepItem
            number={3}
            text="Hire your chosen worker with secure escrow payment"
          />
          <StepItem
            number={4}
            text="Monitor work progress and approve completion"
          />
          <StepItem number={5} text="Leave a review to help other clients" />

          <Text style={[styles.stepTitle, { marginTop: 20 }]}>
            For Workers:
          </Text>
          <StepItem
            number={1}
            text="Complete KYC verification to build trust"
          />
          <StepItem number={2} text="Browse available jobs in your area" />
          <StepItem number={3} text="Apply with your proposal and rate" />
          <StepItem number={4} text="Complete the work and get paid securely" />
          <StepItem
            number={5}
            text="Build your reputation with positive reviews"
          />
        </Section>

        {/* Values */}
        <Section title="Our Values">
          <ValueCard
            icon="heart-outline"
            title="Respect"
            description="We treat all users with dignity, regardless of their profession or background."
          />
          <ValueCard
            icon="checkmark-circle-outline"
            title="Integrity"
            description="We promote honesty, transparency, and ethical business practices."
          />
          <ValueCard
            icon="people-outline"
            title="Community"
            description="We build a supportive ecosystem where everyone can succeed."
          />
          <ValueCard
            icon="trending-up-outline"
            title="Growth"
            description="We help workers develop their skills and grow their businesses."
          />
        </Section>

        {/* Team */}
        <Section title="The Team">
          <Text style={styles.paragraph}>
            iAyos was founded by a passionate team of technologists and
            community advocates who saw the need for a trusted platform
            connecting Filipino workers with clients. We're based in Zamboanga
            City and are committed to expanding across the Philippines.
          </Text>
          <Text style={styles.paragraph}>
            Our team includes software engineers, UX designers, customer support
            specialists, and community managers—all dedicated to creating the
            best experience for our users.
          </Text>
        </Section>

        {/* Contact */}
        <Section title="Get in Touch">
          <ContactButton
            icon="mail-outline"
            label="Email Support"
            value="support@iayos.ph"
            onPress={() => openEmail("support@iayos.ph")}
          />
          <ContactButton
            icon="chatbubble-ellipses-outline"
            label="General Inquiries"
            value="hello@iayos.ph"
            onPress={() => openEmail("hello@iayos.ph")}
          />
          <ContactButton
            icon="briefcase-outline"
            label="Business Partnerships"
            value="partnerships@iayos.ph"
            onPress={() => openEmail("partnerships@iayos.ph")}
          />
          <ContactButton
            icon="globe-outline"
            label="Visit Our Website"
            value="iayos.ph"
            onPress={openWebsite}
          />
        </Section>

        {/* Social Media */}
        <Section title="Follow Us">
          <View style={styles.socialContainer}>
            <SocialButton icon="logo-facebook" label="Facebook" />
            <SocialButton icon="logo-instagram" label="Instagram" />
            <SocialButton icon="logo-twitter" label="Twitter" />
            <SocialButton icon="logo-tiktok" label="TikTok" />
          </View>
        </Section>

        {/* Legal Links */}
        <Section title="Legal & Policies">
          <LegalLink
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => router.push("/legal/terms" as any)}
          />
          <LegalLink
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push("/legal/privacy" as any)}
          />
          <LegalLink
            icon="people-outline"
            label="Community Guidelines"
            onPress={() => router.push("/legal/community-guidelines" as any)}
          />
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 iAyos. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Proudly serving communities across the Philippines
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ in Zamboanga City
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

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={28} color={Colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletPoint}>
      <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function StepItem({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.valueCard}>
      <View style={styles.valueIcon}>
        <Ionicons name={icon as any} size={24} color={Colors.primary} />
      </View>
      <View style={styles.valueContent}>
        <Text style={styles.valueTitle}>{title}</Text>
        <Text style={styles.valueDescription}>{description}</Text>
      </View>
    </View>
  );
}

function ContactButton({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.contactButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contactIcon}>
        <Ionicons name={icon as any} size={22} color={Colors.primary} />
      </View>
      <View style={styles.contactContent}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
    </TouchableOpacity>
  );
}

function SocialButton({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
      <Ionicons name={icon as any} size={24} color={Colors.primary} />
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function LegalLink({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.legalLink}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={20} color={Colors.textSecondary} />
      <Text style={styles.legalLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
    </TouchableOpacity>
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
  logoSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 12,
  },
  versionBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingLeft: 4,
    gap: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingLeft: 4,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
    paddingTop: 3,
  },
  valueCard: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.primary,
  },
  socialContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  legalLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  legalLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 13,
    color: Colors.textHint,
    marginBottom: 4,
  },
});

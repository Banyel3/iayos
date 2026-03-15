/**
 * Agency Detail Screen - Full agency profile view
 *
 * Features:
 * - Agency logo and basic info
 * - Rating and reviews
 * - Description
 * - Active workers count
 * - Specializations
 * - Contact information
 * - Featured workers
 * - Contact/hire button
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";
import { fetchJson, ENDPOINTS } from "@/lib/api/config";
import { useSubmitReport } from "@/lib/hooks/useReports";
import { getVerificationLevelTag } from "@/lib/utils/verification-utils";

interface AgencyWorker {
  id: number;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  rating: number;
  completedJobs: number;
  specialization?: string;
}

interface AgencyDetail {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  logo?: string;
  description?: string;
  rating: number;
  reviewCount: number;
  totalJobsCompleted: number;
  activeWorkers: number;
  specializations: string[];
  city?: string;
  province?: string;
  verified: boolean;
  verificationLevel?: number;
  establishedDate: string;
  workers: AgencyWorker[];
}

export default function AgencyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const submitReportMutation = useSubmitReport();
  const [isBioExpanded, setIsBioExpanded] = useState(true);
  const [isSpecializationsExpanded, setIsSpecializationsExpanded] = useState(true);
  const [isWorkersExpanded, setIsWorkersExpanded] = useState(true);

  // Fetch agency details
  const { data, isLoading, error } = useQuery({
    queryKey: ["agency", id],
    queryFn: async () => {
      const response = await fetchJson<any>(ENDPOINTS.AGENCY_DETAIL(Number(id)));
      const rawAgency = response.agency || response.data || response;

      // Normalize snake_case/camelCase variants from backend responses.
      return {
        ...rawAgency,
        rating: Number(rawAgency.rating ?? rawAgency.average_rating ?? 0),
        reviewCount: Number(rawAgency.reviewCount ?? rawAgency.review_count ?? 0),
        totalJobsCompleted: Number(
          rawAgency.totalJobsCompleted ?? rawAgency.total_jobs_completed ?? 0,
        ),
        activeWorkers: Number(rawAgency.activeWorkers ?? rawAgency.active_workers ?? 0),
        verificationLevel:
          typeof rawAgency.verificationLevel === "number"
            ? rawAgency.verificationLevel
            : typeof rawAgency.verification_level === "number"
              ? rawAgency.verification_level
              : undefined,
      } as AgencyDetail;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load agency details</Text>
          <TouchableOpacity
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isClient = user?.profile_data?.profileType === "CLIENT";
  const verificationLevelTag = getVerificationLevelTag(
    data.verificationLevel,
    data.verified,
  );

  const submitAgencyReport = (reason: "spam" | "harassment" | "fraud" | "inappropriate" | "fake_profile" | "other") => {
    submitReportMutation.mutate(
      {
        report_type: "user",
        reason,
        // Since we don't have accountId for agency directly in the same way, we rely on the agency ID
        // Note: You might need to adjust reported_user_id depending on your backend schema for reporting agencies
        reported_user_id: data.id,
        related_content_id: data.id,
        description: `Reported agency profile: ${data.name}. Reason: ${reason}`,
      },
      {
        onSuccess: () => {
          Alert.alert("Report Submitted", "Thank you. Your report has been submitted for admin review.");
        },
        onError: (error) => {
          Alert.alert("Report Failed", error instanceof Error ? error.message : "Failed to submit report");
        },
      },
    );
  };

  const openAgencyReportMenu = () => {
    const options = ["Cancel", "Spam", "Harassment", "Fraud/Scam", "Inappropriate", "Fake Profile"];

    const onSelect = (index: number) => {
      if (index === 1) submitAgencyReport("spam");
      if (index === 2) submitAgencyReport("harassment");
      if (index === 3) submitAgencyReport("fraud");
      if (index === 4) submitAgencyReport("inappropriate");
      if (index === 5) submitAgencyReport("fake_profile");
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
          title: "Report Agency",
          message: "Select a reason for reporting this agency profile.",
        },
        onSelect,
      );
      return;
    }

    Alert.alert("Report Agency", "Select a reason", [
      { text: "Spam", onPress: () => submitAgencyReport("spam") },
      { text: "Harassment", onPress: () => submitAgencyReport("harassment") },
      { text: "Fraud/Scam", onPress: () => submitAgencyReport("fraud") },
      { text: "Inappropriate", onPress: () => submitAgencyReport("inappropriate") },
      { text: "Fake Profile", onPress: () => submitAgencyReport("fake_profile") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderWorkerCard = ({ item }: { item: AgencyWorker }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    return (
      <TouchableOpacity
        style={styles.workerCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/workers/${item.id}`)}
      >
        {item.profilePicture ? (
          <Image
            source={{ uri: item.profilePicture }}
            style={styles.workerAvatar}
          />
        ) : (
          <View style={[styles.workerAvatar, styles.workerAvatarPlaceholder]}>
            <Text style={styles.workerAvatarText}>
              {item.firstName.charAt(0)}
              {item.lastName.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.workerInfo}>
          <Text style={styles.workerName} numberOfLines={1}>
            {fullName}
          </Text>
          {item.specialization && (
            <Text style={styles.workerSpec} numberOfLines={1}>
              {item.specialization}
            </Text>
          )}
          <View style={styles.workerStats}>
            <View style={styles.workerStatItem}>
              <Ionicons name="star" size={12} color={Colors.warning} />
              <Text style={styles.workerStatText}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
            <View style={styles.workerStatItem}>
              <Ionicons
                name="briefcase"
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.workerStatText}>
                {item.completedJobs} jobs
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agency Profile</Text>
          {isClient && user?.kycVerified ? (
            <TouchableOpacity
              style={styles.shareButton} // Reusing shareButton styles for the circle look
              onPress={openAgencyReportMenu}
              disabled={submitReportMutation.isPending}
            >
              {submitReportMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Ionicons
                  name="flag-outline"
                  size={22}
                  color={Colors.error}
                />
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            {verificationLevelTag && (
              <View style={styles.verificationLevelTag}>
                <Text style={styles.verificationLevelTagText}>
                  {verificationLevelTag}
                </Text>
              </View>
            )}
            <View style={styles.logoContainer}>
              {data.logo ? (
                <Image source={{ uri: data.logo }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoPlaceholder]}>
                  <Ionicons name="business" size={40} color={Colors.white} />
                </View>
              )}
              {data.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={28}
                    color={Colors.success}
                  />
                </View>
              )}
            </View>

            <Text style={styles.name}>{data.name}</Text>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color={Colors.warning} />
              <Text style={styles.ratingText}>{data.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({data.reviewCount} reviews)
              </Text>
            </View>

            {/* Location */}
            {(data.city || data.province) && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.locationText}>
                  {[data.city, data.province].filter(Boolean).join(", ")}
                </Text>
              </View>
            )}

            {/* Established Date */}
            <View style={styles.establishedRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.establishedText}>
                Established {new Date(data.establishedDate).getFullYear()}
              </Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{data.activeWorkers}</Text>
              <Text style={styles.statLabel}>Workers</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{data.totalJobsCompleted}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>
                {new Date(data.establishedDate).getFullYear()}
              </Text>
              <Text style={styles.statLabel}>Established</Text>
            </View>
          </View>

          {/* Description (Bio first) */}
          {data.description && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => setIsBioExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.sectionTitle}>About</Text>
                <Ionicons
                  name={isBioExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {isBioExpanded && (
                <Text style={styles.descriptionText}>{data.description}</Text>
              )}
            </View>
          )}

          {/* Specializations */}
          {data.specializations && data.specializations.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => setIsSpecializationsExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.sectionTitle}>Specializations</Text>
                <Ionicons
                  name={isSpecializationsExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {isSpecializationsExpanded && (
                <View style={styles.tagsContainer}>
                  {data.specializations.map((spec: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Ionicons
                        name="construct"
                        size={14}
                        color={Colors.primary}
                      />
                      <Text style={styles.tagText}>{spec}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Featured Workers */}
          {data.workers && data.workers.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => setIsWorkersExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.sectionTitle}>Our Workers</Text>
                <Ionicons
                  name={isWorkersExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {isWorkersExpanded && (
                <View style={styles.workersContainer}>
                  {data.workers.slice(0, 5).map((worker: AgencyWorker) => (
                    <View key={worker.id}>
                      {renderWorkerCard({ item: worker })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

        </ScrollView>

        {/* Bottom Action Button */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[
              styles.hireButton,
              !user?.kycVerified && styles.hireButtonDisabled,
            ]}
            onPress={() => {
              if (!user?.kycVerified) {
                Alert.alert(
                  "Verification Required",
                  "Please complete KYC verification to hire an agency."
                );
                return;
              }
              router.push(`/jobs/create?agencyId=${id}` as any);
            }}
          >
            <Text
              style={[
                styles.hireButtonText,
                !user?.kycVerified && styles.hireButtonTextDisabled,
              ]}
            >
              {user?.kycVerified ? "Hire Agency" : "KYC Verification Required"}
            </Text>
            {user?.kycVerified && (
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  heroSection: {
    backgroundColor: Colors.white,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  verificationLevelTag: {
    borderWidth: 1,
    borderColor: "#00BAF1",
    backgroundColor: "#EAF9FF",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  verificationLevelTagText: {
    color: "#00BAF1",
    fontSize: 12,
    fontWeight: "700",
  },
  logoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  establishedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  establishedText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statsSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: "center",
    ...Shadows.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  workersContainer: {
    gap: 12,
  },
  workerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    gap: 12,
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  workerAvatarPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  workerAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  workerSpec: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  workerStats: {
    flexDirection: "row",
    gap: 12,
  },
  workerStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  workerStatText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: Colors.white,
    gap: 12,
    ...Shadows.lg,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  hireButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    gap: 8,
    ...Shadows.sm,
  },
  hireButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  hireButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    opacity: 0.6,
  },
  hireButtonTextDisabled: {
    color: Colors.textHint,
  },
});

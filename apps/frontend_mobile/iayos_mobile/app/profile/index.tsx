// Worker Profile Screen
// Shows worker's professional profile with stats, completion widget, and edit button

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { ENDPOINTS } from "@/lib/api/config";

// ===== TYPES =====

interface WorkerProfile {
  id: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
  };
  bio: string | null;
  hourlyRate: number | null;
  skills: string[];
  categories: Array<{ id: number; name: string }>;
  serviceAreas: string[];
  stats: {
    jobsCompleted: number;
    totalEarnings: number;
    averageRating: number;
    reviewCount: number;
  };
  completionPercentage: number;
  hasAvatar: boolean;
  isPhoneVerified: boolean;
  hasCertifications: boolean;
  hasPortfolio: boolean;
  createdAt: string;
}

// ===== HELPER FUNCTIONS =====

/**
 * Format currency value to PHP format
 */
const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
};

/**
 * Calculate profile completion based on 8 criteria
 * Each criterion = 12.5% (8 x 12.5% = 100%)
 */
const calculateProfileCompletion = (profile: WorkerProfile): number => {
  let completed = 0;

  // 1. Avatar (12.5%)
  if (profile.hasAvatar) completed += 12.5;

  // 2. Bio (12.5%)
  if (profile.bio && profile.bio.length >= 50) completed += 12.5;

  // 3. Hourly Rate (12.5%)
  if (profile.hourlyRate && profile.hourlyRate > 0) completed += 12.5;

  // 4. Skills/Categories (12.5%)
  if (profile.skills.length >= 3 || profile.categories.length >= 2)
    completed += 12.5;

  // 5. Phone Verified (12.5%)
  if (profile.isPhoneVerified) completed += 12.5;

  // 6. Service Areas (12.5%)
  if (profile.serviceAreas.length >= 1) completed += 12.5;

  // 7. Certifications (12.5%)
  if (profile.hasCertifications) completed += 12.5;

  // 8. Portfolio (12.5%)
  if (profile.hasPortfolio) completed += 12.5;

  return Math.round(completed);
};

/**
 * Get color based on completion percentage
 */
const getCompletionColor = (percentage: number): string => {
  if (percentage < 30) return Colors.error;
  if (percentage < 70) return Colors.warning;
  return Colors.success;
};

// ===== MAIN COMPONENT =====

export default function ProfileScreen() {
  const router = useRouter();

  // Fetch profile data
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<WorkerProfile>({
    queryKey: ["worker-profile"],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.WORKER_PROFILE, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // ===== ERROR STATE =====
  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Calculate completion percentage
  const completionPercentage = calculateProfileCompletion(profile);
  const completionColor = getCompletionColor(completionPercentage);

  // ===== MAIN CONTENT =====
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatarContainer}>
            {profile.hasAvatar ? (
              <View style={styles.avatar}>
                <Ionicons
                  name="person"
                  size={48}
                  color={Colors.textSecondary}
                />
              </View>
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name="person-outline"
                  size={48}
                  color={Colors.textSecondary}
                />
              </View>
            )}
          </View>

          {/* Edit Button */}
          <Pressable
            style={styles.editButton}
            onPress={() => router.push("/profile/edit" as any)}
          >
            <Ionicons name="pencil" size={20} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        {/* Name */}
        <Text style={styles.name}>
          {profile.user.firstName} {profile.user.lastName}
        </Text>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Ionicons
            name="mail-outline"
            size={16}
            color={Colors.textSecondary}
          />
          <Text style={styles.contactText}>{profile.user.email}</Text>
        </View>
        {profile.user.phoneNumber && (
          <View style={styles.contactInfo}>
            <Ionicons
              name="call-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.contactText}>{profile.user.phoneNumber}</Text>
            {profile.isPhoneVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.success}
              />
            )}
          </View>
        )}
      </View>

      {/* Profile Completion Widget */}
      <View style={styles.completionCard}>
        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>Profile Completion</Text>
          <Pressable
            onPress={() => {
              Alert.alert(
                "Profile Checklist",
                `Complete your profile to attract more clients:\n\n` +
                  `${profile.hasAvatar ? "✓" : "○"} Profile Photo\n` +
                  `${profile.bio && profile.bio.length >= 50 ? "✓" : "○"} Bio (50+ characters)\n` +
                  `${profile.hourlyRate && profile.hourlyRate > 0 ? "✓" : "○"} Hourly Rate\n` +
                  `${profile.skills.length >= 3 || profile.categories.length >= 2 ? "✓" : "○"} Skills/Categories\n` +
                  `${profile.isPhoneVerified ? "✓" : "○"} Phone Verified\n` +
                  `${profile.serviceAreas.length >= 1 ? "✓" : "○"} Service Areas\n` +
                  `${profile.hasCertifications ? "✓" : "○"} Certifications\n` +
                  `${profile.hasPortfolio ? "✓" : "○"} Portfolio`,
                [{ text: "OK" }]
              );
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.completionContent}>
          {/* Circular Progress */}
          <View style={styles.circularProgress}>
            <View
              style={[
                styles.progressCircle,
                { borderColor: completionColor, borderWidth: 6 },
              ]}
            >
              <Text style={[styles.progressText, { color: completionColor }]}>
                {completionPercentage}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${completionPercentage}%`,
                    backgroundColor: completionColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {completionPercentage < 100
                ? `${100 - completionPercentage}% to complete profile`
                : "Profile Complete!"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="briefcase" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{profile.stats.jobsCompleted}</Text>
          <Text style={styles.statLabel}>Jobs</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color={Colors.success} />
          <Text style={styles.statValue}>
            {formatCurrency(profile.stats.totalEarnings)}
          </Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color={Colors.warning} />
          <Text style={styles.statValue}>
            {profile.stats.averageRating.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>
            {profile.stats.reviewCount} reviews
          </Text>
        </View>
      </View>

      {/* Bio Section */}
      {profile.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.emptyText}>
            Add a bio to tell clients about your experience and skills
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/profile/edit" as any)}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.addButtonText}>Add Bio</Text>
          </Pressable>
        </View>
      )}

      {/* Hourly Rate Section */}
      {profile.hourlyRate && profile.hourlyRate > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly Rate</Text>
          <Text style={styles.hourlyRateText}>
            {formatCurrency(profile.hourlyRate)}/hour
          </Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly Rate</Text>
          <Text style={styles.emptyText}>Set your hourly rate</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/profile/edit" as any)}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.addButtonText}>Set Rate</Text>
          </Pressable>
        </View>
      )}

      {/* Skills Section */}
      {profile.skills.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {profile.skills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.emptyText}>
            Add skills to showcase your expertise
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/profile/edit" as any)}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.addButtonText}>Add Skills</Text>
          </Pressable>
        </View>
      )}

      {/* Categories Section */}
      {profile.categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Categories</Text>
          <View style={styles.categoriesContainer}>
            {profile.categories.map((category) => (
              <View key={category.id} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{category.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Service Areas Section */}
      {profile.serviceAreas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Areas</Text>
          <View style={styles.areasContainer}>
            {profile.serviceAreas.map((area, index) => (
              <View key={index} style={styles.areaItem}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.areaText}>{area}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body.large,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // Header
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.medium,
  },
  editButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
  name: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  contactText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Completion Card
  completionCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    ...Shadows.medium,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  completionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
  },
  completionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  circularProgress: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  progressText: {
    ...Typography.heading.h3,
    fontWeight: "bold",
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.small,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BorderRadius.small,
  },
  progressLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    alignItems: "center",
    ...Shadows.small,
  },
  statValue: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },

  // Sections
  section: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  bioText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  addButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
  hourlyRateText: {
    ...Typography.heading.h3,
    color: Colors.success,
    fontWeight: "bold",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skillChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "500",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "500",
  },
  areasContainer: {
    gap: Spacing.xs,
  },
  areaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  areaText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
});

/**
 * Worker Detail Screen - Full worker profile view
 *
 * Features:
 * - Worker avatar and basic info
 * - Rating and reviews
 * - Skills and specializations
 * - Bio/description
 * - Hourly rate
 * - Portfolio images
 * - Certifications
 * - Contact/message button
 * - Create job request button
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";
import { fetchJson, ENDPOINTS } from "@/lib/api/config";

interface WorkerDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  bio?: string;
  hourlyRate?: number;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTime?: string;
  availability?: string;
  city?: string;
  province?: string;
  distance?: number;
  specializations: string[];
  skills: string[];
  verified: boolean;
  joinedDate: string;
}

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Fetch worker details
  const { data, isLoading, error } = useQuery({
    queryKey: ["worker", id],
    queryFn: async () => {
      const response = await fetchJson<{
        success: boolean;
        worker: WorkerDetail;
      }>(ENDPOINTS.WORKER_DETAIL(Number(id)));
      return response.worker;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
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
          <Text style={styles.errorText}>Failed to load worker details</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${data.firstName} ${data.lastName}`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Worker Profile</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons
              name="share-outline"
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.avatarContainer}>
              {data.profilePicture ? (
                <Image
                  source={{ uri: data.profilePicture }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {data.firstName.charAt(0)}
                    {data.lastName.charAt(0)}
                  </Text>
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

            <Text style={styles.name}>{fullName}</Text>

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
                {data.distance && (
                  <Text style={styles.distanceText}>
                    • {data.distance.toFixed(1)}km away
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Stats Cards */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{data.completedJobs}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{data.responseTime || "1h"}</Text>
              <Text style={styles.statLabel}>Response Time</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>₱{data.hourlyRate || "N/A"}</Text>
              <Text style={styles.statLabel}>Per Hour</Text>
            </View>
          </View>

          {/* Specializations */}
          {data.specializations && data.specializations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specializations</Text>
              <View style={styles.tagsContainer}>
                {data.specializations.map((spec: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Ionicons name="hammer" size={14} color={Colors.primary} />
                    <Text style={styles.tagText}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bio */}
          {data.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{data.bio}</Text>
            </View>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.skillsContainer}>
                {data.skills.map((skill: string, index: number) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            {data.phoneNumber && (
              <View style={styles.contactRow}>
                <Ionicons name="call" size={20} color={Colors.textSecondary} />
                <Text style={styles.contactText}>{data.phoneNumber}</Text>
              </View>
            )}
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={20} color={Colors.textSecondary} />
              <Text style={styles.contactText}>{data.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons
                name="calendar"
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.contactText}>
                Joined {new Date(data.joinedDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => router.push(`/messages/new?workerId=${id}` as any)}
          >
            <Ionicons name="chatbubble" size={20} color={Colors.primary} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hireButton}
            onPress={() => router.push(`/jobs/create?workerId=${id}` as any)}
          >
            <Text style={styles.hireButtonText}>Hire Worker</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.white,
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
  distanceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
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
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
  },
  skillText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
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
});

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

interface WorkerCertification {
  id: number;
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateUrl?: string;
  isVerified: boolean;
}

interface WorkerMaterial {
  id: number;
  name: string;
  description?: string;
  price: number;
  priceUnit: string;
  inStock: boolean;
  stockQuantity?: number;
  imageUrl?: string;
}

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
  completionRate: number;
  qualityRating: number;
  communicationRating: number;
  professionalismRating: number;
  timelinessRating: number;
  responseTime?: string;
  availability?: string;
  city?: string;
  province?: string;
  distance?: number;
  specializations: string[];
  skills: string[];
  verified: boolean;
  joinedDate: string;
  certifications?: WorkerCertification[];
  materials?: WorkerMaterial[];
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

          {/* Completion Rate Card */}
          <View style={styles.section}>
            <View style={styles.completionRateCard}>
              <View style={styles.completionRateHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={28}
                  color={
                    data.completionRate >= 90
                      ? Colors.success
                      : data.completionRate >= 70
                        ? Colors.warning
                        : Colors.error
                  }
                />
                <View style={styles.completionRateInfo}>
                  <Text style={styles.completionRateValue}>
                    {data.completionRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.completionRateLabel}>
                    Job Completion Rate
                  </Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${data.completionRate}%`,
                      backgroundColor:
                        data.completionRate >= 90
                          ? Colors.success
                          : data.completionRate >= 70
                            ? Colors.warning
                            : Colors.error,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Performance Ratings */}
          {data.reviewCount > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Ratings</Text>
              <View style={styles.ratingsContainer}>
                {/* Quality Rating */}
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Quality</Text>
                  <View style={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= Math.round(data.qualityRating)
                            ? "star"
                            : "star-outline"
                        }
                        size={16}
                        color={
                          star <= Math.round(data.qualityRating)
                            ? Colors.warning
                            : Colors.textHint
                        }
                      />
                    ))}
                    <Text style={styles.ratingValue}>
                      {data.qualityRating.toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Communication Rating */}
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Communication</Text>
                  <View style={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= Math.round(data.communicationRating)
                            ? "star"
                            : "star-outline"
                        }
                        size={16}
                        color={
                          star <= Math.round(data.communicationRating)
                            ? Colors.warning
                            : Colors.textHint
                        }
                      />
                    ))}
                    <Text style={styles.ratingValue}>
                      {data.communicationRating.toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Professionalism Rating */}
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Professionalism</Text>
                  <View style={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= Math.round(data.professionalismRating)
                            ? "star"
                            : "star-outline"
                        }
                        size={16}
                        color={
                          star <= Math.round(data.professionalismRating)
                            ? Colors.warning
                            : Colors.textHint
                        }
                      />
                    ))}
                    <Text style={styles.ratingValue}>
                      {data.professionalismRating.toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Timeliness Rating */}
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Timeliness</Text>
                  <View style={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= Math.round(data.timelinessRating)
                            ? "star"
                            : "star-outline"
                        }
                        size={16}
                        color={
                          star <= Math.round(data.timelinessRating)
                            ? Colors.warning
                            : Colors.textHint
                        }
                      />
                    ))}
                    <Text style={styles.ratingValue}>
                      {data.timelinessRating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

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

          {/* Certifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications & Licenses</Text>
            {data.certifications && data.certifications.length > 0 ? (
              data.certifications.map((cert) => (
                <View key={cert.id} style={styles.certCard}>
                  <View style={styles.certHeader}>
                    <View style={styles.certIconContainer}>
                      <Ionicons
                        name="ribbon"
                        size={20}
                        color={
                          cert.isVerified ? Colors.success : Colors.primary
                        }
                      />
                    </View>
                    <View style={styles.certInfo}>
                      <Text style={styles.certName}>{cert.name}</Text>
                      {cert.issuingOrganization && (
                        <Text style={styles.certOrg}>
                          {cert.issuingOrganization}
                        </Text>
                      )}
                      {cert.issueDate && (
                        <Text style={styles.certDate}>
                          Issued:{" "}
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    {cert.isVerified && (
                      <View style={styles.certVerifiedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={Colors.success}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="ribbon-outline"
                  size={48}
                  color={Colors.textHint}
                />
                <Text style={styles.emptyStateText}>
                  {"This worker doesn't have any certifications yet"}
                </Text>
              </View>
            )}
          </View>

          {/* Materials/Products */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Materials & Products Available
            </Text>
            {data.materials && data.materials.length > 0 ? (
              data.materials.map((material) => (
                <View key={material.id} style={styles.materialCard}>
                  <View style={styles.materialHeader}>
                    <Ionicons
                      name="cube-outline"
                      size={24}
                      color={Colors.primary}
                    />
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialName}>{material.name}</Text>
                      {material.description && (
                        <Text style={styles.materialDesc} numberOfLines={2}>
                          {material.description}
                        </Text>
                      )}
                      <View style={styles.materialFooter}>
                        <Text style={styles.materialPrice}>
                          ₱{material.price.toLocaleString()} /{" "}
                          {material.priceUnit.toLowerCase().replace("_", " ")}
                        </Text>
                        <View
                          style={[
                            styles.stockBadge,
                            {
                              backgroundColor: material.inStock
                                ? Colors.successLight
                                : Colors.errorLight,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stockText,
                              {
                                color: material.inStock
                                  ? Colors.success
                                  : Colors.error,
                              },
                            ]}
                          >
                            {material.inStock ? "In Stock" : "Out of Stock"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="cube-outline"
                  size={48}
                  color={Colors.textHint}
                />
                <Text style={styles.emptyStateText}>
                  {"This worker doesn't have any materials or products listed"}
                </Text>
              </View>
            )}
          </View>

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

        {/* Bottom Action Button */}
        <View style={styles.bottomActions}>
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
  // Certifications styles
  certCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  certHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  certIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  certOrg: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  certDate: {
    fontSize: 12,
    color: Colors.textHint,
  },
  certVerifiedBadge: {
    marginLeft: 8,
  },
  // Materials styles
  materialCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  materialHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  materialDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  materialFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  materialPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textHint,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  // Completion Rate Card Styles
  completionRateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completionRateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  completionRateInfo: {
    flex: 1,
  },
  completionRateValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  completionRateLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  // Performance Ratings Styles
  ratingsContainer: {
    gap: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    flex: 1,
  },
  ratingStarsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginLeft: 8,
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

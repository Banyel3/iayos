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

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuth } from "@/context/AuthContext";
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
import { useWorkerReviews } from "@/lib/hooks/useReviews";

interface Skill {
  id: number; // workerSpecialization ID
  specializationId: number; // Specializations ID
  name: string;
  experienceYears: number;
  certificationCount: number;
}

interface WorkerCertification {
  id: number;
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateUrl?: string;
  isVerified: boolean;
  specializationId?: number | null; // Link to skill
  skillName?: string | null;
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
  accountId: number; // Account ID for reviews lookup
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
  skills: Skill[]; // Changed from string[] to Skill[]
  verified: boolean;
  joinedDate: string;
  certifications?: WorkerCertification[];
  materials?: WorkerMaterial[];
}

// Skeleton component for loading state
const WorkerDetailSkeleton = () => {
  const router = useRouter();

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero Skeleton */}
        <View style={styles.heroSection}>
          <View style={[styles.skeletonCircle, styles.avatar]} />
          <View
            style={[
              styles.skeletonBox,
              { width: 180, height: 24, marginTop: 16 },
            ]}
          />
          <View
            style={[
              styles.skeletonBox,
              { width: 120, height: 20, marginTop: 8 },
            ]}
          />
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
          >
            <View style={[styles.skeletonBox, { width: 80, height: 16 }]} />
          </View>
        </View>

        {/* Stats Skeleton */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={[styles.skeletonBox, { width: 40, height: 28 }]} />
            <View
              style={[
                styles.skeletonBox,
                { width: 60, height: 14, marginTop: 4 },
              ]}
            />
          </View>
          <View style={styles.statCard}>
            <View style={[styles.skeletonBox, { width: 60, height: 28 }]} />
            <View
              style={[
                styles.skeletonBox,
                { width: 50, height: 14, marginTop: 4 },
              ]}
            />
          </View>
          <View style={styles.statCard}>
            <View style={[styles.skeletonBox, { width: 30, height: 28 }]} />
            <View
              style={[
                styles.skeletonBox,
                { width: 40, height: 14, marginTop: 4 },
              ]}
            />
          </View>
        </View>

        {/* Bio Skeleton */}
        <View style={styles.section}>
          <View
            style={[
              styles.skeletonBox,
              { width: 100, height: 20, marginBottom: 12 },
            ]}
          />
          <View
            style={[
              styles.skeletonBox,
              { width: "100%", height: 16, marginBottom: 8 },
            ]}
          />
          <View
            style={[
              styles.skeletonBox,
              { width: "90%", height: 16, marginBottom: 8 },
            ]}
          />
          <View style={[styles.skeletonBox, { width: "80%", height: 16 }]} />
        </View>

        {/* Skills Skeleton */}
        <View style={styles.section}>
          <View
            style={[
              styles.skeletonBox,
              { width: 120, height: 20, marginBottom: 12 },
            ]}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <View
              style={[
                styles.skeletonBox,
                { width: 80, height: 32, borderRadius: 16 },
              ]}
            />
            <View
              style={[
                styles.skeletonBox,
                { width: 100, height: 32, borderRadius: 16 },
              ]}
            />
            <View
              style={[
                styles.skeletonBox,
                { width: 90, height: 32, borderRadius: 16 },
              ]}
            />
          </View>
        </View>

        {/* Materials Skeleton */}
        <View style={styles.section}>
          <View
            style={[
              styles.skeletonBox,
              { width: 140, height: 20, marginBottom: 12 },
            ]}
          />
          <View
            style={[
              styles.skeletonBox,
              { width: "100%", height: 80, borderRadius: 12 },
            ]}
          />
        </View>

        {/* Certifications Skeleton */}
        <View style={styles.section}>
          <View
            style={[
              styles.skeletonBox,
              { width: 120, height: 20, marginBottom: 12 },
            ]}
          />
          <View
            style={[
              styles.skeletonBox,
              { width: "100%", height: 80, borderRadius: 12 },
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // State for collapsible sections
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [expandedSkills, setExpandedSkills] = useState<Set<number>>(new Set());

  // Lightbox state for certificate images
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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

  // Fetch worker reviews using accountId (not workerProfileId)
  const { data: reviewsData, isLoading: isLoadingReviews } = useWorkerReviews(
    data?.accountId || 0, // Use accountId from worker data
    reviewsPage,
    5
  );

  // Show skeleton while loading
  if (isLoading) {
    return <WorkerDetailSkeleton />;
  }

  // Show error only if not loading and there's an error
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

  // Check if the current user is viewing their own profile
  // Compare using accountId OR workerProfileId (the route param is workerProfileId)
  const isOwnProfile =
    user?.id === data.accountId ||
    user?.accountID === data.accountId ||
    user?.profile_data?.workerProfileId === Number(id);

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
          <Text style={styles.headerTitle}>
            {isOwnProfile ? "My Public Profile" : "Worker Profile"}
          </Text>
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
          {/* Self-View Banner */}
          {isOwnProfile && (
            <View style={styles.selfViewBanner}>
              <Ionicons name="eye-outline" size={18} color={Colors.info} />
              <Text style={styles.selfViewBannerText}>
                This is how clients see your public profile
              </Text>
            </View>
          )}

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

          {/* Reviews Section - Collapsible */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setIsReviewsExpanded(!isReviewsExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.collapsibleTitleRow}>
                <Ionicons name="star" size={22} color={Colors.warning} />
                <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
                <View style={styles.reviewCountBadge}>
                  <Text style={styles.reviewCountBadgeText}>
                    {reviewsData?.total_count || data.reviewCount || 0}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isReviewsExpanded ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {isReviewsExpanded && (
              <View style={styles.reviewsContent}>
                {isLoadingReviews ? (
                  <View style={styles.reviewsLoading}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.reviewsLoadingText}>
                      Loading reviews...
                    </Text>
                  </View>
                ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                  <>
                    {reviewsData.reviews.map((review) => (
                      <View key={review.review_id} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          {review.reviewer_profile_img ? (
                            <Image
                              source={{ uri: review.reviewer_profile_img }}
                              style={styles.reviewerAvatar}
                            />
                          ) : (
                            <View
                              style={[
                                styles.reviewerAvatar,
                                styles.reviewerAvatarPlaceholder,
                              ]}
                            >
                              <Text style={styles.reviewerAvatarText}>
                                {review.reviewer_name?.charAt(0) || "?"}
                              </Text>
                            </View>
                          )}
                          <View style={styles.reviewerInfo}>
                            <Text style={styles.reviewerName}>
                              {review.reviewer_name}
                            </Text>
                            <Text style={styles.reviewDate}>
                              {new Date(review.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </Text>
                          </View>
                          <View style={styles.reviewRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={
                                  star <= review.rating
                                    ? "star"
                                    : "star-outline"
                                }
                                size={14}
                                color={
                                  star <= review.rating
                                    ? Colors.warning
                                    : Colors.textHint
                                }
                              />
                            ))}
                          </View>
                        </View>
                        {review.comment && (
                          <Text style={styles.reviewComment}>
                            {review.comment}
                          </Text>
                        )}
                      </View>
                    ))}

                    {/* Pagination */}
                    {reviewsData.total_pages > 1 && (
                      <View style={styles.reviewsPagination}>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            reviewsPage === 1 &&
                              styles.paginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setReviewsPage(Math.max(1, reviewsPage - 1))
                          }
                          disabled={reviewsPage === 1}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={18}
                            color={
                              reviewsPage === 1
                                ? Colors.textHint
                                : Colors.primary
                            }
                          />
                        </TouchableOpacity>
                        <Text style={styles.paginationText}>
                          {reviewsPage} of {reviewsData.total_pages}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            reviewsPage === reviewsData.total_pages &&
                              styles.paginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setReviewsPage(
                              Math.min(reviewsData.total_pages, reviewsPage + 1)
                            )
                          }
                          disabled={reviewsPage === reviewsData.total_pages}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={
                              reviewsPage === reviewsData.total_pages
                                ? Colors.textHint
                                : Colors.primary
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={48}
                      color={Colors.textHint}
                    />
                    <Text style={styles.emptyStateText}>
                      No reviews yet. Be the first to hire and review this
                      worker!
                    </Text>
                  </View>
                )}
              </View>
            )}
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

          {/* Bio */}
          {data.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{data.bio}</Text>
            </View>
          )}

          {/* Skills with Nested Certifications */}
          {data.skills && data.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills & Certifications</Text>
              <Text style={styles.sectionDescription}>
                Tap a skill to view certifications
              </Text>

              {data.skills.map((skill: Skill) => {
                const isExpanded = expandedSkills.has(skill.id);
                const skillCerts =
                  data.certifications?.filter(
                    (cert) => cert.specializationId === skill.id
                  ) || [];

                return (
                  <View key={skill.id} style={styles.skillSection}>
                    {/* Skill Header - Clickable */}
                    <TouchableOpacity
                      style={styles.skillHeader}
                      onPress={() => {
                        const newExpanded = new Set(expandedSkills);
                        if (isExpanded) {
                          newExpanded.delete(skill.id);
                        } else {
                          newExpanded.add(skill.id);
                        }
                        setExpandedSkills(newExpanded);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.skillHeaderLeft}>
                        <Ionicons
                          name="construct"
                          size={20}
                          color={Colors.primary}
                        />
                        <View style={styles.skillHeaderText}>
                          <Text style={styles.skillName}>{skill.name}</Text>
                          <Text style={styles.skillMeta}>
                            {skill.experienceYears}{" "}
                            {skill.experienceYears === 1 ? "year" : "years"}{" "}
                            experience
                          </Text>
                        </View>
                      </View>

                      <View style={styles.skillHeaderRight}>
                        <View style={styles.certBadge}>
                          <Ionicons
                            name="ribbon"
                            size={14}
                            color={
                              skill.certificationCount > 0
                                ? Colors.success
                                : Colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.certBadgeText,
                              skill.certificationCount > 0 &&
                                styles.certBadgeTextActive,
                            ]}
                          >
                            {skill.certificationCount}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color={Colors.textSecondary}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded: Show Certifications */}
                    {isExpanded && (
                      <View style={styles.skillCertifications}>
                        {skillCerts.length > 0 ? (
                          skillCerts.map((cert) => {
                            // Calculate days until expiry for warning badge
                            const daysUntilExpiry = cert.expiryDate
                              ? Math.ceil(
                                  (new Date(cert.expiryDate).getTime() -
                                    new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              : null;
                            const isExpiringSoon =
                              daysUntilExpiry !== null &&
                              daysUntilExpiry > 0 &&
                              daysUntilExpiry <= 30;

                            return (
                              <View
                                key={cert.id}
                                style={styles.certificationItem}
                              >
                                <View style={styles.certificationRow}>
                                  {/* Certificate Image Thumbnail on Left */}
                                  {cert.certificateUrl ? (
                                    <TouchableOpacity
                                      style={styles.certThumbnailLeft}
                                      onPress={() =>
                                        setLightboxImage(cert.certificateUrl!)
                                      }
                                      activeOpacity={0.7}
                                    >
                                      <Image
                                        source={{ uri: cert.certificateUrl }}
                                        style={styles.certThumbnailLeftImage}
                                        resizeMode="cover"
                                      />
                                      <View
                                        style={styles.certThumbnailLeftOverlay}
                                      >
                                        <Ionicons
                                          name="expand-outline"
                                          size={16}
                                          color={Colors.white}
                                        />
                                      </View>
                                    </TouchableOpacity>
                                  ) : (
                                    <View
                                      style={
                                        styles.certThumbnailLeftPlaceholder
                                      }
                                    >
                                      <Ionicons
                                        name="document-text"
                                        size={24}
                                        color={Colors.textSecondary}
                                      />
                                    </View>
                                  )}

                                  {/* Header: Name on left, Verified badge on right */}
                                  <View style={styles.certificationHeader}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.certificationName}>
                                        {cert.name}
                                      </Text>
                                      {cert.issuingOrganization && (
                                        <Text style={styles.certificationOrg}>
                                          {cert.issuingOrganization}
                                        </Text>
                                      )}
                                      {/* Expiring Soon Warning */}
                                      {isExpiringSoon && (
                                        <View style={styles.expiringWarning}>
                                          <Ionicons
                                            name="warning"
                                            size={12}
                                            color={Colors.warning}
                                          />
                                          <Text
                                            style={styles.expiringWarningText}
                                          >
                                            Expires in {daysUntilExpiry} day
                                            {daysUntilExpiry !== 1 ? "s" : ""}
                                          </Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* Verified Badge on Right */}
                                    {cert.isVerified && (
                                      <View
                                        style={styles.certVerificationBadge}
                                      >
                                        <Ionicons
                                          name="checkmark-circle"
                                          size={14}
                                          color={Colors.success}
                                        />
                                        <Text
                                          style={
                                            styles.certVerificationBadgeText
                                          }
                                        >
                                          Verified
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <View style={styles.noCertifications}>
                            <Ionicons
                              name="ribbon-outline"
                              size={32}
                              color={Colors.textSecondary}
                            />
                            <Text style={styles.noCertificationsText}>
                              No certifications added for {skill.name}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Unlinked Certifications (not associated with any skill) */}
          {data.certifications &&
            data.certifications.some((cert) => !cert.specializationId) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>General Certifications</Text>
                <Text style={styles.sectionDescription}>
                  Certifications not linked to a specific skill
                </Text>

                <View style={styles.skillCertifications}>
                  {data.certifications
                    .filter((cert) => !cert.specializationId)
                    .map((cert) => {
                      // Calculate days until expiry for warning badge
                      const daysUntilExpiry = cert.expiryDate
                        ? Math.ceil(
                            (new Date(cert.expiryDate).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : null;
                      const isExpiringSoon =
                        daysUntilExpiry !== null &&
                        daysUntilExpiry > 0 &&
                        daysUntilExpiry <= 30;

                      return (
                        <View key={cert.id} style={styles.certificationItem}>
                          <View style={styles.certificationRow}>
                            {/* Certificate Image Thumbnail on Left */}
                            {cert.certificateUrl ? (
                              <TouchableOpacity
                                style={styles.certThumbnailLeft}
                                onPress={() =>
                                  setLightboxImage(cert.certificateUrl!)
                                }
                                activeOpacity={0.7}
                              >
                                <Image
                                  source={{ uri: cert.certificateUrl }}
                                  style={styles.certThumbnailLeftImage}
                                  resizeMode="cover"
                                />
                                <View style={styles.certThumbnailLeftOverlay}>
                                  <Ionicons
                                    name="expand-outline"
                                    size={16}
                                    color={Colors.white}
                                  />
                                </View>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.certThumbnailLeftPlaceholder}>
                                <Ionicons
                                  name="document-text"
                                  size={24}
                                  color={Colors.textSecondary}
                                />
                              </View>
                            )}

                            {/* Header: Name on left, Verified badge on right */}
                            <View style={styles.certificationHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.certificationName}>
                                  {cert.name}
                                </Text>
                                {cert.issuingOrganization && (
                                  <Text style={styles.certificationOrg}>
                                    {cert.issuingOrganization}
                                  </Text>
                                )}
                                {/* Expiring Soon Warning */}
                                {isExpiringSoon && (
                                  <View style={styles.expiringWarning}>
                                    <Ionicons
                                      name="warning"
                                      size={12}
                                      color={Colors.warning}
                                    />
                                    <Text style={styles.expiringWarningText}>
                                      Expires in {daysUntilExpiry} day
                                      {daysUntilExpiry !== 1 ? "s" : ""}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {/* Verified Badge on Right */}
                              {cert.isVerified && (
                                <View style={styles.certVerificationBadge}>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={Colors.success}
                                  />
                                  <Text
                                    style={styles.certVerificationBadgeText}
                                  >
                                    Verified
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                </View>
              </View>
            )}

          {/* Materials/Products */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Materials & Products Available
            </Text>
            {data.materials && data.materials.length > 0 ? (
              data.materials.map((material) => (
                <View key={material.id} style={styles.materialCard}>
                  <View style={styles.materialHeader}>
                    {material.imageUrl ? (
                      <Image
                        source={{ uri: material.imageUrl }}
                        style={styles.materialImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.materialIconContainer}>
                        <Ionicons
                          name="cube-outline"
                          size={24}
                          color={Colors.primary}
                        />
                      </View>
                    )}
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
          {isOwnProfile ? (
            // Show Edit Profile button when viewing own profile
            <TouchableOpacity
              style={styles.hireButton}
              onPress={() => router.push("/profile/edit" as any)}
            >
              <Ionicons name="create-outline" size={20} color={Colors.white} />
              <Text style={styles.hireButtonText}>Edit My Profile</Text>
            </TouchableOpacity>
          ) : (
            // Show Hire Worker button when viewing someone else's profile
            <>
              {!user?.kycVerified && (
                <View style={styles.kycWarningBanner}>
                  <Ionicons name="warning" size={20} color={Colors.warning} />
                  <Text style={styles.kycWarningText}>
                    Complete KYC verification to hire workers
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.hireButton,
                  !user?.kycVerified && styles.hireButtonDisabled,
                ]}
                onPress={() =>
                  router.push(`/jobs/create?workerId=${id}` as any)
                }
                disabled={!user?.kycVerified}
              >
                <Text
                  style={[
                    styles.hireButtonText,
                    !user?.kycVerified && styles.hireButtonTextDisabled,
                  ]}
                >
                  {user?.kycVerified
                    ? "Hire Worker"
                    : "KYC Verification Required"}
                </Text>
                {user?.kycVerified && (
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={Colors.white}
                  />
                )}
              </TouchableOpacity>
            </>
          )}
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
  selfViewBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2FE",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  selfViewBannerText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.info,
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
  certImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
  materialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  materialImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  // KYC Warning Styles
  kycWarningBanner: {
    backgroundColor: "#FFF4E5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB020",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  kycWarningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5A00",
  },
  hireButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    opacity: 0.6,
  },
  hireButtonTextDisabled: {
    color: Colors.textHint,
  },
  // Reviews Section Styles
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },
  collapsibleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginLeft: 4,
  },
  reviewCountBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  reviewsContent: {
    marginTop: 8,
  },
  reviewsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  reviewsLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerAvatarPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  reviewsPagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  // Skeleton styles
  skeletonBox: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
  },
  skeletonCircle: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 9999,
  },
  // NEW: Skills accordion styles
  sectionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  skillSection: {
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    ...Shadows.sm,
  },
  skillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  skillHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  skillHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  skillMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  skillHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  certBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  certBadgeTextActive: {
    color: Colors.success,
  },
  skillCertifications: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  certificationItem: {
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    marginBottom: 8,
    ...Shadows.xs,
  },
  certificationRow: {
    flexDirection: "row",
    gap: 12,
  },
  certThumbnailLeft: {
    position: "relative",
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  certThumbnailLeftImage: {
    width: "100%",
    height: "100%",
  },
  certThumbnailLeftOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  certThumbnailLeftPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  certificationHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  certificationName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  certificationOrg: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  certVerificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successLight || "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  certVerificationBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
  },
  expiringWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  expiringWarningText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.warning,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lightboxImage: {
    width: "90%",
    height: "70%",
  },
  lightboxCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  noCertifications: {
    alignItems: "center",
    padding: 24,
  },
  noCertificationsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});

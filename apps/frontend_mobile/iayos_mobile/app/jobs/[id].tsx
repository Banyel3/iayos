import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { SaveButton } from "@/components/SaveButton";

const { width } = Dimensions.get("window");

interface JobDetail {
  id: string;
  title: string;
  category: { id: number; name: string } | string;
  description: string;
  budget: string;
  location: string;
  distance: number;
  postedBy: {
    name: string;
    avatar: string;
    rating: number;
  };
  postedAt: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  photos: Array<{
    id: number;
    url: string;
    file_name: string;
  }>;
  expectedDuration?: string;
  materialsNeeded?: string[];
  specializations?: string[];
  jobType?: "INVITE" | "LISTING";
  assignedWorker?: {
    id: number;
    name: string;
    avatar: string;
    rating: number;
  };
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Debug logging
  console.log("[JobDetail] Loaded with id:", id, "typeof:", typeof id);

  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Application form state
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [budgetOption, setBudgetOption] = useState<"ACCEPT" | "NEGOTIATE">(
    "ACCEPT"
  );

  const isWorker = user?.profile_data?.profileType === "WORKER";

  // Validate job ID
  const jobId = id ? Number(id) : NaN;
  const isValidJobId =
    !isNaN(jobId) && jobId > 0 && id !== "create" && id !== "undefined";

  // Debug validation
  console.log(
    "[JobDetail] Parsed jobId:",
    jobId,
    "isValidJobId:",
    isValidJobId
  );

  // Early return if invalid - don't even render the component
  if (!isValidJobId) {
    console.warn(
      "[JobDetail] INVALID ID DETECTED - Preventing query execution"
    );
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Invalid Job ID</Text>
          <Text style={styles.errorSubtext}>
            The job you're looking for could not be found. (ID: {id})
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.backButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fetch job details
  const {
    data: job,
    isLoading,
    error,
  } = useQuery<JobDetail, unknown, JobDetail>({
    queryKey: ["jobs", id],
    queryFn: async (): Promise<JobDetail> => {
      if (!isValidJobId) {
        console.error("[JobDetail] Query blocked - invalid job ID:", id);
        throw new Error("Invalid job ID");
      }
      console.log("[JobDetail] Fetching job details for ID:", jobId);
      const response = await apiRequest(ENDPOINTS.JOB_DETAILS(jobId));

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const result = (await response.json()) as any;
      const jobData = result.data || result; // Handle both wrapped and unwrapped responses

      // Transform backend response to frontend format
      return {
        id: String(jobData.id),
        title: jobData.title,
        category: jobData.category, // Already an object {id, name}
        description: jobData.description,
        budget: `₱${jobData.budget?.toLocaleString() || "0"}`,
        location: jobData.location,
        distance: jobData.distance || 0,
        postedBy: jobData.client || {
          name: "Unknown Client",
          avatar: null,
          rating: 0,
        },
        postedAt: jobData.created_at
          ? new Date(jobData.created_at).toLocaleDateString()
          : "Recently",
        urgency: jobData.urgency_level || "LOW",
        photos:
          jobData.photos?.map((url: string, idx: number) => ({
            id: idx,
            url,
            file_name: `photo-${idx}`,
          })) || [],
        expectedDuration: jobData.expected_duration,
        materialsNeeded: jobData.materials_needed,
        specializations: jobData.specializations,
        jobType: jobData.job_type,
        assignedWorker: jobData.assigned_worker,
      } as JobDetail;
    },
    enabled: isValidJobId, // Only fetch if we have a valid job ID
  });

  // Check if already applied
  const { data: hasApplied = false } = useQuery<boolean, unknown, boolean>({
    queryKey: ["jobs", id, "applied"],
    queryFn: async (): Promise<boolean> => {
      const response = await fetch(`${ENDPOINTS.MY_APPLICATIONS}`, {
        credentials: "include",
      });

      if (!response.ok) return false;

      const data = (await response.json()) as any;
      if (data.success && data.applications) {
        return data.applications.some(
          (app: any) => app.job_id.toString() === id
        );
      }
      return false;
    },
    enabled: isWorker,
  });

  // Submit application mutation
  const submitApplication = useMutation({
    mutationFn: async (applicationData: {
      proposal_message: string;
      proposed_budget: number;
      estimated_duration: string | null;
      budget_option: "ACCEPT" | "NEGOTIATE";
    }) => {
      const response = await fetch(`${ENDPOINTS.APPLY_JOB(parseInt(id))}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as any;
        throw new Error(errorData?.error || "Failed to submit application");
      }

      return response.json();
    },
    onSuccess: () => {
      Alert.alert(
        "Success",
        "Application submitted successfully! You can view your application status in My Applications."
      );
      setShowApplicationModal(false);
      setProposalMessage("");
      setProposedBudget("");
      setEstimatedDuration("");
      setBudgetOption("ACCEPT");
      queryClient.invalidateQueries({ queryKey: ["jobs", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id, "applied"] });
      router.back();
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleApply = () => {
    if (!job) return;

    setProposedBudget(job.budget.replace(/[^0-9.]/g, ""));
    setBudgetOption("ACCEPT");
    setProposalMessage("");
    setEstimatedDuration("");
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = () => {
    if (!proposalMessage.trim()) {
      Alert.alert("Error", "Please provide a proposal message");
      return;
    }

    if (
      budgetOption === "NEGOTIATE" &&
      (!proposedBudget || parseFloat(proposedBudget) <= 0)
    ) {
      Alert.alert("Error", "Please enter a valid budget amount");
      return;
    }

    const budgetValue =
      budgetOption === "ACCEPT"
        ? parseFloat(job?.budget.replace(/[^0-9.]/g, "") || "0")
        : parseFloat(proposedBudget);

    submitApplication.mutate({
      proposal_message: proposalMessage,
      proposed_budget: budgetValue,
      estimated_duration: estimatedDuration || null,
      budget_option: budgetOption,
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "MEDIUM":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "LOW":
        return { bg: "#D1FAE5", text: "#065F46" };
      default:
        return { bg: Colors.background, text: Colors.textSecondary };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle invalid job ID
  if (!isValidJobId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Invalid Job ID</Text>
          <Text style={styles.errorSubtext}>
            The job you're looking for could not be found.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.backButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Failed to load job details</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const urgencyColors = getUrgencyColor(job.urgency);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIconButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <SaveButton
          jobId={parseInt(id)}
          isSaved={isSaved}
          size={24}
          onToggle={setIsSaved}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View
              style={[
                styles.urgencyBadge,
                { backgroundColor: urgencyColors.bg },
              ]}
            >
              <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
                {job.urgency}
              </Text>
            </View>
          </View>
          <View style={styles.jobMetaRow}>
            <Ionicons
              name="pricetag-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.jobCategory}>
              {typeof job.category === "object"
                ? job.category.name
                : job.category}
            </Text>
          </View>
        </View>

        {/* Budget & Location */}
        <View style={styles.detailsSection}>
          <View style={styles.detailCard}>
            <Ionicons name="cash-outline" size={24} color={Colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Budget</Text>
              <Text style={styles.detailValue}>{job.budget}</Text>
            </View>
          </View>
          <View style={styles.detailCard}>
            <Ionicons
              name="location-outline"
              size={24}
              color={Colors.primary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {job.distance
                  ? `${job.distance.toFixed(1)} km away`
                  : job.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Photos */}
        {job.photos && job.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {job.photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => {
                    setSelectedImage(photo.url);
                    setShowImageModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.photoThumbnail}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Specializations */}
        {job.specializations && job.specializations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.tagsContainer}>
              {job.specializations.map((spec, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Materials Needed */}
        {job.materialsNeeded && job.materialsNeeded.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materials Needed</Text>
            {job.materialsNeeded.map((material, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.listItemText}>{material}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Assigned Worker - Only for INVITE jobs */}
        {job.jobType === "INVITE" && job.assignedWorker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Worker</Text>
            <View style={styles.posterCard}>
              <Image
                source={{
                  uri:
                    job.assignedWorker.avatar ||
                    "https://via.placeholder.com/60",
                }}
                style={styles.posterAvatar}
              />
              <View style={styles.posterInfo}>
                <Text style={styles.posterName}>{job.assignedWorker.name}</Text>
                <View style={styles.posterRating}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.posterRatingText}>
                    {job.assignedWorker.rating.toFixed(1)} rating
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Posted By */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted By</Text>
          <View style={styles.posterCard}>
            <Image
              source={{
                uri: job.postedBy?.avatar || "https://via.placeholder.com/60",
              }}
              style={styles.posterAvatar}
            />
            <View style={styles.posterInfo}>
              <Text style={styles.posterName}>
                {job.postedBy?.name || "Unknown Client"}
              </Text>
              <View style={styles.posterRating}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.posterRatingText}>
                  {(job.postedBy?.rating || 0).toFixed(1)} rating
                </Text>
              </View>
              <Text style={styles.postedTime}>Posted {job.postedAt}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Apply Button (Fixed at bottom) */}
      {isWorker && (
        <View style={styles.applyButtonContainer}>
          {hasApplied ? (
            <View style={styles.appliedContainer}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={Colors.success}
              />
              <Text style={styles.appliedText}>
                You have already applied to this job
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Apply for this Job</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Image Modal */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={32} color={Colors.white} />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Application Modal */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply for Job</Text>
            <TouchableOpacity onPress={() => setShowApplicationModal(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Budget Option */}
            <Text style={styles.label}>Budget</Text>
            <View style={styles.budgetOptions}>
              <TouchableOpacity
                style={[
                  styles.budgetOption,
                  budgetOption === "ACCEPT" && styles.budgetOptionActive,
                ]}
                onPress={() => setBudgetOption("ACCEPT")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    budgetOption === "ACCEPT"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={
                    budgetOption === "ACCEPT"
                      ? Colors.primary
                      : Colors.textSecondary
                  }
                />
                <Text style={styles.budgetOptionText}>
                  Accept {job?.budget}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.budgetOption,
                  budgetOption === "NEGOTIATE" && styles.budgetOptionActive,
                ]}
                onPress={() => setBudgetOption("NEGOTIATE")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    budgetOption === "NEGOTIATE"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={
                    budgetOption === "NEGOTIATE"
                      ? Colors.primary
                      : Colors.textSecondary
                  }
                />
                <Text style={styles.budgetOptionText}>Negotiate</Text>
              </TouchableOpacity>
            </View>

            {budgetOption === "NEGOTIATE" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Proposed Budget</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your proposed budget"
                  placeholderTextColor={Colors.textHint}
                  value={proposedBudget}
                  onChangeText={setProposedBudget}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Proposal Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Proposal Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Explain why you're the best fit for this job..."
                placeholderTextColor={Colors.textHint}
                value={proposalMessage}
                onChangeText={setProposalMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            {/* Estimated Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Duration (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2 days, 1 week"
                placeholderTextColor={Colors.textHint}
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitApplication.isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitApplication}
              disabled={submitApplication.isPending}
              activeOpacity={0.8}
            >
              {submitApplication.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIconButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  jobHeader: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jobTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  jobTitle: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  urgencyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
  },
  jobMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  jobCategory: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  detailsSection: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  detailCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  detailContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.background,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  listItemText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  posterCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  posterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  posterInfo: {
    flex: 1,
    justifyContent: "center",
  },
  posterName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  posterRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  posterRatingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  postedTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  applyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.medium,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.small,
  },
  applyButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },
  appliedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  appliedText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.success,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: Spacing.sm,
  },
  fullImage: {
    width: width,
    height: width,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  budgetOptions: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  budgetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  budgetOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  budgetOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.lg,
    fontWeight: "600",
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  errorSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
});

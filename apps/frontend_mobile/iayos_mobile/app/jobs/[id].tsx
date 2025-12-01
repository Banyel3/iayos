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
import InlineLoader from "@/components/ui/InlineLoader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import { SaveButton } from "@/components/SaveButton";
import { JobDetailSkeleton } from "@/components/ui/SkeletonLoader";
import { EstimatedTimeCard, type EstimatedCompletion } from "@/components";

const { width } = Dimensions.get("window");

interface JobReviewSummary {
  rating: number;
  comment?: string;
  createdAt?: string;
  reviewerType: "CLIENT" | "WORKER";
  reviewerName?: string;
  revieweeName?: string;
}

interface JobReviews {
  clientToWorker?: JobReviewSummary;
  workerToClient?: JobReviewSummary;
}

interface JobDetail {
  id: string;
  title: string;
  category: { id: number; name: string } | string;
  description: string;
  budget: string;
  location: string;
  distance: number;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | string;
  postedBy: {
    id: number;
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
  inviteStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  assignedWorker?: {
    id: number;
    name: string;
    avatar: string;
    rating: number;
  };
  reviews?: JobReviews;
  estimatedCompletion?: EstimatedCompletion | null;
}

interface JobApplication {
  id: number;
  worker: {
    id: number;
    name: string;
    avatar: string;
    rating: number;
    city: string;
  };
  proposal_message: string;
  proposed_budget: number;
  estimated_duration: string;
  budget_option: "ACCEPT" | "NEGOTIATE";
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  created_at: string;
  updated_at: string;
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
  const [showRejectInviteModal, setShowRejectInviteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Application form state
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [budgetOption, setBudgetOption] = useState<"ACCEPT" | "NEGOTIATE">(
    "ACCEPT"
  );

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";

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

      const mapReview = (reviewData: any): JobReviewSummary => ({
        rating:
          typeof reviewData?.rating === "number"
            ? reviewData.rating
            : Number(reviewData?.rating || 0),
        comment: reviewData?.comment || undefined,
        createdAt: reviewData?.created_at || undefined,
        reviewerType: reviewData?.reviewer_type || "CLIENT",
        reviewerName: reviewData?.reviewer?.name,
        revieweeName: reviewData?.reviewee?.name,
      });

      // Transform backend response to frontend format
      return {
        id: String(jobData.id),
        title: jobData.title,
        category: jobData.category, // Already an object {id, name}
        description: jobData.description,
        budget: `₱${jobData.budget?.toLocaleString() || "0"}`,
        location: jobData.location,
        distance: jobData.distance || 0,
        status: jobData.status,
        postedBy: jobData.client
          ? {
              id: jobData.client.id,
              name: jobData.client.name,
              avatar: jobData.client.avatar,
              rating: jobData.client.rating,
            }
          : {
              id: 0,
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
        reviews: jobData.reviews
          ? {
              clientToWorker: jobData.reviews.client_to_worker
                ? mapReview(jobData.reviews.client_to_worker)
                : undefined,
              workerToClient: jobData.reviews.worker_to_client
                ? mapReview(jobData.reviews.worker_to_client)
                : undefined,
            }
          : undefined,
        estimatedCompletion: jobData.estimated_completion || null,
      } as JobDetail;
    },
    enabled: isValidJobId, // Only fetch if we have a valid job ID
  });

  // Check if already applied
  const { data: hasApplied = false } = useQuery<boolean, unknown, boolean>({
    queryKey: ["jobs", id, "applied"],
    queryFn: async (): Promise<boolean> => {
      const response = await apiRequest(ENDPOINTS.MY_APPLICATIONS, {
        method: "GET",
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
      const response = await apiRequest(ENDPOINTS.APPLY_JOB(parseInt(id)), {
        method: "POST",
        body: JSON.stringify(applicationData),
      });

      const responseData = (await response.json().catch(() => null)) as any;

      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to submit application");
      }

      return responseData;
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

  // Delete job mutation (for clients only)
  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.DELETE_JOB(parseInt(id)), {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      Alert.alert("Deleted", "Job request has been deleted successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("/"),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", `Failed to delete job: ${error.message}`);
    },
  });

  // Accept job invite mutation (for workers)
  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.ACCEPT_INVITE(parseInt(id)), {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(errorData.error || "Failed to accept invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      Alert.alert(
        "Success",
        "Job invitation accepted! You can now start working on this job.",
        [
          {
            text: "OK",
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ["jobs"] });
              queryClient.invalidateQueries({ queryKey: ["jobs", id] });
              router.back();
            },
          },
        ]
      );
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to accept invitation");
    },
  });

  // Reject job invite mutation (for workers)
  const rejectInviteMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequest(ENDPOINTS.REJECT_INVITE(parseInt(id)), {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(errorData.error || "Failed to reject invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      Alert.alert(
        "Success",
        "Job invitation declined. The client has been notified.",
        [
          {
            text: "OK",
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ["jobs"] });
              router.back();
            },
          },
        ]
      );
      setShowRejectInviteModal(false);
      setRejectReason("");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to reject invitation");
    },
  });

  // Fetch job applications (for clients viewing their open jobs)
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    refetch: refetchApplications,
  } = useQuery<{ applications: JobApplication[]; total: number }>({
    queryKey: ["job-applications", id],
    queryFn: async (): Promise<{
      applications: JobApplication[];
      total: number;
    }> => {
      if (!isClient || !isValidJobId || job?.jobType !== "LISTING") {
        return { applications: [], total: 0 };
      }
      const response = await apiRequest(
        ENDPOINTS.JOB_APPLICATIONS(parseInt(id))
      );
      const data = await response.json();
      return data as { applications: JobApplication[]; total: number };
    },
    enabled: isClient && isValidJobId && !!job && job?.jobType === "LISTING",
  });

  const applications = applicationsData?.applications || [];

  // Accept application mutation
  const acceptApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest(
        ENDPOINTS.ACCEPT_APPLICATION(parseInt(id), applicationId),
        {
          method: "POST",
        }
      );
      return response.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Application accepted! Worker has been assigned.");
      queryClient.invalidateQueries({ queryKey: ["jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["job-applications", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-jobs"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Reject application mutation
  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest(
        ENDPOINTS.REJECT_APPLICATION(parseInt(id), applicationId),
        {
          method: "POST",
        }
      );
      return response.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Application rejected.");
      queryClient.invalidateQueries({ queryKey: ["job-applications", id] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleAcceptApplication = (
    applicationId: number,
    workerName: string
  ) => {
    Alert.alert(
      "Accept Application",
      `Are you sure you want to accept ${workerName}'s application? This will assign them to the job and reject all other applications.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: () => acceptApplicationMutation.mutate(applicationId),
        },
      ]
    );
  };

  const handleRejectApplication = (
    applicationId: number,
    workerName: string
  ) => {
    Alert.alert(
      "Reject Application",
      `Are you sure you want to reject ${workerName}'s application?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => rejectApplicationMutation.mutate(applicationId),
        },
      ]
    );
  };

  const handleDeleteJob = () => {
    if (job?.status === "IN_PROGRESS") {
      Alert.alert(
        "Cannot Delete",
        "You cannot delete a job that is currently in progress."
      );
      return;
    }

    Alert.alert(
      "Delete Job Request",
      "Are you sure you want to delete this job request? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteJobMutation.mutate(),
        },
      ]
    );
  };

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

  const handleAcceptInvite = () => {
    Alert.alert(
      "Accept Job Invitation",
      "Are you sure you want to accept this job invitation? Once accepted, you'll be expected to complete the work.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Accept",
          style: "default",
          onPress: () => acceptInviteMutation.mutate(),
        },
      ]
    );
  };

  const handleRejectInvite = () => {
    setShowRejectInviteModal(true);
  };

  const handleSubmitReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert("Error", "Please provide a reason for declining");
      return;
    }
    rejectInviteMutation.mutate(rejectReason);
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

  // Show skeleton while loading
  if (isLoading) {
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
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <JobDetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show inline loader instead of full screen
  const showLoader = false; // Removed since we use skeleton now

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
            {`The job you're looking for could not be found.${id ? ` (ID: ${id})` : ""}`}
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

  const formatReviewDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
  };

  const renderReviewCard = (title: string, review?: JobReviewSummary) => {
    const formattedDate = review ? formatReviewDate(review.createdAt) : null;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewCardHeader}>
          <Text style={styles.reviewTitle}>{title}</Text>
          {review ? (
            <View style={styles.reviewRating}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.reviewRatingValue}>
                {typeof review.rating === "number"
                  ? review.rating.toFixed(1)
                  : "--"}
              </Text>
            </View>
          ) : (
            <Text style={styles.reviewPending}>No rating yet</Text>
          )}
        </View>
        {review?.comment ? (
          <Text style={styles.reviewComment}>{review.comment}</Text>
        ) : null}
        {formattedDate ? (
          <Text style={styles.reviewDate}>Rated on {formattedDate}</Text>
        ) : null}
      </View>
    );
  };

  const jobHasFeedback =
    job.status === "COMPLETED" &&
    (job.reviews?.clientToWorker || job.reviews?.workerToClient);

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
        <View style={styles.headerRight}>
          {user?.accountID === job.postedBy?.id &&
            job.status !== "IN_PROGRESS" &&
            job.status !== "COMPLETED" && (
              <TouchableOpacity
                onPress={handleDeleteJob}
                style={styles.deleteButton}
                disabled={deleteJobMutation.isPending}
              >
                {deleteJobMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={Colors.error}
                  />
                )}
              </TouchableOpacity>
            )}
          <SaveButton
            jobId={parseInt(id)}
            isSaved={isSaved}
            size={24}
            onToggle={setIsSaved}
          />
        </View>
      </View>

      {/* Inline Loader */}
      {/* Removed - now using skeleton loader above */}

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

        {/* ML Estimated Completion Time */}
        {job.estimatedCompletion && job.status !== 'COMPLETED' && (
          <View style={styles.section}>
            <EstimatedTimeCard 
              prediction={job.estimatedCompletion}
              workerEstimate={job.expectedDuration}
            />
          </View>
        )}

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

        {/* Job Invitation Actions - For workers to accept/reject INVITE jobs */}
        {isWorker &&
          job.jobType === "INVITE" &&
          (job.inviteStatus === "PENDING" ||
            (!job.inviteStatus && job.status === "ACTIVE")) &&
          job.status === "ACTIVE" && (
            <View style={styles.section}>
              <View style={styles.inviteActionCard}>
                <View style={styles.inviteActionHeader}>
                  <Ionicons
                    name="mail-outline"
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.inviteActionTitle}>Job Invitation</Text>
                </View>
                <Text style={styles.inviteActionText}>
                  You've been invited to work on this job. Review the details
                  and decide whether to accept or decline.
                </Text>
                <View style={styles.inviteActionButtons}>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={handleRejectInvite}
                    disabled={rejectInviteMutation.isPending}
                    activeOpacity={0.8}
                  >
                    {rejectInviteMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.error} />
                    ) : (
                      <>
                        <Ionicons
                          name="close-circle-outline"
                          size={20}
                          color={Colors.error}
                        />
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptInviteButton}
                    onPress={handleAcceptInvite}
                    disabled={acceptInviteMutation.isPending}
                    activeOpacity={0.8}
                  >
                    {acceptInviteMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color={Colors.white}
                        />
                        <Text style={styles.acceptInviteButtonText}>
                          Accept Invitation
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

        {/* Applications Section - Only for open LISTING jobs by client */}
        {isClient && job.jobType === "LISTING" && !job.assignedWorker && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Applications</Text>
              {applications.length > 0 && (
                <View style={styles.applicationsBadge}>
                  <Text style={styles.applicationsBadgeText}>
                    {applications.length}
                  </Text>
                </View>
              )}
            </View>

            {applicationsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : applications.length === 0 ? (
              <View style={styles.emptyApplications}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={Colors.textSecondary}
                />
                <Text style={styles.emptyApplicationsText}>
                  No applications yet
                </Text>
                <Text style={styles.emptyApplicationsSubtext}>
                  Workers who apply will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.applicationsList}>
                {applications.map((application) => (
                  <View key={application.id} style={styles.applicationCard}>
                    {/* Worker Info */}
                    <View style={styles.applicationWorkerInfo}>
                      <Image
                        source={{
                          uri:
                            application.worker.avatar ||
                            "https://via.placeholder.com/50",
                        }}
                        style={styles.applicationAvatar}
                      />
                      <View style={styles.applicationWorkerDetails}>
                        <Text style={styles.applicationWorkerName}>
                          {application.worker.name}
                        </Text>
                        <View style={styles.applicationWorkerMeta}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text style={styles.applicationWorkerRating}>
                            {application.worker.rating.toFixed(1)}
                          </Text>
                          {application.worker.city && (
                            <>
                              <Text style={styles.applicationMetaDot}>•</Text>
                              <Text style={styles.applicationWorkerCity}>
                                {application.worker.city}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                      <View
                        style={[
                          styles.applicationStatusBadge,
                          application.status === "PENDING" &&
                            styles.statusPending,
                          application.status === "ACCEPTED" &&
                            styles.statusAccepted,
                          application.status === "REJECTED" &&
                            styles.statusRejected,
                        ]}
                      >
                        <Text style={styles.applicationStatusText}>
                          {application.status}
                        </Text>
                      </View>
                    </View>

                    {/* Proposal Details */}
                    {application.proposal_message && (
                      <View style={styles.proposalSection}>
                        <Text style={styles.proposalLabel}>Proposal:</Text>
                        <Text style={styles.proposalText} numberOfLines={3}>
                          {application.proposal_message}
                        </Text>
                      </View>
                    )}

                    <View style={styles.applicationDetails}>
                      {application.budget_option === "NEGOTIATE" && (
                        <View style={styles.applicationDetailItem}>
                          <Ionicons
                            name="cash-outline"
                            size={16}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.applicationDetailText}>
                            Proposed: ₱
                            {application.proposed_budget.toLocaleString()}
                          </Text>
                        </View>
                      )}
                      {application.estimated_duration && (
                        <View style={styles.applicationDetailItem}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.applicationDetailText}>
                            {application.estimated_duration}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    {application.status === "PENDING" && (
                      <View style={styles.applicationActions}>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() =>
                            handleRejectApplication(
                              application.id,
                              application.worker.name
                            )
                          }
                          disabled={rejectApplicationMutation.isPending}
                        >
                          {rejectApplicationMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.error}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="close-circle-outline"
                                size={20}
                                color={Colors.error}
                              />
                              <Text style={styles.rejectButtonText}>
                                Reject
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() =>
                            handleAcceptApplication(
                              application.id,
                              application.worker.name
                            )
                          }
                          disabled={acceptApplicationMutation.isPending}
                        >
                          {acceptApplicationMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color="#FFF"
                              />
                              <Text style={styles.acceptButtonText}>
                                Accept
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Job Feedback */}
        {jobHasFeedback && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Feedback</Text>
            {renderReviewCard(
              isWorker ? "From Client" : "Client → Worker",
              job.reviews?.clientToWorker
            )}
            {renderReviewCard(
              isWorker ? "Your Feedback" : "Worker → Client",
              job.reviews?.workerToClient
            )}
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
          {!user?.kycVerified && (
            <View style={styles.kycWarningBanner}>
              <Ionicons name="warning" size={20} color={Colors.warning} />
              <Text style={styles.kycWarningText}>
                Complete KYC verification to apply for jobs
              </Text>
            </View>
          )}
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
              style={[
                styles.applyButton,
                (!user?.kycVerified || hasApplied) &&
                  styles.applyButtonDisabled,
              ]}
              onPress={handleApply}
              activeOpacity={0.8}
              disabled={!user?.kycVerified || hasApplied}
            >
              <Text
                style={[
                  styles.applyButtonText,
                  (!user?.kycVerified || hasApplied) &&
                    styles.applyButtonTextDisabled,
                ]}
              >
                {!user?.kycVerified
                  ? "KYC Verification Required"
                  : hasApplied
                    ? "Already Applied"
                    : "Apply for this Job"}
              </Text>
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

      {/* Reject Invite Modal */}
      <Modal
        visible={showRejectInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectInviteModal(false)}
      >
        <TouchableOpacity
          style={styles.rejectModalOverlay}
          activeOpacity={1}
          onPress={() => setShowRejectInviteModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.rejectModalContent}>
              <View style={styles.rejectModalHeader}>
                <Text style={styles.rejectModalTitle}>Decline Invitation</Text>
                <TouchableOpacity
                  onPress={() => setShowRejectInviteModal(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.rejectModalLabel}>
                Reason for declining (required)
              </Text>
              <TextInput
                style={styles.rejectModalInput}
                placeholder="Please explain why you're declining this job invitation..."
                placeholderTextColor={Colors.textHint}
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <View style={styles.rejectModalButtons}>
                <TouchableOpacity
                  style={styles.rejectModalCancelButton}
                  onPress={() => {
                    setShowRejectInviteModal(false);
                    setRejectReason("");
                  }}
                >
                  <Text style={styles.rejectModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectModalSubmitButton}
                  onPress={handleSubmitReject}
                  disabled={rejectInviteMutation.isPending}
                >
                  {rejectInviteMutation.isPending ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.rejectModalSubmitText}>Decline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
  reviewCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  reviewTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  reviewRatingValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.primary,
  },
  reviewPending: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  reviewComment: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  reviewDate: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    color: Colors.textHint,
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
  kycWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  kycWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.small,
  },
  applyButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  applyButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },
  applyButtonTextDisabled: {
    color: Colors.textSecondary,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  // Applications Section Styles
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  applicationsBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  applicationsBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },
  emptyApplications: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
  },
  emptyApplicationsText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyApplicationsSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  applicationsList: {
    gap: Spacing.md,
  },
  applicationCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  applicationWorkerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  applicationAvatar: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  applicationWorkerDetails: {
    flex: 1,
  },
  applicationWorkerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  applicationWorkerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  applicationWorkerRating: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  applicationMetaDot: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  applicationWorkerCity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  applicationStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusPending: {
    backgroundColor: Colors.warningLight,
  },
  statusAccepted: {
    backgroundColor: Colors.successLight,
  },
  statusRejected: {
    backgroundColor: Colors.errorLight,
  },
  applicationStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    color: Colors.textPrimary,
    textTransform: "uppercase",
  },
  proposalSection: {
    marginBottom: Spacing.md,
  },
  proposalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  proposalText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  applicationDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  applicationDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  applicationDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  applicationActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
  },
  acceptButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
  },
  rejectButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.error,
  },
  // Invite Action Styles
  inviteActionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.md,
  },
  inviteActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inviteActionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  inviteActionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  inviteActionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
  },
  declineButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.error,
  },
  acceptInviteButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  acceptInviteButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
  // Reject Modal Styles
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  rejectModalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 400,
    ...Shadows.lg,
  },
  rejectModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  rejectModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  rejectModalLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  rejectModalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: Spacing.lg,
  },
  rejectModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  rejectModalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  rejectModalCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  rejectModalSubmitButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.sm,
  },
  rejectModalSubmitText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
});

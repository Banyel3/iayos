import React, { useState, useCallback } from "react";
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
import { useSafeBack, safeGoBack } from "@/lib/hooks/useSafeBack";
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
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { SaveButton } from "@/components/SaveButton";
import { JobDetailSkeleton } from "@/components/ui/SkeletonLoader";
import { EstimatedTimeCard, type EstimatedCompletion } from "@/components";
import JobReceiptModal from "@/components/JobReceiptModal";
import CountdownConfirmModal from "@/components/CountdownConfirmModal";
import {
  useTeamJobDetail,
  useApplyToSkillSlot,
  useTeamJobApplications,
  useAcceptTeamApplication,
  useRejectTeamApplication,
  type SkillSlot,
  type WorkerAssignment,
} from "@/lib/hooks/useTeamJob";
import { useMySkills } from "@/lib/hooks/useSkills";
import { useFocusEffect } from "@react-navigation/native";

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
  distance: number | null;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | string;
  postedBy: {
    id: number;
    name: string;
    avatar: string | null;
    rating: number;
    phone: string | null;
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
    avatar: string | null;
    rating: number;
    phone: string | null;
  } | null;
  reviews?: JobReviews;
  estimatedCompletion?: EstimatedCompletion | null;
  // Universal job fields for ML
  job_scope?: "MINOR_REPAIR" | "MODERATE_PROJECT" | "MAJOR_RENOVATION";
  skill_level_required?: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  work_environment?: "INDOOR" | "OUTDOOR" | "BOTH";
  // Payment model fields
  payment_model?: "PROJECT" | "DAILY" | string;
  daily_rate_agreed?: number | null;
  duration_days?: number | null;
  // Team Job Fields
  is_team_job?: boolean;
  skill_slots?: SkillSlot[];
  worker_assignments?: WorkerAssignment[];
  budget_allocation_type?:
  | "EQUAL_PER_SKILL"
  | "EQUAL_PER_WORKER"
  | "MANUAL"
  | "SKILL_WEIGHTED";
  team_fill_percentage?: number;
  total_workers_needed?: number;
  total_workers_assigned?: number;
  // Missing fields
  preferred_start_date?: string;
  payment_model?: "PROJECT" | "DAILY";
  daily_rate?: number;
  duration_days?: number;
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

// ============================================================================
// Helper functions for Universal Job Fields
// ============================================================================

const getJobScopeInfo = (scope: string) => {
  switch (scope) {
    case "MINOR_REPAIR":
      return { label: "Minor Repair", emoji: "🔧", color: Colors.success };
    case "MODERATE_PROJECT":
      return { label: "Moderate Project", emoji: "🛠️", color: Colors.warning };
    case "MAJOR_RENOVATION":
      return { label: "Major Renovation", emoji: "🏗️", color: Colors.error };
    default:
      return { label: scope, emoji: "📋", color: Colors.textSecondary };
  }
};

const getSkillLevelInfo = (level: string) => {
  switch (level) {
    case "ENTRY":
      return { label: "Entry Level", emoji: "🌱", color: Colors.success };
    case "INTERMEDIATE":
      return { label: "Intermediate", emoji: "⭐", color: Colors.warning };
    case "EXPERT":
      return { label: "Expert", emoji: "👑", color: Colors.primary };
    default:
      return { label: level, emoji: "📊", color: Colors.textSecondary };
  }
};

const getWorkEnvironmentInfo = (env: string) => {
  switch (env) {
    case "INDOOR":
      return { label: "Indoor", emoji: "🏠", color: Colors.primary };
    case "OUTDOOR":
      return { label: "Outdoor", emoji: "🌳", color: Colors.success };
    case "BOTH":
      return { label: "Indoor & Outdoor", emoji: "🔄", color: Colors.warning };
    default:
      return { label: env, emoji: "📍", color: Colors.textSecondary };
  }
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Debug logging
  console.log("[JobDetail] Loaded with id:", id, "typeof:", typeof id);

  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [countdownConfig, setCountdownConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmStyle: "default" | "destructive";
    countdownSeconds: number;
    onConfirm: () => void;
    icon?: string;
    iconColor?: string;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showRejectInviteModal, setShowRejectInviteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Application form state
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [budgetOption, setBudgetOption] = useState<"ACCEPT" | "NEGOTIATE">(
    "ACCEPT",
  );

  // Team Job state
  const [showTeamApplyModal, setShowTeamApplyModal] = useState(false);
  const [selectedSkillSlot, setSelectedSkillSlot] = useState<SkillSlot | null>(
    null,
  );
  const [showTeamCompletionModal, setShowTeamCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

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
    isValidJobId,
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

      // Debug: Log team job data from API
      console.log("[JobDetail] Raw API response:", {
        is_team_job: jobData.is_team_job,
        skill_slots_count: jobData.skill_slots?.length || 0,
        total_workers_needed: jobData.total_workers_needed,
        total_workers_assigned: jobData.total_workers_assigned,
        payment_model: jobData.payment_model,
        daily_rate_agreed: jobData.daily_rate_agreed,
        budget: jobData.budget,
        duration_days: jobData.duration_days,
      });

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
        budget: jobData.budget != null ? `₱${Number(jobData.budget).toLocaleString()}` : "TBD",
        location: jobData.location,
        distance: jobData.distance ?? null,
        status: jobData.status,
        postedBy: jobData.client
          ? {
              id: jobData.client.id,
              name: jobData.client.name,
              avatar: jobData.client.avatar || null,
              rating: jobData.client.rating ?? 0,
              phone: jobData.client.phone || null,
            }
          : {
              id: -1,
              name: "Unknown Client",
              avatar: null,
              rating: 0,
              phone: null,
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
        assignedWorker: jobData.assigned_worker
          ? {
              id: jobData.assigned_worker.id,
              name: jobData.assigned_worker.name,
              avatar: jobData.assigned_worker.avatar || null,
              rating: jobData.assigned_worker.rating ?? 0,
              phone: jobData.assigned_worker.phone || null,
            }
          : null,
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
        // Universal job fields for ML - use actual values from backend (no hardcoded fallbacks)
        job_scope: jobData.job_scope,
        skill_level_required: jobData.skill_level_required,
        work_environment: jobData.work_environment,
        // Payment model fields
        payment_model: jobData.payment_model || "PROJECT",
        daily_rate_agreed: jobData.daily_rate_agreed ?? null,
        duration_days: jobData.duration_days ?? null,
        // Team Job fields
        is_team_job: jobData.is_team_job || false,
        skill_slots: jobData.skill_slots || [],
        worker_assignments: jobData.worker_assignments || [],
        budget_allocation_type: jobData.budget_allocation_type,
        team_fill_percentage: jobData.team_fill_percentage,
        total_workers_needed: jobData.total_workers_needed,
        total_workers_assigned: jobData.total_workers_assigned,
        // Missing fields mapping
        preferred_start_date: jobData.preferred_start_date,
        payment_model:
          jobData.payment_model ||
          (jobData.daily_rate_agreed ? "DAILY" : "PROJECT"),
        daily_rate:
          jobData.daily_rate_agreed ??
          (jobData.payment_model === "DAILY" &&
            jobData.budget &&
            jobData.duration_days
            ? jobData.budget / jobData.duration_days
            : undefined),
        duration_days: jobData.duration_days,
      } as JobDetail;
    },
    enabled: isValidJobId, // Only fetch if we have a valid job ID
  });

  // Check if already applied and track which skill slots
  const { data: applicationStatus } = useQuery<{
    hasApplied: boolean;
    appliedSlotIds: number[];
  }>({
    queryKey: ["jobs", id, "applied"],
    queryFn: async (): Promise<{
      hasApplied: boolean;
      appliedSlotIds: number[];
    }> => {
      const response = await apiRequest(ENDPOINTS.MY_APPLICATIONS, {
        method: "GET",
      });

      if (!response.ok) return { hasApplied: false, appliedSlotIds: [] };

      const data = (await response.json()) as any;
      if (data.success && data.applications) {
        const jobApplications = data.applications.filter(
          (app: any) => app.job_id.toString() === id,
        );
        const hasApplied = jobApplications.length > 0;
        const appliedSlotIds = jobApplications
          .filter((app: any) => app.applied_skill_slot_id !== null)
          .map((app: any) => app.applied_skill_slot_id);
        return { hasApplied, appliedSlotIds };
      }
      return { hasApplied: false, appliedSlotIds: [] };
    },
    enabled: isWorker,
  });

  // Destructure for easier access
  const hasApplied = applicationStatus?.hasApplied ?? false;
  const appliedSlotIds = applicationStatus?.appliedSlotIds ?? [];

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
        throw new Error(
          getErrorMessage(responseData, "Failed to submit application"),
        );
      }

      return responseData;
    },
    onSuccess: () => {
      Alert.alert(
        "Success",
        "Application submitted successfully! You can view your application status in My Applications.",
      );
      setShowApplicationModal(false);
      setProposalMessage("");
      setProposedBudget("");
      setEstimatedDuration("");
      setBudgetOption("ACCEPT");
      queryClient.invalidateQueries({ queryKey: ["jobs", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id, "applied"] });
      safeGoBack(router, "/(tabs)/jobs");
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
              safeGoBack(router, "/(tabs)/jobs");
            },
          },
        ],
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
              safeGoBack(router, "/(tabs)/jobs");
            },
          },
        ],
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
        ENDPOINTS.JOB_APPLICATIONS(parseInt(id)),
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
        },
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
        },
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
    workerName: string,
  ) => {
    setCountdownConfig({
      visible: true,
      title: "Accept Application",
      message: `Are you sure you want to accept ${workerName}'s application? This will assign them to the job and reject all other applications.`,
      confirmLabel: "Accept",
      confirmStyle: "default",
      countdownSeconds: 5,
      onConfirm: () => acceptApplicationMutation.mutate(applicationId),
      icon: "checkmark-circle",
      iconColor: Colors.success,
    });
  };

  const handleRejectApplication = (
    applicationId: number,
    workerName: string,
  ) => {
    setCountdownConfig({
      visible: true,
      title: "Reject Application",
      message: `Are you sure you want to reject ${workerName}'s application?`,
      confirmLabel: "Reject",
      confirmStyle: "destructive",
      countdownSeconds: 5,
      onConfirm: () => rejectApplicationMutation.mutate(applicationId),
      icon: "close-circle",
      iconColor: Colors.error,
    });
  };

  const handleDeleteJob = () => {
    if (job?.status === "IN_PROGRESS") {
      Alert.alert(
        "Cannot Delete",
        "You cannot delete a job that is currently in progress.",
      );
      return;
    }

    setCountdownConfig({
      visible: true,
      title: "Delete Job Request",
      message: "Are you sure you want to delete this job request? This action cannot be undone.",
      confirmLabel: "Delete",
      confirmStyle: "destructive",
      countdownSeconds: 5,
      onConfirm: () => deleteJobMutation.mutate(),
      icon: "trash",
      iconColor: Colors.error,
    });
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
    setCountdownConfig({
      visible: true,
      title: "Accept Job Invitation",
      message: "Are you sure you want to accept this job invitation? Once accepted, you'll be expected to complete the work.",
      confirmLabel: "Accept",
      confirmStyle: "default",
      countdownSeconds: 5,
      onConfirm: () => acceptInviteMutation.mutate(),
      icon: "briefcase",
      iconColor: Colors.primary,
    });
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

  // ============================================================================
  // Team Job Hooks & Handlers
  // ============================================================================
  const isTeamJob = job?.is_team_job === true;

  // Debug: Log team job state in render
  console.log("[JobDetail] Team Job State:", {
    isTeamJob,
    job_is_team_job: job?.is_team_job,
    skill_slots_count: job?.skill_slots?.length || 0,
    total_workers_needed: job?.total_workers_needed,
    total_workers_assigned: job?.total_workers_assigned,
  });

  // Team job apply mutation
  const applyToSkillSlot = useApplyToSkillSlot();

  // Fetch worker's skills for skill mismatch warning
  const { data: mySkills = [] } = useMySkills();

  // Invalidate skills cache when screen gains focus (e.g., after adding a skill)
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["my-skills"] });
    }, [queryClient])
  );

  // Team job applications (for clients)
  const { data: teamApplicationsData } = useTeamJobApplications(
    parseInt(id),
    isClient && isTeamJob,
  );

  // Accept/reject team applications
  const acceptTeamApplication = useAcceptTeamApplication();
  const rejectTeamApplication = useRejectTeamApplication();

  // Check if current worker is assigned to this team job
  const currentWorkerAssignment = job?.worker_assignments?.find(
    (assignment) => assignment.worker_id === user?.profile_data?.id,
  );

  // Team job applications list for client view
  const teamApplications = (teamApplicationsData as any)?.applications || [];

  const handleTeamSlotApply = (slot: SkillSlot) => {
    if (!isWorker) {
      Alert.alert("Error", "Only workers can apply to team jobs");
      return;
    }

    // Check if worker has the required skill
    const hasRequiredSkill = mySkills.some(
      (skill) => skill.specializationId === slot.specialization_id,
    );

    if (!hasRequiredSkill) {
      // Show warning but still allow them to proceed
      Alert.alert(
        "⚠️ Skill Mismatch Warning",
        `You don't have "${slot.specialization_name}" listed as a skill on your profile.\n\nClients may prefer workers with matching skills. Would you like to continue anyway?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Add Skill First",
            onPress: () => router.push("/profile/skills" as any),
          },
          {
            text: "Continue Anyway",
            onPress: () => {
              setSelectedSkillSlot(slot);
              setProposedBudget(slot.budget_per_worker.toString());
              setBudgetOption("ACCEPT");
              setProposalMessage("");
              setEstimatedDuration("");
              setShowTeamApplyModal(true);
            },
          },
        ],
      );
      return;
    }

    setSelectedSkillSlot(slot);
    setProposedBudget(slot.budget_per_worker.toString());
    setBudgetOption("ACCEPT");
    setProposalMessage("");
    setEstimatedDuration("");
    setShowTeamApplyModal(true);
  };

  const handleSubmitTeamApplication = () => {
    if (!selectedSkillSlot) return;

    if (!proposalMessage.trim()) {
      Alert.alert("Error", "Please provide a proposal message");
      return;
    }

    const budgetValue =
      budgetOption === "ACCEPT"
        ? selectedSkillSlot.budget_per_worker
        : parseFloat(proposedBudget);

    applyToSkillSlot.mutate(
      {
        jobId: parseInt(id),
        skillSlotId: selectedSkillSlot.skill_slot_id,
        proposalMessage: proposalMessage,
        proposedBudget: budgetValue,
        budgetOption: budgetOption,
        estimatedDuration: estimatedDuration || undefined,
      },
      {
        onSuccess: () => {
          setShowTeamApplyModal(false);
          setSelectedSkillSlot(null);
          setProposalMessage("");
          setProposedBudget("");
          setEstimatedDuration("");
        },
      },
    );
  };

  const handleAcceptTeamApplication = (
    applicationId: number,
    workerName: string,
  ) => {
    Alert.alert(
      "Accept Team Application",
      `Assign ${workerName} to this team job?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: () =>
            acceptTeamApplication.mutate({
              jobId: parseInt(id),
              applicationId,
            }),
        },
      ],
    );
  };

  const handleRejectTeamApplication = (
    applicationId: number,
    workerName: string,
  ) => {
    Alert.alert("Reject Application", `Reject ${workerName}'s application?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () =>
          rejectTeamApplication.mutate({ jobId: parseInt(id), applicationId }),
      },
    ]);
  };

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case "FILLED":
        return { bg: Colors.successLight, text: Colors.success };
      case "PARTIALLY_FILLED":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "OPEN":
        return { bg: Colors.primary + "20", text: Colors.primary };
      default:
        return { bg: Colors.border, text: Colors.textSecondary };
    }
  };

  const getSkillLevelEmoji = (level: string) => {
    switch (level) {
      case "ENTRY":
        return "🌱";
      case "INTERMEDIATE":
        return "⭐";
      case "EXPERT":
        return "👑";
      default:
        return "";
    }
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
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
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
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
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
          onPress={() => safeGoBack(router, "/(tabs)/jobs")}
          style={styles.backIconButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.headerRight}>
          {/* Edit button - only show for job owner on ACTIVE jobs */}
          {user?.accountID === job.postedBy?.id && job.status === "ACTIVE" && (
            <TouchableOpacity
              onPress={() => router.push(`/jobs/edit/${id}` as any)}
              style={styles.editButton}
            >
              <Ionicons
                name="pencil-outline"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
          {/* Delete button - for job owner on non-active jobs */}
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
          <View style={styles.jobMetaRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.jobStartDate}>
              {job.preferred_start_date
                ? `Start: ${new Date(job.preferred_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : `Posted ${job.postedAt}`}
            </Text>
          </View>

          {/* Team Job Header Badge - Prominent indicator at top */}
          {isTeamJob && (
            <View style={styles.teamJobHeaderBadge}>
              <Ionicons name="people-circle" size={20} color={Colors.white} />
              <Text style={styles.teamJobHeaderBadgeText}>Team Job</Text>
              <View style={styles.teamJobHeaderDivider} />
              <Text style={styles.teamJobHeaderCount}>
                {job.total_workers_assigned || 0}/
                {job.total_workers_needed || 0} workers filled
              </Text>
              {(job.team_fill_percentage || 0) >= 100 && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Colors.white}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Budget & Location */}
        <View style={styles.detailsSection}>
          <View style={styles.detailCard}>
            <Ionicons
              name={job.payment_model === "DAILY" ? "time-outline" : "cash-outline"}
              size={24}
              color={Colors.primary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Budget</Text>
              <Text style={styles.detailValue}>{job.budget}</Text>
              {job.payment_model === "DAILY" && job.daily_rate_agreed ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <Text style={{ fontSize: 11, color: Colors.primary }}>📅 Daily Rate: ₱{Number(job.daily_rate_agreed).toLocaleString()}/day</Text>
                  {job.duration_days ? <Text style={{ fontSize: 11, color: Colors.textSecondary, marginLeft: 4 }}>({job.duration_days}d)</Text> : null}
                </View>
              ) : (
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>💼 Project Based</Text>
              )}
            </View>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.detailCard}>
            <Ionicons
              name="location-outline"
              size={24}
              color={Colors.primary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {job.distance != null && job.distance > 0
                  ? `${job.distance.toFixed(1)} km away`
                  : job.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Job Requirements Section - Universal Fields for ML */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Requirements</Text>
          <View style={styles.requirementsGrid}>
            {/* Job Scope */}
            {job.job_scope && (
              <View style={styles.requirementCard}>
                <View
                  style={[
                    styles.requirementIconContainer,
                    {
                      backgroundColor:
                        getJobScopeInfo(job.job_scope).color + "20",
                    },
                  ]}
                >
                  <Text style={styles.requirementEmoji}>
                    {getJobScopeInfo(job.job_scope).emoji}
                  </Text>
                </View>
                <Text style={styles.requirementLabel}>Scope</Text>
                <Text
                  style={[
                    styles.requirementValue,
                    { color: getJobScopeInfo(job.job_scope).color },
                  ]}
                >
                  {getJobScopeInfo(job.job_scope).label}
                </Text>
              </View>
            )}

            {/* Skill Level Required */}
            {job.skill_level_required && (
              <View style={styles.requirementCard}>
                <View
                  style={[
                    styles.requirementIconContainer,
                    {
                      backgroundColor:
                        getSkillLevelInfo(job.skill_level_required).color +
                        "20",
                    },
                  ]}
                >
                  <Text style={styles.requirementEmoji}>
                    {getSkillLevelInfo(job.skill_level_required).emoji}
                  </Text>
                </View>
                <Text style={styles.requirementLabel}>Skill Level</Text>
                <Text
                  style={[
                    styles.requirementValue,
                    {
                      color: getSkillLevelInfo(job.skill_level_required).color,
                    },
                  ]}
                >
                  {getSkillLevelInfo(job.skill_level_required).label}
                </Text>
              </View>
            )}

            {/* Work Environment */}
            {job.work_environment && (
              <View style={styles.requirementCard}>
                <View
                  style={[
                    styles.requirementIconContainer,
                    {
                      backgroundColor:
                        getWorkEnvironmentInfo(job.work_environment).color +
                        "20",
                    },
                  ]}
                >
                  <Text style={styles.requirementEmoji}>
                    {getWorkEnvironmentInfo(job.work_environment).emoji}
                  </Text>
                </View>
                <Text style={styles.requirementLabel}>Environment</Text>
                <Text
                  style={[
                    styles.requirementValue,
                    {
                      color: getWorkEnvironmentInfo(job.work_environment).color,
                    },
                  ]}
                >
                  {getWorkEnvironmentInfo(job.work_environment).label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Materials Needed */}
        {job.materialsNeeded && job.materialsNeeded.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materials Needed</Text>
            {job.materialsNeeded.map((material, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons
                  name="construct-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.listItemText}>{material}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ML Estimated Completion Time */}
        {(isLoading ||
          (job.estimatedCompletion && job.status !== "COMPLETED")) && (
            <View style={styles.section}>
              <EstimatedTimeCard
                prediction={job?.estimatedCompletion || null}
                isLoading={isLoading}
              />
            </View>
          )}

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

        {/* ============================================================================
            Team Job Section - Skill Slots & Assignments
            ============================================================================ */}
        {isTeamJob && job.skill_slots && job.skill_slots.length > 0 && (
          <View style={styles.section}>
            {/* Team Job Header Badge */}
            <View style={styles.teamJobBadge}>
              <Ionicons name="people" size={20} color={Colors.white} />
              <Text style={styles.teamJobBadgeText}>Team Job</Text>
              <Text style={styles.teamJobBadgeSubtext}>
                {job.total_workers_assigned || 0}/
                {job.total_workers_needed || 0} workers assigned
              </Text>
            </View>

            {/* Team Fill Progress */}
            <View style={styles.teamProgressContainer}>
              <View style={styles.teamProgressBar}>
                <View
                  style={[
                    styles.teamProgressFill,
                    { width: `${job.team_fill_percentage || 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.teamProgressText}>
                {Math.round(job.team_fill_percentage || 0)}% filled
              </Text>
            </View>

            {/* Conversation Lock Notice - Chat only available when all workers selected */}
            {(job.team_fill_percentage || 0) < 100 && (
              <View style={styles.conversationLockBanner}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={20}
                  color={Colors.warning}
                />
                <View style={styles.conversationLockContent}>
                  <Text style={styles.conversationLockTitle}>
                    Group Chat Locked
                  </Text>
                  <Text style={styles.conversationLockText}>
                    {isClient
                      ? `Select ${(job.total_workers_needed || 0) - (job.total_workers_assigned || 0)} more worker(s) to start the team conversation`
                      : "Team chat will be available once all positions are filled"}
                  </Text>
                </View>
              </View>
            )}

            {/* Conversation Ready Notice */}
            {(job.team_fill_percentage || 0) >= 100 &&
              job.status === "ACTIVE" && (
                <View style={styles.conversationReadyBanner}>
                  <Ionicons
                    name="chatbubbles"
                    size={20}
                    color={Colors.success}
                  />
                  <View style={styles.conversationLockContent}>
                    <Text style={styles.conversationReadyTitle}>
                      Team Ready!
                    </Text>
                    <Text style={styles.conversationReadyText}>
                      All workers selected. Group conversation is now available.
                    </Text>
                  </View>
                </View>
              )}

            <Text style={styles.sectionTitle}>Skill Slots</Text>

            {/* Skill Slot Cards */}
            {job.skill_slots.map((slot) => {
              const slotColors = getSlotStatusColor(slot.status);
              const assignedWorkers =
                job.worker_assignments?.filter(
                  (a) => a.skill_slot_id === slot.skill_slot_id,
                ) || [];

              return (
                <View key={slot.skill_slot_id} style={styles.skillSlotCard}>
                  <View style={styles.skillSlotHeader}>
                    <View style={styles.skillSlotTitleRow}>
                      <Text style={styles.skillSlotTitle}>
                        {slot.specialization_name}
                      </Text>
                      <View
                        style={[
                          styles.slotStatusBadge,
                          { backgroundColor: slotColors.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotStatusText,
                            { color: slotColors.text },
                          ]}
                        >
                          {slot.status.replace(/_/g, " ")}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.skillSlotSubtitle}>
                      {getSkillLevelEmoji(slot.skill_level_required)}{" "}
                      {slot.skill_level_required}
                    </Text>
                  </View>

                  <View style={styles.skillSlotInfo}>
                    <View style={styles.skillSlotInfoItem}>
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.skillSlotInfoText}>
                        {slot.workers_assigned}/{slot.workers_needed} workers
                      </Text>
                    </View>
                    <View style={styles.skillSlotInfoItem}>
                      <Ionicons
                        name="cash-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.skillSlotInfoText}>
                        ₱{slot.budget_per_worker.toLocaleString()}/worker
                      </Text>
                    </View>
                  </View>

                  {/* Position Slots with Numbers */}
                  <View style={styles.positionsContainer}>
                    <Text style={styles.positionsLabel}>Positions:</Text>
                    {Array.from({ length: slot.workers_needed }).map(
                      (_, posIndex) => {
                        const assignedWorker = assignedWorkers[posIndex];
                        const isFilled = !!assignedWorker;

                        return (
                          <View
                            key={posIndex}
                            style={[
                              styles.positionRow,
                              isFilled
                                ? styles.positionFilled
                                : styles.positionOpen,
                            ]}
                          >
                            <View style={styles.positionNumber}>
                              <Text style={styles.positionNumberText}>
                                {posIndex + 1}
                              </Text>
                            </View>
                            {isFilled ? (
                              <>
                                {assignedWorker.worker_avatar ? (
                                  <Image
                                    source={{ uri: assignedWorker.worker_avatar }}
                                    style={styles.positionAvatar}
                                  />
                                ) : (
                                  <View style={[styles.positionAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Ionicons name="person" size={16} color={Colors.textSecondary} />
                                  </View>
                                )}
                                <Text style={styles.positionWorkerName}>
                                  {assignedWorker.worker_name}
                                </Text>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={18}
                                  color={Colors.success}
                                />
                                {assignedWorker.worker_marked_complete && (
                                  <View style={styles.completedTag}>
                                    <Text style={styles.completedTagText}>
                                      Done
                                    </Text>
                                  </View>
                                )}
                              </>
                            ) : (
                              <>
                                <View style={styles.positionEmptyAvatar}>
                                  <Ionicons
                                    name="person-outline"
                                    size={16}
                                    color={Colors.textSecondary}
                                  />
                                </View>
                                <Text style={styles.positionOpenText}>
                                  Open Position
                                </Text>
                                <View style={styles.openTag}>
                                  <Text style={styles.openTagText}>Hiring</Text>
                                </View>
                              </>
                            )}
                          </View>
                        );
                      },
                    )}
                  </View>

                  {/* Apply Button for Workers (if slot is open and not already applied to THIS slot) */}
                  {isWorker &&
                    slot.openings_remaining > 0 &&
                    job.status === "ACTIVE" &&
                    !currentWorkerAssignment &&
                    !appliedSlotIds.includes(slot.skill_slot_id) && (
                      <TouchableOpacity
                        style={styles.applySlotButton}
                        onPress={() => handleTeamSlotApply(slot)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="hand-left"
                          size={18}
                          color={Colors.white}
                        />
                        <Text style={styles.applySlotButtonText}>
                          Apply to this Slot
                        </Text>
                      </TouchableOpacity>
                    )}

                  {/* Already Applied Badge - Per Slot */}
                  {isWorker &&
                    appliedSlotIds.includes(slot.skill_slot_id) &&
                    !currentWorkerAssignment && (
                      <View style={styles.appliedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Colors.success}
                        />
                        <Text
                          style={[
                            styles.appliedBadgeText,
                            { color: Colors.success },
                          ]}
                        >
                          Already Applied
                        </Text>
                      </View>
                    )}
                </View>
              );
            })}

            {/* Worker's Own Assignment Actions */}
            {isWorker && currentWorkerAssignment && (
              <View style={styles.workerAssignmentCard}>
                <View style={styles.assignmentCardHeader}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                  <Text style={styles.assignmentCardTitle}>
                    You&apos;re Assigned!
                  </Text>
                </View>
                <Text style={styles.assignmentCardSubtitle}>
                  Slot: {currentWorkerAssignment.specialization_name}
                </Text>

                {currentWorkerAssignment.worker_marked_complete ? (
                  <View style={styles.completedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.success}
                    />
                    <Text style={styles.completedBadgeText}>
                      Marked Complete - Awaiting Client Approval
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 }}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
                    <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: "500" }}>
                      Go to conversation to manage job progress
                    </Text>
                  </View>
                )}
              </View>
            )}

          </View>
        )}

        {/* Team Job Applications - For clients to review applications */}
        {isTeamJob && isClient && teamApplications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team Applications</Text>
              <View style={styles.applicationsBadge}>
                <Text style={styles.applicationsBadgeText}>
                  {
                    teamApplications.filter((a: any) => a.status === "PENDING")
                      .length
                  }
                </Text>
              </View>
            </View>

            {teamApplications.map((app: any) => (
              <View key={app.application_id} style={styles.applicationCard}>
                <View style={styles.applicationWorkerInfo}>
                  {app.worker_avatar ? (
                    <Image
                      source={{ uri: app.worker_avatar }}
                      style={styles.applicationAvatar}
                    />
                  ) : (
                    <View style={[styles.applicationAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="person" size={24} color={Colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.applicationWorkerDetails}>
                    <Text style={styles.applicationWorkerName}>
                      {app.worker_name}
                    </Text>
                    <View style={styles.applicationWorkerMeta}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.applicationWorkerRating}>
                        {app.worker_rating?.toFixed(1) || "New"}
                      </Text>
                      <Text style={styles.applicationMetaDot}>•</Text>
                      <Text style={styles.applicationWorkerCity}>
                        Applying for: {app.specialization_name}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.applicationStatusBadge,
                      app.status === "PENDING"
                        ? styles.statusPending
                        : app.status === "ACCEPTED"
                          ? styles.statusAccepted
                          : styles.statusRejected,
                    ]}
                  >
                    <Text style={styles.applicationStatusText}>
                      {app.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.proposalSection}>
                  <Text style={styles.proposalLabel}>Proposal</Text>
                  <Text style={styles.proposalText}>
                    {app.proposal_message}
                  </Text>
                </View>

                <View style={styles.applicationDetails}>
                  <View style={styles.applicationDetailItem}>
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.applicationDetailText}>
                      ₱{app.proposed_budget?.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {app.status === "PENDING" && (
                  <View style={styles.applicationActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() =>
                        handleAcceptTeamApplication(
                          app.application_id,
                          app.worker_name,
                        )
                      }
                      disabled={acceptTeamApplication.isPending}
                    >
                      {acceptTeamApplication.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={Colors.white}
                          />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() =>
                        handleRejectTeamApplication(
                          app.application_id,
                          app.worker_name,
                        )
                      }
                      disabled={rejectTeamApplication.isPending}
                    >
                      {rejectTeamApplication.isPending ? (
                        <ActivityIndicator size="small" color={Colors.error} />
                      ) : (
                        <>
                          <Ionicons
                            name="close"
                            size={18}
                            color={Colors.error}
                          />
                          <Text style={styles.rejectButtonText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
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
                  You&apos;ve been invited to work on this job. Review the details
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

        {/* Applications Section - Only for open LISTING jobs by client (non-team jobs only) */}
        {isClient &&
          job.jobType === "LISTING" &&
          !job.assignedWorker &&
          !isTeamJob && (
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
                        {application.worker.avatar ? (
                          <Image
                            source={{ uri: application.worker.avatar }}
                            style={styles.applicationAvatar}
                          />
                        ) : (
                          <View style={[styles.applicationAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="person" size={24} color={Colors.textSecondary} />
                          </View>
                        )}
                        <View style={styles.applicationWorkerDetails}>
                          <Text style={styles.applicationWorkerName}>
                            {application.worker.name}
                          </Text>
                          <View style={styles.applicationWorkerMeta}>
                            {application.worker.rating > 0 ? (
                              <>
                                <Ionicons name="star" size={14} color="#F59E0B" />
                                <Text style={styles.applicationWorkerRating}>
                                  {application.worker.rating.toFixed(1)}
                                </Text>
                              </>
                            ) : (
                              <Text style={[styles.applicationWorkerRating, { color: Colors.textSecondary }]}>New</Text>
                            )}
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
                                application.worker.name,
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
                                application.worker.name,
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
              job.reviews?.clientToWorker,
            )}
            {renderReviewCard(
              isWorker ? "Your Feedback" : "Worker → Client",
              job.reviews?.workerToClient,
            )}
          </View>
        )}

        {/* View Receipt Button - Shows for COMPLETED jobs */}
        {job.status === "COMPLETED" && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.viewReceiptButton}
              onPress={() => setShowReceiptModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.viewReceiptButtonContent}>
                <View style={styles.viewReceiptIconContainer}>
                  <Ionicons name="receipt" size={22} color={Colors.white} />
                </View>
                <View style={styles.viewReceiptTextContainer}>
                  <Text style={styles.viewReceiptButtonTitle}>
                    View Receipt
                  </Text>
                  <Text style={styles.viewReceiptButtonSubtitle}>
                    Payment breakdown and job details
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.primary}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Client & Worker Info - Different display based on job type */}
        {job.jobType === "INVITE" ||
          job.status === "IN_PROGRESS" ||
          job.status === "COMPLETED" ? (
          <>
            {/* Client Section - clickable for workers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client</Text>
              {isWorker && job.postedBy?.id ? (
                /* Worker viewing client - clickable */
                <TouchableOpacity
                  style={styles.posterCard}
                  onPress={() =>
                    router.push(`/clients/${job.postedBy?.id}` as any)
                  }
                  activeOpacity={0.7}
                >
                  {job.postedBy?.avatar ? (
                    <Image
                      source={{ uri: job.postedBy.avatar }}
                      style={styles.posterAvatar}
                    />
                  ) : (
                    <View style={[styles.posterAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="person" size={28} color={Colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.posterInfo}>
                    <Text style={styles.posterName}>
                      {job.postedBy?.name || "Unknown Client"}
                    </Text>
                    <View style={styles.posterRating}>
                      {(job.postedBy?.rating ?? 0) > 0 ? (
                        <>
                          <Ionicons name="star" size={16} color="#F59E0B" />
                          <Text style={styles.posterRatingText}>
                            {job.postedBy.rating.toFixed(1)} rating
                          </Text>
                        </>
                      ) : (
                        <Text style={[styles.posterRatingText, { color: Colors.textSecondary }]}>New</Text>
                      )}
                    </View>
                    <Text style={styles.tapToViewHint}>
                      Tap to view profile
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              ) : (
                /* Client viewing their own job - not clickable */
                <View style={styles.posterCard}>
                  {job.postedBy?.avatar ? (
                    <Image
                      source={{ uri: job.postedBy.avatar }}
                      style={styles.posterAvatar}
                    />
                  ) : (
                    <View style={[styles.posterAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="person" size={28} color={Colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.posterInfo}>
                    <Text style={styles.posterName}>
                      {job.postedBy?.name || "Unknown Client"}
                      {isClient && job.postedBy?.id === user?.accountID
                        ? " (You)"
                        : ""}
                    </Text>
                    <View style={styles.posterRating}>
                      {(job.postedBy?.rating ?? 0) > 0 ? (
                        <>
                          <Ionicons name="star" size={16} color="#F59E0B" />
                          <Text style={styles.posterRatingText}>
                            {job.postedBy.rating.toFixed(1)} rating
                          </Text>
                        </>
                      ) : (
                        <Text style={[styles.posterRatingText, { color: Colors.textSecondary }]}>New</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Worker Section - Show if assigned, only clickable for clients viewing other workers */}
            {job.assignedWorker && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Worker</Text>
                {isClient && job.assignedWorker?.id !== user?.accountID ? (
                  /* Client viewing worker - clickable */
                  <TouchableOpacity
                    style={styles.posterCard}
                    onPress={() =>
                      router.push(`/workers/${job.assignedWorker?.id}` as any)
                    }
                    activeOpacity={0.7}
                  >
                    {job.assignedWorker?.avatar ? (
                      <Image
                        source={{ uri: job.assignedWorker.avatar }}
                        style={styles.posterAvatar}
                      />
                    ) : (
                      <View style={[styles.posterAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="person" size={28} color={Colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.posterInfo}>
                      <Text style={styles.posterName}>
                        {job.assignedWorker?.name || "Unknown Worker"}
                      </Text>
                      <View style={styles.posterRating}>
                        {(job.assignedWorker?.rating ?? 0) > 0 ? (
                          <>
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text style={styles.posterRatingText}>
                              {job.assignedWorker.rating.toFixed(1)} rating
                            </Text>
                          </>
                        ) : (
                          <Text style={[styles.posterRatingText, { color: Colors.textSecondary }]}>New</Text>
                        )}
                      </View>
                      <Text style={styles.tapToViewHint}>
                        Tap to view profile
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : (
                  /* Worker viewing their own info - not clickable */
                  <View style={styles.posterCard}>
                    {job.assignedWorker?.avatar ? (
                      <Image
                        source={{ uri: job.assignedWorker.avatar }}
                        style={styles.posterAvatar}
                      />
                    ) : (
                      <View style={[styles.posterAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="person" size={28} color={Colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.posterInfo}>
                      <Text style={styles.posterName}>
                        {job.assignedWorker?.name || "Unknown Worker"}
                        {job.assignedWorker?.id === user?.accountID && " (You)"}
                      </Text>
                      <View style={styles.posterRating}>
                        {(job.assignedWorker?.rating ?? 0) > 0 ? (
                          <>
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text style={styles.posterRatingText}>
                              {job.assignedWorker.rating.toFixed(1)} rating
                            </Text>
                          </>
                        ) : (
                          <Text style={[styles.posterRatingText, { color: Colors.textSecondary }]}>New</Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          /* LISTING Jobs - Show "Posted By" - clickable for workers */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posted By</Text>
            {isWorker && job.postedBy?.id ? (
              /* Worker viewing client - clickable */
              <TouchableOpacity
                style={styles.posterCard}
                onPress={() =>
                  router.push(`/clients/${job.postedBy?.id}` as any)
                }
                activeOpacity={0.7}
              >
                {job.postedBy?.avatar ? (
                  <Image
                    source={{ uri: job.postedBy.avatar }}
                    style={styles.posterAvatar}
                  />
                ) : (
                  <View style={[styles.posterAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person" size={28} color={Colors.textSecondary} />
                  </View>
                )}
                <View style={styles.posterInfo}>
                  <Text style={styles.posterName}>
                    {job.postedBy?.name || "Unknown Client"}
                  </Text>
                  <View style={styles.posterRating}>
                    {(job.postedBy?.rating ?? 0) > 0 ? (
                      <>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.posterRatingText}>
                          {job.postedBy.rating.toFixed(1)} rating
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.posterRatingText, { color: Colors.textSecondary }]}>New</Text>
                    )}
                  </View>
                  <Text style={styles.postedTime}>Posted {job.postedAt}</Text>
                  <Text style={styles.tapToViewHint}>Tap to view profile</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            ) : (
              /* Client viewing their own post - not clickable */
              <View style={styles.posterCard}>
                {job.postedBy?.avatar ? (
                  <Image
                    source={{ uri: job.postedBy.avatar }}
                    style={styles.posterAvatar}
                  />
                ) : (
                  <View style={[styles.posterAvatar, { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person" size={28} color={Colors.textSecondary} />
                  </View>
                )}
                <View style={styles.posterInfo}>
                  <Text style={styles.posterName}>
                    {job.postedBy?.name || "Unknown Client"}
                    {isClient && job.postedBy?.id === user?.accountID
                      ? " (You)"
                      : ""}
                  </Text>
                  <View style={styles.posterRating}>
                    {(job.postedBy?.rating ?? 0) > 0 ? (
                      <>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.posterRatingText}>
                          {job.postedBy.rating.toFixed(1)} rating
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.posterRatingText, { color: Colors.textSecondary }]}>New</Text>
                    )}
                  </View>
                  <Text style={styles.postedTime}>Posted {job.postedAt}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Apply Button (Fixed at bottom) - Only for LISTING jobs, not INVITE jobs */}
      {isWorker && job?.jobType !== "INVITE" && (
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

      {/* Team Job Apply Modal */}
      <Modal
        visible={showTeamApplyModal}
        animationType="slide"
        onRequestClose={() => {
          setShowTeamApplyModal(false);
          setSelectedSkillSlot(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply to Skill Slot</Text>
            <TouchableOpacity
              onPress={() => {
                setShowTeamApplyModal(false);
                setSelectedSkillSlot(null);
                setProposalMessage("");
                setProposedBudget("");
                setEstimatedDuration("");
              }}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Selected Slot Info */}
            {selectedSkillSlot && (
              <View
                style={[styles.skillSlotCard, { marginBottom: Spacing.lg }]}
              >
                <Text style={styles.skillSlotTitle}>
                  {selectedSkillSlot.specialization_name}
                </Text>
                <Text style={styles.skillSlotSubtitle}>
                  {getSkillLevelEmoji(selectedSkillSlot.skill_level_required)}{" "}
                  {selectedSkillSlot.skill_level_required} Level Required
                </Text>
                <View style={[styles.skillSlotInfo, { marginTop: Spacing.sm }]}>
                  <View style={styles.skillSlotInfoItem}>
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.skillSlotInfoText}>
                      ₱{selectedSkillSlot.budget_per_worker.toLocaleString()}
                      /worker
                    </Text>
                  </View>
                  <View style={styles.skillSlotInfoItem}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.skillSlotInfoText}>
                      {selectedSkillSlot.openings_remaining} openings left
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Budget Options */}
            <Text style={styles.label}>Budget Option</Text>
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
                  Accept ₱
                  {selectedSkillSlot?.budget_per_worker.toLocaleString()}
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
                placeholder="Explain why you're the best fit for this skill slot..."
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
                applyToSkillSlot.isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitTeamApplication}
              disabled={applyToSkillSlot.isPending}
              activeOpacity={0.8}
            >
              {applyToSkillSlot.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Job Receipt Modal */}
      <JobReceiptModal
        visible={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        jobId={parseInt(id)}
        userRole={isWorker ? "WORKER" : "CLIENT"}
      />

      {/* Countdown Confirmation Modal */}
      {countdownConfig && (
        <CountdownConfirmModal
          visible={countdownConfig.visible}
          title={countdownConfig.title}
          message={countdownConfig.message}
          confirmLabel={countdownConfig.confirmLabel}
          confirmStyle={countdownConfig.confirmStyle}
          countdownSeconds={countdownConfig.countdownSeconds}
          onConfirm={() => {
            countdownConfig.onConfirm();
            setCountdownConfig(null);
          }}
          onCancel={() => setCountdownConfig(null)}
          icon={countdownConfig.icon as any}
          iconColor={countdownConfig.iconColor}
        />
      )}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  editButton: {
    padding: Spacing.xs,
  },
  deleteButton: {
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
    fontSize: 28, // Made larger as requested
    fontWeight: "800",
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
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
    height: "100%",
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
  detailSubValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
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
  // Job Details
  jobStartDate: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: "700",
  },
  tapToViewHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  // View Receipt Button Styles
  viewReceiptButton: {
    backgroundColor: Colors.primaryLight || "#E3F2FD",
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
    overflow: "hidden",
  },
  viewReceiptButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  viewReceiptIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  viewReceiptTextContainer: {
    flex: 1,
  },
  viewReceiptButtonTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.primary,
  },
  viewReceiptButtonSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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

  // ============================================================================
  // Team Job Styles
  // ============================================================================
  teamJobHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  teamJobHeaderBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },
  teamJobHeaderDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  teamJobHeaderCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.white,
    opacity: 0.95,
  },
  teamJobBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  teamJobBadgeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
  teamJobBadgeSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    opacity: 0.9,
    marginLeft: "auto",
  },
  teamProgressContainer: {
    marginBottom: Spacing.lg,
  },
  teamProgressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  teamProgressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
  },
  teamProgressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: "right",
  },
  skillSlotCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  skillSlotHeader: {
    marginBottom: Spacing.sm,
  },
  skillSlotTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  skillSlotTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  slotStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  slotStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  skillSlotSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  skillSlotInfo: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  skillSlotInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  skillSlotInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  // Conversation Lock/Ready Banners
  conversationLockBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  conversationReadyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  conversationLockContent: {
    flex: 1,
  },
  conversationLockTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.warning,
    marginBottom: 2,
  },
  conversationLockText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  conversationReadyTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.success,
    marginBottom: 2,
  },
  conversationReadyText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Position Slots Styles
  positionsContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  positionsLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  positionFilled: {
    backgroundColor: Colors.successLight,
  },
  positionOpen: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  positionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  positionNumberText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    color: Colors.white,
  },
  positionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  positionEmptyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  positionWorkerName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  positionOpenText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: "italic",
    flex: 1,
  },
  completedTag: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  completedTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
  openTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  openTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
  assignedWorkersList: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  assignedWorkersLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  assignedWorkerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  assignedWorkerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  assignedWorkerName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  applySlotButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  applySlotButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  appliedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.border,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  appliedBadgeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  workerAssignmentCard: {
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  assignmentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  assignmentCardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.success,
  },
  assignmentCardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  completeAssignmentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  completeAssignmentButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  completedBadgeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: "500",
  },

  // Job Requirements Section (Universal ML Fields)
  requirementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  requirementCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  requirementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  requirementEmoji: {
    fontSize: 24,
  },
  requirementLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  requirementValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
});

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  TextInput,
  Alert,
  Platform,
  ActionSheetIOS,
  Linking,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { ENDPOINTS, apiRequest, API_BASE_URL } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { SaveButton } from "@/components/SaveButton";
import { JobDetailSkeleton } from "@/components/ui/SkeletonLoader";
import {
  EstimatedTimeCard,
  JobLifecycleTimeline,
  type EstimatedCompletion,
} from "@/components";
import JobReceiptModal from "@/components/JobReceiptModal";
import CountdownConfirmModal from "@/components/CountdownConfirmModal";
import InfoModal from "@/components/InfoModal";
import { useOneTimeModal } from "@/lib/hooks/useOneTimeModal";
import {
  useTeamJobDetail,
  useApplyToSkillSlot,
  useTeamJobApplications,
  useAcceptTeamApplication,
  useRejectTeamApplication,
  useInviteAgencyToTeamSlot,
  useMarkTeamEmployeeComplete,
  type SkillSlot,
  type WorkerAssignment,
  type AgencyEmployeeAssignment,
} from "@/lib/hooks/useTeamJob";
import { useConfirmTeamEmployeeArrival } from "@/lib/hooks/useJobActions";
import { useAgencies, type Agency } from "@/lib/hooks/useAgencies";
import { useMySkills } from "@/lib/hooks/useSkills";
import { useSubmitReport } from "@/lib/hooks/useReports";
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
  createdAt?: string | null;
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
  assignedAgency?: {
    id: number;
    name: string;
    logo: string | null;
    rating: number;
    workers_assigned: number;
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
  shift_type?: "ANY" | "MORNING" | "NIGHT" | null;
  // Team Job Fields
  is_team_job?: boolean;
  skill_slots?: SkillSlot[];
  worker_assignments?: WorkerAssignment[];
  agency_employee_assignments?: AgencyEmployeeAssignment[];
  is_mixed_team?: boolean;
  has_agency_invites?: boolean;
  total_freelancers?: number;
  total_agency_employees?: number;
  multi_slot_workers?: number[];
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
  scheduled_end_date?: string;
  daily_rate?: number;
  minimum_rate?: number | null;
  workerMarkedOnTheWay?: boolean;
  workerMarkedOnTheWayAt?: string | null;
  workerMarkedJobStarted?: boolean;
  workerMarkedJobStartedAt?: string | null;
  clientConfirmedWorkStarted?: boolean;
  clientConfirmedWorkStartedAt?: string | null;
  cancelledAt?: string | null;
  cancelledByRole?: string | null;
  cancellationStage?: string | null;
  cancellationReason?: string | null;
  clientRefundAmount?: number;
  workerCompensationAmount?: number;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
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
  proposed_daily_rate?: number | null;
  proposed_days?: number | null;
  estimated_duration: string;
  budget_option: "ACCEPT" | "NEGOTIATE";
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  negotiation_count: number;
  max_proposals?: number;
  proposals_remaining?: number;
  client_rejection_reason?: string | null;
  response_message?: string | null;
  last_actor?: "WORKER" | "CLIENT" | null;
  client_counter_budget?: number | null;
  client_counter_daily_rate?: number | null;
  client_counter_days?: number | null;
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

const getBarangayFromLocation = (location?: string | null) => {
  const value = String(location || "").trim();
  if (!value) return "Location not specified";

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) return parts[1];
  if (parts.length >= 2) return parts[1];
  return parts[0];
};

const getStreetAndBarangayFromLocation = (location?: string | null) => {
  const value = String(location || "").trim();
  if (!value) return "Location not specified";

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }

  return parts[0] || "Location not specified";
};

const formatRelativePostedTime = (value?: string | null) => {
  if (!value) return "Recently";

  const postedDate = new Date(value);
  if (Number.isNaN(postedDate.getTime())) return "Recently";

  const diffSeconds = Math.max(
    Math.floor((Date.now() - postedDate.getTime()) / 1000),
    0,
  );

  if (diffSeconds < 60) {
    return `${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${Math.max(diffMonths, 1)} month${diffMonths === 1 ? "" : "s"} ago`;
};

// ============================================================================
// Payment education content — shown once to workers before first apply
// ============================================================================

const WORKER_PAYMENT_INFO_ITEMS = [
  {
    icon: "lock-closed-outline" as const,
    label: "Secured Payment",
    description: "Client funds are held in escrow.",
  },
  {
    icon: "checkmark-circle-outline" as const,
    label: "Client Approval",
    description: "Payment moves to Pending after job completion.",
  },
  {
    icon: "time-outline" as const,
    label: "7-day Hold",
    description: "Short hold for dispute protection before funds are released.",
  },
  {
    icon: "card-outline" as const,
    label: "Withdraw Anytime",
    description: "Send your earnings to your GCash.",
  },
];

// Inline negotiation thread for client's application cards
function ClientNegotiationThread({ applicationId, paymentModel }: { applicationId: number; paymentModel?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useQuery<{
    thread: Array<{
      negotiation_id: number;
      actor: "WORKER" | "CLIENT";
      proposed_budget: number;
      proposed_daily_rate: number | null;
      proposed_days: number | null;
      message: string;
      status: string;
      created_at: string;
    }>;
  }>({
    queryKey: ["negotiation-thread", applicationId],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.NEGOTIATION_THREAD(applicationId));
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json() as Promise<{ thread: Array<any> }>;
    },
    enabled: expanded,
  });

  const thread = data?.thread ?? [];

  return (
    <View style={{ marginTop: 8 }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
      >
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.primary} />
        <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: "600" }}>
          {expanded ? "Hide" : "View"} Negotiation History
        </Text>
      </TouchableOpacity>

      {expanded && (
        isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 8 }} />
        ) : thread.length === 0 ? (
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>No negotiation entries yet.</Text>
        ) : (
          <View style={{ marginTop: 6, backgroundColor: Colors.background, borderRadius: 8, padding: 10 }}>
            {thread.map((round, index) => (
              <View
                key={round.negotiation_id}
                style={{
                  paddingBottom: index < thread.length - 1 ? 8 : 0,
                  marginBottom: index < thread.length - 1 ? 8 : 0,
                  borderBottomWidth: index < thread.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 4,
                    backgroundColor: round.actor === "CLIENT" ? "#E8F4FD" : "#FFF3CD",
                    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
                  }}>
                    <Ionicons
                      name={round.actor === "CLIENT" ? "person" : "construct"}
                      size={10}
                      color={round.actor === "CLIENT" ? Colors.primary : Colors.warning}
                    />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: round.actor === "CLIENT" ? Colors.primary : Colors.warning }}>
                      {round.actor === "CLIENT" ? "You" : "Worker"}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 10, fontWeight: "600",
                    color: round.status === "PENDING" ? Colors.warning
                      : round.status === "ACCEPTED" ? Colors.success
                      : round.status === "COUNTERED" ? Colors.primary
                      : Colors.textSecondary,
                  }}>
                    {round.status}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.textPrimary }}>
                  {paymentModel === "DAILY" && round.proposed_daily_rate && round.proposed_days
                    ? `₱${round.proposed_daily_rate.toLocaleString()}/day × ${round.proposed_days} days`
                    : `₱${round.proposed_budget.toLocaleString()}`}
                </Text>
                {round.message ? (
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
                    {round.message}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )
      )}
    </View>
  );
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, switchProfile, checkAuth } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["jobs", id] });
    await queryClient.invalidateQueries({ queryKey: ["jobs", id, "applied"] });
    setRefreshing(false);
  }, [queryClient, id]);

  // Debug logging
  if (__DEV__)
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
  const [showRejectApplicationModal, setShowRejectApplicationModal] =
    useState(false);
  const [rejectApplicationId, setRejectApplicationId] = useState<number | null>(
    null,
  );
  const [rejectApplicationTarget, setRejectApplicationTarget] = useState<
    "STANDARD" | "TEAM"
  >("STANDARD");
  const [rejectApplicationWorkerName, setRejectApplicationWorkerName] =
    useState("");
  const [rejectApplicationReason, setRejectApplicationReason] = useState("");
  const [agencyPickerVisible, setAgencyPickerVisible] = useState(false);
  const [agencySearchQuery, setAgencySearchQuery] = useState("");
  const [agencyPickerSlotId, setAgencyPickerSlotId] = useState<number | null>(
    null,
  );
  const submitReportMutation = useSubmitReport();

  // Application form state
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [budgetOption, setBudgetOption] = useState<"ACCEPT" | "NEGOTIATE">(
    "ACCEPT",
  );
  // Daily rate negotiation state (for DAILY payment_model jobs)
  const [proposedDailyRate, setProposedDailyRate] = useState("");
  const [proposedDays, setProposedDays] = useState("");
  // Shift selection state for worker applications.
  const [appliedShift, setAppliedShift] = useState<"ANY" | "MORNING" | "NIGHT" | null>(null);

  // Client counter-offer state
  const [counterModalApplicationId, setCounterModalApplicationId] = useState<number | null>(null);
  const [counterOfferMessage, setCounterOfferMessage] = useState("");
  const [counterOfferRate, setCounterOfferRate] = useState("");
  const [counterOfferDays, setCounterOfferDays] = useState("");
  const [counterOfferAmount, setCounterOfferAmount] = useState("");

  // Worker propose/re-propose state
  const [showWorkerProposeModal, setShowWorkerProposeModal] = useState(false);
  const [workerProposeAmount, setWorkerProposeAmount] = useState("");
  const [workerProposeDailyRate, setWorkerProposeDailyRate] = useState("");
  const [workerProposeDays, setWorkerProposeDays] = useState("");
  const [workerProposeMessage, setWorkerProposeMessage] = useState("");

  // Team Job state
  const [showTeamApplyModal, setShowTeamApplyModal] = useState(false);
  const [selectedSkillSlot, setSelectedSkillSlot] = useState<SkillSlot | null>(
    null,
  );
  const [showTeamCompletionModal, setShowTeamCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

  // One-time payment education modal for workers
  const { visible: showWorkerPaymentInfo, dismiss: dismissWorkerPaymentInfo } =
    useOneTimeModal("@iayos:hide_worker_payment_info");
  // Used to defer opening the application modal until after the info modal is dismissed
  const [pendingApply, setPendingApply] = useState(false);

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";

  const navigateToSkillsFromApply = useCallback(() => {
      // Close any active apply modal first so the skills screen is not layered behind it.
      setShowApplicationModal(false);
      setShowTeamApplyModal(false);
      requestAnimationFrame(() => {
        router.push("/profile/skills" as any);
      });
    }, [router]);

  // Validate job ID
  const jobId = id ? Number(id) : NaN;
  const isValidJobId =
    !isNaN(jobId) && jobId > 0 && id !== "create" && id !== "undefined";

  // Debug validation
  if (__DEV__)
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
      if (__DEV__)
        console.log("[JobDetail] Fetching job details for ID:", jobId);
      const response = await apiRequest(ENDPOINTS.JOB_DETAILS(jobId));

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const result = (await response.json()) as any;
      const jobData = result.data || result; // Handle both wrapped and unwrapped responses

      // Debug: Log team job data from API
      if (__DEV__)
        console.log("[JobDetail] Raw API response:", {
          is_team_job: jobData.is_team_job,
          skill_slots_count: jobData.skill_slots?.length || 0,
          total_workers_needed: jobData.total_workers_needed,
          total_workers_assigned: jobData.total_workers_assigned,
          payment_model: jobData.payment_model,
          daily_rate_agreed: jobData.daily_rate_agreed,
          budget: jobData.budget,
          duration_days: jobData.duration_days,
          assigned_agency: jobData.assigned_agency,
        });

      // Debug: Log agency data specifically
      if (__DEV__ && jobData.assigned_agency) {
        console.log("[JobDetail] Agency data found:", {
          id: jobData.assigned_agency.id,
          name: jobData.assigned_agency.name,
          workers_assigned: jobData.assigned_agency.workers_assigned,
        });
      }

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
        budget:
          jobData.budget != null
            ? `₱${Number(jobData.budget).toLocaleString()}`
            : "TBD",
        budgetRangeMin: jobData.budget_range_min ?? null,
        budgetRangeMax: jobData.budget_range_max ?? null,
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
        createdAt: jobData.created_at || null,
        urgency: jobData.urgency_level || "LOW",
        photos:
          jobData.photos?.map((url: string, idx: number) => ({
            id: idx,
            // Resolve relative URLs (e.g. /media/...) from local storage to absolute
            url: url?.startsWith("/") ? `${API_BASE_URL.replace(/\/api$/, "")}${url}` : url,
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
        assignedAgency: jobData.assigned_agency
          ? {
              id: jobData.assigned_agency.id,
              name: jobData.assigned_agency.name,
              logo: jobData.assigned_agency.logo || null,
              rating: jobData.assigned_agency.rating ?? 0,
              workers_assigned: jobData.assigned_agency.workers_assigned ?? 0,
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
        daily_rate:
          jobData.daily_rate_agreed ??
          (jobData.payment_model === "DAILY" &&
          jobData.budget &&
          jobData.duration_days
            ? jobData.budget / jobData.duration_days
            : undefined),
        duration_days: jobData.duration_days ?? null,
        shift_type: jobData.shift_type ?? "ANY",
        minimum_rate: typeof jobData.minimum_rate === "number" ? jobData.minimum_rate : null,
        // Team Job fields
        is_team_job: jobData.is_team_job || false,
        skill_slots: jobData.skill_slots || [],
        worker_assignments: jobData.worker_assignments || [],
        agency_employee_assignments:
          jobData.agency_employee_assignments || [],
        is_mixed_team: jobData.is_mixed_team || false,
        has_agency_invites: jobData.has_agency_invites || false,
        total_freelancers: jobData.total_freelancers || 0,
        total_agency_employees: jobData.total_agency_employees || 0,
        multi_slot_workers: jobData.multi_slot_workers || [],
        budget_allocation_type: jobData.budget_allocation_type,
        team_fill_percentage: jobData.team_fill_percentage,
        total_workers_needed: jobData.total_workers_needed,
        total_workers_assigned: jobData.total_workers_assigned,
        // Additional fields
        preferred_start_date: jobData.preferred_start_date,
        scheduled_end_date: jobData.scheduled_end_date,
        workerMarkedOnTheWay: Boolean(jobData.worker_marked_on_the_way),
        workerMarkedOnTheWayAt: jobData.worker_marked_on_the_way_at || null,
        workerMarkedJobStarted: Boolean(jobData.worker_marked_job_started),
        workerMarkedJobStartedAt: jobData.worker_marked_job_started_at || null,
        clientConfirmedWorkStarted: Boolean(
          jobData.client_confirmed_work_started,
        ),
        clientConfirmedWorkStartedAt:
          jobData.client_confirmed_work_started_at || null,
        cancelledAt: jobData.cancelled_at || null,
        cancelledByRole: jobData.cancelled_by_role || null,
        cancellationStage: jobData.cancellation_stage || null,
        cancellationReason: jobData.cancellation_reason || null,
        clientRefundAmount: Number(jobData.client_refund_amount || 0),
        workerCompensationAmount: Number(
          jobData.worker_compensation_amount || 0,
        ),
      } as JobDetail;
    },
    enabled: isValidJobId, // Only fetch if we have a valid job ID
  });

  // Check if already applied and track which skill slots
  const { data: applicationStatus } = useQuery<{
    hasApplied: boolean;
    hasAcceptedApplication: boolean;
    appliedSlotIds: number[];
    applicationId: number | null;
    negotiationCount: number;
    proposalsRemaining: number;
    budgetOption: string | null;
    hasPendingCounter: boolean;
    hasNegotiationCapReached: boolean;
  }>({
    queryKey: ["jobs", id, "applied"],
    queryFn: async (): Promise<{
      hasApplied: boolean;
      hasAcceptedApplication: boolean;
      appliedSlotIds: number[];
      applicationId: number | null;
      negotiationCount: number;
      proposalsRemaining: number;
      budgetOption: string | null;
      hasPendingCounter: boolean;
      hasNegotiationCapReached: boolean;
    }> => {
      const normalizeId = (value: unknown): number | null => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      };

      const resolveAppStatus = (app: any): string =>
        String(app?.status ?? app?.application_status ?? "")
          .trim()
          .toUpperCase();

      const resolveJobId = (app: any): number | null =>
        normalizeId(
          app?.job_id ??
            app?.jobId ??
            app?.job?.id ??
            app?.job?.job_id ??
            app?.job?.jobID,
        );

      const resolveSlotId = (app: any): number | null =>
        normalizeId(
          app?.applied_skill_slot_id ??
            app?.appliedSkillSlotId ??
            app?.skill_slot_id ??
            app?.skillSlotId ??
            app?.applied_skill_slot?.skill_slot_id ??
            app?.applied_skill_slot?.skillSlotID,
        );

      const response = await apiRequest(ENDPOINTS.MY_APPLICATIONS, {
        method: "GET",
      });

      if (!response.ok) {
        return {
          hasApplied: false,
          hasAcceptedApplication: false,
          appliedSlotIds: [],
          applicationId: null,
          negotiationCount: 0,
          proposalsRemaining: 0,
          budgetOption: null,
          hasPendingCounter: false,
          hasNegotiationCapReached: false,
        };
      }

      const data = (await response.json()) as any;
      const rawApplications =
        data?.applications || data?.data?.applications || [];

      if (Array.isArray(rawApplications)) {
        const currentJobId = normalizeId(id);
        const jobApplications = rawApplications.filter((app: any) => {
          if (currentJobId === null) return false;
          return resolveJobId(app) === currentJobId;
        });
        const activeJobApplications = jobApplications.filter((app: any) =>
          ["PENDING", "ACCEPTED"].includes(resolveAppStatus(app)),
        );
        const resolveTimestamp = (app: any): number => {
          const rawTimestamp =
            app?.created_at ??
            app?.createdAt ??
            app?.updated_at ??
            app?.updatedAt ??
            null;
          const parsed = rawTimestamp ? new Date(rawTimestamp).getTime() : 0;
          return Number.isFinite(parsed) ? parsed : 0;
        };
        const latestJobApplication =
          jobApplications.length > 0
            ? jobApplications.reduce((latest: any, current: any) =>
                resolveTimestamp(current) > resolveTimestamp(latest)
                  ? current
                  : latest,
              )
            : null;
        const latestStatus = latestJobApplication
          ? resolveAppStatus(latestJobApplication)
          : "";
        const latestNegotiationCount = Number(
          latestJobApplication?.negotiation_count ??
            latestJobApplication?.negotiationCount ??
            0,
        );
        const latestProposalsRemaining = Number(
          latestJobApplication?.proposals_remaining ??
            latestJobApplication?.proposalsRemaining ??
            Math.max(3 - latestNegotiationCount, 0),
        );
        const hasNegotiationCapReached =
          latestStatus === "REJECTED" &&
          (latestProposalsRemaining <= 0 || latestNegotiationCount >= 3);
        const hasApplied = activeJobApplications.length > 0;
        const hasAcceptedApplication = jobApplications.some(
          (app: any) => resolveAppStatus(app) === "ACCEPTED",
        );
        const appliedSlotIds = Array.from(
          new Set(
            activeJobApplications
              .map((app: any) => resolveSlotId(app))
              .filter((slotId): slotId is number => slotId !== null),
          ),
        );
        // Extract the first active application's details for negotiation navigation
        const firstActive = activeJobApplications[0];
        const applicationId = firstActive
          ? normalizeId(firstActive.application_id ?? firstActive.applicationId)
          : null;
        const negotiationCount = Number(firstActive?.negotiation_count ?? firstActive?.negotiationCount ?? 0);
        const proposalsRemaining = Number(firstActive?.proposals_remaining ?? firstActive?.proposalsRemaining ?? 0);
        const budgetOption = firstActive?.budget_option ?? firstActive?.budgetOption ?? null;
        const hasPendingCounter = !!firstActive?.has_pending_counter;
        return { hasApplied, hasAcceptedApplication, appliedSlotIds, applicationId, negotiationCount, proposalsRemaining, budgetOption, hasPendingCounter, hasNegotiationCapReached };
      }
      return {
        hasApplied: false,
        hasAcceptedApplication: false,
        appliedSlotIds: [],
        applicationId: null,
        negotiationCount: 0,
        proposalsRemaining: 0,
        budgetOption: null,
        hasPendingCounter: false,
        hasNegotiationCapReached: false,
      };
    },
    enabled: isWorker,
  });

  // Destructure for easier access
  const hasApplied = applicationStatus?.hasApplied ?? false;
  const hasAcceptedApplication =
    applicationStatus?.hasAcceptedApplication ?? false;
  const appliedSlotIds = applicationStatus?.appliedSlotIds ?? [];
  const myApplicationId = applicationStatus?.applicationId ?? null;
  const negotiationCount = applicationStatus?.negotiationCount ?? 0;
  const proposalsRemaining = applicationStatus?.proposalsRemaining ?? 0;
  const myBudgetOption = applicationStatus?.budgetOption ?? null;
  const hasPendingCounter = applicationStatus?.hasPendingCounter ?? false;
  const hasNegotiationCapReached =
    applicationStatus?.hasNegotiationCapReached ?? false;

  // Worker negotiation thread query
  type NegotiationThread = {
    thread: Array<{
      negotiation_id: number;
      actor: "WORKER" | "CLIENT";
      round_number: number;
      proposed_budget: number;
      proposed_daily_rate: number | null;
      proposed_days: number | null;
      message: string;
      status: string;
      created_at: string;
    }>;
    proposals_remaining: number;
  };

  const { data: workerNegotiationData, isLoading: workerNegotiationLoading } = useQuery<NegotiationThread>({
    queryKey: ["negotiation-thread", myApplicationId],
    queryFn: async (): Promise<NegotiationThread> => {
      const response = await apiRequest(
        ENDPOINTS.NEGOTIATION_THREAD(myApplicationId!)
      );
      if (!response.ok) throw new Error("Failed to fetch negotiation thread");
      return response.json() as Promise<NegotiationThread>;
    },
    enabled: isWorker && !!myApplicationId && negotiationCount > 0,
  });

  const workerThread = workerNegotiationData?.thread ?? [];
  const workerLastRound = workerThread.length > 0 ? workerThread[workerThread.length - 1] : null;
  const workerClientCountered = workerLastRound?.actor === "CLIENT" && workerLastRound?.status === "PENDING";
  const workerAwaitingResponse = workerLastRound?.actor === "WORKER" && workerLastRound?.status === "PENDING";
  const workerProposalsRemaining = workerNegotiationData?.proposals_remaining ?? proposalsRemaining;
  const workerProposalsExhausted = workerProposalsRemaining === 0 && negotiationCount > 0;
  const workerCanPropose = hasApplied && !workerAwaitingResponse && !workerClientCountered && !workerProposalsExhausted;

  // Worker accept counter mutation
  const workerAcceptCounterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        ENDPOINTS.NEGOTIATION_ACCEPT_COUNTER(myApplicationId!),
        { method: "POST", body: JSON.stringify({}) }
      );
      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error || "Failed to accept counter-offer");
      }
      return response.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "You have accepted the client's counter-offer!");
      queryClient.invalidateQueries({ queryKey: ["negotiation-thread", myApplicationId] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id, "applied"] });
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  // Worker propose mutation
  const workerProposeMutation = useMutation({
    mutationFn: async (payload: {
      proposed_budget?: number;
      proposed_daily_rate?: number;
      proposed_days?: number;
      message: string;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.NEGOTIATION_PROPOSE(myApplicationId!),
        { method: "POST", body: JSON.stringify(payload) }
      );
      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error || "Failed to submit proposal");
      }
      return response.json();
    },
    onSuccess: () => {
      setShowWorkerProposeModal(false);
      setWorkerProposeAmount("");
      setWorkerProposeDailyRate("");
      setWorkerProposeDays("");
      setWorkerProposeMessage("");
      Alert.alert("Success", "Your proposal has been submitted!");
      queryClient.invalidateQueries({ queryKey: ["negotiation-thread", myApplicationId] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id, "applied"] });
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const handleWorkerSubmitProposal = () => {
    if (!workerProposeMessage.trim()) {
      Alert.alert("Error", "Please enter a message with your proposal");
      return;
    }
    const isDaily = job?.payment_model === "DAILY";
    if (isDaily) {
      const rate = parseFloat(workerProposeDailyRate);
      const days = parseInt(workerProposeDays);
      if (!rate || rate <= 0) { Alert.alert("Error", "Please enter a valid daily rate"); return; }
      if (!days || days <= 0) { Alert.alert("Error", "Please enter a valid number of days"); return; }
      workerProposeMutation.mutate({ proposed_daily_rate: rate, proposed_days: days, proposed_budget: rate * days, message: workerProposeMessage.trim() });
    } else {
      const amount = parseFloat(workerProposeAmount);
      if (!amount || amount <= 0) { Alert.alert("Error", "Please enter a valid amount"); return; }
      workerProposeMutation.mutate({ proposed_budget: amount, message: workerProposeMessage.trim() });
    }
  };

  // Submit application mutation
  const submitApplication = useMutation({
    mutationFn: async (applicationData: {
      proposal_message: string;
      proposed_budget: number;
      estimated_duration: string | null;
      budget_option: "ACCEPT" | "NEGOTIATE";
      proposed_daily_rate?: number | null;
      proposed_days?: number | null;
      applied_shift?: string | null;
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
        "Application submitted successfully! You can view your application status in Jobs > Applied tab.",
      );
      setShowApplicationModal(false);
      setProposalMessage("");
      setProposedBudget("");
      setEstimatedDuration("");
      setBudgetOption("ACCEPT");
      setProposedDailyRate("");
      setProposedDays("");
      setAppliedShift(null);
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id, "applied"] });
      router.push({
        pathname: "/(tabs)/jobs",
        params: { tab: "applications" },
      } as any);
    },
    onError: (error: Error) => {
      if (/required skill/i.test(error.message)) {
        showMissingRequiredSkillAlert(error.message, "STANDARD");
        return;
      }
      Alert.alert("Error", error.message);
    },
  });

  const handleViewChat = async () => {
    const fetchConversationByJob = async () => {
      const response = await apiRequest(ENDPOINTS.CONVERSATION_BY_JOB(jobId));
      const data = (await response.json().catch(() => null)) as any;
      return { response, data };
    };

    const resolvePreferredProfile = (): "CLIENT" | "WORKER" | null => {
      if (!job || !user) return null;

      const userIdCandidates = new Set(
        [
          user.accountID,
          user.profile_data?.id,
          user.profile_data?.workerProfileId,
          (user.profile_data as any)?.profileID,
          (user.profile_data as any)?.workerID,
        ]
          .filter((v) => v !== null && v !== undefined && v !== "")
          .map((v) => String(v)),
      );

      if (
        job.postedBy?.id !== undefined &&
        userIdCandidates.has(String(job.postedBy.id))
      ) {
        return "CLIENT";
      }

      if (
        job.assignedWorker?.id !== undefined &&
        userIdCandidates.has(String(job.assignedWorker.id))
      ) {
        return "WORKER";
      }

      return null;
    };

    try {
      console.log("[VIEW CHAT] Button pressed for job:", jobId);
      console.log(
        "[VIEW CHAT] Calling endpoint:",
        ENDPOINTS.CONVERSATION_BY_JOB(jobId),
      );

      let { response, data } = await fetchConversationByJob();

      console.log(
        "[VIEW CHAT] Backend response:",
        JSON.stringify(data, null, 2),
      );
      console.log("[VIEW CHAT] Success:", data.success);
      console.log("[VIEW CHAT] Conversation ID:", data.conversation_id);

      if (response.ok && data?.success && data?.conversation_id) {
        const route = `/conversation/${data.conversation_id}`;
        console.log("[VIEW CHAT] Navigating to:", route);
        router.push(route as any);
        return;
      }

      if (response.status === 401) {
        const currentProfile = user?.profile_data?.profileType;
        const preferredProfile = resolvePreferredProfile();

        if (preferredProfile && currentProfile !== preferredProfile) {
          console.log(
            "[VIEW CHAT] 401 received. Switching profile from",
            currentProfile,
            "to",
            preferredProfile,
            "and retrying...",
          );

          await switchProfile(preferredProfile);
          ({ response, data } = await fetchConversationByJob());

          if (response.ok && data?.success && data?.conversation_id) {
            const route = `/conversation/${data.conversation_id}`;
            console.log("[VIEW CHAT] Navigating to after retry:", route);
            router.push(route as any);
            return;
          }
        } else {
          // Refresh auth state in case cached session/token drifted.
          await checkAuth();
        }

        Alert.alert(
          "Session Required",
          "Please make sure you are signed in with the correct profile, then try opening chat again.",
        );
        return;
      }

      if (!response.ok) {
        const message =
          data?.detail || data?.error || `Request failed (HTTP ${response.status})`;
        Alert.alert("Chat Unavailable", String(message));
        return;
      }

      {
        console.log("[VIEW CHAT] No conversation found - showing alert");
        Alert.alert(
          "No Conversation",
          "Could not find a chat for this job yet. Please try again in a moment.",
        );
      }
    } catch (error) {
      console.error("[VIEW CHAT] Error fetching conversation:", error);
      Alert.alert(
        "Connection Error",
        `Failed to connect to chat.\n\nError: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  // Cancel job mutation (for clients only)
  const cancelJobMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequest(ENDPOINTS.CANCEL_JOB(parseInt(id)), {
        method: "PATCH",
        body: JSON.stringify({
          reason,
          actor_notes: "",
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(errorData.error || "Failed to cancel job");
      }

      return response;
    },
    onSuccess: () => {
      Alert.alert("Cancelled", "Job has been cancelled successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("/"),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", `Failed to cancel job: ${error.message}`);
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
    error: applicationsError,
    refetch: refetchApplications,
  } = useQuery<{ applications: JobApplication[]; total: number }>({
    queryKey: ["job-applications", id],
    queryFn: async (): Promise<{
      applications: JobApplication[];
      total: number;
    }> => {
      if (!isClient || !isValidJobId) {
        return { applications: [], total: 0 };
      }
      const response = await apiRequest(
        ENDPOINTS.JOB_APPLICATIONS(parseInt(id)),
      );

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = (await response.json()) as any;
      // Handle potential nested data structure e.g. { success: true, applications: [] }
      const apps =
        data.applications || (data.data && data.data.applications) || [];
      const totalCount = data.total ?? data.count ?? apps.length;
      return { applications: apps, total: totalCount };
    },
    enabled: isClient && isValidJobId && !!job && job.jobType === "LISTING",
  });

  const applications = applicationsData?.applications || [];
  const showApplicationsSection =
    isClient &&
    job?.jobType === "LISTING" &&
    !job?.assignedWorker &&
    job?.is_team_job !== true;
  const showAgencySuggestionSection =
    isClient && job?.jobType === "INVITE" && !!job?.assignedAgency;

  // Accept application mutation
  const acceptApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest(
        ENDPOINTS.ACCEPT_APPLICATION(parseInt(id), applicationId),
        {
          method: "POST",
        },
      );
      const data = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(
          String(data?.error || data?.detail || "Failed to accept application"),
        );
      }
      return data;
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
    mutationFn: async ({ applicationId, reason }: { applicationId: number; reason: string }) => {
      const response = await apiRequest(
        ENDPOINTS.REJECT_APPLICATION(parseInt(id), applicationId),
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        },
      );
      const data = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to reject application"));
      }
      return data;
    },
    onSuccess: () => {
      Alert.alert(
        "Application Rejected",
        "The worker was notified with your reason and remaining proposal attempts.",
      );
      setShowRejectApplicationModal(false);
      setRejectApplicationId(null);
      setRejectApplicationWorkerName("");
      setRejectApplicationReason("");
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
      countdownSeconds: 3,
      onConfirm: () => acceptApplicationMutation.mutate(applicationId),
      icon: "checkmark-circle",
      iconColor: Colors.success,
    });
  };

  const handleRejectApplication = (
    applicationId: number,
    workerName: string,
  ) => {
    setRejectApplicationTarget("STANDARD");
    setRejectApplicationId(applicationId);
    setRejectApplicationWorkerName(workerName);
    setRejectApplicationReason("");
    setShowRejectApplicationModal(true);
  };

  const handleSubmitRejectApplication = () => {
    if (!rejectApplicationId) return;
    if (!rejectApplicationReason.trim()) {
      Alert.alert("Reason Required", "Please provide a rejection reason.");
      return;
    }
    if (rejectApplicationTarget === "TEAM") {
      rejectTeamApplication.mutate(
        {
          jobId: parseInt(id),
          applicationId: rejectApplicationId,
          reason: rejectApplicationReason.trim(),
        },
        {
          onSuccess: () => {
            setShowRejectApplicationModal(false);
            setRejectApplicationId(null);
            setRejectApplicationWorkerName("");
            setRejectApplicationReason("");
            setRejectApplicationTarget("STANDARD");
          },
        },
      );
      return;
    }

    rejectApplicationMutation.mutate({
      applicationId: rejectApplicationId,
      reason: rejectApplicationReason.trim(),
    });
  };

  // Client counter-offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async ({
      applicationId,
      message,
      proposed_budget,
      proposed_daily_rate,
      proposed_days,
    }: {
      applicationId: number;
      message: string;
      proposed_budget?: number;
      proposed_daily_rate?: number;
      proposed_days?: number;
    }) => {
      const body: Record<string, unknown> = { message };
      if (proposed_budget !== undefined) body.proposed_budget = proposed_budget;
      if (proposed_daily_rate !== undefined) body.proposed_daily_rate = proposed_daily_rate;
      if (proposed_days !== undefined) body.proposed_days = proposed_days;
      const response = await apiRequest(
        ENDPOINTS.NEGOTIATION_COUNTER(applicationId),
        { method: "POST", body: JSON.stringify(body) },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(String((data as any)?.error || (data as any)?.detail || "Failed to send counter-offer"));
      }
      return data;
    },
    onSuccess: () => {
      Alert.alert("Counter-offer sent", "The worker has been notified of your counter-offer.");
      setCounterModalApplicationId(null);
      setCounterOfferMessage("");
      setCounterOfferRate("");
      setCounterOfferDays("");
      setCounterOfferAmount("");
      queryClient.invalidateQueries({ queryKey: ["job-applications", id] });
      queryClient.invalidateQueries({ queryKey: ["team-job-applications", parseInt(id)] });
      queryClient.invalidateQueries({ queryKey: ["team-job", parseInt(id)] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Client reject-price mutation (reject price, not applicant)
  const rejectPriceMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest(
        ENDPOINTS.NEGOTIATION_REJECT_PRICE(applicationId),
        { method: "POST", body: JSON.stringify({ message: "Price rejected by client." }) },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(String((data as any)?.error || (data as any)?.detail || "Failed to reject price"));
      }
      return data;
    },
    onSuccess: () => {
      Alert.alert("Price rejected", "The worker has been notified. They may re-negotiate or withdraw.");
      queryClient.invalidateQueries({ queryKey: ["job-applications", id] });
      queryClient.invalidateQueries({ queryKey: ["team-job-applications", parseInt(id)] });
      queryClient.invalidateQueries({ queryKey: ["team-job", parseInt(id)] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleCounterOffer = (application: JobApplication) => {
    setCounterModalApplicationId(application.id);
    // Pre-fill with worker's current proposed values
    if (job?.payment_model === "DAILY") {
      setCounterOfferRate(application.proposed_daily_rate ? String(application.proposed_daily_rate) : "");
      setCounterOfferDays(application.proposed_days ? String(application.proposed_days) : "");
      setCounterOfferAmount("");
    } else {
      setCounterOfferAmount(application.proposed_budget ? String(application.proposed_budget) : "");
      setCounterOfferRate("");
      setCounterOfferDays("");
    }
    setCounterOfferMessage("");
  };

  const handleCounterOfferForTeam = (application: any) => {
    setCounterModalApplicationId(application.application_id);
    if (job?.payment_model === "DAILY") {
      setCounterOfferRate(
        application.proposed_daily_rate
          ? String(application.proposed_daily_rate)
          : "",
      );
      setCounterOfferDays(
        application.proposed_days ? String(application.proposed_days) : "",
      );
      setCounterOfferAmount("");
    } else {
      setCounterOfferAmount(
        application.proposed_budget ? String(application.proposed_budget) : "",
      );
      setCounterOfferRate("");
      setCounterOfferDays("");
    }
    setCounterOfferMessage("");
  };

  const handleSubmitCounterOffer = () => {
    if (!counterModalApplicationId) return;
    const msg = counterOfferMessage.trim();
    if (!msg) {
      Alert.alert("Message required", "Please enter a message for your counter-offer.");
      return;
    }
    if (job?.payment_model === "DAILY") {
      const rate = parseFloat(counterOfferRate);
      const days = parseInt(counterOfferDays, 10);
      if (!rate || !days) {
        Alert.alert("Missing fields", "Enter both daily rate and number of days.");
        return;
      }
      counterOfferMutation.mutate({
        applicationId: counterModalApplicationId,
        message: msg,
        proposed_daily_rate: rate,
        proposed_days: days,
      });
    } else {
      const amount = parseFloat(counterOfferAmount);
      if (!amount) {
        Alert.alert("Missing fields", "Enter a proposed budget amount.");
        return;
      }
      counterOfferMutation.mutate({
        applicationId: counterModalApplicationId,
        message: msg,
        proposed_budget: amount,
      });
    }
  };

  const handleRejectPrice = (applicationId: number, workerName: string) => {
    setCountdownConfig({
      visible: true,
      title: "Reject Price",
      message: `Reject ${workerName}'s proposed price? The worker can still re-negotiate or withdraw.`,
      confirmLabel: "Reject Price",
      confirmStyle: "destructive",
      countdownSeconds: 3,
      onConfirm: () => rejectPriceMutation.mutate(applicationId),
      icon: "pricetag-outline",
      iconColor: Colors.warning,
    });
  };

  const handleCancelJob = () => {
    if (job?.status === "COMPLETED" || job?.status === "CANCELLED") {
      Alert.alert(
        "Cannot Cancel",
        "Completed or cancelled jobs can no longer be cancelled.",
      );
      return;
    }

    const chooseCancellationReason = (onSelect: (reason: string) => void) => {
      Alert.alert("Select Cancellation Reason", "A reason is required to cancel this job.", [
        {
          text: "No Longer Needed",
          onPress: () => onSelect("Client no longer needs the service"),
        },
        {
          text: "Budget Constraints",
          onPress: () => onSelect("Client cancelled due to budget constraints"),
        },
        {
          text: "Scheduling Conflict",
          onPress: () => onSelect("Client cancelled due to scheduling conflict"),
        },
        { text: "Back", style: "cancel" },
      ]);
    };

    chooseCancellationReason((reason: string) => {
      setCountdownConfig({
        visible: true,
        title: "Cancel Job",
        message:
          "Cancelling this job may incur losses. If work has already started, worker compensation may be deducted from your refund. Do you want to continue?",
        confirmLabel: "Cancel Job",
        confirmStyle: "destructive",
        countdownSeconds: 3,
        onConfirm: () => cancelJobMutation.mutate(reason),
        icon: "close-circle",
        iconColor: Colors.error,
      });
    });
  };

  const handleApply = () => {
    if (!job) return;

    if (isTeamJob || job.is_team_job) {
      Alert.alert(
        "Team Job",
        "Please apply through a specific skill slot for this team job.",
      );
      return;
    }

    setProposedBudget(job.budget.replace(/[^0-9.]/g, ""));
    setBudgetOption("ACCEPT");
    setProposalMessage("");
    setEstimatedDuration("");
    // Pre-populate daily rate fields for DAILY payment model jobs
    if (job?.payment_model === "DAILY") {
      setProposedDailyRate(job?.daily_rate_agreed?.toString() || "");
      setProposedDays(job?.duration_days?.toString() || "");
    } else {
      setProposedDailyRate("");
      setProposedDays("");
    }

    // Preselect shift to keep Apply UX consistent with team applications.
    if (job?.shift_type && job.shift_type !== "ANY") {
      setAppliedShift(job.shift_type as "MORNING" | "NIGHT");
    } else {
      setAppliedShift(null);
    }

    // Show payment education modal first (only the very first time)
    if (showWorkerPaymentInfo) {
      setPendingApply(true);
      return;
    }
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = () => {
    if (isTeamJob || job?.is_team_job) {
      Alert.alert(
        "Invalid Submission",
        "Team jobs require selecting a skill slot before applying.",
      );
      return;
    }

    if (!proposalMessage.trim()) {
      Alert.alert("Error", "Please provide a proposal message");
      return;
    }

    const isDailyJob = job?.payment_model === "DAILY";

    if (hasNegotiationCapReached && budgetOption === "NEGOTIATE") {
      Alert.alert(
        "Proposal Limit Reached",
        "You have already used all 3 proposals for this job. Re-apply by accepting the listed budget.",
      );
      setBudgetOption("ACCEPT");
      return;
    }

    // Validate shift selection when job is open to any shift.
    if ((!job?.shift_type || job.shift_type === "ANY") && !appliedShift) {
      Alert.alert("Error", "Please select a shift (Day Shift or Night Shift)");
      return;
    }

    if (isDailyJob && budgetOption === "NEGOTIATE") {
      const dailyRate = parseFloat(proposedDailyRate);
      const days = parseInt(proposedDays);
      if (!dailyRate || dailyRate <= 0) {
        Alert.alert("Error", "Please enter a valid daily rate");
        return;
      }
      if (job?.minimum_rate && dailyRate < job.minimum_rate) {
        Alert.alert(
          "Daily Rate Too Low",
          `The minimum daily rate for this job category is ₱${job.minimum_rate.toFixed(2)}. Please enter a higher amount.`,
        );
        return;
      }
      if (!days || days <= 0) {
        Alert.alert("Error", "Please enter a valid number of days");
        return;
      }
    } else if (
      budgetOption === "NEGOTIATE" &&
      (!proposedBudget || parseFloat(proposedBudget) <= 0)
    ) {
      Alert.alert("Error", "Please enter a valid budget amount");
      return;
    }

    let budgetValue: number;
    let dailyRateValue: number | null = null;
    let daysValue: number | null = null;

    if (isDailyJob && budgetOption === "NEGOTIATE") {
      dailyRateValue = parseFloat(proposedDailyRate);
      daysValue = parseInt(proposedDays);
      budgetValue = dailyRateValue * daysValue;
    } else {
      budgetValue =
        budgetOption === "ACCEPT"
          ? parseFloat(job?.budget.replace(/[^0-9.]/g, "") || "0")
          : parseFloat(proposedBudget);
    }

    submitApplication.mutate({
      proposal_message: proposalMessage,
      proposed_budget: budgetValue,
      estimated_duration: estimatedDuration || null,
      budget_option: budgetOption,
      proposed_daily_rate: dailyRateValue,
      proposed_days: daysValue,
      applied_shift:
        (job?.shift_type && job.shift_type !== "ANY"
          ? job.shift_type
          : appliedShift) || null,
    });
  };

  const showMissingRequiredSkillAlert = useCallback(
    (errorMessage: string, _source: "STANDARD" | "TEAM" = "STANDARD") => {
      Alert.alert("Required Skill Missing", errorMessage, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add a Skill",
          onPress: () => navigateToSkillsFromApply(),
        },
      ]);
    },
    [navigateToSkillsFromApply],
  );

  const handleAcceptInvite = () => {
    setCountdownConfig({
      visible: true,
      title: "Accept Job Invitation",
      message:
        "Are you sure you want to accept this job invitation? Once accepted, you'll be expected to complete the work.",
      confirmLabel: "Accept",
      confirmStyle: "default",
      countdownSeconds: 3,
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
  if (__DEV__)
    console.log("[JobDetail] Team Job State:", {
      isTeamJob,
      job_is_team_job: job?.is_team_job,
      skill_slots_count: job?.skill_slots?.length || 0,
      total_workers_needed: job?.total_workers_needed,
      total_workers_assigned: job?.total_workers_assigned,
    });

  // Compute accurate team counts from slot status (handles agency assignment where backend totals may lag)
  const computedWorkersNeeded =
    isTeamJob && job?.skill_slots?.length
      ? job.skill_slots.reduce(
          (sum, slot) => sum + (slot.workers_needed || 0),
          0,
        )
      : job?.total_workers_needed || 0;
  const computedWorkersAssigned =
    isTeamJob && job?.skill_slots?.length
      ? job.skill_slots.reduce(
          (sum, slot) =>
            sum +
            (slot.status === "FILLED"
              ? slot.workers_needed
              : slot.workers_assigned || 0),
          0,
        )
      : job?.total_workers_assigned || 0;
  const computedFillPercentage =
    computedWorkersNeeded > 0
      ? (computedWorkersAssigned / computedWorkersNeeded) * 100
      : job?.team_fill_percentage || 0;
  const isTeamFilled = computedFillPercentage >= 100;
  const isAgencyInviteTeamJob =
    isTeamJob &&
    (job?.has_agency_invites ||
      (job?.jobType === "INVITE" && !!job?.assignedAgency));
  const isMixedTeam = isTeamJob && (job?.is_mixed_team || false);

  // Team job apply mutation
  const applyToSkillSlot = useApplyToSkillSlot();

  // Fetch worker's skills for skill mismatch warning
  const { data: mySkills = [] } = useMySkills();

  // Invalidate skills cache when screen gains focus (e.g., after adding a skill)
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["my-skills"] });
    }, [queryClient]),
  );

  // Team job applications (for clients)
  const { data: teamApplicationsData } = useTeamJobApplications(
    parseInt(id),
    isClient && isTeamJob,
  );

  // Accept/reject team applications
  const acceptTeamApplication = useAcceptTeamApplication();
  const rejectTeamApplication = useRejectTeamApplication();
  const inviteAgencyToSlot = useInviteAgencyToTeamSlot();

  // Reuse the same inline agency picker pattern used in team job creation flow.
  const { data: agenciesData, isLoading: agenciesLoading } = useAgencies({
    sortBy: "rating",
    limit: 50,
  });

  const filteredAgencies = useMemo(() => {
    const agencies = agenciesData?.agencies || [];
    const search = agencySearchQuery.trim().toLowerCase();
    if (!search) return agencies;
    return agencies.filter(
      (agency: Agency) =>
        agency.name.toLowerCase().includes(search) ||
        (agency.specializations || []).some((skill) =>
          skill.toLowerCase().includes(search),
        ),
    );
  }, [agenciesData, agencySearchQuery]);

  // Agency employee team job actions
  const confirmEmployeeArrival = useConfirmTeamEmployeeArrival();
  const markEmployeeComplete = useMarkTeamEmployeeComplete();

  // Check if current worker is assigned to this team job (may have multiple assignments for multi-slot)
  const currentWorkerAssignments = (job?.worker_assignments || []).filter(
    (assignment) => assignment.worker_id === user?.profile_data?.id,
  );
  // Keep a single reference for backward-compat checks (first assignment)
  const currentWorkerAssignment = currentWorkerAssignments.length > 0 ? currentWorkerAssignments[0] : undefined;
  // Set of slot IDs the current worker is assigned to
  const assignedSlotIds = new Set(currentWorkerAssignments.map((a) => a.skill_slot_id));

  // Detect worker assignment across possible ID shapes returned by APIs
  const currentUserIdCandidates = new Set(
    [
      user?.accountID,
      user?.profile_data?.id,
      user?.profile_data?.workerProfileId,
      (user?.profile_data as any)?.profileID,
      (user?.profile_data as any)?.workerID,
    ]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(value)),
  );

  const assignedWorkerId = String(job?.assignedWorker?.id ?? "");
  const isCurrentWorkerAssigned =
    (assignedWorkerId !== "" && currentUserIdCandidates.has(assignedWorkerId)) ||
    !!currentWorkerAssignment;

  const canWorkerViewFullAddress =
      isWorker &&
      (hasAcceptedApplication ||
        job?.inviteStatus === "ACCEPTED" ||
        isCurrentWorkerAssigned ||
        job?.status === "IN_PROGRESS" ||
        job?.status === "COMPLETED" ||
        (job?.status === "CANCELLED" &&
          (hasAcceptedApplication || isCurrentWorkerAssigned)));

  const locationDisplayText = isWorker
    ? canWorkerViewFullAddress
      ? getStreetAndBarangayFromLocation(job?.location)
      : getBarangayFromLocation(job?.location)
    : job?.distance != null && job.distance > 0
      ? `${job.distance.toFixed(1)} km away`
      : String(job?.location || "Location not specified");

  const canAccessTeamGroupChat =
    isTeamJob && isTeamFilled && (isClient || !!currentWorkerAssignment);

  const handleCallClient = useCallback(async () => {
    const rawPhone = String(job?.postedBy?.phone || "").trim();
    if (!rawPhone) {
      Alert.alert("Contact unavailable", "Client contact number is not available.");
      return;
    }

    const normalizedPhone = rawPhone.replace(/[^\d+]/g, "");
    const callUrl = `tel:${normalizedPhone || rawPhone}`;

    try {
      const canOpen = await Linking.canOpenURL(callUrl);
      if (!canOpen) {
        Alert.alert("Cannot place call", "Your device cannot place this call right now.");
        return;
      }
      await Linking.openURL(callUrl);
    } catch {
      Alert.alert("Call failed", "Unable to start the call. Please try again.");
    }
  }, [job?.postedBy?.phone]);

  // Team job applications list for client view
  const teamApplications = (teamApplicationsData as any)?.applications || [];
  const teamSlotsWithOpenings = (job?.skill_slots || []).filter(
    (slot) =>
      (slot.openings_remaining || 0) > 0 &&
      !slot.agency_invite,
  );

  // Normalize slot id across API payload variants.
  const resolveApplicationSlotId = (app: any): number | null => {
    const slotId = Number(
      app?.applied_skill_slot_id ??
        app?.skill_slot_id ??
        app?.appliedSkillSlotId ??
        app?.skillSlotId ??
        app?.applied_skill_slot?.skill_slot_id ??
        app?.applied_skill_slot?.skillSlotID,
    );
    return Number.isFinite(slotId) && slotId > 0 ? slotId : null;
  };

  const getWorkerSlotKey = (app: any): string | null => {
    const workerId = Number(app?.worker_id);
    const slotId = resolveApplicationSlotId(app);
    if (!Number.isFinite(workerId) || workerId <= 0 || slotId === null) {
      return null;
    }
    return `${workerId}:${slotId}`;
  };

  // Track (worker_id, skill_slot_id) pairs that are already accepted on this job.
  // A worker CAN be accepted on a DIFFERENT slot (multi-slot), so we gate per pair,
  // not per worker. The key is `${worker_id}:${skill_slot_id}`.
  const acceptedWorkerSlotKeys = new Set(
    teamApplications
      .filter((a: any) => a.status === "ACCEPTED")
      .map((a: any) => getWorkerSlotKey(a))
      .filter((key: string | null): key is string => key !== null),
  );

  const handleTeamSlotApply = (slot: SkillSlot) => {
    if (!isWorker) {
      Alert.alert("Error", "Only workers can apply to team jobs");
      return;
    }

    // Check if worker has the required skill
    const hasRequiredSkill = mySkills.some((skill: any) => {
      const skillSpecId =
        skill?.specializationId ?? skill?.specializationID ?? skill?.id;
      return Number(skillSpecId) === Number(slot.specialization_id);
    });

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
            text: "Add a Skill",
            onPress: () => navigateToSkillsFromApply(),
          },
          {
            text: "Continue Anyway",
            onPress: () => {
              setSelectedSkillSlot(slot);
              setProposedBudget(slot.budget_per_worker.toString());
              setBudgetOption("ACCEPT");
              setProposalMessage("");
              setEstimatedDuration("");
              if (job?.payment_model === "DAILY") {
                setProposedDailyRate(job?.daily_rate_agreed?.toString() || "");
                setProposedDays(job?.duration_days?.toString() || "");
              } else {
                setProposedDailyRate("");
                setProposedDays("");
              }
              if (job?.shift_type && job.shift_type !== "ANY") {
                setAppliedShift(job.shift_type as "MORNING" | "NIGHT");
              } else {
                setAppliedShift(null);
              }
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
    // Pre-populate daily rate fields for DAILY payment model jobs
    if (job?.payment_model === "DAILY") {
      setProposedDailyRate(job?.daily_rate_agreed?.toString() || "");
      setProposedDays(job?.duration_days?.toString() || "");
    } else {
      setProposedDailyRate("");
      setProposedDays("");
    }
    // Reset shift selection; auto-set if job has a fixed shift
    if (job?.shift_type && job.shift_type !== "ANY") {
      setAppliedShift(job.shift_type as "MORNING" | "NIGHT");
    } else {
      setAppliedShift(null);
    }
    setShowTeamApplyModal(true);
  };

  const openAgencyPickerForSlot = (slotId: number) => {
    setAgencyPickerSlotId(slotId);
    setAgencySearchQuery("");
    setAgencyPickerVisible(true);
  };

  const handleSelectAgencyForSlot = (agency: Agency) => {
    if (!agencyPickerSlotId) return;
    inviteAgencyToSlot.mutate({
      jobId: parseInt(id),
      slotId: agencyPickerSlotId,
      agencyId: agency.id,
    });
    setAgencyPickerVisible(false);
    setAgencyPickerSlotId(null);
  };

  const handleSubmitTeamApplication = () => {
    if (!selectedSkillSlot) return;

    if (!proposalMessage.trim()) {
      Alert.alert("Error", "Please provide a proposal message");
      return;
    }

    const isDailyJob = job?.payment_model === "DAILY";

    if (hasNegotiationCapReached && budgetOption === "NEGOTIATE") {
      Alert.alert(
        "Proposal Limit Reached",
        "You have already used all 3 proposals for this job. Re-apply by accepting the listed budget.",
      );
      setBudgetOption("ACCEPT");
      return;
    }

    // Validate shift selection for ANY-shift team jobs.
    if ((!job?.shift_type || job.shift_type === "ANY") && !appliedShift) {
      Alert.alert("Error", "Please select a shift (Day Shift or Night Shift)");
      return;
    }

    // For DAILY jobs with NEGOTIATE, use daily rate * days as the proposed budget
    let budgetValue: number;
    if (isDailyJob && budgetOption === "NEGOTIATE") {
      const dailyRate = parseFloat(proposedDailyRate);
      const days = parseInt(proposedDays);
      if (!dailyRate || dailyRate <= 0) {
        Alert.alert("Error", "Please enter a valid daily rate");
        return;
      }
      if (job?.minimum_rate && dailyRate < job.minimum_rate) {
        Alert.alert(
          "Daily Rate Too Low",
          `The minimum daily rate for this job category is ₱${job.minimum_rate.toFixed(2)}. Please enter a higher amount.`,
        );
        return;
      }
      if (!days || days <= 0) {
        Alert.alert("Error", "Please enter a valid number of days");
        return;
      }
      budgetValue = dailyRate * days;
    } else {
      budgetValue =
        budgetOption === "ACCEPT"
          ? selectedSkillSlot.budget_per_worker
          : parseFloat(proposedBudget);
    }

    applyToSkillSlot.mutate(
      {
        jobId: parseInt(id),
        skillSlotId: selectedSkillSlot.skill_slot_id,
        proposalMessage: proposalMessage,
        proposedBudget: budgetValue,
        budgetOption: budgetOption,
        estimatedDuration: estimatedDuration || undefined,
        proposedDailyRate: isDailyJob && budgetOption === "NEGOTIATE" ? parseFloat(proposedDailyRate) : undefined,
        proposedDays: isDailyJob && budgetOption === "NEGOTIATE" ? parseInt(proposedDays) : undefined,
        appliedShift:
          (job?.shift_type && job.shift_type !== "ANY"
            ? (job.shift_type as "MORNING" | "NIGHT")
            : appliedShift) ?? undefined,
      },
      {
        onSuccess: () => {
          setShowTeamApplyModal(false);
          setSelectedSkillSlot(null);
          setProposalMessage("");
          setProposedBudget("");
          setEstimatedDuration("");
          setProposedDailyRate("");
          setProposedDays("");
          setAppliedShift(null);
        },
        onError: (error: Error) => {
          if (/required skill/i.test(error.message)) {
            showMissingRequiredSkillAlert(error.message, "TEAM");
            return;
          }
          if (/reserved for an invited agency|SLOT_RESERVED_FOR_AGENCY/i.test(error.message)) {
            Alert.alert(
              "Slot Reserved for Agency",
              "This slot is reserved for agency assignment and is not open for worker applications.",
            );
            return;
          }
          Alert.alert("Application Failed", error.message);
        },
      },
    );
  };

  const handleAcceptTeamApplication = (
    applicationId: number,
    workerName: string,
  ) => {
    setCountdownConfig({
      visible: true,
      title: "Accept Team Application",
      message: `Assign ${workerName} to this team job slot? They can still be accepted for other slots on this same team job.`,
      confirmLabel: "Accept",
      confirmStyle: "default",
      countdownSeconds: 3,
      onConfirm: () =>
        acceptTeamApplication.mutate({
          jobId: parseInt(id),
          applicationId,
        }),
      icon: "checkmark-circle",
      iconColor: Colors.success,
    });
  };

  const handleRejectTeamApplication = (
    applicationId: number,
    workerName: string,
  ) => {
    setRejectApplicationTarget("TEAM");
    setRejectApplicationId(applicationId);
    setRejectApplicationWorkerName(workerName);
    setRejectApplicationReason("");
    setShowRejectApplicationModal(true);
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => safeGoBack(router, "/(tabs)/jobs")}
            style={styles.backIconButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter} pointerEvents="none">
            <Text style={styles.headerTitle}>Job Details</Text>
          </View>
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
      <SafeAreaView style={styles.container} edges={["top"]}>
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
      <SafeAreaView style={styles.container} edges={["top"]}>
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

  const isDailyPayment = job.payment_model === "DAILY";
  const dailyDuration = Number(job.duration_days || 0);
  const dailyStartDate = job.preferred_start_date
    ? new Date(job.preferred_start_date)
    : null;
  const durationDays = Math.max(dailyDuration, isDailyPayment ? 1 : 0);
  const shiftLabel =
    job.shift_type === "MORNING"
      ? "Day Shift"
      : job.shift_type === "NIGHT"
        ? "Night Shift"
        : "Anytime";
  const startDateLabel = job.preferred_start_date
    ? new Date(job.preferred_start_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;
  const durationLabel = durationDays > 0 ? `${durationDays} Day${durationDays === 1 ? "" : "s"}` : null;
  const postedTimeAgo = formatRelativePostedTime(job.createdAt || job.postedAt);
  const todayDate = new Date();
  const dayProgress =
    job.payment_model === "DAILY" && dailyStartDate && durationDays > 0
      ? Math.min(
          Math.max(
            Math.floor(
              (new Date(
                todayDate.getFullYear(),
                todayDate.getMonth(),
                todayDate.getDate(),
              ).getTime() -
                new Date(
                  dailyStartDate.getFullYear(),
                  dailyStartDate.getMonth(),
                  dailyStartDate.getDate(),
                ).getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1,
            1,
          ),
          durationDays,
        )
      : null;
  const hasLifecycleEvents = Boolean(job.clientConfirmedWorkStarted);

  const formatReviewDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
  };

  const formatCancellationStage = (stage?: string | null) => {
    if (!stage) return "Cancelled";
    return stage
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
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

  const submitJobReport = (
    type: "job" | "user",
    reason:
      | "spam"
      | "harassment"
      | "fraud"
      | "inappropriate"
      | "fake_profile"
      | "other",
  ) => {
    const isUserReport = type === "user";
    const reportedUserId = isUserReport ? job.postedBy?.id : undefined;

    submitReportMutation.mutate(
      {
        report_type: type,
        reason,
        reported_user_id: reportedUserId,
        related_content_id: Number(job.id),
        description: isUserReport
          ? `Reported user from job ${job.id}: ${job.title}. Reason: ${reason}`
          : `Reported job ${job.id}: ${job.title}. Reason: ${reason}`,
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Report Submitted",
            "Thank you. Your report has been submitted for admin review.",
          );
        },
        onError: (error) => {
          Alert.alert(
            "Report Failed",
            error instanceof Error ? error.message : "Failed to submit report",
          );
        },
      },
    );
  };

  const openJobReportMenu = () => {
    const reportUserAvailable =
      !!job.postedBy?.id && job.postedBy.id !== user?.accountID;

    const openReasonMenu = (type: "job" | "user") => {
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [
              "Cancel",
              "Spam",
              "Harassment",
              "Fraud/Scam",
              "Inappropriate",
              "Fake Profile",
            ],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 1,
            title: type === "job" ? "Report Job" : "Report User",
          },
          (index) => {
            if (index === 1) submitJobReport(type, "spam");
            if (index === 2) submitJobReport(type, "harassment");
            if (index === 3) submitJobReport(type, "fraud");
            if (index === 4) submitJobReport(type, "inappropriate");
            if (index === 5) submitJobReport(type, "fake_profile");
          },
        );
        return;
      }

      Alert.alert(
        type === "job" ? "Report Job" : "Report User",
        "Select a reason",
        [
          { text: "Spam", onPress: () => submitJobReport(type, "spam") },
          {
            text: "Harassment",
            onPress: () => submitJobReport(type, "harassment"),
          },
          { text: "Fraud/Scam", onPress: () => submitJobReport(type, "fraud") },
          {
            text: "Inappropriate",
            onPress: () => submitJobReport(type, "inappropriate"),
          },
          {
            text: "Fake Profile",
            onPress: () => submitJobReport(type, "fake_profile"),
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
    };

    if (Platform.OS === "ios") {
      const options = [
        "Cancel",
        "Report Job",
        ...(reportUserAvailable ? ["Report User"] : []),
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
          title: "Report",
        },
        (index) => {
          if (index === 1) openReasonMenu("job");
          if (index === 2 && reportUserAvailable) openReasonMenu("user");
        },
      );
      return;
    }

    Alert.alert("Report", "Choose what to report", [
      { text: "Report Job", onPress: () => openReasonMenu("job") },
      ...(reportUserAvailable
        ? [{ text: "Report User", onPress: () => openReasonMenu("user") }]
        : []),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeGoBack(router, "/(tabs)/jobs")}
          style={styles.backIconButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle}>Job Details</Text>
          <Text style={styles.headerSubtitle}>Posted {postedTimeAgo}</Text>
        </View>
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
          {isWorker && (
            <SaveButton
              jobId={parseInt(id)}
              isSaved={isSaved}
              size={24}
              onToggle={setIsSaved}
            />
          )}
          {user?.accountID !== job.postedBy?.id && (
            <TouchableOpacity
              onPress={openJobReportMenu}
              style={styles.deleteButton}
              disabled={submitReportMutation.isPending}
            >
              {submitReportMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Ionicons name="flag-outline" size={22} color={Colors.error} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Inline Loader */}
      {/* Removed - now using skeleton loader above */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Photos */}
        {job.photos && job.photos.length > 0 && (
          <View style={styles.section}>
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

        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleRow}>
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
            <Text style={styles.jobTitle}>{job.title}</Text>
          </View>
          <View style={styles.jobMetaRow}>
            {job.preferred_start_date ? (
              <Text style={styles.jobMetaInlineText}>
                {[startDateLabel, durationLabel, shiftLabel].filter(Boolean).join(" \u00B7 ")}
              </Text>
            ) : (
              <Text style={styles.jobStartDate}>{`Posted ${job.postedAt}`}</Text>
            )}
          </View>

          {/* Team Job Header Badge - Prominent indicator at top */}
          {isTeamJob && (
            <View style={styles.teamJobHeaderBadge}>
              <Ionicons name="people-circle" size={20} color="#00BAF1" />
              <Text style={styles.teamJobHeaderBadgeText}>
                {isMixedTeam
                  ? "Mixed Team"
                  : isAgencyInviteTeamJob
                    ? "Agency Team"
                    : "Team Job"}
              </Text>
              <View style={styles.teamJobHeaderDivider} />
              <Text style={styles.teamJobHeaderCount}>
                {computedWorkersAssigned}/{computedWorkersNeeded}{" "}
                {isAgencyInviteTeamJob ? "assigned" : "filled"}
              </Text>
              {isMixedTeam && (
                <Text
                  style={{
                    ...Typography.body.small,
                    color: "#00BAF1",
                    fontSize: 10,
                    marginLeft: 4,
                  }}
                >
                  ({job.total_freelancers || 0}F + {job.total_agency_employees || 0}E)
                </Text>
              )}
              {isTeamFilled && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#00BAF1"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          )}
        </View>

        {hasLifecycleEvents && (
          <View style={styles.section}>
            <JobLifecycleTimeline
              clientConfirmedWorkStarted={job.clientConfirmedWorkStarted}
              clientConfirmedWorkStartedAt={job.clientConfirmedWorkStartedAt}
            />
          </View>
        )}

        {job.status === "CANCELLED" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Summary</Text>
            <View style={styles.cancellationCard}>
              <Text style={styles.cancellationTitle}>
                {formatCancellationStage(job.cancellationStage)}
              </Text>
              {job.cancellationReason ? (
                <Text style={styles.cancellationLine}>
                  Reason: {job.cancellationReason}
                </Text>
              ) : null}
              {job.cancelledByRole ? (
                <Text style={styles.cancellationLine}>
                  Cancelled by: {job.cancelledByRole}
                </Text>
              ) : null}
              {job.clientRefundAmount && job.clientRefundAmount > 0 ? (
                <Text style={styles.cancellationLine}>
                  Client refund: PHP {job.clientRefundAmount.toFixed(2)}
                </Text>
              ) : null}
              {job.workerCompensationAmount &&
              job.workerCompensationAmount > 0 ? (
                <Text style={styles.cancellationLine}>
                  Worker compensation: PHP{" "}
                  {job.workerCompensationAmount.toFixed(2)}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={[styles.section, styles.descriptionSection]}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
          <View style={[styles.jobMetaRow, { marginTop: Spacing.md }]}>
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
            <Ionicons
              name={
                job.payment_model === "DAILY" ? "time-outline" : "cash-outline"
              }
              size={24}
              color={Colors.primary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Budget Range</Text>
              <Text style={styles.detailValue}>
                {job.budgetRangeMin != null && job.budgetRangeMax != null
                  ? `₱${job.budgetRangeMin.toLocaleString()} - ₱${job.budgetRangeMax.toLocaleString()}`
                  : job.budget}
              </Text>
              {job.payment_model === "DAILY" ? (
                <View style={{ marginTop: 2 }}>
                  {job.daily_rate_agreed != null && (
                    <Text style={{ fontSize: 11, color: Colors.primary }}>
                      Daily Rate: ₱
                      {Number(job.daily_rate_agreed).toLocaleString()}/day
                    </Text>
                  )}
                  {durationDays > 0 && (
                    <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                      Duration: {durationDays} day{durationDays === 1 ? "" : "s"}
                      {dayProgress
                        ? ` (Day ${dayProgress}/${durationDays})`
                        : ""}
                    </Text>
                  )}
                  {shiftLabel && (
                    <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                      Shift: {shiftLabel}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={{ marginTop: 2 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: Colors.textSecondary,
                    }}
                  >
                    Project Based
                  </Text>
                  {durationDays > 0 && (
                    <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                      Working Days: {durationDays} day{durationDays === 1 ? "" : "s"}
                    </Text>
                  )}
                  {shiftLabel && (
                    <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                      Shift: {shiftLabel}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
          <View style={styles.horizontalDivider} />
          <View style={styles.detailCard}>
            <Ionicons
              name="location-outline"
              size={24}
              color={Colors.primary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{locationDisplayText}</Text>
            </View>
          </View>
          {isWorker && canWorkerViewFullAddress && (
            <View style={styles.detailCard}>
              <Ionicons
                name="call-outline"
                size={24}
                color={Colors.primary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Client Contact</Text>
                <Text style={styles.detailValue}>
                  {job.postedBy?.phone || "Not available"}
                </Text>
                {!!job.postedBy?.phone && (
                  <TouchableOpacity
                    style={styles.callClientButton}
                    onPress={handleCallClient}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call-outline" size={16} color={Colors.white} />
                    <Text style={styles.callClientButtonText}>Call Client</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Expected Duration */}
        {job.expectedDuration && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
                Expected Duration:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: Colors.textPrimary,
                }}
              >
                {job.expectedDuration}
              </Text>
            </View>
          </View>
        )}

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
            {/* Conversation Lock Notice - Chat only available when all workers selected */}
            {!isTeamFilled && (
              <View style={styles.conversationLockBanner}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={20}
                  color={Colors.textSecondary}
                />
                <View style={styles.conversationLockContent}>
                  <Text style={styles.conversationLockTitle}>
                    Group Chat Locked
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 4 }]}>
              Skill Slots
            </Text>

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
                  </View>

                  <View style={styles.skillSlotInfo}>
                    <View style={styles.skillSlotInfoItem}>
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.skillSlotInfoText}>
                        {slot.status === "FILLED"
                          ? slot.workers_needed
                          : slot.workers_assigned}
                        /{slot.workers_needed} workers
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

                  {/* Agency Invite Info (per-slot) */}
                  {slot.agency_invite && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor:
                          slot.agency_invite.invite_status === "ACCEPTED"
                            ? Colors.success + "10"
                            : slot.agency_invite.invite_status === "REJECTED"
                              ? Colors.error + "10"
                              : Colors.warning + "10",
                        borderRadius: 8,
                        marginTop: 8,
                        gap: 8,
                      }}
                    >
                      <Ionicons
                        name="business"
                        size={16}
                        color={
                          slot.agency_invite.invite_status === "ACCEPTED"
                            ? Colors.success
                            : slot.agency_invite.invite_status === "REJECTED"
                              ? Colors.error
                              : Colors.warning
                        }
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            ...Typography.body.small,
                            fontWeight: "600",
                            color: Colors.textPrimary,
                          }}
                        >
                          {slot.agency_invite.agency_name}
                        </Text>
                        <Text
                          style={{
                            ...Typography.body.small,
                            color: Colors.textSecondary,
                          }}
                        >
                          Invite:{" "}
                          {slot.agency_invite.invite_status
                            .charAt(0)
                            .toUpperCase() +
                            slot.agency_invite.invite_status
                              .slice(1)
                              .toLowerCase()}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Employee Assignments for this slot (client view) */}
                  {isClient &&
                    slot.employee_assignments &&
                    slot.employee_assignments.length > 0 && (
                      <View style={{ marginTop: 8, gap: 6 }}>
                        {slot.employee_assignments.map((emp) => (
                          <View
                            key={emp.assignment_id}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: 10,
                              backgroundColor: Colors.backgroundSecondary,
                              borderRadius: 8,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                flex: 1,
                              }}
                            >
                              <Ionicons
                                name="person"
                                size={16}
                                color={Colors.primary}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    ...Typography.body.small,
                                    fontWeight: "600",
                                    color: Colors.textPrimary,
                                  }}
                                  numberOfLines={1}
                                >
                                  {emp.employee_name}
                                </Text>
                                <Text
                                  style={{
                                    ...Typography.body.small,
                                    color: Colors.textSecondary,
                                    fontSize: 11,
                                  }}
                                >
                                  {emp.client_confirmed_arrival
                                    ? emp.agency_marked_complete
                                      ? emp.client_approved
                                        ? "Approved"
                                        : "Awaiting Approval"
                                      : "Arrived"
                                    : emp.dispatched
                                      ? "Dispatched"
                                      : "Assigned"}
                                </Text>
                              </View>
                            </View>
                            {(() => {
                              const hasArrived =
                                Boolean(emp.client_confirmed_arrival) ||
                                Boolean((emp as any).clientConfirmedArrival) ||
                                emp.status === "IN_PROGRESS" ||
                                emp.status === "COMPLETED";

                              const canConfirmArrival =
                                Boolean(emp.dispatched) &&
                                !hasArrived &&
                                job.status === "IN_PROGRESS";

                              if (!canConfirmArrival) {
                                return null;
                              }

                              return (
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: Colors.primary,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 6,
                                    opacity: confirmEmployeeArrival.isPending
                                      ? 0.7
                                      : 1,
                                  }}
                                  onPress={() =>
                                    confirmEmployeeArrival.mutate({
                                      jobId: parseInt(job.id),
                                      assignmentId: Number(emp.assignment_id),
                                    })
                                  }
                                  disabled={confirmEmployeeArrival.isPending}
                                >
                                  <Text
                                    style={{
                                      ...Typography.body.small,
                                      color: Colors.white,
                                      fontWeight: "600",
                                      fontSize: 11,
                                    }}
                                  >
                                    {confirmEmployeeArrival.isPending
                                      ? "Confirming..."
                                      : "Confirm Arrival"}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })()}
                          </View>
                        ))}
                      </View>
                    )}

                  {/* Assigned Here Badge - shown when worker is assigned to THIS specific slot */}
                  {isWorker && assignedSlotIds.has(slot.skill_slot_id) && (
                    <View style={[styles.appliedBadge, { backgroundColor: Colors.success + "15", borderColor: Colors.success + "30" }]}>
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
                        Assigned Here
                      </Text>
                    </View>
                  )}

                  {/* Apply Button for Workers (if slot is open, not already assigned to THIS slot, not already applied) */}
                  {isWorker &&
                    slot.openings_remaining > 0 &&
                    job.status === "ACTIVE" &&
                    !slot.agency_invite &&
                    !assignedSlotIds.has(slot.skill_slot_id) &&
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
                    !assignedSlotIds.has(slot.skill_slot_id) && (
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

            {/* Worker's Own Assignment Actions (supports multi-slot) */}
            {isWorker && currentWorkerAssignments.length > 0 && (
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
                {currentWorkerAssignments.length > 1 && (
                  <Text style={{ color: Colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
                    You have {currentWorkerAssignments.length} roles on this job
                  </Text>
                )}
                {currentWorkerAssignments.map((assignment) => (
                  <View key={assignment.assignment_id} style={{ marginBottom: currentWorkerAssignments.length > 1 ? 8 : 0 }}>
                    <Text style={styles.assignmentCardSubtitle}>
                      Slot: {assignment.specialization_name}
                    </Text>

                    {assignment.worker_marked_complete ? (
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
                      currentWorkerAssignments.length === 1 && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            paddingVertical: 8,
                          }}
                        >
                          <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={18}
                            color={Colors.primary}
                          />
                          <Text
                            style={{
                              color: Colors.primary,
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            Go to conversation to manage job progress
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                ))}
                {currentWorkerAssignments.length > 1 && !currentWorkerAssignments.every((a) => a.worker_marked_complete) && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingVertical: 8,
                    }}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={18}
                      color={Colors.primary}
                    />
                    <Text
                      style={{
                        color: Colors.primary,
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      Go to conversation to manage job progress
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Team Job Applications - For clients to review applications */}
        {isTeamJob && isClient && (teamApplications.length > 0 || teamSlotsWithOpenings.length > 0) && (
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

            {teamApplications.length === 0 && (
              <View style={styles.emptyApplications}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={Colors.textSecondary}
                />
                <Text style={styles.emptyApplicationsText}>No applications yet</Text>
                <Text style={styles.emptyApplicationsSubtext}>
                  You can invite an agency again for open slots, or let freelancers apply.
                </Text>
              </View>
            )}

            {teamSlotsWithOpenings.length > 0 && (
              <View style={{ gap: 10, marginBottom: teamApplications.length > 0 ? 12 : 0 }}>
                {teamSlotsWithOpenings.map((slot) => (
                  <View
                    key={`slot-fallback-${slot.skill_slot_id}`}
                    style={styles.teamAgencyFallbackCard}
                  >
                    <View style={styles.teamAgencyFallbackHeader}>
                      <Text style={styles.teamAgencyFallbackTitle}>
                        {slot.specialization_name}
                      </Text>
                      <Text style={styles.teamAgencyFallbackMeta}>
                        Openings: {slot.openings_remaining}
                      </Text>
                    </View>

                    <Text style={styles.teamAgencyFallbackText}>
                      This slot is open for freelancers.
                    </Text>

                    {!!slot.last_agency_rejection && (
                      <Text style={styles.teamAgencyFallbackReason}>
                        Last agency rejection: {slot.last_agency_rejection.agency_name || "Agency"}
                        {slot.last_agency_rejection.reason
                          ? ` - ${slot.last_agency_rejection.reason}`
                          : ""}
                      </Text>
                    )}

                    <View style={styles.teamAgencyFallbackActions}>
                      <TouchableOpacity
                        style={styles.teamAgencyFallbackInviteButton}
                        onPress={() => openAgencyPickerForSlot(slot.skill_slot_id)}
                        disabled={inviteAgencyToSlot.isPending}
                      >
                        {inviteAgencyToSlot.isPending &&
                        inviteAgencyToSlot.variables?.slotId === slot.skill_slot_id ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <>
                            <Ionicons name="business-outline" size={16} color={Colors.white} />
                            <Text style={styles.teamAgencyFallbackInviteText}>
                              Invite Agency Again
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.teamAgencyFallbackWorkerButton}
                        onPress={() => {
                          const catId =
                            typeof job.category === "object" ? job.category.id : undefined;
                          router.push({
                            pathname: "/jobs/invite-workers" as any,
                            params: {
                              jobId: id,
                              categoryId: catId?.toString() || "",
                            },
                          });
                        }}
                      >
                        <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
                        <Text style={styles.teamAgencyFallbackWorkerText}>Invite Workers</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {teamApplications.map((app: any) => (
              <View key={app.application_id} style={styles.applicationCard}>
                <View style={styles.applicationWorkerInfo}>
                  {app.worker_avatar ? (
                    <Image
                      source={{ uri: app.worker_avatar }}
                      style={styles.applicationAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.applicationAvatar,
                        {
                          backgroundColor: Colors.background,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={24}
                        color={Colors.textSecondary}
                      />
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
                  {app.budget_option === "NEGOTIATE" ? (() => {
                    const clientHasCountered =
                      app.last_actor === "CLIENT" && !!app.client_counter_budget;
                    const priceLabel = clientHasCountered
                      ? job?.payment_model === "DAILY" &&
                        app.client_counter_daily_rate &&
                        app.client_counter_days
                        ? `You Countered for: ₱${app.client_counter_daily_rate.toLocaleString()}/day × ${app.client_counter_days} days = ₱${(app.client_counter_daily_rate * app.client_counter_days).toLocaleString()}`
                        : `You Countered for: ₱${(app.client_counter_budget || 0).toLocaleString()}`
                      : app.proposed_daily_rate && app.proposed_days
                        ? `Proposed: ₱${app.proposed_daily_rate.toLocaleString()}/day × ${app.proposed_days} days = ₱${(app.proposed_daily_rate * app.proposed_days).toLocaleString()}`
                        : `Proposed: ₱${(app.proposed_budget || 0).toLocaleString()}`;

                    return (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="cash-outline" size={16} color="#00BAF1" />
                          <Text style={[styles.applicationDetailText, { color: "#00BAF1", fontWeight: "600" }]}>
                            {priceLabel}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        {app.status === "PENDING" &&
                          !clientHasCountered &&
                          (app.negotiation_count ?? 0) < 3 && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 24 }}>
                              <TouchableOpacity
                                onPress={() => handleRejectPrice(app.application_id, app.worker_name)}
                                disabled={rejectPriceMutation.isPending}
                              >
                                {rejectPriceMutation.isPending ? (
                                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                                ) : (
                                  <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: "600" }}>Reject Price</Text>
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={{ borderWidth: 1, borderColor: Colors.textSecondary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: Colors.white }}
                                onPress={() => handleCounterOfferForTeam(app)}
                              >
                                <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: "600" }}>Counter</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                      </View>
                    );
                  })() : (
                    <View style={styles.applicationDetailItem}>
                      <Ionicons
                        name="cash-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.applicationDetailText}>
                        ₱{(app.proposed_budget || 0).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                {app.budget_option === "NEGOTIATE" &&
                  (app.negotiation_count ?? 0) > 0 && (
                    <ClientNegotiationThread
                      applicationId={app.application_id}
                      paymentModel={job?.payment_model}
                    />
                  )}

                {app.status === "PENDING" &&
                  !acceptedWorkerSlotKeys.has(getWorkerSlotKey(app) || "") && (
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
                          <ActivityIndicator
                            size="small"
                            color={Colors.white}
                          />
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
                          <ActivityIndicator
                            size="small"
                            color={Colors.error}
                          />
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
                {app.status === "PENDING" &&
                  acceptedWorkerSlotKeys.has(getWorkerSlotKey(app) || "") && (
                    <View
                      style={[
                        styles.applicationActions,
                        { justifyContent: "center" },
                      ]}
                    >
                      <View
                        style={[
                          styles.applicationStatusBadge,
                          styles.statusAccepted,
                          { paddingHorizontal: 12, paddingVertical: 6 },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Colors.success}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.applicationStatusText,
                            { color: Colors.success },
                          ]}
                        >
                          Already Assigned to Another Slot
                        </Text>
                      </View>
                    </View>
                  )}
              </View>
            ))}
          </View>
        )}

        {/* Job Invitation Actions - For workers to accept/reject INVITE jobs */}
        {isWorker &&
          !job.is_team_job &&
          job.jobType === "INVITE" &&
          job.assignedWorker?.id === user?.profile_data?.id &&
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
                  You&apos;ve been invited to work on this job. Review the
                  details and decide whether to accept or decline.
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

        {/* Posted By - For LISTING jobs, shown above Applications */}
        {job.jobType !== "INVITE" &&
          job.status !== "IN_PROGRESS" &&
          job.status !== "COMPLETED" && (
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
                  <View
                    style={[
                      styles.posterAvatar,
                      {
                        backgroundColor: Colors.background,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={28}
                      color={Colors.textSecondary}
                    />
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
                      <Text
                        style={[
                          styles.posterRatingText,
                          { color: Colors.textSecondary },
                        ]}
                      >
                        New
                      </Text>
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
                  <View
                    style={[
                      styles.posterAvatar,
                      {
                        backgroundColor: Colors.background,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={28}
                      color={Colors.textSecondary}
                    />
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
                      <Text
                        style={[
                          styles.posterRatingText,
                          { color: Colors.textSecondary },
                        ]}
                      >
                        New
                      </Text>
                    )}
                  </View>
                  <Text style={styles.postedTime}>Posted {job.postedAt}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Applications Section - Only for open LISTING jobs by client (non-team jobs only) */}
        {showApplicationsSection && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Applications</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {applications.length > 0 && (
                  <View style={styles.applicationsBadge}>
                    <Text style={styles.applicationsBadgeText}>
                      {applications.length}
                    </Text>
                  </View>
                )}
                {job.status !== "IN_PROGRESS" && (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: Colors.white,
                      borderWidth: 1,
                      borderColor: "#00BAF1",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      gap: 4,
                    }}
                    onPress={() => {
                      const catId =
                        typeof job.category === "object"
                          ? job.category.id
                          : undefined;
                      router.push({
                        pathname: "/jobs/invite-workers" as any,
                        params: {
                          jobId: id,
                          categoryId: catId?.toString() || "",
                        },
                      });
                    }}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={14}
                      color="#00BAF1"
                    />
                    <Text
                      style={{
                        color: "#00BAF1",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Invite Workers
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {applicationsLoading ? (
              <View style={{ padding: Spacing.xl, alignItems: "center" }}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : applicationsError ? (
              <View style={{ padding: Spacing.xl, alignItems: "center" }}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={Colors.error}
                />
                <Text
                  style={[
                    Typography.body.medium,
                    { color: Colors.error, marginTop: Spacing.sm },
                  ]}
                >
                  Failed to load applications
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => refetchApplications()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
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
                        <View
                          style={[
                            styles.applicationAvatar,
                            {
                              backgroundColor: Colors.background,
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                        >
                          <Ionicons
                            name="person"
                            size={24}
                            color={Colors.textSecondary}
                          />
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
                            <Text
                              style={[
                                styles.applicationWorkerRating,
                                { color: Colors.textSecondary },
                              ]}
                            >
                              New
                            </Text>
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

                    {application.status === "REJECTED" && (
                      <View style={styles.rejectedInfoBox}>
                        <Text style={styles.rejectedInfoText}>
                          {typeof application.proposals_remaining === "number"
                            ? application.proposals_remaining > 0
                              ? `Rejected. Worker can still re-propose ${application.proposals_remaining} more time${application.proposals_remaining !== 1 ? "s" : ""}.`
                              : "Rejected. Worker has no proposal attempts remaining."
                            : "Rejected application."}
                        </Text>
                        {!!(application.client_rejection_reason || application.response_message) && (
                          <Text style={styles.rejectedInfoReason} numberOfLines={2}>
                            Reason: {application.client_rejection_reason || application.response_message}
                          </Text>
                        )}
                      </View>
                    )}

                    <View style={styles.applicationDetails}>
                      {application.budget_option === "NEGOTIATE" && (() => {
                        const clientHasCountered = application.last_actor === "CLIENT" && !!application.client_counter_budget;
                        const priceLabel = clientHasCountered
                          ? job?.payment_model === "DAILY" && application.client_counter_daily_rate && application.client_counter_days
                            ? `You Countered for: ₱${application.client_counter_daily_rate.toLocaleString()}/day × ${application.client_counter_days} days = ₱${(application.client_counter_daily_rate * application.client_counter_days).toLocaleString()}`
                            : `You Countered for: ₱${application.client_counter_budget!.toLocaleString()}`
                          : job?.payment_model === "DAILY" && application.proposed_daily_rate && application.proposed_days
                            ? `Proposed: ₱${application.proposed_daily_rate.toLocaleString()}/day × ${application.proposed_days} days = ₱${(application.proposed_daily_rate * application.proposed_days).toLocaleString()}`
                            : `Proposed: ₱${application.proposed_budget.toLocaleString()}`;
                        return (
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Ionicons name="cash-outline" size={16} color="#00BAF1" />
                              <Text style={[styles.applicationDetailText, { color: "#00BAF1", fontWeight: "600" }]}>
                                {priceLabel}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }} />
                            {application.status === "PENDING" && !clientHasCountered && (application.negotiation_count ?? 0) < 3 && (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 24 }}>
                                <TouchableOpacity
                                  onPress={() => handleRejectPrice(application.id, application.worker.name)}
                                  disabled={rejectPriceMutation.isPending}
                                >
                                  {rejectPriceMutation.isPending ? (
                                    <ActivityIndicator size="small" color={Colors.textSecondary} />
                                  ) : (
                                    <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: "600" }}>Reject Price</Text>
                                  )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={{ borderWidth: 1, borderColor: Colors.textSecondary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: Colors.white }}
                                  onPress={() => handleCounterOffer(application)}
                                >
                                  <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: "600" }}>Counter</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        );
                      })()}
                      
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

                    {/* Negotiation History (expandable) */}
                    {application.budget_option === "NEGOTIATE" && application.negotiation_count > 0 && (
                      <ClientNegotiationThread
                        applicationId={application.id}
                        paymentModel={job?.payment_model}
                      />
                    )}

                    {/* View Chat Button for Accepted Applications */}
                    {application.status === "ACCEPTED" && !job?.is_team_job && (
                      <TouchableOpacity
                        style={[styles.viewChatButton, { marginTop: 8 }]}
                        onPress={handleViewChat}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={18}
                          color={Colors.white}
                        />
                        <Text style={styles.viewChatButtonText}>View Chat</Text>
                      </TouchableOpacity>
                    )}

                    {/* Action Buttons */}
                    {application.status === "PENDING" && (
                      <View style={{ gap: 8, marginTop: 8 }}>
                        {/* Reject Applicant + Accept row */}
                        <View style={styles.applicationActions}>
                          {/* Reject Applicant */}
                          <TouchableOpacity
                            style={[styles.rejectButton, { borderColor: Colors.error }]}
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
                                  size={18}
                                  color={Colors.error}
                                />
                                <Text style={styles.rejectButtonText}>
                                  Reject Applicant
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
                                  size={18}
                                  color="#FFF"
                                />
                                <Text style={styles.acceptButtonText}>
                                  Accept
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>


                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Agency Invite Suggestions - Client can suggest preferred workers */}
        {showAgencySuggestionSection && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Agency Worker Suggestions</Text>
            </View>
            <View style={styles.emptyApplications}>
              <Ionicons
                name="people-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyApplicationsText}>
                Suggest preferred workers
              </Text>
              <Text style={styles.emptyApplicationsSubtext}>
                Share suggested workers for this agency-assigned job.
              </Text>
              {job.status !== "IN_PROGRESS" && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    const catId =
                      typeof job.category === "object"
                        ? job.category.id
                        : undefined;
                    router.push({
                      pathname: "/jobs/invite-workers" as any,
                      params: {
                        jobId: id,
                        categoryId: catId?.toString() || "",
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Suggest Workers</Text>
                </TouchableOpacity>
              )}
            </View>
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

        {/* View Group Chat button for team jobs with full roster - just above Client section */}
        {canAccessTeamGroupChat && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <TouchableOpacity
              style={styles.viewGroupChatButton}
              onPress={handleViewChat}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={22} color={Colors.white} />
              <Text style={styles.viewGroupChatButtonText}>
                View Group Chat
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View Agency Group Chat button for agency jobs with assigned workers */}
        {isClient &&
          job.assignedAgency &&
          job.assignedAgency.workers_assigned > 0 && (
            <View style={[styles.section, { paddingTop: 0 }]}>
              <TouchableOpacity
                style={styles.viewGroupChatButton}
                onPress={handleViewChat}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles" size={22} color={Colors.white} />
                <Text style={styles.viewGroupChatButtonText}>
                  View Agency Group Chat
                </Text>
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
                    <View
                      style={[
                        styles.posterAvatar,
                        {
                          backgroundColor: Colors.background,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={28}
                        color={Colors.textSecondary}
                      />
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
                        <Text
                          style={[
                            styles.posterRatingText,
                            { color: Colors.textSecondary },
                          ]}
                        >
                          New
                        </Text>
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
                    <View
                      style={[
                        styles.posterAvatar,
                        {
                          backgroundColor: Colors.background,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={28}
                        color={Colors.textSecondary}
                      />
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
                        <Text
                          style={[
                            styles.posterRatingText,
                            { color: Colors.textSecondary },
                          ]}
                        >
                          New
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* View Chat - Worker POV (non-sticky, above profile section) */}
            {isWorker &&
              !job?.is_team_job &&
              (!!job?.assignedWorker ||
                isCurrentWorkerAssigned ||
                hasAcceptedApplication ||
                job?.status === "IN_PROGRESS" ||
                (hasApplied && job?.status === "ACTIVE")) &&
              job?.status !== "COMPLETED" &&
              job?.status !== "CANCELLED" && (
                <View style={styles.section}>
                  <TouchableOpacity
                    style={[styles.viewChatButton, { marginTop: 0 }]}
                    onPress={handleViewChat}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color={Colors.white}
                    />
                    <Text style={styles.viewChatButtonText}>View Chat</Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* Agency Section - Show if assigned */}
            {job.assignedAgency && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Agency</Text>
                <View style={styles.posterCard}>
                  {job.assignedAgency?.logo ? (
                    <Image
                      source={{ uri: job.assignedAgency.logo }}
                      style={styles.posterAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.posterAvatar,
                        {
                          backgroundColor: Colors.background,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Ionicons
                        name="business"
                        size={28}
                        color={Colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.posterInfo}>
                    <Text style={styles.posterName}>
                      {job.assignedAgency?.name || "Unknown Agency"}
                    </Text>
                    <View style={styles.posterRating}>
                      {(job.assignedAgency?.rating ?? 0) > 0 ? (
                        <>
                          <Ionicons name="star" size={16} color="#F59E0B" />
                          <Text style={styles.posterRatingText}>
                            {job.assignedAgency.rating.toFixed(1)} rating
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={[
                            styles.posterRatingText,
                            { color: Colors.textSecondary },
                          ]}
                        >
                          New
                        </Text>
                      )}
                    </View>
                    <Text style={styles.posterRatingText}>
                      {job.assignedAgency.workers_assigned} worker
                      {job.assignedAgency.workers_assigned !== 1
                        ? "s"
                        : ""}{" "}
                      assigned
                    </Text>
                  </View>
                </View>
              </View>
            )}

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
                      <View
                        style={[
                          styles.posterAvatar,
                          {
                            backgroundColor: Colors.background,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={28}
                          color={Colors.textSecondary}
                        />
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
                          <Text
                            style={[
                              styles.posterRatingText,
                              { color: Colors.textSecondary },
                            ]}
                          >
                            New
                          </Text>
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
                      <View
                        style={[
                          styles.posterAvatar,
                          {
                            backgroundColor: Colors.background,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={28}
                          color={Colors.textSecondary}
                        />
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
                          <Text
                            style={[
                              styles.posterRatingText,
                              { color: Colors.textSecondary },
                            ]}
                          >
                            New
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        ) : null}

        {/* Cancel Button - Below Posted By/Assigned Worker, non-sticky */}
        {user?.accountID === job.postedBy?.id &&
          job.status !== "COMPLETED" &&
          job.status !== "CANCELLED" && (
            <View style={styles.section}>
              <TouchableOpacity
                onPress={handleCancelJob}
                style={styles.bottomCancelButton}
                disabled={cancelJobMutation.isPending}
                activeOpacity={0.85}
              >
                {cancelJobMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={Colors.error}
                    />
                    <Text style={styles.bottomCancelButtonText}>
                      {job.is_team_job ? "Cancel Team Job" : "Cancel Job"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

        {/* Worker Negotiation Section - Inline in scroll view */}
        {isWorker && hasApplied && myApplicationId && negotiationCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Negotiation</Text>

            {/* Proposals remaining banner */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: workerProposalsExhausted ? "#FFF3CD" : "#E8F4FD",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}>
              <Ionicons
                name={workerProposalsExhausted ? "warning-outline" : "information-circle-outline"}
                size={16}
                color={workerProposalsExhausted ? Colors.warning : Colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: workerProposalsExhausted ? Colors.warning : Colors.primary, fontWeight: "500" }}>
                  {workerProposalsExhausted
                    ? "No more proposals allowed."
                    : `${workerProposalsRemaining} of 3 proposals remaining`}
                </Text>
                {workerAwaitingResponse && (
                  <Text style={{ fontSize: 12, color: workerProposalsExhausted ? Colors.warning : Colors.primary, fontStyle: "italic", marginTop: 2 }}>
                    Awaiting client response...
                  </Text>
                )}
              </View>
            </View>

            {/* Negotiation Thread */}
            {workerNegotiationLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : (
              <View style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                padding: 12,
                ...Shadows.small,
              }}>
                {workerThread.map((round, index) => (
                  <View
                    key={round.negotiation_id}
                    style={{
                      paddingBottom: index < workerThread.length - 1 ? 12 : 0,
                      marginBottom: index < workerThread.length - 1 ? 12 : 0,
                      borderBottomWidth: index < workerThread.length - 1 ? 1 : 0,
                      borderBottomColor: Colors.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: round.actor === "WORKER" ? "#E8F4FD" : "#FFF3CD", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                        <Ionicons
                          name={round.actor === "WORKER" ? "person" : "business"}
                          size={12}
                          color={round.actor === "WORKER" ? Colors.primary : Colors.warning}
                        />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: round.actor === "WORKER" ? Colors.primary : Colors.warning }}>
                          {round.actor === "WORKER" ? "You" : "Client"}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                        {new Date(round.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: round.message ? 4 : 0 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.textPrimary }}>
                        {job?.payment_model === "DAILY" && round.proposed_daily_rate && round.proposed_days
                          ? `₱${round.proposed_daily_rate.toLocaleString()}/day × ${round.proposed_days} days`
                          : `₱${round.proposed_budget.toLocaleString()}`}
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: round.status === "PENDING" ? Colors.warning
                          : round.status === "ACCEPTED" ? Colors.success
                          : round.status === "COUNTERED" ? Colors.primary
                          : Colors.textSecondary,
                      }}>
                        {round.status}
                      </Text>
                    </View>

                    {round.message ? (
                      <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }} numberOfLines={2}>
                        {round.message}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {/* Client countered — action buttons */}
            {workerClientCountered && workerLastRound && (
              <View style={{
                backgroundColor: "#F4FBFF",
                borderRadius: 12,
                padding: 16,
                marginTop: 12,
                borderWidth: 1,
                borderColor: "#00BAF1",
              }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 }}>
                  Client&apos;s Counter-Offer
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#00BAF1", marginBottom: 12 }}>
                  {job?.payment_model === "DAILY" && workerLastRound.proposed_daily_rate && workerLastRound.proposed_days
                    ? `₱${workerLastRound.proposed_daily_rate.toLocaleString()}/day × ${workerLastRound.proposed_days} days`
                    : `₱${workerLastRound.proposed_budget.toLocaleString()}`}
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor: "#00BAF1",
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                  onPress={() => workerAcceptCounterMutation.mutate()}
                  disabled={workerAcceptCounterMutation.isPending}
                  activeOpacity={0.8}
                >
                  {workerAcceptCounterMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                      <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>Accept Counter-Offer</Text>
                    </>
                  )}
                </TouchableOpacity>

                {!workerProposalsExhausted && (
                  <TouchableOpacity
                    style={{
                      borderWidth: 1,
                      borderColor: Colors.primary,
                      borderRadius: 8,
                      paddingVertical: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 6,
                    }}
                    onPress={() => setShowWorkerProposeModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={18} color={Colors.primary} />
                    <Text style={{ color: Colors.primary, fontWeight: "600", fontSize: 15 }}>Re-Propose</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Worker can propose (no counter pending) */}
            {workerCanPropose && !workerClientCountered && (
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.primary,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 12,
                }}
                onPress={() => setShowWorkerProposeModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="cash-outline" size={18} color="#FFF" />
                <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>
                  {negotiationCount === 0 ? "Propose Price" : "Re-Propose"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Apply Button (Fixed at bottom) - Only for non-team LISTING jobs */}
      {isWorker &&
        job?.jobType !== "INVITE" &&
        !job?.is_team_job &&
        job?.status === "ACTIVE" &&
        !isCurrentWorkerAssigned && (
          <View style={styles.applyButtonContainer} pointerEvents="box-none">
            {hasApplied ? (
              <View style={styles.appliedContainer}>
                <View style={styles.appliedRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                  <Text style={styles.appliedText}>
                    You have already applied to this job
                  </Text>
                </View>
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
            <TouchableOpacity onPress={() => {
              setShowApplicationModal(false);
              setProposedDailyRate("");
              setProposedDays("");
              setAppliedShift(null);
            }}>
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
                  {job?.payment_model === "DAILY"
                    ? `Accept ₱${job?.daily_rate_agreed?.toLocaleString() || "0"}/day × ${job?.duration_days || "?"} days`
                    : `Accept ${job?.budget}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.budgetOption,
                  budgetOption === "NEGOTIATE" && styles.budgetOptionActive,
                  hasNegotiationCapReached && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (hasNegotiationCapReached) {
                    Alert.alert(
                      "Proposal Limit Reached",
                      "You have already used all 3 proposals for this job. Re-apply by accepting the listed budget.",
                    );
                    setBudgetOption("ACCEPT");
                    return;
                  }
                  setBudgetOption("NEGOTIATE");
                }}
                disabled={hasNegotiationCapReached}
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

            {hasNegotiationCapReached && (
              <Text style={[styles.termsText, { marginTop: 8, color: Colors.warning }]}>
                Negotiation limit reached for this job. You can only apply using the listed budget.
              </Text>
            )}

            {budgetOption === "NEGOTIATE" && !hasNegotiationCapReached && (
              job?.payment_model === "DAILY" ? (
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Proposed Daily Rate (₱)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your proposed daily rate"
                      placeholderTextColor={Colors.textHint}
                      value={proposedDailyRate}
                      onChangeText={setProposedDailyRate}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Number of Days</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter proposed number of days"
                      placeholderTextColor={Colors.textHint}
                      value={proposedDays}
                      onChangeText={setProposedDays}
                      keyboardType="numeric"
                    />
                  </View>
                  {proposedDailyRate && proposedDays && (
                    <View style={[styles.inputGroup, { backgroundColor: Colors.backgroundSecondary, padding: Spacing.md, borderRadius: BorderRadius.md }]}>
                      <Text style={[styles.label, { marginBottom: 0 }]}>
                        Total Proposed: ₱{(parseFloat(proposedDailyRate) * parseInt(proposedDays || "0")).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
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
              )
            )}

            {/* Shift picker for open-shift single jobs */}
            {(!job?.shift_type || job.shift_type === "ANY") && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shift *</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["MORNING", "NIGHT"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setAppliedShift(s)}
                      style={{
                        flex: 1,
                        minHeight: 58,
                        paddingVertical: 10,
                        paddingHorizontal: 6,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: appliedShift === s ? Colors.primary : Colors.border,
                        backgroundColor: appliedShift === s ? Colors.primary + "15" : Colors.background,
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: appliedShift === s ? "700" : "400",
                        color: appliedShift === s ? Colors.primary : Colors.textSecondary,
                        textAlign: "center",
                      }}>
                        {s === "MORNING" ? "Day Shift" : "Night Shift"}
                      </Text>
                      <Text style={{ fontSize: 10, color: Colors.textHint, marginTop: 2 }}>
                        {s === "MORNING" ? "8:00 AM - 5:00 PM" : "6:00 PM - 12:00 AM"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {/* Shift banner for fixed-shift jobs */}
            {job?.shift_type && job.shift_type !== "ANY" && (
              <View style={[styles.inputGroup, { backgroundColor: Colors.backgroundSecondary, padding: 12, borderRadius: 8 }]}> 
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                  Shift:{" "}
                  <Text style={{ fontWeight: "700", color: job.shift_type === "MORNING" ? "#F59E0B" : "#6366F1" }}>
                    {job.shift_type === "MORNING" ? "Day Shift (8:00 AM - 5:00 PM)" : "Night Shift (6:00 PM - 12:00 AM)"}
                  </Text>
                </Text>
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

            {/* Submit Button */}
            <Text style={styles.termsText}>
              By proceeding you agree to our{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push("/legal/terms")}
              >
                terms
              </Text>{" "}
              and{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push("/legal/privacy")}
              >
                policy
              </Text>
            </Text>
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

      {/* Reject Application Modal */}
      <Modal
        visible={showRejectApplicationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectApplicationModal(false)}
      >
        <TouchableOpacity
          style={styles.rejectModalOverlay}
          activeOpacity={1}
          onPress={() => setShowRejectApplicationModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.rejectModalContent}>
              <View style={styles.rejectModalHeader}>
                <Text style={styles.rejectModalTitle}>Reject Application</Text>
                <TouchableOpacity
                  onPress={() => setShowRejectApplicationModal(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.rejectModalLabel}>
                Reason for rejecting {rejectApplicationWorkerName || "this worker"}
              </Text>
              <TextInput
                style={styles.rejectModalInput}
                placeholder="Please explain why this proposal was rejected..."
                placeholderTextColor={Colors.textHint}
                value={rejectApplicationReason}
                onChangeText={setRejectApplicationReason}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <View style={styles.rejectModalButtons}>
                <TouchableOpacity
                  style={styles.rejectModalCancelButton}
                  onPress={() => {
                    setShowRejectApplicationModal(false);
                    setRejectApplicationReason("");
                    setRejectApplicationId(null);
                    setRejectApplicationWorkerName("");
                  }}
                >
                  <Text style={styles.rejectModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectModalSubmitButton}
                  onPress={handleSubmitRejectApplication}
                  disabled={rejectApplicationMutation.isPending}
                >
                  {rejectApplicationMutation.isPending ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.rejectModalSubmitText}>Reject</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Agency Picker Modal (team slot reinvite fallback) */}
      <Modal
        visible={agencyPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAgencyPickerVisible(false)}
      >
        <View style={styles.agencyModalContainer}>
          <View style={styles.agencyModalHeader}>
            <Text style={styles.agencyModalTitle}>Invite Agency</Text>
            <TouchableOpacity onPress={() => setAgencyPickerVisible(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: Spacing.md, paddingBottom: 0 }}>
            <TextInput
              style={styles.agencySearchInput}
              placeholder="Search agencies..."
              placeholderTextColor={Colors.textHint}
              value={agencySearchQuery}
              onChangeText={setAgencySearchQuery}
            />
            <Text
              style={{
                ...Typography.body.small,
                color: Colors.textSecondary,
                marginTop: Spacing.xs,
                marginBottom: Spacing.sm,
              }}
            >
              Select an agency to invite for this skill slot. The agency can accept or decline.
            </Text>
          </View>

          {agenciesLoading ? (
            <View style={styles.agencyPickerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.md }}>
              {filteredAgencies.length === 0 ? (
                <View style={styles.agencyPickerEmpty}>
                  <Ionicons
                    name="business-outline"
                    size={40}
                    color={Colors.textHint}
                  />
                  <Text style={styles.emptyApplicationsText}>No agencies found</Text>
                </View>
              ) : (
                filteredAgencies.map((agency) => (
                  <TouchableOpacity
                    key={`slot-agency-${agency.id}`}
                    style={styles.agencyPickerRow}
                    onPress={() => handleSelectAgencyForSlot(agency)}
                  >
                    <View style={styles.agencyPickerIconCircle}>
                      <Ionicons name="business" size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agencyPickerName} numberOfLines={1}>
                        {agency.name}
                      </Text>
                      <Text style={styles.agencyPickerMeta}>
                        {agency.completedJobs} jobs done
                        {agency.rating > 0 ? ` • ${agency.rating.toFixed(1)}★` : ""}
                      </Text>
                    </View>
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>
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
          setProposedDailyRate("");
          setProposedDays("");
          setAppliedShift(null);
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
                setProposedDailyRate("");
                setProposedDays("");
                setAppliedShift(null);
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
                <View style={[styles.skillSlotInfo, { marginTop: Spacing.sm }]}>
                  <View style={styles.skillSlotInfoItem}>
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.skillSlotInfoText}>
                      {job?.payment_model === "DAILY"
                        ? `₱${job?.daily_rate_agreed?.toLocaleString() || "0"}/day × ${job?.duration_days || "?"} days`
                        : `₱${selectedSkillSlot.budget_per_worker.toLocaleString()}/worker`}
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
                  {job?.payment_model === "DAILY"
                    ? `Accept ₱${job?.daily_rate_agreed?.toLocaleString() || "0"}/day × ${job?.duration_days || "?"} days`
                    : `Accept ₱${selectedSkillSlot?.budget_per_worker.toLocaleString()}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.budgetOption,
                  budgetOption === "NEGOTIATE" && styles.budgetOptionActive,
                  hasNegotiationCapReached && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (hasNegotiationCapReached) {
                    Alert.alert(
                      "Proposal Limit Reached",
                      "You have already used all 3 proposals for this job. Re-apply by accepting the listed budget.",
                    );
                    setBudgetOption("ACCEPT");
                    return;
                  }
                  setBudgetOption("NEGOTIATE");
                }}
                disabled={hasNegotiationCapReached}
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

            {hasNegotiationCapReached && (
              <Text style={[styles.termsText, { marginTop: 8, color: Colors.warning }]}>
                Negotiation limit reached for this job. You can only apply using the listed budget.
              </Text>
            )}

            {budgetOption === "NEGOTIATE" && !hasNegotiationCapReached && (
              job?.payment_model === "DAILY" ? (
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Proposed Daily Rate (₱)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your proposed daily rate"
                      placeholderTextColor={Colors.textHint}
                      value={proposedDailyRate}
                      onChangeText={setProposedDailyRate}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Number of Days</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter proposed number of days"
                      placeholderTextColor={Colors.textHint}
                      value={proposedDays}
                      onChangeText={setProposedDays}
                      keyboardType="numeric"
                    />
                  </View>
                  {proposedDailyRate && proposedDays && (
                    <View style={[styles.inputGroup, { backgroundColor: Colors.backgroundSecondary, padding: Spacing.md, borderRadius: BorderRadius.md }]}>
                      <Text style={[styles.label, { marginBottom: 0 }]}>
                        Total Proposed: ₱{(parseFloat(proposedDailyRate) * parseInt(proposedDays || "0")).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
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
              )
            )}

            {/* Shift picker for ANY-shift team jobs */}
            {(!job?.shift_type || job.shift_type === "ANY") && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shift *</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["MORNING", "NIGHT"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setAppliedShift(s)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 6,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: appliedShift === s ? Colors.primary : Colors.border,
                        backgroundColor: appliedShift === s ? Colors.primary + "15" : Colors.background,
                        alignItems: "center",
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: appliedShift === s ? "700" : "400",
                        color: appliedShift === s ? Colors.primary : Colors.textSecondary,
                      }}>
                        {s === "MORNING" ? "Day Shift" : "Night Shift"}
                      </Text>
                      <Text style={{ fontSize: 10, color: Colors.textHint, marginTop: 2 }}>
                        {s === "MORNING" ? "8:00 AM - 5:00 PM" : "6:00 PM - 12:00 AM"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {/* Shift banner for fixed-shift jobs */}
            {job?.shift_type && job.shift_type !== "ANY" && (
              <View style={[styles.inputGroup, { backgroundColor: Colors.backgroundSecondary, padding: 12, borderRadius: 8 }]}> 
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                  Shift:{" "}
                  <Text style={{ fontWeight: "700", color: job.shift_type === "MORNING" ? "#F59E0B" : "#6366F1" }}>
                    {job.shift_type === "MORNING" ? "Day Shift (8:00 AM - 5:00 PM)" : "Night Shift (6:00 PM - 12:00 AM)"}
                  </Text>
                </Text>
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

            {/* Submit Button */}
            <Text style={styles.termsText}>
              By proceeding you agree to our{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push("/legal/terms")}
              >
                terms
              </Text>{" "}
              and{" "}
              <Text
                style={styles.termsLink}
                onPress={() => router.push("/legal/privacy")}
              >
                policy
              </Text>
            </Text>
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

      {/* One-time payment education modal for workers (fires before first Apply) */}
      <InfoModal
        visible={showWorkerPaymentInfo && pendingApply}
        onClose={(dontShow) => {
          dismissWorkerPaymentInfo(dontShow);
          setPendingApply(false);
          setShowApplicationModal(true);
        }}
        title="How It Works"
        items={WORKER_PAYMENT_INFO_ITEMS}
      />

      {/* Worker Propose/Re-Propose Modal */}
      <Modal
        visible={showWorkerProposeModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowWorkerProposeModal(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
              <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.textPrimary, marginBottom: 16 }}>
                  Submit Price Proposal
                </Text>

                {job?.payment_model === "DAILY" ? (
                  <>
                    <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>Daily Rate (₱)</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: Colors.textPrimary }}
                      placeholder="e.g. 1200"
                      keyboardType="numeric"
                      returnKeyType="done"
                      value={workerProposeDailyRate}
                      onChangeText={setWorkerProposeDailyRate}
                    />
                    <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>Number of Days</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: Colors.textPrimary }}
                      placeholder="e.g. 5"
                      keyboardType="numeric"
                      returnKeyType="done"
                      value={workerProposeDays}
                      onChangeText={setWorkerProposeDays}
                    />
                    {workerProposeDailyRate && workerProposeDays && parseFloat(workerProposeDailyRate) > 0 && parseInt(workerProposeDays) > 0 && (
                      <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary, marginBottom: 12 }}>
                        Total: ₱{(parseFloat(workerProposeDailyRate) * parseInt(workerProposeDays)).toLocaleString()}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>Proposed Amount (₱)</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: Colors.textPrimary }}
                      placeholder="e.g. 5000"
                      keyboardType="numeric"
                      returnKeyType="done"
                      value={workerProposeAmount}
                      onChangeText={setWorkerProposeAmount}
                    />
                  </>
                )}

                <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>Message</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 16, color: Colors.textPrimary, minHeight: 80 }}
                  placeholder="Explain your proposed price..."
                  multiline
                  blurOnSubmit
                  returnKeyType="done"
                  value={workerProposeMessage}
                  onChangeText={setWorkerProposeMessage}
                />

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center" }}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowWorkerProposeModal(false);
                    }}
                  >
                    <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: Colors.primary, alignItems: "center" }}
                    onPress={handleWorkerSubmitProposal}
                    disabled={workerProposeMutation.isPending}
                  >
                    {workerProposeMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={{ color: "#FFF", fontWeight: "600" }}>Submit Proposal</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Client Counter-Offer Modal */}
      <Modal
        visible={counterModalApplicationId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setCounterModalApplicationId(null);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
              <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.textPrimary, marginBottom: 16 }}>
              Send Counter-Offer
            </Text>

            {job?.payment_model === "DAILY" ? (
              <>
                <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>Daily Rate (₱)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: Colors.textPrimary }}
                  placeholder="e.g. 1200"
                  keyboardType="numeric"
                  returnKeyType="done"
                  value={counterOfferRate}
                  onChangeText={setCounterOfferRate}
                />
                <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>Number of Days</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: Colors.textPrimary }}
                  placeholder="e.g. 5"
                  keyboardType="numeric"
                  returnKeyType="done"
                  value={counterOfferDays}
                  onChangeText={setCounterOfferDays}
                />
              </>
            ) : (
              <>
                <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>Proposed Budget (₱)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: Colors.textPrimary }}
                  placeholder="e.g. 5000"
                  keyboardType="numeric"
                  returnKeyType="done"
                  value={counterOfferAmount}
                  onChangeText={setCounterOfferAmount}
                />
              </>
            )}

            <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>Message</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 16, color: Colors.textPrimary, minHeight: 80 }}
              placeholder="Explain your counter-offer..."
              multiline
              blurOnSubmit
              returnKeyType="done"
              value={counterOfferMessage}
              onChangeText={setCounterOfferMessage}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center" }}
                onPress={() => {
                  Keyboard.dismiss();
                  setCounterModalApplicationId(null);
                }}
              >
                <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: Colors.primary, alignItems: "center" }}
                onPress={handleSubmitCounterOffer}
                disabled={counterOfferMutation.isPending}
              >
                {counterOfferMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>Send Counter</Text>
                )}
              </TouchableOpacity>
            </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    position: "relative",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
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
    textAlign: "center",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: Typography.fontSize.xs,
    fontWeight: "400",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  jobHeader: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jobTitleRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  jobTitle: {
    fontSize: 28, // Made larger as requested
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: 6,
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
  cancellationCard: {
    marginTop: 8,
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
  },
  cancellationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9A3412",
    marginBottom: 2,
  },
  cancellationLine: {
    fontSize: 12,
    color: "#9A3412",
  },
  jobCategory: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  detailsSection: {
    flexDirection: "column",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  detailCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: Colors.border,
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
  clientContactBlock: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  clientContactLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  clientContactValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  callClientButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  callClientButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  descriptionSection: {
    paddingTop: Spacing.lg,
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
    width: 150,
    height: 150,
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
  jobMetaInlineText: {
    fontSize: Typography.fontSize.sm,
    color: "#00BAF1",
    fontWeight: "600",
  },
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
  bottomCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    ...Shadows.small,
  },
  bottomCancelButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.error,
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
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    width: "100%",
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
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
  rejectedInfoBox: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  rejectedInfoText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    color: Colors.warning,
  },
  rejectedInfoReason: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  teamAgencyFallbackCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamAgencyFallbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  teamAgencyFallbackTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  teamAgencyFallbackMeta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  teamAgencyFallbackText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  teamAgencyFallbackReason: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  teamAgencyFallbackActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  teamAgencyFallbackInviteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  teamAgencyFallbackInviteText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    fontWeight: "600",
  },
  teamAgencyFallbackWorkerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  teamAgencyFallbackWorkerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  agencyModalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  agencyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  agencyModalTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  agencySearchInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  agencyPickerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  agencyPickerEmpty: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  agencyPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  agencyPickerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  agencyPickerName: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  agencyPickerMeta: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
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
    backgroundColor: "#00BAF1",
    borderRadius: BorderRadius.md,
  },
  acceptButtonText: {
    fontSize: Typography.fontSize.sm,
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
    fontSize: Typography.fontSize.sm,
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
    backgroundColor: "#EAF9FF",
    borderWidth: 1,
    borderColor: "#00BAF1",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  teamJobHeaderBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: "#00BAF1",
  },
  teamJobHeaderDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(0,186,241,0.35)",
  },
  teamJobHeaderCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: "#00BAF1",
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
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderDark,
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
    color: Colors.textSecondary,
    marginBottom: 2,
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
  viewChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 6,
    marginTop: Spacing.sm,
    width: "100%",
  },
  viewChatButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  viewGroupChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
    width: "100%",
  },
  viewGroupChatButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: "700",
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  termsText: {
    fontSize: 11,
    color: Colors.textHint,
    textAlign: "center",
    marginBottom: 8,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
});

// Chat Screen
// 1-on-1 messaging with real-time updates, image uploads, and offline support

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getErrorMessage } from "../../lib/utils/parse-api-error";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
  Modal,
  TextInput,
  Keyboard,
  ScrollView,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { safeGoBack } from "../../lib/hooks/useSafeBack";
import {
  useMessages,
  useSendMessageMutation,
  ApiResponseError,
  type ConversationDetail,
} from "../../lib/hooks/useMessages";
import {
  useMessageListener,
  useTypingIndicator,
  useWebSocketConnection,
} from "../../lib/hooks/useWebSocket";
import { useImageUpload } from "../../lib/hooks/useImageUpload";
import {
  useConfirmWorkStarted,
  useCancelJob,
  useMarkComplete,
  useApproveCompletion,
  useConfirmTeamWorkerArrival,
  useConfirmTeamEmployeeArrival,
  useMarkTeamAssignmentComplete,
  useApproveTeamJobCompletion,
  useProjectExtendOneDay,
  useProjectFinishJob,
  useDispatchProjectEmployee,
  useConfirmProjectArrival,
  useAgencyMarkProjectComplete,
  useApproveAgencyProjectJob,
  useEarlyCompleteSingleDailyJob,
  useProjectEarlyComplete,
} from "../../lib/hooks/useJobActions";
import {
  useEarlyCompleteWorker,
  useEarlyCompleteProjectWorker,
  useEarlyCompleteTeamEmployee,
} from "../../lib/hooks/useTeamJob";
import { useAuth } from "../../context/AuthContext";
import {
  useConfirmBackjobStarted,
  useMarkBackjobComplete,
  useApproveBackjobCompletion,
  useSetBackjobScheduledDate,
  useConfirmBackjobScheduledDate,
  useRequestBackjobRenegotiation,
  useReleasePaymentNow,
} from "../../lib/hooks/useBackjobActions";
import { useSubmitReview, useEditReview } from "../../lib/hooks/useReviews";
import { useSubmitReport } from "../../lib/hooks/useReports";
import { useAgoraCall } from "../../lib/hooks/useAgoraCall";
import {
  useCancelDailyJob,
  useWorkerCheckIn,
  useWorkerCancelCheckIn,
  useClientConfirmAttendance,
  useClientMarkNoWork,
  useClientVerifyArrival,
  useClientMarkCheckout,
  useRequestDailySkipDay,
  useClientReviewDailySkipDay,
  useClientQASkipNextDay,
  useDailyExtendOneDay,
  useDailyFinishJob,
} from "../../lib/hooks/useDailyPayment";
import { ENDPOINTS } from "../../lib/api/config";
import MessageBubble from "../../components/MessageBubble";
import MessageInput from "../../components/MessageInput";
import { ImageMessage } from "../../components/ImageMessage";
import { TypingIndicator } from "../../components/TypingIndicator";
import { EstimatedTimeCard } from "../../components";
import JobReceiptModal from "../../components/JobReceiptModal";
import {
  useApproveMaterialPurchase,
  useRejectMaterialPurchase,
  useMarkMaterialsBuying,
  useUploadPurchaseProof,
  useSkipMaterialsStep,
} from "../../lib/hooks/useJobMaterials";
import { useCreateFinalPayment } from "../../lib/hooks/useFinalPayment";

const AGORA_AVAILABLE = process.env.EXPO_PUBLIC_ENABLE_VOICE_CALLS !== "false";
import type { JobMaterialItem } from "../../lib/hooks/useMessages";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "../../constants/theme";
import { isSameDay, format } from "date-fns";
import {
  addToQueue,
  getPendingMessages,
  isOnline,
} from "../../lib/services/offline-queue";
import NetInfo from "@react-native-community/netinfo";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CountdownConfirmModal from "../../components/CountdownConfirmModal";
import Toast from "react-native-toast-message";

type EditableReviewTarget = {
  review_id: number;
  target_type: "EMPLOYEE" | "AGENCY" | "TEAM_WORKER" | "USER";
  target_id: number | null;
  target_name: string;
  can_edit: boolean;
  rating_quality: number;
  rating_communication: number;
  rating_punctuality: number;
  rating_professionalism: number;
  comment: string;
};

function parseExpectedDurationDays(expectedDuration?: string | null): number {
  if (!expectedDuration) return 1;

  const text = String(expectedDuration).trim().toLowerCase();
  if (!text) return 1;

  const unitMatch = text.match(/(\d+)\s*-?\s*(day|days|week|weeks|wk|wks)\b/);
  if (unitMatch) {
    const value = Number(unitMatch[1] || 1);
    const unit = unitMatch[2] || "day";
    return unit.startsWith("week") || unit.startsWith("wk")
      ? Math.max(1, value * 7)
      : Math.max(1, value);
  }

  // Handle simple numeric input like "2".
  const plainNumber = Number(text);
  if (Number.isFinite(plainNumber) && plainNumber > 0) {
    return Math.max(1, Math.floor(plainNumber));
  }

  return 1;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const conversationId = parseInt(params.conversationId as string);
  const routerHook = useRouter(); // For safe back navigation

  const flatListRef = useRef<FlatList>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentActionMode, setPaymentActionMode] = useState<
    "APPROVE_COMPLETION" | "PAY_NOW" | "APPROVE_SOLO_DAILY_COMPLETION"
  >("APPROVE_COMPLETION");
  const [showCashUploadModal, setShowCashUploadModal] = useState(false);
  const [isBulkDailySettlementInFlight, setIsBulkDailySettlementInFlight] =
    useState(false);
  const [isApprovePayPreflightInFlight, setIsApprovePayPreflightInFlight] =
    useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<
    "submit" | "view" | "edit"
  >("submit");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const submitReportMutation = useSubmitReport();
  const [countdownConfig, setCountdownConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmStyle?: "default" | "destructive";
    countdownSeconds: number;
    onConfirm: () => void;
    icon?: string;
    iconColor?: string;
  } | null>(null);
  const [showBackjobScheduleModal, setShowBackjobScheduleModal] =
    useState(false);
  const [backjobScheduleInput, setBackjobScheduleInput] = useState("");
  const [backjobScheduleDate, setBackjobScheduleDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [localBackjobScheduleConfirmed, setLocalBackjobScheduleConfirmed] =
    useState(false);

  // Review state - Multi-criteria ratings
  const [ratingQuality, setRatingQuality] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingPunctuality, setRatingPunctuality] = useState(0);
  const [ratingProfessionalism, setRatingProfessionalism] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  // For agency jobs: track if we're reviewing employee or agency
  const [reviewStep, setReviewStep] = useState<"EMPLOYEE" | "AGENCY">(
    "EMPLOYEE",
  );
  const [employeeReviewSubmitted, setEmployeeReviewSubmitted] = useState(false);
  // Prevent stale review flags from trapping the modal while backend state is syncing.
  const [reviewStatusSyncing, setReviewStatusSyncing] = useState(false);
  // Optimistic guard for agency-client review completion while server flags sync.
  const [
    localAgencyClientReviewSubmitted,
    setLocalAgencyClientReviewSubmitted,
  ] = useState(false);
  // For multi-employee agency jobs: track current employee index
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);
  const [currentEditableReviewIndex, setCurrentEditableReviewIndex] =
    useState(0);
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const toggleAttendanceExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAttendanceExpanded((prev) => !prev);
  }, []);

  // Price input modal - cross-platform replacement for Alert.prompt (iOS-only)
  const [priceModal, setPriceModal] = useState<{
    visible: boolean;
    matId: number;
    matName: string;
    imageUri: string;
    jobId: number;
  } | null>(null);
  const [priceInputText, setPriceInputText] = useState("");
  // For team jobs: track current worker being reviewed
  const [currentTeamWorkerIndex, setCurrentTeamWorkerIndex] = useState(0);
  const skipExtendPromptedKeysRef = useRef<Set<string>>(new Set());

  // Get current user for role-aware rendering and team assignment identification
  const { user } = useAuth();

  const messageViewerKey = `${user?.accountID ?? "anon"}:${user?.profile_data?.profileType ?? "UNKNOWN"}`;

  // Fetch conversation and messages
  const {
    data: rawConversation,
    isLoading,
    isError,
    error,
    refetch,
  } = useMessages(conversationId, messageViewerKey);

  const conversation = rawConversation as ConversationDetail | undefined;

  useEffect(() => {
    setLocalAgencyClientReviewSubmitted(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversation?.backjob?.has_backjob) {
      setLocalBackjobScheduleConfirmed(false);
      return;
    }

    if (
      conversation.backjob.worker_schedule_confirmed ||
      conversation.backjob.my_schedule_confirmed
    ) {
      setLocalBackjobScheduleConfirmed(true);
      return;
    }

    setLocalBackjobScheduleConfirmed(false);
  }, [
    conversation?.backjob?.has_backjob,
    conversation?.backjob?.dispute_id,
    conversation?.backjob?.scheduled_date,
    conversation?.backjob?.worker_schedule_confirmed,
    conversation?.backjob?.my_schedule_confirmed,
  ]);

  const formatPossessive = (name: string) => {
    if (!name) {
      return "";
    }
    return name.endsWith("s") ? `${name}'` : `${name}'s`;
  };

  const resolveMyReviewerName = () => {
    if (!conversation) {
      return "You";
    }

    const myReview =
      conversation.my_role === "CLIENT"
        ? conversation.client_review
        : conversation.worker_review;

    if (myReview?.reviewer_name) {
      return myReview.reviewer_name;
    }

    if (conversation.my_role === "CLIENT") {
      const firstName = user?.profile_data?.firstName?.trim() || "";
      const lastName = user?.profile_data?.lastName?.trim() || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || "Client";
    }

    if (conversation.my_role === "AGENCY") {
      return "Agency";
    }

    return "Worker";
  };

  const resolveCounterpartyTitle = () => {
    if (!conversation) {
      return "Counterparty Review";
    }

    if (conversation.my_role === "CLIENT") {
      if (conversation.is_team_job) {
        return "Team Reviews";
      }
      const counterpartyName =
        conversation.worker_review?.reviewer_name ||
        conversation.other_participant?.name ||
        (conversation.is_agency_job ? "Agency" : "Worker");
      return `${formatPossessive(counterpartyName)} Review`;
    }

    const clientName =
      conversation.client_review?.reviewer_name ||
      conversation.other_participant?.name ||
      "Client";
    return `${formatPossessive(clientName)} Review`;
  };

  // For agency jobs: Auto-set review step based on what's already reviewed
  useEffect(() => {
    if (conversation?.is_agency_job && conversation.job) {
      const nextAction = conversation.job.next_review_action;
      if (nextAction === "AGENCY") {
        setReviewStep("AGENCY");
        setEmployeeReviewSubmitted(true);
        return;
      }
      if (nextAction === "EMPLOYEE") {
        setReviewStep("EMPLOYEE");
        setEmployeeReviewSubmitted(false);
        return;
      }

      if (nextAction === null && conversation.job.agencyReviewed) {
        setEmployeeReviewSubmitted(true);
        return;
      }

      // Multi-employee support: check pending_employee_reviews array
      const pendingEmployees = conversation.pending_employee_reviews || [];
      const allEmployeesReviewed = conversation.all_employees_reviewed;

      if (allEmployeesReviewed && !conversation.job.agencyReviewed) {
        // All employees reviewed, now rate the agency
        setReviewStep("AGENCY");
        setEmployeeReviewSubmitted(true);
      } else if (pendingEmployees.length === 0 && !allEmployeesReviewed) {
        // Legacy: single employee check for backwards compatibility
        if (
          conversation.job.employeeReviewed &&
          !conversation.job.agencyReviewed
        ) {
          setReviewStep("AGENCY");
          setEmployeeReviewSubmitted(true);
        }
      }
    }
  }, [
    conversation?.is_agency_job,
    conversation?.job?.next_review_action,
    conversation?.job?.review_progress,
    conversation?.job?.employeeReviewed,
    conversation?.job?.agencyReviewed,
    conversation?.pending_employee_reviews,
    conversation?.all_employees_reviewed,
  ]);

  // Clear temporary review-sync bypass once server flags are updated.
  useEffect(() => {
    if (!conversation) return;

    const agencyEmployeesReviewed =
      (conversation.all_employees_reviewed ?? false) ||
      (conversation.job.employeeReviewed ?? false) ||
      (conversation.pending_employee_reviews?.length ?? 0) === 0;

    const clientReviewDone = conversation.is_team_job
      ? !!conversation.all_team_workers_reviewed
      : conversation.is_agency_job
        ? // Prefer backend-computed clientReviewed; keep a defensive fallback.
          !!conversation.job.clientReviewed ||
          (!!conversation.job.agencyReviewed && agencyEmployeesReviewed)
        : !!conversation.job.clientReviewed;

    if (clientReviewDone) {
      setReviewStatusSyncing(false);
    }
  }, [
    conversation,
    conversation?.is_team_job,
    conversation?.is_agency_job,
    conversation?.all_team_workers_reviewed,
    conversation?.all_employees_reviewed,
    conversation?.pending_employee_reviews,
    conversation?.job?.clientReviewed,
    conversation?.job?.employeeReviewed,
    conversation?.job?.agencyReviewed,
  ]);

  // Check if conversation is closed (both parties reviewed)
  // BUT if there's an APPROVED backjob (UNDER_REVIEW status), conversation should stay open
  // OPEN status means waiting for admin approval - conversation should remain closed
  const hasApprovedBackjob =
    conversation?.backjob?.has_backjob === true &&
    conversation?.backjob?.status === "UNDER_REVIEW";
  // IN_NEGOTIATION: admin has joined to negotiate — keeps conversation open
  const hasActiveNegotiation =
    conversation?.backjob?.has_backjob === true &&
    conversation?.backjob?.status === "IN_NEGOTIATION";
  const isBackjobCompleted =
    (conversation?.backjob?.has_backjob === true &&
      (conversation?.backjob?.status === "COMPLETED" ||
        conversation?.backjob?.status === "RESOLVED")) ||
    // Server clears has_backjob after completion — use total count as fallback
    (!conversation?.backjob?.has_backjob &&
      (conversation?.backjob?.total_backjobs_for_job ?? 0) > 0);

  const hasAgencyEmployeeReviewsCompleted = !!(
    conversation?.is_agency_job &&
    ((conversation?.all_employees_reviewed ?? false) ||
      (conversation?.job?.employeeReviewed ?? false) ||
      (conversation?.pending_employee_reviews?.length ?? 0) === 0)
  );

  const agencyNextReviewAction =
    conversation?.is_agency_job && conversation?.my_role === "CLIENT"
      ? (conversation?.job?.next_review_action ?? null)
      : null;

  const effectiveAgencyReviewStep: "EMPLOYEE" | "AGENCY" =
    agencyNextReviewAction === "AGENCY"
      ? "AGENCY"
      : agencyNextReviewAction === "EMPLOYEE"
        ? "EMPLOYEE"
        : reviewStep;

  const canUnlockBackjobEditWindow =
    conversation?.backjob?.status === "COMPLETED";

  const editableReviewTargetsFromApi: EditableReviewTarget[] = (
    conversation?.my_editable_reviews || []
  )
    .filter(
      (review) => !!review && (!!review.can_edit || canUnlockBackjobEditWindow),
    )
    .map((review) => ({
      review_id: review.review_id,
      target_type: review.target_type,
      target_id: review.target_id,
      target_name: review.target_name,
      can_edit: review.can_edit,
      rating_quality: review.rating_quality,
      rating_communication: review.rating_communication,
      rating_punctuality: review.rating_punctuality,
      rating_professionalism: review.rating_professionalism,
      comment: review.comment,
    }));

  const myOwnReviewForBackjobEdit =
    conversation?.my_role === "CLIENT"
      ? conversation?.client_review
      : conversation?.worker_review;

  const canUseOwnReviewFallbackForEdit =
    canUnlockBackjobEditWindow && !!myOwnReviewForBackjobEdit?.review_id;

  const ownReviewFallbackTarget: EditableReviewTarget | null =
    canUseOwnReviewFallbackForEdit && myOwnReviewForBackjobEdit?.review_id
      ? {
          review_id: myOwnReviewForBackjobEdit.review_id,
          target_type: "USER",
          target_id: null,
          target_name:
            conversation?.other_participant?.name ||
            (conversation?.my_role === "CLIENT" ? "Worker" : "Client"),
          can_edit: true,
          rating_quality: myOwnReviewForBackjobEdit.rating_quality || 0,
          rating_communication:
            myOwnReviewForBackjobEdit.rating_communication || 0,
          rating_punctuality: myOwnReviewForBackjobEdit.rating_punctuality || 0,
          rating_professionalism:
            myOwnReviewForBackjobEdit.rating_professionalism || 0,
          comment: myOwnReviewForBackjobEdit.comment || "",
        }
      : null;

  const editableReviewTargets: EditableReviewTarget[] =
    !!ownReviewFallbackTarget &&
    !editableReviewTargetsFromApi.some(
      (review) => review.review_id === myOwnReviewForBackjobEdit?.review_id,
    )
      ? [...editableReviewTargetsFromApi, ownReviewFallbackTarget]
      : editableReviewTargetsFromApi;

  const activeEditableReview: EditableReviewTarget | null =
    reviewModalMode === "edit"
      ? editableReviewTargets[currentEditableReviewIndex] || null
      : null;
  const editableReviewTargetsRef = useRef<EditableReviewTarget[]>([]);

  useEffect(() => {
    editableReviewTargetsRef.current = editableReviewTargets;
  }, [editableReviewTargets]);

  const resetReviewInputs = () => {
    setRatingQuality(0);
    setRatingCommunication(0);
    setRatingPunctuality(0);
    setRatingProfessionalism(0);
    setReviewComment("");
  };

  const hydrateReviewInputs = (review: EditableReviewTarget) => {
    setRatingQuality(review.rating_quality || 0);
    setRatingCommunication(review.rating_communication || 0);
    setRatingPunctuality(review.rating_punctuality || 0);
    setRatingProfessionalism(review.rating_professionalism || 0);
    setReviewComment(review.comment || "");
  };

  const clientHasReviewedAgencyFlow = !!(
    conversation?.is_agency_job &&
    // Use API aggregate first; fallback to split flags for safety.
    (conversation?.job?.clientReviewed ||
      localAgencyClientReviewSubmitted ||
      (conversation?.job?.next_review_action === null &&
        (conversation?.my_editable_reviews?.length ?? 0) > 0) ||
      (hasAgencyEmployeeReviewsCompleted &&
        agencyNextReviewAction === null &&
        !!conversation?.job?.agencyReviewed))
  );

  const viewerHasReviewed = !!(
    conversation &&
    (() => {
      if (conversation.my_role === "CLIENT") {
        if (conversation.is_team_job) {
          return !!conversation.all_team_workers_reviewed;
        }
        if (conversation.is_agency_job) {
          return clientHasReviewedAgencyFlow;
        }
        return !!conversation.job.clientReviewed;
      }

      // WORKER or AGENCY reviewer completion flag
      return !!conversation.job.workerReviewed;
    })()
  );

  const counterpartyHasReviewed = !!(
    conversation &&
    (() => {
      if (conversation.my_role === "CLIENT") {
        // Counterparty is worker/agency
        return !!conversation.job.workerReviewed;
      }

      // Counterparty is client
      if (conversation.is_team_job) {
        // Team closure must use aggregate client review completion for all workers.
        return !!conversation.all_team_workers_reviewed;
      }
      if (conversation.is_agency_job) {
        return clientHasReviewedAgencyFlow;
      }
      return !!conversation.job.clientReviewed;
    })()
  );

  const clientHasReviewed = !!(
    conversation &&
    (() => {
      if (conversation.is_team_job) {
        return !!conversation.all_team_workers_reviewed;
      }

      if (conversation.is_agency_job) {
        return clientHasReviewedAgencyFlow;
      }

      return !!conversation.job.clientReviewed;
    })()
  );

  // For team jobs: clientReviewed becomes true after reviewing just 1 worker,
  // so we must use all_team_workers_reviewed to prevent premature conversation closure
  const clientHasFullyReviewed = clientHasReviewed;
  const normalizedConversationStatus = (
    conversation?.status || ""
  ).toUpperCase();
  const normalizedJobStatus = (
    conversation?.job?.effective_status ||
    conversation?.job?.status ||
    ""
  ).toUpperCase();
  const hasCancellationCompatFlag = conversation?.job?.is_cancelled === true;
  const isJobCompleted = normalizedJobStatus === "COMPLETED";
  const isJobCancelled =
    normalizedJobStatus === "CANCELLED" || hasCancellationCompatFlag;
  const isJobInProgress = normalizedJobStatus === "IN_PROGRESS";
  const isJobActive = normalizedJobStatus === "ACTIVE";
  const isJobAssigned = normalizedJobStatus === "ASSIGNED";
  const isRegularJobTerminal =
    normalizedJobStatus === "COMPLETED" || normalizedJobStatus === "CANCELLED";
  const isStartDateActionLocked =
    !!conversation?.job?.preferred_start_date &&
    (() => {
      const start = new Date(conversation.job.preferred_start_date as string);
      start.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now < start;
    })();
  const canUseRegularProjectActions =
    (isJobInProgress || isJobActive || isJobAssigned) && !isStartDateActionLocked;
  const isServerMarkedClosed = normalizedConversationStatus === "COMPLETED";
  const isConversationArchived = !!conversation?.is_archived;
  const isCancelledConversationTerminal =
    isJobCancelled && !hasApprovedBackjob && !hasActiveNegotiation;
  const computedConversationClosed =
    isCancelledConversationTerminal ||
    (conversation?.job?.clientMarkedComplete &&
      viewerHasReviewed &&
      counterpartyHasReviewed &&
      !hasApprovedBackjob &&
      !hasActiveNegotiation) ||
    // Fallback for legacy DAILY payloads where completion can lag on clientMarkedComplete.
    (isJobCompleted &&
      viewerHasReviewed &&
      counterpartyHasReviewed &&
      !hasApprovedBackjob &&
      !hasActiveNegotiation) ||
    // Team DAILY final-day fallback: once final payment is captured and both reviews
    // are done, force post-completion conversation state even if status fields lag.
    (conversation?.is_team_job &&
      conversation?.job?.payment_model === "DAILY" &&
      conversation?.job?.remainingPaymentPaid &&
      viewerHasReviewed &&
      counterpartyHasReviewed &&
      !hasApprovedBackjob &&
      !hasActiveNegotiation);
  const isConversationClosed =
    isServerMarkedClosed ||
    isConversationArchived ||
    computedConversationClosed;
  // True as soon as client approves completion — before both reviews are submitted.
  // Drives post-completion UI (banner, backjob section) without waiting for full closure.
  const isJobTerminalForUI =
    isConversationClosed ||
    ((isJobCompleted || !!conversation?.job?.clientMarkedComplete) &&
      !isJobCancelled) ||
    // Team DAILY final-day fallback for stale completion flags.
    (conversation?.is_team_job &&
      conversation?.job?.payment_model === "DAILY" &&
      conversation?.job?.remainingPaymentPaid &&
      !isJobCancelled);
  const isPaymentReleased =
    conversation?.job?.paymentBuffer?.is_payment_released === true;

  const cancellationActorLabel = (() => {
    const role = (conversation?.job?.cancelled_by_role || "").toUpperCase();
    if (role === "CLIENT") return "client";
    if (role === "WORKER" || role === "EMPLOYEE" || role === "TEAM_WORKER") {
      return "worker";
    }
    if (role === "AGENCY") return "agency";
    if (role === "ADMIN") return "admin";
    if (role === "SYSTEM") return "system";

    const reason = (conversation?.job?.cancellation_reason || "").trim();
    const reasonRoleMatch = reason.match(/^\s*(client|worker|agency|admin)\b/i);
    if (reasonRoleMatch?.[1]) {
      return reasonRoleMatch[1].toLowerCase();
    }

    if (conversation?.my_role === "CLIENT") return "worker";
    if (conversation?.my_role === "WORKER") return "client";
    if (conversation?.my_role === "AGENCY") return "client";
    return "user";
  })();

  const cancellationReason =
    conversation?.job?.cancellation_reason?.trim() || "no reason provided";

  const hasCancellationSystemMessage = !!conversation?.messages?.some(
    (msg) =>
      msg.message_type === "SYSTEM" &&
      typeof msg.message_text === "string" &&
      /job\s+is\s+cancelled|job\s+cancelled/i.test(msg.message_text),
  );

  const chatMessages =
    conversation && isJobCancelled && !hasCancellationSystemMessage
      ? [
          ...conversation.messages,
          {
            sender_name: "System",
            sender_avatar: "",
            message_text: `Job is cancelled by ${cancellationActorLabel} due to: ${cancellationReason}`,
            message_type: "SYSTEM",
            is_read: true,
            created_at:
              conversation.job.cancelled_at ||
              conversation.messages[conversation.messages.length - 1]
                ?.created_at ||
              new Date().toISOString(),
            is_mine: false,
            sender_type: "system",
            message_id: -1,
          },
        ]
      : conversation?.messages || [];

  // User can submit a review once completion/payment requirements are met.
  // Do not depend on conversation closed flags here because those can be stale.
  // Reviews are only available AFTER the client has paid the final payment.
  const canSubmitReview = !!(
    conversation?.job &&
    !reviewStatusSyncing &&
    conversation.job.remainingPaymentPaid &&
    (conversation.job.clientMarkedComplete || isJobCompleted) &&
    !hasApprovedBackjob &&
    !viewerHasReviewed
  );

  // Force review before exiting when user is currently expected to review.
  const needsReview = canSubmitReview;

  const openReviewModalSafely = (
    mode: "submit" | "view" | "edit" = "submit",
  ) => {
    // Guard against stale UI windows right after submit/refetch.
    if (mode === "submit" && (viewerHasReviewed || reviewStatusSyncing)) {
      Alert.alert(
        "Already Reviewed",
        "Your review is already recorded. Refreshing conversation status.",
      );
      return;
    }

    if (mode === "edit") {
      if (!editableReviewTargets.length) {
        Alert.alert(
          "No Editable Review",
          "You currently have no editable reviews for this conversation.",
        );
        return;
      }

      setCurrentEditableReviewIndex(0);
      hydrateReviewInputs(editableReviewTargets[0]);
    }

    setReviewModalMode(mode);
    setShowReviewModal(true);
  };

  useEffect(() => {
    if (reviewModalMode !== "edit" || !showReviewModal) return;
    if (!activeEditableReview) return;

    hydrateReviewInputs(activeEditableReview);
  }, [reviewModalMode, showReviewModal, currentEditableReviewIndex]);

  // Allow Android hardware back even when review is pending.
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, []);

  // Send message mutation
  const sendMutation = useSendMessageMutation();

  // Job action mutations
  const confirmWorkStartedMutation = useConfirmWorkStarted();
  const cancelJobMutation = useCancelJob();
  const markCompleteMutation = useMarkComplete();
  const approveCompletionMutation = useApproveCompletion();
  const submitReviewMutation = useSubmitReview();
  const editReviewMutation = useEditReview();
  const isReviewMutationPending =
    submitReviewMutation.isPending || editReviewMutation.isPending;
  const confirmTeamWorkerArrivalMutation = useConfirmTeamWorkerArrival();
  const confirmTeamEmployeeArrivalMutation = useConfirmTeamEmployeeArrival();
  const markTeamAssignmentCompleteMutation = useMarkTeamAssignmentComplete();
  const approveTeamJobCompletionMutation = useApproveTeamJobCompletion();
  const projectExtendOneDayMutation = useProjectExtendOneDay();
  const projectFinishJobMutation = useProjectFinishJob();

  // Agency PROJECT job mutations
  const dispatchProjectEmployeeMutation = useDispatchProjectEmployee();
  const confirmProjectArrivalMutation = useConfirmProjectArrival();
  const agencyMarkProjectCompleteMutation = useAgencyMarkProjectComplete();
  const approveAgencyProjectJobMutation = useApproveAgencyProjectJob();
  const createFinalPaymentMutation = useCreateFinalPayment();

  // Daily attendance mutations
  const workerCheckInMutation = useWorkerCheckIn();
  const workerCancelCheckInMutation = useWorkerCancelCheckIn();
  const clientConfirmAttendanceMutation = useClientConfirmAttendance();
  const clientMarkNoWorkMutation = useClientMarkNoWork();
  const clientVerifyArrivalMutation = useClientVerifyArrival();
  const clientMarkCheckoutMutation = useClientMarkCheckout();
  const cancelDailyJobMutation = useCancelDailyJob();
  const requestDailySkipDayMutation = useRequestDailySkipDay();
  const clientReviewDailySkipDayMutation = useClientReviewDailySkipDay();
  const clientQASkipNextDayMutation = useClientQASkipNextDay();
  const dailyExtendOneDayMutation = useDailyExtendOneDay();
  const dailyFinishJobMutation = useDailyFinishJob();
  const earlyCompleteSingleDailyMutation = useEarlyCompleteSingleDailyJob();
  const projectEarlyCompleteMutation = useProjectEarlyComplete();
  const earlyCompleteTeamWorkerDailyMutation = useEarlyCompleteWorker();
  const earlyCompleteTeamWorkerProjectMutation = useEarlyCompleteProjectWorker();
  const earlyCompleteTeamEmployeeMutation = useEarlyCompleteTeamEmployee();

  // Voice calling
  const { initiateCall, callStatus, error: callError } = useAgoraCall();

  // Backjob action mutations
  const confirmBackjobStartedMutation = useConfirmBackjobStarted();
  const markBackjobCompleteMutation = useMarkBackjobComplete();
  const approveBackjobCompletionMutation = useApproveBackjobCompletion();
  const setBackjobScheduledDateMutation = useSetBackjobScheduledDate();
  const confirmBackjobScheduledDateMutation = useConfirmBackjobScheduledDate();
  const requestBackjobRenegotiationMutation = useRequestBackjobRenegotiation();
  const releasePaymentNowMutation = useReleasePaymentNow();

  const parseScheduledDate = (dateStr?: string | null): Date | null => {
    if (!dateStr) return null;

    // Preserve date-only semantics from YYYY-MM-DD without timezone drift.
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(year, month, day);
    }

    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return null;

    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const normalizeDateOnly = (value: Date): Date => {
    const normalized = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
    );
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const formatDateOnly = (value: Date): string => {
    const normalized = normalizeDateOnly(value);
    const year = normalized.getFullYear();
    const month = `${normalized.getMonth() + 1}`.padStart(2, "0");
    const day = `${normalized.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const scheduledBackjobDate = parseScheduledDate(
    conversation?.backjob?.scheduled_date,
  );
  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);
  const isBackjobScheduledForFuture =
    !!hasApprovedBackjob &&
    !!scheduledBackjobDate &&
    !conversation?.backjob?.backjob_started &&
    todayLocal < scheduledBackjobDate;
  const isBackjobScheduleMissing =
    !!hasApprovedBackjob &&
    !scheduledBackjobDate &&
    !conversation?.backjob?.backjob_started;
  const teamScheduleTotalWorkers =
    conversation?.backjob?.team_schedule_total_workers ?? 0;
  const teamScheduleConfirmedCount =
    conversation?.backjob?.team_schedule_confirmed_count ?? 0;
  const effectiveWorkerScheduleConfirmed =
    conversation?.backjob?.worker_schedule_confirmed === true ||
    localBackjobScheduleConfirmed;
  const myBackjobScheduleConfirmed =
    conversation?.backjob?.my_schedule_confirmed === true ||
    localBackjobScheduleConfirmed;

  const agencyAssignedEmployees = conversation?.is_agency_job
    ? conversation?.assigned_employees || []
    : Array.isArray(conversation?.team_agency_employees)
      ? conversation.team_agency_employees
      : [];
  // Backward compatibility: some legacy team backjob payloads can miss/lag
  // is_team_job, but still include team_worker_assignments.
  const teamAssignedWorkers = useMemo(
    () =>
      Array.isArray(conversation?.team_worker_assignments)
        ? conversation.team_worker_assignments
        : [],
    [conversation?.team_worker_assignments],
  );

  const groupedTeamWorkerAssignments = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        account_id: number | null;
        worker_id: number | null;
        name: string;
        avatar?: string | null;
        assignment_ids: number[];
        skills: string[];
        client_confirmed_arrival: boolean;
        worker_marked_complete: boolean;
        client_confirmed_arrival_at: string | null;
        worker_marked_complete_at: string | null;
      }
    >();

    for (const raw of teamAssignedWorkers) {
      const assignmentId = Number(raw?.assignment_id);
      if (!Number.isFinite(assignmentId)) continue;

      const accountId = Number(raw?.account_id);
      const workerId = Number(raw?.worker_id);
      const groupKey = Number.isFinite(accountId)
        ? `acct-${accountId}`
        : Number.isFinite(workerId)
          ? `worker-${workerId}`
          : `assignment-${assignmentId}`;

      const existing = groups.get(groupKey);
      const skill = String(raw?.skill || "").trim();
      const arrived = Boolean(raw?.client_confirmed_arrival);
      const complete = Boolean(raw?.worker_marked_complete);

      if (!existing) {
        groups.set(groupKey, {
          key: groupKey,
          account_id: Number.isFinite(accountId) ? accountId : null,
          worker_id: Number.isFinite(workerId) ? workerId : null,
          name: raw?.name || "Worker",
          avatar: raw?.avatar || null,
          assignment_ids: [assignmentId],
          skills: skill ? [skill] : [],
          client_confirmed_arrival: arrived,
          worker_marked_complete: complete,
          client_confirmed_arrival_at: raw?.client_confirmed_arrival_at || null,
          worker_marked_complete_at: raw?.worker_marked_complete_at || null,
        });
        continue;
      }

      existing.assignment_ids.push(assignmentId);
      if (skill && !existing.skills.includes(skill)) {
        existing.skills.push(skill);
      }
      existing.client_confirmed_arrival =
        existing.client_confirmed_arrival || arrived;
      existing.worker_marked_complete =
        existing.worker_marked_complete || complete;
      if (!existing.client_confirmed_arrival_at && raw?.client_confirmed_arrival_at) {
        existing.client_confirmed_arrival_at = raw.client_confirmed_arrival_at;
      }
      if (!existing.worker_marked_complete_at && raw?.worker_marked_complete_at) {
        existing.worker_marked_complete_at = raw.worker_marked_complete_at;
      }
    }

    return Array.from(groups.values());
  }, [teamAssignedWorkers]);

  const totalTeamWorkerAssignmentCount = teamAssignedWorkers.length;
  const backjobAttendanceRows = Array.isArray(conversation?.attendance_today)
    ? conversation.attendance_today
    : [];

  const isClientBackjobStartFlow =
    conversation?.my_role === "CLIENT" &&
    !!conversation?.backjob?.has_backjob &&
    !conversation?.backjob?.backjob_started;

  const isWorkerSideBackjobActor =
    conversation?.my_role === "WORKER" || conversation?.my_role === "AGENCY";

  const backjobCycleStartMs = conversation?.backjob
    ?.worker_schedule_confirmed_at
    ? new Date(conversation.backjob.worker_schedule_confirmed_at).getTime()
    : null;

  const isAgencyStatusInCurrentBackjobCycle = (
    statusFlag?: boolean,
    statusAt?: string | null,
  ) => {
    if (!statusFlag) return false;

    if (!isClientBackjobStartFlow) {
      return true;
    }

    if (!backjobCycleStartMs) {
      return true;
    }

    // Backward compatibility: older in-progress jobs may have boolean dispatch/
    // arrival state but missing timestamp fields.
    if (!statusAt) {
      return true;
    }

    const statusMs = new Date(statusAt).getTime();
    if (!Number.isFinite(statusMs)) {
      return true;
    }

    return statusMs >= backjobCycleStartMs;
  };

  const getAgencyDispatchedFlag = (employee: any) =>
    Boolean(employee?.dispatched);

  const getAgencyDispatchedAt = (employee: any): string | null =>
    employee?.dispatchedAt ?? employee?.dispatched_at ?? null;

  const getAgencyArrivedFlag = (employee: any) =>
    Boolean(
      employee?.clientConfirmedArrival ?? employee?.client_confirmed_arrival,
    );

  const getAgencyArrivedAt = (employee: any): string | null =>
    employee?.clientConfirmedArrivalAt ??
    employee?.client_confirmed_arrival_at ??
    null;

  const getAgencyCompletionAt = (employee: any): string | null =>
    employee?.agencyMarkedCompleteAt ??
    employee?.agency_marked_complete_at ??
    employee?.employeeMarkedCompleteAt ??
    employee?.employee_marked_complete_at ??
    employee?.marked_complete_at ??
    null;

  const isTeamArrivalInCurrentBackjobCycle = (
    arrivedFlag?: boolean,
    arrivedAt?: string | null,
    workerMarkedComplete?: boolean,
    workerMarkedCompleteAt?: string | null,
  ) => {
    if (!arrivedFlag) return false;

    if (!isClientBackjobStartFlow) {
      return true;
    }

    if (!backjobCycleStartMs) {
      return true;
    }

    // Backward compatibility: older team backjob rows can have boolean arrival
    // without timestamps. If there is downstream progress, treat arrival as valid.
    if (!arrivedAt) {
      if (workerMarkedComplete) {
        return true;
      }

      if (workerMarkedCompleteAt) {
        const completeMs = new Date(workerMarkedCompleteAt).getTime();
        if (Number.isFinite(completeMs) && completeMs >= backjobCycleStartMs) {
          return true;
        }
      }

      return true;
    }

    const arrivedMs = new Date(arrivedAt).getTime();
    return Number.isFinite(arrivedMs) && arrivedMs >= backjobCycleStartMs;
  };

  const getTeamAttendanceBackjobSignals = (worker: any) => {
    const matchedAttendance = backjobAttendanceRows.find((row: any) => {
      if (row?.awaiting_worker) {
        return false;
      }

      const rowAccountId = Number(row?.worker_account_id);
      const rowWorkerId = Number(row?.worker_id);
      const workerAccountId = Number(worker?.account_id);
      const workerId = Number(worker?.worker_id);

      const accountMatch =
        Number.isFinite(rowAccountId) &&
        Number.isFinite(workerAccountId) &&
        rowAccountId === workerAccountId;
      const workerMatch =
        Number.isFinite(rowWorkerId) &&
        Number.isFinite(workerId) &&
        rowWorkerId === workerId;

      return accountMatch || workerMatch;
    });

    if (!matchedAttendance) {
      return null;
    }

    const rowStatus = String(matchedAttendance?.status || "").toUpperCase();
    return {
      arrived:
        Boolean(matchedAttendance?.client_confirmed) ||
        Boolean(matchedAttendance?.time_in) ||
        Boolean(matchedAttendance?.time_out) ||
        ["PENDING", "PRESENT", "HALF_DAY", "COMPLETED"].includes(rowStatus),
      completed:
        Boolean(matchedAttendance?.time_out) ||
        ["PRESENT", "HALF_DAY", "COMPLETED"].includes(rowStatus),
    };
  };

  const isTeamCompletionInCurrentBackjobCycle = (
    workerMarkedComplete?: boolean,
    workerMarkedCompleteAt?: string | null,
    attendanceCompleted?: boolean,
  ) => {
    const hasCompletionSignal =
      Boolean(workerMarkedComplete) || Boolean(attendanceCompleted);
    if (!hasCompletionSignal) return false;

    if (!isClientBackjobStartFlow) {
      return true;
    }

    if (!backjobCycleStartMs) {
      return true;
    }

    if (!workerMarkedCompleteAt) {
      return true;
    }

    const completeMs = new Date(workerMarkedCompleteAt).getTime();
    if (!Number.isFinite(completeMs)) {
      return true;
    }

    return completeMs >= backjobCycleStartMs;
  };

  const dispatchedAgencyEmployees = agencyAssignedEmployees.filter((employee) =>
    isAgencyStatusInCurrentBackjobCycle(
      employee.dispatched,
      employee.dispatchedAt,
    ),
  );
  const pendingAgencyArrivalEmployees = dispatchedAgencyEmployees.filter(
    (employee) =>
      !isAgencyStatusInCurrentBackjobCycle(
        employee.clientConfirmedArrival,
        employee.clientConfirmedArrivalAt,
      ),
  );
  const pendingTeamArrivalWorkers = teamAssignedWorkers.filter((worker) => {
    const attendanceSignals = getTeamAttendanceBackjobSignals(worker);
    const hasAssignmentArrival = isTeamArrivalInCurrentBackjobCycle(
      worker.client_confirmed_arrival,
      worker.client_confirmed_arrival_at,
      worker.worker_marked_complete,
      worker.worker_marked_complete_at,
    );
    const hasAttendanceArrival = Boolean(attendanceSignals?.arrived);

    return !(hasAssignmentArrival || hasAttendanceArrival);
  });

  const pendingTeamCompletionWorkers = teamAssignedWorkers.filter((worker) => {
    const attendanceSignals = getTeamAttendanceBackjobSignals(worker);
    return !isTeamCompletionInCurrentBackjobCycle(
      worker.worker_marked_complete,
      worker.worker_marked_complete_at,
      attendanceSignals?.completed,
    );
  });

  const pendingTeamAgencyArrivalEmployees =
    conversation?.is_team_job && Array.isArray(conversation?.team_agency_employees)
      ? conversation.team_agency_employees.filter(
          (employee: any) =>
            !isAgencyStatusInCurrentBackjobCycle(
              getAgencyArrivedFlag(employee),
              getAgencyArrivedAt(employee),
            ),
        )
      : [];

  const pendingTeamArrivalWorkerAssignments = pendingTeamArrivalWorkers.filter(
    (worker: any) => {
      const assignmentId = Number(worker?.assignment_id);
      if (!Number.isFinite(assignmentId)) return true;

      return !backjobAttendanceRows.some((row: any) => {
        const rowAssignmentId = Number(row?.assignment_id);
        return (
          Number.isFinite(rowAssignmentId) &&
          rowAssignmentId === assignmentId &&
          Boolean(row?.time_in)
        );
      });
    },
  );

  const pendingTeamAgencyArrivalAssignments =
    pendingTeamAgencyArrivalEmployees.filter((employee: any) => {
      const assignmentId = Number(employee?.assignment_id);
      if (!Number.isFinite(assignmentId)) return true;

      return !backjobAttendanceRows.some((row: any) => {
        const rowAssignmentId = Number(row?.assignment_id);
        return (
          Number.isFinite(rowAssignmentId) &&
          rowAssignmentId === assignmentId &&
          Boolean(row?.time_in)
        );
      });
    });

  const hasTrackedWorkerStateForBackjob =
    agencyAssignedEmployees.length > 0 ||
    teamAssignedWorkers.length > 0 ||
    backjobAttendanceRows.length > 0;

  const hasTeamAssignmentRows = teamAssignedWorkers.length > 0;
  const isTeamBackjobFlow =
    Boolean(conversation?.backjob?.has_backjob) &&
    (Boolean(conversation?.is_team_job) || hasTeamAssignmentRows);

  const usesArrivalDispatchBackjobGate =
    conversation?.is_agency_job || isTeamBackjobFlow;

  const canClientConfirmBackjobStartedForAgency =
    agencyAssignedEmployees.length > 0 &&
    dispatchedAgencyEmployees.length === agencyAssignedEmployees.length;

  const isBackjobActiveForDispatch =
    Boolean(conversation?.backjob?.has_backjob) &&
    conversation?.backjob?.status === "IN_NEGOTIATION" &&
    conversation?.backjob?.worker_schedule_confirmed === true &&
    !conversation?.backjob?.worker_marked_complete;
  const isTeamDailyBackjobFlow =
    isTeamBackjobFlow &&
    conversation?.job?.payment_model === "DAILY" &&
    Boolean(conversation?.backjob?.has_backjob);
  const canClientConfirmBackjobStartedForTeam =
    teamAssignedWorkers.length > 0 &&
    (isTeamDailyBackjobFlow
      ? effectiveWorkerScheduleConfirmed
      : pendingTeamArrivalWorkerAssignments.length === 0 &&
        pendingTeamAgencyArrivalAssignments.length === 0);
  const teamBackjobAllWorkersComplete =
    teamAssignedWorkers.length > 0 && pendingTeamCompletionWorkers.length === 0;
  const myTeamBackjobAssignment =
    conversation?.my_role === "WORKER" && Array.isArray(teamAssignedWorkers)
      ? teamAssignedWorkers.find((assignment: any) => {
          const assignmentWorkerId = Number(assignment?.worker_id);
          const assignmentAccountId = Number(assignment?.account_id);
          const meAccountId = Number(user?.accountID);

          // Some auth payloads do not include workerProfile. Account-level
          // matching is the stable identity fallback for team assignments.
          const workerIdMatch = false;
          const accountIdMatch =
            Number.isFinite(assignmentAccountId) &&
            Number.isFinite(meAccountId) &&
            assignmentAccountId === meAccountId;

          return workerIdMatch || accountIdMatch;
        })
      : null;
  const myTeamBackjobMarkedComplete = myTeamBackjobAssignment
    ? !pendingTeamCompletionWorkers.some((worker: any) => {
        const pendingAssignmentId = Number(worker?.assignment_id);
        const myAssignmentId = Number(myTeamBackjobAssignment?.assignment_id);
        return (
          Number.isFinite(pendingAssignmentId) &&
          Number.isFinite(myAssignmentId) &&
          pendingAssignmentId === myAssignmentId
        );
      })
    : false;

  const canClientConfirmBackjobStartedByArrival = !isClientBackjobStartFlow
    ? true
    : !usesArrivalDispatchBackjobGate
      ? true
      : conversation?.is_agency_job
        ? canClientConfirmBackjobStartedForAgency
        : isTeamBackjobFlow
          ? canClientConfirmBackjobStartedForTeam
          : true;

  const clientBackjobStartBlockReason = !isClientBackjobStartFlow
    ? null
    : !usesArrivalDispatchBackjobGate
      ? null
      : !hasTrackedWorkerStateForBackjob
        ? "Waiting for worker dispatch and arrival status."
        : conversation?.is_agency_job && agencyAssignedEmployees.length === 0
          ? "Waiting for worker dispatch status."
          : conversation?.is_agency_job &&
              dispatchedAgencyEmployees.length < agencyAssignedEmployees.length
            ? `Waiting for agency to dispatch workers (${dispatchedAgencyEmployees.length} of ${agencyAssignedEmployees.length}).`
            : isTeamBackjobFlow &&
                isTeamDailyBackjobFlow &&
                !effectiveWorkerScheduleConfirmed
              ? `Waiting for workers to confirm schedule (${teamScheduleConfirmedCount} of ${teamScheduleTotalWorkers || teamAssignedWorkers.length}).`
              : isTeamBackjobFlow &&
                  !isTeamDailyBackjobFlow &&
                  (pendingTeamArrivalWorkerAssignments.length > 0 ||
                    pendingTeamAgencyArrivalAssignments.length > 0)
                ? `Confirm arrivals first (${pendingTeamArrivalWorkerAssignments.length + pendingTeamAgencyArrivalAssignments.length} pending).`
                : null;

  // Materials purchasing workflow mutations
  const approveMaterialMutation = useApproveMaterialPurchase();
  const rejectMaterialMutation = useRejectMaterialPurchase();
  const markBuyingMutation = useMarkMaterialsBuying();
  const uploadPurchaseProofMutation = useUploadPurchaseProof();
  const skipMaterialsMutation = useSkipMaterialsStep();

  // WebSocket connection state
  const { isConnected: isWsConnected } = useWebSocketConnection();

  // Network connectivity state (device-level via NetInfo)
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);
  const [hasAttemptedWsConnection, setHasAttemptedWsConnection] =
    useState(false);
  const [isTestingModeEnabled, setIsTestingModeEnabled] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const [arrivalConfirmPendingKeys, setArrivalConfirmPendingKeys] = useState<
    Record<string, boolean>
  >({});

  const getArrivalConfirmKey = (
    type: "WORKER" | "AGENCY" | "PROJECT",
    id: number,
  ) => `${type}:${id}`;

  const isArrivalConfirmPending = (
    type: "WORKER" | "AGENCY" | "PROJECT",
    id: number,
  ) => Boolean(arrivalConfirmPendingKeys[getArrivalConfirmKey(type, id)]);

  const setArrivalConfirmPending = (
    type: "WORKER" | "AGENCY" | "PROJECT",
    id: number,
    pending: boolean,
  ) => {
    const key = getArrivalConfirmKey(type, id);
    setArrivalConfirmPendingKeys((prev) => {
      if (pending) {
        if (prev[key]) return prev;
        return { ...prev, [key]: true };
      }

      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsNetworkOnline(
        state.isConnected === true && state.isInternetReachable !== false,
      );
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchMobileConfig = async () => {
      try {
        const response = await fetch(ENDPOINTS.MOBILE_CONFIG, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          return;
        }

        const config = (await response.json()) as { testing?: boolean };
        setIsTestingModeEnabled(Boolean(config.testing));
      } catch {
        setIsTestingModeEnabled(false);
      }
    };

    fetchMobileConfig();
  }, []);

  useEffect(() => {
    if (isWsConnected) {
      setHasAttemptedWsConnection(true);
      return;
    }
    const timer = setTimeout(() => setHasAttemptedWsConnection(true), 3000);
    return () => clearTimeout(timer);
  }, [isWsConnected]);

  // WebSocket: Listen for new messages
  useMessageListener(conversationId);

  // WebSocket: Typing indicator
  const { isTyping, sendTyping } = useTypingIndicator(conversationId);

  // Image upload
  const {
    uploadAsync,
    isUploading,
    progress: uploadProgress,
    resetProgress,
  } = useImageUpload();

  // Load pending messages from offline queue
  useEffect(() => {
    const loadPending = async () => {
      const pending = await getPendingMessages(conversationId);
      setPendingMessages(pending);
    };
    loadPending();
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversation?.messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation?.messages.length]);

  // Handle confirm worker arrival (CLIENT only)
  const handleConfirmWorkStarted = () => {
    if (!conversation) return;

    // For agency jobs, show employee name if assigned, otherwise agency name
    const workerName =
      conversation.assigned_employee?.name ||
      conversation.other_participant?.name ||
      "the worker";

    Alert.alert(
      "Confirm Worker Arrival",
      `Has ${workerName} arrived at the job site?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            confirmWorkStartedMutation.mutate(conversation.job.id);
          },
        },
      ],
    );
  };

  // Handle cancel project job (CLIENT only)
  const handleCancelJob = () => {
    if (!conversation) return;

    const chooseCancellationReason = (onSelect: (reason: string) => void) => {
      Alert.alert(
        "Select Cancellation Reason",
        "A reason is required to cancel this job.",
        [
          {
            text: "No Longer Needed",
            onPress: () => onSelect("Client no longer needs the service"),
          },
          {
            text: "Budget Constraints",
            onPress: () =>
              onSelect("Client cancelled due to budget constraints"),
          },
          {
            text: "Scheduling Conflict",
            onPress: () =>
              onSelect("Client cancelled due to scheduling conflict"),
          },
          { text: "Back", style: "cancel" },
        ],
      );
    };

    Alert.alert(
      "Cancel Job",
      "Cancelling this job may incur losses. If work has already started, worker compensation may be deducted from your refund. Do you want to continue?",
      [
        { text: "Keep Job", style: "cancel" },
        {
          text: "Cancel Job",
          style: "destructive",
          onPress: () => {
            chooseCancellationReason((reason) =>
              cancelJobMutation.mutate({
                jobId: conversation.job.id,
                reason,
              }),
            );
          },
        },
      ],
    );
  };

  // Handle cancel daily job (CLIENT only)
  const handleCancelDailyJob = () => {
    if (!conversation) return;

    const chooseCancellationReason = (onSelect: (reason: string) => void) => {
      Alert.alert(
        "Select Cancellation Reason",
        "A reason is required to cancel this job.",
        [
          {
            text: "No Longer Needed",
            onPress: () => onSelect("Client no longer needs the service"),
          },
          {
            text: "Budget Constraints",
            onPress: () =>
              onSelect("Client cancelled due to budget constraints"),
          },
          {
            text: "Scheduling Conflict",
            onPress: () =>
              onSelect("Client cancelled due to scheduling conflict"),
          },
          { text: "Back", style: "cancel" },
        ],
      );
    };

    Alert.alert(
      "Cancel Daily Job",
      "Only unused daily escrow is refundable. Any completed days stay paid, and the platform fee is retained. Continue cancelling this daily job?",
      [
        { text: "Keep Job", style: "cancel" },
        {
          text: "Cancel Daily Job",
          style: "destructive",
          onPress: () => {
            chooseCancellationReason((reason) =>
              cancelDailyJobMutation.mutate({
                jobId: conversation.job.id,
                reason,
              }),
            );
          },
        },
      ],
    );
  };

  // Handle cancel team job (CLIENT only)
  const handleCancelTeamJob = () => {
    if (!conversation) return;

    const workerCount = conversation.team_worker_assignments?.length ?? 0;
    const chooseCancellationReason = (onSelect: (reason: string) => void) => {
      Alert.alert(
        "Select Cancellation Reason",
        "A reason is required to cancel this team job.",
        [
          {
            text: "Team Availability Issue",
            onPress: () =>
              onSelect("Client cancelled due to team availability issues"),
          },
          {
            text: "Budget Constraints",
            onPress: () =>
              onSelect("Client cancelled due to budget constraints"),
          },
          {
            text: "Scheduling Conflict",
            onPress: () =>
              onSelect("Client cancelled due to scheduling conflict"),
          },
          { text: "Back", style: "cancel" },
        ],
      );
    };

    Alert.alert(
      "Cancel Team Job",
      `Cancelling this team job affects all assigned workers${workerCount > 0 ? ` (${workerCount})` : ""}. If arrivals are already confirmed, worker compensation may be deducted from your refund. Do you want to continue?`,
      [
        { text: "Keep Job", style: "cancel" },
        {
          text: "Cancel Team Job",
          style: "destructive",
          onPress: () => {
            chooseCancellationReason((reason) =>
              cancelJobMutation.mutate({
                jobId: conversation.job.id,
                reason,
              }),
            );
          },
        },
      ],
    );
  };

  // Handle confirm team worker arrival (CLIENT only, for team jobs)
  const handleConfirmTeamWorkerArrival = (
    assignmentId: number,
    workerName: string,
  ) => {
    if (!conversation) return;
    if (isArrivalConfirmPending("WORKER", assignmentId)) return;

    Alert.alert(
      "Confirm Worker Arrival",
      `Has ${workerName} arrived at the job site?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Arrival",
          onPress: () => {
            setArrivalConfirmPending("WORKER", assignmentId, true);
            confirmTeamWorkerArrivalMutation.mutate({
              jobId: conversation.job.id,
              assignmentId,
            }, {
              onSettled: () => {
                setArrivalConfirmPending("WORKER", assignmentId, false);
              },
            });
          },
        },
      ],
    );
  };

  const handleConfirmTeamEmployeeArrival = (
    assignmentId: number,
    employeeName: string,
  ) => {
    if (!conversation) return;
    if (isArrivalConfirmPending("AGENCY", assignmentId)) return;

    Alert.alert(
      "Confirm Employee Arrival",
      `Has ${employeeName} arrived at the job site?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Arrival",
          onPress: () => {
            setArrivalConfirmPending("AGENCY", assignmentId, true);
            confirmTeamEmployeeArrivalMutation.mutate({
              jobId: conversation.job.id,
              assignmentId,
            }, {
              onSettled: () => {
                setArrivalConfirmPending("AGENCY", assignmentId, false);
              },
            });
          },
        },
      ],
    );
  };

  const isArrivalAlreadySyncedError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
    return (
      message.includes("already confirmed") ||
      message.includes("already been confirmed") ||
      message.includes("already arrived")
    );
  };

  const runApprovePayArrivalPreflight = useCallback(async () => {
    if (!conversation) {
      return null as ConversationDetail | null;
    }

    if (conversation.my_role !== "CLIENT" || !conversation.is_team_job) {
      return conversation;
    }

    const teamWorkerRows = Array.isArray(conversation.team_worker_assignments)
      ? conversation.team_worker_assignments
      : [];

    const attendanceRowsForPreflight = Array.isArray(
      conversation.attendance_today,
    )
      ? conversation.attendance_today
      : [];

    const absentAssignmentIds = new Set(
      attendanceRowsForPreflight
        .filter((row: any) => isAttendanceRowAbsent(row))
        .map((row: any) => Number(row?.assignment_id))
        .filter((assignmentId: number) => Number.isFinite(assignmentId)),
    );

    const absentWorkerIds = new Set(
      attendanceRowsForPreflight
        .filter((row: any) => isAttendanceRowAbsent(row))
        .map((row: any) => Number(row?.worker_id))
        .filter((workerId: number) => Number.isFinite(workerId)),
    );

    const absentWorkerAccountIds = new Set(
      attendanceRowsForPreflight
        .filter((row: any) => isAttendanceRowAbsent(row))
        .map((row: any) => Number(row?.worker_account_id))
        .filter((accountId: number) => Number.isFinite(accountId)),
    );

    // Pending-only worker assignment IDs
    const pendingWorkerAssignmentIds = Array.from(
      new Set(
        teamWorkerRows
          .map((row: any) => Number(row?.assignment_id))
          .filter((assignmentId: number) => Number.isFinite(assignmentId))
          .filter(
            (assignmentId: number) => {
              const scopedRows = teamWorkerRows.filter(
                (row: any) => Number(row?.assignment_id) === assignmentId,
              );

              const alreadyArrived = scopedRows.some((row: any) =>
                Boolean(row?.client_confirmed_arrival),
              );

              const blockedByAbsentAttendance =
                absentAssignmentIds.has(assignmentId) ||
                scopedRows.some((row: any) => {
                  const rowWorkerId = Number(row?.worker_id);
                  const rowAccountId = Number(row?.account_id);

                  return (
                    (Number.isFinite(rowWorkerId) &&
                      absentWorkerIds.has(rowWorkerId)) ||
                    (Number.isFinite(rowAccountId) &&
                      absentWorkerAccountIds.has(rowAccountId))
                  );
                });

              return !alreadyArrived && !blockedByAbsentAttendance;
            },
          ),
      ),
    );

    // Pending-only employee assignment IDs
    const pendingEmployeeAssignmentIds = Array.from(
      new Set(
        agencyAssignedEmployees
          .map((employee: any) => Number(employee?.assignment_id))
          .filter((assignmentId: number) => Number.isFinite(assignmentId))
          .filter((assignmentId: number) => {
            const employee = agencyAssignedEmployees.find(
              (row: any) => Number(row?.assignment_id) === assignmentId,
            );
            if (!employee) return false;

            const employeeId = Number(
              employee?.id ?? (employee as any)?.employee_id,
            );

            const blockedByAbsentAttendance =
              absentAssignmentIds.has(assignmentId) ||
              (Number.isFinite(employeeId) && absentWorkerIds.has(employeeId));

            if (blockedByAbsentAttendance) {
              return false;
            }

            return !isAgencyStatusInCurrentBackjobCycle(
              getAgencyArrivedFlag(employee),
              getAgencyArrivedAt(employee),
            );
          }),
      ),
    );

    // Target only pending arrivals. Re-confirming all rows in DAILY mode can
    // accidentally promote absent-intended rows into arrival-confirmed rows.
    const workerTargets = pendingWorkerAssignmentIds;
    const employeeTargets = pendingEmployeeAssignmentIds;

    if (
      workerTargets.length === 0 &&
      employeeTargets.length === 0
    ) {
      return conversation;
    }

    setIsApprovePayPreflightInFlight(true);
    try {
      for (const assignmentId of workerTargets) {
        setArrivalConfirmPending("WORKER", assignmentId, true);
        try {
          await confirmTeamWorkerArrivalMutation.mutateAsync({
            jobId: conversation.job.id,
            assignmentId,
          });
        } catch (error) {
          if (!isArrivalAlreadySyncedError(error)) {
            throw error;
          }
        } finally {
          setArrivalConfirmPending("WORKER", assignmentId, false);
        }
      }

      for (const assignmentId of employeeTargets) {
        setArrivalConfirmPending("AGENCY", assignmentId, true);
        try {
          await confirmTeamEmployeeArrivalMutation.mutateAsync({
            jobId: conversation.job.id,
            assignmentId,
          });
        } catch (error) {
          if (!isArrivalAlreadySyncedError(error)) {
            throw error;
          }
        } finally {
          setArrivalConfirmPending("AGENCY", assignmentId, false);
        }
      }

      const refreshed = await refetch();
      return (refreshed?.data as ConversationDetail | undefined) ?? conversation;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sync team arrival status before payment.";
      Alert.alert("Unable To Sync Arrivals", message);
      return null;
    } finally {
      setIsApprovePayPreflightInFlight(false);
    }
  }, [
    agencyAssignedEmployees,
    confirmTeamEmployeeArrivalMutation,
    confirmTeamWorkerArrivalMutation,
    conversation,
    getAgencyArrivedAt,
    getAgencyArrivedFlag,
    isAgencyStatusInCurrentBackjobCycle,
    refetch,
    setArrivalConfirmPending,
  ]);
  // Handle mark team assignment complete (WORKER only, for team jobs)
  const handleMarkTeamAssignmentComplete = (assignmentId: number) => {
    if (!conversation) return;

    Alert.alert(
      "Mark Assignment Complete",
      "Are you sure you want to mark this assignment as complete?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () => {
            markTeamAssignmentCompleteMutation.mutate({
              jobId: conversation.job.id,
              assignmentId,
              notes: undefined,
            });
          },
        },
      ],
    );
  };

  // Handle approve team job completion (CLIENT only, for team jobs)
  const handleApproveTeamJobCompletion = async () => {
    if (!conversation) return;

    const preflightConversation = await runApprovePayArrivalPreflight();
    if (!preflightConversation) return;

    const isDailyTeamJob =
      conversation.is_team_job && conversation.job?.payment_model === "DAILY";

    const allAssignmentsEarlyCompleted =
      isDailyTeamJob &&
      ((conversation.team_worker_assignments?.length ?? 0) > 0 ||
        (conversation.team_agency_employees?.length ?? 0) > 0) &&
      (conversation.team_worker_assignments ?? []).every(
        (assignment: any) => assignment.early_completed,
      ) &&
      (conversation.team_agency_employees ?? []).every(
        (employee: any) => employee.early_completed,
      );

    if (allAssignmentsEarlyCompleted) {
      approveTeamJobCompletionMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: "WALLET",
      });
      return;
    }

    // Calculate remaining amount from the backend-computed field
    const remainingAmount = Number(
      conversation.job.remainingPayment ?? 0,
    ).toFixed(2);

    setCountdownConfig({
      visible: true,
      title: "Approve Team Job & Pay",
      message: `All workers have completed their assignments.\n\nYou will need to pay the remaining balance:\n\n₱${remainingAmount}\n\nPlease select your payment method.`,
      confirmLabel: "Continue",
      countdownSeconds: 3,
      onConfirm: () => {
        setCountdownConfig(null);
        setPaymentActionMode("APPROVE_COMPLETION");
        setShowPaymentModal(true);
      },
      icon: "wallet",
      iconColor: Colors.warning,
    });
  };

  const handleApproveDailyTeamWorkday = async () => {
    if (!conversation) return;

    const payableRows = (conversation.attendance_today ?? []).filter((row: any) => {
      const attendanceId = Number(row?.attendance_id ?? row?.id);
      const status = String(row?.status || "").toUpperCase();
      const isPayableStatus = status === "PRESENT" || status === "HALF_DAY";

      return (
        Number.isFinite(attendanceId) &&
        isPayableStatus &&
        !Boolean(row?.payment_processed)
      );
    }).map((row: any) => ({
      ...row,
      attendance_id: Number(row?.attendance_id ?? row?.id),
    }));

    if (payableRows.length === 0) {
      Alert.alert(
        "Nothing To Settle",
        "No payable attendance rows were found for today after sync.",
      );
      return;
    }

    const totalAmount = payableRows.reduce(
      (sum: number, row: any) => sum + Number(row?.amount_earned || 0),
      0,
    );

    setCountdownConfig({
      visible: true,
      title: "Approve & Pay Workday",
      message:
        `This will confirm ${payableRows.length} attendance row(s) and process wallet payouts for today.\n\n` +
        `Estimated total: ₱${totalAmount.toLocaleString()}\n\n` +
        "The job will remain in progress.",
      confirmLabel: "Approve Day",
      countdownSeconds: 3,
      onConfirm: () => {
        setCountdownConfig(null);

        void (async () => {
          if (isBulkDailySettlementInFlight) {
            return;
          }

          setIsBulkDailySettlementInFlight(true);
          try {
            let settledCount = 0;

            for (const row of payableRows) {
              try {
                await clientConfirmAttendanceMutation.mutateAsync({
                  attendanceId: Number(row.attendance_id),
                  paymentMethod: "WALLET",
                });
                settledCount += 1;
              } catch {
                // Keep going so one bad row does not block settling other workers.
              }
            }

            // Harden cache sync so day-state transitions render immediately.
            await refetch();
            setTimeout(() => {
              void refetch();
            }, 1200);

            if (settledCount > 0) {
              Toast.show({
                type: "success",
                text1: "Workday Settled",
                text2: `${settledCount} attendance row(s) confirmed and paid`,
              });
            } else {
              Alert.alert(
                "Settlement Failed",
                "Unable to settle attendance rows for today.",
              );
            }
          } finally {
            setIsBulkDailySettlementInFlight(false);
          }
        })();
      },
      icon: "wallet",
      iconColor: Colors.warning,
    });
  };

  const handleFinishDailyTeamJob = () => {
    if (!conversation) return;

    const remainingAmount = Number(conversation.job.remainingPayment ?? 0).toFixed(2);

    const runDailyFinishJob = () => {
      dailyFinishJobMutation.mutate(
        {
          jobId: conversation.job.id,
        },
        {
          onSuccess: () => {
            void refetch();
            setTimeout(() => {
              void refetch();
            }, 1200);
          },
        },
      );
    };

    setCountdownConfig({
      visible: true,
      title: "Finish Daily Team Job",
      message:
        `This will finish the entire DAILY team job, settle remaining balances, and open reviews/backjob flow.\n\n` +
        `Remaining settlement shown: ₱${remainingAmount}\n\n` +
        "Use this only when the full job is done, not just today's work.",
      confirmLabel: "Finish Entire Job",
      countdownSeconds: 3,
      onConfirm: () => {
        setCountdownConfig(null);
        runDailyFinishJob();
      },
      icon: "flag",
      iconColor: Colors.error,
    });
  };

  const promptExtendAfterSkipApproval = (requestDate?: string) => {
    if (!conversation?.job?.id) return;

    const effectiveDate =
      requestDate ||
      conversation.effective_work_date ||
      new Date().toISOString().slice(0, 10);
    const promptKey = `${conversation.job.id}:${effectiveDate}`;

    if (skipExtendPromptedKeysRef.current.has(promptKey)) {
      return;
    }
    skipExtendPromptedKeysRef.current.add(promptKey);

    Alert.alert(
      "Skip Day Approved",
      "Do you want to extend this job by 1 day to make up for the skipped day?",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Extend +1 Day",
          onPress: () =>
            dailyExtendOneDayMutation.mutate({
              jobId: conversation.job.id,
            }),
        },
      ],
    );
  };

  // Handle approve early completion for solo DAILY jobs (CLIENT only)
  // Mirrors handleApproveTeamJobCompletion — countdown → payment modal (WALLET or CASH).
  // CASH: client pays worker directly and uploads proof; existing escrow is still released.
  const handleApproveSoloDailyCompletion = () => {
    if (!conversation) return;

    const remainingAmount = Number(
      conversation.job.remainingPayment ?? 0,
    ).toFixed(2);

    setCountdownConfig({
      visible: true,
      title: "Complete Job Early & Pay Remaining",
      message: `Worker has completed today's work.\n\nRemaining escrow to release:\n\n₱${remainingAmount}\n\nThis pays remaining contracted days and closes the job.\n\nPlease select your payment method.`,
      confirmLabel: "Continue",
      countdownSeconds: 3,
      onConfirm: () => {
        setCountdownConfig(null);
        setPaymentActionMode("APPROVE_SOLO_DAILY_COMPLETION");
        setShowPaymentModal(true);
      },
      icon: "wallet",
      iconColor: Colors.warning,
    });
  };

  // Handle early pay-now while job is still in progress (CLIENT only)
  const handlePayNow = () => {
    if (!conversation) return;

    const baseRemaining = conversation.job.budget
      ? conversation.job.budget * 0.5
      : 0;
    const materialsCost = conversation.job.materials_cost ?? 0;
    const totalRemaining = baseRemaining + materialsCost;
    const formattedAmount = totalRemaining.toFixed(2);

    const materialsNote =
      materialsCost > 0
        ? `\n(includes ₱${materialsCost.toLocaleString()} materials reimbursement)`
        : "";

    setCountdownConfig({
      visible: true,
      title: "Pay Worker Now",
      message:
        `You are about to pay the final amount early:\n\n₱${formattedAmount}${materialsNote}\n\n` +
        "Important:\n" +
        "- This payment is not reversible.\n" +
        "- This does NOT mark the job complete.\n" +
        "- You must still approve completion later.",
      confirmLabel: "Continue",
      countdownSeconds: 3,
      onConfirm: () => {
        setCountdownConfig(null);
        setPaymentActionMode("PAY_NOW");
        setShowPaymentModal(true);
      },
      icon: "warning",
      iconColor: Colors.warning,
    });
  };

  // Handle mark complete (WORKER only)
  const handleMarkComplete = () => {
    if (!conversation) return;

    const configuredDuration = Number(conversation.job?.duration_days || 0);
    const fallbackDuration = parseExpectedDurationDays(
      conversation.job?.expectedDuration,
    );
    const effectiveDurationDays =
      configuredDuration > 0 ? configuredDuration : fallbackDuration;
    const isProjectMultiDayFlow =
      conversation.job?.payment_model === "PROJECT" &&
      effectiveDurationDays > 1;

    // Check if work started was confirmed
    if (
      !isProjectMultiDayFlow &&
      !conversation.job.clientConfirmedWorkStarted
    ) {
      Alert.alert(
        "Cannot Mark Complete",
        "Client must confirm that work has started before you can mark it as complete.",
        [{ text: "OK" }],
      );
      return;
    }

    // Simple confirmation without notes (cross-platform compatible)
    Alert.alert(
      "Mark Job Complete",
      "Are you sure you want to mark this job as complete? The client will review your work.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Complete",
          style: "default",
          onPress: () => {
            markCompleteMutation.mutate({
              jobId: conversation.job.id,
            });
          },
        },
      ],
    );
  };

  // Handle approve completion (CLIENT only)
  const handleApproveCompletion = () => {
    if (!conversation) return;

    // If final payment is already completed (via Pay Now), skip payment selection
    // and only approve completion so the review flow can start.
    if (conversation.job.remainingPaymentPaid) {
      Alert.alert(
        "Approve Completion",
        "Final payment is already completed. Approve this job to proceed to reviews.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: () => {
              approveCompletionMutation.mutate({
                jobId: conversation.job.id,
                paymentMethod: "WALLET",
              });
            },
          },
        ],
      );
      return;
    }

    // Calculate remaining amount — use the server-set remainingPayment if available,
    // falling back to 50% of budget for legacy jobs where it was not explicitly set.
    const baseRemaining = conversation.job.remainingPayment != null
      ? conversation.job.remainingPayment
      : conversation.job.budget
        ? conversation.job.budget * 0.5
        : 0;
    const materialsCost = conversation.job.materials_cost ?? 0;
    const totalRemaining = baseRemaining + materialsCost;
    const remainingAmount = totalRemaining.toFixed(2);

    const materialsNote =
      materialsCost > 0
        ? `\n(includes ₱${materialsCost.toLocaleString()} materials reimbursement)`
        : "";

    setCountdownConfig({
      visible: true,
      title: "Approve Completion & Pay",
      message: `You will need to pay the remaining 50% of the job budget:\n\n₱${remainingAmount}${materialsNote}\n\nPlease select your payment method.`,
      confirmLabel: "Continue",
      countdownSeconds: 3,
      onConfirm: () => {
        setCountdownConfig(null);
        setShowPaymentModal(true);
      },
      icon: "wallet",
      iconColor: Colors.warning,
    });
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: "WALLET" | "CASH") => {
    if (!conversation) return;

    setShowPaymentModal(false);

    if (paymentActionMode === "PAY_NOW") {
      if (method === "CASH") {
        Alert.alert(
          "Wallet Only",
          "Early Pay Now currently supports WALLET payment only. You can use CASH when approving completion.",
        );
        return;
      }

      const baseRemaining = conversation.job.budget
        ? conversation.job.budget * 0.5
        : 0;
      const materialsCostVal = conversation.job.materials_cost ?? 0;
      const totalRemaining = baseRemaining + materialsCostVal;

      createFinalPaymentMutation.mutate({
        jobId: conversation.job.id,
        amount: totalRemaining,
        paymentMethod: "wallet",
      });
      setPaymentActionMode("APPROVE_COMPLETION");
      return;
    }

    // Solo DAILY early completion — WALLET releases escrow, CASH uploads proof + releases escrow
    if (
      paymentActionMode === "APPROVE_SOLO_DAILY_COMPLETION" &&
      !conversation.is_team_job &&
      !conversation.is_agency_job &&
      conversation.job?.payment_model === "DAILY"
    ) {
      if (method === "CASH") {
        const remainingAmount = Number(
          conversation.job.remainingPayment ?? 0,
        ).toFixed(2);
        Alert.alert(
          "Cash Payment",
          `Please pay ₱${remainingAmount} to the worker directly, then upload a photo of your payment receipt.\n\nThis proof will be stored for dispute resolution.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Upload Proof",
              onPress: () => setShowCashUploadModal(true),
            },
          ],
        );
        return;
      }
      // WALLET — release existing escrow to worker
      earlyCompleteSingleDailyMutation.mutate({
        jobId: conversation.job!.id,
        paymentMethod: "WALLET",
      });
      setPaymentActionMode("APPROVE_COMPLETION");
      return;
    }

    if (method === "CASH") {
      // Show cash amount confirmation before opening upload modal (non-solo-DAILY paths)
      // Use the server-set remainingPayment if available; fall back to 50% for legacy jobs.
      const baseRemaining = conversation.job.remainingPayment != null
        ? conversation.job.remainingPayment
        : conversation.job.budget
          ? conversation.job.budget * 0.5
          : 0;
      const materialsCostVal = conversation.job.materials_cost ?? 0;

      const remainingAmount = (baseRemaining + materialsCostVal).toFixed(2);

      const primaryAgencyContact =
        conversation.assigned_employees?.find(
          (employee) => employee.isPrimaryContact,
        ) ||
        conversation.assigned_employees?.[0] ||
        conversation.assigned_employee;

      const agencyRecipientText = primaryAgencyContact?.name
        ? `${primaryAgencyContact.name} (assigned team leader)`
        : "the assigned team leader";

      const workerText = conversation.is_team_job
        ? "the workers"
        : conversation.is_agency_job
          ? agencyRecipientText
          : "the worker";

      Alert.alert(
        "Cash Payment",
        `Please pay ₱${remainingAmount} to ${workerText} directly, then upload a photo of your payment receipt.\n\nThis proof will be stored for dispute resolution.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upload Proof",
            onPress: () => setShowCashUploadModal(true),
          },
        ],
      );
    } else if (conversation.is_agency_job) {
      const isEmployeeComplete = (employee: any) =>
        employee.agencyMarkedComplete ||
        employee.employeeMarkedComplete ||
        employee.marked_complete ||
        employee.status === "COMPLETED";

      const hasLegacyAttendanceSignal = (employeeIdRaw: any) => {
        const employeeId = Number(employeeIdRaw);
        if (!Number.isFinite(employeeId)) return null;

        const attendanceForEmployee = attendanceRows.find((row: any) => {
          const rowWorkerId = Number(row?.worker_id);
          return Number.isFinite(rowWorkerId) && rowWorkerId === employeeId;
        });

        if (!attendanceForEmployee) return null;

        const rowStatus = String(
          attendanceForEmployee?.status || "",
        ).toUpperCase();
        return {
          dispatched:
            Boolean(attendanceForEmployee?.is_dispatched) ||
            Boolean(attendanceForEmployee?.worker_confirmed) ||
            Boolean(attendanceForEmployee?.worker_confirmed_at) ||
            Boolean(attendanceForEmployee?.time_in) ||
            Boolean(attendanceForEmployee?.time_out) ||
            Boolean(attendanceForEmployee?.client_confirmed) ||
            ["DISPATCHED", "PENDING", "PRESENT", "HALF_DAY"].includes(
              rowStatus,
            ),
          arrived:
            Boolean(attendanceForEmployee?.client_confirmed) ||
            Boolean(attendanceForEmployee?.time_in) ||
            Boolean(attendanceForEmployee?.time_out),
          completed:
            Boolean(attendanceForEmployee?.time_out) ||
            ["PRESENT", "HALF_DAY", "COMPLETED"].includes(rowStatus),
        };
      };

      const assignedEmployees = conversation.assigned_employees || [];
      const incompleteWorkflowEmployees = assignedEmployees.filter(
        (employee) => {
          const legacySignals = hasLegacyAttendanceSignal(employee?.id);
          const dispatched =
            Boolean(employee.dispatched) || Boolean(legacySignals?.dispatched);
          const arrived =
            Boolean(employee.clientConfirmedArrival) ||
            Boolean(legacySignals?.arrived);
          const completed =
            isEmployeeComplete(employee) || Boolean(legacySignals?.completed);

          return !dispatched || !arrived || !completed;
        },
      );

      // Defensive guard: keep client-side approval gate aligned with backend workflow validation.
      if (incompleteWorkflowEmployees.length > 0) {
        Alert.alert(
          "Cannot Approve Yet",
          "Some assigned employees have not completed the full workflow (dispatch, arrival confirmation, and agency completion).",
          [{ text: "OK" }],
        );
        return;
      }

      // Agency PROJECT job approval
      approveAgencyProjectJobMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: method,
      });
    } else if (conversation.is_team_job) {
      // Team job approval
      approveTeamJobCompletionMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: method,
      });
    } else {
      // Regular job approval
      approveCompletionMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: method,
      });
    }

    setPaymentActionMode("APPROVE_COMPLETION");
  };

  // Handle cash proof image selection
  const handleCashProofSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Handle cash proof submission
  const handleCashProofSubmit = () => {
    if (!conversation || !selectedImage) return;

    if (conversation.is_agency_job) {
      // Agency PROJECT job cash proof (bulk - legacy)
      approveAgencyProjectJobMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: "CASH",
        cashProofImage: selectedImage,
      });
    } else if (conversation.is_team_job) {
      // Team job cash proof
      approveTeamJobCompletionMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: "CASH",
        cashProofImage: selectedImage,
      });
    } else if (
      !conversation.is_team_job &&
      !conversation.is_agency_job &&
      conversation.job?.payment_model === "DAILY"
    ) {
      // Solo DAILY early completion — cash proof uploaded, escrow released to worker
      earlyCompleteSingleDailyMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: "CASH",
        cashProofImage: selectedImage,
      });
    } else {
      // Regular job cash proof
      approveCompletionMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: "CASH",
        cashProofImage: selectedImage,
      });
    }

    setShowCashUploadModal(false);
    setSelectedImage(null);
  };

  // ============================================
  // BACKJOB WORKFLOW HANDLERS
  // ============================================

  // Handle confirm backjob started (CLIENT only)
  const handleConfirmBackjobStarted = () => {
    if (!conversation) return;

    if (conversation.my_role === "CLIENT") {
      if (!canClientConfirmBackjobStartedByArrival) {
        Alert.alert(
          "Cannot Confirm Started",
          clientBackjobStartBlockReason ||
            "Wait for required worker status updates before confirming started.",
          [{ text: "OK" }],
        );
        return;
      }
    }

    const workerName =
      conversation.assigned_employee?.name ||
      conversation.other_participant?.name ||
      "the worker";

    Alert.alert(
      "Confirm Backjob Started",
      `Are you sure ${workerName} has arrived and started the backjob work?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            confirmBackjobStartedMutation.mutate(conversation.job.id);
          },
        },
      ],
    );
  };

  // Handle mark backjob complete (WORKER only)
  const handleMarkBackjobComplete = () => {
    if (!conversation) return;

    // Check if backjob work started was confirmed
    if (!conversation.backjob?.backjob_started) {
      Alert.alert(
        "Cannot Mark Complete",
        "Client must confirm that backjob work has started before you can mark it as complete.",
        [{ text: "OK" }],
      );
      return;
    }

    Alert.alert(
      "Mark Backjob Complete",
      "Are you sure you want to mark this backjob as complete?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () => {
            markBackjobCompleteMutation.mutate({
              jobId: conversation.job.id,
              notes: undefined,
            });
          },
        },
      ],
    );
  };

  // Handle approve backjob completion (CLIENT only)
  const handleApproveBackjobCompletion = () => {
    if (!conversation) return;

    Alert.alert(
      "Approve Backjob Completion",
      "Are you satisfied with the backjob work? This will close the conversation and resolve the dispute.\n\nNote: Backjobs do not require payment (they are free remedial work).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve & Close",
          onPress: () => {
            approveBackjobCompletionMutation.mutate(
              {
                jobId: conversation.job.id,
              },
              {
                onSuccess: () => {
                  const hadClientReview =
                    !!conversation.job.clientReviewed ||
                    editableReviewTargetsRef.current.length > 0;

                  Alert.alert(
                    "Backjob Completed",
                    hadClientReview
                      ? "The backjob has been resolved. Do you want to change your review?"
                      : "The backjob has been resolved. Do you want to leave a review now?",
                    [
                      { text: "No", style: "cancel" },
                      {
                        text: hadClientReview
                          ? "Yes, Change Review"
                          : "Yes, Leave Review",
                        onPress: () => {
                          if (hadClientReview) {
                            // Pull the latest conversation payload so the newly granted
                            // backjob edit window is reflected before opening edit mode.
                            void refetch().finally(() => {
                              setTimeout(() => {
                                if (
                                  editableReviewTargetsRef.current.length > 0
                                ) {
                                  openReviewModalSafely("edit");
                                } else {
                                  openReviewModalSafely("submit");
                                }
                              }, 200);
                            });
                            return;
                          }

                          openReviewModalSafely("submit");
                        },
                      },
                    ],
                  );
                },
              },
            );
          },
        },
      ],
    );
  };

  // Request re-negotiation before the scheduled backjob date.
  const handleRequestBackjobRenegotiation = () => {
    if (!conversation) return;

    Alert.alert(
      "Request Re-negotiation",
      "This will notify admin to reopen negotiation and set a new backjob schedule.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Request",
          onPress: () => {
            requestBackjobRenegotiationMutation.mutate({
              jobId: conversation.job.id,
              reason:
                "Requested schedule re-negotiation before planned backjob date.",
            });
          },
        },
      ],
    );
  };

  const handleReleasePaymentNow = () => {
    if (!conversation) return;

    Alert.alert(
      "Release Payment Now",
      "This will immediately release worker payment and permanently revoke your remaining backjob rights for this job. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release Payment",
          style: "destructive",
          onPress: () => {
            releasePaymentNowMutation.mutate({ jobId: conversation.job.id });
          },
        },
      ],
    );
  };

  const handleOpenBackjobScheduleModal = () => {
    if (!conversation) return;
    const initialDate = conversation.backjob?.scheduled_date || "";
    const parsedInitialDate = parseScheduledDate(initialDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setBackjobScheduleDate(parsedInitialDate || today);
    setBackjobScheduleInput(
      parsedInitialDate ? formatDateOnly(parsedInitialDate) : "",
    );
    setShowAndroidDatePicker(false);
    setShowBackjobScheduleModal(true);
  };

  const handleSubmitBackjobScheduleDate = () => {
    if (!conversation) return;

    // Use current date state if input is empty (for picker)
    let scheduleValue = backjobScheduleInput.trim();
    if (!scheduleValue) {
      scheduleValue = formatDateOnly(backjobScheduleDate);
    }

    if (!scheduleValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid Date", "Use YYYY-MM-DD format.");
      return;
    }

    const selectedDate = parseScheduledDate(scheduleValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!selectedDate || selectedDate < today) {
      Alert.alert("Invalid Date", "Scheduled date cannot be in the past.");
      return;
    }

    setBackjobScheduledDateMutation.mutate(
      {
        jobId: conversation.job.id,
        scheduledDate: scheduleValue,
      },
      {
        onSuccess: () => {
          setShowBackjobScheduleModal(false);
          // Keep local date state intact until server refetch settles to avoid visual reversion.
        },
      },
    );
  };

  const handleConfirmBackjobScheduledDate = () => {
    if (!conversation) return;

    Alert.alert(
      "Confirm Schedule",
      `Confirm backjob scheduled date: ${conversation.backjob?.scheduled_date}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            setLocalBackjobScheduleConfirmed(true);
            confirmBackjobScheduledDateMutation.mutate(
              {
                jobId: conversation.job.id,
              },
              {
                onSuccess: () => {
                  setLocalBackjobScheduleConfirmed(true);
                  refetch();
                },
                onError: () => {
                  setLocalBackjobScheduleConfirmed(false);
                },
              },
            );
          },
        },
      ],
    );
  };

  // Handle submit review
  const handleSubmitReview = () => {
    if (!conversation) return;

    if (reviewModalMode === "edit") {
      const fallbackReview =
        conversation.my_role === "CLIENT"
          ? conversation.client_review
          : conversation.worker_review;

      const reviewToEditId =
        activeEditableReview?.review_id || fallbackReview?.review_id;

      if (!reviewToEditId) {
        Alert.alert("Error", "No review found to edit");
        return;
      }

      // Calculate overall rating from multi-criteria
      const overallRating =
        (ratingQuality +
          ratingCommunication +
          ratingPunctuality +
          ratingProfessionalism) /
        4;

      editReviewMutation.mutate(
        {
          reviewId: reviewToEditId,
          rating: overallRating,
          comment: reviewComment,
          rating_quality: ratingQuality,
          rating_communication: ratingCommunication,
          rating_punctuality: ratingPunctuality,
          rating_professionalism: ratingProfessionalism,
        },
        {
          onSuccess: async () => {
            await refetch();

            const hasMoreEditableTargets =
              reviewModalMode === "edit" &&
              currentEditableReviewIndex <
                editableReviewTargetsRef.current.length - 1;

            if (hasMoreEditableTargets) {
              const nextIndex = currentEditableReviewIndex + 1;
              setCurrentEditableReviewIndex(nextIndex);
              const nextTarget = editableReviewTargetsRef.current[nextIndex];
              if (nextTarget) {
                hydrateReviewInputs(nextTarget);
                Alert.alert(
                  "Review Updated",
                  `Saved. Next: update feedback for ${nextTarget.target_name}.`,
                );
                return;
              }
            }

            setShowReviewModal(false);
            setReviewModalMode("view");
            Alert.alert("Success", "Review updated successfully");
          },
          onError: (error: unknown) => {
            Alert.alert(
              "Error",
              getErrorMessage(error, "Failed to update review"),
            );
          },
        },
      );
      return;
    }

    // Check ratings based on role:
    // CLIENT reviewing WORKER: Punctuality, Reliability, Skill, Workmanship
    // WORKER reviewing CLIENT: Professionalism, Communication, Quality, Value
    const isClientReviewing = conversation.my_role === "CLIENT";

    const isRatingComplete =
      ratingPunctuality > 0 &&
      ratingProfessionalism > 0 &&
      ratingQuality > 0 &&
      ratingCommunication > 0;

    if (!isRatingComplete) {
      Alert.alert(
        "Rating Required",
        isClientReviewing
          ? "Please rate all categories before submitting"
          : "Please select a rating before submitting",
      );
      return;
    }

    if (!reviewComment.trim()) {
      Alert.alert("Comment Required", "Please write a review comment");
      return;
    }

    // Check if this is an agency job with employees
    const isAgencyJob = conversation.is_agency_job;
    const hasMultipleEmployees =
      (conversation.assigned_employees?.length || 0) > 0;
    const pendingEmployees = conversation.pending_employee_reviews || [];

    // For agency jobs (client reviewing), we need reviews for each employee + agency
    if (isAgencyJob && conversation.my_role === "CLIENT") {
      const backendNextAction = conversation.job.next_review_action;
      const submissionStep: "EMPLOYEE" | "AGENCY" =
        backendNextAction === "AGENCY"
          ? "AGENCY"
          : backendNextAction === "EMPLOYEE"
            ? "EMPLOYEE"
            : reviewStep;

      if (submissionStep !== reviewStep) {
        setReviewStep(submissionStep);
      }

      if (submissionStep === "EMPLOYEE") {
        if (backendNextAction === "AGENCY") {
          setReviewStep("AGENCY");
          setEmployeeReviewSubmitted(true);
          Alert.alert(
            "Next Step",
            "Employee reviews are complete. Please rate the agency.",
          );
          return;
        }

        if (pendingEmployees.length === 0 && !conversation.assigned_employee) {
          setReviewStep("AGENCY");
          setEmployeeReviewSubmitted(true);
          Alert.alert(
            "Next Step",
            "Employee reviews are complete. Please rate the agency.",
          );
          return;
        }

        // Determine which employee is being reviewed
        let currentEmployeeId: number;
        let currentEmployeeName: string;

        if (hasMultipleEmployees && pendingEmployees.length > 0) {
          // Multi-employee: use the first pending employee
          currentEmployeeId = pendingEmployees[0];
          const employee = conversation.assigned_employees?.find(
            (e) => e.id === currentEmployeeId,
          );
          currentEmployeeName = employee?.name || "Employee";
        } else if (conversation.assigned_employee) {
          // Legacy single employee
          currentEmployeeId = conversation.assigned_employee.id;
          currentEmployeeName = conversation.assigned_employee.name;
        } else {
          Alert.alert("Error", "No employee assigned to review");
          return;
        }

        // Calculate overall rating for display
        const overallRating =
          (ratingQuality +
            ratingCommunication +
            ratingPunctuality +
            ratingProfessionalism) /
          4;

        submitReviewMutation.mutate(
          {
            job_id: conversation.job.id,
            reviewee_id: currentEmployeeId,
            rating_quality: ratingQuality,
            rating_communication: ratingCommunication,
            rating_punctuality: ratingPunctuality,
            rating_professionalism: ratingProfessionalism,
            comment: reviewComment,
            reviewer_type: "CLIENT",
            review_target: "EMPLOYEE",
            employee_id: currentEmployeeId, // For multi-employee support
          },
          {
            onSuccess: async () => {
              setRatingQuality(0);
              setRatingCommunication(0);
              setRatingPunctuality(0);
              setRatingProfessionalism(0);
              setReviewComment("");

              // Check if there are more employees to review
              const remainingEmployees = pendingEmployees.slice(1);

              if (remainingEmployees.length > 0) {
                // More employees to review
                setCurrentEmployeeIndex(currentEmployeeIndex + 1);
                const nextEmployee = conversation.assigned_employees?.find(
                  (e) => e.id === remainingEmployees[0],
                );
                Alert.alert(
                  "Employee Rated!",
                  `You gave ${currentEmployeeName} a ${overallRating.toFixed(1)}-star rating. Now please rate ${nextEmployee?.name || "the next employee"}.`,
                );
                // Refetch to get updated pending list
                await refetch();
              } else {
                // Employee review stage is complete, move to agency review.
                // Some backend responses do not include `needs_agency_review`,
                // so we transition based on remaining employee queue.
                setEmployeeReviewSubmitted(true);
                setReviewStep("AGENCY");
                Alert.alert(
                  "Employees Rated!",
                  `Great! Now please rate the agency (${conversation.other_participant?.name}).`,
                );
                await refetch();
              }
            },
            onError: (error: unknown) => {
              const errorMessage = getErrorMessage(
                error,
                "Failed to submit review",
              );
              if (
                errorMessage.toLowerCase().includes("already reviewed") ||
                errorMessage.toLowerCase().includes("already submitted") ||
                errorMessage.toLowerCase().includes("already rated")
              ) {
                setRatingQuality(0);
                setRatingCommunication(0);
                setRatingPunctuality(0);
                setRatingProfessionalism(0);
                setReviewComment("");
                refetch().then((result: any) => {
                  const nextAction = result?.data?.job?.next_review_action;
                  const refreshedPendingEmployees =
                    result?.data?.pending_employee_reviews || [];
                  const refreshedEmployees =
                    result?.data?.assigned_employees ||
                    conversation.assigned_employees ||
                    [];

                  if (nextAction === "AGENCY") {
                    setReviewStep("AGENCY");
                    setEmployeeReviewSubmitted(true);
                    Alert.alert(
                      "Employee Already Rated",
                      "Moving to agency review.",
                    );
                    return;
                  }

                  if (refreshedPendingEmployees.length > 0) {
                    const nextEmployee = refreshedEmployees.find(
                      (e: any) => e.id === refreshedPendingEmployees[0],
                    );
                    Alert.alert(
                      "Employee Already Rated",
                      `Moving to next employee: ${nextEmployee?.name || "Employee"}.`,
                    );
                    return;
                  }

                  setLocalAgencyClientReviewSubmitted(true);
                  setReviewStatusSyncing(true);
                  setShowReviewModal(false);
                  Alert.alert(
                    "Already Rated",
                    "You have already rated this employee. Refreshing conversation status.",
                  );
                });
              } else {
                Alert.alert("Error", errorMessage);
              }
            },
          },
        );
      } else {
        // Agency review step
        if (backendNextAction === "EMPLOYEE") {
          setReviewStep("EMPLOYEE");
          setEmployeeReviewSubmitted(false);
          Alert.alert(
            "Rate Employee First",
            "Please rate assigned employee(s) before rating the agency.",
          );
          return;
        }

        submitReviewMutation.mutate(
          {
            job_id: conversation.job.id,
            reviewee_id: 0, // Backend uses job's agency
            rating_quality: ratingQuality,
            rating_communication: ratingCommunication,
            rating_punctuality: ratingPunctuality,
            rating_professionalism: ratingProfessionalism,
            comment: reviewComment,
            reviewer_type: "CLIENT",
            review_target: "AGENCY",
          },
          {
            onSuccess: async () => {
              setRatingQuality(0);
              setRatingCommunication(0);
              setRatingPunctuality(0);
              setRatingProfessionalism(0);
              setReviewComment("");
              setLocalAgencyClientReviewSubmitted(true);
              setReviewStatusSyncing(true);
              setShowReviewModal(false);
              await refetch();
              Alert.alert("Thank You!", "Your reviews have been submitted.");
            },
            onError: async (error: unknown) => {
              const errorMessage = getErrorMessage(
                error,
                "Failed to submit review",
              );

              // If backend says this was already reviewed, recover to a consistent UI state.
              if (
                errorMessage.toLowerCase().includes("already reviewed") ||
                errorMessage.toLowerCase().includes("already submitted") ||
                errorMessage.toLowerCase().includes("already rated")
              ) {
                setRatingQuality(0);
                setRatingCommunication(0);
                setRatingPunctuality(0);
                setRatingProfessionalism(0);
                setReviewComment("");
                setLocalAgencyClientReviewSubmitted(true);
                setReviewStatusSyncing(true);
                setShowReviewModal(false);
                await refetch();
                Alert.alert(
                  "Already Reviewed",
                  "Your agency review is already recorded. Refreshing conversation status.",
                );
              } else {
                Alert.alert("Error", errorMessage);
              }
            },
          },
        );
      }
    } else if (conversation.is_team_job && conversation.my_role === "CLIENT") {
      // Team/hybrid client review queue - supports both freelancers and
      // agency employees as review targets.
      const pendingWorkers = conversation.pending_team_worker_reviews || [];
      const allWorkers = [
        ...(conversation.team_worker_assignments || []),
        ...(conversation.team_agency_employees || []),
      ];

      if (pendingWorkers.length === 0) {
        Alert.alert("All Done!", "You have already reviewed all team workers.");
        return;
      }

      // Get the current target to review (first pending)
      const currentWorker = pendingWorkers[0];
      if (!currentWorker) {
        Alert.alert("Error", "No worker to review");
        return;
      }

      const isEmployeeTarget =
        String(currentWorker.target_type || "WORKER").toUpperCase() ===
          "EMPLOYEE" ||
        Boolean(currentWorker.employee_id);

      const overallRating =
        (ratingQuality +
          ratingCommunication +
          ratingPunctuality +
          ratingProfessionalism) /
        4;

      submitReviewMutation.mutate(
        {
          job_id: conversation.job.id,
          reviewee_id: Number(
            currentWorker.account_id ?? conversation.job.clientId ?? 0,
          ),
          rating_quality: ratingQuality,
          rating_communication: ratingCommunication,
          rating_punctuality: ratingPunctuality,
          rating_professionalism: ratingProfessionalism,
          comment: reviewComment,
          reviewer_type: "CLIENT",
          worker_id: isEmployeeTarget ? undefined : currentWorker.worker_id,
          employee_id: isEmployeeTarget ? currentWorker.employee_id : undefined,
        },
        {
          onSuccess: (data: any) => {
            setRatingQuality(0);
            setRatingCommunication(0);
            setRatingPunctuality(0);
            setRatingProfessionalism(0);
            setReviewComment("");

            const reviewedName =
              data.reviewed_worker_name || currentWorker.name;
            const remaining = data.pending_team_workers || [];

            if (remaining.length > 0) {
              // More workers to review
              const nextWorker = remaining[0];
              Alert.alert(
                "Worker Rated!",
                `You gave ${reviewedName} a ${overallRating.toFixed(1)}-star rating.\n\nNow please rate ${nextWorker.name}.`,
              );
              setCurrentTeamWorkerIndex((prev) => prev + 1);
              refetch();
            } else {
              // All workers reviewed
              setReviewStatusSyncing(true);
              setShowReviewModal(false);
              refetch();
              Alert.alert(
                "All Done!",
                `You gave ${reviewedName} a ${overallRating.toFixed(1)}-star rating.\n\nThank you for reviewing all ${data.total_team_workers || allWorkers.length} team workers!`,
              );
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "Failed to submit review",
            );
            if (
              errorMessage.toLowerCase().includes("already reviewed") ||
              errorMessage.toLowerCase().includes("already submitted") ||
              errorMessage.toLowerCase().includes("already rated")
            ) {
              setRatingQuality(0);
              setRatingCommunication(0);
              setRatingPunctuality(0);
              setRatingProfessionalism(0);
              setReviewComment("");
              refetch().then((result: any) => {
                const refreshedPendingWorkers =
                  result?.data?.pending_team_worker_reviews || [];
                const nextTarget = refreshedPendingWorkers[0];

                if (nextTarget) {
                  Alert.alert(
                    "Already Rated",
                    `That person is already reviewed. Moving to ${nextTarget.name}.`,
                  );
                  return;
                }

                setReviewStatusSyncing(true);
                setShowReviewModal(false);
                Alert.alert(
                  "All Done!",
                  "All required worker reviews are already recorded.",
                );
              });
            } else {
              Alert.alert("Error", errorMessage);
            }
          },
        },
      );
    } else {
      // Regular job or agency reviewing client
      const revieweeId =
        conversation.my_role === "CLIENT"
          ? conversation.job.assignedWorkerId // Worker being reviewed
          : conversation.job.clientId; // Client being reviewed

      if (!revieweeId) {
        Alert.alert("Error", "Unable to determine who to review");
        return;
      }

      // Both roles use multi-criteria ratings
      submitReviewMutation.mutate(
        {
          job_id: conversation.job.id,
          reviewee_id: revieweeId,
          rating_quality: ratingQuality,
          rating_communication: ratingCommunication,
          rating_punctuality: ratingPunctuality,
          rating_professionalism: ratingProfessionalism,
          comment: reviewComment,
          reviewer_type: conversation.my_role as "CLIENT" | "WORKER",
        },
        {
          onSuccess: () => {
            setRatingQuality(0);
            setRatingCommunication(0);
            setRatingPunctuality(0);
            setRatingProfessionalism(0);
            setReviewComment("");
            setReviewStatusSyncing(true);
            setShowReviewModal(false);
            // Refresh conversation to update review status
            refetch();
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "Failed to submit review",
            );
            if (
              errorMessage.toLowerCase().includes("already reviewed") ||
              errorMessage.toLowerCase().includes("already submitted") ||
              errorMessage.toLowerCase().includes("already rated")
            ) {
              setRatingQuality(0);
              setRatingCommunication(0);
              setRatingPunctuality(0);
              setRatingProfessionalism(0);
              setReviewComment("");
              setReviewStatusSyncing(true);
              setShowReviewModal(false);
              refetch();
              Alert.alert(
                "Already Reviewed",
                "Your review is already recorded. Refreshing conversation status.",
              );
              return;
            }

            Alert.alert("Error", errorMessage);
          },
        },
      );
    }
  };

  // Handle send message
  const handleSend = useCallback(
    async (text: string) => {
      setIsSending(true);
      try {
        await sendMutation.mutateAsync({
          conversationId,
          text,
          type: "TEXT",
        });

        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error("[ChatScreen] Failed to send message:", error);
        if (
          !(error instanceof Error && error.message === "CONTACT_INFO_BLOCKED")
        ) {
          Alert.alert(
            "Error",
            getErrorMessage(error, "Failed to send message"),
          );
        }
        throw error; // Re-throw so MessageInput keeps the text for retry
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, sendMutation],
  );

  // Handle image attachment
  const handleImagePress = useCallback(async () => {
    // Show action sheet on iOS, alert on Android
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await pickImageFromCamera();
          } else if (buttonIndex === 2) {
            await pickImageFromGallery();
          }
        },
      );
    } else {
      Alert.alert(
        "Upload Image",
        "Choose an option",
        [
          { text: "Take Photo", onPress: pickImageFromCamera },
          { text: "Choose from Library", onPress: pickImageFromGallery },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true },
      );
    }
  }, [conversationId]);

  const submitConversationReport = useCallback(
    (
      type: "user" | "job" | "message",
      reason:
        | "spam"
        | "harassment"
        | "fraud"
        | "inappropriate"
        | "fake_profile"
        | "other",
      reportedUserId?: number,
    ) => {
      const jobId = conversation?.job?.id;
      if (!jobId) {
        Alert.alert("Report Failed", "Job context is not available yet.");
        return;
      }

      const descriptionByType: Record<"user" | "job" | "message", string> = {
        user: `Reported user from conversation ${conversationId}. Reason: ${reason}`,
        job: `Reported job ${jobId} from conversation ${conversationId}. Reason: ${reason}`,
        message: `Reported abusive conversation/messages in conversation ${conversationId}. Reason: ${reason}`,
      };

      submitReportMutation.mutate(
        {
          report_type: type,
          reason,
          description: descriptionByType[type],
          reported_user_id: reportedUserId,
          related_content_id: type === "job" ? jobId : conversationId,
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
              error instanceof Error
                ? error.message
                : "Failed to submit report",
            );
          },
        },
      );
    },
    [conversationId, conversation?.job?.id, submitReportMutation],
  );

  const openReportReasonPicker = useCallback(
    (type: "user" | "job" | "message", reportedUserId?: number) => {
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
            title:
              type === "user"
                ? "Report User"
                : type === "job"
                  ? "Report Job"
                  : "Report Conversation",
          },
          (index) => {
            if (index === 1)
              submitConversationReport(type, "spam", reportedUserId);
            if (index === 2)
              submitConversationReport(type, "harassment", reportedUserId);
            if (index === 3)
              submitConversationReport(type, "fraud", reportedUserId);
            if (index === 4)
              submitConversationReport(type, "inappropriate", reportedUserId);
            if (index === 5)
              submitConversationReport(type, "fake_profile", reportedUserId);
          },
        );
        return;
      }

      Alert.alert("Select report reason", "Choose a reason", [
        {
          text: "Spam",
          onPress: () => submitConversationReport(type, "spam", reportedUserId),
        },
        {
          text: "Harassment",
          onPress: () =>
            submitConversationReport(type, "harassment", reportedUserId),
        },
        {
          text: "Fraud/Scam",
          onPress: () =>
            submitConversationReport(type, "fraud", reportedUserId),
        },
        {
          text: "Inappropriate",
          onPress: () =>
            submitConversationReport(type, "inappropriate", reportedUserId),
        },
        {
          text: "Fake Profile",
          onPress: () =>
            submitConversationReport(type, "fake_profile", reportedUserId),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [submitConversationReport],
  );

  const openConversationReportMenu = useCallback(() => {
    if (!conversation?.job) {
      Alert.alert("Report", "Conversation context is still loading.");
      return;
    }

    const reportUserTargetId =
      conversation.my_role === "CLIENT"
        ? conversation.job?.assignedWorkerId
        : conversation.job?.clientId;

    if (Platform.OS === "ios") {
      const options = [
        "Cancel",
        ...(reportUserTargetId ? ["Report User"] : []),
        "Report Job",
        "Report Conversation",
      ];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
          title: "Report",
        },
        (index) => {
          if (reportUserTargetId) {
            if (index === 1) openReportReasonPicker("user", reportUserTargetId);
            if (index === 2) openReportReasonPicker("job");
            if (index === 3) openReportReasonPicker("message");
          } else {
            if (index === 1) openReportReasonPicker("job");
            if (index === 2) openReportReasonPicker("message");
          }
        },
      );
      return;
    }

    Alert.alert("Report", "Choose what to report", [
      ...(reportUserTargetId
        ? [
            {
              text: "Report User",
              onPress: () => openReportReasonPicker("user", reportUserTargetId),
            },
          ]
        : []),
      { text: "Report Job", onPress: () => openReportReasonPicker("job") },
      {
        text: "Report Conversation",
        onPress: () => openReportReasonPicker("message"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [conversation, openReportReasonPicker]);

  const pickCashProofFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: `daily_cash_proof_${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    };
  }, []);

  const pickCashProofFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to capture cash proof.",
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: `daily_cash_proof_${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    };
  }, []);

  const selectDailyCashProofImage = useCallback(async () => {
    if (Platform.OS === "ios") {
      return new Promise<{ uri: string; name: string; type: string } | null>(
        (resolve) => {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ["Cancel", "Take Photo", "Choose from Library"],
              cancelButtonIndex: 0,
            },
            async (buttonIndex) => {
              if (buttonIndex === 1) {
                resolve(await pickCashProofFromCamera());
                return;
              }
              if (buttonIndex === 2) {
                resolve(await pickCashProofFromGallery());
                return;
              }
              resolve(null);
            },
          );
        },
      );
    }

    return new Promise<{ uri: string; name: string; type: string } | null>(
      (resolve) => {
        Alert.alert("Cash Payment Proof", "Attach proof image", [
          {
            text: "Take Photo",
            onPress: async () => resolve(await pickCashProofFromCamera()),
          },
          {
            text: "Choose from Library",
            onPress: async () => resolve(await pickCashProofFromGallery()),
          },
          { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
        ]);
      },
    );
  }, [pickCashProofFromCamera, pickCashProofFromGallery]);

  const confirmDailyAttendanceWithPayment = useCallback(
    async (attendance: any) => {
      if (!conversation?.job?.id) {
        return;
      }

      Alert.alert(
        "Choose Payment Method",
        `Confirm ${attendance.worker_name || "worker"} attendance and choose payout method for ₱${Number(attendance.amount_earned || 0).toLocaleString()}.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Wallet",
            onPress: () =>
              setCountdownConfig({
                visible: true,
                title: "Confirm Attendance",
                message: `Confirm attendance and process wallet payout of ₱${Number(attendance.amount_earned || 0).toLocaleString()}?`,
                confirmLabel: "Confirm Wallet",
                countdownSeconds: 3,
                onConfirm: () => {
                  setCountdownConfig(null);
                  clientConfirmAttendanceMutation.mutate({
                    attendanceId: attendance.attendance_id,
                    paymentMethod: "WALLET",
                  });
                },
                icon: "wallet",
                iconColor: Colors.warning,
              }),
          },
          {
            text: "Cash",
            onPress: async () => {
              const proof = await selectDailyCashProofImage();
              if (!proof) {
                return;
              }

              setCountdownConfig({
                visible: true,
                title: "Confirm Cash Payment",
                message:
                  "Confirm attendance and release payout immediately with attached cash proof?",
                confirmLabel: "Confirm Cash",
                countdownSeconds: 3,
                onConfirm: () => {
                  setCountdownConfig(null);
                  clientConfirmAttendanceMutation.mutate({
                    attendanceId: attendance.attendance_id,
                    paymentMethod: "CASH",
                    cashProofImage: proof,
                  });
                },
                icon: "cash",
                iconColor: Colors.success,
              });
            },
          },
        ],
      );
    },
    [
      conversation?.job?.id,
      clientConfirmAttendanceMutation,
      selectDailyCashProofImage,
    ],
  );

  // Pick image from camera
  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to take photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingImageUri(result.assets[0].uri);
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Gallery permission is required to choose photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingImageUri(result.assets[0].uri);
    }
  };

  // Upload image message
  const uploadImageMessage = async (imageUri: string) => {
    const online = await isOnline();

    if (!online) {
      // Add to offline queue
      await addToQueue({
        conversationId,
        text: "",
        type: "IMAGE",
        imageUri,
      });
      Alert.alert("Offline", "Image will be sent when you're back online.");
      return;
    }

    try {
      const fileName = `message_${Date.now()}.jpg`;
      const endpoint = `/api/profiles/chat/${conversationId}/upload-image`;

      const uploadResult = await uploadAsync({
        uri: imageUri,
        endpoint,
        fieldName: "image",
        compress: true,
      });

      if (!uploadResult?.success) {
        throw new Error(
          uploadResult?.error || "Failed to send image. Please try again.",
        );
      }

      resetProgress();

      // Refetch conversation to show the new image message
      await refetch();

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("[ChatScreen] Image upload failed:", error);
      const parsed = getErrorMessage(
        error,
        "Failed to send image. Please try again.",
      );
      const userMessage = parsed
        .toLowerCase()
        .includes("network error during upload")
        ? "Upload failed due to network instability. Please check connection and try again."
        : parsed;
      Alert.alert("Error", userMessage);
    }
  };

  // Handle typing
  const handleTyping = () => {
    sendTyping();
  };

  // Render date separator
  const renderDateSeparator = (date: Date) => {
    const dateString = format(date, "MMMM d, yyyy");

    return (
      <View style={styles.dateSeparator}>
        <Text style={styles.dateSeparatorText}>{dateString}</Text>
      </View>
    );
  };

  // Render message with date separator
  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const currentDate = new Date(item.created_at);
    const previousDate =
      index > 0 ? new Date(chatMessages[index - 1].created_at) : null;

    const showDateSeparator =
      !previousDate || !isSameDay(currentDate, previousDate);

    // Show timestamp only for first message per minute
    const showTimestamp =
      index === 0 ||
      Math.abs(
        new Date(item.created_at).getTime() -
          new Date(chatMessages[index - 1].created_at).getTime(),
      ) > 60000;

    // Extract image URL from attachments if present
    const imageUrl =
      item.attachments && item.attachments.length > 0
        ? item.attachments[0].file_url
        : null;

    return (
      <View>
        {showDateSeparator && renderDateSeparator(currentDate)}
        {item.message_type === "IMAGE" && imageUrl ? (
          <View
            style={[
              styles.imageContainer,
              item.is_mine && styles.imageContainerMine,
            ]}
          >
            <ImageMessage
              imageUrl={imageUrl}
              isMine={item.is_mine}
              width={200}
              height={200}
            />
            {showTimestamp && (
              <Text
                style={[
                  styles.imageTimestamp,
                  item.is_mine && styles.imageTimestampMine,
                ]}
              >
                {format(new Date(item.created_at), "h:mm a")}
              </Text>
            )}
          </View>
        ) : (
          <MessageBubble message={item} showTimestamp={showTimestamp} />
        )}
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <Image
          source={{
            uri:
              conversation?.other_participant?.avatar || "/worker-default.jpg",
          }}
          style={styles.typingAvatar}
        />
        <TypingIndicator />
      </View>
    );
  };

  // Render upload progress
  const renderUploadProgress = () => {
    if (!isUploading) return null;

    return (
      <View style={styles.uploadProgressContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.uploadProgressText}>
          Uploading image... {Math.round(uploadProgress.percentage)}%
        </Text>
      </View>
    );
  };

  // Render offline indicator
  const renderOfflineIndicator = () => {
    // Device truly has no internet connection
    if (!isNetworkOnline) {
      const queueCount = pendingMessages.length;
      return (
        <View style={styles.offlineIndicator}>
          <Ionicons
            name="cloud-offline-outline"
            size={16}
            color={Colors.white}
          />
          <Text style={styles.offlineText}>
            {queueCount > 0
              ? `Offline — ${queueCount} message${queueCount !== 1 ? "s" : ""} queued`
              : "You're offline. Messages will be sent when you reconnect."}
          </Text>
        </View>
      );
    }

    // Device is online but WebSocket is disconnected (reconnecting)
    if (!isWsConnected && hasAttemptedWsConnection) {
      return (
        <View style={styles.reconnectingIndicator}>
          <ActivityIndicator size="small" color={Colors.white} />
          <Text style={styles.offlineText}>Reconnecting to chat...</Text>
        </View>
      );
    }

    return null;
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Stack.Screen
          options={{
            title: "Loading...",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (!conversation) {
    let errorTitle = "Error";
    let errorBody = "Unable to load this conversation.";
    let actionLabel = "Go Back";
    let actionHandler = () => safeGoBack(routerHook, "/(tabs)/messages");

    if (isError && error instanceof ApiResponseError) {
      if (error.status === 403) {
        errorTitle = "Access Denied";
        errorBody =
          "You don't have access to this conversation from your current profile.";
      } else if (error.status === 404) {
        errorTitle = "Conversation Not Found";
        errorBody = "This conversation no longer exists or is unavailable.";
      } else if (error.status >= 500) {
        errorTitle = "Server Error";
        errorBody =
          "The server failed to load the conversation. Please try again.";
        actionLabel = "Retry";
        actionHandler = () => {
          void refetch();
        };
      } else {
        errorBody = error.message || errorBody;
      }
    } else if (isError && error) {
      errorBody = getErrorMessage(error, errorBody);
      if (errorBody.toLowerCase().includes("network")) {
        errorTitle = "Connection Problem";
        actionLabel = "Retry";
        actionHandler = () => {
          void refetch();
        };
      }
    }

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Stack.Screen
          options={{
            title: errorTitle,
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>{errorBody}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={actionHandler}>
            <Text style={styles.retryButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const myWorkerProfileId = Number(user?.profile_data?.workerProfileId);
  const myAccountId = Number(user?.accountID);
  const myTeamAssignment = Array.isArray(conversation.team_worker_assignments)
    ? conversation.team_worker_assignments.find((assignment: any) => {
        const assignmentAccountId = Number(assignment?.account_id);
        const assignmentWorkerId = Number(assignment?.worker_id);
        const accountIdMatch =
          Number.isFinite(assignmentAccountId) &&
          Number.isFinite(myAccountId) &&
          assignmentAccountId === myAccountId;
        const profileIdMatch =
          Number.isFinite(assignmentWorkerId) &&
          Number.isFinite(myWorkerProfileId) &&
          assignmentWorkerId === myWorkerProfileId;
        return accountIdMatch || profileIdMatch;
      })
    : null;

  // Declared here (before myWorkerAttendanceToday) so that the fallback inside
  // the IIFE below can reference them without hitting a const TDZ error.
  const isWorkerSideRole = ["WORKER", "EMPLOYEE", "TEAM_WORKER"].includes(
    String(conversation.my_role || "").toUpperCase(),
  );
  const isTeamAttendanceFlow =
    conversation.is_team_job &&
    (conversation.job?.payment_model === "DAILY" ||
      (conversation.is_team_job === true &&
        conversation.job?.payment_model === "PROJECT"));

  const myWorkerAttendanceToday = (() => {
    const attendanceRows = Array.isArray(conversation.attendance_today)
      ? conversation.attendance_today
      : [];

    const matched = attendanceRows.find((a) => {
      const attendanceWorkerId = Number(a?.worker_id);
      const attendanceWorkerAccountId = Number(a?.worker_account_id);
      const attendanceAssignmentId = Number(a?.assignment_id);
      const myAssignmentId = Number(myTeamAssignment?.assignment_id);

      const profileIdMatch =
        Number.isFinite(attendanceWorkerId) &&
        Number.isFinite(myWorkerProfileId) &&
        attendanceWorkerId === myWorkerProfileId;

      const accountIdMatch =
        Number.isFinite(attendanceWorkerAccountId) &&
        Number.isFinite(myAccountId) &&
        attendanceWorkerAccountId === myAccountId;

      const assignmentIdMatch =
        Number.isFinite(attendanceAssignmentId) &&
        Number.isFinite(myAssignmentId) &&
        attendanceAssignmentId === myAssignmentId;

      return profileIdMatch || accountIdMatch || assignmentIdMatch;
    });

    if (matched) {
      return matched;
    }

    // Fallback for team-worker payloads that can temporarily miss worker/account IDs.
    if (
      isWorkerSideRole &&
      isTeamAttendanceFlow &&
      attendanceRows.length === 1 &&
      myTeamAssignment
    ) {
      return attendanceRows[0];
    }

    return undefined;
  })();
  const hasCheckedInToday = Boolean(myWorkerAttendanceToday?.time_in);
  const hasCheckedOutToday = Boolean(myWorkerAttendanceToday?.time_out);
  const hasMarkedOnTheWayToday = Boolean(
    myWorkerAttendanceToday?.is_dispatched && !myWorkerAttendanceToday?.time_in,
  );
  const onTheWayMarkedAt =
    myWorkerAttendanceToday?.worker_confirmed_at ||
    myWorkerAttendanceToday?.time_in;
  const undoElapsedSeconds = onTheWayMarkedAt
    ? Math.floor((currentTimeMs - new Date(onTheWayMarkedAt).getTime()) / 1000)
    : 0;
  const canUndoCheckIn =
    (hasMarkedOnTheWayToday || hasCheckedInToday) &&
    !hasCheckedOutToday &&
    undoElapsedSeconds >= 0 &&
    undoElapsedSeconds <= 10;
  const hasAnyCheckedInToday = Boolean(
    conversation.attendance_today?.some((a) => Boolean(a.time_in)),
  );
  const hasAnyClientConfirmedToday = Boolean(
    conversation.attendance_today?.some((a) => Boolean(a.client_confirmed)),
  );
  const attendanceRowsToday = Array.isArray(conversation.attendance_today)
    ? conversation.attendance_today
    : [];
  const dailySkipRequestsToday = Array.isArray(
    conversation.daily_skip_requests_today,
  )
    ? conversation.daily_skip_requests_today
    : [];
  const payableAttendanceRowsToday = attendanceRowsToday.filter((row: any) => {
    const status = String(row?.status || "").toUpperCase();
    return status !== "DISPUTED";
  });
  const unpaidAttendanceRowsToday = payableAttendanceRowsToday.filter(
    (row: any) => !Boolean(row?.payment_processed),
  );
  const isTodayWorkdaySettled =
    payableAttendanceRowsToday.length > 0 && unpaidAttendanceRowsToday.length === 0;
  const hasNoWorkMarkedToday = Boolean(
    myWorkerAttendanceToday &&
      myWorkerAttendanceToday.client_confirmed &&
      myWorkerAttendanceToday.status === "ABSENT" &&
      !myWorkerAttendanceToday.time_in,
  );
  const configuredDurationDays = Number(conversation.job?.duration_days || 0);
  const fallbackDurationDays = parseExpectedDurationDays(
    conversation.job?.expectedDuration,
  );
  const effectiveDurationDays =
    configuredDurationDays > 0 ? configuredDurationDays : fallbackDurationDays;
  const totalDaysWorked = Number(conversation.job?.total_days_worked || 0);
  const qaOffset = Number(conversation.qa_day_offset || 0);
  const qaDisplayOffset =
    isTestingModeEnabled && Number.isFinite(qaOffset) && qaOffset > 0
      ? qaOffset
      : 0;
  const effectiveWorkedDays =
    effectiveDurationDays > 0
      ? Math.min(
          effectiveDurationDays,
          Math.max(0, totalDaysWorked + qaDisplayOffset),
        )
      : Math.max(0, totalDaysWorked + qaDisplayOffset);
  const qaMaxOffset =
    effectiveDurationDays > 0 ? Math.max(effectiveDurationDays - 1, 0) : 0;
  const reachedConfiguredDuration =
    effectiveDurationDays > 0 && effectiveWorkedDays >= effectiveDurationDays;
  const reachedQaOffsetLimit =
    isTestingModeEnabled &&
    effectiveDurationDays > 0 &&
    qaOffset >= qaMaxOffset;
  const isDailyTeamFlow =
    conversation.is_team_job === true &&
    conversation.job?.payment_model === "DAILY";
  const scopedTeamFreelancerCount = Array.isArray(
    conversation.team_worker_assignments,
  )
    ? conversation.team_worker_assignments.length
    : 0;
  const scopedTeamAgencyEmployeeCount = Array.isArray(
    conversation.team_agency_employees,
  )
    ? conversation.team_agency_employees.length
    : 0;
  const isHybridTeamDailyFlow =
    isDailyTeamFlow &&
    scopedTeamFreelancerCount > 0 &&
    scopedTeamAgencyEmployeeCount > 0;
  const isMergedTeamDailyFlow =
    isDailyTeamFlow &&
    groupedTeamWorkerAssignments.some(
      (group) => (group.assignment_ids?.length || 0) > 1,
    );
  const isScopedTeamDailyFlow =
    isHybridTeamDailyFlow || isMergedTeamDailyFlow;
  const isTeamProjectAttendance =
    conversation.is_team_job === true &&
    conversation.job?.payment_model === "PROJECT";
  // Declare isProjectMultiDayJob BEFORE isTeamSingleDayProjectAttendanceFlow to
  // avoid a const TDZ reference (isTeamSingleDayProjectAttendanceFlow used it while
  // it was still in the temporal dead zone, making !isProjectMultiDayJob always true).
  const isProjectMultiDayJob =
    conversation.job?.payment_model === "PROJECT" && effectiveDurationDays > 1;
  const isAnyMultiDayFlow = effectiveDurationDays > 1;
  const isTeamSingleDayProjectAttendanceFlow =
    isTeamProjectAttendance && !isProjectMultiDayJob;
  const isDirectHireAgencyJob =
    conversation.is_agency_job === true && conversation.is_team_job !== true;
  const shouldChargePerAttendance = conversation.job?.payment_model === "DAILY";
  const canShowQASkipNextDay =
    conversation.my_role === "CLIENT" &&
    isTestingModeEnabled &&
    conversation.job?.status === "IN_PROGRESS" &&
    (conversation.job?.payment_model === "DAILY" || isProjectMultiDayJob);
  const showDailyEndActions =
    conversation.my_role === "CLIENT" &&
    conversation.job?.payment_model === "DAILY" &&
    conversation.job?.status === "IN_PROGRESS" &&
    (!conversation.is_team_job || isDailyTeamFlow) &&
    (reachedConfiguredDuration || reachedQaOffsetLimit);
  const attendanceRows = Array.isArray(conversation.attendance_today)
    ? conversation.attendance_today
    : [];
  const isProjectMultiDayFlow =
    conversation.job?.payment_model === "PROJECT" && effectiveDurationDays > 1;
  const hasTeamProjectAttendanceSignals =
    conversation.is_team_job &&
    conversation.job?.payment_model === "PROJECT" &&
    (isProjectMultiDayJob || attendanceRows.length > 0);
  const shouldFinishDailyTeamJob =
    conversation.is_team_job === true &&
    conversation.job?.payment_model === "DAILY" &&
    (reachedConfiguredDuration || reachedQaOffsetLimit);
  const showProjectEndActions =
    conversation.my_role === "CLIENT" &&
    conversation.job?.status === "IN_PROGRESS" &&
    isProjectMultiDayFlow &&
    (reachedConfiguredDuration || reachedQaOffsetLimit);
  const showProjectWorkerWaitingInfo =
    conversation.my_role === "WORKER" &&
    conversation.job?.status === "IN_PROGRESS" &&
    isProjectMultiDayFlow &&
    (reachedConfiguredDuration || reachedQaOffsetLimit);
  const isLegacySingleProjectFlow =
    conversation.job?.payment_model !== "DAILY" && !isProjectMultiDayJob;
  const canShowNoWorkQuickAction =
    conversation.my_role === "CLIENT" &&
    !conversation.is_team_job &&
    !isTeamProjectAttendance &&
    !conversation.job?.clientConfirmedWorkStarted &&
    !hasAnyCheckedInToday &&
    !hasAnyClientConfirmedToday;
  const isSoloDailyFlow =
    conversation.job?.payment_model === "DAILY" &&
    !conversation.is_team_job &&
    !conversation.is_agency_job;
  const isWorkerAlreadyCheckedIn = Boolean(
    myWorkerAttendanceToday?.time_in ||
      myWorkerAttendanceToday?.worker_confirmed_at,
  );


  const allTeamProjectAssignmentsCompletedForFinish =
    conversation.my_role === "CLIENT" &&
    isTeamSingleDayProjectAttendanceFlow &&
    (() => {
      const teamWorkers = Array.isArray(conversation.team_worker_assignments)
        ? conversation.team_worker_assignments
        : [];
      const teamAgencyEmployees = Array.isArray(conversation.team_agency_employees)
        ? conversation.team_agency_employees
        : [];

      const totalMembers = teamWorkers.length + teamAgencyEmployees.length;
      if (totalMembers === 0) return false;

      const allWorkersComplete = teamWorkers.every((assignment: any) => {
        const status = String(assignment?.status || "").toUpperCase();
        return Boolean(
          assignment?.worker_marked_complete ||
            assignment?.marked_complete ||
            status === "COMPLETED",
        );
      });

      const allAgencyEmployeesComplete = teamAgencyEmployees.every(
        (employee: any) => {
          const status = String(employee?.status || "").toUpperCase();
          return Boolean(
            employee?.agencyMarkedComplete ||
              employee?.agency_marked_complete ||
              employee?.employeeMarkedComplete ||
              employee?.employee_marked_complete ||
              employee?.marked_complete ||
              status === "COMPLETED",
          );
        },
      );

      return allWorkersComplete && allAgencyEmployeesComplete;
    })();

  const hasClientWorkerOnTheWay = attendanceRows.some(
    (attendance: any) =>
      Boolean(attendance?.is_dispatched) &&
      !attendance?.time_in &&
      !attendance?.time_out &&
      !attendance?.client_confirmed,
  );

  const getEmployeeId = (employee: any): number | null => {
    const normalized = Number(
      employee?.id ?? employee?.employee_id ?? employee?.employeeId,
    );
    return Number.isFinite(normalized) ? normalized : null;
  };

  const isAttendanceRowAbsent = (row: any): boolean => {
    const status = String(row?.status || "").toUpperCase();
    return status === "ABSENT" && Boolean(row?.client_confirmed);
  };

  const isAttendanceRowArrived = (row: any): boolean =>
    Boolean(row?.time_in) || Boolean(row?.client_confirmed);

  const showMarkAbsentConfirmation = (
    workerName: string,
    onConfirm: () => void,
  ) => {
    Alert.alert("Mark Absent", `Mark ${workerName} as absent for today?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Mark Absent",
        style: "destructive",
        onPress: onConfirm,
      },
    ]);
  };

  interface UnifiedClientArrivalAssignment {
    type: "WORKER" | "AGENCY" | "PROJECT" | "ATTENDANCE";
    assignment_id: number;
    attendance_id?: number | null;
    worker_id?: number | null;
    employee_id?: number | null;
    name: string;
    skill?: string | null;
    avatar?: string | null;
    arrived: boolean;
    completed: boolean;
    absent: boolean;
    active_workday: boolean;
    checked_out_pending: boolean;
    can_early_finish: boolean;
    worker_marked_complete: boolean;
    marked_complete: boolean;
    early_completed: boolean;
    early_finish_quote?: number | null;
    early_completion_payout?: number | null;
    amount_earned?: number | null;
    attendance_row?: any;
  }

  const clientArrivalAssignments = (() => {
    if (conversation.my_role !== "CLIENT") {
      return [];
    }

    if (conversation.is_team_job) {
      const workerAssignments = groupedTeamWorkerAssignments;
      const agencyAssignments = conversation.team_agency_employees ?? [];

      const assignments: UnifiedClientArrivalAssignment[] = [
        ...workerAssignments.map((a) => {
          const assignmentIds = Array.isArray(a.assignment_ids)
            ? a.assignment_ids
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id))
            : [];
          const workerRows = teamAssignedWorkers.filter((row: any) =>
            assignmentIds.includes(Number(row?.assignment_id)),
          );
          const actionableWorkerRow =
            workerRows.find(
              (row: any) =>
                Boolean(row?.can_early_finish) &&
                !Boolean(row?.early_completed),
            ) ??
            workerRows.find((row: any) => !Boolean(row?.early_completed)) ??
            workerRows[0];

          const hasWorkerRows = workerRows.length > 0;
          const allRowsArrived = hasWorkerRows
            ? workerRows.every((row: any) =>
                Boolean(row?.client_confirmed_arrival),
              )
            : Boolean(a.client_confirmed_arrival);
          const allRowsCompleted = hasWorkerRows
            ? workerRows.every((row: any) => Boolean(row?.worker_marked_complete))
            : Boolean(a.worker_marked_complete);
          const allRowsEarlyCompleted = hasWorkerRows
            ? workerRows.every((row: any) => Boolean(row?.early_completed))
            : false;

          const pendingEarlyRows = workerRows.filter(
            (row: any) => !Boolean(row?.early_completed),
          );
          const canEarlyFinishAnyPending = pendingEarlyRows.some((row: any) =>
            Boolean(row?.can_early_finish),
          );

          const pendingQuoteValues = pendingEarlyRows
            .map((row: any) => Number(row?.early_finish_quote))
            .filter((value) => Number.isFinite(value));
          const pendingPayoutValues = workerRows
            .map((row: any) => Number(row?.early_completion_payout))
            .filter((value) => Number.isFinite(value));
          const assignmentWorkerId = Number(
            actionableWorkerRow?.worker_id ?? a.worker_id,
          );
          const assignmentAccountId = Number(a.account_id);
          const workerAttendanceRows = attendanceRows.filter((row: any) => {
            const rowAssignmentId = Number(row?.assignment_id);
            const rowWorkerId = Number(row?.worker_id);
            const rowWorkerAccountId = Number(row?.worker_account_id);

            const assignmentMatch =
              Number.isFinite(rowAssignmentId) &&
              assignmentIds.includes(rowAssignmentId);
            const workerMatch =
              Number.isFinite(assignmentWorkerId) &&
              Number.isFinite(rowWorkerId) &&
              rowWorkerId === assignmentWorkerId;
            const accountMatch =
              Number.isFinite(assignmentAccountId) &&
              assignmentAccountId > 0 &&
              Number.isFinite(rowWorkerAccountId) &&
              rowWorkerAccountId === assignmentAccountId;

            return assignmentMatch || workerMatch || accountMatch;
          });
          const hasAbsentAttendance = workerAttendanceRows.some((row: any) =>
            isAttendanceRowAbsent(row),
          );
          const hasAttendanceArrival = workerAttendanceRows.some((row: any) =>
            isAttendanceRowArrived(row),
          );

          return {
            type: "WORKER" as const,
            assignment_id: Number(
              actionableWorkerRow?.assignment_id ?? assignmentIds[0],
            ),
            worker_id: Number.isFinite(assignmentWorkerId)
              ? assignmentWorkerId
              : null,
            name: a.name,
            skill:
              Array.isArray(a.skills) && a.skills.length > 0
                ? a.skills.join(", ")
                : "Team Worker",
            avatar: a.avatar,
            arrived: allRowsArrived || hasAttendanceArrival,
            completed: allRowsCompleted,
            absent: hasAbsentAttendance,
            active_workday: false,
            checked_out_pending: false,
            can_early_finish: canEarlyFinishAnyPending,
            worker_marked_complete: allRowsCompleted,
            marked_complete: allRowsCompleted,
            early_completed: allRowsEarlyCompleted,
            early_finish_quote:
              pendingQuoteValues.length > 0
                ? pendingQuoteValues.reduce((sum, value) => sum + value, 0)
                : null,
            early_completion_payout:
              pendingPayoutValues.length > 0
                ? pendingPayoutValues.reduce((sum, value) => sum + value, 0)
                : null,
          };
        }),
        ...agencyAssignments.map((a) => {
          const assignmentId = Number(a.assignment_id);
          const employeeId = Number.isFinite(Number((a as any)?.id))
            ? Number((a as any).id)
            : Number.isFinite(Number((a as any)?.employee_id))
              ? Number((a as any).employee_id)
              : null;
          const normalizedEmployeeId = Number(employeeId);
          const agencyAttendanceRows = attendanceRows.filter((row: any) => {
            const rowAssignmentId = Number(row?.assignment_id);
            const rowWorkerId = Number(row?.worker_id);
            const assignmentMatch =
              Number.isFinite(rowAssignmentId) &&
              Number.isFinite(assignmentId) &&
              rowAssignmentId === assignmentId;
            const employeeMatch =
              Number.isFinite(rowWorkerId) &&
              Number.isFinite(normalizedEmployeeId) &&
              normalizedEmployeeId > 0 &&
              rowWorkerId === normalizedEmployeeId;
            return assignmentMatch || employeeMatch;
          });
          const hasAbsentAttendance = agencyAttendanceRows.some((row: any) =>
            isAttendanceRowAbsent(row),
          );
          const hasAttendanceArrival = agencyAttendanceRows.some((row: any) =>
            isAttendanceRowArrived(row),
          );

          return {
            type: "AGENCY" as const,
            assignment_id: assignmentId,
            employee_id: employeeId,
            name: a.name,
            skill: a.skill,
            avatar: a.avatar,
            arrived: Boolean(a.clientConfirmedArrival) || hasAttendanceArrival,
            completed: Boolean(
              a.agencyMarkedComplete ||
                a.employeeMarkedComplete ||
                a.marked_complete ||
                String(a.status || "").toUpperCase() === "COMPLETED",
            ),
            absent: hasAbsentAttendance,
            active_workday: false,
            checked_out_pending: false,
            can_early_finish: Boolean(a.can_early_finish),
            worker_marked_complete: Boolean(
              a.employeeMarkedComplete ||
                a.agencyMarkedComplete ||
                a.marked_complete,
            ),
            marked_complete: Boolean(
              a.employeeMarkedComplete ||
                a.agencyMarkedComplete ||
                a.marked_complete,
            ),
            early_completed: Boolean(a.early_completed),
            early_finish_quote: a.early_finish_quote,
            early_completion_payout: a.early_completion_payout,
          };
        }),
      ].filter((assignment) => Number.isFinite(assignment.assignment_id));

      assignments.sort((a, b) => {
        const aPending = !a.arrived;
        const bPending = !b.arrived;
        if (aPending !== bPending) {
          return aPending ? -1 : 1;
        }
        return (a.name || "").localeCompare(b.name || "");
      });

      return assignments;
    }

    const attendanceBasedAssignments: UnifiedClientArrivalAssignment[] = attendanceRows
      .map((row: any, index: number) => {
        const attendanceId = Number(row?.attendance_id ?? row?.id);
        const assignmentId = Number(row?.assignment_id);
        const workerId = Number(row?.worker_id);
        const status = String(row?.status || "").toUpperCase();
        const clientConfirmed = Boolean(row?.client_confirmed);
        const isAbsent = status === "ABSENT" && clientConfirmed;
        const activeWorkday =
          Boolean(row?.time_in) && !Boolean(row?.time_out) && !clientConfirmed;
        const checkedOutPending =
          Boolean(row?.time_in) && Boolean(row?.time_out) && !clientConfirmed;
        const arrived =
          Boolean(row?.time_in) || clientConfirmed || checkedOutPending;

        const fallbackId = 1_000_000 + index;

        return {
          type: "ATTENDANCE" as const,
          assignment_id: Number.isFinite(assignmentId)
            ? assignmentId
            : Number.isFinite(attendanceId)
              ? attendanceId
              : fallbackId,
          attendance_id: Number.isFinite(attendanceId) ? attendanceId : null,
          worker_id: Number.isFinite(workerId) ? workerId : null,
          name: String(row?.worker_name || "Worker").trim() || "Worker",
          skill: null,
          avatar: row?.worker_avatar || null,
          arrived,
          completed: clientConfirmed,
          absent: isAbsent,
          active_workday: activeWorkday,
          checked_out_pending: checkedOutPending,
          can_early_finish: false,
          worker_marked_complete: false,
          marked_complete: false,
          early_completed: false,
          early_finish_quote: null,
          early_completion_payout: null,
          amount_earned: Number(row?.amount_earned || 0),
          attendance_row: row,
        };
      })
      .filter((assignment) => Number.isFinite(assignment.assignment_id));

    if (attendanceBasedAssignments.length > 0) {
      attendanceBasedAssignments.sort((a, b) => {
        const aPending = !a.arrived && !a.absent;
        const bPending = !b.arrived && !b.absent;
        if (aPending !== bPending) {
          return aPending ? -1 : 1;
        }
        return (a.name || "").localeCompare(b.name || "");
      });

      return attendanceBasedAssignments;
    }

    if (!conversation.is_agency_job) {
      return [];
    }

    const agencyCandidates =
      agencyAssignedEmployees.length > 0
        ? agencyAssignedEmployees
        : conversation.assigned_employee
          ? [conversation.assigned_employee]
          : [];

    const fallbackProjectAssignments = agencyCandidates
      .map((employee: any, index: number) => {
        const employeeId = getEmployeeId(employee);
        const assignmentId = Number(employee?.assignment_id);
        const arrived = isAgencyStatusInCurrentBackjobCycle(
          getAgencyArrivedFlag(employee),
          getAgencyArrivedAt(employee),
        );

        const isDispatched =
          isDirectHireAgencyJob ||
          isAgencyStatusInCurrentBackjobCycle(
            getAgencyDispatchedFlag(employee),
            getAgencyDispatchedAt(employee),
          );

        if (!arrived && !isDispatched) {
          return null;
        }

        const fallbackId = 2_000_000 + index;
        return {
          type: "PROJECT" as const,
          assignment_id: Number.isFinite(assignmentId)
            ? assignmentId
            : employeeId ?? fallbackId,
          employee_id: employeeId,
          name: String(employee?.name || "Worker").trim() || "Worker",
          skill: String(employee?.skill || "").trim() || "Agency Employee",
          avatar: employee?.avatar || null,
          arrived,
          completed: Boolean(
            employee?.agencyMarkedComplete ||
              employee?.employeeMarkedComplete ||
              employee?.marked_complete ||
              String(employee?.status || "").toUpperCase() === "COMPLETED",
          ),
          absent: false,
          active_workday: false,
          checked_out_pending: false,
          can_early_finish: false,
          worker_marked_complete: false,
          marked_complete: false,
          early_completed: false,
          early_finish_quote: null,
          early_completion_payout: null,
          amount_earned: null,
          attendance_row: null,
        };
      })
      .filter(Boolean) as UnifiedClientArrivalAssignment[];

    fallbackProjectAssignments.sort((a, b) => {
      const aPending = !a.arrived;
      const bPending = !b.arrived;
      if (aPending !== bPending) {
        return aPending ? -1 : 1;
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    return fallbackProjectAssignments;
  })();

  const teamFreelancerCount = conversation.team_worker_assignments?.length ?? 0;
  const teamAgencyEmployeeCount = conversation.team_agency_employees?.length ?? 0;
  const totalTeamVisibleWorkers = teamFreelancerCount + teamAgencyEmployeeCount;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => {
            safeGoBack(routerHook, "/(tabs)/messages");
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation.is_team_job
              ? (conversation.job?.title ?? "Team Chat")
              : (conversation.other_participant?.name ||
                conversation.job?.title ||
                "Chat")}
          </Text>
          {conversation.is_team_job && (
            <View style={styles.assignedWorkerBadge}>
              <Ionicons name="people" size={12} color={Colors.primary} />
              <Text style={styles.assignedWorkerText} numberOfLines={1}>
                {`Team (${totalTeamVisibleWorkers})${teamFreelancerCount > 0 ? ` • Freelance ${teamFreelancerCount}` : ""}${teamAgencyEmployeeCount > 0 ? ` • Agency ${teamAgencyEmployeeCount}` : ""}`}
              </Text>
            </View>
          )}
          {/* Show assigned workers for agency jobs (client view) - Multi-employee support */}
          {conversation.is_agency_job &&
            conversation.my_role === "CLIENT" &&
            conversation.assigned_employees &&
            conversation.assigned_employees.length > 0 &&
            !conversation.job.workerMarkedComplete && (
              <View style={styles.assignedWorkerBadge}>
                <Ionicons name="people" size={12} color={Colors.primary} />
                <Text style={styles.assignedWorkerText} numberOfLines={1}>
                  {conversation.assigned_employees.length === 1
                    ? `Worker: ${conversation.assigned_employees[0].name}`
                    : `Workers (${conversation.assigned_employees.length}): ${conversation.assigned_employees.map((e) => e.name).join(", ")}`}
                </Text>
              </View>
            )}
          {/* Fallback: Show legacy single assigned worker */}
          {conversation.is_agency_job &&
            conversation.assigned_employee &&
            (!conversation.assigned_employees ||
              conversation.assigned_employees.length === 0) &&
            conversation.my_role === "CLIENT" && (
              <View style={styles.assignedWorkerBadge}>
                <Ionicons name="person" size={12} color={Colors.primary} />
                <Text style={styles.assignedWorkerText}>
                  Worker: {conversation.assigned_employee.name}
                </Text>
              </View>
            )}
          {/* Show "No worker assigned" for agency jobs without assignment */}
          {conversation.is_agency_job &&
            !conversation.assigned_employee &&
            (!conversation.assigned_employees ||
              conversation.assigned_employees.length === 0) &&
            conversation.my_role === "CLIENT" && (
              <View style={styles.noWorkerBadge}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={Colors.textSecondary}
                />
                <Text style={styles.noWorkerText}>
                  Awaiting worker assignment
                </Text>
              </View>
            )}
        </View>
        {/* Header Action Buttons */}
        <View style={styles.headerActions}>
          {/* Voice Call Button - supports both 1-on-1 and group (team job) calls */}
          {(!isConversationClosed ||
            hasApprovedBackjob ||
            hasActiveNegotiation) && (
            <TouchableOpacity
              onPress={async () => {
                if (!AGORA_AVAILABLE) {
                  Alert.alert(
                    "Voice Calling Unavailable",
                    "Voice calling is temporarily disabled in this version. Please use text messaging. Voice calls will be available in the production app.",
                    [{ text: "OK" }],
                  );
                  return;
                }
                const recipientName =
                  conversation.other_participant?.name ||
                  (conversation.is_team_job ? "Group Call" : "Unknown");
                const isGroupCall = conversation.is_team_job === true;
                const started = await initiateCall(
                  conversationId,
                  recipientName,
                  isGroupCall,
                );

                if (!started) {
                  Alert.alert(
                    "Call Failed",
                    callError ||
                      "Could not start voice call. Please check your internet, microphone permission, and account verification.",
                  );
                }
              }}
              style={styles.callButton}
              disabled={callStatus !== "idle"}
            >
              <Ionicons
                name="call-outline"
                size={22}
                color={
                  callStatus === "idle" ? Colors.success : Colors.textSecondary
                }
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push(`/jobs/${conversation.job.id}`)}
            style={styles.infoButton}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openConversationReportMenu}
            style={styles.infoButton}
            disabled={submitReportMutation.isPending}
          >
            {submitReportMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <Ionicons name="flag-outline" size={22} color={Colors.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Offline Indicator */}
        {renderOfflineIndicator()}

        {/* Job Info Header with Action Buttons */}
        <View style={styles.jobHeaderContainer}>
          {isJobTerminalForUI &&
            !hasApprovedBackjob &&
            !hasActiveNegotiation && (
              <View style={styles.completedStatusBannerRow}>
                <View
                  style={[
                    styles.completedStatusBanner,
                    isJobCancelled && styles.cancelledStatusBanner,
                  ]}
                >
                  <Text
                    style={[
                      styles.completedStatusBannerText,
                      isJobCancelled && styles.cancelledStatusBannerText,
                    ]}
                  >
                    {isJobCancelled
                      ? "Job cancelled"
                      : "Job Completed Successfully"}
                  </Text>
                </View>
              </View>
            )}

          <View
            style={[
              styles.jobHeader,
              {
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
              },
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push(`/jobs/${conversation.job.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.jobInfo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {conversation.job.title}
                  </Text>
                </View>
              </View>
              <View style={styles.jobMeta}>
                <Text style={styles.jobBudget}>
                  ₱{conversation.job.budget.toLocaleString()}
                </Text>
                {/* ML Estimated Completion Time - Compact mode */}
                {(isLoading ||
                  (conversation.job.estimatedCompletion &&
                    !isJobCompleted)) && (
                  <EstimatedTimeCard
                    prediction={conversation?.job?.estimatedCompletion || null}
                    compact={true}
                    countdownMode={isJobInProgress}
                    jobStartTime={
                      conversation?.job?.clientConfirmedWorkStarted
                        ? new Date().toISOString()
                        : undefined
                    }
                    isLoading={isLoading}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Buttons Column - stacked vertically, right-aligned */}
            <View style={{ marginLeft: 12, alignItems: "stretch", gap: 6 }}>
              {/* Rate/View Reviews Button */}
              {(canSubmitReview || viewerHasReviewed) && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#FFFFFF",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderWidth: 1,
                    borderColor: "#FBC02D",
                  }}
                  onPress={() => {
                    if (
                      !viewerHasReviewed &&
                      conversation.my_role === "CLIENT" &&
                      conversation.is_agency_job
                    ) {
                      setReviewStep(effectiveAgencyReviewStep);
                    }

                    openReviewModalSafely(
                      viewerHasReviewed ? "view" : "submit",
                    );
                  }}
                >
                  <Ionicons
                    name={viewerHasReviewed ? "document-text-outline" : "star"}
                    size={16}
                    color="#F9A825"
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#F9A825",
                    }}
                  >
                    {viewerHasReviewed
                      ? "View Reviews"
                      : conversation.my_role === "CLIENT"
                        ? conversation.is_agency_job
                          ? effectiveAgencyReviewStep === "EMPLOYEE"
                            ? "Rate Employee"
                            : "Rate Agency"
                          : conversation.is_team_job
                            ? "Rate Workers"
                            : "Rate Worker"
                        : "Rate Client"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* View Receipt Button (Completed + Cancelled for payout transparency) */}
              {(isJobCompleted || isJobCancelled) && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#FFFFFF",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderWidth: 1,
                    borderColor: "#4CCFF8",
                  }}
                  onPress={() => setShowReceiptModal(true)}
                >
                  <Ionicons
                    name={
                      conversation.job.paymentBuffer?.is_payment_released
                        ? "checkmark-circle"
                        : "receipt-outline"
                    }
                    size={16}
                    color="#4CCFF8"
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#4CCFF8",
                    }}
                  >
                    View Receipt
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Action Buttons (replaces role banner) */}
          {isJobInProgress && !conversation.job.clientMarkedComplete && (
            <View style={styles.actionButtonsContainer}>
              {canShowQASkipNextDay &&
                (() => {
                  const qaDayOffset = conversation.qa_day_offset || 0;
                  const effectiveDate =
                    conversation.effective_work_date ||
                    new Date().toISOString().split("T")[0];
                  const canAdvanceQaDay =
                    !configuredDurationDays || qaDayOffset < qaMaxOffset;

                  return (
                    <View style={styles.qaTestingCard}>
                      <View style={styles.qaTestingRow}>
                        <View style={styles.qaTestingInfo}>
                          <Text style={styles.qaTestingLabel}>For Testing</Text>
                          <Text style={styles.qaTestingText}>
                            Effective day: {effectiveDate} (offset +
                            {qaDayOffset})
                          </Text>
                        </View>
                        {canAdvanceQaDay && (
                          <TouchableOpacity
                            style={styles.qaSkipNextDayButton}
                            onPress={() =>
                              Alert.alert(
                                "Skip a Day",
                                "Advance this job by 1 effective day for testing? This action is TESTING-only.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Advance +1 Day",
                                    onPress: () =>
                                      clientQASkipNextDayMutation.mutate({
                                        jobId: conversation.job.id,
                                        reason:
                                          "QA client-triggered fast-forward",
                                      }),
                                  },
                                ],
                              )
                            }
                            disabled={clientQASkipNextDayMutation.isPending}
                          >
                            {clientQASkipNextDayMutation.isPending ? (
                              <ActivityIndicator size="small" color="#00BAF1" />
                            ) : (
                              <Text style={styles.qaSkipNextDayButtonText}>
                                Skip a Day
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                      {!canAdvanceQaDay && (
                        <Text style={styles.qaSkipLimitText}>
                          Reached configured duration. Extend by 1 day or finish
                          the job below.
                        </Text>
                      )}
                    </View>
                  );
                })()}

              {/* Attendance Tracking Section (DAILY + TEAM PROJECT) */}
              {((conversation.job?.payment_model === "DAILY" &&
                !conversation.is_team_job) ||
                isTeamProjectAttendance ||
                isProjectMultiDayJob ||
                isDirectHireAgencyJob) && (
                <View style={styles.dailyAttendanceSection}>
                  <View style={styles.attendanceTopRow}>
                    <View style={styles.attendanceHeaderTop}>
                      <Text style={styles.attendanceHeaderTitle}>
                        Attendance
                      </Text>
                      <Text style={styles.attendanceHeaderDate}>
                        {format(
                          new Date(
                            conversation.effective_work_date || new Date(),
                          ),
                          "MMM d, yyyy",
                        )}
                      </Text>
                    </View>

                    <View style={styles.attendanceActionRight}>
                      {conversation.my_role !== "CLIENT" &&
                      conversation.my_role !== "AGENCY" ? (
                        isSoloDailyFlow ? (
                          <View style={styles.attendanceClientRightSpacer} />
                        ) : hasNoWorkMarkedToday ? (
                          <>
                            <Text style={styles.workerOnTheWayHelperText}>
                              Attendance for today
                            </Text>
                            <View
                              style={[
                                styles.workerOnTheWayQuickButton,
                                styles.workerAbsentQuickButton,
                              ]}
                            >
                              <Ionicons
                                name="close-circle-outline"
                                size={16}
                                color={Colors.white}
                              />
                              <Text
                                style={styles.workerOnTheWayQuickButtonText}
                              >
                                Absent Today
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <Text style={styles.workerOnTheWayHelperText}>
                              {hasCheckedInToday
                                ? "Checked in"
                                : isWorkerAlreadyCheckedIn
                                  ? "You're on the way"
                                  : "Heading to the site?"}
                            </Text>
                            <TouchableOpacity
                              style={[
                                styles.workerOnTheWayQuickButton,
                                isWorkerAlreadyCheckedIn &&
                                  styles.workerOnTheWayQuickButtonDisabled,
                              ]}
                              onPress={() => {
                                if (isWorkerAlreadyCheckedIn) return;
                                workerCheckInMutation.mutate(
                                  conversation.job.id,
                                );
                              }}
                              disabled={
                                workerCheckInMutation.isPending ||
                                isWorkerAlreadyCheckedIn
                              }
                            >
                              {workerCheckInMutation.isPending ? (
                                <ActivityIndicator
                                  size="small"
                                  color={Colors.white}
                                />
                              ) : (
                                <>
                                  <Ionicons
                                    name="car-outline"
                                    size={16}
                                    color={Colors.white}
                                  />
                                  <Text
                                    style={styles.workerOnTheWayQuickButtonText}
                                  >
                                    {hasCheckedInToday &&
                                    myWorkerAttendanceToday?.time_in
                                      ? `Check-In · ${format(
                                          new Date(
                                            myWorkerAttendanceToday.time_in,
                                          ),
                                          "h:mm a",
                                        )}`
                                      : isWorkerAlreadyCheckedIn &&
                                          myWorkerAttendanceToday?.worker_confirmed_at
                                        ? `On The Way · ${format(
                                            new Date(
                                              myWorkerAttendanceToday.worker_confirmed_at,
                                            ),
                                            "h:mm a",
                                          )}`
                                        : "On The Way"}
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </>
                        )
                      ) : canShowNoWorkQuickAction ? (
                        <>
                          <Text style={styles.noWorkQuickHelperText}>
                            Worker no-show today?
                          </Text>
                          <TouchableOpacity
                            style={styles.noWorkQuickButton}
                            onPress={() =>
                              showMarkAbsentConfirmation("worker", () =>
                                clientMarkNoWorkMutation.mutate({
                                  jobId: conversation.job.id,
                                  workerId:
                                    conversation.attendance_today?.[0]?.worker_id,
                                }),
                              )
                            }
                            disabled={clientMarkNoWorkMutation.isPending}
                          >
                            {clientMarkNoWorkMutation.isPending ? (
                              <ActivityIndicator
                                size="small"
                                color={Colors.white}
                              />
                            ) : (
                              <Text style={styles.noWorkQuickButtonText}>
                                Worker Absent
                              </Text>
                            )}
                          </TouchableOpacity>
                        </>
                      ) : (
                        <View style={styles.attendanceClientRightSpacer} />
                      )}
                    </View>
                  </View>

                  {(conversation.my_role === "CLIENT" ||
                    conversation.my_role === "AGENCY") &&
                    (() => {
                      const assignedEmployees = Array.isArray(
                        conversation.assigned_employees,
                      )
                        ? conversation.assigned_employees
                        : [];
                      const dispatchedCount = assignedEmployees.filter(
                        (e) => Boolean(getAgencyDispatchedFlag(e)),
                      ).length;
                      const pendingArrivalCount = assignedEmployees.filter(
                        (e) => {
                          const arrived = Boolean(getAgencyArrivedFlag(e));
                          if (arrived) return false;
                          if (isDirectHireAgencyJob) return true;
                          return Boolean(getAgencyDispatchedFlag(e));
                        },
                      ).length;
                      const onSiteWorkingCount = assignedEmployees.filter(
                        (e: any) =>
                          e.clientConfirmedArrival &&
                          !(
                            e.agencyMarkedComplete ||
                            e.employeeMarkedComplete ||
                            e.marked_complete ||
                            ("status" in e &&
                              String((e as any).status || "").toUpperCase() ===
                                "COMPLETED")
                          ),
                      ).length;

                      const statusText =
                        onSiteWorkingCount > 0
                          ? `${onSiteWorkingCount} employee${onSiteWorkingCount > 1 ? "s" : ""} working on site...`
                          : pendingArrivalCount > 0
                            ? `Confirm Arrivals (${pendingArrivalCount} on the way)`
                            : !isDirectHireAgencyJob &&
                                dispatchedCount < assignedEmployees.length
                              ? `Waiting for agency to dispatch employees (${dispatchedCount} of ${assignedEmployees.length} dispatched)`
                              : null;

                      return (
                        <View style={styles.attendanceClientStatusRow}>
                          {statusText ? (
                            <TouchableOpacity
                              style={styles.attendanceClientStatusTextButton}
                              onPress={toggleAttendanceExpanded}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.attendanceBannerHint}>
                                {statusText}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.attendanceClientRightSpacer} />
                          )}

                          <View style={styles.attendanceClientStatusActions}>
                            {onSiteWorkingCount > 0 && (
                              <TouchableOpacity
                                onPress={() => refetch()}
                                style={styles.attendanceStatusRefreshButton}
                                activeOpacity={0.8}
                              >
                                <Ionicons
                                  name="refresh"
                                  size={18}
                                  color={Colors.primary}
                                />
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.attendanceToggleButton}
                              onPress={toggleAttendanceExpanded}
                              activeOpacity={0.8}
                            >
                              <View style={styles.attendanceToggleInner}>
                                <Ionicons
                                  name={
                                    isAttendanceExpanded
                                      ? "chevron-up"
                                      : "chevron-down"
                                  }
                                  size={18}
                                  color={Colors.textSecondary}
                                />
                                {!isAttendanceExpanded &&
                                  hasClientWorkerOnTheWay && (
                                    <View
                                      style={styles.attendanceOnTheWayDot}
                                    />
                                  )}
                              </View>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })()}

                  {isAttendanceExpanded &&
                    (conversation.my_role === "CLIENT" ||
                      conversation.my_role === "AGENCY") &&
                    (conversation.is_agency_job ||
                      (conversation.is_team_job &&
                        (conversation.team_agency_employees?.length ?? 0) >
                          0)) &&
                    conversation.job.payment_model === "PROJECT" &&
                    (!isProjectMultiDayJob ||
                      isBackjobActiveForDispatch ||
                      isDirectHireAgencyJob) &&
                    (() => {
                      // For pure agency jobs use assigned_employees; for
                      // mixed team+agency jobs use team_agency_employees.
                      const sourceEmployees = conversation.is_team_job
                        ? (conversation.team_agency_employees ?? [])
                        : (conversation.assigned_employees ?? []);

                      const pendingArrivalEmployees = sourceEmployees.filter(
                        (e) => {
                          const arrived = isAgencyStatusInCurrentBackjobCycle(
                            getAgencyArrivedFlag(e),
                            getAgencyArrivedAt(e),
                          );
                          if (arrived) return false;

                          // Direct-hire uses client-first arrival confirmation.
                          if (isDirectHireAgencyJob) return true;

                          return isAgencyStatusInCurrentBackjobCycle(
                            getAgencyDispatchedFlag(e),
                            getAgencyDispatchedAt(e),
                          );
                        },
                      );

                      if (pendingArrivalEmployees.length === 0) return null;

                      return (
                        <View style={styles.attendanceConfirmArrivalList}>
                          {pendingArrivalEmployees.map((employee) => {
                            const employeeId = getEmployeeId(employee);
                            if (employeeId === null) return null;

                            return (
                            <View
                              key={`attendance-arrival-${employeeId}`}
                              style={styles.confirmArrivalWorkerRow}
                            >
                              <Text
                                style={styles.confirmArrivalWorkerName}
                                numberOfLines={1}
                              >
                                {employee.name}
                              </Text>
                              <TouchableOpacity
                                style={styles.confirmArrivalInlineButton}
                                onPress={() =>
                                  Alert.alert(
                                    "Confirm Arrival",
                                    `Has ${employee.name} arrived at the job site?`,
                                    [
                                      { text: "Cancel", style: "cancel" },
                                      {
                                        text: "Confirm",
                                        onPress: () => {
                                          const assignmentId = Number(
                                            (employee as any)?.assignment_id,
                                          );
                                          if (
                                            conversation.is_team_job &&
                                            Number.isFinite(assignmentId)
                                          ) {
                                            if (
                                              isArrivalConfirmPending(
                                                "AGENCY",
                                                assignmentId,
                                              )
                                            ) {
                                              return;
                                            }

                                            setArrivalConfirmPending(
                                              "AGENCY",
                                              assignmentId,
                                              true,
                                            );
                                            confirmTeamEmployeeArrivalMutation.mutate(
                                              {
                                                jobId: conversation.job.id,
                                                assignmentId,
                                              },
                                              {
                                                onSettled: () => {
                                                  setArrivalConfirmPending(
                                                    "AGENCY",
                                                    assignmentId,
                                                    false,
                                                  );
                                                },
                                              },
                                            );
                                            return;
                                          }

                                          if (
                                            isArrivalConfirmPending(
                                              "PROJECT",
                                              employeeId,
                                            )
                                          ) {
                                            return;
                                          }

                                          setArrivalConfirmPending(
                                            "PROJECT",
                                            employeeId,
                                            true,
                                          );

                                          confirmProjectArrivalMutation.mutate({
                                            jobId: conversation.job.id,
                                            employeeId,
                                          }, {
                                            onSettled: () => {
                                              setArrivalConfirmPending(
                                                "PROJECT",
                                                employeeId,
                                                false,
                                              );
                                            },
                                          });
                                        },
                                      },
                                    ],
                                  )
                                }
                                disabled={
                                  conversation.is_team_job
                                    ? (
                                          Number.isFinite(
                                            Number((employee as any)?.assignment_id),
                                          ) &&
                                          isArrivalConfirmPending(
                                            "AGENCY",
                                            Number((employee as any)?.assignment_id),
                                          )
                                      ) ||
                                      confirmTeamEmployeeArrivalMutation.isPending
                                    : isArrivalConfirmPending(
                                        "PROJECT",
                                        employeeId,
                                      ) || confirmProjectArrivalMutation.isPending
                                }
                                activeOpacity={0.85}
                              >
                                {(conversation.is_team_job
                                  ? (
                                      Number.isFinite(
                                        Number((employee as any)?.assignment_id),
                                      ) &&
                                      isArrivalConfirmPending(
                                        "AGENCY",
                                        Number((employee as any)?.assignment_id),
                                      )
                                    ) ||
                                    confirmTeamEmployeeArrivalMutation.isPending
                                  : isArrivalConfirmPending(
                                      "PROJECT",
                                      employeeId,
                                    ) || confirmProjectArrivalMutation.isPending) ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={Colors.white}
                                  />
                                ) : (
                                  <Text
                                    style={
                                      styles.confirmArrivalInlineButtonText
                                    }
                                  >
                                    Confirm Arrival
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                            );
                          })}
                        </View>
                      );
                    })()}

                  {conversation.my_role !== "CLIENT" &&
                    conversation.my_role !== "AGENCY" && (
                      <View style={styles.attendanceToggleRow}>
                        <TouchableOpacity
                          style={styles.attendanceToggleButton}
                          onPress={toggleAttendanceExpanded}
                          activeOpacity={0.8}
                        >
                          <View style={styles.attendanceToggleInner}>
                            <Ionicons
                              name={
                                isAttendanceExpanded
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={18}
                              color={Colors.textSecondary}
                            />
                            {!isAttendanceExpanded &&
                              hasClientWorkerOnTheWay && (
                                <View style={styles.attendanceOnTheWayDot} />
                              )}
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                  {/* Worker View: On-the-way / attendance status */}
                  {isAttendanceExpanded && isWorkerSideRole && (
                    <View style={styles.dailyWorkerActions}>
                      {(() => {
                        const todayAttendance = myWorkerAttendanceToday;
                        const isAbsentToday =
                          String(
                            todayAttendance?.status || "",
                          ).toUpperCase() === "ABSENT" &&
                          !!todayAttendance?.client_confirmed;
                        const attendanceTimeRange =
                          todayAttendance?.time_in && todayAttendance?.time_out
                            ? `${format(new Date(todayAttendance.time_in), "h:mm a")} - ${format(new Date(todayAttendance.time_out), "h:mm a")}`
                            : "";

                        if (isAbsentToday) {
                          return (
                            <View style={styles.dailyStatusContainer}>
                              <View style={styles.workerAttendanceStatusRow}>
                                <Text style={styles.workerAttendanceTimeText}>
                                  --
                                </Text>
                                <View
                                  style={[
                                    styles.workerAttendanceStatusTag,
                                    styles.workerAttendanceStatusTagAbsent,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.workerAttendanceStatusTagText,
                                      styles.workerAttendanceStatusTagTextAbsent,
                                    ]}
                                  >
                                    Absent
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.awaitingConfirmText}>
                                You were marked absent for this day by the
                                client.
                              </Text>
                            </View>
                          );
                        }

                        // No attendance yet - worker marks on the way first
                        if (!todayAttendance || !todayAttendance.time_in) {
                          if (
                            todayAttendance?.is_dispatched
                          ) {
                            return (
                              <View style={styles.dailyStatusContainer}>
                                <View style={styles.workerAttendanceStatusRow}>
                                  <Text style={styles.workerAttendanceTimeText}>
                                    {todayAttendance.worker_confirmed_at
                                      ? format(
                                          new Date(
                                            todayAttendance.worker_confirmed_at,
                                          ),
                                          "h:mm a",
                                        )
                                      : "--"}
                                  </Text>
                                  <View
                                    style={[
                                      styles.workerAttendanceStatusTag,
                                      styles.workerAttendanceStatusTagInfo,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.workerAttendanceStatusTagText,
                                        styles.workerAttendanceStatusTagTextInfo,
                                      ]}
                                    >
                                      On the way
                                    </Text>
                                  </View>
                                </View>
                                {canUndoCheckIn && (
                                  <TouchableOpacity
                                    style={styles.undoCheckInButton}
                                    onPress={() =>
                                      workerCancelCheckInMutation.mutate(
                                        conversation.job.id,
                                      )
                                    }
                                    disabled={
                                      workerCancelCheckInMutation.isPending
                                    }
                                  >
                                    {workerCancelCheckInMutation.isPending ? (
                                      <ActivityIndicator
                                        size="small"
                                        color={Colors.white}
                                      />
                                    ) : (
                                      <Text
                                        style={styles.undoCheckInButtonText}
                                      >
                                        Undo On The Way (
                                        {10 - undoElapsedSeconds}s)
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          }

                          return null;
                        }

                        // Checked in but not out - show check-out button
                        if (
                          todayAttendance.time_in &&
                          !todayAttendance.time_out
                        ) {
                          return (
                            <View style={styles.dailyStatusContainer}>
                              <View style={styles.workerAttendanceStatusRow}>
                                <Text style={styles.workerAttendanceTimeText}>
                                  {format(
                                    new Date(todayAttendance.time_in),
                                    "h:mm a",
                                  )}
                                </Text>
                                <View
                                  style={[
                                    styles.workerAttendanceStatusTag,
                                    styles.workerAttendanceStatusTagInfo,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.workerAttendanceStatusTagText,
                                      styles.workerAttendanceStatusTagTextInfo,
                                    ]}
                                  >
                                    Check-In
                                  </Text>
                                </View>
                              </View>
                              {canUndoCheckIn && (
                                <TouchableOpacity
                                  style={styles.undoCheckInButton}
                                  onPress={() =>
                                    workerCancelCheckInMutation.mutate(
                                      conversation.job.id,
                                    )
                                  }
                                  disabled={
                                    workerCancelCheckInMutation.isPending
                                  }
                                >
                                  {workerCancelCheckInMutation.isPending ? (
                                    <ActivityIndicator
                                      size="small"
                                      color={Colors.white}
                                    />
                                  ) : (
                                    <Text style={styles.undoCheckInButtonText}>
                                      Undo Check-In ({10 - undoElapsedSeconds}s)
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              )}
                              <Text style={styles.awaitingConfirmText}>
                                You are checked in. Once your task is done, wait
                                for the client to mark your check-out.
                              </Text>
                            </View>
                          );
                        }

                        // Checked out - show status
                        if (todayAttendance.time_out) {
                          return (
                            <View style={styles.dailyStatusContainer}>
                              {todayAttendance.client_confirmed ? (
                                isProjectMultiDayJob ? (
                                  <>
                                    <View
                                      style={styles.workerAttendanceStatusRow}
                                    >
                                      <Text
                                        style={styles.workerAttendanceTimeText}
                                      >
                                        {attendanceTimeRange}
                                      </Text>
                                      <View
                                        style={[
                                          styles.workerAttendanceStatusTag,
                                          styles.workerAttendanceStatusTagSuccess,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.workerAttendanceStatusTagText,
                                            styles.workerAttendanceStatusTagTextSuccess,
                                          ]}
                                        >
                                          Day confirmed
                                        </Text>
                                      </View>
                                    </View>
                                    <Text style={styles.awaitingConfirmText}>
                                      {reachedConfiguredDuration ||
                                      reachedQaOffsetLimit
                                        ? "Job duration has been reached. Waiting for client to either extend the project or finish the job and pay."
                                        : "Workday confirmed. Wait for the next workday schedule from your client."}
                                    </Text>
                                  </>
                                ) : (
                                  <>
                                    <View
                                      style={styles.workerAttendanceStatusRow}
                                    >
                                      <Text
                                        style={styles.workerAttendanceTimeText}
                                      >
                                        {attendanceTimeRange}
                                      </Text>
                                      <View
                                        style={[
                                          styles.workerAttendanceStatusTag,
                                          styles.workerAttendanceStatusTagSuccess,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.workerAttendanceStatusTagText,
                                            styles.workerAttendanceStatusTagTextSuccess,
                                          ]}
                                        >
                                          ₱
                                          {Number(
                                            todayAttendance.amount_earned,
                                          ).toLocaleString()}{" "}
                                          paid
                                        </Text>
                                      </View>
                                    </View>
                                    <Text style={styles.awaitingConfirmText}>
                                      Check-out confirmed and paid for today.
                                      You can wait for your next assignment in
                                      this conversation.
                                    </Text>
                                  </>
                                )
                              ) : (
                                <>
                                  <View
                                    style={styles.workerAttendanceStatusRow}
                                  >
                                    <Text
                                      style={styles.workerAttendanceTimeText}
                                    >
                                      {attendanceTimeRange}
                                    </Text>
                                    <View
                                      style={[
                                        styles.workerAttendanceStatusTag,
                                        styles.workerAttendanceStatusTagWarning,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.workerAttendanceStatusTagText,
                                          styles.workerAttendanceStatusTagTextWarning,
                                        ]}
                                      >
                                        Pending
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={styles.awaitingConfirmText}>
                                    {isProjectMultiDayJob &&
                                    (reachedConfiguredDuration ||
                                      reachedQaOffsetLimit)
                                      ? "Today is logged. Job duration has been reached - waiting for client to either extend the project or finish and pay."
                                      : isProjectMultiDayJob
                                        ? "Today is logged. Waiting for client to confirm this workday."
                                        : "Checked out. Waiting for client confirmation/payment."}
                                  </Text>
                                </>
                              )}
                            </View>
                          );
                        }

                        return null;
                      })()}
                    </View>
                  )}

                  {/* Worker/Agency View: Skip Day Request (DAILY team hybrid/merged) */}
                  {conversation.job?.payment_model === "DAILY" &&
                    isScopedTeamDailyFlow &&
                    conversation.my_role !== "CLIENT" &&
                    (() => {
                      const todaySkipForMe = dailySkipRequestsToday.find((request) => {
                        const targetType = String(request?.target_type || "").toUpperCase();
                        if (targetType === "EMPLOYEE") {
                          return Boolean(request?.my_worker_requested);
                        }
                        return Boolean(request?.my_worker_requested);
                      });

                      if (todaySkipForMe) {
                        return (
                          <View
                            style={
                              todaySkipForMe.status === "APPROVED"
                                ? styles.skipDayStatusApproved
                                : todaySkipForMe.status === "REJECTED"
                                  ? styles.skipDayStatusRejected
                                  : styles.clientSkipDayCard
                            }
                          >
                            <Text style={styles.skipDayStatusTitle}>
                              {todaySkipForMe.status === "PENDING"
                                ? "Skip day request pending"
                                : todaySkipForMe.status === "APPROVED"
                                  ? "Skip day approved"
                                  : "Skip day rejected"}
                            </Text>
                            {todaySkipForMe.status === "REJECTED" && (
                              <Text style={styles.skipDayStatusText}>
                                {todaySkipForMe.client_rejection_reason ||
                                  "Client declined your skip day request."}
                              </Text>
                            )}
                          </View>
                        );
                      }

                      if (
                        Boolean(myWorkerAttendanceToday?.time_in) ||
                        Boolean(myWorkerAttendanceToday?.client_confirmed)
                      ) {
                        return null;
                      }

                      const requestTargetEmployee =
                        conversation.my_role === "AGENCY"
                          ? (() => {
                              const candidates = (
                                conversation.team_agency_employees || []
                              )
                                .map((employee: any) => {
                                  const employeeId = Number(
                                    employee?.id ?? employee?.employee_id,
                                  );
                                  if (!Number.isFinite(employeeId)) {
                                    return null;
                                  }

                                  return {
                                    employeeId,
                                    name:
                                      String(employee?.name || "").trim() ||
                                      "Agency Employee",
                                    isPrimaryContact: Boolean(
                                      employee?.isPrimaryContact,
                                    ),
                                  };
                                })
                                .filter(Boolean) as {
                                employeeId: number;
                                name: string;
                                isPrimaryContact: boolean;
                              }[];

                              if (!candidates.length) {
                                return null;
                              }

                              return (
                                candidates.find(
                                  (candidate) => candidate.isPrimaryContact,
                                ) || candidates[0]
                              );
                            })()
                          : null;

                      return (
                        <View style={styles.clientSkipDayCard}>
                          <Text style={styles.clientSkipDayTitle}>Request Skip Day</Text>
                          <Text style={styles.clientSkipDayText}>
                            Ask client approval to skip today for your assigned work.
                          </Text>
                          <View style={styles.clientSkipDayActions}>
                            <TouchableOpacity
                              style={styles.clientSkipApproveButton}
                              onPress={() =>
                                Alert.alert(
                                  "Request Skip Day",
                                  "Submit a skip-day request for today? Client approval is required.",
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                      text: "Submit Request",
                                      onPress: () => {
                                        if (
                                          conversation.my_role === "AGENCY" &&
                                          !requestTargetEmployee
                                        ) {
                                          Alert.alert(
                                            "Missing Employee",
                                            "No assigned agency employee was found for this skip-day request.",
                                          );
                                          return;
                                        }

                                        requestDailySkipDayMutation.mutate({
                                          jobId: conversation.job.id,
                                          request_date:
                                            conversation.effective_work_date ||
                                            new Date().toISOString().slice(0, 10),
                                          ...(conversation.my_role === "AGENCY" &&
                                          requestTargetEmployee
                                            ? {
                                                target_employee_id:
                                                  requestTargetEmployee.employeeId,
                                              }
                                            : {}),
                                        });
                                      },
                                    },
                                  ],
                                )
                              }
                              disabled={
                                requestDailySkipDayMutation.isPending ||
                                (conversation.my_role === "AGENCY" &&
                                  !requestTargetEmployee)
                              }
                            >
                              {requestDailySkipDayMutation.isPending ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                              ) : (
                                <Text style={styles.clientSkipApproveText}>Request Skip Day</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })()}

                  {/* Client View: Skip Day Request Review (DAILY-only) */}
                  {conversation.my_role === "CLIENT" &&
                    conversation.job?.payment_model === "DAILY" &&
                    (() => {
                      if (!dailySkipRequestsToday.length) return null;

                      return dailySkipRequestsToday.map((todaySkipRequest) => {
                        const targetName =
                          todaySkipRequest?.target_name || "Worker";
                        const requestDate =
                          todaySkipRequest?.request_date ||
                          conversation.effective_work_date ||
                          new Date().toISOString().slice(0, 10);

                        if (todaySkipRequest.status === "PENDING") {
                          return (
                            <View
                              key={`skip-pending-${todaySkipRequest.skip_request_id}`}
                              style={styles.clientSkipDayCard}
                            >
                              <Text style={styles.clientSkipDayTitle}>
                                Skip Day Request
                              </Text>
                              <Text style={styles.clientSkipDayText}>
                                {targetName} requested to skip today.
                              </Text>
                              <View style={styles.clientSkipDayActions}>
                                <TouchableOpacity
                                  style={styles.clientSkipApproveButton}
                                  onPress={() =>
                                    Alert.alert(
                                      "Approve Skip Day",
                                      `Approve ${targetName}'s skip-day request?`,
                                      [
                                        {
                                          text: "Cancel",
                                          style: "cancel",
                                        },
                                        {
                                          text: "Approve",
                                          onPress: () =>
                                            clientReviewDailySkipDayMutation.mutate(
                                              {
                                                jobId: conversation.job.id,
                                                skipRequestId:
                                                  todaySkipRequest.skip_request_id,
                                                approve: true,
                                              },
                                              {
                                                onSuccess: () => {
                                                  promptExtendAfterSkipApproval(
                                                    requestDate,
                                                  );
                                                },
                                              },
                                            ),
                                        },
                                      ],
                                    )
                                  }
                                  disabled={
                                    clientReviewDailySkipDayMutation.isPending
                                  }
                                >
                                  <Text style={styles.clientSkipApproveText}>
                                    Approve
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.clientSkipRejectButton}
                                  onPress={() =>
                                    Alert.alert(
                                      "Reject Skip Day",
                                      `Reject ${targetName}'s skip-day request?`,
                                      [
                                        {
                                          text: "Cancel",
                                          style: "cancel",
                                        },
                                        {
                                          text: "Reject",
                                          style: "destructive",
                                          onPress: () =>
                                            clientReviewDailySkipDayMutation.mutate(
                                              {
                                                jobId: conversation.job.id,
                                                skipRequestId:
                                                  todaySkipRequest.skip_request_id,
                                                approve: false,
                                                reason:
                                                  "Client declined skip day request.",
                                              },
                                            ),
                                        },
                                      ],
                                    )
                                  }
                                  disabled={
                                    clientReviewDailySkipDayMutation.isPending
                                  }
                                >
                                  <Text style={styles.clientSkipRejectText}>
                                    Reject
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        }

                        return (
                          <View
                            key={`skip-reviewed-${todaySkipRequest.skip_request_id}`}
                            style={
                              todaySkipRequest.status === "APPROVED"
                                ? styles.skipDayStatusApproved
                                : styles.skipDayStatusRejected
                            }
                          >
                            <Text style={styles.skipDayStatusTitle}>
                              {todaySkipRequest.status === "APPROVED"
                                ? `Skip day approved for ${targetName}`
                                : `Skip day rejected for ${targetName}`}
                            </Text>
                            {todaySkipRequest.status === "REJECTED" && (
                              <Text style={styles.skipDayStatusText}>
                                {todaySkipRequest.client_rejection_reason ||
                                  "Request was declined."}
                              </Text>
                            )}
                          </View>
                        );
                      });
                    })()}

                  {showDailyEndActions && (
                    <View style={styles.dailyEndActionsCard}>
                      <Text style={styles.dailyEndActionsTitle}>
                        {conversation.is_team_job
                          ? "Team DAILY Duration Reached"
                          : "DAILY Duration Reached"}
                      </Text>
                      <Text style={styles.dailyEndActionsText}>
                        {conversation.is_team_job
                          ? `Worked ${effectiveWorkedDays}/${effectiveDurationDays} day(s). Add another day for the team or approve and pay final now.`
                          : `Worked ${effectiveWorkedDays}/${effectiveDurationDays} day(s). Choose to extend one more day (with escrow top-up) or finish this job and proceed to reviews.`}
                      </Text>

                      <View style={styles.dailyEndActionsButtons}>
                        <TouchableOpacity
                          style={styles.dailyExtendButton}
                          onPress={() =>
                            Alert.alert(
                              "Extend by 1 Day",
                              `Add one more day and charge wallet now?\n\nDaily rate: ₱${Number(conversation.job?.daily_rate || 0).toLocaleString()}`,
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Extend +1 Day",
                                  onPress: () =>
                                    dailyExtendOneDayMutation.mutate({
                                      jobId: conversation.job.id,
                                    }),
                                },
                              ],
                            )
                          }
                          disabled={
                            dailyExtendOneDayMutation.isPending ||
                            dailyFinishJobMutation.isPending
                          }
                        >
                          {dailyExtendOneDayMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="add-circle"
                                size={16}
                                color={Colors.white}
                              />
                              <Text style={styles.dailyEndButtonText}>
                                Extend +1 Day
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.dailyFinishButton}
                          onPress={() =>
                            Alert.alert(
                              conversation.is_team_job
                                ? "Approve & Pay Final"
                                : "Finish Daily Job",
                              conversation.is_team_job
                                ? "Finish this team DAILY job and settle final payouts now?"
                                : "Mark this DAILY job as finished now? This will move it into review/backjob flow.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: conversation.is_team_job
                                    ? "Approve & Pay Final"
                                    : "Finish Job",
                                  style: "destructive",
                                  onPress: () =>
                                    dailyFinishJobMutation.mutate(
                                      {
                                        jobId: conversation.job.id,
                                      },
                                      {
                                        onSuccess: () => {
                                          void refetch();
                                          setTimeout(() => {
                                            void refetch();
                                          }, 1200);
                                        },
                                      },
                                    ),
                                },
                              ],
                            )
                          }
                          disabled={
                            dailyFinishJobMutation.isPending ||
                            dailyExtendOneDayMutation.isPending
                          }
                        >
                          {dailyFinishJobMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="flag"
                                size={16}
                                color={Colors.white}
                              />
                               <Text style={styles.dailyEndButtonText}>
                                 {conversation.is_team_job
                                   ? "Approve & Pay Final"
                                   : "Job Finished"}
                               </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {showProjectEndActions && (
                    <View style={styles.projectEndActionsCard}>
                      <Text style={styles.projectEndActionsTitle}>
                        Project Duration Reached
                      </Text>
                      <Text style={styles.projectEndActionsText}>
                        Worked {effectiveWorkedDays}/{effectiveDurationDays}{" "}
                        day(s). You can extend this project by 1 day or finish
                        the job now.
                      </Text>

                      <View style={styles.projectEndActionsButtons}>
                        <TouchableOpacity
                          style={styles.projectExtendButton}
                          onPress={() =>
                            Alert.alert(
                              "Extend Project by 1 Day",
                              "Add one more day to this PROJECT job?",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Extend +1 Day",
                                  onPress: () =>
                                    projectExtendOneDayMutation.mutate({
                                      jobId: conversation.job.id,
                                    }),
                                },
                              ],
                            )
                          }
                          disabled={projectExtendOneDayMutation.isPending}
                        >
                          {projectExtendOneDayMutation.isPending ? (
                            <ActivityIndicator size="small" color="#00BAF1" />
                          ) : (
                            <>
                              <Ionicons
                                name="add-circle"
                                size={16}
                                color="#00BAF1"
                              />
                              <Text style={styles.projectExtendButtonText}>
                                Extend +1 Day
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.projectFinishButton}
                          onPress={() => {
                            if (conversation.is_team_job) {
                              Alert.alert(
                                "Approve Team Completion & Pay",
                                "All team assignments are complete. Continue to choose payment method (Wallet or Cash) for final payment.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Continue",
                                    onPress: () =>
                                      handleApproveTeamJobCompletion(),
                                  },
                                ],
                              );
                              return;
                            }

                            if (conversation.is_agency_job) {
                              Alert.alert(
                                "Finish Agency Project & Pay",
                                "All required workdays are done. Continue to choose payment method (Wallet or Cash) and close this job for reviews/backjob flow.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Continue",
                                    onPress: () => handleApproveCompletion(),
                                  },
                                ],
                              );
                              return;
                            }

                            Alert.alert(
                              "Finish Project Job",
                              "Mark this PROJECT multi-day job as finished now? This will move it into review/backjob flow.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Finish Job",
                                  style: "destructive",
                                  onPress: () =>
                                    projectFinishJobMutation.mutate({
                                      jobId: conversation.job.id,
                                    }),
                                },
                              ],
                            );
                          }}
                          disabled={
                            approveTeamJobCompletionMutation.isPending ||
                            approveAgencyProjectJobMutation.isPending ||
                            projectFinishJobMutation.isPending ||
                            projectExtendOneDayMutation.isPending
                          }
                        >
                          {conversation.is_team_job &&
                          approveTeamJobCompletionMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : conversation.is_agency_job &&
                            approveAgencyProjectJobMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : projectFinishJobMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="flag"
                                size={16}
                                color={Colors.white}
                              />
                              <Text style={styles.projectFinishButtonText}>
                                Job Finished
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {showProjectWorkerWaitingInfo && (
                    <View style={styles.projectWorkerWaitingCard}>
                      <View style={styles.projectWorkerWaitingHeader}>
                        <Ionicons
                          name="hourglass-outline"
                          size={16}
                          color={Colors.warning}
                        />
                        <Text style={styles.projectWorkerWaitingTitle}>
                          Waiting for Client Approval & Payment
                        </Text>
                      </View>
                      <Text style={styles.projectWorkerWaitingText}>
                        Project duration has been reached. Please wait for the
                        client to approve completion and pay the final amount.
                      </Text>
                    </View>
                  )}

                  {/* Client attendance cards were replaced by the unified Team Arrival Status panel. */}

                  {conversation.my_role === "CLIENT" &&
                    isTeamSingleDayProjectAttendanceFlow &&
                    allTeamProjectAssignmentsCompletedForFinish &&
                    !conversation.job.clientMarkedComplete && (
                      <View style={styles.projectEndActionsCard}>
                        <Text style={styles.projectEndActionsTitle}>
                          Team Project Workday Completed
                        </Text>
                        <Text style={styles.projectEndActionsText}>
                          All team members have marked work complete. Finish the
                          entire team PROJECT job and settle final payment.
                        </Text>

                        <View style={styles.projectEndActionsButtons}>
                          <TouchableOpacity
                            style={styles.projectFinishButton}
                            onPress={() => {
                              Alert.alert(
                                "Approve Team Completion & Pay",
                                "All team members are marked complete for this workday. Continue to choose payment method (Wallet or Cash) for final team payment.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Continue",
                                    onPress: () =>
                                      handleApproveTeamJobCompletion(),
                                  },
                                ],
                              );
                            }}
                            disabled={approveTeamJobCompletionMutation.isPending}
                          >
                            {approveTeamJobCompletionMutation.isPending ? (
                              <ActivityIndicator
                                size="small"
                                color={Colors.white}
                              />
                            ) : (
                              <>
                                <Ionicons
                                  name="card"
                                  size={16}
                                  color={Colors.white}
                                />
                                <Text style={styles.projectFinishButtonText}>
                                  Approve & Pay Team
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                  {/* Daily rate info (DAILY-only) */}
                  {isAttendanceExpanded &&
                    conversation.job?.payment_model === "DAILY" && (
                      <View style={styles.dailyRateInfo}>
                        <Text style={styles.dailyRateLabel}>Daily Rate:</Text>
                        <Text style={styles.dailyRateAmount}>
                          ₱
                          {conversation.job.daily_rate?.toLocaleString() || "0"}
                        </Text>
                      </View>
                    )}

                  {/* Single DAILY job: Client — Complete Job Early & Pay Remaining */}
                  {/* Shown only after worker marks today complete and before client completes the job. */}
                  {conversation.my_role === "CLIENT" &&
                    !conversation.is_team_job &&
                    !conversation.is_agency_job &&
                    conversation.job?.payment_model === "DAILY" &&
                    conversation.job?.workerMarkedComplete &&
                    !conversation.job?.clientMarkedComplete && (
                      <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
                        <View>
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: Colors.warning,
                              borderRadius: 8,
                              padding: 12,
                              gap: 8,
                            }}
                            onPress={handleApproveSoloDailyCompletion}
                            disabled={earlyCompleteSingleDailyMutation.isPending}
                          >
                            {earlyCompleteSingleDailyMutation.isPending ? (
                              <ActivityIndicator
                                size="small"
                                color={Colors.white}
                              />
                            ) : (
                              <>
                                <Ionicons
                                  name="wallet"
                                  size={18}
                                  color={Colors.white}
                                />
                                <Text
                                  style={{
                                    color: Colors.white,
                                    fontWeight: "600",
                                    fontSize: 14,
                                  }}
                                >
                                  {`Complete Job Early & Pay Remaining (₱${Number(conversation.job?.remainingPayment ?? 0).toLocaleString()})`}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <Text
                            style={{
                              fontSize: 11,
                              color: Colors.textSecondary,
                              marginTop: 6,
                              textAlign: "center",
                            }}
                          >
                            Worker marked today complete. This pays remaining contracted days and closes the job.
                          </Text>
                        </View>
                      </View>
                    )}
                </View>
              )}

              {/* Unified Arrival Status for all client flows */}
              {conversation.my_role === "CLIENT" &&
                clientArrivalAssignments.length > 0 &&
                !conversation.job.clientMarkedComplete &&
                (() => {
                  const assignments = clientArrivalAssignments;
                  const arrivedCount = assignments.filter(
                    (a) => a.arrived || a.absent,
                  ).length;
                  const completedCount = assignments.filter(
                    (a) => a.completed || a.absent,
                  ).length;
                  const statusTitle = conversation.is_team_job
                    ? "Team Arrival Status"
                    : "Arrival Status";

                  return (
                    <View style={styles.teamProjectArrivalSection}>
                      {isStartDateActionLocked && (
                        <View style={[styles.actionButton, styles.waitingButton]}>
                          <Ionicons
                            name="lock-closed-outline"
                            size={18}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.waitingButtonText}>
                            Arrival and attendance actions unlock on start date.
                          </Text>
                        </View>
                      )}
                      <View style={styles.teamArrivalHeader}>
                        <Text style={styles.teamArrivalTitle}>{statusTitle}</Text>
                        <Text style={styles.teamArrivalProgress}>
                          {arrivedCount}/{assignments.length} arrived
                        </Text>
                      </View>

                      <Text style={styles.teamProjectArrivalSubtext}>
                        Confirm each worker arrival or mark absent to unlock completion flow.
                        {completedCount > 0
                          ? ` ${completedCount}/${assignments.length} completed.`
                          : ""}
                      </Text>

                      <View style={styles.teamProjectArrivalList}>
                        {assignments.map((assignment) => {
                          const firstName = assignment.name?.split(" ")[0] || "Worker";
                          const isArrived = assignment.arrived;
                          const isAbsent = assignment.absent;
                          const isComplete = assignment.completed;
                          const attendance = assignment.attendance_row;
                          const attendanceId = Number(
                            assignment.attendance_id ??
                              attendance?.attendance_id ??
                              attendance?.id,
                          );
                          const hasAttendanceId = Number.isFinite(attendanceId);
                          const assignmentId = Number(assignment.assignment_id);
                          const hasValidAssignmentId =
                            Number.isFinite(assignmentId);
                          const projectTargetId = Number(
                            assignment.employee_id ?? assignment.worker_id,
                          );
                          const hasProjectTargetId = Number.isFinite(projectTargetId);

                          const rowArrivalType: "WORKER" | "AGENCY" | "PROJECT" =
                            assignment.type === "WORKER"
                              ? "WORKER"
                              : assignment.type === "AGENCY"
                                ? "AGENCY"
                                : "PROJECT";

                          const isArrivalPendingForRow =
                            (rowArrivalType === "PROJECT" && hasProjectTargetId) ||
                            (rowArrivalType !== "PROJECT" && hasValidAssignmentId)
                              ? isArrivalConfirmPending(
                                  rowArrivalType,
                                  rowArrivalType === "PROJECT"
                                    ? projectTargetId
                                    : assignmentId,
                                )
                              : false;

                          const isConfirmMutationPending =
                            assignment.type === "AGENCY"
                              ? confirmTeamEmployeeArrivalMutation.isPending
                              : assignment.type === "WORKER"
                                ? confirmTeamWorkerArrivalMutation.isPending
                                : assignment.type === "PROJECT"
                                  ? confirmProjectArrivalMutation.isPending
                                  : clientVerifyArrivalMutation.isPending;

                          const confirmButtonPending =
                            isArrivalPendingForRow || isConfirmMutationPending;

                          const canConfirmArrival =
                            assignment.type === "WORKER"
                              ? hasValidAssignmentId
                              : assignment.type === "AGENCY"
                                ? hasValidAssignmentId
                                : assignment.type === "PROJECT"
                                  ? hasProjectTargetId
                                  : hasAttendanceId;

                          const absentTargetId = Number(
                            assignment.worker_id ?? assignment.employee_id,
                          );
                          const canMarkAbsent = Number.isFinite(absentTargetId);
                          const attendanceTimeRange = attendance?.time_in
                            ? `${format(new Date(attendance.time_in), "h:mm a")}${attendance?.time_out ? ` - ${format(new Date(attendance.time_out), "h:mm a")}` : ""}`
                            : null;

                          const statusLabel = isAbsent
                            ? "Absent"
                            : isComplete
                              ? assignment.type === "ATTENDANCE" &&
                                shouldChargePerAttendance
                                ? `₱${Number(assignment.amount_earned || 0).toLocaleString()}`
                                : "Completed"
                              : isArrived
                                ? "Arrived"
                                : "Not arrived";

                          return (
                            <View
                              key={`arrival-${assignment.type}-${assignment.assignment_id}`}
                            >
                              <View style={styles.teamProjectArrivalRow}>
                                <View style={styles.teamProjectArrivalWorkerInfo}>
                                  {assignment.avatar ? (
                                    <Image
                                      source={{ uri: assignment.avatar }}
                                      style={styles.teamWorkerAvatarCompact}
                                    />
                                  ) : (
                                    <View
                                      style={[
                                        styles.teamWorkerAvatarCompact,
                                        styles.teamWorkerAvatarPlaceholder,
                                      ]}
                                    >
                                      <Ionicons
                                        name="person"
                                        size={16}
                                        color={Colors.textSecondary}
                                      />
                                    </View>
                                  )}

                                  <View
                                    style={styles.teamProjectArrivalWorkerTextBlock}
                                  >
                                    <Text style={styles.teamProjectArrivalWorkerName}>
                                      {firstName}
                                    </Text>
                                    <Text style={styles.teamProjectArrivalWorkerSkill}>
                                      {attendanceTimeRange ||
                                        assignment.skill ||
                                        "Worker"}
                                    </Text>
                                  </View>
                                </View>

                                {assignment.active_workday && hasAttendanceId ? (
                                  <TouchableOpacity
                                    style={[
                                      styles.teamProjectConfirmArrivalButton,
                                      styles.teamProjectCheckoutButton,
                                    ]}
                                    onPress={() =>
                                      Alert.alert(
                                        "Mark Checkout",
                                        `Mark ${assignment.name || "worker"} as done for today?`,
                                        [
                                          { text: "Cancel", style: "cancel" },
                                          {
                                            text: "Mark Checkout",
                                            onPress: () =>
                                              clientMarkCheckoutMutation.mutate({
                                                jobId: conversation.job.id,
                                                attendanceId,
                                              }),
                                          },
                                        ],
                                      )
                                    }
                                    disabled={
                                      isStartDateActionLocked ||
                                      clientMarkCheckoutMutation.isPending
                                    }
                                  >
                                    {clientMarkCheckoutMutation.isPending ? (
                                      <ActivityIndicator
                                        size="small"
                                        color={Colors.white}
                                      />
                                    ) : (
                                      <Text
                                        style={styles.teamProjectConfirmArrivalText}
                                      >
                                        Check-Out
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                ) : assignment.checked_out_pending && hasAttendanceId ? (
                                  <TouchableOpacity
                                    style={styles.teamProjectConfirmArrivalButton}
                                    onPress={() =>
                                      !shouldChargePerAttendance
                                        ? setCountdownConfig({
                                            visible: true,
                                            title: "Confirm Attendance",
                                            message: `Confirm ${assignment.name || "worker"}'s attendance for today? Final payout is processed when the job is finished.`,
                                            confirmLabel: "Confirm Day",
                                            countdownSeconds: 3,
                                            onConfirm: () => {
                                              setCountdownConfig(null);
                                              clientConfirmAttendanceMutation.mutate({
                                                attendanceId,
                                                paymentMethod: "WALLET",
                                              });
                                            },
                                            icon: "checkmark-circle",
                                            iconColor: Colors.warning,
                                          })
                                        : void confirmDailyAttendanceWithPayment(
                                            attendance,
                                          )
                                    }
                                    disabled={
                                      isStartDateActionLocked ||
                                      clientConfirmAttendanceMutation.isPending
                                    }
                                  >
                                    {clientConfirmAttendanceMutation.isPending ? (
                                      <ActivityIndicator
                                        size="small"
                                        color={Colors.white}
                                      />
                                    ) : (
                                      <Text
                                        style={styles.teamProjectConfirmArrivalText}
                                      >
                                        {!shouldChargePerAttendance
                                          ? "Confirm"
                                          : "Pay"}
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                ) : isArrived || isAbsent ? (
                                  <View
                                    style={[
                                      styles.teamProjectStatusBadge,
                                      isAbsent
                                        ? styles.teamProjectStatusBadgeAbsent
                                        : isComplete
                                          ? styles.teamProjectStatusBadgeComplete
                                          : styles.teamProjectStatusBadgeArrived,
                                    ]}
                                  >
                                    <Ionicons
                                      name={
                                        isAbsent
                                          ? "close-circle"
                                          : isComplete
                                            ? "checkmark-done-circle"
                                            : "checkmark-circle"
                                      }
                                      size={14}
                                      color={
                                        isAbsent
                                          ? Colors.error
                                          : isComplete
                                            ? Colors.success
                                            : Colors.primary
                                      }
                                    />
                                    <Text
                                      style={[
                                        styles.teamProjectStatusText,
                                        isAbsent
                                          ? styles.teamProjectStatusTextAbsent
                                          : isComplete
                                            ? styles.teamProjectStatusTextComplete
                                            : styles.teamProjectStatusTextArrived,
                                      ]}
                                    >
                                      {statusLabel}
                                    </Text>
                                  </View>
                                ) : (
                                  <View style={styles.teamProjectArrivalActionRow}>
                                    <TouchableOpacity
                                      style={styles.teamProjectConfirmArrivalButton}
                                      onPress={() => {
                                        if (!canConfirmArrival) {
                                          return;
                                        }

                                        if (assignment.type === "AGENCY") {
                                          handleConfirmTeamEmployeeArrival(
                                            assignmentId,
                                            assignment.name,
                                          );
                                          return;
                                        }

                                        if (assignment.type === "WORKER") {
                                          handleConfirmTeamWorkerArrival(
                                            assignmentId,
                                            assignment.name,
                                          );
                                          return;
                                        }

                                        if (assignment.type === "PROJECT") {
                                          Alert.alert(
                                            "Confirm Arrival",
                                            `Has ${assignment.name} arrived at the job site?`,
                                            [
                                              {
                                                text: "Cancel",
                                                style: "cancel",
                                              },
                                              {
                                                text: "Confirm",
                                                onPress: () => {
                                                  setArrivalConfirmPending(
                                                    "PROJECT",
                                                    projectTargetId,
                                                    true,
                                                  );
                                                  confirmProjectArrivalMutation.mutate(
                                                    {
                                                      jobId: conversation.job.id,
                                                      employeeId: projectTargetId,
                                                    },
                                                    {
                                                      onSettled: () => {
                                                        setArrivalConfirmPending(
                                                          "PROJECT",
                                                          projectTargetId,
                                                          false,
                                                        );
                                                      },
                                                    },
                                                  );
                                                },
                                              },
                                            ],
                                          );
                                          return;
                                        }

                                        Alert.alert(
                                          "Verify Arrival",
                                          `Confirm ${assignment.name || "worker"} has arrived on site?`,
                                          [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                              text: "Verify",
                                              onPress: () =>
                                                clientVerifyArrivalMutation.mutate({
                                                  jobId: conversation.job.id,
                                                  attendanceId,
                                                }),
                                            },
                                          ],
                                        );
                                      }}
                                      disabled={
                                        isStartDateActionLocked ||
                                        !canConfirmArrival ||
                                        confirmButtonPending ||
                                        clientMarkNoWorkMutation.isPending
                                      }
                                    >
                                      {confirmButtonPending ? (
                                        <ActivityIndicator
                                          size="small"
                                          color={Colors.white}
                                        />
                                      ) : (
                                        <Text
                                          style={styles.teamProjectConfirmArrivalText}
                                        >
                                          Confirm
                                        </Text>
                                      )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={[
                                        styles.teamProjectConfirmArrivalButton,
                                        styles.teamProjectMarkAbsentButton,
                                      ]}
                                      onPress={() => {
                                        if (!canMarkAbsent) {
                                          return;
                                        }

                                        showMarkAbsentConfirmation(
                                          assignment.name || "worker",
                                          () =>
                                            clientMarkNoWorkMutation.mutate({
                                              jobId: conversation.job.id,
                                              workerId: absentTargetId,
                                            }),
                                        );
                                      }}
                                      disabled={
                                        isStartDateActionLocked ||
                                        !canMarkAbsent ||
                                        confirmButtonPending ||
                                        clientMarkNoWorkMutation.isPending
                                      }
                                    >
                                      {clientMarkNoWorkMutation.isPending ? (
                                        <ActivityIndicator
                                          size="small"
                                          color={Colors.white}
                                        />
                                      ) : (
                                        <Text
                                          style={styles.teamProjectConfirmArrivalText}
                                        >
                                          Mark Absent
                                        </Text>
                                      )}
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>

                              {conversation.is_team_job &&
                                isAnyMultiDayFlow &&
                                !(
                                  conversation.job?.payment_model === "DAILY" &&
                                  isTodayWorkdaySettled
                                ) &&
                                assignment.can_early_finish &&
                                assignment.marked_complete &&
                                !assignment.early_completed &&
                                (assignment.type === "WORKER" ||
                                  assignment.type === "AGENCY") && (
                                  <TouchableOpacity
                                    style={[
                                      styles.actionButton,
                                      styles.approveCompletionButton,
                                      { marginTop: 6 },
                                    ]}
                                    onPress={() => {
                                      const quote =
                                        assignment.early_finish_quote != null
                                          ? `₱${Number(assignment.early_finish_quote).toLocaleString()}`
                                          : "full contracted amount";
                                      Alert.alert(
                                        "Complete Job Early & Pay",
                                        `Release ${quote} to ${assignment.name?.split(" ")[0] || "this worker"} now and mark them done?`,
                                        [
                                          { text: "Cancel", style: "cancel" },
                                          {
                                            text: "Confirm",
                                            style: "destructive",
                                            onPress: () => {
                                              const jobId = conversation.job.id;
                                              if (!Number.isFinite(assignmentId)) {
                                                return;
                                              }
                                              if (assignment.type === "AGENCY") {
                                                earlyCompleteTeamEmployeeMutation.mutate(
                                                  {
                                                    jobId,
                                                    assignmentId,
                                                  },
                                                );
                                              } else if (
                                                conversation.job?.payment_model ===
                                                "DAILY"
                                              ) {
                                                earlyCompleteTeamWorkerDailyMutation.mutate(
                                                  { jobId, assignmentId },
                                                );
                                              } else {
                                                earlyCompleteTeamWorkerProjectMutation.mutate(
                                                  { jobId, assignmentId },
                                                );
                                              }
                                            },
                                          },
                                        ],
                                      );
                                    }}
                                    disabled={
                                      earlyCompleteTeamEmployeeMutation.isPending ||
                                      earlyCompleteTeamWorkerDailyMutation.isPending ||
                                      earlyCompleteTeamWorkerProjectMutation.isPending
                                    }
                                  >
                                    {earlyCompleteTeamEmployeeMutation.isPending ||
                                    earlyCompleteTeamWorkerDailyMutation.isPending ||
                                    earlyCompleteTeamWorkerProjectMutation.isPending ? (
                                      <ActivityIndicator
                                        size="small"
                                        color={Colors.white}
                                      />
                                    ) : (
                                      <>
                                        <Ionicons
                                          name="flash"
                                          size={16}
                                          color={Colors.white}
                                        />
                                        <Text style={styles.actionButtonText}>
                                          Complete Job Early & Pay (
                                          {assignment.early_finish_quote != null
                                            ? `₱${Number(assignment.early_finish_quote).toLocaleString()}`
                                            : "full amount"}
                                          )
                                        </Text>
                                      </>
                                    )}
                                  </TouchableOpacity>
                                )}

                              {assignment.early_completed &&
                                (assignment.type === "WORKER" ||
                                  assignment.type === "AGENCY") && (
                                  <View
                                    style={[
                                      styles.actionButton,
                                      styles.waitingButton,
                                      { marginTop: 4 },
                                    ]}
                                  >
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={16}
                                      color={Colors.success}
                                    />
                                    <Text
                                      style={[
                                        styles.waitingButtonText,
                                        { color: Colors.success },
                                      ]}
                                    >
                                      {assignment.name?.split(" ")[0]} — Paid
                                      early (₱
                                      {Number(
                                        assignment.early_completion_payout ?? 0,
                                      ).toLocaleString()}
                                      )
                                    </Text>
                                  </View>
                                )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

              {/* TEAM JOB PHASE 2: Worker Marks Assignment Complete */}
              {/* Applies to both DAILY and PROJECT team jobs (simplified flow). */}
              {conversation.is_team_job &&
                !isTeamProjectAttendance &&
                !isProjectMultiDayJob &&
                !hasTeamProjectAttendanceSignals &&
                !conversation.is_agency_job &&
                conversation.my_role === "WORKER" &&
                user &&
                (() => {
                  // Find all worker's own assignments and unify state/actions.
                  const myAssignments = groupedTeamWorkerAssignments.filter(
                    (a) => Number(a.account_id) === Number(user.accountID),
                  );

                  if (myAssignments.length === 0) return null;

                  const representativeAssignment = myAssignments[0];
                  const myAssignmentIds = new Set(
                    myAssignments
                      .flatMap((assignment) => assignment.assignment_ids || [])
                      .map((id) => Number(id))
                      .filter((id) => Number.isFinite(id)),
                  );
                  const myAttendanceRows = attendanceRows.filter((row: any) => {
                    const rowAssignmentId = Number(row?.assignment_id);
                    const rowWorkerAccountId = Number(row?.worker_account_id);

                    const assignmentMatch =
                      Number.isFinite(rowAssignmentId) &&
                      myAssignmentIds.has(rowAssignmentId);

                    const accountMatch =
                      Number.isFinite(rowWorkerAccountId) &&
                      Number.isFinite(Number(user.accountID)) &&
                      rowWorkerAccountId === Number(user.accountID);

                    return assignmentMatch || accountMatch;
                  });

                  const resolvedAttendanceAssignmentIds = new Set(
                    myAttendanceRows
                      .filter(
                        (row: any) =>
                          isAttendanceRowArrived(row) || isAttendanceRowAbsent(row),
                      )
                      .map((row: any) => Number(row?.assignment_id))
                      .filter((id: number) => Number.isFinite(id)),
                  );

                  const hasResolvedAttendanceWithoutAssignmentLink =
                    myAttendanceRows.some(
                      (row: any) =>
                        (isAttendanceRowArrived(row) ||
                          isAttendanceRowAbsent(row)) &&
                        !Number.isFinite(Number(row?.assignment_id)),
                    );

                  const allArrived = myAssignments.every((assignment) => {
                    const assignmentIds = Array.isArray(assignment.assignment_ids)
                      ? assignment.assignment_ids
                          .map((id: any) => Number(id))
                          .filter((id: number) => Number.isFinite(id))
                      : [];

                    if (assignment.client_confirmed_arrival) {
                      return true;
                    }

                    if (!assignmentIds.length) {
                      return hasResolvedAttendanceWithoutAssignmentLink;
                    }

                    return assignmentIds.every((id: number) =>
                      resolvedAttendanceAssignmentIds.has(id),
                    );
                  });
                  const allCompleted = myAssignments.every(
                    (a) => a.worker_marked_complete,
                  );

                  // Attendance-driven team project flow supersedes legacy assignment phases.
                  // Only hide the legacy "Mark My Assignment Complete" UI when this is a
                  // team PROJECT (attendance-driven) flow — not team DAILY. For team DAILY,
                  // client_confirmed on attendance is normal and should NOT blank the screen.
                  if (
                    isTeamProjectAttendance &&
                    myWorkerAttendanceToday &&
                    (Boolean(myWorkerAttendanceToday.is_dispatched) ||
                      Boolean(myWorkerAttendanceToday.time_in) ||
                      Boolean(myWorkerAttendanceToday.time_out) ||
                      Boolean(myWorkerAttendanceToday.client_confirmed))
                  ) {
                    return null;
                  }

                  // Check if arrival was confirmed
                  if (!allArrived) {
                    return (
                      <View style={[styles.actionButton, styles.waitingButton]}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.waitingButtonText}>
                          Waiting for client to confirm your arrival or mark absent on all assigned slots...
                        </Text>
                      </View>
                    );
                  }

                  // Show mark complete button if not yet marked
                  if (!allCompleted) {
                    return (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.markCompleteButton]}
                        onPress={() =>
                          handleMarkTeamAssignmentComplete(
                            representativeAssignment.assignment_ids[0],
                          )
                        }
                        disabled={markTeamAssignmentCompleteMutation.isPending}
                      >
                        {markTeamAssignmentCompleteMutation.isPending ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.white}
                          />
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-done"
                              size={20}
                              color={Colors.white}
                            />
                            <Text style={styles.actionButtonText}>
                              Mark My Work Complete (All Assigned Roles)
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  }

                  // Show waiting for client approval
                  if (
                    conversation.job?.payment_model === "DAILY" &&
                    isTodayWorkdaySettled
                  ) {
                    return (
                      <View style={[styles.actionButton, styles.completedAction]}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={Colors.success}
                        />
                        <Text
                          style={[
                            styles.actionButtonText,
                            { color: Colors.success },
                          ]}
                        >
                          ✓ Workday settled. Waiting for next day dispatch.
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={[styles.actionButton, styles.waitingButton]}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.waitingButtonText}>
                        ✓ All assigned roles complete. Waiting for client approval...
                      </Text>
                    </View>
                  );
                })()}

              {/* TEAM JOB PHASE 3: Client Approves All Workers */}
              {/* Applies to both DAILY and PROJECT team jobs (simplified flow). */}
              {/* Excluded when agency employees are also on the job — that case */}
              {/* is handled by the agency CLIENT VIEW panel below, which shows */}
              {/* a single "Approve & Pay All" button for both freelancers + agency. */}
              {conversation.is_team_job &&
                !conversation.is_agency_job &&
                !((conversation.team_agency_employees?.length ?? 0) > 0) &&
                conversation.my_role === "CLIENT" &&
                !isTeamProjectAttendance &&
                !isProjectMultiDayJob &&
                conversation.team_worker_assignments &&
                conversation.team_worker_assignments.length > 0 &&
                (() => {
                  const isTeamDailyAttendanceFlow =
                    shouldChargePerAttendance &&
                    conversation.job?.payment_model === "DAILY";

                  const dailyResolvedAssignments = isTeamDailyAttendanceFlow
                    ? clientArrivalAssignments.filter(
                        (assignment) => assignment.arrived || assignment.absent,
                      )
                    : [];

                  const dailyPendingResolutionCount = isTeamDailyAttendanceFlow
                    ? clientArrivalAssignments.filter(
                        (assignment) => !assignment.arrived && !assignment.absent,
                      ).length
                    : 0;

                  const hasUnpaidPayableAttendanceRowForAssignment = (
                    assignment: UnifiedClientArrivalAssignment,
                  ) => {
                    return attendanceRows.some((row: any) => {
                      const status = String(row?.status || "").toUpperCase();
                      const isPayableStatus =
                        status === "PRESENT" || status === "HALF_DAY";

                      if (!isPayableStatus || Boolean(row?.payment_processed)) {
                        return false;
                      }

                      const rowAssignmentId = Number(row?.assignment_id);
                      const assignmentId = Number(assignment.assignment_id);
                      if (
                        Number.isFinite(rowAssignmentId) &&
                        Number.isFinite(assignmentId) &&
                        rowAssignmentId === assignmentId
                      ) {
                        return true;
                      }

                      const rowWorkerId = Number(row?.worker_id);
                      const assignmentWorkerId = Number(
                        assignment.worker_id ?? assignment.employee_id,
                      );
                      if (
                        Number.isFinite(rowWorkerId) &&
                        Number.isFinite(assignmentWorkerId) &&
                        rowWorkerId === assignmentWorkerId
                      ) {
                        return true;
                      }

                      return false;
                    });
                  };

                  const dailyCompletionRequiredAssignments =
                    isTeamDailyAttendanceFlow
                      ? dailyResolvedAssignments.filter(
                          (assignment) =>
                            assignment.arrived &&
                            hasUnpaidPayableAttendanceRowForAssignment(assignment),
                        )
                      : [];

                  const allDailyCompletionRequiredComplete =
                    !isTeamDailyAttendanceFlow ||
                    dailyCompletionRequiredAssignments.every((assignment) =>
                      Boolean(
                        assignment.completed ||
                          assignment.worker_marked_complete ||
                          assignment.marked_complete ||
                          assignment.early_completed,
                      ),
                    );

                  const dailyPayableRows = isTeamDailyAttendanceFlow
                    ? attendanceRows.filter((row: any) => {
                        const status = String(row?.status || "").toUpperCase();
                        const isPayableStatus =
                          status === "PRESENT" || status === "HALF_DAY";
                        return isPayableStatus && !Boolean(row?.payment_processed);
                      })
                    : [];

                  const uniqueWorkerUnits =
                    groupedTeamWorkerAssignments.length > 0
                      ? groupedTeamWorkerAssignments
                      : conversation.team_worker_assignments.map((a) => ({
                          client_confirmed_arrival: Boolean(
                            a.client_confirmed_arrival,
                          ),
                          worker_marked_complete: Boolean(
                            a.worker_marked_complete,
                          ),
                        }));

                  const totalWorkerUnits = uniqueWorkerUnits.length;
                  // Treat job-level workerMarkedComplete as a fallback for all-complete
                  // in case individual assignment flags are not yet set.
                  const allWorkersComplete =
                    (isTeamDailyAttendanceFlow
                      ? allDailyCompletionRequiredComplete
                      : conversation.job.workerMarkedComplete) ||
                    uniqueWorkerUnits.every(
                      (a) => a.worker_marked_complete,
                    );
                  const allWorkersArrived =
                    isTeamDailyAttendanceFlow
                      ? dailyPendingResolutionCount === 0
                      : uniqueWorkerUnits.every(
                          (a) => a.client_confirmed_arrival,
                        );
                  const allAssignmentsEarlyCompleted =
                    shouldChargePerAttendance &&
                    conversation.team_worker_assignments.length > 0 &&
                    conversation.team_worker_assignments.every(
                      (a) => a.early_completed,
                    );
                  const arrivedCount = uniqueWorkerUnits.filter(
                    (a) => a.client_confirmed_arrival,
                  ).length;
                  // For agency jobs: when agency marks complete at job level,
                  // treat all assigned workers as having completed.
                  const completedCount = conversation.job.workerMarkedComplete
                    ? totalWorkerUnits
                    : uniqueWorkerUnits.filter((a) => a.worker_marked_complete)
                        .length;

                  // Show waiting for arrivals if not all arrived
                  if (!allWorkersArrived) {
                    return (
                      <View style={[styles.actionButton, styles.waitingButton]}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.waitingButtonText}>
                          {isTeamDailyAttendanceFlow
                            ? `Resolve all worker statuses first (${totalWorkerUnits - dailyPendingResolutionCount} of ${totalWorkerUnits} resolved)`
                            : `Confirm all worker arrivals first (${arrivedCount} of ${totalWorkerUnits} arrived)`}
                        </Text>
                      </View>
                    );
                  }

                  // Show progress if not all complete
                  if (!allWorkersComplete) {
                    return (
                      <>
                        <View
                          style={[styles.actionButton, styles.waitingButton]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.waitingButtonText}>
                            {isTeamDailyAttendanceFlow
                              ? `${dailyCompletionRequiredAssignments.filter((assignment) =>
                                  Boolean(
                                    assignment.completed ||
                                      assignment.worker_marked_complete ||
                                      assignment.marked_complete ||
                                      assignment.early_completed,
                                  ),
                                ).length} of ${dailyCompletionRequiredAssignments.length} arrived workers marked complete...`
                              : `${completedCount} of ${totalWorkerUnits} workers marked complete...`}
                          </Text>
                        </View>
                        {/* Pay Now (Optional) — PROJECT team jobs only; not applicable for DAILY */}
                        {!shouldChargePerAttendance &&
                          !conversation.job.remainingPaymentPaid &&
                          !conversation.job.clientMarkedComplete && (
                            <TouchableOpacity
                              style={[
                                styles.actionButton,
                                styles.waitingButton,
                              ]}
                              onPress={handlePayNow}
                              disabled={createFinalPaymentMutation.isPending}
                            >
                              {createFinalPaymentMutation.isPending ? (
                                <ActivityIndicator
                                  size="small"
                                  color={Colors.textPrimary}
                                />
                              ) : (
                                <>
                                  <Ionicons
                                    name="flash"
                                    size={20}
                                    color={Colors.textPrimary}
                                  />
                                  <Text
                                    style={[
                                      styles.waitingButtonText,
                                      { color: Colors.textPrimary },
                                    ]}
                                  >
                                    Pay Now (Optional)
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}
                        {!shouldChargePerAttendance &&
                          conversation.job.remainingPaymentPaid && (
                          <View
                            style={[
                              styles.actionButton,
                              styles.completedAction,
                            ]}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={Colors.success}
                            />
                            <Text
                              style={[
                                styles.actionButtonText,
                                { color: Colors.success },
                              ]}
                            >
                              Final payment done. Approve when all workers
                              complete.
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  }

                  // Show approve button if all complete and not yet approved
                  if (!conversation.job.clientMarkedComplete) {
                    if (shouldFinishDailyTeamJob) {
                      return null;
                    }

                    if (isTodayWorkdaySettled && !shouldFinishDailyTeamJob) {
                      return (
                        <View style={[styles.actionButton, styles.completedAction]}>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={Colors.success}
                          />
                          <Text
                            style={[
                              styles.actionButtonText,
                              { color: Colors.success },
                            ]}
                          >
                            ✓ Workday settled. Waiting for next day dispatch.
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <>
                        {!shouldChargePerAttendance &&
                          conversation.job.remainingPaymentPaid && (
                          <View
                            style={[
                              styles.actionButton,
                              styles.completedAction,
                            ]}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={Colors.success}
                            />
                            <Text
                              style={[
                                styles.actionButtonText,
                                { color: Colors.success },
                              ]}
                            >
                              Final payment completed. Approve completion below.
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.approveCompletionButton,
                          ]}
                          onPress={
                            shouldChargePerAttendance
                              ? shouldFinishDailyTeamJob
                                ? handleFinishDailyTeamJob
                                : handleApproveDailyTeamWorkday
                              : handleApproveTeamJobCompletion
                          }
                          disabled={
                            shouldChargePerAttendance
                              ? shouldFinishDailyTeamJob
                                ? dailyFinishJobMutation.isPending
                                : isBulkDailySettlementInFlight
                              : approveTeamJobCompletionMutation.isPending ||
                                  isApprovePayPreflightInFlight
                          }
                        >
                          {(shouldChargePerAttendance
                            ? shouldFinishDailyTeamJob
                              ? dailyFinishJobMutation.isPending
                              : isBulkDailySettlementInFlight
                            : approveTeamJobCompletionMutation.isPending ||
                                      isApprovePayPreflightInFlight) ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name={
                                  shouldChargePerAttendance
                                    ? shouldFinishDailyTeamJob
                                      ? "flag"
                                      : "wallet"
                                    : conversation.job.remainingPaymentPaid
                                      ? "checkmark-circle"
                                      : "wallet"
                                }
                                size={20}
                                color={Colors.white}
                              />
                                <Text style={styles.actionButtonText}>
                                  {shouldChargePerAttendance
                                    ? shouldFinishDailyTeamJob
                                      ? `Finish Team Job & Settle Remaining (₱${Number(conversation.job.remainingPayment ?? 0).toLocaleString()})`
                                      : dailyPayableRows.length > 0
                                        ? "Approve & Pay for Today"
                                        : "No Payable Rows for Today"
                                    : conversation.job.remainingPaymentPaid ||
                                        allAssignmentsEarlyCompleted
                                      ? "Approve Team Completion"
                                      : `Approve & Pay Team (₱${Number(conversation.job.remainingPayment ?? 0).toLocaleString()})`}
                                </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    );
                  }

                  return null;
                })()}

              {/* ============================================================ */}
              {/* MATERIALS PURCHASING WORKFLOW (Regular Jobs Only) */}
              {/* Shows BEFORE "Confirm Worker Has Arrived" when materials are needed */}
              {/* ============================================================ */}
              {!conversation.is_team_job &&
                isJobInProgress &&
                conversation.job.materials_status &&
                conversation.job.materials_status !== "NONE" &&
                conversation.job.materials_status !== "APPROVED" &&
                !conversation.job.clientConfirmedWorkStarted && (
                  <View style={styles.materialsSection}>
                    <View style={styles.materialsSectionHeader}>
                      <Ionicons name="cart" size={20} color={Colors.primary} />
                      <Text style={styles.materialsSectionTitle}>
                        Materials Purchasing
                      </Text>
                    </View>

                    {/* Materials list */}
                    {(conversation.job_materials || []).map(
                      (mat: JobMaterialItem) => (
                        <View key={mat.id} style={styles.materialItem}>
                          <View style={styles.materialItemHeader}>
                            <Text style={styles.materialItemName}>
                              {mat.name}
                              {mat.quantity > 1 ? ` (x${mat.quantity})` : ""}
                            </Text>
                            {mat.source === "FROM_PROFILE" ? (
                              <View style={styles.materialBadgeOwn}>
                                <Text style={styles.materialBadgeOwnText}>
                                  Own Material
                                </Text>
                              </View>
                            ) : mat.client_approved ? (
                              <View style={styles.materialBadgeApproved}>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={14}
                                  color="#16a34a"
                                />
                                <Text style={styles.materialBadgeApprovedText}>
                                  Approved
                                </Text>
                              </View>
                            ) : mat.client_rejected ? (
                              <View style={styles.materialBadgeRejected}>
                                <Text style={styles.materialBadgeRejectedText}>
                                  Rejected
                                </Text>
                              </View>
                            ) : mat.source === "PURCHASED" ? (
                              <View style={styles.materialBadgePending}>
                                <Text style={styles.materialBadgePendingText}>
                                  Awaiting Approval
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.materialBadgeToBuy}>
                                <Text style={styles.materialBadgeToBuyText}>
                                  To Purchase
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Purchase price if set */}
                          {mat.purchase_price != null && (
                            <Text style={styles.materialPrice}>
                              ₱{mat.purchase_price.toLocaleString()}
                            </Text>
                          )}

                          {/* CLIENT: Approve/Reject purchased materials */}
                          {conversation.my_role === "CLIENT" &&
                            mat.source === "PURCHASED" &&
                            !mat.client_approved &&
                            !mat.client_rejected && (
                              <View style={styles.materialActions}>
                                <TouchableOpacity
                                  style={styles.materialApproveBtn}
                                  onPress={() => {
                                    Alert.alert(
                                      "Approve Material",
                                      `Approve ₱${mat.purchase_price?.toLocaleString()} for ${mat.name}? This will be added to the final payment.`,
                                      [
                                        {
                                          text: "Cancel",
                                          style: "cancel",
                                        },
                                        {
                                          text: "Approve",
                                          onPress: () =>
                                            approveMaterialMutation.mutate({
                                              jobId: conversation.job.id,
                                              materialId: mat.id,
                                            }),
                                        },
                                      ],
                                    );
                                  }}
                                >
                                  <Ionicons
                                    name="checkmark"
                                    size={16}
                                    color="#fff"
                                  />
                                  <Text style={styles.materialApproveBtnText}>
                                    Approve
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.materialRejectBtn}
                                  onPress={() => {
                                    Alert.alert(
                                      "Reject Material",
                                      `Reject the purchase of ${mat.name}?`,
                                      [
                                        {
                                          text: "Cancel",
                                          style: "cancel",
                                        },
                                        {
                                          text: "Reject",
                                          style: "destructive",
                                          onPress: () =>
                                            rejectMaterialMutation.mutate({
                                              jobId: conversation.job.id,
                                              materialId: mat.id,
                                            }),
                                        },
                                      ],
                                    );
                                  }}
                                >
                                  <Ionicons
                                    name="close"
                                    size={16}
                                    color="#fff"
                                  />
                                  <Text style={styles.materialRejectBtnText}>
                                    Reject
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}

                          {/* WORKER: Upload purchase proof for TO_PURCHASE items */}
                          {conversation.my_role === "WORKER" &&
                            mat.source === "TO_PURCHASE" && (
                              <TouchableOpacity
                                style={styles.materialUploadBtn}
                                onPress={async () => {
                                  // Pick an image for the receipt
                                  const result =
                                    await ImagePicker.launchImageLibraryAsync({
                                      mediaTypes: "images",
                                      allowsEditing: true,
                                      quality: 0.7,
                                    });
                                  if (!result.canceled && result.assets[0]) {
                                    setPriceModal({
                                      visible: true,
                                      matId: mat.id,
                                      matName: mat.name,
                                      imageUri: result.assets[0].uri,
                                      jobId: conversation.job.id,
                                    });
                                    setPriceInputText("");
                                  }
                                }}
                              >
                                <Ionicons
                                  name="receipt"
                                  size={16}
                                  color={Colors.primary}
                                />
                                <Text style={styles.materialUploadBtnText}>
                                  Upload Receipt & Price
                                </Text>
                              </TouchableOpacity>
                            )}
                        </View>
                      ),
                    )}

                    {/* Materials cost summary */}
                    {(conversation.job.materials_cost ?? 0) > 0 && (
                      <View style={styles.materialsCostSummary}>
                        <Text style={styles.materialsCostLabel}>
                          Total Materials Cost:
                        </Text>
                        <Text style={styles.materialsCostValue}>
                          ₱
                          {(
                            conversation.job.materials_cost ?? 0
                          ).toLocaleString()}
                        </Text>
                      </View>
                    )}

                    {/* WORKER: Mark buying / Skip buttons */}
                    {conversation.my_role === "WORKER" &&
                      conversation.job.materials_status ===
                        "PENDING_PURCHASE" && (
                        <View style={styles.materialsActions}>
                          <TouchableOpacity
                            style={styles.materialsBuyingBtn}
                            onPress={() =>
                              markBuyingMutation.mutate({
                                jobId: conversation.job.id,
                              })
                            }
                            disabled={markBuyingMutation.isPending}
                          >
                            <Ionicons name="cart" size={18} color="#fff" />
                            <Text style={styles.materialsBuyingBtnText}>
                              Start Buying Materials
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                    {/* Skip materials step (both roles) */}
                    <TouchableOpacity
                      style={styles.materialsSkipBtn}
                      onPress={() => {
                        Alert.alert(
                          "Skip Materials Step",
                          "Are you sure? This will skip the materials purchasing step and proceed to the arrival confirmation.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Skip",
                              onPress: () =>
                                skipMaterialsMutation.mutate({
                                  jobId: conversation.job.id,
                                }),
                            },
                          ],
                        );
                      }}
                      disabled={skipMaterialsMutation.isPending}
                    >
                      <Text style={styles.materialsSkipBtnText}>
                        Skip Materials Step
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              {/* Date Gate: Show locked banner for future scheduled jobs */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                conversation.job?.preferred_start_date &&
                new Date() <
                  (() => {
                    const d = new Date(conversation.job!.preferred_start_date!);
                    d.setHours(0, 0, 0, 0);
                    return d;
                  })() && (
                  <View style={[styles.actionButton, styles.waitingButton]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <Text style={styles.waitingButtonText}>
                        Job starts on{" "}
                        {new Date(
                          conversation.job.preferred_start_date,
                        ).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        — action buttons will unlock on that date.
                      </Text>
                    </View>
                  </View>
                )}

              {/* CLIENT: Confirm Worker Arrival (Regular Jobs Only, simplified flow) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isLegacySingleProjectFlow &&
                conversation.my_role === "CLIENT" &&
                canUseRegularProjectActions &&
                !conversation.job.clientConfirmedWorkStarted && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.confirmWorkStartedButton,
                    ]}
                    onPress={handleConfirmWorkStarted}
                    disabled={confirmWorkStartedMutation.isPending}
                  >
                    {confirmWorkStartedMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={Colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          Confirm Worker Has Arrived
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

              {/* CLIENT: Confirm Worker Arrival (Solo DAILY, hybrid-style arrival-first flow) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isSoloDailyFlow &&
                conversation.my_role === "CLIENT" &&
                canUseRegularProjectActions &&
                !conversation.job.clientConfirmedWorkStarted && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.confirmWorkStartedButton,
                    ]}
                    onPress={handleConfirmWorkStarted}
                    disabled={confirmWorkStartedMutation.isPending}
                  >
                    {confirmWorkStartedMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={Colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          Confirm Worker Has Arrived
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

              {/* CLIENT: Waiting for Worker to Complete (Regular Jobs Only) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isLegacySingleProjectFlow &&
                conversation.my_role === "CLIENT" &&
                canUseRegularProjectActions &&
                conversation.job.clientConfirmedWorkStarted &&
                !conversation.job.workerMarkedComplete && (
                  <View style={[styles.actionButton, styles.waitingButton]}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.waitingButtonText}>
                      Waiting for worker to complete job...
                    </Text>
                  </View>
                )}

              {/* CLIENT: Waiting for Worker to Complete (Solo DAILY) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isSoloDailyFlow &&
                conversation.my_role === "CLIENT" &&
                canUseRegularProjectActions &&
                conversation.job.clientConfirmedWorkStarted &&
                !conversation.job.workerMarkedComplete && (
                  <View style={[styles.actionButton, styles.waitingButton]}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.waitingButtonText}>
                      Waiting for worker to complete job...
                    </Text>
                  </View>
                )}

              {/* WORKER: Waiting for Client Confirmation (Regular Jobs Only, simplified flow) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isLegacySingleProjectFlow &&
                conversation.my_role === "WORKER" &&
                canUseRegularProjectActions &&
                !conversation.job.clientConfirmedWorkStarted && (
                  <View style={[styles.actionButton, styles.waitingButton]}>
                    <Ionicons
                      name="time-outline"
                      size={24}
                      color={Colors.textSecondary}
                    />
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <Text
                        style={styles.waitingButtonText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        Waiting for client to confirm worker arrival...
                      </Text>
                    </View>
                  </View>
                )}

              {/* WORKER: Waiting for Client Confirmation (Solo DAILY) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isSoloDailyFlow &&
                conversation.my_role === "WORKER" &&
                canUseRegularProjectActions &&
                !conversation.job.clientConfirmedWorkStarted && (
                  <View style={[styles.actionButton, styles.waitingButton]}>
                    <Ionicons
                      name="time-outline"
                      size={24}
                      color={Colors.textSecondary}
                    />
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <Text
                        style={styles.waitingButtonText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        Waiting for client to confirm worker arrival...
                      </Text>
                    </View>
                  </View>
                )}

              {/* WORKER: Mark Complete Button (Regular Jobs Only) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isLegacySingleProjectFlow &&
                conversation.my_role === "WORKER" &&
                canUseRegularProjectActions &&
                conversation.job.clientConfirmedWorkStarted &&
                !conversation.job.workerMarkedComplete && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.markCompleteButton]}
                    onPress={handleMarkComplete}
                    disabled={markCompleteMutation.isPending}
                  >
                    {markCompleteMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-done"
                          size={20}
                          color={Colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          Mark Job Complete
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

              {/* WORKER: Waiting for Client Approval (Regular Jobs Only) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isLegacySingleProjectFlow &&
                conversation.my_role === "WORKER" &&
                conversation.job.workerMarkedComplete &&
                !conversation.job.clientMarkedComplete && (
                  <View style={[styles.actionButton, styles.waitingButton]}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.waitingButtonText}>
                      Waiting for client to approve completion...
                    </Text>
                  </View>
                )}

              {/* WORKER: Mark Complete — Solo DAILY (early completion before duration ends) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                conversation.job?.payment_model === "DAILY" &&
                conversation.my_role === "WORKER" &&
                conversation.job.clientConfirmedWorkStarted &&
                canUseRegularProjectActions &&
                !conversation.job.workerMarkedComplete && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.markCompleteButton]}
                    onPress={handleMarkComplete}
                    disabled={markCompleteMutation.isPending}
                  >
                    {markCompleteMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-done"
                          size={20}
                          color={Colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          Mark Job Complete
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

              {/* WORKER: Waiting for Client — Solo DAILY (after marking complete) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                conversation.job?.payment_model === "DAILY" &&
                conversation.my_role === "WORKER" &&
                conversation.job.workerMarkedComplete &&
                !conversation.job.is_early_completed && (
                  <View style={[styles.actionButton, styles.waitingButton]}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.waitingButtonText}>
                      ✓ Marked complete. Waiting for client to approve...
                    </Text>
                  </View>
                )}

              {/* CLIENT: Optional early pay-now while job is ongoing (Regular Jobs Only) */}
              {/* Bug 6 fix: hide when worker has marked complete — show Approve & Pay instead */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isLegacySingleProjectFlow &&
                conversation.my_role === "CLIENT" &&
                canUseRegularProjectActions &&
                conversation.job.clientConfirmedWorkStarted &&
                !conversation.job.workerMarkedComplete &&
                !conversation.job.clientMarkedComplete &&
                !conversation.job.remainingPaymentPaid && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.waitingButton]}
                    onPress={handlePayNow}
                    disabled={createFinalPaymentMutation.isPending}
                  >
                    {createFinalPaymentMutation.isPending ? (
                      <ActivityIndicator
                        size="small"
                        color={Colors.textPrimary}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="flash"
                          size={20}
                          color={Colors.textPrimary}
                        />
                        <Text
                          style={[
                            styles.waitingButtonText,
                            { color: Colors.textPrimary },
                          ]}
                        >
                          Pay Now (Optional)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

              {/* CLIENT: Finish Early & Pay (Solo multi-day flow) — full budget released now */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isAnyMultiDayFlow &&
                conversation.my_role === "CLIENT" &&
                canUseRegularProjectActions &&
                (conversation.job.payment_model === "DAILY" ||
                  isLegacySingleProjectFlow) &&
                conversation.job.clientConfirmedWorkStarted &&
                !conversation.job.workerMarkedComplete &&
                !conversation.job.clientMarkedComplete &&
                !conversation.job.is_early_completed && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveCompletionButton]}
                    onPress={() => {
                      const budget = Number(
                        (conversation.job.budget ?? 0) +
                          (conversation.job.materials_cost ?? 0),
                      ).toLocaleString();
                      Alert.alert(
                        "Finish Early & Pay Full Amount",
                        `This will release ₱${budget} to the worker immediately and complete the job. This cannot be undone.`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Confirm",
                            style: "destructive",
                            onPress: () =>
                              projectEarlyCompleteMutation.mutate({
                                jobId: conversation.job.id,
                              }),
                          },
                        ],
                      );
                    }}
                    disabled={projectEarlyCompleteMutation.isPending}
                  >
                    {projectEarlyCompleteMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="flash"
                          size={20}
                          color={Colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          Finish Early & Pay Full Amount (₱
                          {Number(
                            (conversation.job.budget ?? 0) +
                              (conversation.job.materials_cost ?? 0),
                          ).toLocaleString()}
                          )
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

              {/* Final payment already done, but completion still pending */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isLegacySingleProjectFlow &&
                conversation.job?.remainingPaymentPaid &&
                !conversation.job.clientMarkedComplete && (
                  <View style={[styles.actionButton, styles.completedAction]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.success}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: Colors.success },
                        conversation.my_role === "WORKER" && {
                          fontWeight: "400",
                          fontSize: 13,
                        },
                      ]}
                    >
                      {conversation.my_role === "WORKER"
                        ? "Client has paid the job in full."
                        : "Final payment completed. You can approve completion anytime."}
                    </Text>
                  </View>
                )}

              {conversation.is_team_job &&
                conversation.my_role === "WORKER" &&
                conversation.job.remainingPaymentPaid && (
                  <View style={[styles.actionButton, styles.completedAction]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.success}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: Colors.success },
                      ]}
                    >
                      Payment received! Please leave a review.
                    </Text>
                  </View>
                )}

              {/* CLIENT: Approve Completion Button (Regular Jobs Only) */}
              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                isLegacySingleProjectFlow &&
                conversation.my_role === "CLIENT" &&
                conversation.job.workerMarkedComplete &&
                !conversation.job.clientMarkedComplete && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.approveCompletionButton,
                    ]}
                    onPress={handleApproveCompletion}
                    disabled={approveCompletionMutation.isPending}
                  >
                    {approveCompletionMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name={
                            conversation.job.remainingPaymentPaid
                              ? "checkmark-circle"
                              : "wallet"
                          }
                          size={20}
                          color={Colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          {conversation.job.remainingPaymentPaid
                            ? "Approve Completion"
                            : "Approve & Pay Final Amount"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

              {/* ================================================================ */}
              {/* AGENCY PROJECT JOB WORKFLOW (LEGACY SINGLE-DAY PROJECT ONLY) */}
              {/* ================================================================ */}
              {/* Workflow: Agency dispatches → Client confirms arrival → Agency marks complete → Client approves & pays */}

              {/* AGENCY VIEW: Dispatch and Mark Complete buttons */}
              {(conversation.is_agency_job ||
                (conversation.is_team_job &&
                  conversation.my_role === "AGENCY" &&
                  (conversation.team_agency_employees?.length ?? 0) > 0)) &&
                conversation.my_role === "AGENCY" &&
                conversation.job.payment_model === "PROJECT" &&
                (!isProjectMultiDayJob ||
                  isBackjobActiveForDispatch ||
                  isDirectHireAgencyJob) &&
                 agencyAssignedEmployees.length > 0 &&
                 (() => {
                   const assignedEmployees = agencyAssignedEmployees;
                   const isEmployeeComplete = (employee: any) =>
                     employee.agencyMarkedComplete ||
                     employee.employeeMarkedComplete ||
                     employee.marked_complete ||
                     employee.status === "COMPLETED";

                  const allDispatched = assignedEmployees.every((e) =>
                    isAgencyStatusInCurrentBackjobCycle(
                      e.dispatched,
                      e.dispatchedAt,
                    ),
                  );
                  const allArrived = assignedEmployees.every((e) =>
                    isAgencyStatusInCurrentBackjobCycle(
                      e.clientConfirmedArrival,
                      e.clientConfirmedArrivalAt,
                    ),
                  );
                  // Use backjob-cycle-aware check so that a pre-backjob
                  // agencyMarkedComplete flag does not falsely satisfy allComplete
                  // in the current backjob cycle.
                  const allComplete = assignedEmployees.every((e) =>
                    isAgencyStatusInCurrentBackjobCycle(
                      isEmployeeComplete(e),
                      e.agencyMarkedCompleteAt,
                    ),
                  );

                  // Show dispatch buttons for employees not yet dispatched
                  const pendingDispatch = assignedEmployees.filter(
                    (e) =>
                      !isAgencyStatusInCurrentBackjobCycle(
                        e.dispatched,
                        e.dispatchedAt,
                      ),
                  );

                  // Show mark complete buttons for arrived employees not yet marked complete
                  const pendingComplete = assignedEmployees.filter(
                    (e) =>
                      isAgencyStatusInCurrentBackjobCycle(
                        e.clientConfirmedArrival,
                        e.clientConfirmedArrivalAt,
                      ) && !isEmployeeComplete(e),
                  );

                  return (
                    <>
                      {/* Dispatch section */}
                      {pendingDispatch.length > 0 && (
                        <View style={styles.employeeActionsSection}>
                          <Text style={styles.actionSectionTitle}>
                            Dispatch Employees ({pendingDispatch.length}{" "}
                            pending)
                          </Text>
                          {pendingDispatch.map((employee) => {
                            const employeeId = getEmployeeId(employee);
                            if (employeeId === null) return null;

                            return (
                            <TouchableOpacity
                              key={`dispatch-${employeeId}`}
                              style={[
                                styles.actionButton,
                                styles.dispatchButton,
                              ]}
                              onPress={() =>
                                Alert.alert(
                                  "Dispatch Employee",
                                  `Mark ${employee.name} as on the way to the job site?`,
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                      text: "Dispatch",
                                      onPress: () =>
                                        dispatchProjectEmployeeMutation.mutate({
                                          jobId: conversation.job.id,
                                          employeeId,
                                        }),
                                    },
                                  ],
                                )
                              }
                              disabled={
                                dispatchProjectEmployeeMutation.isPending
                              }
                            >
                              {dispatchProjectEmployeeMutation.isPending ? (
                                <ActivityIndicator
                                  size="small"
                                  color={Colors.white}
                                />
                              ) : (
                                <>
                                  <Ionicons
                                    name="car"
                                    size={20}
                                    color={Colors.white}
                                  />
                                  <Text style={styles.actionButtonText}>
                                    Dispatch {employee.name}
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* Waiting for client to confirm arrivals */}
                      {allDispatched && !allArrived && (
                        <View
                          style={[styles.actionButton, styles.waitingButton]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.waitingButtonText}>
                            Waiting for client to confirm arrivals (
                            {
                              assignedEmployees.filter((e) =>
                                isAgencyStatusInCurrentBackjobCycle(
                                  e.clientConfirmedArrival,
                                  e.clientConfirmedArrivalAt,
                                ),
                              ).length
                            }{" "}
                            of {assignedEmployees.length})
                          </Text>
                        </View>
                      )}

                      {/* Mark complete section */}
                      {pendingComplete.length > 0 && (
                        <View style={styles.employeeActionsSection}>
                          <Text style={styles.actionSectionTitle}>
                            Mark Work Complete ({pendingComplete.length} on
                            site)
                          </Text>
                          {pendingComplete.map((employee) => {
                            const employeeId = getEmployeeId(employee);
                            if (employeeId === null) return null;

                            return (
                            <TouchableOpacity
                              key={`complete-${employeeId}`}
                              style={[
                                styles.actionButton,
                                styles.markCompleteButton,
                              ]}
                              onPress={() =>
                                Alert.alert(
                                  "Mark Complete",
                                  `Mark ${employee.name}'s work as complete?`,
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                      text: "Mark Complete",
                                      onPress: () =>
                                        agencyMarkProjectCompleteMutation.mutate(
                                          {
                                            jobId: conversation.job.id,
                                            employeeId,
                                          },
                                        ),
                                    },
                                  ],
                                )
                              }
                              disabled={
                                agencyMarkProjectCompleteMutation.isPending
                              }
                            >
                              {agencyMarkProjectCompleteMutation.isPending ? (
                                <ActivityIndicator
                                  size="small"
                                  color={Colors.white}
                                />
                              ) : (
                                <>
                                  <Ionicons
                                    name="checkmark-done"
                                    size={20}
                                    color={Colors.white}
                                  />
                                  <Text style={styles.actionButtonText}>
                                    Complete: {employee.name}
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* All complete - waiting for client approval */}
                      {allComplete &&
                        !conversation.job.clientMarkedComplete &&
                        (isTodayWorkdaySettled ? (
                          <View
                            style={[styles.actionButton, styles.completedAction]}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={Colors.success}
                            />
                            <Text
                              style={[
                                styles.actionButtonText,
                                { color: Colors.success },
                              ]}
                            >
                              ✓ Workday settled. Waiting for next day dispatch.
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[styles.actionButton, styles.waitingButton]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={20}
                              color={Colors.textSecondary}
                            />
                            <Text style={styles.waitingButtonText}>
                              ✓ All employees complete. Waiting for client to
                              approve & pay
                            </Text>
                          </View>
                        ))}
                    </>
                  );
                })()}

              {(conversation.is_agency_job ||
                (conversation.is_team_job &&
                  (conversation.team_agency_employees?.length ?? 0) > 0)) &&
                conversation.my_role === "CLIENT" &&
                (!isProjectMultiDayJob ||
                  isBackjobActiveForDispatch ||
                  isDirectHireAgencyJob) &&
                agencyAssignedEmployees.length > 0 &&
                (() => {
                  const assignedEmployees = agencyAssignedEmployees;
                  const isTeamAgencyJob =
                    conversation.is_team_job && !conversation.is_agency_job;
                  const isDailyAgencyFlow =
                    conversation.job.payment_model === "DAILY";
                  const isEmployeeComplete = (employee: any) =>
                    employee.agencyMarkedComplete ||
                    employee.agency_marked_complete ||
                    employee.employeeMarkedComplete ||
                    employee.employee_marked_complete ||
                    employee.marked_complete ||
                    employee.status === "COMPLETED";

                  const allDispatched = assignedEmployees.every((e) =>
                    isAgencyStatusInCurrentBackjobCycle(
                      getAgencyDispatchedFlag(e),
                      getAgencyDispatchedAt(e),
                    ),
                  );
                  const allArrived = assignedEmployees.every((e) =>
                    isAgencyStatusInCurrentBackjobCycle(
                      getAgencyArrivedFlag(e),
                      getAgencyArrivedAt(e),
                    ),
                  );
                  // Use backjob-cycle-aware check so that a pre-backjob
                  // agencyMarkedComplete flag does not falsely enable the
                  // "Approve & Pay" button in the current backjob cycle.
                  const allComplete = assignedEmployees.every((e) =>
                    isAgencyStatusInCurrentBackjobCycle(
                      isEmployeeComplete(e),
                      getAgencyCompletionAt(e),
                    ),
                  );

                  const resolvedDailyAssignments = isDailyAgencyFlow
                    ? clientArrivalAssignments.filter(
                        (assignment) => assignment.arrived || assignment.absent,
                      )
                    : [];

                  const assignmentHasUnpaidPayableRow = (
                    assignment: UnifiedClientArrivalAssignment,
                  ) => {
                    return attendanceRows.some((row: any) => {
                      const status = String(row?.status || "").toUpperCase();
                      const isPayableStatus =
                        status === "PRESENT" || status === "HALF_DAY";

                      if (!isPayableStatus || Boolean(row?.payment_processed)) {
                        return false;
                      }

                      const rowAssignmentId = Number(row?.assignment_id);
                      if (
                        Number.isFinite(rowAssignmentId) &&
                        Number.isFinite(assignment.assignment_id) &&
                        rowAssignmentId === Number(assignment.assignment_id)
                      ) {
                        return true;
                      }

                      const rowWorkerId = Number(row?.worker_id);
                      const assignmentWorkerId = Number(
                        assignment.worker_id ?? assignment.employee_id,
                      );

                      if (
                        Number.isFinite(rowWorkerId) &&
                        Number.isFinite(assignmentWorkerId) &&
                        rowWorkerId === assignmentWorkerId
                      ) {
                        return true;
                      }

                      return false;
                    });
                  };

                  const arrivedAssignmentsRequiringCompletion = isDailyAgencyFlow
                    ? resolvedDailyAssignments.filter(
                        (assignment) =>
                          assignment.arrived &&
                          assignmentHasUnpaidPayableRow(assignment),
                      )
                    : [];

                  const allArrivedAssignmentsMarkedComplete = isDailyAgencyFlow
                    ? arrivedAssignmentsRequiringCompletion.every((assignment) =>
                        Boolean(
                          assignment.completed ||
                            assignment.worker_marked_complete ||
                            assignment.marked_complete ||
                            assignment.early_completed,
                        ),
                      )
                    : true;

                  const dailyPayableRows = attendanceRows.filter((row: any) => {
                    const status = String(row?.status || "").toUpperCase();
                    const isPayableStatus =
                      status === "PRESENT" || status === "HALF_DAY";
                    return isPayableStatus && !Boolean(row?.payment_processed);
                  });

                  const hasPendingDailyResolution =
                    isDailyAgencyFlow &&
                    clientArrivalAssignments.some(
                      (assignment) => !assignment.arrived && !assignment.absent,
                    );

                  const hasActiveDailyWorkRows =
                    isDailyAgencyFlow &&
                    clientArrivalAssignments.some(
                      (assignment) => assignment.active_workday,
                    );

                  const hasArrivedWorkersPendingCompletion =
                    isDailyAgencyFlow &&
                    arrivedAssignmentsRequiringCompletion.some(
                      (assignment) =>
                        !Boolean(
                          assignment.completed ||
                            assignment.worker_marked_complete ||
                            assignment.marked_complete ||
                            assignment.early_completed,
                        ),
                    );

                  const dailyReadyForApprovePay =
                    isDailyAgencyFlow &&
                    dailyPayableRows.length > 0 &&
                    !hasPendingDailyResolution &&
                    !hasActiveDailyWorkRows &&
                    allArrivedAssignmentsMarkedComplete;

                  const allWorkflowComplete =
                    (isDailyAgencyFlow
                      ? allArrived
                      : isDirectHireAgencyJob
                        ? allArrived
                        : allDispatched && allArrived) &&
                    allComplete &&
                    allArrivedAssignmentsMarkedComplete;

                  const showApprovePayButton = isDailyAgencyFlow
                    ? dailyReadyForApprovePay && !isTodayWorkdaySettled
                    : allWorkflowComplete;

                  const showFinalDailyFinishButton =
                    isTeamAgencyJob &&
                    isDailyAgencyFlow &&
                    shouldFinishDailyTeamJob &&
                    !showDailyEndActions &&
                    isTodayWorkdaySettled;

                  return (
                    <>
                      {isDailyAgencyFlow &&
                        !showApprovePayButton &&
                        !showFinalDailyFinishButton &&
                        !isTodayWorkdaySettled &&
                        !hasPendingDailyResolution &&
                        !hasActiveDailyWorkRows &&
                        hasArrivedWorkersPendingCompletion && (
                          <View style={[styles.actionButton, styles.waitingButton]}>
                            <Ionicons
                              name="time-outline"
                              size={20}
                              color={Colors.textSecondary}
                            />
                            <Text style={styles.waitingButtonText}>
                              Waiting for all arrived workers to mark complete before approve & pay.
                            </Text>
                          </View>
                        )}

                      {/* Single agency-level approve & pay button */}
                      {(showApprovePayButton || showFinalDailyFinishButton) &&
                        !conversation.job.clientMarkedComplete && (
                          <View style={styles.employeeActionsSection}>
                            {showApprovePayButton && (
                              <>
                                <Text style={styles.actionSectionTitle}>
                                  {isTeamAgencyJob
                                    ? "Approve & Pay Team + Agency"
                                    : "Approve & Pay Agency"}
                                </Text>
                                <TouchableOpacity
                                  style={[
                                    styles.actionButton,
                                    styles.approveCompletionButton,
                                  ]}
                                  onPress={
                                    isTeamAgencyJob
                                      ? isDailyAgencyFlow
                                        ? handleApproveDailyTeamWorkday
                                        : handleApproveTeamJobCompletion
                                      : handleApproveCompletion
                                  }
                                  disabled={
                                    isTeamAgencyJob
                                      ? isDailyAgencyFlow
                                        ? isBulkDailySettlementInFlight
                                        : approveTeamJobCompletionMutation.isPending ||
                                          isApprovePayPreflightInFlight
                                      : approveAgencyProjectJobMutation.isPending
                                  }
                                >
                                  {(isTeamAgencyJob
                                    ? isDailyAgencyFlow
                                      ? isBulkDailySettlementInFlight
                                      : approveTeamJobCompletionMutation.isPending ||
                                        isApprovePayPreflightInFlight
                                    : approveAgencyProjectJobMutation.isPending) ? (
                                    <ActivityIndicator
                                      size="small"
                                      color={Colors.white}
                                    />
                                  ) : (
                                    <>
                                      <Ionicons
                                        name="wallet"
                                        size={20}
                                        color={Colors.white}
                                      />
                                      <Text style={styles.actionButtonText}>
                                        {isTeamAgencyJob
                                          ? isDailyAgencyFlow
                                            ? `Approve & Pay (For the Day)`
                                            : `Approve & Pay All (₱${Number(conversation.job.remainingPayment ?? 0).toLocaleString()})`
                                          : `Approve & Pay Agency (₱${(
                                              (conversation.job.remainingPayment ??
                                                conversation.job.budget * 0.5) +
                                              (conversation.job.materials_cost ?? 0)
                                            ).toLocaleString()})`}
                                      </Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                              </>
                            )}

                            {showFinalDailyFinishButton && (
                              <TouchableOpacity
                                style={[
                                  styles.actionButton,
                                  styles.waitingButton,
                                  { marginTop: 8 },
                                ]}
                                onPress={handleFinishDailyTeamJob}
                                disabled={dailyFinishJobMutation.isPending}
                              >
                                {dailyFinishJobMutation.isPending ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={Colors.textPrimary}
                                  />
                                ) : (
                                  <>
                                    <Ionicons
                                      name="flag"
                                      size={20}
                                      color={Colors.textPrimary}
                                    />
                                    <Text
                                      style={[
                                        styles.waitingButtonText,
                                        { color: Colors.textPrimary },
                                      ]}
                                    >
                                      Finish Entire Job
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                      {/* Show already-approved employees */}
                      {assignedEmployees.filter(
                        (e) => e.clientApproved,
                      ).length > 0 && (
                        <View style={styles.employeeActionsSection}>
                          {assignedEmployees
                            .filter((e) => e.clientApproved)
                            .map((employee) => {
                              const employeeId = getEmployeeId(employee);
                              if (employeeId === null) return null;

                              return (
                              <View
                                key={`approved-${employeeId}`}
                                style={[
                                  styles.actionButton,
                                  styles.waitingButton,
                                ]}
                              >
                                <Ionicons
                                  name="checkmark-circle"
                                  size={20}
                                  color="#22c55e"
                                />
                                <Text
                                  style={[
                                    styles.waitingButtonText,
                                    { color: "#22c55e" },
                                  ]}
                                >
                                  ✓ {employee.name} — Approved & Paid
                                </Text>
                              </View>
                              );
                            })}
                        </View>
                      )}
                    </>
                  );
                })()}

              {/* CLIENT: Per-employee early finish & pay (team jobs with agency employees) */}
              {conversation.is_team_job &&
                !conversation.is_agency_job &&
                conversation.my_role === "CLIENT" &&
                (conversation.team_agency_employees?.length ?? 0) > 0 &&
                (conversation.team_worker_assignments?.length ?? 0) === 0 &&
                !conversation.job.clientMarkedComplete &&
                (conversation.team_agency_employees ?? []).some(
                  (e: any) =>
                    e.can_early_finish && e.marked_complete && !e.early_completed,
                ) &&
                (() => {
                  const earlyFinishableEmployees = (
                    conversation.team_agency_employees ?? []
                  ).filter(
                    (e: any) =>
                      e.can_early_finish && e.marked_complete && !e.early_completed,
                  );

                  return (
                    <View style={styles.employeeActionsSection}>
                      <Text style={styles.actionSectionTitle}>
                        Complete Employee Early & Pay
                      </Text>
                      {earlyFinishableEmployees.map((employee: any) => (
                        <TouchableOpacity
                          key={`emp-early-${employee.id}`}
                          style={[
                            styles.actionButton,
                            styles.approveCompletionButton,
                            { marginBottom: 8 },
                          ]}
                          onPress={() => {
                            const quote =
                              employee.early_finish_quote != null
                                ? `₱${Number(employee.early_finish_quote).toLocaleString()}`
                                : "full contracted amount";
                            Alert.alert(
                              "Complete Employee Early & Pay",
                              `Release ${quote} to the agency for ${employee.name} now and mark them done?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Confirm",
                                  style: "destructive",
                                  onPress: () =>
                                    earlyCompleteTeamEmployeeMutation.mutate({
                                      jobId: conversation.job.id,
                                      assignmentId: employee.assignment_id,
                                    }),
                                },
                              ],
                            );
                          }}
                          disabled={earlyCompleteTeamEmployeeMutation.isPending}
                        >
                          {earlyCompleteTeamEmployeeMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="flash"
                                size={16}
                                color={Colors.white}
                              />
                              <Text style={styles.actionButtonText}>
                                Complete {employee.name?.split(" ")[0]} Early & Pay (
                                {employee.early_finish_quote != null
                                  ? `₱${Number(employee.early_finish_quote).toLocaleString()}`
                                  : "full amount"}
                                )
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}

              {/* Status Messages (Regular Jobs Only) */}

              {!conversation.is_team_job &&
                !conversation.is_agency_job &&
                conversation.my_role === "CLIENT" &&
                conversation.job.workerMarkedComplete &&
                !conversation.job.clientMarkedComplete && (
                  <Text style={styles.statusMessage}>
                    Worker marked job complete. Please review and approve.
                  </Text>
                )}

              {conversation.job.clientMarkedComplete &&
                !isConversationClosed && (
                  <Text style={[styles.statusMessage, styles.completedMessage]}>
                    ✓ Job completed and approved!
                  </Text>
                )}
            </View>
          )}

          {/* Backjob Banners - Request or Edit Feedback */}
          {/* Request Backjob Banner - CLIENT ONLY - requires completed reviews */}
          {conversation.my_role === "CLIENT" &&
            (isJobCompleted || !!conversation.job.clientMarkedComplete) &&
            !!conversation.job.remainingPaymentPaid &&
            !isJobCancelled &&
            !isPaymentReleased &&
            !conversation.backjob?.has_backjob &&
            (conversation.backjob?.total_backjobs_for_job ?? 0) === 0 &&
            isJobTerminalForUI &&
            viewerHasReviewed &&
            counterpartyHasReviewed && (
              <TouchableOpacity
                style={styles.requestBackjobBanner}
                onPress={() =>
                  router.push(
                    `/jobs/request-backjob?jobId=${conversation.job.id}`,
                  )
                }
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.requestBackjobContent,
                    {
                      backgroundColor: "#FFF3E0", // Orange background
                      borderColor: "#FFE0B2", // Orange border
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.requestBackjobIconContainer,
                      {
                        backgroundColor: "#FFB74D", // Match orange icon container
                      },
                    ]}
                  >
                    <Ionicons
                      name="refresh-circle"
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                  <View style={styles.requestBackjobText}>
                    <Text
                      style={[styles.requestBackjobTitle, { color: "#E65100" }]}
                    >
                      Not satisfied with the work?
                    </Text>
                    <Text
                      style={[
                        styles.requestBackjobSubtitle,
                        { color: "#EF6C00" },
                      ]}
                    >
                      Tap here to request a backjob (rework)
                    </Text>
                    {(conversation.backjob?.total_backjobs_for_job ?? 0) >
                      0 && (
                      <Text
                        style={[
                          styles.requestBackjobSubtitle,
                          { color: "#E65100", marginTop: 2, fontWeight: "600" },
                        ]}
                      >
                        Previous backjobs on this job:{" "}
                        {conversation.backjob?.total_backjobs_for_job}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#EF6C00" />
                </View>
              </TouchableOpacity>
            )}

          {/* Review Reminder Banner - CLIENT ONLY - show when reviews are required before backjob */}
          {conversation.my_role === "CLIENT" &&
            (isJobCompleted || !!conversation.job.clientMarkedComplete) &&
            !!conversation.job.remainingPaymentPaid &&
            !isJobCancelled &&
            !isPaymentReleased &&
            !conversation.backjob?.has_backjob &&
            (conversation.backjob?.total_backjobs_for_job ?? 0) === 0 &&
            isJobTerminalForUI &&
            (!viewerHasReviewed || !counterpartyHasReviewed) && (
              <TouchableOpacity
                style={styles.requestBackjobBanner}
                onPress={() => {
                  const hasClientReviewEvidence =
                    clientHasReviewed ||
                    !!conversation.client_review ||
                    (conversation.my_editable_reviews?.length ?? 0) > 0 ||
                    localAgencyClientReviewSubmitted;

                  if (hasClientReviewEvidence) {
                    router.push(
                      `/jobs/request-backjob?jobId=${conversation.job.id}`,
                    );
                    return;
                  }

                  if (!viewerHasReviewed) {
                    openReviewModalSafely("submit");
                    return;
                  }

                  Alert.alert(
                    "Waiting For Worker Review",
                    "You have completed your review. The worker still needs to finish theirs before a backjob can be requested.",
                  );
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.requestBackjobContent,
                    {
                      backgroundColor: "#FFF8E1",
                      borderColor: "#FFECB3",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.requestBackjobIconContainer,
                      {
                        backgroundColor: "#F9A825",
                      },
                    ]}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                  <View style={styles.requestBackjobText}>
                    <Text
                      style={[styles.requestBackjobTitle, { color: "#5D4037" }]}
                    >
                      Still broken?
                    </Text>
                    <Text
                      style={[
                        styles.requestBackjobSubtitle,
                        { color: "#6D4C41" },
                      ]}
                    >
                      Request for a backjob
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6D4C41" />
                </View>
              </TouchableOpacity>
            )}

          {/* Edit Feedback Banner - BOTH CLIENT & WORKER - Only after a successful backjob */}
          {conversation.backjob?.status === "COMPLETED" && (
            <TouchableOpacity
              style={styles.requestBackjobBanner}
              onPress={() => {
                openReviewModalSafely("edit");
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.requestBackjobContent,
                  {
                    backgroundColor: "#E8F5E9", // Light green background
                    borderColor: "#C8E6C9", // Light green border
                  },
                ]}
              >
                <View
                  style={[
                    styles.requestBackjobIconContainer,
                    {
                      backgroundColor: Colors.success, // Green icon container
                    },
                  ]}
                >
                  <Ionicons name="star" size={24} color={Colors.white} />
                </View>
                <View style={styles.requestBackjobText}>
                  <Text
                    style={[styles.requestBackjobTitle, { color: "#1B5E20" }]}
                  >
                    Satisfied with the backjob?
                  </Text>
                  <Text
                    style={[
                      styles.requestBackjobSubtitle,
                      { color: "#2E7D32" },
                    ]}
                  >
                    Wanna update your feedback?
                  </Text>
                  <Text
                    style={[
                      styles.requestBackjobSubtitle,
                      { color: "#1B5E20", marginTop: 2, fontWeight: "600" },
                    ]}
                  >
                    Total backjobs for this job:{" "}
                    {conversation.backjob?.total_backjobs_for_job ?? 1}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#2E7D32" />
              </View>
            </TouchableOpacity>
          )}

          {/* Review Modal */}
          <Modal
            visible={showReviewModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => {
              setShowReviewModal(false);
            }}
          >
            <SafeAreaView style={styles.reviewModalContainer}>
              {/* Modal Header */}
              <View style={styles.reviewModalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowReviewModal(false);
                  }}
                  style={styles.reviewModalCloseButton}
                >
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.reviewModalTitle}>
                  {reviewModalMode === "view"
                    ? "Reviews"
                    : reviewModalMode === "edit"
                      ? "Edit Your Review"
                      : "Leave a Review"}
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Modal Content - ScrollView for the review form */}
              <ScrollView
                style={styles.reviewModalContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
                nestedScrollEnabled
                contentContainerStyle={styles.reviewModalContentContainer}
                showsVerticalScrollIndicator
              >
                {/* Check if we're in view mode */}
                {reviewModalMode === "view" ? (
                  // View Reviews Mode - Show both parties' reviews with actual data
                  <View style={{ padding: Spacing.md }}>
                    {/* My Review Section */}
                    <View style={styles.reviewSection}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: Spacing.sm,
                        }}
                      >
                        <Text
                          style={[
                            styles.reviewSectionTitle,
                            { marginBottom: 0 },
                          ]}
                        >
                          {`${formatPossessive(resolveMyReviewerName())} Review`}
                        </Text>
                        {conversation.backjob?.status === "COMPLETED" && (
                          <TouchableOpacity
                            onPress={() => {
                              openReviewModalSafely("edit");
                            }}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: Colors.primary + "10",
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 6,
                            }}
                          >
                            <Ionicons
                              name="pencil"
                              size={14}
                              color={Colors.primary}
                            />
                            <Text
                              style={{
                                color: Colors.primary,
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              Edit Review
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {(() => {
                        // Add null safety check for conversation
                        if (!conversation) {
                          return (
                            <View style={styles.reviewCard}>
                              <Text style={styles.reviewCardSubtitle}>
                                Conversation data not available
                              </Text>
                            </View>
                          );
                        }

                        const myReview =
                          conversation.my_role === "CLIENT"
                            ? conversation.client_review
                            : conversation.worker_review;

                        if (!myReview) {
                          return (
                            <View style={styles.reviewCard}>
                              <Text style={styles.reviewCardSubtitle}>
                                No review data available
                              </Text>
                            </View>
                          );
                        }

                        // Category labels based on role
                        const categories =
                          conversation.my_role === "CLIENT"
                            ? [
                                {
                                  key: "rating_punctuality",
                                  label: "Punctuality",
                                  icon: "⏰",
                                },
                                {
                                  key: "rating_professionalism",
                                  label: "Reliability",
                                  icon: "✅",
                                },
                                {
                                  key: "rating_quality",
                                  label: "Skill",
                                  icon: "🔧",
                                },
                                {
                                  key: "rating_communication",
                                  label: "Workmanship",
                                  icon: "🛠️",
                                },
                              ]
                            : [
                                {
                                  key: "rating_communication",
                                  label: "Communication",
                                  icon: "💬",
                                },
                                {
                                  key: "rating_quality",
                                  label: "Clarity of Job Details",
                                  icon: "📋",
                                },
                                {
                                  key: "rating_punctuality",
                                  label: "Payment Reliability",
                                  icon: "💰",
                                },
                                {
                                  key: "rating_professionalism",
                                  label: "Respect & Professionalism",
                                  icon: "🤝",
                                },
                              ];

                        return (
                          <View style={styles.reviewCard}>
                            {categories.map((cat, idx) => (
                              <View
                                key={cat.key}
                                style={{
                                  marginBottom:
                                    idx < categories.length - 1
                                      ? Spacing.sm
                                      : 0,
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 4,
                                  }}
                                >
                                  <Text
                                    style={{ fontSize: 16, marginRight: 6 }}
                                  >
                                    {cat.icon}
                                  </Text>
                                  <Text
                                    style={{
                                      ...Typography.body.small,
                                      fontWeight: "600",
                                      color: Colors.textPrimary,
                                    }}
                                  >
                                    {cat.label}
                                  </Text>
                                </View>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                      key={star}
                                      name={
                                        star <=
                                        (myReview[
                                          cat.key as keyof typeof myReview
                                        ] as number)
                                          ? "star"
                                          : "star-outline"
                                      }
                                      size={18}
                                      color="#FBC02D"
                                      style={{ marginRight: 4 }}
                                    />
                                  ))}
                                  <Text
                                    style={{
                                      marginLeft: 4,
                                      ...Typography.body.small,
                                      color: Colors.textSecondary,
                                    }}
                                  >
                                    {myReview[cat.key as keyof typeof myReview]}
                                    /5
                                  </Text>
                                </View>
                              </View>
                            ))}
                            {myReview.comment && (
                              <View
                                style={{
                                  marginTop: Spacing.md,
                                  paddingTop: Spacing.md,
                                  borderTopWidth: 1,
                                  borderTopColor: Colors.border,
                                }}
                              >
                                <Text
                                  style={{
                                    ...Typography.body.small,
                                    fontWeight: "600",
                                    marginBottom: 4,
                                  }}
                                >
                                  Comment:
                                </Text>
                                <Text
                                  style={{
                                    ...Typography.body.small,
                                    color: Colors.textSecondary,
                                  }}
                                >
                                  {myReview.comment}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })()}
                    </View>

                    {/* Other Party's Review Section */}
                    <View
                      style={[styles.reviewSection, { marginTop: Spacing.lg }]}
                    >
                      <Text style={styles.reviewSectionTitle}>
                        {resolveCounterpartyTitle()}
                      </Text>
                      {(() => {
                        // Add null safety check for conversation
                        if (!conversation) {
                          return (
                            <View style={styles.reviewCard}>
                              <Text style={styles.reviewCardSubtitle}>
                                Conversation data not available
                              </Text>
                            </View>
                          );
                        }

                        const otherReview =
                          conversation.my_role === "CLIENT"
                            ? conversation.worker_review
                            : conversation.client_review;

                        const counterpartyReviews =
                          conversation.my_role === "CLIENT"
                            ? conversation.counterparty_reviews || []
                            : [];

                        const hasReviewed =
                          conversation.my_role === "CLIENT"
                            ? conversation.job?.workerReviewed
                            : clientHasReviewed;

                        if (!hasReviewed) {
                          return (
                            <View style={styles.reviewCard}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Ionicons
                                  name="time-outline"
                                  size={20}
                                  color={Colors.textSecondary}
                                />
                                <Text
                                  style={{
                                    marginLeft: Spacing.xs,
                                    color: Colors.textSecondary,
                                  }}
                                >
                                  Waiting for{" "}
                                  {conversation.my_role === "CLIENT"
                                    ? "worker"
                                    : "client"}{" "}
                                  to submit review...
                                </Text>
                              </View>
                            </View>
                          );
                        }

                        // Client view: display all counterparty reviews for this job.
                        if (
                          conversation.my_role === "CLIENT" &&
                          counterpartyReviews.length > 0
                        ) {
                          const categories = [
                            {
                              key: "rating_communication",
                              label: "Communication",
                              icon: "💬",
                            },
                            {
                              key: "rating_quality",
                              label: "Clarity of Job Details",
                              icon: "📋",
                            },
                            {
                              key: "rating_punctuality",
                              label: "Payment Reliability",
                              icon: "💰",
                            },
                            {
                              key: "rating_professionalism",
                              label: "Respect & Professionalism",
                              icon: "🤝",
                            },
                          ];

                          return (
                            <View style={{ gap: Spacing.sm }}>
                              {counterpartyReviews.map((review, index) => {
                                const reviewerLabel =
                                  review.reviewer_name ||
                                  (review.reviewer_type === "AGENCY"
                                    ? "Agency"
                                    : `Worker ${index + 1}`);

                                return (
                                  <View
                                    key={review.review_id || index}
                                    style={styles.reviewCard}
                                  >
                                    <Text
                                      style={{
                                        ...Typography.body.small,
                                        fontWeight: "700",
                                        color: Colors.textPrimary,
                                        marginBottom: Spacing.sm,
                                      }}
                                    >
                                      {reviewerLabel}
                                    </Text>

                                    {categories.map((cat, idx) => (
                                      <View
                                        key={`${review.review_id}-${cat.key}`}
                                        style={{
                                          marginBottom:
                                            idx < categories.length - 1
                                              ? Spacing.sm
                                              : 0,
                                        }}
                                      >
                                        <View
                                          style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            marginBottom: 4,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              fontSize: 16,
                                              marginRight: 6,
                                            }}
                                          >
                                            {cat.icon}
                                          </Text>
                                          <Text
                                            style={{
                                              ...Typography.body.small,
                                              fontWeight: "600",
                                              color: Colors.textPrimary,
                                            }}
                                          >
                                            {cat.label}
                                          </Text>
                                        </View>
                                        <View
                                          style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                          }}
                                        >
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                              key={star}
                                              name={
                                                star <=
                                                (review[
                                                  cat.key as keyof typeof review
                                                ] as number)
                                                  ? "star"
                                                  : "star-outline"
                                              }
                                              size={18}
                                              color="#FBC02D"
                                              style={{ marginRight: 4 }}
                                            />
                                          ))}
                                          <Text
                                            style={{
                                              marginLeft: 4,
                                              ...Typography.body.small,
                                              color: Colors.textSecondary,
                                            }}
                                          >
                                            {
                                              review[
                                                cat.key as keyof typeof review
                                              ]
                                            }
                                            /5
                                          </Text>
                                        </View>
                                      </View>
                                    ))}

                                    {review.comment && (
                                      <View
                                        style={{
                                          marginTop: Spacing.md,
                                          paddingTop: Spacing.md,
                                          borderTopWidth: 1,
                                          borderTopColor: Colors.border,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            ...Typography.body.small,
                                            fontWeight: "600",
                                            marginBottom: 4,
                                          }}
                                        >
                                          Comment:
                                        </Text>
                                        <Text
                                          style={{
                                            ...Typography.body.small,
                                            color: Colors.textSecondary,
                                          }}
                                        >
                                          {review.comment}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          );
                        }

                        if (!otherReview) {
                          return (
                            <View style={styles.reviewCard}>
                              <Text style={styles.reviewCardSubtitle}>
                                Review data not available
                              </Text>
                            </View>
                          );
                        }

                        // Category labels based on reviewer role
                        const categories =
                          conversation.my_role === "CLIENT"
                            ? [
                                {
                                  key: "rating_communication",
                                  label: "Communication",
                                  icon: "💬",
                                },
                                {
                                  key: "rating_quality",
                                  label: "Clarity of Job Details",
                                  icon: "📋",
                                },
                                {
                                  key: "rating_punctuality",
                                  label: "Payment Reliability",
                                  icon: "💰",
                                },
                                {
                                  key: "rating_professionalism",
                                  label: "Respect & Professionalism",
                                  icon: "🤝",
                                },
                              ]
                            : [
                                {
                                  key: "rating_punctuality",
                                  label: "Punctuality",
                                  icon: "⏰",
                                },
                                {
                                  key: "rating_professionalism",
                                  label: "Reliability",
                                  icon: "✅",
                                },
                                {
                                  key: "rating_quality",
                                  label: "Skill",
                                  icon: "🔧",
                                },
                                {
                                  key: "rating_communication",
                                  label: "Workmanship",
                                  icon: "🛠️",
                                },
                              ];

                        return (
                          <View style={styles.reviewCard}>
                            {categories.map((cat, idx) => (
                              <View
                                key={cat.key}
                                style={{
                                  marginBottom:
                                    idx < categories.length - 1
                                      ? Spacing.sm
                                      : 0,
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 4,
                                  }}
                                >
                                  <Text
                                    style={{ fontSize: 16, marginRight: 6 }}
                                  >
                                    {cat.icon}
                                  </Text>
                                  <Text
                                    style={{
                                      ...Typography.body.small,
                                      fontWeight: "600",
                                      color: Colors.textPrimary,
                                    }}
                                  >
                                    {cat.label}
                                  </Text>
                                </View>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                      key={star}
                                      name={
                                        star <=
                                        (otherReview[
                                          cat.key as keyof typeof otherReview
                                        ] as number)
                                          ? "star"
                                          : "star-outline"
                                      }
                                      size={18}
                                      color="#FBC02D"
                                      style={{ marginRight: 4 }}
                                    />
                                  ))}
                                  <Text
                                    style={{
                                      marginLeft: 4,
                                      ...Typography.body.small,
                                      color: Colors.textSecondary,
                                    }}
                                  >
                                    {
                                      otherReview[
                                        cat.key as keyof typeof otherReview
                                      ]
                                    }
                                    /5
                                  </Text>
                                </View>
                              </View>
                            ))}
                            {otherReview.comment && (
                              <View
                                style={{
                                  marginTop: Spacing.md,
                                  paddingTop: Spacing.md,
                                  borderTopWidth: 1,
                                  borderTopColor: Colors.border,
                                }}
                              >
                                <Text
                                  style={{
                                    ...Typography.body.small,
                                    fontWeight: "600",
                                    marginBottom: 4,
                                  }}
                                >
                                  Comment:
                                </Text>
                                <Text
                                  style={{
                                    ...Typography.body.small,
                                    color: Colors.textSecondary,
                                  }}
                                >
                                  {otherReview.comment}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })()}
                    </View>
                  </View>
                ) : reviewModalMode !== "edit" &&
                  ((conversation.my_role === "CLIENT" && clientHasReviewed) ||
                    (conversation.my_role !== "CLIENT" &&
                      conversation.job.workerReviewed)) ? (
                  // User has already reviewed - show waiting or thank you message
                  <View style={styles.reviewWaitingContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color={Colors.success}
                    />
                    <Text style={styles.reviewWaitingTitle}>
                      {conversation.is_team_job &&
                      conversation.my_role === "CLIENT"
                          ? `Thank you for reviewing all ${totalTeamWorkerAssignmentCount || 0} workers!`
                        : "Thank you for your review!"}
                    </Text>
                    {((conversation.my_role === "CLIENT" &&
                      !conversation.job.workerReviewed) ||
                      (conversation.my_role !== "CLIENT" &&
                        !clientHasReviewed)) && (
                      <Text style={styles.reviewWaitingText}>
                        Waiting for{" "}
                        {conversation.my_role === "CLIENT"
                          ? "worker"
                          : "client"}{" "}
                        to review...
                      </Text>
                    )}
                  </View>
                ) : (
                  // User hasn't reviewed yet - show review form
                  <>
                    {/* Dynamic title based on agency job review step */}
                    {conversation.is_agency_job &&
                    conversation.my_role === "CLIENT" &&
                    reviewModalMode !== "edit" ? (
                      <>
                        {/* Multi-employee support: show which employee is being reviewed */}
                        {(() => {
                          const pendingEmployees =
                            conversation.pending_employee_reviews || [];
                          const allEmployees =
                            conversation.assigned_employees || [];
                          const hasMultipleEmployees = allEmployees.length > 1;
                          const totalEmployees = allEmployees.length || 1;
                          const reviewedCount =
                            totalEmployees - pendingEmployees.length;
                          const agencyModalStep = effectiveAgencyReviewStep;

                          // Get current employee being reviewed
                          let currentEmployeeName = "Worker";
                          if (agencyModalStep === "EMPLOYEE") {
                            if (
                              pendingEmployees.length > 0 &&
                              allEmployees.length > 0
                            ) {
                              const currentEmployee = allEmployees.find(
                                (e) => e.id === pendingEmployees[0],
                              );
                              currentEmployeeName =
                                currentEmployee?.name || "Employee";
                            } else if (conversation.assigned_employee) {
                              currentEmployeeName =
                                conversation.assigned_employee.name;
                            }
                          }

                          return (
                            <>
                              <Text style={styles.reviewTitle}>
                                {agencyModalStep === "EMPLOYEE"
                                  ? `Rate ${currentEmployeeName}`
                                  : "Rate the Agency"}
                              </Text>
                              <Text style={styles.reviewSubtitle}>
                                {agencyModalStep === "EMPLOYEE"
                                  ? `How did ${currentEmployeeName} perform on this job?`
                                  : `How was your experience with ${conversation.other_participant?.name || "the agency"}?`}
                              </Text>

                              {/* Progress indicator */}
                              {hasMultipleEmployees &&
                                agencyModalStep === "EMPLOYEE" &&
                                pendingEmployees.length > 0 && (
                                  <View style={styles.stepIndicator}>
                                    <Ionicons
                                      name="people"
                                      size={16}
                                      color={Colors.primary}
                                    />
                                    <Text style={styles.stepIndicatorText}>
                                      Employee {reviewedCount + 1} of{" "}
                                      {totalEmployees}
                                    </Text>
                                  </View>
                                )}

                              {employeeReviewSubmitted &&
                                agencyModalStep === "AGENCY" && (
                                  <View style={styles.stepIndicator}>
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={16}
                                      color={Colors.success}
                                    />
                                    <Text style={styles.stepIndicatorText}>
                                      {hasMultipleEmployees
                                        ? `All ${totalEmployees} employees rated! Final step: Agency`
                                        : "Step 2 of 2: Agency Review"}
                                    </Text>
                                  </View>
                                )}
                            </>
                          );
                        })()}
                      </>
                    ) : conversation.is_team_job &&
                      conversation.my_role === "CLIENT" &&
                      reviewModalMode !== "edit" ? (
                      // Team job client review - show worker name and progress
                      <>
                        {(() => {
                          const pendingWorkers =
                            conversation.pending_team_worker_reviews || [];
                          const allWorkers = [
                            ...(conversation.team_worker_assignments || []).map(
                              (worker: any) => ({
                                ...worker,
                                target_type: "WORKER",
                              }),
                            ),
                            ...(conversation.team_agency_employees || []).map(
                              (employee: any) => ({
                                ...employee,
                                target_type: "EMPLOYEE",
                                worker_id: null,
                                employee_id:
                                  employee.employee_id || employee.id || null,
                              }),
                            ),
                          ];
                          const totalWorkers = allWorkers.length || 1;
                          const reviewedCount =
                            totalWorkers - pendingWorkers.length;

                          // Get current worker being reviewed
                          const currentWorker = pendingWorkers[0];
                          const currentWorkerName =
                            currentWorker?.name || "Worker";
                          const currentWorkerSkill = currentWorker?.skill || "";

                          return (
                            <>
                              <Text style={styles.reviewTitle}>
                                Rate {currentWorkerName}
                              </Text>
                              <Text style={styles.reviewSubtitle}>
                                How did {currentWorkerName} perform on this job?
                                {currentWorkerSkill
                                  ? ` (${currentWorkerSkill})`
                                  : ""}
                              </Text>

                              {/* Progress bar and worker checklist */}
                              {totalWorkers > 1 && (
                                <>
                                  <View
                                    style={styles.teamReviewProgressContainer}
                                  >
                                    <View style={styles.teamReviewProgressBarBg}>
                                      <View
                                        style={[
                                          styles.teamReviewProgressBarFill,
                                          {
                                            width: `${(reviewedCount / totalWorkers) * 100}%`,
                                          },
                                        ]}
                                      />
                                    </View>
                                    <View style={styles.stepIndicator}>
                                      <Ionicons
                                        name="people"
                                        size={16}
                                        color={Colors.primary}
                                      />
                                      <Text style={styles.stepIndicatorText}>
                                        Worker {reviewedCount + 1} of {totalWorkers}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Mini worker checklist in modal */}
                                  <View style={styles.teamReviewModalChecklist}>
                                    {allWorkers.map((w: any, i: number) => {
                                      const workerKey = `${String(w?.target_type || w?.employee_id ? "EMPLOYEE" : "WORKER").toUpperCase()}-${w?.worker_id ?? w?.employee_id ?? w?.assignment_id ?? i}`;
                                      const isWorkerPending = pendingWorkers.some(
                                        (pw: any) =>
                                          `${String(pw?.target_type || pw?.employee_id ? "EMPLOYEE" : "WORKER").toUpperCase()}-${pw?.worker_id ?? pw?.employee_id ?? pw?.assignment_id ?? "x"}` ===
                                          workerKey,
                                      );
                                      const isCurrent =
                                        `${String(pendingWorkers[0]?.target_type || pendingWorkers[0]?.employee_id ? "EMPLOYEE" : "WORKER").toUpperCase()}-${pendingWorkers[0]?.worker_id ?? pendingWorkers[0]?.employee_id ?? pendingWorkers[0]?.assignment_id ?? "x"}` ===
                                        workerKey;
                                      const isReviewed = !isWorkerPending;

                                      return (
                                        <View
                                          key={workerKey}
                                          style={[
                                            styles.teamReviewModalChecklistDot,
                                            isReviewed &&
                                              styles.teamReviewModalChecklistDotDone,
                                            isCurrent &&
                                              styles.teamReviewModalChecklistDotCurrent,
                                          ]}
                                        >
                                          {isReviewed ? (
                                            <Ionicons
                                              name="checkmark"
                                              size={10}
                                              color={Colors.white}
                                            />
                                          ) : (
                                            <Text
                                              style={[
                                                styles.teamReviewModalChecklistDotText,
                                                isCurrent &&
                                                  styles.teamReviewModalChecklistDotTextCurrent,
                                              ]}
                                            >
                                              {i + 1}
                                            </Text>
                                          )}
                                        </View>
                                      );
                                    })}
                                  </View>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        <Text style={styles.reviewTitle}>
                          {reviewModalMode === "edit"
                            ? `Edit Review${activeEditableReview ? `: ${activeEditableReview.target_name}` : ""}`
                            : `Rate ${conversation.my_role === "CLIENT" ? "Worker" : "Client"}`}
                        </Text>
                        <Text style={styles.reviewSubtitle}>
                          {reviewModalMode === "edit"
                            ? "Update your previous feedback based on the completed backjob."
                            : `How was your experience with ${conversation.assigned_employee?.name || conversation.other_participant?.name || "them"}?`}
                        </Text>
                      </>
                    )}

                    {/* Rating Section - Conditional based on reviewer role */}
                    {conversation.my_role === "WORKER" ? (
                      /* Multi-Criteria Star Ratings for WORKER reviewing CLIENT */
                      <View style={styles.multiCriteriaContainer}>
                        {/* Communication Rating */}
                        <View style={styles.criteriaRow}>
                          <View style={styles.criteriaLabelRow}>
                            <Text style={styles.criteriaIcon}>💬</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.criteriaLabel}>
                                Communication
                              </Text>
                              <Text style={styles.criteriaDescription}>
                                Clear instructions and responsive messaging.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.criteriaStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setRatingCommunication(star)}
                                style={styles.starButtonSmall}
                              >
                                <Ionicons
                                  name={
                                    star <= ratingCommunication
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={24}
                                  color={
                                    star <= ratingCommunication
                                      ? "#FFB800"
                                      : Colors.border
                                  }
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Clarity of Job Details Rating */}
                        <View style={styles.criteriaRow}>
                          <View style={styles.criteriaLabelRow}>
                            <Text style={styles.criteriaIcon}>📋</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.criteriaLabel}>
                                Clarity of Job Details
                              </Text>
                              <Text style={styles.criteriaDescription}>
                                Well-defined requirements, expectations, and
                                scope.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.criteriaStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setRatingQuality(star)}
                                style={styles.starButtonSmall}
                              >
                                <Ionicons
                                  name={
                                    star <= ratingQuality
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={24}
                                  color={
                                    star <= ratingQuality
                                      ? "#FFB800"
                                      : Colors.border
                                  }
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Payment Reliability Rating */}
                        <View style={styles.criteriaRow}>
                          <View style={styles.criteriaLabelRow}>
                            <Text style={styles.criteriaIcon}>💳</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.criteriaLabel}>
                                Payment Reliability
                              </Text>
                              <Text style={styles.criteriaDescription}>
                                Paid on time and followed agreed payment terms.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.criteriaStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setRatingPunctuality(star)}
                                style={styles.starButtonSmall}
                              >
                                <Ionicons
                                  name={
                                    star <= ratingPunctuality
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={24}
                                  color={
                                    star <= ratingPunctuality
                                      ? "#FFB800"
                                      : Colors.border
                                  }
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Respect & Professionalism Rating */}
                        <View style={styles.criteriaRow}>
                          <View style={styles.criteriaLabelRow}>
                            <Text style={styles.criteriaIcon}>🤝</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.criteriaLabel}>
                                Respect & Professionalism
                              </Text>
                              <Text style={styles.criteriaDescription}>
                                Respectful, fair, and professional throughout
                                the job.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.criteriaStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setRatingProfessionalism(star)}
                                style={styles.starButtonSmall}
                              >
                                <Ionicons
                                  name={
                                    star <= ratingProfessionalism
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={24}
                                  color={
                                    star <= ratingProfessionalism
                                      ? "#FFB800"
                                      : Colors.border
                                  }
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    ) : (
                      /* Multi-Criteria Star Ratings for CLIENT reviewing WORKER */
                      <View style={styles.multiCriteriaContainer}>
                        {/* Punctuality Rating */}
                        <View style={styles.criteriaRow}>
                          <View style={styles.criteriaLabelRow}>
                            <Text style={styles.criteriaIcon}>⏰</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.criteriaLabel}>
                                Punctuality
                              </Text>
                              <Text style={styles.criteriaDescription}>
                                Arrived on time and finished within the agreed
                                timeframe.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.criteriaStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setRatingPunctuality(star)}
                                style={styles.starButtonSmall}
                              >
                                <Ionicons
                                  name={
                                    star <= ratingPunctuality
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={24}
                                  color={
                                    star <= ratingPunctuality
                                      ? "#FFB800"
                                      : Colors.border
                                  }
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Reliability Rating - using ratingProfessionalism state */}
                        <View style={styles.criteriaRow}>
                          <View style={styles.criteriaLabelRow}>
                            <Text style={styles.criteriaIcon}>✅</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.criteriaLabel}>
                                Reliability
                              </Text>
                              <Text style={styles.criteriaDescription}>
                                Dependable and consistent throughout the job.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.criteriaStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setRatingProfessionalism(star)}
                                style={styles.starButtonSmall}
                              >
                                <Ionicons
                                  name={
                                    star <= ratingProfessionalism
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={24}
                                  color={
                                    star <= ratingProfessionalism
                                      ? "#FFB800"
                                      : Colors.border
                                  }
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Skill Rating - using ratingQuality state */}
                        <View style={styles.criteriaRow}>
                          <View style={styles.criteriaLabelRow}>
                            <Text style={styles.criteriaIcon}>🔧</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.criteriaLabel}>Skill</Text>
                              <Text style={styles.criteriaDescription}>
                                Demonstrated the required skills and expertise.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.criteriaStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setRatingQuality(star)}
                                style={styles.starButtonSmall}
                              >
                                <Ionicons
                                  name={
                                    star <= ratingQuality
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={24}
                                  color={
                                    star <= ratingQuality
                                      ? "#FFB800"
                                      : Colors.border
                                  }
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Workmanship Rating - using ratingCommunication state */}
                        <View style={styles.criteriaRow}>
                          <View style={styles.criteriaLabelRow}>
                            <Text style={styles.criteriaIcon}>🛠️</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.criteriaLabel}>
                                Workmanship
                              </Text>
                              <Text style={styles.criteriaDescription}>
                                Delivered high-quality work.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.criteriaStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setRatingCommunication(star)}
                                style={styles.starButtonSmall}
                              >
                                <Ionicons
                                  name={
                                    star <= ratingCommunication
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={24}
                                  color={
                                    star <= ratingCommunication
                                      ? "#FFB800"
                                      : Colors.border
                                  }
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Review Comment Input */}
                    <TextInput
                      style={styles.reviewInput}
                      placeholder="Write your review here..."
                      placeholderTextColor={Colors.textSecondary}
                      value={reviewComment}
                      onChangeText={setReviewComment}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      blurOnSubmit={true}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />

                    {/* Submit Review Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitReviewButton,
                        (ratingQuality === 0 ||
                          ratingCommunication === 0 ||
                          ratingPunctuality === 0 ||
                          ratingProfessionalism === 0 ||
                          !reviewComment.trim() ||
                          isReviewMutationPending) &&
                          styles.submitReviewButtonDisabled,
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleSubmitReview();
                      }}
                      disabled={
                        ratingQuality === 0 ||
                        ratingCommunication === 0 ||
                        ratingPunctuality === 0 ||
                        ratingProfessionalism === 0 ||
                        !reviewComment.trim() ||
                        isReviewMutationPending
                      }
                    >
                      {isReviewMutationPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="send"
                            size={18}
                            color={Colors.white}
                          />
                          <Text style={styles.submitReviewButtonText}>
                            {reviewModalMode === "edit"
                              ? "Update Review"
                              : "Submit Review"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {/* Extra space to ensure button is above keyboard */}
                    <View style={{ height: 20 }} />
                  </>
                )}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </View>

        {/* Upload Progress */}
        {renderUploadProgress()}

        {/* Backjob Banner - shows when there's an active backjob OR a completed past backjob */}
        {(conversation.backjob?.has_backjob ||
          (conversation.backjob?.total_backjobs_for_job ?? 0) > 0) && (
          <View style={styles.backjobSectionCompact}>
            {/* Compact Backjob Banner */}
            <TouchableOpacity
              style={[
                styles.backjobBannerCompact,
                isBackjobCompleted && {
                  borderColor: Colors.success,
                  backgroundColor: "#E8F5E9",
                },
              ]}
              onPress={() =>
                router.push(
                  `/jobs/backjob-detail?jobId=${conversation.job.id}&disputeId=${conversation.backjob?.dispute_id}`,
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name={isBackjobCompleted ? "checkmark-circle" : "construct"}
                size={18}
                color={isBackjobCompleted ? Colors.success : Colors.warning}
              />
              <Text
                style={[
                  styles.backjobBannerTitleCompact,
                  isBackjobCompleted && { color: "#1B5E20" },
                ]}
                numberOfLines={1}
              >
                {isBackjobCompleted
                  ? "Backjob Completed"
                  : `Backjob: ${conversation.backjob?.reason || "Rework required"}`}
              </Text>
              {!isBackjobCompleted && (
                <View style={styles.backjobStatusBadgeCompact}>
                  <Text style={styles.backjobStatusTextCompact}>
                    {conversation.backjob?.status === "UNDER_REVIEW"
                      ? "Action"
                      : conversation.backjob?.status === "IN_NEGOTIATION"
                        ? "Negotiating"
                        : "Pending"}
                  </Text>
                </View>
              )}
              {!isBackjobCompleted && (
                <Text
                  style={[styles.backjobStatusTextCompact, { marginLeft: 6 }]}
                >
                  #{conversation.backjob?.total_backjobs_for_job ?? 1}
                </Text>
              )}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isBackjobCompleted ? Colors.success : Colors.warning}
              />
            </TouchableOpacity>

            {hasActiveNegotiation && (
              <View style={styles.backjobActionButtonsCompact}>
                {conversation.my_role === "CLIENT" && (
                  <TouchableOpacity
                    style={[
                      styles.backjobActionButtonCompact,
                      {
                        backgroundColor: Colors.warning,
                        width: "100%",
                        flexDirection: "column",
                        paddingVertical: 12,
                        gap: 0,
                      },
                    ]}
                    onPress={handleOpenBackjobScheduleModal}
                    disabled={setBackjobScheduledDateMutation.isPending}
                  >
                    {setBackjobScheduledDateMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        {conversation.backjob?.scheduled_date && (
                          <>
                            <Text
                              style={[
                                styles.backjobActionButtonText,
                                { fontWeight: "400", lineHeight: 14 },
                              ]}
                            >
                              Proposed Date:{" "}
                              {format(
                                parseScheduledDate(
                                  conversation.backjob.scheduled_date,
                                ) || new Date(),
                                "MMMM d (EEEE)",
                              )}
                            </Text>
                            {!conversation.backjob.worker_schedule_confirmed &&
                              !effectiveWorkerScheduleConfirmed && (
                                <Text
                                  style={[
                                    styles.backjobActionButtonText,
                                    {
                                      fontSize: 10,
                                      fontWeight: "400",
                                      lineHeight: 12,
                                    },
                                  ]}
                                >
                                  {teamScheduleTotalWorkers > 0
                                    ? `Waiting for Worker Confirmations (${teamScheduleConfirmedCount}/${teamScheduleTotalWorkers})`
                                    : "Waiting for Worker Confirmation"}
                                </Text>
                              )}
                          </>
                        )}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="calendar-number"
                            size={16}
                            color={Colors.white}
                          />
                          <Text
                            style={[
                              styles.backjobActionButtonText,
                              { fontWeight: "700", lineHeight: 20 },
                            ]}
                          >
                            {conversation.backjob?.scheduled_date
                              ? "Tap to Update Schedule"
                              : "Set Schedule"}
                          </Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {conversation.my_role !== "CLIENT" &&
                  !conversation.backjob?.scheduled_date && (
                    <View style={styles.backjobWaitingBadge}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.backjobWaitingText}>
                        Waiting for client to set date...
                      </Text>
                    </View>
                  )}

                {conversation.my_role !== "CLIENT" &&
                  !!conversation.backjob?.scheduled_date &&
                  !effectiveWorkerScheduleConfirmed &&
                  !myBackjobScheduleConfirmed && (
                    <TouchableOpacity
                      style={[
                        styles.backjobActionButtonCompact,
                        {
                          backgroundColor: Colors.success,
                          width: "100%",
                          flexDirection: "column",
                          paddingVertical: 12,
                          gap: 0,
                        },
                      ]}
                      onPress={handleConfirmBackjobScheduledDate}
                      disabled={confirmBackjobScheduledDateMutation.isPending}
                    >
                      {confirmBackjobScheduledDateMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Text
                            style={[
                              styles.backjobActionButtonText,
                              { fontWeight: "400", lineHeight: 14 },
                            ]}
                          >
                            Proposed Date:{" "}
                            {format(
                              parseScheduledDate(
                                conversation.backjob.scheduled_date,
                              ) || new Date(),
                              "MMMM d (EEEE)",
                            )}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons
                              name="checkmark-done"
                              size={16}
                              color={Colors.white}
                            />
                            <Text
                              style={[
                                styles.backjobActionButtonText,
                                { fontWeight: "700", lineHeight: 20 },
                              ]}
                            >
                              Tap to Confirm Schedule
                            </Text>
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {conversation.my_role !== "CLIENT" &&
                  !!conversation.backjob?.scheduled_date &&
                  !effectiveWorkerScheduleConfirmed &&
                  myBackjobScheduleConfirmed && (
                    <View style={styles.backjobWaitingBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={Colors.success}
                      />
                      <Text style={styles.backjobWaitingText}>
                        {teamScheduleTotalWorkers > 0
                          ? `You confirmed. Waiting for others (${teamScheduleConfirmedCount}/${teamScheduleTotalWorkers})`
                          : "You already confirmed. Waiting for client update..."}
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {/* Backjob Workflow Action Buttons - Only show when backjob is approved (UNDER_REVIEW) */}
            {hasApprovedBackjob && (
              <View style={styles.backjobActionButtonsCompact}>
                {isBackjobScheduledForFuture && (
                  <View style={styles.backjobScheduledNoticeCard}>
                    <View style={styles.backjobScheduledNoticeHeader}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={Colors.white}
                      />
                      <Text style={styles.backjobScheduledNoticeTitle}>
                        Backjob starts on{" "}
                        {scheduledBackjobDate?.toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.backjobScheduledNoticeText}>
                      Workflow actions will activate on the scheduled date.
                    </Text>
                    <TouchableOpacity
                      style={styles.backjobRenegotiateButton}
                      onPress={handleRequestBackjobRenegotiation}
                      disabled={requestBackjobRenegotiationMutation.isPending}
                    >
                      {requestBackjobRenegotiationMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="refresh-circle"
                            size={15}
                            color={Colors.white}
                          />
                          <Text style={styles.backjobRenegotiateButtonText}>
                            Re-negotiate Schedule
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {isBackjobScheduleMissing && (
                  <View style={styles.backjobScheduledNoticeCard}>
                    <View style={styles.backjobScheduledNoticeHeader}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={Colors.warning}
                      />
                      <Text style={styles.backjobScheduledNoticeTitle}>
                        Backjob schedule pending
                      </Text>
                    </View>
                    <Text style={styles.backjobScheduledNoticeText}>
                      Admin needs to set a scheduled date before start
                      confirmation is allowed.
                    </Text>
                    <TouchableOpacity
                      style={styles.backjobRenegotiateButton}
                      onPress={handleRequestBackjobRenegotiation}
                      disabled={requestBackjobRenegotiationMutation.isPending}
                    >
                      {requestBackjobRenegotiationMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="refresh-circle"
                            size={15}
                            color={Colors.white}
                          />
                          <Text style={styles.backjobRenegotiateButtonText}>
                            Request Schedule Update
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {!isBackjobScheduledForFuture && !isBackjobScheduleMissing && (
                  <>
                    {/* CLIENT: Team Backjob Arrival Confirmation (PROJECT/FIXED) */}
                    {conversation.my_role === "CLIENT" &&
                      isTeamBackjobFlow &&
                      !isTeamDailyBackjobFlow &&
                      !conversation.backjob?.backjob_started &&
                      (pendingTeamArrivalWorkerAssignments.length > 0 ||
                        pendingTeamAgencyArrivalAssignments.length > 0) && (
                        <View style={styles.teamProjectArrivalSection}>
                          <View style={styles.teamArrivalHeader}>
                            <Text style={styles.teamArrivalTitle}>
                              Confirm Team Arrivals
                            </Text>
                            <Text style={styles.teamArrivalProgress}>
                              {teamAssignedWorkers.length +
                                (conversation.team_agency_employees?.length ?? 0) -
                                pendingTeamArrivalWorkerAssignments.length -
                                pendingTeamAgencyArrivalAssignments.length}
                              /
                              {teamAssignedWorkers.length +
                                (conversation.team_agency_employees?.length ?? 0)}{" "}
                              arrived
                            </Text>
                          </View>

                          <Text style={styles.teamProjectArrivalSubtext}>
                            Confirm each worker arrival so backjob can start.
                          </Text>

                          <View style={styles.teamProjectArrivalList}>
                            {pendingTeamArrivalWorkerAssignments.map(
                              (assignment: any) => {
                                const workerName =
                                  assignment?.name ||
                                  assignment?.worker_name ||
                                  "Team Worker";

                                return (
                                  <View
                                    key={`backjob-arrival-${assignment.assignment_id}`}
                                    style={styles.teamProjectArrivalRow}
                                  >
                                    <View
                                      style={
                                        styles.teamProjectArrivalWorkerInfo
                                      }
                                    >
                                      {assignment?.avatar ? (
                                        <Image
                                          source={{ uri: assignment.avatar }}
                                          style={styles.teamWorkerAvatarCompact}
                                        />
                                      ) : (
                                        <View
                                          style={[
                                            styles.teamWorkerAvatarCompact,
                                            styles.teamWorkerAvatarPlaceholder,
                                          ]}
                                        >
                                          <Ionicons
                                            name="person"
                                            size={16}
                                            color={Colors.textSecondary}
                                          />
                                        </View>
                                      )}

                                      <View
                                        style={
                                          styles.teamProjectArrivalWorkerTextBlock
                                        }
                                      >
                                        <Text
                                          style={
                                            styles.teamProjectArrivalWorkerName
                                          }
                                        >
                                          {workerName}
                                        </Text>
                                        <Text
                                          style={
                                            styles.teamProjectArrivalWorkerSkill
                                          }
                                        >
                                          {assignment?.skill || "Team Worker"}
                                        </Text>
                                      </View>
                                    </View>

                                    <TouchableOpacity
                                      style={
                                        styles.teamProjectConfirmArrivalButton
                                      }
                                      onPress={() =>
                                        handleConfirmTeamWorkerArrival(
                                          assignment.assignment_id,
                                          workerName,
                                        )
                                      }
                                      disabled={
                                        confirmTeamWorkerArrivalMutation.isPending
                                      }
                                    >
                                      {confirmTeamWorkerArrivalMutation.isPending ? (
                                        <ActivityIndicator
                                          size="small"
                                          color={Colors.white}
                                        />
                                      ) : (
                                        <Text
                                          style={
                                            styles.teamProjectConfirmArrivalText
                                          }
                                        >
                                          Confirm Arrival
                                        </Text>
                                      )}
                                    </TouchableOpacity>
                                  </View>
                                );
                              },
                            )}

                            {pendingTeamAgencyArrivalAssignments.map(
                              (employee: any) => {
                                const employeeName = employee?.name || "Agency Employee";
                                const assignmentId = Number(employee?.assignment_id);

                                if (!Number.isFinite(assignmentId)) {
                                  return null;
                                }

                                return (
                                  <View
                                    key={`backjob-agency-arrival-${assignmentId}`}
                                    style={styles.teamProjectArrivalRow}
                                  >
                                    <View style={styles.teamProjectArrivalWorkerInfo}>
                                      {employee?.avatar ? (
                                        <Image
                                          source={{ uri: employee.avatar }}
                                          style={styles.teamWorkerAvatarCompact}
                                        />
                                      ) : (
                                        <View
                                          style={[
                                            styles.teamWorkerAvatarCompact,
                                            styles.teamWorkerAvatarPlaceholder,
                                          ]}
                                        >
                                          <Ionicons
                                            name="business"
                                            size={16}
                                            color={Colors.textSecondary}
                                          />
                                        </View>
                                      )}

                                      <View
                                        style={styles.teamProjectArrivalWorkerTextBlock}
                                      >
                                        <Text
                                          style={styles.teamProjectArrivalWorkerName}
                                        >
                                          {employeeName}
                                        </Text>
                                        <Text
                                          style={styles.teamProjectArrivalWorkerSkill}
                                        >
                                          {employee?.skill || "Agency Team"}
                                        </Text>
                                      </View>
                                    </View>

                                    <TouchableOpacity
                                      style={styles.teamProjectConfirmArrivalButton}
                                      onPress={() =>
                                        handleConfirmTeamEmployeeArrival(
                                          assignmentId,
                                          employeeName,
                                        )
                                      }
                                      disabled={
                                        confirmTeamEmployeeArrivalMutation.isPending
                                      }
                                    >
                                      {confirmTeamEmployeeArrivalMutation.isPending ? (
                                        <ActivityIndicator
                                          size="small"
                                          color={Colors.white}
                                        />
                                      ) : (
                                        <Text
                                          style={styles.teamProjectConfirmArrivalText}
                                        >
                                          Confirm Arrival
                                        </Text>
                                      )}
                                    </TouchableOpacity>
                                  </View>
                                );
                              },
                            )}
                          </View>
                        </View>
                      )}

                    {/* CLIENT: Confirm Backjob Started Button */}
                    {conversation.my_role === "CLIENT" &&
                      !conversation.backjob?.backjob_started && (
                        <>
                          {canClientConfirmBackjobStartedByArrival && (
                            <TouchableOpacity
                              style={[
                                styles.backjobActionButtonCompact,
                                { backgroundColor: Colors.warning },
                              ]}
                              onPress={handleConfirmBackjobStarted}
                              disabled={confirmBackjobStartedMutation.isPending}
                            >
                              {confirmBackjobStartedMutation.isPending ? (
                                <ActivityIndicator
                                  size="small"
                                  color={Colors.white}
                                />
                              ) : (
                                <>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color={Colors.white}
                                  />
                                  <Text style={styles.backjobActionButtonText}>
                                    Confirm Started
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}

                          {!canClientConfirmBackjobStartedByArrival &&
                            clientBackjobStartBlockReason && (
                              <View style={styles.backjobWaitingBadge}>
                                <Ionicons
                                  name="time-outline"
                                  size={14}
                                  color={Colors.textSecondary}
                                />
                                <Text style={styles.backjobWaitingText}>
                                  {clientBackjobStartBlockReason}
                                </Text>
                              </View>
                            )}
                        </>
                      )}

                    {/* CLIENT: Waiting for Worker to Complete Backjob */}
                    {conversation.my_role === "CLIENT" &&
                      conversation.backjob?.backjob_started &&
                      ((isTeamBackjobFlow && !teamBackjobAllWorkersComplete) ||
                        (!isTeamBackjobFlow &&
                          !conversation.backjob?.worker_marked_complete)) && (
                        <View style={styles.backjobWaitingBadge}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.backjobWaitingText}>
                            {isTeamBackjobFlow
                              ? `Waiting for workers to finish (${teamAssignedWorkers.length - pendingTeamCompletionWorkers.length}/${teamAssignedWorkers.length})...`
                              : "Waiting for worker..."}
                          </Text>
                        </View>
                      )}

                    {/* WORKER/AGENCY: Waiting for Backjob Start */}
                    {isWorkerSideBackjobActor &&
                      !conversation.backjob?.backjob_started && (
                        <View style={styles.backjobWaitingBadge}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.backjobWaitingText}>
                            Waiting for scheduled start...
                          </Text>
                        </View>
                      )}

                    {/* WORKER/AGENCY: Mark Backjob Complete Button */}
                    {conversation.my_role === "WORKER" &&
                      isTeamDailyBackjobFlow &&
                      conversation.backjob?.backjob_started &&
                      myTeamBackjobAssignment &&
                      !myTeamBackjobMarkedComplete && (
                        <TouchableOpacity
                          style={[
                            styles.backjobActionButtonCompact,
                            { backgroundColor: Colors.warning },
                          ]}
                          onPress={() =>
                            handleMarkTeamAssignmentComplete(
                              myTeamBackjobAssignment.assignment_id,
                            )
                          }
                          disabled={
                            markTeamAssignmentCompleteMutation.isPending
                          }
                        >
                          {markTeamAssignmentCompleteMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark-done"
                                size={16}
                                color={Colors.white}
                              />
                              <Text style={styles.backjobActionButtonText}>
                                Mark Assignment Complete
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                    {isWorkerSideBackjobActor &&
                      !(
                        conversation.my_role === "WORKER" && isTeamBackjobFlow
                      ) &&
                      conversation.backjob?.backjob_started &&
                      !conversation.backjob?.worker_marked_complete && (
                        <TouchableOpacity
                          style={[
                            styles.backjobActionButtonCompact,
                            { backgroundColor: Colors.warning },
                          ]}
                          onPress={handleMarkBackjobComplete}
                          disabled={markBackjobCompleteMutation.isPending}
                        >
                          {markBackjobCompleteMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark-done"
                                size={16}
                                color={Colors.white}
                              />
                              <Text style={styles.backjobActionButtonText}>
                                Mark Complete
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                    {conversation.my_role === "WORKER" &&
                      isTeamBackjobFlow &&
                      conversation.backjob?.backjob_started &&
                      !myTeamBackjobAssignment && (
                        <View style={styles.backjobWaitingBadge}>
                          <Ionicons
                            name="alert-circle-outline"
                            size={14}
                            color={Colors.warning}
                          />
                          <Text style={styles.backjobWaitingText}>
                            Waiting for team assignment sync before marking
                            completion.
                          </Text>
                        </View>
                      )}

                    {conversation.my_role === "WORKER" &&
                      isTeamBackjobFlow &&
                      conversation.backjob?.backjob_started &&
                      !!myTeamBackjobAssignment &&
                      !myTeamBackjobMarkedComplete &&
                      !isTeamDailyBackjobFlow && (
                        <TouchableOpacity
                          style={[
                            styles.backjobActionButtonCompact,
                            { backgroundColor: Colors.warning },
                          ]}
                          onPress={() =>
                            handleMarkTeamAssignmentComplete(
                              myTeamBackjobAssignment.assignment_id,
                            )
                          }
                          disabled={
                            markTeamAssignmentCompleteMutation.isPending
                          }
                        >
                          {markTeamAssignmentCompleteMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark-done"
                                size={16}
                                color={Colors.white}
                              />
                              <Text style={styles.backjobActionButtonText}>
                                Mark My Assignment Complete
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                    {/* WORKER: Waiting for Client Approval */}
                    {conversation.my_role === "WORKER" &&
                      ((isTeamBackjobFlow && myTeamBackjobMarkedComplete) ||
                        (!isTeamBackjobFlow &&
                          conversation.backjob?.worker_marked_complete)) &&
                      !conversation.backjob?.client_confirmed_complete && (
                        <View style={styles.backjobWaitingBadge}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.backjobWaitingText}>
                            Awaiting approval...
                          </Text>
                        </View>
                      )}

                    {/* CLIENT: Approve Backjob Completion Button */}
                    {conversation.my_role === "CLIENT" &&
                      ((isTeamBackjobFlow && teamBackjobAllWorkersComplete) ||
                        (!isTeamBackjobFlow &&
                          conversation.backjob?.worker_marked_complete)) &&
                      !conversation.backjob?.client_confirmed_complete && (
                        <TouchableOpacity
                          style={[
                            styles.backjobActionButtonCompact,
                            { backgroundColor: Colors.success },
                          ]}
                          onPress={handleApproveBackjobCompletion}
                          disabled={approveBackjobCompletionMutation.isPending}
                        >
                          {approveBackjobCompletionMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color={Colors.white}
                              />
                              <Text style={styles.backjobActionButtonText}>
                                Approve & Close
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {conversation.my_role === "CLIENT" &&
          isJobCompleted &&
          conversation.job.remainingPaymentPaid &&
          !conversation.job.paymentBuffer?.is_payment_released &&
          !conversation.backjob?.has_backjob &&
          (conversation.backjob?.total_backjobs_for_job ?? 0) === 0 && (
            <TouchableOpacity
              style={styles.releasePaymentNowButtonInline}
              onPress={handleReleasePaymentNow}
              disabled={releasePaymentNowMutation.isPending}
            >
              {releasePaymentNowMutation.isPending ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Ionicons name="flash-outline" size={16} color="#6B7280" />
              )}
              <Text style={styles.releasePaymentNowButtonInlineText}>
                Release Payment Now
              </Text>
            </TouchableOpacity>
          )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          style={{ flex: 1 }}
          keyExtractor={(item, index) =>
            item.message_id
              ? String(item.message_id)
              : `msg_${item.created_at}_${item.sender_name || "unknown"}_${item.message_type || "TEXT"}_${item.message_text || ""}`
          }
          renderItem={renderMessage}
          extraData={messageViewerKey}
          ListFooterComponent={renderTypingIndicator}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Message Input or Closed Message */}
        {isConversationClosed &&
        !hasApprovedBackjob &&
        !hasActiveNegotiation ? (
          <View style={styles.conversationClosedContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color={Colors.textSecondary}
            />
            <Text style={styles.conversationClosedText}>
              This conversation has been closed. Both parties have submitted
              reviews.
            </Text>
          </View>
        ) : (
          <View style={{ paddingBottom: Spacing.sm }}>
            <MessageInput
              onSend={handleSend}
              onImagePress={handleImagePress}
              isSending={isSending}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={showBackjobScheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBackjobScheduleModal(false)}
      >
        <View style={styles.priceModalBackdrop}>
          <View style={styles.priceModalCard}>
            <Text style={styles.priceModalTitle}>Set Backjob Schedule</Text>
            <Text style={styles.priceModalSubtitle}>
              Enter date in YYYY-MM-DD format.
            </Text>

            {Platform.OS === "ios" ? (
              <View
                style={{ marginVertical: Spacing.md, alignItems: "center" }}
              >
                <DateTimePicker
                  value={backjobScheduleDate}
                  mode="date"
                  display="inline"
                  onChange={(event, date) => {
                    if (event.type === "dismissed" || !date) {
                      return;
                    }

                    const normalized = normalizeDateOnly(date);
                    setBackjobScheduleDate(normalized);
                    setBackjobScheduleInput(formatDateOnly(normalized));
                  }}
                  minimumDate={new Date()}
                  themeVariant="light"
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.priceInput, { justifyContent: "center" }]}
                  onPress={() => setShowAndroidDatePicker(true)}
                >
                  <Text
                    style={{
                      color: backjobScheduleInput
                        ? Colors.textPrimary
                        : Colors.textSecondary,
                    }}
                  >
                    {backjobScheduleInput || "Select Date"}
                  </Text>
                </TouchableOpacity>

                {showAndroidDatePicker && (
                  <DateTimePicker
                    value={backjobScheduleDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowAndroidDatePicker(false);
                      if (event.type !== "set" || !date) {
                        return;
                      }

                      const normalized = normalizeDateOnly(date);
                      setBackjobScheduleDate(normalized);
                      setBackjobScheduleInput(formatDateOnly(normalized));
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </>
            )}

            <View style={styles.priceModalActions}>
              <TouchableOpacity
                style={[styles.priceButton, styles.cancelButton]}
                onPress={() => setShowBackjobScheduleModal(false)}
                disabled={setBackjobScheduledDateMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.priceButton, styles.submitButton]}
                onPress={handleSubmitBackjobScheduleDate}
                disabled={setBackjobScheduledDateMutation.isPending}
              >
                {setBackjobScheduledDateMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal
        visible={!!pendingImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingImageUri(null)}
      >
        <View style={styles.photoPreviewOverlay}>
          <Image
            source={{ uri: pendingImageUri! }}
            style={styles.photoPreviewImage}
            resizeMode="contain"
          />
          <View style={styles.photoPreviewActions}>
            <TouchableOpacity
              style={styles.photoPreviewCancel}
              onPress={() => setPendingImageUri(null)}
            >
              <Ionicons
                name="close-outline"
                size={20}
                color={Colors.textPrimary}
              />
              <Text style={styles.photoPreviewCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoPreviewSend}
              onPress={async () => {
                const uri = pendingImageUri;
                setPendingImageUri(null);
                await uploadImageMessage(uri!);
              }}
            >
              <Ionicons name="send-outline" size={20} color={Colors.white} />
              <Text style={styles.photoPreviewSendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPaymentModal(false);
          setPaymentActionMode("APPROVE_COMPLETION");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={styles.modalSubtitle}>
              {paymentActionMode === "PAY_NOW"
                ? "Choose how you want to pay early final payment"
                : paymentActionMode === "APPROVE_SOLO_DAILY_COMPLETION"
                  ? "Choose how you want to pay the worker"
                  : "Choose how you want to pay the remaining 50%"}
            </Text>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handlePaymentMethodSelect("WALLET")}
            >
              <Ionicons name="wallet" size={24} color={Colors.primary} />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Wallet</Text>
                <Text style={styles.paymentOptionDesc}>
                  {paymentActionMode === "PAY_NOW"
                    ? "Pay now and keep completion approval separate"
                    : paymentActionMode === "APPROVE_SOLO_DAILY_COMPLETION"
                      ? "Release remaining escrow to the worker"
                      : "Pay instantly from your iAyos wallet"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentActionMode === "PAY_NOW" && { opacity: 0.55 },
              ]}
              onPress={() => handlePaymentMethodSelect("CASH")}
            >
              <Ionicons name="cash" size={24} color={Colors.primary} />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Cash</Text>
                <Text style={styles.paymentOptionDesc}>
                  {paymentActionMode === "PAY_NOW"
                    ? "Available on completion approval"
                    : paymentActionMode === "APPROVE_SOLO_DAILY_COMPLETION"
                      ? "Pay the worker directly and upload proof"
                      : "Upload proof of cash payment"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowPaymentModal(false);
                setPaymentActionMode("APPROVE_COMPLETION");
              }}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cash Upload Modal */}
      <Modal
        visible={showCashUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCashUploadModal(false);
          setSelectedImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Payment Proof</Text>
            <Text style={styles.modalSubtitle}>
              Upload a photo of your payment receipt or proof
            </Text>

            {/* Image Preview or Upload Button */}
            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={handleCashProofSelect}
                >
                  <Ionicons name="refresh" size={20} color={Colors.white} />
                  <Text style={styles.changeImageButtonText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleCashProofSelect}
              >
                <Ionicons
                  name="cloud-upload"
                  size={32}
                  color={Colors.primary}
                />
                <Text style={styles.uploadButtonText}>Select Image</Text>
                <Text style={styles.uploadButtonDesc}>
                  Tap to choose from gallery
                </Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={styles.cashModalActions}>
              <TouchableOpacity
                style={styles.cashModalCancelButton}
                onPress={() => {
                  setShowCashUploadModal(false);
                  setSelectedImage(null);
                }}
              >
                <Text style={styles.cashModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cashModalSubmitButton,
                  !selectedImage && styles.cashModalSubmitButtonDisabled,
                ]}
                onPress={handleCashProofSubmit}
                disabled={
                  !selectedImage ||
                  approveCompletionMutation.isPending ||
                  createFinalPaymentMutation.isPending
                }
              >
                {approveCompletionMutation.isPending ||
                createFinalPaymentMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.cashModalSubmitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Job Receipt Modal */}
      <JobReceiptModal
        visible={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        jobId={conversation?.job?.id || null}
        userRole={conversation?.my_role === "WORKER" ? "WORKER" : "CLIENT"}
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
          onConfirm={countdownConfig.onConfirm}
          onCancel={() => setCountdownConfig(null)}
          icon={countdownConfig.icon as any}
          iconColor={countdownConfig.iconColor}
        />
      )}

      {/* Price Input Modal - cross-platform replacement for Alert.prompt (iOS-only) */}
      <Modal
        visible={!!priceModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPriceModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 24 }]}>
            <Text style={styles.modalTitle}>Enter Purchase Price</Text>
            <Text style={[styles.modalSubtitle, { marginBottom: 16 }]}>
              {`How much did you pay for ${priceModal?.matName ?? "this item"}?`}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
                color: Colors.textPrimary,
                marginBottom: 20,
              }}
              placeholder="0.00"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={priceInputText}
              onChangeText={setPriceInputText}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { flex: 1 }]}
                onPress={() => {
                  setPriceModal(null);
                  setPriceInputText("");
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cashModalSubmitButton, { flex: 1 }]}
                onPress={async () => {
                  const price = parseFloat(priceInputText || "0");
                  if (price <= 0) {
                    Alert.alert("Error", "Please enter a valid price");
                    return;
                  }
                  const modal = priceModal;
                  setPriceModal(null);
                  setPriceInputText("");
                  try {
                    const uploadResult = await uploadAsync({
                      uri: modal!.imageUri,
                      endpoint: `/api/jobs/${modal!.jobId}/materials/${modal!.matId}/purchase-proof`,
                      fieldName: "receipt_image",
                      additionalData: { purchase_price: price.toString() },
                      compress: true,
                    });
                    if (uploadResult?.success) {
                      Alert.alert("Success", "Receipt uploaded successfully");
                    }
                  } catch (e) {
                    Alert.alert("Error", "Failed to upload receipt");
                  }
                }}
              >
                <Text style={styles.cashModalSubmitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  assignedWorkerBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.primaryLight || "#E3F2FD",
    borderRadius: 10,
  },
  assignedWorkerText: {
    fontSize: 11,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: "500",
  },
  noWorkerBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
  },
  noWorkerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  callButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  infoButton: {
    padding: 4,
    marginLeft: 8,
  },
  menuButton: {
    padding: 4,
    marginLeft: 12,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.heading.h3,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  jobHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jobInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 4,
  },
  completedStatusBanner: {
    width: "100%",
    backgroundColor: "#E8F7ED",
    borderRadius: BorderRadius.small,
    paddingVertical: 3,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  completedStatusBannerText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  cancelledStatusBanner: {
    backgroundColor: "#FDECEC",
  },
  cancelledStatusBannerText: {
    color: Colors.error,
  },
  jobTitle: {
    ...Typography.body.medium,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  jobMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  jobBudget: {
    ...Typography.body.small,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  jobRole: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  jobHeaderContainer: {
    borderBottomWidth: 0,
  },
  completedStatusBannerRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
  },
  actionButtonsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
  },
  confirmWorkStartedButton: {
    backgroundColor: Colors.success,
  },
  markCompleteButton: {
    backgroundColor: Colors.primary,
  },
  approveCompletionButton: {
    backgroundColor: Colors.success,
  },
  dispatchButton: {
    backgroundColor: Colors.warning,
  },
  employeeActionsSection: {
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  actionSectionTitle: {
    ...Typography.body.small,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  confirmArrivalsCollapseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  confirmArrivalWorkerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmArrivalWorkerName: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  confirmArrivalInlineButton: {
    backgroundColor: "#00BAF1",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
    minWidth: 108,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmArrivalInlineButtonText: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.white,
    fontWeight: "600",
  },
  actionButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  // Team Worker Arrival Styles - Compact Horizontal Layout
  teamArrivalSection: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teamArrivalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  teamArrivalTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
  },
  teamArrivalProgress: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  teamWorkersScrollView: {
    marginHorizontal: -Spacing.md,
  },
  teamWorkersScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  teamWorkersScrollContentSingleItem: {
    flexGrow: 1,
  },
  teamWorkerCardCompact: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    minWidth: 130,
    maxWidth: 150,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamWorkerCardOnTheWayBanner: {
    flex: 1,
    alignSelf: "stretch",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    alignItems: "stretch",
    backgroundColor: Colors.white,
  },
  teamWorkerOnTheWayBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  teamWorkerOnTheWayName: {
    ...Typography.body.small,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  activeAttendanceRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  clientOnTheWayActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  activeAttendanceTimeText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 11,
  },
  attendanceRightStatusPill: {
    backgroundColor: "#E8F5E9",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  attendanceRightStatusText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "700",
    fontSize: 11,
  },
  attendanceRightStatusPillNeutral: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  attendanceRightStatusTextNeutral: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontWeight: "700",
    fontSize: 11,
  },
  attendanceRightStatusPillAbsent: {
    backgroundColor: "#FFEBEE",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  attendanceRightStatusTextAbsent: {
    ...Typography.body.small,
    color: Colors.error,
    fontWeight: "700",
    fontSize: 11,
  },
  teamWorkerCardConfirmed: {
    backgroundColor: "#E8F5E9",
    borderColor: Colors.success,
  },
  teamProjectArrivalSection: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  teamProjectArrivalSubtext: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  teamProjectArrivalList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  teamProjectArrivalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  teamProjectArrivalWorkerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  teamProjectArrivalWorkerTextBlock: {
    flex: 1,
  },
  teamProjectArrivalWorkerName: {
    ...Typography.body.small,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  teamProjectArrivalWorkerSkill: {
    ...Typography.body.small,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  teamProjectStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
  },
  teamProjectStatusBadgeArrived: {
    backgroundColor: "#E3F2FD",
  },
  teamProjectStatusBadgeComplete: {
    backgroundColor: "#E8F5E9",
  },
  teamProjectStatusBadgeAbsent: {
    backgroundColor: "#FEECEE",
  },
  teamProjectStatusText: {
    ...Typography.body.small,
    fontSize: 10,
    fontWeight: "700",
  },
  teamProjectStatusTextArrived: {
    color: Colors.primary,
  },
  teamProjectStatusTextComplete: {
    color: Colors.success,
  },
  teamProjectStatusTextAbsent: {
    color: Colors.error,
  },
  teamProjectConfirmArrivalButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  teamProjectCheckoutButton: {
    backgroundColor: Colors.warning,
  },
  teamProjectArrivalActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  teamProjectMarkAbsentButton: {
    backgroundColor: Colors.error,
  },
  teamProjectConfirmArrivalText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
    fontSize: 11,
  },
  teamWorkerInfoCompact: {
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  teamWorkerAvatarCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    marginBottom: 4,
  },
  teamWorkerAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  teamWorkerDetailsCompact: {
    alignItems: "center",
  },
  teamWorkerNameCompact: {
    ...Typography.body.small,
    fontWeight: "600",
    textAlign: "center",
  },
  teamWorkerSkillCompact: {
    ...Typography.body.small,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  arrivedBadgeCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  arrivedTextCompact: {
    ...Typography.body.small,
    fontSize: 10,
    color: Colors.success,
    fontWeight: "600",
  },
  confirmArrivalButtonCompact: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    minWidth: 60,
    alignItems: "center",
  },
  confirmArrivalButtonTextCompact: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.white,
    fontWeight: "600",
  },
  confirmArrivalButtonSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    minWidth: 0,
  },
  markAbsentButtonSmall: {
    backgroundColor: Colors.error,
  },
  confirmArrivalButtonTextSmall: {
    ...Typography.body.small,
    fontSize: 10,
    color: Colors.white,
    fontWeight: "700",
  },
  // Daily Attendance Styles
  dailyAttendanceSection: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
  },
  attendanceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  attendanceHeaderTop: {
    flex: 1,
  },
  attendanceHeaderTitle: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  attendanceHeaderDate: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  attendanceActionRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  workerOnTheWayHelperText: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 4,
    textAlign: "right",
  },
  workerOnTheWayQuickButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#00BAF1",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  workerOnTheWayQuickButtonDisabled: {
    opacity: 0.55,
  },
  workerAbsentQuickButton: {
    backgroundColor: Colors.error,
  },
  workerOnTheWayQuickButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
    fontSize: 12,
  },
  attendanceToggleRow: {
    alignItems: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  attendanceBannerHint: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
    flex: 1,
    lineHeight: 18,
  },
  attendanceClientRightSpacer: {
    width: 24,
    marginLeft: Spacing.xs,
  },
  attendanceClientStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  attendanceClientStatusTextButton: {
    flex: 1,
  },
  attendanceClientStatusActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  attendanceStatusRefreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.primary + "20",
  },
  attendanceConfirmArrivalList: {
    marginTop: Spacing.sm,
  },
  attendanceBannerToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Spacing.xs,
  },
  attendanceToggleButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
  },
  attendanceToggleInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attendanceOnTheWayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00BAF1",
  },
  dailyWorkerActions: {
    marginVertical: Spacing.xs,
  },
  dailyStatusContainer: {
    alignItems: "stretch",
    gap: Spacing.xs,
  },
  workerAttendanceStatusRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  workerAttendanceTimeText: {
    ...Typography.body.small,
    color: Colors.textPrimary,
    fontWeight: "700",
    flexShrink: 1,
  },
  workerAttendanceStatusTag: {
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  workerAttendanceStatusTagInfo: {
    backgroundColor: "#E3F2FD",
  },
  workerAttendanceStatusTagSuccess: {
    backgroundColor: "#E8F5E9",
  },
  workerAttendanceStatusTagWarning: {
    backgroundColor: "#FFF3E0",
  },
  workerAttendanceStatusTagAbsent: {
    backgroundColor: "#FFEBEE",
  },
  workerAttendanceStatusTagText: {
    ...Typography.body.small,
    fontWeight: "700",
    fontSize: 11,
  },
  workerAttendanceStatusTagTextInfo: {
    color: Colors.primary,
  },
  workerAttendanceStatusTagTextSuccess: {
    color: Colors.success,
  },
  workerAttendanceStatusTagTextWarning: {
    color: Colors.warning,
  },
  workerAttendanceStatusTagTextAbsent: {
    color: Colors.error,
  },
  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  checkedInText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "500",
  },
  undoCheckInButton: {
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  undoCheckInButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
    fontSize: 11,
  },
  checkInButton: {
    backgroundColor: Colors.primary,
  },
  checkOutButton: {
    backgroundColor: Colors.warning,
  },
  paymentProcessedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  paymentProcessedText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "600",
  },
  awaitingConfirmText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  workerPendingRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8F5E9",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  workerPendingTimeText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "700",
  },
  workerPendingTag: {
    backgroundColor: "#FFF3E0",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  workerPendingTagText: {
    ...Typography.body.small,
    color: Colors.warning,
    fontWeight: "700",
    fontSize: 11,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  pendingText: {
    ...Typography.body.small,
    fontSize: 10,
    color: Colors.warning,
    fontWeight: "600",
  },
  noAttendanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  noAttendanceText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  noWorkQuickButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  noWorkQuickHelperText: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 4,
  },
  noWorkQuickButtonText: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.white,
    fontWeight: "700",
  },
  dailyRateInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dailyRateLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  dailyRateAmount: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.primary,
  },
  skipDayContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  skipDayButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  skipDayButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "600",
  },
  skipDayWarningCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  skipDayWarningText: {
    ...Typography.body.small,
    color: Colors.warning,
    fontWeight: "600",
  },
  skipDayStatusPending: {
    backgroundColor: "#FFF3E0",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  skipDayStatusApproved: {
    backgroundColor: "#E8F5E9",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skipDayStatusRejected: {
    backgroundColor: "#FFEBEE",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skipDayStatusTitle: {
    ...Typography.body.small,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  skipDayStatusText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clientSkipDayCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  clientSkipDayTitle: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  clientSkipDayText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clientSkipDayWaitingText: {
    ...Typography.body.small,
    color: Colors.warning,
    marginTop: Spacing.xs,
    fontWeight: "600",
  },
  clientSkipDayActions: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  clientSkipApproveButton: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.small,
    paddingVertical: Spacing.xs,
    alignItems: "center",
  },
  clientSkipApproveText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
  },
  clientSkipRejectButton: {
    flex: 1,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.small,
    paddingVertical: Spacing.xs,
    alignItems: "center",
  },
  clientSkipRejectText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
  },
  qaTestingCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "#D5D9DF",
  },
  qaTestingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  qaTestingInfo: {
    flex: 1,
  },
  qaTestingLabel: {
    ...Typography.body.small,
    fontWeight: "800",
    color: "#8E96A3",
    fontSize: 12,
  },
  qaTestingText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  qaSkipNextDayButton: {
    backgroundColor: "transparent",
    borderRadius: BorderRadius.small,
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  qaSkipNextDayButtonText: {
    ...Typography.body.small,
    color: "#00BAF1",
    fontWeight: "700",
  },
  qaSkipLimitText: {
    ...Typography.body.small,
    color: "#8E96A3",
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  dailyEndActionsCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dailyEndActionsTitle: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  dailyEndActionsText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  dailyEndActionsButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  dailyExtendButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.small,
    paddingVertical: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  dailyFinishButton: {
    flex: 1,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.small,
    paddingVertical: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  dailyEndButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
  },
  projectEndActionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "#00BAF1",
  },
  projectEndActionsTitle: {
    ...Typography.body.small,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontSize: 13,
  },
  projectEndActionsText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
    fontSize: 11,
  },
  projectEndActionsButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  projectExtendButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.small,
    paddingVertical: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: "#00BAF1",
  },
  projectExtendButtonText: {
    ...Typography.body.small,
    color: "#00BAF1",
    fontWeight: "700",
  },
  projectFinishButton: {
    flex: 1,
    backgroundColor: "#00BAF1",
    borderRadius: BorderRadius.small,
    paddingVertical: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  projectFinishButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
  },
  projectWorkerWaitingCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  projectWorkerWaitingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  projectWorkerWaitingTitle: {
    ...Typography.body.medium,
    color: "#E65100",
    fontWeight: "700",
    flex: 1,
  },
  projectWorkerWaitingText: {
    ...Typography.body.small,
    color: "#F57C00",
    marginTop: Spacing.xs,
  },
  // Legacy team styles - keeping for reference
  teamWorkerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.small,
    gap: Spacing.md,
  },
  teamWorkerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  teamWorkerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  teamWorkerDetails: {
    flex: 1,
  },
  teamWorkerName: {
    ...Typography.body.medium,
    fontWeight: "600",
  },
  teamWorkerSkill: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  arrivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: "#E8F5E9",
    borderRadius: BorderRadius.small,
  },
  arrivedText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "600",
  },
  confirmArrivalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.small,
  },
  confirmArrivalButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "600",
  },
  teamProgressContainer: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  teamProgressText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
  actionButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  onTheWayButton: {
    backgroundColor: Colors.primary,
  },
  jobStartedButton: {
    backgroundColor: "#00BAF1",
  },
  waitingButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    paddingVertical: 8,
    paddingHorizontal: 8, // Reduced padding
  },
  completedAction: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: Colors.success,
    justifyContent: "flex-start",
  },
  waitingButtonText: {
    ...Typography.body.small, // Reduced from medium
    fontSize: 13, // Explicit compact size
    color: Colors.textPrimary,
    fontWeight: "500",
    fontStyle: "italic",
  },
  statusMessage: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing.xs,
  },
  completedMessage: {
    color: Colors.success,
    fontWeight: "600",
  },
  messagesContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dateSeparatorText: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  typingBubble: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  imageContainer: {
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.md,
    alignItems: "flex-start",
  },
  imageContainerMine: {
    alignItems: "flex-end",
  },
  imageTimestamp: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  imageTimestampMine: {
    marginRight: 4,
    marginLeft: 0,
  },
  uploadProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  uploadProgressText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  reconnectingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#607D8B",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  offlineText: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.white,
    flex: 1,
  },
  photoPreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoPreviewImage: {
    width: "90%" as any,
    height: "70%" as any,
  },
  photoPreviewActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  photoPreviewCancel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
  },
  photoPreviewCancelText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  photoPreviewSend: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  photoPreviewSendText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  // Payment Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.heading.h2,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  paymentOptionText: {
    flex: 1,
  },
  paymentOptionTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    marginBottom: 2,
  },
  paymentOptionDesc: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  modalCancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  modalCancelButtonText: {
    ...Typography.body.medium,
    color: Colors.error,
    fontWeight: "600",
  },
  // Backjob schedule modal styles
  priceModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  priceModalCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
  },
  priceModalTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  priceModalSubtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  priceModalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  priceButton: {
    flex: 1,
    borderRadius: BorderRadius.small,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  // Cash Upload Modal Styles
  uploadButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    paddingVertical: Spacing.xl * 2,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  uploadButtonText: {
    ...Typography.body.medium,
    fontWeight: "600",
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
  },
  uploadButtonDesc: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  imagePreviewContainer: {
    marginBottom: Spacing.lg,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.backgroundSecondary,
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.small,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  changeImageButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  cashModalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cashModalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cashModalCancelButtonText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  cashModalSubmitButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primary,
  },
  cashModalSubmitButtonDisabled: {
    backgroundColor: Colors.border,
  },
  cashModalSubmitButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  // Review Section Styles
  reviewSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.md,
  },
  reviewWaitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  reviewWaitingTitle: {
    ...Typography.heading.h3,
    color: Colors.success,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  reviewWaitingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  reviewSectionTitle: {
    ...Typography.body.large,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reviewCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewCardSubtitle: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  conversationClosedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  conversationClosedText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  jobCompleteBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
    gap: Spacing.md,
  },
  jobCompleteTextContainer: {
    flex: 1,
  },
  jobCompleteTitle: {
    ...Typography.heading.h4,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  jobCompleteSubtitle: {
    ...Typography.body.small,
    color: "#2E7D32",
  },
  reviewTitle: {
    ...Typography.heading.h3,
    marginBottom: Spacing.xs,
  },
  reviewSubtitle: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  starButton: {
    padding: Spacing.xs,
  },
  starButtonSmall: {
    padding: 2,
  },
  starButtonLarge: {
    padding: 4,
  },
  // Single rating styles for WORKER reviewing CLIENT
  singleRatingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  singleRatingLabel: {
    ...Typography.body.large,
    fontWeight: "600",
    color: "#FFB800",
    marginTop: Spacing.sm,
  },
  // Multi-criteria rating styles
  multiCriteriaContainer: {
    marginBottom: Spacing.md,
  },
  criteriaRow: {
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  criteriaLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  criteriaIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  criteriaLabel: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  criteriaDescription: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  criteriaStarsRow: {
    flexDirection: "row",
    marginLeft: 28,
  },
  reviewInput: {
    ...Typography.body.medium,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 100,
    marginBottom: Spacing.md,
  },
  submitReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
  },
  submitReviewButtonDisabled: {
    backgroundColor: Colors.border,
  },
  submitReviewButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  stepIndicatorText: {
    ...Typography.body.small,
    color: Colors.success,
    fontWeight: "500",
  },
  // Backjob Banner Styles
  backjobBanner: {
    backgroundColor: "#FFF3E0",
    borderBottomWidth: 1,
    borderBottomColor: "#FFE0B2",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backjobBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  backjobIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.warning,
    justifyContent: "center",
    alignItems: "center",
  },
  backjobBannerText: {
    flex: 1,
  },
  backjobBannerTitle: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 2,
  },
  backjobBannerSubtitle: {
    ...Typography.body.small,
    color: "#F57C00",
    marginBottom: 4,
  },
  backjobStatusBadge: {
    backgroundColor: "#FFE0B2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  backjobStatusText: {
    ...Typography.body.small,
    fontSize: 11,
    color: "#E65100",
    fontWeight: "600",
  },
  // View Receipt Banner Styles
  viewReceiptBanner: {
    backgroundColor: Colors.primaryLight || "#E3F2FD",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewReceiptContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  viewReceiptIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  viewReceiptTextContainer: {
    flex: 1,
  },
  viewReceiptTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.primary,
  },
  viewReceiptSubtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Request Backjob Banner Styles (for clients to request rework)
  requestBackjobBanner: {
    backgroundColor: "#FFF3E0", // Use orange palette as base style
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  requestBackjobContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: BorderRadius.medium, // Ensure content respects border radius
  },
  requestBackjobIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFB74D", // Orange
    justifyContent: "center",
    alignItems: "center",
  },
  requestBackjobText: {
    flex: 1,
  },
  requestBackjobTitle: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  requestBackjobSubtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  releasePaymentNowButtonInline: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.medium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  releasePaymentNowButtonInlineText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  // Backjob Section & Action Buttons
  backjobSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backjobActionButtonsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#FFF8E1",
    gap: Spacing.sm,
  },
  confirmBackjobStartedButton: {
    backgroundColor: "#F57C00",
  },
  markBackjobCompleteButton: {
    backgroundColor: Colors.warning,
  },
  approveBackjobButton: {
    backgroundColor: Colors.success,
  },
  backjobStatusMessage: {
    ...Typography.body.small,
    color: "#E65100",
    textAlign: "center",
    paddingVertical: Spacing.xs,
    fontStyle: "italic",
  },
  // Payment Buffer Banner Styles
  paymentBufferBanner: {
    backgroundColor: "#FFF8E1",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: "#FFE082",
    padding: Spacing.md,
  },
  paymentReleasedBanner: {
    backgroundColor: "#E8F5E9",
    borderColor: "#A5D6A7",
  },
  paymentBufferContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  paymentBufferIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFA000",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentReleasedIconContainer: {
    backgroundColor: Colors.success,
  },
  paymentBufferText: {
    flex: 1,
  },
  paymentBufferTitle: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 4,
  },
  paymentBufferSubtitle: {
    ...Typography.body.small,
    color: "#F57C00",
    marginBottom: 4,
  },
  paymentBufferHint: {
    ...Typography.body.small,
    fontSize: 12,
    color: "#8D6E63",
    fontStyle: "italic",
  },
  paymentReleasedTitle: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.success,
    marginBottom: 4,
  },
  paymentReleasedSubtitle: {
    ...Typography.body.small,
    color: "#388E3C",
  },
  viewInWalletButton: {
    marginTop: Spacing.sm,
    alignSelf: "flex-end",
  },
  viewInWalletText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  // Compact Payment Buffer Styles
  paymentBufferBannerCompact: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "#FFF8E1",
    borderBottomWidth: 1,
    borderBottomColor: "#FFE082",
    gap: Spacing.sm,
  },
  paymentReleasedBannerCompact: {
    backgroundColor: "#E8F5E9",
    borderBottomColor: "#A5D6A7",
  },
  paymentBufferTextCompact: {
    flex: 1,
  },
  paymentBufferTitleCompact: {
    ...Typography.body.small,
    fontWeight: "600",
    color: "#E65100",
  },
  paymentReleasedTitleCompact: {
    color: Colors.success,
  },
  // Compact Backjob Styles
  backjobSectionCompact: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backjobBannerCompact: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "#FFF3E0",
    gap: Spacing.sm,
  },
  backjobBannerTitleCompact: {
    flex: 1,
    ...Typography.body.small,
    fontWeight: "600",
    color: "#E65100",
  },
  backjobStatusBadgeCompact: {
    backgroundColor: "#FFE0B2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  backjobStatusTextCompact: {
    ...Typography.body.small,
    fontSize: 10,
    fontWeight: "600",
    color: "#E65100",
  },
  backjobPendingAdminBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.warning + "1A",
    borderWidth: 1,
    borderColor: Colors.warning + "40",
    borderRadius: BorderRadius.small,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  backjobPendingAdminText: {
    ...Typography.body.small,
    color: Colors.warning,
    fontWeight: "600",
  },
  backjobActionButtonsCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: "#FFF8E1",
    gap: 8,
  },
  backjobScheduledNoticeCard: {
    width: "100%",
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  backjobScheduledNoticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backjobScheduledNoticeTitle: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
  },
  backjobScheduledNoticeText: {
    ...Typography.body.small,
    color: Colors.white,
  },
  backjobRenegotiateButton: {
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.white,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  backjobRenegotiateButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "700",
  },
  backjobActionButtonCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.small,
    width: "100%",
  },
  backjobActionButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    textAlign: "center",
  },
  backjobWaitingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backjobWaitingText: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  // Negotiation Panel Styles (collapsible admin chat within backjob section)
  negotiationPanel: {
    borderTopWidth: 1,
    borderTopColor: "#E9D5FF",
    backgroundColor: "#FAF5FF",
  },
  negotiationPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: 5,
  },
  negotiationPanelHeaderText: {
    flex: 1,
    ...Typography.body.small,
    fontWeight: "600",
    color: "#6B21A8",
    fontSize: 11,
  },
  negotiationLiveBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  negotiationLiveBadgeText: {
    ...Typography.body.small,
    fontSize: 8,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  negotiationPanelBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
    maxHeight: 220,
  },
  negotiationMessage: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: 3,
  },
  negotiationMessageContent: {
    flex: 1,
    backgroundColor: "#EDE9FE",
    borderRadius: BorderRadius.small,
    padding: Spacing.xs,
    paddingHorizontal: 8,
  },
  negotiationMessageSender: {
    ...Typography.body.small,
    fontSize: 9,
    fontWeight: "700",
    color: "#7C3AED",
    marginBottom: 2,
  },
  negotiationMessageText: {
    ...Typography.body.small,
    fontSize: 12,
    color: "#3B0764",
  },
  negotiationMessageTime: {
    ...Typography.body.small,
    fontSize: 9,
    color: "#8B5CF6",
    marginTop: 2,
    textAlign: "right",
  },
  negotiationEmptyText: {
    ...Typography.body.small,
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: Spacing.sm,
  },
  // Compact Review Banner Styles
  reviewCompleteBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "#E8F5E9",
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
    gap: Spacing.sm,
  },
  reviewCompleteBannerText: {
    flex: 1,
    ...Typography.body.small,
    fontWeight: "600",
    color: Colors.success,
  },
  reviewWaitingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reviewWaitingBadgeText: {
    ...Typography.body.small,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  leaveReviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "#FFFDE7",
    borderBottomWidth: 1,
    borderBottomColor: "#FFF59D",
    gap: Spacing.sm,
  },
  leaveReviewTextContainer: {
    flex: 1,
  },
  leaveReviewTitle: {
    ...Typography.body.small,
    fontWeight: "600",
    color: "#F57F17",
  },
  leaveReviewBadge: {
    backgroundColor: "#FFF9C4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  leaveReviewBadgeText: {
    ...Typography.body.small,
    fontSize: 10,
    fontWeight: "600",
    color: "#F9A825",
  },
  // Review Modal Styles
  reviewModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  reviewModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  reviewModalCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewModalTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  reviewModalContent: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  reviewModalContentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 80,
  },
  // Team job review checklist (below banner)
  teamReviewChecklist: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginHorizontal: Spacing.md,
    marginBottom: 4,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamReviewChecklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
  },
  teamReviewChecklistName: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  teamReviewChecklistNameDone: {
    color: Colors.success,
    textDecorationLine: "line-through",
  },
  teamReviewChecklistSkill: {
    ...Typography.body.small,
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  // Team review progress bar (inside modal)
  teamReviewProgressContainer: {
    marginTop: Spacing.sm,
    gap: 6,
  },
  teamReviewProgressBarBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  teamReviewProgressBarFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  // Dot indicators inside modal
  teamReviewModalChecklist: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  teamReviewModalChecklistDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  teamReviewModalChecklistDotDone: {
    backgroundColor: Colors.success,
  },
  teamReviewModalChecklistDotCurrent: {
    backgroundColor: Colors.primary,
  },
  teamReviewModalChecklistDotText: {
    ...Typography.body.small,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  teamReviewModalChecklistDotTextCurrent: {
    color: Colors.white,
  },
  // Materials Purchasing Workflow Styles
  materialsSection: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  materialsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  materialsSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  materialItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  materialItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  materialItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  materialPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 4,
  },
  materialBadgeOwn: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  materialBadgeOwnText: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: "600",
  },
  materialBadgeApproved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  materialBadgeApprovedText: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: "600",
  },
  materialBadgeRejected: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  materialBadgeRejectedText: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "600",
  },
  materialBadgePending: {
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  materialBadgePendingText: {
    fontSize: 11,
    color: "#d97706",
    fontWeight: "600",
  },
  materialBadgeToBuy: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  materialBadgeToBuyText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },
  materialActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  materialApproveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#16a34a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
  },
  materialApproveBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  materialRejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
  },
  materialRejectBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  materialUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    borderStyle: "dashed",
  },
  materialUploadBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  materialsCostSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#bae6fd",
  },
  materialsCostLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  materialsCostValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  materialsActions: {
    marginTop: 8,
  },
  materialsBuyingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  materialsBuyingBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  materialsSkipBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 8,
  },
  materialsSkipBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },
});


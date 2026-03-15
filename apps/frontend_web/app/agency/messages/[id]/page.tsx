"use client";

// Agency Chat Screen
// 1-on-1 messaging with real-time updates, image uploads, and typing indicators
// Uses agency-specific hooks for conversations

import React, { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  useAgencyMessages,
  useAgencySendMessage,
  useAgencyMarkComplete,
  useAgencySubmitReview,
  AssignedEmployee,
} from "@/lib/hooks/useAgencyConversations";
import {
  useAgencyDailyAttendance,
  useDispatchEmployee,
  useDispatchProjectEmployee,
  useAgencyRequestSkipDay,
} from "@/lib/hooks/useAgencyDailyAttendance";
import {
  useConfirmBackjobStarted,
  useConfirmBackjobScheduledDate,
  useMarkBackjobComplete,
  useApproveBackjobCompletion,
} from "@/lib/hooks/useAgencyBackjobActions";
import {
  useMessageListener,
  useTypingIndicator,
  useWebSocketConnection,
} from "@/lib/hooks/useWebSocketHooks";
import MessageBubble from "@/components/agency/MessageBubble";
import MessageInput from "@/components/agency/MessageInput";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  WifiOff,
  Wifi,
  MoreVertical,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Briefcase,
  MapPin,
  User,
  Building2,
  CheckCircle,
  Clock,
  Star,
  AlertCircle,
  AlertTriangle,
  Camera,
  X,
  Upload,
  Send,
  Users,
  DollarSign,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import type { AgencyMessage } from "@/lib/hooks/useAgencyConversations";
import { useAgencyVoiceCall } from "@/lib/hooks/useAgencyVoiceCall";

// Keep empty by default; real API payloads are used in production.
const DUMMY_CONVERSATION_DETAILS: Record<number, any> = {};

export default function AgencyChatScreen() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = parseInt(params.id as string);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Job action state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<"submit" | "view">(
    "submit",
  );
  const [ratingQuality, setRatingQuality] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingPunctuality, setRatingPunctuality] = useState(0);
  const [ratingProfessionalism, setRatingProfessionalism] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewViewLoading, setReviewViewLoading] = useState(false);
  const [reviewViewData, setReviewViewData] = useState<{
    myReview: any | null;
    clientReview: any | null;
  }>({
    myReview: null,
    clientReview: null,
  });
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // Backjob action state
  const [showBackjobConfirmModal, setShowBackjobConfirmModal] = useState(false);
  const [showBackjobCompleteModal, setShowBackjobCompleteModal] =
    useState(false);
  const [showBackjobApproveModal, setShowBackjobApproveModal] = useState(false);
  const [showBackjobDetailsModal, setShowBackjobDetailsModal] = useState(false);
  const [backjobNotes, setBackjobNotes] = useState("");

  // Daily attendance state
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(
    new Set(),
  );

  // Fetch conversation and messages using agency hooks
  const isDummy = !!DUMMY_CONVERSATION_DETAILS[conversationId];
  const {
    data: realConversation,
    isLoading: isRealLoading,
    refetch: realRefetch,
  } = useAgencyMessages(isDummy ? null : conversationId);

  const conversation = isDummy
    ? DUMMY_CONVERSATION_DETAILS[conversationId]
    : realConversation;
  const isLoading = isDummy ? false : isRealLoading;
  const refetch = isDummy ? () => {} : realRefetch;

  // Send message mutation using agency hook
  const sendMutation = useAgencySendMessage();

  // Job action mutations
  const markCompleteMutation = useAgencyMarkComplete();
  const submitReviewMutation = useAgencySubmitReview();

  // Backjob action mutations
  const confirmBackjobStartedMutation = useConfirmBackjobStarted();
  const confirmBackjobScheduledDateMutation = useConfirmBackjobScheduledDate();
  const markBackjobCompleteMutation = useMarkBackjobComplete();
  const approveBackjobCompletionMutation = useApproveBackjobCompletion();

  // Daily attendance queries and mutations
  const { data: attendanceData } = useAgencyDailyAttendance(
    conversation?.job?.id || 0,
  );
  const dispatchEmployeeMutation = useDispatchEmployee();
  const dispatchProjectMutation = useDispatchProjectEmployee();
  const requestSkipDayMutation = useAgencyRequestSkipDay();

  // WebSocket connection state
  const { isConnected } = useWebSocketConnection();

  const {
    callStatus,
    incomingCall,
    durationSeconds,
    error: callError,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    hydrateIncomingCall,
  } = useAgencyVoiceCall();
  const [isMuted, setIsMuted] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // WebSocket: Listen for new messages
  useMessageListener(conversationId);

  // WebSocket: Typing indicator
  const { isTyping, typingUserName, sendTyping } =
    useTypingIndicator(conversationId);

  // Auto-scroll to bottom when new messages arrive
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100
    );
  };

  useEffect(() => {
    if (conversation?.messages.length) {
      if (isNearBottom()) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.messages.length]);

  // Handle send message
  const handleSendMessage = (text: string) => {
    sendMutation.mutate({
      conversationId,
      text,
      type: "TEXT",
    });
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (searchParams.get("incoming_call") !== "1") {
      return;
    }

    const raw = localStorage.getItem("agency_pending_call");
    if (!raw) {
      return;
    }

    try {
      const pending = JSON.parse(raw) as {
        conversationId?: number;
        callerName?: string;
        isGroupCall?: boolean;
      };

      if (Number(pending.conversationId) !== conversationId) {
        return;
      }

      hydrateIncomingCall({
        conversationId,
        callerName: pending.callerName || "Unknown",
        isGroupCall: Boolean(pending.isGroupCall),
      });
      localStorage.removeItem("agency_pending_call");
    } catch {
      localStorage.removeItem("agency_pending_call");
    }
  }, [conversationId, hydrateIncomingCall, searchParams]);

  const handleStartCall = async () => {
    const started = await initiateCall(
      conversationId,
      Boolean(
        conversation?.assigned_employees &&
          conversation.assigned_employees.length > 1,
      ),
    );
    if (!started) {
      toast.error(callError || "Could not start voice call.");
    }
  };

  // Handle image upload
  const handleImageSelect = async (file: File) => {
    if (isUploading) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: JPEG, PNG, JPG, WEBP");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${API_BASE}/api/agency/conversations/${conversationId}/upload-image`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, "Upload failed"));
      }

      const result = await response.json();
      if (process.env.NODE_ENV === "development") {
        console.log("Image uploaded:", result);
      }

      // Refetch conversation to show the new image
      refetch();

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle mark job as complete with a direct confirmation prompt
  const handleMarkComplete = async () => {
    if (!conversation?.job.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to mark \"${conversation.job.title}\" as completed?`,
    );
    if (!confirmed) return;

    try {
      await markCompleteMutation.mutateAsync({
        jobId: conversation.job.id,
        completionNotes: "",
      });

      refetch();
      toast.success("Job marked as complete");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark job as complete",
      );
    }
  };

  const parseExpectedDurationDays = (
    expectedDuration?: string | null,
  ): number => {
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

    const plainNumber = Number(text);
    if (Number.isFinite(plainNumber) && plainNumber > 0) {
      return Math.max(1, Math.floor(plainNumber));
    }

    return 1;
  };

  const handleExtendProjectOneDay = async () => {
    if (!conversation?.job?.id) return;

    const confirmed = window.confirm(
      "Extend project duration by 1 day? This keeps the job active for one more work day.",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/jobs/${conversation.job.id}/project/extend-one-day`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to extend project by one day"),
        );
      }

      toast.success(data?.message || "Project extended by 1 day");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to extend project by one day",
      );
    }
  };

  const handleFinishProjectNow = async () => {
    if (!conversation?.job?.id) return;

    const confirmed = window.confirm(
      "Finish this project now? This action starts project completion and settlement.",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/jobs/${conversation.job.id}/project/finish`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to finish project"));
      }

      toast.success(data?.message || "Project marked as finished");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to finish project",
      );
    }
  };

  // Handle submit review
  const handleSubmitReview = () => {
    if (!conversation?.job.id) return;
    if (
      ratingQuality === 0 ||
      ratingCommunication === 0 ||
      ratingPunctuality === 0 ||
      ratingProfessionalism === 0
    )
      return;
    if (!reviewText.trim()) {
      toast.error("Please add a review message.");
      return;
    }

    submitReviewMutation.mutate(
      {
        jobId: conversation.job.id,
        rating_quality: ratingQuality,
        rating_communication: ratingCommunication,
        rating_punctuality: ratingPunctuality,
        rating_professionalism: ratingProfessionalism,
        reviewText: reviewText.trim(),
      },
      {
        onSuccess: () => {
          setShowReviewModal(false);
          setReviewModalMode("view");
          setReviewViewData((prev) => ({
            myReview: {
              rating_quality: ratingQuality,
              rating_communication: ratingCommunication,
              rating_punctuality: ratingPunctuality,
              rating_professionalism: ratingProfessionalism,
              comment: reviewText.trim(),
            },
            clientReview: prev.clientReview,
          }));
          setRatingQuality(0);
          setRatingCommunication(0);
          setRatingPunctuality(0);
          setRatingProfessionalism(0);
          setReviewText("");
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to submit review");
        },
      },
    );
  };

  const openReviewModal = () => {
    if (!conversation) return;

    const normalizeReview = (review: any) => {
      if (!review) return null;
      if (
        review.rating_quality == null &&
        review.rating_communication == null &&
        review.rating_punctuality == null &&
        review.rating_professionalism == null
      ) {
        return null;
      }
      return review;
    };

    const extractFromSource = (source: any) => {
      if (!source) {
        return { myReview: null, clientReview: null };
      }

      let myReview =
        normalizeReview(source.worker_review) ||
        normalizeReview(source.agency_review) ||
        normalizeReview(source.my_review);
      let clientReview =
        normalizeReview(source.client_review) ||
        normalizeReview(source.counterparty_review) ||
        normalizeReview(source.counterparty_reviews?.[0]);

      const reviewsList = Array.isArray(source.reviews) ? source.reviews : [];
      if (!clientReview) {
        clientReview =
          normalizeReview(
            reviewsList.find((r: any) =>
              String(r?.reviewer_type || "").toUpperCase().includes("CLIENT"),
            ),
          ) || null;
      }
      if (!myReview) {
        myReview =
          normalizeReview(
            reviewsList.find((r: any) => {
              const reviewerType = String(r?.reviewer_type || "").toUpperCase();
              return reviewerType.includes("AGENCY") || reviewerType.includes("WORKER");
            }),
          ) || null;
      }

      return { myReview, clientReview };
    };

    const hasSubmittedReview = !!conversation.job.workerReviewed;
    const bothSidesReviewed =
      !!conversation.job.workerReviewed && !!conversation.job.clientReviewed;

    if (hasSubmittedReview || bothSidesReviewed) {
      setReviewModalMode("view");
      setShowReviewModal(true);

      const conversationDerived = extractFromSource(conversation as any);
      setReviewViewData(conversationDerived);
      setReviewViewLoading(false);
      return;
    }

    setReviewModalMode("submit");
    setShowReviewModal(true);
  };

  // Handle confirm backjob started (CLIENT only - but agencies shouldn't see this)
  const handleConfirmBackjobStarted = () => {
    if (!conversation?.job.id) return;

    confirmBackjobStartedMutation.mutate(conversation.job.id, {
      onSuccess: () => {
        setShowBackjobConfirmModal(false);
        refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to confirm backjob started");
      },
    });
  };

  // Handle mark backjob complete (AGENCY/WORKER only)
  const handleMarkBackjobComplete = () => {
    if (!conversation?.job.id) return;

    markBackjobCompleteMutation.mutate(
      { jobId: conversation.job.id, notes: backjobNotes },
      {
        onSuccess: () => {
          setShowBackjobCompleteModal(false);
          setBackjobNotes("");
          refetch();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to mark backjob complete");
        },
      },
    );
  };

  // Handle confirm backjob scheduled date (AGENCY/assigned worker side)
  const handleConfirmBackjobScheduledDate = () => {
    if (!conversation?.job.id) return;

    const hasConfirmed = window.confirm(
      "Confirm the client-proposed backjob schedule date?",
    );
    if (!hasConfirmed) return;

    confirmBackjobScheduledDateMutation.mutate(conversation.job.id, {
      onSuccess: () => {
        refetch();
        toast.success("Backjob schedule confirmed");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to confirm backjob schedule");
      },
    });
  };

  // Handle approve backjob completion (CLIENT only - but agencies shouldn't see this)
  const handleApproveBackjobCompletion = () => {
    if (!conversation?.job.id) return;

    approveBackjobCompletionMutation.mutate(
      { jobId: conversation.job.id, notes: backjobNotes },
      {
        onSuccess: () => {
          setShowBackjobApproveModal(false);
          setBackjobNotes("");
          refetch();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to approve backjob completion");
        },
      },
    );
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render date separator
  const renderDateSeparator = (currentDate: Date, previousDate?: Date) => {
    if (!previousDate || !isSameDay(currentDate, previousDate)) {
      return (
        <div className="flex items-center justify-center my-4">
          <div className="bg-gray-200 px-3 py-1 rounded-full">
            <p className="text-xs text-gray-600">
              {format(currentDate, "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const loadReceipt = async () => {
      if (!showReceiptModal || !conversation?.job?.id) return;

      setReceiptLoading(true);
      setReceiptError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/jobs/${conversation.job.id}/receipt`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.receipt) {
          throw new Error(data?.error || "Failed to load receipt");
        }

        setReceiptData(data.receipt);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load receipt";
        setReceiptError(message);
      } finally {
        setReceiptLoading(false);
      }
    };

    loadReceipt();
  }, [showReceiptModal, conversation?.job?.id]);

  const formatSystemUpdateText = (rawText: string) => {
    const withoutEmoji = rawText
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!withoutEmoji) {
      return "";
    }

    const lettersOnly = withoutEmoji.replace(/[^A-Za-z]/g, "");
    if (!lettersOnly) {
      return withoutEmoji;
    }

    const uppercaseCount = lettersOnly
      .split("")
      .filter((char) => char === char.toUpperCase()).length;
    const uppercaseRatio = uppercaseCount / lettersOnly.length;

    if (uppercaseRatio >= 0.7) {
      const sentenceCase = withoutEmoji.toLowerCase();
      return sentenceCase.charAt(0).toUpperCase() + sentenceCase.slice(1);
    }

    return withoutEmoji;
  };

  const formatBackjobDate = (dateValue?: string | null, withTime = true) => {
    if (!dateValue) return "N/A";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return withTime
      ? format(parsed, "EEE, MMM d, yyyy 'at' h:mm a")
      : format(parsed, "EEE, MMM d, yyyy");
  };

  // Avoid hydration mismatches for conditionally rendered early states.
  if (!hasMounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg font-medium text-gray-700 mb-4">
          Conversation not found
        </p>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    );
  }

  // Agency conversation uses client, assigned_employee(s), and job
  const { client, assigned_employee, assigned_employees, job, messages } =
    conversation;

  const myReview = reviewViewData.myReview;
  const clientReview = reviewViewData.clientReview;

  const isPaymentReleased = !!job.paymentReleasedToWorker;

  const isAgencyBackjob =
    conversation.backjob?.has_backjob &&
    !isPaymentReleased &&
    conversation.my_role === "AGENCY";
  const isBackjobExecutionPhase =
    !!conversation.backjob?.backjob_started ||
    conversation.backjob?.status === "UNDER_REVIEW" ||
    conversation.backjob?.status === "RESOLVED";

  // Legacy compatibility: old jobs may keep completed job flags set even when
  // an active backjob cycle is still running. Keep conversation open until the
  // active backjob is actually finalized.
  const hasActiveBackjobCycle =
    !!conversation.backjob?.has_backjob &&
    !isPaymentReleased &&
    !conversation.backjob?.client_confirmed_complete &&
    conversation.backjob?.status !== "RESOLVED";

  const isConversationClosed =
    (conversation.status === "COMPLETED" && !hasActiveBackjobCycle) ||
    (job.clientMarkedComplete &&
      job.workerReviewed &&
      job.clientReviewed &&
      !hasActiveBackjobCycle);

  const shouldShowProjectWorkflow =
    (job.status === "IN_PROGRESS" ||
      job.status === "COMPLETED" ||
      job.clientMarkedComplete ||
      job.workerMarkedComplete) &&
    job.payment_model === "PROJECT" &&
    assigned_employees?.length > 0 &&
    (!hasActiveBackjobCycle ||
      conversation.backjob?.worker_schedule_confirmed === true);

  const configuredDurationDays = Number(job.duration_days || 0);
  const fallbackDurationDays = parseExpectedDurationDays(job.expectedDuration);
  const effectiveDurationDays =
    configuredDurationDays > 0 ? configuredDurationDays : fallbackDurationDays;
  const totalDaysWorked = Math.max(0, Number(job.total_days_worked || 0));
  const isProjectMultiDayFlow =
    job.payment_model === "PROJECT" && effectiveDurationDays > 1;
  const reachedConfiguredDuration =
    isProjectMultiDayFlow && totalDaysWorked >= effectiveDurationDays;

  const backjobCycleStartMs =
    hasActiveBackjobCycle && conversation.backjob?.worker_schedule_confirmed_at
      ? new Date(conversation.backjob.worker_schedule_confirmed_at).getTime()
      : null;

  const isStatusInActiveBackjobCycle = (
    statusFlag?: boolean,
    statusAt?: string | null,
  ) => {
    if (!statusFlag) {
      return false;
    }

    if (!hasActiveBackjobCycle || !conversation.backjob?.worker_schedule_confirmed) {
      return true;
    }

    if (!backjobCycleStartMs) {
      return true;
    }

    // Backward compatibility: older in-progress rows may have status flags but
    // missing timestamp fields.
    if (!statusAt) {
      return true;
    }

    const statusMs = new Date(statusAt).getTime();
    if (!Number.isFinite(statusMs)) {
      return true;
    }

    return statusMs >= backjobCycleStartMs;
  };

  const allEmployeesDispatched = shouldShowProjectWorkflow
    ? assigned_employees.every((e: AssignedEmployee) =>
        isStatusInActiveBackjobCycle(e.dispatched, e.dispatchedAt),
      )
    : false;

  const allEmployeesArrived = shouldShowProjectWorkflow
    ? assigned_employees.every((e: AssignedEmployee) =>
        isStatusInActiveBackjobCycle(
          e.clientConfirmedArrival,
          e.clientConfirmedArrivalAt,
        ),
      )
    : false;

  const canMarkBackjobCompleteNow =
    isAgencyBackjob &&
    isBackjobExecutionPhase &&
    !!conversation.backjob?.backjob_started &&
    !conversation.backjob?.worker_marked_complete &&
    (!shouldShowProjectWorkflow || allEmployeesDispatched);

  // Keep lock-state logic for input disable/placeholder behavior.
  // Only the visual lock banner has been removed.
  const backjobStatus = conversation.backjob?.status;
  const isBackjobReviewLocked =
    conversation.backjob?.has_backjob === true && backjobStatus === "OPEN";
  const chatDisabledReason =
    conversation.can_send_reason ||
    "Chat is temporarily locked while admin reviews this backjob. Messaging opens once scheduling starts.";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        {/* Header - Floating style as requested */}
        <div className="p-4 bg-transparent z-10">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                {/* Left: Back button + Client info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="flex-shrink-0"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={client.avatar || ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {client.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="h-3 w-3" />
                      <span className="truncate">{job.title}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleStartCall}
                    disabled={callStatus !== "idle" && callStatus !== "ended"}
                    title="Start voice call"
                    className="rounded-full h-10 w-10"
                  >
                    <Phone className="h-4 w-4 text-[#00BAF1]" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Scrollable Message Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 pb-4 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto space-y-4 pt-2">
            {/* Status Banners */}
            {conversation.backjob?.has_backjob && (
              <div className="sticky top-0 z-20">
                <div
                  className="p-3 bg-amber-50 rounded-xl border border-amber-200 shadow-sm cursor-pointer"
                  onClick={() => setShowBackjobDetailsModal(true)}
                  role="button"
                  aria-label="Open backjob details"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">
                      Active Backjob Request
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 font-medium mb-2">
                    Proposed date: {conversation.backjob.scheduled_date
                      ? formatBackjobDate(conversation.backjob.scheduled_date, false)
                      : "Waiting for client to set schedule"}
                  </p>
                  {conversation.backjob.status === "IN_NEGOTIATION" &&
                    conversation.my_role === "AGENCY" && (
                      <div className="mt-2">
                        {conversation.backjob.scheduled_date &&
                        !conversation.backjob.worker_schedule_confirmed ? (
                          <Button
                            size="sm"
                            className="w-full bg-[#00BAF1] hover:bg-[#00BAF1]/90"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleConfirmBackjobScheduledDate();
                            }}
                            disabled={
                              confirmBackjobScheduledDateMutation.isPending
                            }
                          >
                            {confirmBackjobScheduledDateMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Confirm Scheduled Date
                          </Button>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            Waiting for client to set schedule...
                          </div>
                        )}
                      </div>
                    )}
                  {isAgencyBackjob && (
                    <div className="mt-2">
                        {!isBackjobExecutionPhase &&
                        conversation.backjob.worker_schedule_confirmed ? (
                          <div className="text-xs text-gray-500 italic">
                            Waiting for client to confirm...
                          </div>
                        ) : isBackjobExecutionPhase &&
                          !conversation.backjob.worker_marked_complete &&
                          shouldShowProjectWorkflow &&
                          !allEmployeesDispatched ? (
                          <div className="text-xs text-gray-500 italic">
                            Dispatch workers first before confirming completion.
                          </div>
                        ) : isBackjobExecutionPhase &&
                          !conversation.backjob.worker_marked_complete &&
                          shouldShowProjectWorkflow &&
                          !conversation.backjob.backjob_started ? (
                          <div className="text-xs text-gray-500 italic">
                            Waiting for client to confirm backjob work has started.
                          </div>
                        ) : canMarkBackjobCompleteNow ? (
                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={(event) => {
                              event.stopPropagation();
                              setShowBackjobCompleteModal(true);
                            }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Mark
                            Complete
                          </Button>
                        ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}

            {shouldShowProjectWorkflow &&
              (() => {
                const allDispatched = allEmployeesDispatched;
                const isBackjobProjectFlow = hasActiveBackjobCycle;
                const allArrived = isBackjobProjectFlow ? true : allEmployeesArrived;
                const allComplete = assigned_employees.every(
                  (e: AssignedEmployee) =>
                    isStatusInActiveBackjobCycle(
                      e.agencyMarkedComplete,
                      e.agencyMarkedCompleteAt,
                    ),
                );
                const agencyMarkedComplete =
                  allComplete ||
                  (job.workerMarkedComplete && !hasActiveBackjobCycle);
                const dispatchedCount = assigned_employees.filter(
                  (e: AssignedEmployee) =>
                    isStatusInActiveBackjobCycle(e.dispatched, e.dispatchedAt),
                ).length;
                const arrivedCount = assigned_employees.filter(
                  (e: AssignedEmployee) =>
                    isStatusInActiveBackjobCycle(
                      e.clientConfirmedArrival,
                      e.clientConfirmedArrivalAt,
                    ),
                ).length;
                const totalCount = assigned_employees.length;

                if (job.clientMarkedComplete && !hasActiveBackjobCycle) {
                  return null;
                }

                if (agencyMarkedComplete) {
                  return (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
                      Waiting for client approval and payment
                    </div>
                  );
                }

                if (!allDispatched) {
                  return (
                    <Card className="border-blue-100 bg-blue-50/50 rounded-xl overflow-hidden shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-blue-900">
                            Dispatch Pending ({dispatchedCount}/{totalCount})
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {assigned_employees.map(
                            (e: AssignedEmployee) =>
                              !isStatusInActiveBackjobCycle(
                                e.dispatched,
                                e.dispatchedAt,
                              ) && (
                                <div
                                  key={e.employeeId}
                                  className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100"
                                >
                                  <span>{e.name}</span>
                                  <Button
                                    size="sm"
                                    className="h-6 px-3 bg-[#00BAF1] text-[10px]"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      dispatchProjectMutation.mutate(
                                        {
                                          jobId: job.id,
                                          employeeId: e.employeeId,
                                          conversationId,
                                        },
                                        {
                                          onError: (error) => {
                                            const message =
                                              error instanceof Error
                                                ? error.message
                                                : "Failed to dispatch employee";
                                            window.alert(message);
                                          },
                                        },
                                      );
                                    }}
                                    disabled={dispatchProjectMutation.isPending}
                                  >
                                    Dispatch
                                  </Button>
                                </div>
                              ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                if (isBackjobProjectFlow && !conversation.backjob?.backjob_started) {
                  return (
                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-xs text-yellow-800 font-medium">
                      Waiting for client to confirm backjob work has started.
                    </div>
                  );
                }
                if (!isBackjobProjectFlow && !allArrived) {
                  return (
                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-xs text-yellow-800 font-medium">
                      Waiting for client to confirm arrivals ({arrivedCount}/
                      {totalCount})
                    </div>
                  );
                }
                if (!allComplete) {
                  if (reachedConfiguredDuration && !hasActiveBackjobCycle) {
                    return (
                      <Card className="border-blue-200 bg-blue-50/60 rounded-xl overflow-hidden shadow-sm">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                              Project Duration Reached
                            </span>
                            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px]">
                              Worked {totalDaysWorked}/{effectiveDurationDays}
                            </Badge>
                          </div>
                          <p className="text-xs text-blue-800 font-medium">
                            Extend by 1 day to continue work, or finish the job now.
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 px-3 text-[10px] bg-[#00BAF1] hover:bg-[#00a8d8]"
                              onClick={handleExtendProjectOneDay}
                            >
                              Extend +1 Day
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-3 text-[10px] bg-red-600 hover:bg-red-700"
                              onClick={handleFinishProjectNow}
                            >
                              Job Finished
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">
                        Ready to complete
                      </span>
                      <Button
                        size="sm"
                        className="bg-green-600 px-3 h-7 text-[10px]"
                        onClick={handleMarkComplete}
                      >
                        Complete Job
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}

            {/* Message Map */}
            {messages.map((message: AgencyMessage, index: number) => {
              const currentDate = new Date(message.created_at);
              const previousDate =
                index > 0
                  ? new Date(messages[index - 1].created_at)
                  : undefined;

              return (
                <div key={`${message.message_id}-${index}`}>
                  {renderDateSeparator(currentDate, previousDate)}
                  {message.message_type === "SYSTEM" ? (
                    <div className="flex justify-center my-4 text-[11px] text-gray-500 font-medium text-center">
                      {formatSystemUpdateText(message.message_text)} —{" "}
                      {format(currentDate, "h:mm a")}
                    </div>
                  ) : (
                    <div
                      className={`flex mb-4 ${message.is_mine ? "justify-end" : "justify-start"}`}
                    >
                      {!message.is_mine && (
                        <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
                          <AvatarImage src={message.sender_avatar || ""} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {getInitials(message.sender_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[75%] space-y-1 ${message.is_mine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                            message.is_mine
                              ? "bg-[#00BAF1] text-white rounded-br-none"
                              : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                          }`}
                        >
                          {message.message_type === "IMAGE" &&
                          message.message_text ? (
                            <img
                              src={message.message_text}
                              alt="Shared"
                              className="rounded-lg max-w-full cursor-pointer hover:opacity-95"
                              onClick={() =>
                                setShowImageModal(message.message_text)
                              }
                            />
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {message.message_text}
                            </p>
                          )}
                        </div>
                        <p
                          className={`text-[10px] font-medium px-1 ${message.is_mine ? "text-right text-gray-400" : "text-left text-gray-400"}`}
                        >
                          {format(currentDate, "h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 italic font-medium px-2">
                <span className="flex gap-1">
                  <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                {(typingUserName || "Someone")} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input - Floating Style */}
        <div className="p-4 bg-transparent mt-auto z-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {!isConnected && !isConversationClosed && (
              <div className="px-4 pt-3 text-xs text-amber-700 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <WifiOff className="h-3.5 w-3.5" />
                Live updates reconnecting. You can still send messages.
              </div>
            )}

            {isConversationClosed ? (
              <div className="p-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Conversation Closed
              </div>
            ) : (
              <MessageInput
                onSend={handleSendMessage}
                onTyping={sendTyping}
                onImageSelect={handleImageSelect}
                disabled={
                  sendMutation.isPending ||
                  isBackjobReviewLocked ||
                  conversation.can_send_message === false ||
                  isConversationClosed
                }
                isUploading={isUploading}
                placeholder={
                  sendMutation.isPending
                    ? "Sending..."
                    : isBackjobReviewLocked ||
                        conversation.can_send_message === false
                      ? chatDisabledReason
                      : "Type a message..."
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Job Details */}
      <div className="w-[380px] p-4 bg-transparent hidden lg:flex flex-col h-full">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto p-6 space-y-8">
          {job.clientMarkedComplete && (
            <div className="p-2 bg-green-50 rounded-xl border border-green-200 text-xs text-green-700 font-semibold flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5" />
              Job completed successfully
            </div>
          )}

          {job.clientMarkedComplete && (
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9 px-3 text-[12px] font-bold border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                onClick={openReviewModal}
                disabled={submitReviewMutation.isPending}
              >
                {job.workerReviewed && job.clientReviewed
                  ? "View reviews"
                  : job.workerReviewed
                    ? "Review submitted"
                    : "Leave review"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9 px-3 text-[12px] font-bold border-[#00BAF1] text-[#00BAF1] hover:bg-[#00BAF1]/10"
                onClick={() => setShowReceiptModal(true)}
              >
                View receipt
              </Button>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">
              Job Information
            </h3>
            <div className="space-y-6">
              {[
                { icon: Briefcase, label: "Title", value: job.title },
                { icon: MapPin, label: "Location", value: job.location },
                {
                  icon: DollarSign,
                  label: "Budget",
                  value: `₱${(job.budget ?? 0).toLocaleString()}`,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="p-2.5 bg-blue-50/50 rounded-xl">
                    <item.icon className="h-4 w-4 text-[#00BAF1]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
              Assigned Workers
            </h3>
            <div className="space-y-3">
              {(assigned_employees?.length > 0
                ? assigned_employees
                : assigned_employee
                  ? [assigned_employee]
                  : []
              ).map((emp: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 transition-colors"
                >
                  <Avatar className="h-9 w-9 border-2 border-white ">
                    <AvatarFallback className="bg-blue-50 text-[#00BAF1] text-[10px] font-bold">
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {emp.name} {emp.isPrimaryContact && "★"}
                    </p>
                    {emp.rating && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-bold text-gray-500">
                          {emp.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Overlays */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 space-y-4 text-center">
              <p className="text-sm text-gray-500">Incoming voice call</p>
              <h3 className="text-lg font-semibold text-gray-900">
                {incomingCall?.callerName || "Unknown Caller"}
              </h3>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  onClick={rejectCall}
                >
                  <PhoneOff className="h-4 w-4 mr-1" /> Decline
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    const accepted = await acceptCall();
                    if (!accepted)
                      toast.error(callError || "Failed to accept call.");
                  }}
                >
                  <Phone className="h-4 w-4 mr-1" /> Answer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(callStatus === "connecting" ||
        callStatus === "connected" ||
        callStatus === "ringing") && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="shadow-xl border-green-200">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Badge className="bg-green-600 font-bold uppercase tracking-tighter text-[10px]">
                {callStatus === "connected"
                  ? `In call ${formatCallDuration(durationSeconds)}`
                  : callStatus === "ringing"
                    ? "Ringing..."
                    : "Connecting..."}
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted(toggleMute())}
                className="h-9 w-9"
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  endCall();
                  setIsMuted(false);
                }}
                className="h-9 w-9"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(null)}
        >
          <img
            src={showImageModal || undefined}
            alt="View"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setShowImageModal(null)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border-none">
            {reviewModalMode === "view" ? (
              <>
                <CardHeader className="pb-4 pt-8 text-left">
                  <h3 className="text-xl font-bold text-gray-900">
                    Review details
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Feedback from both sides for this job.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-10">
                  {reviewViewLoading && (
                    <div className="py-1 text-xs text-gray-500 flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Refreshing review details...
                    </div>
                  )}
                  <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-bold text-gray-900">
                      Your feedback to client
                    </p>
                    {myReview ? (
                      <>
                        <p className="text-xs text-gray-600">
                          Clarity: {myReview.rating_quality}/5 | Communication: {myReview.rating_communication}/5
                        </p>
                        <p className="text-xs text-gray-600">
                          Payment: {myReview.rating_punctuality}/5 | Professionalism: {myReview.rating_professionalism}/5
                        </p>
                        <p className="text-sm text-gray-800">{myReview.comment || "No comment"}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No submitted feedback found.</p>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-bold text-gray-900">
                      Client feedback to your team
                    </p>
                    {clientReview ? (
                      <>
                        <p className="text-xs text-gray-600">
                          Clarity: {clientReview.rating_quality}/5 | Communication: {clientReview.rating_communication}/5
                        </p>
                        <p className="text-xs text-gray-600">
                          Payment: {clientReview.rating_punctuality}/5 | Professionalism: {clientReview.rating_professionalism}/5
                        </p>
                        <p className="text-sm text-gray-800">{clientReview.comment || "No comment"}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Client feedback is not available yet.</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-12"
                      onClick={() => setShowReviewModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="pb-4 pt-8 text-left">
                  <h3 className="text-xl font-bold text-gray-900">Rate Client</h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Share your experience with {client.name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-5 px-8 pb-10">
                  {[
                    {
                      label: "Clarity of job details",
                      description: "How clear were the instructions and scope?",
                      value: ratingQuality,
                      setter: setRatingQuality,
                    },
                    {
                      label: "Communication",
                      description: "How responsive and clear was the client?",
                      value: ratingCommunication,
                      setter: setRatingCommunication,
                    },
                    {
                      label: "Payment reliability",
                      description: "Was payment handled on time and fairly?",
                      value: ratingPunctuality,
                      setter: setRatingPunctuality,
                    },
                    {
                      label: "Respect and professionalism",
                      description: "Was the interaction respectful and professional?",
                      value: ratingProfessionalism,
                      setter: setRatingProfessionalism,
                    },
                  ].map((criteria) => (
                    <div key={criteria.label} className="space-y-2">
                      <label className="block text-left text-[11px] font-semibold text-black tracking-tight">
                        {criteria.label}
                      </label>
                      <p className="text-xs text-gray-500 -mt-1">
                        {criteria.description}
                      </p>
                      <div className="flex justify-start gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => criteria.setter(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 transition-all ${star <= criteria.value ? "fill-[#FBC02D] text-[#FBC02D]" : "text-gray-200 hover:text-[#FBC02D]/50"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <label className="block text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.16em]">
                      Message
                    </label>
                    <p className="text-xs text-gray-500 -mt-1">
                      Add a short message about your overall experience.
                    </p>
                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-[#00BAF1] outline-none"
                      rows={3}
                      placeholder="Write your message"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl h-12"
                      onClick={() => setShowReviewModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-[#00BAF1] hover:bg-[#00BAF1]/90 rounded-2xl h-12"
                      onClick={handleSubmitReview}
                      disabled={
                        !ratingQuality ||
                        !ratingCommunication ||
                        !ratingPunctuality ||
                        !ratingProfessionalism ||
                        !reviewText.trim() ||
                        submitReviewMutation.isPending
                      }
                    >
                      {submitReviewMutation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" /> Submit
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border-none">
            <CardHeader className="pb-3 pt-7 text-left">
              <h3 className="text-xl font-bold text-gray-900">Job Receipt</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Payment summary and timeline
              </p>
            </CardHeader>
            <CardContent className="space-y-4 px-8 pb-8">
              {receiptLoading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading receipt...
                </div>
              ) : receiptError ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {receiptError}
                </div>
              ) : receiptData ? (
                <>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-sm font-semibold text-gray-900">{receiptData.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Receipt ID: {receiptData.receipt_id || `JOB-${receiptData.job_id}`}
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-sm font-bold text-gray-900">Payment Breakdown</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Budget</span>
                      <span className="font-semibold">₱{Number(receiptData.payment?.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Escrow</span>
                      <span className="font-semibold">₱{Number(receiptData.payment?.escrow_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Final Payment</span>
                      <span className="font-semibold">₱{Number(receiptData.payment?.final_payment || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="font-semibold">₱{Number(receiptData.payment?.platform_fee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                      <span className="text-gray-900 font-bold">Total Client Paid</span>
                      <span className="font-bold">₱{Number(receiptData.payment?.total_client_paid || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900 font-bold">Your Earnings</span>
                      <span className="font-bold text-[#00BAF1]">₱{Number(receiptData.payment?.worker_earnings || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-sm font-bold text-gray-900">Timeline</p>
                    <p className="text-xs text-gray-600">Created: {receiptData.created_at ? format(new Date(receiptData.created_at), "MMM d, yyyy h:mm a") : "N/A"}</p>
                    <p className="text-xs text-gray-600">Worker completed: {receiptData.worker_completed_at ? format(new Date(receiptData.worker_completed_at), "MMM d, yyyy h:mm a") : "N/A"}</p>
                    <p className="text-xs text-gray-600">Client approved: {receiptData.client_approved_at ? format(new Date(receiptData.client_approved_at), "MMM d, yyyy h:mm a") : "N/A"}</p>
                    <p className="text-xs text-gray-600">Completed: {receiptData.completed_at ? format(new Date(receiptData.completed_at), "MMM d, yyyy h:mm a") : "N/A"}</p>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                  Receipt data is not available.
                </div>
              )}

              <Button
                variant="outline"
                className="w-full rounded-2xl h-12"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showBackjobDetailsModal && conversation.backjob?.has_backjob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border-none">
            <CardHeader className="pb-3 pt-7 text-left">
              <h3 className="text-xl font-bold text-gray-900">Backjob Details</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Reason, status, and timeline of this backjob request
              </p>
            </CardHeader>
            <CardContent className="space-y-5 px-8 pb-8">
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold text-gray-900">Details</p>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Reason</p>
                  <p className="text-sm text-gray-800 mt-1">
                    {conversation.backjob.reason || "No reason provided"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Description</p>
                  <p className="text-sm text-gray-800 mt-1">
                    {conversation.backjob.description || "No description provided"}
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold text-gray-900">Status</p>

                {conversation.backjob.status === "OPEN" ? (
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-base font-bold text-amber-700">
                        Admin Review Pending
                      </span>
                    </div>
                    <p className="text-sm text-amber-700">
                      Waiting for admin to approve backjob request. You will be notified once work is approved.
                    </p>
                  </div>
                ) : conversation.backjob.status === "IN_NEGOTIATION" ? (
                  <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50 text-sm text-blue-800">
                    Schedule negotiation in progress.
                  </div>
                ) : conversation.backjob.status === "UNDER_REVIEW" ? (
                  <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50 text-sm text-blue-800">
                    Backjob is currently in execution.
                  </div>
                ) : conversation.backjob.status === "RESOLVED" ? (
                  <div className="p-4 rounded-2xl border border-green-200 bg-green-50 text-sm text-green-800">
                    Backjob has been resolved.
                  </div>
                ) : null}

                <div className="pt-2">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Timeline</p>

                  <div className="space-y-4">
                    {(conversation.backjob.status === "RESOLVED" ||
                      conversation.backjob.client_confirmed) && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-3.5 w-3.5 rounded-full bg-green-500" />
                          <div className="w-px flex-1 bg-gray-200 min-h-[22px]" />
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-semibold text-gray-900">Completed</p>
                          <p className="text-xs text-gray-500">
                            {formatBackjobDate(conversation.backjob.client_confirmed_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    {conversation.backjob.worker_marked_complete && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-3.5 w-3.5 rounded-full bg-green-500" />
                          <div className="w-px flex-1 bg-gray-200 min-h-[22px]" />
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-semibold text-gray-900">Worker Marked Complete</p>
                          <p className="text-xs text-gray-500">Waiting for client confirmation</p>
                        </div>
                      </div>
                    )}

                    {conversation.backjob.backjob_started && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-3.5 w-3.5 rounded-full bg-blue-500" />
                          <div className="w-px flex-1 bg-gray-200 min-h-[22px]" />
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-semibold text-gray-900">Backjob Work Started</p>
                          <p className="text-xs text-gray-500">
                            {formatBackjobDate(conversation.backjob.backjob_started_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    {conversation.backjob.scheduled_date && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-3.5 w-3.5 rounded-full ${conversation.backjob.worker_schedule_confirmed ? "bg-green-500" : "bg-amber-500"}`}
                          />
                          <div className="w-px flex-1 bg-gray-200 min-h-[22px]" />
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {conversation.backjob.worker_schedule_confirmed
                              ? "Worker Confirmed Schedule"
                              : "Pending Negotiation"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatBackjobDate(conversation.backjob.scheduled_date, false)}
                          </p>
                          {conversation.backjob.worker_schedule_confirmed &&
                            conversation.backjob.worker_schedule_confirmed_at && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Confirmed on {formatBackjobDate(conversation.backjob.worker_schedule_confirmed_at)}
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-3.5 w-3.5 rounded-full bg-gray-500" />
                        <div className="w-px flex-1 bg-gray-200 min-h-[22px]" />
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {conversation.backjob.status === "OPEN"
                            ? "Admin Review Pending"
                            : "Admin Reviewed"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conversation.backjob.status === "OPEN"
                            ? "Waiting for admin approval"
                            : "Backjob request approved"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-3.5 w-3.5 rounded-full bg-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Requested</p>
                        <p className="text-xs text-gray-500">
                          {formatBackjobDate(conversation.backjob.opened_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-2xl h-12"
                onClick={() => setShowBackjobDetailsModal(false)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showBackjobCompleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm rounded-3xl shadow-2xl border-none">
            <CardHeader className="pt-8 text-center">
              <div className="mx-auto w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold">Backjob Completed</h3>
              <p className="text-sm text-gray-500 font-medium">
                Verify that all requested corrections are done.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 px-8 pb-10">
              <textarea
                className="w-full border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                rows={3}
                placeholder="Notes about the fix..."
                value={backjobNotes}
                onChange={(e) => setBackjobNotes(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl h-12"
                  onClick={() => setShowBackjobCompleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-2xl h-12"
                  onClick={handleMarkBackjobComplete}
                  disabled={markBackjobCompleteMutation.isPending}
                >
                  {markBackjobCompleteMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Mark Complete"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


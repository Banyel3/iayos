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
  useUploadCompletionPhoto,
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
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionPhotos, setCompletionPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratingQuality, setRatingQuality] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingPunctuality, setRatingPunctuality] = useState(0);
  const [ratingProfessionalism, setRatingProfessionalism] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Backjob action state
  const [showBackjobConfirmModal, setShowBackjobConfirmModal] = useState(false);
  const [showBackjobCompleteModal, setShowBackjobCompleteModal] =
    useState(false);
  const [showBackjobApproveModal, setShowBackjobApproveModal] = useState(false);
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
  const uploadPhotoMutation = useUploadCompletionPhoto();

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

  // Handle photo file selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 10 - completionPhotos.length;
    const newFiles = files.slice(0, remainingSlots);

    // Validate file types and sizes
    const validFiles = newFiles.filter((file) => {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length > 0) {
      setCompletionPhotos((prev) => [...prev, ...validFiles]);
      // Create preview URLs
      validFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        setPhotoPreviewUrls((prev) => [...prev, url]);
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove a photo from the list
  const handleRemovePhoto = (index: number) => {
    setCompletionPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => {
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle mark job as complete with photo upload
  const handleMarkComplete = async () => {
    if (!conversation?.job.id) return;

    const jobId = conversation.job.id;

    try {
      setIsUploadingPhotos(true);
      setUploadProgress(0);

      // First, upload all photos sequentially
      if (completionPhotos.length > 0) {
        for (let i = 0; i < completionPhotos.length; i++) {
          await uploadPhotoMutation.mutateAsync({
            jobId,
            file: completionPhotos[i],
          });
          setUploadProgress(((i + 1) / completionPhotos.length) * 100);
        }
      }

      // Then mark the job as complete
      await markCompleteMutation.mutateAsync({
        jobId,
        completionNotes,
      });

      // Success - reset state
      setShowMarkCompleteModal(false);
      setCompletionNotes("");
      setCompletionPhotos([]);
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPhotoPreviewUrls([]);
      setUploadProgress(0);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark job as complete",
      );
    } finally {
      setIsUploadingPhotos(false);
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

    submitReviewMutation.mutate(
      {
        jobId: conversation.job.id,
        rating_quality: ratingQuality,
        rating_communication: ratingCommunication,
        rating_punctuality: ratingPunctuality,
        rating_professionalism: ratingProfessionalism,
        reviewText,
      },
      {
        onSuccess: () => {
          setShowReviewModal(false);
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

  const isAgencyBackjob =
    conversation.backjob?.has_backjob && conversation.my_role === "AGENCY";
  const isBackjobExecutionPhase =
    !!conversation.backjob?.backjob_started ||
    conversation.backjob?.status === "UNDER_REVIEW" ||
    conversation.backjob?.status === "RESOLVED";

  // Legacy compatibility: old jobs may keep completed job flags set even when
  // an active backjob cycle is still running. Keep conversation open until the
  // active backjob is actually finalized.
  const hasActiveBackjobCycle =
    !!conversation.backjob?.has_backjob &&
    !conversation.backjob?.client_confirmed_complete &&
    conversation.backjob?.status !== "RESOLVED";

  const isConversationClosed =
    (conversation.status === "COMPLETED" && !hasActiveBackjobCycle) ||
    (job.clientMarkedComplete &&
      job.workerReviewed &&
      job.clientReviewed &&
      !hasActiveBackjobCycle);

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
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">
                    Active Backjob Request
                  </span>
                </div>
                <p className="text-xs text-amber-700 mb-2">
                  {conversation.backjob.reason || "Backjob work required"}
                </p>
                {conversation.backjob.status === "IN_NEGOTIATION" &&
                  conversation.my_role === "AGENCY" && (
                    <div className="mt-2">
                      {conversation.backjob.scheduled_date &&
                      !conversation.backjob.worker_schedule_confirmed ? (
                        <Button
                          size="sm"
                          className="w-full bg-[#00BAF1] hover:bg-[#00BAF1]/90"
                          onClick={handleConfirmBackjobScheduledDate}
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
                        !conversation.backjob.worker_marked_complete ? (
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => setShowBackjobCompleteModal(true)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Mark
                          Complete
                        </Button>
                      ) : null}
                  </div>
                )}
              </div>
            )}

            {isBackjobReviewLocked && (
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800">
                    Chat Locked During Admin Review
                  </span>
                </div>
                <p className="text-xs text-orange-700">{chatDisabledReason}</p>
              </div>
            )}

            {job.status === "IN_PROGRESS" &&
              job.payment_model === "PROJECT" &&
              assigned_employees?.length > 0 &&
              (() => {
                const allDispatched = assigned_employees.every(
                  (e: AssignedEmployee) => e.dispatched,
                );
                const allArrived = assigned_employees.every(
                  (e: AssignedEmployee) => e.clientConfirmedArrival,
                );
                const allComplete = assigned_employees.every(
                  (e: AssignedEmployee) => e.agencyMarkedComplete,
                );
                const dispatchedCount = assigned_employees.filter(
                  (e: AssignedEmployee) => e.dispatched,
                ).length;
                const arrivedCount = assigned_employees.filter(
                  (e: AssignedEmployee) => e.clientConfirmedArrival,
                ).length;
                const totalCount = assigned_employees.length;

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
                              !e.dispatched && (
                                <div
                                  key={e.employeeId}
                                  className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100"
                                >
                                  <span>{e.name}</span>
                                  <Button
                                    size="sm"
                                    className="h-6 px-3 bg-[#00BAF1] text-[10px]"
                                    onClick={() =>
                                      dispatchProjectMutation.mutate({
                                        jobId: job.id,
                                        employeeId: e.employeeId,
                                        conversationId,
                                      })
                                    }
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
                if (!allArrived) {
                  return (
                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-xs text-yellow-800 font-medium">
                      Waiting for client to confirm arrivals ({arrivedCount}/
                      {totalCount})
                    </div>
                  );
                }
                if (!allComplete) {
                  return (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">
                        Ready to complete
                      </span>
                      <Button
                        size="sm"
                        className="bg-green-600 px-3 h-7 text-[10px]"
                        onClick={() => setShowMarkCompleteModal(true)}
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
                    <div className="flex justify-center my-4 text-[11px] text-gray-400 font-medium uppercase tracking-wider text-center">
                      {message.message_text} — {format(currentDate, "h:mm a")}
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

      {showMarkCompleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl overflow-hidden rounded-3xl">
            <CardHeader className="pb-2 pt-6">
              <h3 className="text-lg font-bold">Complete Job</h3>
              <p className="text-sm text-gray-500 font-medium">
                Verify completion for "{job.title}"
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pb-8">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Notes
                </label>
                <textarea
                  className="w-full border-gray-100 border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#00BAF1] outline-none bg-gray-50/30 transition-all"
                  rows={3}
                  placeholder="What was accomplished?"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Proof of Work (Max 10)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <div className="grid grid-cols-4 gap-2">
                  {photoPreviewUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100"
                    >
                      <img
                        src={url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemovePhoto(i)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {completionPhotos.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-[#00BAF1] hover:bg-blue-50/50 transition-all text-gray-400 hover:text-[#00BAF1]"
                    >
                      <Camera className="h-5 w-5 mb-1" />
                      <span className="text-[10px] font-bold">Add</span>
                    </button>
                  )}
                </div>
              </div>

              {isUploadingPhotos && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#00BAF1] h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-center font-bold text-[#00BAF1] uppercase tracking-tighter">
                    Uploading {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl h-12 font-bold"
                  onClick={() => {
                    setShowMarkCompleteModal(false);
                    setCompletionPhotos([]);
                    setPhotoPreviewUrls([]);
                  }}
                  disabled={isUploadingPhotos}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#00BAF1] hover:bg-[#00BAF1]/90 rounded-2xl h-12 font-bold"
                  onClick={handleMarkComplete}
                  disabled={markCompleteMutation.isPending || isUploadingPhotos}
                >
                  {isUploadingPhotos || markCompleteMutation.isPending ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Confirm Complete"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border-none">
            <CardHeader className="pb-4 pt-8 text-center">
              <h3 className="text-xl font-bold text-gray-900">Rate Client</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Share your experience with {client.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 px-10 pb-10">
              {[
                {
                  label: "📋 Clarity",
                  value: ratingQuality,
                  setter: setRatingQuality,
                },
                {
                  label: "💬 Communication",
                  value: ratingCommunication,
                  setter: setRatingCommunication,
                },
                {
                  label: "💳 Payment",
                  value: ratingPunctuality,
                  setter: setRatingPunctuality,
                },
                {
                  label: "👔 Professionalism",
                  value: ratingProfessionalism,
                  setter: setRatingProfessionalism,
                },
              ].map((criteria) => (
                <div key={criteria.label} className="space-y-2">
                  <label className="block text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    {criteria.label}
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => criteria.setter(star)}
                        className="focus:outline-none scale-110"
                      >
                        <Star
                          className={`h-6 w-6 transition-all ${star <= criteria.value ? "fill-[#00BAF1] text-[#00BAF1]" : "text-gray-200 hover:text-[#00BAF1]/40"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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


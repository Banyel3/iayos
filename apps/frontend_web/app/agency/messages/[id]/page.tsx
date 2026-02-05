"use client";

// Agency Chat Screen
// 1-on-1 messaging with real-time updates, image uploads, and typing indicators
// Uses agency-specific hooks for conversations

import React, { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { useRouter, useParams } from "next/navigation";
import {
  useAgencyMessages,
  useAgencySendMessage,
  useAgencyMarkComplete,
  useAgencySubmitReview,
  useUploadCompletionPhoto,
} from "@/lib/hooks/useAgencyConversations";
import {
  useAgencyDailyAttendance,
  useMarkEmployeeArrival,
  useMarkEmployeeCheckout,
} from "@/lib/hooks/useAgencyDailyAttendance";
import {
  useConfirmBackjobStarted,
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
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import type { AgencyMessage } from "@/lib/hooks/useAgencyConversations";

export default function AgencyChatScreen() {
  const router = useRouter();
  const params = useParams();
  const conversationId = parseInt(params.id as string);

  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());

  // Fetch conversation and messages using agency hooks
  const {
    data: conversation,
    isLoading,
    refetch,
  } = useAgencyMessages(conversationId);

  // Send message mutation using agency hook
  const sendMutation = useAgencySendMessage();

  // Job action mutations
  const markCompleteMutation = useAgencyMarkComplete();
  const submitReviewMutation = useAgencySubmitReview();
  const uploadPhotoMutation = useUploadCompletionPhoto();

  // Backjob action mutations
  const confirmBackjobStartedMutation = useConfirmBackjobStarted();
  const markBackjobCompleteMutation = useMarkBackjobComplete();
  const approveBackjobCompletionMutation = useApproveBackjobCompletion();

  // Daily attendance queries and mutations
  const { data: attendanceData } = useAgencyDailyAttendance(
    conversation?.job?.id || 0
  );
  const markArrivalMutation = useMarkEmployeeArrival();
  const markCheckoutMutation = useMarkEmployeeCheckout();

  // WebSocket connection state
  const { isConnected } = useWebSocketConnection();

  // WebSocket: Listen for new messages
  useMessageListener(conversationId);

  // WebSocket: Typing indicator
  const { isTyping, sendTyping } = useTypingIndicator(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversation?.messages.length) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [conversation?.messages.length]);

  // Handle send message
  const handleSendMessage = (text: string) => {
    sendMutation.mutate({
      conversationId,
      text,
      type: "TEXT",
    });
  };

  // Handle image upload
  const handleImageSelect = async (file: File) => {
    if (isUploading) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Allowed: JPEG, PNG, JPG, WEBP");
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
      console.log("Image uploaded:", result);

      // Refetch conversation to show the new image
      refetch();

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Image upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image");
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
      alert(
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
        onError: (error) => {
          alert(error.message || "Failed to submit review");
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
        alert(error.message || "Failed to confirm backjob started");
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
          alert(error.message || "Failed to mark backjob complete");
        },
      },
    );
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
          alert(error.message || "Failed to approve backjob completion");
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Card className="rounded-none border-b">
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

            {/* Right: Status badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isConnected ? (
                <Badge variant="default" className="bg-green-500">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Job info banner with assigned employee */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">{job.location}</span>
              </div>
              <Badge
                variant="outline"
                className="text-blue-700 border-blue-300"
              >
                ₱{job.budget.toLocaleString()}
              </Badge>
            </div>
            {/* Multi-employee display */}
            {assigned_employees && assigned_employees.length > 0 ? (
              <div className="flex flex-col gap-1 text-sm text-gray-600 pt-2 border-t border-blue-200">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    Assigned Workers ({assigned_employees.length}):
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 ml-6">
                  {assigned_employees.map((emp) => (
                    <Badge
                      key={emp.employeeId}
                      variant={emp.isPrimaryContact ? "default" : "secondary"}
                      className={`text-xs ${emp.isPrimaryContact ? "bg-blue-600" : ""}`}
                    >
                      {emp.name}
                      {emp.isPrimaryContact && " ⭐"}
                      {emp.rating && ` (${emp.rating.toFixed(1)})`}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              assigned_employee && (
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-blue-200">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>Assigned: {assigned_employee.name}</span>
                  {assigned_employee.employeeOfTheMonth && (
                    <Badge
                      variant="default"
                      className="text-xs bg-amber-500 hover:bg-amber-600"
                    >
                      🏆 EOTM
                    </Badge>
                  )}
                  {assigned_employee.rating && (
                    <Badge variant="secondary" className="text-xs">
                      ⭐ {assigned_employee.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
              )
            )}
          </div>

          {/* Backjob Workflow Section - Only show if there's an active backjob */}
          {conversation.backjob?.has_backjob && (
            <div className="mt-3">
              {/* Backjob Banner */}
              <div className="p-3 bg-amber-50 rounded-lg border-2 border-amber-300 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">
                    🔄 Active Backjob Request
                  </span>
                </div>
                <p className="text-xs text-amber-700 mb-1">
                  {conversation.backjob.reason || "Backjob work required"}
                </p>
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-100 text-amber-800 border-amber-300"
                >
                  Status:{" "}
                  {conversation.backjob.status === "UNDER_REVIEW"
                    ? "Action Required"
                    : "Pending Review"}
                </Badge>
              </div>

              {/* Backjob Workflow Actions - Only for UNDER_REVIEW status */}
              {conversation.backjob.status === "UNDER_REVIEW" && (
                <>
                  {/* AGENCY/WORKER: Waiting for Client Confirmation */}
                  {conversation.my_role === "AGENCY" &&
                    !conversation.backjob.backjob_started && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 font-medium">
                            Waiting for client to confirm backjob started...
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          The client needs to confirm that your employee has
                          arrived and started the backjob work
                        </p>
                      </div>
                    )}

                  {/* AGENCY/WORKER: Mark Backjob Complete Button */}
                  {conversation.my_role === "AGENCY" &&
                    conversation.backjob.backjob_started &&
                    !conversation.backjob.worker_marked_complete && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800 font-medium">
                              Client confirmed backjob started
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setShowBackjobCompleteModal(true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </Button>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Once the backjob work is finished, mark it as complete
                        </p>
                      </div>
                    )}

                  {/* AGENCY/WORKER: Waiting for Client Approval */}
                  {conversation.my_role === "AGENCY" &&
                    conversation.backjob.worker_marked_complete &&
                    !conversation.backjob.client_confirmed && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                          <span className="text-sm text-amber-800 font-medium">
                            ⏳ Waiting for client to approve backjob completion
                          </span>
                        </div>
                        <p className="text-xs text-amber-600 mt-1">
                          You've marked the backjob as complete. The client will
                          review and approve the work.
                        </p>
                      </div>
                    )}

                  {/* Backjob Completed */}
                  {conversation.backjob.client_confirmed && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800 font-medium">
                          ✅ Backjob Completed Successfully!
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        The backjob work has been approved by the client. The
                        dispute is now resolved.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Job Status & Actions Section */}
          <div className="mt-3">
            {/* Status: Waiting for client to confirm work started (PROJECT jobs) */}
            {job.payment_model === 'PROJECT' &&
              job.status === "IN_PROGRESS" &&
              !job.clientConfirmedWorkStarted && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800 font-medium">
                      Waiting for client to confirm work has started
                    </span>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    The client needs to confirm that your employee has arrived
                    and started working
                  </p>
                </div>
              )}

            {/* Status: Daily attendance tracking active (DAILY jobs) */}
            {job.payment_model === 'DAILY' &&
              job.status === "IN_PROGRESS" && (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800 font-medium">
                        Daily attendance tracking active
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Mark which employees are working today. Client will verify attendance.
                    </p>
                  </div>

                  {/* Daily Attendance Section */}
                  <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        📋 Daily Attendance - {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {attendanceData?.records.length || 0} employees
                      </Badge>
                    </div>

                    {/* Employee List with Checkboxes */}
                    <div className="space-y-2">
                      {assigned_employees && assigned_employees.length > 0 ? (
                        assigned_employees.map((emp: any) => {
                          const attendance = attendanceData?.records.find(
                            (r: any) => r.employee_id === emp.employeeID
                          );
                          const hasArrived = !!attendance?.time_in;
                          const hasCheckedOut = !!attendance?.time_out;
                          const isClientConfirmed = !!attendance?.client_confirmed;

                          return (
                            <div
                              key={emp.employeeID}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                            >
                              {/* Left: Employee info and checkbox */}
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-900">
                                      {emp.name}
                                    </span>
                                    {emp.isPrimaryContact && (
                                      <Badge variant="default" className="text-xs bg-blue-600">
                                        ⭐ Primary
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {hasArrived && attendance.time_in && (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        Arrived: {new Date(attendance.time_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                    {hasCheckedOut && attendance.time_out && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-gray-600" />
                                        Left: {new Date(attendance.time_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Action buttons and status */}
                              <div className="flex items-center gap-2">
                                {!hasArrived ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs border-green-500 text-green-700 hover:bg-green-50"
                                    onClick={() => {
                                      markArrivalMutation.mutate({
                                        jobId: job.id,
                                        employeeId: emp.employeeID,
                                      });
                                    }}
                                    disabled={markArrivalMutation.isPending}
                                  >
                                    {markArrivalMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    )}
                                    Mark Arrived
                                  </Button>
                                ) : !hasCheckedOut ? (
                                  <>
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      ✓ Working
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs border-blue-500 text-blue-700 hover:bg-blue-50"
                                      onClick={() => {
                                        markCheckoutMutation.mutate({
                                          jobId: job.id,
                                          employeeId: emp.employeeID,
                                        });
                                      }}
                                      disabled={markCheckoutMutation.isPending}
                                    >
                                      {markCheckoutMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Clock className="h-3 w-3 mr-1" />
                                      )}
                                      Mark Checkout
                                    </Button>
                                  </>
                                ) : isClientConfirmed ? (
                                  <Badge variant="default" className="text-xs bg-blue-600">
                                    ✓ Client Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                                    ⏳ Awaiting Client
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No employees assigned to this job
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Status: Ready to mark complete */}
            {job.status === "IN_PROGRESS" &&
              job.clientConfirmedWorkStarted &&
              !job.workerMarkedComplete && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800 font-medium">
                        Client confirmed work has started
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setShowMarkCompleteModal(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Once the job is finished, mark it as complete for the client
                    to approve
                  </p>
                </div>
              )}

            {/* Status: Waiting for client approval */}
            {job.workerMarkedComplete && !job.clientMarkedComplete && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                  <span className="text-sm text-amber-800 font-medium">
                    ⏳ Waiting for client to approve completion
                  </span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  You've marked the job as complete. The client will review and
                  approve the work.
                </p>
              </div>
            )}

            {/* Status: Completed - Show review section */}
            {job.clientMarkedComplete && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">
                    ✅ Job Completed Successfully!
                  </span>
                </div>

                {/* Both parties reviewed - fully closed */}
                {job.workerReviewed && job.clientReviewed ? (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-green-200">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-700">
                      Both parties have submitted reviews. This job is complete.
                    </span>
                  </div>
                ) : !job.workerReviewed ? (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200">
                    <span className="text-sm text-gray-600">
                      Leave a review for the client
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-700 hover:bg-green-100"
                      onClick={() => setShowReviewModal(true)}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Leave Review
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-green-200">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-700">
                      You've submitted your review
                    </span>
                    {!job.clientReviewed && (
                      <span className="text-xs text-gray-500 ml-2">
                        • Waiting for client's review
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message: AgencyMessage, index: number) => {
          const currentDate = new Date(message.created_at);
          const previousDate =
            index > 0 ? new Date(messages[index - 1].created_at) : undefined;

          return (
            <div key={`${message.message_id}-${index}`}>
              {renderDateSeparator(currentDate, previousDate)}
              {/* System messages - centered with distinct styling */}
              {message.message_type === "SYSTEM" ? (
                <div className="flex justify-center my-3">
                  <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full max-w-[80%] text-center">
                    {message.message_text}
                    <span className="text-xs text-gray-400 ml-2">
                      {format(new Date(message.created_at), "h:mm a")}
                    </span>
                  </div>
                </div>
              ) : (
                /* Inline message bubble for agency chat */
                <div
                  className={`flex mb-3 ${
                    message.is_mine ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.is_mine && (
                    <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                      <AvatarImage src={message.sender_avatar || ""} />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                        {getInitials(message.sender_name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.is_mine
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    {!message.is_mine && (
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {message.sender_name}
                        {message.sent_by_agency && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs py-0"
                          >
                            <Building2 className="h-3 w-3 mr-1" />
                            Agency
                          </Badge>
                        )}
                      </p>
                    )}
                    {message.message_type === "IMAGE" &&
                    message.message_text ? (
                      <img
                        src={message.message_text}
                        alt="Image"
                        className="max-w-full rounded-lg cursor-pointer"
                        onClick={() => setShowImageModal(message.message_text)}
                      />
                    ) : message.message_type === "IMAGE" ? (
                      <div className="text-sm text-gray-500 italic">
                        [Image not available]
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {message.message_text}
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        message.is_mine ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {format(new Date(message.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
            <span>{client.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input or Conversation Closed banner */}
      {job.clientMarkedComplete && job.workerReviewed && job.clientReviewed ? (
        <div className="p-4 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">
              This conversation has been closed. Both parties have submitted
              reviews.
            </span>
          </div>
        </div>
      ) : (
        <MessageInput
          onSend={handleSendMessage}
          onTyping={sendTyping}
          onImageSelect={handleImageSelect}
          disabled={!isConnected || sendMutation.isPending}
          isUploading={isUploading}
          placeholder={
            isConnected ? "Type a message..." : "Reconnecting... Please wait"
          }
        />
      )}

      {/* Image modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(null)}
        >
          <img
            src={showImageModal}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white"
            onClick={() => setShowImageModal(null)}
          >
            ✕
          </Button>
        </div>
      )}

      {/* Mark Complete Modal */}
      {showMarkCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold">Mark Job as Complete</h3>
              <p className="text-sm text-gray-500">
                Confirm that the work has been completed for "{job.title}"
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Notes (optional)
                </label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any notes about the completed work..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </div>

              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Photos (optional, up to 10)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                  disabled={completionPhotos.length >= 10}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={completionPhotos.length >= 10}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                  <span className="text-sm text-gray-600">
                    {completionPhotos.length >= 10
                      ? "Maximum 10 photos reached"
                      : `Click to add photos (${completionPhotos.length}/10)`}
                  </span>
                </button>

                {/* Photo Preview Grid */}
                {photoPreviewUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Completion photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isUploadingPhotos && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Uploading photos... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowMarkCompleteModal(false);
                    setCompletionNotes("");
                    setCompletionPhotos([]);
                    photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
                    setPhotoPreviewUrls([]);
                  }}
                  disabled={isUploadingPhotos}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleMarkComplete}
                  disabled={markCompleteMutation.isPending || isUploadingPhotos}
                >
                  {isUploadingPhotos ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-pulse" />
                      Uploading...
                    </>
                  ) : markCompleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Complete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold">Leave a Review</h3>
              <p className="text-sm text-gray-500">
                Rate your experience with {client.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Multi-criteria Star Ratings - Client-appropriate labels */}
              {[
                {
                  label: "📋 Clarity of Requirements",
                  value: ratingQuality,
                  setter: setRatingQuality,
                },
                {
                  label: "💬 Communication",
                  value: ratingCommunication,
                  setter: setRatingCommunication,
                },
                {
                  label: "💳 Payment Promptness",
                  value: ratingPunctuality,
                  setter: setRatingPunctuality,
                },
                {
                  label: "👔 Professionalism",
                  value: ratingProfessionalism,
                  setter: setRatingProfessionalism,
                },
              ].map((criteria) => (
                <div key={criteria.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {criteria.label}
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => criteria.setter(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= criteria.value
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Review (Optional)
                </label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Share your experience working with this client..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowReviewModal(false);
                    setRatingQuality(0);
                    setRatingCommunication(0);
                    setRatingPunctuality(0);
                    setRatingProfessionalism(0);
                    setReviewText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitReview}
                  disabled={
                    ratingQuality === 0 ||
                    ratingCommunication === 0 ||
                    ratingPunctuality === 0 ||
                    ratingProfessionalism === 0 ||
                    submitReviewMutation.isPending
                  }
                >
                  {submitReviewMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mark Backjob Complete Modal */}
      {showBackjobCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold">
                Mark Backjob as Complete
              </h3>
              <p className="text-sm text-gray-500">
                Confirm that the backjob work has been completed
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Notes (optional)
                </label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any notes about the completed backjob work..."
                  value={backjobNotes}
                  onChange={(e) => setBackjobNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowBackjobCompleteModal(false);
                    setBackjobNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleMarkBackjobComplete}
                  disabled={markBackjobCompleteMutation.isPending}
                >
                  {markBackjobCompleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </>
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

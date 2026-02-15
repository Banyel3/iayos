// Chat Screen
// 1-on-1 messaging with real-time updates, image uploads, and offline support

import React, { useEffect, useRef, useState, useCallback } from "react";
import { getErrorMessage } from "../../lib/utils/parse-api-error";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
} from "../../lib/hooks/useMessages";
import {
  useMessageListener,
  useTypingIndicator,
  useWebSocketConnection,
} from "../../lib/hooks/useWebSocket";
import { useImageUpload } from "../../lib/hooks/useImageUpload";
import {
  useConfirmWorkStarted,
  useMarkComplete,
  useApproveCompletion,
  useConfirmTeamWorkerArrival,
  useMarkTeamAssignmentComplete,
  useApproveTeamJobCompletion,
  useDispatchProjectEmployee,
  useConfirmProjectArrival,
  useAgencyMarkProjectComplete,
  useApproveAgencyProjectJob,
} from "../../lib/hooks/useJobActions";
import { useAuth } from "../../context/AuthContext";
import {
  useConfirmBackjobStarted,
  useMarkBackjobComplete,
  useApproveBackjobCompletion,
} from "../../lib/hooks/useBackjobActions";
import { useSubmitReview } from "../../lib/hooks/useReviews";
import { useAgoraCall } from "../../lib/hooks/useAgoraCall";
import {
  useWorkerCheckIn,
  useWorkerCheckOut,
  useClientConfirmAttendance,
  useClientVerifyArrival,
  useClientMarkCheckout,
} from "../../lib/hooks/useDailyPayment";
import MessageBubble from "../../components/MessageBubble";
import MessageInput from "../../components/MessageInput";
import { ImageMessage } from "../../components/ImageMessage";
import { TypingIndicator } from "../../components/TypingIndicator";
import { EstimatedTimeCard } from "../../components";
import JobReceiptModal from "../../components/JobReceiptModal";
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
import * as ImagePicker from "expo-image-picker";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const conversationId = parseInt(params.conversationId as string);
  const routerHook = useRouter(); // For safe back navigation

  const flatListRef = useRef<FlatList>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashUploadModal, setShowCashUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

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
  // For multi-employee agency jobs: track current employee index
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);
  // For team jobs: track current worker being reviewed
  const [currentTeamWorkerIndex, setCurrentTeamWorkerIndex] = useState(0);

  // Fetch conversation and messages
  const {
    data: conversation,
    isLoading,
    refetch,
  } = useMessages(conversationId);

  // For agency jobs: Auto-set review step based on what's already reviewed
  useEffect(() => {
    if (conversation?.is_agency_job && conversation.job) {
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
    conversation?.job?.employeeReviewed,
    conversation?.job?.agencyReviewed,
    conversation?.pending_employee_reviews,
    conversation?.all_employees_reviewed,
  ]);

  // Check if conversation is closed (both parties reviewed)
  // BUT if there's an APPROVED backjob (UNDER_REVIEW status), conversation should stay open
  // OPEN status means waiting for admin approval - conversation should remain closed
  const hasApprovedBackjob =
    conversation?.backjob?.has_backjob === true &&
    conversation?.backjob?.status === "UNDER_REVIEW";
  // For team jobs: clientReviewed becomes true after reviewing just 1 worker,
  // so we must use all_team_workers_reviewed to prevent premature conversation closure
  const clientHasFullyReviewed = conversation?.is_team_job
    ? !!conversation?.all_team_workers_reviewed
    : !!conversation?.job?.clientReviewed;
  const isConversationClosed =
    (conversation?.job?.clientMarkedComplete &&
      clientHasFullyReviewed &&
      conversation?.job?.workerReviewed &&
      !hasApprovedBackjob) || // Don't close if there's an APPROVED backjob
    // Fallback for DAILY jobs: clientMarkedComplete is never set, use job status instead
    (conversation?.job?.status === "COMPLETED" &&
      clientHasFullyReviewed &&
      conversation?.job?.workerReviewed &&
      !hasApprovedBackjob);

  // Force review: user must review before leaving conversation after payment/completion
  const needsReview = !!(
    conversation?.job &&
    (conversation.job.clientMarkedComplete ||
      conversation.job.status === "COMPLETED") &&
    !isConversationClosed &&
    !hasApprovedBackjob &&
    ((conversation.my_role === "CLIENT" &&
      (conversation.is_team_job
        ? !conversation.all_team_workers_reviewed
        : !conversation.job.clientReviewed)) ||
      (conversation.my_role === "WORKER" && !conversation.job.workerReviewed))
  );

  // Block hardware back button when review is needed - REMOVED to allow users to exit freely

  // Send message mutation
  const sendMutation = useSendMessageMutation();

  // Job action mutations
  const confirmWorkStartedMutation = useConfirmWorkStarted();
  const markCompleteMutation = useMarkComplete();
  const approveCompletionMutation = useApproveCompletion();
  const submitReviewMutation = useSubmitReview();
  const confirmTeamWorkerArrivalMutation = useConfirmTeamWorkerArrival();
  const markTeamAssignmentCompleteMutation = useMarkTeamAssignmentComplete();
  const approveTeamJobCompletionMutation = useApproveTeamJobCompletion();

  // Agency PROJECT job mutations
  const dispatchProjectEmployeeMutation = useDispatchProjectEmployee();
  const confirmProjectArrivalMutation = useConfirmProjectArrival();
  const agencyMarkProjectCompleteMutation = useAgencyMarkProjectComplete();
  const approveAgencyProjectJobMutation = useApproveAgencyProjectJob();

  // Daily attendance mutations
  const workerCheckInMutation = useWorkerCheckIn();
  const workerCheckOutMutation = useWorkerCheckOut();
  const clientConfirmAttendanceMutation = useClientConfirmAttendance();
  const clientVerifyArrivalMutation = useClientVerifyArrival();
  const clientMarkCheckoutMutation = useClientMarkCheckout();

  // Get current user for team job assignment identification
  const { user } = useAuth();

  // Voice calling
  const { initiateCall, callStatus } = useAgoraCall();

  // Backjob action mutations
  const confirmBackjobStartedMutation = useConfirmBackjobStarted();
  const markBackjobCompleteMutation = useMarkBackjobComplete();
  const approveBackjobCompletionMutation = useApproveBackjobCompletion();

  // WebSocket connection state
  const { isConnected } = useWebSocketConnection();

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

  // Handle confirm work started (CLIENT only)
  const handleConfirmWorkStarted = () => {
    if (!conversation) return;

    // For agency jobs, show employee name if assigned, otherwise agency name
    const workerName =
      conversation.assigned_employee?.name ||
      conversation.other_participant?.name ||
      "the worker";

    Alert.alert(
      "Confirm Work Started",
      `Are you sure ${workerName} has arrived and started working?`,
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

  // Handle confirm team worker arrival (CLIENT only, for team jobs)
  const handleConfirmTeamWorkerArrival = (
    assignmentId: number,
    workerName: string,
  ) => {
    if (!conversation) return;

    Alert.alert(
      "Confirm Worker Arrival",
      `Has ${workerName} arrived at the job site?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Arrival",
          onPress: () => {
            confirmTeamWorkerArrivalMutation.mutate({
              jobId: conversation.job.id,
              assignmentId,
            });
          },
        },
      ],
    );
  };

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
  const handleApproveTeamJobCompletion = () => {
    if (!conversation) return;

    // Calculate remaining amount (50% of total budget)
    const remainingAmount = conversation.job.budget
      ? (conversation.job.budget * 0.5).toFixed(2)
      : "0.00";

    Alert.alert(
      "Approve Team Job & Pay",
      `All workers have completed their assignments.\n\nYou will need to pay the remaining 50% of the job budget:\n\n₱${remainingAmount}\n\nPlease select your payment method.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => setShowPaymentModal(true),
        },
      ],
    );
  };

  // Handle mark complete (WORKER only)
  const handleMarkComplete = () => {
    if (!conversation) return;

    // Check if work started was confirmed
    if (!conversation.job.clientConfirmedWorkStarted) {
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

    // Calculate remaining amount (50% of total budget)
    const remainingAmount = conversation.job.budget
      ? (conversation.job.budget * 0.5).toFixed(2)
      : "0.00";

    Alert.alert(
      "Approve Completion & Pay",
      `You will need to pay the remaining 50% of the job budget:\n\n₱${remainingAmount}\n\nPlease select your payment method.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => setShowPaymentModal(true),
        },
      ],
    );
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: "WALLET" | "CASH") => {
    if (!conversation) return;

    setShowPaymentModal(false);

    if (method === "CASH") {
      // Show cash amount confirmation before opening upload modal
      const remainingAmount = conversation.job.budget
        ? (conversation.job.budget * 0.5).toFixed(2)
        : "0.00";

      const workerText = conversation.is_team_job
        ? "the workers"
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
    } else if (conversation.is_team_job) {
      // Team job approval
      approveTeamJobCompletionMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: method,
      });
    } else if (conversation.is_agency_job) {
      // Agency PROJECT job approval
      approveAgencyProjectJobMutation.mutate({
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

    if (conversation.is_team_job) {
      // Team job cash proof
      approveTeamJobCompletionMutation.mutate({
        jobId: conversation.job.id,
        paymentMethod: "CASH",
        cashProofImage: selectedImage,
      });
    } else if (conversation.is_agency_job) {
      // Agency PROJECT job cash proof
      approveAgencyProjectJobMutation.mutate({
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
            approveBackjobCompletionMutation.mutate({
              jobId: conversation.job.id,
            });
          },
        },
      ],
    );
  };

  // Handle submit review
  const handleSubmitReview = () => {
    if (!conversation) return;

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
      if (reviewStep === "EMPLOYEE") {
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
            onSuccess: (data: any) => {
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
                refetch();
              } else if (data.needs_agency_review) {
                // All employees reviewed, move to agency review
                setEmployeeReviewSubmitted(true);
                setReviewStep("AGENCY");
                Alert.alert(
                  "Employees Rated!",
                  `Great! Now please rate the agency (${conversation.other_participant?.name}).`,
                );
                refetch();
              } else {
                // All reviews done
                setShowReviewModal(false);
                refetch();
                Alert.alert("Thank You!", "Your reviews have been submitted.");
              }
            },
            onError: (error: unknown) => {
              const errorMessage = getErrorMessage(
                error,
                "Failed to submit review",
              );
              if (errorMessage.toLowerCase().includes("already reviewed")) {
                setRatingQuality(0);
                setRatingCommunication(0);
                setRatingPunctuality(0);
                setRatingProfessionalism(0);
                setReviewComment("");
                refetch();
                Alert.alert(
                  "Already Rated",
                  "You've already rated this employee. Refreshing...",
                );
              } else {
                Alert.alert("Error", errorMessage);
              }
            },
          },
        );
      } else {
        // Agency review step
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
            onSuccess: () => {
              setRatingQuality(0);
              setRatingCommunication(0);
              setRatingPunctuality(0);
              setRatingProfessionalism(0);
              setReviewComment("");
              setShowReviewModal(false);
              refetch();
              Alert.alert("Thank You!", "Your reviews have been submitted.");
            },
            onError: (error: unknown) => {
              Alert.alert(
                "Error",
                getErrorMessage(error, "Failed to submit review"),
              );
            },
          },
        );
      }
    } else if (conversation.is_team_job && conversation.my_role === "CLIENT") {
      // Team job client review - must specify which worker to review
      const pendingWorkers = conversation.pending_team_worker_reviews || [];
      const allWorkers = conversation.team_worker_assignments || [];

      if (pendingWorkers.length === 0) {
        Alert.alert("All Done!", "You have already reviewed all team workers.");
        return;
      }

      // Get the current worker to review (first pending)
      const currentWorker = pendingWorkers[0];
      if (!currentWorker) {
        Alert.alert("Error", "No worker to review");
        return;
      }

      const overallRating =
        (ratingQuality +
          ratingCommunication +
          ratingPunctuality +
          ratingProfessionalism) /
        4;

      submitReviewMutation.mutate(
        {
          job_id: conversation.job.id,
          reviewee_id: currentWorker.account_id,
          rating_quality: ratingQuality,
          rating_communication: ratingCommunication,
          rating_punctuality: ratingPunctuality,
          rating_professionalism: ratingProfessionalism,
          comment: reviewComment,
          reviewer_type: "CLIENT",
          worker_id: currentWorker.worker_id, // For team jobs
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
            if (errorMessage.toLowerCase().includes("already reviewed")) {
              setRatingQuality(0);
              setRatingCommunication(0);
              setRatingPunctuality(0);
              setRatingProfessionalism(0);
              setReviewComment("");
              refetch();
              Alert.alert(
                "Already Rated",
                "You've already rated this worker. Refreshing...",
              );
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
            setShowReviewModal(false);
            // Refresh conversation to update review status
            refetch();
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
        Alert.alert("Error", getErrorMessage(error, "Failed to send message"));
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
      await uploadImageMessage(result.assets[0].uri);
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
      await uploadImageMessage(result.assets[0].uri);
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

      await uploadAsync({
        uri: imageUri,
        endpoint,
        fieldName: "image",
        compress: true,
      });

      Alert.alert("Success", "Image sent successfully!");
      resetProgress();

      // Refetch conversation to show the new image message
      await refetch();

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("[ChatScreen] Image upload failed:", error);
      Alert.alert(
        "Error",
        getErrorMessage(error, "Failed to send image. Please try again."),
      );
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
      index > 0 ? new Date(conversation!.messages[index - 1].created_at) : null;

    const showDateSeparator =
      !previousDate || !isSameDay(currentDate, previousDate);

    // Show timestamp only for first message per minute
    const showTimestamp =
      index === 0 ||
      Math.abs(
        new Date(item.created_at).getTime() -
        new Date(conversation!.messages[index - 1].created_at).getTime(),
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
    if (isConnected) return null;

    return (
      <View style={styles.offlineIndicator}>
        <Ionicons name="cloud-offline-outline" size={16} color={Colors.white} />
        <Text style={styles.offlineText}>
          {"You're offline. Messages will be sent when you reconnect."}
        </Text>
      </View>
    );
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
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Stack.Screen
          options={{
            title: "Error",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Conversation not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => safeGoBack(routerHook, "/(tabs)/messages")}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => {
            if (needsReview) {
              Alert.alert(
                "Review Required",
                "Please leave a review before exiting this conversation.",
                [
                  {
                    text: "Leave Review",
                    onPress: () => setShowReviewModal(true),
                  },
                ],
                { cancelable: false },
              );
            } else {
              safeGoBack(routerHook, "/(tabs)/messages");
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation.other_participant?.name ||
              conversation.job?.title ||
              "Chat"}
          </Text>
          {/* Show assigned workers for agency jobs (client view) - Multi-employee support */}
          {conversation.is_agency_job &&
            conversation.my_role === "CLIENT" &&
            conversation.assigned_employees &&
            conversation.assigned_employees.length > 0 && (
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
          {/* Voice Call Button - Only show for non-closed conversations and non-team jobs */}
          {!isConversationClosed && !conversation.is_team_job && (
            <TouchableOpacity
              onPress={() => {
                const recipientName =
                  conversation.other_participant?.name || "Unknown";
                initiateCall(conversationId, recipientName);
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
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Offline Indicator */}
        {renderOfflineIndicator()}

        {/* Job Info Header with Action Buttons */}
        <View style={styles.jobHeaderContainer}>
          <View style={[styles.jobHeader, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push(`/jobs/${conversation.job.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.jobInfo}>
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {conversation.job.title}
                </Text>
              </View>
              <View style={styles.jobMeta}>
                <Text style={styles.jobBudget}>
                  ₱{conversation.job.budget.toLocaleString()}
                </Text>
                {/* ML Estimated Completion Time - Compact mode */}
                {(isLoading ||
                  (conversation.job.estimatedCompletion &&
                    conversation.job.status !== "COMPLETED")) && (
                    <EstimatedTimeCard
                      prediction={conversation?.job?.estimatedCompletion || null}
                      compact={true}
                      countdownMode={conversation?.job?.status === "IN_PROGRESS"}
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

            {/* Rate Button (Client, Worker & Agency) */}
            {conversation.job.clientMarkedComplete &&
              !isConversationClosed &&
              ((conversation.my_role !== "CLIENT" &&
                !conversation.job.workerReviewed) ||
                (conversation.my_role === "CLIENT" &&
                  !(conversation.is_team_job
                    ? conversation.all_team_workers_reviewed
                    : conversation.job.clientReviewed))) && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#FFFFFF",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    marginLeft: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderWidth: 1,
                    borderColor: "#FBC02D",
                  }}
                  onPress={() => setShowReviewModal(true)}
                >
                  <Ionicons name="star" size={16} color="#FBC02D" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#FBC02D",
                    }}
                  >
                    {conversation.my_role === "CLIENT"
                      ? conversation.is_agency_job
                        ? "Rate Agency"
                        : "Rate Worker"
                      : "Rate Client"}
                  </Text>
                </TouchableOpacity>
              )}
          </View>

          {/* Action Buttons (replaces role banner) */}
          {conversation.job.status === "IN_PROGRESS" &&
            !conversation.job.clientMarkedComplete && (
              <View style={styles.actionButtonsContainer}>
                {/* TEAM JOB: Per-Worker Arrival Confirmation (CLIENT only) */}
                {/* NOTE: DAILY jobs use Daily Attendance section for per-day arrival tracking */}
                {conversation.is_team_job &&
                  conversation.job?.payment_model !== "DAILY" &&
                  conversation.my_role === "CLIENT" &&
                  conversation.team_worker_assignments &&
                  conversation.team_worker_assignments.length > 0 && (
                    <View style={styles.teamArrivalSection}>
                      <View style={styles.teamArrivalHeader}>
                        <Text style={styles.teamArrivalTitle}>
                          Worker Arrivals
                        </Text>
                        <Text style={styles.teamArrivalProgress}>
                          {
                            conversation.team_worker_assignments.filter(
                              (a) => a.client_confirmed_arrival,
                            ).length
                          }
                          /{conversation.team_worker_assignments.length} arrived
                        </Text>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.teamWorkersScrollView}
                        contentContainerStyle={styles.teamWorkersScrollContent}
                      >
                        {conversation.team_worker_assignments.map(
                          (assignment) => (
                            <View
                              key={assignment.assignment_id}
                              style={[
                                styles.teamWorkerCardCompact,
                                assignment.client_confirmed_arrival &&
                                styles.teamWorkerCardConfirmed,
                              ]}
                            >
                              <View style={styles.teamWorkerInfoCompact}>
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
                                <View style={styles.teamWorkerDetailsCompact}>
                                  <Text
                                    style={styles.teamWorkerNameCompact}
                                    numberOfLines={1}
                                  >
                                    {assignment.name.split(" ")[0]}
                                  </Text>
                                  <Text
                                    style={styles.teamWorkerSkillCompact}
                                    numberOfLines={1}
                                  >
                                    {assignment.skill}
                                  </Text>
                                </View>
                              </View>

                              {assignment.client_confirmed_arrival ? (
                                <View style={styles.arrivedBadgeCompact}>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={Colors.success}
                                  />
                                  <Text style={styles.arrivedTextCompact}>
                                    {assignment.client_confirmed_arrival_at &&
                                      format(
                                        new Date(
                                          assignment.client_confirmed_arrival_at,
                                        ),
                                        "h:mm a",
                                      )}
                                  </Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={styles.confirmArrivalButtonCompact}
                                  onPress={() =>
                                    handleConfirmTeamWorkerArrival(
                                      assignment.assignment_id,
                                      assignment.name,
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
                                        styles.confirmArrivalButtonTextCompact
                                      }
                                    >
                                      Confirm
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>
                          ),
                        )}
                      </ScrollView>
                    </View>
                  )}

                {/* DAILY JOB: Attendance Tracking Section */}
                {conversation.job?.payment_model === "DAILY" && (
                  <View style={styles.dailyAttendanceSection}>
                    <View style={styles.teamArrivalHeader}>
                      <Text style={styles.teamArrivalTitle}>
                        📅 Daily Attendance
                      </Text>
                      <Text style={styles.teamArrivalProgress}>
                        {format(new Date(), "MMM d, yyyy")}
                      </Text>
                    </View>

                    {/* Worker View: Check-in/Check-out buttons */}
                    {conversation.my_role === "WORKER" && (
                      <View style={styles.dailyWorkerActions}>
                        {(() => {
                          // Find today's attendance for this worker
                          const todayAttendance =
                            conversation.attendance_today?.find(
                              (a) =>
                                a.worker_id ===
                                user?.profile_data?.workerProfileId,
                            );

                          // No attendance yet - show check-in button
                          if (!todayAttendance || !todayAttendance.time_in) {
                            return (
                              <TouchableOpacity
                                style={[
                                  styles.actionButton,
                                  styles.checkInButton,
                                ]}
                                onPress={() =>
                                  workerCheckInMutation.mutate(
                                    conversation.job.id,
                                  )
                                }
                                disabled={workerCheckInMutation.isPending}
                              >
                                {workerCheckInMutation.isPending ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={Colors.white}
                                  />
                                ) : (
                                  <>
                                    <Ionicons
                                      name="log-in-outline"
                                      size={20}
                                      color={Colors.white}
                                    />
                                    <Text style={styles.actionButtonText}>
                                      Check In
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            );
                          }

                          // Checked in but not out - show check-out button
                          if (
                            todayAttendance.time_in &&
                            !todayAttendance.time_out
                          ) {
                            return (
                              <View style={styles.dailyStatusContainer}>
                                <View style={styles.checkedInBadge}>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color={Colors.success}
                                  />
                                  <Text style={styles.checkedInText}>
                                    Checked in at{" "}
                                    {format(
                                      new Date(todayAttendance.time_in),
                                      "h:mm a",
                                    )}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={[
                                    styles.actionButton,
                                    styles.checkOutButton,
                                  ]}
                                  onPress={() =>
                                    workerCheckOutMutation.mutate(
                                      conversation.job.id,
                                    )
                                  }
                                  disabled={workerCheckOutMutation.isPending}
                                >
                                  {workerCheckOutMutation.isPending ? (
                                    <ActivityIndicator
                                      size="small"
                                      color={Colors.white}
                                    />
                                  ) : (
                                    <>
                                      <Ionicons
                                        name="log-out-outline"
                                        size={20}
                                        color={Colors.white}
                                      />
                                      <Text style={styles.actionButtonText}>
                                        Check Out
                                      </Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                              </View>
                            );
                          }

                          // Checked out - show status
                          if (todayAttendance.time_out) {
                            return (
                              <View style={styles.dailyStatusContainer}>
                                <View style={styles.checkedInBadge}>
                                  <Ionicons
                                    name="checkmark-done-circle"
                                    size={16}
                                    color={Colors.success}
                                  />
                                  <Text style={styles.checkedInText}>
                                    {format(
                                      new Date(todayAttendance.time_in),
                                      "h:mm a",
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      new Date(todayAttendance.time_out),
                                      "h:mm a",
                                    )}
                                  </Text>
                                </View>
                                {todayAttendance.client_confirmed ? (
                                  <View style={styles.paymentProcessedBadge}>
                                    <Ionicons
                                      name="wallet"
                                      size={14}
                                      color={Colors.success}
                                    />
                                    <Text style={styles.paymentProcessedText}>
                                      ₱
                                      {Number(
                                        todayAttendance.amount_earned,
                                      ).toLocaleString()}{" "}
                                      paid
                                    </Text>
                                  </View>
                                ) : (
                                  <Text style={styles.awaitingConfirmText}>
                                    Awaiting client confirmation...
                                  </Text>
                                )}
                              </View>
                            );
                          }

                          return null;
                        })()}
                      </View>
                    )}

                    {/* Client View: Confirm attendance for each worker */}
                    {conversation.my_role === "CLIENT" && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.teamWorkersScrollView}
                        contentContainerStyle={styles.teamWorkersScrollContent}
                      >
                        {conversation.attendance_today &&
                          conversation.attendance_today.length > 0 ? (
                          conversation.attendance_today.map(
                            (attendance: any) => (
                              <View
                                key={attendance.attendance_id}
                                style={[
                                  styles.teamWorkerCardCompact,
                                  attendance.client_confirmed &&
                                  styles.teamWorkerCardConfirmed,
                                ]}
                              >
                                <View style={styles.teamWorkerInfoCompact}>
                                  {attendance.worker_avatar ? (
                                    <Image
                                      source={{ uri: attendance.worker_avatar }}
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
                                  <View style={styles.teamWorkerDetailsCompact}>
                                    <Text
                                      style={styles.teamWorkerNameCompact}
                                      numberOfLines={1}
                                    >
                                      {attendance.worker_name?.split(" ")[0] ||
                                        "Worker"}
                                    </Text>
                                    {attendance.time_in && (
                                      <Text
                                        style={styles.teamWorkerSkillCompact}
                                      >
                                        {format(
                                          new Date(attendance.time_in),
                                          "h:mm a",
                                        )}
                                        {attendance.time_out &&
                                          ` - ${format(new Date(attendance.time_out), "h:mm a")}`}
                                      </Text>
                                    )}
                                  </View>
                                </View>

                                {attendance.client_confirmed ? (
                                  <View style={styles.arrivedBadgeCompact}>
                                    <Ionicons
                                      name="wallet"
                                      size={14}
                                      color={Colors.success}
                                    />
                                    <Text style={styles.arrivedTextCompact}>
                                      ₱
                                      {Number(
                                        attendance.amount_earned,
                                      ).toLocaleString()}
                                    </Text>
                                  </View>
                                ) : attendance.time_out ? (
                                  // Employee has checked out - show Pay button
                                  <TouchableOpacity
                                    style={styles.confirmArrivalButtonCompact}
                                    onPress={() =>
                                      Alert.alert(
                                        "Confirm Attendance",
                                        `Confirm ${attendance.worker_name || "worker"}'s attendance and release ₱${conversation.job.daily_rate?.toLocaleString() || "0"} payment?`,
                                        [
                                          { text: "Cancel", style: "cancel" },
                                          {
                                            text: "Confirm & Pay",
                                            onPress: () =>
                                              clientConfirmAttendanceMutation.mutate(
                                                {
                                                  attendanceId:
                                                    attendance.attendance_id,
                                                },
                                              ),
                                          },
                                        ],
                                      )
                                    }
                                    disabled={
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
                                        style={
                                          styles.confirmArrivalButtonTextCompact
                                        }
                                      >
                                        Pay
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                ) : attendance.time_in ? (
                                  // Employee is working - show Mark Checkout button
                                  <TouchableOpacity
                                    style={[
                                      styles.confirmArrivalButtonCompact,
                                      { backgroundColor: Colors.warning },
                                    ]}
                                    onPress={() =>
                                      Alert.alert(
                                        "Mark Checkout",
                                        `Mark ${attendance.worker_name || "worker"} as done for today?`,
                                        [
                                          { text: "Cancel", style: "cancel" },
                                          {
                                            text: "Mark Checkout",
                                            onPress: () =>
                                              clientMarkCheckoutMutation.mutate(
                                                {
                                                  jobId: conversation.job.id,
                                                  attendanceId:
                                                    attendance.attendance_id,
                                                },
                                              ),
                                          },
                                        ],
                                      )
                                    }
                                    disabled={
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
                                        style={
                                          styles.confirmArrivalButtonTextCompact
                                        }
                                      >
                                        Out
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                ) : attendance.is_dispatched ? (
                                  // Employee dispatched but not arrived - show Verify Arrival button
                                  <TouchableOpacity
                                    style={[
                                      styles.confirmArrivalButtonCompact,
                                      { backgroundColor: Colors.primary },
                                    ]}
                                    onPress={() =>
                                      Alert.alert(
                                        "Verify Arrival",
                                        `Confirm ${attendance.worker_name || "worker"} has arrived on site?`,
                                        [
                                          { text: "Cancel", style: "cancel" },
                                          {
                                            text: "Verify",
                                            onPress: () =>
                                              clientVerifyArrivalMutation.mutate(
                                                {
                                                  jobId: conversation.job.id,
                                                  attendanceId:
                                                    attendance.attendance_id,
                                                },
                                              ),
                                          },
                                        ],
                                      )
                                    }
                                    disabled={
                                      clientVerifyArrivalMutation.isPending
                                    }
                                  >
                                    {clientVerifyArrivalMutation.isPending ? (
                                      <ActivityIndicator
                                        size="small"
                                        color={Colors.white}
                                      />
                                    ) : (
                                      <Ionicons
                                        name="car"
                                        size={14}
                                        color={Colors.white}
                                      />
                                    )}
                                  </TouchableOpacity>
                                ) : (
                                  <View style={styles.pendingBadge}>
                                    <Ionicons
                                      name="time-outline"
                                      size={14}
                                      color={Colors.warning}
                                    />
                                    <Text style={styles.pendingText}>
                                      Pending
                                    </Text>
                                  </View>
                                )}
                              </View>
                            ),
                          )
                        ) : (
                          <View style={styles.noAttendanceContainer}>
                            <Ionicons
                              name="calendar-outline"
                              size={20}
                              color={Colors.textSecondary}
                            />
                            <Text style={styles.noAttendanceText}>
                              No attendance logged for today
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    )}

                    {/* Daily rate info */}
                    <View style={styles.dailyRateInfo}>
                      <Text style={styles.dailyRateLabel}>Daily Rate:</Text>
                      <Text style={styles.dailyRateAmount}>
                        ₱{conversation.job.daily_rate?.toLocaleString() || "0"}
                      </Text>
                    </View>
                  </View>
                )}

                {/* TEAM JOB PHASE 2: Worker Marks Assignment Complete */}
                {/* NOTE: DAILY jobs use Daily Attendance check-in/check-out, not one-time completion */}
                {conversation.is_team_job &&
                  conversation.job?.payment_model !== "DAILY" &&
                  !conversation.is_agency_job &&
                  conversation.my_role === "WORKER" &&
                  user &&
                  (() => {
                    // Find worker's own assignment
                    const myAssignment =
                      conversation.team_worker_assignments?.find(
                        (a) => a.account_id === user.accountID,
                      );

                    if (!myAssignment) return null;

                    // Check if arrival was confirmed
                    if (!myAssignment.client_confirmed_arrival) {
                      return (
                        <View
                          style={[styles.actionButton, styles.waitingButton]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.waitingButtonText}>
                            Waiting for client to confirm your arrival...
                          </Text>
                        </View>
                      );
                    }

                    // Show mark complete button if not yet marked
                    if (!myAssignment.worker_marked_complete) {
                      return (
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.markCompleteButton,
                          ]}
                          onPress={() =>
                            handleMarkTeamAssignmentComplete(
                              myAssignment.assignment_id,
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
                                size={20}
                                color={Colors.white}
                              />
                              <Text style={styles.actionButtonText}>
                                Mark My Assignment Complete
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      );
                    }

                    // Show waiting for client approval
                    return (
                      <View style={[styles.actionButton, styles.waitingButton]}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.waitingButtonText}>
                          ✓ Assignment complete. Waiting for client approval...
                        </Text>
                      </View>
                    );
                  })()}

                {/* TEAM JOB PHASE 3: Client Approves All Workers */}
                {/* NOTE: DAILY jobs use Daily Attendance section above for per-day payment */}
                {/* This section is for PROJECT jobs only (one-time lump-sum payment) */}
                {conversation.is_team_job &&
                  !conversation.is_agency_job &&
                  conversation.my_role === "CLIENT" &&
                  conversation.job.payment_model !== "DAILY" &&
                  conversation.team_worker_assignments &&
                  conversation.team_worker_assignments.length > 0 &&
                  (() => {
                    const allWorkersComplete =
                      conversation.team_worker_assignments.every(
                        (a) => a.worker_marked_complete,
                      );
                    const allWorkersArrived =
                      conversation.team_worker_assignments.every(
                        (a) => a.client_confirmed_arrival,
                      );
                    const arrivedCount =
                      conversation.team_worker_assignments.filter(
                        (a) => a.client_confirmed_arrival,
                      ).length;
                    const completedCount =
                      conversation.team_worker_assignments.filter(
                        (a) => a.worker_marked_complete,
                      ).length;

                    // Show waiting for arrivals if not all arrived
                    if (!allWorkersArrived) {
                      return (
                        <View
                          style={[styles.actionButton, styles.waitingButton]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.waitingButtonText}>
                            Confirm all worker arrivals first ({arrivedCount} of{" "}
                            {conversation.team_worker_assignments.length}{" "}
                            arrived)
                          </Text>
                        </View>
                      );
                    }

                    // Show progress if not all complete
                    if (!allWorkersComplete) {
                      return (
                        <View
                          style={[styles.actionButton, styles.waitingButton]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.waitingButtonText}>
                            {completedCount} of{" "}
                            {conversation.team_worker_assignments.length}{" "}
                            workers marked complete...
                          </Text>
                        </View>
                      );
                    }

                    // Show approve button if all complete and not yet approved
                    if (!conversation.job.clientMarkedComplete) {
                      return (
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.approveCompletionButton,
                          ]}
                          onPress={handleApproveTeamJobCompletion}
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
                                name="wallet"
                                size={20}
                                color={Colors.white}
                              />
                              <Text style={styles.actionButtonText}>
                                Approve & Pay Team (₱
                                {(
                                  conversation.job.budget * 0.5
                                ).toLocaleString()}
                                )
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      );
                    }

                    return null;
                  })()}

                {/* CLIENT: Confirm Work Started Button (Regular Jobs Only) */}
                {!conversation.is_team_job &&
                  !conversation.is_agency_job &&
                  conversation.job?.payment_model !== "DAILY" &&
                  conversation.my_role === "CLIENT" &&
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
                  conversation.job?.payment_model !== "DAILY" &&
                  conversation.my_role === "CLIENT" &&
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



                {/* WORKER: Waiting for Client Confirmation (Regular Jobs Only) */}
                {!conversation.is_team_job &&
                  !conversation.is_agency_job &&
                  conversation.job?.payment_model !== "DAILY" &&
                  conversation.my_role === "WORKER" &&
                  !conversation.job.clientConfirmedWorkStarted && (
                    <View style={[styles.actionButton, styles.waitingButton]}>
                      <Ionicons
                        name="time-outline"
                        size={24}
                        color={Colors.textSecondary}
                      />
                      <View style={{ flex: 1, marginLeft: 4 }}>
                        <Text style={styles.waitingButtonText} numberOfLines={1} adjustsFontSizeToFit>
                          Waiting for client to confirm you've arrived...
                        </Text>
                      </View>
                    </View>
                  )}

                {/* WORKER: Mark Complete Button (Regular Jobs Only) */}
                {!conversation.is_team_job &&
                  !conversation.is_agency_job &&
                  conversation.job?.payment_model !== "DAILY" &&
                  conversation.my_role === "WORKER" &&
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
                  conversation.job?.payment_model !== "DAILY" &&
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

                {/* CLIENT: Approve Completion Button (Regular Jobs Only) */}
                {!conversation.is_team_job &&
                  !conversation.is_agency_job &&
                  conversation.job?.payment_model !== "DAILY" &&
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
                            name="wallet"
                            size={20}
                            color={Colors.white}
                          />
                          <Text style={styles.actionButtonText}>
                            Approve & Pay Final Amount
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {/* ================================================================ */}
                {/* AGENCY PROJECT JOB WORKFLOW (PROJECT payment_model only) */}
                {/* ================================================================ */}
                {/* Workflow: Agency dispatches → Client confirms arrival → Agency marks complete → Client approves & pays */}

                {/* AGENCY VIEW: Dispatch and Mark Complete buttons */}
                {conversation.is_agency_job &&
                  conversation.my_role === "AGENCY" &&
                  conversation.job.payment_model !== "DAILY" &&
                  conversation.assigned_employees &&
                  conversation.assigned_employees.length > 0 &&
                  (() => {
                    const allDispatched = conversation.assigned_employees.every(
                      (e) => e.dispatched,
                    );
                    const allArrived = conversation.assigned_employees.every(
                      (e) => e.clientConfirmedArrival,
                    );
                    const allComplete = conversation.assigned_employees.every(
                      (e) => e.agencyMarkedComplete,
                    );

                    // Show dispatch buttons for employees not yet dispatched
                    const pendingDispatch =
                      conversation.assigned_employees.filter(
                        (e) => !e.dispatched,
                      );

                    // Show mark complete buttons for arrived employees not yet marked complete
                    const pendingComplete =
                      conversation.assigned_employees.filter(
                        (e) =>
                          e.clientConfirmedArrival && !e.agencyMarkedComplete,
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
                            {pendingDispatch.map((employee) => (
                              <TouchableOpacity
                                key={`dispatch-${employee.id}`}
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
                                          dispatchProjectEmployeeMutation.mutate(
                                            {
                                              jobId: conversation.job.id,
                                              employeeId: employee.id,
                                            },
                                          ),
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
                            ))}
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
                                conversation.assigned_employees.filter(
                                  (e) => e.clientConfirmedArrival,
                                ).length
                              }{" "}
                              of {conversation.assigned_employees.length})
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
                            {pendingComplete.map((employee) => (
                              <TouchableOpacity
                                key={`complete-${employee.id}`}
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
                                              employeeId: employee.id,
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
                            ))}
                          </View>
                        )}

                        {/* All complete - waiting for client approval */}
                        {allComplete &&
                          !conversation.job.clientMarkedComplete && (
                            <View
                              style={[
                                styles.actionButton,
                                styles.waitingButton,
                              ]}
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
                          )}
                      </>
                    );
                  })()}

                {/* CLIENT VIEW: Confirm arrivals and Approve & Pay */}
                {conversation.is_agency_job &&
                  conversation.my_role === "CLIENT" &&
                  conversation.job.payment_model !== "DAILY" &&
                  conversation.assigned_employees &&
                  conversation.assigned_employees.length > 0 &&
                  (() => {
                    const allDispatched = conversation.assigned_employees.every(
                      (e) => e.dispatched,
                    );
                    const allArrived = conversation.assigned_employees.every(
                      (e) => e.clientConfirmedArrival,
                    );
                    const allComplete = conversation.assigned_employees.every(
                      (e) => e.agencyMarkedComplete,
                    );

                    // Employees dispatched but not arrived yet
                    const pendingArrival =
                      conversation.assigned_employees.filter(
                        (e) => e.dispatched && !e.clientConfirmedArrival,
                      );

                    // Employees arrived but not yet marked complete by agency
                    const onSiteWorking =
                      conversation.assigned_employees.filter(
                        (e) =>
                          e.clientConfirmedArrival && !e.agencyMarkedComplete,
                      );

                    return (
                      <>
                        {/* Waiting for agency to dispatch */}
                        {!allDispatched && (
                          <View
                            style={[styles.actionButton, styles.waitingButton]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={20}
                              color={Colors.textSecondary}
                            />
                            <Text style={styles.waitingButtonText}>
                              Waiting for agency to dispatch employees (
                              {
                                conversation.assigned_employees.filter(
                                  (e) => e.dispatched,
                                ).length
                              }{" "}
                              of {conversation.assigned_employees.length}{" "}
                              dispatched)
                            </Text>
                          </View>
                        )}

                        {/* Confirm arrivals section */}
                        {pendingArrival.length > 0 && (
                          <View style={styles.employeeActionsSection}>
                            <Text style={styles.actionSectionTitle}>
                              Confirm Arrivals ({pendingArrival.length} on the
                              way)
                            </Text>
                            {pendingArrival.map((employee) => (
                              <TouchableOpacity
                                key={`arrival-${employee.id}`}
                                style={[
                                  styles.actionButton,
                                  styles.confirmWorkStartedButton,
                                ]}
                                onPress={() =>
                                  Alert.alert(
                                    "Confirm Arrival",
                                    `Has ${employee.name} arrived at the job site?`,
                                    [
                                      { text: "Cancel", style: "cancel" },
                                      {
                                        text: "Confirm",
                                        onPress: () =>
                                          confirmProjectArrivalMutation.mutate({
                                            jobId: conversation.job.id,
                                            employeeId: employee.id,
                                          }),
                                      },
                                    ],
                                  )
                                }
                                disabled={
                                  confirmProjectArrivalMutation.isPending
                                }
                              >
                                {confirmProjectArrivalMutation.isPending ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={Colors.white}
                                  />
                                ) : (
                                  <>
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={20}
                                      color={Colors.white}
                                    />
                                    <Text style={styles.actionButtonText}>
                                      Confirm: {employee.name} Arrived
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {/* Workers on site, working */}
                        {onSiteWorking.length > 0 && (
                          <View
                            style={[styles.actionButton, styles.waitingButton]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={20}
                              color={Colors.textSecondary}
                            />
                            <Text style={styles.waitingButtonText}>
                              {onSiteWorking.length} employee
                              {onSiteWorking.length > 1 ? "s" : ""} working on
                              site...
                            </Text>
                          </View>
                        )}

                        {/* All complete - show approve & pay button */}
                        {allComplete &&
                          !conversation.job.clientMarkedComplete && (
                            <TouchableOpacity
                              style={[
                                styles.actionButton,
                                styles.approveCompletionButton,
                              ]}
                              onPress={() => handleApproveCompletion()}
                              disabled={
                                approveAgencyProjectJobMutation.isPending
                              }
                            >
                              {approveAgencyProjectJobMutation.isPending ? (
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
                                    Approve & Pay Agency (₱
                                    {(
                                      conversation.job.budget * 0.5
                                    ).toLocaleString()}
                                    )
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}
                      </>
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
                    <Text
                      style={[styles.statusMessage, styles.completedMessage]}
                    >
                      ✓ Job completed and approved!
                    </Text>
                  )}
              </View>
            )}

          {/* Both Parties Reviewed - Job Fully Complete Banner */}
          {/* Only show when truly closed (no approved backjob) */}
          {isConversationClosed && !hasApprovedBackjob && (
            <View style={styles.jobCompleteBanner}>
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={Colors.success}
              />
              <View style={styles.jobCompleteTextContainer}>
                <Text style={styles.jobCompleteTitle}>
                  Job Completed Successfully!
                </Text>
                <Text style={styles.jobCompleteSubtitle}>
                  Both parties have reviewed each other. This conversation is
                  now closed.
                </Text>
              </View>
            </View>
          )}

          {/* View Receipt Banner - Merged with Payment Buffer Info */}
          {conversation.job.status === "COMPLETED" && (
            <TouchableOpacity
              style={[
                styles.viewReceiptBanner,
                conversation.job.paymentBuffer?.is_payment_released && {
                  backgroundColor: "#E8F5E9",
                  borderColor: "#A5D6A7",
                },
              ]}
              onPress={() => setShowReceiptModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.viewReceiptContent}>
                <View
                  style={[
                    styles.viewReceiptIconContainer,
                    conversation.job.paymentBuffer?.is_payment_released && {
                      backgroundColor: Colors.success,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      conversation.job.paymentBuffer?.is_payment_released
                        ? "checkmark-circle"
                        : "receipt"
                    }
                    size={20}
                    color={Colors.white}
                  />
                </View>
                <View style={styles.viewReceiptTextContainer}>
                  <Text
                    style={[
                      styles.viewReceiptTitle,
                      conversation.job.paymentBuffer?.is_payment_released && {
                        color: Colors.success,
                      },
                    ]}
                  >
                    View Receipt
                  </Text>
                  {/* Dynamic description based on payment hold status */}
                  {conversation.job.paymentBuffer ? (
                    <Text
                      style={[
                        styles.viewReceiptSubtitle,
                        conversation.job.paymentBuffer.is_payment_released
                          ? { color: "#388E3C" } // Success Green
                          : { color: "#E65100" }, // Orange for hold
                      ]}
                    >
                      {conversation.job.paymentBuffer.is_payment_released
                        ? "✅ Payment Released"
                        : conversation.my_role !== "CLIENT"
                          ? `₱${(conversation.job.budget * 0.5).toLocaleString("en-PH", { minimumFractionDigits: 0 })} held ${conversation.job.paymentBuffer.remaining_days !== null && conversation.job.paymentBuffer.remaining_days > 0 ? ` · ${conversation.job.paymentBuffer.remaining_days}d left` : " · releasing soon"}`
                          : `${conversation.job.paymentBuffer.buffer_days}-Day Hold ${conversation.job.paymentBuffer.remaining_days !== null && conversation.job.paymentBuffer.remaining_days > 0 ? ` · ${conversation.job.paymentBuffer.remaining_days}d remaining` : " · releasing soon"}`}
                    </Text>
                  ) : (
                    <Text style={styles.viewReceiptSubtitle}>
                      Payment breakdown and job details
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    conversation.job.paymentBuffer?.is_payment_released
                      ? Colors.success
                      : Colors.primary
                  }
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Request Backjob Banner - Only after both parties reviewed and conversation closed */}
          {conversation.my_role === "CLIENT" &&
            conversation.job.status === "COMPLETED" &&
            !conversation.backjob?.has_backjob &&
            isConversationClosed && (
              <TouchableOpacity
                style={styles.requestBackjobBanner}
                onPress={() =>
                  router.push(
                    `/jobs/request-backjob?jobId=${conversation.job.id}`,
                  )
                }
                activeOpacity={0.8}
              >
                <View style={[styles.requestBackjobContent, {
                  backgroundColor: "#FFF3E0", // Orange background
                  borderColor: "#FFE0B2", // Orange border
                }]}>
                  <View style={[styles.requestBackjobIconContainer, {
                    backgroundColor: "#FFB74D", // Match orange icon container
                  }]}>
                    <Ionicons
                      name="refresh-circle"
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                  <View style={styles.requestBackjobText}>
                    <Text style={[styles.requestBackjobTitle, { color: "#E65100" }]}>
                      Not satisfied with the work?
                    </Text>
                    <Text style={[styles.requestBackjobSubtitle, { color: "#EF6C00" }]}>
                      Tap here to request a backjob (rework)
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#EF6C00"
                  />
                </View>
              </TouchableOpacity>
            )}



          {/* Review Section - Compact Banner that opens modal */}
          {/* NOTE: DAILY jobs never set clientMarkedComplete, so we also check status === "COMPLETED" */}
          {(conversation.job.clientMarkedComplete ||
            conversation.job.status === "COMPLETED") &&
            !isConversationClosed && (
              <>
                {/* Check if current user already reviewed */}
                {(conversation.my_role === "CLIENT" &&
                  (conversation.is_team_job
                    ? conversation.all_team_workers_reviewed
                    : conversation.job.clientReviewed)) ||
                  (conversation.my_role === "WORKER" &&
                    conversation.job.workerReviewed) ? (
                  // User has already reviewed - show compact waiting banner
                  <View style={styles.reviewCompleteBanner}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.success}
                    />
                    <Text style={styles.reviewCompleteBannerText}>
                      {conversation.is_team_job &&
                        conversation.my_role === "CLIENT"
                        ? `✅ Reviewed all ${conversation.team_worker_assignments?.length || 0} workers`
                        : "✅ Review submitted"}
                    </Text>
                    {((conversation.my_role === "CLIENT" &&
                      !conversation.job.workerReviewed) ||
                      (conversation.my_role === "WORKER" &&
                        !conversation.job.clientReviewed)) && (
                        <View style={styles.reviewWaitingBadge}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.reviewWaitingBadgeText}>
                            Waiting for{" "}
                            {conversation.my_role === "CLIENT"
                              ? "worker"
                              : "client"}
                          </Text>
                        </View>
                      )}
                  </View>
                ) : (
                  // Redundant review banner removed - use header button instead
                  null
                )}

                {/* Team job worker review checklist - show who's been reviewed */}
                {conversation.is_team_job &&
                  conversation.my_role === "CLIENT" &&
                  (conversation.job.clientMarkedComplete ||
                    conversation.job.status === "COMPLETED") &&
                  !isConversationClosed &&
                  (conversation.team_worker_assignments?.length || 0) > 1 && (
                    <View style={styles.teamReviewChecklist}>
                      {(conversation.team_worker_assignments || []).map(
                        (worker: any, idx: number) => {
                          const isPending = (
                            conversation.pending_team_worker_reviews || []
                          ).some(
                            (pw: any) => pw.worker_id === worker.worker_id,
                          );
                          const isReviewed = !isPending;
                          return (
                            <View
                              key={worker.worker_id || idx}
                              style={styles.teamReviewChecklistItem}
                            >
                              <Ionicons
                                name={
                                  isReviewed
                                    ? "checkmark-circle"
                                    : "ellipse-outline"
                                }
                                size={16}
                                color={
                                  isReviewed
                                    ? Colors.success
                                    : Colors.textSecondary
                                }
                              />
                              <Text
                                style={[
                                  styles.teamReviewChecklistName,
                                  isReviewed &&
                                  styles.teamReviewChecklistNameDone,
                                ]}
                                numberOfLines={1}
                              >
                                {worker.name || `Worker ${idx + 1}`}
                              </Text>
                              {worker.skill && (
                                <Text style={styles.teamReviewChecklistSkill}>
                                  {worker.skill}
                                </Text>
                              )}
                            </View>
                          );
                        },
                      )}
                    </View>
                  )}
              </>
            )}

          {/* Review Modal */}
          <Modal
            visible={showReviewModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => {
              if (!needsReview) setShowReviewModal(false);
              // Block dismiss when review is required
            }}
          >
            <SafeAreaView style={styles.reviewModalContainer}>
              {/* Modal Header */}
              <View style={styles.reviewModalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (!needsReview) {
                      setShowReviewModal(false);
                    } else {
                      Alert.alert(
                        "Review Required",
                        "Please complete your review before closing.",
                      );
                    }
                  }}
                  style={styles.reviewModalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={
                      needsReview ? Colors.textSecondary : Colors.textPrimary
                    }
                  />
                </TouchableOpacity>
                <Text style={styles.reviewModalTitle}>Leave a Review</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Modal Content - ScrollView for the review form */}
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                  style={styles.reviewModalContent}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  {/* For team jobs: client reviewed if all_team_workers_reviewed is true */}
                  {(conversation.my_role === "CLIENT" &&
                    (conversation.is_team_job
                      ? conversation.all_team_workers_reviewed
                      : conversation.job.clientReviewed)) ||
                    (conversation.my_role !== "CLIENT" &&
                      conversation.job.workerReviewed) ? (
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
                          ? `Thank you for reviewing all ${conversation.team_worker_assignments?.length || 0} workers!`
                          : "Thank you for your review!"}
                      </Text>
                      {((conversation.my_role === "CLIENT" &&
                        !conversation.job.workerReviewed) ||
                        (conversation.my_role !== "CLIENT" &&
                          !conversation.job.clientReviewed)) && (
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
                        conversation.my_role === "CLIENT" ? (
                        <>
                          {/* Multi-employee support: show which employee is being reviewed */}
                          {(() => {
                            const pendingEmployees =
                              conversation.pending_employee_reviews || [];
                            const allEmployees =
                              conversation.assigned_employees || [];
                            const hasMultipleEmployees =
                              allEmployees.length > 1;
                            const totalEmployees = allEmployees.length || 1;
                            const reviewedCount =
                              totalEmployees - pendingEmployees.length;

                            // Get current employee being reviewed
                            let currentEmployeeName = "Worker";
                            if (reviewStep === "EMPLOYEE") {
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
                                  {reviewStep === "EMPLOYEE"
                                    ? `Rate ${currentEmployeeName}`
                                    : "Rate the Agency"}
                                </Text>
                                <Text style={styles.reviewSubtitle}>
                                  {reviewStep === "EMPLOYEE"
                                    ? `How did ${currentEmployeeName} perform on this job?`
                                    : `How was your experience with ${conversation.other_participant?.name || "the agency"}?`}
                                </Text>

                                {/* Progress indicator */}
                                {hasMultipleEmployees &&
                                  reviewStep === "EMPLOYEE" && (
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
                                  reviewStep === "AGENCY" && (
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
                        conversation.my_role === "CLIENT" ? (
                        // Team job client review - show worker name and progress
                        <>
                          {(() => {
                            const pendingWorkers =
                              conversation.pending_team_worker_reviews || [];
                            const allWorkers =
                              conversation.team_worker_assignments || [];
                            const totalWorkers = allWorkers.length || 1;
                            const reviewedCount =
                              totalWorkers - pendingWorkers.length;

                            // Get current worker being reviewed
                            const currentWorker = pendingWorkers[0];
                            const currentWorkerName =
                              currentWorker?.name || "Worker";
                            const currentWorkerSkill =
                              currentWorker?.skill || "";

                            return (
                              <>
                                <Text style={styles.reviewTitle}>
                                  Rate {currentWorkerName}
                                </Text>
                                <Text style={styles.reviewSubtitle}>
                                  How did {currentWorkerName} perform on this
                                  job?
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
                                      <View
                                        style={styles.teamReviewProgressBarBg}
                                      >
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
                                          Worker {reviewedCount + 1} of{" "}
                                          {totalWorkers}
                                        </Text>
                                      </View>
                                    </View>

                                    {/* Mini worker checklist in modal */}
                                    <View
                                      style={styles.teamReviewModalChecklist}
                                    >
                                      {allWorkers.map((w: any, i: number) => {
                                        const isWorkerPending =
                                          pendingWorkers.some(
                                            (pw: any) =>
                                              pw.worker_id === w.worker_id,
                                          );
                                        const isCurrent =
                                          pendingWorkers[0]?.worker_id ===
                                          w.worker_id;
                                        const isReviewed = !isWorkerPending;
                                        return (
                                          <View
                                            key={w.worker_id || i}
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
                            Rate{" "}
                            {conversation.my_role === "CLIENT"
                              ? "Worker"
                              : "Client"}
                          </Text>
                          <Text style={styles.reviewSubtitle}>
                            How was your experience with{" "}
                            {conversation.assigned_employee?.name ||
                              conversation.other_participant?.name ||
                              "them"}
                            ?
                          </Text>
                        </>
                      )}

                      {/* Rating Section - Conditional based on reviewer role */}
                      {conversation.my_role === "WORKER" ? (
                        /* Multi-Criteria Star Ratings for WORKER reviewing CLIENT */
                        <View style={styles.multiCriteriaContainer}>
                          {/* Professionalism Rating */}
                          <View style={styles.criteriaRow}>
                            <View style={styles.criteriaLabelRow}>
                              <Text style={styles.criteriaIcon}>👔</Text>
                              <Text style={styles.criteriaLabel}>
                                Professionalism
                              </Text>
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

                          {/* Communication Rating */}
                          <View style={styles.criteriaRow}>
                            <View style={styles.criteriaLabelRow}>
                              <Text style={styles.criteriaIcon}>💬</Text>
                              <Text style={styles.criteriaLabel}>
                                Communication
                              </Text>
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

                          {/* Quality Rating */}
                          <View style={styles.criteriaRow}>
                            <View style={styles.criteriaLabelRow}>
                              <Text style={styles.criteriaIcon}>🏆</Text>
                              <Text style={styles.criteriaLabel}>Quality</Text>
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

                          {/* Value Rating - using ratingPunctuality state */}
                          <View style={styles.criteriaRow}>
                            <View style={styles.criteriaLabelRow}>
                              <Text style={styles.criteriaIcon}>💰</Text>
                              <Text style={styles.criteriaLabel}>Value</Text>
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
                        </View>
                      ) : (
                        /* Multi-Criteria Star Ratings for CLIENT reviewing WORKER */
                        <View style={styles.multiCriteriaContainer}>
                          {/* Punctuality Rating */}
                          <View style={styles.criteriaRow}>
                            <View style={styles.criteriaLabelRow}>
                              <Text style={styles.criteriaIcon}>⏰</Text>
                              <Text style={styles.criteriaLabel}>
                                Punctuality
                              </Text>
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
                              <Text style={styles.criteriaLabel}>
                                Reliability
                              </Text>
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
                              <Text style={styles.criteriaLabel}>Skill</Text>
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
                              <Text style={styles.criteriaLabel}>
                                Workmanship
                              </Text>
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
                            submitReviewMutation.isPending) &&
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
                          submitReviewMutation.isPending
                        }
                      >
                        {submitReviewMutation.isPending ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.white}
                          />
                        ) : (
                          <>
                            <Ionicons
                              name="send"
                              size={18}
                              color={Colors.white}
                            />
                            <Text style={styles.submitReviewButtonText}>
                              Submit Review
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                      {/* Extra space to ensure button is above keyboard */}
                      <View style={{ height: 20 }} />
                    </>
                  )}
                </ScrollView>
              </TouchableWithoutFeedback>
            </SafeAreaView>
          </Modal>
        </View>

        {/* Upload Progress */}
        {renderUploadProgress()}

        {/* Backjob Banner - shows when there's an active backjob */}
        {conversation.backjob?.has_backjob && (
          <View style={styles.backjobSectionCompact}>
            {/* Compact Backjob Banner */}
            <TouchableOpacity
              style={styles.backjobBannerCompact}
              onPress={() =>
                router.push(
                  `/jobs/backjob-detail?jobId=${conversation.job.id}&disputeId=${conversation.backjob?.dispute_id}`,
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons name="construct" size={18} color={Colors.warning} />
              <Text style={styles.backjobBannerTitleCompact} numberOfLines={1}>
                🔄 Backjob: {conversation.backjob.reason || "Rework required"}
              </Text>
              <View style={styles.backjobStatusBadgeCompact}>
                <Text style={styles.backjobStatusTextCompact}>
                  {conversation.backjob.status === "UNDER_REVIEW"
                    ? "Action"
                    : "Pending"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.warning}
              />
            </TouchableOpacity>

            {/* Backjob Workflow Action Buttons - Only show when backjob is approved (UNDER_REVIEW) */}
            {hasApprovedBackjob && (
              <View style={styles.backjobActionButtonsCompact}>
                {/* CLIENT: Confirm Backjob Started Button */}
                {conversation.my_role === "CLIENT" &&
                  !conversation.backjob?.backjob_started && (
                    <TouchableOpacity
                      style={styles.backjobActionButtonCompact}
                      onPress={handleConfirmBackjobStarted}
                      disabled={confirmBackjobStartedMutation.isPending}
                    >
                      {confirmBackjobStartedMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
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

                {/* CLIENT: Waiting for Worker to Complete Backjob */}
                {conversation.my_role === "CLIENT" &&
                  conversation.backjob?.backjob_started &&
                  !conversation.backjob?.worker_marked_complete && (
                    <View style={styles.backjobWaitingBadge}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.backjobWaitingText}>
                        Waiting for worker...
                      </Text>
                    </View>
                  )}

                {/* WORKER: Waiting for Client Confirmation */}
                {conversation.my_role === "WORKER" &&
                  !conversation.backjob?.backjob_started && (
                    <View style={styles.backjobWaitingBadge}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.backjobWaitingText}>
                        Waiting for client...
                      </Text>
                    </View>
                  )}

                {/* WORKER: Mark Backjob Complete Button */}
                {conversation.my_role === "WORKER" &&
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
                        <ActivityIndicator size="small" color={Colors.white} />
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

                {/* WORKER: Waiting for Client Approval */}
                {conversation.my_role === "WORKER" &&
                  conversation.backjob?.worker_marked_complete &&
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
                  conversation.backjob?.worker_marked_complete &&
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
                        <ActivityIndicator size="small" color={Colors.white} />
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
              </View>
            )}
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={conversation.messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          ListFooterComponent={renderTypingIndicator}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Message Input or Closed Message */}
        {isConversationClosed ? (
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

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={styles.modalSubtitle}>
              Choose how you want to pay the remaining 50%
            </Text>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handlePaymentMethodSelect("WALLET")}
            >
              <Ionicons name="wallet" size={24} color={Colors.primary} />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Wallet</Text>
                <Text style={styles.paymentOptionDesc}>
                  Pay instantly from your iAyos wallet
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handlePaymentMethodSelect("CASH")}
            >
              <Ionicons name="cash" size={24} color={Colors.primary} />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Cash</Text>
                <Text style={styles.paymentOptionDesc}>
                  Upload proof of cash payment
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
              onPress={() => setShowPaymentModal(false)}
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
                disabled={!selectedImage || approveCompletionMutation.isPending}
              >
                {approveCompletionMutation.isPending ? (
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
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  jobTitle: {
    ...Typography.body.medium,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButtonsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
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
  teamWorkerCardConfirmed: {
    backgroundColor: "#E8F5E9",
    borderColor: Colors.success,
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
  // Daily Attendance Styles
  dailyAttendanceSection: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dailyWorkerActions: {
    marginVertical: Spacing.xs,
  },
  dailyStatusContainer: {
    alignItems: "center",
    gap: Spacing.xs,
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
  waitingButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    paddingVertical: 8,
    paddingHorizontal: 8, // Reduced padding
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
  offlineText: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.white,
    flex: 1,
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
    maxHeight: 400, // Allow scrolling if content is tall
  },
  reviewWaitingContainer: {
    alignItems: "center",
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
  backjobActionButtonsCompact: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: "#FFF8E1",
    gap: Spacing.sm,
  },
  backjobActionButtonCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
    gap: 4,
  },
  backjobActionButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "600",
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.white,
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
});

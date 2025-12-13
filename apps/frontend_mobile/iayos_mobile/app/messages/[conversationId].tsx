// Chat Screen
// 1-on-1 messaging with real-time updates, image uploads, and offline support

import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
} from "../../lib/hooks/useJobActions";
import {
  useConfirmBackjobStarted,
  useMarkBackjobComplete,
  useApproveBackjobCompletion,
} from "../../lib/hooks/useBackjobActions";
import { useSubmitReview } from "../../lib/hooks/useReviews";
import MessageBubble from "../../components/MessageBubble";
import MessageInput from "../../components/MessageInput";
import { ImageMessage } from "../../components/ImageMessage";
import { TypingIndicator } from "../../components/TypingIndicator";
import { EstimatedTimeCard } from "../../components";
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

  const flatListRef = useRef<FlatList>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashUploadModal, setShowCashUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Review state - Multi-criteria ratings
  const [ratingQuality, setRatingQuality] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingPunctuality, setRatingPunctuality] = useState(0);
  const [ratingProfessionalism, setRatingProfessionalism] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  // For agency jobs: track if we're reviewing employee or agency
  const [reviewStep, setReviewStep] = useState<"EMPLOYEE" | "AGENCY">(
    "EMPLOYEE"
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
  const isConversationClosed =
    conversation?.job?.clientMarkedComplete &&
    conversation?.job?.clientReviewed &&
    conversation?.job?.workerReviewed &&
    !hasApprovedBackjob; // Don't close if there's an APPROVED backjob

  // Send message mutation
  const sendMutation = useSendMessageMutation();

  // Job action mutations
  const confirmWorkStartedMutation = useConfirmWorkStarted();
  const markCompleteMutation = useMarkComplete();
  const approveCompletionMutation = useApproveCompletion();
  const submitReviewMutation = useSubmitReview();

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
      ]
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
        [{ text: "OK" }]
      );
      return;
    }

    Alert.prompt(
      "Mark Job Complete",
      "Add optional completion notes:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: (notes?: string) => {
            markCompleteMutation.mutate({
              jobId: conversation.job.id,
              notes: notes || undefined,
            });
          },
        },
      ],
      "plain-text",
      "",
      "default"
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
      ]
    );
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (
    method: "WALLET" | "GCASH" | "CASH"
  ) => {
    if (!conversation) return;

    setShowPaymentModal(false);

    if (method === "CASH") {
      // Show cash amount confirmation before opening upload modal
      const remainingAmount = conversation.job.budget
        ? (conversation.job.budget * 0.5).toFixed(2)
        : "0.00";

      Alert.alert(
        "Cash Payment",
        `Please pay ₱${remainingAmount} to the worker directly, then upload a photo of your payment receipt.\n\nThis proof will be stored for dispute resolution.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upload Proof",
            onPress: () => setShowCashUploadModal(true),
          },
        ]
      );
    } else {
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

    approveCompletionMutation.mutate({
      jobId: conversation.job.id,
      paymentMethod: "CASH",
      cashProofImage: selectedImage,
    });

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
      ]
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
        [{ text: "OK" }]
      );
      return;
    }

    Alert.prompt(
      "Mark Backjob Complete",
      "Add optional completion notes:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: (notes?: string) => {
            markBackjobCompleteMutation.mutate({
              jobId: conversation.job.id,
              notes: notes || undefined,
            });
          },
        },
      ],
      "plain-text",
      "",
      "default"
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
      ]
    );
  };

  // Handle submit review
  const handleSubmitReview = () => {
    if (!conversation) return;

    // Check all ratings are filled
    const allRatingsFilled =
      ratingQuality > 0 &&
      ratingCommunication > 0 &&
      ratingPunctuality > 0 &&
      ratingProfessionalism > 0;

    if (!allRatingsFilled) {
      Alert.alert(
        "Ratings Required",
        "Please rate all categories before submitting"
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
            (e) => e.id === currentEmployeeId
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
                  (e) => e.id === remainingEmployees[0]
                );
                Alert.alert(
                  "Employee Rated!",
                  `You gave ${currentEmployeeName} a ${overallRating.toFixed(1)}-star rating. Now please rate ${nextEmployee?.name || "the next employee"}.`
                );
                // Refetch to get updated pending list
                refetch();
              } else if (data.needs_agency_review) {
                // All employees reviewed, move to agency review
                setEmployeeReviewSubmitted(true);
                setReviewStep("AGENCY");
                Alert.alert(
                  "Employees Rated!",
                  `Great! Now please rate the agency (${conversation.other_participant?.name}).`
                );
                refetch();
              } else {
                // All reviews done
                refetch();
                Alert.alert("Thank You!", "Your reviews have been submitted.");
              }
            },
            onError: (error: any) => {
              const errorMessage = error.message || "Failed to submit review";

              // Check if employee was already reviewed
              if (errorMessage.toLowerCase().includes("already reviewed")) {
                setRatingQuality(0);
                setRatingCommunication(0);
                setRatingPunctuality(0);
                setRatingProfessionalism(0);
                setReviewComment("");
                refetch(); // Refresh to get updated pending list
                Alert.alert(
                  "Already Rated",
                  "You've already rated this employee. Refreshing..."
                );
              } else {
                Alert.alert("Error", errorMessage);
              }
            },
          }
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
              refetch();
              Alert.alert("Thank You!", "Your reviews have been submitted.");
            },
            onError: (error: any) => {
              Alert.alert("Error", error.message || "Failed to submit review");
            },
          }
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
                `You gave ${reviewedName} a ${overallRating.toFixed(1)}-star rating.\n\nNow please rate ${nextWorker.name}.`
              );
              setCurrentTeamWorkerIndex((prev) => prev + 1);
              refetch();
            } else {
              // All workers reviewed
              refetch();
              Alert.alert(
                "All Done!",
                `You gave ${reviewedName} a ${overallRating.toFixed(1)}-star rating.\n\nThank you for reviewing all ${data.total_team_workers || allWorkers.length} team workers!`
              );
            }
          },
          onError: (error: any) => {
            const errorMessage = error.message || "Failed to submit review";
            if (errorMessage.toLowerCase().includes("already reviewed")) {
              setRatingQuality(0);
              setRatingCommunication(0);
              setRatingPunctuality(0);
              setRatingProfessionalism(0);
              setReviewComment("");
              refetch();
              Alert.alert(
                "Already Rated",
                "You've already rated this worker. Refreshing..."
              );
            } else {
              Alert.alert("Error", errorMessage);
            }
          },
        }
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
            // Refresh conversation to update review status
            refetch();
          },
        }
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
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, sendMutation]
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
        }
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
        { cancelable: true }
      );
    }
  }, [conversationId]);

  // Pick image from camera
  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to take photos."
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
        "Gallery permission is required to choose photos."
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
      Alert.alert("Error", "Failed to send image. Please try again.");
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
          new Date(conversation!.messages[index - 1].created_at).getTime()
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
            onPress={() => router.back()}
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
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation.other_participant?.name || "Unknown"}
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Offline Indicator */}
        {renderOfflineIndicator()}

        {/* Job Info Header with Action Buttons */}
        <View style={styles.jobHeaderContainer}>
          <TouchableOpacity
            style={styles.jobHeader}
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

          {/* Action Buttons (replaces role banner) */}
          {conversation.job.status === "IN_PROGRESS" &&
            !conversation.job.clientMarkedComplete && (
              <View style={styles.actionButtonsContainer}>
                {/* CLIENT: Confirm Work Started Button */}
                {conversation.my_role === "CLIENT" &&
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

                {/* CLIENT: Waiting for Worker to Complete */}
                {conversation.my_role === "CLIENT" &&
                  conversation.job.clientConfirmedWorkStarted &&
                  !conversation.job.workerMarkedComplete && (
                    <View style={[styles.actionButton, styles.waitingButton]}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.waitingButtonText}>
                        Waiting for worker to mark job complete...
                      </Text>
                    </View>
                  )}

                {/* WORKER: Waiting for Client Confirmation */}
                {conversation.my_role === "WORKER" &&
                  !conversation.job.clientConfirmedWorkStarted && (
                    <View style={[styles.actionButton, styles.waitingButton]}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.waitingButtonText}>
                        Waiting for client to confirm work started...
                      </Text>
                    </View>
                  )}

                {/* WORKER: Mark Complete Button */}
                {conversation.my_role === "WORKER" &&
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

                {/* WORKER: Waiting for Client Approval */}
                {conversation.my_role === "WORKER" &&
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

                {/* CLIENT: Approve Completion Button */}
                {conversation.my_role === "CLIENT" &&
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

                {/* Status Messages */}
                {conversation.job.clientConfirmedWorkStarted &&
                  conversation.my_role === "WORKER" &&
                  !conversation.job.workerMarkedComplete && (
                    <Text style={styles.statusMessage}>
                      ✓ Client confirmed work started
                    </Text>
                  )}

                {conversation.job.workerMarkedComplete &&
                  !conversation.job.clientMarkedComplete && (
                    <Text style={styles.statusMessage}>
                      {conversation.my_role === "CLIENT"
                        ? "Worker marked job complete. Please review and approve."
                        : "✓ Marked complete. Waiting for client approval."}
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

          {/* Request Backjob Banner - Only for clients on completed jobs without existing backjob */}
          {conversation.my_role === "CLIENT" &&
            conversation.job.status === "COMPLETED" &&
            !conversation.backjob?.has_backjob && (
              <TouchableOpacity
                style={styles.requestBackjobBanner}
                onPress={() =>
                  router.push(
                    `/jobs/request-backjob?jobId=${conversation.job.id}`
                  )
                }
                activeOpacity={0.8}
              >
                <View style={styles.requestBackjobContent}>
                  <View style={styles.requestBackjobIconContainer}>
                    <Ionicons
                      name="refresh-circle"
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                  <View style={styles.requestBackjobText}>
                    <Text style={styles.requestBackjobTitle}>
                      Not satisfied with the work?
                    </Text>
                    <Text style={styles.requestBackjobSubtitle}>
                      Tap here to request a backjob (rework)
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.primary}
                  />
                </View>
              </TouchableOpacity>
            )}

          {/* Review Section - Shows after client approves completion */}
          {conversation.job.clientMarkedComplete && !isConversationClosed && (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView
                style={styles.reviewSection}
                keyboardShouldPersistTaps="handled"
              >
                {/* Check if current user already reviewed */}
                {/* For team jobs: client reviewed if all_team_workers_reviewed is true */}
                {(conversation.my_role === "CLIENT" &&
                  (conversation.is_team_job
                    ? conversation.all_team_workers_reviewed
                    : conversation.job.clientReviewed)) ||
                (conversation.my_role === "WORKER" &&
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
                      (conversation.my_role === "WORKER" &&
                        !conversation.job.clientReviewed)) && (
                      <Text style={styles.reviewWaitingText}>
                        Waiting for{" "}
                        {conversation.my_role === "CLIENT"
                          ? "workers"
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
                          const hasMultipleEmployees = allEmployees.length > 1;
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
                                (e) => e.id === pendingEmployees[0]
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

                              {/* Progress indicator */}
                              {totalWorkers > 1 && (
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

                    {/* Multi-Criteria Star Ratings */}
                    <View style={styles.multiCriteriaContainer}>
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

                      {/* Punctuality Rating */}
                      <View style={styles.criteriaRow}>
                        <View style={styles.criteriaLabelRow}>
                          <Text style={styles.criteriaIcon}>⏰</Text>
                          <Text style={styles.criteriaLabel}>Punctuality</Text>
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
                    </View>

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
                        <ActivityIndicator size="small" color={Colors.white} />
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
          )}
        </View>

        {/* Upload Progress */}
        {renderUploadProgress()}

        {/* Backjob Banner - shows when there's an active backjob */}
        {conversation.backjob?.has_backjob && (
          <View style={styles.backjobSection}>
            <TouchableOpacity
              style={styles.backjobBanner}
              onPress={() =>
                router.push(
                  `/jobs/backjob-detail?jobId=${conversation.job.id}&disputeId=${conversation.backjob?.dispute_id}`
                )
              }
              activeOpacity={0.8}
            >
              <View style={styles.backjobBannerContent}>
                <View style={styles.backjobIconContainer}>
                  <Ionicons name="construct" size={20} color={Colors.white} />
                </View>
                <View style={styles.backjobBannerText}>
                  <Text style={styles.backjobBannerTitle}>
                    🔄 Active Backjob Request
                  </Text>
                  <Text style={styles.backjobBannerSubtitle} numberOfLines={1}>
                    {conversation.backjob.reason || "Backjob work required"}
                  </Text>
                  <View style={styles.backjobStatusBadge}>
                    <Text style={styles.backjobStatusText}>
                      Status:{" "}
                      {conversation.backjob.status === "UNDER_REVIEW"
                        ? "Action Required"
                        : "Pending Review"}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.warning}
                />
              </View>
            </TouchableOpacity>

            {/* Backjob Workflow Action Buttons - Only show when backjob is approved (UNDER_REVIEW) */}
            {hasApprovedBackjob && (
              <View style={styles.backjobActionButtonsContainer}>
                {/* CLIENT: Confirm Backjob Started Button */}
                {conversation.my_role === "CLIENT" &&
                  !conversation.backjob?.backjob_started && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.confirmBackjobStartedButton,
                      ]}
                      onPress={handleConfirmBackjobStarted}
                      disabled={confirmBackjobStartedMutation.isPending}
                    >
                      {confirmBackjobStartedMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={Colors.white}
                          />
                          <Text style={styles.actionButtonText}>
                            Confirm Backjob Work Started
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {/* CLIENT: Waiting for Worker to Complete Backjob */}
                {conversation.my_role === "CLIENT" &&
                  conversation.backjob?.backjob_started &&
                  !conversation.backjob?.worker_marked_complete && (
                    <View style={[styles.actionButton, styles.waitingButton]}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.waitingButtonText}>
                        Waiting for worker to mark backjob complete...
                      </Text>
                    </View>
                  )}

                {/* WORKER: Waiting for Client Confirmation */}
                {conversation.my_role === "WORKER" &&
                  !conversation.backjob?.backjob_started && (
                    <View style={[styles.actionButton, styles.waitingButton]}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.waitingButtonText}>
                        Waiting for client to confirm backjob started...
                      </Text>
                    </View>
                  )}

                {/* WORKER: Mark Backjob Complete Button */}
                {conversation.my_role === "WORKER" &&
                  conversation.backjob?.backjob_started &&
                  !conversation.backjob?.worker_marked_complete && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.markBackjobCompleteButton,
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
                            size={20}
                            color={Colors.white}
                          />
                          <Text style={styles.actionButtonText}>
                            Mark Backjob Complete
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {/* WORKER: Waiting for Client Approval */}
                {conversation.my_role === "WORKER" &&
                  conversation.backjob?.worker_marked_complete &&
                  !conversation.backjob?.client_confirmed_complete && (
                    <View style={[styles.actionButton, styles.waitingButton]}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.waitingButtonText}>
                        Waiting for client to approve backjob...
                      </Text>
                    </View>
                  )}

                {/* CLIENT: Approve Backjob Completion Button */}
                {conversation.my_role === "CLIENT" &&
                  conversation.backjob?.worker_marked_complete &&
                  !conversation.backjob?.client_confirmed_complete && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveBackjobButton]}
                      onPress={handleApproveBackjobCompletion}
                      disabled={approveBackjobCompletionMutation.isPending}
                    >
                      {approveBackjobCompletionMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={Colors.white}
                          />
                          <Text style={styles.actionButtonText}>
                            Approve Backjob & Close
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {/* Status Messages */}
                {conversation.backjob?.backjob_started &&
                  conversation.my_role === "WORKER" &&
                  !conversation.backjob?.worker_marked_complete && (
                    <Text style={styles.backjobStatusMessage}>
                      ✓ Client confirmed backjob work started
                    </Text>
                  )}

                {conversation.backjob?.worker_marked_complete &&
                  !conversation.backjob?.client_confirmed_complete && (
                    <Text style={styles.backjobStatusMessage}>
                      {conversation.my_role === "CLIENT"
                        ? "Worker marked backjob complete. Please review and approve."
                        : "✓ Marked complete. Waiting for client approval."}
                    </Text>
                  )}
              </View>
            )}
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={conversation.messages}
          keyExtractor={(item, index) => `${item.created_at}-${index}`}
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
          <MessageInput
            onSend={handleSend}
            onImagePress={handleImagePress}
            isSending={isSending}
          />
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
  infoButton: {
    padding: 4,
    marginLeft: 12,
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
    backgroundColor: Colors.primaryLight,
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
  actionButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
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
  },
  waitingButtonText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
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
  // Request Backjob Banner Styles (for clients to request rework)
  requestBackjobBanner: {
    backgroundColor: Colors.primaryLight || "#E3F2FD",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  requestBackjobContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  requestBackjobIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
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
});

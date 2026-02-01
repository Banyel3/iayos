"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useWorkerAvailability } from "@/lib/hooks/useWorkerAvailability";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { API_BASE_URL } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import {
  Conversation,
  ChatMessage,
  toggleConversationArchive,
} from "@/lib/api/chat";
import {
  useConversationMessages,
  useConversations,
  useMarkJobComplete,
  useApproveJobCompletion,
  useSubmitReview,
  useOptimisticMessageUpdate,
  CONVERSATION_FILTERS,
} from "@/lib/hooks/useInboxQueries";
import { useQueryClient } from "@tanstack/react-query";
import { inboxKeys } from "@/lib/hooks/useInboxQueries";
import { EstimatedTimeCard } from "@/components/ui/estimated-time-card";

// Extended User interface for inbox page
interface InboxUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
    profileImg?: string;
  };
}

const InboxPage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as InboxUser;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "archived">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conversations list powered by React Query with per-tab caching
  const {
    data: conversationsData,
    isLoading: isConversationsLoading,
    isFetching: isConversationsFetching,
  } = useConversations(activeTab, { enabled: isAuthenticated });
  const conversations = conversationsData ?? [];
  const isLoadingConversations =
    (isConversationsLoading || isConversationsFetching) &&
    conversations.length === 0;

  // 🔥 USE TANSTACK QUERY FOR MESSAGES - No more manual state!
  const {
    data: messageData,
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
  } = useConversationMessages(selectedConversationId);

  // Extract messages array from the response
  const chatMessages = messageData?.messages ?? [];
  const conversationMetadata = messageData?.conversation;

  const [isLoadingReviewStatus, setIsLoadingReviewStatus] = useState(false);

  // Action state flags
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isApprovingCompletion, setIsApprovingCompletion] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Stream Controller: Only keep metadata cache (messages now in React Query)
  const conversationMetadataRef = useRef<Map<number, any>>(new Map());
  const currentlyLoadingRef = useRef<number | null>(null);
  const lastLoadedConversationIdRef = useRef<number | null>(null);

  // React Query hooks (mutations/utilities only)
  // Note: We fetch/store conversations and messages locally in this component
  // to enable caching, optimistic updates, and fine-grained control.

  // Mutations
  const markCompleteMutation = useMarkJobComplete();
  const approveCompletionMutation = useApproveJobCompletion();
  const submitReviewMutation = useSubmitReview();
  const optimisticUpdate = useOptimisticMessageUpdate();

  // Job details modal state
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [jobDetailsData, setJobDetailsData] = useState<any>(null);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [fullImageView, setFullImageView] = useState<string | null>(null);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState("");
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const hasShownReviewModalRef = useRef(false); // Track if we've already shown the modal for this job

  // WebSocket connection for real-time messaging
  const lastProcessedMessageRef = useRef<Set<string>>(new Set());

  const updateConversationPreview = useCallback(
    (
      conversationId: number,
      updater: (conversation: Conversation) => Conversation
    ) => {
      CONVERSATION_FILTERS.forEach((filter) => {
        queryClient.setQueryData(
          inboxKeys.conversations(filter),
          (old: Conversation[] | undefined) => {
            if (!old) return old;
            let changed = false;
            const next = old.map((conv) => {
              if (conv.id !== conversationId) return conv;
              changed = true;
              return updater(conv);
            });
            return changed ? next : old;
          }
        );
      });
    },
    [queryClient]
  );

  const handleWebSocketMessage = useCallback(
    (data: any) => {
      // Handle message history response
      if (data.action === "messages_response") {
        console.log(
          "📖 [WebSocket] Received message history:",
          data.conversation_id,
          `(${data.messages?.length || 0} messages)`
        );

        if (data.error) {
          console.error("❌ [WebSocket] Error fetching messages:", data.error);
          return;
        }

        const conversationId = data.conversation_id;
        const messages = data.messages || [];
        const conversationData = data.conversation || {};

        // Format messages
        const formattedMessages = messages.map((msg: any, index: number) => ({
          id: Date.now() + index, // Client-side ID for React key
          sender_id: 0, // Not used
          sender_name: msg.sender_name,
          sender_avatar: msg.sender_avatar,
          message_text: msg.message_text,
          message_type: msg.message_type,
          is_read: msg.is_read,
          created_at: msg.created_at,
          is_mine: msg.is_mine,
        }));

        // 🔥 UPDATE REACT QUERY CACHE - This is the key!
        queryClient.setQueryData(inboxKeys.messages(conversationId), {
          messages: formattedMessages,
          conversation: conversationData,
        });

        // Store metadata separately (not in React Query)
        conversationMetadataRef.current.set(conversationId, conversationData);

        console.log(
          "✅ [TanStack Query] Cached",
          formattedMessages.length,
          "messages for conversation",
          conversationId
        );

        // Update review status if this is the selected conversation
        if (selectedChat && selectedChat.id === conversationId) {
          if (conversationData) {
            const myRole = conversationData.my_role;
            const hasReviewed =
              myRole === "WORKER"
                ? conversationData.job?.workerReviewed
                : conversationData.job?.clientReviewed;
            setHasSubmittedReview(hasReviewed || false);
            setIsLoadingReviewStatus(false);
          }

          // Auto-scroll
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }

        // Clear loading guard (WebSocket fetch complete)
        currentlyLoadingRef.current = null;

        return;
      }

      // Handle regular chat message
      const messageData = data.message || data;
      const conversationId = messageData.conversation_id || selectedChat?.id;

      if (!conversationId) {
        console.warn("⚠️ [WebSocket] Received message without conversation_id");
        return;
      }

      // Use message content + timestamp for deduplication (no IDs exposed)
      const messageKey = `${messageData.sender_name}-${messageData.message || messageData.message_text}-${messageData.created_at}`;

      // Quick deduplication check
      if (lastProcessedMessageRef.current.has(messageKey)) return;
      lastProcessedMessageRef.current.add(messageKey);

      // Cleanup old keys (keep last 20)
      if (lastProcessedMessageRef.current.size > 20) {
        const keysArray = Array.from(lastProcessedMessageRef.current);
        lastProcessedMessageRef.current = new Set(keysArray.slice(-20));
      }

      // Add the new message to chat
      const newMessage: ChatMessage = {
        id: Date.now(), // Generate client-side ID for React key only
        sender_id: 0, // Not used, will be removed
        sender_name: messageData.sender_name || "Unknown",
        sender_avatar: messageData.sender_avatar || null,
        message_text: messageData.message_text || messageData.message || "",
        message_type: messageData.message_type || messageData.type || "TEXT",
        is_read: messageData.is_read || false,
        created_at: messageData.created_at || new Date().toISOString(),
        is_mine: messageData.is_mine || false,
      };

      // 🔥 UPDATE REACT QUERY CACHE - Add message to conversation
      queryClient.setQueryData(
        inboxKeys.messages(conversationId),
        (
          oldData: { messages: ChatMessage[]; conversation: any } | undefined
        ) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [...oldData.messages, newMessage],
          };
        }
      );

      console.log(
        "✅ [TanStack Query] Added message to cache for conversation",
        conversationId
      );

      // If this message is for the currently selected chat, auto-scroll
      if (selectedChat && selectedChat.id === conversationId) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      }

      // Update conversation's last message preview in cached lists
      updateConversationPreview(conversationId, (conv) => ({
        ...conv,
        last_message: newMessage.message_text,
        last_message_time: newMessage.created_at,
      }));
    },
    [selectedChat, queryClient, updateConversationPreview]
  );

  const {
    isConnected,
    isConnecting,
    error: wsError,
    sendMessage: wsSendMessage,
    requestMessages: wsRequestMessages,
    retry: retryWebSocket,
  } = useWebSocket(null, handleWebSocketMessage); // null = global connection for all conversations

  // Use the worker availability hook
  const isWorker = user?.profile_data?.profileType === "WORKER";
  const {
    isAvailable,
    isLoading: isLoadingAvailability,
    handleAvailabilityToggle,
  } = useWorkerAvailability(isWorker, isAuthenticated);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // 🔥 TanStack Query: Cache invalidation utility
  const invalidateConversationCache = useCallback(
    (conversationId: number) => {
      console.log(
        "🗑️ [TanStack Query] Invalidating cache for conversation",
        conversationId
      );
      queryClient.invalidateQueries({
        queryKey: inboxKeys.messages(conversationId),
      });
      conversationMetadataRef.current.delete(conversationId);
    },
    [queryClient]
  );

  // Check if user has already reviewed this job
  const checkReviewStatus = useCallback(async (jobId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/jobs/${jobId}/has-reviewed`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHasSubmittedReview(data.has_reviewed);
          return data;
        }
      }
    } catch (error) {
      console.error("Error checking review status:", error);
    }
    return null;
  }, []);

  useEffect(() => {
    console.log(
      "[useEffect#1] selectedChat changed:",
      selectedChat?.id,
      selectedChat
    );
    if (selectedChat) {
      // Update the stable conversation ID
      console.log(
        "[useEffect#1] Setting selectedConversationId to:",
        selectedChat.id
      );
      setSelectedConversationId(selectedChat.id);
    } else {
      console.log("[useEffect#1] Clearing selectedConversationId");
      setSelectedConversationId(null);
      setIsLoadingReviewStatus(false);
    }
  }, [selectedChat]);

  // 🔥 TanStack Query automatically fetches when selectedConversationId changes!
  // The useConversationMessages hook above will handle fetching & caching
  // We just need to trigger WebSocket request for real-time updates
  useEffect(() => {
    if (selectedConversationId && isConnected) {
      console.log(
        "🔄 [TanStack Query] Requesting messages via WebSocket:",
        selectedConversationId
      );
      wsRequestMessages(selectedConversationId);

      // Reset modal flag
      hasShownReviewModalRef.current = false;
    }
  }, [selectedConversationId, isConnected, wsRequestMessages]);

  // 🔥 Auto-prompt review when BOTH parties mark complete (for worker)
  useEffect(() => {
    if (!selectedChat || !conversationMetadata) return;

    const job = conversationMetadata.job;
    const myRole = conversationMetadata.my_role;

    // Only trigger for workers when:
    // 1. Both parties have marked complete
    // 2. Worker hasn't reviewed yet
    // 3. We haven't shown the modal for this job yet
    if (
      myRole === "WORKER" &&
      job?.workerMarkedComplete &&
      job?.clientMarkedComplete &&
      !job?.workerReviewed &&
      !hasShownReviewModalRef.current
    ) {
      console.log(
        "✅ Both parties marked complete, prompting worker for review"
      );
      hasShownReviewModalRef.current = true;

      // Small delay to ensure smooth UX after payment
      setTimeout(() => {
        setShowReviewModal(true);
      }, 500);
    }
  }, [selectedChat, conversationMetadata]);

  // Handle sending messages
  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !selectedChat) return;

    const message = messageInput.trim();
    setMessageInput("");

    // Optimistically add message to UI immediately
    const optimisticMessage: ChatMessage = {
      id: Date.now(),
      sender_id: user?.accountID || 0,
      sender_name:
        `${user?.profile_data?.firstName || ""} ${user?.profile_data?.lastName || ""}`.trim() ||
        "You",
      sender_avatar: user?.profile_data?.profileImg || null,
      message_text: message,
      message_type: "TEXT",
      is_read: false,
      created_at: new Date().toISOString(),
      is_mine: true,
    };

    // 🔥 TanStack Query: Update cache immediately (optimistic update)
    const conversationId = selectedChat.id;
    queryClient.setQueryData(
      inboxKeys.messages(conversationId),
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: [...oldData.messages, optimisticMessage],
        };
      }
    );

    console.log(
      "✅ [TanStack Query] Added optimistic message to cache for conversation",
      conversationId
    );

    // Auto-scroll to bottom
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );

    // Try to send via WebSocket (will queue if reconnecting)
    if (isConnected && selectedChat) {
      console.log("📤 Sending via WebSocket:", message);
      wsSendMessage(selectedChat.id, message);
    } else if (isConnecting && selectedChat) {
      console.log("⏳ Queueing message while reconnecting:", message);
      // Message will be shown optimistically, WebSocket will handle when connected
      // For now, just wait and try again
      const retryInterval = setInterval(() => {
        if (isConnected && selectedChat) {
          console.log("📤 Sending queued message:", message);
          wsSendMessage(selectedChat.id, message);
          clearInterval(retryInterval);
        }
      }, 500);

      // Clear retry after 10 seconds
      setTimeout(() => clearInterval(retryInterval), 10000);
    } else {
      console.warn("⚠️ WebSocket not connected, message shown optimistically");
      // Message is already shown in UI, will sync when connection restored
    }
  }, [
    messageInput,
    selectedChat,
    isConnected,
    isConnecting,
    wsSendMessage,
    user,
  ]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle marking job as complete (worker only)
  const handleMarkAsComplete = async () => {
    if (!selectedChat) return;

    setIsMarkingComplete(true);

    markCompleteMutation.mutate(selectedChat.job.id, {
      onSuccess: (data) => {
        // 🔥 Stream Controller: Invalidate cache to force fresh data on next load
        invalidateConversationCache(selectedChat.id);

        // Update the job with completion flags
        setSelectedChat((prev) =>
          prev
            ? {
                ...prev,
                job: {
                  ...prev.job,
                  workerMarkedComplete: data.worker_marked_complete,
                  clientMarkedComplete: data.client_marked_complete,
                },
              }
            : null
        );
        alert(
          data.message || "Job marked as complete! Waiting for client approval."
        );
        setIsMarkingComplete(false);
      },
      onError: (error) => {
        console.error("Error marking job as complete:", error);
        alert(getErrorMessage(error, "Failed to mark job as complete"));
        setIsMarkingComplete(false);
      },
    });
  };

  // Handle client approving completion
  const handleApproveCompletion = async (
    paymentMethod: "WALLET" | "GCASH" | "CASH" = "WALLET"
  ) => {
    if (!selectedChat) return;

    setIsApprovingCompletion(true);

    approveCompletionMutation.mutate(
      { jobId: selectedChat.job.id, paymentMethod },
      {
        onSuccess: (data) => {
          // 🔥 Stream Controller: Invalidate cache for fresh job status
          invalidateConversationCache(selectedChat.id);

          // Check if payment is required
          if (data.requires_payment) {
            if (data.invoice_url) {
              // GCASH payment - redirect to Xendit
              alert(`${data.message}\n\nRedirecting to payment page...`);
              window.location.href = data.invoice_url;
              setIsApprovingCompletion(false);
              return;
            } else if (data.requires_proof_upload) {
              // CASH payment - show upload proof UI
              alert(data.message);
              setIsApprovingCompletion(false);
              // TODO: Show proof upload modal
              return;
            }
          }

          // Payment completed (WALLET) or no payment required - prompt for review
          if (data.prompt_review) {
            // Update the job status
            setSelectedChat((prev) =>
              prev
                ? {
                    ...prev,
                    job: {
                      ...prev.job,
                      status: data.status,
                      workerMarkedComplete: data.worker_marked_complete,
                      clientMarkedComplete: data.client_marked_complete,
                    },
                  }
                : null
            );

            alert(
              data.message ||
                "Payment successful! Please leave a review for the worker."
            );
            // Automatically open review modal
            setShowReviewModal(true);
            setIsApprovingCompletion(false);
            return;
          }

          // Update the job status
          setSelectedChat((prev) =>
            prev
              ? {
                  ...prev,
                  job: {
                    ...prev.job,
                    status: data.status,
                    workerMarkedComplete: data.worker_marked_complete,
                    clientMarkedComplete: data.client_marked_complete,
                  },
                }
              : null
          );

          alert(data.message || "Job completion approved!");
          setIsApprovingCompletion(false);
        },
        onError: (error) => {
          console.error("Error approving job completion:", error);
          alert(getErrorMessage(error, "Failed to approve job completion"));
          setIsApprovingCompletion(false);
        },
      }
    );
  };

  // Handle submitting review
  const handleSubmitReview = async () => {
    if (!selectedChat || reviewRating === 0) {
      alert("Please select a rating before submitting");
      return;
    }

    setIsSubmittingReview(true);

    submitReviewMutation.mutate(
      {
        jobId: selectedChat.job.id,
        rating: reviewRating,
        message: reviewMessage,
      },
      {
        onSuccess: (data) => {
          alert(data.message || "Review submitted successfully!");
          setShowReviewModal(false);
          setReviewRating(0);
          setReviewMessage("");
          setHasSubmittedReview(true); // Mark as submitted to prevent re-showing modal

          // Update the conversation data with review status
          setSelectedChat((prev) => {
            if (!prev) return null;

            const myRole = prev.my_role;
            return {
              ...prev,
              job: {
                ...prev.job,
                status: data.job_completed ? "COMPLETED" : prev.job.status,
                workerReviewed:
                  myRole === "WORKER" ? true : prev.job.workerReviewed,
                clientReviewed:
                  myRole === "CLIENT" ? true : prev.job.clientReviewed,
              },
            };
          });
          setIsSubmittingReview(false);
        },
        onError: (error) => {
          console.error("Error submitting review:", error);
          alert(getErrorMessage(error, "Failed to submit review"));
          setIsSubmittingReview(false);
        },
      }
    );
  };

  // Handle confirming final payment after returning from Xendit
  const handleConfirmFinalPayment = async () => {
    if (!selectedChat) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/jobs/${selectedChat.job.id}/confirm-final-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update the job to reflect payment completed
        setSelectedChat((prev) =>
          prev
            ? {
                ...prev,
                job: {
                  ...prev.job,
                  remainingPaymentPaid: true,
                },
              }
            : null
        );

        alert(data.message || "Payment confirmed! You can now leave a review.");
      } else {
        const error = await response.json();
        alert(getErrorMessage(error, "Failed to confirm payment"));
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert(getErrorMessage(error, "Failed to confirm payment"));
    }
  };

  // Handle archiving/unarchiving a conversation
  const handleToggleArchive = async (conversationId: number) => {
    try {
      const result = await toggleConversationArchive(conversationId);

      // If this was the selected chat, clear it
      if (selectedChat?.id === conversationId) {
        setSelectedChat(null);
      }

      // Refresh all tab caches so this conversation moves immediately
      CONVERSATION_FILTERS.forEach((filter) =>
        queryClient.invalidateQueries({
          queryKey: inboxKeys.conversations(filter),
        })
      );

      alert(result.message);
    } catch (error) {
      console.error("Error toggling archive:", error);
      alert("Failed to update archive status. Please try again.");
    }
  };

  // Fetch job details when "View Job Details" is clicked
  const handleViewJobDetails = async (jobId: number) => {
    try {
      setIsLoadingJobDetails(true);
      setShowJobDetailsModal(true);

      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const data = await response.json();

      if (data.success) {
        setJobDetailsData(data.job);
      }
    } catch (error) {
      console.error("❌ Error fetching job details:", error);
    } finally {
      setIsLoadingJobDetails(false);
    }
  };

  // Loading state - Only show on initial page load, not on reconnections
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasInitiallyLoaded(true);
    }
  }, [isLoading]);

  // Show loading only on first load, not on subsequent auth checks
  if (!hasInitiallyLoaded && isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Filter conversations based on active tab and search query
  const filteredMessages = conversations.filter((conv) => {
    // Search filter
    const matchesSearch =
      conv.other_participant.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.last_message &&
        conv.last_message.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Note: Tab filtering (all/unread/archived) is now done server-side in fetchConversations
    // This just handles the search on the already-filtered results
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Desktop Navbar - Sticky */}
      <DesktopNavbar
        isWorker={user?.profile_data?.profileType === "WORKER"}
        userName={user?.profile_data?.firstName || "User"}
        userAvatar={user?.profile_data?.profileImg || "/worker1.jpg"}
        onLogout={logout}
        isAvailable={isAvailable}
        isLoadingAvailability={isLoadingAvailability}
        onAvailabilityToggle={handleAvailabilityToggle}
      />

      {/* Desktop Layout */}
      <div className="hidden lg:flex" style={{ height: "calc(100vh - 64px)" }}>
        {/* Left Sidebar - Chat List */}
        <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
          {/* Sidebar Header - Fixed */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Chats</h1>

            {/* Search Bar */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="cleaner, seamstress, plumber, etc"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "unread"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "archived"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {/* Chat List - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoadingConversations ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div>
                {filteredMessages.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedChat(conv);
                      setHasSubmittedReview(false); // Reset review flag when switching conversations
                    }}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedChat?.id === conv.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Image
                          src={conv.other_participant.avatar || "/worker1.jpg"}
                          alt={conv.other_participant.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Message Preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3
                            className={`text-sm font-medium truncate ${
                              conv.unread_count > 0
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {conv.other_participant.name}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {conv.last_message_time
                              ? new Date(
                                  conv.last_message_time
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1 truncate">
                          {conv.job.title}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            conv.unread_count > 0
                              ? "text-gray-700 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No messages found</p>
                {searchQuery && (
                  <p className="text-xs mt-1">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat View */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Top Navigation Bar - Fixed */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
            {/* Left - Back button */}
            <button
              onClick={() => router.push("/dashboard/home")}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>

            {/* Center - Selected user info (if chat is open) */}
            {selectedChat && (
              <div className="flex items-center space-x-3 flex-1 justify-center">
                <Image
                  src={selectedChat.other_participant.avatar || "/worker1.jpg"}
                  alt={selectedChat.other_participant.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">
                      {selectedChat.other_participant.name}
                    </h2>
                    {selectedChat.other_participant.is_agency && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-md">
                        Agency
                      </span>
                    )}
                  </div>
                  {/* Show assigned employee if agency */}
                  {selectedChat.other_participant.assigned_employee && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span>
                        👤{" "}
                        {selectedChat.other_participant.assigned_employee.name}
                      </span>
                      {selectedChat.other_participant.assigned_employee
                        .is_employee_of_month && (
                        <span className="px-1 py-0.5 text-[9px] bg-amber-100 text-amber-700 rounded">
                          🏆 EOTM
                        </span>
                      )}
                      {selectedChat.other_participant.assigned_employee
                        .rating && (
                        <span className="text-yellow-600">
                          ⭐{" "}
                          {selectedChat.other_participant.assigned_employee.rating.toFixed(
                            1
                          )}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs flex items-center">
                    {isConnected ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        <span className="text-green-600">Connected</span>
                      </>
                    ) : isConnecting ? (
                      <>
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
                        <span className="text-yellow-600">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                        <span className="text-gray-500">Offline</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Right - Archive button */}
            <button
              onClick={() =>
                selectedChat && handleToggleArchive(selectedChat.id)
              }
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title={
                activeTab === "archived"
                  ? "Unarchive conversation"
                  : "Archive conversation"
              }
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </button>
          </div>

          {/* Chat Content Area */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Job/Request Info Banner - Fixed */}
              <div className="bg-gradient-to-b from-gray-50 to-white p-5 border-b border-gray-200 flex-shrink-0">
                <div className="max-w-2xl mx-auto">
                  {/* Status Badge */}
                  <div className="flex justify-center mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedChat.job.status === "IN_PROGRESS"
                          ? selectedChat.job.workerMarkedComplete &&
                            selectedChat.job.clientMarkedComplete
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                          : selectedChat.job.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedChat.job.status === "IN_PROGRESS"
                        ? selectedChat.job.workerMarkedComplete &&
                          selectedChat.job.clientMarkedComplete
                          ? "⏳ Awaiting Reviews"
                          : "🔄 In Progress"
                        : selectedChat.job.status === "COMPLETED"
                          ? "✅ Job Completed"
                          : selectedChat.job.status}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-base font-bold text-gray-900 mb-2 text-center">
                    {selectedChat.job.title}
                  </h3>

                  {/* Job Details */}
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-semibold">
                        ₱{selectedChat.job.budget.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center space-x-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{selectedChat.job.location}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-blue-600">
                      {selectedChat.my_role === "CLIENT"
                        ? "Your Request"
                        : "Your Job"}
                    </span>
                  </div>

                  {/* View Details Link */}
                  <div className="text-center mb-3">
                    <button
                      onClick={() => handleViewJobDetails(selectedChat.job.id)}
                      className="text-blue-600 text-xs font-semibold hover:text-blue-700 hover:underline inline-flex items-center space-x-1"
                    >
                      <span>View Full Details</span>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* ML Estimated Completion Time - Compact inline */}
                  {(selectedChat.job as any).estimatedCompletion &&
                    selectedChat.job.status !== "COMPLETED" && (
                      <div className="mb-3 flex justify-center">
                        <EstimatedTimeCard
                          prediction={
                            (selectedChat.job as any).estimatedCompletion
                          }
                          compact={true}
                          countdownMode={
                            selectedChat.job.status === "IN_PROGRESS"
                          }
                        />
                      </div>
                    )}

                  {/* Job Completion Banner - Two-Phase System */}
                  {selectedChat.job.status === "IN_PROGRESS" && (
                    <div className="mt-1 space-y-2">
                      {selectedChat.my_role === "CLIENT" ? (
                        // Client view - Show if worker has marked complete
                        selectedChat.job.workerMarkedComplete ? (
                          <div>
                            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="w-4 h-4 text-green-600 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="text-xs font-medium text-green-700">
                                  Worker has marked the job as complete. Please
                                  review and approve.
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleApproveCompletion("WALLET")}
                              disabled={
                                selectedChat.job.clientMarkedComplete ||
                                isApprovingCompletion
                              }
                              className={`w-full ${
                                selectedChat.job.clientMarkedComplete ||
                                isApprovingCompletion
                                  ? "bg-gray-300 cursor-not-allowed"
                                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                              } text-white shadow-sm hover:shadow transition-all rounded-lg px-4 py-2.5`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                {isApprovingCompletion ? (
                                  <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-4 h-4 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                )}
                                <span className="text-sm font-semibold">
                                  {isApprovingCompletion
                                    ? "Approving..."
                                    : selectedChat.job.clientMarkedComplete
                                      ? "✓ You Approved Completion"
                                      : "Approve Job Completion"}
                                </span>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-center space-x-2">
                              <svg
                                className="w-4 h-4 text-blue-500 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-xs font-medium text-blue-700">
                                Waiting for worker to complete the job
                              </span>
                            </div>
                          </div>
                        )
                      ) : (
                        // Worker view - Mark complete button
                        <div className="space-y-2">
                          <button
                            onClick={handleMarkAsComplete}
                            disabled={
                              selectedChat.job.workerMarkedComplete ||
                              isMarkingComplete
                            }
                            className={`w-full ${
                              selectedChat.job.workerMarkedComplete ||
                              isMarkingComplete
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            } text-white shadow-sm hover:shadow transition-all rounded-lg px-4 py-2.5`}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              {isMarkingComplete ? (
                                <svg
                                  className="animate-spin h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                              <span className="text-sm font-semibold">
                                {isMarkingComplete
                                  ? "Marking Complete..."
                                  : selectedChat.job.workerMarkedComplete
                                    ? "✓ You Marked as Complete"
                                    : "Mark Job as Complete"}
                              </span>
                            </div>
                          </button>
                          {selectedChat.job.workerMarkedComplete && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                              <div className="flex items-center justify-center space-x-2">
                                <svg
                                  className="w-4 h-4 text-yellow-600 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="text-xs font-medium text-yellow-700">
                                  Waiting for client to approve completion
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Section - Show when client approved completion but payment not made */}
                  {selectedChat.my_role === "CLIENT" &&
                    selectedChat.job.clientMarkedComplete &&
                    !selectedChat.job.remainingPaymentPaid && (
                      <div className="mt-1">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
                          <div className="flex items-center justify-center space-x-2">
                            <svg
                              className="w-4 h-4 text-blue-600 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-xs font-medium text-blue-700">
                              Complete the final 50% payment to leave a review
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleConfirmFinalPayment}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Confirm Payment Completed
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Click this after completing payment via Xendit
                        </p>
                      </div>
                    )}

                  {/* Review Section - Show when both parties marked complete AND payment is done (for client) */}
                  {selectedChat.job.workerMarkedComplete &&
                    selectedChat.job.clientMarkedComplete &&
                    (selectedChat.my_role === "WORKER" ||
                      selectedChat.job.remainingPaymentPaid) && (
                      <div className="mt-1">
                        {isLoadingReviewStatus ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-center space-x-2">
                              <svg
                                className="animate-spin h-4 w-4 text-gray-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span className="text-xs font-medium text-gray-600">
                                Loading review status...
                              </span>
                            </div>
                          </div>
                        ) : (selectedChat.my_role === "WORKER" &&
                            selectedChat.job.workerReviewed) ||
                          (selectedChat.my_role === "CLIENT" &&
                            selectedChat.job.clientReviewed) ? (
                          // Current user has already reviewed
                          <div className="space-y-2">
                            {/* Both reviewed - job completed */}
                            {selectedChat.job.status === "COMPLETED" &&
                            selectedChat.job.workerReviewed &&
                            selectedChat.job.clientReviewed ? (
                              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-center space-x-2">
                                  <svg
                                    className="w-4 h-4 text-purple-600 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span className="text-xs font-medium text-purple-700">
                                    🎉 Job Completed! Both parties have
                                    reviewed.
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Only current user has reviewed, waiting for other party
                              <>
                                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg
                                      className="w-4 h-4 text-green-600 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="text-xs font-medium text-green-700">
                                      ✓ You've submitted your review
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg
                                      className="w-4 h-4 text-blue-600 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="text-xs font-medium text-blue-700">
                                      Waiting for{" "}
                                      {selectedChat.my_role === "WORKER"
                                        ? "client"
                                        : "worker"}{" "}
                                      to review
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          // Current user hasn't reviewed yet
                          <div className="space-y-2">
                            {/* Check if other party has already reviewed */}
                            {((selectedChat.my_role === "WORKER" &&
                              selectedChat.job.clientReviewed) ||
                              (selectedChat.my_role === "CLIENT" &&
                                selectedChat.job.workerReviewed)) && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-center space-x-2">
                                  <svg
                                    className="w-4 h-4 text-orange-600 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                  <span className="text-xs font-medium text-orange-700">
                                    {selectedChat.my_role === "WORKER"
                                      ? "Client"
                                      : "Worker"}{" "}
                                    is waiting for your review
                                  </span>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => setShowReviewModal(true)}
                              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-sm hover:shadow transition-all rounded-lg px-4 py-2.5"
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <svg
                                  className="w-4 h-4 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                  />
                                </svg>
                                <span className="text-sm font-semibold">
                                  Leave a Review
                                </span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* Messages - Scrollable Area (Independent) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 min-h-0">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : chatMessages.length > 0 ? (
                  <>
                    {chatMessages.map((msg, index) => (
                      <div
                        key={`${msg.id}-${msg.created_at}-${index}`}
                        className={`flex ${
                          msg.is_mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!msg.is_mine && (
                          <Image
                            src={
                              selectedChat.other_participant.avatar ||
                              "/worker1.jpg"
                            }
                            alt={selectedChat.other_participant.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                          />
                        )}
                        <div
                          className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                            msg.is_mine
                              ? "bg-green-500 text-white"
                              : "bg-white text-gray-900"
                          } rounded-2xl px-4 py-2 shadow-sm`}
                        >
                          <p className="text-sm">{msg.message_text}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input - Fixed at Bottom */}
              <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                {/* WebSocket connection status - Subtle indicators only */}
                {wsError && (
                  <div className="mb-2 text-xs text-red-600 text-center bg-red-50 py-1 px-2 rounded">
                    Connection issue - messages may be delayed
                  </div>
                )}

                {/* Connection Error Banner */}
                {wsError && (
                  <div className="mb-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            {wsError}
                          </p>
                          <p className="text-xs text-yellow-600 mt-0.5">
                            Messages will be delivered when reconnected
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={retryWebSocket}
                        className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors flex items-center space-x-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Retry Now</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Show message if job is completed */}
                {selectedChat.job.status === "COMPLETED" &&
                selectedChat.job.workerReviewed &&
                selectedChat.job.clientReviewed ? (
                  <div className="text-center py-3 px-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">
                      💬 This job has been completed and reviewed. Messaging is
                      now disabled.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder={
                        isConnecting
                          ? "Connecting..."
                          : !isConnected
                            ? "Reconnecting to chat..."
                            : "Type a message..."
                      }
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      title={
                        !isConnected
                          ? "Reconnecting... Message will be sent when connected"
                          : "Send message"
                      }
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed relative"
                    >
                      {isConnecting && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <svg
                        className={isConnecting ? "opacity-0" : ""}
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a chat to start messaging
                </h3>
                <p className="text-sm text-gray-600">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout - Keep existing mobile view */}
      <div className="lg:hidden pb-20">
        <div className="bg-white px-4 pt-4 pb-3">
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="cleaner, seamstress, plumber, etc"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "unread"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "archived"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            {isLoadingConversations ? (
              <div className="flex justify-center items-center p-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/dashboard/inbox/${conv.id}`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          src={conv.other_participant.avatar || "/worker1.jpg"}
                          alt={conv.other_participant.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`text-sm font-medium truncate ${
                              conv.unread_count > 0
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {conv.other_participant.name}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {conv.last_message_time
                              ? new Date(
                                  conv.last_message_time
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1 truncate">
                          {conv.job.title}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            conv.unread_count > 0
                              ? "text-gray-700 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>

                      {conv.unread_count > 0 && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No messages found</p>
                {searchQuery && (
                  <p className="text-xs mt-1">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <MobileNav />
      </div>

      {/* Job Details Modal */}
      {showJobDetailsModal && !fullImageView && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4"
          onClick={() => setShowJobDetailsModal(false)}
        >
          <div
            className="bg-white w-full lg:w-full lg:max-w-2xl lg:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Job Details
              </h2>
              <button
                onClick={() => setShowJobDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            {isLoadingJobDetails ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : jobDetailsData ? (
              <div className="p-6 space-y-6">
                {/* Title and Budget */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {jobDetailsData.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-green-600">
                      {jobDetailsData.budget}
                    </span>
                  </div>
                </div>

                {/* Category and Location */}
                <div className="grid grid-cols-2 gap-4">
                  {jobDetailsData.category && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Category</p>
                      <p className="font-medium text-gray-900">
                        {jobDetailsData.category.name}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-medium text-gray-900">
                      {jobDetailsData.location}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {jobDetailsData.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {jobDetailsData.description}
                    </p>
                  </div>
                )}

                {/* Job Photos */}
                {jobDetailsData.photos && jobDetailsData.photos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Job Photos
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {jobDetailsData.photos.map((photo: any) => (
                        <div
                          key={photo.id}
                          className="relative h-48 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFullImageView(photo.url)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.file_name || "Job photo"}
                            className="w-full h-full object-contain bg-gray-100"
                            onLoad={(e) => {
                              e.currentTarget.style.opacity = "1";
                            }}
                            style={{ opacity: 0, transition: "opacity 0.3s" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client Info */}
                {jobDetailsData.client && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Client Information
                    </h4>
                    <div className="flex items-center space-x-3">
                      <Image
                        src={jobDetailsData.client.avatar || "/worker1.jpg"}
                        alt={jobDetailsData.client.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {jobDetailsData.client.name}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg
                            className="w-4 h-4 text-yellow-500 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {jobDetailsData.client.rating} rating
                        </div>
                        {jobDetailsData.client.city && (
                          <p className="text-xs text-gray-500">
                            {jobDetailsData.client.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Worker Info */}
                {jobDetailsData.assigned_worker && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Assigned Worker
                    </h4>
                    <div className="flex items-center space-x-3">
                      <Image
                        src={
                          jobDetailsData.assigned_worker.avatar ||
                          "/worker1.jpg"
                        }
                        alt={jobDetailsData.assigned_worker.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {jobDetailsData.assigned_worker.name}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg
                            className="w-4 h-4 text-yellow-500 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {jobDetailsData.assigned_worker.rating} rating
                        </div>
                        {jobDetailsData.assigned_worker.city && (
                          <p className="text-xs text-gray-500">
                            {jobDetailsData.assigned_worker.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowJobDetailsModal(false)}
                    className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Full Image Viewer Modal */}
      {fullImageView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={() => setFullImageView(null)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Details
              </button>
              <button
                onClick={() => setFullImageView(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Image Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center">
              <img
                src={fullImageView}
                alt="Full size view"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedChat && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Leave a Review
              </h3>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewMessage("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Job Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  {selectedChat.my_role === "CLIENT"
                    ? "Review Worker"
                    : "Review Client"}
                </p>
                <p className="font-semibold text-gray-900">
                  {selectedChat.job.title}
                </p>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-10 h-10 ${
                          star <= reviewRating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                        fill={star <= reviewRating ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 text-lg font-semibold text-gray-700">
                    {reviewRating > 0 ? `${reviewRating}.0` : "Select rating"}
                  </span>
                </div>
              </div>

              {/* Review Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review (Optional)
                </label>
                <textarea
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  rows={4}
                  placeholder="Share your experience working together..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewMessage("");
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || isSubmittingReview}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  reviewRating === 0 || isSubmittingReview
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                }`}
              >
                {isSubmittingReview ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;

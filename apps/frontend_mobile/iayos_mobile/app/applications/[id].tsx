// Application Detail Screen
// Shows detailed information about a job application with negotiation thread and actions

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { ENDPOINTS, apiRequest } from "@/lib/api/config";
import CountdownConfirmModal from "@/components/CountdownConfirmModal";

// ===== TYPES =====

interface ApplicationDetail {
  id: number;
  jobId: number;
  jobTitle: string;
  jobCategory: string;
  jobBudget: number;
  jobDescription: string;
  jobLocation: string;
  proposedBudget: number;
  proposalMessage: string;
  estimatedDuration: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  respondedAt: string | null;
  paymentModel: "PROJECT" | "DAILY" | null;
  proposedDailyRate: number | null;
  proposedDays: number | null;
  jobDailyRate: number | null;
  jobDurationDays: number | null;
  negotiationCount: number;
  client: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  timeline: Array<{
    id: number;
    action: string;
    timestamp: string;
    description: string;
  }>;
}

interface MobileApplicationDetailResponse {
  success: boolean;
  application: {
    application_id: number;
    job_id: number;
    job_title: string;
    job_description: string;
    job_budget: number;
    job_location: string;
    job_category: string;
    application_status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
    proposal_message: string;
    proposed_budget: number | null;
    estimated_duration: string | null;
    created_at: string;
    updated_at: string;
    client_name: string;
    client_img: string | null;
    client_id: number;
    payment_model?: "PROJECT" | "DAILY" | null;
    proposed_daily_rate?: number | null;
    proposed_days?: number | null;
    job_daily_rate?: number | null;
    job_duration_days?: number | null;
    negotiation_count?: number;
  };
}

interface NegotiationRound {
  negotiation_id: number;
  actor: "WORKER" | "CLIENT";
  round_number: number;
  proposed_budget: number;
  proposed_daily_rate: number | null;
  proposed_days: number | null;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";
  created_at: string;
}

interface NegotiationThreadResponse {
  success: boolean;
  application_id: number;
  negotiation_count: number;
  max_proposals: number;
  proposals_remaining: number;
  thread: NegotiationRound[];
}

// ===== HELPER FUNCTIONS =====

const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return {
        bg: Colors.successLight,
        text: Colors.success,
        icon: "checkmark-circle" as const,
        label: "Accepted",
      };
    case "REJECTED":
      return {
        bg: Colors.errorLight,
        text: Colors.error,
        icon: "close-circle" as const,
        label: "Rejected",
      };
    case "WITHDRAWN":
      return {
        bg: Colors.backgroundSecondary,
        text: Colors.textSecondary,
        icon: "arrow-back-circle" as const,
        label: "Withdrawn",
      };
    case "PENDING":
    default:
      return {
        bg: Colors.warningLight,
        text: Colors.warning,
        icon: "time" as const,
        label: "Pending",
      };
  }
};

const getRoundStatusColor = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return Colors.success;
    case "REJECTED":
      return Colors.error;
    case "COUNTERED":
      return Colors.warning;
    default:
      return Colors.textSecondary;
  }
};

// ===== MAIN COMPONENT =====

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();

  // Propose modal state
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeAmount, setProposeAmount] = useState("");
  const [proposeDailyRate, setProposeDailyRate] = useState("");
  const [proposeDays, setProposeDays] = useState("");
  const [proposeMessage, setProposeMessage] = useState("");

  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  // Fetch application detail
  const {
    data: application,
    isLoading,
    error,
  } = useQuery<ApplicationDetail>({
    queryKey: ["application-detail", id],
    queryFn: async () => {
      const response = await apiRequest(
        ENDPOINTS.APPLICATION_DETAIL(Number(id))
      );
      if (!response.ok) {
        throw new Error("Failed to fetch application details");
      }

      const raw =
        (await response.json()) as MobileApplicationDetailResponse;

      if (!raw?.application) {
        throw new Error("Invalid application details response");
      }

      const mapped: ApplicationDetail = {
        id: raw.application.application_id,
        jobId: raw.application.job_id,
        jobTitle: raw.application.job_title,
        jobCategory: raw.application.job_category,
        jobBudget: Number(raw.application.job_budget ?? 0),
        jobDescription: raw.application.job_description || "",
        jobLocation: raw.application.job_location || "",
        proposedBudget: Number(raw.application.proposed_budget ?? 0),
        proposalMessage: raw.application.proposal_message || "",
        estimatedDuration: raw.application.estimated_duration,
        status: raw.application.application_status,
        appliedAt: raw.application.created_at,
        respondedAt: raw.application.updated_at || null,
        paymentModel: raw.application.payment_model ?? null,
        proposedDailyRate: raw.application.proposed_daily_rate ?? null,
        proposedDays: raw.application.proposed_days ?? null,
        jobDailyRate: raw.application.job_daily_rate ?? null,
        jobDurationDays: raw.application.job_duration_days ?? null,
        negotiationCount: raw.application.negotiation_count ?? 0,
        client: {
          id: raw.application.client_id,
          name: raw.application.client_name || "Client",
          email: "",
          avatar: raw.application.client_img || null,
        },
        timeline: [
          {
            id: 1,
            action: "Application Submitted",
            timestamp: raw.application.created_at,
            description: "You submitted your application for this job.",
          },
          {
            id: 2,
            action: `Status: ${raw.application.application_status}`,
            timestamp: raw.application.updated_at || raw.application.created_at,
            description: "Current application status.",
          },
        ],
      };

      return mapped;
    },
    enabled: !!id,
  });

  // Fetch negotiation thread (only when app is loaded and has negotiations)
  const {
    data: negotiationData,
    isLoading: negotiationLoading,
  } = useQuery<NegotiationThreadResponse>({
    queryKey: ["negotiation-thread", id],
    queryFn: async () => {
      const response = await apiRequest(
        ENDPOINTS.NEGOTIATION_THREAD(Number(id))
      );
      if (!response.ok) {
        throw new Error("Failed to fetch negotiation thread");
      }
      return response.json() as Promise<NegotiationThreadResponse>;
    },
    enabled: !!id && !!application && application.negotiationCount > 0,
  });

  // Withdraw application mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        ENDPOINTS.WITHDRAW_APPLICATION(Number(id)),
        { method: "DELETE" }
      );
      if (!response.ok) {
        const err = await response.json() as { message?: string };
        throw new Error(err.message || "Failed to withdraw application");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] });

      Alert.alert("Success", "Application withdrawn successfully", [
        {
          text: "OK",
          onPress: () => safeGoBack(router, "/(tabs)/jobs"),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Worker propose mutation
  const proposeMutation = useMutation({
    mutationFn: async (payload: {
      proposed_budget?: number;
      proposed_daily_rate?: number;
      proposed_days?: number;
      message: string;
    }) => {
      const response = await apiRequest(
        ENDPOINTS.NEGOTIATION_PROPOSE(Number(id)),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error || "Failed to submit proposal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["negotiation-thread", id] });
      setShowProposeModal(false);
      setProposeAmount("");
      setProposeDailyRate("");
      setProposeDays("");
      setProposeMessage("");
      Alert.alert("Success", "Your proposal has been submitted!");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Worker accept-counter mutation
  const acceptCounterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        ENDPOINTS.NEGOTIATION_ACCEPT_COUNTER(Number(id)),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error || "Failed to accept counter-offer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["negotiation-thread", id] });
      Alert.alert("Success", "You have accepted the client's counter-offer!");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleWithdraw = () => {
    setShowWithdrawConfirm(true);
  };

  const handleSubmitProposal = () => {
    if (!proposeMessage.trim()) {
      Alert.alert("Error", "Please enter a message with your proposal");
      return;
    }

    const isDaily = application?.paymentModel === "DAILY";

    if (isDaily) {
      const rate = parseFloat(proposeDailyRate);
      const days = parseInt(proposeDays);
      if (!rate || rate <= 0) {
        Alert.alert("Error", "Please enter a valid daily rate");
        return;
      }
      if (!days || days <= 0) {
        Alert.alert("Error", "Please enter a valid number of days");
        return;
      }
      proposeMutation.mutate({
        proposed_daily_rate: rate,
        proposed_days: days,
        proposed_budget: rate * days,
        message: proposeMessage.trim(),
      });
    } else {
      const amount = parseFloat(proposeAmount);
      if (!amount || amount <= 0) {
        Alert.alert("Error", "Please enter a valid proposed amount");
        return;
      }
      proposeMutation.mutate({
        proposed_budget: amount,
        message: proposeMessage.trim(),
      });
    }
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading application details...</Text>
      </View>
    );
  }

  // ===== ERROR STATE =====
  if (error || !application) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load application</Text>
        <Pressable style={styles.backButton} onPress={() => safeGoBack(router, "/(tabs)/jobs")}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusStyle = getStatusStyle(application.status);
  const canWithdraw = application.status === "PENDING";
  const isDaily = application.paymentModel === "DAILY";

  // Derive negotiation state
  const thread = negotiationData?.thread ?? [];
  const proposalsRemaining = negotiationData?.proposals_remaining ?? 0;
  const lastRound = thread.length > 0 ? thread[thread.length - 1] : null;
  const clientCountered =
    lastRound?.actor === "CLIENT" && lastRound?.status === "PENDING";
  const awaitingClientResponse =
    lastRound?.actor === "WORKER" && lastRound?.status === "PENDING";
  const proposalsExhausted = proposalsRemaining === 0 && application.negotiationCount > 0;
  const canPropose =
    application.status === "PENDING" &&
    !awaitingClientResponse &&
    !clientCountered &&
    !proposalsExhausted;

  // ===== MAIN CONTENT =====
  return (
    <View style={styles.container}>
      {/* Header with Status */}
      <View style={styles.header}>
        <Pressable style={styles.backIcon} onPress={() => safeGoBack(router, "/(tabs)/jobs")}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View
          style={[styles.statusBadgeLarge, { backgroundColor: statusStyle.bg }]}
        >
          <Ionicons
            name={statusStyle.icon}
            size={24}
            color={statusStyle.text}
          />
          <Text style={[styles.statusTextLarge, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Information</Text>
          <View style={styles.card}>
            <Text style={styles.jobTitle}>{application.jobTitle}</Text>
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText}>{application.jobCategory}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.metaText}>{application.jobLocation}</Text>
              </View>
            </View>
            <Text style={styles.jobDescription}>
              {application.jobDescription}
            </Text>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Job Budget:</Text>
              {isDaily && application.jobDailyRate && application.jobDurationDays ? (
                <Text style={styles.budgetValue}>
                  {formatCurrency(application.jobDailyRate)}/day × {application.jobDurationDays} days
                </Text>
              ) : (
                <Text style={styles.budgetValue}>
                  {formatCurrency(application.jobBudget)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Your Application */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Application</Text>
          <View style={styles.card}>
            <View style={styles.proposalRow}>
              <Text style={styles.proposalLabel}>Your Proposal:</Text>
              {isDaily && application.proposedDailyRate && application.proposedDays ? (
                <Text style={styles.proposalValue}>
                  {formatCurrency(application.proposedDailyRate)}/day × {application.proposedDays} days
                </Text>
              ) : (
                <Text style={styles.proposalValue}>
                  {formatCurrency(application.proposedBudget)}
                </Text>
              )}
            </View>
            {application.estimatedDuration && (
              <View style={styles.durationRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.durationText}>
                  {application.estimatedDuration}
                </Text>
              </View>
            )}
            <Text style={styles.proposalMessage}>
              {application.proposalMessage}
            </Text>
            <View style={styles.appliedInfo}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.appliedText}>
                Applied {formatTimeAgo(application.appliedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Negotiation Section */}
        {application.negotiationCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Negotiation</Text>

            {/* Proposals remaining banner */}
            {application.status === "PENDING" && (
              <View style={[
                styles.negotiationBanner,
                proposalsExhausted
                  ? styles.negotiationBannerWarning
                  : styles.negotiationBannerInfo,
              ]}>
                <Ionicons
                  name={proposalsExhausted ? "warning-outline" : "information-circle-outline"}
                  size={16}
                  color={proposalsExhausted ? Colors.warning : Colors.primary}
                />
                <Text style={[
                  styles.negotiationBannerText,
                  { color: proposalsExhausted ? Colors.warning : Colors.primary },
                ]}>
                  {proposalsExhausted
                    ? "No more proposals allowed. Accept original price or withdraw."
                    : `${proposalsRemaining} proposal${proposalsRemaining !== 1 ? "s" : ""} remaining`}
                </Text>
              </View>
            )}

            {/* Awaiting response banner */}
            {awaitingClientResponse && (
              <View style={styles.awaitingBanner}>
                <ActivityIndicator size="small" color={Colors.warning} />
                <Text style={styles.awaitingText}>
                  Awaiting client response...
                </Text>
              </View>
            )}

            {/* Thread */}
            {negotiationLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.md }} />
            ) : (
              <View style={styles.card}>
                {thread.map((round, index) => (
                  <View
                    key={round.negotiation_id}
                    style={[
                      styles.negotiationRound,
                      index < thread.length - 1 && styles.negotiationRoundBorder,
                    ]}
                  >
                    <View style={styles.roundHeader}>
                      <View style={styles.roundActorBadge}>
                        <Ionicons
                          name={round.actor === "WORKER" ? "person" : "business"}
                          size={12}
                          color={round.actor === "WORKER" ? Colors.primary : Colors.warning}
                        />
                        <Text style={[
                          styles.roundActorText,
                          { color: round.actor === "WORKER" ? Colors.primary : Colors.warning },
                        ]}>
                          {round.actor === "WORKER" ? "You" : "Client"}
                        </Text>
                      </View>
                      <Text style={styles.roundTime}>
                        {formatTimeAgo(round.created_at)}
                      </Text>
                    </View>

                    <View style={styles.roundPriceRow}>
                      {isDaily && round.proposed_daily_rate && round.proposed_days ? (
                        <Text style={styles.roundPrice}>
                          {formatCurrency(round.proposed_daily_rate)}/day × {round.proposed_days} days
                          {" = "}{formatCurrency(round.proposed_budget)}
                        </Text>
                      ) : (
                        <Text style={styles.roundPrice}>
                          {formatCurrency(round.proposed_budget)}
                        </Text>
                      )}
                      <Text style={[
                        styles.roundStatus,
                        { color: getRoundStatusColor(round.status) },
                      ]}>
                        {round.status}
                      </Text>
                    </View>

                    {round.message ? (
                      <Text style={styles.roundMessage}>{round.message}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {/* Client countered — action buttons */}
            {clientCountered && lastRound && (
              <View style={styles.counterActionCard}>
                <Text style={styles.counterActionTitle}>
                  Client's Counter-Offer
                </Text>
                <Text style={styles.counterActionPrice}>
                  {isDaily && lastRound.proposed_daily_rate && lastRound.proposed_days
                    ? `${formatCurrency(lastRound.proposed_daily_rate)}/day × ${lastRound.proposed_days} days`
                    : formatCurrency(lastRound.proposed_budget)}
                </Text>

                <Pressable
                  style={[
                    styles.acceptCounterButton,
                    acceptCounterMutation.isPending && styles.buttonDisabled,
                  ]}
                  onPress={() => acceptCounterMutation.mutate()}
                  disabled={acceptCounterMutation.isPending}
                >
                  {acceptCounterMutation.isPending ? (
                    <ActivityIndicator size="small" color={Colors.textLight} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.textLight} />
                      <Text style={styles.acceptCounterButtonText}>Accept Counter-Offer</Text>
                    </>
                  )}
                </Pressable>

                {!proposalsExhausted && (
                  <Pressable
                    style={styles.reproposButton}
                    onPress={() => setShowProposeModal(true)}
                  >
                    <Ionicons name="refresh" size={18} color={Colors.primary} />
                    <Text style={styles.reproposButtonText}>Re-Propose</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Worker can propose */}
            {canPropose && application.status === "PENDING" && (
              <Pressable
                style={styles.proposeButton}
                onPress={() => setShowProposeModal(true)}
              >
                <Ionicons name="cash-outline" size={18} color={Colors.textLight} />
                <Text style={styles.proposeButtonText}>
                  {application.negotiationCount === 0 ? "Propose Price" : "Re-Propose"}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.card}>
            <View style={styles.clientRow}>
              <View style={styles.clientAvatar}>
                <Ionicons
                  name={application.client.avatar ? "person" : "person-outline"}
                  size={24}
                  color={Colors.textSecondary}
                />
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{application.client.name}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        {application.timeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.card}>
              {application.timeline.map((event, index) => (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <View style={styles.dotInner} />
                  </View>
                  {index < application.timeline.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineAction}>{event.action}</Text>
                    <Text style={styles.timelineDescription}>
                      {event.description}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatTimeAgo(event.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Pressable
            style={styles.viewJobButton}
            onPress={() => router.push(`/jobs/${application.jobId}` as any)}
          >
            <Ionicons name="eye-outline" size={20} color={Colors.primary} />
            <Text style={styles.viewJobButtonText}>View Job</Text>
          </Pressable>

          {application.status === "ACCEPTED" && (
            <Pressable
              style={styles.contactButton}
              onPress={() => router.push(`/conversation/new?targetId=${application.client.id}` as any)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={Colors.textLight}
              />
              <Text style={styles.contactButtonText}>Contact Client</Text>
            </Pressable>
          )}

          {canWithdraw && (
            <Pressable
              style={[
                styles.withdrawButton,
                withdrawMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <>
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color={Colors.error}
                  />
                  <Text style={styles.withdrawButtonText}>
                    Withdraw Application
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Propose Modal */}
      <Modal
        visible={showProposeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProposeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Price Proposal</Text>
              <Pressable onPress={() => setShowProposeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {isDaily ? (
              <>
                <Text style={styles.modalLabel}>Daily Rate (₱)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 800"
                  value={proposeDailyRate}
                  onChangeText={setProposeDailyRate}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textHint}
                />
                <Text style={styles.modalLabel}>Number of Days</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 5"
                  value={proposeDays}
                  onChangeText={setProposeDays}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textHint}
                />
                {proposeDailyRate && proposeDays && parseFloat(proposeDailyRate) > 0 && parseInt(proposeDays) > 0 && (
                  <Text style={styles.modalTotal}>
                    Total: {formatCurrency(parseFloat(proposeDailyRate) * parseInt(proposeDays))}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.modalLabel}>Proposed Amount (₱)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 2500"
                  value={proposeAmount}
                  onChangeText={setProposeAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textHint}
                />
              </>
            )}

            <Text style={styles.modalLabel}>Message</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Explain your proposed price..."
              value={proposeMessage}
              onChangeText={setProposeMessage}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.textHint}
            />

            <Pressable
              style={[
                styles.modalSubmitButton,
                proposeMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleSubmitProposal}
              disabled={proposeMutation.isPending}
            >
              {proposeMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Text style={styles.modalSubmitText}>Submit Proposal</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <CountdownConfirmModal
        visible={showWithdrawConfirm}
        title="Withdraw Application"
        message="Are you sure you want to withdraw this application? This action cannot be undone."
        confirmLabel="Withdraw"
        confirmStyle="destructive"
        countdownSeconds={5}
        onConfirm={() => {
          setShowWithdrawConfirm(false);
          withdrawMutation.mutate();
        }}
        onCancel={() => setShowWithdrawConfirm(false)}
        icon="close-circle"
        iconColor={Colors.error}
      />
    </View>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body.large,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  backButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backIcon: {
    padding: Spacing.xs,
  },
  statusBadgeLarge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.large,
  },
  statusTextLarge: {
    ...Typography.heading.h4,
    fontWeight: "600",
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },

  // Job Info
  jobTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  jobMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  jobDescription: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  budgetLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  budgetValue: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    fontWeight: "bold",
  },

  // Proposal
  proposalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  proposalLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
  },
  proposalValue: {
    ...Typography.heading.h3,
    color: Colors.primary,
    fontWeight: "bold",
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  durationText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  proposalMessage: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  appliedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  appliedText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Negotiation
  negotiationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  negotiationBannerInfo: {
    backgroundColor: Colors.primaryLight,
  },
  negotiationBannerWarning: {
    backgroundColor: Colors.warningLight,
  },
  negotiationBannerText: {
    ...Typography.body.small,
    fontWeight: "600",
  },
  awaitingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  awaitingText: {
    ...Typography.body.small,
    color: Colors.warning,
    fontWeight: "600",
  },
  negotiationRound: {
    paddingVertical: Spacing.sm,
  },
  negotiationRoundBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  roundHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  roundActorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roundActorText: {
    ...Typography.body.small,
    fontWeight: "700",
  },
  roundTime: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  roundPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  roundPrice: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  roundStatus: {
    ...Typography.body.small,
    fontWeight: "600",
    fontSize: 11,
  },
  roundMessage: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  counterActionCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  counterActionTitle: {
    ...Typography.body.medium,
    color: Colors.warning,
    fontWeight: "700",
  },
  counterActionPrice: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    fontWeight: "bold",
  },
  acceptCounterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.large,
  },
  acceptCounterButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },
  reproposButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reproposButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
  proposeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    marginTop: Spacing.sm,
  },
  proposeButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },

  // Client
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...Typography.body.large,
    color: Colors.textPrimary,
    fontWeight: "600",
  },

  // Timeline
  timelineItem: {
    flexDirection: "row",
    paddingBottom: Spacing.md,
    position: "relative",
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    zIndex: 1,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    position: "absolute",
    left: 11,
    top: 24,
    width: 2,
    height: "100%",
    backgroundColor: Colors.border,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineAction: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  timelineDescription: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timelineTime: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    fontSize: 12,
  },

  // Actions
  actionsSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  viewJobButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.large,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  viewJobButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
  },
  contactButtonText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  withdrawButtonText: {
    ...Typography.body.medium,
    color: Colors.error,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
  modalLabel: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Typography.body.medium,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalTotal: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "700",
  },
  modalSubmitButton: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  modalSubmitText: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },
});

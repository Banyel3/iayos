import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius } from "@/constants/theme";
import { ENDPOINTS, apiRequest, getAbsoluteMediaUrl } from "@/lib/api/config";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BackjobDetail {
  has_backjob: boolean;
  dispute: {
    dispute_id: number;
    reason: string;
    description: string;
    status: string;
    priority: string;
    opened_date: string | null;
    resolution: string | null;
    resolved_date: string | null;
    scheduled_date: string | null;
    evidence_images: string[];
    backjob_started: boolean;
    worker_marked_complete: boolean;
    client_confirmed: boolean;
    worker_schedule_confirmed: boolean;
    worker_schedule_confirmed_at: string | null;
    admin_rejected_at: string | null;
    admin_rejection_reason: string | null;
  } | null;
}

interface JobInfo {
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  category: string;
  client: {
    id: number;
    name: string;
    avatar: string | null;
  } | null;
}

export default function BackjobDetailScreen() {
  const params = useLocalSearchParams();
  const disputeId = params.disputeId as string;
  const jobId = params.jobId as string;

  const [backjob, setBackjob] = useState<BackjobDetail | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Expansion state
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  useEffect(() => {
    fetchBackjobDetails();
  }, [jobId]);

  const fetchBackjobDetails = async () => {
    setIsLoading(true);
    try {
      if (__DEV__) console.log(`[BackjobDetail] Fetching backjob status for jobId: ${jobId}`);

      // Fetch backjob status
      const backjobResponse = await apiRequest(
        ENDPOINTS.BACKJOB_STATUS(parseInt(jobId))
      );

      if (backjobResponse.status === 404) {
        if (__DEV__) console.warn(`[BackjobDetail] Backjob 404 Not Found for jobId: ${jobId}`);
        setBackjob({ has_backjob: false, dispute: null });
      } else if (backjobResponse.ok) {
        const result = (await backjobResponse.json()) as any;
        const data = (result.data || result) as BackjobDetail;

        if (__DEV__) console.log(`[BackjobDetail] Backjob status loaded:`, data.has_backjob);

        // Process absolute URLs for evidence images
        if (data.dispute?.evidence_images) {
          data.dispute.evidence_images = data.dispute.evidence_images.map(img =>
            getAbsoluteMediaUrl(img)
          ) as string[];
        }

        setBackjob(data);
      } else {
        console.error(`[BackjobDetail] Backjob status fetch failed: ${backjobResponse.status}`);
      }

      // Fetch job details
      if (__DEV__) console.log(`[BackjobDetail] Fetching job details for jobId: ${jobId}`);
      const jobResponse = await apiRequest(
        ENDPOINTS.JOB_DETAILS(parseInt(jobId))
      );

      if (jobResponse.ok) {
        const result = (await jobResponse.json()) as any;
        const jobData = result.data || result;

        if (__DEV__) console.log(`[BackjobDetail] Job details loaded: ${jobData.title}`);

        setJob({
          id: jobData.id || jobData.jobID,
          title: jobData.title,
          description: jobData.description,
          budget: jobData.budget,
          location: jobData.location,
          category: jobData.category?.name || jobData.category || "General",
          client: jobData.client
            ? {
              ...jobData.client,
              avatar: getAbsoluteMediaUrl(jobData.client.avatar),
            }
            : null,
        });
      } else {
        console.error(`[BackjobDetail] Job details fetch failed: ${jobResponse.status}`);
      }
    } catch (error) {
      console.error("[BackjobDetail] Error fetching backjob details:", error);
      // Alert.alert("Error", "Failed to load backjob details");
    } finally {
      setIsLoading(false);
    }
  };


  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "OPEN":
        return { label: "Pending Review", color: Colors.info, icon: "time" };
      case "UNDER_REVIEW":
        return {
          label: "Action Required",
          color: Colors.warning,
          icon: "alert-circle",
        };
      case "RESOLVED":
        return {
          label: "Completed",
          color: Colors.success,
          icon: "checkmark-circle",
        };
      case "CLOSED":
        return {
          label: "Closed",
          color: Colors.textSecondary,
          icon: "close-circle",
        };
      default:
        return {
          label: status,
          color: Colors.textSecondary,
          icon: "help-circle",
        };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return { label: "Critical", color: Colors.error };
      case "HIGH":
        return { label: "High Priority", color: Colors.error };
      case "MEDIUM":
        return { label: "Medium Priority", color: Colors.warning };
      default:
        return { label: "Low Priority", color: Colors.textSecondary };
    }
  };

  const formatDate = (dateStr: string | null, includeTime: boolean = true) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return date.toLocaleDateString("en-US", options);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading backjob details...</Text>
      </View>
    );
  }

  if (!backjob?.has_backjob || !backjob.dispute) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Backjob Not Found</Text>
        <Text style={styles.errorText}>
          The backjob you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          style={styles.backButtonLarge}
          onPress={() => safeGoBack(router, "/(tabs)/jobs")}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dispute = backjob.dispute;
  const statusInfo = getStatusInfo(dispute.status);
  const priorityInfo = getPriorityInfo(dispute.priority);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => safeGoBack(router, "/(tabs)/jobs")}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backjob Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SECTION: BACKJOB OVERVIEW */}
        <View style={[styles.mainSection, !isDetailsExpanded && { paddingBottom: 12 }]}>
          <TouchableOpacity
            style={[
              styles.mainSectionHeader,
              !isDetailsExpanded && { marginBottom: 0 }
            ]}
            onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
              <Text style={styles.mainSectionTitle}>Details</Text>
            </View>
            <Ionicons
              name={isDetailsExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {isDetailsExpanded && (
            <>
              <View style={styles.sectionDivider} />

              {/* Job Info */}
              {job && (
                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>Related Job</Text>
                  <View style={styles.jobCard}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={styles.jobMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="cash-outline"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.metaText}>
                          ₱{job.budget?.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="pricetag-outline"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.metaText}>{job.category}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {job.location}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Client Info */}
              {job?.client && (
                <View style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>Client</Text>
                  <View style={styles.clientCard}>
                    {job.client.avatar ? (
                      <Image
                        source={{ uri: job.client.avatar }}
                        style={styles.clientAvatar}
                      />
                    ) : (
                      <View style={[styles.clientAvatar, styles.avatarPlaceholder]}>
                        <Ionicons
                          name="person"
                          size={24}
                          color={Colors.textSecondary}
                        />
                      </View>
                    )}
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{job.client.name}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Backjob Reason */}
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Reason for Backjob</Text>
                <View style={styles.infoCard}>
                  <Text style={styles.reason}>{dispute.reason}</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Detailed Description</Text>
                <View style={styles.infoCard}>
                  <Text style={styles.description}>{dispute.description}</Text>
                </View>
              </View>

              {/* Evidence Images */}
              {dispute.evidence_images && dispute.evidence_images.length > 0 && (
                <View style={[styles.subSection, { marginBottom: 0 }]}>
                  <Text style={styles.subSectionTitle}>
                    Evidence Photos ({dispute.evidence_images.length})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.evidenceScroll}
                  >
                    {dispute.evidence_images.map((uri, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.evidenceImageContainer}
                        onPress={() => openImageViewer(index)}
                      >
                        <Image source={{ uri }} style={styles.evidenceImage} />
                        <View style={styles.imageOverlay}>
                          <Ionicons name="expand" size={20} color="#FFF" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>

        {/* SECTION: STATUS & UPDATES */}
        <View style={styles.mainSection}>
          <View style={[styles.mainSectionHeader, { marginBottom: 12 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
              <Text style={styles.mainSectionTitle}>Status</Text>
            </View>
          </View>

          <>
            <View style={styles.sectionDivider} />


            {/* Timeline */}
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Timeline</Text>
              <View style={styles.timeline}>
                {/* 1. Completed (Newest) */}
                {dispute.status === "RESOLVED" && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineLineContainer}>
                      <View style={[styles.timelineDot, { backgroundColor: Colors.success }]} />
                      <View style={styles.timelineConnector} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Completed</Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(dispute.resolved_date)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* 2. Worker Marked Complete */}
                {dispute.worker_marked_complete && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineLineContainer}>
                      <View style={[
                        styles.timelineDot,
                        { backgroundColor: Colors.success, borderColor: Colors.success },
                        dispute.status === "RESOLVED" && { backgroundColor: Colors.textSecondary, borderColor: Colors.textSecondary }
                      ]} />
                      <View style={styles.timelineConnector} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineLabel, dispute.status === "RESOLVED" && styles.timelineDoneText]}>
                        Worker Marked Complete
                      </Text>
                      <Text style={[styles.timelineDate, dispute.status === "RESOLVED" && styles.timelineDoneText]}>
                        Waiting for client approval
                      </Text>
                    </View>
                  </View>
                )}

                {/* 3. Work Started */}
                {dispute.backjob_started && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineLineContainer}>
                      <View style={[
                        styles.timelineDot,
                        { backgroundColor: Colors.info, borderColor: Colors.info },
                        (dispute.status === "RESOLVED" || dispute.worker_marked_complete) && { backgroundColor: Colors.textSecondary, borderColor: Colors.textSecondary }
                      ]} />
                      <View style={styles.timelineConnector} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineLabel, (dispute.status === "RESOLVED" || dispute.worker_marked_complete) && styles.timelineDoneText]}>
                        Backjob Work Started
                      </Text>
                      <Text style={[styles.timelineDate, (dispute.status === "RESOLVED" || dispute.worker_marked_complete) && styles.timelineDoneText]}>
                        Worker has begun working on the backjob
                      </Text>
                    </View>
                  </View>
                )}

                {/* 4. Scheduled Date / Worker Confirmed Schedule */}
                {dispute.scheduled_date && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineLineContainer}>
                      <View style={[
                        styles.timelineDot,
                        { backgroundColor: dispute.worker_schedule_confirmed ? Colors.success : Colors.warning, borderColor: dispute.worker_schedule_confirmed ? Colors.success : Colors.warning },
                        (dispute.status === "RESOLVED" || dispute.backjob_started) && { backgroundColor: Colors.textSecondary, borderColor: Colors.textSecondary }
                      ]} />
                      <View style={styles.timelineConnector} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineLabel, (dispute.status === "RESOLVED" || dispute.backjob_started) && styles.timelineDoneText]}>
                        {dispute.worker_schedule_confirmed ? "Worker Confirmed Schedule" : "⏳ Pending Negotiation"}
                      </Text>
                      <Text style={[styles.timelineDate, (dispute.status === "RESOLVED" || dispute.backjob_started) ? styles.timelineDoneText : (dispute.worker_schedule_confirmed ? { color: Colors.textPrimary } : { color: Colors.warning })]}>
                        📅 {formatDate(dispute.scheduled_date, false)}
                      </Text>
                      {dispute.worker_schedule_confirmed && dispute.worker_schedule_confirmed_at && (
                        <Text style={[styles.timelineSubText, (dispute.status === "RESOLVED" || dispute.backjob_started) && styles.timelineDoneText]}>
                          Confirmed on {formatDate(dispute.worker_schedule_confirmed_at)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* 6. Admin Reviewed / Pending Admin Banner */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineLineContainer}>
                    <View style={[
                      styles.timelineDot,
                      { backgroundColor: dispute.status === "OPEN" ? Colors.warning : (dispute.admin_rejected_at ? Colors.error : Colors.textSecondary) },
                      dispute.status !== "OPEN" && { borderColor: dispute.admin_rejected_at ? Colors.error : Colors.textSecondary }
                    ]} />
                    <View style={styles.timelineConnector} />
                  </View>
                  <View style={styles.timelineContent}>
                    {dispute.status === "OPEN" ? (
                      <View style={styles.pendingAdminBanner}>
                        <View style={styles.pendingAdminBannerHeader}>
                          <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
                          <Text style={styles.pendingAdminBannerTitle}>Admin Review Pending</Text>
                        </View>
                        <Text style={styles.pendingAdminBannerText}>
                          Waiting for admin to approve backjob request. You will be notified once work is approved.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={[
                          styles.timelineLabel,
                          styles.timelineDoneText,
                          dispute.admin_rejected_at && { color: Colors.error }
                        ]}>
                          Admin Reviewed: {dispute.admin_rejected_at ? "Denied" : "Approved"}
                        </Text>
                        <Text style={[styles.timelineDate, styles.timelineDoneText]}>
                          {dispute.admin_rejection_reason || (dispute.admin_rejected_at ? "Backjob request was denied by admin" : "Backjob request has been approved by admin")}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* 7. Requested (Oldest) */}
                <View style={[styles.timelineItem, { marginBottom: 0 }]}>
                  <View style={styles.timelineLineContainer}>
                    <View style={[styles.timelineDot, { backgroundColor: Colors.textSecondary, borderColor: Colors.textSecondary }]} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineLabel, styles.timelineDoneText]}>Requested</Text>
                    <Text style={[styles.timelineDate, styles.timelineDoneText]}>
                      {formatDate(dispute.opened_date)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Resolution */}
            {dispute.resolution && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Resolution Notes</Text>
                <View
                  style={[
                    styles.infoCard,
                    { backgroundColor: `${Colors.success}10` },
                  ]}
                >
                  <Text style={styles.resolution}>{dispute.resolution}</Text>
                </View>
              </View>
            )}
          </>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal visible={imageViewerVisible} transparent animationType="fade">
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.closeImageViewer}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.imageCounter}>
            {selectedImageIndex + 1} / {dispute.evidence_images?.length || 0}
          </Text>
          {dispute.evidence_images &&
            dispute.evidence_images[selectedImageIndex] && (
              <Image
                source={{ uri: dispute.evidence_images[selectedImageIndex] }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          <View style={styles.imageNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
              }
              disabled={selectedImageIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={selectedImageIndex === 0 ? "#666" : "#FFF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                setSelectedImageIndex(
                  Math.min(
                    (dispute.evidence_images?.length || 1) - 1,
                    selectedImageIndex + 1
                  )
                )
              }
              disabled={
                selectedImageIndex ===
                (dispute.evidence_images?.length || 1) - 1
              }
            >
              <Ionicons
                name="chevron-forward"
                size={28}
                color={
                  selectedImageIndex ===
                    (dispute.evidence_images?.length || 1) - 1
                    ? "#666"
                    : "#FFF"
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  backButtonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mainSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  mainSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
    opacity: 0.5,
  },
  subSection: {
    marginBottom: 24,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pendingAdminBanner: {
    backgroundColor: `${Colors.warning}10`,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
  },
  pendingAdminBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  pendingAdminBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.warning,
  },
  pendingAdminBannerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  jobCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  jobMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  clientInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reason: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  resolution: {
    fontSize: 14,
    color: Colors.success,
    lineHeight: 22,
  },
  evidenceScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  evidenceImageContainer: {
    width: 140,
    height: 105,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
  },
  evidenceImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  timeline: {
    paddingTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
    minHeight: 60,
  },
  timelineLineContainer: {
    alignItems: "center",
    width: 20,
    marginRight: 12,
    alignSelf: "stretch",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timelineConnector: {
    position: "absolute",
    top: 12,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.border,
    zIndex: 1,
    left: 9, // Centered in 20px container
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  timelineDoneText: {
    color: Colors.textSecondary,
    opacity: 0.7,
  },
  timelineSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeImageViewer: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageCounter: {
    position: "absolute",
    top: 68,
    left: 20,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  imageNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    position: "absolute",
    bottom: 100,
  },
  navButton: {
    padding: 12,
  },
});

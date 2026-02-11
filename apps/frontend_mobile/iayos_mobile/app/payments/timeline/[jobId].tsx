import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../../constants/theme";
import { usePaymentTimeline } from "../../../lib/hooks/useFinalPayment";
import { format, formatDistanceToNow } from "date-fns";

export default function PaymentTimelineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = parseInt(params.jobId as string);

  const {
    data: timeline,
    isLoading,
    error,
    refetch,
  } = usePaymentTimeline(jobId);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "escrow_created":
        return { name: "shield-checkmark" as const, color: Colors.primary };
      case "escrow_paid":
        return { name: "checkmark-circle" as const, color: Colors.success };
      case "job_started":
        return { name: "play-circle" as const, color: Colors.primary };
      case "job_completed":
        return { name: "flag" as const, color: Colors.success };
      case "final_payment_created":
        return { name: "wallet" as const, color: Colors.primary };
      case "final_payment_paid":
        return {
          name: "checkmark-done-circle" as const,
          color: Colors.success,
        };
      case "payment_released":
        return { name: "send" as const, color: Colors.success };
      case "payment_failed":
        return { name: "close-circle" as const, color: Colors.error };
      case "payment_refunded":
        return { name: "return-up-back" as const, color: Colors.warning };
      default:
        return { name: "ellipse" as const, color: Colors.textSecondary };
    }
  };

  const getEventTitle = (eventType: string) => {
    switch (eventType) {
      case "escrow_created":
        return "Escrow Payment Created";
      case "escrow_paid":
        return "Escrow Payment Received";
      case "job_started":
        return "Job Started";
      case "job_completed":
        return "Job Completed";
      case "final_payment_created":
        return "Final Payment Initiated";
      case "final_payment_paid":
        return "Final Payment Received";
      case "payment_released":
        return "Funds Released to Worker";
      case "payment_failed":
        return "Payment Failed";
      case "payment_refunded":
        return "Payment Refunded";
      default:
        return "Payment Event";
    }
  };

  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return null;
    return `₱${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Payment Timeline",
            headerShown: true,
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading timeline...</Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Payment Timeline",
            headerShown: true,
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Failed to load timeline</Text>
          <Text style={styles.errorText}>Please try again later</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Payment Timeline",
          headerShown: true,
          headerBackTitle: "Back",
          headerTitleStyle: { fontSize: 18, fontWeight: "600" },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="time-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Payment History</Text>
          <Text style={styles.headerSubtitle}>
            {timeline?.events.length || 0} events recorded
          </Text>
        </View>

        {/* Total Summary Card */}
        {timeline && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Escrow Paid</Text>
                <Text style={styles.summaryValue}>
                  {formatAmount(timeline.totalEscrow) || "—"}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Final Paid</Text>
                <Text style={styles.summaryValue}>
                  {formatAmount(timeline.totalFinal) || "—"}
                </Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total Paid</Text>
              <Text style={styles.summaryTotalValue}>
                {formatAmount(timeline.totalAmount)}
              </Text>
            </View>
          </View>
        )}

        {/* Timeline Events */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Timeline</Text>

          {timeline?.events.map((event: any, index: number) => {
            const icon = getEventIcon(event.eventType);
            const isLast = index === timeline.events.length - 1;

            return (
              <View key={event.id} style={styles.timelineItemContainer}>
                {/* Timeline Dot & Line */}
                <View style={styles.timelineIndicator}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: icon.color },
                    ]}
                  >
                    <Ionicons name={icon.name} size={20} color="#fff" />
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                {/* Event Content */}
                <View
                  style={[
                    styles.timelineContent,
                    isLast && styles.timelineContentLast,
                  ]}
                >
                  <View style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>
                        {getEventTitle(event.eventType)}
                      </Text>
                      <Text style={styles.eventTime}>
                        {formatDistanceToNow(new Date(event.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </View>

                    {event.amount && (
                      <Text style={styles.eventAmount}>
                        {formatAmount(event.amount)}
                      </Text>
                    )}

                    {event.description && (
                      <Text style={styles.eventDescription}>
                        {event.description}
                      </Text>
                    )}

                    <Text style={styles.eventDate}>
                      {format(new Date(event.createdAt), "PPpp")}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Empty State */}
          {!timeline?.events.length && (
            <View style={styles.emptyState}>
              <Ionicons
                name="time-outline"
                size={64}
                color={Colors.textLight}
              />
              <Text style={styles.emptyStateTitle}>No events yet</Text>
              <Text style={styles.emptyStateText}>
                Payment events will appear here as they occur
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => safeGoBack(router, "/(tabs)/profile")}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/" as any)}
        >
          <Text style={styles.homeButtonText}>Home</Text>
          <Ionicons name="home" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.error,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerIcon: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  timelineSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  timelineItemContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  timelineIndicator: {
    alignItems: "center",
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  timelineContent: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  timelineContentLast: {
    marginBottom: 0,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  eventAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  eventDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  eventDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  homeButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

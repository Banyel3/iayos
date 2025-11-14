import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius } from "../constants/theme";
import { format, formatDistanceToNow } from "date-fns";

export type TimelineEventType =
  | "escrow_created"
  | "escrow_paid"
  | "job_started"
  | "job_completed"
  | "final_payment_created"
  | "final_payment_paid"
  | "payment_released"
  | "payment_failed"
  | "payment_refunded";

interface PaymentTimelineItemProps {
  eventType: TimelineEventType;
  amount?: number;
  description?: string;
  createdAt: string;
  isLast?: boolean;
}

export default function PaymentTimelineItem({
  eventType,
  amount,
  description,
  createdAt,
  isLast = false,
}: PaymentTimelineItemProps) {
  const getEventConfig = (type: TimelineEventType) => {
    switch (type) {
      case "escrow_created":
        return {
          icon: "shield-checkmark" as const,
          color: Colors.primary,
          title: "Escrow Payment Created",
        };
      case "escrow_paid":
        return {
          icon: "checkmark-circle" as const,
          color: Colors.success,
          title: "Escrow Payment Received",
        };
      case "job_started":
        return {
          icon: "play-circle" as const,
          color: Colors.info,
          title: "Job Started",
        };
      case "job_completed":
        return {
          icon: "flag" as const,
          color: Colors.success,
          title: "Job Completed",
        };
      case "final_payment_created":
        return {
          icon: "wallet" as const,
          color: Colors.primary,
          title: "Final Payment Initiated",
        };
      case "final_payment_paid":
        return {
          icon: "checkmark-done-circle" as const,
          color: Colors.success,
          title: "Final Payment Received",
        };
      case "payment_released":
        return {
          icon: "send" as const,
          color: Colors.success,
          title: "Funds Released to Worker",
        };
      case "payment_failed":
        return {
          icon: "close-circle" as const,
          color: Colors.error,
          title: "Payment Failed",
        };
      case "payment_refunded":
        return {
          icon: "return-up-back" as const,
          color: Colors.warning,
          title: "Payment Refunded",
        };
      default:
        return {
          icon: "ellipse" as const,
          color: Colors.textSecondary,
          title: "Payment Event",
        };
    }
  };

  const formatAmount = (amount: number) => {
    return `₱${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const config = getEventConfig(eventType);

  return (
    <View style={styles.container}>
      {/* Timeline Indicator */}
      <View style={styles.timelineIndicator}>
        <View style={[styles.timelineDot, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={20} color="#fff" />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Event Content */}
      <View style={[styles.content, isLast && styles.contentLast]}>
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{config.title}</Text>
            <Text style={styles.eventTime}>
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </Text>
          </View>

          {amount && (
            <Text style={[styles.eventAmount, { color: config.color }]}>
              {formatAmount(amount)}
            </Text>
          )}

          {description && (
            <Text style={styles.eventDescription}>{description}</Text>
          )}

          <Text style={styles.eventDate}>
            {format(new Date(createdAt), "MMM dd, yyyy 'at' hh:mm a")}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  content: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  contentLast: {
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
});
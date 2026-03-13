import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

type JobLifecycleTimelineProps = {
  workerMarkedOnTheWay?: boolean;
  workerMarkedOnTheWayAt?: string | null;
  workerMarkedJobStarted?: boolean;
  workerMarkedJobStartedAt?: string | null;
  clientConfirmedWorkStarted?: boolean;
  clientConfirmedWorkStartedAt?: string | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Timestamp unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";
  return date.toLocaleString();
};

export function JobLifecycleTimeline({
  workerMarkedOnTheWay,
  workerMarkedOnTheWayAt,
  workerMarkedJobStarted,
  workerMarkedJobStartedAt,
  clientConfirmedWorkStarted,
  clientConfirmedWorkStartedAt,
}: JobLifecycleTimelineProps) {
  const hasAnyStep =
    workerMarkedOnTheWay ||
    workerMarkedJobStarted ||
    clientConfirmedWorkStarted;

  if (!hasAnyStep) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Work Timeline</Text>

      {workerMarkedOnTheWay && (
        <View style={styles.row}>
          <Ionicons name="navigate" size={16} color={Colors.primary} />
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Worker marked on the way</Text>
            <Text style={styles.rowMeta}>
              {formatDateTime(workerMarkedOnTheWayAt)}
            </Text>
          </View>
        </View>
      )}

      {clientConfirmedWorkStarted && (
        <View style={styles.row}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={Colors.success}
          />
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Client confirmed worker arrival</Text>
            <Text style={styles.rowMeta}>
              {formatDateTime(clientConfirmedWorkStartedAt)}
            </Text>
          </View>
        </View>
      )}

      {workerMarkedJobStarted && (
        <View style={styles.row}>
          <Ionicons name="play-circle" size={16} color={Colors.warning} />
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Worker marked job started</Text>
            <Text style={styles.rowMeta}>
              {formatDateTime(workerMarkedJobStartedAt)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 8,
  },
  title: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  textWrap: {
    flex: 1,
  },
  rowTitle: {
    ...Typography.body.small,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  rowMeta: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

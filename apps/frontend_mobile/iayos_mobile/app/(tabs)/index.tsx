import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const isWorker = user?.profile_data?.profileType === "WORKER";
  const isClient = user?.profile_data?.profileType === "CLIENT";

  const workerQuickActions = [
    {
      title: "Browse Jobs",
      icon: "briefcase-outline",
      color: Colors.primary,
      route: "/(tabs)/jobs",
    },
    {
      title: "Active Jobs",
      icon: "construct-outline",
      color: "#10B981",
      route: "/jobs/active",
    },
    {
      title: "My Applications",
      icon: "document-text-outline",
      color: "#F59E0B",
      route: "/applications",
    },
    {
      title: "My Profile",
      icon: "person-outline",
      color: "#8B5CF6",
      route: "/(tabs)/profile",
    },
  ];

  const clientQuickActions = [
    {
      title: "Post a Job",
      icon: "add-circle-outline",
      color: Colors.primary,
      route: "/post-job",
    },
    {
      title: "Active Jobs",
      icon: "construct-outline",
      color: "#10B981",
      route: "/jobs/active",
    },
    {
      title: "Browse Workers",
      icon: "people-outline",
      color: "#F59E0B",
      route: "/browse-workers",
    },
    {
      title: "My Profile",
      icon: "person-outline",
      color: "#8B5CF6",
      route: "/(tabs)/profile",
    },
  ];

  const quickActions = isWorker ? workerQuickActions : clientQuickActions;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back, {user?.profile_data?.firstName || "User"}!
            </Text>
            <Text style={styles.subtitle}>
              {isWorker
                ? "Find jobs and grow your career"
                : "Hire skilled workers for your projects"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/notifications" as any)}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={Colors.textPrimary}
            />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: action.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={32} color={Colors.primary} />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>
                {isWorker ? "Applications" : "Posted Jobs"}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={Colors.success}
              />
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={32} color={Colors.warning} />
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push("/activity" as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: Colors.primary + "20" },
                ]}
              >
                <Ionicons name="briefcase" size={20} color={Colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New job posted</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: Colors.success + "20" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.success}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Job completed</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  greeting: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  notificationButton: {
    position: "relative",
    padding: Spacing.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.circle,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  section: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionCard: {
    width: "47%",
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    ...Shadows.sm,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  actionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  activityList: {
    gap: Spacing.md,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});

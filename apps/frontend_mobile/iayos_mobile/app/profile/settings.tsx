import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import CustomBackButton from "@/components/navigation/CustomBackButton";

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerLeft: () => <CustomBackButton />,
          title: "Settings",
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
            fontSize: 18,
            color: Colors.textPrimary,
          },
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors.background,
          },
        }}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Legal & Policies</Text>
        <View style={styles.card}>
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push("/legal/privacy")}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => router.push("/legal/terms")}
          />
          <MenuItem
            icon="people-outline"
            label="Community Guidelines"
            onPress={() => router.push("/legal/community-guidelines")}
            noBorder
          />
        </View>

        <Text style={styles.sectionHeader}>App Support</Text>
        <View style={styles.card}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => router.push("/support")}
          />
          <MenuItem
            icon="information-circle-outline"
            label="About iAyos"
            onPress={() => router.push("/legal/about")}
            noBorder
          />
        </View>
        
        <Text style={styles.versionText}>Version 1.0.0 (Build 42)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  noBorder = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  noBorder?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, noBorder && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon as any} size={22} color={Colors.textSecondary} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionHeader: {
    ...Typography.body.small,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  versionText: {
    textAlign: "center",
    ...Typography.body.small,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});

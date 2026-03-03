import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import CustomBackButton from "@/components/navigation/CustomBackButton";

export default function AccountInfoScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isWorker = user?.profile_data?.profileType === "WORKER";
  const hasProfileType = Boolean(user?.profile_data?.profileType);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerLeft: () => <CustomBackButton />,
          title: "Account Information",
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
            fontSize: 18,
            color: Colors.textPrimary,
          },
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors.white,
          },
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={user?.email || "Not set"}
            verified={user?.isVerified}
          />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Account Status"
            value="Active"
            valueColor={Colors.success}
            noBorder={!hasProfileType}
          />
          {hasProfileType && (
            <InfoRow
              icon="location-outline"
              label="Profile Type"
              value={user?.profile_data?.profileType || "Not set"}
              noBorder
            />
          )}
        </View>

        {isWorker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Worker Management</Text>
            <View style={styles.card}>
              <MenuItem
                icon="ribbon-outline"
                label="Manage Certifications"
                onPress={() => router.push("/profile/certifications" as any)}
              />
              <MenuItem
                icon="cube-outline"
                label="Manage Materials"
                onPress={() => router.push("/profile/materials" as any)}
                noBorder
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.card}>
            <MenuItem
              icon="card-outline"
              label="Payment Methods"
              noBorder
              onPress={() => router.push("/profile/payment-methods" as any)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor = Colors.textPrimary,
  verified = false,
  noBorder = false,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  verified?: boolean;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.infoRow, noBorder && { borderBottomWidth: 0 }]}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={20} color={Colors.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
        {verified && (
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
        )}
      </View>
    </View>
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
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
});

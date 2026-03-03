import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
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
            backgroundColor: Colors.white,
          },
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.card}>
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => Alert.alert("Coming Soon", "Notification settings will be available soon.")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <View style={styles.card}>
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => router.push("/support" as any)}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => router.push("/legal/privacy" as any)}
            />
            <MenuItem
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => router.push("/legal/terms" as any)}
            />
            <MenuItem
              icon="people-outline"
              label="Community Guidelines"
              onPress={() => router.push("/legal/community-guidelines" as any)}
            />
            <MenuItem
              icon="information-circle-outline"
              label="About iAyos"
              onPress={() => router.push("/legal/about" as any)}
            />
          </View>
        </View>
        
        <View style={styles.footer}>
            <Text style={styles.footerText}>iAyos v1.0.0</Text>
            <Text style={styles.footerSubtext}>May sira? May iAyos.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
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
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: "uppercase",
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
  footer: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textHint,
    marginBottom: Spacing.xs,
  },
  footerSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textHint,
  },
});

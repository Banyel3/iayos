import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface CustomBackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  /** Fallback route if no history exists (default: "/(tabs)") */
  fallbackRoute?: string;
}

/**
 * Custom back button component that matches the iAyos UI theme.
 * Replaces the default Expo Router header back button.
 * 
 * Handles edge case where pressing back with no history would close the app.
 * Falls back to tabs root when no navigation history exists.
 */
export default function CustomBackButton({
  onPress,
  color = Colors.textPrimary,
  size = 24,
  fallbackRoute = "/(tabs)",
}: CustomBackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    // Light haptic feedback on press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (onPress) {
      onPress();
    } else if (router.canGoBack()) {
      // Only call back() if there's navigation history
      router.back();
    } else {
      // Fallback to tabs root to prevent app from closing
      router.replace(fallbackRoute as any);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginLeft: 4,
  },
});

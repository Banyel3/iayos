import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

interface CustomBackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
}

/**
 * Custom back button component that matches the iAyos UI theme.
 * Replaces the default Expo Router header back button.
 */
export default function CustomBackButton({
  onPress,
  color = Colors.textPrimary,
  size = 24,
}: CustomBackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
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

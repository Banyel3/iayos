import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useToggleSaveJob } from "@/lib/hooks/useSaveJob";

interface SaveButtonProps {
  jobId: number;
  isSaved: boolean;
  size?: number;
  style?: any;
  onToggle?: (isSaved: boolean) => void;
}

export function SaveButton({
  jobId,
  isSaved,
  size = 24,
  style,
  onToggle,
}: SaveButtonProps) {
  const { toggleSave, isLoading } = useToggleSaveJob({
    onSuccess: () => {
      onToggle?.(!isSaved);
    },
  });

  const handlePress = () => {
    toggleSave(jobId, isSaved);
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.error} />
      ) : (
        <Ionicons
          name={isSaved ? "heart" : "heart-outline"}
          size={size}
          color={Colors.error}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

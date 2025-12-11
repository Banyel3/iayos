// MessageInput Component
// Text input with send button and image attachment

import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";

type MessageInputProps = {
  onSend: (text: string) => void;
  onImagePress?: () => void;
  isSending?: boolean;
  placeholder?: string;
};

export default function MessageInput({
  onSend,
  onImagePress,
  isSending = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim() && !isSending) {
      onSend(text.trim());
      setText("");
    }
  };

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.container}>
        {/* Image Attachment Button */}
        {onImagePress && (
          <TouchableOpacity
            style={styles.imageButton}
            onPress={onImagePress}
            disabled={isSending}
            activeOpacity={0.7}
          >
            <Ionicons
              name="image-outline"
              size={24}
              color={isSending ? Colors.textSecondary : Colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Text Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.textSecondary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            editable={!isSending}
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={canSend ? Colors.white : Colors.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  imageButton: {
    padding: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? Spacing.sm : 4,
    minHeight: 40,
    maxHeight: 120,
  },
  input: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 8,
    paddingBottom: Platform.OS === "ios" ? 8 : 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
});

// Chat Screen
// 1-on-1 messaging with real-time updates, image uploads, and offline support

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useMessages,
  useSendMessageMutation,
} from "../../lib/hooks/useMessages";
import {
  useMessageListener,
  useTypingIndicator,
  useWebSocketConnection,
} from "../../lib/hooks/useWebSocket";
import { useImageUpload } from "../../lib/hooks/useImageUpload";
import MessageBubble from "../../components/MessageBubble";
import MessageInput from "../../components/MessageInput";
import { ImageMessage } from "../../components/ImageMessage";
import { TypingIndicator } from "../../components/TypingIndicator";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "../../constants/theme";
import { isSameDay, format } from "date-fns";
import {
  addToQueue,
  getPendingMessages,
  isOnline,
} from "../../lib/services/offline-queue";
import * as ImagePicker from "expo-image-picker";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const conversationId = parseInt(params.conversationId as string);

  const flatListRef = useRef<FlatList>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);

  // Fetch conversation and messages
  const {
    data: conversation,
    isLoading,
    refetch,
  } = useMessages(conversationId);

  // Send message mutation
  const sendMutation = useSendMessageMutation();

  // WebSocket connection state
  const { isConnected } = useWebSocketConnection();

  // WebSocket: Listen for new messages
  useMessageListener(conversationId);

  // WebSocket: Typing indicator
  const { isTyping, sendTyping } = useTypingIndicator(conversationId);

  // Image upload
  const {
    uploadAsync,
    isUploading,
    progress: uploadProgress,
    resetProgress,
  } = useImageUpload();

  // Load pending messages from offline queue
  useEffect(() => {
    const loadPending = async () => {
      const pending = await getPendingMessages(conversationId);
      setPendingMessages(pending);
    };
    loadPending();
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversation?.messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation?.messages.length]);

  // Handle send message
  const handleSend = useCallback(
    async (text: string) => {
      setIsSending(true);
      try {
        await sendMutation.mutateAsync({
          conversationId,
          text,
          type: "TEXT",
        });

        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error("[ChatScreen] Failed to send message:", error);
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, sendMutation]
  );

  // Handle image attachment
  const handleImagePress = useCallback(async () => {
    // Show action sheet on iOS, alert on Android
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await pickImageFromCamera();
          } else if (buttonIndex === 2) {
            await pickImageFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        "Upload Image",
        "Choose an option",
        [
          { text: "Take Photo", onPress: pickImageFromCamera },
          { text: "Choose from Library", onPress: pickImageFromGallery },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  }, [conversationId]);

  // Pick image from camera
  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImageMessage(result.assets[0].uri);
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Gallery permission is required to choose photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImageMessage(result.assets[0].uri);
    }
  };

  // Upload image message
  const uploadImageMessage = async (imageUri: string) => {
    const online = await isOnline();

    if (!online) {
      // Add to offline queue
      await addToQueue({
        conversationId,
        text: "",
        type: "IMAGE",
        imageUri,
      });
      Alert.alert("Offline", "Image will be sent when you're back online.");
      return;
    }

    try {
      const fileName = `message_${Date.now()}.jpg`;
      const endpoint = `/api/profiles/chat/${conversationId}/upload-image`;

      await uploadAsync({
        uri: imageUri,
        endpoint,
        fieldName: "image",
        compress: true,
      });

      Alert.alert("Success", "Image sent successfully!");
      resetProgress();

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("[ChatScreen] Image upload failed:", error);
      Alert.alert("Error", "Failed to send image. Please try again.");
    }
  };

  // Handle typing
  const handleTyping = () => {
    sendTyping();
  };

  // Render date separator
  const renderDateSeparator = (date: Date) => {
    const dateString = format(date, "MMMM d, yyyy");

    return (
      <View style={styles.dateSeparator}>
        <Text style={styles.dateSeparatorText}>{dateString}</Text>
      </View>
    );
  };

  // Render message with date separator
  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const currentDate = new Date(item.created_at);
    const previousDate =
      index > 0 ? new Date(conversation!.messages[index - 1].created_at) : null;

    const showDateSeparator =
      !previousDate || !isSameDay(currentDate, previousDate);

    // Show timestamp only for first message per minute
    const showTimestamp =
      index === 0 ||
      Math.abs(
        new Date(item.created_at).getTime() -
          new Date(conversation!.messages[index - 1].created_at).getTime()
      ) > 60000;

    return (
      <View>
        {showDateSeparator && renderDateSeparator(currentDate)}
        {item.message_type === "IMAGE" && item.image_url ? (
          <View
            style={[
              styles.imageContainer,
              item.is_mine && styles.imageContainerMine,
            ]}
          >
            <ImageMessage
              imageUrl={item.image_url}
              isMine={item.is_mine}
              width={200}
              height={200}
            />
            {showTimestamp && (
              <Text
                style={[
                  styles.imageTimestamp,
                  item.is_mine && styles.imageTimestampMine,
                ]}
              >
                {format(new Date(item.created_at), "h:mm a")}
              </Text>
            )}
          </View>
        ) : (
          <MessageBubble message={item} showTimestamp={showTimestamp} />
        )}
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <Image
          source={{ uri: conversation?.other_participant.avatar }}
          style={styles.typingAvatar}
        />
        <TypingIndicator />
      </View>
    );
  };

  // Render upload progress
  const renderUploadProgress = () => {
    if (!isUploading) return null;

    return (
      <View style={styles.uploadProgressContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.uploadProgressText}>
          Uploading image... {Math.round(uploadProgress.percentage)}%
        </Text>
      </View>
    );
  };

  // Render offline indicator
  const renderOfflineIndicator = () => {
    if (isConnected) return null;

    return (
      <View style={styles.offlineIndicator}>
        <Ionicons name="cloud-offline-outline" size={16} color={Colors.white} />
        <Text style={styles.offlineText}>
          {"You're offline. Messages will be sent when you reconnect."}
        </Text>
      </View>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Stack.Screen
          options={{
            title: "Loading...",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (!conversation) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Stack.Screen
          options={{
            title: "Error",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Conversation not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Stack.Screen
        options={{
          title: conversation.other_participant.name,
          headerBackTitle: "Messages",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                // Navigate to job details
                router.push(`/jobs/${conversation.job.id}`);
              }}
              style={styles.headerButton}
            >
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={Colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Offline Indicator */}
        {renderOfflineIndicator()}

        {/* Job Info Header */}
        <TouchableOpacity
          style={styles.jobHeader}
          onPress={() => router.push(`/jobs/${conversation.job.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.jobInfo}>
            <Ionicons
              name="briefcase-outline"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.jobTitle} numberOfLines={1}>
              {conversation.job.title}
            </Text>
          </View>
          <View style={styles.jobMeta}>
            <Text style={styles.jobBudget}>
              ₱{conversation.job.budget.toLocaleString()}
            </Text>
            <Text style={styles.jobRole}>
              {conversation.my_role === "CLIENT"
                ? "You're the client"
                : "You're the worker"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Upload Progress */}
        {renderUploadProgress()}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={conversation.messages}
          keyExtractor={(item, index) => `${item.created_at}-${index}`}
          renderItem={renderMessage}
          ListFooterComponent={renderTypingIndicator}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Message Input */}
        <MessageInput
          onSend={handleSend}
          onImagePress={handleImagePress}
          isSending={isSending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.heading.h3,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  headerButton: {
    padding: Spacing.sm,
  },
  jobHeader: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jobInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  jobTitle: {
    ...Typography.body.medium,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  jobMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  jobBudget: {
    ...Typography.body.small,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  jobRole: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messagesContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dateSeparatorText: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  typingBubble: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  imageContainer: {
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.md,
    alignItems: "flex-start",
  },
  imageContainerMine: {
    alignItems: "flex-end",
  },
  imageTimestamp: {
    ...Typography.body.small,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  imageTimestampMine: {
    marginRight: 4,
    marginLeft: 0,
  },
  uploadProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  uploadProgressText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  offlineText: {
    ...Typography.body.small,
    fontSize: 12,
    color: Colors.white,
    flex: 1,
  },
});

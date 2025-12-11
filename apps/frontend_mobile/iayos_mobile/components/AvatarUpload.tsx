// components/AvatarUpload.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useImagePicker } from "@/lib/hooks/useImagePicker";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { ENDPOINTS, getAbsoluteMediaUrl } from "@/lib/api/config";
import { Colors, Typography, Spacing } from "@/constants/theme";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  size?: number;
  onUploadSuccess?: (avatarUrl: string) => void;
  onUploadError?: (error: string) => void;
  onDelete?: () => void;
  editable?: boolean;
  showEditOverlay?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  size = 150,
  onUploadSuccess,
  onUploadError,
  onDelete,
  editable = true,
  showEditOverlay = true,
}) => {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const { pickFromGallery, takePhoto } = useImagePicker();
  const { upload, isUploading, progress } = useImageUpload();

  const displayUri = localUri || getAbsoluteMediaUrl(currentAvatarUrl);
  const hasAvatar = !!displayUri;

  const handleUpload = (uri: string) => {
    setLocalUri(uri);

    upload(
      {
        uri,
        endpoint: ENDPOINTS.UPLOAD_AVATAR,
        fieldName: "profile_image",
        compress: true,
      },
      {
        onSuccess: (result) => {
          if (result.success && result.data?.image_url) {
            setLocalUri(null); // Clear local preview
            if (onUploadSuccess) {
              onUploadSuccess(result.data.image_url);
            }
          } else {
            setLocalUri(null);
            const errorMsg = "Upload failed. Please try again.";
            if (onUploadError) {
              onUploadError(errorMsg);
            }
            Alert.alert("Upload Failed", errorMsg);
          }
        },
        onError: (error) => {
          setLocalUri(null);
          const errorMsg =
            error instanceof Error ? error.message : "Upload failed";
          if (onUploadError) {
            onUploadError(errorMsg);
          }
          Alert.alert("Upload Error", errorMsg);
        },
      }
    );
  };

  const handleChoosePhoto = () => {
    if (!editable) return;

    Alert.alert(
      "Upload Avatar",
      "Choose photo source",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const result = await takePhoto({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (result) {
              handleUpload(result.uri);
            }
          },
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const result = await pickFromGallery({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (result && !Array.isArray(result)) {
              handleUpload(result.uri);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAvatar = () => {
    if (!editable || !hasAvatar) return;

    Alert.alert(
      "Remove Avatar",
      "Are you sure you want to remove your avatar?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setLocalUri(null);
            if (onDelete) {
              onDelete();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.avatarContainer, { width: size, height: size }]}
        onPress={handleChoosePhoto}
        disabled={!editable || isUploading}
        activeOpacity={editable ? 0.7 : 1}
      >
        {hasAvatar ? (
          <Image
            source={{ uri: displayUri }}
            style={[styles.avatar, { width: size, height: size }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: size, height: size },
              isUploading && styles.placeholderUploading,
            ]}
          >
            <Ionicons
              name="person"
              size={size * 0.5}
              color={isUploading ? Colors.border : Colors.textSecondary}
            />
          </View>
        )}

        {isUploading && (
          <View style={[styles.uploadOverlay, { width: size, height: size }]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.progressText}>{progress.percentage}%</Text>
          </View>
        )}

        {editable && showEditOverlay && !isUploading && (
          <View style={styles.editOverlay}>
            <Ionicons name="camera" size={24} color={Colors.textLight} />
          </View>
        )}
      </TouchableOpacity>

      {editable && hasAvatar && !isUploading && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAvatar}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarContainer: {
    borderRadius: 9999, // Fully circular
    overflow: "hidden",
    backgroundColor: Colors.background,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  avatar: {
    borderRadius: 9999,
  },
  placeholder: {
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
  placeholderUploading: {
    opacity: 0.5,
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
  progressText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    marginTop: Spacing.xs,
  },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.error,
  },
});

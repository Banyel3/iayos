// components/PortfolioUpload.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useImagePicker } from "@/lib/hooks/useImagePicker";
import { useMultiImageUpload } from "@/lib/hooks/useImageUpload";
import { formatFileSize } from "@/lib/utils/image-utils";
import { ENDPOINTS } from "@/lib/api/config";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

interface UploadItem {
  id: string;
  uri: string;
  caption: string;
  status: "queued" | "uploading" | "success" | "error";
  progress: number;
  fileSize?: number;
  errorMessage?: string;
}

interface PortfolioUploadProps {
  maxImages?: number;
  disabled?: boolean;
  onUploadComplete?: () => void;
}

export const PortfolioUpload: React.FC<PortfolioUploadProps> = ({
  maxImages = 10,
  disabled = false,
  onUploadComplete,
}) => {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { pickFromGallery } = useImagePicker();

  // Calculate available slots
  const availableSlots =
    maxImages - uploadQueue.filter((item) => item.status === "success").length;

  // Handle image selection
  const handleSelectImages = useCallback(async () => {
    if (disabled || isUploading) return;

    // Calculate how many can be selected
    const maxSelectable = Math.min(availableSlots, 5);

    if (maxSelectable <= 0) {
      Alert.alert(
        "Portfolio Full",
        `You can only have ${maxImages} images in your portfolio.`
      );
      return;
    }

    const result = await pickFromGallery({
      allowsMultipleSelection: true,
      maxImages: maxSelectable,
      quality: 0.8,
    });

    if (!result) return;

    const images = Array.isArray(result) ? result : [result];

    // Create upload items
    const newItems: UploadItem[] = images.map((img, index) => ({
      id: `${Date.now()}_${index}`,
      uri: img.uri,
      caption: "",
      status: "queued" as const,
      progress: 0,
      fileSize: img.fileSize,
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);
  }, [disabled, isUploading, availableSlots, maxImages, pickFromGallery]);

  // Update caption for an item
  const handleCaptionChange = useCallback((id: string, caption: string) => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, caption: caption.slice(0, 200) } : item
      )
    );
  }, []);

  // Remove item from queue
  const handleRemoveItem = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Update progress for an item
  const handleProgress = useCallback((index: number, percentage: number) => {
    setUploadQueue((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, status: "uploading" as const, progress: percentage }
          : item
      )
    );
  }, []);

  // Upload all queued items
  const handleUploadAll = useCallback(async () => {
    const queuedItems = uploadQueue.filter(
      (item) => item.status === "queued" || item.status === "error"
    );

    if (queuedItems.length === 0) return;

    setIsUploading(true);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];

      if (item.status !== "queued" && item.status !== "error") {
        if (item.status === "success") successCount++;
        continue;
      }

      try {
        // Set uploading status
        setUploadQueue((prev) =>
          prev.map((qItem, idx) =>
            idx === i ? { ...qItem, status: "uploading" as const } : qItem
          )
        );

        // Create FormData
        const formData = new FormData();
        formData.append("image", {
          uri: item.uri,
          type: "image/jpeg",
          name: `portfolio_${Date.now()}.jpg`,
        } as any);

        if (item.caption.trim()) {
          formData.append("caption", item.caption.trim());
        }

        // Upload with XHR
        const result = await new Promise<{ success: boolean; error?: string }>(
          (resolve) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentage = Math.round(
                  (event.loaded / event.total) * 100
                );
                handleProgress(i, percentage);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true });
              } else {
                resolve({
                  success: false,
                  error: `Upload failed: ${xhr.status}`,
                });
              }
            };

            xhr.onerror = () =>
              resolve({ success: false, error: "Network error" });

            xhr.ontimeout = () =>
              resolve({ success: false, error: "Upload timed out" });

            xhr.open("POST", ENDPOINTS.UPLOAD_PORTFOLIO_IMAGE);
            xhr.timeout = 60000;
            xhr.setRequestHeader("Accept", "application/json");
            xhr.send(formData);
          }
        );

        if (result.success) {
          successCount++;
          setUploadQueue((prev) =>
            prev.map((qItem, idx) =>
              idx === i
                ? { ...qItem, status: "success" as const, progress: 100 }
                : qItem
            )
          );
        } else {
          failCount++;
          setUploadQueue((prev) =>
            prev.map((qItem, idx) =>
              idx === i
                ? {
                    ...qItem,
                    status: "error" as const,
                    errorMessage: result.error,
                  }
                : qItem
            )
          );
        }
      } catch (error) {
        failCount++;
        setUploadQueue((prev) =>
          prev.map((qItem, idx) =>
            idx === i
              ? {
                  ...qItem,
                  status: "error" as const,
                  errorMessage:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : qItem
          )
        );
      }
    }

    setIsUploading(false);

    // Show summary alert
    if (successCount > 0 || failCount > 0) {
      Alert.alert(
        "Upload Complete",
        `${successCount} image${successCount !== 1 ? "s" : ""} uploaded successfully${
          failCount > 0
            ? `, ${failCount} failed. Tap retry to upload failed images.`
            : "."
        }`,
        [
          {
            text: "OK",
            onPress: () => {
              if (successCount > 0) {
                // Remove successful items from queue
                setUploadQueue((prev) =>
                  prev.filter((item) => item.status !== "success")
                );

                // Notify parent to refresh
                if (onUploadComplete) {
                  onUploadComplete();
                }
              }
            },
          },
        ]
      );
    }
  }, [uploadQueue, handleProgress, onUploadComplete]);

  // Cancel all uploads
  const handleCancelAll = useCallback(() => {
    if (uploadQueue.length === 0) return;

    Alert.alert(
      "Cancel Upload",
      "Are you sure you want to cancel all uploads?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            setUploadQueue([]);
            setIsUploading(false);
          },
        },
      ]
    );
  }, [uploadQueue.length]);

  // Empty state
  if (uploadQueue.length === 0) {
    return (
      <TouchableOpacity
        style={[styles.emptyState, disabled && styles.emptyStateDisabled]}
        onPress={handleSelectImages}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="images-outline"
          size={48}
          color={disabled ? Colors.border : Colors.primary}
        />
        <Text style={[styles.emptyText, disabled && styles.emptyTextDisabled]}>
          Add Portfolio Images
        </Text>
        <Text style={styles.emptyHint}>
          {availableSlots > 0
            ? `Select up to ${Math.min(availableSlots, 5)} images at once`
            : "Portfolio is full"}
        </Text>
      </TouchableOpacity>
    );
  }

  const queuedCount = uploadQueue.filter(
    (item) => item.status === "queued" || item.status === "error"
  ).length;

  return (
    <View style={styles.container}>
      {/* Upload Queue */}
      <ScrollView
        style={styles.queueContainer}
        showsVerticalScrollIndicator={false}
      >
        {uploadQueue.map((item, index) => (
          <View key={item.id} style={styles.uploadItem}>
            {/* Thumbnail */}
            <Image source={{ uri: item.uri }} style={styles.thumbnail} />

            {/* Details */}
            <View style={styles.itemDetails}>
              {/* Caption Input */}
              <TextInput
                style={[
                  styles.captionInput,
                  isUploading && styles.captionInputDisabled,
                ]}
                value={item.caption}
                onChangeText={(text) => handleCaptionChange(item.id, text)}
                placeholder="Add caption (optional)"
                placeholderTextColor={Colors.textSecondary}
                maxLength={200}
                multiline
                numberOfLines={2}
                editable={!isUploading}
              />

              {/* Meta Info */}
              <View style={styles.itemMeta}>
                <Text style={styles.itemMetaText}>
                  {item.caption.length}/200
                </Text>
                {item.fileSize && (
                  <Text style={styles.itemMetaText}>
                    {formatFileSize(item.fileSize)}
                  </Text>
                )}
              </View>

              {/* Status/Progress */}
              {item.status === "queued" && (
                <View style={styles.statusContainer}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.statusText}>Queued</Text>
                </View>
              )}

              {item.status === "uploading" && (
                <View style={styles.statusContainer}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${item.progress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.statusText}>{item.progress}%</Text>
                </View>
              )}

              {item.status === "success" && (
                <View style={styles.statusContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.success}
                  />
                  <Text style={[styles.statusText, styles.statusSuccess]}>
                    Uploaded
                  </Text>
                </View>
              )}

              {item.status === "error" && (
                <View style={styles.statusContainer}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={Colors.error}
                  />
                  <Text style={[styles.statusText, styles.statusError]}>
                    {item.errorMessage || "Failed"}
                  </Text>
                </View>
              )}
            </View>

            {/* Remove Button */}
            {!isUploading && item.status !== "success" && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Ionicons name="close" size={20} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonSecondary,
            isUploading && styles.actionButtonDisabled,
          ]}
          onPress={handleCancelAll}
          disabled={isUploading}
        >
          <Text
            style={[styles.actionButtonText, styles.actionButtonTextSecondary]}
          >
            Cancel All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonPrimary,
            (isUploading || queuedCount === 0) && styles.actionButtonDisabled,
          ]}
          onPress={handleUploadAll}
          disabled={isUploading || queuedCount === 0}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={Colors.textLight} />
          ) : (
            <Text style={styles.actionButtonText}>
              Upload {queuedCount > 0 ? `(${queuedCount})` : ""}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  emptyState: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  emptyStateDisabled: {
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
    marginTop: Spacing.md,
  },
  emptyTextDisabled: {
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  queueContainer: {
    maxHeight: 400,
  },
  uploadItem: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: "flex-start",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.border,
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  captionInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 44,
    textAlignVertical: "top",
  },
  captionInputDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    color: Colors.textSecondary,
  },
  itemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  itemMetaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  statusSuccess: {
    color: Colors.success,
  },
  statusError: {
    color: Colors.error,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginRight: Spacing.sm,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  actionBar: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textLight,
  },
  actionButtonTextSecondary: {
    color: Colors.textPrimary,
  },
});

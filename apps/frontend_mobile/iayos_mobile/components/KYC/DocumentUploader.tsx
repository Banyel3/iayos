// components/KYC/DocumentUploader.tsx
// Reusable component for uploading KYC documents

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Button } from "react-native-paper";
import { useImagePicker } from "@/lib/hooks/useImagePicker";
import type { KYCDocumentType, DocumentCaptureResult } from "@/lib/types/kyc";
import { DOCUMENT_TYPES, validateDocumentFile } from "@/lib/types/kyc";
import { Colors, Typography, Spacing } from "@/constants/theme";

interface DocumentUploaderProps {
  documentType: KYCDocumentType;
  side?: "FRONT" | "BACK";
  onDocumentCaptured: (result: DocumentCaptureResult) => void;
  onRemove?: () => void;
  existingDocument?: DocumentCaptureResult;
  disabled?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documentType,
  side,
  onDocumentCaptured,
  onRemove,
  existingDocument,
  disabled = false,
}) => {
  const [localUri, setLocalUri] = useState<string | null>(
    existingDocument?.uri || null
  );
  const { pickFromGallery, takePhoto } = useImagePicker();
  const config = DOCUMENT_TYPES[documentType];

  const displayLabel = side
    ? `${config.label} (${side.charAt(0) + side.slice(1).toLowerCase()})`
    : config.label;

  const handleCapture = async (source: "camera" | "gallery") => {
    try {
      let result;

      if (source === "camera") {
        result = await takePhoto({
          allowsEditing: true,
          aspect: [16, 10], // ID card aspect ratio
          quality: 0.9,
        });
      } else {
        result = await pickFromGallery({
          allowsEditing: true,
          aspect: [16, 10],
          quality: 0.9,
          allowsMultipleSelection: false,
        });
      }

      if (result) {
        // Get the first item if result is an array
        const imageResult = Array.isArray(result) ? result[0] : result;

        if (!imageResult) {
          Alert.alert("Error", "No image selected");
          return;
        }

        // Validate the document
        const validation = validateDocumentFile(
          {
            uri: imageResult.uri,
            size: imageResult.fileSize || 0,
            type: "image/jpeg",
          },
          documentType
        );

        if (!validation.isValid) {
          Alert.alert("Invalid Document", validation.errors.join("\n"));
          return;
        }

        // Show warnings if any
        if (validation.warnings && validation.warnings.length > 0) {
          Alert.alert("Notice", validation.warnings.join("\n"));
        }

        setLocalUri(imageResult.uri);

        // Create capture result
        const captureResult: DocumentCaptureResult = {
          type: documentType,
          uri: imageResult.uri,
          fileName:
            imageResult.fileName ||
            `${documentType}_${side || "DOC"}_${Date.now()}.jpg`,
          fileSize: imageResult.fileSize || 0,
          side,
        };

        onDocumentCaptured(captureResult);
      }
    } catch (error) {
      console.error("Document capture error:", error);
      Alert.alert(
        "Capture Error",
        error instanceof Error ? error.message : "Failed to capture document"
      );
    }
  };

  const handleChooseSource = () => {
    if (disabled) return;

    Alert.alert(
      `Upload ${displayLabel}`,
      config.instructions,
      [
        {
          text: "Take Photo",
          onPress: () => handleCapture("camera"),
        },
        {
          text: "Choose from Gallery",
          onPress: () => handleCapture("gallery"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const handleRemove = () => {
    if (disabled) return;

    Alert.alert("Remove Document", `Remove ${displayLabel}?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setLocalUri(null);
          if (onRemove) {
            onRemove();
          }
        },
      },
    ]);
  };

  const hasDocument = !!localUri;

  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        {/* Document Preview or Placeholder */}
        <TouchableOpacity
          onPress={handleChooseSource}
          disabled={disabled}
          style={styles.previewContainer}
        >
          {hasDocument ? (
            <Image
              source={{ uri: localUri }}
              style={styles.preview}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons
                name={config.icon as any}
                size={48}
                color={Colors.textHint}
              />
              <Text style={styles.placeholderText}>Tap to upload</Text>
            </View>
          )}

          {/* Upload Overlay for editing */}
          {hasDocument && !disabled && (
            <View style={styles.overlay}>
              <Ionicons name="camera" size={24} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>

        {/* Document Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{displayLabel}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {config.instructions}
          </Text>

          {/* Required Badge */}
          {config.required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {hasDocument ? (
              <>
                <Button
                  mode="outlined"
                  onPress={handleChooseSource}
                  disabled={disabled}
                  icon="camera"
                  style={styles.actionButton}
                  compact
                >
                  Retake
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleRemove}
                  disabled={disabled}
                  icon="trash-outline"
                  textColor={Colors.error}
                  style={styles.actionButton}
                  compact
                >
                  Remove
                </Button>
              </>
            ) : (
              <Button
                mode="contained"
                onPress={handleChooseSource}
                disabled={disabled}
                icon="camera"
                style={styles.uploadButton}
              >
                Upload Document
              </Button>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: Colors.background,
  },
  container: {
    flexDirection: "row",
    padding: Spacing.md,
  },
  previewContainer: {
    width: 120,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    position: "relative",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundSecondary,
  },
  placeholderText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textHint,
    marginTop: Spacing.xs / 2,
    
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  requiredBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  requiredText: {
    fontSize: Typography.fontSize.xs,
    
    color: Colors.primary,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
  },
});

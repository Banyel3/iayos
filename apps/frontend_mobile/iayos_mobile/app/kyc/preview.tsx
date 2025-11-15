// app/kyc/preview.tsx
// Document preview and viewer screen

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import { Colors, Typography, Spacing } from "@/constants/theme";
import type { KYCDocumentType } from "@/lib/types/kyc";
import { DOCUMENT_TYPES } from "@/lib/types/kyc";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function DocumentPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    documentType: KYCDocumentType;
    fileURL: string;
  }>();

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageScale, setImageScale] = useState(1);

  const documentType = params.documentType as KYCDocumentType;
  const fileURL = params.fileURL as string;
  const config = DOCUMENT_TYPES[documentType];

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleZoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleZoomReset = () => {
    setImageScale(1);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: config?.label || "Document Preview",
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.background.primary,
          },
        }}
      />

      {/* Image Container */}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading document...</Text>
          </View>
        )}

        {imageError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
            <Text style={styles.errorTitle}>Failed to Load Document</Text>
            <Text style={styles.errorMessage}>
              The document image could not be loaded
            </Text>
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              Go Back
            </Button>
          </View>
        ) : (
          <Image
            source={{ uri: fileURL }}
            style={[
              styles.image,
              {
                transform: [{ scale: imageScale }],
              },
            ]}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </View>

      {/* Zoom Controls */}
      {!imageError && !imageLoading && (
        <View style={styles.controls}>
          <View style={styles.zoomControls}>
            <TouchableOpacity
              onPress={handleZoomOut}
              style={styles.controlButton}
              disabled={imageScale <= 0.5}
            >
              <Ionicons
                name="remove-circle-outline"
                size={32}
                color={imageScale <= 0.5 ? Colors.text.tertiary : Colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleZoomReset}
              style={styles.controlButton}
            >
              <Text style={styles.zoomText}>{Math.round(imageScale * 100)}%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleZoomIn}
              style={styles.controlButton}
              disabled={imageScale >= 3}
            >
              <Ionicons
                name="add-circle-outline"
                size={32}
                color={imageScale >= 3 ? Colors.text.tertiary : Colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Document Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons
                name={config.icon as any}
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.infoLabel}>{config.label}</Text>
            </View>
            <Text style={styles.infoDescription}>{config.description}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
  },
  controls: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.background.secondary,
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  controlButton: {
    padding: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  zoomText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    minWidth: 60,
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs / 2,
  },
  infoLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
  },
  infoDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
});

// Image Message Component
// Display image messages with tap to view full-screen

import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Colors, Spacing, BorderRadius } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type ImageMessageProps = {
  imageUrl: string;
  isMine: boolean;
  width?: number;
  height?: number;
};

export function ImageMessage({
  imageUrl,
  isMine,
  width = 200,
  height = 200,
}: ImageMessageProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const openFullScreen = () => {
    if (!hasError) {
      setIsFullScreen(true);
    }
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
  };

  return (
    <>
      {/* Thumbnail */}
      <TouchableOpacity
        onPress={openFullScreen}
        activeOpacity={0.8}
        style={[
          styles.thumbnailContainer,
          { width, height },
          isMine && styles.thumbnailMine,
        ]}
      >
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        {hasError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="image-outline" size={40} color={Colors.textSecondary} />
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </TouchableOpacity>

      {/* Full-screen Modal */}
      <Modal
        visible={isFullScreen}
        transparent
        animationType="fade"
        onRequestClose={closeFullScreen}
      >
        <View style={styles.modalContainer}>
          {/* Background overlay */}
          <Pressable style={styles.modalBackground} onPress={closeFullScreen} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={closeFullScreen}>
            <Ionicons name="close" size={30} color={Colors.white} />
          </TouchableOpacity>

          {/* Full-screen image */}
          <View style={styles.fullScreenImageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnailContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  thumbnailMine: {
    alignSelf: "flex-end",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: Spacing.sm,
  },
  fullScreenImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

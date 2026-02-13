/**
 * KYC Camera Screen with ID Card Guide Overlay
 *
 * Uses expo-camera's CameraView component to render camera preview IN-APP
 * with React Native overlay components for real-time framing guidance.
 *
 * Works with Expo Go - no custom dev client required.
 */

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Linking,
} from "react-native";
import { CameraView, useCameraPermissions, FlashMode } from "expo-camera";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Colors, Typography } from "@/constants/theme";
import { cameraEvents } from "@/lib/utils/cameraEvents";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ID card standard dimensions: 85.6mm x 53.98mm (aspect ratio ~1.586)
const FRAME_WIDTH = SCREEN_WIDTH * 0.85;
const FRAME_HEIGHT_ID = FRAME_WIDTH * 0.63; // For ID cards
const FRAME_HEIGHT_CLEARANCE = FRAME_WIDTH * 0.9; // Taller for clearance docs
const OVAL_SIZE = SCREEN_WIDTH * 0.7; // For selfie

type DocumentType = "front" | "back" | "clearance" | "selfie";

interface GuideConfig {
  shape: "rectangle" | "oval";
  title: string;
  subtitle: string;
  frameWidth: number;
  frameHeight: number;
  facing: "front" | "back";
}

const getGuideConfig = (documentType: DocumentType): GuideConfig => {
  switch (documentType) {
    case "selfie":
      return {
        shape: "oval",
        title: "Selfie with ID",
        subtitle: "Position your face in the oval\nHold your ID card next to your face",
        frameWidth: OVAL_SIZE,
        frameHeight: OVAL_SIZE * 1.3,
        facing: "front",
      };
    case "clearance":
      return {
        shape: "rectangle",
        title: "Position NBI/Police Clearance",
        subtitle: "Align all corners within the frame",
        frameWidth: FRAME_WIDTH,
        frameHeight: FRAME_HEIGHT_CLEARANCE,
        facing: "back",
      };
    case "back":
      return {
        shape: "rectangle",
        title: "Position ID Card (Back)",
        subtitle: "Flip your ID and align within frame",
        frameWidth: FRAME_WIDTH,
        frameHeight: FRAME_HEIGHT_ID,
        facing: "back",
      };
    default: // 'front'
      return {
        shape: "rectangle",
        title: "Position ID Card (Front)",
        subtitle: "Align all corners within the frame",
        frameWidth: FRAME_WIDTH,
        frameHeight: FRAME_HEIGHT_ID,
        facing: "back",
      };
  }
};

/**
 * Crop the full camera photo to match the on-screen guide frame.
 *
 * The CameraView renders in "cover" mode — the camera sensor image is scaled
 * and centered so it fills the entire screen, which means parts of the photo
 * extend beyond the screen edges. We need to map the on-screen guide frame
 * coordinates back to the original photo coordinate space.
 *
 * Math:
 *   cover-scale  = max(screenW / photoW, screenH / photoH)
 *   visibleW     = screenW / scale,   visibleH = screenH / scale
 *   offsetX      = (photoW - visibleW) / 2   (hidden portion on each side)
 *   offsetY      = (photoH - visibleH) / 2
 *   cropX        = offsetX + frameX / scale
 *   cropY        = offsetY + frameY / scale
 *   cropW        = frameW / scale,     cropH = frameH / scale
 */
const cropToGuideRegion = async (
  photoUri: string,
  photoWidth: number,
  photoHeight: number,
  config: GuideConfig,
): Promise<string> => {
  // Guide frame is centered on screen
  const frameX = (SCREEN_WIDTH - config.frameWidth) / 2;
  const frameY = (SCREEN_HEIGHT - config.frameHeight) / 2;

  // Cover-mode scaling: camera image scaled to fill screen completely
  const scale = Math.max(
    SCREEN_WIDTH / photoWidth,
    SCREEN_HEIGHT / photoHeight,
  );

  // How much of the photo is visible on screen
  const visibleWidth = SCREEN_WIDTH / scale;
  const visibleHeight = SCREEN_HEIGHT / scale;

  // Offset: the hidden portion cropped by cover mode
  const offsetX = (photoWidth - visibleWidth) / 2;
  const offsetY = (photoHeight - visibleHeight) / 2;

  // Map screen-space guide frame to photo-space crop region
  let cropOriginX = Math.round(offsetX + frameX / scale);
  let cropOriginY = Math.round(offsetY + frameY / scale);
  let cropWidth = Math.round(config.frameWidth / scale);
  let cropHeight = Math.round(config.frameHeight / scale);

  // Clamp to photo bounds (safety)
  cropOriginX = Math.max(0, Math.min(cropOriginX, photoWidth - 1));
  cropOriginY = Math.max(0, Math.min(cropOriginY, photoHeight - 1));
  cropWidth = Math.min(cropWidth, photoWidth - cropOriginX);
  cropHeight = Math.min(cropHeight, photoHeight - cropOriginY);

  // Ensure minimum crop size (at least 100px)
  if (cropWidth < 100 || cropHeight < 100) {
    console.warn("[KYC Camera] Crop region too small, skipping crop");
    return photoUri;
  }

  console.log(
    `[KYC Camera] Cropping: photo ${photoWidth}x${photoHeight} → crop(${cropOriginX}, ${cropOriginY}, ${cropWidth}x${cropHeight})`,
  );

  const result = await manipulateAsync(
    photoUri,
    [
      {
        crop: {
          originX: cropOriginX,
          originY: cropOriginY,
          width: cropWidth,
          height: cropHeight,
        },
      },
    ],
    {
      compress: 0.92,
      format: SaveFormat.JPEG,
    },
  );

  console.log(
    `[KYC Camera] Cropped result: ${result.width}x${result.height}`,
  );

  return result.uri;
};

export default function KYCCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ documentType: DocumentType }>();
  const documentType = (params.documentType as DocumentType) || "front";

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [isCapturing, setIsCapturing] = useState(false);
  const [checkGlasses, setCheckGlasses] = useState(false);
  const [checkId, setCheckId] = useState(false);

  const config = getGuideConfig(documentType);
  const isSelfie = documentType === "selfie";

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Ionicons name="camera-outline" size={48} color={Colors.textHint} />
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      </View>
    );
  }

  // Permission denied - show request screen
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Stack.Screen options={{ headerShown: false }} />

        <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <TouchableOpacity
            style={styles.permissionCloseButton}
            onPress={() => safeGoBack(router, "/(tabs)/profile")}
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.permissionContent}>
            <View style={styles.permissionIconContainer}>
              <Ionicons name="camera" size={64} color={Colors.primary} />
            </View>

            <Text style={styles.permissionTitle}>Camera Access Required</Text>

            <Text style={styles.permissionDescription}>
              To capture your ID documents for KYC verification, iAyos needs
              access to your camera. Your photos are securely processed and
              never shared with third parties.
            </Text>

            <View style={styles.permissionFeatures}>
              <View style={styles.permissionFeatureRow}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={Colors.success}
                />
                <Text style={styles.permissionFeatureText}>
                  Secure document capture
                </Text>
              </View>
              <View style={styles.permissionFeatureRow}>
                <Ionicons name="eye-off" size={20} color={Colors.success} />
                <Text style={styles.permissionFeatureText}>
                  Photos stay on your device until upload
                </Text>
              </View>
              <View style={styles.permissionFeatureRow}>
                <Ionicons name="lock-closed" size={20} color={Colors.success} />
                <Text style={styles.permissionFeatureText}>
                  Encrypted transmission
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Ionicons name="camera" size={20} color={Colors.white} />
              <Text style={styles.permissionButtonText}>
                Allow Camera Access
              </Text>
            </TouchableOpacity>

            {permission.canAskAgain === false && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Handle photo capture
  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (photo?.uri) {
        let finalUri = photo.uri;

        // Crop to guide frame for document types (not selfie)
        // Selfie uses an oval guide which doesn't map to a useful rectangular crop
        if (documentType !== "selfie" && photo.width && photo.height) {
          try {
            console.log(
              `[KYC Camera] Photo captured: ${photo.width}x${photo.height}, cropping to guide...`,
            );
            finalUri = await cropToGuideRegion(
              photo.uri,
              photo.width,
              photo.height,
              config,
            );
          } catch (cropError) {
            console.warn(
              "[KYC Camera] Crop failed, using full photo:",
              cropError,
            );
            // Graceful fallback: emit full uncropped photo
          }
        }

        // Emit the (cropped) photo URI to listeners in upload.tsx
        cameraEvents.emit(documentType, finalUri);
        // Navigate back to the upload screen
        safeGoBack(router, "/(tabs)/profile");
      }
    } catch (error) {
      console.error("Camera capture error:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlashMode((prev) => (prev === "off" ? "on" : "off"));
  };

  // Handle close
  const handleClose = () => {
    safeGoBack(router, "/(tabs)/profile");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Camera Preview - Full Screen */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={config.facing}
        flash={flashMode}
      >
        {/* ===== OVERLAY LAYER - RENDERS ON TOP OF CAMERA ===== */}

        {/* Dark overlay with transparent cutout */}
        <View style={styles.overlayContainer} pointerEvents="none">
          {/* Top dark section */}
          <View style={styles.darkSection} />

          {/* Middle row with frame cutout */}
          <View style={styles.middleRow}>
            <View style={styles.darkSection} />

            {/* Transparent frame area */}
            <View
              style={[
                styles.frame,
                {
                  width: config.frameWidth,
                  height: config.frameHeight,
                },
                config.shape === "oval" && styles.ovalFrame,
              ]}
            >
              {/* Corner markers for rectangle */}
              {config.shape === "rectangle" && (
                <>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </>
              )}
            </View>

            <View style={styles.darkSection} />
          </View>

          {/* Bottom dark section */}
          <View style={styles.darkSection} />
        </View>

        {/* Selfie ID reminder — positioned below the oval frame */}
        {isSelfie && (
          <View style={styles.selfieIdReminder} pointerEvents="none">
            <View style={styles.selfieIdBadge}>
              <Ionicons
                name="card-outline"
                size={16}
                color="rgba(255,255,255,0.95)"
              />
              <Text style={styles.selfieIdBadgeText}>
                Hold your ID card visible in frame
              </Text>
            </View>
          </View>
        )}

        {/* Guidance text at top */}
        <View style={[styles.guidanceContainer, { top: insets.top + 60 }]}>
          <Text style={styles.guidanceTitle}>{config.title}</Text>
          <Text style={styles.guidanceSubtitle}>{config.subtitle}</Text>
        </View>

        {/* Tips — selfie-specific or generic */}
        <View style={[styles.tipsContainer, isSelfie && { bottom: 250 }]}>
          {isSelfie ? (
            <>
              <View style={styles.tipRow}>
                <Ionicons
                  name="glasses-outline"
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.tipText}>No glasses</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons
                  name="card-outline"
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.tipText}>ID visible</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons
                  name="sunny-outline"
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.tipText}>Good lighting</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.tipRow}>
                <Ionicons
                  name="sunny-outline"
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.tipText}>Good lighting</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons
                  name="hand-left-outline"
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.tipText}>Hold steady</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons
                  name="eye-outline"
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.tipText}>Clear text</Text>
              </View>
            </>
          )}
        </View>

        {/* Selfie pre-capture checklist */}
        {isSelfie && (
          <View
            style={[
              styles.selfieChecklist,
              { bottom: insets.bottom + 115 },
            ]}
          >
            <TouchableOpacity
              style={styles.checklistRow}
              onPress={() => setCheckGlasses((v) => !v)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={checkGlasses ? "checkbox" : "square-outline"}
                size={22}
                color={
                  checkGlasses ? Colors.success : "rgba(255,255,255,0.8)"
                }
              />
              <Text style={styles.checklistText}>
                I removed glasses, hats & face coverings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checklistRow}
              onPress={() => setCheckId((v) => !v)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={checkId ? "checkbox" : "square-outline"}
                size={22}
                color={checkId ? Colors.success : "rgba(255,255,255,0.8)"}
              />
              <Text style={styles.checklistText}>
                I am holding my ID next to my face
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
          {/* Close button */}
          <TouchableOpacity style={styles.controlButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>

          {/* Capture button */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              (isCapturing ||
                (isSelfie && !(checkGlasses && checkId))) &&
                styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={
              isCapturing || (isSelfie && !(checkGlasses && checkId))
            }
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* Flash toggle (only for back camera) */}
          {config.facing === "back" ? (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}
            >
              <Ionicons
                name={flashMode === "on" ? "flash" : "flash-off"}
                size={24}
                color={Colors.white}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.controlButton} />
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textHint,
  },

  // Permission screen
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  permissionCloseButton: {
    position: "absolute",
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  permissionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  permissionDescription: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionFeatures: {
    alignSelf: "stretch",
    gap: 12,
    marginBottom: 32,
  },
  permissionFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  permissionFeatureText: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "stretch",
  },
  permissionButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  settingsButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  settingsButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
  },

  // Overlay
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  darkSection: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  middleRow: {
    flexDirection: "row",
  },
  frame: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
  },
  ovalFrame: {
    borderRadius: 1000,
  },

  // Corner markers
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: Colors.primary,
    borderWidth: 4,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },

  // Guidance
  guidanceContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  guidanceTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  guidanceSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginTop: 6,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Tips
  tipsContainer: {
    position: "absolute",
    bottom: 160,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tipText: {
    fontSize: 12,
    color: Colors.white,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Controls
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.white,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
  },

  // Selfie-specific styles
  selfieIdReminder: {
    position: "absolute",
    top: (SCREEN_HEIGHT + OVAL_SIZE * 1.3) / 2 + 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  selfieIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  selfieIdBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selfieChecklist: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checklistText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: "500",
    flex: 1,
  },
});

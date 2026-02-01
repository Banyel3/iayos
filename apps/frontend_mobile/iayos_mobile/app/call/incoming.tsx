/**
 * Incoming Call Screen
 *
 * Full-screen modal displayed when receiving an incoming voice call.
 * Shows caller information with Accept/Reject buttons.
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Colors, Typography } from "@/constants/theme";
import { useAgoraCall } from "@/lib/hooks/useAgoraCall";
import { getAbsoluteMediaUrl } from "@/lib/api/config";

export default function IncomingCallScreen() {
  const { conversationId, callerName, callerAvatar } = useLocalSearchParams<{
    conversationId: string;
    callerName: string;
    callerAvatar?: string;
  }>();

  const { acceptCall, rejectCall, callStatus } = useAgoraCall();

  // Animation for pulsing avatar ring
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation and vibration
  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Vibration pattern (ring effect)
    const vibrationPattern = Platform.OS === "ios" ? [1000] : [0, 1000, 500, 1000];
    const vibrationInterval = setInterval(() => {
      Vibration.vibrate(vibrationPattern);
    }, 2500);

    return () => {
      pulse.stop();
      clearInterval(vibrationInterval);
      Vibration.cancel();
    };
  }, []);

  // Handle accept
  const handleAccept = async () => {
    Vibration.cancel();
    await acceptCall();
  };

  // Handle reject
  const handleReject = () => {
    Vibration.cancel();
    rejectCall("User declined");
    if (router.canGoBack()) {
      router.back();
    }
  };

  const avatarUrl = callerAvatar ? getAbsoluteMediaUrl(callerAvatar) : null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background gradient effect */}
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {/* Caller Info */}
      <View style={styles.callerSection}>
        <Animated.View
          style={[
            styles.avatarContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.avatarRing}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={64} color={Colors.textLight} />
              </View>
            )}
          </View>
        </Animated.View>

        <Text style={styles.callerName}>{callerName || "Unknown Caller"}</Text>
        <Text style={styles.callStatus}>Incoming voice call...</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {/* Reject Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={32} color={Colors.textLight} style={styles.rejectIcon} />
          <Text style={styles.actionLabel}>Decline</Text>
        </TouchableOpacity>

        {/* Accept Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={handleAccept}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={32} color={Colors.textLight} />
          <Text style={styles.actionLabel}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e", // Dark background
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#16213e",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#1a1a2e",
  },
  callerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  avatarContainer: {
    marginBottom: 32,
  },
  avatarRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(84, 183, 236, 0.2)",
  },
  avatar: {
    width: 144,
    height: 144,
    borderRadius: 72,
  },
  avatarPlaceholder: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: Colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  callerName: {
    fontSize: Typography.heading.h2.fontSize,
    fontWeight: "700",
    color: Colors.textLight,
    marginBottom: 8,
    textAlign: "center",
  },
  callStatus: {
    fontSize: Typography.body.medium.fontSize,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  actionSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 48,
    paddingBottom: 80,
    paddingTop: 40,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  rejectIcon: {
    transform: [{ rotate: "135deg" }],
  },
  actionLabel: {
    fontSize: Typography.body.small.fontSize,
    color: Colors.textLight,
    marginTop: 12,
    position: "absolute",
    bottom: -28,
  },
});

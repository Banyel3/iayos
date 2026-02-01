/**
 * Active Call Screen
 *
 * Full-screen interface displayed during an active voice call.
 * Shows call status, duration, and controls for mute/speaker/end.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Colors, Typography } from "@/constants/theme";
import { useAgoraCall } from "@/lib/hooks/useAgoraCall";
import { getAbsoluteMediaUrl } from "@/lib/api/config";

export default function ActiveCallScreen() {
  const {
    conversationId,
    recipientName,
    recipientAvatar,
    isOutgoing,
  } = useLocalSearchParams<{
    conversationId: string;
    recipientName?: string;
    recipientAvatar?: string;
    isOutgoing?: string;
  }>();

  const {
    callStatus,
    callState,
    endCall,
    toggleMute,
    toggleSpeaker,
    getFormattedDuration,
  } = useAgoraCall();

  const [duration, setDuration] = useState("00:00");

  // Update duration display
  useEffect(() => {
    const interval = setInterval(() => {
      if (callState.isInCall) {
        setDuration(getFormattedDuration());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [callState.isInCall, getFormattedDuration]);

  // Get status text
  const getStatusText = () => {
    switch (callStatus) {
      case "initiating":
        return "Starting call...";
      case "ringing":
        return isOutgoing === "true" ? "Calling..." : "Ringing...";
      case "connecting":
        return "Connecting...";
      case "connected":
        return duration;
      case "ended":
        return "Call ended";
      case "failed":
        return "Call failed";
      case "busy":
        return "User busy";
      default:
        return "";
    }
  };

  const isConnected = callStatus === "connected";
  const isWaiting = ["initiating", "ringing", "connecting"].includes(callStatus);

  const avatarUrl = recipientAvatar ? getAbsoluteMediaUrl(recipientAvatar) : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Call</Text>
      </View>

      {/* Caller/Recipient Info */}
      <View style={styles.callerSection}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={56} color={Colors.textLight} />
            </View>
          )}
        </View>

        <Text style={styles.callerName}>
          {recipientName || "Voice Call"}
        </Text>

        <View style={styles.statusContainer}>
          {isWaiting && (
            <View style={styles.statusDot} />
          )}
          <Text style={styles.callStatus}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Connection Quality Indicator */}
      {isConnected && (
        <View style={styles.qualityContainer}>
          <Ionicons
            name="wifi"
            size={16}
            color={
              callState.connectionState === "connected"
                ? Colors.success
                : Colors.warning
            }
          />
          <Text style={styles.qualityText}>
            {callState.connectionState === "connected" ? "Good connection" : "Connecting..."}
          </Text>
        </View>
      )}

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Secondary Controls Row */}
        <View style={styles.secondaryControls}>
          {/* Mute Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              callState.isMuted && styles.controlButtonActive,
            ]}
            onPress={toggleMute}
            disabled={!isConnected}
            activeOpacity={0.7}
          >
            <Ionicons
              name={callState.isMuted ? "mic-off" : "mic"}
              size={28}
              color={callState.isMuted ? Colors.textPrimary : Colors.textLight}
            />
            <Text
              style={[
                styles.controlLabel,
                callState.isMuted && styles.controlLabelActive,
              ]}
            >
              {callState.isMuted ? "Unmute" : "Mute"}
            </Text>
          </TouchableOpacity>

          {/* Speaker Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              callState.isSpeakerOn && styles.controlButtonActive,
            ]}
            onPress={toggleSpeaker}
            disabled={!isConnected}
            activeOpacity={0.7}
          >
            <Ionicons
              name={callState.isSpeakerOn ? "volume-high" : "volume-medium"}
              size={28}
              color={callState.isSpeakerOn ? Colors.textPrimary : Colors.textLight}
            />
            <Text
              style={[
                styles.controlLabel,
                callState.isSpeakerOn && styles.controlLabelActive,
              ]}
            >
              {callState.isSpeakerOn ? "Earpiece" : "Speaker"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* End Call Button */}
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={endCall}
          activeOpacity={0.8}
        >
          <Ionicons
            name="call"
            size={36}
            color={Colors.textLight}
            style={styles.endCallIcon}
          />
        </TouchableOpacity>

        <Text style={styles.endCallLabel}>End Call</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.body.medium.fontSize,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  callerSection: {
    alignItems: "center",
    paddingTop: 40,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  callerName: {
    fontSize: Typography.heading.h2.fontSize,
    fontWeight: "700",
    color: Colors.textLight,
    marginBottom: 8,
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  callStatus: {
    fontSize: Typography.heading.h4.fontSize,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  qualityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 6,
  },
  qualityText: {
    fontSize: Typography.body.small.fontSize,
    color: "rgba(255, 255, 255, 0.6)",
  },
  spacer: {
    flex: 1,
  },
  controlsContainer: {
    alignItems: "center",
    paddingBottom: 60,
  },
  secondaryControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 48,
    marginBottom: 48,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: Colors.textLight,
  },
  controlLabel: {
    position: "absolute",
    bottom: -24,
    fontSize: Typography.body.small.fontSize,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    width: 80,
  },
  controlLabelActive: {
    color: Colors.textLight,
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  endCallIcon: {
    transform: [{ rotate: "135deg" }],
  },
  endCallLabel: {
    fontSize: Typography.body.small.fontSize,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
});

/**
 * Agora Voice Calling React Hook
 *
 * Manages voice call state, WebSocket signaling, and Agora RTC integration.
 * Handles call initiation, acceptance, rejection, and missed call timeout (30s).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { router } from "expo-router";
import { agoraService, CallState } from "../services/agora";
import { ENDPOINTS, WS_BASE_URL, apiRequest } from "../api/config";

// Call signaling timeout (30 seconds for unanswered calls)
const CALL_TIMEOUT_MS = 30000;

export interface CallTokenResponse {
  token: string;
  channel_name: string;
  uid: number;
  app_id: string;
}

export interface CallSignal {
  type:
    | "call.initiate"
    | "call.incoming"
    | "call.accept"
    | "call.accepted"
    | "call.reject"
    | "call.rejected"
    | "call.end"
    | "call.ended"
    | "call.busy"
    | "call.missed";
  conversation_id: number;
  caller_id?: number;
  caller_name?: string;
  caller_avatar?: string;
  recipient_id?: number;
  recipient_name?: string;
  reason?: string;
}

export interface CallInfo {
  conversationId: number;
  callerId: number;
  callerName: string;
  callerAvatar: string | null;
  recipientId?: number;
  recipientName?: string;
}

export type CallStatus =
  | "idle"
  | "initiating"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "failed"
  | "busy";

interface UseAgoraCallReturn {
  // State
  callStatus: CallStatus;
  callState: CallState;
  incomingCall: CallInfo | null;
  currentCall: CallInfo | null;
  error: string | null;

  // Actions
  initiateCall: (conversationId: number, recipientName?: string) => Promise<boolean>;
  acceptCall: () => Promise<boolean>;
  rejectCall: (reason?: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;

  // Helpers
  getFormattedDuration: () => string;
}

export function useAgoraCall(): UseAgoraCallReturn {
  // State
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callState, setCallState] = useState<CallState>(agoraService.state);
  const [incomingCall, setIncomingCall] = useState<CallInfo | null>(null);
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs - using ReturnType for cross-platform compatibility
  // Using 'any' for WebSocket to avoid Node.js vs browser type conflicts
  const wsRef = useRef<any>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenDataRef = useRef<CallTokenResponse | null>(null);

  // Clear call timeout
  const clearCallTimeout = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, []);

  // Set call timeout (30 seconds)
  const setCallTimeout = useCallback(
    (onTimeout: () => void) => {
      clearCallTimeout();
      callTimeoutRef.current = setTimeout(() => {
        console.log("[Call] ⏰ Call timeout - missed call");
        onTimeout();
      }, CALL_TIMEOUT_MS);
    },
    [clearCallTimeout]
  );

  // Fetch call token from backend
  const fetchCallToken = useCallback(
    async (conversationId: number): Promise<CallTokenResponse | null> => {
      try {
        console.log("[Call] Fetching call token...");
        const response = await apiRequest(ENDPOINTS.CALL_TOKEN(conversationId), {
          method: "POST",
        });

        if (!response.ok) {
          const errorData = await response.json() as { error?: string };
          throw new Error(errorData.error || "Failed to get call token");
        }

        const data = await response.json() as CallTokenResponse;
        console.log("[Call] ✅ Got call token for channel:", data.channel_name);
        return data;
      } catch (err: any) {
        console.error("[Call] ❌ Token fetch error:", err);
        setError(err.message || "Failed to get call token");
        return null;
      }
    },
    []
  );

  // Connect WebSocket for call signaling
  const connectSignaling = useCallback(
    (conversationId: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          resolve(wsRef.current);
          return;
        }

        const url = `${WS_BASE_URL}/ws/call/${conversationId}/`;
        console.log("[Call] Connecting signaling WebSocket:", url);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[Call] ✅ Signaling WebSocket connected");
          resolve(ws);
        };

        ws.onerror = (err) => {
          console.error("[Call] ❌ WebSocket error:", err);
          reject(new Error("Failed to connect signaling"));
        };

        ws.onclose = () => {
          console.log("[Call] WebSocket closed");
          wsRef.current = null;
        };

        ws.onmessage = (event) => {
          try {
            const signal: CallSignal = JSON.parse(event.data);
            handleSignal(signal);
          } catch (err) {
            console.error("[Call] Failed to parse signal:", err);
          }
        };
      });
    },
    []
  );

  // Handle incoming signals
  const handleSignal = useCallback(
    (signal: CallSignal) => {
      console.log("[Call] 📨 Signal received:", signal.type);

      switch (signal.type) {
        case "call.incoming":
          // Someone is calling us
          setIncomingCall({
            conversationId: signal.conversation_id,
            callerId: signal.caller_id!,
            callerName: signal.caller_name || "Unknown",
            callerAvatar: signal.caller_avatar || null,
          });
          setCallStatus("ringing");

          // Navigate to incoming call screen
          router.push({
            pathname: "/call/incoming" as any,
            params: {
              conversationId: signal.conversation_id.toString(),
              callerName: signal.caller_name || "Unknown",
              callerAvatar: signal.caller_avatar || "",
            },
          });
          break;

        case "call.accepted":
          // Our call was accepted - join the voice channel
          clearCallTimeout();
          setCallStatus("connecting");
          joinVoiceChannel();
          break;

        case "call.rejected":
          // Our call was rejected
          clearCallTimeout();
          setCallStatus("ended");
          setCurrentCall(null);
          setError("Call declined");
          router.back();
          break;

        case "call.ended":
          // Call ended by other party
          clearCallTimeout();
          agoraService.leaveChannel();
          setCallStatus("ended");
          setCurrentCall(null);
          setIncomingCall(null);
          router.back();
          break;

        case "call.busy":
          // Other party is on another call
          clearCallTimeout();
          setCallStatus("busy");
          setCurrentCall(null);
          setError("User is busy on another call");
          break;

        case "call.missed":
          // Call timed out (wasn't answered)
          clearCallTimeout();
          setCallStatus("ended");
          setCurrentCall(null);
          setError("Call not answered");
          router.back();
          break;
      }
    },
    [clearCallTimeout]
  );

  // Join the Agora voice channel
  const joinVoiceChannel = useCallback(async () => {
    const tokenData = tokenDataRef.current;
    if (!tokenData) {
      console.error("[Call] No token data available");
      setError("Call setup failed - no token");
      return;
    }

    // Initialize Agora if needed
    const initialized = await agoraService.initialize(tokenData.app_id);
    if (!initialized) {
      setError("Failed to initialize audio");
      return;
    }

    // Join channel
    const joined = await agoraService.joinChannel(
      tokenData.token,
      tokenData.channel_name,
      tokenData.uid,
      {
        onUserJoined: (uid) => {
          console.log("[Call] ✅ Remote user joined:", uid);
          setCallStatus("connected");
        },
        onUserOffline: () => {
          console.log("[Call] Remote user left");
          endCall();
        },
        onError: (code, msg) => {
          console.error(`[Call] Agora error ${code}: ${msg}`);
          setError(`Call error: ${msg}`);
          setCallStatus("failed");
        },
      }
    );

    if (!joined) {
      setError("Failed to join call");
      setCallStatus("failed");
    } else {
      setCallStatus("connected");
      // Navigate to active call screen
      router.replace({
        pathname: "/call/active" as any,
        params: {
          conversationId: currentCall?.conversationId?.toString() || "",
          recipientName: currentCall?.recipientName || "",
        },
      });
    }
  }, [currentCall]);

  // Send signal via WebSocket
  const sendSignal = useCallback((action: string, data: Record<string, any> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action, ...data });
      console.log("[Call] 📤 Sending signal:", action);
      wsRef.current.send(message);
    } else {
      console.error("[Call] WebSocket not connected, cannot send signal");
    }
  }, []);

  // Initiate a call
  const initiateCall = useCallback(
    async (conversationId: number, recipientName?: string): Promise<boolean> => {
      try {
        setError(null);
        setCallStatus("initiating");

        // Get call token first
        const tokenData = await fetchCallToken(conversationId);
        if (!tokenData) {
          setCallStatus("failed");
          return false;
        }
        tokenDataRef.current = tokenData;

        // Initialize Agora
        const initialized = await agoraService.initialize(tokenData.app_id);
        if (!initialized) {
          setCallStatus("failed");
          return false;
        }

        // Connect signaling WebSocket
        await connectSignaling(conversationId);

        // Set current call info
        setCurrentCall({
          conversationId,
          callerId: tokenData.uid,
          callerName: "You",
          callerAvatar: null,
          recipientName,
        });

        // Send call initiation signal
        sendSignal("initiate");
        setCallStatus("ringing");

        // Set 30-second timeout for unanswered call
        setCallTimeout(() => {
          sendSignal("end", { reason: "timeout" });
          setCallStatus("ended");
          setCurrentCall(null);
          setError("No answer");
          router.back();
        });

        // Navigate to active call screen (shows "Calling...")
        router.push({
          pathname: "/call/active" as any,
          params: {
            conversationId: conversationId.toString(),
            recipientName: recipientName || "",
            isOutgoing: "true",
          },
        });

        return true;
      } catch (err: any) {
        console.error("[Call] ❌ Initiate call error:", err);
        setError(err.message || "Failed to start call");
        setCallStatus("failed");
        return false;
      }
    },
    [fetchCallToken, connectSignaling, sendSignal, setCallTimeout]
  );

  // Accept incoming call
  const acceptCall = useCallback(async (): Promise<boolean> => {
    try {
      if (!incomingCall) {
        console.error("[Call] No incoming call to accept");
        return false;
      }

      setError(null);
      setCallStatus("connecting");
      clearCallTimeout();

      // Get call token
      const tokenData = await fetchCallToken(incomingCall.conversationId);
      if (!tokenData) {
        setCallStatus("failed");
        return false;
      }
      tokenDataRef.current = tokenData;

      // Send accept signal
      sendSignal("accept");

      // Set current call from incoming
      setCurrentCall(incomingCall);
      setIncomingCall(null);

      // Join voice channel
      await joinVoiceChannel();

      return true;
    } catch (err: any) {
      console.error("[Call] ❌ Accept call error:", err);
      setError(err.message || "Failed to accept call");
      setCallStatus("failed");
      return false;
    }
  }, [incomingCall, fetchCallToken, sendSignal, clearCallTimeout, joinVoiceChannel]);

  // Reject incoming call
  const rejectCall = useCallback(
    (reason?: string) => {
      console.log("[Call] Rejecting call");
      sendSignal("reject", { reason });
      clearCallTimeout();
      setIncomingCall(null);
      setCallStatus("idle");
      router.back();
    },
    [sendSignal, clearCallTimeout]
  );

  // End current call
  const endCall = useCallback(() => {
    console.log("[Call] Ending call");
    clearCallTimeout();
    sendSignal("end");
    agoraService.leaveChannel();
    setCallStatus("ended");
    setCurrentCall(null);
    setIncomingCall(null);

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Navigate back
    if (router.canGoBack()) {
      router.back();
    }
  }, [sendSignal, clearCallTimeout]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    agoraService.toggleMute();
  }, []);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    agoraService.toggleSpeaker();
  }, []);

  // Get formatted duration
  const getFormattedDuration = useCallback(() => {
    return agoraService.getFormattedDuration();
  }, []);

  // Subscribe to Agora state changes
  useEffect(() => {
    const unsubscribe = agoraService.addStateListener((newState) => {
      setCallState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCallTimeout();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearCallTimeout]);

  return {
    callStatus,
    callState,
    incomingCall,
    currentCall,
    error,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    getFormattedDuration,
  };
}

export default useAgoraCall;

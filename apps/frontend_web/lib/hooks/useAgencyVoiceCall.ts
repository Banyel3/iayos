"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, WS_BASE_URL } from "@/lib/api/config";
import { agoraWebService } from "@/lib/services/agoraWeb";

export type AgencyCallStatus =
  | "idle"
  | "initiating"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "failed"
  | "busy";

type TokenResponse = {
  token: string;
  channel_name: string;
  uid: number;
  app_id: string;
};

type IncomingCall = {
  conversationId: number;
  callerName: string;
  isGroupCall?: boolean;
};

const CALL_TIMEOUT_MS = 30000;

export function useAgencyVoiceCall() {
  const [callStatus, setCallStatus] = useState<AgencyCallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<TokenResponse | null>(null);
  const callStartedAtRef = useRef<number | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    callStartedAtRef.current = null;
    setDurationSeconds(0);
  }, []);

  const startDurationTimer = useCallback(() => {
    stopDurationTimer();
    callStartedAtRef.current = Date.now();
    durationTimerRef.current = setInterval(() => {
      if (!callStartedAtRef.current) return;
      setDurationSeconds(Math.floor((Date.now() - callStartedAtRef.current) / 1000));
    }, 1000);
  }, [stopDurationTimer]);

  const getWsUrl = useCallback((conversationId: number) => {
    const rawToken = typeof window !== "undefined" ? localStorage.getItem("ws_token") : null;
    const protocol = WS_BASE_URL.startsWith("localhost") || WS_BASE_URL.startsWith("127.0.0.1") ? "ws" : "wss";
    const base = `${protocol}://${WS_BASE_URL}`;
    if (!rawToken) return `${base}/ws/call/${conversationId}/`;
    return `${base}/ws/call/${conversationId}/?token=${encodeURIComponent(rawToken)}`;
  }, []);

  const fetchToken = useCallback(async (conversationId: number): Promise<TokenResponse | null> => {
    try {
      const response = await fetch(
        `${API_BASE}/api/profiles/call/token?conversation_id=${conversationId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({} as { error?: string }));
        throw new Error(data.error || "Failed to get call token");
      }

      return (await response.json()) as TokenResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get call token";
      setError(message);
      return null;
    }
  }, []);

  const cleanupCall = useCallback(async () => {
    clearTimeoutRef();
    stopDurationTimer();
    await agoraWebService.leave();
  }, [clearTimeoutRef, stopDurationTimer]);

  const sendSignal = useCallback((action: string, data: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...data }));
    }
  }, []);

  const connectSignaling = useCallback(async (conversationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(getWsUrl(conversationId));
      wsRef.current = ws;

      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("Failed to connect call signaling"));
      ws.onclose = () => {
        wsRef.current = null;
      };

      ws.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            event?: string;
            data?: Record<string, unknown>;
          };

          if (payload.type !== "call_event") return;

          const eventName = payload.event;
          const data = payload.data || {};

          if (eventName === "incoming") {
            setIncomingCall({
              conversationId: Number(data.conversation_id || conversationId),
              callerName: String(data.caller_name || "Unknown"),
              isGroupCall: Boolean(data.is_group),
            });
            setCallStatus("ringing");
            return;
          }

          if (eventName === "accepted") {
            clearTimeoutRef();
            setCallStatus("connecting");
            const tokenData = tokenRef.current;
            if (tokenData) {
              const joined = await agoraWebService.join(
                tokenData.app_id,
                tokenData.channel_name,
                tokenData.token,
                tokenData.uid,
              );
              if (joined) {
                setCallStatus("connected");
                startDurationTimer();
              } else {
                setCallStatus("failed");
                setError("Failed to join voice channel");
              }
            }
            return;
          }

          if (eventName === "rejected") {
            clearTimeoutRef();
            await cleanupCall();
            setCallStatus("ended");
            setError("Call declined");
            return;
          }

          if (eventName === "busy") {
            clearTimeoutRef();
            await cleanupCall();
            setCallStatus("busy");
            setError("User is busy");
            return;
          }

          if (eventName === "ended" || eventName === "missed") {
            clearTimeoutRef();
            await cleanupCall();
            setIncomingCall(null);
            setCallStatus("ended");
          }
        } catch {
          // Ignore malformed payloads
        }
      };
    });
  }, [cleanupCall, clearTimeoutRef, getWsUrl, startDurationTimer]);

  const initiateCall = useCallback(async (conversationId: number, isGroupCall = false) => {
    setError(null);
    setCallStatus("initiating");

    const token = await fetchToken(conversationId);
    if (!token) {
      setCallStatus("failed");
      return false;
    }

    tokenRef.current = token;
    await connectSignaling(conversationId);
    sendSignal("initiate", {
      channel_name: token.channel_name,
      is_group: isGroupCall,
    });
    setCallStatus("ringing");

    clearTimeoutRef();
    timeoutRef.current = setTimeout(async () => {
      sendSignal("end", { reason: "timeout" });
      await cleanupCall();
      setCallStatus("ended");
      setError("No answer");
    }, CALL_TIMEOUT_MS);

    return true;
  }, [cleanupCall, clearTimeoutRef, connectSignaling, fetchToken, sendSignal]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return false;

    setError(null);
    setCallStatus("connecting");

    const token = await fetchToken(incomingCall.conversationId);
    if (!token) {
      setCallStatus("failed");
      return false;
    }

    tokenRef.current = token;
    await connectSignaling(incomingCall.conversationId);
    sendSignal("accept");

    const joined = await agoraWebService.join(
      token.app_id,
      token.channel_name,
      token.token,
      token.uid,
    );

    if (!joined) {
      setCallStatus("failed");
      setError("Failed to join voice channel");
      return false;
    }

    setIncomingCall(null);
    setCallStatus("connected");
    startDurationTimer();
    return true;
  }, [connectSignaling, fetchToken, incomingCall, sendSignal, startDurationTimer]);

  const rejectCall = useCallback(async () => {
    sendSignal("reject", { reason: "declined" });
    setIncomingCall(null);
    setCallStatus("idle");
    await cleanupCall();
  }, [cleanupCall, sendSignal]);

  const endCall = useCallback(async () => {
    sendSignal("end", { duration: durationSeconds });
    await cleanupCall();
    setIncomingCall(null);
    setCallStatus("ended");
  }, [cleanupCall, durationSeconds, sendSignal]);

  const toggleMute = useCallback(() => {
    return agoraWebService.toggleMute();
  }, []);

  useEffect(() => {
    return () => {
      clearTimeoutRef();
      stopDurationTimer();
      if (wsRef.current) {
        wsRef.current.close();
      }
      agoraWebService.leave();
    };
  }, [clearTimeoutRef, stopDurationTimer]);

  return {
    callStatus,
    error,
    incomingCall,
    durationSeconds,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    remoteParticipantCount: agoraWebService.getRemoteParticipantCount(),
  };
}

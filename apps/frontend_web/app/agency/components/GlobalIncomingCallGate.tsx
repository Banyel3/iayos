"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Phone, PhoneOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { useAgencyConversations } from "@/lib/hooks/useAgencyConversations";
import { WS_BASE_URL } from "@/lib/api/config";

type IncomingCallPayload = {
  conversationId: number;
  callerName: string;
  isGroupCall: boolean;
};

const STORAGE_KEY = "agency_pending_call";

function buildCallWsUrl(conversationId: number) {
  const token = typeof window !== "undefined" ? localStorage.getItem("ws_token") : null;
  const protocol =
    WS_BASE_URL.startsWith("localhost") || WS_BASE_URL.startsWith("127.0.0.1")
      ? "ws"
      : "wss";
  const base = `${protocol}://${WS_BASE_URL}`;

  if (!token) {
    return `${base}/ws/call/${conversationId}/`;
  }

  return `${base}/ws/call/${conversationId}/?token=${encodeURIComponent(token)}`;
}

export default function GlobalIncomingCallGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useAgencyConversations("active");

  const socketsRef = useRef<Map<number, WebSocket>>(new Map());
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);

  const shouldIgnoreConversationModal = useCallback(
    (conversationId: number) => {
      return pathname === `/agency/messages/${conversationId}`;
    },
    [pathname],
  );

  useEffect(() => {
    const conversationIds = new Set((data?.conversations || []).map((conv) => conv.id));

    // Close sockets for conversations no longer listed.
    socketsRef.current.forEach((socket, id) => {
      if (!conversationIds.has(id)) {
        socket.close();
        socketsRef.current.delete(id);
      }
    });

    // Open sockets for active conversations not yet connected.
    conversationIds.forEach((conversationId) => {
      if (socketsRef.current.has(conversationId)) {
        return;
      }

      const ws = new WebSocket(buildCallWsUrl(conversationId));
      socketsRef.current.set(conversationId, ws);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            event?: string;
            data?: Record<string, unknown>;
          };

          if (payload.type !== "call_event") return;
          if (payload.event !== "incoming") return;

          const dataPayload = payload.data || {};
          const targetConversationId = Number(dataPayload.conversation_id || conversationId);

          if (shouldIgnoreConversationModal(targetConversationId)) {
            return;
          }

          setIncomingCall({
            conversationId: targetConversationId,
            callerName: String(dataPayload.caller_name || "Unknown"),
            isGroupCall: Boolean(dataPayload.is_group),
          });
        } catch {
          // Ignore malformed payloads.
        }
      };

      ws.onclose = () => {
        socketsRef.current.delete(conversationId);
      };

      ws.onerror = () => {
        // Silent fail; retry on next re-render cycle from active conversations refresh.
      };
    });

    return () => {
      // Keep sockets alive while component remains mounted.
    };
  }, [data?.conversations, shouldIgnoreConversationModal]);

  useEffect(() => {
    return () => {
      socketsRef.current.forEach((socket) => socket.close());
      socketsRef.current.clear();
    };
  }, []);

  const declineIncomingCall = () => {
    if (!incomingCall) return;

    const ws = socketsRef.current.get(incomingCall.conversationId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "reject", reason: "declined" }));
    }
    setIncomingCall(null);
  };

  const openConversationToAnswer = () => {
    if (!incomingCall) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(incomingCall));
    const destination = `/agency/messages/${incomingCall.conversationId}?incoming_call=1`;
    setIncomingCall(null);
    router.push(destination);
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 space-y-4 text-center">
          <p className="text-sm text-gray-500">Incoming voice call</p>
          <h3 className="text-lg font-semibold text-gray-900">{incomingCall.callerName}</h3>
          <p className="text-xs text-gray-500">
            {incomingCall.isGroupCall ? "Group call" : "Direct call"}
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              className="border-red-500 text-red-700 hover:bg-red-50"
              onClick={declineIncomingCall}
            >
              <PhoneOff className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={openConversationToAnswer}>
              <Phone className="h-4 w-4 mr-1" />
              Open to Answer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

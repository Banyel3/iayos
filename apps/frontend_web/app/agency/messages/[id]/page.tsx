"use client";

// Agency Chat Screen
// 1-on-1 messaging with real-time updates, image uploads, and typing indicators
// Ported from React Native mobile app

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useMessages,
  useSendMessageMutation,
  useUploadImageMessage,
} from "@/lib/hooks/useMessages";
import {
  useMessageListener,
  useTypingIndicator,
  useWebSocketConnection,
} from "@/lib/hooks/useWebSocketHooks";
import MessageBubble from "@/components/agency/MessageBubble";
import MessageInput from "@/components/agency/MessageInput";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  WifiOff,
  Wifi,
  MoreVertical,
  Briefcase,
  MapPin,
} from "lucide-react";
import { format, isSameDay } from "date-fns";

export default function AgencyChatScreen() {
  const router = useRouter();
  const params = useParams();
  const conversationId = parseInt(params.id as string);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  // Fetch conversation and messages
  const {
    data: conversation,
    isLoading,
    refetch,
  } = useMessages(conversationId);

  // Send message mutation
  const sendMutation = useSendMessageMutation();
  const uploadImageMutation = useUploadImageMessage();

  // WebSocket connection state
  const { isConnected } = useWebSocketConnection();

  // WebSocket: Listen for new messages
  useMessageListener(conversationId);

  // WebSocket: Typing indicator
  const { isTyping, sendTyping } = useTypingIndicator(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversation?.messages.length) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [conversation?.messages.length]);

  // Handle send message
  const handleSendMessage = (text: string) => {
    sendMutation.mutate({
      conversationId,
      text,
      type: "TEXT",
    });
  };

  // Handle image upload
  const handleImageSelect = (file: File) => {
    uploadImageMutation.mutate({
      conversationId,
      imageFile: file,
    });
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render date separator
  const renderDateSeparator = (currentDate: Date, previousDate?: Date) => {
    if (!previousDate || !isSameDay(currentDate, previousDate)) {
      return (
        <div className="flex items-center justify-center my-4">
          <div className="bg-gray-200 px-3 py-1 rounded-full">
            <p className="text-xs text-gray-600">
              {format(currentDate, "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg font-medium text-gray-700 mb-4">
          Conversation not found
        </p>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    );
  }

  const { other_participant, job, messages } = conversation;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Card className="rounded-none border-b">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Participant info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={other_participant.avatar} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {getInitials(other_participant.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {other_participant.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-3 w-3" />
                  <span className="truncate">{job.title}</span>
                </div>
              </div>
            </div>

            {/* Right: Status badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isConnected ? (
                <Badge variant="default" className="bg-green-500">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Job info banner */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">{job.location}</span>
              </div>
              <Badge
                variant="outline"
                className="text-blue-700 border-blue-300"
              >
                ₱{job.budget.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => {
          const currentDate = new Date(message.created_at);
          const previousDate =
            index > 0 ? new Date(messages[index - 1].created_at) : undefined;

          return (
            <div key={`${message.message_id}-${index}`}>
              {renderDateSeparator(currentDate, previousDate)}
              <MessageBubble
                message={message}
                onImagePress={() =>
                  message.message_type === "IMAGE" &&
                  setShowImageModal(message.message_text)
                }
              />
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
            <span>{other_participant.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput
        onSend={handleSendMessage}
        onTyping={sendTyping}
        onImageSelect={handleImageSelect}
        disabled={!isConnected || sendMutation.isPending}
        isUploading={uploadImageMutation.isPending}
        placeholder={
          isConnected ? "Type a message..." : "Reconnecting... Please wait"
        }
      />

      {/* Image modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(null)}
        >
          <img
            src={showImageModal}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white"
            onClick={() => setShowImageModal(null)}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
}

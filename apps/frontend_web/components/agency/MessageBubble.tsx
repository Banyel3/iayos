// MessageBubble Component
// Displays a single message in the chat interface
// Ported from React Native mobile app

import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Message } from "@/lib/hooks/useMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCheck, Check } from "lucide-react";
import Image from "next/image";

type MessageBubbleProps = {
  message: Message;
  showTimestamp?: boolean;
  onImagePress?: () => void;
};

export default function MessageBubble({
  message,
  showTimestamp = false,
  onImagePress,
}: MessageBubbleProps) {
  const isMine = message.is_mine;
  const isImage = message.message_type === "IMAGE";

  // Format timestamp
  const messageDate = new Date(message.created_at);
  const timeString = format(messageDate, "HH:mm");
  const relativeTime = formatDistanceToNow(messageDate, { addSuffix: true });

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`flex items-end gap-2 mb-4 ${
        isMine ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar (only for received messages) */}
      {!isMine && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender_avatar} />
          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
            {getInitials(message.sender_name)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isMine
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        }`}
      >
        {/* Sender Name (only for received messages) */}
        {!isMine && (
          <p className="text-xs font-medium text-gray-600 mb-1">
            {message.sender_name}
          </p>
        )}

        {/* Image Message */}
        {isImage ? (
          <div
            className="cursor-pointer rounded-lg overflow-hidden"
            onClick={onImagePress}
          >
            <Image
              src={message.message_text}
              alt="Shared image"
              width={300}
              height={200}
              className="object-cover max-h-64"
            />
          </div>
        ) : (
          /* Text Message */
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.message_text}
          </p>
        )}

        {/* Time + Read Receipt */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span
            className={`text-xs ${isMine ? "text-blue-100" : "text-gray-500"}`}
          >
            {showTimestamp ? relativeTime : timeString}
          </span>
          {isMine && (
            <>
              {message.is_read ? (
                <CheckCheck className="h-4 w-4 text-blue-100" />
              ) : (
                <Check className="h-4 w-4 text-blue-100" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ConversationCard Component
// Displays a single conversation item in the list
// Ported from React Native mobile app

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Conversation } from "@/lib/hooks/useConversations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Clock } from "lucide-react";

type ConversationCardProps = {
  conversation: Conversation;
  onClick: () => void;
};

export default function ConversationCard({
  conversation,
  onClick,
}: ConversationCardProps) {
  // Format timestamp
  const formattedTime = conversation.last_message_time
    ? formatDistanceToNow(new Date(conversation.last_message_time), {
        addSuffix: true,
      })
    : null;

  // Truncate last message
  const truncatedMessage = conversation.last_message
    ? conversation.last_message.length > 60
      ? conversation.last_message.substring(0, 60) + "..."
      : conversation.last_message
    : "No messages yet";

  // Determine status color
  const getStatusBadge = () => {
    switch (conversation.job.status) {
      case "ACTIVE":
      case "IN_PROGRESS":
        return (
          <Badge variant="default" className="bg-green-500">
            {conversation.job.status === "ACTIVE" ? "Active" : "In Progress"}
          </Badge>
        );
      case "COMPLETED":
        return <Badge variant="secondary">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{conversation.job.status}</Badge>;
    }
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

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar with unread badge */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.other_participant.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(conversation.other_participant.name)}
              </AvatarFallback>
            </Avatar>
            {conversation.unread_count > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                {conversation.unread_count > 99
                  ? "99+"
                  : conversation.unread_count}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Name + Time */}
            <div className="flex items-center justify-between mb-1">
              <h3
                className={`text-sm font-medium truncate ${
                  conversation.unread_count > 0 ? "font-bold" : ""
                }`}
              >
                {conversation.other_participant.name}
              </h3>
              {formattedTime && (
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formattedTime}
                </span>
              )}
            </div>

            {/* Job Title */}
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
              <Briefcase className="h-3 w-3" />
              <span className="truncate">{conversation.job.title}</span>
            </div>

            {/* Last Message */}
            <p
              className={`text-sm text-gray-600 truncate ${
                conversation.unread_count > 0 ? "font-semibold" : ""
              }`}
            >
              {truncatedMessage}
            </p>

            {/* Bottom Row: Budget + Status */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-gray-700">
                ₱{conversation.job.budget.toLocaleString()}
              </span>
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

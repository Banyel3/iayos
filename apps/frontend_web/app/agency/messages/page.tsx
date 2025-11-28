"use client";

// Agency Messages - Conversations List
// Shows all conversations with search, filters, and real-time updates
// Ported from React Native mobile app

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useConversations,
  useConversationSearch,
  useUnreadCount,
} from "@/lib/hooks/useConversations";
import { useWebSocketConnection } from "@/lib/hooks/useWebSocketHooks";
import ConversationCard from "@/components/agency/ConversationCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Inbox,
  Archive,
  MessageSquare,
  Loader2,
  WifiOff,
  Wifi,
} from "lucide-react";

type FilterType = "all" | "unread" | "archived";

export default function AgencyMessagesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // WebSocket connection
  const { isConnected, connectionState, reconnect } = useWebSocketConnection();

  // Fetch conversations based on filter
  const {
    data: conversationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useConversations(activeFilter);

  // Search functionality
  const { conversations: searchResults } = useConversationSearch(searchQuery);

  // Determine which conversations to display
  const displayedConversations = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return conversationsData?.conversations || [];
  }, [searchQuery, searchResults, conversationsData]);

  // Get unread count for badge
  const { unreadCount } = useUnreadCount();

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle conversation click
  const handleConversationClick = (conversationId: number) => {
    router.push(`/agency/messages/${conversationId}`);
  };

  // Render filter button
  const renderFilterButton = (
    filter: FilterType,
    label: string,
    icon: React.ReactNode,
    count?: number
  ) => {
    const isActive = activeFilter === filter;

    return (
      <Button
        variant={isActive ? "default" : "outline"}
        className="relative"
        onClick={() => setActiveFilter(filter)}
      >
        {icon}
        <span className="ml-2">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="ml-2">
            {count}
          </Badge>
        )}
      </Button>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      );
    }

    if (searchQuery.trim()) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            No conversations found
          </p>
          <p className="text-sm text-gray-500">
            Try searching for a different name or job title
          </p>
        </div>
      );
    }

    if (activeFilter === "archived") {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Archive className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            No archived conversations
          </p>
          <p className="text-sm text-gray-500">
            Archived conversations will appear here
          </p>
        </div>
      );
    }

    if (activeFilter === "unread") {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            No unread messages
          </p>
          <p className="text-sm text-gray-500">You're all caught up!</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Inbox className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          No conversations yet
        </p>
        <p className="text-sm text-gray-500">
          Start messaging your clients and workers
        </p>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your conversations with clients and workers
            </p>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="bg-green-500">
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                onClick={reconnect}
                className="cursor-pointer"
              >
                <WifiOff className="h-3 w-3 mr-1" />
                {connectionState === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
              </Badge>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {renderFilterButton(
            "all",
            "All",
            <Inbox className="h-4 w-4" />,
            conversationsData?.total
          )}
          {renderFilterButton(
            "unread",
            "Unread",
            <MessageSquare className="h-4 w-4" />,
            unreadCount
          )}
          {renderFilterButton(
            "archived",
            "Archived",
            <Archive className="h-4 w-4" />
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Refresh</span>
            )}
          </Button>
        </div>
      </div>

      {/* Conversations list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchQuery.trim()
              ? `Search Results (${displayedConversations.length})`
              : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Conversations`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayedConversations.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-3">
              {displayedConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  onClick={() => handleConversationClick(conversation.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

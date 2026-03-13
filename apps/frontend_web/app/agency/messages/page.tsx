"use client";

// Agency Messages - Conversations List
// Shows all conversations for jobs managed by the agency
// Full WebSocket integration for real-time updates

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAgencyConversations,
  useAgencyConversationSearch,
  useAgencyUnreadCount,
  AgencyConversation,
} from "@/lib/hooks/useAgencyConversations";
import { useWebSocketConnection } from "@/lib/hooks/useWebSocketHooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/form_button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Inbox,
  Archive,
  MessageSquare,
  Loader2,
  WifiOff,
  Wifi,
  Briefcase,
  Clock,
  User,
  Users,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type FilterType = "active" | "unread" | "archived";

export default function AgencyMessagesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");

  // WebSocket connection for real-time updates
  const { isConnected, connectionState, reconnect } = useWebSocketConnection();

  // Fetch conversations based on filter using AGENCY-SPECIFIC endpoints
  const {
    data: conversationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useAgencyConversations(activeFilter);

  // Search functionality
  const { conversations: searchResults } =
    useAgencyConversationSearch(searchQuery);

  // Determine which conversations to display
  const displayedConversations = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return conversationsData?.conversations || [];
  }, [searchQuery, searchResults, conversationsData]);

  // Get unread count for badge - using AGENCY-SPECIFIC hook
  const { unreadCount } = useAgencyUnreadCount();

  // Auto-refresh on WebSocket connection
  useEffect(() => {
    if (isConnected) {
      refetch();
    }
  }, [isConnected, refetch]);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle conversation click
  const handleConversationClick = (conversationId: number) => {
    router.push(`/agency/messages/${conversationId}`);
  };

  // Get initials helper
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "IN_PROGRESS":
        return (
          <Badge variant="default" className="bg-green-500">
            {status === "ACTIVE" ? "Active" : "In Progress"}
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-blue-50 text-[#00BAF1] border border-[#00BAF1] hover:bg-blue-100">
            Completed
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render conversation card
  const renderConversationCard = (conversation: AgencyConversation) => {
    const formattedTime = conversation.last_message_time
      ? formatDistanceToNow(new Date(conversation.last_message_time), {
        addSuffix: true,
      })
      : null;

    const truncatedMessage = conversation.last_message
      ? conversation.last_message.length > 60
        ? conversation.last_message.substring(0, 60) + "..."
        : conversation.last_message
      : "No messages yet";

    return (
      <Card
        key={conversation.id}
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
        onClick={() => handleConversationClick(conversation.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Client Avatar with unread badge */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-14 w-14">
                <AvatarImage src={conversation.client.avatar || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                  {getInitials(conversation.client.name)}
                </AvatarFallback>
              </Avatar>
              {conversation.unread_count > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                  {conversation.unread_count > 99
                    ? "99+"
                    : conversation.unread_count}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Top Row: Client Name + Time */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-base truncate ${conversation.unread_count > 0
                      ? "font-bold text-gray-900"
                      : "font-medium text-gray-700"
                      }`}
                  >
                    {conversation.client.name}
                  </h3>
                  <Badge variant="outline" className="text-xs bg-blue-50">
                    <User className="h-3 w-3 mr-1" />
                    Client
                  </Badge>
                  {conversation.job.workerMarkedComplete &&
                    !conversation.job.clientMarkedComplete && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        Awaiting Approval
                      </Badge>
                    )}
                  {getStatusBadge(conversation.job.status)}
                </div>
                {formattedTime && (
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formattedTime}
                  </span>
                )}
              </div>

              {/* Job Title */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Briefcase className="h-4 w-4 text-[#00BAF1]" />
                <span className="truncate font-medium">
                  {conversation.job.title}
                </span>
              </div>

              {/* Last Message */}
              <p
                className={`text-sm truncate ${conversation.unread_count > 0
                  ? "font-semibold text-gray-800"
                  : "text-gray-500"
                  }`}
              >
                {truncatedMessage}
              </p>

              {/* Backjob Banner - Show if has active backjob */}
              {conversation.backjob?.has_backjob && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-800 truncate">
                      🔄 Active Backjob Request
                    </p>
                    <p className="text-xs text-amber-600 truncate">
                      {conversation.backjob.reason || "Backjob work required"}
                    </p>
                    {conversation.backjob.status && (
                      <p className="text-xs text-amber-700 font-medium mt-0.5">
                        Status:{" "}
                        {conversation.backjob.status === "UNDER_REVIEW"
                          ? "Action Required"
                          : conversation.backjob.status === "IN_NEGOTIATION"
                            ? "In Negotiation"
                            : "Pending Review"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Row: Budget + Status */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-bold text-gray-700">
                  ₱{(conversation.job.budget ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Assigned Employees (Multi-employee support) - Relocated below budget */}
              {conversation.assigned_employees &&
                conversation.assigned_employees.length > 0 ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <Users className="h-3 w-3 text-[#00BAF1]" />
                  <span>
                    Assigned ({conversation.assigned_employees.length}):{" "}
                    <span className="font-medium text-gray-700">
                      {conversation.assigned_employees
                        .map((e) => e.name)
                        .join(", ")}
                    </span>
                  </span>
                </div>
              ) : (
                conversation.assigned_employee && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <Users className="h-3 w-3 text-[#00BAF1]" />
                    <span>
                      Assigned to:{" "}
                      <span className="font-medium text-gray-700">
                        {conversation.assigned_employee.name}
                      </span>
                    </span>
                    {conversation.assigned_employee.employeeOfTheMonth && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-1">
                        🏆 EOTM
                      </Badge>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render filter button
  const renderFilterButton = (
    filter: FilterType,
    label: string,
    icon: React.ReactNode,
    count?: number,
  ) => {
    const isActive = activeFilter === filter;

    return (
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`relative h-10 px-6 rounded-xl transition-all duration-200 ${isActive
          ? "bg-white text-[#00BAF1] shadow-sm hover:bg-white"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        onClick={() => setActiveFilter(filter)}
      >
        {icon}
        <span className="ml-2 font-semibold">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={`ml-2 ${isActive ? "bg-[#00BAF1] text-white" : "bg-gray-200 text-gray-600"}`}
          >
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
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600 text-lg">Loading conversations...</p>
        </div>
      );
    }

    if (searchQuery.trim()) {
      return (
        <Card className="text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <Search className="h-20 w-20 text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-700 mb-2">
              No conversations found
            </p>
            <p className="text-sm text-gray-500">
              Try searching for a different client name, job title, or employee
            </p>
          </CardContent>
        </Card>
      );
    }

    if (activeFilter === "archived") {
      return (
        <Card className="text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <Archive className="h-20 w-20 text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-700 mb-2">
              No archived conversations
            </p>
            <p className="text-sm text-gray-500">
              Archived conversations will appear here
            </p>
          </CardContent>
        </Card>
      );
    }

    if (activeFilter === "unread") {
      return (
        <Card className="text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <MessageSquare className="h-20 w-20 text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-700 mb-2">
              No unread messages
            </p>
            <p className="text-sm text-gray-500">You're all caught up! 🎉</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="text-center py-16">
        <CardContent className="flex flex-col items-center justify-center">
          <Inbox className="h-20 w-20 text-gray-300 mb-4" />
          <p className="text-xl font-medium text-gray-700 mb-2">
            No conversations yet
          </p>
          <p className="text-sm text-gray-500 text-center max-w-md">
            When clients accept your agency for jobs, conversations will appear
            here. Accept job invitations to start messaging!
          </p>
          <Button className="mt-4" onClick={() => router.push("/agency/jobs")}>
            <Briefcase className="h-4 w-4 mr-2" />
            View Job Invitations
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-4">
      {/* Header Section (Admin style) */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Communicate with clients about your agency's jobs
            </p>
          </div>

          {/* Connection status (Moved to header right) */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Badge variant="default" className="bg-[#00BAF1] text-white py-1.5 px-3 shadow-sm border-0">
                <Wifi className="h-4 w-4 mr-2" />
                Live Updates
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                onClick={reconnect}
                className="cursor-pointer py-1.5 px-3 shadow-md"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                {connectionState === "connecting"
                  ? "Connecting..."
                  : "Click to Reconnect"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filters row (Admin style) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-[#00BAF1] transition-colors" />
            <Input
              type="text"
              placeholder="Search by client, job title, or employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-gray-200 focus:border-[#00BAF1] focus:ring-2 focus:ring-blue-100 rounded-xl bg-white shadow-sm"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="h-12 px-6 rounded-xl border-gray-200 hover:border-[#00BAF1] hover:text-[#00BAF1] shadow-sm font-medium"
          >
            {isRefetching ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-5 w-5 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Filter buttons as segmented tabs */}
        <div className="flex gap-2 flex-wrap p-1.5 bg-gray-100/50 rounded-2xl w-fit">
          {renderFilterButton(
            "active",
            "Active",
            <Inbox className="h-4 w-4" />,
            conversationsData?.total,
          )}
          {renderFilterButton(
            "unread",
            "Unread",
            <MessageSquare className="h-4 w-4" />,
            unreadCount,
          )}
          {renderFilterButton(
            "archived",
            "Archived",
            <Archive className="h-4 w-4" />,
          )}
        </div>
      </div>

      {/* Conversations list */}
      <div className="space-y-4">
        {displayedConversations.length === 0 ? (
          renderEmptyState()
        ) : (
          displayedConversations.map((conversation) =>
            renderConversationCard(conversation),
          )
        )}
      </div>
    </div>
  );
}

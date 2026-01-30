"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/form_button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Search,
  Settings,
  Filter,
  RefreshCw,
  Briefcase,
  MessageSquare,
  CreditCard,
  Shield,
  Star,
  AlertCircle,
  ChevronRight,
  Loader2,
  Clock,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { getErrorMessage } from "@/lib/utils/parse-api-error";
import { formatDistanceToNow } from "date-fns";
import { API_BASE_URL } from "@/lib/api/config";

type FilterType = "all" | "unread" | "read";
type NotificationType =
  | "all"
  | "job"
  | "kyc"
  | "payment"
  | "message"
  | "review"
  | "system";

export default function AgencyNotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get notification icon and color based on type
  const getNotificationStyle = (type: string) => {
    if (type.includes("JOB") || type.includes("APPLICATION")) {
      return {
        icon: Briefcase,
        bgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        badgeColor: "bg-blue-100 text-blue-700",
      };
    }
    if (type.includes("KYC") || type.includes("AGENCY_KYC")) {
      return {
        icon: Shield,
        bgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        badgeColor: "bg-purple-100 text-purple-700",
      };
    }
    if (type.includes("PAYMENT") || type.includes("ESCROW")) {
      return {
        icon: CreditCard,
        bgColor: "bg-green-100",
        iconColor: "text-green-600",
        badgeColor: "bg-green-100 text-green-700",
      };
    }
    if (type === "MESSAGE") {
      return {
        icon: MessageSquare,
        bgColor: "bg-orange-100",
        iconColor: "text-orange-600",
        badgeColor: "bg-orange-100 text-orange-700",
      };
    }
    if (type.includes("REVIEW")) {
      return {
        icon: Star,
        bgColor: "bg-yellow-100",
        iconColor: "text-yellow-600",
        badgeColor: "bg-yellow-100 text-yellow-700",
      };
    }
    if (type.includes("BACKJOB") || type.includes("DISPUTE")) {
      return {
        icon: AlertCircle,
        bgColor: "bg-red-100",
        iconColor: "text-red-600",
        badgeColor: "bg-red-100 text-red-700",
      };
    }
    return {
      icon: Bell,
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600",
      badgeColor: "bg-gray-100 text-gray-700",
    };
  };

  // Format notification type for display
  const formatNotificationType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    // Read/unread filter
    if (filter === "unread" && notif.isRead) return false;
    if (filter === "read" && !notif.isRead) return false;

    // Type filter
    if (typeFilter !== "all") {
      const type = notif.type?.toLowerCase() || "";
      if (typeFilter === "job" && !type.includes("job") && !type.includes("application"))
        return false;
      if (typeFilter === "kyc" && !type.includes("kyc")) return false;
      if (typeFilter === "payment" && !type.includes("payment") && !type.includes("escrow"))
        return false;
      if (typeFilter === "message" && type !== "message") return false;
      if (typeFilter === "review" && !type.includes("review")) return false;
      if (typeFilter === "system" && type !== "system") return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notif.title.toLowerCase().includes(query) ||
        notif.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Handle notification click - navigate to related page
  const handleNotificationClick = useCallback(
    async (notif: typeof notifications[0]) => {
      // Mark as read if unread
      if (!notif.isRead) {
        await markAsRead(notif.notificationID);
      }

      // Navigate based on notification type
      const type = notif.type || "";
      if (notif.relatedKYCLogID) {
        router.push("/agency/kyc");
      } else if (type.includes("JOB") || type.includes("APPLICATION")) {
        router.push("/agency/jobs");
      } else if (type === "MESSAGE") {
        router.push("/agency/messages");
      } else if (type.includes("PAYMENT") || type.includes("ESCROW")) {
        router.push("/agency/transactions");
      } else if (type.includes("REVIEW")) {
        router.push("/agency/reviews");
      }
    },
    [markAsRead, router]
  );

  // Handle delete notification
  const handleDelete = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    setIsDeleting(notificationId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/accounts/notifications/${notificationId}/delete`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Notification deleted");
        fetchNotifications();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(getErrorMessage(data, "Failed to delete notification"));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(getErrorMessage(error, "Failed to delete notification"));
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
    toast.success("Notifications refreshed");
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success("All notifications marked as read");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <BellRing className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-blue-100 mt-1">
                  Stay updated on your agency activities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/agency/notifications/settings")}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <p className="text-blue-100 text-sm">Total</p>
                <p className="text-3xl font-bold">{notifications.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <p className="text-blue-100 text-sm">Unread</p>
                <p className="text-3xl font-bold text-yellow-300">
                  {unreadCount}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <p className="text-blue-100 text-sm">Read</p>
                <p className="text-3xl font-bold text-green-300">
                  {notifications.length - unreadCount}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Read Status Filter */}
          <div className="flex items-center gap-2">
            {(["all", "unread", "read"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-blue-600" : ""}
              >
                {f === "all" && "All"}
                {f === "unread" && `Unread (${unreadCount})`}
                {f === "read" && "Read"}
              </Button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificationType)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="all">All Types</option>
              <option value="job">Jobs</option>
              <option value="kyc">KYC</option>
              <option value="payment">Payments</option>
              <option value="message">Messages</option>
              <option value="review">Reviews</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="ml-auto text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Bell className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">
              {searchQuery
                ? "No notifications found"
                : filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </h3>
            <p className="text-gray-500 mt-2 text-center max-w-md">
              {searchQuery
                ? "Try a different search term"
                : filter === "unread"
                ? "You're all caught up! 🎉"
                : "Notifications about your jobs, payments, and more will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const style = getNotificationStyle(notif.type);
              const IconComponent = style.icon;

              return (
                <Card
                  key={notif.notificationID}
                  className={`cursor-pointer transition-all hover:shadow-lg group ${
                    !notif.isRead
                      ? "bg-blue-50/50 border-blue-200 hover:bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`p-3 rounded-xl ${style.bgColor} flex-shrink-0`}
                      >
                        <IconComponent className={`h-5 w-5 ${style.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`font-semibold ${
                                  !notif.isRead
                                    ? "text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {notif.title}
                              </h3>
                              {!notif.isRead && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge className={`${style.badgeColor} text-xs`}>
                                {formatNotificationType(notif.type)}
                              </Badge>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notif.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.notificationID);
                                }}
                                className="text-blue-600 hover:bg-blue-100"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(e, notif.notificationID)}
                              disabled={isDeleting === notif.notificationID}
                              className="text-red-600 hover:bg-red-100"
                            >
                              {isDeleting === notif.notificationID ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

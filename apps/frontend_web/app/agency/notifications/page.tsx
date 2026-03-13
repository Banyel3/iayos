"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/generic_button";
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
  RefreshCcw,
  Briefcase,
  MessageSquare,
  CreditCard,
  Shield,
  Star,
  AlertCircle,
  ChevronRight,
  Loader2,
  Clock,
  ShieldCheck,
  MoreVertical,
  Calendar,
  Layers,
  Inbox,
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
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        badgeColor: "bg-blue-50 text-blue-700",
      };
    }
    if (type.includes("KYC") || type.includes("AGENCY_KYC")) {
      return {
        icon: Shield,
        bgColor: "bg-purple-50",
        iconColor: "text-purple-600",
        badgeColor: "bg-purple-50 text-purple-700",
      };
    }
    if (type.includes("PAYMENT") || type.includes("ESCROW") || type.includes("WITHDRAWAL")) {
      return {
        icon: CreditCard,
        bgColor: "bg-emerald-50",
        iconColor: "text-emerald-600",
        badgeColor: "bg-emerald-50 text-emerald-700",
      };
    }
    if (type === "MESSAGE") {
      return {
        icon: MessageSquare,
        bgColor: "bg-sky-50",
        iconColor: "text-sky-600",
        badgeColor: "bg-sky-50 text-sky-700",
      };
    }
    if (type.includes("REVIEW")) {
      return {
        icon: Star,
        bgColor: "bg-amber-50",
        iconColor: "text-amber-600",
        badgeColor: "bg-amber-50 text-amber-700",
      };
    }
    if (type.includes("BACKJOB") || type.includes("DISPUTE")) {
      return {
        icon: AlertCircle,
        bgColor: "bg-red-50",
        iconColor: "text-red-600",
        badgeColor: "bg-red-50 text-red-700",
      };
    }
    return {
      icon: Bell,
      bgColor: "bg-gray-50",
      iconColor: "text-gray-400",
      badgeColor: "bg-gray-50 text-gray-500",
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
      if (
        typeFilter === "job" &&
        !type.includes("job") &&
        !type.includes("application")
      )
        return false;
      if (typeFilter === "kyc" && !type.includes("kyc")) return false;
      if (
        typeFilter === "payment" &&
        !type.includes("payment") &&
        !type.includes("escrow") &&
        !type.includes("withdrawal")
      )
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

  const handleNotificationClick = useCallback(
    async (notif: any) => {
      // Mark as read if unread
      if (!notif.isRead) {
        await markAsRead(notif.notificationID);
      }

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
    [markAsRead, router],
  );

  const handleDelete = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    setIsDeleting(notificationId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/accounts/notifications/${notificationId}/delete`,
        {
          method: "DELETE",
          credentials: "include",
        },
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
    toast.success("Feed updated");
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success("All caught up!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-10 px-4 pb-20">
      {/* Header */}
      <div className="pb-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
             <BellRing className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
             <div>
               <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
               <p className="text-gray-500 text-sm sm:text-base">
                 Stay updated on job status, payments, and account alerts
               </p>
             </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-100 rounded-xl px-4 font-bold text-[10px] uppercase tracking-wider h-11 transition-all"
            >
              <RefreshCcw className={`h-3 w-3 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-50">
         {/* Filters & Actions */}
         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
               <div className="relative group min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-[#00BAF1] transition-colors" />
                  <Input
                    placeholder="Search in notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 bg-gray-50 border-gray-100 focus:bg-white focus:border-[#00BAF1] focus:ring-sky-100 rounded-xl transition-all text-sm"
                  />
               </div>

               <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
                  {(["all", "unread", "read"] as FilterType[]).map((f) => {
                    const count = f === "all" 
                      ? notifications.length 
                      : f === "unread" 
                        ? (unreadCount ?? 0) 
                        : (notifications.length - (unreadCount ?? 0));
                    
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                          filter === f 
                            ? "bg-white text-[#00BAF1] shadow-sm" 
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                          filter === f ? "bg-[#00BAF1]/10 text-[#00BAF1]" : "bg-gray-200 text-gray-500"
                        }`}>
                          {count}
                        </span>
                        {f}
                      </button>
                    );
                  })}
               </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
               <div className="relative group w-full sm:w-auto">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as NotificationType)}
                    className="pl-10 pr-10 h-10 bg-white border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 focus:border-[#00BAF1] focus:ring-sky-100 transition-all appearance-none cursor-pointer w-full sm:w-auto"
                  >
                    <option value="all">All Channels</option>
                    <option value="job">Jobs & Work</option>
                    <option value="kyc">Security & KYC</option>
                    <option value="payment">Finance</option>
                    <option value="message">Inbox</option>
                    <option value="review">Reputation</option>
                    <option value="system">System Alerts</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 rotate-90" />
               </div>

               {(unreadCount ?? 0) > 0 && (
                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="h-10 px-4 rounded-xl text-[#00BAF1] hover:bg-[#00BAF1]/5 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap"
                 >
                    <CheckCheck className="h-3.5 w-3.5 mr-2" />
                    Read All
                 </Button>
               )}
            </div>
         </div>

         {/* Feed List */}
         <div className="space-y-4">
           {isLoading ? (
             <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                   <Card key={i} className="border-gray-50 shadow-sm animate-pulse">
                      <CardContent className="h-20" />
                   </Card>
                ))}
             </div>
           ) : filteredNotifications.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32 text-center">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                 <Bell className="h-10 w-10 text-gray-200" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">
                 {searchQuery ? "No matches found" : "Your feed is empty"}
               </h3>
               <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                 {searchQuery 
                    ? "Try searching for something else or clearing your filters." 
                    : "When you have new updates about your agency, they will appear here."}
               </p>
               {searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-8 rounded-xl border-gray-100 font-bold text-[10px] uppercase"
                    onClick={() => {setSearchQuery(""); setTypeFilter("all"); setFilter("all");}}
                  >
                    Clear All Filters
                  </Button>
               )}
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-3">
               {filteredNotifications.map((notif) => {
                 const style = getNotificationStyle(notif.type);
                 const IconComponent = style.icon;

                 return (
                   <Card
                     key={notif.notificationID}
                     className={`border-0 shadow-lg hover:shadow-xl transition-all group cursor-pointer overflow-hidden ${
                       !notif.isRead ? "bg-white border-l-4 border-l-[#00BAF1]" : "bg-white"
                     }`}
                     onClick={() => handleNotificationClick(notif)}
                   >
                     <CardContent className="p-0">
                       <div className="p-5 sm:p-6 flex items-start gap-4 sm:gap-6">
                         {/* Side Icon */}
                         <div className={`p-3.5 rounded-2xl ${style.bgColor} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <IconComponent className={`h-6 w-6 ${style.iconColor}`} />
                         </div>

                         {/* Content */}
                         <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                               <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className={`font-bold transition-colors ${!notif.isRead ? "text-gray-900 group-hover:text-[#00BAF1]" : "text-gray-600"}`}>
                                      {notif.title}
                                    </h3>
                                    {!notif.isRead && (
                                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00BAF1]/10 text-[#00BAF1] text-[8px] font-extrabold uppercase rounded-full tracking-widest">
                                        <div className="w-1 h-1 bg-[#00BAF1] rounded-full animate-pulse" />
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm leading-relaxed max-w-2xl ${!notif.isRead ? "text-gray-700" : "text-gray-400"}`}>
                                    {notif.message}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 mt-2 border-t border-gray-50">
                                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <Layers className="h-3 w-3" />
                                        {formatNotificationType(notif.type)}
                                     </div>
                                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <Calendar className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                     </div>
                                  </div>
                               </div>

                               {/* Right Side Actions */}
                               <div className="flex items-center gap-1 self-center">
                                  {!notif.isRead && (
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(notif.notificationID);
                                       }}
                                       className="h-9 w-9 p-0 rounded-full text-blue-400 hover:text-[#00BAF1] hover:bg-sky-50 opacity-0 group-hover:opacity-100 transition-all"
                                     >
                                       <Check className="h-4 w-4" />
                                     </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleDelete(e, notif.notificationID)}
                                    disabled={isDeleting === notif.notificationID}
                                    className="h-9 w-9 p-0 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    {isDeleting === notif.notificationID ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <div className="h-9 w-9 flex items-center justify-center rounded-full text-gray-200 group-hover:text-gray-400 group-hover:translate-x-1 transition-all">
                                     <ChevronRight className="h-4 w-4" />
                                  </div>
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
    </div>
  );
}

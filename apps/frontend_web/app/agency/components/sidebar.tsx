"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Briefcase,
  UserCheck,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Receipt,
  Bell,
  Wallet,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AgencySidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [backjobsCount, setBackjobsCount] = useState(0);

  // Fetch backjobs count
  useEffect(() => {
    const fetchBackjobsCount = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/jobs/my-backjobs?status=UNDER_REVIEW`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setBackjobsCount(data.backjobs?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching backjobs count:", error);
      }
    };

    fetchBackjobsCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBackjobsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-56",
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold">
              <span className="text-blue-600 agency-verified:text-blue-800">
                iAyos
              </span>{" "}
              <span className="text-gray-500 font-normal">Agency</span>
            </h2>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <Link
          href="/agency/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md",
            isActive("/agency/dashboard")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Building2 className="h-4 w-4" />{" "}
          {!collapsed && <span>Dashboard</span>}
        </Link>

        <Link
          href="/agency/employees"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/employees")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Users className="h-4 w-4" /> {!collapsed && <span>Employees</span>}
        </Link>

        <Link
          href="/agency/jobs"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/jobs") && !isActive("/agency/jobs/backjobs")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Briefcase className="h-4 w-4" /> {!collapsed && <span>Jobs</span>}
        </Link>

        <Link
          href="/agency/jobs/backjobs"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/jobs/backjobs")
              ? "bg-orange-50 text-orange-600 agency-verified:bg-orange-100 agency-verified:text-orange-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <RotateCcw className="h-4 w-4" />
          {!collapsed && (
            <span className="flex items-center gap-2">
              Backjobs
              {backjobsCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-orange-500 text-white rounded-full">
                  {backjobsCount}
                </span>
              )}
            </span>
          )}
          {collapsed && backjobsCount > 0 && (
            <span className="absolute right-1 top-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium bg-orange-500 text-white rounded-full">
              {backjobsCount}
            </span>
          )}
        </Link>

        <Link
          href="/agency/messages"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/messages")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <MessageSquare className="h-4 w-4" />{" "}
          {!collapsed && <span>Messages</span>}
        </Link>

        <Link
          href="/agency/reviews"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/reviews")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Star className="h-4 w-4" /> {!collapsed && <span>Reviews</span>}
        </Link>

        <Link
          href="/agency/transactions"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/transactions")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Receipt className="h-4 w-4" /> {!collapsed && <span>Transactions</span>}
        </Link>

        <Link
          href="/agency/wallet"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/wallet")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Wallet className="h-4 w-4" /> {!collapsed && <span>Wallet</span>}
        </Link>

        <Link
          href="/agency/notifications"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2 relative",
            isActive("/agency/notifications")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <div className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
          )}
        </Link>

        <Link
          href="/agency/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/profile")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <UserCheck className="h-4 w-4" /> {!collapsed && <span>Profile</span>}
        </Link>

        <Link
          href="/agency/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/settings")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Settings className="h-4 w-4" /> {!collapsed && <span>Settings</span>}
        </Link>

        <Link
          href="/agency/analytics"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/analytics")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <BarChart3 className="h-4 w-4" /> {!collapsed && <span>Analytics</span>}
        </Link>

        <Link
          href="/agency/support"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/support")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <HelpCircle className="h-4 w-4" /> {!collapsed && <span>Support</span>}
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

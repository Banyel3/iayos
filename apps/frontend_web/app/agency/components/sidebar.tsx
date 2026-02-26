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
import { API_BASE } from "@/lib/api/config";

interface AgencySidebarProps {
  className?: string;
  onMobileClose?: () => void;
  /** When true the sidebar is rendered inside the mobile overlay drawer.
   *  - Hides the brand header (drawer already has one)
   *  - Hides the desktop collapse toggle
   *  - Uses h-full instead of h-screen
   */
  isMobileDrawer?: boolean;
}

export default function AgencySidebar({
  className,
  onMobileClose,
  isMobileDrawer = false,
}: AgencySidebarProps) {
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
        const response = await fetch(
          `${API_BASE}/api/jobs/my-backjobs?status=UNDER_REVIEW`,
          {
            credentials: "include",
          },
        );
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

  // Close the mobile drawer when a nav item is tapped
  const handleNavClick = () => {
    onMobileClose?.();
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isMobileDrawer ? "h-full w-full" : collapsed ? "h-screen w-16" : "h-screen w-56",
        className,
      )}
    >
      {/* Desktop-only brand header + collapse toggle */}
      {!isMobileDrawer && (
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
      )}

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <Link
          href="/agency/dashboard"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/dashboard")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Building2 className="h-5 w-5 shrink-0" />{" "}
          {!collapsed && <span>Dashboard</span>}
        </Link>

        <Link
          href="/agency/employees"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/employees")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Users className="h-5 w-5 shrink-0" /> {!collapsed && <span>Employees</span>}
        </Link>

        <Link
          href="/agency/jobs"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/jobs") && !isActive("/agency/jobs/backjobs")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Briefcase className="h-5 w-5 shrink-0" /> {!collapsed && <span>Jobs</span>}
        </Link>

        <Link
          href="/agency/jobs/backjobs"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/jobs/backjobs")
              ? "bg-orange-50 text-orange-600 agency-verified:bg-orange-100 agency-verified:text-orange-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <RotateCcw className="h-5 w-5 shrink-0" />
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
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/messages")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <MessageSquare className="h-5 w-5 shrink-0" />{" "}
          {!collapsed && <span>Messages</span>}
        </Link>

        <Link
          href="/agency/reviews"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/reviews")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Star className="h-5 w-5 shrink-0" /> {!collapsed && <span>Reviews</span>}
        </Link>

        <Link
          href="/agency/transactions"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/transactions")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Receipt className="h-5 w-5 shrink-0" />{" "}
          {!collapsed && <span>Transactions</span>}
        </Link>

        <Link
          href="/agency/wallet"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/wallet")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Wallet className="h-5 w-5 shrink-0" /> {!collapsed && <span>Wallet</span>}
        </Link>

        <Link
          href="/agency/notifications"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] relative",
            isActive("/agency/notifications")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
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
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/profile")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <UserCheck className="h-5 w-5 shrink-0" /> {!collapsed && <span>Profile</span>}
        </Link>

        <Link
          href="/agency/settings"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/settings")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" /> {!collapsed && <span>Settings</span>}
        </Link>

        <Link
          href="/agency/analytics"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/analytics")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <BarChart3 className="h-5 w-5 shrink-0" />{" "}
          {!collapsed && <span>Analytics</span>}
        </Link>

        <Link
          href="/agency/support"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]",
            isActive("/agency/support")
              ? "bg-blue-50 text-blue-600 agency-verified:bg-blue-100 agency-verified:text-blue-800"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <HelpCircle className="h-5 w-5 shrink-0" />{" "}
          {!collapsed && <span>Support</span>}
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200 shrink-0">
        <button
          onClick={() => { handleLogout(); handleNavClick(); }}
          className="flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] w-full text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" /> {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

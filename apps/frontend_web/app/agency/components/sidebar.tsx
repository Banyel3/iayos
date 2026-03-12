"use client";

import Link from "next/link";
import Image from "next/image";
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
  Star,
  MessageSquare,
  Receipt,
  Bell,
  Wallet,
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
  /** Controlled collapsed state (lifted to AgencyShell for layout sync) */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// Helper: badge label for counts
function badgeLabel(n: number) {
  return n > 99 ? "99+" : n;
}

// Light-blue badge pill (expanded sidebar)
function BadgePill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-semibold bg-sky-400 text-white rounded-full">
      {badgeLabel(count)}
    </span>
  );
}

// Light-blue dot badge (collapsed icon)
function BadgeDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-sky-400 text-[7px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function AgencySidebar({
  className,
  onMobileClose,
  isMobileDrawer = false,
  collapsed: collapsedProp,
  onCollapsedChange,
}: AgencySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { notifications } = useNotifications();
  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const collapsed = collapsedProp !== undefined ? collapsedProp : collapsedInternal;
  const setCollapsed = (v: boolean) => {
    setCollapsedInternal(v);
    onCollapsedChange?.(v);
  };
  const [backjobsCount, setBackjobsCount] = useState(0);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Derive per-section unread notification counts from the already-fetched notifications list
  const unreadNotifs = notifications.filter((n) => !n.isRead);
  // Use derived count (consistent with what the notifications page shows)
  const derivedUnreadCount = unreadNotifs.length;

  const REVIEW_TYPES = ["REVIEW", "NEW_REVIEW", "REVIEW_RECEIVED"];
  const TRANSACTION_TYPES = ["PAYMENT_PENDING", "PAYMENT_RELEASED", "DAILY_PAYMENT",
    "EXTENSION_REQUEST", "EXTENSION_APPROVED", "RATE_CHANGE_REQUEST", "RATE_CHANGE_APPROVED"];
  const WALLET_TYPES = ["WALLET", "AUTO_WITHDRAW", "DEPOSIT", "WITHDRAW", "WALLET_FUNDED",
    "WITHDRAWAL_PROCESSED", "AUTO_WITHDRAWAL"];
  const SUPPORT_TYPES = ["SUPPORT", "TICKET", "KYC", "CERTIFICATION", "KYC_APPROVED",
    "KYC_REJECTED", "CERTIFICATION_APPROVED", "CERTIFICATION_REJECTED", "SYSTEM"];

  const reviewsCount = unreadNotifs.filter((n) =>
    REVIEW_TYPES.some((t) => n.type?.toUpperCase().includes(t))
  ).length;
  const transactionsCount = unreadNotifs.filter((n) =>
    TRANSACTION_TYPES.some((t) => n.type?.toUpperCase() === t)
  ).length;
  const walletCount = unreadNotifs.filter((n) =>
    WALLET_TYPES.some((t) => n.type?.toUpperCase().includes(t))
  ).length;
  const supportCount = unreadNotifs.filter((n) =>
    SUPPORT_TYPES.some((t) => n.type?.toUpperCase().includes(t))
  ).length;

  // Fetch sidebar counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Backjobs count
        const backjobRes = await fetch(`${API_BASE}/api/jobs/my-backjobs`, {
          credentials: "include",
        });
        if (backjobRes.ok) {
          const data = await backjobRes.json();
          const pipelineBackjobs = (data.backjobs || []).filter(
            (b: { status?: string }) =>
              b.status === "OPEN" ||
              b.status === "IN_NEGOTIATION" ||
              b.status === "UNDER_REVIEW",
          );
          setBackjobsCount(pipelineBackjobs.length);
        }
      } catch (error) {
        console.error("Error fetching sidebar counts:", error);
      }

      try {
        // Pending job invites count
        const inviteRes = await fetch(`${API_BASE}/api/agency/jobs?invite_status=PENDING`, { credentials: "include" });
        if (inviteRes.ok) {
          const data = await inviteRes.json();
          setPendingJobsCount(data.jobs?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching pending invites count:", error);
      }

      try {
        // Unread messages count
        const msgRes = await fetch(`${API_BASE}/api/agency/conversations?filter=unread`, {
          credentials: "include",
        });
        if (msgRes.ok) {
          const data = await msgRes.json();
          const convos = data.conversations ?? [];
          const count = convos.reduce(
            (sum: number, c: { unread_count?: number }) => sum + (c.unread_count ?? 0),
            0,
          );
          setUnreadMessagesCount(count);
        }
      } catch (error) {
        console.error("Error fetching unread messages count:", error);
      }
    };

    fetchCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
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
        isMobileDrawer
          ? "h-full w-full"
          : collapsed
            ? "h-screen w-16"
            : "h-screen w-56",
        className,
      )}
    >
      {/* Desktop-only brand header + collapse toggle */}
      {!isMobileDrawer && (
        <div className={cn(
          "flex items-center border-b border-sidebar-border",
          collapsed ? "justify-center py-3" : "justify-between p-4"
        )}>
          {!collapsed && (
            <Image
              src="/logos/logo-agency.png"
              alt="iAyos Agency"
              width={120}
              height={32}
              className="object-contain"
              priority
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "rounded-lg hover:bg-sidebar-accent transition-colors",
              collapsed ? "w-full flex justify-center py-3" : "p-1.5"
            )}
          >
            {collapsed ? (
              <Image
                src="/logos/favicon.png"
                alt="iAyos"
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        <Link
          href="/agency/dashboard"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/dashboard")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />{" "}
          {!collapsed && <span>Dashboard</span>}
        </Link>

        <Link
          href="/agency/employees"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/employees")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Users className="h-4 w-4 shrink-0" />{" "}
          {!collapsed && <span>Employees</span>}
        </Link>

        <Link
          href="/agency/jobs"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/jobs") && !isActive("/agency/jobs/backjobs")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <Briefcase className="h-4 w-4" />
            {collapsed && <BadgeDot count={pendingJobsCount} />}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
              Jobs
              <BadgePill count={pendingJobsCount} />
            </span>
          )}
        </Link>

        <Link
          href="/agency/jobs/backjobs"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/jobs/backjobs")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <RotateCcw className="h-4 w-4" />
            {collapsed && <BadgeDot count={backjobsCount} />}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
              Backjobs
              <BadgePill count={backjobsCount} />
            </span>
          )}
        </Link>

        <Link
          href="/agency/messages"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/messages")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <MessageSquare className="h-4 w-4" />
            {collapsed && <BadgeDot count={unreadMessagesCount} />}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
              Messages
              <BadgePill count={unreadMessagesCount} />
            </span>
          )}
        </Link>

        <Link
          href="/agency/reviews"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/reviews")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <Star className="h-4 w-4" />
            {collapsed && <BadgeDot count={reviewsCount} />}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
              Reviews
              <BadgePill count={reviewsCount} />
            </span>
          )}
        </Link>

        <Link
          href="/agency/transactions"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/transactions")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <Receipt className="h-4 w-4" />
            {collapsed && <BadgeDot count={transactionsCount} />}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
              Transactions
              <BadgePill count={transactionsCount} />
            </span>
          )}
        </Link>

        <Link
          href="/agency/wallet"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/wallet")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <Wallet className="h-4 w-4" />
            {collapsed && <BadgeDot count={walletCount} />}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
              Wallet
              <BadgePill count={walletCount} />
            </span>
          )}
        </Link>

        <Link
          href="/agency/notifications"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm relative",
            isActive("/agency/notifications")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <Bell className="h-4 w-4" />
            {collapsed && <BadgeDot count={derivedUnreadCount} />}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
              Notifications
              <BadgePill count={derivedUnreadCount} />
            </span>
          )}
        </Link>

        <Link
          href="/agency/profile"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/profile")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <UserCheck className="h-4 w-4 shrink-0" />{" "}
          {!collapsed && <span>Profile</span>}
        </Link>

        <Link
          href="/agency/settings"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/settings")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />{" "}
          {!collapsed && <span>Settings</span>}
        </Link>

        <Link
          href="/agency/support"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
            isActive("/agency/support")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="relative shrink-0">
            <HelpCircle className="h-4 w-4" />
            {collapsed && <BadgeDot count={supportCount} />}
          </div>
          {!collapsed && (
            <span className="flex items-center gap-2 flex-1">
              Support
              <BadgePill count={supportCount} />
            </span>
          )}
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200 shrink-0">
        <button
          onClick={() => {
            handleLogout();
            handleNavClick();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />{" "}
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

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
  ChevronRight,
  Star,
  MessageSquare,
  Receipt,
  Bell,
  Wallet,
  RotateCcw,
  Search,
  ChevronDown,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { API_BASE } from "@/lib/api/config";

interface AgencySidebarProps {
  className?: string;
  onMobileClose?: () => void;
  /** When true the sidebar is rendered inside the mobile overlay drawer. */
  isMobileDrawer?: boolean;
  /** Controlled collapsed state (lifted to AgencyShell for layout sync) */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Mobile state from Shell */
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

// Helper: badge label for counts
function badgeLabel(n: number) {
  return n > 99 ? "99+" : n;
}

export default function AgencySidebar({
  className,
  onMobileClose,
  isMobileDrawer = false,
  collapsed: collapsedProp,
  onCollapsedChange,
  mobileOpen,
  setMobileOpen,
}: AgencySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const collapsed = collapsedProp !== undefined ? collapsedProp : collapsedInternal;
  const setCollapsed = (v: boolean) => {
    setCollapsedInternal(v);
    onCollapsedChange?.(v);
  };

  const [backjobsCount, setBackjobsCount] = useState(0);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Derive notifications
  const unreadNotifs = notifications.filter((n) => !n.isRead);
  const derivedUnreadCount = unreadNotifs.length;

  const REVIEW_TYPES = ["REVIEW", "NEW_REVIEW", "REVIEW_RECEIVED"];
  const TRANSACTION_TYPES = ["PAYMENT_PENDING", "PAYMENT_RELEASED", "DAILY_PAYMENT", "EXTENSION_REQUEST", "EXTENSION_APPROVED", "RATE_CHANGE_REQUEST", "RATE_CHANGE_APPROVED"];
  const WALLET_TYPES = ["WALLET", "AUTO_WITHDRAW", "DEPOSIT", "WITHDRAW", "WALLET_FUNDED", "WITHDRAWAL_PROCESSED", "AUTO_WITHDRAWAL"];
  const SUPPORT_TYPES = ["SUPPORT", "TICKET", "KYC", "CERTIFICATION", "KYC_APPROVED", "KYC_REJECTED", "CERTIFICATION_APPROVED", "CERTIFICATION_REJECTED", "SYSTEM"];

  const reviewsCount = unreadNotifs.filter((n) => REVIEW_TYPES.some((t) => n.type?.toUpperCase().includes(t))).length;
  const transactionsCount = unreadNotifs.filter((n) => TRANSACTION_TYPES.some((t) => n.type?.toUpperCase() === t)).length;
  const walletCount = unreadNotifs.filter((n) => WALLET_TYPES.some((t) => n.type?.toUpperCase().includes(t))).length;
  const supportCount = unreadNotifs.filter((n) => SUPPORT_TYPES.some((t) => n.type?.toUpperCase().includes(t))).length;

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
      } catch (e) { }

      try {
        const inviteRes = await fetch(`${API_BASE}/api/agency/jobs?invite_status=PENDING`, { credentials: "include" });
        if (inviteRes.ok) {
          const data = await inviteRes.json();
          setPendingJobsCount(data.jobs?.length || 0);
        }
      } catch (e) { }

      try {
        // Unread messages count
        const msgRes = await fetch(`${API_BASE}/api/agency/conversations?filter=unread`, {
          credentials: "include",
        });
        if (msgRes.ok) {
          const data = await msgRes.json();
          const convos = data.conversations ?? [];
          const count = convos.reduce((sum: number, c: { unread_count?: number }) => sum + (c.unread_count ?? 0), 0);
          setUnreadMessagesCount(count);
        }
      } catch (e) { }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const showExpanded = !collapsed || isMobileDrawer;
  const totalBadge = backjobsCount + pendingJobsCount + unreadMessagesCount + derivedUnreadCount;

  return (
    <>
      {/* Mobile Top Bar */}
      {!isMobileDrawer && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen?.(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <Image src="/logos/logo-agency.png" alt="iAyos Agency" width={100} height={28} className="object-contain" />
          <div className="flex items-center gap-1">
            {totalBadge > 0 && (
              <span className="relative flex items-center justify-center w-8 h-8">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalBadge > 9 ? "9+" : totalBadge}
                </span>
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
              {user?.profile_data?.firstName ? user.profile_data.firstName[0].toUpperCase() : "A"}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Content */}
      <div
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isMobileDrawer ? "relative h-full w-full" : "fixed left-0 top-0 h-screen",
          !isMobileDrawer && (collapsed ? "w-16" : "w-64"),
          // Mobile overrides
          !isMobileDrawer && "max-lg:z-50 max-lg:w-[280px] max-lg:-translate-x-full",
          !isMobileDrawer && mobileOpen && "max-lg:translate-x-0",
          !isMobileDrawer && "lg:z-40",
          className
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border",
            collapsed ? "justify-center py-3" : "justify-between p-4"
          )}
          onClick={() => !collapsed && setCollapsed(true)}
        >
          {showExpanded ? (
            <div className="flex items-end space-x-2">
              <Image
                src="/logos/logo-agency.png"
                alt="iAyos Agency"
                width={120}
                height={32}
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setCollapsed(false); }}
              className="mx-auto rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <Image
                src="/logos/favicon.png"
                alt="iAyos"
                width={40}
                height={40}
                className="object-contain"
              />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMobileClose?.();
            }}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          {showExpanded && (
            <div className="flex items-center gap-2 max-lg:hidden">
              <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1 scrollbar-hide">
          {/* Search Bar (Static) */}
          {showExpanded && (
            <div className="mb-4">
              <div className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                <Search className="h-4 w-4" />
                <span>Search...</span>
              </div>
            </div>
          )}
          {collapsed && !isMobileDrawer && (
            <div className="mb-4">
              <div className="w-full flex items-center justify-center p-2 text-gray-500 bg-gray-100 rounded-lg">
                <Search className="h-4 w-4" />
              </div>
            </div>
          )}

          <NavItem
            href="/agency/dashboard"
            icon={Building2}
            label="Dashboard"
            isActive={isActive("/agency/dashboard")}
            expanded={showExpanded}
          />

          <NavItem
            href="/agency/employees"
            icon={Users}
            label="Employees"
            isActive={isActive("/agency/employees")}
            expanded={showExpanded}
          />

          <NavItem
            href="/agency/jobs"
            icon={Briefcase}
            label="Jobs"
            isActive={isActive("/agency/jobs") && !isActive("/agency/jobs/backjobs")}
            expanded={showExpanded}
            count={pendingJobsCount}
          />

          <NavItem
            href="/agency/jobs/backjobs"
            icon={RotateCcw}
            label="Backjobs"
            isActive={isActive("/agency/jobs/backjobs")}
            expanded={showExpanded}
            count={backjobsCount}
          />

          <NavItem
            href="/agency/messages"
            icon={MessageSquare}
            label="Messages"
            isActive={isActive("/agency/messages")}
            expanded={showExpanded}
            count={unreadMessagesCount}
          />

          <NavItem
            href="/agency/reviews"
            icon={Star}
            label="Reviews"
            isActive={isActive("/agency/reviews")}
            expanded={showExpanded}
            count={reviewsCount}
          />

          <NavItem
            href="/agency/transactions"
            icon={Receipt}
            label="Transactions"
            isActive={isActive("/agency/transactions")}
            expanded={showExpanded}
            count={transactionsCount}
          />

          <NavItem
            href="/agency/wallet"
            icon={Wallet}
            label="Wallet"
            isActive={isActive("/agency/wallet")}
            expanded={showExpanded}
            count={walletCount}
          />

          <NavItem
            href="/agency/notifications"
            icon={Bell}
            label="Notifications"
            isActive={isActive("/agency/notifications")}
            expanded={showExpanded}
            count={derivedUnreadCount}
          />

          <NavItem
            href="/agency/profile"
            icon={UserCheck}
            label="Profile"
            isActive={isActive("/agency/profile")}
            expanded={showExpanded}
          />

          <NavItem
            href="/agency/settings"
            icon={Settings}
            label="Settings"
            isActive={isActive("/agency/settings")}
            expanded={showExpanded}
          />

          <NavItem
            href="/agency/support"
            icon={HelpCircle}
            label="Support"
            isActive={isActive("/agency/support")}
            expanded={showExpanded}
            count={supportCount}
          />
        </nav>

        {/* User Profile Card */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              "w-full flex items-center justify-between p-2 rounded-md transition-all duration-200",
              showUserMenu ? "bg-blue-50" : "hover:bg-gray-100",
            )}
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {user?.profile_data?.firstName ? user.profile_data.firstName[0].toUpperCase() : "A"}
              </div>
              {showExpanded && (
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-700 truncate max-w-[124px]">
                    {user?.profile_data?.firstName ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}` : "Agency Admin"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Agency Account
                  </div>
                </div>
              )}
            </div>
            {showExpanded && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  showUserMenu && "rotate-180",
                )}
              />
            )}
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && showExpanded && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
              <Link
                href="/agency/profile"
                className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="h-4 w-4 text-gray-400" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/agency/settings"
                className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span>Settings</span>
              </Link>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </>
  );
}

interface NavItemProps {
  href: string;
  icon: any;
  label: string;
  isActive: boolean;
  expanded: boolean;
  count?: number;
}

function NavItem({ href, icon: Icon, label, isActive, expanded, count }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-sky-50 text-[#00BAF1]"
          : "text-gray-700 hover:bg-gray-100",
      )}
    >
      <div className="flex items-center space-x-3">
        <Icon
          className={cn(
            "h-4 w-4",
            isActive ? "text-[#00BAF1]" : "text-gray-400",
          )}
        />
        {expanded && (
          <span className="animate-in fade-in duration-500 delay-150">
            {label}
          </span>
        )}
      </div>
      {expanded && count !== undefined && count > 0 && (
        <span className="px-2 py-0.5 text-xs font-medium bg-[#00BAF1] text-white rounded-full">
          {count > 99 ? "99+" : count}
        </span>
      )}
      {!expanded && count !== undefined && count > 0 && (
        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#00BAF1] text-[8px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </div>
      )}
    </Link>
  );
}

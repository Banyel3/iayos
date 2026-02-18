"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api/config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "./SidebarContext";
import UserSearchModal from "@/components/admin/UserSearchModal";
import {
  Users,
  UserCheck,
  Shield,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  MessageSquare,
  Bell,
  Search,
  Building2,
  CreditCard,
  Archive,
  Star,
  Flag,
  ChevronDown,
  User,
  Briefcase,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  FileCheck,
  UserX,
  Package,
  Activity,
  ArrowDownToLine,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface NavChild {
  name: string;
  href: string;
  icon: any;
  description: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  count?: number | null;
  children?: NavChild[];
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
    count: null,
  },
  {
    name: "Users",
    href: "#", // Not a clickable link - just a collapsible section header
    icon: Users,
    count: null,
    children: [
      {
        name: "Clients",
        href: "/admin/users/clients",
        icon: User,
        description: "Client accounts & wallets",
      },
      {
        name: "Workers",
        href: "/admin/users/workers",
        icon: UserCheck,
        description: "Worker accounts & earnings",
      },
      {
        name: "Agencies",
        href: "/admin/users/agency",
        icon: Building2,
        description: "Agency accounts",
      },
    ],
  },
  {
    name: "KYC Management",
    href: "#", // Not a clickable link - just a collapsible section header
    icon: Shield,
    count: 3,
    children: [
      {
        name: "Pending",
        href: "/admin/kyc/pending",
        icon: Clock,
        description: "Awaiting verification",
      },
      {
        name: "Approved",
        href: "/admin/kyc/approved",
        icon: CheckCircle,
        description: "Verified accounts",
      },
      {
        name: "Rejected",
        href: "/admin/kyc/rejected",
        icon: XCircle,
        description: "Failed verification",
      },
    ],
  },
  {
    name: "Jobs",
    href: "#", // Not a clickable link - just a collapsible section header
    icon: Briefcase,
    count: null,
    children: [
      {
        name: "Job Listings",
        href: "/admin/jobs/listings",
        icon: ClipboardList,
        description: "Open posts accepting applications",
      },
      {
        name: "Job Requests",
        href: "/admin/jobs/requests",
        icon: UserCheck,
        description: "Direct invites to workers/agencies",
      },
      {
        name: "Active Jobs",
        href: "/admin/jobs/active",
        icon: Clock,
        description: "In-progress jobs with payments",
      },
      {
        name: "Completed Jobs",
        href: "/admin/jobs/completed",
        icon: CheckCircle,
        description: "Finished jobs with timeline",
      },
      {
        name: "Back Jobs",
        href: "/admin/jobs/backjobs",
        icon: AlertTriangle,
        description: "Backjob requests & management",
      },
      {
        name: "Categories & Rates",
        href: "/admin/jobs/categories",
        icon: Package,
        description: "Job categories and minimum rates",
      },
    ],
  },
  {
    name: "Certifications",
    href: "#", // Not a clickable link - just a collapsible section header
    icon: FileCheck,
    count: null,
    children: [
      {
        name: "Pending",
        href: "/admin/certifications/pending",
        icon: Clock,
        description: "Awaiting verification",
      },
      {
        name: "History",
        href: "/admin/certifications/history",
        icon: FileText,
        description: "Verification audit trail",
      },
    ],
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: Star,
    count: null,
  },
  {
    name: "Payments",
    href: "#", // Not a clickable link - just a collapsible section header
    icon: CreditCard,
    count: null,
    children: [
      {
        name: "Transactions",
        href: "/admin/payments/transactions",
        icon: DollarSign,
        description: "All payment transactions",
      },
      {
        name: "Withdrawals",
        href: "/admin/payments/withdrawals",
        icon: ArrowDownToLine,
        description: "Process withdrawal requests",
      },
      {
        name: "Worker Earnings",
        href: "/admin/payments/earnings",
        icon: TrendingUp,
        description: "Payouts & earnings",
      },
      {
        name: "Disputes",
        href: "/admin/payments/disputes",
        icon: AlertTriangle,
        description: "Payment disputes",
      },
      {
        name: "Analytics",
        href: "/admin/payments/analytics",
        icon: BarChart3,
        description: "Financial reports",
      },
    ],
  },
  {
    name: "Support & Help",
    href: "#", // Not a clickable link - just a collapsible section header
    icon: HelpCircle,
    count: null,
    children: [
      {
        name: "Tickets",
        href: "/admin/support/tickets",
        icon: MessageSquare,
        description: "User support tickets",
      },
      {
        name: "Canned Responses",
        href: "/admin/support/canned-responses",
        icon: FileText,
        description: "Response templates",
      },
      {
        name: "FAQs",
        href: "/admin/support/faqs",
        icon: HelpCircle,
        description: "Manage FAQs",
      },
      {
        name: "User Reports",
        href: "/admin/support/reports",
        icon: Flag,
        description: "Reported content",
      },
      {
        name: "Analytics",
        href: "/admin/support/analytics",
        icon: BarChart3,
        description: "Support metrics",
      },
    ],
  },
  {
    name: "Analytics & Reports",
    href: "#", // Not a clickable link - just a collapsible section header
    icon: BarChart3,
    count: null,
    children: [
      {
        name: "Overview",
        href: "/admin/analytics",
        icon: Activity,
        description: "Analytics overview & KPIs",
      },
      {
        name: "User Analytics",
        href: "/admin/analytics/users",
        icon: Users,
        description: "User growth & retention",
      },
      {
        name: "Job Analytics",
        href: "/admin/analytics/jobs",
        icon: Briefcase,
        description: "Marketplace insights",
      },
      {
        name: "Financial Reports",
        href: "/admin/analytics/financial",
        icon: DollarSign,
        description: "Revenue & transactions",
      },
      {
        name: "Custom Reports",
        href: "/admin/analytics/reports/custom",
        icon: FileText,
        description: "Build custom reports",
      },
      {
        name: "Scheduled Reports",
        href: "/admin/analytics/reports/scheduled",
        icon: Clock,
        description: "Automated reporting",
      },
    ],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    count: null,
  },
];

export default function Sidebar({ className }: SidebarProps) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen, isMobile } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingKYCCount, setPendingKYCCount] = useState<number>(0);
  const [pendingCertsCount, setPendingCertsCount] = useState<number>(0);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] =
    useState<number>(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  // Auto-expand parent menu when a child route is active
  useEffect(() => {
    const activeParents: string[] = [];
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          pathname.startsWith(child.href)
        );
        if (hasActiveChild) {
          activeParents.push(item.name);
        }
      }
    });
    
    // Only update if we have active parents that aren't already expanded
    if (activeParents.length > 0) {
      setExpandedItems((prev) => {
        const newExpanded = [...new Set([...prev, ...activeParents])];
        return newExpanded;
      });
    }
  }, [pathname]);

  // Fetch pending KYC count on mount and refresh every 30 seconds
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/adminpanel/kyc/all`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Count pending KYC records
            const pendingCount =
              (data.kyc || []).filter(
                (kyc: any) => kyc.kycStatus?.toLowerCase() === "pending",
              ).length +
              (data.agency_kyc || []).filter(
                (kyc: any) => kyc.status?.toLowerCase() === "pending",
              ).length;

            setPendingKYCCount(pendingCount);
          }
        }
      } catch (error) {
        console.error("Error fetching pending KYC count:", error);
      }
    };

    const fetchPendingCertsCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/adminpanel/certifications/stats`,
          { credentials: "include" },
        );

        if (response.ok) {
          const data = await response.json();
          setPendingCertsCount(data.pending_count || 0);
        }
      } catch (error) {
        console.error("Error fetching pending certs count:", error);
      }
    };

    const fetchPendingWithdrawalsCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/adminpanel/withdrawals/statistics`,
          { credentials: "include" },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPendingWithdrawalsCount(data.pending_withdrawals || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching pending withdrawals count:", error);
      }
    };

    fetchPendingCount();
    fetchPendingCertsCount();
    fetchPendingWithdrawalsCount();

    // Refresh counts every 30 seconds
    const interval = setInterval(() => {
      fetchPendingCount();
      fetchPendingCertsCount();
      fetchPendingWithdrawalsCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch admin user info on mount
  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/accounts/me`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setAdminUser({
              name: data.user.first_name && data.user.last_name 
                ? `${data.user.first_name} ${data.user.last_name}`
                : data.user.email?.split('@')[0] || 'Admin',
              email: data.user.email || '',
              role: data.user.is_superuser ? 'Super Admin' : 'Administrator',
            });
          }
        }
      } catch (error) {
        console.error("Error fetching admin user:", error);
      }
    };

    fetchAdminUser();
  }, []);

  // Update navigation with dynamic KYC and Certifications counts
  const navigationWithCount: NavItem[] = navigation.map((item) => {
    if (item.name === "KYC Management") {
      return {
        ...item,
        count: pendingKYCCount > 0 ? pendingKYCCount : null,
      };
    }
    if (item.name === "Certifications") {
      return {
        ...item,
        count: pendingCertsCount > 0 ? pendingCertsCount : null,
      };
    }
    if (item.name === "Payments") {
      return {
        ...item,
        count: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : null,
      };
    }
    return item;
  });

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const isChildActive = (
    parentHref: string,
    children: { name: string; href: string; icon: React.ComponentType }[],
  ) => {
    if (!children) return false;
    return children.some((child) => pathname.startsWith(child.href));
  };

  const handleLogout = async () => {
    try {
      // Use the AuthContext logout function which properly clears state and redirects
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: still try to redirect even on error
      router.push("/auth/login");
    }
  };

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [pathname, isMobile, setMobileOpen]);

  // Total badge count for mobile top bar
  const totalBadge = pendingKYCCount + pendingCertsCount + pendingWithdrawalsCount;

  // On mobile, sidebar drawer is always expanded (never collapsed)
  const showExpanded = isMobile || !collapsed;

  return (
    <>
      {/* ===== Mobile Top Bar (visible < md) ===== */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        <img src="/logo.png" alt="iAyos" className="h-7 w-auto" />
        <div className="flex items-center gap-1">
          {totalBadge > 0 && (
            <span className="relative flex items-center justify-center w-8 h-8">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalBadge > 9 ? "9+" : totalBadge}
              </span>
            </span>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold"
          >
            {adminUser?.name ? adminUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
          </button>
        </div>
      </div>

      {/* ===== Backdrop (mobile only) ===== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== Sidebar Drawer ===== */}
      <div
        className={cn(
          "fixed left-0 top-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          // Mobile: slide off-screen by default, slide in when open, always full width
          "max-md:-translate-x-full max-md:w-72",
          mobileOpen && "max-md:translate-x-0",
          // Mobile: higher z-index than backdrop
          "max-md:z-50",
          // Desktop: static, respects collapsed state
          "md:z-40",
          collapsed ? "md:w-16" : "md:w-64",
          className,
        )}
      >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center justify-between p-4 border-b border-sidebar-border",
          !collapsed && "md:cursor-pointer md:hover:bg-gray-50 transition-colors"
        )}
        onClick={() => !collapsed && !isMobile && setCollapsed(true)}
      >
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={(e) => { e.stopPropagation(); setMobileOpen(false); }}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
        {showExpanded && (
          <div className="flex items-end space-x-2">
            {/* Logo Image */}
            <img
              src="/logo.png"
              alt="iAyos Logo"
              className="h-[37.8px] w-auto"
            />
          </div>
        )}
        {(collapsed && !isMobile) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="mx-auto rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <img
              src="/favicon.png"
              alt="iAyos"
              className="h-14 w-14 object-contain"
            />
          </button>
        )}
        {showExpanded && (
          <div className="flex items-center gap-2 max-md:hidden">
            <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide"
        onClick={(e) => {
          if (collapsed && !isMobile && e.target === e.currentTarget) {
            setCollapsed(false);
          }
        }}
      >
        {/* Search Bar */}
        {showExpanded && (
          <div className="mb-4">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search users</span>
            </button>
          </div>
        )}
        {(collapsed && !isMobile) && (
          <div className="mb-4">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center justify-center p-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Search users (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}
        {navigationWithCount.map((item) => {
          const Icon = item.icon;
          const isItemActive = isActive(item.href);
          const isExpanded = expandedItems.includes(item.name);
          const hasActiveChild = isChildActive(item.href, item.children || []);

          return (
            <div key={item.name} className="mb-1">
              <div className="relative">
                {item.children ? (
                  <button
                    onClick={() => {
                      if (collapsed && !isMobile) {
                        setCollapsed(false);
                        setTimeout(() => toggleExpanded(item.name), 100);
                      } else {
                        toggleExpanded(item.name);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      hasActiveChild
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          hasActiveChild ? "text-blue-600" : "text-gray-400",
                        )}
                      />
                      {showExpanded && (
                        <span className="font-semibold animate-in fade-in duration-500 delay-150">{item.name}</span>
                      )}
                    </div>
                    {showExpanded && (
                      <div className="flex items-center space-x-2">
                        {item.count !== undefined &&
                          item.count !== null &&
                          item.count > 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                              {item.count}
                            </span>
                          )}
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-gray-400 transition-transform duration-300 ease-out",
                            isExpanded && "rotate-90",
                          )}
                        />
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (collapsed && !isMobile && item.href === "#") {
                        e.preventDefault();
                        setCollapsed(false);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isItemActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isItemActive ? "text-blue-600" : "text-gray-400",
                        )}
                      />
                      {showExpanded && <span className="animate-in fade-in duration-500 delay-150">{item.name}</span>}
                    </div>
                    {showExpanded &&
                      item.count !== undefined &&
                      item.count !== null &&
                      item.count > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                          {item.count}
                        </span>
                      )}
                  </Link>
                )}
              </div>

              {/* Submenu */}
              {item.children && isExpanded && showExpanded && (
                <div className="mt-1 ml-6 space-y-1 animate-in slide-in-from-top-2 fade-in duration-300">
                  {item.children.map((child) => {
                    const isChildActiveItem = child.href === item.children![0]?.href && item.children!.length > 1
                      ? pathname === child.href
                      : pathname.startsWith(child.href);
                    const ChildIcon = child.icon;

                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "group flex items-center space-x-2 px-2 py-2 rounded-md text-sm transition-all duration-200 relative",
                          isChildActiveItem
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                        )}
                        title={child.description || child.name}
                      >
                        <ChildIcon
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isChildActiveItem
                              ? "text-blue-600"
                              : "text-gray-400 group-hover:text-gray-600",
                          )}
                        />
                        <span className="flex-1 animate-in fade-in duration-500 delay-200">{child.name}</span>
                        {/* Optional: Add count badges here if needed */}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom User Card - Fixed at bottom */}
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
              {adminUser?.name ? adminUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
            </div>
            {showExpanded && (
              <div className="text-left">
                <div className="text-sm font-medium text-gray-700">
                  {adminUser?.name || 'Admin User'}
                </div>
                <div className="text-xs text-gray-500">{adminUser?.role || 'Administrator'}</div>
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
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <Link
              href="/admin/profile"
              className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowUserMenu(false)}
            >
              <User className="h-4 w-4 text-gray-400" />
              <span>Profile</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowUserMenu(false)}
            >
              <Settings className="h-4 w-4 text-gray-400" />
              <span>Settings</span>
            </Link>
            <div className="border-t border-gray-200"></div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </div>
    </>
  );
}

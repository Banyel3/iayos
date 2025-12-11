"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
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
        name: "Escrow Monitor",
        href: "/admin/payments/escrow",
        icon: Clock,
        description: "Track escrow payments",
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
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingKYCCount, setPendingKYCCount] = useState<number>(0);
  const [pendingCertsCount, setPendingCertsCount] = useState<number>(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
                (kyc: any) => kyc.kycStatus?.toLowerCase() === "pending"
              ).length +
              (data.agency_kyc || []).filter(
                (kyc: any) => kyc.status?.toLowerCase() === "pending"
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
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          setPendingCertsCount(data.pending_count || 0);
        }
      } catch (error) {
        console.error("Error fetching pending certs count:", error);
      }
    };

    fetchPendingCount();
    fetchPendingCertsCount();

    // Refresh counts every 30 seconds
    const interval = setInterval(() => {
      fetchPendingCount();
      fetchPendingCertsCount();
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
    return item;
  });

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
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
    children: { name: string; href: string; icon: React.ComponentType }[]
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

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            {/* Logo Text */}
            <h2 className="text-2xl py-6 font-bold">
              <span className="text-blue-600">iAyos</span>{" "}
              <span className="text-gray-500 font-normal">Admin</span>
            </h2>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
            title="Search users (Ctrl+K)"
          >
            <Search className="h-4 w-4 text-sidebar-foreground" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
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
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      hasActiveChild
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          hasActiveChild ? "text-blue-600" : "text-gray-400"
                        )}
                      />
                      {!collapsed && (
                        <span className="font-semibold">{item.name}</span>
                      )}
                    </div>
                    {!collapsed && (
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
                            "h-4 w-4 text-gray-400 transition-transform",
                            isExpanded && "rotate-90"
                          )}
                        />
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isItemActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isItemActive ? "text-blue-600" : "text-gray-400"
                        )}
                      />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed &&
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
              {item.children && isExpanded && !collapsed && (
                <div className="mt-1 ml-6 space-y-1">
                  {item.children.map((child) => {
                    const isChildActiveItem = pathname.startsWith(child.href);
                    const ChildIcon = child.icon;

                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "group flex items-center space-x-2 px-2 py-2 rounded-md text-sm transition-all duration-200 relative",
                          isChildActiveItem
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        title={child.description || child.name}
                      >
                        <ChildIcon
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isChildActiveItem
                              ? "text-blue-600"
                              : "text-gray-400 group-hover:text-gray-600"
                          )}
                        />
                        <span className="flex-1">{child.name}</span>
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
            showUserMenu ? "bg-blue-50" : "hover:bg-gray-100"
          )}
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              VC
            </div>
            {!collapsed && (
              <div className="text-left">
                <div className="text-sm font-medium text-gray-700">
                  Vaniel Cornelio
                </div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                showUserMenu && "rotate-180"
              )}
            />
          )}
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && !collapsed && (
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
  );
}

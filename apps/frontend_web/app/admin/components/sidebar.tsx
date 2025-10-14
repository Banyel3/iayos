"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
    count: null,
  },
  {
    name: "Users Management",
    href: "/admin/users",
    icon: Users,
    count: null,
    children: [
      {
        name: "Clients",
        href: "/admin/users/clients",
        icon: User,
        description: "Manage client accounts",
      },
      {
        name: "Workers",
        href: "/admin/users/workers",
        icon: UserCheck,
        description: "Manage worker accounts",
      },
      {
        name: "Agencies",
        href: "/admin/users/agency",
        icon: Building2,
        description: "Manage agency accounts",
      },
    ],
  },
  {
    name: "KYC Management",
    href: "/admin/kyc",
    icon: Shield,
    count: 12,
    children: [
      {
        name: "Pending Reviews",
        href: "/admin/kyc/pending",
        icon: Clock,
        description: "KYC documents awaiting review",
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
        description: "Rejected verifications",
      },
    ],
  },
  {
    name: "Jobs Management",
    href: "/admin/jobs",
    icon: Briefcase,
    count: null,
    children: [
      {
        name: "Job Listings",
        href: "/admin/jobs/listings",
        icon: ClipboardList,
        description: "All posted job listings",
      },
      {
        name: "Job Applications",
        href: "/admin/jobs/applications",
        icon: FileCheck,
        description: "Applications and their status",
      },
      {
        name: "Active Jobs",
        href: "/admin/jobs/active",
        icon: Clock,
        description: "Ongoing work",
      },
      {
        name: "Completed Jobs",
        href: "/admin/jobs/completed",
        icon: CheckCircle,
        description: "Finished jobs",
      },
      {
        name: "Job Disputes",
        href: "/admin/jobs/disputes",
        icon: AlertTriangle,
        description: "Issues and conflicts",
      },
    ],
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    count: null,
    children: [
      {
        name: "All Transactions",
        href: "/admin/payments/transactions",
        icon: DollarSign,
        description: "Complete transaction history",
      },
      {
        name: "Pending Payments",
        href: "/admin/payments/pending",
        icon: Clock,
        description: "Awaiting payment confirmation",
      },
      {
        name: "Completed Payments",
        href: "/admin/payments/completed",
        icon: CheckCircle,
        description: "Successfully processed",
      },
      {
        name: "Disputes",
        href: "/admin/payments/disputes",
        icon: Flag,
        description: "Payment disputes",
      },
      {
        name: "Refunds",
        href: "/admin/payments/refunds",
        icon: Archive,
        description: "Refund requests",
      },
    ],
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    count: null,
    children: [
      {
        name: "Overview",
        href: "/admin/analytics/overview",
        icon: TrendingUp,
        description: "Platform statistics",
      },
      {
        name: "User Analytics",
        href: "/admin/analytics/users",
        icon: Users,
        description: "User behavior and trends",
      },
      {
        name: "Job Analytics",
        href: "/admin/analytics/jobs",
        icon: Briefcase,
        description: "Job market insights",
      },
      {
        name: "Revenue Analytics",
        href: "/admin/analytics/revenue",
        icon: DollarSign,
        description: "Financial performance",
      },
    ],
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: FileText,
    count: null,
    children: [
      {
        name: "User Reports",
        href: "/admin/reports/users",
        icon: UserX,
        description: "Reported users",
      },
      {
        name: "Job Reports",
        href: "/admin/reports/jobs",
        icon: Flag,
        description: "Reported job listings",
      },
      {
        name: "System Reports",
        href: "/admin/reports/system",
        icon: FileCheck,
        description: "System logs and issues",
      },
      {
        name: "Financial Reports",
        href: "/admin/reports/financial",
        icon: DollarSign,
        description: "Financial summaries",
      },
    ],
  },
  {
    name: "Reviews & Ratings",
    href: "/admin/reviews",
    icon: Star,
    count: null,
    children: [
      {
        name: "All Reviews",
        href: "/admin/reviews/all",
        icon: Star,
        description: "All platform reviews",
      },
      {
        name: "Flagged Reviews",
        href: "/admin/reviews/flagged",
        icon: Flag,
        description: "Reviews needing attention",
      },
    ],
  },
  {
    name: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
    count: 5,
  },
  {
    name: "Services",
    href: "/admin/services",
    icon: Package,
    count: null,
    children: [
      {
        name: "Service Categories",
        href: "/admin/services/categories",
        icon: Package,
        description: "Manage service types",
      },
      {
        name: "Service Requests",
        href: "/admin/services/requests",
        icon: ClipboardList,
        description: "New service requests",
      },
    ],
  },
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    count: 3,
  },
];

const bottomNavigation = [
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    name: "Help & Support",
    href: "/admin/support",
    icon: HelpCircle,
  },
];

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
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
                      isItemActive || hasActiveChild
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isItemActive || hasActiveChild
                            ? "text-blue-600"
                            : "text-gray-400"
                        )}
                      />
                      {!collapsed && (
                        <span className="font-semibold">{item.name}</span>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="flex items-center space-x-2">
                        {item.count !== null && item.count > 0 && (
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
                    {!collapsed && item.count !== null && item.count > 0 && (
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

      {/* Bottom User Card */}
      <div className="p-4 border-t border-gray-200 relative">
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
    </div>
  );
}

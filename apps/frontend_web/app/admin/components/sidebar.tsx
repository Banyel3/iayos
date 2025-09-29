"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: Home,
    count: null,
  },
  {
    name: "Users Management",
    href: "/admin/users",
    icon: Users,
    count: null,
    children: [
      { name: "All Users", href: "/admin/users", icon: Users },
      { name: "Workers", href: "/admin/users/workers", icon: UserCheck },
      { name: "Clients", href: "/admin/users/clients", icon: Building2 },
      { name: "Agency", href: "/admin/users/agency", icon: Building2 },
      {
        name: "Pending Verification",
        href: "/admin/users/pending",
        icon: Shield,
      },
    ],
  },
  {
    name: "KYC Management",
    href: "/admin/kyc",
    icon: Shield,
    count: 12,
    children: [
      { name: "Pending Reviews", href: "/admin/kyc/pending", icon: FileText },
      { name: "Approved", href: "/admin/kyc/approved", icon: UserCheck },
      { name: "Rejected", href: "/admin/kyc/rejected", icon: Flag },
    ],
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    count: null,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    count: null,
    children: [
      {
        name: "Transactions",
        href: "/admin/payments/transactions",
        icon: CreditCard,
      },
      { name: "Disputes", href: "/admin/payments/disputes", icon: Flag },
      { name: "Refunds", href: "/admin/payments/refunds", icon: Archive },
    ],
  },
  {
    name: "Services",
    href: "/admin/services",
    icon: Star,
    count: null,
  },
  {
    name: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
    count: 5,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: FileText,
    count: null,
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: Star,
    count: null,
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
  const pathname = usePathname();

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

  const isChildActive = (parentHref: string, children: { name: string; href: string; icon: React.ComponentType }[]) => {
    if (!children) return false;
    return children.some((child) => pathname.startsWith(child.href));
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
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IA</span>
            </div>
            <div>
              <h2 className="text-sidebar-foreground font-semibold text-lg">
                IAYOS
              </h2>
              <p className="text-sidebar-foreground/60 text-xs">Admin Panel</p>
            </div>
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

      {/* Search */}
      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/60" />
            <input
              type="text"
              placeholder="Search admin..."
              className="w-full pl-9 pr-4 py-2 bg-sidebar-accent rounded-lg text-sm text-sidebar-foreground placeholder-sidebar-foreground/60 border-0 focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isItemActive = isActive(item.href);
          const isExpanded = expandedItems.includes(item.name);
          const hasActiveChild = isChildActive(item.href, item.children || []);

          return (
            <div key={item.name}>
              <div className="relative">
                {item.children ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isItemActive || hasActiveChild
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed && (
                      <div className="flex items-center space-x-2">
                        {item.count && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {item.count}
                          </span>
                        )}
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
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
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                      isItemActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed && item.count && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {item.count}
                      </span>
                    )}
                  </Link>
                )}
              </div>

              {/* Submenu */}
              {item.children && isExpanded && !collapsed && (
                <div className="mt-1 ml-4 space-y-1 border-l border-sidebar-border/50 pl-4">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActiveItem = pathname.startsWith(child.href);

                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          isChildActiveItem
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <ChildIcon className="h-3 w-3" />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {bottomNavigation.map((item) => {
          const Icon = item.icon;
          const isItemActive = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isItemActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Logout */}
        <button
          className={cn(
            "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

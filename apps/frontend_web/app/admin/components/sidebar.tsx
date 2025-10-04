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

  const isChildActive = (
    parentHref: string,
    children: { name: string; href: string; icon: React.ComponentType }[]
  ) => {
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
            <div key={item.name}>
              <div className="relative">
                {item.children ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      isItemActive || hasActiveChild
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-gray-400" />
                      {!collapsed && (
                        <span className="font-semibold">{item.name}</span>
                      )}
                    </div>
                    {!collapsed && (
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-gray-400 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      isItemActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4 text-gray-400 mr-2" />
                    {!collapsed && <span>{item.name}</span>}
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
                          "flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-all duration-200",
                          isChildActiveItem
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        <ChildIcon className="h-3 w-3 text-gray-400" />
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

      {/* Bottom User Card */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 p-2 rounded-md bg-blue-50">
          <div className="w-8 h-8 rounded-full bg-gray-300" />
          <div className="text-sm font-medium text-gray-700">
            Vaniel Cornelio
          </div>
        </div>
      </div>
    </div>
  );
}

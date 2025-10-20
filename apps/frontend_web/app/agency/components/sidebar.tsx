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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function AgencySidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
              <span className="text-blue-600">iAyos</span>{" "}
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
              ? "bg-blue-50 text-blue-600"
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
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Users className="h-4 w-4" /> {!collapsed && <span>Employees</span>}
        </Link>

        <Link
          href="/agency/jobs"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/jobs")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Briefcase className="h-4 w-4" /> {!collapsed && <span>Jobs</span>}
        </Link>

        <Link
          href="/agency/reviews"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/reviews")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Star className="h-4 w-4" /> {!collapsed && <span>Reviews</span>}
        </Link>

        <Link
          href="/agency/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md mt-2",
            isActive("/agency/profile")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <UserCheck className="h-4 w-4" /> {!collapsed && <span>Profile</span>}
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

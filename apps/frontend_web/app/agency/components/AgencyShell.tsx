"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AgencySidebar from "./sidebar";
import { cn } from "@/lib/utils";

interface AgencyShellProps {
  children: React.ReactNode;
  kycVerified?: boolean;
}

export default function AgencyShell({ children, kycVerified }: AgencyShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Auto-close drawer when the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50 agency-theme",
        kycVerified ? "agency-verified" : ""
      )}
    >
      {/* Sidebar - Desktop and Mobile Drawer */}
      <AgencySidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={sidebarOpen}
        setMobileOpen={setSidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import AgencySidebar from "./sidebar";
import { cn } from "@/lib/utils";

interface AgencyShellProps {
  children: React.ReactNode;
  kycVerified?: boolean;
}

export default function AgencyShell({ children, kycVerified }: AgencyShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close drawer when the route changes (user tapped a nav link)
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
        "min-h-screen bg-gray-50 flex flex-col lg:flex-row agency-theme",
        kycVerified ? "agency-verified" : ""
      )}
    >
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AgencySidebar />
      </div>

      {/* Mobile overlay drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 flex flex-col w-[280px] max-w-[85vw] bg-white shadow-2xl">
            {/* Drawer header: brand + close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <span className="text-xl font-bold leading-none">
                <span className="text-blue-600">iAyos</span>
                <span className="text-gray-500 font-normal"> Agency</span>
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable nav items */}
            <div className="flex-1 overflow-y-auto">
              <AgencySidebar
                isMobileDrawer
                onMobileClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Right side: mobile top header + page content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-base">
            <span className="text-blue-600">iAyos</span>
            <span className="text-gray-500 font-normal"> Agency</span>
          </span>
          {/* Spacer so title stays visually centred */}
          <div className="w-9" aria-hidden="true" />
        </header>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

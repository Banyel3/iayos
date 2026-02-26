"use client";

import { useState } from "react";
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

  // Close sidebar on route change
  // useEffect(() => {
  //   setSidebarOpen(false);
  // }, [pathname]);

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50 flex flex-col lg:flex-row agency-theme",
        kycVerified ? "agency-verified" : ""
      )}
    >
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="font-bold text-lg text-blue-600">iAyos Agency</div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -mr-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar - Desktop (Static) & Mobile (Overlay) */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:static lg:z-auto transition-visibility duration-300",
          sidebarOpen ? "visible" : "invisible lg:visible"
        )}
      >
        {/* Mobile Overlay Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 lg:hidden",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar Container */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:border-r lg:border-gray-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Mobile Close Button */}
          <div className="absolute right-0 top-0 -mr-12 pt-2 lg:hidden">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <AgencySidebar 
             className="h-full"
             onMobileClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}

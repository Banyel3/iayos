"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useWorkerAvailability } from "@/lib/hooks/useWorkerAvailability";

// Extended User interface for agency page
interface AgencyUser extends User {
  firstName?: string;
  lastName?: string;
  profileType?: "WORKER" | "CLIENT" | null;
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileImg?: string;
  };
}

const WorkerDash = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as AgencyUser;
  const router = useRouter();

  // Use the worker availability hook
  const isWorker = true; // This is agency page, always worker
  const {
    isAvailable,
    isLoading: isLoadingAvailability,
    handleAvailabilityToggle,
  } = useWorkerAvailability(isWorker, isAuthenticated);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication check (strictly from backend JWT validation)
  if (!isAuthenticated || !user) {
    useEffect(() => {
      router.push("/auth/login");
    }, [router]);
    return null; // Will redirect
  }
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Desktop Navbar */}
      <DesktopNavbar
        isWorker={true}
        userName={user?.firstName || "Worker"}
        userAvatar={user?.profile_data?.profileImg || "/worker1.jpg"}
        onLogout={logout}
        isAvailable={isAvailable}
        isLoadingAvailability={isLoadingAvailability}
        onAvailabilityToggle={handleAvailabilityToggle}
      />

      {/* Content */}
      <div className="lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Agency Dashboard
          </h1>
          <p className="text-gray-600 mb-6">This feature is coming soon.</p>
          <button
            onClick={() => router.push("/dashboard/home")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerDash;

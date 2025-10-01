"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import DesktopNavbar from "@/components/ui/desktop-sidebar";

// Extended User interface for agency page
interface AgencyUser extends User {
  firstName?: string;
  lastName?: string;
  profileType?: "WORKER" | "CLIENT" | null;
}

const WorkerDash = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as AgencyUser;
  const router = useRouter();

  if (isLoading) return <p>Loading...</p>; // strictly loading from backend validation

  // Authentication check (strictly from backend JWT validation)
  if (!isAuthenticated || !user) {
    useEffect(() => {
      router.push("/auth/login");
    }, [router]);
    return null; // Will redirect
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navbar */}
      <DesktopNavbar
        isWorker={true}
        userName={user?.firstName || "Worker"}
        onLogout={logout}
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

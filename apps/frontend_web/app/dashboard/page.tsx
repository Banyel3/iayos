"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { UserProfileType } from "@/types";
import NotificationBell from "@/components/notifications/NotificationBell";
import { API_BASE_URL } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";

// Temporary User interface extension for this page
interface DashboardUser {
  accountID: number;
  email: string;
  role: string;
  accountType?: string;
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileImg?: string;
    profileType?: UserProfileType;
  };
}

const TempDashboard = () => {
  const {
    user: authUser,
    isAuthenticated,
    isLoading,
    logout,
    checkAuth,
  } = useAuth();
  const user = authUser as DashboardUser; // Type assertion for this page
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<UserProfileType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect special user types (admin, agency) to their dashboards
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const accountType = (user.accountType || "").toString().toLowerCase();
      const role = (user.role || "").toString().toUpperCase();

      // Admin users should go to admin dashboard
      if (role === "ADMIN") {
        console.log(
          "🔐 Dashboard: Admin user detected, redirecting to admin panel",
        );
        router.replace("/admin/dashboard");
        return;
      }

      // Agency users should go to agency dashboard
      if (accountType === "agency" || role === "AGENCY") {
        console.log(
          "🏢 Dashboard: Agency user detected, redirecting to agency dashboard",
        );
        router.replace("/agency/dashboard");
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Redirect logic for existing profileType
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.profile_data?.profileType) {
      if (user.profile_data.profileType === "WORKER") {
        router.replace("/dashboard/profile");
      } else if (user.profile_data.profileType === "CLIENT") {
        router.replace("/dashboard/home");
      }
    }
  }, [user?.profile_data?.profileType, isLoading, isAuthenticated, router]);

  // Auto-redirect for unauthorized users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    // Check if user email exists
    if (!user?.email) {
      console.error("No email found in user:", user);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const values = {
        selectedType,
        email: user.email,
      };

      console.log("Sending request:", values);

      const res = await fetch(`${API_BASE_URL}/accounts/assign-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Response Error:", errorData);
        alert(getErrorMessage(errorData, "Failed to assign profile type"));
        throw new Error(errorData.error || "Failed to assign profile type");
      } else {
        console.log("Profile type assigned successfully");

        // Refresh user data from server to get updated profileType
        await checkAuth();

        // Redirect based on the selected type
        if (selectedType === "WORKER") {
          router.push("/dashboard/profile");
        } else if (selectedType === "CLIENT") {
          router.push("/dashboard/home");
        }
      }
    } catch (error) {
      console.error("Error updating profile type:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      {/* Notification Bell - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      <div className="mx-auto max-w-[390px] min-h-screen flex flex-col justify-between">
        {/* Header Section */}
        <div className="flex flex-col justify-center flex-1 px-6">
          {/*Welcome Message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {user?.profile_data?.profileImg ? (
                <img
                  src={user.profile_data?.profileImg}
                  alt="Profile"
                  crossOrigin="anonymous"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>

            <h1 className="text-[28px] leading-[120%] font-[700] font-[Inter] text-black mb-2">
              Welcome, {user?.profile_data?.firstName?.split(" ")[0] || "User"}!
            </h1>
            <p className="text-gray-600 text-base leading-[150%]">
              To get started, please choose how you&apos;ll be using iAyos
            </p>
          </div>

          {/* User Type Selection Form */}
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            {/* Client Option */}
            <div
              className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all duration-200 ${
                selectedType === "CLIENT"
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
              onClick={() => setSelectedType("CLIENT")}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedType === "CLIENT"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedType === "CLIENT" && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-[600] font-[Inter] text-black">
                      I need services
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-[140%] ml-15">
                    Find skilled workers for your projects. Post jobs and hire
                    freelancers.
                  </p>
                </div>
              </div>
            </div>

            {/* Worker Option */}
            <div
              className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all duration-200 ${
                selectedType === "WORKER"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
              onClick={() => setSelectedType("WORKER")}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedType === "WORKER"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedType === "WORKER" && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V4a2 2 0 00-2-2H6a2 2 0 00-2 2v2m8 0v2a2 2 0 01-2 2H8a2 2 0 01-2-2V6"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-[600] font-[Inter] text-black">
                      I provide services
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-[140%] ml-15">
                    Showcase your skills and find clients. Build your freelance
                    career.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedType || isSubmitting}
              className={`w-full py-4 rounded-xl font-[600] font-[Inter] text-white transition-all duration-200 ${
                selectedType && !isSubmitting
                  ? "bg-black hover:bg-gray-800 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Setting up your account...</span>
                </div>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* User Info */}
          <div className="text-center text-sm text-gray-500 mb-4">
            Signed in as: {user?.email}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <button
            onClick={() => logout()}
            className="text-gray-400 text-sm underline hover:text-gray-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default TempDashboard;

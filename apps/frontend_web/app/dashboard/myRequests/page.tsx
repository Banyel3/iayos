"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";

// Extended User interface for requests page
interface RequestsUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
  };
}

// Job Request interface - simplified
interface JobRequest {
  id: string;
  title: string;
  price: string;
  date: string;
  status: "ACTIVE" | "COMPLETED" | "PENDING";
}

const MyRequestsPage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as RequestsUser;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"myRequests" | "pastRequests">(
    "myRequests"
  );

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirect non-clients to appropriate page
  useEffect(() => {
    if (!isLoading && user && user.profile_data?.profileType === "WORKER") {
      router.push("/dashboard/home");
    }
  }, [user, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isClient = user?.profile_data?.profileType === "CLIENT";

  // Mock data for job requests - simplified to match the design
  const jobRequests: JobRequest[] = [
    {
      id: "1",
      title: "Car Aircon Repair",
      price: "₱420",
      date: "Today, September 1, 2025",
      status: "ACTIVE",
    },
    {
      id: "2",
      title: "Laptop Screen Replacement",
      price: "₱850",
      date: "Yesterday, August 31, 2025",
      status: "COMPLETED",
    },
    {
      id: "3",
      title: "Kitchen Sink Installation",
      price: "₱650",
      date: "August 29, 2025",
      status: "COMPLETED",
    },
  ];

  // Filter requests based on active tab
  const filteredRequests = jobRequests.filter((request) => {
    if (activeTab === "myRequests") {
      return request.status === "ACTIVE";
    } else {
      return request.status === "COMPLETED";
    }
  });

  // Render for non-clients or incomplete profiles
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Client Access Required
            </h1>
            <p className="text-gray-600 mb-6">
              This feature is only available for clients. Complete your profile
              setup to access service requests.
            </p>
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navbar */}
      <DesktopNavbar
        isWorker={false}
        userName={user?.profile_data?.firstName || "Client"}
        onLogout={logout}
      />

      {/* Desktop & Mobile Content */}
      <div className="lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-8">
        {/* Header - Mobile Only */}
        <div className="lg:hidden bg-white px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">iAyos</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white lg:bg-transparent px-4 lg:px-0 py-2 lg:py-0 border-b lg:border-0 border-gray-100 lg:mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("myRequests")}
              className={`pb-2 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                activeTab === "myRequests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab("pastRequests")}
              className={`pb-2 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                activeTab === "pastRequests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              Past Requests
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 lg:px-0 py-4">
          {activeTab === "myRequests" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                  Active Jobs
                </h2>
                <button
                  onClick={() => router.push("/dashboard/newRequest")}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
                >
                  <span>+</span>
                  <span>Create a Job Post</span>
                </button>
              </div>

              {/* Active Jobs List */}
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {filteredRequests.length === 0 ? (
                  <div className="lg:col-span-2 text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      No active jobs
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Create your first job posting to get started
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-lg">
                            {request.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "pastRequests" && (
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                Past Requests
              </h2>

              {/* Past Requests List */}
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {filteredRequests.length === 0 ? (
                  <div className="lg:col-span-2 text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      No past requests
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Your completed jobs will appear here
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.date}
                          </p>
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Completed
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-lg">
                            {request.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  );
};

export default MyRequestsPage;

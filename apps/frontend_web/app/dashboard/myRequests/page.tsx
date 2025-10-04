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
  const [isAvailable, setIsAvailable] = useState(true);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center pb-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isWorker = user?.profile_data?.profileType === "WORKER";
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

  // Verification gate for workers
  if (isWorker) {
    return (
      <div className="min-h-screen bg-blue-50">
        {/* Desktop Navbar */}
        <DesktopNavbar
          isWorker={true}
          userName={user?.profile_data?.firstName || "Worker"}
          onLogout={logout}
          isAvailable={isAvailable}
          onAvailabilityToggle={() => setIsAvailable(!isAvailable)}
        />

        {/* Verification Gate Content */}
        <div className="lg:max-w-4xl lg:mx-auto lg:px-8 lg:py-16 px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 text-center border-2 border-blue-100">
            {/* Icon */}
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Verification Required
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-base lg:text-lg mb-2 max-w-2xl mx-auto leading-relaxed">
              To access job opportunities and start earning, you need to
              complete your identity verification first.
            </p>
            <p className="text-gray-500 text-sm lg:text-base mb-8 max-w-xl mx-auto">
              This helps us ensure a safe and trustworthy platform for both
              workers and clients.
            </p>

            {/* Benefits List */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-left">
                What you'll get after verification:
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Browse and apply for available jobs
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Receive job invitations from clients
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Build your reputation with verified reviews
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Start earning money through the platform
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push("/dashboard/kyc")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Verify Now
            </button>

            {/* Back Link */}
            <button
              onClick={() => router.push("/dashboard/home")}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium block mx-auto transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    );
  }

  // Verification gate for clients
  if (isClient) {
    return (
      <div className="min-h-screen bg-blue-50">
        {/* Desktop Navbar */}
        <DesktopNavbar
          isWorker={false}
          userName={user?.profile_data?.firstName || "Client"}
          onLogout={logout}
          isAvailable={isAvailable}
          onAvailabilityToggle={() => setIsAvailable(!isAvailable)}
        />

        {/* Verification Gate Content */}
        <div className="lg:max-w-4xl lg:mx-auto lg:px-8 lg:py-16 px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 text-center border-2 border-blue-100">
            {/* Icon */}
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Verification Required
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-base lg:text-lg mb-2 max-w-2xl mx-auto leading-relaxed">
              To post job requests and hire workers, you need to complete your
              identity verification first.
            </p>
            <p className="text-gray-500 text-sm lg:text-base mb-8 max-w-xl mx-auto">
              This helps us ensure a safe and trustworthy platform for both
              workers and clients.
            </p>

            {/* Benefits List */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-left">
                What you'll get after verification:
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Post job requests and service needs
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Connect with verified skilled workers
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Secure payment transactions
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    Track and manage all your service requests
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push("/dashboard/kyc")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Verify Now
            </button>

            {/* Back Link */}
            <button
              onClick={() => router.push("/dashboard/home")}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium block mx-auto transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    );
  }

  // Render for non-clients or incomplete profiles
  if (!isClient) {
    return (
      <div className="min-h-screen bg-blue-50 pb-16 flex items-center justify-center">
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
    <div className="min-h-screen bg-blue-50">
      {/* Desktop Navbar */}
      <DesktopNavbar
        isWorker={false}
        userName={user?.profile_data?.firstName || "Client"}
        onLogout={logout}
        isAvailable={isAvailable}
        onAvailabilityToggle={() => setIsAvailable(!isAvailable)}
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

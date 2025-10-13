"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useWorkerAvailability } from "@/lib/hooks/useWorkerAvailability";

// Extended User interface for requests page
interface RequestsUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
  };
}

// Job Request interface - extended with more details
interface JobRequest {
  id: string;
  title: string;
  price: string;
  date: string;
  status: "ACTIVE" | "COMPLETED" | "PENDING";
  description?: string;
  location?: string;
  client?: {
    name: string;
    avatar: string;
    rating: number;
  };
  worker?: {
    name: string;
    avatar: string;
    rating: number;
  };
  category?: string;
  postedDate?: string;
  completedDate?: string;
  paymentStatus?: "PENDING" | "DOWNPAYMENT_PAID" | "FULLY_PAID";
  downpaymentMethod?: "WALLET" | "GCASH" | "MAYA" | "CARD" | "BANK_TRANSFER";
  finalPaymentMethod?:
    | "WALLET"
    | "GCASH"
    | "MAYA"
    | "CARD"
    | "BANK_TRANSFER"
    | "CASH";
  downpaymentAmount?: string;
  finalPaymentAmount?: string;
  totalAmount?: string;
}

const MyRequestsPage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as RequestsUser;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "myRequests" | "pastRequests" | "requests"
  >("myRequests");
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);

  // Use the worker availability hook
  const isWorker = user?.profile_data?.profileType === "WORKER";
  const {
    isAvailable,
    isLoading: isLoadingAvailability,
    handleAvailabilityToggle,
  } = useWorkerAvailability(isWorker, isAuthenticated);

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

  const isClient = user?.profile_data?.profileType === "CLIENT";

  // Mock data for job requests - extended with details
  const jobRequests: JobRequest[] = [
    {
      id: "1",
      title: "Car Aircon Repair",
      price: "₱420",
      date: "Today, September 1, 2025",
      status: "ACTIVE",
      description:
        "Need professional aircon repair for my car. The cooling is not working properly and there's a strange noise coming from the unit.",
      location: "Quezon City, Metro Manila",
      category: "Automotive Repair",
      postedDate: "September 1, 2025",
      paymentStatus: "DOWNPAYMENT_PAID",
      downpaymentMethod: "GCASH",
      downpaymentAmount: "₱210",
      totalAmount: "₱420",
      client: {
        name: "Juan Dela Cruz",
        avatar: "/worker1.jpg",
        rating: 4.8,
      },
    },
    {
      id: "2",
      title: "Laptop Screen Replacement",
      price: "₱850",
      date: "Yesterday, August 31, 2025",
      status: "COMPLETED",
      description:
        "Laptop screen is cracked and needs replacement. Dell Inspiron 15 model.",
      location: "Makati City, Metro Manila",
      category: "Electronics Repair",
      postedDate: "August 30, 2025",
      completedDate: "August 31, 2025",
      paymentStatus: "FULLY_PAID",
      downpaymentMethod: "WALLET",
      finalPaymentMethod: "MAYA",
      downpaymentAmount: "₱425",
      finalPaymentAmount: "₱425",
      totalAmount: "₱850",
      client: {
        name: "Maria Santos",
        avatar: "/worker2.jpg",
        rating: 4.9,
      },
      worker: {
        name: "Pedro Reyes",
        avatar: "/worker3.jpg",
        rating: 4.7,
      },
    },
    {
      id: "3",
      title: "Kitchen Sink Installation",
      price: "₱650",
      date: "August 29, 2025",
      status: "COMPLETED",
      description:
        "Install new kitchen sink with faucet. Materials will be provided.",
      location: "Pasig City, Metro Manila",
      category: "Plumbing",
      postedDate: "August 28, 2025",
      completedDate: "August 29, 2025",
      paymentStatus: "FULLY_PAID",
      downpaymentMethod: "GCASH",
      finalPaymentMethod: "CASH",
      downpaymentAmount: "₱325",
      finalPaymentAmount: "₱325",
      totalAmount: "₱650",
      client: {
        name: "Ana Rodriguez",
        avatar: "/worker1.jpg",
        rating: 5.0,
      },
      worker: {
        name: "Carlos Mendoza",
        avatar: "/worker2.jpg",
        rating: 4.8,
      },
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

  // Check if user is KYC verified
  const isKycVerified = user?.kycVerified || false;

  // Verification gate for workers (only show if NOT KYC verified)
  if (isWorker && !isKycVerified) {
    return (
      <div className="min-h-screen bg-blue-50">
        {/* Desktop Navbar */}
        <DesktopNavbar
          isWorker={true}
          userName={user?.profile_data?.firstName || "Worker"}
          onLogout={logout}
          isAvailable={isAvailable}
          isLoadingAvailability={isLoadingAvailability}
          onAvailabilityToggle={handleAvailabilityToggle}
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

  // Verification gate for clients (only show if NOT KYC verified)
  if (isClient && !isKycVerified) {
    return (
      <div className="min-h-screen bg-blue-50">
        {/* Desktop Navbar */}
        <DesktopNavbar
          isWorker={false}
          userName={user?.profile_data?.firstName || "Client"}
          onLogout={logout}
          isAvailable={isAvailable}
          isLoadingAvailability={isLoadingAvailability}
          onAvailabilityToggle={handleAvailabilityToggle}
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

  // Render for users without proper profile type
  if (!isClient && !isWorker) {
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
              Profile Setup Required
            </h1>
            <p className="text-gray-600 mb-6">
              Complete your profile setup to access this feature.
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

  // Main content for KYC verified users (both workers and clients)
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Desktop Navbar */}
      <DesktopNavbar
        isWorker={isWorker}
        userName={
          user?.profile_data?.firstName || (isWorker ? "Worker" : "Client")
        }
        onLogout={logout}
        isAvailable={isAvailable}
        isLoadingAvailability={isLoadingAvailability}
        onAvailabilityToggle={handleAvailabilityToggle}
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
              {isWorker ? "My Jobs" : "My Requests"}
            </button>
            <button
              onClick={() => setActiveTab("pastRequests")}
              className={`pb-2 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                activeTab === "pastRequests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              {isWorker ? "Past Jobs" : "Past Requests"}
            </button>
            {/* Requests tab - only for clients */}
            {isClient && (
              <button
                onClick={() => setActiveTab("requests")}
                className={`pb-2 text-sm lg:text-base font-medium border-b-2 transition-colors ${
                  activeTab === "requests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                Requests
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 lg:px-0 py-4">
          {/* CLIENT VIEW */}
          {isClient && activeTab === "myRequests" && (
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
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
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
                      onClick={() => setSelectedJob(request)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.date}
                          </p>
                          {request.location && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {request.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-lg">
                            {request.price}
                          </p>
                          <svg
                            className="w-5 h-5 text-gray-400 ml-auto mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* WORKER VIEW */}
          {isWorker && activeTab === "myRequests" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                  Active Job Applications
                </h2>
              </div>

              {/* Active Jobs List for Workers */}
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
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
                      No active applications
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Browse available jobs on the home page to get started
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedJob(request)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.date}
                          </p>
                          {request.location && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {request.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-lg">
                            {request.price}
                          </p>
                          <svg
                            className="w-5 h-5 text-gray-400 ml-auto mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CLIENT PAST REQUESTS */}
          {isClient && activeTab === "pastRequests" && (
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                Past Requests
              </h2>

              {/* Past Requests List */}
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
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
                      onClick={() => setSelectedJob(request)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
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
                          <svg
                            className="w-5 h-5 text-gray-400 ml-auto mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CLIENT REQUESTS TAB - Worker Applications */}
          {isClient && activeTab === "requests" && (
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                Worker Applications
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                View workers who have applied to your posted jobs
              </p>

              {/* Applications List */}
              <div className="space-y-3">
                <div className="text-center py-12">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-medium mb-2">
                    No applications yet
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Worker applications to your jobs will appear here
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* WORKER PAST REQUESTS */}
          {isWorker && activeTab === "pastRequests" && (
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                Past Job Applications
              </h2>

              {/* Past Requests List */}
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
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
                      No past applications
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Your completed jobs will appear here
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedJob(request)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
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
                          <svg
                            className="w-5 h-5 text-gray-400 ml-auto mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
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

      {/* Job Details Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white w-full lg:w-full lg:max-w-2xl lg:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Job Details
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title and Price */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedJob.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-blue-600">
                    {selectedJob.price}
                  </span>
                  {selectedJob.status === "COMPLETED" && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      Completed
                    </span>
                  )}
                  {selectedJob.status === "ACTIVE" && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Category and Location */}
              <div className="grid grid-cols-2 gap-4">
                {selectedJob.category && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.category}
                    </p>
                  </div>
                )}
                {selectedJob.location && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-medium text-gray-900 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {selectedJob.location}
                    </p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {selectedJob.postedDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Posted Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.postedDate}
                    </p>
                  </div>
                )}
                {selectedJob.completedDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Completed Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.completedDate}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              {(selectedJob.paymentStatus ||
                selectedJob.downpaymentMethod ||
                selectedJob.finalPaymentMethod) && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Payment Information
                  </h4>

                  <div className="space-y-3">
                    {/* Payment Status */}
                    {selectedJob.paymentStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            selectedJob.paymentStatus === "FULLY_PAID"
                              ? "bg-green-100 text-green-700"
                              : selectedJob.paymentStatus === "DOWNPAYMENT_PAID"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {selectedJob.paymentStatus === "FULLY_PAID"
                            ? "Fully Paid"
                            : selectedJob.paymentStatus === "DOWNPAYMENT_PAID"
                              ? "Downpayment Paid"
                              : "Pending"}
                        </span>
                      </div>
                    )}

                    {/* Total Amount */}
                    {selectedJob.totalAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Total Amount:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {selectedJob.totalAmount}
                        </span>
                      </div>
                    )}

                    {/* Downpayment Info */}
                    {selectedJob.downpaymentAmount && (
                      <div className="flex items-center justify-between border-t border-blue-200 pt-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            Downpayment (50%):
                          </span>
                          {selectedJob.downpaymentMethod && (
                            <span className="text-xs text-gray-500 flex items-center mt-1">
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              Paid via{" "}
                              {selectedJob.downpaymentMethod === "GCASH"
                                ? "GCash"
                                : selectedJob.downpaymentMethod === "MAYA"
                                  ? "Maya"
                                  : selectedJob.downpaymentMethod === "CARD"
                                    ? "Card"
                                    : selectedJob.downpaymentMethod ===
                                        "BANK_TRANSFER"
                                      ? "Bank Transfer"
                                      : "Wallet"}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {selectedJob.downpaymentAmount}
                        </span>
                      </div>
                    )}

                    {/* Final Payment Info */}
                    {selectedJob.finalPaymentAmount && (
                      <div className="flex items-center justify-between border-t border-blue-200 pt-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            Final Payment (50%):
                          </span>
                          {selectedJob.finalPaymentMethod && (
                            <span className="text-xs text-gray-500 flex items-center mt-1">
                              <span
                                className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  selectedJob.finalPaymentMethod === "CASH"
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                              ></span>
                              Paid via{" "}
                              {selectedJob.finalPaymentMethod === "CASH"
                                ? "Cash"
                                : selectedJob.finalPaymentMethod === "GCASH"
                                  ? "GCash"
                                  : selectedJob.finalPaymentMethod === "MAYA"
                                    ? "Maya"
                                    : selectedJob.finalPaymentMethod === "CARD"
                                      ? "Card"
                                      : selectedJob.finalPaymentMethod ===
                                          "BANK_TRANSFER"
                                        ? "Bank Transfer"
                                        : "Wallet"}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {selectedJob.finalPaymentAmount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Client Info */}
              {selectedJob.client && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {isClient ? "Your Information" : "Client Information"}
                  </h4>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={
                        isClient && user?.profile_data?.firstName
                          ? selectedJob.client.avatar
                          : selectedJob.client.avatar
                      }
                      alt={
                        isClient && user?.profile_data?.firstName
                          ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
                          : selectedJob.client.name
                      }
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {isClient && user?.profile_data?.firstName
                          ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
                          : selectedJob.client.name}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 text-yellow-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {selectedJob.client.rating} rating
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Worker Info (for completed jobs) */}
              {selectedJob.worker && selectedJob.status === "COMPLETED" && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {isWorker ? "Your Information" : "Worker Information"}
                  </h4>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={
                        isWorker && user?.profile_data?.firstName
                          ? selectedJob.worker.avatar
                          : selectedJob.worker.avatar
                      }
                      alt={
                        isWorker && user?.profile_data?.firstName
                          ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
                          : selectedJob.worker.name
                      }
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {isWorker && user?.profile_data?.firstName
                          ? `${user.profile_data.firstName} ${user.profile_data.lastName || ""}`
                          : selectedJob.worker.name}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 text-yellow-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {selectedJob.worker.rating} rating
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedJob.status === "ACTIVE" && (
                  <>
                    {isClient && (
                      <button className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
                        Cancel Job
                      </button>
                    )}
                    {isWorker && (
                      <button className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
                        Withdraw Application
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  );
};

export default MyRequestsPage;

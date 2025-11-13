"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useWorkerAvailability } from "@/lib/hooks/useWorkerAvailability";
import WorkerMaterials from "@/components/worker/WorkerMaterials";
import { API_BASE_URL } from "@/lib/api/config";
import {
  useWalletBalance,
  useWalletTransactions,
} from "@/lib/hooks/useHomeData";
import { useQueryClient } from "@tanstack/react-query";

// Extended User interface for profile page
interface ProfileUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
    profileImg?: string;
  };
}

// Interfaces for different profile types
interface WorkerProfile {
  name: string;
  isVerified: boolean;
  avatar: string;
  jobTitle: string;
  startingRate: string;
  experience: string;
  rating: number;
  ratingsCount: string;
  certificate: string;
  skills: string[];
}

interface ClientProfile {
  name: string;
  isVerified: boolean;
  avatar: string;
  location: string;
  memberSince: string;
  totalJobs: number;
  rating: number;
  ratingsCount: string;
  feedbackCount: number;
  jobHistory: Array<{
    id: string;
    title: string;
    duration: string;
    timeAgo: string;
    price: string;
    rating: number;
    feedback: string;
  }>;
}

const ProfilePage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as ProfileUser; // Type assertion for this page
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "feedbacks" | "transaction"
  >("overview");

  // Use the worker availability hook
  const isWorker = user?.profile_data?.profileType === "WORKER";
  const {
    isAvailable,
    isLoading: isLoadingAvailability,
    handleAvailabilityToggle,
  } = useWorkerAvailability(isWorker, isAuthenticated);

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // React Query hooks for wallet with sessionStorage
  const { data: walletBalance = 0, isLoading: isLoadingWallet } =
    useWalletBalance(isAuthenticated);
  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useWalletTransactions(isAuthenticated && activeTab === "transaction");

  // Modal states
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Detect client viewport (only run on client) so we mount WorkerMaterials exactly once
  const [isClientMobile, setIsClientMobile] = useState<boolean | null>(null);
  useEffect(() => {
    // run only on client
    if (typeof window === "undefined") return;
    const mq = () => window.innerWidth < 1024; // match Tailwind lg breakpoint
    const setMatch = () => setIsClientMobile(mq());
    setMatch();
    const onResize = () => setMatch();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Authentication check and profile type redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }

    // Redirect if user doesn't have a profile type set
    if (isAuthenticated && !user?.profile_data?.profileType) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router, user?.profile_data?.profileType]);

  // Check for payment status in URL params
  useEffect(() => {
    if (!isAuthenticated) return;

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus === "success") {
      alert("Payment completed! Your balance will be updated shortly.");
      // Invalidate and refetch wallet balance
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paymentStatus === "failed") {
      alert("Payment failed or was cancelled.");
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [isAuthenticated, queryClient]);

  // Handle Add Funds (for clients)
  const handleAddFunds = async () => {
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE_URL}/accounts/wallet/deposit`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(fundAmount),
          payment_method: "GCASH",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.payment_url) {
        // Funds are added immediately in TEST MODE
        // Redirect to Xendit page for user experience
        alert(
          `✅ ₱${fundAmount} added to your wallet!\nYou'll be redirected to the Xendit payment page.\nYour new balance: ₱${data.new_balance}`
        );
        // Invalidate wallet balance cache
        queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        window.location.href = data.payment_url;
      } else {
        alert(data.error || "Failed to add funds. Please try again.");
      }
    } catch (error) {
      console.error("Error adding funds:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cash Out (for workers)
  const handleCashOut = async () => {
    if (
      !withdrawAmount ||
      isNaN(Number(withdrawAmount)) ||
      Number(withdrawAmount) <= 0
    ) {
      alert("Please enter a valid amount");
      return;
    }

    if (Number(withdrawAmount) > walletBalance) {
      alert("Insufficient balance");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(
        `${API_BASE_URL}/payments/request-withdrawal`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: Number(withdrawAmount) }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          `Withdrawal request submitted successfully! Amount: ₱${withdrawAmount}`
        );
        // Invalidate wallet balance cache to refetch
        queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      } else {
        alert(data.error || "Failed to process withdrawal. Please try again.");
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
      setShowCashOutModal(false);
      setWithdrawAmount("");
    }
  };

  // Loading state
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

  // Return null while redirecting
  if (!isAuthenticated || !user?.profile_data?.profileType) return null;

  // Mock data for worker profile
  const workerData: WorkerProfile = {
    name: user?.profile_data?.firstName || "John Reyes",
    isVerified: user?.kycVerified || false,
    avatar: user?.profile_data?.profileImg || "/worker1.jpg",
    jobTitle: "Appliance Repair Technician",
    startingRate: "₱380",
    experience: "2+ years of experience",
    rating: 4.9,
    ratingsCount: "ratings",
    certificate: "TESDA Certificate 1",
    skills: [
      "Refrigerator & Freezer Repair",
      "Electrical Repair",
      "Washing Machine & Dryer",
      "Oven, Stove & Microwave",
    ],
  };

  // Mock data for client profile
  const clientData: ClientProfile = {
    name: user?.profile_data?.firstName || "Crissy Santos",
    isVerified: user?.kycVerified || false,
    avatar: user?.profile_data?.profileImg || "/worker2.jpg", // Using available images for now
    location: "Quezon City, Metro Manila",
    memberSince: "January 2024",
    totalJobs: 3,
    rating: 5.0,
    ratingsCount: "Feedbacks",
    feedbackCount: 5.0,
    jobHistory: [
      {
        id: "1",
        title: "Freezer Repair",
        duration: "Duration: Less than a day",
        timeAgo: "2 days ago",
        price: "₱500",
        rating: 5,
        feedback: "Freezer now working perfectly fine, kudos to Anton.",
      },
      {
        id: "2",
        title: "Stove Repair",
        duration: "Duration: Less than a day",
        timeAgo: "1 week ago",
        price: "₱380",
        rating: 4,
        feedback: "Freezer now working perfectly fine, kudos to Anton.",
      },
      {
        id: "3",
        title: "Washing Machine",
        duration: "Duration: Less than a day",
        timeAgo: "2 weeks ago",
        price: "₱600",
        rating: 5,
        feedback: "Great service and professional work.",
      },
    ],
  };

  const isClient = user?.profile_data?.profileType === "CLIENT";

  // Render worker profile
  const renderWorkerProfile = () => (
    <>
      {/* Header with Log Out button - Outside cards */}
      <div className="bg-blue-50 px-4 py-3">
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={() => logout()}
            className="text-red-500 text-sm font-medium hover:text-red-600"
          >
            Log Out
          </button>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isAvailable ? "bg-green-500" : "bg-gray-400"
              }`}
            ></div>
            <span
              className="text-sm font-medium text-gray-700 cursor-pointer"
              onClick={handleAvailabilityToggle}
            >
              {isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
      </div>

      {/* First Card - Profile Info */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 pt-5 pb-4">
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              <img
                src={workerData.avatar}
                alt={workerData.name}
                crossOrigin="anonymous"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-base font-semibold text-gray-900 mb-0">
                {workerData.name}
              </h1>
              <p
                className={`text-xs flex items-center ${workerData.isVerified ? "text-green-500" : "text-gray-500"}`}
              >
                {workerData.isVerified ? "✓ KYC Verified" : "KYC Unverified"}
              </p>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-600 mb-1">Wallet Balance</p>
            {isLoadingWallet ? (
              <p className="text-xl font-bold text-gray-900 mb-2">Loading...</p>
            ) : (
              <p className="text-xl font-bold text-gray-900 mb-2">
                ₱{walletBalance.toFixed(2)}
              </p>
            )}
            <button
              onClick={() => setShowCashOutModal(true)}
              className="bg-gray-50 text-blue-500 border border-blue-500 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
              disabled={isLoadingWallet}
            >
              Cash Out
            </button>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => router.push("/dashboard/profile/edit")}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs - Outside card on blue background */}
      <div className="px-4 mt-4">
        <div className="flex w-full border-b border-gray-300">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2 text-xs transition-colors ${
              activeTab === "overview"
                ? "font-bold underline text-gray-900"
                : "font-medium text-gray-600"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("feedbacks")}
            className={`flex-1 py-2 text-xs transition-colors ${
              activeTab === "feedbacks"
                ? "font-bold underline text-gray-900"
                : "font-medium text-gray-600"
            }`}
          >
            Feedbacks
          </button>
          <button
            onClick={() => setActiveTab("transaction")}
            className={`flex-1 py-2 text-xs transition-colors ${
              activeTab === "transaction"
                ? "font-bold underline text-gray-900"
                : "font-medium text-gray-600"
            }`}
          >
            Transaction
          </button>
        </div>
      </div>

      {/* Second Card - Tab Content */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 py-4">
          {/* Worker Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Job Title and Rate */}
              <div className="text-left">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  {workerData.jobTitle}
                </h2>
                <div className="text-gray-600 mb-2">
                  <span className="text-xs">Starting Rate:</span>
                  <div className="text-lg font-bold text-gray-900">
                    {workerData.startingRate}
                  </div>
                  <p className="text-xs text-blue-400 cursor-pointer">
                    *Non Certified Rate
                  </p>
                </div>
              </div>

              {/* Experience and Ratings */}
              <div className="flex items-center space-x-4 text-xs text-gray-600 py-1">
                <div className="flex items-center space-x-1">
                  <span>📅</span>
                  <span>{workerData.experience}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span>
                    {workerData.rating} {workerData.ratingsCount}
                  </span>
                </div>
              </div>

              {/* Certificates */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-1">
                  Certificates
                </h3>
                <div className="text-left">
                  <span className="text-blue-400 text-xs underline cursor-pointer hover:text-blue-500">
                    {workerData.certificate}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-2">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {workerData.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700 border border-blue-200"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials (mobile) */}
              <div className="mt-3">
                {isClientMobile !== null && isClientMobile && (
                  <WorkerMaterials />
                )}
              </div>
            </div>
          )}

          {activeTab === "feedbacks" && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No feedbacks to display</p>
            </div>
          )}

          {activeTab === "transaction" && (
            <div className="space-y-3">
              {isLoadingTransactions ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-sm font-semibold ${
                              transaction.type === "DEPOSIT"
                                ? "text-green-600"
                                : transaction.type === "WITHDRAWAL"
                                  ? "text-red-600"
                                  : "text-gray-900"
                            }`}
                          >
                            {transaction.type === "DEPOSIT"
                              ? "+"
                              : transaction.type === "WITHDRAWAL"
                                ? "-"
                                : ""}
                            ₱{transaction.amount.toFixed(2)}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              transaction.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : transaction.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                        {transaction.payment_method && (
                          <p className="text-xs text-gray-500 mt-1">
                            via {transaction.payment_method}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Balance After</p>
                        <p className="text-sm font-medium text-gray-900">
                          ₱{transaction.balance_after.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Render client profile
  const renderClientProfile = () => (
    <>
      {/* First Container - Profile Info */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 pt-5 pb-3">
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              <img
                src={clientData.avatar}
                alt={clientData.name}
                crossOrigin="anonymous"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-base font-semibold text-gray-900 mb-0">
                {clientData.name}
              </h1>
              <p
                className={`text-xs ${clientData.isVerified ? "text-green-500" : "text-gray-500"}`}
              >
                {clientData.isVerified ? "KYC Verified" : "KYC Unverified"}
              </p>
            </div>
          </div>

          {/* Client Action Buttons */}
          <div className="flex flex-col w-full space-y-2">
            <button className="w-full bg-blue-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors">
              Verify Now →
            </button>
            <button
              onClick={() => router.push("/dashboard/profile/edit")}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => logout()}
              className="w-full bg-red-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Rating - Outside containers */}
      <div className="text-center my-6 px-4">
        <div className="flex items-center justify-center space-x-1 text-yellow-500">
          <span className="text-xs">⭐</span>
          <span className="text-xs font-semibold text-gray-900">
            {clientData.feedbackCount}
          </span>
          <span className="text-xs text-gray-600">
            {clientData.ratingsCount}
          </span>
        </div>
      </div>

      {/* Second Container - Job History */}
      <div className="bg-white mx-4 mt-6 rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 py-4">
          {/* Job History */}
          <div className="space-y-3">
            {clientData.jobHistory.map((job) => (
              <div key={job.id} className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-gray-500">{job.timeAgo}</span>
                  <span className="text-base font-bold text-gray-900">
                    {job.price}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {job.title}
                </h3>
                <p className="text-xs text-gray-600 mb-1">{job.duration}</p>
                <p className="text-xs text-gray-500 mb-2">Client Feedback:</p>

                {/* White container for stars and review */}
                <div className="bg-white rounded-lg p-2">
                  {/* Star Rating */}
                  <div className="flex items-center space-x-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${
                          i < job.rating ? "text-yellow-500" : "text-gray-300"
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-700 italic">{job.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {/* Desktop Navbar */}
        <DesktopNavbar
          isWorker={isWorker}
          userName={isWorker ? workerData.name : clientData.name}
          userAvatar={
            user?.profile_data?.profileImg ||
            (isWorker ? "/worker1.jpg" : "/worker2.jpg")
          }
          onLogout={logout}
          isAvailable={isAvailable}
          isLoadingAvailability={isLoadingAvailability}
          onAvailabilityToggle={handleAvailabilityToggle}
        />

        {/* Desktop Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Availability Toggle Row */}
          {isWorker && (
            <div className="mb-6 flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isAvailable ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                <span
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                  onClick={handleAvailabilityToggle}
                >
                  {isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-24">
                <div className="flex flex-col items-center text-center mb-4">
                  <img
                    src={isWorker ? workerData.avatar : clientData.avatar}
                    alt={isWorker ? workerData.name : clientData.name}
                    crossOrigin="anonymous"
                    className="w-24 h-24 rounded-full object-cover mb-3"
                  />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isWorker ? workerData.name : clientData.name}
                  </h2>
                  <p
                    className={`text-sm flex items-center ${(isWorker ? workerData.isVerified : clientData.isVerified) ? "text-green-500" : "text-gray-500"}`}
                  >
                    {isWorker
                      ? workerData.isVerified
                        ? "✓ KYC Verified"
                        : "KYC Unverified"
                      : clientData.isVerified
                        ? "✓ KYC Verified"
                        : "KYC Unverified"}
                  </p>
                </div>

                {isWorker && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-xs text-gray-600 mb-1">
                        Wallet Balance
                      </p>
                      {isLoadingWallet ? (
                        <p className="text-2xl font-bold text-gray-900 mb-3">
                          Loading...
                        </p>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 mb-3">
                          ₱{walletBalance.toFixed(2)}
                        </p>
                      )}
                      <button
                        onClick={() => setShowCashOutModal(true)}
                        className="bg-gray-50 text-blue-500 border border-blue-500 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                        disabled={isLoadingWallet}
                      >
                        Cash Out
                      </button>
                    </div>
                    <button
                      onClick={() => router.push("/dashboard/profile/edit")}
                      className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Edit Profile
                    </button>
                  </>
                )}

                {isClient && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">
                        Wallet Balance
                      </p>
                      {isLoadingWallet ? (
                        <p className="text-2xl font-bold text-gray-900 mb-3">
                          Loading...
                        </p>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 mb-3">
                          ₱{walletBalance.toFixed(2)}
                        </p>
                      )}
                      <button
                        onClick={() => setShowAddFundsModal(true)}
                        className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-blue-600 transition-colors"
                        disabled={isLoadingWallet}
                      >
                        Add Funds
                      </button>
                    </div>
                    <button
                      onClick={() => router.push("/dashboard/profile/edit")}
                      className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="mb-6">
                <div className="flex space-x-8 border-b border-gray-300">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`pb-3 text-sm transition-colors ${
                      activeTab === "overview"
                        ? "font-bold border-b-2 border-gray-900 text-gray-900"
                        : "font-medium text-gray-600"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("feedbacks")}
                    className={`pb-3 text-sm transition-colors ${
                      activeTab === "feedbacks"
                        ? "font-bold border-b-2 border-gray-900 text-gray-900"
                        : "font-medium text-gray-600"
                    }`}
                  >
                    Feedbacks
                  </button>
                  <button
                    onClick={() => setActiveTab("transaction")}
                    className={`pb-3 text-sm transition-colors ${
                      activeTab === "transaction"
                        ? "font-bold border-b-2 border-gray-900 text-gray-900"
                        : "font-medium text-gray-600"
                    }`}
                  >
                    Transaction
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                {isWorker && activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {workerData.jobTitle}
                      </h3>
                      <div className="text-gray-600 mb-3">
                        <span className="text-sm">Starting Rate:</span>
                        <div className="text-2xl font-bold text-gray-900">
                          {workerData.startingRate}
                        </div>
                        <p className="text-xs text-blue-400 cursor-pointer">
                          *Non Certified Rate
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>📅</span>
                        <span>{workerData.experience}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>⭐</span>
                        <span>
                          {workerData.rating} {workerData.ratingsCount}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Certificates
                      </h4>
                      <span className="text-blue-400 text-sm underline cursor-pointer hover:text-blue-500">
                        {workerData.certificate}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {workerData.skills.map((skill, index) => (
                          <div
                            key={index}
                            className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700 border border-blue-200"
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Materials (desktop) */}
                    <div>
                      {isClientMobile !== null && !isClientMobile && (
                        <WorkerMaterials />
                      )}
                    </div>
                  </div>
                )}

                {isClient && activeTab === "overview" && (
                  <div className="space-y-4">
                    {clientData.jobHistory.map((job) => (
                      <div key={job.id} className="bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-500">
                            {job.timeAgo}
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {job.price}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {job.duration}
                        </p>
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center space-x-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < job.rating
                                    ? "text-yellow-500"
                                    : "text-gray-300"
                                }`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-700 italic">
                            {job.feedback}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "feedbacks" && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No feedbacks to display</p>
                  </div>
                )}

                {activeTab === "transaction" && (
                  <div className="space-y-3">
                    {isLoadingTransactions ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>Loading transactions...</p>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>No transactions yet</p>
                      </div>
                    ) : (
                      transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="bg-white rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-base font-semibold ${
                                    transaction.type === "DEPOSIT"
                                      ? "text-green-600"
                                      : transaction.type === "WITHDRAWAL"
                                        ? "text-red-600"
                                        : "text-gray-900"
                                  }`}
                                >
                                  {transaction.type === "DEPOSIT"
                                    ? "+"
                                    : transaction.type === "WITHDRAWAL"
                                      ? "-"
                                      : ""}
                                  ₱{transaction.amount.toFixed(2)}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    transaction.status === "COMPLETED"
                                      ? "bg-green-100 text-green-700"
                                      : transaction.status === "PENDING"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {transaction.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(
                                  transaction.created_at
                                ).toLocaleString()}
                              </p>
                              {transaction.payment_method && (
                                <p className="text-xs text-gray-500 mt-1">
                                  via {transaction.payment_method}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                Balance After
                              </p>
                              <p className="text-base font-medium text-gray-900">
                                ₱{transaction.balance_after.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden pb-20">
        <br />
        <br />
        {isWorker && renderWorkerProfile()}
        {isClient && renderClientProfile()}

        {/* Fallback for undefined profile types */}
        {!isWorker && !isClient && (
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Profile Setup Required
              </h1>
              <p className="text-gray-600 mb-6">
                Please complete your profile setup.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        <MobileNav isWorker={isWorker} />
      </div>

      {/* Add Funds Modal (for Clients) */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Funds</h2>
              <button
                onClick={() => {
                  setShowAddFundsModal(false);
                  setFundAmount("");
                }}
                className="text-gray-500 hover:text-gray-700"
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

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ₱{walletBalance.toFixed(2)}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Add (₱)
              </label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                step="0.01"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setFundAmount("500")}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  ₱500
                </button>
                <button
                  onClick={() => setFundAmount("1000")}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  ₱1,000
                </button>
                <button
                  onClick={() => setFundAmount("2000")}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  ₱2,000
                </button>
                <button
                  onClick={() => setFundAmount("5000")}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  ₱5,000
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddFundsModal(false);
                  setFundAmount("");
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={isProcessing || !fundAmount}
              >
                {isProcessing ? "Processing..." : "Continue to Payment"}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              You will be redirected to Xendit to complete the payment
            </p>
          </div>
        </div>
      )}

      {/* Cash Out Modal (for Workers) */}
      {showCashOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Cash Out</h2>
              <button
                onClick={() => {
                  setShowCashOutModal(false);
                  setWithdrawAmount("");
                }}
                className="text-gray-500 hover:text-gray-700"
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

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ₱{walletBalance.toFixed(2)}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Withdraw (₱)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max={walletBalance}
                step="0.01"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {walletBalance >= 500 && (
                  <button
                    onClick={() => setWithdrawAmount("500")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                  >
                    ₱500
                  </button>
                )}
                {walletBalance >= 1000 && (
                  <button
                    onClick={() => setWithdrawAmount("1000")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                  >
                    ₱1,000
                  </button>
                )}
                {walletBalance >= 2000 && (
                  <button
                    onClick={() => setWithdrawAmount("2000")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                  >
                    ₱2,000
                  </button>
                )}
                <button
                  onClick={() => setWithdrawAmount(walletBalance.toString())}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm hover:bg-blue-200"
                >
                  All (₱{walletBalance.toFixed(2)})
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    KYC Verification Required
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    For withdrawals, you need to complete KYC verification. This
                    is currently simulated in sandbox mode.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCashOutModal(false);
                  setWithdrawAmount("");
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleCashOut}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={
                  isProcessing ||
                  !withdrawAmount ||
                  Number(withdrawAmount) > walletBalance
                }
              >
                {isProcessing ? "Processing..." : "Request Withdrawal"}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Withdrawal requests are processed within 1-3 business days
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

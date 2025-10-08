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

// Extended User interface for profile page
interface ProfileUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
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
  const { isAvailable, handleAvailabilityToggle } = useWorkerAvailability(
    isWorker,
    isAuthenticated
  );

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
    isVerified: false,
    avatar: "/worker1.jpg",
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
    isVerified: false,
    avatar: "/worker2.jpg", // Using available images for now
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
              <Image
                src={workerData.avatar}
                alt={workerData.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-base font-semibold text-gray-900 mb-0">
                {workerData.name}
              </h1>
              <p className="text-xs text-green-500 flex items-center">
                {workerData.isVerified ? "✓ Verified" : "Unverified"}
              </p>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-600 mb-1">Wallet Balance</p>
            <p className="text-xl font-bold text-gray-900 mb-2">₱300.00</p>
            <button className="bg-gray-50 text-blue-500 border border-blue-500 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors">
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
            </div>
          )}

          {activeTab === "feedbacks" && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No feedbacks to display</p>
            </div>
          )}

          {activeTab === "transaction" && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No transactions to display</p>
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
              <Image
                src={clientData.avatar}
                alt={clientData.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-base font-semibold text-gray-900 mb-0">
                {clientData.name}
              </h1>
              <p className="text-xs text-red-500">
                {clientData.isVerified ? "Verified" : "Unverified"}
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
          onLogout={logout}
          isAvailable={isAvailable}
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
                  <Image
                    src={isWorker ? workerData.avatar : clientData.avatar}
                    alt={isWorker ? workerData.name : clientData.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover mb-3"
                  />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isWorker ? workerData.name : clientData.name}
                  </h2>
                  <p className="text-sm text-green-500 flex items-center">
                    {isWorker
                      ? workerData.isVerified
                        ? "✓ Verified"
                        : "Unverified"
                      : clientData.isVerified
                        ? "✓ Verified"
                        : "Unverified"}
                  </p>
                </div>

                {isWorker && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-xs text-gray-600 mb-1">
                        Wallet Balance
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mb-3">
                        ₱300.00
                      </p>
                      <button className="bg-gray-50 text-blue-500 border border-blue-500 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors">
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
                  <div className="space-y-2">
                    <button className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                      Verify Now →
                    </button>
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
                  <div className="text-center py-12 text-gray-500">
                    <p>No transactions to display</p>
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
        <MobileNav />
      </div>
    </div>
  );
};

export default ProfilePage;

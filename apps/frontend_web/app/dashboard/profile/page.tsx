"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/ui/mobile-nav";

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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "recent">("overview");
  const [isAvailable, setIsAvailable] = useState(true);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">You are not logged in.</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Mock data for worker profile
  const workerData: WorkerProfile = {
    name: session.user.name || "John Reyes",
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
    name: session.user.name || "Crissy Santos",
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

  const isWorker = user?.profileType === "WORKER";
  const isClient = user?.profileType === "CLIENT";

  // Render worker profile
  const renderWorkerProfile = () => (
    <>
      {/* Worker-specific header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isAvailable ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <span
                className="text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => setIsAvailable(!isAvailable)}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>
          <button className="text-blue-500 text-sm font-medium">
            📍 Set My Location
          </button>
        </div>
      </div>

      {/* Worker profile content */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 pt-5 pb-3">
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
              <p className="text-xs text-red-500">
                {workerData.isVerified ? "Verified" : "Unverified"}
              </p>
            </div>
          </div>

          {/* Worker Action Buttons */}
          <div className="flex flex-col w-full space-y-2 mb-3">
            <button className="w-full bg-blue-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors">
              Verify Now →
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
              Edit Profile
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full bg-red-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              Log Out
            </button>
          </div>

          {/* Tabs */}
          <div className="flex w-full border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "recent"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              Recent Jobs
            </button>
          </div>

          {/* Worker Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Job Title and Rate */}
              <div className="text-center">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  {workerData.jobTitle}
                </h2>
                <div className="text-gray-600">
                  <span className="text-xs">Starting Rate:</span>
                  <div className="text-base font-bold text-gray-900 mt-1">
                    {workerData.startingRate}
                  </div>
                </div>
              </div>

              {/* Experience and Ratings */}
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-600 py-1">
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
                  <span className="text-blue-500 text-xs underline cursor-pointer hover:text-blue-600">
                    {workerData.certificate}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-2">
                  Skills
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {workerData.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg px-2 py-2 text-xs text-gray-700 border border-gray-200 text-center"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "recent" && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No recent jobs to display</p>
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
            <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
              Edit Profile
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
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
    <div className="min-h-screen bg-blue-50 pb-20">
      <br />
      <br />
      {isWorker && renderWorkerProfile()}
      {isClient && renderClientProfile()}

      {/* Fallback for undefined profile types */}
      {!isWorker && !isClient && (
        <div className="flex justify-center items-center min-h-screen bg-blue-50">
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
  );
};

export default ProfilePage;

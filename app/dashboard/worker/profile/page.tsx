"use client";

import React, { useState } from "react";
import Image from "next/image";
import MobileNav from "@/components/ui/mobile-nav";

const WorkerProfile = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'recent'>('overview');
  const [isAvailable, setIsAvailable] = useState(true);

  // Mock data - replace with actual data from backend
  const workerData = {
    name: "John Reyes",
    isVerified: false,
    avatar: "/worker1.jpg", // Using existing image from public folder
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
      "Oven, Stove & Microwave"
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span 
                className="text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => setIsAvailable(!isAvailable)}
              >
                {isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
          <button className="text-blue-500 text-sm font-medium">
            📍 Set My Location
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Image
                src={workerData.avatar}
                alt={workerData.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              {workerData.name}
            </h1>
            <p className="text-sm text-red-500 mb-4">
              {workerData.isVerified ? 'Verified' : 'Unverified'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col w-full space-y-3 mb-6">
              <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                Verify Now →
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Edit Profile
              </button>
            </div>

            {/* Tabs */}
            <div className="flex w-full border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'recent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                Recent Jobs
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Job Title and Rate */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {workerData.jobTitle}
                </h2>
                <div className="flex items-center text-gray-600">
                  <span className="text-sm">Starting Rate:</span>
                  <span className="text-xl font-bold text-gray-900 ml-2">
                    {workerData.startingRate}
                  </span>
                </div>
              </div>

              {/* Experience and Ratings */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{workerData.experience}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{workerData.rating} {workerData.ratingsCount}</span>
                </div>
              </div>

              {/* Certificates */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Certificates</h3>
                <div className="inline-block">
                  <span className="text-blue-500 text-sm underline cursor-pointer hover:text-blue-600">
                    {workerData.certificate}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Skills</h3>
                <div className="grid grid-cols-2 gap-2">
                  {workerData.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 text-center"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="text-center py-8 text-gray-500">
              <p>No recent jobs to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};

export default WorkerProfile;
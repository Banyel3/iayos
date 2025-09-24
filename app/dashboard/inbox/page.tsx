"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/ui/mobile-nav";

interface Message {
  id: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  isUnread: boolean;
  type: "invite" | "application" | "general";
}

const InboxPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "all" | "invites" | "applications"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for messages
  const messages: Message[] = [
    {
      id: "1",
      name: "Jake Morris",
      avatar: "/worker1.jpg",
      message: "You: Negotiated ₱450",
      time: "1hr ago",
      isUnread: true,
      type: "general",
    },
    {
      id: "2",
      name: "Jane Martha",
      avatar: "/worker2.jpg",
      message: "You: San po exact loc?",
      time: "2hrs ago",
      isUnread: false,
      type: "invite",
    },
    {
      id: "3",
      name: "Luiz Ramon",
      avatar: "/worker3.jpg",
      message: "Kaya lang po ba",
      time: "1hr ago",
      isUnread: false,
      type: "application",
    },
    {
      id: "4",
      name: "Crissy Santos",
      avatar: "/worker1.jpg",
      message: "Hi, pwede po ba bukas?",
      time: "3hr ago",
      isUnread: false,
      type: "general",
    },
    {
      id: "5",
      name: "John Luis",
      avatar: "/worker2.jpg",
      message: "You: San po exact loc?",
      time: "23+ ago",
      isUnread: true,
      type: "application",
    },
  ];

  // Filter messages based on active tab
  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "invites")
      return matchesSearch && message.type === "invite";
    if (activeTab === "applications")
      return matchesSearch && message.type === "application";
    return matchesSearch;
  });

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Authentication check
  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-blue-50">
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

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header with Search */}
      <div className="bg-white px-4 pt-4 pb-3">
        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="cleaner, seamstress, plumber, etc"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("invites")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "invites"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            📨 Invites
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "applications"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            📋 Applications
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          {filteredMessages.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Image
                        src={message.avatar}
                        alt={message.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {message.isUnread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-sm font-medium truncate ${
                            message.isUnread ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {message.name}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {message.time}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          message.isUnread
                            ? "text-gray-700 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {message.message}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {message.isUnread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No messages found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try adjusting your search terms</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};

export default InboxPage;

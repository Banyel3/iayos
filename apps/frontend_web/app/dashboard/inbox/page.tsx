"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/ui/mobile-nav";
import DesktopNavbar from "@/components/ui/desktop-sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useWorkerAvailability } from "@/lib/hooks/useWorkerAvailability";

// Extended User interface for inbox page
interface InboxUser extends User {
  profile_data?: {
    firstName?: string;
    lastName?: string;
    profileType?: "WORKER" | "CLIENT" | null;
  };
}

interface Message {
  id: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  isUnread: boolean;
  type: "invite" | "application" | "general";
}

interface ChatMessage {
  id: string;
  sender: "me" | "other";
  message: string;
  time: string;
}

const InboxPage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as InboxUser;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "all" | "invites" | "applications"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<Message | null>(null);

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
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

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

  // Mock chat messages for selected conversation
  const mockChatMessages: ChatMessage[] = selectedChat
    ? [
        {
          id: "1",
          sender: "other",
          message: "Hi livro, San po",
          time: "10:00 AM",
        },
        {
          id: "2",
          sender: "me",
          message: "Hi! maam, avail po ako to repair",
          time: "10:01 AM",
        },
        {
          id: "3",
          sender: "other",
          message:
            "Tnx sir, pasilbi na lang po location at number ng boss na magpagawa ng aircon",
          time: "10:05 AM",
        },
        {
          id: "4",
          sender: "me",
          message: "Sige po maam, punta na po ako",
          time: "10:06 AM",
        },
      ]
    : [];

  // Filter messages based on active tab and search query
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

  return (
    <div className="min-h-screen bg-white">
      {/* Notification Bell - Mobile Only */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      {/* Desktop Navbar - Sticky */}
      <DesktopNavbar
        isWorker={user?.profile_data?.profileType === "WORKER"}
        userName={user?.profile_data?.firstName || "User"}
        userAvatar="/worker1.jpg"
        onLogout={logout}
        isAvailable={isAvailable}
        isLoadingAvailability={isLoadingAvailability}
        onAvailabilityToggle={handleAvailabilityToggle}
      />

      {/* Desktop Layout */}
      <div className="hidden lg:flex" style={{ height: "calc(100vh - 64px)" }}>
        {/* Left Sidebar - Chat List */}
        <div className="w-96 border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Chats</h1>

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
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("invites")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "invites"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Invites
              </button>
              <button
                onClick={() => setActiveTab("applications")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "applications"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Applications
              </button>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length > 0 ? (
              <div>
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedChat(message)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedChat?.id === message.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
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

                      {/* Message Preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3
                            className={`text-sm font-medium truncate ${
                              message.isUnread
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {message.name}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No messages found</p>
                {searchQuery && (
                  <p className="text-xs mt-1">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat View */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
            {/* Left - Back button */}
            <button
              onClick={() => router.push("/dashboard/home")}
              className="text-gray-600 hover:text-gray-900"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>

            {/* Center - Selected user info (if chat is open) */}
            {selectedChat && (
              <div className="flex items-center space-x-3 flex-1 justify-center">
                <Image
                  src={selectedChat.avatar}
                  alt={selectedChat.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {selectedChat.name}
                  </h2>
                  <p className="text-xs text-green-500 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Verified
                  </p>
                </div>
              </div>
            )}

            {/* Right - Empty space for balance */}
            <div className="w-8"></div>
          </div>

          {/* Chat Content Area */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col relative">
              {/* Request Info Banner */}
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex-shrink-0 relative z-10">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">
                    Your request is Pending
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Ceiling Fan Repair for ₱280
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Payment via GCash
                  </p>
                  <button className="bg-blue-500 text-white px-6 py-2 rounded-full text-xs font-medium hover:bg-blue-600 transition-colors">
                    Waiting for Approval from Client
                  </button>
                  <button className="text-blue-500 text-xs font-medium mt-2 hover:underline block mx-auto">
                    View Details →
                  </button>
                </div>
              </div>

              {/* Messages - Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-4 bg-gray-50">
                {mockChatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender === "other" && (
                      <Image
                        src={selectedChat.avatar}
                        alt={selectedChat.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                      />
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                        msg.sender === "me"
                          ? "bg-green-500 text-white"
                          : "bg-white text-gray-900"
                      } rounded-2xl px-4 py-2 shadow-sm`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}

                {/* Jane accepted message */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 italic">
                    Jane accepted your application.
                  </p>
                </div>

                {/* Address Card */}
                <div className="flex justify-start">
                  <div className="bg-green-500 text-white rounded-2xl px-4 py-3 shadow-sm max-w-xs">
                    <p className="text-sm font-semibold mb-1">
                      #145, Jalon Street, Sta. Maria
                    </p>
                    <p className="text-xs">(near Jollibee, blue gate)</p>
                    <button className="mt-2 bg-white text-green-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      09123456789
                    </button>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-green-500 text-white rounded-2xl px-4 py-2 shadow-sm">
                    <p className="text-sm">Pwede kaya po kayo here na po</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-gray-200 text-gray-700 rounded-2xl px-4 py-2 shadow-sm">
                    <p className="text-sm">Sige po maam, punta na po ako</p>
                  </div>
                </div>
              </div>

              {/* Message Input - Sticky at Bottom */}
              <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white z-10">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a chat to start messaging
                </h3>
                <p className="text-sm text-gray-600">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout - Keep existing mobile view */}
      <div className="lg:hidden pb-20">
        <div className="bg-white px-4 pt-4 pb-3">
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

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`text-sm font-medium truncate ${
                              message.isUnread
                                ? "text-gray-900"
                                : "text-gray-700"
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
                  <p className="text-xs mt-1">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <MobileNav />
      </div>
    </div>
  );
};

export default InboxPage;

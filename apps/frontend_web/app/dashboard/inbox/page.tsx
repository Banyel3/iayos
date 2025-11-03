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
    profileImg?: string;
  };
}

// API Response interfaces matching backend
interface JobInfo {
  id: number;
  title: string;
  status: string;
  budget: number;
  location: string;
}

interface OtherParticipant {
  profile_id: number;
  name: string;
  avatar: string | null;
  profile_type: string;
  city: string | null;
}

interface Conversation {
  id: number;
  job: JobInfo;
  other_participant: OtherParticipant;
  my_role: "CLIENT" | "WORKER";
  last_message: string | null;
  last_message_time: string | null;
  last_message_sender_id: number | null;
  unread_count: number;
  status: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  message_text: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
}

const InboxPage = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const user = authUser as InboxUser;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "all" | "invites" | "applications"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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

  // TODO: Fetch conversations from API
  useEffect(() => {
    if (isAuthenticated) {
      // fetchConversations();
    }
  }, [isAuthenticated]);

  // TODO: Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      // fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

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

  // Filter conversations based on active tab and search query
  const filteredMessages = conversations.filter((conv) => {
    const matchesSearch =
      conv.other_participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.last_message && conv.last_message.toLowerCase().includes(searchQuery.toLowerCase()));

    // TODO: Filter by type (invites/applications) when that data is available
    // For now, show all that match search
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
        userAvatar={user?.profile_data?.profileImg || "/worker1.jpg"}
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
            {isLoadingConversations ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div>
                {filteredMessages.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedChat(conv)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedChat?.id === conv.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Image
                          src={conv.other_participant.avatar || "/worker1.jpg"}
                          alt={conv.other_participant.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Message Preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3
                            className={`text-sm font-medium truncate ${
                              conv.unread_count > 0
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {conv.other_participant.name}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1 truncate">
                          {conv.job.title}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            conv.unread_count > 0
                              ? "text-gray-700 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {conv.last_message || "No messages yet"}
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
                  src={selectedChat.other_participant.avatar || "/worker1.jpg"}
                  alt={selectedChat.other_participant.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {selectedChat.other_participant.name}
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
              {/* Job/Request Info Banner - Dynamic based on conversation job */}
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex-shrink-0 relative z-10">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">
                    Job Status: {selectedChat.job.status}
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {selectedChat.job.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Budget: ₱{selectedChat.job.budget.toFixed(2)} • {selectedChat.job.location}
                  </p>
                  <div className="flex justify-center items-center space-x-2">
                    <span className={`px-4 py-2 rounded-full text-xs font-medium ${
                      selectedChat.job.status === 'IN_PROGRESS' 
                        ? 'bg-blue-100 text-blue-700'
                        : selectedChat.job.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedChat.my_role === "CLIENT" ? "Your Request" : "Your Job"}
                    </span>
                  </div>
                  <button 
                    onClick={() => router.push(`/jobs/${selectedChat.job.id}`)}
                    className="text-blue-500 text-xs font-medium mt-2 hover:underline block mx-auto"
                  >
                    View Job Details →
                  </button>
                </div>
              </div>

              {/* Messages - Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-4 bg-gray-50">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : chatMessages.length > 0 ? (
                  <>
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.is_mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!msg.is_mine && (
                          <Image
                            src={selectedChat.other_participant.avatar || "/worker1.jpg"}
                            alt={selectedChat.other_participant.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                          />
                        )}
                        <div
                          className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                            msg.is_mine
                              ? "bg-green-500 text-white"
                              : "bg-white text-gray-900"
                          } rounded-2xl px-4 py-2 shadow-sm`}
                        >
                          <p className="text-sm">{msg.message_text}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                  </div>
                )}
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
            {isLoadingConversations ? (
              <div className="flex justify-center items-center p-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/dashboard/inbox/${conv.id}`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          src={conv.other_participant.avatar || "/worker1.jpg"}
                          alt={conv.other_participant.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`text-sm font-medium truncate ${
                              conv.unread_count > 0
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {conv.other_participant.name}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1 truncate">
                          {conv.job.title}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            conv.unread_count > 0
                              ? "text-gray-700 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>

                      {conv.unread_count > 0 && (
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

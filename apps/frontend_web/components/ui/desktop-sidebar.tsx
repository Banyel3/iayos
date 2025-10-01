"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface DesktopNavbarProps {
  isWorker?: boolean;
  userName?: string;
  userAvatar?: string;
  onLogout?: () => void;
}

export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  isWorker = true,
  userName = "User",
  userAvatar = "/worker1.jpg",
  onLogout,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const navigationItems = [
    {
      label: "Home",
      href: "/dashboard/home",
    },
    {
      label: isWorker ? "My Jobs" : "My Requests",
      href: "/dashboard/myRequests",
    },
    {
      label: "Inbox",
      href: "/dashboard/inbox",
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
    },
  ];

  // Add agency link only for workers
  if (isWorker) {
    navigationItems.splice(3, 0, {
      label: "Agency",
      href: "/dashboard/agency",
    });
  }

  return (
    <nav className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard/home">
            <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
              iAyos
            </h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu with Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Image
                src={userAvatar}
                alt="Profile"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span>{userName}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    router.push("/dashboard/profile");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    router.push("/dashboard/home");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </button>
                <hr className="my-1 border-gray-200" />
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Log Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNavbar;

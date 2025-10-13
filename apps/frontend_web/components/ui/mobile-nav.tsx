"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LocationToggle from "@/components/ui/location-toggle";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  activeIcon: string;
}

interface MobileNavProps {
  isWorker?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Home",
    href: "/dashboard/home",
    icon: "/icons/home-icon.png",
    activeIcon: "/icons/home-icon-active.png",
  },
  {
    name: "My Requests",
    href: "/dashboard/myRequests",
    icon: "/icons/requests-icon.png",
    activeIcon: "/icons/requests-icon-active.png",
  },
  {
    name: "Inbox",
    href: "/dashboard/inbox",
    icon: "/icons/message-icon.png",
    activeIcon: "/icons/message-icon-active.png",
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: "/icons/profile-icon.png",
    activeIcon: "/icons/profile-icon-active.png",
  },
];

export default function MobileNav({ isWorker = false }: MobileNavProps) {
  const pathname = usePathname();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex items-center justify-around px-4 py-0">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1"
              >
                <div
                  className={`w-8 h-8 mb-1 flex items-center justify-center rounded-full transition-colors duration-200 ${
                    active ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Image
                    src={active ? item.activeIcon : item.icon}
                    alt={item.name}
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <span
                  className={`text-[8px] font-medium transition-colors duration-200 ${
                    active ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Location Toggle Button */}
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 relative"
          >
            <div
              className={`w-8 h-8 mb-1 flex items-center justify-center rounded-full transition-colors duration-200 ${
                showLocationDropdown ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              <svg
                className={`w-4 h-4 ${showLocationDropdown ? "text-blue-600" : "text-gray-600"}`}
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
            </div>
            <span
              className={`text-[8px] font-medium transition-colors duration-200 ${
                showLocationDropdown ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Location
            </span>
          </button>
        </div>
      </nav>

      {/* Location Slide-up Panel */}
      {showLocationDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-[55] md:hidden"
            onClick={() => setShowLocationDropdown(false)}
          />

          {/* Slide-up Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[60] md:hidden animate-slide-up pb-20">
            <div className="p-4">
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

              <LocationToggle
                isWorker={isWorker}
                onLocationUpdate={(lat, lon) => {
                  console.log(`📍 Mobile - Location updated: ${lat}, ${lon}`);
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

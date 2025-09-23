"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  activeIcon: string;
}

const navItems: NavItem[] = [
  {
    name: "Home",
    href: "/dashboard/home",
    icon: "/icons/home-icon.png",
    activeIcon: "/icons/home-icon-active.png",
  },
  {
    name: "Search",
    href: "/dashboard/search",
    icon: "/icons/search-icon.png",
    activeIcon: "/icons/search-icon-active.png",
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

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
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
      </div>
    </nav>
  );
}

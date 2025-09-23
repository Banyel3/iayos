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
    href: "/",
    icon: "/icons/home-icon.png",
    activeIcon: "/icons/home-icon-active.png",
  },
  {
    name: "Search",
    href: "/search",
    icon: "/icons/search-icon.png",
    activeIcon: "/icons/search-icon-active.png",
  },
  {
    name: "Inbox",
    href: "/inbox",
    icon: "/icons/message-icon.png",
    activeIcon: "/icons/message-icon-active.png",
  },
  {
    name: "Profile",
    href: "/profile",
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
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1"
            >
              <div className="w-6 h-6 mb-1 flex items-center justify-center">
                <Image
                  src={active ? item.activeIcon : item.icon}
                  alt={item.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
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

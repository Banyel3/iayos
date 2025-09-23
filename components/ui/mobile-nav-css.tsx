"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./mobile-nav.css";

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

export default function MobileNavWithCSS() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-container">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link key={item.name} href={item.href} className="mobile-nav-item">
              <Image
                src={active ? item.activeIcon : item.icon}
                alt={item.name}
                width={24}
                height={24}
                className="mobile-nav-icon"
              />
              <span
                className={`mobile-nav-label ${active ? "active" : "inactive"}`}
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

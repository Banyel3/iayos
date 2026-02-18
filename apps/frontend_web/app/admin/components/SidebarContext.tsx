"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);

  // Listen for viewport changes
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileOpen(false); // close drawer when resizing to desktop
    };
    onChange(mql); // set initial value
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, toggleCollapsed, mobileOpen, setMobileOpen, toggleMobile, isMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    // Return default values if used outside provider (for backwards compatibility)
    return {
      collapsed: false, setCollapsed: () => {}, toggleCollapsed: () => {},
      mobileOpen: false, setMobileOpen: () => {}, toggleMobile: () => {},
      isMobile: false,
    };
  }
  return context;
}

// Helper to get responsive main content class
export function useMainContentClass(additionalClasses?: string) {
  const { collapsed } = useSidebar();
  const baseClasses = "transition-all duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";
  // On mobile (< md): no left padding (sidebar is overlay drawer)
  // On desktop (>= md): left padding to clear fixed sidebar
  const paddingClass = collapsed ? "pl-0 md:pl-24" : "pl-0 md:pl-72";
  // Add top padding on mobile for the mobile top bar
  const mobilePadding = "pt-14 md:pt-0";
  return `${baseClasses} ${paddingClass} ${mobilePadding} ${additionalClasses || ""}`.trim();
}

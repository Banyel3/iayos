"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    // Return default values if used outside provider (for backwards compatibility)
    return { collapsed: false, setCollapsed: () => {}, toggleCollapsed: () => {} };
  }
  return context;
}

// Helper to get responsive main content class
export function useMainContentClass(additionalClasses?: string) {
  const { collapsed } = useSidebar();
  const baseClasses = "transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";
  const paddingClass = collapsed ? "pl-24" : "pl-72";
  return `${baseClasses} ${paddingClass} ${additionalClasses || ""}`.trim();
}

"use client";

import { useMainContentClass } from "./SidebarContext";

interface AdminMainContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function AdminMainContent({ children, className }: AdminMainContentProps) {
  const mainClass = useMainContentClass(className || "p-6 min-h-screen");
  
  return (
    <main className={mainClass}>
      {children}
    </main>
  );
}

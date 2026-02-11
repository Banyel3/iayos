"use client";

import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

interface AdminMainContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function AdminMainContent({ children, className }: AdminMainContentProps) {
  const { collapsed } = useSidebar();
  
  return (
    <main 
      className={cn(
        "p-6 min-h-screen transition-all duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        collapsed ? "pl-24" : "pl-72",
        className
      )}
    >
      {children}
    </main>
  );
}

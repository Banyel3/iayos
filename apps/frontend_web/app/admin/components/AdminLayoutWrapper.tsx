"use client";

import { SidebarProvider } from "./SidebarContext";

interface AdminLayoutWrapperProps {
    children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
    return (
        <SidebarProvider>
            {children}
        </SidebarProvider>
    );
}

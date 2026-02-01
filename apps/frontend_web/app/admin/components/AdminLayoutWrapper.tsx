"use client";

import { Sidebar } from "./index";

interface AdminLayoutWrapperProps {
    children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <main className="pl-72 p-6 min-h-screen">
                {children}
            </main>
        </div>
    );
}

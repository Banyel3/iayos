"use client";

import { Sidebar } from "../components";

export default function AdminDashboardPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview and quick stats (placeholders)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border rounded bg-sky-100 border-blue-400">
            Total Users: --
          </div>
          <div className="p-4 border rounded bg-sky-100 border-blue-400">
            Active Sessions: --
          </div>
          <div className="p-4 border rounded bg-sky-100 border-blue-400">
            Revenue: --
          </div>
        </div>
      </main>
    </div>
  );
}

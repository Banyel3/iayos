import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Dashboard Layout with Role-Based Access Control
 *
 * This layout enforces that only authorized users can access the dashboard:
 * - ADMIN users: Redirected to /admin/dashboard
 * - AGENCY users: Redirected to /agency/dashboard
 * - WORKER users: Redirected to /mobile-only (web access disabled)
 * - CLIENT users: Redirected to /mobile-only (web access disabled)
 *
 * Feature flags can be toggled to enable web access for workers/clients.
 */

// Feature flags - match the middleware settings
const ENABLE_WORKER_WEB_UI = true; // Set to true to allow workers on web
const ENABLE_CLIENT_WEB_UI = true; // Set to true to allow clients on web

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Use internal Docker network for server-side requests
  const serverApiUrl = process.env.SERVER_API_URL || "http://backend:8000";

  try {
    // Validate session with backend
    const res = await fetch(`${serverApiUrl}/api/accounts/me`, {
      headers: {
        cookie: cookieHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // No valid session → redirect to login
      redirect("/auth/login");
    }

    const user = await res.json();

    const accountType = (user?.accountType || "").toLowerCase();
    const role = (user?.role || "").toUpperCase();
    const profileType = (user?.profile_data?.profileType || "").toUpperCase();

    console.log(
      `[DASHBOARD LAYOUT] User: ${user?.email}, accountType=${accountType}, role=${role}, profileType=${profileType}`
    );

    // Admin users should use admin dashboard
    if (role === "ADMIN") {
      console.log("[DASHBOARD LAYOUT] Redirecting ADMIN to /admin/dashboard");
      redirect("/admin/dashboard");
    }

    // Agency users should use agency dashboard
    if (accountType === "agency" || role === "AGENCY") {
      console.log("[DASHBOARD LAYOUT] Redirecting AGENCY to /agency/dashboard");
      redirect("/agency/dashboard");
    }

    // Worker web access check
    if (profileType === "WORKER" && !ENABLE_WORKER_WEB_UI) {
      console.log(
        "[DASHBOARD LAYOUT] Blocking WORKER - redirecting to /mobile-only"
      );
      redirect("/mobile-only");
    }

    // Client web access check
    if (profileType === "CLIENT" && !ENABLE_CLIENT_WEB_UI) {
      console.log(
        "[DASHBOARD LAYOUT] Blocking CLIENT - redirecting to /mobile-only"
      );
      redirect("/mobile-only");
    }

    // User is allowed to access dashboard
    console.log("[DASHBOARD LAYOUT] Access granted");
  } catch (err) {
    console.error("[DASHBOARD LAYOUT] Error:", err);
    // On any error, redirect to login
    redirect("/auth/login");
  }

  return <div className="dashboard-layout">{children}</div>;
}

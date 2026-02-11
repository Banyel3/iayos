import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Dashboard Layout with Role-Based Access Control
 *
 * This layout enforces that only authorized users can access the dashboard:
 * - ADMIN users: Redirected to /admin/dashboard
 * - AGENCY users: Redirected to /agency/dashboard
 * - WORKER users: Redirected to /mobile-only (web access permanently disabled)
 * - CLIENT users: Redirected to /mobile-only (web access permanently disabled)
 *
 * Workers and clients must use the mobile app exclusively.
 */

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

  // Helper to ensure URL has protocol
  const ensureProtocol = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  // Use SERVER_API_URL for server-side requests
  // In Docker: http://backend:8000
  // On Vercel: https://api.iayos.online (shared domain with frontend for cookies)
  const serverApiUrl =
    ensureProtocol(process.env.SERVER_API_URL) ||
    ensureProtocol(process.env.NEXT_PUBLIC_API_URL) ||
    "https://api.iayos.online";

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
      `[DASHBOARD LAYOUT] User: ${user?.email}, accountType=${accountType}, role=${role}, profileType=${profileType}`,
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

    // Workers and clients are permanently redirected to mobile-only
    if (profileType === "WORKER" || profileType === "CLIENT") {
      console.log(
        `[DASHBOARD LAYOUT] Redirecting ${profileType} to /mobile-only - web access disabled`,
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

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLayoutWrapper } from "./components";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read all cookies from the incoming request
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
  // In Docker: http://backend:8000, On Vercel: https://api.iayos.online
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const serverApiUrl =
    ensureProtocol(process.env.SERVER_API_URL) ||
    ensureProtocol(process.env.NEXT_PUBLIC_API_URL) ||
    (isProduction ? "https://api.iayos.online" : "http://localhost:8000");

  // Server-side validate session with backend to avoid client-only cookie checks
  try {
    const res = await fetch(`${serverApiUrl}/api/accounts/me`, {
      headers: {
        cookie: cookieHeader,
        Accept: "application/json",
      },
      // Don't cache auth checks
      cache: "no-store",
    });

    if (!res.ok) {
      // No valid session → redirect to login
      redirect("/auth/login");
    }

    const user = await res.json();

    // If user exists but is not an admin, redirect to regular dashboard
    if (user?.role !== "ADMIN") {
      redirect("/dashboard");
    }
  } catch (err) {
    // On any error, redirect to login
    redirect("/auth/login");
  }

  return <div className="admin-theme"><AdminLayoutWrapper>{children}</AdminLayoutWrapper></div>;
}

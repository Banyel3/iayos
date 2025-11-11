import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

  // Use internal Docker network for server-side requests
  const serverApiUrl = process.env.SERVER_API_URL || "http://backend:8000";

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

  return <div className="admin-theme">{children}</div>;
}

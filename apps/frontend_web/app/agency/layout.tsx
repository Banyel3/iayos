import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// Import client sidebar dynamically
import AgencySidebar from "./components/sidebar";
import KycGateClient from "./components/KycGateClient";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read cookies and forward them to backend for server-side auth
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  let user: any = null;

  try {
    const res = await fetch("http://localhost:8000/api/accounts/me", {
      headers: {
        cookie: cookieHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // Not authenticated
      redirect("/auth/login");
    }

    user = await res.json();

    // Prefer backend accountType if present (set by backend to 'agency' or 'individual')
    const accountType = (user?.accountType || "").toString().toLowerCase();
    if (accountType === "agency") {
      // allowed
    } else {
      // Fallback to the legacy role field for compatibility
      const role = (user?.role || "").toString().toUpperCase();
      if (role !== "AGENCY") {
        // Non-agency users go to regular dashboard
        redirect("/dashboard/profile");
      }
    }
  } catch (err) {
    redirect("/auth/login");
  }
  // If user exists but hasn't completed KYC, show a verification wall
  const kycVerified = !!user?.kycVerified;

  // Server-side: fetch agency KYC status to know if there's already a submission
  let hasSubmission = false;
  let submissionStatus = null;
  let submissionNotes: string | null = null;
  let submissionFiles: any[] | null = null;
  try {
    const statusRes = await fetch("http://localhost:8000/api/agency/status", {
      headers: {
        cookie: cookieHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (statusRes.ok) {
      const statusJson = await statusRes.json();
      submissionStatus = statusJson?.status || statusJson?.kycStatus || null;
      submissionNotes = statusJson?.notes || null;
      submissionFiles = statusJson?.files || null;
      if (submissionStatus && submissionStatus !== "NOT_STARTED")
        hasSubmission = true;
    }
  } catch (e) {
    // ignore: if status fetch fails we'll fall back to default gate behavior
    console.error("Failed to fetch agency kyc status in layout", e);
  }

  return (
    <div
      className={`agency-theme min-h-screen flex bg-gray-50 ${
        kycVerified ? "agency-verified" : ""
      }`}
    >
      <div>
        <AgencySidebar />
      </div>
      <main className="flex-1 p-6">
        <KycGateClient
          kycVerified={kycVerified}
          hasSubmission={hasSubmission}
          submissionStatus={submissionStatus}
          submissionNotes={submissionNotes}
        >
          {children}
        </KycGateClient>
      </main>
    </div>
  );
}

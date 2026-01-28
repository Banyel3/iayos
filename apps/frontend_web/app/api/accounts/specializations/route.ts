import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Helper to ensure URL has protocol
const ensureProtocol = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

const API_BASE_URL =
  ensureProtocol(process.env.SERVER_API_URL) ||
  ensureProtocol(process.env.NEXT_PUBLIC_API_BASE) ||
  "https://api.iayos.online";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (sessionCookie) {
      headers["Cookie"] = `session=${sessionCookie.value}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/accounts/specializations`,
      {
        method: "GET",
        headers,
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch specializations" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying specializations request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

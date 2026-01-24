// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";

// Allow both public and server-only API base envs; default to local backend
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie") || "";
    const accessCookie = request.cookies.get("access")?.value;

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    // Forward Authorization header from the client if present
    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else if (accessCookie) {
      // Fallback: promote httpOnly access cookie to Bearer for backend dual_auth
      headers["Authorization"] = `Bearer ${accessCookie}`;
    }

    // Forward cookies for cookie-based auth
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const backendResponse = await fetch(`${API_BASE_URL}/api/accounts/me`, {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      const message = errorBody || "Unauthorized";
      return NextResponse.json({ error: message }, { status: backendResponse.status });
    }

    const userData = await backendResponse.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("/api/auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

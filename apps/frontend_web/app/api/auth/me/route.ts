// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/api/config";

export async function GET(request: NextRequest) {
  try {
    // Get all cookies from Next.js request and build Cookie header
    const cookies = request.cookies.getAll();
    const cookieHeader = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    // Forward cookies for cookie-based auth (dual_auth will handle it)
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    console.log(
      `[/api/auth/me] Forwarding ${cookies.length} cookies to backend`,
    );

    const backendResponse = await fetch(`${API_BASE}/api/accounts/me`, {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      const message = errorBody || "Unauthorized";
      return NextResponse.json(
        { error: message },
        { status: backendResponse.status },
      );
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

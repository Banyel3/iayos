// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the Authorization header or cookie
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie") || "";
    
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    
    // Forward Authorization header if present (JWT Bearer token)
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    // Also forward cookies for cookie-based auth
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }
    
    const backendResponse = await fetch(
      `${API_BASE_URL}/api/accounts/me`,
      { headers }
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: backendResponse.status }
      );
    }

    const userData = await backendResponse.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("/api/auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

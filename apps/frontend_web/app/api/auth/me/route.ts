// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetch(
      "http://localhost:8000/api/accounts/me",
      {
        headers: {
          Cookie: request.headers.get("cookie") || "", // Forward cookies
          Accept: "application/json",
        },
      }
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

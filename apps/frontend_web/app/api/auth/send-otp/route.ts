import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/api/config";
import { getErrorMessage } from "@/lib/utils/parse-api-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp_code, expires_in_minutes } = body;

    // Validate required fields
    if (!email || !otp_code) {
      return NextResponse.json(
        { error: "Email and OTP code are required" },
        { status: 400 },
      );
    }

    // Proxy the request to the backend's send-otp-email endpoint
    const response = await fetch(`${API_BASE}/api/mobile/auth/send-otp-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        otp_code,
        expires_in_minutes: expires_in_minutes || 5,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend send-otp-email error:", data);
      return NextResponse.json(
        { error: getErrorMessage(data, "Failed to send OTP email") },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Send OTP email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

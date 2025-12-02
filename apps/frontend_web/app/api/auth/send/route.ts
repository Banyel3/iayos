import { NextResponse } from "next/server";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  verifyLink: z.string().url(),
  verifyLinkExpire: z.string(), // since Django sends ISO string
});

// Backend API URL - use SERVER_API_URL for server-side requests (Docker internal network)
// NEXT_PUBLIC_API_URL is for client-side and uses localhost, which doesn't work in Docker containers
const BACKEND_API_URL = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📧 Email request body:", body);

    const parsed = verifySchema.parse(body);

    console.log("📧 Proxying email request to backend for:", parsed.email);

    // Proxy the request to the backend's send-verification-email endpoint
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/mobile/auth/send-verification-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: parsed.email,
          verifyLink: parsed.verifyLink,
          verifyLinkExpire: parsed.verifyLinkExpire,
        }),
      }
    );

    const backendData = await backendResponse.json();
    console.log("📧 Backend response:", backendData);

    if (!backendResponse.ok) {
      console.error("📧 Backend email sending failed:", backendData);
      return NextResponse.json(
        {
          success: false,
          error: backendData.error || "Failed to send verification email",
          details: backendData.details,
        },
        { status: backendResponse.status }
      );
    }

    console.log("📧 Email sent successfully via backend:", backendData);
    return NextResponse.json({
      success: true,
      messageId: backendData.messageId,
      method: "backend-proxy",
    });
  } catch (error) {
    console.error("📧 Email sending failed:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Something went wrong", details: (error as Error).message },
      { status: 500 }
    );
  }
}

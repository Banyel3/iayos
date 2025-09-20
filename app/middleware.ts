// middleware.ts
import { NextResponse } from "next/server";

export function middleware(req: Request) {
  // Get client IP (supports Vercel/Reverse proxies)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous";

  // Clone request and attach IP
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-client-ip", ip);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Only run middleware on NextAuth routes
export const config = {
  matcher: ["/api/auth/[...nextauth]"],
};

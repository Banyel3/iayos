import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Role-Based Web Access Middleware
 *
 * This middleware enforces mobile-only access for WORKER and CLIENT profiles.
 * AGENCY and ADMIN accounts retain full web access.
 *
 * Routes protected:
 * - /dashboard/* - Worker and Client dashboard pages (REMOVED - mobile-only)
 *
 * Routes allowed for all authenticated users:
 * - /admin/* - Admin panel (server-side role check in admin/layout.tsx)
 * - /agency/* - Agency dashboard (server-side role check in agency/layout.tsx)
 * - /auth/* - Authentication pages
 * - /api/* - API routes
 * - Static assets
 */

// Routes that require mobile-only enforcement for workers/clients
const MOBILE_ONLY_ROUTES = ["/dashboard"];

// Routes that are always accessible (no role check needed at middleware level)
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/login",
  "/register",
  "/mobile-only",
  "/api",
  "/_next",
  "/favicon.ico",
];

// Routes with their own server-side role protection
const SELF_PROTECTED_ROUTES = [
  "/admin", // Protected in app/admin/layout.tsx
  "/agency", // Protected in app/agency/layout.tsx
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip middleware for self-protected routes (they handle their own auth)
  if (SELF_PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if this is a mobile-only route
  const isMobileOnlyRoute = MOBILE_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isMobileOnlyRoute) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const authCookie =
    request.cookies.get("access_token") || request.cookies.get("auth_token");

  if (!authCookie?.value) {
    // Not logged in - let the page handle redirect to login
    return NextResponse.next();
  }

  try {
    // Decode JWT payload (basic decode, not verification - server does full verification)
    const token = authCookie.value;
    const payloadBase64 = token.split(".")[1];

    if (!payloadBase64) {
      return NextResponse.next();
    }

    const payload = JSON.parse(atob(payloadBase64));

    // Extract user info from token
    const accountType = payload.account_type?.toLowerCase() || "";
    const role = payload.role?.toUpperCase() || "";
    const profileType = payload.profile_type?.toUpperCase() || "";

    // Admin and Agency users can access everything
    if (role === "ADMIN" || accountType === "agency") {
      return NextResponse.next();
    }

    // Workers and clients are permanently redirected to mobile-only
    if (profileType === "WORKER" || profileType === "CLIENT") {
      console.log(`[MIDDLEWARE] Redirecting ${profileType} to mobile-only from: ${pathname}`);
      return NextResponse.redirect(new URL("/mobile-only", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Token parsing failed - let the page handle it
    console.error("[MIDDLEWARE] Token parsing error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

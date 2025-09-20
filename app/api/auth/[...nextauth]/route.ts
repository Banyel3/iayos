/**
 * MAIN NEXTAUTH CONFIGURATION FILE
 *
 * This file handles ALL authentication for the iAyos application.
 * It supports TWO authentication methods:
 * 1. Google OAuth (social login)
 * 2. Email/Password (credentials)
 *
 * NextAuth automatically creates these routes:
 * - /api/auth/signin - Sign in page
 * - /api/auth/signout - Sign out
 * - /api/auth/callback/google - Google OAuth callback
 * - /api/auth/callback/credentials - Credentials callback
 * - /api/auth/session - Get current session
 *
 * HOW IT WORKS:
 * - User clicks "Sign in with Google" → Google OAuth flow → signIn callback runs
 * - User submits email/password → Credentials authorize function runs → signIn callback runs
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NEXTAUTH HANDLER EXPORT
 * This creates the actual NextAuth handler function using the shared auth configuration
 * It must be exported as both GET and POST to handle all HTTP methods
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

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

import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import { Prisma } from "@/lib/generated/prisma/wasm";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

// Environment variables for Google OAuth
// These must be set in your .env.local file
const GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_ID!;
const GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_SECRET!;

/**
 * Type definition for Google user profile data
 * This matches what Google returns during OAuth
 */
interface GoogleProfile {
  sub: string; // Google user ID
  name: string; // Full name
  given_name: string; // First name
  family_name: string; // Last name
  email: string; // Email address
  picture: string; // Profile picture URL
}

/**
 * NEXTAUTH CONFIGURATION OPTIONS
 * This object configures how authentication works in your app
 */
export const authOptions: NextAuthOptions = {
  // 🔒 SECURITY: Secret key for signing JWT tokens (REQUIRED FOR PRODUCTION)
  secret: process.env.NEXTAUTH_SECRET,
  
  // Use JWT tokens instead of database sessions for better performance
  session: {
    strategy: "jwt",
  },

  // Authentication providers - these are the ways users can sign in
  providers: [
    /**
     * GOOGLE OAUTH PROVIDER
     * Allows users to sign in with their Google account
     * Required: Google OAuth app with client ID and secret
     */
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),

    /**
     * CREDENTIALS PROVIDER
     * Allows users to sign in with email and password
     * This runs the authorize function to validate credentials
     */
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      /**
       * CREDENTIAL VALIDATION FUNCTION
       * This function runs when user submits email/password
       * It checks if the user exists and password is correct
       */
      authorize: async (credentials) => {
        // Get the password from form submission
        const inputPassword = credentials!.password;

        // Look up user in database by email, include their profile data
        const user = await prisma.accounts.findUnique({
          where: { email: credentials?.email },
          include: { profile: true },
        });

        // If no user found with this email, reject login
        if (!user) throw new Error("User not found");

        // If user has no password (Google-only account), reject credential login
        if (!user.password)
          throw new Error(
            "This Account uses google login. Please sign in with google"
          );

        // Compare submitted password with stored hashed password
        const isValid = await bcrypt.compare(inputPassword, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        } else {
          // Return user data if password is valid
          // This data becomes available in session
          return {
            id: user.accountID.toString(),
            email: user.email,
            // 🔧 FIX: Safely access first profile in array
            name: user.profile?.[0]?.firstName || "User",
          };
        }
      },
    }),
  ],

  // Custom sign-in page instead of NextAuth default
  pages: {
    signIn: "/auth/login",
  },

  // Callback functions - these run at specific points in auth flow
  callbacks: {
    /**
     * REDIRECT CALLBACK
     * Determines where to send user after sign in
     * Always sends to dashboard regardless of login method
     */
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/dashboard`;
    },

    /**
     * SIGN-IN CALLBACK
     * Runs after successful authentication but before session creation
     * This is where we handle Google user creation/updates
     */
    async signIn({ account, profile }) {
      /**
       * GOOGLE OAUTH USER HANDLING
       * Only runs when user signs in with Google
       * Creates or updates user account and profile in database
       */
      if (account?.provider === "google") {
        const googleProfile = profile as GoogleProfile;

        // Ensure Google provided an email address
        if (!profile?.email) {
          throw new Error("No email found from Google Account");
        }

        /**
         * CREATE OR UPDATE ACCOUNT RECORD
         * upsert = update if exists, create if doesn't exist
         * For Google users: no password, already verified, active status
         */
        const accountRecord = await prisma.accounts.upsert({
          where: { email: profile.email },
          create: {
            email: profile.email,
            password: null, // Google users don't have passwords
            isVerified: true, // Google accounts are pre-verified
            status: "ACTIVE", // Set account as active
          } as Prisma.AccountsUncheckedCreateInput,
          update: {
            isVerified: true, // Ensure verification status
            status: "ACTIVE", // Ensure active status
          },
        });

        /**
         * CREATE OR UPDATE PROFILE RECORD
         * Store user's name, profile picture, etc. from Google
         */
        await prisma.profile.upsert({
          where: { accountID: accountRecord.accountID },
          create: {
            accountID: accountRecord.accountID,
            firstName: googleProfile.given_name, // From Google profile
            lastName: googleProfile.family_name, // From Google profile
            contactNum: "", // Empty, user can add later
            profileImg: googleProfile.picture, // Google profile picture URL
          } as Prisma.ProfileUncheckedCreateInput,
          update: {
            firstName: googleProfile.given_name, // Update name from Google
            lastName: googleProfile.family_name, // Update name from Google
            profileImg: googleProfile.picture, // Update profile picture
          },
        });
      }

      /**
       * For credentials provider, user validation already happened
       * in the authorize function above, so just return true
       */
      return true;
    },
  },
};

/**
 * NEXTAUTH HANDLER EXPORT
 * This creates the actual NextAuth handler function
 * It must be exported as both GET and POST to handle all HTTP methods
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

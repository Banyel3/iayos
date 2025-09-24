import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { rateLimiter } from "@/lib/rateLimiter";
import { RateLimiterRes } from "rate-limiter-flexible";
import { prisma } from "@/lib/prisma";

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_ID!;
const GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_SECRET!;

/**
 * Type definition for Google user profile data
 */
interface GoogleProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
}

/**
 * NEXTAUTH CONFIGURATION OPTIONS
 * Exported configuration that can be used by getServerSession
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, req) => {
        const inputPassword = credentials!.password;
        const ip =
          (
            req as {
              headers?: { ["x-client-ip"]?: string };
              body?: { ip?: string };
            }
          )?.headers?.["x-client-ip"] ||
          (
            req as {
              headers?: { ["x-client-ip"]?: string };
              body?: { ip?: string };
            }
          )?.body?.ip ||
          "anonymous";

        try {
          await rateLimiter.consume(ip);
        } catch (err) {
          const rateLimiterRes = err as RateLimiterRes;
          throw new Error(
            JSON.stringify({
              type: "rate-limit",
              msBeforeNext: rateLimiterRes.msBeforeNext,
            })
          );
        }

        const user = await prisma.accounts.findUnique({
          where: { email: credentials?.email },
          select: {
            email: true,
            accountID: true,
            password: true,
            isVerified: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profileType: true,
              },
            },
          },
        });

        const profiles = user?.profile ?? [];

        if (!user) throw new Error("User not found");
        if (!user.isVerified) {
          throw new Error(
            "Check email for verification Link and Verify Email first"
          );
        }
        if (!user.password)
          throw new Error(
            "This Account uses google login. Please sign in with google"
          );

        const isValid = await bcrypt.compare(inputPassword, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        } else {
          const clientProfile = profiles.find(
            (p) => p.profileType === "CLIENT"
          );
          const workerProfile = profiles.find(
            (p) => p.profileType === "WORKER"
          );

          return {
            id: user.accountID.toString(),
            email: user.email,
            name: user.profile?.[0]?.firstName || "User",
            profileType: clientProfile
              ? "CLIENT"
              : workerProfile
              ? "WORKER"
              : null,
          };
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.profileType =
          (user as { profileType?: string | null }).profileType || null;
      }

      // Refresh profileType from database when session is updated or for Google users
      if (
        trigger === "update" ||
        (account?.provider === "google" && !token.profileType)
      ) {
        try {
          const userWithProfile = await prisma.accounts.findUnique({
            where: { email: token.email as string },
            include: {
              profile: {
                select: {
                  profileType: true,
                },
              },
            },
          });

          // Get the latest profileType, prioritizing non-empty values
          const profiles = userWithProfile?.profile || [];
          const profileWithType = profiles.find(
            (p) => p.profileType && p.profileType !== ""
          );
          token.profileType =
            profileWithType?.profileType || profiles[0]?.profileType || null;

          console.log("Updated token profileType:", token.profileType);
        } catch (error) {
          console.error("Error fetching profileType:", error);
          token.profileType = null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.profileType = token.profileType as string | null;
      }
      return session;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        try {
          const googleProfile = profile as GoogleProfile;

          if (!profile?.email) {
            console.error(
              "Google sign-in error: No email found from Google Account"
            );
            return false; // Return false instead of throwing to prevent URL redirect
          }

          const accountRecord = await prisma.accounts.upsert({
            where: { email: profile.email },
            create: {
              email: profile.email,
              password: null,
              isVerified: true,
              status: "ACTIVE",
            },
            update: {
              isVerified: true,
              status: "ACTIVE",
            },
          });

          await prisma.profile.upsert({
            where: {
              accountID_profileType: {
                accountID: accountRecord.accountID,
                profileType: "",
              },
            },
            create: {
              accountID: accountRecord.accountID,
              firstName: googleProfile.given_name,
              lastName: googleProfile.family_name,
              contactNum: `google_${accountRecord.accountID}_${Date.now()}`, // Generate unique contactNum for Google users
              profileImg: googleProfile.picture,
              profileType: "",
              birthDate: new Date("1900-01-01"), // Default birthdate for Google OAuth users
            },
            update: {
              firstName: googleProfile.given_name,
              lastName: googleProfile.family_name || "",
              profileImg: googleProfile.picture,
            },
          });

          console.log("Google sign-in successful for:", profile.email);
          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          // Return false instead of throwing to prevent error URL redirect
          return false;
        }
      }

      return true;
    },
  },
};

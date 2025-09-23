import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { generateAgencyVerificationEmailHTML } from "@/components/auth/verification/agency_verification_email";
import { rateLimiter } from "@/lib/rateLimiter";
// Remove NextResponse import since we're using Response
// Zod schema
const registerSchema = z.object({
  businessName: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    // Test database connection first
    await prisma.$connect();

    const ip = req.headers.get("x-forwarded-for") || "anonymous";

    // ✅ Handle rate limiting separately
    try {
      await rateLimiter.consume(ip);
    } catch (rateLimiterRes: any) {
      // Get actual remaining time from rate limiter
      const remainingTime = Math.round(
        (rateLimiterRes?.msBeforeNext || 300000) / 1000
      );

      return new Response(
        JSON.stringify({
          error: "Too many requests. Try again later.",
          remainingTime: remainingTime,
          rateLimited: true,
        }),
        { status: 429 }
      );
    }
    const body = await req.json();
    // const token = body.turnstileToken;

    // const verify = await fetch(
    //   "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //     body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${token}`,
    //   }
    // ).then((res) => res.json());

    // if (!verify.success) {
    //   return new Response(JSON.stringify({ error: "Captcha failed" }), {
    //     status: 400,
    //   });
    // }
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input data" }), {
        status: 400,
      });
    }
    const { email, password, businessName } = parsed.data;

    // 🔧 FIX: Check if user already exists
    const existingUser = await prisma.accounts.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        { status: 409 }
      );
    }

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    const verifyToken = crypto.randomBytes(20).toString("hex");

    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");

    const verifyTokenExpire = new Date(Date.now() + 30 * 60 * 1000);

    // Create user and profile
    const registerUser = await prisma.accounts.create({
      data: {
        email: email,
        password: hashedPass,
        isVerified: false,
        status: "ACTIVE",
        verifyToken: hashedVerifyToken,
        verifyTokenExpire: verifyTokenExpire,
      },
    });

    await prisma.agency.create({
      data: {
        businessName: businessName,
        businessDesc: "",
        accountID: registerUser.accountID,
      },
    });

    // 🔧 FIX: Point to agency verification page instead of general verification
    const verifyLink = `${process.env.NEXTAUTH_URL}/auth/verify-email/agency?verifyToken=${verifyToken}&id=${registerUser.accountID}`;

    // Debug: Log the verification link
    console.log("Generated agency verification link:", verifyLink);
    console.log("verifyToken:", verifyToken);
    console.log("registerUser.accountID:", registerUser.accountID);
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

    const template = generateAgencyVerificationEmailHTML({
      verificationLink: verifyLink,
      businessName: businessName,
    });
    await sendEmail(
      registerUser?.email,
      "Agency Email Verification - iAyos",
      template
    );

    return new Response(
      JSON.stringify({ success: true, message: "Email Verification Sent" }),
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Registration error:", err);

    // Disconnect Prisma client
    await prisma.$disconnect();

    // 🔧 FIX: Better error handling for database constraints
    if ((err as { code?: string })?.code === "P2002") {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 409 }
      );
    }

    // Handle Prisma connection errors
    if ((err as { code?: string })?.code === "P1001") {
      console.error("Database connection failed");
      return new Response(
        JSON.stringify({
          error: "Database connection failed. Please try again later.",
        }),
        { status: 503 }
      );
    }

    // Handle other Prisma errors
    if ((err as Error)?.message?.includes("Invalid `prisma")) {
      console.error("Prisma configuration error:", (err as Error).message);
      return new Response(
        JSON.stringify({ error: "Database configuration error" }),
        { status: 500 }
      );
    }

    // Handle email sending errors
    if ((err as Error)?.message?.includes("send")) {
      console.error("Email sending failed:", (err as Error).message);
      return new Response(
        JSON.stringify({
          error:
            "Registration successful but email verification failed. Please try logging in.",
        }),
        { status: 207 } // 207 Multi-Status - partial success
      );
    }

    return new Response(JSON.stringify({ error: "Registration failed" }), {
      status: 500,
    });
  } finally {
    // Ensure Prisma client is disconnected
    await prisma.$disconnect();
  }
}

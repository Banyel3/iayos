import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "../send/route";
import { generateVerificationEmailHTML } from "@/components/auth/verification/verification_email";
import { redirect } from "next/navigation";
import { profile } from "console";
// Zod schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  contactNum: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 400,
      });
    }
    const { email, password, firstName, lastName, contactNum } = parsed.data;

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
        profile: {
          create: {
            firstName,
            lastName,
            contactNum: contactNum || "",
            profileType: body.profileTYpe,
          },
        },
      },
      include: { profile: true }, // return profile data too
    });

    // 🔧 FIX: Point to frontend verification page instead of API endpoint
    const verifyLink = `${process.env.NEXTAUTH_URL}/auth/verify-email?verifyToken=${verifyToken}&id=${registerUser.accountID}`;

    const template = generateVerificationEmailHTML({
      verificationLink: verifyLink,
    });
    await sendEmail(registerUser?.email, "Email Verification", template);
    return new Response(JSON.stringify(registerUser), { status: 201 });
  } catch (err: any) {
    console.error("Registration error:", err);

    // 🔧 FIX: Better error handling for database constraints
    if (err?.code === "P2002") {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 409 }
      );
    }

    return new Response(JSON.stringify({ error: "Registration failed" }), {
      status: 500,
    });
  }
}

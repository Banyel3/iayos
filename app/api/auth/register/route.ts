import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

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

    // Create user and profile
    const registerUser = await prisma.accounts.create({
      data: {
        email: email,
        password: hashedPass,
        isVerified: false,
        status: "ACTIVE",
        profile: {
          create: {
            firstName,
            lastName,
            contactNum: contactNum || "",
          },
        },
      },
      include: { profile: true }, // return profile data too
    });

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

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { generatePasswordResetEmailHTML } from "@/components/auth/verification/verification_email";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json();

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error }), {
      status: 400,
    });
  }
  const { email } = parsed.data;
  const verifyToken = crypto.randomBytes(20).toString("hex");

  const hashedVerifyToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  const verifyTokenExpire = new Date(Date.now() + 30 * 60 * 1000);

  try {
    const userDetails = await prisma.accounts.findFirst({
      where: { email },
      select: {
        accountID: true,
      },
    });

    if (!userDetails) {
      throw new Error("No Account Found");
    }
    const forgottenUser = await prisma.accounts.update({
      where: { accountID: userDetails.accountID },
      data: {
        verifyToken: hashedVerifyToken,
        verifyTokenExpire: verifyTokenExpire,
      },
    });
    const verifyLink = `${process.env.NEXTAUTH_URL}/auth/forgot-password/verified?verifyToken=${verifyToken}&id=${userDetails.accountID}`;
    const template = generatePasswordResetEmailHTML({
      resetLink: verifyLink,
    });
    await sendEmail(email, "Forgot Password Verification", template);
    return new Response(JSON.stringify("Verification Link Sent"), {
      status: 201,
    });
  } catch (err: unknown) {
    console.error("Registration error:", err);
    return new Response(
      JSON.stringify({ error: "Verification Link Not Sent" }),
      {
        status: 500,
      }
    );
  }
}

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const resetPasswordSchema = z.object({
  accountID: z.number().int(),
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
});
export async function POST(req: Request) {
  const body = await req.json();

  const { accountID, oldPassword } =
    resetPasswordSchema.parse(body); // ✅ safe + validated

  const confirmPass = await prisma.accounts.findFirst({
    where: { accountID },
    select: { password: true },
  });

  if (!confirmPass || !confirmPass.password) {
    throw new Error("No Account Found or password is missing");
  }

  const isValid = await bcrypt.compare(oldPassword, confirmPass.password);
  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

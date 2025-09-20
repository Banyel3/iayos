import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { generateVerificationEmailHTML } from "@/components/auth/verification/verification_email";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

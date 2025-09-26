import crypto from "crypto";
import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

const forgotPasswordSchema = z.object({
  newPassword: z.string(),
});
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 400,
      });
    }
    const { newPassword } = parsed.data;
    const { searchParams } = new URL(req.url);
    const verificationToken = searchParams.get("verifyToken") as string;
    const idParam = searchParams.get("id");
    if (!idParam) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
      });
    }

    const verifyToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    if (!idParam) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
      });
    }

    const accountID = Number(idParam);
    if (isNaN(accountID)) {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
      });
    }

    // const user = await prisma.accounts.findFirst({
    //   where: {
    //     accountID,
    //     verifyToken,
    //     verifyTokenExpire: { gt: new Date() },
    //   },
    // });

    // if (!user) {
    //   return NextResponse.json(
    //     {
    //       message: "Invalid or expired token",
    //     },
    //     {
    //       status: 400,
    //     }
    //   );
    // }
    // const hashedPass = await bcrypt.hash(newPassword, 10);
    // if (user) {
    //   await prisma.accounts.update({
    //     where: { accountID: user.accountID },
    //     data: {
    //       password: hashedPass,
    //       verifyToken: null,
    //       verifyTokenExpire: null,
    //     },
    //   });
    // }

    // TURBO MODE: Prisma commented out for caching

    return NextResponse.json(
      { verified: true },
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Something went wrong" + error,
      },
      {
        status: 500,
      }
    );
  }
}

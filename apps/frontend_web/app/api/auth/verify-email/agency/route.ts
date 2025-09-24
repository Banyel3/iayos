import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const verificationToken = searchParams.get("verifyToken") as string;
    const idParam = searchParams.get("id");
    
    // Debug: Log what we received
    console.log("Agency verification API called");
    console.log("Full URL:", req.url);
    console.log("verificationToken received:", verificationToken);
    console.log("idParam received:", idParam);

    if (!idParam) {
      console.log("Missing id parameter");
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
      });
    }

    if (!verificationToken) {
      console.log("Missing verification token");
      return new Response(JSON.stringify({ error: "Missing verification token" }), {
        status: 400,
      });
    }

    const verifyToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const accountID = Number(idParam);
    if (isNaN(accountID)) {
      console.log("Invalid account ID:", idParam);
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
      });
    }

    console.log("Looking for account with ID:", accountID);

    const user = await prisma.accounts.findFirst({
      where: {
        accountID,
        verifyToken,
        verifyTokenExpire: { gt: new Date() },
      },
      include: {
        agency: true, // Ensure this is an agency account
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid or expired token",
        },
        {
          status: 400,
        }
      );
    }

    if (user) {
      await prisma.accounts.update({
        where: { accountID: user.accountID },
        data: {
          isVerified: true,
          verifyToken: null,
          verifyTokenExpire: null,
        },
      });
    }

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

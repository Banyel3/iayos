import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🔍 Received request body:", body);

    if (!body.email || !body.selectedType) {
      return new Response(
        JSON.stringify({ error: "Email and selectedType are required" }),
        { status: 400 }
      );
    }

    const account = await prisma.accounts.findUnique({
      where: {
        email: body.email,
      },
      select: {
        accountID: true,
      },
    });

    console.log("🔍 Account lookup result:", account);

    if (!account) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
      });
    }

    // Look for profile that doesn't have a type assigned yet
    const profile = await prisma.profile.findFirst({
      where: {
        accountID: account.accountID,
        OR: [{ profileType: null }, { profileType: "" }],
      },
      select: {
        profileID: true,
        profileType: true,
      },
    });

    console.log("🔍 Profile lookup result:", profile);

    if (!profile) {
      // Check if user already has a profile with the selected type
      const existingProfile = await prisma.profile.findUnique({
        where: {
          accountID_profileType: {
            accountID: account.accountID,
            profileType: body.selectedType,
          },
        },
      });

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "Profile type already assigned" }),
          { status: 409 }
        );
      }

      return new Response(
        JSON.stringify({ error: "No available profile found to update" }),
        { status: 404 }
      );
    }

    console.log(
      "✅ Updating profile:",
      profile.profileID,
      "to type:",
      body.selectedType
    );

    await prisma.profile.update({
      where: {
        profileID: profile.profileID,
      },
      data: {
        profileType: body.selectedType,
      },
    });

    console.log("✅ Profile updated successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("❌ Error in assign-role route:", error);

    // Handle specific Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new Response(
          JSON.stringify({ error: "Profile type already exists for this user" }),
          { status: 409 }
        );
      }

      if (error.code === "P2025") {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
        });
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      { status: 500 }
    );
  }
}

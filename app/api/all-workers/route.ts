import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const Jobresults = await prisma.worker_Profile.findMany({
      select: {
        profileID: true,
        profile: {
          select: { firstName: true, lastName: true, profileImg: true },
        },
        bio: true,
        description: true,
        verifiedSkills: true,
        freelancer_specialization: { select: { specialization: true } },
      },
      skip: 0,
      take: 20,
    });

    return NextResponse.json({
      count: Jobresults.length,
      results: Jobresults,
    });
  } catch (error) {
    console.error("❌ Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ count: 0, results: [] });
    }

    // const Jobresults = await prisma.worker_Profile.findMany({
    //   where: {
    //     OR: [
    //       {
    //         freelancer_specialization: {
    //           some: {
    //             specialization: {
    //               specializationName: {
    //                 contains: query,
    //                 mode: "insensitive",
    //               },
    //             },
    //           },
    //         },
    //       },
    //       { bio: { contains: query, mode: "insensitive" } },
    //       { description: { contains: query, mode: "insensitive" } },
    //     ],
    //   },
    //   take: 20,
    //   select: {
    //     profileID: true,
    //     profile: {
    //       select: { firstName: true, lastName: true, profileImg: true },
    //     },
    //     bio: true,
    //     description: true,
    //     verifiedSkills: true,
    //     freelancer_specialization: { select: { specialization: true } },
    //   },
    // });

    // TURBO MODE: Prisma commented out for caching
    const Jobresults: unknown[] = [];

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

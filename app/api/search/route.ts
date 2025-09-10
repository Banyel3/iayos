// app/api/search/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client"; // Your custom Prisma client instance

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || ""; // Added trim() for cleaner input

    if (!query) {
      return NextResponse.json({ count: 0, results: [] });
    }

    // Use the new Query Compiler for better performance :cite[1]
    const results = await prisma.worker_Profile.findMany({
      where: {
        OR: [
          {
            freelancer_specialization: {
              some: {
                specialization: {
                  specializationName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
          {
            bio: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
          // For JSON array searching, use path syntax with filtering
          // This is more reliable than array_contains for partial matches
          {
            verifiedSkills: {
              path: "$[*]",
              string_contains: query, // Searches for partial matches in array elements
            },
          },
        ],
      },
      take: 20,
      include: {
        profile: true,
        freelancer_specialization: {
          include: {
            specialization: true,
          },
        },
      },
      // Added query optimization hints :cite[6]
      cacheStrategy: { ttl: 60 }, // Cache results for 60 seconds
    });

    return NextResponse.json({
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { rateLimiter } from "@/lib/rateLimiter";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    // Get rate limiter status without consuming points
    const rateLimiterStatus = await rateLimiter.get(ip);

    if (rateLimiterStatus) {
      const now = new Date();
      const remainingTime = Math.max(
        0,
        Math.round(rateLimiterStatus.msBeforeNext / 1000)
      );

      const isRateLimited = rateLimiterStatus.remainingPoints <= 0;

      return new Response(
        JSON.stringify({
          isRateLimited,
          remainingTime: isRateLimited ? remainingTime : 0,
          remainingAttempts: Math.max(0, rateLimiterStatus.remainingPoints),
          totalAttempts: 3,
          resetTime: new Date(
            Date.now() + rateLimiterStatus.msBeforeNext
          ).toISOString(),
        }),
        { status: 200 }
      );
    }

    // No rate limit record found
    return new Response(
      JSON.stringify({
        isRateLimited: false,
        remainingTime: 0,
        remainingAttempts: 3,
        totalAttempts: 3,
        resetTime: null,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Rate limit check error:", error);
    return new Response(
      JSON.stringify({
        isRateLimited: false,
        remainingTime: 0,
        remainingAttempts: 3,
        totalAttempts: 3,
        resetTime: null,
      }),
      { status: 200 }
    );
  }
}

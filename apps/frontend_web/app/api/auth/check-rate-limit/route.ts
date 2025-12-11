import { rateLimiter } from "@/lib/rateLimiter";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("Rate limit check API called");

  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    console.log("Client IP:", ip);

    // Get rate limiter status without consuming points
    const rateLimiterStatus = await rateLimiter.get(ip);
    console.log("Rate limiter status:", rateLimiterStatus);

    if (rateLimiterStatus) {
      const remainingTime = Math.max(
        0,
        Math.round(rateLimiterStatus.msBeforeNext / 1000)
      );

      const isRateLimited = rateLimiterStatus.remainingPoints <= 0;

      const response = {
        isRateLimited,
        remainingTime: isRateLimited ? remainingTime : 0,
        remainingAttempts: Math.max(0, rateLimiterStatus.remainingPoints),
        totalAttempts: 3,
        resetTime: new Date(
          Date.now() + rateLimiterStatus.msBeforeNext
        ).toISOString(),
      };

      console.log("Returning response:", response);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // No rate limit record found
    const defaultResponse = {
      isRateLimited: false,
      remainingTime: 0,
      remainingAttempts: 3,
      totalAttempts: 3,
      resetTime: null,
    };

    console.log(
      "No rate limit record found, returning default:",
      defaultResponse
    );

    return new Response(JSON.stringify(defaultResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Rate limit check error:", error);

    const errorResponse = {
      isRateLimited: false,
      remainingTime: 0,
      remainingAttempts: 3,
      totalAttempts: 3,
      resetTime: null,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

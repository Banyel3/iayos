// lib/rateLimiter.ts
import { RateLimiterMemory } from "rate-limiter-flexible";

export const rateLimiter = new RateLimiterMemory({
  points: 3, // 3 attempts
  duration: 300, // per 300 seconds (5 minutes)
});

// lib/rateLimiter.ts
import { RateLimiterMemory } from "rate-limiter-flexible";

export const rateLimiter = new RateLimiterMemory({
  points: 3, // 5 attempts
  duration: 300, // per 60 seconds
});

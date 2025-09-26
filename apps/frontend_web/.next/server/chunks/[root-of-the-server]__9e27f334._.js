module.exports = [
"[project]/apps/frontend_web/.next-internal/server/app/api/auth/check-rate-limit/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/cluster [external] (cluster, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("cluster", () => require("cluster"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/apps/frontend_web/lib/rateLimiter.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/rateLimiter.ts
__turbopack_context__.s([
    "rateLimiter",
    ()=>rateLimiter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rate$2d$limiter$2d$flexible$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/rate-limiter-flexible/index.js [app-route] (ecmascript)");
;
const rateLimiter = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rate$2d$limiter$2d$flexible$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RateLimiterMemory"]({
    points: 3,
    duration: 300
});
}),
"[project]/apps/frontend_web/app/api/auth/check-rate-limit/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend_web$2f$lib$2f$rateLimiter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/frontend_web/lib/rateLimiter.ts [app-route] (ecmascript)");
;
async function GET(req) {
    console.log("Rate limit check API called");
    try {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
        console.log("Client IP:", ip);
        // Get rate limiter status without consuming points
        const rateLimiterStatus = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend_web$2f$lib$2f$rateLimiter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rateLimiter"].get(ip);
        console.log("Rate limiter status:", rateLimiterStatus);
        if (rateLimiterStatus) {
            const remainingTime = Math.max(0, Math.round(rateLimiterStatus.msBeforeNext / 1000));
            const isRateLimited = rateLimiterStatus.remainingPoints <= 0;
            const response = {
                isRateLimited,
                remainingTime: isRateLimited ? remainingTime : 0,
                remainingAttempts: Math.max(0, rateLimiterStatus.remainingPoints),
                totalAttempts: 3,
                resetTime: new Date(Date.now() + rateLimiterStatus.msBeforeNext).toISOString()
            };
            console.log("Returning response:", response);
            return new Response(JSON.stringify(response), {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }
        // No rate limit record found
        const defaultResponse = {
            isRateLimited: false,
            remainingTime: 0,
            remainingAttempts: 3,
            totalAttempts: 3,
            resetTime: null
        };
        console.log("No rate limit record found, returning default:", defaultResponse);
        return new Response(JSON.stringify(defaultResponse), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("Rate limit check error:", error);
        const errorResponse = {
            isRateLimited: false,
            remainingTime: 0,
            remainingAttempts: 3,
            totalAttempts: 3,
            resetTime: null
        };
        return new Response(JSON.stringify(errorResponse), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9e27f334._.js.map
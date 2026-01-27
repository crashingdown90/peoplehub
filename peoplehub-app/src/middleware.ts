// @ai:cl - Middleware with authentication and rate limiting
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge, type JWTPayload } from "@/lib/auth/edge-jwt";

// Routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
const publicApiRoutes = ["/api/auth/login", "/api/auth/register", "/api/auth/logout", "/api/auth/csrf", "/api/health", "/api/tenants"];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
    // Dashboard page routes
    "/dashboard/superadmin": ["SUPER_ADMIN"],
    "/dashboard/hrd": ["HRD", "SUPER_ADMIN"],
    "/dashboard/finance": ["FINANCE", "SUPER_ADMIN"],
    "/dashboard/admin": ["IT_OPS", "SUPER_ADMIN"],
    "/dashboard/manager": ["MANAGER", "HRD", "SUPER_ADMIN"],
    // Super Admin routes
    "/admin/superadmin": ["SUPER_ADMIN"],
    // Admin routes
    "/admin/registrations": ["HRD", "SUPER_ADMIN"],
    "/admin/employees": ["HRD", "SUPER_ADMIN"],
    "/admin/settings": ["SUPER_ADMIN"],
    // Finance routes
    "/payroll": ["FINANCE", "HRD", "SUPER_ADMIN"],
    "/reimbursement/admin": ["FINANCE", "SUPER_ADMIN"],
    // API admin routes
    "/api/admin": ["HRD", "IT_OPS", "SUPER_ADMIN"],
    "/api/payroll/generate": ["FINANCE", "SUPER_ADMIN"],
    "/api/payroll/approve": ["FINANCE", "SUPER_ADMIN"],
    // Dashboard API routes
    "/api/dashboard/superadmin": ["SUPER_ADMIN"],
    "/api/dashboard/hrd": ["HRD", "SUPER_ADMIN"],
    "/api/dashboard/finance": ["FINANCE", "SUPER_ADMIN"],
    "/api/dashboard/it": ["IT_OPS", "SUPER_ADMIN"],
    "/api/dashboard/manager": ["MANAGER", "HRD", "SUPER_ADMIN"],
};

// ==========================================
// SIMPLE IN-MIDDLEWARE RATE LIMITING
// ==========================================
// Note: For production with multiple instances, use Redis-based rate limiting
// This is a simple implementation for development/single-instance deployments

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// In-memory store (works for development and single-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit config type
interface RateLimitConfig {
    limit: number;
    windowMs: number;
}

// Rate limit configurations by route type
const RATE_LIMITS: Record<string, RateLimitConfig> = {
    auth: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 minutes
    api: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
    sensitive: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 requests per hour
};

// Routes with specific rate limits
const authRoutes = ["/api/auth/login", "/api/auth/register", "/api/auth/forgot-password"];
const sensitiveRoutes = ["/api/admin/bulk", "/api/payroll/generate", "/api/admin/registrations"];

function getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();
    const realIP = request.headers.get("x-real-ip");
    if (realIP) return realIP;
    return "127.0.0.1";
}

/**
 * Get the base URL for redirects, using forwarded headers
 * This fixes the 0.0.0.0 redirect issue when running behind nginx
 */
function getRedirectUrl(request: NextRequest, path: string): URL {
    // First try X-Forwarded headers (set by nginx)
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

    if (forwardedHost) {
        return new URL(path, `${forwardedProto}://${forwardedHost}`);
    }

    // Check Host header - if it's not internal, use it
    const host = request.headers.get("host");
    if (host && !host.includes("0.0.0.0") && !host.includes("127.0.0.1") && !host.includes("localhost")) {
        return new URL(path, `https://${host}`);
    }

    // Fall back to request.url but only if it doesn't contain internal addresses
    const url = new URL(request.url);
    if (!url.hostname.includes("0.0.0.0") && !url.hostname.includes("127.0.0.1")) {
        return new URL(path, request.url);
    }

    // Last resort: hardcoded domain
    return new URL(path, "https://hrm-kreatifindo.cloud");
}

function checkRateLimit(
    key: string,
    config: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; retryAfter?: number } {
    const now = Date.now();
    let entry = rateLimitStore.get(key);

    // Clean up expired entry
    if (entry && now > entry.resetAt) {
        rateLimitStore.delete(key);
        entry = undefined;
    }

    if (!entry) {
        // Create new entry
        rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
        return { allowed: true, remaining: config.limit - 1 };
    }

    // Check if limit exceeded
    if (entry.count >= config.limit) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    // Increment count
    entry.count++;
    return { allowed: true, remaining: config.limit - entry.count };
}

// CR-005: Removed setInterval cleanup to prevent memory leaks
// Lazy cleanup is already handled in checkRateLimit (lines 82-85)

// ==========================================
// MIDDLEWARE
// ==========================================

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = getClientIP(request);

    // Allow static files
    if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
        return NextResponse.next();
    }

    // Rate limit check for API routes (skip for non-API routes)
    if (pathname.startsWith("/api")) {
        // Bypass rate limiting for test environment or localhost
        const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT_TEST === "true";
        const isLocalhost = ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
        const userAgent = request.headers.get("user-agent") || "";
        const isPlaywrightAgent = userAgent.includes("Playwright");

        // Skip rate limiting if any of these conditions are true
        const shouldSkipRateLimit = isTestEnvironment || (isLocalhost && isPlaywrightAgent);

        if (!shouldSkipRateLimit) {
            let rateLimitConfig = RATE_LIMITS.api;
            let rateLimitKey = `api:${ip}`;

            // Use stricter limits for auth routes
            if (authRoutes.some(route => pathname.startsWith(route))) {
                rateLimitConfig = RATE_LIMITS.auth;
                rateLimitKey = `auth:${ip}`;
            }
            // Use stricter limits for sensitive routes
            else if (sensitiveRoutes.some(route => pathname.startsWith(route))) {
                rateLimitConfig = RATE_LIMITS.sensitive;
                rateLimitKey = `sensitive:${ip}`;
            }

            const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfig);

            if (!rateLimitResult.allowed) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "RATE_LIMIT_EXCEEDED",
                            message: `Terlalu banyak permintaan. Coba lagi dalam ${rateLimitResult.retryAfter} detik.`,
                            retryAfter: rateLimitResult.retryAfter,
                        },
                    },
                    {
                        status: 429,
                        headers: {
                            "Retry-After": String(rateLimitResult.retryAfter),
                            "X-RateLimit-Remaining": "0",
                        },
                    }
                );
            }
        }
    }

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Allow public API routes
    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check authentication
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
        // Redirect to login for page requests
        if (!pathname.startsWith("/api")) {
            return NextResponse.redirect(getRedirectUrl(request, "/login"));
        }
        // Return 401 for API requests
        return NextResponse.json(
            { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
            { status: 401 }
        );
    }

    // Verify token (async for Edge Runtime compatibility)
    const payload: JWTPayload | null = await verifyTokenEdge(token);

    if (!payload) {
        // Clear invalid token
        const response = !pathname.startsWith("/api")
            ? NextResponse.redirect(getRedirectUrl(request, "/login"))
            : NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Invalid token" } },
                { status: 401 }
            );
        response.cookies.delete("auth-token");
        return response;
    }

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
        if (pathname.startsWith(route)) {
            if (!allowedRoles.includes(payload.role)) {
                if (!pathname.startsWith("/api")) {
                    return NextResponse.redirect(getRedirectUrl(request, "/dashboard"));
                }
                return NextResponse.json(
                    { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                    { status: 403 }
                );
            }
        }
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-tenant-id", payload.tenantId);
    requestHeaders.set("x-user-role", payload.role);
    if (payload.employeeId) {
        requestHeaders.set("x-employee-id", payload.employeeId);
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};

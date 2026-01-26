import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Get the base URL for redirects, using forwarded headers or env var
 */
function getBaseUrl(request: NextRequest): string {
    // First try X-Forwarded headers (set by nginx)
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

    if (forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
    }

    // Fall back to NEXT_PUBLIC_APP_URL
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Last resort: use Host header
    const host = request.headers.get("host");
    if (host && !host.includes("0.0.0.0") && !host.includes("127.0.0.1")) {
        return `https://${host}`;
    }

    // Default fallback
    return "https://hrm-kreatifindo.cloud";
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (session) {
            // Log logout action
            await prisma.auditLog.create({
                data: {
                    tenantId: session.tenantId,
                    actorId: session.userId,
                    action: "USER_LOGOUT",
                    objectType: "User",
                    objectId: session.userId,
                },
            });
        }

        // Clear auth cookie
        await clearAuthCookie();

        // Check if request expects JSON (API call) or redirect (form submission)
        const acceptHeader = request.headers.get("accept") || "";
        const contentType = request.headers.get("content-type") || "";
        const isApiCall = acceptHeader.includes("application/json") || contentType.includes("application/json");

        if (isApiCall) {
            // API call - return JSON
            return NextResponse.json({
                success: true,
                message: "Logout berhasil",
            });
        }

        // Form submission - redirect to login page using correct base URL
        const baseUrl = getBaseUrl(request);
        return NextResponse.redirect(new URL("/login", baseUrl));
    } catch (error) {
        console.error("Logout error:", error);

        // Check if should return JSON or redirect
        const acceptHeader = request.headers.get("accept") || "";
        const isApiCall = acceptHeader.includes("application/json");

        if (isApiCall) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Terjadi kesalahan server",
                    },
                },
                { status: 500 }
            );
        }

        // Redirect to login even on error using correct base URL
        const baseUrl = getBaseUrl(request);
        return NextResponse.redirect(new URL("/login?error=logout_failed", baseUrl));
    }
}

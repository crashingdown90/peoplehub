import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

        // Form submission - redirect to login page
        return NextResponse.redirect(new URL("/login", request.url));
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

        // Redirect to login even on error (cookie might still be cleared)
        return NextResponse.redirect(new URL("/login?error=logout_failed", request.url));
    }
}

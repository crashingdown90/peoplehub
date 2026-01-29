// @ai:cl - CSRF Token API endpoint
import { NextResponse } from "next/server";
import { setCsrfToken } from "@/lib/security/csrf";

/**
 * GET /api/auth/csrf
 * Returns a new CSRF token for client-side use
 */
export async function GET() {
    try {
        const token = await setCsrfToken();

        return NextResponse.json({
            success: true,
            token,
        });
    } catch (error) {
        console.error("CSRF token generation error:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "CSRF_GENERATION_FAILED",
                    message: "Gagal membuat CSRF token"
                }
            },
            { status: 500 }
        );
    }
}

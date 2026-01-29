// @ai:cl - Comprehensive health check endpoint for internal monitoring
import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    const health = await runHealthChecks();

    let statusCode = 200;
    if (health.status === "unhealthy") {
        statusCode = 503;
    } else if (health.status === "degraded") {
        statusCode = 200; // Still return 200 for degraded, but flag in response
    }

    return NextResponse.json(
        {
            success: health.status !== "unhealthy",
            data: health,
        },
        { status: statusCode }
    );
}

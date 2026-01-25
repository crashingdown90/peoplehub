// @ai:cl - Database-specific health check endpoint
import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    const dbHealth = await checkDatabase();
    const statusCode = dbHealth.status === "healthy" ? 200 : 503;

    return NextResponse.json(
        {
            success: dbHealth.status === "healthy",
            data: {
                status: dbHealth.status,
                message: dbHealth.message,
                latencyMs: dbHealth.latencyMs,
                timestamp: new Date().toISOString(),
            },
        },
        { status: statusCode }
    );
}

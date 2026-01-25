// @ai:cl - Enhanced health check endpoint with actual checks
import { NextResponse } from "next/server";
import { quickHealthCheck } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    const health = await quickHealthCheck();
    const statusCode = health.status === "ok" ? 200 : 503;

    return NextResponse.json(
        {
            success: health.status === "ok",
            data: health,
        },
        { status: statusCode }
    );
}

// @ai:cl - Redis health check endpoint
import { NextResponse } from "next/server";
import { checkRedis } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    const redisHealth = await checkRedis();
    const statusCode = redisHealth.status === "healthy" ? 200 : 503;

    return NextResponse.json(
        {
            success: redisHealth.status === "healthy",
            data: {
                status: redisHealth.status,
                message: redisHealth.message,
                details: redisHealth.details,
                timestamp: new Date().toISOString(),
            },
        },
        { status: statusCode }
    );
}

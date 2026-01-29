// @ai:cl - Prometheus-compatible metrics endpoint
import { NextResponse } from "next/server";
import { metrics, setMemoryUsage, setUptime } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    // Check for internal access (basic protection)
    const authHeader = request.headers.get("authorization");
    const metricsToken = process.env.METRICS_TOKEN;

    // If METRICS_TOKEN is set, require authentication
    if (metricsToken && authHeader !== `Bearer ${metricsToken}`) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    // Update system metrics before exporting
    setMemoryUsage();
    setUptime();

    // Export in Prometheus format
    const prometheusMetrics = metrics.toPrometheusFormat();

    return new NextResponse(prometheusMetrics, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        },
    });
}

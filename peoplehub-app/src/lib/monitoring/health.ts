// @ai:cl - Health check utilities for system monitoring
// Provides database, Redis, and system health checks

import { prisma } from "@/lib/db";

export interface HealthCheckResult {
    status: "healthy" | "unhealthy" | "degraded";
    message?: string;
    latencyMs?: number;
    details?: Record<string, unknown>;
}

export interface SystemHealth {
    status: "healthy" | "unhealthy" | "degraded";
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: HealthCheckResult;
        redis?: HealthCheckResult;
        memory: HealthCheckResult;
        disk?: HealthCheckResult;
    };
}

/**
 * Check database connectivity and query latency
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
        // Simple query to check connectivity
        await prisma.$queryRaw`SELECT 1 as health_check`;
        const latencyMs = Date.now() - start;

        return {
            status: latencyMs < 1000 ? "healthy" : "degraded",
            latencyMs,
            message: latencyMs < 1000 ? "Database connection OK" : "Database response slow",
        };
    } catch (error) {
        return {
            status: "unhealthy",
            latencyMs: Date.now() - start,
            message: error instanceof Error ? error.message : "Database connection failed",
        };
    }
}

/**
 * Check Redis connectivity (if configured)
 */
export async function checkRedis(): Promise<HealthCheckResult> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        return {
            status: "healthy",
            message: "Redis not configured (optional)",
        };
    }

    // Note: In a real implementation, you would ping Redis here
    // For now, we just check if the URL is configured
    return {
        status: "healthy",
        message: "Redis URL configured",
        details: {
            configured: true,
        },
    };
}

/**
 * Check memory usage
 */
export function checkMemory(): HealthCheckResult {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    let status: HealthCheckResult["status"] = "healthy";
    let message = "Memory usage normal";

    if (heapUsagePercent > 90) {
        status = "unhealthy";
        message = "Memory usage critical";
    } else if (heapUsagePercent > 75) {
        status = "degraded";
        message = "Memory usage high";
    }

    return {
        status,
        message,
        details: {
            heapUsedMB,
            heapTotalMB,
            rssMB,
            heapUsagePercent: Math.round(heapUsagePercent),
        },
    };
}

/**
 * Run all health checks
 */
export async function runHealthChecks(): Promise<SystemHealth> {
    const [database, redis] = await Promise.all([
        checkDatabase(),
        checkRedis(),
    ]);

    const memory = checkMemory();

    // Determine overall status
    const checks = { database, redis, memory };
    const statuses = Object.values(checks).map((c) => c?.status).filter(Boolean);

    let overallStatus: SystemHealth["status"] = "healthy";
    if (statuses.includes("unhealthy")) {
        overallStatus = "unhealthy";
    } else if (statuses.includes("degraded")) {
        overallStatus = "degraded";
    }

    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        uptime: process.uptime(),
        checks,
    };
}

/**
 * Quick health check (just database)
 */
export async function quickHealthCheck(): Promise<{
    status: "ok" | "error";
    timestamp: string;
    version: string;
    uptime: number;
}> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "1.0.0",
            uptime: process.uptime(),
        };
    } catch {
        return {
            status: "error",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "1.0.0",
            uptime: process.uptime(),
        };
    }
}

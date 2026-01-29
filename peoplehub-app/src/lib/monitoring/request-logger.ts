// @ai:cl - Request logger middleware for automatic request/response logging and metrics
import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger, recordApiRequest } from "@/lib/monitoring";

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract or generate request ID from headers
 */
export function getRequestId(request: NextRequest): string {
    return request.headers.get("x-request-id") || generateRequestId();
}

/**
 * Wrap an API handler with request logging and metrics
 * 
 * Usage:
 * ```typescript
 * import { withRequestLogging } from "@/lib/monitoring/request-logger";
 * 
 * async function handler(request: NextRequest) {
 *   // ... your handler logic
 *   return NextResponse.json({ data: "..." });
 * }
 * 
 * export const GET = withRequestLogging(handler);
 * ```
 */
export function withRequestLogging(
    handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>
) {
    return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
        const requestId = getRequestId(request);
        const startTime = Date.now();
        const method = request.method;
        const path = new URL(request.url).pathname;

        // Get user context from headers (set by auth middleware)
        const tenantId = request.headers.get("x-tenant-id") || undefined;
        const userId = request.headers.get("x-user-id") || undefined;

        // Create request-scoped logger
        const reqLogger = createRequestLogger(requestId, tenantId, userId);

        reqLogger.debug("Request started", {
            method,
            path,
            query: new URL(request.url).search,
        });

        let response: NextResponse;
        let statusCode: number;

        try {
            response = await handler(request, context);
            statusCode = response.status;
        } catch (error) {
            statusCode = 500;
            reqLogger.error("Request failed with unhandled error", {
                error: error instanceof Error ? error.message : String(error),
            });

            response = NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "An unexpected error occurred",
                    },
                },
                { status: 500 }
            );
        }

        const durationMs = Date.now() - startTime;

        // Log request completion
        const logMethod = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
        reqLogger[logMethod]("Request completed", {
            method,
            path,
            statusCode,
            durationMs,
        });

        // Record metrics
        recordApiRequest(method, path, statusCode, durationMs);

        // Add request ID to response headers
        const headers = new Headers(response.headers);
        headers.set("x-request-id", requestId);

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };
}

/**
 * Simple timing utility for measuring operation duration
 * 
 * Usage:
 * ```typescript
 * const timer = startTimer();
 * // ... do work ...
 * const durationMs = timer();
 * ```
 */
export function startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
}

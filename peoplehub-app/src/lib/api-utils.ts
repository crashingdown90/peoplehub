// @ai:cl - Shared API utilities for consistent error handling and security
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { validateCsrf, getCsrfErrorResponse } from "@/lib/security/csrf";

/**
 * Handle Prisma-specific errors with proper HTTP status codes
 */
export function handlePrismaError(error: unknown): NextResponse {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002": {
                // Unique constraint violation
                const target = (error.meta?.target as string[])?.join(", ") || "field";
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "DUPLICATE_ENTRY",
                            message: `Data sudah ada untuk ${target}`,
                        },
                    },
                    { status: 409 }
                );
            }
            case "P2025":
                // Record not found
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "NOT_FOUND",
                            message: "Data tidak ditemukan",
                        },
                    },
                    { status: 404 }
                );
            case "P2003":
                // Foreign key constraint failed
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "REFERENCE_ERROR",
                            message: "Data terkait tidak ditemukan",
                        },
                    },
                    { status: 400 }
                );
            case "P2014":
                // Required relation violation
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "RELATION_ERROR",
                            message: "Data tidak bisa dihapus karena masih digunakan",
                        },
                    },
                    { status: 400 }
                );
            default:
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "DATABASE_ERROR",
                            message: "Terjadi kesalahan database",
                        },
                    },
                    { status: 500 }
                );
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Data tidak valid",
                },
            },
            { status: 400 }
        );
    }

    // Generic server error
    return NextResponse.json(
        {
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Server error",
            },
        },
        { status: 500 }
    );
}

/**
 * Validate CSRF token for state-changing API requests (POST, PUT, PATCH, DELETE)
 * Returns null if valid, or a NextResponse with error if invalid
 */
export async function requireCsrf(request: Request): Promise<NextResponse | null> {
    const csrfResult = await validateCsrf(request.headers);
    if (!csrfResult.valid) {
        return NextResponse.json(getCsrfErrorResponse(), { status: 403 });
    }
    return null;
}

/**
 * Safe JSON parse from request body - returns 400 if invalid JSON
 */
export async function safeParseBody<T = unknown>(request: Request): Promise<{ data: T } | { error: NextResponse }> {
    try {
        const data = await request.json();
        return { data: data as T };
    } catch {
        return {
            error: NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_JSON",
                        message: "Request body bukan JSON yang valid",
                    },
                },
                { status: 400 }
            ),
        };
    }
}

/**
 * Soft delete filter - adds deletedAt: null to where clause
 */
export function withSoftDelete<T extends object>(where: T): T & { deletedAt: null } {
    return { ...where, deletedAt: null };
}

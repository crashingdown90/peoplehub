// @ai:cl - Admin Bank Change Request Management API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/admin/bank-change-requests - List all bank change requests
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            tenantId: context.tenantId,
        };

        if (status) {
            where.status = status;
        }

        // Get total count
        const total = await prisma.bankChangeRequest.count({ where });

        // Get bank change requests
        const requests = await prisma.bankChangeRequest.findMany({
            where,
            orderBy: [
                { status: "asc" }, // PENDING first
                { createdAt: "desc" },
            ],
            skip,
            take: limit,
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeNumber: true,
                        department: {
                            select: { name: true },
                        },
                        branch: {
                            select: { name: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                requests,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error("GET /api/admin/bank-change-requests error:", error);
        return handlePrismaError(error);
    }
}

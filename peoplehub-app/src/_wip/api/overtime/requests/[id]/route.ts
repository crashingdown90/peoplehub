// @ai:cl - Overtime request detail API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { OvertimeService } from "@/services";
import { completeOvertimeSchema } from "@/validations/overtime.schema";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/overtime/requests/:id
 * Get overtime request detail
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const result = await OvertimeService.getById(context, id);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Get overtime request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/overtime/requests/:id
 * Complete overtime request with actual hours
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const result = completeOvertimeSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
                },
                { status: 400 }
            );
        }

        const serviceResult = await OvertimeService.complete(context, id, result.data);

        if (!serviceResult.success) {
            return NextResponse.json(
                { success: false, error: serviceResult.error },
                { status: 422 }
            );
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "OVERTIME_REQUEST_COMPLETE",
                objectType: "OvertimeRequest",
                objectId: id,
                afterData: JSON.parse(JSON.stringify({
                    actualStartTime: serviceResult.data!.actualStartTime,
                    actualEndTime: serviceResult.data!.actualEndTime,
                    actualHours: serviceResult.data!.actualHours,
                })),
            },
        });

        return NextResponse.json({
            success: true,
            data: serviceResult.data,
            message: "Lembur berhasil diselesaikan.",
        });
    } catch (error) {
        console.error("Complete overtime request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/overtime/requests/:id
 * Cancel overtime request
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const serviceResult = await OvertimeService.cancel(context, id);

        if (!serviceResult.success) {
            return NextResponse.json(
                { success: false, error: serviceResult.error },
                { status: 422 }
            );
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "OVERTIME_REQUEST_CANCEL",
                objectType: "OvertimeRequest",
                objectId: id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Request lembur berhasil dibatalkan.",
        });
    } catch (error) {
        console.error("Cancel overtime request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

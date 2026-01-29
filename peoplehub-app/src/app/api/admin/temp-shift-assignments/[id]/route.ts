// @ai:cl - Temp shift assignment detail API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { TempShiftAssignmentService } from "@/services/shift";
import { updateTempShiftAssignmentSchema } from "@/validations/temp-shift-assignment.schema";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/temp-shift-assignments/:id
 * Get temp shift assignment detail
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

        if (!["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const result = await TempShiftAssignmentService.getById(context, id);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error("Get temp shift assignment error:", error);
        return handlePrismaError(error);
    }
}

/**
 * PATCH /api/admin/temp-shift-assignments/:id
 * Update temp shift assignment
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const result = updateTempShiftAssignmentSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
                },
                { status: 400 }
            );
        }

        const beforeResult = await TempShiftAssignmentService.getById(context, id);
        const beforeData = beforeResult.success ? beforeResult.data : null;

        const serviceResult = await TempShiftAssignmentService.update(context, id, result.data);

        if (!serviceResult.success) {
            const statusCode = serviceResult.error?.code === "FORBIDDEN" ? 403 : 422;
            return NextResponse.json(
                { success: false, error: serviceResult.error },
                { status: statusCode }
            );
        }

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "TEMP_SHIFT_ASSIGNMENT_UPDATE",
                objectType: "TempShiftAssignment",
                objectId: id,
                beforeData: beforeData ? JSON.parse(JSON.stringify(beforeData)) : undefined,
                afterData: JSON.parse(JSON.stringify(serviceResult.data)),
            },
        });

        return NextResponse.json({
            success: true,
            data: serviceResult.data,
            message: "Assignment shift berhasil diperbarui.",
        });
    } catch (error) {
        console.error("Update temp shift assignment error:", error);
        return handlePrismaError(error);
    }
}

/**
 * DELETE /api/admin/temp-shift-assignments/:id
 * Delete temp shift assignment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const beforeResult = await TempShiftAssignmentService.getById(context, id);
        const beforeData = beforeResult.success ? beforeResult.data : null;

        const serviceResult = await TempShiftAssignmentService.delete(context, id);

        if (!serviceResult.success) {
            const statusCode = serviceResult.error?.code === "FORBIDDEN" ? 403 : 422;
            return NextResponse.json(
                { success: false, error: serviceResult.error },
                { status: statusCode }
            );
        }

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "TEMP_SHIFT_ASSIGNMENT_DELETE",
                objectType: "TempShiftAssignment",
                objectId: id,
                beforeData: beforeData ? JSON.parse(JSON.stringify(beforeData)) : undefined,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Assignment shift berhasil dihapus.",
        });
    } catch (error) {
        console.error("Delete temp shift assignment error:", error);
        return handlePrismaError(error);
    }
}

// @ai:cl - Late deduction rule detail API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { LateRuleService } from "@/services";
import { updateLateRuleSchema } from "@/validations/late-rule.schema";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/late-rules/:id
 * Get late deduction rule detail
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

        // Check permission
        if (!["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const result = await LateRuleService.getById(context, id);

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
        console.error("Get late rule error:", error);
        return handlePrismaError(error);
    }
}

/**
 * PATCH /api/admin/late-rules/:id
 * Update late deduction rule
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
        const result = updateLateRuleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
                },
                { status: 400 }
            );
        }

        // Get before data
        const beforeResult = await LateRuleService.getById(context, id);
        const beforeData = beforeResult.success ? beforeResult.data : null;

        const serviceResult = await LateRuleService.update(context, id, result.data);

        if (!serviceResult.success) {
            const statusCode = serviceResult.error?.code === "FORBIDDEN" ? 403 : 422;
            return NextResponse.json(
                { success: false, error: serviceResult.error },
                { status: statusCode }
            );
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "LATE_RULE_UPDATE",
                objectType: "LateDeductionRule",
                objectId: id,
                beforeData: beforeData ? JSON.parse(JSON.stringify(beforeData)) : undefined,
                afterData: JSON.parse(JSON.stringify(serviceResult.data)),
            },
        });

        return NextResponse.json({
            success: true,
            data: serviceResult.data,
            message: "Aturan potongan berhasil diperbarui.",
        });
    } catch (error) {
        console.error("Update late rule error:", error);
        return handlePrismaError(error);
    }
}

/**
 * DELETE /api/admin/late-rules/:id
 * Delete late deduction rule
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

        // Get before data
        const beforeResult = await LateRuleService.getById(context, id);
        const beforeData = beforeResult.success ? beforeResult.data : null;

        const serviceResult = await LateRuleService.delete(context, id);

        if (!serviceResult.success) {
            const statusCode = serviceResult.error?.code === "FORBIDDEN" ? 403 : 422;
            return NextResponse.json(
                { success: false, error: serviceResult.error },
                { status: statusCode }
            );
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "LATE_RULE_DELETE",
                objectType: "LateDeductionRule",
                objectId: id,
                beforeData: beforeData ? JSON.parse(JSON.stringify(beforeData)) : undefined,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Aturan potongan berhasil dihapus.",
        });
    } catch (error) {
        console.error("Delete late rule error:", error);
        return handlePrismaError(error);
    }
}

// @ai:cl - Late deduction rules API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { LateRuleService } from "@/services";
import { createLateRuleSchema, lateRuleFilterSchema } from "@/validations/late-rule.schema";
import { handlePrismaError } from "@/lib/api-utils";

/**
 * GET /api/admin/late-rules
 * Get all late deduction rules
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // Check permission - admin only
        if (!["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const filterResult = lateRuleFilterSchema.safeParse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            branchId: searchParams.get("branchId"),
            isActive: searchParams.get("isActive"),
        });

        if (!filterResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Invalid parameters", details: filterResult.error.issues },
                },
                { status: 400 }
            );
        }

        const result = await LateRuleService.getAll(context, filterResult.data);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        console.error("Get late rules error:", error);
        return handlePrismaError(error);
    }
}

/**
 * POST /api/admin/late-rules
 * Create late deduction rule
 */
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const result = createLateRuleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
                },
                { status: 400 }
            );
        }

        const serviceResult = await LateRuleService.create(context, result.data);

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
                action: "LATE_RULE_CREATE",
                objectType: "LateDeductionRule",
                objectId: serviceResult.data!.id,
                afterData: JSON.parse(JSON.stringify(serviceResult.data)),
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: serviceResult.data,
                message: "Aturan potongan berhasil dibuat.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create late rule error:", error);
        return handlePrismaError(error);
    }
}

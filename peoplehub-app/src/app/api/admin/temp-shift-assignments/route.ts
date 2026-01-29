// @ai:cl - Temp shift assignments API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { TempShiftAssignmentService } from "@/services/shift";
import { createTempShiftAssignmentSchema, tempShiftAssignmentFilterSchema } from "@/validations/temp-shift-assignment.schema";
import { handlePrismaError } from "@/lib/api-utils";

/**
 * GET /api/admin/temp-shift-assignments
 * Get temp shift assignments
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

        if (!["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const filterResult = tempShiftAssignmentFilterSchema.safeParse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            employeeId: searchParams.get("employeeId"),
            shiftId: searchParams.get("shiftId"),
            isActive: searchParams.get("isActive"),
            startDate: searchParams.get("startDate"),
            endDate: searchParams.get("endDate"),
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

        const result = await TempShiftAssignmentService.getAll(context, filterResult.data);

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
        console.error("Get temp shift assignments error:", error);
        return handlePrismaError(error);
    }
}

/**
 * POST /api/admin/temp-shift-assignments
 * Create temp shift assignment
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
        const result = createTempShiftAssignmentSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
                },
                { status: 400 }
            );
        }

        const serviceResult = await TempShiftAssignmentService.create(context, result.data);

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
                action: "TEMP_SHIFT_ASSIGNMENT_CREATE",
                objectType: "TempShiftAssignment",
                objectId: serviceResult.data!.id,
                afterData: JSON.parse(JSON.stringify(serviceResult.data)),
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: serviceResult.data,
                message: "Assignment shift berhasil dibuat.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create temp shift assignment error:", error);
        return handlePrismaError(error);
    }
}

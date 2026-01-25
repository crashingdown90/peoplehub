// @ai:cl - Overtime requests API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { OvertimeService } from "@/services";
import { createOvertimeSchema, overtimeFilterSchema } from "@/validations/overtime.schema";

/**
 * GET /api/overtime/requests
 * Get overtime requests (own for employee, pending for manager/HRD)
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const filterResult = overtimeFilterSchema.safeParse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            startDate: searchParams.get("startDate"),
            endDate: searchParams.get("endDate"),
            status: searchParams.get("status"),
            overtimeType: searchParams.get("overtimeType"),
            employeeId: searchParams.get("employeeId"),
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

        const result = await OvertimeService.getByEmployee(context, filterResult.data);

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
        console.error("Get overtime requests error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

/**
 * POST /api/overtime/requests
 * Create overtime request
 */
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const result = createOvertimeSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
                },
                { status: 400 }
            );
        }

        const serviceResult = await OvertimeService.create(context, result.data);

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
                action: "OVERTIME_REQUEST_CREATE",
                objectType: "OvertimeRequest",
                objectId: serviceResult.data!.id,
                afterData: JSON.parse(JSON.stringify({
                    overtimeDate: serviceResult.data!.overtimeDate,
                    plannedStartTime: serviceResult.data!.plannedStartTime,
                    plannedEndTime: serviceResult.data!.plannedEndTime,
                    reason: serviceResult.data!.reason,
                })),
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: serviceResult.data,
                message: "Request lembur berhasil diajukan, menunggu persetujuan atasan.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create overtime request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

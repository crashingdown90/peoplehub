// @ai:cl - Overtime request reject API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { OvertimeService } from "@/services";
import { rejectOvertimeSchema } from "@/validations/overtime.schema";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/overtime/requests/:id/reject
 * Reject overtime request (Manager/HRD)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        const result = rejectOvertimeSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
                },
                { status: 400 }
            );
        }

        const serviceResult = await OvertimeService.reject(context, id, result.data.reason);

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
                action: "OVERTIME_REQUEST_REJECT",
                objectType: "OvertimeRequest",
                objectId: id,
                afterData: JSON.parse(JSON.stringify({
                    rejectedBy: context.userId,
                    reason: result.data.reason,
                })),
            },
        });

        return NextResponse.json({
            success: true,
            data: serviceResult.data,
            message: "Request lembur ditolak.",
        });
    } catch (error) {
        console.error("Reject overtime request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// @ai:cl - Overtime request approve API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { OvertimeService } from "@/services";
import { approveOvertimeSchema } from "@/validations/overtime.schema";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/overtime/requests/:id/approve
 * Approve overtime request (Manager/HRD)
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

        const body = await request.json().catch(() => ({}));
        const result = approveOvertimeSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
                },
                { status: 400 }
            );
        }

        const serviceResult = await OvertimeService.approve(context, id, result.data.comment);

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
                action: "OVERTIME_REQUEST_APPROVE",
                objectType: "OvertimeRequest",
                objectId: id,
                afterData: JSON.parse(JSON.stringify({
                    approvedBy: context.userId,
                    comment: result.data.comment,
                })),
            },
        });

        return NextResponse.json({
            success: true,
            data: serviceResult.data,
            message: "Request lembur berhasil disetujui.",
        });
    } catch (error) {
        console.error("Approve overtime request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

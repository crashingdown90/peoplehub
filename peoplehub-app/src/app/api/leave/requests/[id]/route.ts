import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/leave/requests/[id] - Cancel leave request (only if pending)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                employeeId: context.employeeId,
            },
        });

        if (!leaveRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Pengajuan cuti tidak ditemukan" } },
                { status: 404 }
            );
        }

        if (leaveRequest.status !== "PENDING") {
            return NextResponse.json(
                { success: false, error: { code: "INVALID_STATUS", message: "Hanya pengajuan pending yang dapat dibatalkan" } },
                { status: 422 }
            );
        }

        await prisma.leaveRequest.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "LEAVE_CANCELLED",
                objectType: "LeaveRequest",
                objectId: id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Pengajuan cuti berhasil dibatalkan",
        });
    } catch (error) {
        console.error("Cancel leave request error:", error);
        return handlePrismaError(error);
    }
}

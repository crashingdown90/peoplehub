import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";

const rejectSchema = z.object({
    reason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/approvals/leave/[id]/reject - Reject leave request
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

        if (!hasRole(context, ["MANAGER", "HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const result = rejectSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues } },
                { status: 400 }
            );
        }

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                status: { in: ["PENDING", "APPROVED_MANAGER"] },
            },
        });

        if (!leaveRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Pengajuan cuti tidak ditemukan atau sudah diproses" } },
                { status: 404 }
            );
        }

        await prisma.leaveRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: result.data.reason,
            },
        });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "LEAVE_REJECTED",
                objectType: "LeaveRequest",
                objectId: id,
                afterData: JSON.parse(JSON.stringify({
                    reason: result.data.reason,
                })),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Pengajuan cuti ditolak",
        });
    } catch (error) {
        console.error("Reject leave error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

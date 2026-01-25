import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";

const bulkRejectSchema = z.object({
    ids: z.array(z.string()).min(1, "Minimal 1 ID"),
    type: z.enum(["leave", "correction", "travel", "reimburse"]),
    reason: z.string().min(10, "Alasan minimal 10 karakter"),
});

// POST /api/admin/bulk/reject - Bulk reject requests (HRD only)
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const result = bulkRejectSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const { ids, type, reason } = result.data;
        let rejected = 0;

        switch (type) {
            case "leave":
                const leaveResult = await prisma.leaveRequest.updateMany({
                    where: {
                        id: { in: ids },
                        tenantId: context.tenantId,
                        status: { in: ["PENDING", "APPROVED_MANAGER"] },
                    },
                    data: { status: "REJECTED", rejectionReason: reason },
                });
                rejected = leaveResult.count;
                break;

            case "correction":
                const corrResult = await prisma.attendanceCorrection.updateMany({
                    where: {
                        id: { in: ids },
                        tenantId: context.tenantId,
                        status: "PENDING",
                    },
                    data: {
                        status: "REJECTED",
                        rejectionReason: reason,
                        approvedById: context.userId,
                        approvedAt: new Date(),
                    },
                });
                rejected = corrResult.count;
                break;

            case "travel":
                const travelResult = await prisma.travelRequest.updateMany({
                    where: {
                        id: { in: ids },
                        tenantId: context.tenantId,
                        status: { in: ["PENDING", "APPROVED_MANAGER"] },
                    },
                    data: { status: "REJECTED", rejectionReason: reason },
                });
                rejected = travelResult.count;
                break;

            case "reimburse":
                const reimbResult = await prisma.reimburseRequest.updateMany({
                    where: {
                        id: { in: ids },
                        tenantId: context.tenantId,
                        status: { in: ["PENDING", "APPROVED_MANAGER"] },
                    },
                    data: { status: "REJECTED", rejectionReason: reason },
                });
                rejected = reimbResult.count;
                break;
        }

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: `BULK_REJECT_${type.toUpperCase()}`,
                objectType: type,
                afterData: JSON.parse(JSON.stringify({ ids, rejected, reason })),
            },
        });

        return NextResponse.json({
            success: true,
            message: `${rejected} dari ${ids.length} berhasil ditolak`,
            data: { rejected, total: ids.length },
        });
    } catch (error) {
        console.error("Bulk reject error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

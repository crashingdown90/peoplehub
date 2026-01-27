import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const bulkApproveSchema = z.object({
    ids: z.array(z.string()).min(1, "Minimal 1 ID"),
    type: z.enum(["leave", "correction", "travel", "reimburse"]),
});

// POST /api/admin/bulk/approve - Bulk approve requests (HRD only)
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
        const result = bulkApproveSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const { ids, type } = result.data;
        let approved = 0;

        switch (type) {
            case "leave":
                const leaveResult = await prisma.leaveRequest.updateMany({
                    where: {
                        id: { in: ids },
                        tenantId: context.tenantId,
                        status: { in: ["PENDING", "APPROVED_MANAGER"] },
                    },
                    data: {
                        status: "APPROVED",
                        approvedByHrdId: context.userId,
                        hrdApprovedAt: new Date(),
                    },
                });
                approved = leaveResult.count;

                // Deduct leave balances
                for (const id of ids) {
                    const leave = await prisma.leaveRequest.findUnique({
                        where: { id },
                        select: { employeeId: true, leaveTypeId: true, totalDays: true },
                    });
                    if (leave) {
                        await prisma.leaveBalance.updateMany({
                            where: {
                                employeeId: leave.employeeId,
                                leaveTypeId: leave.leaveTypeId,
                                year: new Date().getFullYear(),
                            },
                            data: { remainingBalance: { decrement: leave.totalDays } },
                        });
                    }
                }
                break;

            case "correction":
                const corrResult = await prisma.attendanceCorrection.updateMany({
                    where: {
                        id: { in: ids },
                        tenantId: context.tenantId,
                        status: "PENDING",
                    },
                    data: {
                        status: "APPROVED",
                        approvedById: context.userId,
                        approvedAt: new Date(),
                    },
                });
                approved = corrResult.count;
                break;

            case "travel":
                const travelResult = await prisma.travelRequest.updateMany({
                    where: {
                        id: { in: ids },
                        tenantId: context.tenantId,
                        status: { in: ["PENDING", "APPROVED_MANAGER"] },
                    },
                    data: {
                        status: "APPROVED",
                        approvedByHrdId: context.userId,
                        hrdApprovedAt: new Date(),
                    },
                });
                approved = travelResult.count;
                break;

            case "reimburse":
                const reimbResult = await prisma.reimburseRequest.updateMany({
                    where: {
                        id: { in: ids },
                        tenantId: context.tenantId,
                        status: { in: ["PENDING", "APPROVED_MANAGER"] },
                    },
                    data: {
                        status: "APPROVED",
                        approvedByFinanceId: context.userId,
                        financeApprovedAt: new Date(),
                    },
                });
                approved = reimbResult.count;
                break;
        }

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: `BULK_APPROVE_${type.toUpperCase()}`,
                objectType: type,
                afterData: JSON.parse(JSON.stringify({ ids, approved })),
            },
        });

        return NextResponse.json({
            success: true,
            message: `${approved} dari ${ids.length} berhasil disetujui`,
            data: { approved, total: ids.length },
        });
    } catch (error) {
        console.error("Bulk approve error:", error);
        return handlePrismaError(error);
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/approvals/reimburse/[id]/approve
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

        if (!hasRole(context, ["MANAGER", "FINANCE", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: { id, tenantId: context.tenantId, status: { in: ["PENDING", "APPROVED_MANAGER"] } },
        });

        if (!reimburseRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Reimburse request not found" } },
                { status: 404 }
            );
        }

        const isManager = context.role === "MANAGER";
        const isFinance = context.role === "FINANCE" || context.role === "SUPER_ADMIN";

        let newStatus: "APPROVED_MANAGER" | "APPROVED" = "APPROVED";
        const updateData: Record<string, unknown> = {};

        if (isManager && reimburseRequest.status === "PENDING") {
            newStatus = "APPROVED_MANAGER";
            updateData.approvedByManagerId = context.userId;
            updateData.managerApprovedAt = new Date();
        } else if (isFinance) {
            newStatus = "APPROVED";
            updateData.approvedByFinanceId = context.userId;
            updateData.financeApprovedAt = new Date();
        }

        updateData.status = newStatus;

        await prisma.reimburseRequest.update({ where: { id }, data: updateData });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: newStatus === "APPROVED" ? "REIMBURSE_APPROVED" : "REIMBURSE_APPROVED_MANAGER",
                objectType: "ReimburseRequest",
                objectId: id,
            },
        });

        return NextResponse.json({
            success: true,
            message: newStatus === "APPROVED" ? "Reimburse disetujui, menunggu pembayaran" : "Disetujui oleh Manager, menunggu Finance",
        });
    } catch (error) {
        console.error("Approve reimburse error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/approvals/travel/[id]/approve
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

        const travelRequest = await prisma.travelRequest.findFirst({
            where: { id, tenantId: context.tenantId, status: { in: ["PENDING", "APPROVED_MANAGER"] } },
        });

        if (!travelRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Travel request not found" } },
                { status: 404 }
            );
        }

        const isManager = context.role === "MANAGER";
        const isHrd = context.role === "HRD" || context.role === "SUPER_ADMIN";

        let newStatus: "APPROVED_MANAGER" | "APPROVED" = "APPROVED";
        const updateData: Record<string, unknown> = {};

        if (isManager && travelRequest.status === "PENDING") {
            newStatus = "APPROVED_MANAGER";
            updateData.approvedByManagerId = context.userId;
            updateData.managerApprovedAt = new Date();
        } else if (isHrd) {
            newStatus = "APPROVED";
            updateData.approvedByHrdId = context.userId;
            updateData.hrdApprovedAt = new Date();
        }

        updateData.status = newStatus;

        await prisma.travelRequest.update({ where: { id }, data: updateData });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: newStatus === "APPROVED" ? "TRAVEL_APPROVED" : "TRAVEL_APPROVED_MANAGER",
                objectType: "TravelRequest",
                objectId: id,
            },
        });

        return NextResponse.json({
            success: true,
            message: newStatus === "APPROVED" ? "Perjalanan dinas disetujui" : "Disetujui oleh Manager, menunggu HRD",
        });
    } catch (error) {
        console.error("Approve travel error:", error);
        return handlePrismaError(error);
    }
}

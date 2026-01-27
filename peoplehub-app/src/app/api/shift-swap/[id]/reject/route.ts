// @ai:cl - Reject shift swap request
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/shift-swap/[id]/reject
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { reason } = body;

        if (!reason || reason.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Alasan penolakan minimal 10 karakter" } },
                { status: 400 }
            );
        }

        const swap = await prisma.shiftSwap.findFirst({
            where: { id, tenantId: context.tenantId },
        });

        if (!swap) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Shift swap tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Partner can reject if PENDING_PARTNER, Manager/HRD can reject if PENDING_MANAGER
        let canReject = false;
        if (swap.status === "PENDING_PARTNER" && swap.partnerId === context.employeeId) {
            canReject = true;
        } else if (swap.status === "PENDING_MANAGER" && hasRole(context, ["MANAGER", "HRD", "SUPER_ADMIN"])) {
            canReject = true;
        }

        if (!canReject) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Tidak memiliki hak untuk menolak" } },
                { status: 403 }
            );
        }

        const updated = await prisma.shiftSwap.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: reason.trim(),
            },
        });

        // Notify requester
        const requester = await prisma.employee.findUnique({
            where: { id: swap.requesterId },
            select: { userId: true },
        });

        if (requester?.userId) {
            await prisma.notification.create({
                data: {
                    tenantId: context.tenantId,
                    userId: requester.userId,
                    title: "Tukar Shift Ditolak",
                    message: `Permintaan tukar shift Anda ditolak. Alasan: ${reason.trim()}`,
                    type: "SYSTEM",
                    link: "/shift/swap",
                },
            });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Reject shift swap error:", error);
        return handlePrismaError(error);
    }
}

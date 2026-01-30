// @ai:cl - Reject shift swap request
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
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

        const swap = await prisma.shiftSwap.findFirst({
            where: { id, tenantId: context.tenantId },
        });

        if (!swap) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Shift swap tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Partner can reject if PENDING_PARTNER (no manager approval needed)
        const canReject = swap.status === "PENDING_PARTNER" && swap.partnerId === context.employeeId;

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
                rejectionReason: null,
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
                    message: "Permintaan tukar shift Anda ditolak.",
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

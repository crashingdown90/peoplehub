// @ai:cl - Partner approves shift swap request
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/shift-swap/[id]/approve-partner
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

        if (swap.partnerId !== context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Hanya partner yang bisa menyetujui" } },
                { status: 403 }
            );
        }

        if (swap.status !== "PENDING_PARTNER") {
            return NextResponse.json(
                { success: false, error: { code: "CANNOT_MODIFY", message: "Status bukan menunggu persetujuan partner" } },
                { status: 400 }
            );
        }

        const updated = await prisma.shiftSwap.update({
            where: { id },
            data: {
                status: "APPROVED",
                partnerApproved: true,
                partnerApprovedAt: new Date(),
            },
        });

        // Notify requester that partner approved
        const requester = await prisma.employee.findUnique({
            where: { id: swap.requesterId },
            select: { userId: true },
        });

        if (requester?.userId) {
            await prisma.notification.create({
                data: {
                    tenantId: context.tenantId,
                    userId: requester.userId,
                    title: "Partner Menyetujui Tukar Shift",
                    message: "Partner Anda telah menyetujui permintaan tukar shift.",
                    type: "APPROVAL",
                    link: "/shift/swap",
                },
            });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Approve partner shift swap error:", error);
        return handlePrismaError(error);
    }
}

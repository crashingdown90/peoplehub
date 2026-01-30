// @ai:cl - Cancel shift swap request by requester
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/shift-swap/[id]/cancel
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

        if (swap.requesterId !== context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Hanya pemohon yang bisa membatalkan" } },
                { status: 403 }
            );
        }

        if (!["PENDING_PARTNER"].includes(swap.status)) {
            return NextResponse.json(
                { success: false, error: { code: "CANNOT_MODIFY", message: "Hanya pengajuan yang pending bisa dibatalkan" } },
                { status: 400 }
            );
        }

        const updated = await prisma.shiftSwap.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Cancel shift swap error:", error);
        return handlePrismaError(error);
    }
}

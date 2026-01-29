import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const rejectSchema = z.object({
    reason: z.string().min(10, "Alasan minimal 10 karakter"),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/approvals/correction/[id]/reject
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
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const correction = await prisma.attendanceCorrection.findFirst({
            where: { id, tenantId: context.tenantId, status: "PENDING" },
        });

        if (!correction) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Koreksi tidak ditemukan" } },
                { status: 404 }
            );
        }

        await prisma.attendanceCorrection.update({
            where: { id },
            data: {
                status: "REJECTED",
                approvedById: context.userId,
                approvedAt: new Date(),
                rejectionReason: result.data.reason,
            },
        });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "CORRECTION_REJECTED",
                objectType: "AttendanceCorrection",
                objectId: id,
                afterData: JSON.parse(JSON.stringify({ reason: result.data.reason })),
            },
        });

        return NextResponse.json({ success: true, message: "Koreksi ditolak" });
    } catch (error) {
        console.error("Reject correction error:", error);
        return handlePrismaError(error);
    }
}

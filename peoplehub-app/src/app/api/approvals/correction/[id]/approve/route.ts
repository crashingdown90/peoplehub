import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const approveSchema = z.object({
    comment: z.string().optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/approvals/correction/[id]/approve
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

        const correction = await prisma.attendanceCorrection.findFirst({
            where: { id, tenantId: context.tenantId, status: "PENDING" },
        });

        if (!correction) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Koreksi tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Update correction status
        await prisma.attendanceCorrection.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedById: context.userId,
                approvedAt: new Date(),
            },
        });

        // Update or create attendance record
        await prisma.attendance.upsert({
            where: {
                tenantId_employeeId_attendanceDate: {
                    tenantId: context.tenantId,
                    employeeId: correction.employeeId,
                    attendanceDate: correction.attendanceDate,
                },
            },
            update: {
                clockIn: correction.requestedClockIn || undefined,
                clockOut: correction.requestedClockOut || undefined,
                status: "PRESENT",
                lateMinutes: 0, // Reset late minutes on correction
            },
            create: {
                tenantId: context.tenantId,
                employeeId: correction.employeeId,
                attendanceDate: correction.attendanceDate,
                clockIn: correction.requestedClockIn,
                clockOut: correction.requestedClockOut,
                workMode: "WFO",
                status: "PRESENT",
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "CORRECTION_APPROVED",
                objectType: "AttendanceCorrection",
                objectId: id,
            },
        });

        return NextResponse.json({ success: true, message: "Koreksi disetujui" });
    } catch (error) {
        console.error("Approve correction error:", error);
        return handlePrismaError(error);
    }
}

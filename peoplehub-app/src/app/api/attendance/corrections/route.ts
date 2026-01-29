import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const correctionSchema = z.object({
    attendanceDate: z.string().min(1, "Tanggal wajib diisi"),
    requestedClockIn: z.string().optional(),
    requestedClockOut: z.string().optional(),
    reason: z.string().min(10, "Alasan minimal 10 karakter"),
});

// GET /api/attendance/corrections - Get my corrections
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const where = {
            tenantId: context.tenantId,
            employeeId: context.employeeId,
            ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
        };

        const [corrections, total] = await Promise.all([
            prisma.attendanceCorrection.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.attendanceCorrection.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: corrections,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get corrections error:", error);
        return handlePrismaError(error);
    }
}

// POST /api/attendance/corrections - Create correction request
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const result = correctionSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const { attendanceDate, requestedClockIn, requestedClockOut, reason } = result.data;
        const date = new Date(attendanceDate);
        date.setHours(0, 0, 0, 0);

        // Get original attendance
        const originalAttendance = await prisma.attendance.findUnique({
            where: {
                tenantId_employeeId_attendanceDate: {
                    tenantId: context.tenantId,
                    employeeId: context.employeeId,
                    attendanceDate: date,
                },
            },
        });

        // Check for pending correction
        const existingCorrection = await prisma.attendanceCorrection.findFirst({
            where: {
                employeeId: context.employeeId,
                attendanceDate: date,
                status: "PENDING",
            },
        });

        if (existingCorrection) {
            return NextResponse.json(
                { success: false, error: { code: "PENDING_CORRECTION", message: "Sudah ada koreksi pending untuk tanggal ini" } },
                { status: 422 }
            );
        }

        const correction = await prisma.attendanceCorrection.create({
            data: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                attendanceDate: date,
                originalClockIn: originalAttendance?.clockIn,
                originalClockOut: originalAttendance?.clockOut,
                requestedClockIn: requestedClockIn ? new Date(`${attendanceDate}T${requestedClockIn}`) : null,
                requestedClockOut: requestedClockOut ? new Date(`${attendanceDate}T${requestedClockOut}`) : null,
                reason,
                status: "PENDING",
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "CORRECTION_REQUESTED",
                objectType: "AttendanceCorrection",
                objectId: correction.id,
                afterData: JSON.parse(JSON.stringify({ attendanceDate, requestedClockIn, requestedClockOut, reason })),
            },
        });

        return NextResponse.json({
            success: true,
            data: correction,
            message: "Pengajuan koreksi berhasil. Menunggu persetujuan.",
        }, { status: 201 });
    } catch (error) {
        console.error("Create correction error:", error);
        return handlePrismaError(error);
    }
}

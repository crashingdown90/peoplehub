// @ai:cl - Attendance Correction Approve/Reject API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";
import { notifyAttendanceCorrectionApproved, notifyAttendanceCorrectionRejected } from "@/lib/notifications";

const approveSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().min(10, "Alasan penolakan minimal 10 karakter").optional(),
});

// POST /api/attendance/corrections/[id]/approve - Approve or reject correction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" },
        },
        { status: 401 }
      );
    }

    // Check role - Manager, HRD, or SUPER_ADMIN can approve
    if (!["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses untuk menyetujui koreksi" },
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate body
    const body = await request.json();
    const result = approveSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Data tidak valid",
            details: result.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { action, rejectionReason } = result.data;

    // Reject requires reason
    if (action === "REJECT" && !rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Alasan penolakan wajib diisi" },
        },
        { status: 400 }
      );
    }

    // Find correction
    const correction = await prisma.attendanceCorrection.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
        status: "PENDING",
      },
      include: {
        employee: { select: { fullName: true, managerId: true, userId: true } },
      },
    });

    if (!correction) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Pengajuan koreksi tidak ditemukan atau sudah diproses" },
        },
        { status: 404 }
      );
    }

    // Manager can only approve their subordinates
    if (context.role === "MANAGER" && correction.employee.managerId !== context.employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Anda hanya dapat menyetujui koreksi dari bawahan langsung" },
        },
        { status: 403 }
      );
    }

    if (action === "APPROVE") {
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
      const attendanceDate = new Date(correction.attendanceDate);
      attendanceDate.setHours(0, 0, 0, 0);

      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          tenantId: context.tenantId,
          employeeId: correction.employeeId,
          attendanceDate: attendanceDate,
        },
      });

      if (existingAttendance) {
        // Update existing attendance
        await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            clockIn: correction.requestedClockIn || existingAttendance.clockIn,
            clockOut: correction.requestedClockOut || existingAttendance.clockOut,
            isCorrected: true,
            notes: `Dikoreksi pada ${new Date().toISOString()}. Alasan: ${correction.reason}`,
          },
        });
      } else if (correction.requestedClockIn) {
        // Create new attendance if doesn't exist and clockIn is requested
        await prisma.attendance.create({
          data: {
            tenantId: context.tenantId,
            employeeId: correction.employeeId,
            attendanceDate: attendanceDate,
            clockIn: correction.requestedClockIn,
            clockOut: correction.requestedClockOut,
            status: "PRESENT",
            isCorrected: true,
            workMode: "WFO",
            notes: `Dibuat dari koreksi pada ${new Date().toISOString()}. Alasan: ${correction.reason}`,
          },
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: context.tenantId,
          actorId: context.userId,
          action: "CORRECTION_APPROVED",
          objectType: "AttendanceCorrection",
          objectId: id,
          afterData: JSON.parse(JSON.stringify({
            employeeName: correction.employee.fullName,
            attendanceDate: correction.attendanceDate.toISOString(),
          })),
        },
      });

      // Send notification to employee
      if (correction.employee.userId) {
        await notifyAttendanceCorrectionApproved(
          context.tenantId,
          correction.employee.userId,
          correction.attendanceDate.toLocaleDateString("id-ID"),
        );
      }

      return NextResponse.json({
        success: true,
        message: "Koreksi kehadiran berhasil disetujui",
      });
    } else {
      // REJECT
      await prisma.attendanceCorrection.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason,
          approvedById: context.userId,
          approvedAt: new Date(),
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: context.tenantId,
          actorId: context.userId,
          action: "CORRECTION_REJECTED",
          objectType: "AttendanceCorrection",
          objectId: id,
          afterData: JSON.parse(JSON.stringify({
            employeeName: correction.employee.fullName,
            rejectionReason,
          })),
        },
      });

      // Send notification to employee
      if (correction.employee.userId) {
        await notifyAttendanceCorrectionRejected(
          context.tenantId,
          correction.employee.userId,
          correction.attendanceDate.toLocaleDateString("id-ID"),
          rejectionReason || "Tidak ada alasan",
        );
      }

      return NextResponse.json({
        success: true,
        message: "Koreksi kehadiran ditolak",
      });
    }
  } catch (error) {
    console.error("Approve correction error:", error);
    return handlePrismaError(error);
  }
}

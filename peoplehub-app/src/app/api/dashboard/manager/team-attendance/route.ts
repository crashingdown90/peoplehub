// @ai:cl - Team attendance API for manager dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/manager/team-attendance - Get team attendance summary
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    // Get subordinates
    const subordinates = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        managerId: context.employeeId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        employeeNumber: true,
        position: { select: { name: true } },
      },
    });

    if (subordinates.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          date: dateStr,
          teamSize: 0,
          summary: { present: 0, late: 0, absent: 0, leave: 0, wfh: 0, wfo: 0 },
          members: [],
        },
      });
    }

    const subordinateIds = subordinates.map((s) => s.id);

    // Get attendance for subordinates on the date
    const attendances = await prisma.attendance.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: subordinateIds },
        attendanceDate: targetDate,
      },
    });

    // Get leave requests for subordinates on the date
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: subordinateIds },
        status: "APPROVED",
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.employeeId, a]));
    const leaveSet = new Set(leaves.map((l) => l.employeeId));

    // Build member status
    const members = subordinates.map((sub) => {
      const attendance = attendanceMap.get(sub.id);
      const isOnLeave = leaveSet.has(sub.id);

      let status: string;
      if (isOnLeave) {
        status = "LEAVE";
      } else if (attendance) {
        status = attendance.status;
      } else {
        status = "ABSENT";
      }

      return {
        employeeId: sub.id,
        fullName: sub.fullName,
        employeeNumber: sub.employeeNumber,
        position: sub.position?.name || "-",
        status,
        clockIn: attendance?.clockIn || null,
        clockOut: attendance?.clockOut || null,
        workMode: attendance?.workMode || null,
        lateMinutes: attendance?.lateMinutes || 0,
      };
    });

    // Calculate summary
    const summary = {
      present: members.filter((m) => m.status === "PRESENT").length,
      late: members.filter((m) => m.status === "LATE").length,
      absent: members.filter((m) => m.status === "ABSENT").length,
      leave: members.filter((m) => m.status === "LEAVE").length,
      wfh: members.filter((m) => m.workMode === "WFH").length,
      wfo: members.filter((m) => m.workMode === "WFO").length,
    };

    // Calculate attendance rate
    const attendanceRate = subordinates.length > 0
      ? Math.round(((summary.present + summary.late) / subordinates.length) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        teamSize: subordinates.length,
        attendanceRate,
        summary,
        members,
      },
    });
  } catch (error) {
    console.error("Get team attendance error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

// @ai:cl - Company-wide attendance stats API for HRD dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/hrd/attendance-stats - Get company-wide attendance statistics
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const period = searchParams.get("period") || "daily"; // daily, weekly, monthly

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    // Calculate date range based on period
    let startDate: Date;
    const endDate: Date = targetDate;

    if (period === "weekly") {
      startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 6);
    } else if (period === "monthly") {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    } else {
      startDate = targetDate;
    }

    // Get total active employees
    const employeeWhere: Record<string, unknown> = {
      tenantId: context.tenantId,
      status: "ACTIVE",
    };
    if (branchId) employeeWhere.branchId = branchId;

    const totalEmployees = await prisma.employee.count({ where: employeeWhere });

    // Get attendance stats
    const attendanceWhere: Record<string, unknown> = {
      tenantId: context.tenantId,
      attendanceDate: period === "daily" ? targetDate : { gte: startDate, lte: endDate },
    };

    if (branchId) {
      const branchEmployees = await prisma.employee.findMany({
        where: { ...employeeWhere },
        select: { id: true },
      });
      attendanceWhere.employeeId = { in: branchEmployees.map((e) => e.id) };
    }

    // Aggregate by status
    const statusCounts = await prisma.attendance.groupBy({
      by: ["status"],
      where: attendanceWhere,
      _count: { status: true },
    });

    // Calculate totals
    const present = statusCounts.find((s) => s.status === "PRESENT")?._count.status || 0;
    const late = statusCounts.find((s) => s.status === "LATE")?._count.status || 0;
    const leave = statusCounts.find((s) => s.status === "LEAVE")?._count.status || 0;
    const totalAttended = present + late;

    // For daily, absent = total employees - attended
    // For weekly/monthly, need to calculate per day
    let absent = 0;
    if (period === "daily") {
      absent = totalEmployees - totalAttended - leave;
    } else {
      // Count working days in period
      let workDays = 0;
      const current = new Date(startDate);
      while (current <= endDate) {
        if (current.getDay() !== 0 && current.getDay() !== 6) {
          workDays++;
        }
        current.setDate(current.getDate() + 1);
      }
      const expectedAttendances = totalEmployees * workDays;
      absent = expectedAttendances - totalAttended - leave;
    }

    // Get work mode breakdown
    const workModeCounts = await prisma.attendance.groupBy({
      by: ["workMode"],
      where: attendanceWhere,
      _count: { workMode: true },
    });

    const wfo = workModeCounts.find((w) => w.workMode === "WFO")?._count.workMode || 0;
    const wfh = workModeCounts.find((w) => w.workMode === "WFH")?._count.workMode || 0;

    // Get late minutes sum
    const lateStats = await prisma.attendance.aggregate({
      where: {
        ...attendanceWhere,
        status: "LATE",
      },
      _sum: { lateMinutes: true },
      _avg: { lateMinutes: true },
      _count: true,
    });

    // Get by branch if not filtered
    let byBranch: Array<{
      branchId: string;
      branchName: string;
      branchCode: string;
      totalEmployees: number;
      present: number;
      late: number;
      attendanceRate: number;
    }> = [];
    if (!branchId) {
      const branches = await prisma.branch.findMany({
        where: { tenantId: context.tenantId, isActive: true },
        select: { id: true, name: true, code: true },
      });

      byBranch = await Promise.all(
        branches.map(async (branch) => {
          const branchEmployeeIds = await prisma.employee.findMany({
            where: { tenantId: context.tenantId, branchId: branch.id, status: "ACTIVE" },
            select: { id: true },
          });

          const branchAttendance = await prisma.attendance.groupBy({
            by: ["status"],
            where: {
              tenantId: context.tenantId,
              employeeId: { in: branchEmployeeIds.map((e) => e.id) },
              attendanceDate: period === "daily" ? targetDate : { gte: startDate, lte: endDate },
            },
            _count: { status: true },
          });

          const branchPresent = branchAttendance.find((s) => s.status === "PRESENT")?._count.status || 0;
          const branchLate = branchAttendance.find((s) => s.status === "LATE")?._count.status || 0;

          return {
            branchId: branch.id,
            branchName: branch.name,
            branchCode: branch.code,
            totalEmployees: branchEmployeeIds.length,
            present: branchPresent,
            late: branchLate,
            attendanceRate: branchEmployeeIds.length > 0
              ? Math.round(((branchPresent + branchLate) / branchEmployeeIds.length) * 100)
              : 0,
          };
        })
      );
    }

    // Calculate overall attendance rate
    const attendanceRate = totalEmployees > 0
      ? Math.round((totalAttended / totalEmployees) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period,
        date: dateStr,
        dateRange: period !== "daily" ? { start: startDate, end: endDate } : undefined,
        summary: {
          totalEmployees,
          present,
          late,
          absent: Math.max(0, absent),
          leave,
          attendanceRate,
          workMode: { wfo, wfh },
        },
        lateStats: {
          count: lateStats._count,
          totalMinutes: lateStats._sum.lateMinutes || 0,
          avgMinutes: Math.round(lateStats._avg.lateMinutes || 0),
        },
        byBranch,
      },
    });
  } catch (error) {
    console.error("Get attendance stats error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

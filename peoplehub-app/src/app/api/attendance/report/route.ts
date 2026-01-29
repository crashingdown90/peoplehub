// @ai:cl - Attendance Report API - Aggregated per-employee attendance for date range (HRD only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/attendance/report - Get aggregated attendance report for date range
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
        { success: false, error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "startDate dan endDate wajib diisi" } },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);

    // Calculate total work days (exclude weekends + holidays)
    const holidays = await prisma.holiday.findMany({
      where: {
        tenantId: context.tenantId,
        holidayDate: { gte: startDate, lte: endDate },
      },
      select: { holidayDate: true },
    });

    const holidaySet = new Set(
      holidays.map((h) => h.holidayDate.toISOString().split("T")[0])
    );

    let totalWorkDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split("T")[0];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(dateStr);
      // Only count past or today work days (future dates not counted)
      if (!isWeekend && !isHoliday && current <= today) {
        totalWorkDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    // Build employee filter
    const employeeWhere: Record<string, unknown> = {
      tenantId: context.tenantId,
      status: "ACTIVE",
    };

    if (departmentId) {
      employeeWhere.departmentId = departmentId;
    }
    if (search) {
      employeeWhere.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get paginated employees
    const [employees, totalEmployees] = await Promise.all([
      prisma.employee.findMany({
        where: employeeWhere,
        select: {
          id: true,
          fullName: true,
          employeeNumber: true,
          department: { select: { name: true } },
          branch: { select: { name: true } },
        },
        orderBy: { fullName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where: employeeWhere }),
    ]);

    type EmployeeItem = (typeof employees)[number];
    const employeeIds = employees.map((e: EmployeeItem) => e.id);

    // Get attendance records grouped by employee and status
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: employeeIds },
        attendanceDate: { gte: startDate, lte: endDate },
      },
      select: {
        employeeId: true,
        status: true,
        lateMinutes: true,
      },
    });

    // Aggregate per employee
    type AttRecord = (typeof attendanceRecords)[number];
    const employeeAttMap = new Map<string, AttRecord[]>();
    for (const record of attendanceRecords) {
      const existing = employeeAttMap.get(record.employeeId) || [];
      existing.push(record);
      employeeAttMap.set(record.employeeId, existing);
    }

    const employeeResults = employees.map((emp: EmployeeItem) => {
      const records = employeeAttMap.get(emp.id) || [];
      const presentDays = records.filter((r) => r.status === "PRESENT").length;
      const lateDays = records.filter((r) => r.status === "LATE").length;
      const leaveDays = records.filter((r) => r.status === "LEAVE").length;
      const absentDays = Math.max(0, totalWorkDays - presentDays - lateDays - leaveDays);
      const totalLateMinutes = records.reduce((sum, r) => sum + r.lateMinutes, 0);
      const attendedDays = presentDays + lateDays;
      const attendanceRate = totalWorkDays > 0 ? Math.round((attendedDays / totalWorkDays) * 100) : 0;

      return {
        employeeId: emp.id,
        fullName: emp.fullName,
        employeeNumber: emp.employeeNumber,
        department: emp.department?.name || "-",
        branch: emp.branch?.name || "-",
        totalWorkDays,
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        totalLateMinutes,
        attendanceRate,
      };
    });

    // Summary across ALL employees (not just paginated)
    const allEmployeeIds = await prisma.employee.findMany({
      where: employeeWhere,
      select: { id: true },
    });

    type AllEmpItem = (typeof allEmployeeIds)[number];

    const allAttendances = await prisma.attendance.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: allEmployeeIds.map((e: AllEmpItem) => e.id) },
        attendanceDate: { gte: startDate, lte: endDate },
      },
      select: { employeeId: true, status: true },
    });

    // Count unique employees per status
    const allEmpAttMap = new Map<string, Set<string>>();
    for (const att of allAttendances) {
      if (!allEmpAttMap.has(att.employeeId)) {
        allEmpAttMap.set(att.employeeId, new Set());
      }
      allEmpAttMap.get(att.employeeId)!.add(att.status);
    }

    // Sum totals across all employees
    let totalPresent = 0;
    let totalLate = 0;
    let totalLeave = 0;
    for (const att of allAttendances) {
      if (att.status === "PRESENT") totalPresent++;
      if (att.status === "LATE") totalLate++;
      if (att.status === "LEAVE") totalLeave++;
    }

    const totalPossible = totalWorkDays * allEmployeeIds.length;
    const totalAttended = totalPresent + totalLate;
    const totalAbsent = Math.max(0, totalPossible - totalAttended - totalLeave);

    const summary = {
      totalEmployees: allEmployeeIds.length,
      totalWorkDays,
      totalPresent,
      totalLate,
      totalAbsent,
      totalLeave,
      avgAttendanceRate: totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        startDate: startDateStr,
        endDate: endDateStr,
        summary,
        employees: employeeResults,
      },
      meta: {
        page,
        limit,
        total: totalEmployees,
        totalPages: Math.ceil(totalEmployees / limit),
      },
    });
  } catch (error) {
    console.error("Get attendance report error:", error);
    return handlePrismaError(error);
  }
}

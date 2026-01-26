// @ai:cl - Branch Attendance API - Get all employees' attendance in branch (HRD only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/attendance/branch - Get branch attendance (for HRD)
export async function GET(request: NextRequest) {
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

    // Check if user is HRD or higher
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses ke halaman ini" },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const branchId = searchParams.get("branchId");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Build employee filter
    const employeeWhere: Record<string, unknown> = {
      tenantId: context.tenantId,
      status: "ACTIVE",
    };

    if (branchId) {
      employeeWhere.branchId = branchId;
    }
    if (departmentId) {
      employeeWhere.departmentId = departmentId;
    }
    if (search) {
      employeeWhere.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get employees with pagination
    const [employees, totalEmployees] = await Promise.all([
      prisma.employee.findMany({
        where: employeeWhere,
        select: {
          id: true,
          fullName: true,
          employeeNumber: true,
          branch: { select: { name: true } },
          department: { select: { name: true } },
          position: { select: { name: true } },
        },
        orderBy: { fullName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where: employeeWhere }),
    ]);

    type EmployeeItem = typeof employees[number];
    const employeeIds = employees.map((e: EmployeeItem) => e.id);

    // Get attendance for employees on the date
    const attendances = await prisma.attendance.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: employeeIds },
        attendanceDate: targetDate,
        ...(status ? { status: status as "PRESENT" | "LATE" | "ABSENT" | "LEAVE" } : {}),
      },
    });

    type AttendanceItem = typeof attendances[number];
    const attendanceMap = new Map<string, AttendanceItem>(attendances.map((a: AttendanceItem) => [a.employeeId, a]));

    // Build result with attendance status
    const results = employees.map((emp: EmployeeItem) => {
      const attendance = attendanceMap.get(emp.id);
      return {
        employeeId: emp.id,
        fullName: emp.fullName,
        employeeNumber: emp.employeeNumber,
        branch: emp.branch?.name || "-",
        department: emp.department?.name || "-",
        position: emp.position?.name || "-",
        status: attendance?.status || "ABSENT",
        clockIn: attendance?.clockIn || null,
        clockOut: attendance?.clockOut || null,
        workMode: attendance?.workMode || null,
        lateMinutes: attendance?.lateMinutes || 0,
        overtimeMinutes: attendance?.overtimeMinutes || 0,
      };
    });

    // Filter by status if provided (for absent we need to check results)
    type ResultItem = typeof results[number];
    let filteredResults = results;
    if (status) {
      filteredResults = results.filter((r: ResultItem) => r.status === status);
    }

    // Get summary for the entire branch (not paginated)
    const allEmployeeIds = await prisma.employee.findMany({
      where: employeeWhere,
      select: { id: true },
    });

    type AllEmpItem = typeof allEmployeeIds[number];

    const allAttendances = await prisma.attendance.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: allEmployeeIds.map((e: AllEmpItem) => e.id) },
        attendanceDate: targetDate,
      },
      select: { status: true },
    });

    type AllAttItem = typeof allAttendances[number];

    const summary = {
      totalEmployees: allEmployeeIds.length,
      present: allAttendances.filter((a: AllAttItem) => a.status === "PRESENT").length,
      late: allAttendances.filter((a: AllAttItem) => a.status === "LATE").length,
      absent: allEmployeeIds.length - allAttendances.length,
      leave: allAttendances.filter((a: AllAttItem) => a.status === "LEAVE").length,
      attendanceRate: allEmployeeIds.length > 0
        ? Math.round((allAttendances.length / allEmployeeIds.length) * 100)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        date: date,
        summary,
        employees: filteredResults,
      },
      meta: {
        page,
        limit,
        total: totalEmployees,
        totalPages: Math.ceil(totalEmployees / limit),
      },
    });
  } catch (error) {
    console.error("Get branch attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      },
      { status: 500 }
    );
  }
}

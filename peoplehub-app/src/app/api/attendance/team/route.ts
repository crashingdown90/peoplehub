// @ai:cl - Team Attendance API - Get subordinates' attendance (Manager only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/attendance/team - Get team attendance (for managers)
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" },
        },
        { status: 401 }
      );
    }

    // Check if user is manager or higher
    if (!["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get subordinates (employees where managerId = current employee)
    const subordinates = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        managerId: context.employeeId,
        status: "ACTIVE",
      },
      select: { id: true, fullName: true, employeeNumber: true },
    });

    type SubItem = typeof subordinates[number];
    const subordinateIds = subordinates.map((s: SubItem) => s.id);

    if (subordinateIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          date: date,
          teamSize: 0,
          summary: { present: 0, late: 0, absent: 0, leave: 0 },
          members: [],
        },
        meta: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Get attendance for all subordinates on the date
    const attendances = await prisma.attendance.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: subordinateIds },
        attendanceDate: targetDate,
      },
      include: {
        employee: {
          select: { id: true, fullName: true, employeeNumber: true },
        },
      },
    });

    // Build member list with attendance status
    type AttItem = typeof attendances[number];
    const attendanceMap = new Map<string, AttItem>(attendances.map((a: AttItem) => [a.employeeId, a]));

    const members = subordinates.map((emp: SubItem) => {
      const attendance = attendanceMap.get(emp.id);
      return {
        employeeId: emp.id,
        fullName: emp.fullName,
        employeeNumber: emp.employeeNumber,
        status: attendance?.status || "ABSENT",
        clockIn: attendance?.clockIn || null,
        clockOut: attendance?.clockOut || null,
        workMode: attendance?.workMode || null,
        lateMinutes: attendance?.lateMinutes || 0,
      };
    });

    // Calculate summary
    type MemberItem = typeof members[number];
    const summary = {
      present: members.filter((m: MemberItem) => m.status === "PRESENT").length,
      late: members.filter((m: MemberItem) => m.status === "LATE").length,
      absent: members.filter((m: MemberItem) => m.status === "ABSENT").length,
      leave: members.filter((m: MemberItem) => m.status === "LEAVE").length,
    };

    // Paginate
    const paginatedMembers = members.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        date: date,
        teamSize: subordinates.length,
        summary,
        members: paginatedMembers,
      },
      meta: {
        page,
        limit,
        total: members.length,
        totalPages: Math.ceil(members.length / limit),
      },
    });
  } catch (error) {
    console.error("Get team attendance error:", error);
    return handlePrismaError(error);
  }
}

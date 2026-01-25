// @ai:cl - My Attendance API - Get current user's attendance history

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/attendance/me - Get my attendance history
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const workMode = searchParams.get("workMode");

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
      employeeId: context.employeeId,
    };

    if (startDate) {
      where.attendanceDate = {
        ...(where.attendanceDate as object || {}),
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      where.attendanceDate = {
        ...(where.attendanceDate as object || {}),
        lte: new Date(endDate),
      };
    }
    if (status) {
      where.status = status;
    }
    if (workMode) {
      where.workMode = workMode;
    }

    // Get attendances with pagination
    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { attendanceDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          schedule: {
            include: { shift: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    // Calculate summary stats
    const summaryWhere = {
      tenantId: context.tenantId,
      employeeId: context.employeeId,
      attendanceDate: {
        gte: startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        lte: endDate ? new Date(endDate) : new Date(),
      },
    };

    const summaryData = await prisma.attendance.groupBy({
      by: ["status"],
      where: summaryWhere,
      _count: { status: true },
    });

    const summary = {
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
    };

    for (const item of summaryData) {
      summary.total += item._count.status;
      switch (item.status) {
        case "PRESENT":
          summary.present = item._count.status;
          break;
        case "LATE":
          summary.late = item._count.status;
          break;
        case "ABSENT":
          summary.absent = item._count.status;
          break;
        case "LEAVE":
          summary.leave = item._count.status;
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        attendances: attendances.map((a) => ({
          id: a.id,
          date: a.attendanceDate,
          clockIn: a.clockIn,
          clockOut: a.clockOut,
          workMode: a.workMode,
          status: a.status,
          lateMinutes: a.lateMinutes,
          overtimeMinutes: a.overtimeMinutes,
          shiftName: a.schedule?.shift?.name || "Regular",
        })),
        summary,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      },
      { status: 500 }
    );
  }
}

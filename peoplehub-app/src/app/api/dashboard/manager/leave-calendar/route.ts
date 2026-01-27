// @ai:cl - Team leave calendar API for manager dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/manager/leave-calendar - Get team leave calendar
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
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get subordinates
    const subordinates = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        managerId: context.employeeId,
        status: "ACTIVE",
      },
      select: { id: true, fullName: true, employeeNumber: true },
    });

    if (subordinates.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          month,
          year,
          events: [],
          summary: { totalLeaves: 0, pending: 0, approved: 0 },
        },
      });
    }

    type SubItem = typeof subordinates[number];
    const subordinateIds = subordinates.map((s: SubItem) => s.id);
    const subordinateMap = new Map<string, SubItem>(subordinates.map((s: SubItem) => [s.id, s]));

    // Get leave requests that overlap with the month
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: subordinateIds },
        status: { in: ["PENDING", "APPROVED_MANAGER", "APPROVED"] },
        OR: [
          {
            startDate: { gte: startDate, lte: endDate },
          },
          {
            endDate: { gte: startDate, lte: endDate },
          },
          {
            startDate: { lte: startDate },
            endDate: { gte: endDate },
          },
        ],
      },
      include: {
        leaveType: { select: { name: true, code: true } },
      },
      orderBy: { startDate: "asc" },
    });

    // Get holidays in the month
    const holidays = await prisma.holiday.findMany({
      where: {
        tenantId: context.tenantId,
        holidayDate: { gte: startDate, lte: endDate },
      },
      orderBy: { holidayDate: "asc" },
    });

    // Build calendar events
    const events = [
      ...leaveRequests.map((lr) => {
        const employee = subordinateMap.get(lr.employeeId);
        return {
          id: lr.id,
          type: "LEAVE" as const,
          title: `${employee?.fullName} - ${lr.leaveType.name}`,
          employeeId: lr.employeeId,
          employeeName: employee?.fullName || "",
          leaveType: lr.leaveType.code,
          startDate: lr.startDate,
          endDate: lr.endDate,
          totalDays: lr.totalDays,
          status: lr.status,
        };
      }),
      ...holidays.map((h) => ({
        id: h.id,
        type: "HOLIDAY" as const,
        title: h.name,
        date: h.holidayDate,
        isNational: h.isNational,
      })),
    ];

    // Summary
    const summary = {
      totalLeaves: leaveRequests.length,
      pending: leaveRequests.filter((l) => l.status === "PENDING").length,
      approved: leaveRequests.filter((l) =>
        ["APPROVED", "APPROVED_MANAGER"].includes(l.status)
      ).length,
      totalDays: leaveRequests.reduce((sum, l) => sum + l.totalDays, 0),
      holidays: holidays.length,
    };

    // Build day-by-day view for the calendar
    const daysInMonth = endDate.getDate();
    const calendarDays: { date: string; dayOfWeek: number; leaves: { employeeId: string; employeeName: string; leaveType: string; status: string }[]; holiday: { name: string; isNational: boolean } | null; isWeekend: boolean }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dateStr = currentDate.toISOString().split("T")[0];

      // Find leaves on this day
      const dayLeaves = leaveRequests.filter(
        (l) => l.startDate <= currentDate && l.endDate >= currentDate
      );

      // Find holiday on this day
      const dayHoliday = holidays.find(
        (h) => h.holidayDate.toISOString().split("T")[0] === dateStr
      );

      calendarDays.push({
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        leaves: dayLeaves.map((l) => ({
          employeeId: l.employeeId,
          employeeName: subordinateMap.get(l.employeeId)?.fullName || "",
          leaveType: l.leaveType.code,
          status: l.status,
        })),
        holiday: dayHoliday ? { name: dayHoliday.name, isNational: dayHoliday.isNational } : null,
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        monthName: new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
        events,
        calendarDays,
        summary,
      },
    });
  } catch (error) {
    console.error("Get leave calendar error:", error);
    return handlePrismaError(error);
  }
}

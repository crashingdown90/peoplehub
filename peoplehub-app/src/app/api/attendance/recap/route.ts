import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/attendance/recap - Get monthly attendance recap
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
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        // Get date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        // Get attendances for the month
        const attendances = await prisma.attendance.findMany({
            where: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                attendanceDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { attendanceDate: "asc" },
        });

        // Get holidays for the month
        const holidays = await prisma.holiday.findMany({
            where: {
                tenantId: context.tenantId,
                holidayDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // Get approved leaves for the month
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                status: "APPROVED",
                OR: [
                    { startDate: { lte: endDate }, endDate: { gte: startDate } },
                ],
            },
            include: {
                leaveType: { select: { name: true } },
            },
        });

        // Calculate statistics
        type AttItem = typeof attendances[number];
        type HolidayItem = typeof holidays[number];
        type LeaveItem = typeof leaves[number];

        let totalWorkDays = 0;
        let totalPresent = 0;
        let totalLate = 0;
        let totalAbsent = 0;
        let totalLeave = 0;
        const totalHolidays = holidays.length;
        let totalLateMinutes = 0;
        let totalOvertimeMinutes = 0;

        const dailyRecords: Array<{
            date: string;
            dayName: string;
            status: string;
            clockIn: string | null;
            clockOut: string | null;
            workMode: string | null;
            lateMinutes: number;
            overtimeMinutes: number;
            note: string | null;
        }> = [];

        // Iterate through each day of the month
        const current = new Date(startDate);
        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            const dateStr = current.toISOString().split("T")[0];
            const dayName = current.toLocaleDateString("id-ID", { weekday: "long" });

            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidays.some((h: HolidayItem) =>
                h.holidayDate.toISOString().split("T")[0] === dateStr
            );
            const holidayName = holidays.find((h: HolidayItem) =>
                h.holidayDate.toISOString().split("T")[0] === dateStr
            )?.name;

            // Check if on leave
            const leaveRecord = leaves.find((l: LeaveItem) => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                return current >= start && current <= end;
            });

            // Get attendance for this day
            const attendance = attendances.find((a: AttItem) =>
                a.attendanceDate.toISOString().split("T")[0] === dateStr
            );

            if (!isWeekend && !isHoliday) {
                totalWorkDays++;

                if (leaveRecord) {
                    totalLeave++;
                    dailyRecords.push({
                        date: dateStr,
                        dayName,
                        status: "LEAVE",
                        clockIn: null,
                        clockOut: null,
                        workMode: null,
                        lateMinutes: 0,
                        overtimeMinutes: 0,
                        note: leaveRecord.leaveType.name,
                    });
                } else if (attendance) {
                    if (attendance.status === "LATE") {
                        totalLate++;
                    }
                    totalPresent++;
                    totalLateMinutes += attendance.lateMinutes;
                    totalOvertimeMinutes += attendance.overtimeMinutes;

                    dailyRecords.push({
                        date: dateStr,
                        dayName,
                        status: attendance.status,
                        clockIn: attendance.clockIn?.toISOString() || null,
                        clockOut: attendance.clockOut?.toISOString() || null,
                        workMode: attendance.workMode,
                        lateMinutes: attendance.lateMinutes,
                        overtimeMinutes: attendance.overtimeMinutes,
                        note: null,
                    });
                } else if (current < new Date()) {
                    // Past date without attendance = absent
                    totalAbsent++;
                    dailyRecords.push({
                        date: dateStr,
                        dayName,
                        status: "ABSENT",
                        clockIn: null,
                        clockOut: null,
                        workMode: null,
                        lateMinutes: 0,
                        overtimeMinutes: 0,
                        note: null,
                    });
                } else {
                    // Future date
                    dailyRecords.push({
                        date: dateStr,
                        dayName,
                        status: "SCHEDULED",
                        clockIn: null,
                        clockOut: null,
                        workMode: null,
                        lateMinutes: 0,
                        overtimeMinutes: 0,
                        note: null,
                    });
                }
            } else {
                dailyRecords.push({
                    date: dateStr,
                    dayName,
                    status: isHoliday ? "HOLIDAY" : "WEEKEND",
                    clockIn: null,
                    clockOut: null,
                    workMode: null,
                    lateMinutes: 0,
                    overtimeMinutes: 0,
                    note: holidayName || null,
                });
            }

            current.setDate(current.getDate() + 1);
        }

        return NextResponse.json({
            success: true,
            data: {
                period: { year, month, monthName: new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long" }) },
                summary: {
                    totalWorkDays,
                    totalPresent,
                    totalLate,
                    totalAbsent,
                    totalLeave,
                    totalHolidays,
                    totalLateMinutes,
                    totalOvertimeMinutes,
                    attendanceRate: totalWorkDays > 0 ? Math.round((totalPresent / totalWorkDays) * 100) : 0,
                },
                records: dailyRecords,
            },
        });
    } catch (error) {
        console.error("Get attendance recap error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

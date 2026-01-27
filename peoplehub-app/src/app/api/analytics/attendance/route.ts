import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/analytics/attendance - Attendance analytics
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

        // Date range
        const startDate = month
            ? new Date(year, month - 1, 1)
            : new Date(year, 0, 1);
        const endDate = month
            ? new Date(year, month, 0)
            : new Date(year, 11, 31);

        // Get all attendances in range
        const attendances = await prisma.attendance.findMany({
            where: {
                tenantId: context.tenantId,
                attendanceDate: { gte: startDate, lte: endDate },
            },
            select: {
                attendanceDate: true,
                status: true,
                lateMinutes: true,
                overtimeMinutes: true,
                workMode: true,
            },
        });

        // Daily stats grouped by date
        const dailyStats: Record<string, { present: number; late: number; wfo: number; wfh: number }> = {};

        attendances.forEach((a: typeof attendances[number]) => {
            const dateKey = a.attendanceDate.toISOString().split("T")[0];
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { present: 0, late: 0, wfo: 0, wfh: 0 };
            }
            if (a.status === "PRESENT" || a.status === "LATE") {
                dailyStats[dateKey].present++;
            }
            if (a.status === "LATE") {
                dailyStats[dateKey].late++;
            }
            if (a.workMode === "WFO") {
                dailyStats[dateKey].wfo++;
            } else if (a.workMode === "WFH") {
                dailyStats[dateKey].wfh++;
            }
        });

        // Monthly summary
        const monthlyStats: Record<string, { present: number; late: number; totalLateMinutes: number; totalOvertime: number }> = {};

        attendances.forEach((a: typeof attendances[number]) => {
            const monthKey = a.attendanceDate.toISOString().slice(0, 7);
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { present: 0, late: 0, totalLateMinutes: 0, totalOvertime: 0 };
            }
            if (a.status === "PRESENT" || a.status === "LATE") {
                monthlyStats[monthKey].present++;
            }
            if (a.status === "LATE") {
                monthlyStats[monthKey].late++;
                monthlyStats[monthKey].totalLateMinutes += a.lateMinutes;
            }
            monthlyStats[monthKey].totalOvertime += a.overtimeMinutes;
        });

        // Get total employees for rate calculation
        const totalEmployees = await prisma.employee.count({
            where: { tenantId: context.tenantId, status: "ACTIVE" },
        });

        // Calculate overall stats
        type AttendanceItem = typeof attendances[number];
        const totalPresent = attendances.filter((a: AttendanceItem) => a.status === "PRESENT" || a.status === "LATE").length;
        const totalLate = attendances.filter((a: AttendanceItem) => a.status === "LATE").length;
        const totalLateMinutes = attendances.reduce((sum: number, a: AttendanceItem) => sum + a.lateMinutes, 0);
        const totalOvertime = attendances.reduce((sum: number, a: AttendanceItem) => sum + a.overtimeMinutes, 0);
        const wfoCount = attendances.filter((a: AttendanceItem) => a.workMode === "WFO").length;
        const wfhCount = attendances.filter((a: AttendanceItem) => a.workMode === "WFH").length;

        return NextResponse.json({
            success: true,
            data: {
                period: { year, month, startDate, endDate },
                overview: {
                    totalEmployees,
                    totalAttendances: attendances.length,
                    totalPresent,
                    totalLate,
                    lateRate: totalPresent > 0 ? Math.round((totalLate / totalPresent) * 100) : 0,
                    totalLateMinutes,
                    avgLateMinutes: totalLate > 0 ? Math.round(totalLateMinutes / totalLate) : 0,
                    totalOvertimeHours: Math.round(totalOvertime / 60),
                    wfoRate: attendances.length > 0 ? Math.round((wfoCount / attendances.length) * 100) : 0,
                    wfhRate: attendances.length > 0 ? Math.round((wfhCount / attendances.length) * 100) : 0,
                },
                daily: Object.entries(dailyStats).map(([date, stats]) => ({
                    date,
                    ...stats,
                    attendanceRate: totalEmployees > 0 ? Math.round((stats.present / totalEmployees) * 100) : 0,
                })).sort((a, b) => a.date.localeCompare(b.date)),
                monthly: Object.entries(monthlyStats).map(([month, stats]) => ({
                    month,
                    monthName: new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                    ...stats,
                    avgOvertimeHours: stats.present > 0 ? Math.round(stats.totalOvertime / stats.present / 60) : 0,
                })).sort((a, b) => a.month.localeCompare(b.month)),
            },
        });
    } catch (error) {
        console.error("Get attendance analytics error:", error);
        return handlePrismaError(error);
    }
}

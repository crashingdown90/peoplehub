import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/attendance/overtime - Get overtime summary
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
        const month = searchParams.get("month");

        let startDate: Date;
        let endDate: Date;

        if (month) {
            startDate = new Date(year, parseInt(month) - 1, 1);
            endDate = new Date(year, parseInt(month), 0);
        } else {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
        }

        // Get attendances with overtime
        const attendances = await prisma.attendance.findMany({
            where: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                attendanceDate: { gte: startDate, lte: endDate },
                overtimeMinutes: { gt: 0 },
            },
            orderBy: { attendanceDate: "desc" },
            select: {
                id: true,
                attendanceDate: true,
                clockIn: true,
                clockOut: true,
                overtimeMinutes: true,
            },
        });

        type AttItem = typeof attendances[number];
        const totalOvertimeMinutes = attendances.reduce((sum: number, a: AttItem) => sum + a.overtimeMinutes, 0);
        const totalOvertimeHours = Math.floor(totalOvertimeMinutes / 60);
        const remainingMinutes = totalOvertimeMinutes % 60;

        // Group by month
        const byMonth: Record<string, { month: string; minutes: number; count: number }> = {};

        attendances.forEach((a: AttItem) => {
            const monthKey = a.attendanceDate.toISOString().slice(0, 7);
            if (!byMonth[monthKey]) {
                byMonth[monthKey] = {
                    month: new Date(monthKey).toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                    minutes: 0,
                    count: 0,
                };
            }
            byMonth[monthKey].minutes += a.overtimeMinutes;
            byMonth[monthKey].count++;
        });

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalMinutes: totalOvertimeMinutes,
                    totalHours: `${totalOvertimeHours}j ${remainingMinutes}m`,
                    totalDays: attendances.length,
                },
                byMonth: Object.values(byMonth),
                records: attendances.map((a: AttItem) => ({
                    id: a.id,
                    date: a.attendanceDate,
                    clockIn: a.clockIn,
                    clockOut: a.clockOut,
                    overtimeMinutes: a.overtimeMinutes,
                    overtimeFormatted: `${Math.floor(a.overtimeMinutes / 60)}j ${a.overtimeMinutes % 60}m`,
                })),
            },
        });
    } catch (error) {
        console.error("Get overtime error:", error);
        return handlePrismaError(error);
    }
}

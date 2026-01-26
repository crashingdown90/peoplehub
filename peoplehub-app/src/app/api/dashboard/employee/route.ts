// @ai:cl - Employee dashboard data API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/employee - Get employee-specific dashboard data
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
                { status: 401 }
            );
        }

        const { tenantId, employeeId, userId } = context;

        if (!employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "NO_EMPLOYEE", message: "Data karyawan tidak ditemukan" } },
                { status: 404 }
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);

        // Get employee data with relations
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, tenantId },
            include: {
                branch: { select: { id: true, name: true, code: true } },
                department: { select: { id: true, name: true, code: true } },
                position: { select: { id: true, name: true, level: true } },
                manager: { select: { id: true, fullName: true } },
            },
        });

        // Today's attendance
        const todayAttendance = await prisma.attendance.findUnique({
            where: {
                tenantId_employeeId_attendanceDate: {
                    tenantId,
                    employeeId,
                    attendanceDate: today,
                },
            },
        });

        // Month attendance count
        const monthAttendance = await prisma.attendance.count({
            where: {
                tenantId,
                employeeId,
                attendanceDate: { gte: monthStart, lte: monthEnd },
                status: { in: ["PRESENT", "LATE"] },
            },
        });

        // Late count this month
        const lateCount = await prisma.attendance.count({
            where: {
                tenantId,
                employeeId,
                attendanceDate: { gte: monthStart, lte: monthEnd },
                status: "LATE",
            },
        });

        // Leave balance (all types)
        const leaveBalances = await prisma.leaveBalance.findMany({
            where: { tenantId, employeeId, year: currentYear },
            include: { leaveType: { select: { name: true, code: true } } },
        });

        // Pending submissions
        const pendingLeaves = await prisma.leaveRequest.count({
            where: { tenantId, employeeId, status: "PENDING" },
        });

        const pendingCorrections = await prisma.attendanceCorrection.count({
            where: { tenantId, employeeId, status: "PENDING" },
        });

        const pendingReimburse = await prisma.reimburseRequest.count({
            where: { tenantId, employeeId, status: "PENDING" },
        });

        // Latest payslip
        const latestPayslip = await prisma.payslip.findFirst({
            where: { tenantId, employeeId, status: "PUBLISHED" },
            orderBy: { period: "desc" },
            select: { period: true, netSalary: true, grossSalary: true },
        });

        // Upcoming schedule (next 7 days)
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcomingSchedules = await prisma.schedule.findMany({
            where: {
                employeeId,
                scheduleDate: { gte: today, lte: nextWeek },
            },
            include: { shift: { select: { name: true, startTime: true, endTime: true } } },
            orderBy: { scheduleDate: "asc" },
            take: 7,
        });

        // Unread notifications
        const unreadNotifications = await prisma.notification.count({
            where: { tenantId, userId, isRead: false },
        });

        return NextResponse.json({
            success: true,
            data: {
                employee: {
                    id: employee?.id,
                    fullName: employee?.fullName,
                    employeeNumber: employee?.employeeNumber,
                    branch: employee?.branch,
                    department: employee?.department,
                    position: employee?.position,
                    manager: employee?.manager,
                    workMode: employee?.workMode,
                },
                today: {
                    hasClockedIn: !!todayAttendance?.clockIn,
                    hasClockedOut: !!todayAttendance?.clockOut,
                    clockIn: todayAttendance?.clockIn,
                    clockOut: todayAttendance?.clockOut,
                    status: todayAttendance?.status || "NOT_CLOCKED_IN",
                    lateMinutes: todayAttendance?.lateMinutes || 0,
                    workMode: todayAttendance?.workMode,
                },
                month: {
                    presentDays: monthAttendance,
                    lateDays: lateCount,
                    monthName: today.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                },
                leave: {
                    balances: leaveBalances.map((lb: typeof leaveBalances[number]) => ({
                        type: lb.leaveType.name,
                        code: lb.leaveType.code,
                        initial: lb.initialBalance,
                        used: lb.usedBalance,
                        remaining: lb.remainingBalance,
                    })),
                    totalRemaining: leaveBalances.reduce((acc: number, lb: typeof leaveBalances[number]) => acc + lb.remainingBalance, 0),
                },
                pendingSubmissions: {
                    leave: pendingLeaves,
                    correction: pendingCorrections,
                    reimburse: pendingReimburse,
                    total: pendingLeaves + pendingCorrections + pendingReimburse,
                },
                payslip: latestPayslip
                    ? {
                          period: latestPayslip.period,
                          netSalary: Number(latestPayslip.netSalary),
                          grossSalary: Number(latestPayslip.grossSalary),
                      }
                    : null,
                upcomingSchedules: upcomingSchedules.map((s: typeof upcomingSchedules[number]) => ({
                    date: s.scheduleDate,
                    shift: s.shift,
                    workMode: s.workMode,
                    isHoliday: s.isHoliday,
                })),
                unreadNotifications,
            },
        });
    } catch (error) {
        console.error("Get employee dashboard error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// @ai:cl - Manager dashboard data API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/manager - Get manager-specific dashboard data (team overview)
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
                { status: 401 }
            );
        }

        // Check if user is manager or above
        if (!hasRole(context, ["MANAGER", "HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak. Hanya untuk Manager." } },
                { status: 403 }
            );
        }

        const { tenantId, employeeId } = context;

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

        // Get subordinates
        const subordinates = await prisma.employee.findMany({
            where: { tenantId, managerId: employeeId, status: "ACTIVE" },
            select: {
                id: true,
                fullName: true,
                employeeNumber: true,
                position: { select: { name: true } },
                department: { select: { name: true } },
            },
        });

        const subordinateIds = subordinates.map((s) => s.id);

        // Team attendance today
        const todayAttendance = await prisma.attendance.findMany({
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                attendanceDate: today,
            },
            select: {
                employeeId: true,
                status: true,
                clockIn: true,
                clockOut: true,
                lateMinutes: true,
            },
        });

        const presentCount = todayAttendance.filter((a) => ["PRESENT", "LATE"].includes(a.status)).length;
        const lateCount = todayAttendance.filter((a) => a.status === "LATE").length;
        const absentCount = subordinates.length - presentCount;

        // Pending leave approvals from subordinates
        const pendingLeaveRequests = await prisma.leaveRequest.findMany({
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                status: "PENDING",
            },
            include: {
                employee: { select: { fullName: true, employeeNumber: true } },
                leaveType: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // Pending attendance corrections from subordinates
        const pendingCorrections = await prisma.attendanceCorrection.findMany({
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                status: "PENDING",
            },
            include: {
                employee: { select: { fullName: true, employeeNumber: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // Team leave calendar (upcoming leaves this month)
        const upcomingLeaves = await prisma.leaveRequest.findMany({
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                status: { in: ["APPROVED", "APPROVED_MANAGER", "APPROVED_HRD"] },
                startDate: { gte: today },
            },
            include: {
                employee: { select: { fullName: true } },
                leaveType: { select: { name: true } },
            },
            orderBy: { startDate: "asc" },
            take: 10,
        });

        // Team attendance summary this month
        const monthAttendance = await prisma.attendance.groupBy({
            by: ["status"],
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                attendanceDate: { gte: monthStart, lte: today },
            },
            _count: true,
        });

        // Build subordinates with today's status
        const subordinatesWithStatus = subordinates.map((sub) => {
            const attendance = todayAttendance.find((a) => a.employeeId === sub.id);
            return {
                ...sub,
                todayStatus: attendance?.status || "NOT_CLOCKED_IN",
                clockIn: attendance?.clockIn,
                clockOut: attendance?.clockOut,
                lateMinutes: attendance?.lateMinutes || 0,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                teamSummary: {
                    totalSubordinates: subordinates.length,
                    todayPresent: presentCount,
                    todayLate: lateCount,
                    todayAbsent: absentCount,
                    attendanceRate: subordinates.length > 0 ? Math.round((presentCount / subordinates.length) * 100) : 0,
                },
                monthSummary: monthAttendance.reduce(
                    (acc, item) => {
                        acc[item.status.toLowerCase()] = item._count;
                        return acc;
                    },
                    {} as Record<string, number>
                ),
                pendingApprovals: {
                    leave: pendingLeaveRequests.length,
                    correction: pendingCorrections.length,
                    total: pendingLeaveRequests.length + pendingCorrections.length,
                },
                pendingLeaveRequests: pendingLeaveRequests.map((lr) => ({
                    id: lr.id,
                    employee: lr.employee.fullName,
                    employeeNumber: lr.employee.employeeNumber,
                    leaveType: lr.leaveType.name,
                    startDate: lr.startDate,
                    endDate: lr.endDate,
                    totalDays: lr.totalDays,
                    reason: lr.reason,
                    createdAt: lr.createdAt,
                })),
                pendingCorrections: pendingCorrections.map((c) => ({
                    id: c.id,
                    employee: c.employee.fullName,
                    employeeNumber: c.employee.employeeNumber,
                    date: c.attendanceDate,
                    requestedClockIn: c.requestedClockIn,
                    requestedClockOut: c.requestedClockOut,
                    reason: c.reason,
                    createdAt: c.createdAt,
                })),
                upcomingLeaves: upcomingLeaves.map((l) => ({
                    employee: l.employee.fullName,
                    leaveType: l.leaveType.name,
                    startDate: l.startDate,
                    endDate: l.endDate,
                    totalDays: l.totalDays,
                })),
                subordinates: subordinatesWithStatus,
            },
        });
    } catch (error) {
        console.error("Get manager dashboard error:", error);
        return handlePrismaError(error);
    }
}

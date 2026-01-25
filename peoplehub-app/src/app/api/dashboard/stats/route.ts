// @ai:perf - Dashboard stats with caching and parallel queries
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { getCache, CacheKeys, CacheTTL, CacheTags } from "@/lib/cache";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const cache = getCache();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = today.toISOString().split("T")[0];

        const isHrdOrAdmin = hasRole(context, ["HRD", "SUPER_ADMIN"]);
        const isManager = hasRole(context, ["MANAGER"]);

        // Build cache key based on role and user
        const cacheKey = `dashboard:${context.tenantId}:${context.role}:${context.employeeId || "none"}:${todayKey}`;

        // Try cache first
        const cached = await cache.get<{
            role: string;
            employee: ReturnType<typeof formatEmployeeStats> | null;
            admin: ReturnType<typeof formatAdminStats> | null;
            manager: ReturnType<typeof formatManagerStats> | null;
        }>(cacheKey);

        if (cached) {
            return NextResponse.json({ success: true, data: cached });
        }

        // Execute queries in parallel based on role
        const [employeeStats, adminStats, managerStats] = await Promise.all([
            context.employeeId ? getEmployeeStats(context.tenantId, context.employeeId, today) : Promise.resolve(null),
            isHrdOrAdmin ? getAdminStats(context.tenantId, today) : Promise.resolve(null),
            (isManager && context.employeeId) ? getManagerStats(context.tenantId, context.employeeId, today) : Promise.resolve(null),
        ]);

        const result = {
            role: context.role,
            employee: employeeStats,
            admin: adminStats,
            manager: managerStats,
        };

        // Cache with appropriate TTL based on role
        // Admin stats change more frequently, so shorter TTL
        const ttl = isHrdOrAdmin ? CacheTTL.SHORT : CacheTTL.MEDIUM;
        await cache.set(cacheKey, result, {
            ttl,
            tags: [
                CacheTags.dashboard(context.tenantId),
                ...(context.employeeId ? [CacheTags.employee(context.tenantId)] : []),
            ],
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// Type helpers for formatting
function formatEmployeeStats(data: Awaited<ReturnType<typeof getEmployeeStatsRaw>>) {
    return data;
}
function formatAdminStats(data: Awaited<ReturnType<typeof getAdminStatsRaw>>) {
    return data;
}
function formatManagerStats(data: Awaited<ReturnType<typeof getManagerStatsRaw>>) {
    return data;
}

async function getEmployeeStats(tenantId: string, employeeId: string, today: Date) {
    return getEmployeeStatsRaw(tenantId, employeeId, today);
}

async function getEmployeeStatsRaw(tenantId: string, employeeId: string, today: Date) {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    // Execute all queries in parallel
    const [
        todayAttendance,
        monthAttendance,
        pendingLeaves,
        annualLeave,
        latestPayslip,
    ] = await Promise.all([
        // Today's attendance
        prisma.attendance.findUnique({
            where: { tenantId_employeeId_attendanceDate: { tenantId, employeeId, attendanceDate: today } },
        }),
        // Month attendance count
        prisma.attendance.count({
            where: {
                tenantId,
                employeeId,
                attendanceDate: { gte: monthStart, lte: monthEnd },
                status: { in: ["PRESENT", "LATE"] },
            },
        }),
        // Pending leave requests
        prisma.leaveRequest.count({
            where: { tenantId, employeeId, status: "PENDING" },
        }),
        // Leave balance (annual)
        prisma.leaveBalance.findFirst({
            where: {
                tenantId,
                employeeId,
                year: currentYear,
                leaveType: { code: "ANNUAL" },
            },
        }),
        // Latest payslip
        prisma.payslip.findFirst({
            where: { tenantId, employeeId, status: "PUBLISHED" },
            orderBy: { period: "desc" },
            select: { period: true, netSalary: true },
        }),
    ]);

    return {
        today: {
            hasClockedIn: !!todayAttendance?.clockIn,
            hasClockedOut: !!todayAttendance?.clockOut,
            clockIn: todayAttendance?.clockIn,
            clockOut: todayAttendance?.clockOut,
            status: todayAttendance?.status || "NOT_CLOCKED_IN",
        },
        month: {
            presentDays: monthAttendance,
            monthName: today.toLocaleDateString("id-ID", { month: "long" }),
        },
        leave: {
            pending: pendingLeaves,
            balance: annualLeave?.remainingBalance || 0,
        },
        payslip: latestPayslip ? {
            period: latestPayslip.period,
            netSalary: Number(latestPayslip.netSalary),
        } : null,
    };
}

async function getAdminStats(tenantId: string, today: Date) {
    return getAdminStatsRaw(tenantId, today);
}

async function getAdminStatsRaw(tenantId: string, today: Date) {
    // Execute all queries in parallel
    const [
        totalEmployees,
        pendingRegistrations,
        todayPresent,
        todayLate,
        pendingLeaves,
        byDepartment,
    ] = await Promise.all([
        // Total employees
        prisma.employee.count({
            where: { tenantId, status: "ACTIVE" },
        }),
        // Pending registrations
        prisma.user.count({
            where: { tenantId, status: "PENDING" },
        }),
        // Today's attendance (present + late)
        prisma.attendance.count({
            where: {
                tenantId,
                attendanceDate: today,
                status: { in: ["PRESENT", "LATE"] },
            },
        }),
        // Today's late only
        prisma.attendance.count({
            where: { tenantId, attendanceDate: today, status: "LATE" },
        }),
        // Pending leave approvals
        prisma.leaveRequest.count({
            where: { tenantId, status: { in: ["PENDING", "APPROVED_MANAGER"] } },
        }),
        // Employees by department
        prisma.employee.groupBy({
            by: ["departmentId"],
            where: { tenantId, status: "ACTIVE" },
            _count: true,
        }),
    ]);

    // Get department names (separate query to avoid N+1)
    const departments = await prisma.department.findMany({
        where: { tenantId, id: { in: byDepartment.map(d => d.departmentId || "") } },
        select: { id: true, name: true },
    });

    return {
        overview: {
            totalEmployees,
            pendingRegistrations,
            todayPresent,
            todayLate,
            pendingLeaveApprovals: pendingLeaves,
            attendanceRate: totalEmployees > 0 ? Math.round((todayPresent / totalEmployees) * 100) : 0,
        },
        byDepartment: byDepartment.map(d => ({
            department: departments.find(dept => dept.id === d.departmentId)?.name || "Unknown",
            count: d._count,
        })),
    };
}

async function getManagerStats(tenantId: string, managerId: string, today: Date) {
    return getManagerStatsRaw(tenantId, managerId, today);
}

async function getManagerStatsRaw(tenantId: string, managerId: string, today: Date) {
    // Get subordinates first (needed for subsequent queries)
    const subordinates = await prisma.employee.findMany({
        where: { tenantId, managerId, status: "ACTIVE" },
        select: { id: true },
    });

    const subordinateIds = subordinates.map(s => s.id);

    // If no subordinates, return early
    if (subordinateIds.length === 0) {
        return {
            totalSubordinates: 0,
            presentToday: 0,
            absentToday: 0,
            pendingLeaveApprovals: 0,
        };
    }

    // Execute remaining queries in parallel
    const [presentToday, pendingLeaves] = await Promise.all([
        // Today's present subordinates
        prisma.attendance.count({
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                attendanceDate: today,
                status: { in: ["PRESENT", "LATE"] },
            },
        }),
        // Pending leave approvals from subordinates
        prisma.leaveRequest.count({
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                status: "PENDING",
            },
        }),
    ]);

    return {
        totalSubordinates: subordinates.length,
        presentToday,
        absentToday: subordinates.length - presentToday,
        pendingLeaveApprovals: pendingLeaves,
    };
}

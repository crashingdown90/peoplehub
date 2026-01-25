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
        const [userProfile, employeeStats, adminStats, managerStats] = await Promise.all([
            prisma.user.findUnique({
                where: { id: context.userId },
                select: { fullName: true }
            }),
            context.employeeId ? getEmployeeStats(context.tenantId, context.employeeId, today) : Promise.resolve(null),
            isHrdOrAdmin ? getAdminStats(context.tenantId, today) : Promise.resolve(null),
            (isManager && context.employeeId) ? getManagerStats(context.tenantId, context.employeeId, today) : Promise.resolve(null),
        ]);

        const result = {
            role: context.role,
            userName: userProfile?.fullName || "Pengguna",
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
        leaveBalances,
        latestPayslip,
        recentLogs,
        recentLeaves
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
        // Leave balances (all types)
        prisma.leaveBalance.findMany({
            where: {
                tenantId,
                employeeId,
                year: currentYear,
            },
            include: { leaveType: true }
        }),
        // Latest payslip
        prisma.payslip.findFirst({
            where: { tenantId, employeeId, status: "PUBLISHED" },
            orderBy: { period: "desc" },
            select: { period: true, netSalary: true },
        }),
        // recent activity (attendance logs)
        prisma.auditLog.findMany({
            where: { tenantId, actorId: employeeId },
            orderBy: { createdAt: "desc" },
            take: 5
        }),
        // recent leave requests
        prisma.leaveRequest.findMany({
            where: { tenantId, employeeId },
            orderBy: { createdAt: "desc" },
            take: 3,
            include: { leaveType: true }
        })
    ]);

    // Transform leave balances
    const leaveBalancesFormatted = leaveBalances.map(lb => {
        // Simple color mapping based on leave type code
        let color = "bg-blue-500";
        if (lb.leaveType.code.includes("SICK")) color = "bg-red-500";
        if (lb.leaveType.code.includes("ANNUAL")) color = "bg-green-500";
        if (lb.leaveType.code.includes("UNPAID")) color = "bg-gray-500";

        return {
            type: lb.leaveType.name,
            balance: lb.remainingBalance,
            used: lb.usedBalance,
            total: lb.initialBalance,
            color
        };
    });

    // Transform activity
    const activities = [
        ...recentLeaves.map(l => ({
            id: l.id,
            type: "leave",
            title: "Pengajuan Cuti",
            description: `${l.leaveType.name} - ${l.status}`,
            timestamp: l.createdAt,
            status: l.status === "APPROVED" ? "success" : l.status === "REJECTED" ? "error" : "warning"
        })),
        ...recentLogs.map(l => ({
            id: l.id,
            type: "activity",
            title: l.action,
            description: l.objectType,
            timestamp: l.createdAt,
            status: "default"
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

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
            balance: leaveBalances.find(l => l.leaveType.code === "ANNUAL")?.remainingBalance || 0,
        },
        leaveBalances: leaveBalancesFormatted,
        recentActivity: activities,
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
        leaveRequests,
        recentLogs
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
        // Approval Queue (Pending Leaves)
        prisma.leaveRequest.findMany({
            where: { tenantId, status: "PENDING" },
            include: { 
                employee: { 
                    include: { user: { select: { photoUrl: true } } } 
                }, 
                leaveType: true 
            },
            orderBy: { createdAt: "desc" },
            take: 5
        }),
        // Recent System Activity
        prisma.auditLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 5
        })
    ]);

    // Get department names (separate query to avoid N+1)
    const departments = await prisma.department.findMany({
        where: { tenantId, id: { in: byDepartment.map(d => d.departmentId || "") } },
        select: { id: true, name: true },
    });

    // Get user details for audit logs
    const userIds = recentLogs.map(log => log.actorId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true }
    });

    const approvalQueue = leaveRequests.map(req => ({
        id: req.id,
        type: "leave",
        employeeName: req.employee.fullName,
        employeePhoto: req.employee.user.photoUrl || undefined,
        description: `${req.leaveType.name} (${req.totalDays} hari)`,
        submittedAt: req.createdAt.toISOString(),
        status: "pending"
    }));

    const recentActivity = recentLogs.map(log => {
        const user = users.find(u => u.id === log.actorId);
        return {
            id: log.id,
            type: "system",
            title: log.action,
            description: `${user?.fullName || "System"} - ${log.objectType}`,
            timestamp: log.createdAt.toISOString(),
            status: "default"
        };
    });

    // Define department colors
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

    return {
        overview: {
            totalEmployees,
            pendingRegistrations,
            todayPresent,
            todayLate,
            pendingLeaveApprovals: pendingLeaves,
            attendanceRate: totalEmployees > 0 ? Math.round((todayPresent / totalEmployees) * 100) : 0,
        },
        byDepartment: byDepartment.map((d, index) => {
            const dept = departments.find(dept => dept.id === d.departmentId);
            return {
                name: dept?.name || "Unknown",
                count: d._count,
                color: colors[index % colors.length]
            };
        }),
        approvalQueue,
        recentActivity
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
            approvalQueue: [],
            teamAttendance: { present: 0, late: 0, absent: 0 }
        };
    }

    // Execute remaining queries in parallel
    const [todayAttendance, pendingLeaves, leaveRequests] = await Promise.all([
        // Today's attendance details for team stats
        prisma.attendance.groupBy({
            by: ['status'],
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                attendanceDate: today,
            },
            _count: true
        }),
        // Pending leave approvals from subordinates
        prisma.leaveRequest.count({
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                status: "PENDING",
            },
        }),
        // Approval Queue for Manager
        prisma.leaveRequest.findMany({
            where: {
                tenantId,
                employeeId: { in: subordinateIds },
                status: "PENDING",
            },
            include: { 
                employee: { 
                    include: { user: { select: { photoUrl: true } } } 
                }, 
                leaveType: true 
            },
            orderBy: { createdAt: "desc" },
            take: 5
        })
    ]);

    const presentCount = todayAttendance.find(a => a.status === "PRESENT")?._count || 0;
    const lateCount = todayAttendance.find(a => a.status === "LATE")?._count || 0;
    const totalPresent = presentCount + lateCount;

    const approvalQueue = leaveRequests.map(req => ({
        id: req.id,
        type: "leave",
        employeeName: req.employee.fullName,
        employeePhoto: req.employee.user.photoUrl || undefined,
        description: `${req.leaveType.name} (${req.totalDays} hari)`,
        submittedAt: req.createdAt.toISOString(),
        status: "pending"
    }));

    return {
        totalSubordinates: subordinates.length,
        presentToday: totalPresent,
        absentToday: subordinates.length - totalPresent,
        pendingLeaveApprovals: pendingLeaves,
        teamAttendance: {
            present: presentCount,
            late: lateCount,
            absent: subordinates.length - totalPresent
        },
        approvalQueue
    };
}

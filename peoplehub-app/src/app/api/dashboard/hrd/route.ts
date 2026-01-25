// @ai:cl - HRD dashboard data API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/dashboard/hrd - Get HRD-specific dashboard data (company-wide)
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
                { status: 401 }
            );
        }

        // Check if user is HRD or Super Admin
        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak. Hanya untuk HRD." } },
                { status: 403 }
            );
        }

        const { tenantId } = context;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const monthStart = new Date(currentYear, currentMonth, 1);

        // Total active employees
        const totalEmployees = await prisma.employee.count({
            where: { tenantId, status: "ACTIVE" },
        });

        // Pending registrations
        const pendingRegistrations = await prisma.user.count({
            where: { tenantId, status: "PENDING" },
        });

        // Recent pending registrations list
        const pendingRegistrationsList = await prisma.user.findMany({
            where: { tenantId, status: "PENDING" },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // Today's attendance
        const todayAttendance = await prisma.attendance.groupBy({
            by: ["status"],
            where: { tenantId, attendanceDate: today },
            _count: true,
        });

        const todayStats = {
            present: 0,
            late: 0,
            absent: 0,
            leave: 0,
        };
        todayAttendance.forEach((a) => {
            if (a.status === "PRESENT") todayStats.present = a._count;
            if (a.status === "LATE") todayStats.late = a._count;
            if (a.status === "ABSENT") todayStats.absent = a._count;
            if (a.status === "LEAVE") todayStats.leave = a._count;
        });

        // Pending leave approvals (approved by manager, waiting HRD)
        const pendingLeaveApprovals = await prisma.leaveRequest.count({
            where: { tenantId, status: { in: ["PENDING", "APPROVED_MANAGER"] } },
        });

        const pendingLeaveList = await prisma.leaveRequest.findMany({
            where: { tenantId, status: { in: ["PENDING", "APPROVED_MANAGER"] } },
            include: {
                employee: { select: { fullName: true, employeeNumber: true, department: { select: { name: true } } } },
                leaveType: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // Contract expiring in 30 days
        const contractExpiring = await prisma.employee.findMany({
            where: {
                tenantId,
                status: "ACTIVE",
                employmentType: "CONTRACT",
                endDate: { gte: today, lte: thirtyDaysFromNow },
            },
            select: {
                id: true,
                fullName: true,
                employeeNumber: true,
                endDate: true,
                department: { select: { name: true } },
                position: { select: { name: true } },
            },
            orderBy: { endDate: "asc" },
        });

        // Employees by department
        const byDepartment = await prisma.employee.groupBy({
            by: ["departmentId"],
            where: { tenantId, status: "ACTIVE" },
            _count: true,
        });

        const departments = await prisma.department.findMany({
            where: { tenantId },
            select: { id: true, name: true },
        });

        const departmentStats = byDepartment.map((d) => ({
            department: departments.find((dept) => dept.id === d.departmentId)?.name || "Tidak ada departemen",
            count: d._count,
        }));

        // Employees by branch
        const byBranch = await prisma.employee.groupBy({
            by: ["branchId"],
            where: { tenantId, status: "ACTIVE" },
            _count: true,
        });

        const branches = await prisma.branch.findMany({
            where: { tenantId },
            select: { id: true, name: true },
        });

        const branchStats = byBranch.map((b) => ({
            branch: branches.find((br) => br.id === b.branchId)?.name || "Tidak ada cabang",
            count: b._count,
        }));

        // Attendance rate this month
        const monthAttendance = await prisma.attendance.count({
            where: {
                tenantId,
                attendanceDate: { gte: monthStart, lte: today },
                status: { in: ["PRESENT", "LATE"] },
            },
        });

        // Working days this month (excluding weekends - simplified)
        const workingDays = Math.floor((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const expectedAttendance = totalEmployees * workingDays;
        const monthlyAttendanceRate = expectedAttendance > 0 ? Math.round((monthAttendance / expectedAttendance) * 100) : 0;

        // Late trend this month
        const lateThisMonth = await prisma.attendance.count({
            where: {
                tenantId,
                attendanceDate: { gte: monthStart, lte: today },
                status: "LATE",
            },
        });

        // Recent announcements
        const recentAnnouncements = await prisma.announcement.findMany({
            where: { tenantId, status: "PUBLISHED" },
            select: { id: true, title: true, publishedAt: true },
            orderBy: { publishedAt: "desc" },
            take: 5,
        });

        return NextResponse.json({
            success: true,
            data: {
                companyStats: {
                    totalEmployees,
                    pendingRegistrations,
                    todayPresent: todayStats.present + todayStats.late,
                    todayLate: todayStats.late,
                    todayAbsent: totalEmployees - (todayStats.present + todayStats.late + todayStats.leave),
                    todayLeave: todayStats.leave,
                    attendanceRate: totalEmployees > 0 ? Math.round(((todayStats.present + todayStats.late) / totalEmployees) * 100) : 0,
                },
                monthStats: {
                    attendanceRate: monthlyAttendanceRate,
                    lateCount: lateThisMonth,
                    monthName: today.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                },
                pendingApprovals: {
                    registrations: pendingRegistrations,
                    leave: pendingLeaveApprovals,
                    total: pendingRegistrations + pendingLeaveApprovals,
                },
                pendingRegistrationsList: pendingRegistrationsList.map((u) => ({
                    id: u.id,
                    fullName: u.fullName,
                    email: u.email,
                    phone: u.phone,
                    registeredAt: u.createdAt,
                })),
                pendingLeaveList: pendingLeaveList.map((l) => ({
                    id: l.id,
                    employee: l.employee.fullName,
                    employeeNumber: l.employee.employeeNumber,
                    department: l.employee.department?.name,
                    leaveType: l.leaveType.name,
                    startDate: l.startDate,
                    endDate: l.endDate,
                    totalDays: l.totalDays,
                    status: l.status,
                })),
                contractExpiring: contractExpiring.map((e) => ({
                    id: e.id,
                    fullName: e.fullName,
                    employeeNumber: e.employeeNumber,
                    department: e.department?.name,
                    position: e.position?.name,
                    endDate: e.endDate,
                    daysRemaining: Math.ceil((e.endDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
                })),
                employeeDistribution: {
                    byDepartment: departmentStats,
                    byBranch: branchStats,
                },
                recentAnnouncements,
            },
        });
    } catch (error) {
        console.error("Get HRD dashboard error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

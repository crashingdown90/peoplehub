// @ai:cl - Superadmin dashboard API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/superadmin - Get superadmin dashboard data
export async function GET() {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (context.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all tenants summary
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            employees: true,
            branches: true,
          },
        },
      },
    });

    // Get system-wide stats
    const [
      totalUsers,
      totalEmployees,
      totalBranches,
      activeUsers,
      pendingUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.employee.count(),
      prisma.branch.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
    ]);

    // Get today's attendance across all tenants
    const todayAttendance = await prisma.attendance.groupBy({
      by: ["status"],
      where: { attendanceDate: today },
      _count: { status: true },
    });

    const attendanceSummary = {
      present: todayAttendance.find((a) => a.status === "PRESENT")?._count.status || 0,
      late: todayAttendance.find((a) => a.status === "LATE")?._count.status || 0,
      absent: totalEmployees - (
        (todayAttendance.find((a) => a.status === "PRESENT")?._count.status || 0) +
        (todayAttendance.find((a) => a.status === "LATE")?._count.status || 0)
      ),
    };

    // Get monthly activity
    const monthlyLogins = await prisma.auditLog.count({
      where: {
        action: "LOGIN",
        createdAt: { gte: monthStart },
      },
    });

    // Get recent audit logs (cross-tenant)
    const recentActivity = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tenantId: true,
        actorId: true,
        action: true,
        objectType: true,
        createdAt: true,
      },
    });

    // Get tenant health summary
    const tenantHealth = await Promise.all(
      tenants.map(async (tenant) => {
        const activeEmployees = await prisma.employee.count({
          where: { tenantId: tenant.id, status: "ACTIVE" },
        });

        const todayAttend = await prisma.attendance.count({
          where: { tenantId: tenant.id, attendanceDate: today },
        });

        const attendanceRate = activeEmployees > 0
          ? Math.round((todayAttend / activeEmployees) * 100)
          : 0;

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantDomain: tenant.domain,
          isActive: tenant.isActive,
          activeEmployees,
          todayAttendance: todayAttend,
          attendanceRate,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTenants: tenants.length,
          activeTenants: tenants.filter((t) => t.isActive).length,
          totalUsers,
          activeUsers,
          pendingUsers,
          totalEmployees,
          totalBranches,
        },
        today: {
          date: today.toISOString().split("T")[0],
          attendance: attendanceSummary,
        },
        monthly: {
          month: today.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
          logins: monthlyLogins,
        },
        tenants: tenants.map((t) => ({
          id: t.id,
          name: t.name,
          domain: t.domain,
          isActive: t.isActive,
          createdAt: t.createdAt,
          users: t._count.users,
          employees: t._count.employees,
          branches: t._count.branches,
        })),
        tenantHealth,
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          tenantId: a.tenantId,
          actorId: a.actorId,
          action: a.action,
          objectType: a.objectType,
          timestamp: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get superadmin dashboard error:", error);
    return handlePrismaError(error);
  }
}

// @ai:cl - Tenants overview API for Superadmin dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/superadmin/tenants - Get all tenants overview
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status === "ACTIVE") where.isActive = true;
    if (status === "INACTIVE") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get tenants with detailed stats
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            branches: true,
            departments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get detailed stats for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const [
          activeEmployees,
          todayAttendance,
          monthlyLogins,
          pendingLeaves,
          pendingCorrections,
          lastActivity,
        ] = await Promise.all([
          prisma.employee.count({
            where: { tenantId: tenant.id, status: "ACTIVE" },
          }),
          prisma.attendance.count({
            where: { tenantId: tenant.id, attendanceDate: today },
          }),
          prisma.auditLog.count({
            where: {
              tenantId: tenant.id,
              action: "LOGIN",
              createdAt: { gte: monthStart },
            },
          }),
          prisma.leaveRequest.count({
            where: { tenantId: tenant.id, status: "PENDING" },
          }),
          prisma.attendanceCorrection.count({
            where: { tenantId: tenant.id, status: "PENDING" },
          }),
          prisma.auditLog.findFirst({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          }),
        ]);

        const pendingApprovals = pendingLeaves + pendingCorrections;

        const attendanceRate = activeEmployees > 0
          ? Math.round((todayAttendance / activeEmployees) * 100)
          : 0;

        // Determine health status
        let healthStatus: "healthy" | "warning" | "critical" = "healthy";
        if (attendanceRate < 50 || pendingApprovals > 50) {
          healthStatus = "warning";
        }
        if (attendanceRate < 30 || !lastActivity) {
          healthStatus = "critical";
        }

        return {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          counts: {
            users: tenant._count.users,
            employees: tenant._count.employees,
            activeEmployees,
            branches: tenant._count.branches,
            departments: tenant._count.departments,
          },
          activity: {
            todayAttendance,
            attendanceRate,
            monthlyLogins,
            pendingApprovals,
            lastActivity: lastActivity?.createdAt || null,
          },
          health: healthStatus,
        };
      })
    );

    // Summary
    const summary = {
      total: tenants.length,
      active: tenants.filter((t) => t.isActive).length,
      inactive: tenants.filter((t) => !t.isActive).length,
      healthy: tenantsWithStats.filter((t) => t.health === "healthy").length,
      warning: tenantsWithStats.filter((t) => t.health === "warning").length,
      critical: tenantsWithStats.filter((t) => t.health === "critical").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        tenants: tenantsWithStats,
      },
    });
  } catch (error) {
    console.error("Get tenants overview error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

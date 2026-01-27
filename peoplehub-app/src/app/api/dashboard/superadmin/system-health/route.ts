// @ai:cl - System-wide health check API for Superadmin dashboard
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/superadmin/system-health - Get system-wide health status
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

    const checks: Array<{
      name: string;
      status: "healthy" | "degraded" | "down";
      latency?: number;
      message?: string;
      details?: unknown;
    }> = [];

    // 1. Database health
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - dbStart;
      checks.push({
        name: "database",
        status: dbLatency < 100 ? "healthy" : dbLatency < 500 ? "degraded" : "down",
        latency: dbLatency,
        message: `Response time: ${dbLatency}ms`,
      });
    } catch {
      checks.push({
        name: "database",
        status: "down",
        message: "Database connection failed",
      });
    }

    // 2. Check all tenants health
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, isActive: true },
    });

    const inactiveTenants = tenants.filter((t) => !t.isActive).length;
    checks.push({
      name: "tenants",
      status: inactiveTenants === 0 ? "healthy" : inactiveTenants > tenants.length / 2 ? "down" : "degraded",
      message: `${tenants.length - inactiveTenants}/${tenants.length} tenants active`,
      details: {
        total: tenants.length,
        active: tenants.length - inactiveTenants,
        inactive: inactiveTenants,
      },
    });

    // 3. Check for orphaned data (users without employee records)
    const usersWithoutEmployee = await prisma.user.count({
      where: {
        employee: { is: null },
        role: { not: "SUPER_ADMIN" },
        deletedAt: null,
      },
    });

    const orphanedRecords = usersWithoutEmployee;
    checks.push({
      name: "data_integrity",
      status: orphanedRecords === 0 ? "healthy" : orphanedRecords > 10 ? "degraded" : "healthy",
      message: orphanedRecords > 0
        ? `${orphanedRecords} orphaned records found`
        : "No orphaned records",
      details: {
        usersWithoutEmployee,
      },
    });

    // 4. Check audit logging
    const lastAuditLog = await prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (lastAuditLog) {
      const minutesAgo = Math.floor(
        (Date.now() - lastAuditLog.createdAt.getTime()) / (1000 * 60)
      );
      checks.push({
        name: "audit_logging",
        status: minutesAgo < 60 ? "healthy" : minutesAgo < 1440 ? "degraded" : "down",
        message: `Last activity: ${minutesAgo} minutes ago`,
      });
    } else {
      checks.push({
        name: "audit_logging",
        status: "degraded",
        message: "No audit logs found",
      });
    }

    // 5. Check for security issues (cross-tenant)
    const recentFailedLogins = await prisma.auditLog.count({
      where: {
        action: "LOGIN_FAILED",
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      },
    });

    checks.push({
      name: "security",
      status: recentFailedLogins < 10 ? "healthy" : recentFailedLogins < 50 ? "degraded" : "down",
      message: `${recentFailedLogins} failed login attempts in last hour`,
    });

    // 6. Check payroll processing (based on payslips)
    const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const payslipsThisPeriod = await prisma.payslip.count({
      where: { period: currentPeriod },
    });

    checks.push({
      name: "payroll",
      status: "healthy",
      message: `${payslipsThisPeriod} payslips generated this period`,
      details: {
        period: currentPeriod,
        total: payslipsThisPeriod,
      },
    });

    // 7. Check storage/attachments
    const attachmentCount = await prisma.leaveRequest.count({
      where: { attachmentUrl: { not: null }, deletedAt: null },
    });
    checks.push({
      name: "storage",
      status: "healthy",
      message: `${attachmentCount} attachments in system`,
    });

    // Calculate overall status
    const hasDown = checks.some((c) => c.status === "down");
    const hasDegraded = checks.some((c) => c.status === "degraded");
    const overallStatus = hasDown ? "down" : hasDegraded ? "degraded" : "healthy";

    // Get system metrics
    const metrics = {
      totalTenants: tenants.length,
      totalUsers: await prisma.user.count({ where: { deletedAt: null } }),
      totalEmployees: await prisma.employee.count({ where: { deletedAt: null } }),
      totalAuditLogs: await prisma.auditLog.count(),
      dbSize: "N/A", // Would need admin access to get this
    };

    // Get resource utilization (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activityLast24h = await prisma.auditLog.count({
      where: { createdAt: { gte: last24Hours } },
    });

    return NextResponse.json({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks,
        metrics,
        activity: {
          last24Hours: activityLast24h,
          avgPerHour: Math.round(activityLast24h / 24),
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          },
        },
      },
    });
  } catch (error) {
    console.error("Get system health error:", error);
    return handlePrismaError(error);
  }
}

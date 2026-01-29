// @ai:cl - System health check API for IT dashboard
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/it/health - Get system health status
export async function GET() {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
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
    }> = [];

    // Database health check
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
    } catch (dbError) {
      checks.push({
        name: "database",
        status: "down",
        message: "Database connection failed",
      });
    }

    // Check data freshness (last audit log)
    try {
      const lastLog = await prisma.auditLog.findFirst({
        where: { tenantId: context.tenantId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      if (lastLog) {
        const minutesAgo = Math.floor(
          (Date.now() - lastLog.createdAt.getTime()) / (1000 * 60)
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
    } catch {
      checks.push({
        name: "audit_logging",
        status: "down",
        message: "Unable to check audit logs",
      });
    }

    // Check notification queue (if any pending for too long)
    try {
      const oldPendingNotifications = await prisma.notification.count({
        where: {
          tenantId: context.tenantId,
          isRead: false,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
          },
        },
      });

      checks.push({
        name: "notifications",
        status: oldPendingNotifications > 100 ? "degraded" : "healthy",
        message: `${oldPendingNotifications} old unread notifications`,
      });
    } catch {
      checks.push({
        name: "notifications",
        status: "degraded",
        message: "Unable to check notifications",
      });
    }

    // Check data integrity - employees vs users count
    try {
      const [employeeCount, activeUserCount] = await Promise.all([
        prisma.employee.count({ where: { tenantId: context.tenantId } }),
        prisma.user.count({ where: { tenantId: context.tenantId, status: "ACTIVE" } }),
      ]);

      checks.push({
        name: "data_integrity",
        status: "healthy",
        message: `${employeeCount} employees, ${activeUserCount} active users`,
      });
    } catch {
      checks.push({
        name: "data_integrity",
        status: "degraded",
        message: "Unable to check data integrity",
      });
    }

    // Storage check (count of files/attachments)
    try {
      const leaveAttachments = await prisma.leaveRequest.count({
        where: {
          tenantId: context.tenantId,
          attachmentUrl: { not: null },
        },
      });

      // Note: ReimburseRequest uses JSON receipts field
      const reimburseRequests = await prisma.reimburseRequest.count({
        where: { tenantId: context.tenantId },
      });

      checks.push({
        name: "storage",
        status: "healthy",
        message: `${leaveAttachments} leave attachments, ${reimburseRequests} reimburse requests`,
      });
    } catch {
      checks.push({
        name: "storage",
        status: "degraded",
        message: "Unable to check storage",
      });
    }

    // Calculate overall status
    const hasDown = checks.some((c) => c.status === "down");
    const hasDegraded = checks.some((c) => c.status === "degraded");
    const overallStatus = hasDown ? "down" : hasDegraded ? "degraded" : "healthy";

    // Get system metrics
    const metrics = {
      totalUsers: await prisma.user.count({ where: { tenantId: context.tenantId, deletedAt: null } }),
      activeUsers: await prisma.user.count({ where: { tenantId: context.tenantId, status: "ACTIVE", deletedAt: null } }),
      totalEmployees: await prisma.employee.count({ where: { tenantId: context.tenantId, deletedAt: null } }),
      activeEmployees: await prisma.employee.count({ where: { tenantId: context.tenantId, status: "ACTIVE", deletedAt: null } }),
    };

    return NextResponse.json({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
        metrics,
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    console.error("Get health check error:", error);
    return handlePrismaError(error);
  }
}

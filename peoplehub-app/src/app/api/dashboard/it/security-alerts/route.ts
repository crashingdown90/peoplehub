// @ai:cl - Security alerts API for IT dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/it/security-alerts - Get security alerts and anomalies
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const limit = parseInt(searchParams.get("limit") || "50");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const alerts: Array<{
      id: string;
      type: string;
      severity: "critical" | "high" | "medium" | "low";
      title: string;
      description: string;
      timestamp: Date;
      resolved: boolean;
      metadata?: unknown;
    }> = [];

    // 1. Check for multiple failed login attempts (brute force indicator)
    const failedLogins = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: "LOGIN_FAILED",
        createdAt: { gte: startDate },
      },
      select: {
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    // Group by IP address
    const failedBySource: Record<string, number> = {};
    for (const log of failedLogins) {
      const ip = log.ipAddress || "unknown";
      failedBySource[ip] = (failedBySource[ip] || 0) + 1;
    }

    // Alert for IPs with many failures
    for (const [ip, count] of Object.entries(failedBySource)) {
      if (count >= 5) {
        alerts.push({
          id: `brute_force_${ip}`,
          type: "BRUTE_FORCE_ATTEMPT",
          severity: count >= 20 ? "critical" : count >= 10 ? "high" : "medium",
          title: "Percobaan login gagal berulang",
          description: `${count} percobaan login gagal dari IP ${ip} dalam ${days} hari terakhir`,
          timestamp: new Date(),
          resolved: false,
          metadata: { ip, count },
        });
      }
    }

    // 2. Check for users with inactive status but recent activity
    // First get inactive users
    const inactiveUsers = await prisma.user.findMany({
      where: {
        tenantId: context.tenantId,
        status: { in: ["SUSPENDED", "REJECTED"] },
      },
      select: { id: true, email: true, status: true },
    });

    const inactiveUserIds = inactiveUsers.map((u) => u.id);

    if (inactiveUserIds.length > 0) {
      const inactiveWithActivity = await prisma.auditLog.findMany({
        where: {
          tenantId: context.tenantId,
          createdAt: { gte: startDate },
          actorId: { in: inactiveUserIds },
        },
        distinct: ["actorId"],
      });

      for (const log of inactiveWithActivity) {
        const user = inactiveUsers.find((u) => u.id === log.actorId);
        if (user) {
          alerts.push({
            id: `inactive_user_activity_${log.actorId}`,
            type: "INACTIVE_USER_ACTIVITY",
            severity: "high",
            title: "Aktivitas dari akun tidak aktif",
            description: `User ${user.email} (status: ${user.status}) terdeteksi ada aktivitas`,
            timestamp: log.createdAt,
            resolved: false,
            metadata: { userId: log.actorId, email: user.email },
          });
        }
      }
    }

    // 3. Check for password changes outside business hours
    const passwordChanges = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: "PASSWORD_CHANGED",
        createdAt: { gte: startDate },
      },
    });

    for (const log of passwordChanges) {
      const hour = log.createdAt.getHours();
      // Outside 6 AM - 10 PM
      if (hour < 6 || hour > 22) {
        // Get user email
        const user = log.actorId
          ? await prisma.user.findUnique({
              where: { id: log.actorId },
              select: { email: true },
            })
          : null;

        alerts.push({
          id: `suspicious_password_change_${log.id}`,
          type: "SUSPICIOUS_PASSWORD_CHANGE",
          severity: "medium",
          title: "Perubahan password di luar jam kerja",
          description: `User ${user?.email || "unknown"} mengubah password pada jam ${hour}:00`,
          timestamp: log.createdAt,
          resolved: false,
          metadata: { userId: log.actorId, hour },
        });
      }
    }

    // 4. Check for bulk data access (many reads in short time)
    const bulkAccess = await prisma.auditLog.groupBy({
      by: ["actorId", "objectType"],
      where: {
        tenantId: context.tenantId,
        action: "READ",
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      },
      _count: true,
      having: {
        actorId: {
          _count: { gt: 50 },
        },
      },
    });

    for (const access of bulkAccess) {
      if (access._count > 50) {
        const user = await prisma.user.findUnique({
          where: { id: access.actorId! },
          select: { email: true },
        });

        alerts.push({
          id: `bulk_access_${access.actorId}_${access.objectType}`,
          type: "BULK_DATA_ACCESS",
          severity: access._count > 100 ? "high" : "medium",
          title: "Akses data massal terdeteksi",
          description: `User ${user?.email || access.actorId} mengakses ${access._count} record ${access.objectType} dalam 1 jam terakhir`,
          timestamp: new Date(),
          resolved: false,
          metadata: { userId: access.actorId, objectType: access.objectType, count: access._count },
        });
      }
    }

    // 5. Check for privilege escalation attempts
    const privilegeChanges = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: "ROLE_CHANGED",
        createdAt: { gte: startDate },
      },
    });

    for (const log of privilegeChanges) {
      const afterData = log.afterData as Record<string, unknown> | null;
      const newRole = afterData?.role as string | undefined;

      if (newRole && ["SUPER_ADMIN", "HRD"].includes(newRole)) {
        // Get user email
        const user = log.actorId
          ? await prisma.user.findUnique({
              where: { id: log.actorId },
              select: { email: true },
            })
          : null;

        alerts.push({
          id: `privilege_escalation_${log.id}`,
          type: "PRIVILEGE_ESCALATION",
          severity: newRole === "SUPER_ADMIN" ? "critical" : "high",
          title: "Perubahan hak akses tinggi",
          description: `Role diubah menjadi ${newRole} oleh ${user?.email || "unknown"}`,
          timestamp: log.createdAt,
          resolved: false,
          metadata: { objectId: log.objectId, newRole },
        });
      }
    }

    // Sort alerts by severity and timestamp
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Summary
    const summary = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      high: alerts.filter((a) => a.severity === "high").length,
      medium: alerts.filter((a) => a.severity === "medium").length,
      low: alerts.filter((a) => a.severity === "low").length,
      unresolved: alerts.filter((a) => !a.resolved).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        period: { days, start: startDate, end: new Date() },
        summary,
        alerts: alerts.slice(0, limit),
      },
    });
  } catch (error) {
    console.error("Get security alerts error:", error);
    return handlePrismaError(error);
  }
}

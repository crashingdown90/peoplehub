// @ai:cl - Login statistics API for IT dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/it/login-stats - Get login statistics
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);

    // Get login attempts from audit log
    const loginLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: { in: ["LOGIN", "LOGIN_FAILED", "LOGOUT"] },
        createdAt: { gte: startDate },
      },
      select: {
        action: true,
        createdAt: true,
        actorId: true,
        ipAddress: true,
        userAgent: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics
    const totalLogins = loginLogs.filter((l) => l.action === "LOGIN").length;
    const failedLogins = loginLogs.filter((l) => l.action === "LOGIN_FAILED").length;
    const totalLogouts = loginLogs.filter((l) => l.action === "LOGOUT").length;

    // Unique users who logged in
    const uniqueUsers = new Set(
      loginLogs.filter((l) => l.action === "LOGIN").map((l) => l.actorId)
    ).size;

    // Daily breakdown
    const dailyStats: { date: string; dayName: string; logins: number; failed: number; uniqueUsers: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayLogs = loginLogs.filter((l) => {
        const logDate = l.createdAt.toISOString().split("T")[0];
        return logDate === dateStr;
      });

      dailyStats.push({
        date: dateStr,
        dayName: date.toLocaleDateString("id-ID", { weekday: "short" }),
        logins: dayLogs.filter((l) => l.action === "LOGIN").length,
        failed: dayLogs.filter((l) => l.action === "LOGIN_FAILED").length,
        uniqueUsers: new Set(
          dayLogs.filter((l) => l.action === "LOGIN").map((l) => l.actorId)
        ).size,
      });
    }

    // Hourly distribution (for today)
    const todayLogs = loginLogs.filter((l) => {
      const logDate = l.createdAt.toISOString().split("T")[0];
      return logDate === today.toISOString().split("T")[0];
    });

    const hourlyDistribution: Record<number, number> = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyDistribution[hour] = 0;
    }
    for (const log of todayLogs.filter((l) => l.action === "LOGIN")) {
      const hour = log.createdAt.getHours();
      hourlyDistribution[hour]++;
    }

    // Get recent failed login attempts (potential security issues)
    const recentFailed = loginLogs
      .filter((l) => l.action === "LOGIN_FAILED")
      .slice(0, 20)
      .map((l) => ({
        timestamp: l.createdAt,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
      }));

    // Get currently active sessions (users who logged in today but not logged out)
    const todayLogins = new Set(
      todayLogs.filter((l) => l.action === "LOGIN").map((l) => l.actorId)
    );
    const todayLogouts = new Set(
      todayLogs.filter((l) => l.action === "LOGOUT").map((l) => l.actorId)
    );
    const activeSessions = [...todayLogins].filter((id) => !todayLogouts.has(id)).length;

    // Get total registered users
    const totalUsers = await prisma.user.count({
      where: {
        tenantId: context.tenantId,
        status: "ACTIVE",
      },
    });

    // Calculate engagement rate
    const engagementRate = totalUsers > 0
      ? Math.round((uniqueUsers / totalUsers) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: { start: startDate, end: today, days },
        summary: {
          totalLogins,
          failedLogins,
          totalLogouts,
          uniqueUsers,
          activeSessions,
          totalUsers,
          engagementRate,
          failureRate: totalLogins > 0
            ? Math.round((failedLogins / (totalLogins + failedLogins)) * 100)
            : 0,
        },
        daily: dailyStats,
        hourly: Object.entries(hourlyDistribution).map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
        })),
        recentFailed,
      },
    });
  } catch (error) {
    console.error("Get login stats error:", error);
    return handlePrismaError(error);
  }
}

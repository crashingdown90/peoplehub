// @ai:cl - Registration Statistics API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant/context";
import { handlePrismaError } from "@/lib/api-utils";

// ==========================================
// GET /api/admin/registrations/stats
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Silakan login terlebih dahulu",
          },
        },
        { status: 401 }
      );
    }

    const { tenantId, role } = context;

    // 2. Role check - only HRD and SUPER_ADMIN can access
    if (!["HRD", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Anda tidak memiliki akses ke halaman ini",
          },
        },
        { status: 403 }
      );
    }

    // 3. Get query params for grouping
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get("groupBy") || "status"; // status, date, week, month

    // 4. Get statistics
    const [
      totalCount,
      pendingCount,
      activeCount,
      approvedCount,
      rejectedCount,
      recentRegistrations,
      dailyStats,
    ] = await Promise.all([
      // Total registrations
      prisma.user.count({
        where: { tenantId },
      }),

      // Pending registrations
      prisma.user.count({
        where: { tenantId, status: "PENDING" },
      }),

      // Active users
      prisma.user.count({
        where: { tenantId, status: "ACTIVE" },
      }),

      // Approved users
      prisma.user.count({
        where: { tenantId, status: "APPROVED" },
      }),

      // Rejected registrations
      prisma.user.count({
        where: { tenantId, status: "REJECTED" },
      }),

      // Recent registrations (last 10)
      prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Daily stats for last 30 days
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          status,
          COUNT(*)::int as count
        FROM users
        WHERE tenant_id = ${tenantId}
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), status
        ORDER BY date DESC
      ` as Promise<Array<{ date: Date; status: string; count: number }>>,
    ]);

    // 5. Process daily stats into a more usable format
    const dailyStatsMap: Record<string, Record<string, number>> = {};

    if (Array.isArray(dailyStats)) {
      for (const stat of dailyStats) {
        const dateStr = new Date(stat.date).toISOString().split("T")[0];
        if (!dailyStatsMap[dateStr]) {
          dailyStatsMap[dateStr] = { PENDING: 0, ACTIVE: 0, APPROVED: 0, REJECTED: 0 };
        }
        dailyStatsMap[dateStr][stat.status] = stat.count;
      }
    }

    // Convert to array format
    const dailyStatsArray = Object.entries(dailyStatsMap).map(([date, counts]) => ({
      date,
      ...counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    }));

    // 6. Calculate trends (compare with previous period)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [currentPeriodCount, previousPeriodCount] = await Promise.all([
      prisma.user.count({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          tenantId,
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    const trend = previousPeriodCount > 0
      ? ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100
      : currentPeriodCount > 0 ? 100 : 0;

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalCount,
          pending: pendingCount,
          active: activeCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
        trend: {
          currentPeriod: currentPeriodCount,
          previousPeriod: previousPeriodCount,
          percentageChange: Math.round(trend * 100) / 100,
          direction: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
        },
        recentRegistrations,
        dailyStats: dailyStatsArray,
      },
    });
  } catch (err) {
    console.error("Registration stats API error:", err);
    return handlePrismaError(err);
  }
}

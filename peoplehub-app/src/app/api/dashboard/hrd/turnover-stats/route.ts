// @ai:cl - Employee turnover statistics API for HRD dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/hrd/turnover-stats - Get employee turnover statistics
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const period = searchParams.get("period") || "yearly"; // monthly, quarterly, yearly

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Get current headcount
    const currentHeadcount = await prisma.employee.count({
      where: {
        tenantId: context.tenantId,
        status: "ACTIVE",
      },
    });

    // Get new hires this year
    const newHires = await prisma.employee.count({
      where: {
        tenantId: context.tenantId,
        startDate: { gte: yearStart, lte: yearEnd },
      },
    });

    // Get terminations this year
    const terminations = await prisma.employee.count({
      where: {
        tenantId: context.tenantId,
        status: "TERMINATED",
        updatedAt: { gte: yearStart, lte: yearEnd },
      },
    });

    // Get monthly breakdown
    const monthlyStats = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      // Skip future months
      if (monthStart > new Date()) break;

      const [hires, exits] = await Promise.all([
        prisma.employee.count({
          where: {
            tenantId: context.tenantId,
            startDate: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.employee.count({
          where: {
            tenantId: context.tenantId,
            status: "TERMINATED",
            updatedAt: { gte: monthStart, lte: monthEnd },
          },
        }),
      ]);

      monthlyStats.push({
        month: month + 1,
        monthName: monthStart.toLocaleDateString("id-ID", { month: "short" }),
        hires,
        exits,
        netChange: hires - exits,
      });
    }

    // Get by department
    const departments = await prisma.department.findMany({
      where: { tenantId: context.tenantId },
      select: { id: true, name: true },
    });

    const byDepartment = await Promise.all(
      departments.map(async (dept) => {
        const [activeCount, hires, exits] = await Promise.all([
          prisma.employee.count({
            where: {
              tenantId: context.tenantId,
              departmentId: dept.id,
              status: "ACTIVE",
            },
          }),
          prisma.employee.count({
            where: {
              tenantId: context.tenantId,
              departmentId: dept.id,
              startDate: { gte: yearStart, lte: yearEnd },
            },
          }),
          prisma.employee.count({
            where: {
              tenantId: context.tenantId,
              departmentId: dept.id,
              status: "TERMINATED",
              updatedAt: { gte: yearStart, lte: yearEnd },
            },
          }),
        ]);

        const avgHeadcount = activeCount > 0 ? activeCount : 1;
        const turnoverRate = Math.round((exits / avgHeadcount) * 100);

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          activeCount,
          hires,
          exits,
          turnoverRate,
        };
      })
    );

    // Calculate overall turnover rate
    const avgHeadcount = currentHeadcount > 0 ? currentHeadcount : 1;
    const turnoverRate = Math.round((terminations / avgHeadcount) * 100);

    // Calculate retention rate
    const retentionRate = 100 - turnoverRate;

    return NextResponse.json({
      success: true,
      data: {
        year,
        summary: {
          currentHeadcount,
          newHires,
          terminations,
          netGrowth: newHires - terminations,
          turnoverRate,
          retentionRate,
        },
        monthly: monthlyStats,
        byDepartment: byDepartment.sort((a, b) => b.turnoverRate - a.turnoverRate),
      },
    });
  } catch (error) {
    console.error("Get turnover stats error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

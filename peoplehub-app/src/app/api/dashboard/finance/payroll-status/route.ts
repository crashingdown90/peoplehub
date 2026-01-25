// @ai:cl - Payroll status API for Finance dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/finance/payroll-status - Get current payroll period status
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["FINANCE", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period"); // YYYY-MM format

    // Determine current period
    const today = new Date();
    const currentPeriod = periodParam || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // Get payslip statistics for the period
    const payslipStats = await prisma.payslip.groupBy({
      by: ["status"],
      where: {
        tenantId: context.tenantId,
        period: currentPeriod,
      },
      _count: { status: true },
      _sum: { netSalary: true, grossSalary: true, totalDeductions: true },
    });

    // Calculate totals
    const stats = {
      draft: 0,
      published: 0,
      total: 0,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalDeductions: 0,
    };

    for (const s of payslipStats) {
      const count = s._count.status;
      const gross = Number(s._sum.grossSalary || 0);
      const net = Number(s._sum.netSalary || 0);
      const deductions = Number(s._sum.totalDeductions || 0);

      stats.total += count;
      stats.totalGrossSalary += gross;
      stats.totalNetSalary += net;
      stats.totalDeductions += deductions;

      if (s.status === "DRAFT") stats.draft = count;
      else if (s.status === "PUBLISHED") stats.published = count;
    }

    // Get total active employees for comparison
    const totalEmployees = await prisma.employee.count({
      where: {
        tenantId: context.tenantId,
        status: "ACTIVE",
      },
    });

    // Get recent payroll history (last 6 periods)
    const recentPeriods = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const periodStats = await prisma.payslip.aggregate({
        where: {
          tenantId: context.tenantId,
          period,
        },
        _count: true,
        _sum: { netSalary: true, grossSalary: true },
      });

      recentPeriods.push({
        period,
        periodName: date.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
        count: periodStats._count,
        totalNetSalary: Number(periodStats._sum.netSalary || 0),
        totalGrossSalary: Number(periodStats._sum.grossSalary || 0),
      });
    }

    // Determine overall status
    let overallStatus: "NOT_STARTED" | "IN_PROGRESS" | "PUBLISHED" = "NOT_STARTED";
    if (stats.published > 0 && stats.published === stats.total) {
      overallStatus = "PUBLISHED";
    } else if (stats.draft > 0) {
      overallStatus = "IN_PROGRESS";
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPeriod,
        periodName: new Date(currentPeriod + "-01").toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        }),
        overallStatus,
        stats: {
          totalEmployees,
          payslipsGenerated: stats.total,
          coverage: totalEmployees > 0 ? Math.round((stats.total / totalEmployees) * 100) : 0,
          draft: stats.draft,
          published: stats.published,
          totalGrossSalary: stats.totalGrossSalary,
          totalNetSalary: stats.totalNetSalary,
          totalDeductions: stats.totalDeductions,
        },
        history: recentPeriods,
      },
    });
  } catch (error) {
    console.error("Get payroll status error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

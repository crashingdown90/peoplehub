// @ai:cl - KPI progress API for employee dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/kpi/me/progress - Get my KPI progress
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId");

    // Build where clause for KPI targets
    const where: Record<string, unknown> = {
      employeeId: context.employeeId,
    };

    if (periodId) {
      where.periodId = periodId;
    }

    // Get KPI targets for this employee
    const kpiTargets = await prisma.kpiTarget.findMany({
      where,
      include: {
        indicator: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            unit: true,
            weight: true,
            targetType: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Calculate progress for each KPI
    const kpiProgress = kpiTargets.map((target) => {
      const targetValue = Number(target.targetValue);
      const actualValue = Number(target.actualValue || 0);
      const weight = Number(target.indicator.weight);
      const progress = targetValue > 0 ? Math.min((actualValue / targetValue) * 100, 100) : 0;
      const weightedScore = (progress * weight) / 100;

      return {
        id: target.id,
        indicator: target.indicator,
        period: target.period,
        targetValue,
        actualValue,
        unit: target.indicator.unit,
        weight,
        progress: Math.round(progress * 100) / 100,
        weightedScore: Math.round(weightedScore * 100) / 100,
        score: target.score ? Number(target.score) : null,
        notes: target.notes,
      };
    });

    // Calculate overall progress
    const totalWeight = kpiProgress.reduce((sum, k) => sum + k.weight, 0);
    const totalWeightedScore = kpiProgress.reduce((sum, k) => sum + k.weightedScore, 0);
    const overallProgress = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    // Group by period
    const byPeriod = kpiProgress.reduce(
      (acc, k) => {
        const pId = k.period.id;
        if (!acc[pId]) {
          acc[pId] = { period: k.period, kpis: [], totalProgress: 0 };
        }
        acc[pId].kpis.push(k);
        return acc;
      },
      {} as Record<string, { period: typeof kpiProgress[0]["period"]; kpis: typeof kpiProgress; totalProgress: number }>
    );

    // Calculate period totals
    for (const pId of Object.keys(byPeriod)) {
      const periodKpis = byPeriod[pId].kpis;
      const pTotalWeight = periodKpis.reduce((sum, k) => sum + k.weight, 0);
      const pTotalScore = periodKpis.reduce((sum, k) => sum + k.weightedScore, 0);
      byPeriod[pId].totalProgress = pTotalWeight > 0 ? (pTotalScore / pTotalWeight) * 100 : 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalKpis: kpiProgress.length,
          overallProgress: Math.round(overallProgress * 100) / 100,
          totalWeight,
          totalWeightedScore: Math.round(totalWeightedScore * 100) / 100,
        },
        byPeriod: Object.values(byPeriod),
        kpis: kpiProgress,
      },
    });
  } catch (error) {
    console.error("Get KPI progress error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}

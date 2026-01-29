// @ai:cl - KPI service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import {
  ServiceResponse,
  success,
  error,
  paginated,
  ErrorCodes,
  PaginationParams,
} from "../types";
import type { KpiTarget, KpiPeriod, KpiIndicator } from "@prisma/client";
// Decimal type from Prisma
type Decimal = { toNumber(): number } | number;

// ==========================================
// TYPES
// ==========================================

export interface KpiTargetWithRelations extends KpiTarget {
  period: KpiPeriod;
  indicator: KpiIndicator;
}

export interface KpiTargetFilter extends PaginationParams {
  periodId?: string;
  indicatorId?: string;
  employeeId?: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface CreateKpiTargetInput {
  employeeId: string;
  periodId: string;
  indicatorId: string;
  targetValue: number;
  notes?: string;
}

export interface UpdateKpiActualInput {
  actualValue: number;
  notes?: string;
}

export interface KpiSummary {
  periodId: string;
  periodName: string;
  employeeId: string;
  employeeName: string;
  totalTargets: number;
  completedTargets: number;
  averageScore: number;
  weightedScore: number;
  targets: {
    indicatorName: string;
    indicatorCode: string;
    unit: string;
    targetValue: number;
    actualValue: number | null;
    score: number | null;
    weight: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  }[];
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class KpiService {
  // ==========================================
  // PERIODS
  // ==========================================

  /**
   * Get all KPI periods
   */
  static async getPeriods(
    context: RequestContext
  ): Promise<ServiceResponse<KpiPeriod[]>> {
    const periods = await prisma.kpiPeriod.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { startDate: "desc" },
    });

    return success(periods);
  }

  /**
   * Get active KPI period
   */
  static async getActivePeriod(
    context: RequestContext
  ): Promise<ServiceResponse<KpiPeriod | null>> {
    const period = await prisma.kpiPeriod.findFirst({
      where: {
        tenantId: context.tenantId,
        isActive: true,
      },
    });

    return success(period);
  }

  /**
   * Create KPI period (HRD/SUPER_ADMIN only)
   */
  static async createPeriod(
    context: RequestContext,
    data: { name: string; startDate: Date; endDate: Date }
  ): Promise<ServiceResponse<KpiPeriod>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk membuat periode KPI");
    }

    const period = await prisma.kpiPeriod.create({
      data: {
        tenantId: context.tenantId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    return success(period);
  }

  // ==========================================
  // INDICATORS
  // ==========================================

  /**
   * Get all KPI indicators
   */
  static async getIndicators(
    context: RequestContext
  ): Promise<ServiceResponse<KpiIndicator[]>> {
    const indicators = await prisma.kpiIndicator.findMany({
      where: { tenantId: context.tenantId, isActive: true },
      orderBy: { name: "asc" },
    });

    return success(indicators);
  }

  /**
   * Create KPI indicator (HRD/SUPER_ADMIN only)
   */
  static async createIndicator(
    context: RequestContext,
    data: {
      code: string;
      name: string;
      description?: string;
      unit: string;
      targetType?: string;
      weight?: number;
    }
  ): Promise<ServiceResponse<KpiIndicator>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk membuat indikator KPI");
    }

    const indicator = await prisma.kpiIndicator.create({
      data: {
        tenantId: context.tenantId,
        code: data.code,
        name: data.name,
        description: data.description,
        unit: data.unit,
        targetType: data.targetType || "HIGHER_BETTER",
        weight: data.weight || 1,
      },
    });

    return success(indicator);
  }

  // ==========================================
  // TARGETS
  // ==========================================

  /**
   * Get KPI targets for current user
   */
  static async getMyTargets(
    context: RequestContext,
    filter: KpiTargetFilter
  ): Promise<ServiceResponse<KpiTargetWithRelations[]>> {
    const { periodId, page = 1, limit = 20 } = filter;

    if (!context.employeeId) {
      return error(ErrorCodes.NOT_FOUND, "Employee profile tidak ditemukan");
    }

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
      employeeId: context.employeeId,
    };

    if (periodId) {
      where.periodId = periodId;
    }

    const [targets, total] = await Promise.all([
      prisma.kpiTarget.findMany({
        where,
        include: {
          period: true,
          indicator: true,
        },
        orderBy: { indicator: { name: "asc" } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kpiTarget.count({ where }),
    ]);

    return paginated(targets as KpiTargetWithRelations[], total, page, limit);
  }

  /**
   * Get KPI targets for team (Manager)
   */
  static async getTeamTargets(
    context: RequestContext,
    filter: KpiTargetFilter
  ): Promise<ServiceResponse<KpiTargetWithRelations[]>> {
    if (!["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke KPI tim");
    }

    const { periodId, employeeId, page = 1, limit = 20 } = filter;

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (periodId) where.periodId = periodId;

    // For managers, only show subordinates
    if (context.role === "MANAGER") {
      const subordinates = await prisma.employee.findMany({
        where: withTenant(context, { managerId: context.employeeId }),
        select: { id: true },
      });
      where.employeeId = { in: subordinates.map((s) => s.id) };
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    const [targets, total] = await Promise.all([
      prisma.kpiTarget.findMany({
        where,
        include: {
          period: true,
          indicator: true,
          employee: { select: { id: true, fullName: true, employeeNumber: true } },
        },
        orderBy: [{ employee: { fullName: "asc" } }, { indicator: { name: "asc" } }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kpiTarget.count({ where }),
    ]);

    return paginated(targets as KpiTargetWithRelations[], total, page, limit);
  }

  /**
   * Get single KPI target by ID
   */
  static async getTargetById(
    context: RequestContext,
    targetId: string
  ): Promise<ServiceResponse<KpiTargetWithRelations>> {
    const target = await prisma.kpiTarget.findFirst({
      where: withTenant(context, { id: targetId }),
      include: {
        period: true,
        indicator: true,
        employee: { select: { id: true, fullName: true } },
      },
    });

    if (!target) {
      return error(ErrorCodes.NOT_FOUND, "Target KPI tidak ditemukan");
    }

    // Check access
    const canAccess =
      ["HRD", "SUPER_ADMIN"].includes(context.role) ||
      target.employeeId === context.employeeId;

    if (!canAccess && context.role === "MANAGER") {
      // Check if target belongs to subordinate
      const employee = await prisma.employee.findFirst({
        where: { id: target.employeeId, managerId: context.employeeId },
      });
      if (!employee) {
        return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke target ini");
      }
    } else if (!canAccess) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke target ini");
    }

    return success(target as KpiTargetWithRelations);
  }

  /**
   * Create KPI target (Manager/HRD/SUPER_ADMIN)
   */
  static async createTarget(
    context: RequestContext,
    data: CreateKpiTargetInput
  ): Promise<ServiceResponse<KpiTarget>> {
    if (!["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk membuat target KPI");
    }

    // Verify employee exists
    const employee = await prisma.employee.findFirst({
      where: withTenant(context, { id: data.employeeId }),
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    // For managers, check if target employee is subordinate
    if (context.role === "MANAGER" && employee.managerId !== context.employeeId) {
      return error(ErrorCodes.FORBIDDEN, "Anda hanya dapat membuat target untuk bawahan langsung");
    }

    // Verify period and indicator exist
    const [period, indicator] = await Promise.all([
      prisma.kpiPeriod.findFirst({
        where: { tenantId: context.tenantId, id: data.periodId },
      }),
      prisma.kpiIndicator.findFirst({
        where: { tenantId: context.tenantId, id: data.indicatorId },
      }),
    ]);

    if (!period) {
      return error(ErrorCodes.NOT_FOUND, "Periode KPI tidak ditemukan");
    }
    if (!indicator) {
      return error(ErrorCodes.NOT_FOUND, "Indikator KPI tidak ditemukan");
    }

    const target = await prisma.kpiTarget.create({
      data: {
        tenantId: context.tenantId,
        employeeId: data.employeeId,
        periodId: data.periodId,
        indicatorId: data.indicatorId,
        targetValue: data.targetValue,
        notes: data.notes,
      },
    });

    return success(target);
  }

  /**
   * Update actual value (Employee updates own, Manager/HRD can update subordinates)
   */
  static async updateActualValue(
    context: RequestContext,
    targetId: string,
    data: UpdateKpiActualInput
  ): Promise<ServiceResponse<KpiTarget>> {
    const target = await prisma.kpiTarget.findFirst({
      where: withTenant(context, { id: targetId }),
      include: { indicator: true },
    });

    if (!target) {
      return error(ErrorCodes.NOT_FOUND, "Target KPI tidak ditemukan");
    }

    // Check access
    let canUpdate = target.employeeId === context.employeeId;

    if (!canUpdate && ["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      if (context.role === "MANAGER") {
        const employee = await prisma.employee.findFirst({
          where: { id: target.employeeId, managerId: context.employeeId },
        });
        canUpdate = !!employee;
      } else {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mengupdate target ini");
    }

    // Calculate score based on target type
    const score = this.calculateScore(
      target.targetValue,
      data.actualValue,
      target.indicator.targetType
    );

    const updated = await prisma.kpiTarget.update({
      where: { id: targetId },
      data: {
        actualValue: data.actualValue,
        score,
        notes: data.notes || target.notes,
        updatedAt: new Date(),
      },
    });

    return success(updated);
  }

  // ==========================================
  // SUMMARY
  // ==========================================

  /**
   * Get KPI summary for employee
   */
  static async getSummary(
    context: RequestContext,
    employeeId: string,
    periodId: string
  ): Promise<ServiceResponse<KpiSummary>> {
    // Check access
    const canAccess =
      ["HRD", "SUPER_ADMIN"].includes(context.role) ||
      employeeId === context.employeeId;

    if (!canAccess && context.role === "MANAGER") {
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, managerId: context.employeeId },
      });
      if (!employee) {
        return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke summary ini");
      }
    } else if (!canAccess) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke summary ini");
    }

    const [employee, period, targets] = await Promise.all([
      prisma.employee.findFirst({
        where: withTenant(context, { id: employeeId }),
        select: { id: true, fullName: true },
      }),
      prisma.kpiPeriod.findFirst({
        where: { tenantId: context.tenantId, id: periodId },
      }),
      prisma.kpiTarget.findMany({
        where: {
          tenantId: context.tenantId,
          employeeId,
          periodId,
        },
        include: { indicator: true },
      }),
    ]);

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }
    if (!period) {
      return error(ErrorCodes.NOT_FOUND, "Periode tidak ditemukan");
    }

    const completedTargets = targets.filter((t) => t.actualValue !== null).length;

    // Calculate weighted score
    let totalWeight = 0;
    let weightedScoreSum = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    const targetDetails = targets.map((t) => {
      const weight = Number(t.indicator.weight);
      totalWeight += weight;

      if (t.score !== null) {
        weightedScoreSum += Number(t.score) * weight;
        scoreSum += Number(t.score);
        scoreCount++;
      }

      return {
        indicatorName: t.indicator.name,
        indicatorCode: t.indicator.code,
        unit: t.indicator.unit,
        targetValue: Number(t.targetValue),
        actualValue: t.actualValue ? Number(t.actualValue) : null,
        score: t.score ? Number(t.score) : null,
        weight,
        status: this.getTargetStatus(t.actualValue, t.targetValue),
      };
    });

    const summary: KpiSummary = {
      periodId,
      periodName: period.name,
      employeeId,
      employeeName: employee.fullName,
      totalTargets: targets.length,
      completedTargets,
      averageScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) / 100 : 0,
      weightedScore: totalWeight > 0 ? Math.round((weightedScoreSum / totalWeight) * 100) / 100 : 0,
      targets: targetDetails,
    };

    return success(summary);
  }

  /**
   * Get my KPI summary (current user)
   */
  static async getMySummary(
    context: RequestContext,
    periodId?: string
  ): Promise<ServiceResponse<KpiSummary>> {
    if (!context.employeeId) {
      return error(ErrorCodes.NOT_FOUND, "Employee profile tidak ditemukan");
    }

    // Use provided period or find active period
    let targetPeriodId = periodId;
    if (!targetPeriodId) {
      const activePeriod = await prisma.kpiPeriod.findFirst({
        where: { tenantId: context.tenantId, isActive: true },
      });
      if (!activePeriod) {
        return error(ErrorCodes.NOT_FOUND, "Tidak ada periode KPI aktif");
      }
      targetPeriodId = activePeriod.id;
    }

    return this.getSummary(context, context.employeeId, targetPeriodId);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Calculate score based on target type
   */
  private static calculateScore(
    targetValue: Decimal,
    actualValue: Decimal,
    targetType: string
  ): number {
    const target = Number(targetValue);
    const actual = Number(actualValue);

    if (target === 0) return actual === 0 ? 100 : 0;

    let score: number;

    switch (targetType) {
      case "HIGHER_BETTER":
        // Score = (actual / target) * 100, capped at 120
        score = Math.min((actual / target) * 100, 120);
        break;
      case "LOWER_BETTER":
        // Score = (target / actual) * 100, capped at 120
        score = actual === 0 ? 120 : Math.min((target / actual) * 100, 120);
        break;
      case "EXACT":
        // Score based on how close to target
        const diff = Math.abs(actual - target);
        const tolerance = target * 0.1; // 10% tolerance
        if (diff <= tolerance) {
          score = 100 - (diff / tolerance) * 20;
        } else {
          score = Math.max(0, 80 - ((diff - tolerance) / target) * 100);
        }
        break;
      default:
        score = (actual / target) * 100;
    }

    return Math.round(score * 100) / 100;
  }

  /**
   * Get target status
   */
  private static getTargetStatus(
    actualValue: Decimal | null,
    targetValue: Decimal
  ): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" {
    if (actualValue === null) return "NOT_STARTED";

    const actual = Number(actualValue);
    const target = Number(targetValue);

    if (actual >= target) return "COMPLETED";
    return "IN_PROGRESS";
  }
}

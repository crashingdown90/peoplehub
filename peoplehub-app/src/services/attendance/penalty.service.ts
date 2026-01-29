// @ai:cl - Penalty Service for Late Attendance Calculations

import { prisma } from "@/lib/db";
import { ServiceResponse, success, error, ErrorCodes } from "../types";

// ==========================================
// TYPES
// ==========================================

export interface PenaltyConfig {
  gracePeriodMinutes: number;
  penaltyRatePerMinute: number;
  maxPenaltyPerDay: number;
  penaltyTiers?: PenaltyTier[];
}

export interface PenaltyTier {
  minLateMinutes: number;
  maxLateMinutes: number;
  penaltyAmount: number;
}

export interface LateCalculationResult {
  isLate: boolean;
  lateMinutes: number;
  effectiveLateMinutes: number; // After grace period
  penaltyAmount: number;
  penaltyTier?: string;
}

export interface PenaltySummary {
  totalLateCount: number;
  totalLateMinutes: number;
  totalPenaltyAmount: number;
  averageLateMinutes: number;
  latePercentage: number;
}

// ==========================================
// DEFAULT CONFIGURATION
// ==========================================

const DEFAULT_CONFIG: PenaltyConfig = {
  gracePeriodMinutes: 15, // 15 minutes grace period
  penaltyRatePerMinute: 5000, // Rp 5,000 per minute
  maxPenaltyPerDay: 100000, // Max Rp 100,000 per day
  penaltyTiers: [
    { minLateMinutes: 1, maxLateMinutes: 15, penaltyAmount: 25000 },
    { minLateMinutes: 16, maxLateMinutes: 30, penaltyAmount: 50000 },
    { minLateMinutes: 31, maxLateMinutes: 60, penaltyAmount: 75000 },
    { minLateMinutes: 61, maxLateMinutes: 9999, penaltyAmount: 100000 },
  ],
};

// ==========================================
// PENALTY SERVICE
// ==========================================

export class PenaltyService {
  private static config: PenaltyConfig = DEFAULT_CONFIG;

  /**
   * Set custom penalty configuration
   */
  static setConfig(config: Partial<PenaltyConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate late minutes and penalty for a clock-in
   */
  static calculateLate(
    clockInTime: Date,
    shiftStartTime: string, // Format: "HH:mm"
    attendanceDate: Date
  ): LateCalculationResult {
    // Parse shift start time
    const [shiftHour, shiftMinute] = shiftStartTime.split(":").map(Number);
    const shiftStart = new Date(attendanceDate);
    shiftStart.setHours(shiftHour, shiftMinute, 0, 0);

    // Calculate late minutes
    const diffMs = clockInTime.getTime() - shiftStart.getTime();
    const lateMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    // If not late
    if (lateMinutes === 0) {
      return {
        isLate: false,
        lateMinutes: 0,
        effectiveLateMinutes: 0,
        penaltyAmount: 0,
      };
    }

    // Apply grace period
    const effectiveLateMinutes = Math.max(0, lateMinutes - this.config.gracePeriodMinutes);

    // Calculate penalty
    let penaltyAmount = 0;
    let penaltyTier: string | undefined;

    if (effectiveLateMinutes > 0 && this.config.penaltyTiers) {
      // Find applicable tier
      const tier = this.config.penaltyTiers.find(
        (t) =>
          effectiveLateMinutes >= t.minLateMinutes &&
          effectiveLateMinutes <= t.maxLateMinutes
      );

      if (tier) {
        penaltyAmount = tier.penaltyAmount;
        penaltyTier = `${tier.minLateMinutes}-${tier.maxLateMinutes} menit`;
      } else {
        // Fallback to rate-based calculation
        penaltyAmount = effectiveLateMinutes * this.config.penaltyRatePerMinute;
      }
    } else if (effectiveLateMinutes > 0) {
      // Rate-based calculation
      penaltyAmount = effectiveLateMinutes * this.config.penaltyRatePerMinute;
    }

    // Apply max penalty cap
    penaltyAmount = Math.min(penaltyAmount, this.config.maxPenaltyPerDay);

    return {
      isLate: lateMinutes > 0,
      lateMinutes,
      effectiveLateMinutes,
      penaltyAmount,
      penaltyTier,
    };
  }

  /**
   * Get penalty summary for an employee in a period
   */
  static async getPenaltySummary(
    tenantId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<PenaltySummary>> {
    try {
      // Get all late attendances in period
      const attendances = await prisma.attendance.findMany({
        where: {
          tenantId,
          employeeId,
          attendanceDate: {
            gte: startDate,
            lte: endDate,
          },
          lateMinutes: { gt: 0 },
        },
      });

      // Get total work days for percentage calculation
      const totalAttendances = await prisma.attendance.count({
        where: {
          tenantId,
          employeeId,
          attendanceDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalLateCount = attendances.length;
      const totalLateMinutes = attendances.reduce((sum, a) => sum + a.lateMinutes, 0);
      const totalPenaltyAmount = attendances.reduce(
        (sum, a) => sum + Number(a.lateDeductionAmount || 0),
        0
      );
      const averageLateMinutes =
        totalLateCount > 0 ? Math.round(totalLateMinutes / totalLateCount) : 0;
      const latePercentage =
        totalAttendances > 0 ? Math.round((totalLateCount / totalAttendances) * 100) : 0;

      return success({
        totalLateCount,
        totalLateMinutes,
        totalPenaltyAmount,
        averageLateMinutes,
        latePercentage,
      });
    } catch (err) {
      console.error("Get penalty summary error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal mengambil ringkasan penalti");
    }
  }

  /**
   * Update attendance with penalty amount
   */
  static async applyPenalty(
    attendanceId: string,
    penaltyAmount: number
  ): Promise<ServiceResponse<void>> {
    try {
      await prisma.attendance.update({
        where: { id: attendanceId },
        data: { lateDeductionAmount: penaltyAmount },
      });

      return success(undefined);
    } catch (err) {
      console.error("Apply penalty error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal menerapkan penalti");
    }
  }

  /**
   * Get penalty configuration (for admin/settings)
   */
  static getConfig(): PenaltyConfig {
    return { ...this.config };
  }

  /**
   * Format penalty amount to Indonesian Rupiah
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

export const penaltyService = new PenaltyService();

// @ai:ag - Created by Antigravity
// KPI (Key Performance Indicator) types

import { BaseEntity, TenantEntity } from './common.types';

// ==========================================
// KPI PERIOD
// ==========================================

export type KpiPeriodStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface KpiPeriod extends TenantEntity {
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status: KpiPeriodStatus;
    createdById: string;
    indicators?: KpiIndicator[];
    targets?: KpiTarget[];
}

export interface CreateKpiPeriodInput {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
}

export interface UpdateKpiPeriodInput extends Partial<CreateKpiPeriodInput> {
    status?: KpiPeriodStatus;
}

// ==========================================
// KPI INDICATOR
// ==========================================

export type KpiTargetType = 'MINIMIZE' | 'MAXIMIZE' | 'RANGE';
export type KpiUnit = 'PERCENT' | 'NUMBER' | 'CURRENCY' | 'DAYS' | 'SCORE';

export interface KpiIndicator extends BaseEntity {
    periodId: string;
    code: string;
    name: string;
    description?: string | null;
    unit: KpiUnit;
    targetType: KpiTargetType;
    weight: number; // Percentage weight (0-100)
    minValue?: number | null;
    maxValue?: number | null;
    period?: KpiPeriod;
    targets?: KpiTarget[];
}

export interface CreateKpiIndicatorInput {
    code: string;
    name: string;
    description?: string;
    unit: KpiUnit;
    targetType: KpiTargetType;
    weight: number;
    minValue?: number;
    maxValue?: number;
}

export type UpdateKpiIndicatorInput = Partial<CreateKpiIndicatorInput>;

// ==========================================
// KPI TARGET
// ==========================================

export interface KpiTarget extends BaseEntity {
    periodId: string;
    indicatorId: string;
    employeeId: string;
    targetValue: number;
    actualValue: number;
    score: number; // Calculated score (0-100)
    notes?: string | null;
    period?: KpiPeriod;
    indicator?: KpiIndicator;
}

export interface UpdateKpiTargetInput {
    actualValue: number;
    notes?: string;
}

// ==========================================
// KPI SUMMARY
// ==========================================

export interface KpiSummary {
    periodId: string;
    periodName: string;
    employeeId: string;
    totalWeight: number;
    totalScore: number; // Weighted average score
    grade: string; // A, B, C, D, E
    indicators: KpiIndicatorSummary[];
}

export interface KpiIndicatorSummary {
    indicatorId: string;
    indicatorName: string;
    weight: number;
    targetValue: number;
    actualValue: number;
    achievement: number; // Percentage
    score: number;
    weightedScore: number;
}

// ==========================================
// KPI GRADES
// ==========================================

export const KPI_GRADE_LABELS: Record<string, string> = {
    A: 'Sangat Baik',
    B: 'Baik',
    C: 'Cukup',
    D: 'Kurang',
    E: 'Sangat Kurang',
};

export function calculateKpiGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'E';
}

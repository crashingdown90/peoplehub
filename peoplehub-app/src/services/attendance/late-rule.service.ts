// @ai:cl - Late deduction rule service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant, withTenantData } from "@/lib/tenant";
import {
    ServiceResponse,
    success,
    error,
    paginated,
    ErrorCodes,
    PaginationParams,
} from "../types";
import type { LateDeductionRule } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateLateRuleData {
    branchId?: string;
    minLateMinutes: number;
    maxLateMinutes: number;
    deductionAmount: number;
    deductionType?: "FIXED" | "PERCENTAGE";
}

export interface UpdateLateRuleData {
    minLateMinutes?: number;
    maxLateMinutes?: number;
    deductionAmount?: number;
    deductionType?: "FIXED" | "PERCENTAGE";
    isActive?: boolean;
}

export interface LateRuleFilter extends PaginationParams {
    branchId?: string;
    isActive?: boolean;
}

export interface DeductionResult {
    lateMinutes: number;
    deductionAmount: number;
    deductionType: string;
    ruleApplied?: string;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class LateRuleService {
    /**
     * Get all late deduction rules
     */
    static async getAll(
        context: RequestContext,
        filter: LateRuleFilter = {}
    ): Promise<ServiceResponse<LateDeductionRule[]>> {
        const { page = 1, limit = 50, branchId, isActive } = filter;

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
        };

        if (branchId) {
            where.branchId = branchId;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [data, total] = await Promise.all([
            prisma.lateDeductionRule.findMany({
                where,
                orderBy: { minLateMinutes: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.lateDeductionRule.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get rules by branch (with tenant fallback)
     */
    static async getByBranch(
        context: RequestContext,
        branchId?: string
    ): Promise<ServiceResponse<LateDeductionRule[]>> {
        // Get branch-specific rules first
        let rules = await prisma.lateDeductionRule.findMany({
            where: withTenant(context, {
                branchId: branchId || null,
                isActive: true,
            }),
            orderBy: { minLateMinutes: "asc" },
        });

        // If no branch-specific rules, get tenant-wide rules
        if (rules.length === 0 && branchId) {
            rules = await prisma.lateDeductionRule.findMany({
                where: withTenant(context, {
                    branchId: null,
                    isActive: true,
                }),
                orderBy: { minLateMinutes: "asc" },
            });
        }

        return success(rules);
    }

    /**
     * Get rule by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<LateDeductionRule>> {
        const rule = await prisma.lateDeductionRule.findFirst({
            where: withTenant(context, { id }),
        });

        if (!rule) {
            return error(ErrorCodes.NOT_FOUND, "Aturan potongan tidak ditemukan");
        }

        return success(rule);
    }

    /**
     * Create late deduction rule
     */
    static async create(
        context: RequestContext,
        data: CreateLateRuleData
    ): Promise<ServiceResponse<LateDeductionRule>> {
        // Check permission
        if (!["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses");
        }

        // Validate min < max
        if (data.minLateMinutes >= data.maxLateMinutes) {
            return error(
                ErrorCodes.VALIDATION_ERROR,
                "Menit minimum harus lebih kecil dari menit maksimum"
            );
        }

        // Check for overlapping rules
        const overlapping = await prisma.lateDeductionRule.findFirst({
            where: withTenant(context, {
                branchId: data.branchId || null,
                isActive: true,
                OR: [
                    {
                        AND: [
                            { minLateMinutes: { lte: data.minLateMinutes } },
                            { maxLateMinutes: { gt: data.minLateMinutes } },
                        ],
                    },
                    {
                        AND: [
                            { minLateMinutes: { lt: data.maxLateMinutes } },
                            { maxLateMinutes: { gte: data.maxLateMinutes } },
                        ],
                    },
                    {
                        AND: [
                            { minLateMinutes: { gte: data.minLateMinutes } },
                            { maxLateMinutes: { lte: data.maxLateMinutes } },
                        ],
                    },
                ],
            }),
        });

        if (overlapping) {
            return error(
                ErrorCodes.CONFLICT,
                `Aturan tumpang tindih dengan aturan yang ada (${overlapping.minLateMinutes}-${overlapping.maxLateMinutes} menit)`
            );
        }

        const rule = await prisma.lateDeductionRule.create({
            data: withTenantData(context, {
                branchId: data.branchId,
                minLateMinutes: data.minLateMinutes,
                maxLateMinutes: data.maxLateMinutes,
                deductionAmount: data.deductionAmount,
                deductionType: data.deductionType || "FIXED",
                isActive: true,
            }),
        });

        return success(rule);
    }

    /**
     * Update late deduction rule
     */
    static async update(
        context: RequestContext,
        id: string,
        data: UpdateLateRuleData
    ): Promise<ServiceResponse<LateDeductionRule>> {
        // Check permission
        if (!["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses");
        }

        const existing = await prisma.lateDeductionRule.findFirst({
            where: withTenant(context, { id }),
        });

        if (!existing) {
            return error(ErrorCodes.NOT_FOUND, "Aturan potongan tidak ditemukan");
        }

        // Validate min < max if both provided
        const minLate = data.minLateMinutes ?? existing.minLateMinutes;
        const maxLate = data.maxLateMinutes ?? existing.maxLateMinutes;

        if (minLate >= maxLate) {
            return error(
                ErrorCodes.VALIDATION_ERROR,
                "Menit minimum harus lebih kecil dari menit maksimum"
            );
        }

        const rule = await prisma.lateDeductionRule.update({
            where: { id },
            data: {
                minLateMinutes: data.minLateMinutes,
                maxLateMinutes: data.maxLateMinutes,
                deductionAmount: data.deductionAmount,
                deductionType: data.deductionType,
                isActive: data.isActive,
            },
        });

        return success(rule);
    }

    /**
     * Delete late deduction rule
     */
    static async delete(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<void>> {
        // Check permission
        if (!["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses");
        }

        const existing = await prisma.lateDeductionRule.findFirst({
            where: withTenant(context, { id }),
        });

        if (!existing) {
            return error(ErrorCodes.NOT_FOUND, "Aturan potongan tidak ditemukan");
        }

        await prisma.lateDeductionRule.delete({
            where: { id },
        });

        return success(undefined);
    }

    /**
     * Calculate deduction based on late minutes
     */
    static async calculateDeduction(
        context: RequestContext,
        lateMinutes: number,
        branchId?: string,
        baseSalary?: number
    ): Promise<ServiceResponse<DeductionResult>> {
        if (lateMinutes <= 0) {
            return success({
                lateMinutes: 0,
                deductionAmount: 0,
                deductionType: "NONE",
            });
        }

        // Get applicable rules
        const rulesResult = await this.getByBranch(context, branchId);
        if (!rulesResult.success || !rulesResult.data?.length) {
            // No rules configured, no deduction
            return success({
                lateMinutes,
                deductionAmount: 0,
                deductionType: "NO_RULE",
            });
        }

        // Find matching rule
        const matchingRule = rulesResult.data.find(
            (rule) =>
                lateMinutes >= rule.minLateMinutes && lateMinutes <= rule.maxLateMinutes
        );

        if (!matchingRule) {
            // Late but no matching rule (maybe too late for rules)
            // Check if there's a max rule
            const maxRule = rulesResult.data.reduce((max, rule) =>
                rule.maxLateMinutes > max.maxLateMinutes ? rule : max
            );

            if (lateMinutes > maxRule.maxLateMinutes) {
                // Apply max rule for excessive lateness
                return this.applyRule(maxRule, lateMinutes, baseSalary);
            }

            return success({
                lateMinutes,
                deductionAmount: 0,
                deductionType: "NO_MATCHING_RULE",
            });
        }

        return this.applyRule(matchingRule, lateMinutes, baseSalary);
    }

    /**
     * Apply a rule and calculate deduction
     */
    private static applyRule(
        rule: LateDeductionRule,
        lateMinutes: number,
        baseSalary?: number
    ): ServiceResponse<DeductionResult> {
        let deductionAmount: number;

        if (rule.deductionType === "PERCENTAGE") {
            if (!baseSalary) {
                return error(
                    ErrorCodes.VALIDATION_ERROR,
                    "Base salary diperlukan untuk potongan persentase"
                );
            }
            deductionAmount = (baseSalary * Number(rule.deductionAmount)) / 100;
        } else {
            deductionAmount = Number(rule.deductionAmount);
        }

        return success({
            lateMinutes,
            deductionAmount,
            deductionType: rule.deductionType,
            ruleApplied: rule.id,
        });
    }
}

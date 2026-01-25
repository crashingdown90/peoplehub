// @ai:cl - Late deduction rules validation schemas
import { z } from "zod";

/**
 * Schema for creating late deduction rule
 */
export const createLateRuleSchema = z.object({
    branchId: z.string().optional(),
    minLateMinutes: z
        .number()
        .int()
        .min(1, "Minimal 1 menit")
        .max(1440, "Maksimal 1440 menit (24 jam)"),
    maxLateMinutes: z
        .number()
        .int()
        .min(1, "Minimal 1 menit")
        .max(1440, "Maksimal 1440 menit (24 jam)"),
    deductionAmount: z
        .number()
        .min(0, "Potongan tidak boleh negatif"),
    deductionType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
});

/**
 * Schema for updating late deduction rule
 */
export const updateLateRuleSchema = z.object({
    minLateMinutes: z
        .number()
        .int()
        .min(1, "Minimal 1 menit")
        .max(1440, "Maksimal 1440 menit (24 jam)")
        .optional(),
    maxLateMinutes: z
        .number()
        .int()
        .min(1, "Minimal 1 menit")
        .max(1440, "Maksimal 1440 menit (24 jam)")
        .optional(),
    deductionAmount: z
        .number()
        .min(0, "Potongan tidak boleh negatif")
        .optional(),
    deductionType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
    isActive: z.boolean().optional(),
});

/**
 * Schema for filter/query params
 */
export const lateRuleFilterSchema = z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(50).optional(),
    branchId: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
});

// Export types
export type CreateLateRuleInput = z.infer<typeof createLateRuleSchema>;
export type UpdateLateRuleInput = z.infer<typeof updateLateRuleSchema>;
export type LateRuleFilterInput = z.infer<typeof lateRuleFilterSchema>;

// @ai:cl - Temporary shift assignment validation schemas
import { z } from "zod";

export const createTempShiftAssignmentSchema = z.object({
    employeeId: z.string().min(1, "Employee wajib diisi"),
    shiftId: z.string().min(1, "Shift wajib diisi"),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional().default(true),
});

export const updateTempShiftAssignmentSchema = z.object({
    employeeId: z.string().min(1, "Employee wajib diisi").optional(),
    shiftId: z.string().min(1, "Shift wajib diisi").optional(),
    effectiveFrom: z.coerce.date().optional(),
    effectiveTo: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional(),
});

export const tempShiftAssignmentFilterSchema = z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(50).optional(),
    employeeId: z.string().optional(),
    shiftId: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

export type CreateTempShiftAssignmentInput = z.infer<typeof createTempShiftAssignmentSchema>;
export type UpdateTempShiftAssignmentInput = z.infer<typeof updateTempShiftAssignmentSchema>;
export type TempShiftAssignmentFilterInput = z.infer<typeof tempShiftAssignmentFilterSchema>;

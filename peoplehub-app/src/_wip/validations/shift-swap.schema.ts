// @ai:cl - Shift swap validation schemas
import { z } from "zod";
import { ApprovalStatus } from "@prisma/client";

// ==========================================
// CREATE SHIFT SWAP SCHEMA
// ==========================================

export const createShiftSwapSchema = z.object({
    targetEmployeeId: z.string().uuid("Target employee ID tidak valid"),
    originalShiftId: z.string().uuid("Original shift ID tidak valid"),
    targetShiftId: z.string().uuid("Target shift ID tidak valid"),
    swapDate: z.coerce.date({
        required_error: "Tanggal swap wajib diisi",
        invalid_type_error: "Tanggal swap tidak valid",
    }),
    reason: z.string().min(10, "Alasan minimal 10 karakter").max(500, "Alasan maksimal 500 karakter"),
});

export type CreateShiftSwapInput = z.infer<typeof createShiftSwapSchema>;

// ==========================================
// REJECT SHIFT SWAP SCHEMA
// ==========================================

export const rejectShiftSwapSchema = z.object({
    reason: z.string().min(10, "Alasan penolakan minimal 10 karakter").max(500, "Alasan maksimal 500 karakter"),
});

export type RejectShiftSwapInput = z.infer<typeof rejectShiftSwapSchema>;

// ==========================================
// FILTER SCHEMA
// ==========================================

export const shiftSwapFilterSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    sortBy: z.enum(["createdAt", "swapDate", "status"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.nativeEnum(ApprovalStatus).optional(),
    employeeId: z.string().uuid().optional(),
});

export type ShiftSwapFilterInput = z.infer<typeof shiftSwapFilterSchema>;

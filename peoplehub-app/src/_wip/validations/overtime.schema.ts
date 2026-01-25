// @ai:cl - Overtime request validation schemas
import { z } from "zod";

const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schema for creating overtime request
 */
export const createOvertimeSchema = z.object({
    overtimeDate: z.coerce.date({
        required_error: "Tanggal lembur wajib diisi",
        invalid_type_error: "Format tanggal tidak valid",
    }),
    plannedStartTime: z
        .string()
        .regex(timeFormat, "Format waktu tidak valid (HH:mm)"),
    plannedEndTime: z
        .string()
        .regex(timeFormat, "Format waktu tidak valid (HH:mm)"),
    reason: z
        .string()
        .min(10, "Alasan minimal 10 karakter")
        .max(500, "Alasan maksimal 500 karakter"),
    taskDescription: z
        .string()
        .max(1000, "Deskripsi tugas maksimal 1000 karakter")
        .optional(),
    overtimeType: z.enum(["REGULAR", "HOLIDAY", "WEEKEND"]).optional(),
});

/**
 * Schema for updating overtime request
 */
export const updateOvertimeSchema = z.object({
    taskDescription: z
        .string()
        .max(1000, "Deskripsi tugas maksimal 1000 karakter")
        .optional(),
});

/**
 * Schema for completing overtime request
 */
export const completeOvertimeSchema = z.object({
    actualStartTime: z
        .string()
        .regex(timeFormat, "Format waktu tidak valid (HH:mm)"),
    actualEndTime: z
        .string()
        .regex(timeFormat, "Format waktu tidak valid (HH:mm)"),
    taskDescription: z
        .string()
        .max(1000, "Deskripsi tugas maksimal 1000 karakter")
        .optional(),
});

/**
 * Schema for rejection
 */
export const rejectOvertimeSchema = z.object({
    reason: z
        .string()
        .min(5, "Alasan penolakan minimal 5 karakter")
        .max(500, "Alasan penolakan maksimal 500 karakter"),
});

/**
 * Schema for approval (optional comment)
 */
export const approveOvertimeSchema = z.object({
    comment: z.string().max(500, "Komentar maksimal 500 karakter").optional(),
});

/**
 * Schema for filter/query params
 */
export const overtimeFilterSchema = z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"])
        .optional(),
    overtimeType: z.enum(["REGULAR", "HOLIDAY", "WEEKEND"]).optional(),
    employeeId: z.string().optional(),
});

// Export types
export type CreateOvertimeInput = z.infer<typeof createOvertimeSchema>;
export type UpdateOvertimeInput = z.infer<typeof updateOvertimeSchema>;
export type CompleteOvertimeInput = z.infer<typeof completeOvertimeSchema>;
export type RejectOvertimeInput = z.infer<typeof rejectOvertimeSchema>;
export type ApproveOvertimeInput = z.infer<typeof approveOvertimeSchema>;
export type OvertimeFilterInput = z.infer<typeof overtimeFilterSchema>;

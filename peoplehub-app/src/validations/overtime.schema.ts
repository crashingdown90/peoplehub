// @ai:ag - Created by Antigravity
// Overtime request validation schemas

import { z } from 'zod';

/**
 * Create overtime request schema
 */
export const createOvertimeSchema = z.object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu tidak valid (HH:MM)'),
    endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu tidak valid (HH:MM)'),
    reason: z.string().min(10, 'Alasan minimal 10 karakter'),
}).refine(
    (data) => {
        const start = new Date(`2000-01-01T${data.startTime}`);
        const end = new Date(`2000-01-01T${data.endTime}`);
        return end > start;
    },
    {
        message: 'Waktu selesai harus setelah waktu mulai',
        path: ['endTime'],
    }
);

/**
 * Complete overtime request schema (after clocked out)
 */
export const completeOvertimeSchema = z.object({
    actualStartTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu tidak valid (HH:MM)'),
    actualEndTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu tidak valid (HH:MM)'),
    notes: z.string().optional(),
});

/**
 * Approve overtime schema
 */
export const approveOvertimeSchema = z.object({
    approvedHours: z.number().min(0, 'Jam yang disetujui tidak boleh negatif').optional(),
    notes: z.string().optional(),
});

/**
 * Reject overtime schema
 */
export const rejectOvertimeSchema = z.object({
    rejectionReason: z.string().min(10, 'Alasan penolakan minimal 10 karakter'),
});

/**
 * Overtime filter schema
 */
export const overtimeFilterSchema = z.object({
    employeeId: z.string().cuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

// Inferred types
export type CreateOvertimeInput = z.infer<typeof createOvertimeSchema>;
export type CompleteOvertimeInput = z.infer<typeof completeOvertimeSchema>;
export type ApproveOvertimeInput = z.infer<typeof approveOvertimeSchema>;
export type RejectOvertimeInput = z.infer<typeof rejectOvertimeSchema>;
export type OvertimeFilterInput = z.infer<typeof overtimeFilterSchema>;

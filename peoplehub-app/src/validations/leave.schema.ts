// @ai:ag - Created by Antigravity
// Leave validation schemas

import { z } from 'zod';

/**
 * Leave request schema
 */
export const leaveRequestSchema = z.object({
    leaveTypeId: z.string().cuid('Jenis cuti wajib dipilih'),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
    reason: z.string().min(10, 'Alasan minimal 10 karakter'),
    delegateToId: z.string().cuid().optional(),
    attachmentUrl: z.string().url().optional(),
}).refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
        message: 'Tanggal selesai harus sama atau setelah tanggal mulai',
        path: ['endDate'],
    }
);

/**
 * Approve/reject leave schema
 */
export const approveRejectLeaveSchema = z.object({
    action: z.enum(['approve', 'reject']),
    rejectionReason: z.string().optional(),
}).refine(
    (data) => data.action !== 'reject' || (data.rejectionReason && data.rejectionReason.length >= 10),
    {
        message: 'Alasan penolakan minimal 10 karakter',
        path: ['rejectionReason'],
    }
);

/**
 * Leave type schema (admin)
 */
export const leaveTypeSchema = z.object({
    code: z.string().min(1, 'Kode wajib diisi').max(10, 'Kode maksimal 10 karakter'),
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    defaultBalance: z.number().min(0, 'Saldo tidak boleh negatif'),
    isPaid: z.boolean().default(true),
    requiresAttachment: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

// Inferred types
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type ApproveRejectLeaveInput = z.infer<typeof approveRejectLeaveSchema>;
export type LeaveTypeInput = z.infer<typeof leaveTypeSchema>;

// @ai:ag - Created by Antigravity
// Reimburse validation schemas (Zod v4 syntax)

import { z } from 'zod';

/**
 * Reimburse item schema
 */
export const reimburseItemSchema = z.object({
    description: z.string().min(1, 'Deskripsi item wajib diisi').max(200, 'Deskripsi maksimal 200 karakter'),
    amount: z.number().min(1, 'Jumlah minimal Rp 1'),
    date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
    receiptUrl: z.string().url('URL bukti tidak valid').optional(),
});

export type ReimburseItemInput = z.infer<typeof reimburseItemSchema>;

/**
 * Reimburse request schema
 */
export const reimburseRequestSchema = z.object({
    category: z.enum(['MEDICAL', 'TRANSPORT', 'COMMUNICATION', 'MEALS', 'OFFICE_SUPPLIES', 'TRAINING', 'PARKING', 'OTHER']),
    description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(500, 'Deskripsi maksimal 500 karakter'),
    notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
    items: z.array(reimburseItemSchema).min(1, 'Minimal 1 item reimburse'),
});

export type ReimburseRequestInput = z.infer<typeof reimburseRequestSchema>;

/**
 * Quick reimburse (single item)
 */
export const quickReimburseSchema = z.object({
    category: z.enum(['MEDICAL', 'TRANSPORT', 'COMMUNICATION', 'MEALS', 'OFFICE_SUPPLIES', 'TRAINING', 'PARKING', 'OTHER']),
    description: z.string().min(5, 'Deskripsi minimal 5 karakter').max(200, 'Deskripsi maksimal 200 karakter'),
    amount: z.number().min(1, 'Jumlah minimal Rp 1'),
    date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
    receiptUrl: z.string().url('URL bukti tidak valid').optional(),
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

export type QuickReimburseInput = z.infer<typeof quickReimburseSchema>;

/**
 * Approve reimburse request
 */
export const approveReimburseSchema = z.object({
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

/**
 * Reject reimburse request
 */
export const rejectReimburseSchema = z.object({
    reason: z.string().min(10, 'Alasan minimal 10 karakter').max(500, 'Alasan maksimal 500 karakter'),
});

export type RejectReimburseInput = z.infer<typeof rejectReimburseSchema>;

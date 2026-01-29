// @ai:ag - Created by Antigravity
// Travel validation schemas (Zod v4 syntax)

import { z } from 'zod';

/**
 * Travel itinerary item schema
 */
export const travelItinerarySchema = z.object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    time: z.string().optional(),
    activity: z.string().min(1, 'Kegiatan wajib diisi').max(200, 'Kegiatan maksimal 200 karakter'),
    location: z.string().min(1, 'Lokasi wajib diisi').max(200, 'Lokasi maksimal 200 karakter'),
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

export type TravelItineraryInput = z.infer<typeof travelItinerarySchema>;

/**
 * Travel request schema
 */
export const travelRequestSchema = z.object({
    destination: z.string().min(1, 'Tujuan wajib diisi').max(200, 'Tujuan maksimal 200 karakter'),
    purpose: z.string().min(10, 'Keperluan minimal 10 karakter').max(500, 'Keperluan maksimal 500 karakter'),
    departureDate: z.string().min(1, 'Tanggal keberangkatan wajib diisi'),
    returnDate: z.string().min(1, 'Tanggal kembali wajib diisi'),
    estimatedBudget: z.number().min(0, 'Estimasi biaya tidak boleh negatif'),
    notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
    itinerary: z.array(travelItinerarySchema).optional(),
}).refine(
    (data) => new Date(data.returnDate) >= new Date(data.departureDate),
    {
        message: 'Tanggal kembali harus sama atau setelah tanggal keberangkatan',
        path: ['returnDate'],
    }
);

export type TravelRequestInput = z.infer<typeof travelRequestSchema>;

/**
 * Travel expense schema
 */
export const travelExpenseSchema = z.object({
    category: z.enum(['TRANSPORT', 'ACCOMMODATION', 'MEALS', 'COMMUNICATION', 'OTHER']),
    description: z.string().min(1, 'Deskripsi wajib diisi').max(200, 'Deskripsi maksimal 200 karakter'),
    amount: z.number().min(0, 'Jumlah tidak boleh negatif'),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    receiptUrl: z.string().url('URL bukti tidak valid').optional(),
});

export type TravelExpenseInput = z.infer<typeof travelExpenseSchema>;

/**
 * Approve travel request
 */
export const approveTravelSchema = z.object({
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

/**
 * Reject travel request
 */
export const rejectTravelSchema = z.object({
    reason: z.string().min(10, 'Alasan minimal 10 karakter').max(500, 'Alasan maksimal 500 karakter'),
});

export type RejectTravelInput = z.infer<typeof rejectTravelSchema>;

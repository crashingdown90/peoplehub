// @ai:ag - Created by Antigravity
// KPI validation schemas (Zod v4 syntax)

import { z } from 'zod';

/**
 * Update KPI target actual value
 */
export const kpiTargetUpdateSchema = z.object({
    actualValue: z.number().min(0, 'Nilai aktual tidak boleh negatif'),
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

export type KpiTargetUpdateInput = z.infer<typeof kpiTargetUpdateSchema>;

/**
 * Create KPI period
 */
export const kpiPeriodSchema = z.object({
    name: z.string().min(1, 'Nama periode wajib diisi').max(100, 'Nama periode maksimal 100 karakter'),
    description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
}).refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
        message: 'Tanggal selesai harus setelah tanggal mulai',
        path: ['endDate'],
    }
);

export type KpiPeriodInput = z.infer<typeof kpiPeriodSchema>;

/**
 * Create KPI indicator
 */
export const kpiIndicatorSchema = z.object({
    code: z.string()
        .min(1, 'Kode indikator wajib diisi')
        .max(20, 'Kode maksimal 20 karakter')
        .regex(/^[A-Z0-9_-]+$/i, 'Kode hanya boleh huruf, angka, underscore, dan dash'),
    name: z.string().min(1, 'Nama indikator wajib diisi').max(100, 'Nama maksimal 100 karakter'),
    description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
    unit: z.enum(['PERCENT', 'NUMBER', 'CURRENCY', 'DAYS', 'SCORE']),
    targetType: z.enum(['MINIMIZE', 'MAXIMIZE', 'RANGE']),
    weight: z.number().min(0, 'Bobot minimal 0').max(100, 'Bobot maksimal 100'),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
});

export type KpiIndicatorInput = z.infer<typeof kpiIndicatorSchema>;

/**
 * Set KPI target for employee
 */
export const kpiTargetSchema = z.object({
    indicatorId: z.string().min(1, 'Indikator wajib dipilih'),
    employeeId: z.string().min(1, 'Karyawan wajib dipilih'),
    targetValue: z.number().min(0, 'Nilai target tidak boleh negatif'),
});

export type KpiTargetInput = z.infer<typeof kpiTargetSchema>;

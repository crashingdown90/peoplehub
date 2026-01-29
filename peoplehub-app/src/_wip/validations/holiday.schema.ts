// @ai:cl - Holiday validation schemas
import { z } from "zod";

// ==========================================
// CREATE HOLIDAY SCHEMA
// ==========================================

export const createHolidaySchema = z.object({
    name: z.string().min(1, "Nama holiday wajib diisi").max(200, "Nama maksimal 200 karakter"),
    holidayDate: z.coerce.date({
        required_error: "Tanggal holiday wajib diisi",
        invalid_type_error: "Tanggal holiday tidak valid",
    }),
    isNational: z.boolean().optional().default(false),
    branchId: z.string().uuid().optional(),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;

// ==========================================
// UPDATE HOLIDAY SCHEMA
// ==========================================

export const updateHolidaySchema = z.object({
    name: z.string().min(1, "Nama holiday wajib diisi").max(200, "Nama maksimal 200 karakter").optional(),
    holidayDate: z.coerce.date().optional(),
    isNational: z.boolean().optional(),
    branchId: z.string().uuid().optional(),
});

export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;

// ==========================================
// FILTER SCHEMA
// ==========================================

export const holidayFilterSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(200).optional().default(100),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    branchId: z.string().uuid().optional(),
    isNational: z.coerce.boolean().optional(),
});

export type HolidayFilterInput = z.infer<typeof holidayFilterSchema>;

// ==========================================
// BULK CREATE SCHEMA
// ==========================================

export const bulkCreateHolidaySchema = z.object({
    holidays: z.array(createHolidaySchema).min(1, "Minimal 1 holiday").max(100, "Maksimal 100 holidays"),
});

export type BulkCreateHolidayInput = z.infer<typeof bulkCreateHolidaySchema>;

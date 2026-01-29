// @ai:cl - Letter request validation schemas
import { z } from "zod";
import { ApprovalStatus } from "@prisma/client";

// ==========================================
// LETTER CATEGORY SCHEMAS
// ==========================================

export const createLetterCategorySchema = z.object({
    code: z.string().min(1, "Kode wajib diisi").max(50, "Kode maksimal 50 karakter").toUpperCase(),
    name: z.string().min(1, "Nama wajib diisi").max(200, "Nama maksimal 200 karakter"),
    requiresManagerApproval: z.boolean().optional().default(true),
    templateFields: z.record(z.unknown()).optional(),
});

export type CreateLetterCategoryInput = z.infer<typeof createLetterCategorySchema>;

export const updateLetterCategorySchema = z.object({
    name: z.string().min(1, "Nama wajib diisi").max(200, "Nama maksimal 200 karakter").optional(),
    requiresManagerApproval: z.boolean().optional(),
    templateFields: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
});

export type UpdateLetterCategoryInput = z.infer<typeof updateLetterCategorySchema>;

// ==========================================
// LETTER REQUEST SCHEMAS
// ==========================================

export const createLetterRequestSchema = z.object({
    letterCategoryId: z.string().uuid("Letter category ID tidak valid"),
    payload: z.record(z.unknown()).optional(),
});

export type CreateLetterRequestInput = z.infer<typeof createLetterRequestSchema>;

// ==========================================
// APPROVE HRD SCHEMA (with letter issuance)
// ==========================================

export const approveHrdLetterSchema = z.object({
    letterNumber: z.string().min(1, "Nomor surat wajib diisi").max(100, "Nomor surat maksimal 100 karakter"),
    letterPdfUrl: z.string().url("URL PDF tidak valid").optional(),
});

export type ApproveHrdLetterInput = z.infer<typeof approveHrdLetterSchema>;

// ==========================================
// REJECT SCHEMA
// ==========================================

export const rejectLetterSchema = z.object({
    reason: z.string().min(10, "Alasan penolakan minimal 10 karakter").max(500, "Alasan maksimal 500 karakter"),
});

export type RejectLetterInput = z.infer<typeof rejectLetterSchema>;

// ==========================================
// FILTER SCHEMA
// ==========================================

export const letterFilterSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    sortBy: z.enum(["createdAt", "status"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.nativeEnum(ApprovalStatus).optional(),
    letterCategoryId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
});

export type LetterFilterInput = z.infer<typeof letterFilterSchema>;

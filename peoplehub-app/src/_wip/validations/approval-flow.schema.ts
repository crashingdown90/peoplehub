// @ai:cl - Approval flow validation schemas
import { z } from "zod";
import { RequestType } from "@prisma/client";

// ==========================================
// APPROVAL FLOW LEVEL SCHEMA
// ==========================================

export const approvalFlowLevelSchema = z.object({
    level: z.number().int().positive("Level harus bilangan positif"),
    approverRole: z.string().min(1, "Approver role wajib diisi"),
    isRequired: z.boolean().default(true),
});

export type ApprovalFlowLevelInput = z.infer<typeof approvalFlowLevelSchema>;

// ==========================================
// CREATE APPROVAL FLOW SCHEMA
// ==========================================

export const createApprovalFlowSchema = z.object({
    requestType: z.nativeEnum(RequestType, {
        required_error: "Request type wajib diisi",
    }),
    branchId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    levels: z
        .array(approvalFlowLevelSchema)
        .min(1, "Minimal 1 level approval diperlukan")
        .max(5, "Maksimal 5 level approval"),
});

export type CreateApprovalFlowInput = z.infer<typeof createApprovalFlowSchema>;

// ==========================================
// UPDATE APPROVAL FLOW SCHEMA
// ==========================================

export const updateApprovalFlowSchema = z.object({
    levels: z
        .array(approvalFlowLevelSchema)
        .min(1, "Minimal 1 level approval diperlukan")
        .max(5, "Maksimal 5 level approval")
        .optional(),
    isActive: z.boolean().optional(),
});

export type UpdateApprovalFlowInput = z.infer<typeof updateApprovalFlowSchema>;

// ==========================================
// FILTER SCHEMA
// ==========================================

export const approvalFlowFilterSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    requestType: z.nativeEnum(RequestType).optional(),
    isActive: z.coerce.boolean().optional(),
});

export type ApprovalFlowFilterInput = z.infer<typeof approvalFlowFilterSchema>;

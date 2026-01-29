// @ai:cl - Letter request service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant, withTenantData, scopeFilter } from "@/lib/tenant";
import {
    ServiceResponse,
    success,
    error,
    paginated,
    ErrorCodes,
    PaginationParams,
    DateRangeFilter,
} from "../types";
import type { LetterRequest, LetterCategory, ApprovalStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateLetterRequestData {
    letterCategoryId: string;
    payload?: Record<string, unknown>;
}

export interface LetterRequestFilter extends DateRangeFilter, PaginationParams {
    employeeId?: string;
    status?: ApprovalStatus;
    letterCategoryId?: string;
}

export interface LetterRequestWithDetails extends LetterRequest {
    letterCategory: LetterCategory;
    employee?: {
        fullName: string;
        employeeNumber: string;
    };
}

export interface CreateLetterCategoryData {
    code: string;
    name: string;
    requiresManagerApproval?: boolean;
    templateFields?: Record<string, unknown>;
}

export interface UpdateLetterCategoryData {
    name?: string;
    requiresManagerApproval?: boolean;
    templateFields?: Record<string, unknown>;
    isActive?: boolean;
}

// ==========================================
// LETTER CATEGORY SERVICE
// ==========================================

export class LetterCategoryService {
    /**
     * Create letter category
     */
    static async create(
        context: RequestContext,
        data: CreateLetterCategoryData
    ): Promise<ServiceResponse<LetterCategory>> {
        // Only admin roles can create categories
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk membuat kategori surat");
        }

        // Check for duplicate code
        const existing = await prisma.letterCategory.findFirst({
            where: {
                tenantId: context.tenantId,
                code: data.code,
            },
        });

        if (existing) {
            return error(ErrorCodes.ALREADY_EXISTS, "Kode kategori sudah digunakan");
        }

        const category = await prisma.letterCategory.create({
            data: withTenantData(context, {
                code: data.code,
                name: data.name,
                requiresManagerApproval: data.requiresManagerApproval ?? true,
                templateFields: data.templateFields,
                isActive: true,
            }),
        });

        return success(category);
    }

    /**
     * Get all letter categories
     */
    static async getAll(
        context: RequestContext,
        isActive?: boolean
    ): Promise<ServiceResponse<LetterCategory[]>> {
        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
        };

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const categories = await prisma.letterCategory.findMany({
            where,
            orderBy: { name: "asc" },
        });

        return success(categories);
    }

    /**
     * Get category by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<LetterCategory>> {
        const category = await prisma.letterCategory.findFirst({
            where: withTenant(context, { id }),
        });

        if (!category) {
            return error(ErrorCodes.NOT_FOUND, "Kategori surat tidak ditemukan");
        }

        return success(category);
    }

    /**
     * Update letter category
     */
    static async update(
        context: RequestContext,
        id: string,
        data: UpdateLetterCategoryData
    ): Promise<ServiceResponse<LetterCategory>> {
        // Only admin roles can update categories
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk update kategori");
        }

        const existing = await prisma.letterCategory.findFirst({
            where: withTenant(context, { id }),
        });

        if (!existing) {
            return error(ErrorCodes.NOT_FOUND, "Kategori surat tidak ditemukan");
        }

        const updated = await prisma.letterCategory.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.requiresManagerApproval !== undefined && {
                    requiresManagerApproval: data.requiresManagerApproval,
                }),
                ...(data.templateFields && { templateFields: data.templateFields }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });

        return success(updated);
    }

    /**
     * Delete letter category
     */
    static async delete(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<boolean>> {
        // Only admin roles can delete categories
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk delete kategori");
        }

        const existing = await prisma.letterCategory.findFirst({
            where: withTenant(context, { id }),
        });

        if (!existing) {
            return error(ErrorCodes.NOT_FOUND, "Kategori surat tidak ditemukan");
        }

        // Check if category is being used
        const usageCount = await prisma.letterRequest.count({
            where: { letterCategoryId: id },
        });

        if (usageCount > 0) {
            return error(
                ErrorCodes.CANNOT_MODIFY,
                "Kategori tidak dapat dihapus karena masih digunakan"
            );
        }

        await prisma.letterCategory.delete({
            where: { id },
        });

        return success(true);
    }
}

// ==========================================
// LETTER REQUEST SERVICE
// ==========================================

export class LetterService {
    /**
     * Create letter request
     */
    static async create(
        context: RequestContext,
        data: CreateLetterRequestData
    ): Promise<ServiceResponse<LetterRequestWithDetails>> {
        if (!context.employeeId) {
            return error(ErrorCodes.VALIDATION_ERROR, "Employee ID diperlukan");
        }

        // Validate category exists and is active
        const category = await prisma.letterCategory.findFirst({
            where: {
                id: data.letterCategoryId,
                tenantId: context.tenantId,
                isActive: true,
            },
        });

        if (!category) {
            return error(ErrorCodes.NOT_FOUND, "Kategori surat tidak ditemukan atau tidak aktif");
        }

        const letterRequest = await prisma.letterRequest.create({
            data: withTenantData(context, {
                employeeId: context.employeeId,
                letterCategoryId: data.letterCategoryId,
                payload: data.payload,
                status: "PENDING",
            }),
            include: {
                letterCategory: true,
            },
        });

        return success(letterRequest);
    }

    /**
     * Get letter request by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<LetterRequestWithDetails>> {
        const letterRequest = await prisma.letterRequest.findFirst({
            where: withTenant(context, { id }),
            include: {
                letterCategory: true,
                employee: {
                    select: { fullName: true, employeeNumber: true },
                },
            },
        });

        if (!letterRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request surat tidak ditemukan");
        }

        return success(letterRequest);
    }

    /**
     * Get letter requests with filters
     */
    static async getByEmployee(
        context: RequestContext,
        filter: LetterRequestFilter
    ): Promise<ServiceResponse<LetterRequest[]>> {
        const {
            page = 1,
            limit = 20,
            sortBy = "createdAt",
            sortOrder = "desc",
            startDate,
            endDate,
            status,
            letterCategoryId,
            employeeId,
        } = filter;

        // Build where clause with scope filter
        const where: Record<string, unknown> = {
            ...scopeFilter(context),
        };

        if (employeeId) {
            where.employeeId = employeeId;
        }

        if (startDate) {
            where.createdAt = {
                ...(where.createdAt as object || {}),
                gte: new Date(startDate),
            };
        }
        if (endDate) {
            where.createdAt = {
                ...(where.createdAt as object || {}),
                lte: new Date(endDate),
            };
        }
        if (status) {
            where.status = status;
        }
        if (letterCategoryId) {
            where.letterCategoryId = letterCategoryId;
        }

        const [data, total] = await Promise.all([
            prisma.letterRequest.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    letterCategory: true,
                    employee: {
                        select: { fullName: true, employeeNumber: true },
                    },
                },
            }),
            prisma.letterRequest.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get pending letter requests for approval
     */
    static async getPending(
        context: RequestContext,
        filter: PaginationParams
    ): Promise<ServiceResponse<LetterRequest[]>> {
        const { page = 1, limit = 20 } = filter;

        if (!["MANAGER", "HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses");
        }

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
        };

        // Different status based on role
        if (context.role === "MANAGER") {
            const subordinates = await prisma.employee.findMany({
                where: {
                    tenantId: context.tenantId,
                    managerId: context.employeeId,
                },
                select: { id: true },
            });
            where.employeeId = { in: subordinates.map((s) => s.id) };
            where.status = "PENDING";
        } else {
            // HRD sees APPROVED_MANAGER
            where.status = "APPROVED_MANAGER";
        }

        const [data, total] = await Promise.all([
            prisma.letterRequest.findMany({
                where,
                orderBy: { createdAt: "asc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    letterCategory: true,
                    employee: {
                        select: { fullName: true, employeeNumber: true, department: true },
                    },
                },
            }),
            prisma.letterRequest.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Approve letter request (Manager level)
     */
    static async approveManager(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<LetterRequest>> {
        if (!["MANAGER", "HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk approve");
        }

        const letterRequest = await prisma.letterRequest.findFirst({
            where: withTenant(context, { id }),
        });

        if (!letterRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request surat tidak ditemukan");
        }

        if (letterRequest.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat diapprove");
        }

        const updated = await prisma.letterRequest.update({
            where: { id },
            data: {
                status: "APPROVED_MANAGER",
                approvedByManagerId: context.userId,
                managerApprovedAt: new Date(),
            },
        });

        return success(updated);
    }

    /**
     * Approve letter request and issue letter (HRD level - final)
     */
    static async approveHrd(
        context: RequestContext,
        id: string,
        letterNumber: string,
        letterPdfUrl?: string
    ): Promise<ServiceResponse<LetterRequest>> {
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk issue letter");
        }

        const letterRequest = await prisma.letterRequest.findFirst({
            where: withTenant(context, { id }),
        });

        if (!letterRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request surat tidak ditemukan");
        }

        if (letterRequest.status !== "APPROVED_MANAGER") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request harus diapprove manager terlebih dahulu");
        }

        // Check for duplicate letter number
        if (letterNumber) {
            const existing = await prisma.letterRequest.findFirst({
                where: {
                    tenantId: context.tenantId,
                    letterNumber,
                    id: { not: id },
                },
            });

            if (existing) {
                return error(ErrorCodes.ALREADY_EXISTS, "Nomor surat sudah digunakan");
            }
        }

        const updated = await prisma.letterRequest.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedByHrdId: context.userId,
                hrdApprovedAt: new Date(),
                letterNumber,
                letterPdfUrl,
                issuedAt: new Date(),
                issuedById: context.userId,
            },
        });

        return success(updated);
    }

    /**
     * Reject letter request
     */
    static async reject(
        context: RequestContext,
        id: string,
        reason: string
    ): Promise<ServiceResponse<LetterRequest>> {
        if (!["MANAGER", "HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk reject");
        }

        if (!reason || reason.trim() === "") {
            return error(ErrorCodes.VALIDATION_ERROR, "Alasan penolakan wajib diisi");
        }

        const letterRequest = await prisma.letterRequest.findFirst({
            where: withTenant(context, { id }),
        });

        if (!letterRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request surat tidak ditemukan");
        }

        if (!["PENDING", "APPROVED_MANAGER"].includes(letterRequest.status)) {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat direject");
        }

        const updated = await prisma.letterRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
            },
        });

        return success(updated);
    }

    /**
     * Cancel letter request (by requester)
     */
    static async cancel(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<LetterRequest>> {
        const letterRequest = await prisma.letterRequest.findFirst({
            where: withTenant(context, { id }),
        });

        if (!letterRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request surat tidak ditemukan");
        }

        if (letterRequest.employeeId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya pemilik request yang dapat membatalkan");
        }

        if (!["PENDING", "APPROVED_MANAGER"].includes(letterRequest.status)) {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat dibatalkan");
        }

        const updated = await prisma.letterRequest.update({
            where: { id },
            data: {
                status: "CANCELLED",
            },
        });

        return success(updated);
    }
}

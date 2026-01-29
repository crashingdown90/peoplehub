// @ai:cl - Reimburse request service - business logic layer
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
import type { ReimburseRequest, ApprovalStatus, ReimburseItem } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface ReimburseItemData {
    description: string;
    amount: number;
    receiptUrl?: string;
    date: Date;
}

export interface CreateReimburseData {
    category: string;
    description: string;
    items: ReimburseItemData[];
}

export interface ReimburseFilter extends DateRangeFilter, PaginationParams {
    employeeId?: string;
    status?: ApprovalStatus;
    category?: string;
}

export interface ReimburseWithItems extends ReimburseRequest {
    items: ReimburseItem[];
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class ReimburseService {
    /**
     * Create reimburse request with items
     */
    static async create(
        context: RequestContext,
        data: CreateReimburseData
    ): Promise<ServiceResponse<ReimburseWithItems>> {
        // Validate items
        if (!data.items || data.items.length === 0) {
            return error(ErrorCodes.VALIDATION_ERROR, "Minimal 1 item reimburse diperlukan");
        }

        // Calculate total amount
        const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

        // Create reimburse request with items in transaction
        const reimburseRequest = await prisma.$transaction(async (tx) => {
            const request = await tx.reimburseRequest.create({
                data: withTenantData(context, {
                    employeeId: context.employeeId!,
                    category: data.category,
                    description: data.description,
                    totalAmount,
                    status: "PENDING",
                }),
            });

            // Create items
            const items = await Promise.all(
                data.items.map((item) =>
                    tx.reimburseItem.create({
                        data: {
                            reimburseId: request.id,
                            description: item.description,
                            amount: item.amount,
                            receiptUrl: item.receiptUrl,
                            date: item.date,
                        },
                    })
                )
            );

            return { ...request, items };
        });

        return success(reimburseRequest);
    }

    /**
     * Get reimburse request by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ReimburseWithItems>> {
        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
            include: {
                employee: {
                    select: { fullName: true, employeeNumber: true },
                },
                items: true,
            },
        });

        if (!reimburseRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request reimburse tidak ditemukan");
        }

        return success(reimburseRequest);
    }

    /**
     * Get reimburse requests for employee
     */
    static async getByEmployee(
        context: RequestContext,
        filter: ReimburseFilter
    ): Promise<ServiceResponse<ReimburseRequest[]>> {
        const {
            page = 1,
            limit = 20,
            sortBy = "createdAt",
            sortOrder = "desc",
            startDate,
            endDate,
            status,
            category,
            employeeId,
        } = filter;

        // Build where clause with scope filter
        const where: Record<string, unknown> = {
            ...scopeFilter(context),
            deletedAt: null,
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
        if (category) {
            where.category = category;
        }

        const [data, total] = await Promise.all([
            prisma.reimburseRequest.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employee: {
                        select: { fullName: true, employeeNumber: true },
                    },
                    items: true,
                },
            }),
            prisma.reimburseRequest.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get pending reimburse requests for approval
     */
    static async getPending(
        context: RequestContext,
        filter: PaginationParams
    ): Promise<ServiceResponse<ReimburseRequest[]>> {
        const { page = 1, limit = 20 } = filter;

        if (!["MANAGER", "HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses");
        }

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
            deletedAt: null,
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
        } else if (context.role === "FINANCE") {
            where.status = "APPROVED_HRD";
        } else {
            // HRD sees APPROVED_MANAGER
            where.status = "APPROVED_MANAGER";
        }

        const [data, total] = await Promise.all([
            prisma.reimburseRequest.findMany({
                where,
                orderBy: { createdAt: "asc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employee: {
                        select: { fullName: true, employeeNumber: true, department: true },
                    },
                    items: true,
                },
            }),
            prisma.reimburseRequest.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Approve reimburse request (Manager level)
     */
    static async approveManager(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ReimburseRequest>> {
        if (!["MANAGER", "HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk approve");
        }

        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!reimburseRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request reimburse tidak ditemukan");
        }

        if (reimburseRequest.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat diapprove");
        }

        const updated = await prisma.reimburseRequest.update({
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
     * Approve reimburse request (Finance level - final)
     */
    static async approveFinance(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ReimburseRequest>> {
        if (!["FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk approve");
        }

        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!reimburseRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request reimburse tidak ditemukan");
        }

        if (reimburseRequest.status !== "APPROVED_MANAGER") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request harus diapprove manager terlebih dahulu");
        }

        const updated = await prisma.reimburseRequest.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedByFinanceId: context.userId,
                financeApprovedAt: new Date(),
            },
        });

        return success(updated);
    }

    /**
     * Mark reimburse as paid
     */
    static async markPaid(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ReimburseRequest>> {
        if (!["FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses");
        }

        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!reimburseRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request reimburse tidak ditemukan");
        }

        if (reimburseRequest.status !== "APPROVED") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request harus diapprove terlebih dahulu");
        }

        const updated = await prisma.reimburseRequest.update({
            where: { id },
            data: {
                paidAt: new Date(),
            },
        });

        return success(updated);
    }

    /**
     * Reject reimburse request
     */
    static async reject(
        context: RequestContext,
        id: string,
        reason: string
    ): Promise<ServiceResponse<ReimburseRequest>> {
        if (!["MANAGER", "HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk reject");
        }

        if (!reason || reason.trim() === "") {
            return error(ErrorCodes.VALIDATION_ERROR, "Alasan penolakan wajib diisi");
        }

        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!reimburseRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request reimburse tidak ditemukan");
        }

        if (!["PENDING", "APPROVED_MANAGER"].includes(reimburseRequest.status)) {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat direject");
        }

        const updated = await prisma.reimburseRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
            },
        });

        return success(updated);
    }

    /**
     * Cancel reimburse request (by requester)
     */
    static async cancel(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ReimburseRequest>> {
        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!reimburseRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request reimburse tidak ditemukan");
        }

        if (reimburseRequest.employeeId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya pemilik request yang dapat membatalkan");
        }

        if (!["PENDING", "APPROVED_MANAGER"].includes(reimburseRequest.status)) {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat dibatalkan");
        }

        const updated = await prisma.reimburseRequest.update({
            where: { id },
            data: {
                status: "CANCELLED",
            },
        });

        return success(updated);
    }
}

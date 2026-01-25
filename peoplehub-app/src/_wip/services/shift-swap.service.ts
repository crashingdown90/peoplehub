// @ai:cl - Shift swap service - business logic layer
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
import type { ShiftSwap, ApprovalStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateShiftSwapData {
    targetEmployeeId: string;
    originalShiftId: string;
    targetShiftId: string;
    swapDate: Date;
    reason: string;
}

export interface ShiftSwapFilter extends DateRangeFilter, PaginationParams {
    employeeId?: string;
    status?: ApprovalStatus;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class ShiftSwapService {
    /**
     * Create shift swap request
     */
    static async create(
        context: RequestContext,
        data: CreateShiftSwapData
    ): Promise<ServiceResponse<ShiftSwap>> {
        // Validate requester has an employee ID
        if (!context.employeeId) {
            return error(ErrorCodes.VALIDATION_ERROR, "Employee ID diperlukan");
        }

        // Cannot swap with yourself
        if (data.targetEmployeeId === context.employeeId) {
            return error(ErrorCodes.VALIDATION_ERROR, "Tidak dapat swap shift dengan diri sendiri");
        }

        // Validate swap date is in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const swapDate = new Date(data.swapDate);
        swapDate.setHours(0, 0, 0, 0);

        if (swapDate < today) {
            return error(ErrorCodes.VALIDATION_ERROR, "Tanggal swap harus di masa depan");
        }

        // Validate both employees exist and are in the same tenant
        const [requester, target] = await Promise.all([
            prisma.employee.findFirst({
                where: withTenant(context, { id: context.employeeId, deletedAt: null }),
            }),
            prisma.employee.findFirst({
                where: withTenant(context, { id: data.targetEmployeeId, deletedAt: null }),
            }),
        ]);

        if (!requester) {
            return error(ErrorCodes.NOT_FOUND, "Data karyawan requester tidak ditemukan");
        }

        if (!target) {
            return error(ErrorCodes.NOT_FOUND, "Data karyawan target tidak ditemukan");
        }

        // Validate both shifts exist
        const [originalShift, targetShift] = await Promise.all([
            prisma.shift.findFirst({
                where: { id: data.originalShiftId, deletedAt: null },
            }),
            prisma.shift.findFirst({
                where: { id: data.targetShiftId, deletedAt: null },
            }),
        ]);

        if (!originalShift) {
            return error(ErrorCodes.NOT_FOUND, "Shift asli tidak ditemukan");
        }

        if (!targetShift) {
            return error(ErrorCodes.NOT_FOUND, "Shift target tidak ditemukan");
        }

        // Create shift swap request
        const shiftSwap = await prisma.shiftSwap.create({
            data: withTenantData(context, {
                requesterId: context.employeeId,
                targetEmployeeId: data.targetEmployeeId,
                originalShiftId: data.originalShiftId,
                targetShiftId: data.targetShiftId,
                swapDate: data.swapDate,
                reason: data.reason,
                status: "PENDING",
            }),
        });

        return success(shiftSwap);
    }

    /**
     * Get shift swap by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ShiftSwap>> {
        const shiftSwap = await prisma.shiftSwap.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
            include: {
                requester: {
                    select: { fullName: true, employeeNumber: true },
                },
                targetEmployee: {
                    select: { fullName: true, employeeNumber: true },
                },
                originalShift: {
                    select: { name: true, startTime: true, endTime: true },
                },
                targetShift: {
                    select: { name: true, startTime: true, endTime: true },
                },
            },
        });

        if (!shiftSwap) {
            return error(ErrorCodes.NOT_FOUND, "Request shift swap tidak ditemukan");
        }

        return success(shiftSwap);
    }

    /**
     * Get shift swap requests for employee
     */
    static async getByEmployee(
        context: RequestContext,
        filter: ShiftSwapFilter
    ): Promise<ServiceResponse<ShiftSwap[]>> {
        const {
            page = 1,
            limit = 20,
            sortBy = "createdAt",
            sortOrder = "desc",
            startDate,
            endDate,
            status,
            employeeId,
        } = filter;

        // Build where clause
        const where: Record<string, unknown> = {
            ...scopeFilter(context),
            deletedAt: null,
        };

        // Filter by employee - either as requester or target
        if (employeeId) {
            where.OR = [
                { requesterId: employeeId },
                { targetEmployeeId: employeeId },
            ];
        }

        if (startDate) {
            where.swapDate = {
                ...(where.swapDate as object || {}),
                gte: new Date(startDate),
            };
        }
        if (endDate) {
            where.swapDate = {
                ...(where.swapDate as object || {}),
                lte: new Date(endDate),
            };
        }
        if (status) {
            where.status = status;
        }

        const [data, total] = await Promise.all([
            prisma.shiftSwap.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    requester: {
                        select: { fullName: true, employeeNumber: true },
                    },
                    targetEmployee: {
                        select: { fullName: true, employeeNumber: true },
                    },
                    originalShift: {
                        select: { name: true, startTime: true, endTime: true },
                    },
                    targetShift: {
                        select: { name: true, startTime: true, endTime: true },
                    },
                },
            }),
            prisma.shiftSwap.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get pending shift swaps (for target employee to approve)
     */
    static async getPending(
        context: RequestContext,
        filter: PaginationParams
    ): Promise<ServiceResponse<ShiftSwap[]>> {
        const { page = 1, limit = 20 } = filter;

        if (!context.employeeId) {
            return error(ErrorCodes.VALIDATION_ERROR, "Employee ID diperlukan");
        }

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
            targetEmployeeId: context.employeeId,
            status: "PENDING",
            deletedAt: null,
        };

        const [data, total] = await Promise.all([
            prisma.shiftSwap.findMany({
                where,
                orderBy: { createdAt: "asc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    requester: {
                        select: { fullName: true, employeeNumber: true },
                    },
                    originalShift: {
                        select: { name: true, startTime: true, endTime: true },
                    },
                    targetShift: {
                        select: { name: true, startTime: true, endTime: true },
                    },
                },
            }),
            prisma.shiftSwap.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Approve shift swap by target employee
     */
    static async approve(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ShiftSwap>> {
        if (!context.employeeId) {
            return error(ErrorCodes.VALIDATION_ERROR, "Employee ID diperlukan");
        }

        const shiftSwap = await prisma.shiftSwap.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!shiftSwap) {
            return error(ErrorCodes.NOT_FOUND, "Request shift swap tidak ditemukan");
        }

        // Only target employee can approve
        if (shiftSwap.targetEmployeeId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya target employee yang dapat approve");
        }

        if (shiftSwap.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat diapprove");
        }

        const updated = await prisma.shiftSwap.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedAt: new Date(),
            },
        });

        return success(updated);
    }

    /**
     * Reject shift swap
     */
    static async reject(
        context: RequestContext,
        id: string,
        reason: string
    ): Promise<ServiceResponse<ShiftSwap>> {
        if (!context.employeeId) {
            return error(ErrorCodes.VALIDATION_ERROR, "Employee ID diperlukan");
        }

        if (!reason || reason.trim() === "") {
            return error(ErrorCodes.VALIDATION_ERROR, "Alasan penolakan wajib diisi");
        }

        const shiftSwap = await prisma.shiftSwap.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!shiftSwap) {
            return error(ErrorCodes.NOT_FOUND, "Request shift swap tidak ditemukan");
        }

        // Only target employee can reject
        if (shiftSwap.targetEmployeeId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya target employee yang dapat reject");
        }

        if (shiftSwap.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat direject");
        }

        const updated = await prisma.shiftSwap.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
            },
        });

        return success(updated);
    }

    /**
     * Cancel shift swap (by requester)
     */
    static async cancel(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ShiftSwap>> {
        if (!context.employeeId) {
            return error(ErrorCodes.VALIDATION_ERROR, "Employee ID diperlukan");
        }

        const shiftSwap = await prisma.shiftSwap.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!shiftSwap) {
            return error(ErrorCodes.NOT_FOUND, "Request shift swap tidak ditemukan");
        }

        // Only requester can cancel
        if (shiftSwap.requesterId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya requester yang dapat membatalkan");
        }

        if (shiftSwap.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Hanya request pending yang dapat dibatalkan");
        }

        const updated = await prisma.shiftSwap.update({
            where: { id },
            data: {
                status: "CANCELLED",
            },
        });

        return success(updated);
    }
}

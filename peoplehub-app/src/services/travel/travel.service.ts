// @ai:cl - Travel request service - business logic layer
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
import type { TravelRequest, ApprovalStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateTravelData {
    destination: string;
    purpose: string;
    departureDate: Date;
    returnDate: Date;
    estimatedBudget?: number;
    transportation?: string;
    accommodation?: string;
    notes?: string;
}

export interface UpdateTravelData {
    destination?: string;
    purpose?: string;
    departureDate?: Date;
    returnDate?: Date;
    estimatedBudget?: number;
    transportation?: string;
    accommodation?: string;
    notes?: string;
}

export interface TravelFilter extends DateRangeFilter, PaginationParams {
    employeeId?: string;
    status?: ApprovalStatus;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class TravelService {
    /**
     * Create travel request
     */
    static async create(
        context: RequestContext,
        data: CreateTravelData
    ): Promise<ServiceResponse<TravelRequest>> {
        // Validate dates
        if (data.departureDate >= data.returnDate) {
            return error(
                ErrorCodes.VALIDATION_ERROR,
                "Tanggal kepulangan harus setelah tanggal berangkat"
            );
        }

        const travelRequest = await prisma.travelRequest.create({
            data: withTenantData(context, {
                employeeId: context.employeeId!,
                destination: data.destination,
                purpose: data.purpose,
                departureDate: data.departureDate,
                returnDate: data.returnDate,
                estimatedBudget: data.estimatedBudget || 0,
                transportation: data.transportation,
                accommodation: data.accommodation,
                notes: data.notes,
                status: "PENDING",
            }),
        });

        return success(travelRequest);
    }

    /**
     * Get travel request by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<TravelRequest>> {
        const travelRequest = await prisma.travelRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
            include: {
                employee: {
                    select: { fullName: true, employeeNumber: true },
                },
            },
        });

        if (!travelRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request perjalanan tidak ditemukan");
        }

        return success(travelRequest);
    }

    /**
     * Get travel requests for employee
     */
    static async getByEmployee(
        context: RequestContext,
        filter: TravelFilter
    ): Promise<ServiceResponse<TravelRequest[]>> {
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

        // Build where clause with scope filter
        const where: Record<string, unknown> = {
            ...scopeFilter(context),
            deletedAt: null,
        };

        if (employeeId) {
            where.employeeId = employeeId;
        }

        if (startDate) {
            where.departureDate = {
                ...(where.departureDate as object || {}),
                gte: new Date(startDate),
            };
        }
        if (endDate) {
            where.returnDate = {
                ...(where.returnDate as object || {}),
                lte: new Date(endDate),
            };
        }
        if (status) {
            where.status = status;
        }

        const [data, total] = await Promise.all([
            prisma.travelRequest.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employee: {
                        select: { fullName: true, employeeNumber: true },
                    },
                },
            }),
            prisma.travelRequest.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get pending travel requests for approval (manager view)
     */
    static async getPending(
        context: RequestContext,
        filter: PaginationParams
    ): Promise<ServiceResponse<TravelRequest[]>> {
        const { page = 1, limit = 20 } = filter;

        if (!["MANAGER", "HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses");
        }

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
            deletedAt: null,
            OR: [
                { status: "PENDING" },
                { status: "APPROVED_MANAGER" },
            ],
        };

        // If manager, filter to only subordinates with PENDING status
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
        }

        // If HRD, show APPROVED_MANAGER
        if (context.role === "HRD") {
            where.status = "APPROVED_MANAGER";
        }

        const [data, total] = await Promise.all([
            prisma.travelRequest.findMany({
                where,
                orderBy: { createdAt: "asc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employee: {
                        select: { fullName: true, employeeNumber: true, department: true },
                    },
                },
            }),
            prisma.travelRequest.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Approve travel request (Manager level)
     */
    static async approveManager(
        context: RequestContext,
        id: string,
        comment?: string
    ): Promise<ServiceResponse<TravelRequest>> {
        if (!["MANAGER", "HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk approve");
        }

        const travelRequest = await prisma.travelRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!travelRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request perjalanan tidak ditemukan");
        }

        if (travelRequest.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat diapprove");
        }

        const updated = await prisma.travelRequest.update({
            where: { id },
            data: {
                status: "APPROVED_MANAGER",
                approvedByManagerId: context.userId,
                managerApprovedAt: new Date(),
            },
        });

        // TODO: Send notification to HRD

        return success(updated);
    }

    /**
     * Approve travel request (HRD level - final)
     */
    static async approveHrd(
        context: RequestContext,
        id: string,
        comment?: string
    ): Promise<ServiceResponse<TravelRequest>> {
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk approve");
        }

        const travelRequest = await prisma.travelRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!travelRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request perjalanan tidak ditemukan");
        }

        if (travelRequest.status !== "APPROVED_MANAGER") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request harus diapprove manager terlebih dahulu");
        }

        const updated = await prisma.travelRequest.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedByHrdId: context.userId,
                hrdApprovedAt: new Date(),
            },
        });

        // TODO: Send notification to employee

        return success(updated);
    }

    /**
     * Reject travel request
     */
    static async reject(
        context: RequestContext,
        id: string,
        reason: string
    ): Promise<ServiceResponse<TravelRequest>> {
        if (!["MANAGER", "HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk reject");
        }

        if (!reason || reason.trim() === "") {
            return error(ErrorCodes.VALIDATION_ERROR, "Alasan penolakan wajib diisi");
        }

        const travelRequest = await prisma.travelRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!travelRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request perjalanan tidak ditemukan");
        }

        if (!["PENDING", "APPROVED_MANAGER"].includes(travelRequest.status)) {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat direject");
        }

        const updated = await prisma.travelRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
                approvedByManagerId: context.role === "MANAGER" ? context.userId : travelRequest.approvedByManagerId,
                managerApprovedAt: context.role === "MANAGER" ? new Date() : travelRequest.managerApprovedAt,
                approvedByHrdId: context.role !== "MANAGER" ? context.userId : undefined,
                hrdApprovedAt: context.role !== "MANAGER" ? new Date() : undefined,
            },
        });

        // TODO: Send notification to employee

        return success(updated);
    }

    /**
     * Cancel travel request (by requester)
     */
    static async cancel(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<TravelRequest>> {
        const travelRequest = await prisma.travelRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!travelRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request perjalanan tidak ditemukan");
        }

        // Only owner can cancel
        if (travelRequest.employeeId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya pemilik request yang dapat membatalkan");
        }

        if (!["PENDING", "APPROVED_MANAGER"].includes(travelRequest.status)) {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat dibatalkan");
        }

        const updated = await prisma.travelRequest.update({
            where: { id },
            data: {
                status: "CANCELLED",
            },
        });

        return success(updated);
    }

    /**
     * Update travel request (only if still pending)
     */
    static async update(
        context: RequestContext,
        id: string,
        data: UpdateTravelData
    ): Promise<ServiceResponse<TravelRequest>> {
        const travelRequest = await prisma.travelRequest.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!travelRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request perjalanan tidak ditemukan");
        }

        // Only owner can update
        if (travelRequest.employeeId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya pemilik request yang dapat mengubah");
        }

        if (travelRequest.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Hanya request pending yang dapat diubah");
        }

        // Validate dates if provided
        const departureDate = data.departureDate || travelRequest.departureDate;
        const returnDate = data.returnDate || travelRequest.returnDate;

        if (departureDate >= returnDate) {
            return error(
                ErrorCodes.VALIDATION_ERROR,
                "Tanggal kepulangan harus setelah tanggal berangkat"
            );
        }

        const updated = await prisma.travelRequest.update({
            where: { id },
            data: {
                destination: data.destination,
                purpose: data.purpose,
                departureDate: data.departureDate,
                returnDate: data.returnDate,
                estimatedBudget: data.estimatedBudget,
                transportation: data.transportation,
                accommodation: data.accommodation,
                notes: data.notes,
            },
        });

        return success(updated);
    }
}

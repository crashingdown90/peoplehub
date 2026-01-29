// @ai:cl - Overtime service - business logic layer for overtime requests
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
import type { OvertimeRequest, OvertimeStatus, OvertimeType } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateOvertimeData {
    overtimeDate: Date;
    plannedStartTime: string; // HH:mm format
    plannedEndTime: string; // HH:mm format
    reason: string;
    taskDescription?: string;
    overtimeType?: OvertimeType;
}

export interface UpdateOvertimeData {
    taskDescription?: string;
}

export interface CompleteOvertimeData {
    actualStartTime: string;
    actualEndTime: string;
    taskDescription?: string;
}

export interface OvertimeFilter extends DateRangeFilter, PaginationParams {
    employeeId?: string;
    status?: OvertimeStatus;
    overtimeType?: OvertimeType;
}

export interface OvertimeSummary {
    totalRequests: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
    totalPlannedHours: number;
    totalActualHours: number;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class OvertimeService {
    /**
     * Create overtime request
     */
    static async create(
        context: RequestContext,
        data: CreateOvertimeData
    ): Promise<ServiceResponse<OvertimeRequest>> {
        // Parse planned hours
        const plannedHours = this.calculateHours(data.plannedStartTime, data.plannedEndTime);

        if (plannedHours <= 0) {
            return error(ErrorCodes.VALIDATION_ERROR, "Waktu lembur tidak valid");
        }

        // Check for existing pending request on the same date
        const existingRequest = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, {
                employeeId: context.employeeId!,
                overtimeDate: data.overtimeDate,
                status: { in: ["PENDING", "APPROVED"] },
            }),
        });

        if (existingRequest) {
            return error(
                ErrorCodes.ALREADY_EXISTS,
                "Sudah ada request lembur untuk tanggal ini"
            );
        }

        // Determine overtime type if not specified
        let overtimeType: OvertimeType = data.overtimeType || "REGULAR";
        if (!data.overtimeType) {
            const dayOfWeek = data.overtimeDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                overtimeType = "WEEKEND";
            }
            // TODO: Check holiday table for HOLIDAY type
        }

        // Get overtime rate multiplier
        const overtimeRate = this.getOvertimeRate(overtimeType);

        const overtimeRequest = await prisma.overtimeRequest.create({
            data: withTenantData(context, {
                employeeId: context.employeeId!,
                overtimeDate: data.overtimeDate,
                plannedStartTime: data.plannedStartTime,
                plannedEndTime: data.plannedEndTime,
                plannedHours,
                reason: data.reason,
                taskDescription: data.taskDescription,
                overtimeType,
                overtimeRate,
                status: "PENDING",
            }),
        });

        return success(overtimeRequest);
    }

    /**
     * Get overtime request by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<OvertimeRequest>> {
        const overtimeRequest = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, { id }),
            include: {
                employee: {
                    select: { fullName: true, employeeNumber: true },
                },
            },
        });

        if (!overtimeRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request lembur tidak ditemukan");
        }

        return success(overtimeRequest);
    }

    /**
     * Get overtime requests for employee
     */
    static async getByEmployee(
        context: RequestContext,
        filter: OvertimeFilter
    ): Promise<ServiceResponse<OvertimeRequest[]>> {
        const {
            page = 1,
            limit = 20,
            sortBy = "overtimeDate",
            sortOrder = "desc",
            startDate,
            endDate,
            status,
            overtimeType,
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
            where.overtimeDate = {
                ...(where.overtimeDate as object || {}),
                gte: new Date(startDate),
            };
        }
        if (endDate) {
            where.overtimeDate = {
                ...(where.overtimeDate as object || {}),
                lte: new Date(endDate),
            };
        }
        if (status) {
            where.status = status;
        }
        if (overtimeType) {
            where.overtimeType = overtimeType;
        }

        const [data, total] = await Promise.all([
            prisma.overtimeRequest.findMany({
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
            prisma.overtimeRequest.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get pending overtime requests for approval (manager view)
     */
    static async getPending(
        context: RequestContext,
        filter: PaginationParams
    ): Promise<ServiceResponse<OvertimeRequest[]>> {
        const { page = 1, limit = 20 } = filter;

        // Manager only sees pending requests from subordinates
        // For now, simplified: HRD/Finance/Manager can see all pending
        if (!["MANAGER", "HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses");
        }

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
            status: "PENDING",
        };

        // If manager, filter to only subordinates
        if (context.role === "MANAGER") {
            const subordinates = await prisma.employee.findMany({
                where: {
                    tenantId: context.tenantId,
                    managerId: context.employeeId,
                },
                select: { id: true },
            });
            where.employeeId = { in: subordinates.map((s) => s.id) };
        }

        const [data, total] = await Promise.all([
            prisma.overtimeRequest.findMany({
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
            prisma.overtimeRequest.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Approve overtime request
     */
    static async approve(
        context: RequestContext,
        id: string,
        comment?: string
    ): Promise<ServiceResponse<OvertimeRequest>> {
        // Check permission
        if (!["MANAGER", "HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk approve");
        }

        const overtimeRequest = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, { id }),
        });

        if (!overtimeRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request lembur tidak ditemukan");
        }

        if (overtimeRequest.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat diapprove");
        }

        const updated = await prisma.overtimeRequest.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedById: context.userId,
                approvedAt: new Date(),
                rejectionReason: comment ? null : overtimeRequest.rejectionReason,
            },
        });

        // TODO: Send notification to employee

        return success(updated);
    }

    /**
     * Reject overtime request
     */
    static async reject(
        context: RequestContext,
        id: string,
        reason: string
    ): Promise<ServiceResponse<OvertimeRequest>> {
        // Check permission
        if (!["MANAGER", "HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk reject");
        }

        if (!reason || reason.trim() === "") {
            return error(ErrorCodes.VALIDATION_ERROR, "Alasan penolakan wajib diisi");
        }

        const overtimeRequest = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, { id }),
        });

        if (!overtimeRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request lembur tidak ditemukan");
        }

        if (overtimeRequest.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat direject");
        }

        const updated = await prisma.overtimeRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                approvedById: context.userId,
                approvedAt: new Date(),
                rejectionReason: reason,
            },
        });

        // TODO: Send notification to employee

        return success(updated);
    }

    /**
     * Complete overtime with actual hours
     */
    static async complete(
        context: RequestContext,
        id: string,
        data: CompleteOvertimeData
    ): Promise<ServiceResponse<OvertimeRequest>> {
        const overtimeRequest = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, { id }),
        });

        if (!overtimeRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request lembur tidak ditemukan");
        }

        // Only owner can complete
        if (overtimeRequest.employeeId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya pemilik request yang dapat menyelesaikan");
        }

        if (overtimeRequest.status !== "APPROVED") {
            return error(
                ErrorCodes.CANNOT_MODIFY,
                "Hanya request yang sudah diapprove yang dapat diselesaikan"
            );
        }

        const actualHours = this.calculateHours(data.actualStartTime, data.actualEndTime);

        if (actualHours <= 0) {
            return error(ErrorCodes.VALIDATION_ERROR, "Waktu lembur aktual tidak valid");
        }

        const updated = await prisma.overtimeRequest.update({
            where: { id },
            data: {
                actualStartTime: data.actualStartTime,
                actualEndTime: data.actualEndTime,
                actualHours,
                taskDescription: data.taskDescription || overtimeRequest.taskDescription,
                status: "COMPLETED",
                completedAt: new Date(),
            },
        });

        return success(updated);
    }

    /**
     * Cancel overtime request (by requester)
     */
    static async cancel(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<OvertimeRequest>> {
        const overtimeRequest = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, { id }),
        });

        if (!overtimeRequest) {
            return error(ErrorCodes.NOT_FOUND, "Request lembur tidak ditemukan");
        }

        // Only owner can cancel
        if (overtimeRequest.employeeId !== context.employeeId) {
            return error(ErrorCodes.FORBIDDEN, "Hanya pemilik request yang dapat membatalkan");
        }

        if (!["PENDING", "APPROVED"].includes(overtimeRequest.status)) {
            return error(ErrorCodes.CANNOT_MODIFY, "Request tidak dapat dibatalkan");
        }

        const updated = await prisma.overtimeRequest.update({
            where: { id },
            data: {
                status: "CANCELLED",
            },
        });

        return success(updated);
    }

    /**
     * Get overtime summary for period
     */
    static async getSummary(
        context: RequestContext,
        employeeId: string,
        startDate: Date,
        endDate: Date
    ): Promise<ServiceResponse<OvertimeSummary>> {
        const overtimes = await prisma.overtimeRequest.findMany({
            where: withTenant(context, {
                employeeId,
                overtimeDate: {
                    gte: startDate,
                    lte: endDate,
                },
            }),
        });

        const summary: OvertimeSummary = {
            totalRequests: overtimes.length,
            pending: overtimes.filter((o) => o.status === "PENDING").length,
            approved: overtimes.filter((o) => o.status === "APPROVED").length,
            completed: overtimes.filter((o) => o.status === "COMPLETED").length,
            rejected: overtimes.filter((o) => o.status === "REJECTED").length,
            totalPlannedHours: overtimes.reduce((sum, o) => sum + Number(o.plannedHours), 0),
            totalActualHours: overtimes
                .filter((o) => o.actualHours)
                .reduce((sum, o) => sum + Number(o.actualHours || 0), 0),
        };

        return success(summary);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Calculate hours from start and end time (HH:mm format)
     */
    private static calculateHours(startTime: string, endTime: string): number {
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMinute;
        let endMinutes = endHour * 60 + endMinute;

        // Handle overnight shifts
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60;
        }

        return (endMinutes - startMinutes) / 60;
    }

    /**
     * Get overtime rate multiplier based on type
     */
    private static getOvertimeRate(type: OvertimeType): number {
        switch (type) {
            case "REGULAR":
                return 1.5;
            case "WEEKEND":
                return 2.0;
            case "HOLIDAY":
                return 2.5;
            default:
                return 1.5;
        }
    }
}

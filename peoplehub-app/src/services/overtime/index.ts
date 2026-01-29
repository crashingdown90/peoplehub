// @ai:ag - Created by Antigravity
// Overtime service - business logic layer

import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import {
    ServiceResponse,
    success,
    error,
    paginated,
    ErrorCodes,
    PaginationParams,
} from "../types";
import type { OvertimeRequest, OvertimeStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateOvertimeData {
    overtimeDate: Date | string;
    plannedStartTime: string;
    plannedEndTime: string;
    reason: string;
    taskDescription?: string;
    overtimeType?: "REGULAR" | "HOLIDAY" | "WEEKEND";
}

export interface OvertimeFilter extends PaginationParams {
    employeeId?: string;
    status?: OvertimeStatus;
    startDate?: Date | string;
    endDate?: Date | string;
}

export interface ApproveOvertimeData {
    overtimeRate?: number;
    notes?: string;
}

export interface CompleteOvertimeData {
    actualStartTime: string;
    actualEndTime: string;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class OvertimeService {
    /**
     * Create overtime request
     */
    static async createRequest(
        context: RequestContext,
        data: CreateOvertimeData
    ): Promise<ServiceResponse<OvertimeRequest>> {
        const overtimeDate = new Date(data.overtimeDate);

        // Check if there's already a request for this date
        const existing = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, {
                employeeId: context.employeeId!,
                overtimeDate,
                status: { notIn: ["REJECTED", "CANCELLED"] as OvertimeStatus[] },
            }),
        });

        if (existing) {
            return error(
                ErrorCodes.CONFLICT,
                "Sudah ada pengajuan lembur untuk tanggal tersebut"
            );
        }

        // Calculate planned hours
        const plannedHours = this.calculateHours(data.plannedStartTime, data.plannedEndTime);

        const request = await prisma.overtimeRequest.create({
            data: {
                tenantId: context.tenantId,
                employeeId: context.employeeId!,
                overtimeDate,
                plannedStartTime: data.plannedStartTime,
                plannedEndTime: data.plannedEndTime,
                plannedHours,
                reason: data.reason,
                taskDescription: data.taskDescription,
                overtimeType: data.overtimeType || "REGULAR",
                status: "PENDING",
            },
        });

        return success(request);
    }

    /**
     * Get overtime requests with filters
     */
    static async getRequests(
        context: RequestContext,
        filter: OvertimeFilter
    ): Promise<ServiceResponse<OvertimeRequest[]>> {
        const {
            page = 1,
            limit = 20,
            sortBy = "createdAt",
            sortOrder = "desc",
            employeeId,
            status,
            startDate,
            endDate,
        } = filter;

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
        };

        // Scope based on role
        if (["HRD", "SUPER_ADMIN"].includes(context.role)) {
            if (employeeId) where.employeeId = employeeId;
        } else if (context.role === "MANAGER") {
            const subordinates = await prisma.employee.findMany({
                where: {
                    tenantId: context.tenantId,
                    managerId: context.employeeId,
                },
                select: { id: true },
            });
            if (!employeeId) {
                where.employeeId = { in: subordinates.map((s) => s.id) };
            } else {
                where.employeeId = employeeId;
            }
        } else {
            where.employeeId = context.employeeId;
        }

        if (status) where.status = status;

        // Handle date range filter properly
        if (startDate && endDate) {
            where.overtimeDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else if (startDate) {
            where.overtimeDate = { gte: new Date(startDate) };
        } else if (endDate) {
            where.overtimeDate = { lte: new Date(endDate) };
        }

        const [data, total] = await Promise.all([
            prisma.overtimeRequest.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employee: { select: { fullName: true, employeeNumber: true } },
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
        requestId: string,
        data?: ApproveOvertimeData
    ): Promise<ServiceResponse<OvertimeRequest>> {
        const request = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, { id: requestId }),
            include: { employee: true },
        });

        if (!request) {
            return error(ErrorCodes.NOT_FOUND, "Pengajuan lembur tidak ditemukan");
        }

        // Check permission
        const canApprove =
            ["HRD", "SUPER_ADMIN"].includes(context.role) ||
            (context.role === "MANAGER" &&
                request.employee.managerId === context.employeeId);

        if (!canApprove) {
            return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
        }

        if (request.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Pengajuan sudah diproses sebelumnya");
        }

        const updated = await prisma.overtimeRequest.update({
            where: { id: requestId },
            data: {
                status: "APPROVED",
                overtimeRate: data?.overtimeRate,
                approvedAt: new Date(),
                approvedById: context.employeeId,
            },
        });

        return success(updated);
    }

    /**
     * Reject overtime request
     */
    static async reject(
        context: RequestContext,
        requestId: string,
        reason: string
    ): Promise<ServiceResponse<OvertimeRequest>> {
        const request = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, { id: requestId }),
            include: { employee: true },
        });

        if (!request) {
            return error(ErrorCodes.NOT_FOUND, "Pengajuan lembur tidak ditemukan");
        }

        // Check permission
        const canReject =
            ["HRD", "SUPER_ADMIN"].includes(context.role) ||
            (context.role === "MANAGER" &&
                request.employee.managerId === context.employeeId);

        if (!canReject) {
            return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
        }

        if (request.status !== "PENDING") {
            return error(ErrorCodes.CANNOT_MODIFY, "Pengajuan sudah diproses sebelumnya");
        }

        const updated = await prisma.overtimeRequest.update({
            where: { id: requestId },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
                approvedAt: new Date(),
                approvedById: context.employeeId,
            },
        });

        return success(updated);
    }

    /**
     * Complete overtime (update actual hours)
     */
    static async complete(
        context: RequestContext,
        requestId: string,
        data: CompleteOvertimeData
    ): Promise<ServiceResponse<OvertimeRequest>> {
        const request = await prisma.overtimeRequest.findFirst({
            where: withTenant(context, {
                id: requestId,
                employeeId: context.employeeId!,
            }),
        });

        if (!request) {
            return error(ErrorCodes.NOT_FOUND, "Pengajuan lembur tidak ditemukan");
        }

        if (request.status !== "APPROVED") {
            return error(
                ErrorCodes.CANNOT_MODIFY,
                "Hanya pengajuan yang sudah disetujui yang dapat dicomplete"
            );
        }

        const actualHours = this.calculateHours(
            data.actualStartTime,
            data.actualEndTime
        );

        const updated = await prisma.overtimeRequest.update({
            where: { id: requestId },
            data: {
                actualStartTime: data.actualStartTime,
                actualEndTime: data.actualEndTime,
                actualHours,
                status: "COMPLETED",
                completedAt: new Date(),
            },
        });

        return success(updated);
    }

    /**
     * Calculate hours between two times
     */
    private static calculateHours(startTime: string, endTime: string): number {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diff = end.getTime() - start.getTime();
        return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
    }
}

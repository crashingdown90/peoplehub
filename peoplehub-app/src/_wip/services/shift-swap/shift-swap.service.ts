// @ai:ag - Created by Antigravity
// Shift Swap service - handles shift exchange requests between employees

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
import type { ShiftSwap, ShiftSwapStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

interface CreateShiftSwapData {
    partnerId: string;
    requesterShiftDate: Date | string;
    partnerShiftDate: Date | string;
    reason: string;
}

interface ShiftSwapFilter extends PaginationParams {
    requesterId?: string;
    partnerId?: string;
    status?: ShiftSwapStatus;
}

type ShiftSwapWithEmployees = ShiftSwap & {
    requester?: { id: string; fullName: string; employeeNumber: string };
    partner?: { id: string; fullName: string; employeeNumber: string };
};

// ==========================================
// SERVICE CLASS
// ==========================================

export class ShiftSwapService {
    // Create a new shift swap request
    async create(
        context: RequestContext,
        data: CreateShiftSwapData
    ): Promise<ServiceResponse<ShiftSwap>> {
        try {
            const { employeeId, tenantId } = context;

            if (!employeeId) {
                return error(ErrorCodes.FORBIDDEN, "Employee context required");
            }

            // Validation
            if (data.partnerId === employeeId) {
                return error(ErrorCodes.VALIDATION_ERROR, "Cannot swap shift with yourself");
            }

            if (!data.reason || data.reason.trim().length < 10) {
                return error(ErrorCodes.VALIDATION_ERROR, "Reason must be at least 10 characters");
            }

            const requesterDate = new Date(data.requesterShiftDate);
            const partnerDate = new Date(data.partnerShiftDate);

            // Check for existing pending swap for these dates
            const existing = await prisma.shiftSwap.findFirst({
                where: withTenant(context, {
                    OR: [
                        {
                            requesterId: employeeId,
                            requesterShiftDate: requesterDate,
                            status: { in: ["PENDING_PARTNER", "PENDING_MANAGER"] },
                        },
                        {
                            partnerId: employeeId,
                            partnerShiftDate: requesterDate,
                            status: { in: ["PENDING_PARTNER", "PENDING_MANAGER"] },
                        },
                    ],
                }),
            });

            if (existing) {
                return error(ErrorCodes.ALREADY_EXISTS, "Shift swap already exists for this date");
            }

            // Create shift swap
            const swap = await prisma.shiftSwap.create({
                data: {
                    tenantId,
                    requesterId: employeeId,
                    partnerId: data.partnerId,
                    requesterShiftDate: requesterDate,
                    partnerShiftDate: partnerDate,
                    reason: data.reason,
                    status: "PENDING_PARTNER",
                },
            });

            return success(swap);
        } catch (err) {
            console.error("ShiftSwapService.create error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to create shift swap");
        }
    }

    // Get shift swaps with filters
    async getSwaps(
        context: RequestContext,
        filter: ShiftSwapFilter
    ): Promise<ServiceResponse<ShiftSwapWithEmployees[]>> {
        try {
            const { tenantId, employeeId, role } = context;
            const page = filter.page || 1;
            const limit = filter.limit || 20;
            const skip = (page - 1) * limit;

            // Build where clause
            const where: Record<string, unknown> = { tenantId };

            // Role-based filtering
            if (role === "EMPLOYEE") {
                where.OR = [{ requesterId: employeeId }, { partnerId: employeeId }];
            } else {
                if (filter.requesterId) {
                    where.requesterId = filter.requesterId;
                }
                if (filter.partnerId) {
                    where.partnerId = filter.partnerId;
                }
            }

            if (filter.status) {
                where.status = filter.status;
            }

            // Get total count
            const total = await prisma.shiftSwap.count({ where });

            // Get swaps
            const swaps = await prisma.shiftSwap.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            });

            return paginated(swaps as ShiftSwapWithEmployees[], total, page, limit);
        } catch (err) {
            console.error("ShiftSwapService.getSwaps error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to get shift swaps");
        }
    }

    // Approve by partner
    async approveByPartner(
        context: RequestContext,
        swapId: string
    ): Promise<ServiceResponse<ShiftSwap>> {
        try {
            const { tenantId, employeeId } = context;

            const swap = await prisma.shiftSwap.findFirst({
                where: withTenant(context, { id: swapId }),
            });

            if (!swap) {
                return error(ErrorCodes.NOT_FOUND, "Shift swap not found");
            }

            if (swap.partnerId !== employeeId) {
                return error(ErrorCodes.FORBIDDEN, "Only the partner can approve this swap");
            }

            if (swap.status !== "PENDING_PARTNER") {
                return error(ErrorCodes.CANNOT_MODIFY, "Swap is not pending partner approval");
            }

            const updated = await prisma.shiftSwap.update({
                where: { id: swapId },
                data: {
                    status: "PENDING_MANAGER",
                    partnerApproved: true,
                    partnerApprovedAt: new Date(),
                },
            });

            return success(updated);
        } catch (err) {
            console.error("ShiftSwapService.approveByPartner error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to approve shift swap");
        }
    }

    // Approve by manager
    async approveByManager(
        context: RequestContext,
        swapId: string
    ): Promise<ServiceResponse<ShiftSwap>> {
        try {
            const { tenantId, userId, role } = context;

            if (!["MANAGER", "HRD", "SUPER_ADMIN"].includes(role)) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to approve shift swaps");
            }

            const swap = await prisma.shiftSwap.findFirst({
                where: withTenant(context, { id: swapId }),
            });

            if (!swap) {
                return error(ErrorCodes.NOT_FOUND, "Shift swap not found");
            }

            if (swap.status !== "PENDING_MANAGER") {
                return error(ErrorCodes.CANNOT_MODIFY, "Swap is not pending manager approval");
            }

            const updated = await prisma.shiftSwap.update({
                where: { id: swapId },
                data: {
                    status: "APPROVED",
                    approvedById: userId,
                    approvedAt: new Date(),
                },
            });

            return success(updated);
        } catch (err) {
            console.error("ShiftSwapService.approveByManager error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to approve shift swap");
        }
    }

    // Reject shift swap
    async reject(
        context: RequestContext,
        swapId: string,
        reason: string
    ): Promise<ServiceResponse<ShiftSwap>> {
        try {
            const { tenantId, employeeId, userId, role } = context;

            if (!reason || reason.trim().length < 10) {
                return error(ErrorCodes.VALIDATION_ERROR, "Rejection reason required (min 10 characters)");
            }

            const swap = await prisma.shiftSwap.findFirst({
                where: withTenant(context, { id: swapId }),
            });

            if (!swap) {
                return error(ErrorCodes.NOT_FOUND, "Shift swap not found");
            }

            // Partner can reject if PENDING_PARTNER
            // Manager can reject if PENDING_MANAGER
            let canReject = false;

            if (swap.status === "PENDING_PARTNER" && swap.partnerId === employeeId) {
                canReject = true;
            } else if (
                swap.status === "PENDING_MANAGER" &&
                ["MANAGER", "HRD", "SUPER_ADMIN"].includes(role)
            ) {
                canReject = true;
            }

            if (!canReject) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to reject this swap");
            }

            const updated = await prisma.shiftSwap.update({
                where: { id: swapId },
                data: {
                    status: "REJECTED",
                    rejectionReason: reason,
                    approvedById: userId || undefined,
                    approvedAt: new Date(),
                },
            });

            return success(updated);
        } catch (err) {
            console.error("ShiftSwapService.reject error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to reject shift swap");
        }
    }

    // Cancel shift swap (by requester)
    async cancel(
        context: RequestContext,
        swapId: string
    ): Promise<ServiceResponse<ShiftSwap>> {
        try {
            const { tenantId, employeeId } = context;

            const swap = await prisma.shiftSwap.findFirst({
                where: withTenant(context, { id: swapId }),
            });

            if (!swap) {
                return error(ErrorCodes.NOT_FOUND, "Shift swap not found");
            }

            if (swap.requesterId !== employeeId) {
                return error(ErrorCodes.FORBIDDEN, "Only the requester can cancel this swap");
            }

            if (!["PENDING_PARTNER", "PENDING_MANAGER"].includes(swap.status)) {
                return error(ErrorCodes.CANNOT_MODIFY, "Only pending swaps can be cancelled");
            }

            const updated = await prisma.shiftSwap.update({
                where: { id: swapId },
                data: { status: "CANCELLED" },
            });

            return success(updated);
        } catch (err) {
            console.error("ShiftSwapService.cancel error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to cancel shift swap");
        }
    }
}

export const shiftSwapService = new ShiftSwapService();

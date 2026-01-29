// @ai:ag - Created by Antigravity
// Cash Advance (Kasbon) service - business logic layer

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
import type { CashAdvance, CashAdvanceStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

interface CreateCashAdvanceData {
    amount: number;
    purpose: string;
}

interface CashAdvanceFilter extends PaginationParams {
    employeeId?: string;
    status?: CashAdvanceStatus;
}

type CashAdvanceWithEmployee = CashAdvance & {
    employee: {
        id: string;
        fullName: string;
        employeeNumber: string;
    };
};

// ==========================================
// SERVICE CLASS
// ==========================================

export class CashAdvanceService {
    // Create a new cash advance request
    async create(
        context: RequestContext,
        data: CreateCashAdvanceData
    ): Promise<ServiceResponse<CashAdvance>> {
        try {
            const { employeeId, tenantId } = context;

            if (!employeeId) {
                return error(ErrorCodes.FORBIDDEN, "Employee context required");
            }

            // Validation
            if (data.amount <= 0) {
                return error(ErrorCodes.VALIDATION_ERROR, "Amount must be greater than 0");
            }

            if (!data.purpose || data.purpose.trim().length < 10) {
                return error(ErrorCodes.VALIDATION_ERROR, "Purpose must be at least 10 characters");
            }

            // Check for existing pending request
            const existingPending = await prisma.cashAdvance.findFirst({
                where: withTenant(context, {
                    employeeId,
                    status: { in: ["PENDING", "APPROVED", "DISBURSED"] },
                }),
            });

            if (existingPending) {
                return error(
                    ErrorCodes.ALREADY_EXISTS,
                    "You have an active cash advance request. Complete or settle the existing one first."
                );
            }

            // Create cash advance request
            const cashAdvance = await prisma.cashAdvance.create({
                data: {
                    tenantId,
                    employeeId,
                    amount: data.amount,
                    purpose: data.purpose,
                    status: "PENDING",
                },
            });

            return success(cashAdvance);
        } catch (err) {
            console.error("CashAdvanceService.create error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to create cash advance request");
        }
    }

    // Get cash advances with filters
    async getAdvances(
        context: RequestContext,
        filter: CashAdvanceFilter
    ): Promise<ServiceResponse<CashAdvanceWithEmployee[]>> {
        try {
            const { tenantId, role, employeeId } = context;
            const page = filter.page || 1;
            const limit = filter.limit || 20;
            const skip = (page - 1) * limit;

            // Build where clause
            const where: Record<string, unknown> = { tenantId };

            // Role-based filtering
            if (role === "EMPLOYEE") {
                where.employeeId = employeeId;
            } else if (filter.employeeId) {
                where.employeeId = filter.employeeId;
            }

            if (filter.status) {
                where.status = filter.status;
            }

            // Get total count
            const total = await prisma.cashAdvance.count({ where });

            // Get advances with employee info
            const advances = await prisma.cashAdvance.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            id: true,
                            fullName: true,
                            employeeNumber: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            });

            return paginated(advances as CashAdvanceWithEmployee[], total, page, limit);
        } catch (err) {
            console.error("CashAdvanceService.getAdvances error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to get cash advances");
        }
    }

    // Approve cash advance (HRD/Finance)
    async approve(
        context: RequestContext,
        advanceId: string
    ): Promise<ServiceResponse<CashAdvance>> {
        try {
            const { tenantId, userId, role } = context;

            // Only HRD, Finance and Super Admin can approve
            if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(role)) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to approve cash advances");
            }

            const advance = await prisma.cashAdvance.findFirst({
                where: withTenant(context, { id: advanceId }),
            });

            if (!advance) {
                return error(ErrorCodes.NOT_FOUND, "Cash advance not found");
            }

            if (advance.status !== "PENDING") {
                return error(ErrorCodes.CANNOT_MODIFY, "Only pending requests can be approved");
            }

            const updated = await prisma.cashAdvance.update({
                where: { id: advanceId },
                data: {
                    status: "APPROVED",
                    approvedById: userId,
                    approvedAt: new Date(),
                },
            });

            return success(updated);
        } catch (err) {
            console.error("CashAdvanceService.approve error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to approve cash advance");
        }
    }

    // Reject cash advance
    async reject(
        context: RequestContext,
        advanceId: string,
        reason: string
    ): Promise<ServiceResponse<CashAdvance>> {
        try {
            const { tenantId, userId, role } = context;

            if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(role)) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to reject cash advances");
            }

            if (!reason || reason.trim().length < 10) {
                return error(ErrorCodes.VALIDATION_ERROR, "Rejection reason required (min 10 characters)");
            }

            const advance = await prisma.cashAdvance.findFirst({
                where: withTenant(context, { id: advanceId }),
            });

            if (!advance) {
                return error(ErrorCodes.NOT_FOUND, "Cash advance not found");
            }

            if (advance.status !== "PENDING") {
                return error(ErrorCodes.CANNOT_MODIFY, "Only pending requests can be rejected");
            }

            const updated = await prisma.cashAdvance.update({
                where: { id: advanceId },
                data: {
                    status: "REJECTED",
                    rejectionReason: reason,
                    approvedById: userId,
                    approvedAt: new Date(),
                },
            });

            return success(updated);
        } catch (err) {
            console.error("CashAdvanceService.reject error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to reject cash advance");
        }
    }

    // Mark as disbursed (Finance)
    async disburse(
        context: RequestContext,
        advanceId: string
    ): Promise<ServiceResponse<CashAdvance>> {
        try {
            const { tenantId, role } = context;

            if (role !== "FINANCE" && role !== "SUPER_ADMIN") {
                return error(ErrorCodes.FORBIDDEN, "Only Finance can mark as disbursed");
            }

            const advance = await prisma.cashAdvance.findFirst({
                where: withTenant(context, { id: advanceId }),
            });

            if (!advance) {
                return error(ErrorCodes.NOT_FOUND, "Cash advance not found");
            }

            if (advance.status !== "APPROVED") {
                return error(ErrorCodes.CANNOT_MODIFY, "Only approved requests can be disbursed");
            }

            const updated = await prisma.cashAdvance.update({
                where: { id: advanceId },
                data: {
                    status: "DISBURSED",
                    disbursedAt: new Date(),
                },
            });

            return success(updated);
        } catch (err) {
            console.error("CashAdvanceService.disburse error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to disburse cash advance");
        }
    }

    // Mark as settled (Finance)
    async settle(
        context: RequestContext,
        advanceId: string,
        settledAmount: number
    ): Promise<ServiceResponse<CashAdvance>> {
        try {
            const { tenantId, role } = context;

            if (role !== "FINANCE" && role !== "SUPER_ADMIN") {
                return error(ErrorCodes.FORBIDDEN, "Only Finance can mark as settled");
            }

            if (settledAmount <= 0) {
                return error(ErrorCodes.VALIDATION_ERROR, "Settled amount must be greater than 0");
            }

            const advance = await prisma.cashAdvance.findFirst({
                where: withTenant(context, { id: advanceId }),
            });

            if (!advance) {
                return error(ErrorCodes.NOT_FOUND, "Cash advance not found");
            }

            if (advance.status !== "DISBURSED") {
                return error(ErrorCodes.CANNOT_MODIFY, "Only disbursed advances can be settled");
            }

            const updated = await prisma.cashAdvance.update({
                where: { id: advanceId },
                data: {
                    status: "SETTLED",
                    settledAmount,
                    settledAt: new Date(),
                },
            });

            return success(updated);
        } catch (err) {
            console.error("CashAdvanceService.settle error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to settle cash advance");
        }
    }
}

export const cashAdvanceService = new CashAdvanceService();

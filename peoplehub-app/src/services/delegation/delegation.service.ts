// @ai:ag - Created by Antigravity
// Delegation service - business logic for approval delegation

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
import type { Delegation, DelegationType } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

interface CreateDelegationData {
    delegateId: string;
    delegationType: DelegationType;
    requestTypes: string[];
    startDate: Date | string;
    endDate: Date | string;
    reason?: string;
}

interface DelegationFilter extends PaginationParams {
    delegatorId?: string;
    delegateId?: string;
    isActive?: boolean;
}

type DelegationWithUsers = Delegation & {
    delegator?: { id: string; fullName: string; email: string };
    delegate?: { id: string; fullName: string; email: string };
};

// ==========================================
// SERVICE CLASS
// ==========================================

export class DelegationService {
    // Create a new delegation
    async create(
        context: RequestContext,
        data: CreateDelegationData
    ): Promise<ServiceResponse<Delegation>> {
        try {
            const { employeeId, tenantId, userId } = context;

            if (!employeeId) {
                return error(ErrorCodes.FORBIDDEN, "Employee context required");
            }

            // Validation
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);

            if (endDate <= startDate) {
                return error(ErrorCodes.VALIDATION_ERROR, "End date must be after start date");
            }

            if (data.delegateId === employeeId) {
                return error(ErrorCodes.VALIDATION_ERROR, "Cannot delegate to yourself");
            }

            // Check for overlapping delegations
            const overlapping = await prisma.delegation.findFirst({
                where: withTenant(context, {
                    delegatorId: employeeId,
                    isActive: true,
                    OR: [
                        {
                            startDate: { lte: endDate },
                            endDate: { gte: startDate },
                        },
                    ],
                }),
            });

            if (overlapping) {
                return error(
                    ErrorCodes.CONFLICT,
                    "You already have an active delegation in this period"
                );
            }

            // Create delegation
            const delegation = await prisma.delegation.create({
                data: {
                    tenantId,
                    delegatorId: employeeId,
                    delegateId: data.delegateId,
                    delegationType: data.delegationType,
                    requestTypes: data.requestTypes,
                    startDate,
                    endDate,
                    reason: data.reason,
                    isActive: true,
                    createdById: userId,
                },
            });

            return success(delegation);
        } catch (err) {
            console.error("DelegationService.create error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to create delegation");
        }
    }

    // Get delegations with filters
    async getDelegations(
        context: RequestContext,
        filter: DelegationFilter
    ): Promise<ServiceResponse<DelegationWithUsers[]>> {
        try {
            const { tenantId, employeeId, role } = context;
            const page = filter.page || 1;
            const limit = filter.limit || 20;
            const skip = (page - 1) * limit;

            // Build where clause
            const where: Record<string, unknown> = { tenantId };

            // Role-based filtering
            if (role === "EMPLOYEE") {
                where.OR = [{ delegatorId: employeeId }, { delegateId: employeeId }];
            } else {
                if (filter.delegatorId) {
                    where.delegatorId = filter.delegatorId;
                }
                if (filter.delegateId) {
                    where.delegateId = filter.delegateId;
                }
            }

            if (filter.isActive !== undefined) {
                where.isActive = filter.isActive;
            }

            // Get total count
            const total = await prisma.delegation.count({ where });

            // Get delegations
            const delegations = await prisma.delegation.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            });

            return paginated(delegations as DelegationWithUsers[], total, page, limit);
        } catch (err) {
            console.error("DelegationService.getDelegations error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to get delegations");
        }
    }

    // Deactivate delegation
    async deactivate(
        context: RequestContext,
        delegationId: string
    ): Promise<ServiceResponse<Delegation>> {
        try {
            const { tenantId, employeeId } = context;

            const delegation = await prisma.delegation.findFirst({
                where: withTenant(context, { id: delegationId }),
            });

            if (!delegation) {
                return error(ErrorCodes.NOT_FOUND, "Delegation not found");
            }

            // Only delegator can deactivate
            if (delegation.delegatorId !== employeeId) {
                return error(ErrorCodes.FORBIDDEN, "Only the delegator can deactivate this delegation");
            }

            const updated = await prisma.delegation.update({
                where: { id: delegationId },
                data: { isActive: false },
            });

            return success(updated);
        } catch (err) {
            console.error("DelegationService.deactivate error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to deactivate delegation");
        }
    }

    // Resolve approver - find active delegate for an approver
    async resolveApprover(
        tenantId: string,
        originalApproverId: string,
        requestType: string,
        date: Date = new Date()
    ): Promise<{ approverId: string; isDelegated: boolean; delegatedFrom?: string }> {
        try {
            // Find active delegation
            const delegation = await prisma.delegation.findFirst({
                where: {
                    tenantId,
                    delegatorId: originalApproverId,
                    isActive: true,
                    startDate: { lte: date },
                    endDate: { gte: date },
                    OR: [
                        { requestTypes: { has: requestType } },
                        { requestTypes: { has: "ALL" } },
                        { delegationType: "ALL" },
                    ],
                },
            });

            if (!delegation) {
                return { approverId: originalApproverId, isDelegated: false };
            }

            return {
                approverId: delegation.delegateId,
                isDelegated: true,
                delegatedFrom: originalApproverId,
            };
        } catch (err) {
            console.error("DelegationService.resolveApprover error:", err);
            // On error, return original approver
            return { approverId: originalApproverId, isDelegated: false };
        }
    }
}

export const delegationService = new DelegationService();

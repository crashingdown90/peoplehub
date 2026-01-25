// @ai:ag - Created by Antigravity
// Approval Flow service - configurable multi-level approval workflows

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
import type { ApprovalFlow, ApprovalStep, ApprovalFlowType } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

interface CreateApprovalFlowData {
    name: string;
    type: ApprovalFlowType;
    description?: string;
    isDefault?: boolean;
}

interface UpdateApprovalFlowData {
    name?: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
}

interface CreateApprovalStepData {
    stepOrder: number;
    approverType: string; // MANAGER, HRD, FINANCE, SPECIFIC_USER
    approverUserId?: string;
    approverRoleId?: string;
    isRequired?: boolean;
    canSkip?: boolean;
    timeoutHours?: number;
}

interface ApprovalFlowFilter extends PaginationParams {
    type?: ApprovalFlowType;
    isActive?: boolean;
}

type ApprovalFlowWithSteps = ApprovalFlow & {
    steps: ApprovalStep[];
};

// ==========================================
// SERVICE CLASS
// ==========================================

export class ApprovalFlowService {
    // Create a new approval flow
    async create(
        context: RequestContext,
        data: CreateApprovalFlowData
    ): Promise<ServiceResponse<ApprovalFlow>> {
        try {
            const { tenantId, role } = context;

            // Only admin roles can create approval flows
            if (!["HRD", "SUPER_ADMIN"].includes(role)) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to create approval flows");
            }

            // If setting as default, unset other defaults for this type
            if (data.isDefault) {
                await prisma.approvalFlow.updateMany({
                    where: withTenant(tenantId, {
                        type: data.type,
                        isDefault: true,
                    }),
                    data: { isDefault: false },
                });
            }

            // Create approval flow
            const flow = await prisma.approvalFlow.create({
                data: {
                    tenantId,
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    isDefault: data.isDefault || false,
                    isActive: true,
                },
            });

            return success(flow);
        } catch (err) {
            console.error("ApprovalFlowService.create error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to create approval flow");
        }
    }

    // Get approval flows with filters
    async getFlows(
        context: RequestContext,
        filter: ApprovalFlowFilter
    ): Promise<ServiceResponse<ApprovalFlowWithSteps[]>> {
        try {
            const { tenantId } = context;
            const page = filter.page || 1;
            const limit = filter.limit || 20;
            const skip = (page - 1) * limit;

            // Build where clause
            const where: Record<string, unknown> = { tenantId };

            if (filter.type) {
                where.type = filter.type;
            }

            if (filter.isActive !== undefined) {
                where.isActive = filter.isActive;
            }

            // Get total count
            const total = await prisma.approvalFlow.count({ where });

            // Get flows with steps
            const flows = await prisma.approvalFlow.findMany({
                where,
                include: {
                    steps: {
                        orderBy: { stepOrder: "asc" },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            });

            return paginated(flows as ApprovalFlowWithSteps[], total, page, limit);
        } catch (err) {
            console.error("ApprovalFlowService.getFlows error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to get approval flows");
        }
    }

    // Update approval flow
    async update(
        context: RequestContext,
        flowId: string,
        data: UpdateApprovalFlowData
    ): Promise<ServiceResponse<ApprovalFlow>> {
        try {
            const { tenantId, role } = context;

            if (!["HRD", "SUPER_ADMIN"].includes(role)) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to update approval flows");
            }

            const flow = await prisma.approvalFlow.findFirst({
                where: withTenant(tenantId, { id: flowId }),
            });

            if (!flow) {
                return error(ErrorCodes.NOT_FOUND, "Approval flow not found");
            }

            // If setting as default, unset other defaults
            if (data.isDefault) {
                await prisma.approvalFlow.updateMany({
                    where: withTenant(tenantId, {
                        type: flow.type,
                        isDefault: true,
                        id: { not: flowId },
                    }),
                    data: { isDefault: false },
                });
            }

            const updated = await prisma.approvalFlow.update({
                where: { id: flowId },
                data,
            });

            return success(updated);
        } catch (err) {
            console.error("ApprovalFlowService.update error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to update approval flow");
        }
    }

    // Add approval step
    async addStep(
        context: RequestContext,
        flowId: string,
        data: CreateApprovalStepData
    ): Promise<ServiceResponse<ApprovalStep>> {
        try {
            const { tenantId, role } = context;

            if (!["HRD", "SUPER_ADMIN"].includes(role)) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to modify approval flows");
            }

            const flow = await prisma.approvalFlow.findFirst({
                where: withTenant(tenantId, { id: flowId }),
            });

            if (!flow) {
                return error(ErrorCodes.NOT_FOUND, "Approval flow not found");
            }

            // Create step
            const step = await prisma.approvalStep.create({
                data: {
                    approvalFlowId: flowId,
                    stepOrder: data.stepOrder,
                    approverType: data.approverType,
                    approverUserId: data.approverUserId,
                    approverRoleId: data.approverRoleId,
                    isRequired: data.isRequired !== false,
                    canSkip: data.canSkip || false,
                    timeoutHours: data.timeoutHours,
                },
            });

            return success(step);
        } catch (err) {
            console.error("ApprovalFlowService.addStep error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to add approval step");
        }
    }

    // Remove approval step
    async removeStep(
        context: RequestContext,
        flowId: string,
        stepId: string
    ): Promise<ServiceResponse<void>> {
        try {
            const { tenantId, role } = context;

            if (!["HRD", "SUPER_ADMIN"].includes(role)) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to modify approval flows");
            }

            const flow = await prisma.approvalFlow.findFirst({
                where: withTenant(tenantId, { id: flowId }),
            });

            if (!flow) {
                return error(ErrorCodes.NOT_FOUND, "Approval flow not found");
            }

            await prisma.approvalStep.delete({
                where: {
                    id: stepId,
                    approvalFlowId: flowId,
                },
            });

            return success(undefined);
        } catch (err) {
            console.error("ApprovalFlowService.removeStep error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to remove approval step");
        }
    }

    // Set flow as default for its type
    async setDefault(
        context: RequestContext,
        flowId: string
    ): Promise<ServiceResponse<ApprovalFlow>> {
        try {
            const { tenantId, role } = context;

            if (!["HRD", "SUPER_ADMIN"].includes(role)) {
                return error(ErrorCodes.FORBIDDEN, "Not authorized to modify approval flows");
            }

            const flow = await prisma.approvalFlow.findFirst({
                where: withTenant(tenantId, { id: flowId }),
            });

            if (!flow) {
                return error(ErrorCodes.NOT_FOUND, "Approval flow not found");
            }

            // Unset other defaults
            await prisma.approvalFlow.updateMany({
                where: withTenant(tenantId, {
                    type: flow.type,
                    isDefault: true,
                }),
                data: { isDefault: false },
            });

            // Set this as default
            const updated = await prisma.approvalFlow.update({
                where: { id: flowId },
                data: { isDefault: true },
            });

            return success(updated);
        } catch (err) {
            console.error("ApprovalFlowService.setDefault error:", err);
            return error(ErrorCodes.INTERNAL_ERROR, "Failed to set default approval flow");
        }
    }
}

export const approvalFlowService = new ApprovalFlowService();

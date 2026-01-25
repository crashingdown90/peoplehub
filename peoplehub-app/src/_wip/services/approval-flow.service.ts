// @ai:cl - Approval flow configuration service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant, withTenantData } from "@/lib/tenant";
import {
    ServiceResponse,
    success,
    error,
    ErrorCodes,
    PaginationParams,
    paginated,
} from "../types";
import type { ApprovalFlow, RequestType } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface ApprovalFlowLevelData {
    level: number;
    approverRole: string;
    isRequired: boolean;
}

export interface CreateApprovalFlowData {
    requestType: RequestType;
    branchId?: string;
    departmentId?: string;
    levels: ApprovalFlowLevelData[];
}

export interface UpdateApprovalFlowData {
    levels?: ApprovalFlowLevelData[];
    isActive?: boolean;
}

export interface ApprovalFlowWithLevels extends ApprovalFlow {
    levels: any[]; // TODO: ApprovalFlowLevel type missing from Prisma schema
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class ApprovalFlowService {
    /**
     * Create approval flow configuration
     */
    static async create(
        context: RequestContext,
        data: CreateApprovalFlowData
    ): Promise<ServiceResponse<ApprovalFlowWithLevels>> {
        // Only admin roles can configure approval flows
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk membuat approval flow");
        }

        // Validate levels
        if (!data.levels || data.levels.length === 0) {
            return error(ErrorCodes.VALIDATION_ERROR, "Minimal 1 level approval diperlukan");
        }

        // Validate level numbers are sequential
        const levelNumbers = data.levels.map((l) => l.level).sort((a, b) => a - b);
        for (let i = 0; i < levelNumbers.length; i++) {
            if (levelNumbers[i] !== i + 1) {
                return error(ErrorCodes.VALIDATION_ERROR, "Level harus berurutan dari 1");
            }
        }

        // Check for existing flow with same criteria
        const existing = await prisma.approvalFlow.findFirst({
            where: {
                tenantId: context.tenantId,
                requestType: data.requestType,
                branchId: data.branchId || null,
                departmentId: data.departmentId || null,
                deletedAt: null,
            },
        });

        if (existing) {
            return error(
                ErrorCodes.ALREADY_EXISTS,
                "Approval flow dengan kriteria yang sama sudah ada"
            );
        }

        // Create approval flow with levels in transaction
        const approvalFlow = await prisma.$transaction(async (tx) => {
            const flow = await tx.approvalFlow.create({
                data: withTenantData(context, {
                    requestType: data.requestType,
                    branchId: data.branchId,
                    departmentId: data.departmentId,
                    isActive: true,
                }),
            });

            // Create levels
            const levels = await Promise.all(
                data.levels.map((level) =>
                    tx.approvalFlowLevel.create({
                        data: {
                            flowId: flow.id,
                            level: level.level,
                            approverRole: level.approverRole,
                            isRequired: level.isRequired,
                        },
                    })
                )
            );

            return { ...flow, levels };
        });

        return success(approvalFlow);
    }

    /**
     * Get approval flow by ID
     */
    static async getById(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<ApprovalFlowWithLevels>> {
        const approvalFlow = await prisma.approvalFlow.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
            include: {
                levels: {
                    orderBy: { level: "asc" },
                },
                branch: {
                    select: { name: true },
                },
                department: {
                    select: { name: true },
                },
            },
        });

        if (!approvalFlow) {
            return error(ErrorCodes.NOT_FOUND, "Approval flow tidak ditemukan");
        }

        return success(approvalFlow);
    }

    /**
     * Get all approval flows
     */
    static async getAll(
        context: RequestContext,
        filter: PaginationParams & { requestType?: RequestType; isActive?: boolean }
    ): Promise<ServiceResponse<ApprovalFlow[]>> {
        const { page = 1, limit = 20, requestType, isActive } = filter;

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
            deletedAt: null,
        };

        if (requestType) {
            where.requestType = requestType;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [data, total] = await Promise.all([
            prisma.approvalFlow.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    levels: {
                        orderBy: { level: "asc" },
                    },
                    branch: {
                        select: { name: true },
                    },
                    department: {
                        select: { name: true },
                    },
                },
            }),
            prisma.approvalFlow.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get applicable approval flow for a request
     * Priority: Branch + Department > Branch > Department > Tenant-wide
     */
    static async getApplicableFlow(
        context: RequestContext,
        requestType: RequestType,
        branchId?: string,
        departmentId?: string
    ): Promise<ServiceResponse<ApprovalFlowWithLevels | null>> {
        // Try to find flow with most specific criteria first
        const flows = await prisma.approvalFlow.findMany({
            where: {
                tenantId: context.tenantId,
                requestType,
                isActive: true,
                deletedAt: null,
            },
            include: {
                levels: {
                    orderBy: { level: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        if (flows.length === 0) {
            return success(null);
        }

        // Priority 1: Branch + Department match
        if (branchId && departmentId) {
            const flow = flows.find((f) => f.branchId === branchId && f.departmentId === departmentId);
            if (flow) return success(flow);
        }

        // Priority 2: Branch match only
        if (branchId) {
            const flow = flows.find((f) => f.branchId === branchId && !f.departmentId);
            if (flow) return success(flow);
        }

        // Priority 3: Department match only
        if (departmentId) {
            const flow = flows.find((f) => !f.branchId && f.departmentId === departmentId);
            if (flow) return success(flow);
        }

        // Priority 4: Tenant-wide (no branch/department)
        const tenantWideFlow = flows.find((f) => !f.branchId && !f.departmentId);
        if (tenantWideFlow) return success(tenantWideFlow);

        return success(null);
    }

    /**
     * Update approval flow
     */
    static async update(
        context: RequestContext,
        id: string,
        data: UpdateApprovalFlowData
    ): Promise<ServiceResponse<ApprovalFlowWithLevels>> {
        // Only admin roles can modify approval flows
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk update approval flow");
        }

        const existing = await prisma.approvalFlow.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!existing) {
            return error(ErrorCodes.NOT_FOUND, "Approval flow tidak ditemukan");
        }

        // Update in transaction
        const updated = await prisma.$transaction(async (tx) => {
            // Update flow
            const flow = await tx.approvalFlow.update({
                where: { id },
                data: {
                    isActive: data.isActive,
                },
            });

            // If levels are provided, replace them
            if (data.levels) {
                // Validate level numbers
                const levelNumbers = data.levels.map((l) => l.level).sort((a, b) => a - b);
                for (let i = 0; i < levelNumbers.length; i++) {
                    if (levelNumbers[i] !== i + 1) {
                        throw new Error("Level harus berurutan dari 1");
                    }
                }

                // Delete old levels
                await tx.approvalFlowLevel.deleteMany({
                    where: { flowId: id },
                });

                // Create new levels
                const levels = await Promise.all(
                    data.levels.map((level) =>
                        tx.approvalFlowLevel.create({
                            data: {
                                flowId: id,
                                level: level.level,
                                approverRole: level.approverRole,
                                isRequired: level.isRequired,
                            },
                        })
                    )
                );

                return { ...flow, levels };
            }

            // If no levels update, fetch existing levels
            const levels = await tx.approvalFlowLevel.findMany({
                where: { flowId: id },
                orderBy: { level: "asc" },
            });

            return { ...flow, levels };
        });

        return success(updated);
    }

    /**
     * Delete approval flow (soft delete)
     */
    static async delete(
        context: RequestContext,
        id: string
    ): Promise<ServiceResponse<boolean>> {
        // Only admin roles can delete approval flows
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Tidak memiliki akses untuk delete approval flow");
        }

        const existing = await prisma.approvalFlow.findFirst({
            where: withTenant(context, { id, deletedAt: null }),
        });

        if (!existing) {
            return error(ErrorCodes.NOT_FOUND, "Approval flow tidak ditemukan");
        }

        await prisma.approvalFlow.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return success(true);
    }
}

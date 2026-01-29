// @ai:ag - Expense Service - Business Logic Layer
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
import type { Expense, ExpenseCategory, ExpenseStatus } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateExpenseData {
    categoryId: string;
    expenseDate: Date | string;
    amount: number;
    description: string;
    receiptUrl?: string;
    notes?: string;
}

export interface UpdateExpenseData {
    categoryId?: string;
    expenseDate?: Date | string;
    amount?: number;
    description?: string;
    receiptUrl?: string;
    notes?: string;
}

export interface ExpenseFilter extends PaginationParams {
    employeeId?: string;
    categoryId?: string;
    status?: ExpenseStatus;
    startDate?: Date | string;
    endDate?: Date | string;
}

export interface ExpenseWithDetails extends Expense {
    category: {
        code: string;
        name: string;
    };
    employee?: {
        fullName: string;
        employeeNumber: string;
        department?: {
            name: string;
        } | null;
    };
}

export interface ExpenseSummary {
    totalExpenses: number;
    totalAmount: number;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    rejectedCount: number;
    paidCount: number;
    paidAmount: number;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class ExpenseService {
    /**
     * Create a new expense claim
     */
    static async createExpense(
        context: RequestContext,
        data: CreateExpenseData
    ): Promise<ServiceResponse<Expense>> {
        // Validate category exists
        const category = await prisma.expenseCategory.findFirst({
            where: withTenant(context, {
                id: data.categoryId,
                isActive: true,
            }),
        });

        if (!category) {
            return error(
                ErrorCodes.NOT_FOUND,
                "Kategori expense tidak ditemukan atau tidak aktif"
            );
        }

        // Validate amount
        if (data.amount <= 0) {
            return error(ErrorCodes.VALIDATION_ERROR, "Jumlah harus lebih dari 0");
        }

        // Create the expense
        const expense = await prisma.expense.create({
            data: {
                tenantId: context.tenantId,
                employeeId: context.employeeId!,
                categoryId: data.categoryId,
                expenseDate: new Date(data.expenseDate),
                amount: data.amount,
                description: data.description,
                receiptUrl: data.receiptUrl,
                notes: data.notes,
                status: "PENDING",
            },
            include: {
                category: {
                    select: { code: true, name: true },
                },
            },
        });

        return success(expense);
    }

    /**
     * Get expenses with filters
     */
    static async getExpenses(
        context: RequestContext,
        filter: ExpenseFilter
    ): Promise<ServiceResponse<ExpenseWithDetails[]>> {
        const {
            page = 1,
            limit = 20,
            sortBy = "createdAt",
            sortOrder = "desc",
            employeeId,
            categoryId,
            status,
            startDate,
            endDate,
        } = filter;

        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
        };

        // Role-based filtering
        if (["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
            // Can see all expenses
            if (employeeId) where.employeeId = employeeId;
        } else if (context.role === "MANAGER") {
            // Manager sees team expenses
            if (!employeeId) {
                const subordinates = await prisma.employee.findMany({
                    where: {
                        tenantId: context.tenantId,
                        managerId: context.employeeId,
                    },
                    select: { id: true },
                });
                where.employeeId = { in: subordinates.map((s) => s.id) };
            } else {
                where.employeeId = employeeId;
            }
        } else {
            // Employee sees only own expenses
            where.employeeId = context.employeeId;
        }

        if (categoryId) where.categoryId = categoryId;
        if (status) where.status = status;
        if (startDate) where.expenseDate = { gte: new Date(startDate) };
        if (endDate) {
            where.expenseDate = {
                ...(where.expenseDate as object),
                lte: new Date(endDate),
            };
        }

        const [data, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    category: { select: { code: true, name: true } },
                    employee: {
                        select: {
                            fullName: true,
                            employeeNumber: true,
                            department: {
                                select: { name: true },
                            },
                        },
                    },
                },
            }),
            prisma.expense.count({ where }),
        ]);

        return paginated(data, total, page, limit);
    }

    /**
     * Get single expense by ID
     */
    static async getExpenseById(
        context: RequestContext,
        expenseId: string
    ): Promise<ServiceResponse<ExpenseWithDetails>> {
        const expense = await prisma.expense.findFirst({
            where: withTenant(context, { id: expenseId }),
            include: {
                category: { select: { code: true, name: true } },
                employee: {
                    select: {
                        fullName: true,
                        employeeNumber: true,
                        department: { select: { name: true } },
                    },
                },
            },
        });

        if (!expense) {
            return error(ErrorCodes.NOT_FOUND, "Expense tidak ditemukan");
        }

        // Check access
        if (
            expense.employeeId !== context.employeeId &&
            !["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)
        ) {
            return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
        }

        return success(expense);
    }

    /**
     * Update expense (only by owner, before approval)
     */
    static async updateExpense(
        context: RequestContext,
        expenseId: string,
        data: UpdateExpenseData
    ): Promise<ServiceResponse<Expense>> {
        const expense = await prisma.expense.findFirst({
            where: withTenant(context, {
                id: expenseId,
                employeeId: context.employeeId!,
            }),
        });

        if (!expense) {
            return error(ErrorCodes.NOT_FOUND, "Expense tidak ditemukan");
        }

        if (expense.status !== "PENDING") {
            return error(
                ErrorCodes.CANNOT_MODIFY,
                "Expense yang sudah diproses tidak dapat diubah"
            );
        }

        const updateData: Record<string, unknown> = {};
        if (data.categoryId) {
            // Validate category
            const category = await prisma.expenseCategory.findFirst({
                where: withTenant(context, {
                    id: data.categoryId,
                    isActive: true,
                }),
            });
            if (!category) {
                return error(ErrorCodes.NOT_FOUND, "Kategori tidak valid");
            }
            updateData.categoryId = data.categoryId;
        }
        if (data.expenseDate) updateData.expenseDate = new Date(data.expenseDate);
        if (data.amount !== undefined) {
            if (data.amount <= 0) {
                return error(ErrorCodes.VALIDATION_ERROR, "Jumlah harus lebih dari 0");
            }
            updateData.amount = data.amount;
        }
        if (data.description) updateData.description = data.description;
        if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const updated = await prisma.expense.update({
            where: { id: expenseId },
            data: updateData,
        });

        return success(updated);
    }

    /**
     * Approve expense (Manager or HRD/Finance)
     */
    static async approveExpense(
        context: RequestContext,
        expenseId: string,
        notes?: string
    ): Promise<ServiceResponse<Expense>> {
        const expense = await prisma.expense.findFirst({
            where: withTenant(context, { id: expenseId }),
        });

        if (!expense) {
            return error(ErrorCodes.NOT_FOUND, "Expense tidak ditemukan");
        }

        // Check role and status
        let newStatus: ExpenseStatus = expense.status;

        if (context.role === "MANAGER") {
            if (expense.status !== "PENDING") {
                return error(
                    ErrorCodes.CANNOT_MODIFY,
                    "Expense sudah diproses sebelumnya"
                );
            }
            newStatus = "APPROVED_MANAGER";
        } else if (["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
            if (!["PENDING", "APPROVED_MANAGER"].includes(expense.status)) {
                return error(
                    ErrorCodes.CANNOT_MODIFY,
                    "Expense sudah diproses sebelumnya"
                );
            }
            newStatus = "APPROVED";
        } else {
            return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses approval");
        }

        const updated = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                status: newStatus,
                approvedById: context.employeeId,
                approvedAt: new Date(),
                notes: notes || expense.notes,
            },
        });

        return success(updated);
    }

    /**
     * Reject expense
     */
    static async rejectExpense(
        context: RequestContext,
        expenseId: string,
        rejectionReason: string
    ): Promise<ServiceResponse<Expense>> {
        if (!["MANAGER", "HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
        }

        const expense = await prisma.expense.findFirst({
            where: withTenant(context, { id: expenseId }),
        });

        if (!expense) {
            return error(ErrorCodes.NOT_FOUND, "Expense tidak ditemukan");
        }

        if (!["PENDING", "APPROVED_MANAGER"].includes(expense.status)) {
            return error(
                ErrorCodes.CANNOT_MODIFY,
                "Expense sudah diproses sebelumnya"
            );
        }

        const updated = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                status: "REJECTED",
                rejectionReason,
            },
        });

        return success(updated);
    }

    /**
     * Mark expense as paid (Finance only)
     */
    static async markAsPaid(
        context: RequestContext,
        expenseId: string
    ): Promise<ServiceResponse<Expense>> {
        if (!["FINANCE", "SUPER_ADMIN"].includes(context.role)) {
            return error(
                ErrorCodes.FORBIDDEN,
                "Hanya Finance yang dapat menandai sebagai dibayar"
            );
        }

        const expense = await prisma.expense.findFirst({
            where: withTenant(context, { id: expenseId }),
        });

        if (!expense) {
            return error(ErrorCodes.NOT_FOUND, "Expense tidak ditemukan");
        }

        if (expense.status !== "APPROVED") {
            return error(
                ErrorCodes.CANNOT_MODIFY,
                "Hanya expense yang sudah disetujui yang dapat dibayar"
            );
        }

        const updated = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                status: "PAID",
                paidAt: new Date(),
            },
        });

        return success(updated);
    }

    /**
     * Delete expense (only pending, by owner)
     */
    static async deleteExpense(
        context: RequestContext,
        expenseId: string
    ): Promise<ServiceResponse<void>> {
        const expense = await prisma.expense.findFirst({
            where: withTenant(context, {
                id: expenseId,
                employeeId: context.employeeId!,
            }),
        });

        if (!expense) {
            return error(ErrorCodes.NOT_FOUND, "Expense tidak ditemukan");
        }

        if (expense.status !== "PENDING") {
            return error(
                ErrorCodes.CANNOT_MODIFY,
                "Hanya expense pending yang dapat dihapus"
            );
        }

        await prisma.expense.delete({
            where: { id: expenseId },
        });

        return success(undefined);
    }

    /**
     * Get expense summary/report
     */
    static async getExpenseSummary(
        context: RequestContext,
        filter: {
            employeeId?: string;
            startDate?: Date | string;
            endDate?: Date | string;
        }
    ): Promise<ServiceResponse<ExpenseSummary>> {
        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
        };

        if (filter.employeeId) where.employeeId = filter.employeeId;
        if (filter.startDate)
            where.expenseDate = { gte: new Date(filter.startDate) };
        if (filter.endDate) {
            where.expenseDate = {
                ...(where.expenseDate as object),
                lte: new Date(filter.endDate),
            };
        }

        // Role-based filtering
        if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
            where.employeeId = context.employeeId;
        }

        const [
            totalExpenses,
            totalAmount,
            pendingStats,
            approvedStats,
            rejectedStats,
            paidStats,
        ] = await Promise.all([
            prisma.expense.count({ where }),
            prisma.expense.aggregate({
                where,
                _sum: { amount: true },
            }),
            prisma.expense.aggregate({
                where: { ...where, status: "PENDING" },
                _count: true,
                _sum: { amount: true },
            }),
            prisma.expense.aggregate({
                where: { ...where, status: "APPROVED" },
                _count: true,
                _sum: { amount: true },
            }),
            prisma.expense.aggregate({
                where: { ...where, status: "REJECTED" },
                _count: true,
                _sum: { amount: true },
            }),
            prisma.expense.aggregate({
                where: { ...where, status: "PAID" },
                _count: true,
                _sum: { amount: true },
            }),
        ]);

        const summary: ExpenseSummary = {
            totalExpenses,
            totalAmount: Number(totalAmount._sum.amount || 0),
            pendingCount: pendingStats._count,
            pendingAmount: Number(pendingStats._sum.amount || 0),
            approvedCount: approvedStats._count,
            approvedAmount: Number(approvedStats._sum.amount || 0),
            rejectedCount: rejectedStats._count,
            paidCount: paidStats._count,
            paidAmount: Number(paidStats._sum.amount || 0),
        };

        return success(summary);
    }

    // ==========================================
    // EXPENSE CATEGORY METHODS
    // ==========================================

    /**
     * Get all expense categories
     */
    static async getCategories(
        context: RequestContext,
        activeOnly = true
    ): Promise<ServiceResponse<ExpenseCategory[]>> {
        const where: Record<string, unknown> = {
            tenantId: context.tenantId,
        };

        if (activeOnly) where.isActive = true;

        const categories = await prisma.expenseCategory.findMany({
            where,
            orderBy: { name: "asc" },
        });

        return success(categories);
    }

    /**
     * Create expense category (HRD/Finance only)
     */
    static async createCategory(
        context: RequestContext,
        data: {
            code: string;
            name: string;
            description?: string;
        }
    ): Promise<ServiceResponse<ExpenseCategory>> {
        if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
            return error(
                ErrorCodes.FORBIDDEN,
                "Hanya HRD/Finance yang dapat membuat kategori"
            );
        }

        // Check if code already exists
        const existing = await prisma.expenseCategory.findUnique({
            where: {
                tenantId_code: {
                    tenantId: context.tenantId,
                    code: data.code,
                },
            },
        });

        if (existing) {
            return error(ErrorCodes.CONFLICT, "Kode kategori sudah digunakan");
        }

        const category = await prisma.expenseCategory.create({
            data: {
                tenantId: context.tenantId,
                code: data.code,
                name: data.name,
                description: data.description,
            },
        });

        return success(category);
    }

    /**
     * Update expense category
     */
    static async updateCategory(
        context: RequestContext,
        categoryId: string,
        data: {
            code?: string;
            name?: string;
            description?: string;
            isActive?: boolean;
        }
    ): Promise<ServiceResponse<ExpenseCategory>> {
        if (!["HRD", "FINANCE", "SUPER_ADMIN"].includes(context.role)) {
            return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
        }

        const category = await prisma.expenseCategory.findFirst({
            where: withTenant(context, { id: categoryId }),
        });

        if (!category) {
            return error(ErrorCodes.NOT_FOUND, "Kategori tidak ditemukan");
        }

        const updated = await prisma.expenseCategory.update({
            where: { id: categoryId },
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                isActive: data.isActive,
            },
        });

        return success(updated);
    }
}

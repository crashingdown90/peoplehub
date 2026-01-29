// @ai:ag - Created by Antigravity
// Expense management type definitions

import { ExpenseStatus } from './enums';

/**
 * Expense category interface
 */
export interface ExpenseCategory {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Expense interface
 */
export interface Expense {
    id: string;
    tenantId: string;
    employeeId: string;
    categoryId: string;
    expenseDate: Date;
    amount: number;
    description: string;
    receiptUrl?: string | null;
    status: ExpenseStatus;
    approvedById?: string | null;
    approvedAt?: Date | null;
    rejectionReason?: string | null;
    paidAt?: Date | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Relations (optional, loaded when needed)
    category?: ExpenseCategory;
}

/**
 * Create expense request DTO
 */
export interface CreateExpenseRequest {
    categoryId: string;
    expenseDate: string; // ISO date string
    amount: number;
    description: string;
    receiptUrl?: string;
    notes?: string;
}

/**
 * Update expense request DTO
 */
export interface UpdateExpenseRequest {
    categoryId?: string;
    expenseDate?: string;
    amount?: number;
    description?: string;
    receiptUrl?: string;
    notes?: string;
}

/**
 * Approve expense request DTO
 */
export interface ApproveExpenseRequest {
    notes?: string;
}

/**
 * Reject expense request DTO
 */
export interface RejectExpenseRequest {
    rejectionReason: string;
}

/**
 * Expense with employee details (for reports)
 */
export interface ExpenseWithEmployee extends Expense {
    employee: {
        id: string;
        fullName: string;
        employeeNumber: string;
        department?: {
            id: string;
            name: string;
        } | null;
    };
}

/**
 * Expense category create request DTO
 */
export interface CreateExpenseCategoryRequest {
    code: string;
    name: string;
    description?: string;
}

/**
 * Expense category update request DTO
 */
export interface UpdateExpenseCategoryRequest {
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
}

/**
 * Expense report summary
 */
export interface ExpenseReportSummary {
    totalExpenses: number;
    totalAmount: number;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    rejectedCount: number;
    rejectedAmount: number;
    paidCount: number;
    paidAmount: number;
}

/**
 * Expense filter for queries
 */
export interface ExpenseFilter {
    employeeId?: string;
    categoryId?: string;
    status?: ExpenseStatus;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
}

/**
 * Expense list response
 */
export interface ExpenseListResponse {
    expenses: ExpenseWithEmployee[];
    total: number;
    page: number;
    pageSize: number;
    summary?: ExpenseReportSummary;
}

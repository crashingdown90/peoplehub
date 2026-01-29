/**
 * @jest-environment node
 */
// @ai:ag - Created by Antigravity
// Unit tests for Expense Service

import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { ExpenseService } from "@/services/expense/expense.service";
import type { RequestContext } from "@/lib/tenant";

// Add expense mock to prismaMock
(prismaMock as any).expense = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
};

(prismaMock as any).expenseCategory = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
};

describe("ExpenseService", () => {
    const employeeContext: RequestContext = {
        tenantId: "tenant-123",
        userId: "user-emp",
        employeeId: "emp-123",
        role: "EMPLOYEE",
    };

    const managerContext: RequestContext = {
        tenantId: "tenant-123",
        userId: "user-mgr",
        employeeId: "emp-mgr",
        role: "MANAGER",
    };

    const financeContext: RequestContext = {
        tenantId: "tenant-123",
        userId: "user-fin",
        employeeId: "emp-fin",
        role: "FINANCE",
    };

    const mockCategory = {
        id: "cat-123",
        tenantId: "tenant-123",
        code: "TRAVEL",
        name: "Travel Expenses",
        isActive: true,
    };

    const mockExpense = {
        id: "exp-123",
        tenantId: "tenant-123",
        employeeId: "emp-123",
        categoryId: "cat-123",
        expenseDate: new Date("2026-01-15"),
        amount: 500000,
        description: "Flight ticket",
        status: "PENDING",
        category: { code: "TRAVEL", name: "Travel Expenses" },
    };

    beforeEach(() => {
        resetPrismaMock();
        jest.clearAllMocks();
    });

    describe("createExpense", () => {
        it("should create expense successfully", async () => {
            ((prismaMock as any).expenseCategory.findFirst as jest.Mock).mockResolvedValue(mockCategory);
            ((prismaMock as any).expense.create as jest.Mock).mockResolvedValue(mockExpense);

            const result = await ExpenseService.createExpense(employeeContext, {
                categoryId: "cat-123",
                expenseDate: "2026-01-15",
                amount: 500000,
                description: "Flight ticket",
            });

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("status", "PENDING");
        });

        it("should reject when category not found", async () => {
            ((prismaMock as any).expenseCategory.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await ExpenseService.createExpense(employeeContext, {
                categoryId: "invalid-cat",
                expenseDate: "2026-01-15",
                amount: 500000,
                description: "Test",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should reject when amount is zero or negative", async () => {
            ((prismaMock as any).expenseCategory.findFirst as jest.Mock).mockResolvedValue(mockCategory);

            const result = await ExpenseService.createExpense(employeeContext, {
                categoryId: "cat-123",
                expenseDate: "2026-01-15",
                amount: 0,
                description: "Test",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("VALIDATION_ERROR");
        });
    });

    describe("getExpenseById", () => {
        it("should return expense for owner", async () => {
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(mockExpense);

            const result = await ExpenseService.getExpenseById(employeeContext, "exp-123");

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe("exp-123");
        });

        it("should return NOT_FOUND for non-existent expense", async () => {
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await ExpenseService.getExpenseById(employeeContext, "nonexistent");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should deny access for non-owner employee", async () => {
            const otherEmployeeExpense = { ...mockExpense, employeeId: "emp-other" };
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(otherEmployeeExpense);

            const result = await ExpenseService.getExpenseById(employeeContext, "exp-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should allow FINANCE to view any expense", async () => {
            const otherEmployeeExpense = { ...mockExpense, employeeId: "emp-other" };
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(otherEmployeeExpense);

            const result = await ExpenseService.getExpenseById(financeContext, "exp-123");

            expect(result.success).toBe(true);
        });
    });

    describe("updateExpense", () => {
        it("should update pending expense by owner", async () => {
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(mockExpense);
            ((prismaMock as any).expense.update as jest.Mock).mockResolvedValue({
                ...mockExpense,
                description: "Updated description",
            });

            const result = await ExpenseService.updateExpense(employeeContext, "exp-123", {
                description: "Updated description",
            });

            expect(result.success).toBe(true);
        });

        it("should reject update on non-pending expense", async () => {
            const approvedExpense = { ...mockExpense, status: "APPROVED" };
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(approvedExpense);

            const result = await ExpenseService.updateExpense(employeeContext, "exp-123", {
                description: "Try to update",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });

    describe("approveExpense", () => {
        it("should allow manager to approve pending expense", async () => {
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(mockExpense);
            ((prismaMock as any).expense.update as jest.Mock).mockResolvedValue({
                ...mockExpense,
                status: "APPROVED_MANAGER",
            });

            const result = await ExpenseService.approveExpense(managerContext, "exp-123");

            expect(result.success).toBe(true);
            expect(result.data?.status).toBe("APPROVED_MANAGER");
        });

        it("should allow finance to give final approval", async () => {
            const managerApprovedExpense = { ...mockExpense, status: "APPROVED_MANAGER" };
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(managerApprovedExpense);
            ((prismaMock as any).expense.update as jest.Mock).mockResolvedValue({
                ...mockExpense,
                status: "APPROVED",
            });

            const result = await ExpenseService.approveExpense(financeContext, "exp-123");

            expect(result.success).toBe(true);
            expect(result.data?.status).toBe("APPROVED");
        });

        it("should deny employee from approving", async () => {
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(mockExpense);

            const result = await ExpenseService.approveExpense(employeeContext, "exp-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });

    describe("rejectExpense", () => {
        it("should allow manager to reject expense", async () => {
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(mockExpense);
            ((prismaMock as any).expense.update as jest.Mock).mockResolvedValue({
                ...mockExpense,
                status: "REJECTED",
            });

            const result = await ExpenseService.rejectExpense(
                managerContext,
                "exp-123",
                "Budget exceeded"
            );

            expect(result.success).toBe(true);
        });

        it("should deny employee from rejecting", async () => {
            const result = await ExpenseService.rejectExpense(
                employeeContext,
                "exp-123",
                "Test"
            );

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });

    describe("markAsPaid", () => {
        it("should allow finance to mark approved expense as paid", async () => {
            const approvedExpense = { ...mockExpense, status: "APPROVED" };
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(approvedExpense);
            ((prismaMock as any).expense.update as jest.Mock).mockResolvedValue({
                ...mockExpense,
                status: "PAID",
            });

            const result = await ExpenseService.markAsPaid(financeContext, "exp-123");

            expect(result.success).toBe(true);
        });

        it("should deny non-finance from marking as paid", async () => {
            const result = await ExpenseService.markAsPaid(employeeContext, "exp-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should reject if expense not approved", async () => {
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(mockExpense);

            const result = await ExpenseService.markAsPaid(financeContext, "exp-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });

    describe("deleteExpense", () => {
        it("should allow owner to delete pending expense", async () => {
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(mockExpense);
            ((prismaMock as any).expense.delete as jest.Mock).mockResolvedValue({});

            const result = await ExpenseService.deleteExpense(employeeContext, "exp-123");

            expect(result.success).toBe(true);
        });

        it("should reject deletion of non-pending expense", async () => {
            const approvedExpense = { ...mockExpense, status: "APPROVED" };
            ((prismaMock as any).expense.findFirst as jest.Mock).mockResolvedValue(approvedExpense);

            const result = await ExpenseService.deleteExpense(employeeContext, "exp-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });

    describe("getCategories", () => {
        it("should return active categories", async () => {
            ((prismaMock as any).expenseCategory.findMany as jest.Mock).mockResolvedValue([mockCategory]);

            const result = await ExpenseService.getCategories(employeeContext);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });
    });

    describe("createCategory", () => {
        it("should allow finance to create category", async () => {
            ((prismaMock as any).expenseCategory.findUnique as jest.Mock).mockResolvedValue(null);
            ((prismaMock as any).expenseCategory.create as jest.Mock).mockResolvedValue(mockCategory);

            const result = await ExpenseService.createCategory(financeContext, {
                code: "TRAVEL",
                name: "Travel Expenses",
            });

            expect(result.success).toBe(true);
        });

        it("should deny employee from creating category", async () => {
            const result = await ExpenseService.createCategory(employeeContext, {
                code: "TEST",
                name: "Test Category",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should reject duplicate category code", async () => {
            ((prismaMock as any).expenseCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);

            const result = await ExpenseService.createCategory(financeContext, {
                code: "TRAVEL",
                name: "Duplicate",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CONFLICT");
        });
    });
});

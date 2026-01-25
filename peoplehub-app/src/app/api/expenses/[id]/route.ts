// @ai:ag - Single expense API routes (GET, PUT, DELETE)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { ExpenseService } from "@/services/expense";
import { z } from "zod";

const updateExpenseSchema = z.object({
    categoryId: z.string().cuid().optional(),
    expenseDate: z.string().optional(),
    amount: z.number().positive().optional(),
    description: z.string().min(5).optional(),
    receiptUrl: z.string().url().optional(),
    notes: z.string().optional(),
});

// GET /api/expenses/[id] - Get single expense
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
                { status: 401 }
            );
        }

        const result = await ExpenseService.getExpenseById(context, id);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: result.error?.code === "NOT_FOUND" ? 404 : 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Get expense error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validationResult = updateExpenseSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Data tidak valid",
                        details: validationResult.error.issues,
                    },
                },
                { status: 400 }
            );
        }

        const result = await ExpenseService.updateExpense(
            context,
            id,
            validationResult.data
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: result.error?.code === "NOT_FOUND" ? 404 : 422 }
            );
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "EXPENSE_UPDATED",
                objectType: "Expense",
                objectId: id,
                afterData: JSON.parse(JSON.stringify(validationResult.data)),
            },
        });

        return NextResponse.json({
            success: true,
            data: result.data,
            message: "Expense berhasil diperbarui",
        });
    } catch (error) {
        console.error("Update expense error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
                { status: 401 }
            );
        }

        const result = await ExpenseService.deleteExpense(context, id);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: result.error?.code === "NOT_FOUND" ? 404 : 422 }
            );
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "EXPENSE_DELETED",
                objectType: "Expense",
                objectId: id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Expense berhasil dihapus",
        });
    } catch (error) {
        console.error("Delete expense error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

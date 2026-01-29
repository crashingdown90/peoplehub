// @ai:ag - Expense approval API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { ExpenseService } from "@/services/expense";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const approveExpenseSchema = z.object({
    notes: z.string().optional(),
});

// POST /api/expenses/[id]/approve - Approve expense
export async function POST(
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
        const validationResult = approveExpenseSchema.safeParse(body);

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

        const result = await ExpenseService.approveExpense(
            context,
            id,
            validationResult.data.notes
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: result.error?.code === "FORBIDDEN" ? 403 : 422 }
            );
        }

        const expense = result.data!;

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "EXPENSE_APPROVED",
                objectType: "Expense",
                objectId: id,
                afterData: JSON.parse(
                    JSON.stringify({
                        status: expense.status,
                        approvedBy: context.employeeId,
                        notes: validationResult.data.notes,
                    })
                ),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                id: expense.id,
                status: expense.status,
            },
            message: `Expense berhasil disetujui (${expense.status})`,
        });
    } catch (error) {
        console.error("Approve expense error:", error);
        return handlePrismaError(error);
    }
}

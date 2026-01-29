// @ai:ag - Expense mark as paid API route (Finance only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { ExpenseService } from "@/services/expense";
import { handlePrismaError } from "@/lib/api-utils";

// POST /api/expenses/[id]/pay - Mark expense as paid
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

        const result = await ExpenseService.markAsPaid(context, id);

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
                action: "EXPENSE_PAID",
                objectType: "Expense",
                objectId: id,
                afterData: JSON.parse(
                    JSON.stringify({
                        status: "PAID",
                        paidAt: expense.paidAt,
                    })
                ),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                id: expense.id,
                status: expense.status,
                paidAt: expense.paidAt,
            },
            message: "Expense berhasil ditandai sebagai dibayar",
        });
    } catch (error) {
        console.error("Mark expense as paid error:", error);
        return handlePrismaError(error);
    }
}

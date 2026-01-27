// @ai:ag - Expense rejection API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { ExpenseService } from "@/services/expense";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const rejectExpenseSchema = z.object({
    rejectionReason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
});

// POST /api/expenses/[id]/reject - Reject expense
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
        const validationResult = rejectExpenseSchema.safeParse(body);

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

        const result = await ExpenseService.rejectExpense(
            context,
            id,
            validationResult.data.rejectionReason
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: result.error?.code === "FORBIDDEN" ? 403 : 422 }
            );
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "EXPENSE_REJECTED",
                objectType: "Expense",
                objectId: id,
                afterData: JSON.parse(
                    JSON.stringify({
                        status: "REJECTED",
                        rejectionReason: validationResult.data.rejectionReason,
                    })
                ),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Expense berhasil ditolak",
        });
    } catch (error) {
        console.error("Reject expense error:", error);
        return handlePrismaError(error);
    }
}

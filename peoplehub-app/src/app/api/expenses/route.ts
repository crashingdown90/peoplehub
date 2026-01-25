// @ai:ag - Expense requests API routes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { ExpenseService } from "@/services/expense";
import { z } from "zod";

const createExpenseSchema = z.object({
    categoryId: z.string().cuid("Kategori wajib dipilih"),
    expenseDate: z.string().min(1, "Tanggal expense wajib diisi"),
    amount: z.number().positive("Jumlah harus lebih dari 0"),
    description: z.string().min(5, "Deskripsi minimal 5 karakter"),
    receiptUrl: z.string().url().optional(),
    notes: z.string().optional(),
});

const updateExpenseSchema = z.object({
    categoryId: z.string().cuid().optional(),
    expenseDate: z.string().optional(),
    amount: z.number().positive().optional(),
    description: z.string().min(5).optional(),
    receiptUrl: z.string().url().optional(),
    notes: z.string().optional(),
});

// GET /api/expenses - Get expenses with filters
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId") || undefined;
        const categoryId = searchParams.get("categoryId") || undefined;
        const status = searchParams.get("status") as
            | "PENDING"
            | "APPROVED_MANAGER"
            | "APPROVED_HRD"
            | "APPROVED"
            | "REJECTED"
            | "PAID"
            | null;
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const result = await ExpenseService.getExpenses(context, {
            employeeId,
            categoryId,
            status: status || undefined,
            startDate,
            endDate,
            page,
            limit,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        console.error("Get expenses error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// POST /api/expenses - Create expense claim
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validationResult = createExpenseSchema.safeParse(body);

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

        const { categoryId, expenseDate, amount, description, receiptUrl, notes } =
            validationResult.data;

        // Use ExpenseService to create
        const result = await ExpenseService.createExpense(context, {
            categoryId,
            expenseDate: new Date(expenseDate),
            amount,
            description,
            receiptUrl,
            notes,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 422 }
            );
        }

        const expense = result.data!;

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "EXPENSE_CREATED",
                objectType: "Expense",
                objectId: expense.id,
                afterData: JSON.parse(
                    JSON.stringify({
                        categoryId,
                        expenseDate,
                        amount,
                        description,
                    })
                ),
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: expense.id,
                    categoryId: expense.categoryId,
                    expenseDate: expense.expenseDate,
                    amount: expense.amount,
                    status: expense.status,
                },
                message: "Expense berhasil dibuat. Menunggu persetujuan.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create expense error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

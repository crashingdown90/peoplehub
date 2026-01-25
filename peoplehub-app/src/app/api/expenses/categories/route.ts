// @ai:ag - Expense category API routes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { ExpenseService } from "@/services/expense";
import { z } from "zod";

const createCategorySchema = z.object({
    code: z.string().min(2, "Kode minimal 2 karakter").max(20, "Kode maksimal 20 karakter"),
    name: z.string().min(3, "Nama minimal 3 karakter"),
    description: z.string().optional(),
});

// GET /api/expenses/categories - Get all expense categories
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
        const activeOnly = searchParams.get("activeOnly") !== "false";

        const result = await ExpenseService.getCategories(context, activeOnly);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Get expense categories error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// POST /api/expenses/categories - Create expense category (HRD/Finance only)
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
        const validationResult = createCategorySchema.safeParse(body);

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

        const result = await ExpenseService.createCategory(
            context,
            validationResult.data
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: result.error?.code === "FORBIDDEN" ? 403 : 422 }
            );
        }

        const category = result.data!;

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "EXPENSE_CATEGORY_CREATED",
                objectType: "ExpenseCategory",
                objectId: category.id,
                afterData: JSON.parse(JSON.stringify(validationResult.data)),
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: category,
                message: "Kategori expense berhasil dibuat",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create expense category error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

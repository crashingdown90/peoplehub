// @ai:ag - Expense summary/report API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ExpenseService } from "@/services/expense";

// GET /api/expenses/summary - Get expense summary statistics
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
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;

        const result = await ExpenseService.getExpenseSummary(context, {
            employeeId,
            startDate,
            endDate,
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
        });
    } catch (error) {
        console.error("Get expense summary error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

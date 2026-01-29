// @ai:cl - Letter request API routes - GET (list) and POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { LetterService } from "@/services/letter";
import { createLetterRequestSchema, letterFilterSchema } from "@/validations/letter.schema";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/letters/requests
 * Get letter requests for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const filterData = {
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            sortBy: searchParams.get("sortBy"),
            sortOrder: searchParams.get("sortOrder"),
            startDate: searchParams.get("startDate"),
            endDate: searchParams.get("endDate"),
            status: searchParams.get("status"),
            letterCategoryId: searchParams.get("letterCategoryId"),
            employeeId: searchParams.get("employeeId"),
        };

        const validated = letterFilterSchema.parse(filterData);

        // For non-admin users, filter by their own employeeId
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            validated.employeeId = context.employeeId;
        }

        const result = await LetterService.getByEmployee(context, validated);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error getting letter requests:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/letters/requests
 * Create new letter request
 */
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!context.employeeId) {
            return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
        }

        const body = await request.json();
        const validated = createLetterRequestSchema.parse(body);

        const result = await LetterService.create(context, validated);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "CREATE",
            resource: "LETTER_REQUEST",
            resourceId: result.data.id,
            details: {
                categoryId: result.data.letterCategoryId,
                categoryName: result.data.letterCategory.name,
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("[API] Error creating letter request:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

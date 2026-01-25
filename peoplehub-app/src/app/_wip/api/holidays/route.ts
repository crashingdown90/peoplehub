// @ai:cl - Holiday management API routes - GET (list) and POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { HolidayService } from "@/services/holiday";
import { createHolidaySchema, holidayFilterSchema, bulkCreateHolidaySchema } from "@/validations/holiday.schema";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/admin/holidays
 * Get all holidays with filters
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
            year: searchParams.get("year"),
            month: searchParams.get("month"),
            branchId: searchParams.get("branchId"),
            isNational: searchParams.get("isNational"),
        };

        const validated = holidayFilterSchema.parse(filterData);

        const result = await HolidayService.getAll(context, validated);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error getting holidays:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/admin/holidays
 * Create new holiday
 */
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin roles can create holidays
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validated = createHolidaySchema.parse(body);

        const result = await HolidayService.create(context, validated);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "CREATE",
            resource: "HOLIDAY",
            resourceId: result.data.id,
            details: {
                name: result.data.name,
                date: result.data.holidayDate,
                isNational: result.data.isNational,
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("[API] Error creating holiday:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

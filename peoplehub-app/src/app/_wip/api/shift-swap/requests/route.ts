// @ai:cl - Shift swap requests API routes - GET (list) and POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { ShiftSwapService } from "@/services/shift";
import { createShiftSwapSchema, shiftSwapFilterSchema } from "@/validations/shift-swap.schema";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/shift-swap/requests
 * Get shift swap requests for the current user
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
            employeeId: searchParams.get("employeeId"),
        };

        const validated = shiftSwapFilterSchema.parse(filterData);

        // Always filter by employee ID for non-admin
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            validated.employeeId = context.employeeId;
        }

        const result = await ShiftSwapService.getByEmployee(context, validated);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error getting shift swap requests:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/shift-swap/requests
 * Create new shift swap request
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
        const validated = createShiftSwapSchema.parse(body);

        const result = await ShiftSwapService.create(context, validated);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "CREATE",
            resource: "SHIFT_SWAP",
            resourceId: result.data.id,
            details: {
                targetEmployeeId: result.data.targetEmployeeId,
                swapDate: result.data.swapDate,
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("[API] Error creating shift swap request:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

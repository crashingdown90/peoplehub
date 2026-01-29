// @ai:cl - Holiday detail API routes - GET, PATCH, DELETE
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { HolidayService } from "@/services/holiday";
import { updateHolidaySchema } from "@/validations/holiday.schema";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/admin/holidays/:id
 * Get holiday details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await HolidayService.getById(context, params.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 404 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error getting holiday:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/holidays/:id
 * Update holiday
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin roles can update
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validated = updateHolidaySchema.parse(body);

        const result = await HolidayService.update(context, params.id, validated);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "UPDATE",
            resource: "HOLIDAY",
            resourceId: params.id,
            details: validated,
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error updating holiday:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/holidays/:id
 * Delete holiday
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin roles can delete
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const result = await HolidayService.delete(context, params.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "DELETE",
            resource: "HOLIDAY",
            resourceId: params.id,
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error deleting holiday:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

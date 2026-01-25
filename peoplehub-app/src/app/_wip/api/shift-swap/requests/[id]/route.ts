// @ai:cl - Shift swap requests API routes - GET (detail), DELETE (cancel)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { ShiftSwapService } from "@/services/shift";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/shift-swap/requests/:id
 * Get shift swap request details
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

        const result = await ShiftSwapService.getById(context, params.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 404 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error getting shift swap detail:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/shift-swap/requests/:id
 * Cancel shift swap request
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

        const result = await ShiftSwapService.cancel(context, params.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "DELETE",
            resource: "SHIFT_SWAP",
            resourceId: params.id,
            details: { action: "cancel" },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error canceling shift swap:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

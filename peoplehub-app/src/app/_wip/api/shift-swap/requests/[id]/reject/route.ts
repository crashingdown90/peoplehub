// @ai:cl - Shift swap rejection API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { ShiftSwapService } from "@/services/shift";
import { rejectShiftSwapSchema } from "@/validations/shift-swap.schema";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/shift-swap/requests/:id/reject
 * Reject shift swap request (by target employee)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = rejectShiftSwapSchema.parse(body);

        const result = await ShiftSwapService.reject(context, params.id, validated.reason);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "UPDATE",
            resource: "SHIFT_SWAP",
            resourceId: params.id,
            details: { action: "reject", reason: validated.reason },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error rejecting shift swap:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

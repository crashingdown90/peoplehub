// @ai:cl - Shift swap approval API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { ShiftSwapService } from "@/services/shift";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/shift-swap/requests/:id/approve
 * Approve shift swap request (by target employee)
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

        const result = await ShiftSwapService.approve(context, params.id);

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
            details: { action: "approve" },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error approving shift swap:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

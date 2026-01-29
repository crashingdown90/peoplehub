// @ai:cl - Letter request approval API route (Manager)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { LetterService } from "@/services/letter";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/letters/requests/:id/approve-manager
 * Approve letter request (Manager level)
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

        const result = await LetterService.approveManager(context, params.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "UPDATE",
            resource: "LETTER_REQUEST",
            resourceId: params.id,
            details: { action: "approve_manager" },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error approving letter request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// @ai:cl - Letter request detail API routes - GET and DELETE (cancel)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { LetterService } from "@/services/letter";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/letters/requests/:id
 * Get letter request details
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

        const result = await LetterService.getById(context, params.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 404 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error getting letter request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/letters/requests/:id
 * Cancel letter request
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

        const result = await LetterService.cancel(context, params.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "DELETE",
            resource: "LETTER_REQUEST",
            resourceId: params.id,
            details: { action: "cancel" },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error canceling letter request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

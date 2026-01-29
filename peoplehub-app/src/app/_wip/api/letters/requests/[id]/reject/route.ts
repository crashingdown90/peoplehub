// @ai:cl - Letter request rejection API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { LetterService } from "@/services/letter";
import { rejectLetterSchema } from "@/validations/letter.schema";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/letters/requests/:id/reject
 * Reject letter request
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
        const validated = rejectLetterSchema.parse(body);

        const result = await LetterService.reject(context, params.id, validated.reason);

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
            details: { action: "reject", reason: validated.reason },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error rejecting letter request:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

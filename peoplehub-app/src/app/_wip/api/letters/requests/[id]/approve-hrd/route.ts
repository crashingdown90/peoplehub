// @ai:cl - Letter request HRD approval and issuance API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { LetterService } from "@/services/letter";
import { approveHrdLetterSchema } from "@/validations/letter.schema";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/letters/requests/:id/approve-hrd
 * Approve letter request and issue letter (HRD level - final)
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
        const validated = approveHrdLetterSchema.parse(body);

        const result = await LetterService.approveHrd(
            context,
            params.id,
            validated.letterNumber,
            validated.letterPdfUrl
        );

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
            details: {
                action: "approve_hrd",
                letterNumber: validated.letterNumber,
            },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error approving and issuing letter:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

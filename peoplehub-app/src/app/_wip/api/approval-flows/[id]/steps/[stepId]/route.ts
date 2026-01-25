// @ai:ag - Created by Antigravity
// DELETE /api/admin/approval-flows/[id]/steps/[stepId] - Remove approval step

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { approvalFlowService } from "@/services/approval-flow";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; stepId: string } }
) {
    try {
        const context = await getRequestContext(req);
        if (!context) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const result = await approvalFlowService.removeStep(context, params.id, params.stepId);

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("DELETE /api/admin/approval-flows/[id]/steps/[stepId] error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// @ai:ag - Created by Antigravity
// POST /api/admin/approval-flows/[id]/steps - Add approval step
// DELETE /api/admin/approval-flows/[id]/steps/[stepId] - Remove step

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { approvalFlowService } from "@/services/approval-flow";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const context = await getRequestContext(req);
        if (!context) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { stepOrder, approverType, approverUserId, approverRoleId, isRequired, canSkip, timeoutHours } = body;

        if (stepOrder === undefined || !approverType) {
            return NextResponse.json(
                { error: { code: "VALIDATION_ERROR", message: "stepOrder and approverType are required" } },
                { status: 400 }
            );
        }

        const result = await approvalFlowService.addStep(context, params.id, {
            stepOrder,
            approverType,
            approverUserId,
            approverRoleId,
            isRequired,
            canSkip,
            timeoutHours,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/approval-flows/[id]/steps error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

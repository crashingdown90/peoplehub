// @ai:ag - Created by Antigravity
// PUT /api/admin/approval-flows/[id] - Update approval flow

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { approvalFlowService } from "@/services/approval-flow";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const context = await getRequestContext(req);
        if (!context) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, description, isActive, isDefault } = body;

        const result = await approvalFlowService.update(context, params.id, {
            name,
            description,
            isActive,
            isDefault,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("PUT /api/admin/approval-flows/[id] error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

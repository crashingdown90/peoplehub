// @ai:ag - Created by Antigravity
// DELETE /api/delegations/[id] - Deactivate delegation

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { delegationService } from "@/services/delegation";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const context = await getRequestContext(req);
        if (!context) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const result = await delegationService.deactivate(context, params.id);

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("DELETE /api/delegations/[id] error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

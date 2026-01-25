// @ai:ag - Created by Antigravity
// POST /api/admin/shift-swaps/[id]/[action]
// Actions: approve-partner, approve-manager, reject, cancel

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { shiftSwapService } from "@/services/shift-swap";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; action: string } }
) {
    try {
        const context = await getRequestContext(req);
        if (!context) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { id, action } = params;
        let result;

        switch (action) {
            case "approve-partner":
                result = await shiftSwapService.approveByPartner(context, id);
                break;

            case "approve-manager":
                result = await shiftSwapService.approveByManager(context, id);
                break;

            case "reject": {
                const { reason } = await req.json();
                if (!reason) {
                    return NextResponse.json(
                        { error: { code: "VALIDATION_ERROR", message: "Rejection reason is required" } },
                        { status: 400 }
                    );
                }
                result = await shiftSwapService.reject(context, id, reason);
                break;
            }

            case "cancel":
                result = await shiftSwapService.cancel(context, id);
                break;

            default:
                return NextResponse.json(
                    { error: { code: "NOT_FOUND", message: "Action not found" } },
                    { status: 404 }
                );
        }

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error(`POST /api/admin/shift-swaps/[id]/[action] error:`, error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// @ai:ag - Created by Antigravity
// POST /api/loans/[id]/approve - Approve cash advance
// POST /api/loans/[id]/reject - Reject cash advance
// POST /api/loans/[id]/disburse - Mark as disbursed
// POST /api/loans/[id]/settle - Mark as settled

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { cashAdvanceService } from "@/services/loan";

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
            case "approve":
                result = await cashAdvanceService.approve(context, id);
                break;

            case "reject": {
                const { reason } = await req.json();
                if (!reason) {
                    return NextResponse.json(
                        { error: { code: "VALIDATION_ERROR", message: "Rejection reason is required" } },
                        { status: 400 }
                    );
                }
                result = await cashAdvanceService.reject(context, id, reason);
                break;
            }

            case "disburse":
                result = await cashAdvanceService.disburse(context, id);
                break;

            case "settle": {
                const { settledAmount } = await req.json();
                if (!settledAmount) {
                    return NextResponse.json(
                        { error: { code: "VALIDATION_ERROR", message: "Settled amount is required" } },
                        { status: 400 }
                    );
                }
                result = await cashAdvanceService.settle(context, id, settledAmount);
                break;
            }

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
        console.error(`POST /api/loans/[id]/[action] error:`, error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

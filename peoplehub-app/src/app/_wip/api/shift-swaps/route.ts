// @ai:ag - Created by Antigravity
// GET /api/admin/shift-swaps - List shift swaps
// POST /api/admin/shift-swaps - Create shift swap

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { shiftSwapService } from "@/services/shift-swap";

export async function GET(req: NextRequest) {
    try {
        const context = await getRequestContext(req);
        if (!context) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const requesterId = searchParams.get("requesterId") || undefined;
        const partnerId = searchParams.get("partnerId") || undefined;
        const status = searchParams.get("status") as any;
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

        const result = await shiftSwapService.getSwaps(context, {
            requesterId,
            partnerId,
            status,
            page,
            limit,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET /api/admin/shift-swaps error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const context = await getRequestContext(req);
        if (!context) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { partnerId, requesterShiftDate, partnerShiftDate, reason } = body;

        if (!partnerId || !requesterShiftDate || !partnerShiftDate || !reason) {
            return NextResponse.json(
                {
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "partnerId, requesterShiftDate, partnerShiftDate, and reason are required",
                    },
                },
                { status: 400 }
            );
        }

        const result = await shiftSwapService.create(context, {
            partnerId,
            requesterShiftDate,
            partnerShiftDate,
            reason,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/shift-swaps error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

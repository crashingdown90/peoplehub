// @ai:ag - Created by Antigravity
// GET /api/delegations - List delegations
// POST /api/delegations - Create delegation

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { delegationService } from "@/services/delegation";

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
        const delegatorId = searchParams.get("delegatorId") || undefined;
        const delegateId = searchParams.get("delegateId") || undefined;
        const isActive = searchParams.get("isActive") === "true";
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

        const result = await delegationService.getDelegations(context, {
            delegatorId,
            delegateId,
            isActive,
            page,
            limit,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET /api/delegations error:", error);
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
        const { delegateId, delegationType, requestTypes, startDate, endDate, reason } = body;

        if (!delegateId || !delegationType || !requestTypes || !startDate || !endDate) {
            return NextResponse.json(
                {
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "delegateId, delegationType, requestTypes, startDate, and endDate are required",
                    },
                },
                { status: 400 }
            );
        }

        const result = await delegationService.create(context, {
            delegateId,
            delegationType,
            requestTypes,
            startDate,
            endDate,
            reason,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("POST /api/delegations error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

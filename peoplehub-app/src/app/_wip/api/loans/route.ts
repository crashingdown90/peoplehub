// @ai:ag - Created by Antigravity
// GET /api/loans - List cash advances
// POST /api/loans - Create cash advance request

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { cashAdvanceService } from "@/services/loan";

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
        const employeeId = searchParams.get("employeeId") || undefined;
        const status = searchParams.get("status") as any;
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

        const result = await cashAdvanceService.getAdvances(context, {
            employeeId,
            status,
            page,
            limit,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET /api/loans error:", error);
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
        const { amount, purpose } = body;

        if (!amount || !purpose) {
            return NextResponse.json(
                { error: { code: "VALIDATION_ERROR", message: "Amount and purpose are required" } },
                { status: 400 }
            );
        }

        const result = await cashAdvanceService.create(context, { amount, purpose });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("POST /api/loans error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

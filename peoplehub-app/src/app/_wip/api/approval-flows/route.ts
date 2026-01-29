// @ai:ag - Created by Antigravity
// GET /api/admin/approval-flows - List approval flows
// POST /api/admin/approval-flows - Create approval flow

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { approvalFlowService } from "@/services/approval-flow";

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
        const type = searchParams.get("type") as any;
        const isActive = searchParams.get("isActive") === "true";
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

        const result = await approvalFlowService.getFlows(context, {
            type,
            isActive,
            page,
            limit,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET /api/admin/approval-flows error:", error);
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
        const { name, type, description, isDefault } = body;

        if (!name || !type) {
            return NextResponse.json(
                { error: { code: "VALIDATION_ERROR", message: "Name and type are required" } },
                { status: 400 }
            );
        }

        const result = await approvalFlowService.create(context, {
            name,
            type,
            description,
            isDefault,
        });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/approval-flows error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

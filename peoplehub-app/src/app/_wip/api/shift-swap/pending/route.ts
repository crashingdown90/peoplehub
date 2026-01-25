// @ai:cl - Pending shift swap requests API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { ShiftSwapService } from "@/services/shift";

/**
 * GET /api/shift-swap/pending
 * Get pending shift swap requests for the current employee to approve
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query params for pagination
        const searchParams = request.nextUrl.searchParams;
        const filter = {
            page: Number(searchParams.get("page")) || 1,
            limit: Number(searchParams.get("limit")) || 20,
        };

        const result = await ShiftSwapService.getPending(context, filter);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error getting pending shift swaps:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

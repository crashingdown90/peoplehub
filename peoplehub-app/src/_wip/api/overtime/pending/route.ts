// @ai:cl - Pending overtime requests API route (for managers/HRD)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OvertimeService } from "@/services";
import { overtimeFilterSchema } from "@/validations/overtime.schema";

/**
 * GET /api/overtime/pending
 * Get pending overtime requests for approval (Manager/HRD view)
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const filterResult = overtimeFilterSchema.safeParse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
        });

        if (!filterResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Invalid parameters", details: filterResult.error.issues },
                },
                { status: 400 }
            );
        }

        const result = await OvertimeService.getPending(context, filterResult.data);

        if (!result.success) {
            const statusCode = result.error?.code === "FORBIDDEN" ? 403 : 400;
            return NextResponse.json(
                { success: false, error: result.error },
                { status: statusCode }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        console.error("Get pending overtime requests error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

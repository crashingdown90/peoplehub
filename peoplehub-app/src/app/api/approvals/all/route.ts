// @ai:cl - Get all pending approvals using ApprovalService
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { ApprovalService } from "@/services";
import type { ApprovalType } from "@/services/approval/approval.service";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/approvals/all - Get all pending approvals
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["MANAGER", "HRD", "FINANCE", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") as ApprovalType | null;
        const status = searchParams.get("status") || "PENDING";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const result = await ApprovalService.getPendingApprovals(context, {
            type: type || undefined,
            status: status as "PENDING" | "APPROVED_MANAGER" | "APPROVED" | "REJECTED",
            page,
            limit,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        console.error("Get all approvals error:", error);
        return handlePrismaError(error);
    }
}

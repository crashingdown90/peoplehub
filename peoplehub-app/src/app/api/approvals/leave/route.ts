// @ai:cl - Get pending leave approvals using ApprovalService
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { ApprovalService } from "@/services";

// GET /api/approvals/leave - Get pending leave requests for approval
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    if (!hasRole(context, ["MANAGER", "HRD", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await ApprovalService.getPendingApprovals(context, {
      type: "LEAVE",
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
    console.error("Get leave approvals error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

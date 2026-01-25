// @ai:cl - Approve leave request using ApprovalService
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { ApprovalService } from "@/services";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/approvals/leave/[id]/approve - Approve leave request
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getRequestContext();
    const { id } = await params;

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

    // Use ApprovalService to approve
    const result = await ApprovalService.approve(context, "LEAVE", id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    // Get updated status for response
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      select: { status: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action:
          leaveRequest?.status === "APPROVED"
            ? "LEAVE_APPROVED"
            : "LEAVE_APPROVED_MANAGER",
        objectType: "LeaveRequest",
        objectId: id,
        afterData: JSON.parse(JSON.stringify({
          status: leaveRequest?.status,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      data: { id, status: leaveRequest?.status },
      message: result.data?.message,
    });
  } catch (error) {
    console.error("Approve leave error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

// @ai:cl - Single employee onboarding API routes
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OnboardingService } from "@/services/onboarding";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/admin/onboarding/[employeeId] - Get onboarding for an employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const context = await getRequestContext();
    const { employeeId } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const result = await OnboardingService.getByEmployeeId(context, employeeId);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get onboarding error:", error);
    return handlePrismaError(error);
  }
}

// DELETE /api/admin/onboarding/[employeeId] - Cancel onboarding
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const context = await getRequestContext();
    const { employeeId } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Dibatalkan oleh admin";

    const result = await OnboardingService.cancel(context, employeeId, reason);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Proses onboarding berhasil dibatalkan",
    });
  } catch (error) {
    console.error("Cancel onboarding error:", error);
    return handlePrismaError(error);
  }
}

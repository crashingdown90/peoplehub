// @ai:cl - Onboarding statistics API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OnboardingService } from "@/services/onboarding";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/admin/onboarding/stats - Get onboarding statistics
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const result = await OnboardingService.getStats(context);

    if (!result.success) {
      const status = result.error?.code === "FORBIDDEN" ? 403 : 400;
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
    console.error("Get onboarding stats error:", error);
    return handlePrismaError(error);
  }
}

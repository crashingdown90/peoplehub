// @ai:cl - Offboarding statistics API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OffboardingService } from "@/services/offboarding";

// GET /api/admin/offboarding/stats - Get offboarding statistics
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

    const result = await OffboardingService.getStats(context, year);

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
    console.error("Get offboarding stats error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

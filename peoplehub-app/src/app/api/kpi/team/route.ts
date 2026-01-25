// @ai:cl - KPI Team targets API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { KpiService } from "@/services/kpi";

// GET /api/kpi/team - Get team KPI targets (MANAGER only)
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;

    const result = await KpiService.getTeamTargets(context, {
      periodId,
      employeeId,
    });

    if (!result.success) {
      const statusCode =
        result.error?.code === "FORBIDDEN"
          ? 403
          : result.error?.code === "NOT_FOUND"
            ? 404
            : 500;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("GET /api/kpi/team error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

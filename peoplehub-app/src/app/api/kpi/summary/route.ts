// @ai:cl - KPI Summary API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { KpiService } from "@/services/kpi";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/kpi/summary - Get KPI summary for current user or specified employee
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const periodId = searchParams.get("periodId") || undefined;

    let result;

    if (employeeId) {
      // Get specific employee's summary (requires permission)
      result = await KpiService.getSummary(
        context,
        employeeId,
        periodId || ""
      );
    } else {
      // Get own summary
      result = await KpiService.getMySummary(context, periodId);
    }

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
    console.error("GET /api/kpi/summary error:", error);
    return handlePrismaError(error);
  }
}

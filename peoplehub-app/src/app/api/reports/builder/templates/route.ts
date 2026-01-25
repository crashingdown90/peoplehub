// @ai:cl - Report templates API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ReportBuilderService } from "@/services/report-builder";

// GET /api/reports/builder/templates - Get available report templates
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const result = ReportBuilderService.getTemplates();

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get report templates error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

// @ai:cl - Weekly schedule API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ScheduleService } from "@/services/schedule";

// GET /api/schedules/weekly - Get weekly schedule
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
    const employeeId = searchParams.get("employeeId") || context.employeeId;
    const weekStartDate = searchParams.get("weekStartDate");

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Employee ID wajib diisi" } },
        { status: 400 }
      );
    }

    if (!weekStartDate) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Tanggal awal minggu wajib diisi" } },
        { status: 400 }
      );
    }

    const result = await ScheduleService.getWeeklySchedule(context, employeeId, weekStartDate);

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
    console.error("Get weekly schedule error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

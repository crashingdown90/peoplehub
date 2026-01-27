// @ai:cl - Schedules API routes for list and create
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ScheduleService } from "@/services/schedule";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const createScheduleSchema = z.object({
  employeeId: z.string().cuid("ID karyawan tidak valid"),
  shiftId: z.string().cuid().optional().nullable(),
  scheduleDate: z.string().min(1, "Tanggal jadwal wajib diisi"),
  workMode: z.enum(["WFO", "WFH", "HYBRID"]).optional(),
  isHoliday: z.boolean().optional(),
});

// GET /api/schedules - Get schedules list
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
    const filter = {
      employeeId: searchParams.get("employeeId") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      shiftId: searchParams.get("shiftId") || undefined,
      workMode: searchParams.get("workMode") as "WFO" | "WFH" | "HYBRID" | undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      isHoliday: searchParams.get("isHoliday") === "true" ? true : searchParams.get("isHoliday") === "false" ? false : undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "100"),
    };

    const result = await ScheduleService.getSchedules(context, filter);

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
    console.error("Get schedules error:", error);
    return handlePrismaError(error);
  }
}

// POST /api/schedules - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createScheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Data tidak valid",
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const result = await ScheduleService.create(context, {
      ...validation.data,
      shiftId: validation.data.shiftId || undefined,
    });

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 :
        result.error?.code === "CONFLICT" ? 409 : 422;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Jadwal berhasil dibuat",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create schedule error:", error);
    return handlePrismaError(error);
  }
}

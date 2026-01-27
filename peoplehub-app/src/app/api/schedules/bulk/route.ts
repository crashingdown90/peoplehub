// @ai:cl - Bulk schedule creation API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ScheduleService } from "@/services/schedule";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const bulkScheduleSchema = z.object({
  employeeIds: z.array(z.string().cuid()).min(1, "Minimal pilih 1 karyawan"),
  shiftId: z.string().cuid().optional().nullable(),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  workMode: z.enum(["WFO", "WFH", "HYBRID"]).optional(),
  skipWeekends: z.boolean().optional(),
  skipHolidays: z.boolean().optional(),
});

// POST /api/schedules/bulk - Bulk create schedules
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
    const validation = bulkScheduleSchema.safeParse(body);

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

    const result = await ScheduleService.bulkCreate(context, {
      ...validation.data,
      shiftId: validation.data.shiftId || undefined,
    });

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 422;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    const { created, skipped, errors } = result.data!;

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: `Berhasil membuat ${created} jadwal${skipped > 0 ? `, ${skipped} dilewati` : ""}${errors.length > 0 ? `, ${errors.length} error` : ""}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk create schedules error:", error);
    return handlePrismaError(error);
  }
}

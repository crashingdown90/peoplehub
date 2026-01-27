// @ai:cl - Report scheduling API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ReportBuilderService } from "@/services/report-builder";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const scheduleSchema = z.object({
  configId: z.string().min(1, "Config ID wajib diisi"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]),
  recipients: z.array(z.string().email()).min(1, "Minimal 1 penerima"),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  format: z.enum(["JSON", "CSV", "EXCEL", "PDF"]),
});

// POST /api/reports/builder/schedule - Schedule a report
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
    const validation = scheduleSchema.safeParse(body);

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

    const result = await ReportBuilderService.scheduleReport(context, validation.data);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 422;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Jadwal laporan berhasil dibuat",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Schedule report error:", error);
    return handlePrismaError(error);
  }
}

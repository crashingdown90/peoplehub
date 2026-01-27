// @ai:cl - Shifts API routes for list and create
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ShiftService } from "@/services/shift";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const createShiftSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  startTime: z.string().regex(timeRegex, "Format waktu tidak valid (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Format waktu tidak valid (HH:mm)"),
  breakMinutes: z.number().int().min(0).max(180).optional(),
  isFlexible: z.boolean().optional(),
});

// GET /api/admin/shifts - Get shifts list
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
      isActive: searchParams.get("isActive") === "true" ? true : searchParams.get("isActive") === "false" ? false : undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    };

    const result = await ShiftService.getShifts(context, filter);

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
    console.error("Get shifts error:", error);
    return handlePrismaError(error);
  }
}

// POST /api/admin/shifts - Create new shift
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
    const validation = createShiftSchema.safeParse(body);

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

    const result = await ShiftService.create(context, validation.data);

    if (!result.success) {
      const status =
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
        message: "Shift berhasil dibuat",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create shift error:", error);
    return handlePrismaError(error);
  }
}

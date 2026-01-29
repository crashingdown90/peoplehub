// @ai:cl - Single shift API routes (get, update, delete)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ShiftService } from "@/services/shift";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const updateShiftSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  breakMinutes: z.number().int().min(0).max(180).optional(),
  isFlexible: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/shifts/[id] - Get single shift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext();
    const { id } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const result = await ShiftService.getById(context, id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get shift error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/admin/shifts/[id] - Update shift
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext();
    const { id } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateShiftSchema.safeParse(body);

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

    const result = await ShiftService.update(context, id, validation.data);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 :
        result.error?.code === "CONFLICT" ? 409 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Shift berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update shift error:", error);
    return handlePrismaError(error);
  }
}

// DELETE /api/admin/shifts/[id] - Delete shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext();
    const { id } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const result = await ShiftService.delete(context, id);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 :
        result.error?.code === "CONFLICT" ? 409 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shift berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete shift error:", error);
    return handlePrismaError(error);
  }
}

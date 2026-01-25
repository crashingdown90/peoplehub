// @ai:cl - Offboarding task update API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OffboardingService } from "@/services/offboarding";
import { z } from "zod";

const updateTaskSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string().optional(),
});

// PUT /api/admin/offboarding/[employeeId]/tasks/[taskId] - Update offboarding task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string; taskId: string }> }
) {
  try {
    const context = await getRequestContext();
    const { employeeId, taskId } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateTaskSchema.safeParse(body);

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

    const result = await OffboardingService.updateTask(context, employeeId, taskId, validation.data);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Task berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update offboarding task error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

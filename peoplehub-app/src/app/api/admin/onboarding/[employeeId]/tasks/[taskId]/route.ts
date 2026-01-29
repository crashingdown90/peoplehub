// @ai:cl - Onboarding task update API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OnboardingService } from "@/services/onboarding";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const updateTaskSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string().optional(),
});

// PUT /api/admin/onboarding/[employeeId]/tasks/[taskId] - Update onboarding task
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

    const result = await OnboardingService.updateTask(context, employeeId, taskId, validation.data);

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
    console.error("Update onboarding task error:", error);
    return handlePrismaError(error);
  }
}

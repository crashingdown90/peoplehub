// @ai:cl - Exit interview API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OffboardingService } from "@/services/offboarding";
import { z } from "zod";

const exitInterviewSchema = z.object({
  notes: z.string().min(10, "Catatan minimal 10 karakter"),
  feedback: z.object({
    overallSatisfaction: z.number().int().min(1).max(5),
    wouldRecommend: z.boolean(),
    suggestions: z.string().optional(),
  }).optional(),
});

// POST /api/admin/offboarding/[employeeId]/exit-interview - Complete exit interview
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const context = await getRequestContext();
    const { employeeId } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = exitInterviewSchema.safeParse(body);

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

    const result = await OffboardingService.completeExitInterview(context, employeeId, validation.data);

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
      message: "Exit interview berhasil diselesaikan",
    });
  } catch (error) {
    console.error("Complete exit interview error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

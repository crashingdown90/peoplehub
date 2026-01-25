// @ai:cl - Document rejection API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { DocumentService } from "@/services/document";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
});

// POST /api/documents/[id]/reject - Reject document
export async function POST(
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
    const validation = rejectSchema.safeParse(body);

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

    const result = await DocumentService.reject(context, id, validation.data.reason);

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
      message: "Dokumen berhasil ditolak",
    });
  } catch (error) {
    console.error("Reject document error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

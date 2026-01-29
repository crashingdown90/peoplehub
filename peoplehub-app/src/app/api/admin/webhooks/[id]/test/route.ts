// @ai:cl - Webhook test API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { WebhookService } from "@/services/webhook";
import { handlePrismaError } from "@/lib/api-utils";

// POST /api/admin/webhooks/[id]/test - Test webhook
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

    const result = await WebhookService.test(context, id);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    const testResult = result.data!;

    return NextResponse.json({
      success: true,
      data: testResult,
      message: testResult.success
        ? `Webhook test berhasil (HTTP ${testResult.status})`
        : `Webhook test gagal (HTTP ${testResult.status})`,
    });
  } catch (error) {
    console.error("Test webhook error:", error);
    return handlePrismaError(error);
  }
}

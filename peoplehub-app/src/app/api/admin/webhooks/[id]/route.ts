// @ai:cl - Single webhook API routes (get, update, delete)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { WebhookService, WEBHOOK_EVENTS, WebhookEvent } from "@/services/webhook";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const validEvents = Object.keys(WEBHOOK_EVENTS) as WebhookEvent[];

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.enum(validEvents as [string, ...string[]])).min(1).optional(),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/webhooks/[id] - Get single webhook
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

    const result = await WebhookService.getById(context, id);

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
    });
  } catch (error) {
    console.error("Get webhook error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/admin/webhooks/[id] - Update webhook
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
    const validation = updateWebhookSchema.safeParse(body);

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

    const result = await WebhookService.update(context, id, validation.data as Parameters<typeof WebhookService.update>[2]);

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
      message: "Webhook berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update webhook error:", error);
    return handlePrismaError(error);
  }
}

// DELETE /api/admin/webhooks/[id] - Delete webhook
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

    const result = await WebhookService.delete(context, id);

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
      message: "Webhook berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete webhook error:", error);
    return handlePrismaError(error);
  }
}

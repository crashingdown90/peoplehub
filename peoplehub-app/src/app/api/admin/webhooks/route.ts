// @ai:cl - Webhook API routes for list and create
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { WebhookService, WEBHOOK_EVENTS, WebhookEvent } from "@/services/webhook";
import { z } from "zod";

const validEvents = Object.keys(WEBHOOK_EVENTS) as WebhookEvent[];

const createWebhookSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  url: z.string().url("URL tidak valid"),
  events: z.array(z.enum(validEvents as [string, ...string[]])).min(1, "Minimal pilih 1 event"),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
});

// GET /api/admin/webhooks - Get webhooks list
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
      event: searchParams.get("event") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await WebhookService.getWebhooks(context, filter);

    if (!result.success) {
      const status = result.error?.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("Get webhooks error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

// POST /api/admin/webhooks - Create new webhook
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
    const validation = createWebhookSchema.safeParse(body);

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

    const result = await WebhookService.create(context, validation.data as Parameters<typeof WebhookService.create>[1]);

    if (!result.success) {
      const status = result.error?.code === "FORBIDDEN" ? 403 : 422;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Webhook berhasil dibuat",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create webhook error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

// @ai:cl - Push unsubscribe API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { PushService } from "@/services/push";
import { z } from "zod";

const unsubscribeSchema = z.object({
  endpoint: z.string().url("Endpoint tidak valid"),
});

// POST /api/push/unsubscribe - Unregister push subscription
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
    const validation = unsubscribeSchema.safeParse(body);

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

    const result = await PushService.unregisterSubscription(context, validation.data.endpoint);

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
      message: "Push notification berhasil dinonaktifkan",
    });
  } catch (error) {
    console.error("Unsubscribe push error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

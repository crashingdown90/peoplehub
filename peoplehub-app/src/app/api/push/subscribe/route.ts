// @ai:cl - Push subscription API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { PushService } from "@/services/push";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url("Endpoint tidak valid"),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  deviceName: z.string().optional(),
  platform: z.enum(["WEB", "ANDROID", "IOS"]).optional(),
});

// POST /api/push/subscribe - Register push subscription
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
    const validation = subscribeSchema.safeParse(body);

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

    const result = await PushService.registerSubscription(context, validation.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Push notification berhasil diaktifkan",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Subscribe push error:", error);
    return handlePrismaError(error);
  }
}

// GET /api/push/subscribe - Get user's subscriptions
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const result = await PushService.getUserSubscriptions(context);

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return handlePrismaError(error);
  }
}

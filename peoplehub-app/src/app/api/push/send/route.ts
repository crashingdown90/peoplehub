// @ai:cl - Send push notification API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { PushService } from "@/services/push";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const sendPushSchema = z.object({
  userId: z.string().cuid().optional(),
  userIds: z.array(z.string().cuid()).optional(),
  roleFilter: z.array(z.string()).optional(),
  branchId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  title: z.string().min(1, "Judul wajib diisi").max(100),
  body: z.string().min(1, "Pesan wajib diisi").max(500),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  action: z.object({
    label: z.string(),
    url: z.string(),
  }).optional(),
  ttl: z.number().int().positive().optional(),
});

// POST /api/push/send - Send push notification
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
    const validation = sendPushSchema.safeParse(body);

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

    const data = validation.data;

    // If sending to a single user
    if (data.userId) {
      const result = await PushService.sendToUser(context, data.userId, {
        title: data.title,
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        data: data.data,
        action: data.action,
        ttl: data.ttl,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: `Notifikasi terkirim ke ${result.data!.sent} perangkat`,
      });
    }

    // Sending to multiple users
    const result = await PushService.sendToUsers(context, data);

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
      message: `Notifikasi dikirim ke ${result.data!.recipientCount} penerima (${result.data!.sent} perangkat berhasil)`,
    });
  } catch (error) {
    console.error("Send push error:", error);
    return handlePrismaError(error);
  }
}

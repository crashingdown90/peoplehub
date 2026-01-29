// @ai:cl - Unread announcement count API
import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { AnnouncementService } from "@/services/announcement";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/announcements/unread-count - Get unread count for badge
export async function GET() {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await AnnouncementService.getUnreadCount(context);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { count: result.data },
    });
  } catch (error) {
    console.error("GET /api/announcements/unread-count error:", error);
    return handlePrismaError(error);
  }
}

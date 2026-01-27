// @ai:cl - Mark all notifications as read route
import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { NotificationService } from "@/services/notification";
import { handlePrismaError } from "@/lib/api-utils";

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const result = await NotificationService.markAllRead(context);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Mark all read error:", error);
        return handlePrismaError(error);
    }
}

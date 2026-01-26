// @ai:cl - Get notifications route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { NotificationService } from "@/services/notification";

// GET /api/notifications - Get my notifications
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const type = searchParams.get("type");

        // If requesting unread only with limit, use getUnread for efficiency
        if (unreadOnly && !type) {
            const result = await NotificationService.getUnread(context, limit);
            if (!result.success) {
                return NextResponse.json(
                    { success: false, error: result.error },
                    { status: 400 }
                );
            }
            return NextResponse.json({
                success: true,
                data: result.data?.notifications,
                meta: { unreadCount: result.data?.unreadCount },
            });
        }

        // Otherwise use getAll with filters
        const result = await NotificationService.getAll(context, {
            page,
            limit,
            isRead: unreadOnly ? false : undefined,
            type: type as "ATTENDANCE" | "LEAVE" | "APPROVAL" | "ANNOUNCEMENT" | "SYSTEM" | undefined,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // Get unread count separately
        const unreadResult = await NotificationService.getUnreadCount(context);

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: {
                ...result.meta,
                unreadCount: unreadResult.data || 0,
            },
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

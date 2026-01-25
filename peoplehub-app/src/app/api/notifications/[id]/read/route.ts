// @ai:cl - Mark notification as read route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { NotificationService } from "@/services/notification";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(_request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const result = await NotificationService.markRead(context, id);

        if (!result.success) {
            const status = result.error?.code === "NOT_FOUND" ? 404 : 400;
            return NextResponse.json(
                { success: false, error: result.error },
                { status }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error("Mark notification read error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

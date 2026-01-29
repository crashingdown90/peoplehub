// @ai:cl - Notification preferences route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { NotificationService } from "@/services/notification";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const preferencesSchema = z.object({
    emailEnabled: z.boolean().optional(),
    emailDigest: z.enum(["REALTIME", "DAILY", "WEEKLY"]).optional(),
    inAppEnabled: z.boolean().optional(),
    attendanceAlerts: z.boolean().optional(),
    leaveAlerts: z.boolean().optional(),
    approvalAlerts: z.boolean().optional(),
    announcementAlerts: z.boolean().optional(),
});

// GET /api/notifications/preferences - Get my preferences
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const result = await NotificationService.getPreferences(context);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error("Get preferences error:", error);
        return handlePrismaError(error);
    }
}

// PUT /api/notifications/preferences - Update preferences
export async function PUT(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const parseResult = preferencesSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: parseResult.error.issues } },
                { status: 400 }
            );
        }

        const result = await NotificationService.updatePreferences(context, parseResult.data);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: "Preferences updated"
        });
    } catch (error) {
        console.error("Update preferences error:", error);
        return handlePrismaError(error);
    }
}

// @ai:cl - Announcement API routes
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { AnnouncementService } from "@/services/announcement/announcement.service";
import { z } from "zod";

const createSchema = z.object({
    title: z.string().min(3, "Judul minimal 3 karakter"),
    content: z.string().min(10, "Konten minimal 10 karakter"),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    isPinned: z.boolean().optional(),
    targetAudience: z.object({
        branches: z.array(z.string()).optional(),
        departments: z.array(z.string()).optional(),
        roles: z.array(z.string()).optional(),
    }).optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number(),
    })).optional(),
    expiresAt: z.string().optional(),
    publishNow: z.boolean().optional(),
});

// GET /api/announcements - Get announcements for inbox (user) or admin list
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
        const mode = searchParams.get("mode"); // "admin" for admin list
        const status = searchParams.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED" | null;
        const priority = searchParams.get("priority") as "LOW" | "NORMAL" | "HIGH" | "URGENT" | null;
        const search = searchParams.get("search");
        const unreadOnly = searchParams.get("unreadOnly") === "true";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        // Admin mode - get all announcements with stats
        if (mode === "admin") {
            if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
                return NextResponse.json(
                    { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                    { status: 403 }
                );
            }

            const result = await AnnouncementService.getAdminAnnouncements(context, {
                status: status || undefined,
                priority: priority || undefined,
                search: search || undefined,
                page,
                limit,
            });

            if (!result.success) {
                return NextResponse.json({ success: false, error: result.error }, { status: 400 });
            }

            return NextResponse.json(result);
        }

        // User mode - get inbox announcements
        const result = await AnnouncementService.getInboxAnnouncements(context, {
            search: search || undefined,
            unreadOnly,
            page,
            limit,
        });

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Get announcements error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// POST /api/announcements - Create announcement (HRD/SUPER_ADMIN only)
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validation = createSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: validation.error.issues } },
                { status: 400 }
            );
        }

        const data = validation.data;
        const result = await AnnouncementService.createAnnouncement(context, {
            title: data.title,
            content: data.content,
            priority: data.priority,
            isPinned: data.isPinned,
            targetAudience: data.targetAudience,
            attachments: data.attachments,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            publishNow: data.publishNow,
        });

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result.data }, { status: 201 });
    } catch (error) {
        console.error("Create announcement error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

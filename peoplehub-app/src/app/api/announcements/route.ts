import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";

const announcementSchema = z.object({
    title: z.string().min(5, "Judul minimal 5 karakter"),
    content: z.string().min(10, "Konten minimal 10 karakter"),
    expiresAt: z.string().optional(),
});

// GET /api/announcements - Get announcements
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const now = new Date();

        const announcements = await prisma.announcement.findMany({
            where: {
                tenantId: context.tenantId,
                status: "PUBLISHED",
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: now } },
                ],
            },
            orderBy: { publishedAt: "desc" },
        });

        return NextResponse.json({ success: true, data: announcements });
    } catch (error) {
        console.error("Get announcements error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// POST /api/announcements - Create announcement (HRD only)
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
        const result = announcementSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const announcement = await prisma.announcement.create({
            data: {
                tenantId: context.tenantId,
                title: result.data.title,
                content: result.data.content,
                status: "PUBLISHED",
                publishedById: context.userId,
                publishedAt: new Date(),
                expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : null,
            },
        });

        return NextResponse.json({ success: true, data: announcement }, { status: 201 });
    } catch (error) {
        console.error("Create announcement error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

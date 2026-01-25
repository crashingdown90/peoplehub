// @ai:cl - Announcement by ID API routes
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { AnnouncementService } from "@/services/announcement";
import { z } from "zod";

// Validation schema for updating announcement
const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  targetAudience: z
    .object({
      branches: z.array(z.string()).optional(),
      departments: z.array(z.string()).optional(),
      roles: z.array(z.string()).optional(),
    })
    .optional(),
  expiresAt: z
    .string()
    .transform((str) => new Date(str))
    .nullable()
    .optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/announcements/[id] - Get single announcement
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await AnnouncementService.getAnnouncementById(context, id);

    if (!result.success) {
      const statusCode =
        result.error?.code === "FORBIDDEN"
          ? 403
          : result.error?.code === "NOT_FOUND"
            ? 404
            : 500;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("GET /api/announcements/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/announcements/[id] - Update announcement (HRD/SUPER_ADMIN only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Handle special actions
    if (body.action === "publish") {
      const result = await AnnouncementService.publishAnnouncement(context, id);

      if (!result.success) {
        const statusCode =
          result.error?.code === "FORBIDDEN"
            ? 403
            : result.error?.code === "NOT_FOUND"
              ? 404
              : result.error?.code === "CONFLICT"
                ? 409
                : 500;
        return NextResponse.json(
          { error: result.error?.message },
          { status: statusCode }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      });
    }

    if (body.action === "archive") {
      const result = await AnnouncementService.archiveAnnouncement(context, id);

      if (!result.success) {
        const statusCode =
          result.error?.code === "FORBIDDEN"
            ? 403
            : result.error?.code === "NOT_FOUND"
              ? 404
              : 500;
        return NextResponse.json(
          { error: result.error?.message },
          { status: statusCode }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      });
    }

    // Regular update
    const validation = UpdateAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const result = await AnnouncementService.updateAnnouncement(
      context,
      id,
      validation.data
    );

    if (!result.success) {
      const statusCode =
        result.error?.code === "FORBIDDEN"
          ? 403
          : result.error?.code === "NOT_FOUND"
            ? 404
            : 500;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("PUT /api/announcements/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/announcements/[id] - Delete announcement (SUPER_ADMIN only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await AnnouncementService.deleteAnnouncement(context, id);

    if (!result.success) {
      const statusCode =
        result.error?.code === "FORBIDDEN"
          ? 403
          : result.error?.code === "NOT_FOUND"
            ? 404
            : 500;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE /api/announcements/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

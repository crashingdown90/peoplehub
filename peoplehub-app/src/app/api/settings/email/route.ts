// @ai:cl - Email preferences API routes
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema
const EmailPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailDigest: z.enum(["REALTIME", "DAILY", "WEEKLY"]).optional(),
  attendanceAlerts: z.boolean().optional(),
  leaveAlerts: z.boolean().optional(),
  approvalAlerts: z.boolean().optional(),
  announcementAlerts: z.boolean().optional(),
});

// GET /api/settings/email - Get user's email preferences
export async function GET() {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: context.userId },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          tenantId: context.tenantId,
          userId: context.userId,
          emailEnabled: true,
          emailDigest: "REALTIME",
          inAppEnabled: true,
          attendanceAlerts: true,
          leaveAlerts: true,
          approvalAlerts: true,
          announcementAlerts: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        emailEnabled: preferences.emailEnabled,
        emailDigest: preferences.emailDigest,
        inAppEnabled: preferences.inAppEnabled,
        attendanceAlerts: preferences.attendanceAlerts,
        leaveAlerts: preferences.leaveAlerts,
        approvalAlerts: preferences.approvalAlerts,
        announcementAlerts: preferences.announcementAlerts,
      },
    });
  } catch (error) {
    console.error("GET /api/settings/email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/email - Update user's email preferences
export async function PUT(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = EmailPreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: context.userId },
      create: {
        tenantId: context.tenantId,
        userId: context.userId,
        emailEnabled: data.emailEnabled ?? true,
        emailDigest: data.emailDigest ?? "REALTIME",
        inAppEnabled: true,
        attendanceAlerts: data.attendanceAlerts ?? true,
        leaveAlerts: data.leaveAlerts ?? true,
        approvalAlerts: data.approvalAlerts ?? true,
        announcementAlerts: data.announcementAlerts ?? true,
      },
      update: {
        ...(data.emailEnabled !== undefined && { emailEnabled: data.emailEnabled }),
        ...(data.emailDigest !== undefined && { emailDigest: data.emailDigest }),
        ...(data.attendanceAlerts !== undefined && { attendanceAlerts: data.attendanceAlerts }),
        ...(data.leaveAlerts !== undefined && { leaveAlerts: data.leaveAlerts }),
        ...(data.approvalAlerts !== undefined && { approvalAlerts: data.approvalAlerts }),
        ...(data.announcementAlerts !== undefined && { announcementAlerts: data.announcementAlerts }),
        updatedAt: new Date(),
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "UPDATE_EMAIL_PREFERENCES",
        objectType: "NotificationPreference",
        objectId: preferences.id,
        afterData: JSON.parse(JSON.stringify(data)),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        emailEnabled: preferences.emailEnabled,
        emailDigest: preferences.emailDigest,
        inAppEnabled: preferences.inAppEnabled,
        attendanceAlerts: preferences.attendanceAlerts,
        leaveAlerts: preferences.leaveAlerts,
        approvalAlerts: preferences.approvalAlerts,
        announcementAlerts: preferences.announcementAlerts,
      },
      message: "Preferensi email berhasil diperbarui",
    });
  } catch (error) {
    console.error("PUT /api/settings/email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

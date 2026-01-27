// @ai:cl - Notification Settings API routes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Notification settings structure
interface NotificationSettings {
  email: {
    enabled: boolean;
    leaveApproval: boolean;
    attendanceReminder: boolean;
    payslipReady: boolean;
    announcement: boolean;
  };
  push: {
    enabled: boolean;
    leaveApproval: boolean;
    attendanceReminder: boolean;
    payslipReady: boolean;
    announcement: boolean;
  };
}

// Default notification settings
const defaultSettings: NotificationSettings = {
  email: {
    enabled: true,
    leaveApproval: true,
    attendanceReminder: false,
    payslipReady: true,
    announcement: true,
  },
  push: {
    enabled: true,
    leaveApproval: true,
    attendanceReminder: true,
    payslipReady: true,
    announcement: true,
  },
};

// Validation schema for notification settings
const NotificationSettingsSchema = z.object({
  email: z
    .object({
      enabled: z.boolean().optional(),
      leaveApproval: z.boolean().optional(),
      attendanceReminder: z.boolean().optional(),
      payslipReady: z.boolean().optional(),
      announcement: z.boolean().optional(),
    })
    .optional(),
  push: z
    .object({
      enabled: z.boolean().optional(),
      leaveApproval: z.boolean().optional(),
      attendanceReminder: z.boolean().optional(),
      payslipReady: z.boolean().optional(),
      announcement: z.boolean().optional(),
    })
    .optional(),
});

// GET /api/settings/notifications - Get notification settings
export async function GET() {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For tenant-wide settings, require IT_OPS/SUPER_ADMIN
    // For personal settings, any authenticated user can access
    const isAdmin = ["IT_OPS", "SUPER_ADMIN"].includes(context.role);

    // Get tenant settings from branding JSON
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: { branding: true },
    });

    const branding = tenant?.branding as Record<string, unknown> | null;
    const tenantSettings = (branding?.notificationSettings as NotificationSettings) || defaultSettings;

    // For regular users, return tenant default settings
    // Admins can see and modify the tenant-wide defaults
    return NextResponse.json({
      success: true,
      data: {
        settings: tenantSettings,
        isAdmin,
      },
    });
  } catch (error) {
    console.error("GET /api/settings/notifications error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/settings/notifications - Update notification settings (IT_OPS/SUPER_ADMIN for tenant-wide)
export async function PUT(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only IT_OPS/SUPER_ADMIN can update tenant-wide notification settings
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk mengubah pengaturan notifikasi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = NotificationSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Get current tenant branding
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: { branding: true },
    });

    const currentBranding = (tenant?.branding as Record<string, unknown>) || {};
    const currentSettings = (currentBranding.notificationSettings as NotificationSettings) || defaultSettings;

    // Merge new settings with existing
    const newSettings: NotificationSettings = {
      email: {
        ...currentSettings.email,
        ...(validation.data.email || {}),
      },
      push: {
        ...currentSettings.push,
        ...(validation.data.push || {}),
      },
    };

    // Update branding with new notification settings
    const updatedBranding = {
      ...currentBranding,
      notificationSettings: newSettings,
    };

    await prisma.tenant.update({
      where: { id: context.tenantId },
      data: {
        branding: updatedBranding as unknown as object,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "UPDATE_NOTIFICATION_SETTINGS",
        objectType: "TenantSettings",
        objectId: context.tenantId,
        beforeData: currentSettings as unknown as object,
        afterData: newSettings as unknown as object,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        settings: newSettings,
      },
      message: "Pengaturan notifikasi berhasil diperbarui",
    });
  } catch (error) {
    console.error("PUT /api/settings/notifications error:", error);
    return handlePrismaError(error);
  }
}

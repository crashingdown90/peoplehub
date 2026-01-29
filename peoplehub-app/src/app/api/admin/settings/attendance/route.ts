// @ai:cl - Admin Attendance Settings API (GET + PUT)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const UpdateSettingsSchema = z.object({
  defaultShiftStart: z.string().regex(timeRegex, "Format harus HH:mm"),
  defaultShiftEnd: z.string().regex(timeRegex, "Format harus HH:mm"),
  breakMinutes: z.number().int().min(0).max(180),
  earliestClockIn: z.string().regex(timeRegex, "Format harus HH:mm"),
  latestClockOut: z.string().regex(timeRegex, "Format harus HH:mm"),
  gracePeriodMinutes: z.number().int().min(0).max(60),
  lateDeductionEnabled: z.boolean(),
  lateDeductionType: z.string().default("PER_MINUTE"),
  lateDeductionAmount: z.number().min(0),
  geofenceRadius: z.number().int().min(10).max(10000),
  geofenceEnabled: z.boolean(),
  requireFaceDetection: z.boolean(),
  requireLiveness: z.boolean(),
  minFaceConfidence: z.number().min(0).max(1),
  workDays: z.array(z.number().int().min(1).max(7)),
});

async function checkAdminAuth() {
  const context = await getRequestContext();
  if (!context) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      ),
      context: null,
    };
  }

  if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      ),
      context: null,
    };
  }

  return { error: null, context };
}

// GET /api/admin/settings/attendance - Get attendance settings (upsert if not exists)
export async function GET() {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const settings = await prisma.attendanceSettings.upsert({
      where: { tenantId: context.tenantId },
      update: {},
      create: { tenantId: context.tenantId },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        lateDeductionAmount: Number(settings.lateDeductionAmount),
        minFaceConfidence: Number(settings.minFaceConfidence),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/settings/attendance error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/admin/settings/attendance - Update attendance settings
export async function PUT(request: NextRequest) {
  try {
    const { error, context } = await checkAdminAuth();
    if (error || !context) return error;

    const body = await request.json();
    const validation = UpdateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Data tidak valid",
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Cross-field validation: time ordering
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const earliest = toMinutes(data.earliestClockIn);
    const shiftStart = toMinutes(data.defaultShiftStart);
    const shiftEnd = toMinutes(data.defaultShiftEnd);
    const latest = toMinutes(data.latestClockOut);

    if (earliest > shiftStart) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Clock-in paling awal harus sebelum jam masuk" } },
        { status: 400 }
      );
    }
    if (shiftStart >= shiftEnd) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Jam masuk harus sebelum jam pulang" } },
        { status: 400 }
      );
    }
    if (shiftEnd > latest) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Jam pulang harus sebelum clock-out paling akhir" } },
        { status: 400 }
      );
    }

    // Load existing settings (beforeData for audit log)
    const beforeSettings = await prisma.attendanceSettings.findUnique({
      where: { tenantId: context.tenantId },
    });

    const settings = await prisma.attendanceSettings.upsert({
      where: { tenantId: context.tenantId },
      update: {
        defaultShiftStart: data.defaultShiftStart,
        defaultShiftEnd: data.defaultShiftEnd,
        breakMinutes: data.breakMinutes,
        earliestClockIn: data.earliestClockIn,
        latestClockOut: data.latestClockOut,
        gracePeriodMinutes: data.gracePeriodMinutes,
        lateDeductionEnabled: data.lateDeductionEnabled,
        lateDeductionType: data.lateDeductionType,
        lateDeductionAmount: data.lateDeductionAmount,
        geofenceRadius: data.geofenceRadius,
        geofenceEnabled: data.geofenceEnabled,
        requireFaceDetection: data.requireFaceDetection,
        requireLiveness: data.requireLiveness,
        minFaceConfidence: data.minFaceConfidence,
        workDays: data.workDays,
      },
      create: {
        tenantId: context.tenantId,
        defaultShiftStart: data.defaultShiftStart,
        defaultShiftEnd: data.defaultShiftEnd,
        breakMinutes: data.breakMinutes,
        earliestClockIn: data.earliestClockIn,
        latestClockOut: data.latestClockOut,
        gracePeriodMinutes: data.gracePeriodMinutes,
        lateDeductionEnabled: data.lateDeductionEnabled,
        lateDeductionType: data.lateDeductionType,
        lateDeductionAmount: data.lateDeductionAmount,
        geofenceRadius: data.geofenceRadius,
        geofenceEnabled: data.geofenceEnabled,
        requireFaceDetection: data.requireFaceDetection,
        requireLiveness: data.requireLiveness,
        minFaceConfidence: data.minFaceConfidence,
        workDays: data.workDays,
      },
    });

    // Audit log — record before/after state
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: beforeSettings ? "UPDATE" : "CREATE",
        objectType: "AttendanceSettings",
        objectId: settings.id,
        beforeData: beforeSettings
          ? JSON.parse(JSON.stringify({
              defaultShiftStart: beforeSettings.defaultShiftStart,
              defaultShiftEnd: beforeSettings.defaultShiftEnd,
              breakMinutes: beforeSettings.breakMinutes,
              earliestClockIn: beforeSettings.earliestClockIn,
              latestClockOut: beforeSettings.latestClockOut,
              gracePeriodMinutes: beforeSettings.gracePeriodMinutes,
              lateDeductionEnabled: beforeSettings.lateDeductionEnabled,
              lateDeductionAmount: Number(beforeSettings.lateDeductionAmount),
              geofenceRadius: beforeSettings.geofenceRadius,
              geofenceEnabled: beforeSettings.geofenceEnabled,
              requireFaceDetection: beforeSettings.requireFaceDetection,
              requireLiveness: beforeSettings.requireLiveness,
              minFaceConfidence: Number(beforeSettings.minFaceConfidence),
              workDays: beforeSettings.workDays,
            }))
          : undefined,
        afterData: JSON.parse(JSON.stringify(data)),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        lateDeductionAmount: Number(settings.lateDeductionAmount),
        minFaceConfidence: Number(settings.minFaceConfidence),
      },
      message: "Pengaturan kehadiran berhasil disimpan",
    });
  } catch (error) {
    console.error("PUT /api/admin/settings/attendance error:", error);
    return handlePrismaError(error);
  }
}

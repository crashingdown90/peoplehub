// @ai:perf - Clock in with async audit log and cache invalidation
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { AttendanceService } from "@/services";
import { getCache, CacheKeys, CacheTags } from "@/lib/cache";
import { z } from "zod";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { validateCsrf, getCsrfErrorResponse } from "@/lib/security/csrf";

const clockInSchema = z.object({
  workMode: z.enum(["WFO", "WFH"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceInfo: z.string().optional().nullable(),
});

// POST /api/attendance/clock-in
export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfResult = await validateCsrf(request.headers);
    if (!csrfResult.valid) {
      return NextResponse.json(getCsrfErrorResponse(), { status: 403 });
    }

    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const photo = formData.get("photo") as File | null;
    const workMode = formData.get("workMode") as string;
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const deviceInfo = formData.get("deviceInfo") as string | null;

    // Validate input
    const result = clockInSchema.safeParse({
      workMode,
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      deviceInfo,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues },
        },
        { status: 400 }
      );
    }

    // Check photo
    if (!photo) {
      return NextResponse.json(
        { success: false, error: { code: "CAMERA_REQUIRED", message: "Foto selfie wajib diambil" } },
        { status: 400 }
      );
    }

    // CR-003: Validate and sanitize file extension to prevent path traversal
    const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
    let ext = path.extname(photo.name || "").toLowerCase();
    // Remove any non-alphanumeric characters except dot
    ext = ext.replace(/[^a-z0-9.]/gi, "");
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      ext = ".jpg"; // Default to jpg if invalid
    }

    // Save photo with sanitized filename
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `clockin_${context.employeeId}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "attendance");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const photoUrl = `/uploads/attendance/${filename}`;

    // Use AttendanceService for clock in
    const serviceResult = await AttendanceService.clockIn(context, {
      workMode: result.data.workMode,
      latitude: result.data.latitude,
      longitude: result.data.longitude,
      deviceInfo: result.data.deviceInfo ?? undefined,
      photoUrl,
    });

    if (!serviceResult.success) {
      return NextResponse.json(
        { success: false, error: serviceResult.error },
        { status: 422 }
      );
    }

    const attendance = serviceResult.data!;

    // Invalidate attendance cache immediately
    const cache = getCache();
    await Promise.all([
      cache.delete(CacheKeys.attendanceToday(context.tenantId, context.employeeId)),
      cache.invalidateByTag(CacheTags.attendance(context.tenantId)),
      cache.invalidateByTag(CacheTags.dashboard(context.tenantId)),
    ]);

    // Audit log (fire-and-forget - non-blocking)
    prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "CLOCK_IN",
        objectType: "Attendance",
        objectId: attendance.id,
        afterData: JSON.parse(JSON.stringify({
          clockIn: attendance.clockIn?.toISOString(),
          workMode: attendance.workMode,
          status: attendance.status,
          lateMinutes: attendance.lateMinutes,
        })),
      },
    }).catch(err => {
      console.error("Audit log error (non-critical):", err);
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: attendance.id,
          attendanceDate: attendance.attendanceDate,
          clockIn: attendance.clockIn,
          workMode: attendance.workMode,
          status: attendance.status,
          lateMinutes: attendance.lateMinutes,
        },
        message:
          attendance.lateMinutes > 0
            ? `Clock in tercatat. Anda terlambat ${attendance.lateMinutes} menit.`
            : "Clock in berhasil!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Clock in error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

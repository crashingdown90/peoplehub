// @ai:perf - Clock out with async audit log and cache invalidation
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { AttendanceService } from "@/services";
import { getCache, CacheKeys, CacheTags } from "@/lib/cache";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { validateCsrf, getCsrfErrorResponse } from "@/lib/security/csrf";
import { handlePrismaError } from "@/lib/api-utils";

// POST /api/attendance/clock-out
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
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");

    // Check photo
    if (!photo) {
      return NextResponse.json(
        { success: false, error: { code: "CAMERA_REQUIRED", message: "Foto selfie wajib diambil" } },
        { status: 400 }
      );
    }

    // Validate and sanitize file extension
    const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
    let ext = path.extname(photo.name || "").toLowerCase();
    ext = ext.replace(/[^a-z0-9.]/gi, "");
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      ext = ".jpg";
    }

    // Save photo with sanitized filename
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `clockout_${context.employeeId}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "attendance");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const photoUrl = `/uploads/attendance/${filename}`;

    // Use AttendanceService for clock out
    const serviceResult = await AttendanceService.clockOut(context, {
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      photoUrl,
    });

    if (!serviceResult.success) {
      return NextResponse.json(
        { success: false, error: serviceResult.error },
        { status: 422 }
      );
    }

    const attendance = serviceResult.data!;

    // Calculate work hours for response
    const clockIn = attendance.clockIn!;
    const clockOut = attendance.clockOut!;
    const workMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000);
    const workHours = workMinutes / 60;

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
        action: "CLOCK_OUT",
        objectType: "Attendance",
        objectId: attendance.id,
        afterData: JSON.parse(JSON.stringify({
          clockOut: clockOut.toISOString(),
          workHours: workHours.toFixed(2),
          overtimeMinutes: attendance.overtimeMinutes,
        })),
      },
    }).catch((err: unknown) => {
      console.error("Audit log error (non-critical):", err);
    });

    return NextResponse.json({
      success: true,
      data: {
        id: attendance.id,
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
        workHours: workHours.toFixed(2),
        overtimeMinutes: attendance.overtimeMinutes,
      },
      message:
        attendance.overtimeMinutes > 0
          ? `Clock out berhasil! Lembur ${attendance.overtimeMinutes} menit.`
          : "Clock out berhasil! Selamat beristirahat.",
    });
  } catch (error) {
    console.error("Clock out error:", error);
    return handlePrismaError(error);
  }
}

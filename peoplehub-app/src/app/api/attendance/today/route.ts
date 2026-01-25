// @ai:perf - GET today's attendance with caching
import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { AttendanceService } from "@/services";
import { getCache, CacheKeys, CacheTags } from "@/lib/cache";

// Cache TTL: 30 seconds for attendance status (short because it changes on clock-in/out)
const ATTENDANCE_TODAY_TTL = 30 * 1000;

// GET /api/attendance/today - Get today's attendance status
export async function GET() {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
        { status: 401 }
      );
    }

    const cache = getCache();
    const cacheKey = CacheKeys.attendanceToday(context.tenantId, context.employeeId);

    // Try cache first
    const cached = await cache.get<TodayAttendanceResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const result = await AttendanceService.getToday(context);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const attendance = result.data;

    const responseData: TodayAttendanceResponse = {
      hasAttendance: !!attendance,
      hasClockedIn: !!attendance?.clockIn,
      hasClockedOut: !!attendance?.clockOut,
      attendance: attendance
        ? {
          id: attendance.id,
          clockIn: attendance.clockIn,
          clockOut: attendance.clockOut,
          workMode: attendance.workMode,
          status: attendance.status,
          lateMinutes: attendance.lateMinutes,
        }
        : null,
      schedule: {
        shiftName: "Regular",
        startTime: "08:00",
        endTime: "17:00",
      },
    };

    // Cache for 30 seconds with tag for invalidation
    await cache.set(cacheKey, responseData, {
      ttl: ATTENDANCE_TODAY_TTL,
      tags: [CacheTags.attendance(context.tenantId)],
    });

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Get today attendance error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

// Type for cached response
interface TodayAttendanceResponse {
  hasAttendance: boolean;
  hasClockedIn: boolean;
  hasClockedOut: boolean;
  attendance: {
    id: string;
    clockIn: Date | null;
    clockOut: Date | null;
    workMode: string;
    status: string;
    lateMinutes: number;
  } | null;
  schedule: {
    shiftName: string;
    startTime: string;
    endTime: string;
  };
}

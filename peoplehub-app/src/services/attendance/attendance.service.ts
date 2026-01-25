// @ai:cl - Attendance service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import {
  ServiceResponse,
  success,
  error,
  paginated,
  ErrorCodes,
  PaginationParams,
  DateRangeFilter,
} from "../types";
import type { Attendance, AttendanceStatus, WorkMode } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface ClockInData {
  workMode: WorkMode;
  latitude?: number;
  longitude?: number;
  deviceInfo?: string;
  photoUrl?: string;
}

export interface ClockOutData {
  latitude?: number;
  longitude?: number;
  deviceInfo?: string;
  photoUrl?: string;
}

export interface AttendanceFilter extends DateRangeFilter, PaginationParams {
  employeeId?: string;
  status?: AttendanceStatus;
  workMode?: WorkMode;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  totalLateMinutes: number;
  totalOvertimeMinutes: number;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class AttendanceService {
  /**
   * Clock in for current user
   */
  static async clockIn(
    context: RequestContext,
    data: ClockInData
  ): Promise<ServiceResponse<Attendance>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existing = await prisma.attendance.findFirst({
      where: withTenant(context, {
        employeeId: context.employeeId!,
        attendanceDate: today,
      }),
    });

    if (existing) {
      return error(ErrorCodes.ALREADY_CLOCKED_IN, "Anda sudah melakukan clock in hari ini");
    }

    // Get employee's branch for geofence check (if WFO)
    if (data.workMode === "WFO" && data.latitude && data.longitude) {
      const employee = await prisma.employee.findUnique({
        where: { id: context.employeeId! },
        include: { branch: true },
      });

      if (employee?.branch) {
        const isWithinGeofence = this.checkGeofence(
          data.latitude,
          data.longitude,
          Number(employee.branch.latitude),
          Number(employee.branch.longitude),
          employee.branch.geofenceRadiusMeters || 500
        );

        if (!isWithinGeofence) {
          return error(
            ErrorCodes.OUTSIDE_GEOFENCE,
            "Anda berada di luar area kantor yang diizinkan"
          );
        }
      }
    }

    // Get schedule to calculate late minutes
    const schedule = await prisma.schedule.findFirst({
      where: {
        employeeId: context.employeeId!,
        scheduleDate: today,
      },
      include: { shift: true },
    });

    const now = new Date();
    let lateMinutes = 0;

    if (schedule?.shift) {
      const [shiftHour, shiftMinute] = schedule.shift.startTime.split(":").map(Number);
      const shiftStart = new Date(today);
      shiftStart.setHours(shiftHour, shiftMinute, 0, 0);

      if (now > shiftStart) {
        lateMinutes = Math.floor((now.getTime() - shiftStart.getTime()) / (1000 * 60));
      }
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        tenantId: context.tenantId,
        employeeId: context.employeeId!,
        scheduleId: schedule?.id,
        attendanceDate: today,
        clockIn: now,
        workMode: data.workMode,
        clockInPhotoUrl: data.photoUrl,
        clockInLatitude: data.latitude ? data.latitude : undefined,
        clockInLongitude: data.longitude ? data.longitude : undefined,
        deviceInfo: data.deviceInfo,
        lateMinutes,
        status: lateMinutes > 0 ? "LATE" : "PRESENT",
      },
    });

    return success(attendance);
  }

  /**
   * Clock out for current user
   */
  static async clockOut(
    context: RequestContext,
    data: ClockOutData
  ): Promise<ServiceResponse<Attendance>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance
    const attendance = await prisma.attendance.findFirst({
      where: withTenant(context, {
        employeeId: context.employeeId!,
        attendanceDate: today,
      }),
      include: { schedule: { include: { shift: true } } },
    });

    if (!attendance) {
      return error(ErrorCodes.NOT_CLOCKED_IN, "Anda belum melakukan clock in hari ini");
    }

    if (attendance.clockOut) {
      return error(ErrorCodes.CONFLICT, "Anda sudah melakukan clock out hari ini");
    }

    const now = new Date();

    // Calculate early leave and overtime
    let earlyLeaveMinutes = 0;
    let overtimeMinutes = 0;

    if (attendance.schedule?.shift) {
      const [endHour, endMinute] = attendance.schedule.shift.endTime
        .split(":")
        .map(Number);
      const shiftEnd = new Date(today);
      shiftEnd.setHours(endHour, endMinute, 0, 0);

      if (now < shiftEnd) {
        earlyLeaveMinutes = Math.floor((shiftEnd.getTime() - now.getTime()) / (1000 * 60));
      } else if (now > shiftEnd) {
        overtimeMinutes = Math.floor((now.getTime() - shiftEnd.getTime()) / (1000 * 60));
      }
    }

    // Update attendance
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        clockOutPhotoUrl: data.photoUrl,
        clockOutLatitude: data.latitude ? data.latitude : undefined,
        clockOutLongitude: data.longitude ? data.longitude : undefined,
        earlyLeaveMinutes,
        overtimeMinutes,
      },
    });

    return success(updated);
  }

  /**
   * Get today's attendance for current user
   */
  static async getToday(context: RequestContext): Promise<ServiceResponse<Attendance | null>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: withTenant(context, {
        employeeId: context.employeeId!,
        attendanceDate: today,
      }),
    });

    return success(attendance);
  }

  /**
   * Get attendance history with filters
   */
  static async getHistory(
    context: RequestContext,
    filter: AttendanceFilter
  ): Promise<ServiceResponse<Attendance[]>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "attendanceDate",
      sortOrder = "desc",
      startDate,
      endDate,
      status,
      workMode,
      employeeId,
    } = filter;

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    // Scope based on role
    if (["HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      if (employeeId) {
        where.employeeId = employeeId;
      }
    } else if (context.role === "MANAGER") {
      // Manager sees their team (simplified - should check subordinates)
      if (employeeId) {
        where.employeeId = employeeId;
      }
    } else {
      // Employee sees only self
      where.employeeId = context.employeeId;
    }

    if (startDate) {
      where.attendanceDate = {
        ...(where.attendanceDate as object || {}),
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      where.attendanceDate = {
        ...(where.attendanceDate as object || {}),
        lte: new Date(endDate),
      };
    }
    if (status) {
      where.status = status;
    }
    if (workMode) {
      where.workMode = workMode;
    }

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: { fullName: true, employeeNumber: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  /**
   * Get attendance summary for period
   */
  static async getSummary(
    context: RequestContext,
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<AttendanceSummary>> {
    const attendances = await prisma.attendance.findMany({
      where: withTenant(context, {
        employeeId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      }),
    });

    const summary: AttendanceSummary = {
      totalDays: attendances.length,
      presentDays: attendances.filter((a) => a.status === "PRESENT").length,
      lateDays: attendances.filter((a) => a.status === "LATE").length,
      absentDays: attendances.filter((a) => a.status === "ABSENT").length,
      leaveDays: attendances.filter((a) => a.status === "LEAVE").length,
      totalLateMinutes: attendances.reduce((sum, a) => sum + a.lateMinutes, 0),
      totalOvertimeMinutes: attendances.reduce((sum, a) => sum + a.overtimeMinutes, 0),
    };

    return success(summary);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static checkGeofence(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusMeters: number
  ): boolean {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusMeters;
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

/**
 * Schedule Service
 * 
 * Handles employee work schedule operations for attendance.
 * Determines shift times, work days, and schedule validation.
 */

import { prisma } from '@/lib/prisma';

export interface ScheduleInfo {
    /** Schedule ID */
    id: string;
    /** Shift name */
    shiftName: string;
    /** Shift start time (HH:mm) */
    startTime: string;
    /** Shift end time (HH:mm) */
    endTime: string;
    /** Work days (array of day numbers: 1=Monday, 7=Sunday) */
    workDays: number[];
    /** Grace period in minutes */
    gracePeriodMinutes: number;
}

export class ScheduleService {
    /**
     * Get employee's schedule for today
     * 
     * @param employeeId - Employee UUID
     * @param date - Target date (default: today)
     * @returns Schedule info or null if no schedule
     */
    static async getTodaySchedule(
        employeeId: string,
        date: Date = new Date()
    ): Promise<ScheduleInfo | null> {
        // Use existing Schedule model (links employee to shift for specific date)
        const schedule = await prisma.schedule.findFirst({
            where: {
                employeeId,
                scheduleDate: date,
            },
            include: {
                shift: true,
            },
        });

        // Always load tenant settings for grace period & work days
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { tenantId: true },
        });

        const tenantSettings = employee
            ? await prisma.attendanceSettings.findUnique({
                where: { tenantId: employee.tenantId },
            })
            : null;

        const gracePeriod = tenantSettings?.gracePeriodMinutes ?? 5;
        const tenantWorkDays = (tenantSettings?.workDays as number[]) || [1, 2, 3, 4, 5];

        if (schedule && schedule.shift) {
            // Has specific schedule — use shift times but grace period from tenant settings
            return {
                id: schedule.id,
                shiftName: schedule.shift.name,
                startTime: schedule.shift.startTime,
                endTime: schedule.shift.endTime,
                workDays: tenantWorkDays,
                gracePeriodMinutes: gracePeriod,
            };
        }

        if (!employee || !tenantSettings) {
            return null;
        }

        // Fallback: Use tenant's default shift from AttendanceSettings
        return {
            id: 'default',
            shiftName: 'Default Shift',
            startTime: tenantSettings.defaultShiftStart,
            endTime: tenantSettings.defaultShiftEnd,
            workDays: tenantWorkDays,
            gracePeriodMinutes: gracePeriod,
        };
    }

    /**
     * Check if today is a work day for the employee
     * 
     * @param employeeId - Employee UUID
     * @param date - Target date
     * @returns true if work day
     */
    static async isWorkDay(
        employeeId: string,
        date: Date = new Date()
    ): Promise<boolean> {
        const schedule = await this.getTodaySchedule(employeeId, date);

        if (!schedule) {
            // No schedule = not a work day
            return false;
        }

        // Check if today's day of week is in work days
        // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
        // Our system: 1=Monday, 2=Tuesday, ..., 7=Sunday
        const jsDay = date.getDay();
        const ourDay = jsDay === 0 ? 7 : jsDay; // Convert Sunday from 0 to 7

        return schedule.workDays.includes(ourDay);
    }

    /**
     * Check if current time is within allowed clock-in window
     * Uses earliestClockIn and latestClockOut from tenant settings.
     *
     * @param clockInTime - Proposed clock-in time
     * @param tenantId - Tenant UUID for loading settings
     * @returns Validation result
     */
    static async validateClockInWindow(
        clockInTime: Date,
        tenantId: string
    ): Promise<{ allowed: boolean; reason?: string }> {
        const settings = await prisma.attendanceSettings.findUnique({
            where: { tenantId },
        });

        // Defaults: 06:00 earliest, 22:00 latest
        const earliestStr = settings?.earliestClockIn ?? "06:00";
        const latestStr = settings?.latestClockOut ?? "22:00";

        const [earlyH, earlyM] = earliestStr.split(":").map(Number);
        const [lateH, lateM] = latestStr.split(":").map(Number);

        const clockInMinutes = clockInTime.getHours() * 60 + clockInTime.getMinutes();
        const earliestMinutes = earlyH * 60 + earlyM;
        const latestMinutes = lateH * 60 + lateM;

        if (clockInMinutes < earliestMinutes) {
            return {
                allowed: false,
                reason: `Clock in hanya diizinkan mulai pukul ${earliestStr}`,
            };
        }

        if (clockInMinutes > latestMinutes) {
            return {
                allowed: false,
                reason: `Clock in tidak diizinkan setelah pukul ${latestStr}`,
            };
        }

        return { allowed: true };
    }

    /**
     * Get attendance settings for tenant
     * Includes geofence radius, grace period overrides, etc.
     * 
     * @param tenantId - Tenant UUID
     * @param branchId - Optional branch ID to get office location coordinates
     */
    static async getAttendanceSettings(tenantId: string, branchId?: string) {
        const settings = await prisma.attendanceSettings.findUnique({
            where: { tenantId },
        });

        // Get office location from branch if provided
        let officeLocation: { latitude: number; longitude: number; radius: number } | null = null;
        if (branchId) {
            const branch = await prisma.branch.findUnique({
                where: { id: branchId },
                select: {
                    latitude: true,
                    longitude: true,
                    geofenceRadiusMeters: true,
                },
            });

            if (branch && branch.latitude && branch.longitude) {
                officeLocation = {
                    latitude: Number(branch.latitude),
                    longitude: Number(branch.longitude),
                    radius: branch.geofenceRadiusMeters || 100,
                };
            }
        }

        // Return settings with branch location if available
        return {
            geofenceEnabled: settings?.geofenceEnabled ?? true,
            geofenceRadiusMeters: officeLocation?.radius ?? settings?.geofenceRadius ?? 100,
            livenessEnabled: settings?.requireLiveness ?? true,
            faceConfidenceMin: Number(settings?.minFaceConfidence) ?? 0.7,
            livenessScoreMin: 0.8, // Default, not stored in settings yet
            gracePeriodMinutes: settings?.gracePeriodMinutes ?? 5,
            officeLatitude: officeLocation?.latitude ?? null,
            officeLongitude: officeLocation?.longitude ?? null,
        };
    }

    /**
     * Helper to format minutes to HH:mm
     */
    private static formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
}

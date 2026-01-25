/**
 * Schedule Service
 * 
 * Handles employee work schedule operations for attendance.
 * Determines shift times, work days, and schedule validation.
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

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

        if (schedule && schedule.shift) {
            // Has specific schedule for today
            return {
                id: schedule.id,
                shiftName: schedule.shift.name,
                startTime: schedule.shift.startTime,
                endTime: schedule.shift.endTime,
                workDays: [1, 2, 3, 4, 5], // Default Mon-Fri, can be enhanced later
                gracePeriodMinutes: 5, // Default grace period
            };
        }

        // Fallback: Use tenant's default shift from AttendanceSettings
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { tenantId: true },
        });

        if (!employee) {
            return null;
        }

        const settings = await prisma.attendanceSettings.findUnique({
            where: { tenantId: employee.tenantId },
        });

        if (!settings) {
            return null;
        }

        return {
            id: 'default',
            shiftName: 'Default Shift',
            startTime: settings.defaultShiftStart,
            endTime: settings.defaultShiftEnd,
            workDays: (settings.workDays as number[]) || [1, 2, 3, 4, 5],
            gracePeriodMinutes: settings.gracePeriodMinutes,
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
     * 
     * Clock-in window rules:
     * - Earliest: shift_start - 2 hours
     * - Latest: shift_end (or no limit for late arrivals)
     * 
     * @param schedule - Schedule info
     * @param clockInTime - Proposed clock-in time
     * @returns Validation result
     */
    static validateClockInWindow(
        schedule: ScheduleInfo,
        clockInTime: Date
    ): { allowed: boolean; reason?: string } {
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

        const clockInTimeOfDay = clockInTime.getHours() * 60 + clockInTime.getMinutes();
        const shiftStartMinutes = startHour * 60 + startMinute;
        const shiftEndMinutes = endHour * 60 + endMinute;

        // Earliest clock-in: 2 hours before shift start
        const earliestClockIn = shiftStartMinutes - 120;

        if (clockInTimeOfDay < earliestClockIn) {
            const earliestTime = this.formatTime(earliestClockIn);
            return {
                allowed: false,
                reason: `Clock in hanya diizinkan mulai pukul ${earliestTime}`,
            };
        }

        // For now, we allow late clock-ins (no maximum time)
        // This can be configured per tenant if needed
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

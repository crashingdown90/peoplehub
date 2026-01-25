// @ai:ag - Created by Antigravity
// Attendance related types

import { TenantEntity, DateRange } from './common.types';
import { AttendanceStatus, WorkMode, ApprovalStatus } from './enums';

/**
 * Attendance record
 */
export interface Attendance extends TenantEntity {
    employeeId: string;
    scheduleId?: string | null;
    attendanceDate: Date | string;
    clockIn?: Date | string | null;
    clockOut?: Date | string | null;
    workMode?: WorkMode | null;
    clockInPhotoUrl?: string | null;
    clockOutPhotoUrl?: string | null;
    clockInLatitude?: number | null;
    clockInLongitude?: number | null;
    clockOutLatitude?: number | null;
    clockOutLongitude?: number | null;
    deviceInfo?: string | null;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
    lateDeductionAmount: number;
    status: AttendanceStatus;
    isCorrected: boolean;
}

/**
 * Attendance with employee info
 */
export interface AttendanceWithEmployee extends Attendance {
    employee: {
        id: string;
        employeeNumber: string;
        fullName: string;
        department?: {
            id: string;
            name: string;
        } | null;
        branch?: {
            id: string;
            name: string;
        } | null;
    };
}

/**
 * Clock in request
 */
export interface ClockInRequest {
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
    workMode?: WorkMode;
}

/**
 * Clock out request
 */
export interface ClockOutRequest {
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
}

/**
 * Attendance summary
 */
export interface AttendanceSummary {
    period: string; // YYYY-MM
    workDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    overtimeHours: number;
    totalLateMinutes: number;
    totalEarlyLeaveMinutes: number;
}

/**
 * Today's attendance status
 */
export interface TodayAttendance {
    date: string;
    hasClockIn: boolean;
    hasClockOut: boolean;
    clockInTime?: string;
    clockOutTime?: string;
    status: AttendanceStatus;
    lateMinutes?: number;
    workMode?: WorkMode;
}

/**
 * Attendance correction request
 */
export interface AttendanceCorrection extends TenantEntity {
    employeeId: string;
    attendanceDate: Date | string;
    originalClockIn?: Date | string | null;
    originalClockOut?: Date | string | null;
    requestedClockIn?: Date | string | null;
    requestedClockOut?: Date | string | null;
    reason: string;
    status: ApprovalStatus;
    approvedById?: string | null;
    approvedAt?: Date | string | null;
    rejectionReason?: string | null;
}

/**
 * Create attendance correction request
 */
export interface CreateAttendanceCorrectionRequest {
    attendanceDate: Date | string;
    requestedClockIn?: Date | string;
    requestedClockOut?: Date | string;
    reason: string;
}

/**
 * Attendance filter params
 */
export interface AttendanceFilterParams extends DateRange {
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
    status?: AttendanceStatus;
}

/**
 * Schedule data
 */
export interface Schedule extends TenantEntity {
    employeeId: string;
    shiftId?: string | null;
    scheduleDate: Date | string;
    workMode: WorkMode;
    isHoliday: boolean;
    shift?: {
        id: string;
        name: string;
        startTime: string;
        endTime: string;
    } | null;
}

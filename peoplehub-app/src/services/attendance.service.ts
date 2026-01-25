/**
 * Attendance Service
 * 
 * Main business logic for attendance operations.
 * Handles clock-in/clock-out with all validations and business rules.
 */

import { prisma } from '@/lib/prisma';
import { calculateLate, type LateCalculationResult } from '@/lib/utils/late-calculator';
import { GeofenceService, type GeofenceValidationResult } from './geofence.service';
import { ScheduleService } from './schedule.service';
import { PhotoUploadService } from './photo-upload.service';
import {
    AlreadyClockedInError,
    EmployeeInactiveError,
    FaceDetectionError,
    LivenessValidationError,
    NotWorkDayError,
    OutsideClockInWindowError,
    ValidationError,
} from '@/lib/errors';
import type { ClockInRequest } from '@/lib/validations/attendance/schema';

export interface ClockInInput extends ClockInRequest {
    photo: File;
}

export interface ClockInResult {
    id: string;
    employeeId: string;
    attendanceDate: Date;
    clockIn: Date;
    workMode: 'WFO' | 'WFH';
    status: 'PRESENT' | 'LATE';
    lateMinutes: number;
    lateDeductionAmount: number;
    geofenceStatus?: 'INSIDE' | 'OUTSIDE' | 'WARNING';
    geofenceWarning?: string;
    faceDetected: boolean;
    faceConfidence: number;
    livenessScore: number;
    photoUrl: string;
}

export class AttendanceService {
    /**
     * Process clock-in request with all validations and business rules
     * 
     * @param userId - Authenticated user ID
     * @param input - Clock-in request data
     * @returns Clock-in result
     */
    static async processClockIn(
        userId: string,
        input: ClockInInput
    ): Promise<ClockInResult> {
        // 1. Get user and employee data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                employee: {
                    include: {
                        tenant: true,
                    },
                },
            },
        });

        if (!user?.employee) {
            throw new ValidationError('Employee record not found');
        }

        const employee = user.employee;
        const tenantId = employee.tenantId;

        // 2. Pre-condition checks
        await this.validatePreConditions(employee.id, employee.status);

        // 3. Validate face detection and liveness
        this.validateFaceAndLiveness(
            input.faceDetected,
            input.faceConfidence,
            input.livenessScore
        );

        // 4. Get schedule and attendance settings
        const schedule = await ScheduleService.getTodaySchedule(employee.id);
        if (!schedule) {
            throw new NotWorkDayError('Tidak ada jadwal kerja untuk hari ini');
        }

        const settings = await ScheduleService.getAttendanceSettings(tenantId);

        // 5. Validate geofence (if WFO)
        let geofenceResult: GeofenceValidationResult | undefined;
        if (input.workMode === 'WFO' && settings.geofenceEnabled) {
            if (!settings.officeLatitude || !settings.officeLongitude) {
                throw new ValidationError('Koordinat kantor belum dikonfigurasi');
            }

            if (input.latitude === null || input.latitude === undefined ||
                input.longitude === null || input.longitude === undefined) {
                throw new ValidationError('Lokasi GPS diperlukan untuk mode WFO');
            }

            // After validation, we know latitude and longitude are numbers
            const lat: number = input.latitude;
            const lng: number = input.longitude;

            geofenceResult = GeofenceService.validateGeofence({
                userLatitude: lat,
                userLongitude: lng,
                officeLatitude: settings.officeLatitude,
                officeLongitude: settings.officeLongitude,
                radiusMeters: settings.geofenceRadiusMeters,
                gpsAccuracy: input.gpsAccuracy ?? undefined,
            });
        }

        // 6. Upload photo
        const now = new Date();
        const photoResult = await PhotoUploadService.uploadAttendancePhoto(input.photo, {
            employeeId: employee.id,
            tenantId,
            type: 'clock_in',
            date: now,
        });

        // 7. Calculate late status
        const lateResult = calculateLate({
            clockInTime: now,
            shiftStartTime: schedule.startTime,
            gracePeriodMinutes: settings.gracePeriodMinutes,
        });

        // 8. Create attendance record
        const attendance = await this.createAttendanceRecord({
            employee,
            schedule,
            input,
            photoUrl: photoResult.url,
            lateResult,
            geofenceResult,
            clockInTime: now,
        });

        return {
            id: attendance.id,
            employeeId: employee.id,
            attendanceDate: attendance.attendanceDate,
            clockIn: attendance.clockIn!, // Non-null because we just created it
            workMode: attendance.workMode as 'WFO' | 'WFH',
            status: attendance.status as 'PRESENT' | 'LATE',
            lateMinutes: attendance.lateMinutes,
            lateDeductionAmount: attendance.lateDeductionAmount?.toNumber() || 0,
            geofenceStatus: geofenceResult?.status,
            geofenceWarning: geofenceResult?.warningMessage,
            faceDetected: attendance.faceDetectedIn || false,
            faceConfidence: attendance.faceConfidenceIn?.toNumber() || 0,
            livenessScore: attendance.livenessScoreIn?.toNumber() || 0,
            photoUrl: attendance.clockInPhotoUrl || '',
        };
    }

    /**
     * Validate pre-conditions for clock-in
     */
    private static async validatePreConditions(
        employeeId: string,
        employeeStatus: string
    ): Promise<void> {
        // Check employee status
        if (employeeStatus !== 'active') {
            throw new EmployeeInactiveError();
        }

        // Check if already clocked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                employeeId,
                attendanceDate: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        if (existingAttendance) {
            const clockInTime = existingAttendance.clockIn
                ? existingAttendance.clockIn.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                })
                : 'N/A';
            throw new AlreadyClockedInError(clockInTime);
        }

        // Check if today is work day
        const isWorkDay = await ScheduleService.isWorkDay(employeeId);
        if (!isWorkDay) {
            throw new NotWorkDayError();
        }
    }

    /**
     * Validate face detection and liveness score
     */
    private static validateFaceAndLiveness(
        faceDetected: boolean,
        faceConfidence: number,
        livenessScore: number
    ): void {
        if (!faceDetected) {
            throw new FaceDetectionError('Wajah tidak terdeteksi dalam foto');
        }

        if (faceConfidence < 0.70) {
            throw new FaceDetectionError(
                'Confidence wajah kurang dari 70%. Pastikan pencahayaan cukup dan wajah menghadap kamera.',
                { faceConfidence, requiredConfidence: 0.70 }
            );
        }

        if (livenessScore < 0.80) {
            throw new LivenessValidationError(livenessScore, 0.80);
        }
    }

    /**
     * Create attendance record in database
     */
    private static async createAttendanceRecord(params: {
        employee: any;
        schedule: any;
        input: ClockInInput;
        photoUrl: string;
        lateResult: LateCalculationResult;
        geofenceResult?: GeofenceValidationResult;
        clockInTime: Date;
    }) {
        const {
            employee,
            schedule,
            input,
            photoUrl,
            lateResult,
            geofenceResult,
            clockInTime,
        } = params;

        const attendanceDate = new Date(clockInTime);
        attendanceDate.setHours(0, 0, 0, 0);

        return await prisma.attendance.create({
            data: {
                tenantId: employee.tenantId,
                employeeId: employee.id,
                scheduleId: schedule.id,
                attendanceDate,
                clockIn: clockInTime,
                workMode: input.workMode,
                clockInPhotoUrl: photoUrl,
                clockInLatitude: input.latitude,
                clockInLongitude: input.longitude,
                clockInGpsAccuracy: input.gpsAccuracy,
                deviceInfo: input.deviceInfo,
                lateMinutes: lateResult.lateMinutes,
                lateDeductionAmount: lateResult.deductionAmount,
                status: lateResult.status,
                faceDetectedIn: input.faceDetected,
                faceConfidenceIn: input.faceConfidence,
                livenessScoreIn: input.livenessScore,
                isCorrected: false,
            },
        });
    }
}

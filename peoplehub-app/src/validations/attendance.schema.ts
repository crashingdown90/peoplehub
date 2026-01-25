// @ai:ag - Created by Antigravity
// Attendance validation schemas

import { z } from 'zod';

/**
 * Clock in schema
 */
export const clockInSchema = z.object({
    workMode: z.enum(['WFO', 'WFH', 'HYBRID']).default('WFO'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deviceInfo: z.string().optional(),
    photoUrl: z.string().url().optional(),
});

/**
 * Clock out schema
 */
export const clockOutSchema = z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deviceInfo: z.string().optional(),
    photoUrl: z.string().url().optional(),
});

/**
 * Attendance correction schema
 */
export const attendanceCorrectionSchema = z.object({
    attendanceDate: z.string().min(1, 'Tanggal wajib diisi'),
    requestedClockIn: z.string().optional(),
    requestedClockOut: z.string().optional(),
    reason: z.string().min(10, 'Alasan minimal 10 karakter'),
}).refine(
    (data) => data.requestedClockIn || data.requestedClockOut,
    {
        message: 'Minimal isi jam masuk atau jam keluar yang dikoreksi',
        path: ['requestedClockIn'],
    }
);

/**
 * Approve/reject correction schema
 */
export const approveRejectCorrectionSchema = z.object({
    action: z.enum(['approve', 'reject']),
    rejectionReason: z.string().optional(),
}).refine(
    (data) => data.action !== 'reject' || (data.rejectionReason && data.rejectionReason.length >= 10),
    {
        message: 'Alasan penolakan minimal 10 karakter',
        path: ['rejectionReason'],
    }
);

/**
 * Schedule schema (admin)
 */
export const scheduleSchema = z.object({
    employeeId: z.string().cuid('Karyawan wajib dipilih'),
    shiftId: z.string().cuid('Shift wajib dipilih').optional(),
    scheduleDate: z.string().min(1, 'Tanggal wajib diisi'),
    workMode: z.enum(['WFO', 'WFH', 'HYBRID']).default('WFO'),
    isHoliday: z.boolean().default(false),
});

// Inferred types
export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type AttendanceCorrectionInput = z.infer<typeof attendanceCorrectionSchema>;
export type ApproveRejectCorrectionInput = z.infer<typeof approveRejectCorrectionSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;

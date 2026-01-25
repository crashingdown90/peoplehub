/**
 * Late Calculation Utilities
 * 
 * Calculate if an employee is late based on clock-in time,
 * shift schedule, and grace period settings.
 * 
 * Business Rules:
 * - Late = clock_in > (shift_start + grace_period)
 * - Grace period default: 5 minutes
 * - Late minutes = max(0, diff in minutes)
 */

import { addMinutes, differenceInMinutes, parse, format } from 'date-fns';

export interface LateCalculationInput {
    /** Actual clock-in timestamp */
    clockInTime: Date;
    /** Shift start time (HH:mm format, e.g., "08:00") */
    shiftStartTime: string;
    /** Grace period in minutes (default: 5) */
    gracePeriodMinutes?: number;
}

export interface LateCalculationResult {
    /** Number of minutes late (0 if on time) */
    lateMinutes: number;
    /** Attendance status */
    status: 'PRESENT' | 'LATE';
    /** Deduction amount (if applicable, currently 0) */
    deductionAmount: number;
    /** Threshold time after which considered late */
    lateThreshold: Date;
}

/**
 * Calculate late status for clock-in
 * 
 * @param input - Clock-in time, shift start, and grace period
 * @returns Late calculation result
 * 
 * @example
 * const result = calculateLate({
 *   clockInTime: new Date('2026-01-23T08:06:00+07:00'),
 *   shiftStartTime: '08:00',
 *   gracePeriodMinutes: 5
 * });
 * // { lateMinutes: 1, status: 'LATE', ... }
 */
export function calculateLate(
    input: LateCalculationInput
): LateCalculationResult {
    const {
        clockInTime,
        shiftStartTime,
        gracePeriodMinutes = 5,
    } = input;

    // Parse shift start time and combine with clock-in date
    const clockInDate = format(clockInTime, 'yyyy-MM-dd');
    const shiftStart = parse(
        `${clockInDate} ${shiftStartTime}`,
        'yyyy-MM-dd HH:mm',
        new Date()
    );

    // Calculate late threshold (shift start + grace period)
    const lateThreshold = addMinutes(shiftStart, gracePeriodMinutes);

    // Calculate difference in minutes
    const diffMinutes = differenceInMinutes(clockInTime, lateThreshold);

    // Late minutes is max(0, diff)
    const lateMinutes = Math.max(0, diffMinutes);

    // Determine status
    const status = lateMinutes > 0 ? 'LATE' : 'PRESENT';

    // Deduction calculation (future implementation)
    // For now, we don't calculate deductions
    const deductionAmount = 0;

    return {
        lateMinutes,
        status,
        deductionAmount,
        lateThreshold,
    };
}

/**
 * Format late minutes to human-readable string
 * 
 * @param lateMinutes - Number of minutes late
 * @returns Formatted string
 * 
 * @example
 * formatLateMinutes(15) // "15 menit"
 * formatLateMinutes(65) // "1 jam 5 menit"
 */
export function formatLateMinutes(lateMinutes: number): string {
    if (lateMinutes === 0) return '0 menit';

    const hours = Math.floor(lateMinutes / 60);
    const minutes = lateMinutes % 60;

    if (hours === 0) {
        return `${minutes} menit`;
    }

    if (minutes === 0) {
        return `${hours} jam`;
    }

    return `${hours} jam ${minutes} menit`;
}

/**
 * Check if late exceeds threshold for escalation
 * 
 * @param lateMinutes - Number of minutes late
 * @param threshold - Threshold in minutes (default: 30)
 * @returns true if exceeds threshold
 */
export function isSignificantLate(
    lateMinutes: number,
    threshold: number = 30
): boolean {
    return lateMinutes >= threshold;
}

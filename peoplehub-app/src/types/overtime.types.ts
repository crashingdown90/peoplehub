// @ai:ag - Created by Antigravity
// Overtime request types

/**
 * Overtime type - categorizes the type of overtime
 */
export type OvertimeType = 'REGULAR' | 'HOLIDAY' | 'WEEKEND';

/**
 * Overtime request status
 */
export type OvertimeStatus =
    | 'PENDING'
    | 'PENDING_MANAGER'
    | 'PENDING_HRD'
    | 'APPROVED'
    | 'REJECTED'
    | 'COMPLETED'
    | 'CANCELLED';

/**
 * Overtime request entity
 */
export interface OvertimeRequest {
    id: string;
    tenantId: string;
    employeeId: string;
    employeeName?: string;
    employeeNumber?: string;

    // Request details
    date: string; // ISO date string
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    overtimeMinutes: number;
    type: OvertimeType;
    reason: string;

    // Status tracking
    status: OvertimeStatus;

    // Approval info
    approvedByManagerId?: string;
    approvedByManagerAt?: string;
    approvedByHrdId?: string;
    approvedByHrdAt?: string;
    rejectionReason?: string;

    // Rate calculation (for payroll integration)
    rateMultiplier?: number; // e.g., 1.5x, 2x
    calculatedAmount?: number;

    createdAt: string;
    updatedAt: string;
}

/**
 * Form data for creating overtime request
 */
export interface OvertimeRequestFormData {
    date: Date;
    startTime: string;
    endTime: string;
    type: OvertimeType;
    reason: string;
}

/**
 * Overtime rate configuration
 */
export interface OvertimeRateConfig {
    tenantId: string;
    regularRateMultiplier: number; // Default: 1.5
    weekendRateMultiplier: number; // Default: 2.0
    holidayRateMultiplier: number; // Default: 2.5
    maxOvertimeHoursPerDay: number; // Default: 4
    maxOvertimeHoursPerMonth: number; // Default: 40
    requireApproval: boolean;
}

/**
 * Overtime summary for dashboard/reports
 */
export interface OvertimeSummary {
    employeeId: string;
    period: string; // YYYY-MM format
    totalMinutes: number;
    totalAmount: number;
    byType: {
        regular: number;
        weekend: number;
        holiday: number;
    };
    pendingCount: number;
    approvedCount: number;
}

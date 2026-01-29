// @ai:ag - Created by Antigravity
// Leave related types

import { TenantEntity, DateRange } from './common.types';
import { ApprovalStatus } from './enums';

/**
 * Leave type definition
 */
export interface LeaveType extends TenantEntity {
    code: string;
    name: string;
    defaultBalance: number;
    isPaid: boolean;
    requiresAttachment: boolean;
    isActive: boolean;
}

/**
 * Leave balance
 */
export interface LeaveBalance extends TenantEntity {
    employeeId: string;
    leaveTypeId: string;
    year: number;
    initialBalance: number;
    usedBalance: number;
    remainingBalance: number;
    expiryDate?: Date | string | null;
    leaveType?: LeaveType;
}

/**
 * Leave request
 */
export interface LeaveRequest extends TenantEntity {
    employeeId: string;
    leaveTypeId: string;
    startDate: Date | string;
    endDate: Date | string;
    totalDays: number;
    reason: string;
    attachmentUrl?: string | null;
    delegateToId?: string | null;
    status: ApprovalStatus;
    approvedByManagerId?: string | null;
    approvedByHrdId?: string | null;
    managerApprovedAt?: Date | string | null;
    hrdApprovedAt?: Date | string | null;
    rejectionReason?: string | null;
}

/**
 * Leave request with relations
 */
export interface LeaveRequestWithRelations extends LeaveRequest {
    employee: {
        id: string;
        employeeNumber: string;
        fullName: string;
        department?: {
            id: string;
            name: string;
        } | null;
    };
    leaveType: LeaveType;
    delegateTo?: {
        id: string;
        fullName: string;
    } | null;
}

/**
 * Create leave request
 */
export interface CreateLeaveRequest {
    leaveTypeId: string;
    startDate: Date | string;
    endDate: Date | string;
    reason: string;
    attachmentUrl?: string;
    delegateToId?: string;
}

/**
 * Update leave request (before approval)
 */
export interface UpdateLeaveRequest extends Partial<CreateLeaveRequest> {
    status?: ApprovalStatus;
}

/**
 * Approve/Reject leave request
 */
export interface ApproveRejectLeaveRequest {
    action: 'approve' | 'reject';
    rejectionReason?: string;
}

/**
 * Leave summary for dashboard
 */
export interface LeaveSummary {
    leaveTypeId: string;
    leaveTypeName: string;
    initialBalance: number;
    usedBalance: number;
    remainingBalance: number;
    pendingRequests: number;
}

/**
 * Leave filter params
 */
export interface LeaveFilterParams extends Partial<DateRange> {
    employeeId?: string;
    leaveTypeId?: string;
    status?: ApprovalStatus;
    branchId?: string;
    departmentId?: string;
}

/**
 * Leave calendar event
 */
export interface LeaveCalendarEvent {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: Date | string;
    endDate: Date | string;
    status: ApprovalStatus;
}

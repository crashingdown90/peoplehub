// @ai:ag - Created by Antigravity
// Status constants and labels

import {
    UserStatus,
    EmployeeStatus,
    AttendanceStatus,
    ApprovalStatus,
    PayslipStatus,
    TicketStatus,
    TicketPriority,
} from '@/types';

/**
 * User status labels in Indonesian
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
    [UserStatus.PENDING]: 'Menunggu Verifikasi',
    [UserStatus.ACTIVE]: 'Aktif',
    [UserStatus.APPROVED]: 'Disetujui',
    [UserStatus.REJECTED]: 'Ditolak',
    [UserStatus.SUSPENDED]: 'Ditangguhkan',
};

/**
 * User status colors for badges
 */
export const USER_STATUS_COLORS: Record<UserStatus, string> = {
    [UserStatus.PENDING]: 'yellow',
    [UserStatus.ACTIVE]: 'green',
    [UserStatus.APPROVED]: 'green',
    [UserStatus.REJECTED]: 'red',
    [UserStatus.SUSPENDED]: 'gray',
};

/**
 * Employee status labels in Indonesian
 */
export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
    [EmployeeStatus.ACTIVE]: 'Aktif',
    [EmployeeStatus.INACTIVE]: 'Tidak Aktif',
    [EmployeeStatus.TERMINATED]: 'Berhenti',
};

/**
 * Employee status colors
 */
export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
    [EmployeeStatus.ACTIVE]: 'green',
    [EmployeeStatus.INACTIVE]: 'yellow',
    [EmployeeStatus.TERMINATED]: 'red',
};

/**
 * Attendance status labels in Indonesian
 */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: 'Hadir',
    [AttendanceStatus.LATE]: 'Terlambat',
    [AttendanceStatus.ABSENT]: 'Tidak Hadir',
    [AttendanceStatus.LEAVE]: 'Cuti',
    [AttendanceStatus.HOLIDAY]: 'Libur',
};

/**
 * Attendance status colors
 */
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: 'green',
    [AttendanceStatus.LATE]: 'yellow',
    [AttendanceStatus.ABSENT]: 'red',
    [AttendanceStatus.LEAVE]: 'blue',
    [AttendanceStatus.HOLIDAY]: 'purple',
};

/**
 * Approval status labels in Indonesian
 */
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
    [ApprovalStatus.PENDING]: 'Menunggu Persetujuan',
    [ApprovalStatus.APPROVED_MANAGER]: 'Disetujui Manajer',
    [ApprovalStatus.APPROVED_HRD]: 'Disetujui HRD',
    [ApprovalStatus.APPROVED]: 'Disetujui',
    [ApprovalStatus.REJECTED]: 'Ditolak',
    [ApprovalStatus.CANCELLED]: 'Dibatalkan',
};

/**
 * Approval status colors
 */
export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
    [ApprovalStatus.PENDING]: 'yellow',
    [ApprovalStatus.APPROVED_MANAGER]: 'blue',
    [ApprovalStatus.APPROVED_HRD]: 'blue',
    [ApprovalStatus.APPROVED]: 'green',
    [ApprovalStatus.REJECTED]: 'red',
    [ApprovalStatus.CANCELLED]: 'gray',
};

/**
 * Payslip status labels in Indonesian
 */
export const PAYSLIP_STATUS_LABELS: Record<PayslipStatus, string> = {
    [PayslipStatus.DRAFT]: 'Draft',
    [PayslipStatus.PUBLISHED]: 'Dipublikasi',
};

/**
 * Payslip status colors
 */
export const PAYSLIP_STATUS_COLORS: Record<PayslipStatus, string> = {
    [PayslipStatus.DRAFT]: 'yellow',
    [PayslipStatus.PUBLISHED]: 'green',
};

/**
 * Ticket status labels in Indonesian
 */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
    [TicketStatus.OPEN]: 'Dibuka',
    [TicketStatus.IN_PROGRESS]: 'Sedang Diproses',
    [TicketStatus.RESOLVED]: 'Selesai',
    [TicketStatus.CLOSED]: 'Ditutup',
};

/**
 * Ticket priority labels in Indonesian
 */
export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
    [TicketPriority.LOW]: 'Rendah',
    [TicketPriority.NORMAL]: 'Normal',
    [TicketPriority.HIGH]: 'Tinggi',
    [TicketPriority.URGENT]: 'Mendesak',
};

/**
 * Ticket priority colors
 */
export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
    [TicketPriority.LOW]: 'gray',
    [TicketPriority.NORMAL]: 'blue',
    [TicketPriority.HIGH]: 'yellow',
    [TicketPriority.URGENT]: 'red',
};

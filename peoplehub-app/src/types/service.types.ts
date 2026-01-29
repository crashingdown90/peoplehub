// @ai:ag - Created by Antigravity
// Service-related types and adapters

import {
    Attendance as PrismaAttendance,
    LeaveRequest as PrismaLeaveRequest,
    LeaveBalance as PrismaLeaveBalance,
    Employee as PrismaEmployee,
    User as PrismaUser,
    Payslip as PrismaPayslip,
} from '@prisma/client';

// Re-export Prisma types for services
export type {
    PrismaAttendance,
    PrismaLeaveRequest,
    PrismaLeaveBalance,
    PrismaEmployee,
    PrismaUser,
    PrismaPayslip,
};

// Service response wrapper
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
    };
}

// Pagination result
export interface PaginatedResult<T> extends ServiceResult<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Employee with nested relations
export interface EmployeeWithDetails extends PrismaEmployee {
    user: PrismaUser;
    branch?: {
        id: string;
        name: string;
        code: string;
    } | null;
    department?: {
        id: string;
        name: string;
        code: string;
    } | null;
    position?: {
        id: string;
        name: string;
        level: number;
    } | null;
    manager?: {
        id: string;
        fullName: string;
        employeeNumber: string;
    } | null;
}

// Attendance with employee info
export interface AttendanceRecord extends PrismaAttendance {
    employee?: {
        fullName: string;
        employeeNumber: string;
        department?: {
            name: string;
        } | null;
    };
}

// Leave request with relations
export interface LeaveRequestRecord extends PrismaLeaveRequest {
    employee?: {
        fullName: string;
        employeeNumber: string;
    };
    leaveType?: {
        name: string;
        code: string;
    };
}

// Payslip with employee info
export interface PayslipRecord extends PrismaPayslip {
    employee?: {
        fullName: string;
        employeeNumber: string;
        bankName?: string | null;
        bankAccountNumber?: string | null;
    };
}

// Dashboard stats
export interface DashboardStats {
    attendance: {
        todayStatus: 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT';
        clockInTime?: string;
        clockOutTime?: string;
        lateMinutes?: number;
    };
    leave: {
        remainingBalance: number;
        pendingRequests: number;
    };
    notifications: {
        unreadCount: number;
    };
    announcements: {
        latestCount: number;
    };
}

// Admin dashboard stats
export interface AdminDashboardStats {
    employees: {
        total: number;
        active: number;
        inactive: number;
        newThisMonth: number;
    };
    attendance: {
        presentToday: number;
        lateToday: number;
        absentToday: number;
        onLeaveToday: number;
    };
    pendingApprovals: {
        registrations: number;
        leaveRequests: number;
        attendanceCorrections: number;
        travelRequests: number;
        reimburseRequests: number;
    };
    payroll: {
        lastRunPeriod: string;
        draftPayslips: number;
        publishedPayslips: number;
    };
}

// Request context for multi-tenant services
export interface RequestContextData {
    tenantId: string;
    userId: string;
    employeeId?: string;
    role: string;
    branchId?: string;
}

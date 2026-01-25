// @ai:ag - Created by Antigravity
// Application routes constants

/**
 * Public routes (no auth required)
 */
export const PUBLIC_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
} as const;

/**
 * Dashboard routes
 */
export const DASHBOARD_ROUTES = {
    HOME: '/dashboard',
    EMPLOYEE: '/dashboard/employee',
    MANAGER: '/dashboard/manager',
    HRD: '/dashboard/hrd',
    FINANCE: '/dashboard/finance',
} as const;

/**
 * Feature routes
 */
export const FEATURE_ROUTES = {
    // Attendance
    ATTENDANCE: '/attendance',
    ATTENDANCE_HISTORY: '/attendance/history',
    ATTENDANCE_CORRECTION: '/attendance/correction',

    // Leave
    LEAVE: '/leave',
    LEAVE_REQUEST: '/leave/request',
    LEAVE_BALANCE: '/leave/balance',
    LEAVE_CALENDAR: '/leave/calendar',

    // Payroll
    PAYROLL: '/payroll',
    PAYSLIP: '/payroll/payslip',

    // Travel & Reimburse
    TRAVEL: '/travel',
    REIMBURSE: '/reimburse',

    // KPI
    KPI: '/kpi',
    KPI_TARGETS: '/kpi/targets',
    KPI_REVIEW: '/kpi/review',

    // Profile
    PROFILE: '/profile',
    SETTINGS: '/settings',

    // Notifications
    NOTIFICATIONS: '/notifications',
} as const;

/**
 * Admin routes
 */
export const ADMIN_ROUTES = {
    HOME: '/admin',
    EMPLOYEES: '/admin/employees',
    ORGANIZATION: '/admin/organization',
    BRANCHES: '/admin/organization/branches',
    DEPARTMENTS: '/admin/organization/departments',
    POSITIONS: '/admin/organization/positions',
    SHIFTS: '/admin/organization/shifts',
    LEAVE_TYPES: '/admin/organization/leave-types',
    HOLIDAYS: '/admin/organization/holidays',
    REGISTRATIONS: '/admin/registrations',
    ANNOUNCEMENTS: '/admin/announcements',
    WEBHOOKS: '/admin/webhooks',
    SETTINGS: '/admin/settings',
    AUDIT_LOG: '/admin/audit-log',
} as const;

/**
 * Approval routes
 */
export const APPROVAL_ROUTES = {
    HOME: '/approval',
    LEAVE: '/approval/leave',
    ATTENDANCE: '/approval/attendance',
    TRAVEL: '/approval/travel',
    REIMBURSE: '/approval/reimburse',
} as const;

/**
 * API routes
 */
export const API_ROUTES = {
    // Auth
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REGISTER: '/api/auth/register',
    AUTH_LOGOUT: '/api/auth/logout',
    AUTH_SESSION: '/api/auth/session',
    AUTH_VERIFY_EMAIL: '/api/auth/verify-email',
    AUTH_RESET_PASSWORD: '/api/auth/reset-password',

    // Attendance
    ATTENDANCE: '/api/attendance',
    ATTENDANCE_CLOCK_IN: '/api/attendance/clock-in',
    ATTENDANCE_CLOCK_OUT: '/api/attendance/clock-out',
    ATTENDANCE_HISTORY: '/api/attendance/history',
    ATTENDANCE_CORRECTION: '/api/attendance/correction',

    // Leave
    LEAVE: '/api/leave',
    LEAVE_TYPES: '/api/leave/types',
    LEAVE_BALANCE: '/api/leave/balance',
    LEAVE_REQUEST: '/api/leave/request',

    // Payroll
    PAYROLL: '/api/payroll',
    PAYSLIP: '/api/payroll/payslip',

    // Employee
    EMPLOYEES: '/api/employees',
    EMPLOYEE_PROFILE: '/api/employees/profile',

    // Admin
    ADMIN_REGISTRATIONS: '/api/admin/registrations',
    ADMIN_EMPLOYEES: '/api/admin/employees',
    ADMIN_BRANCHES: '/api/admin/branches',
    ADMIN_DEPARTMENTS: '/api/admin/departments',
    ADMIN_POSITIONS: '/api/admin/positions',

    // Notifications
    NOTIFICATIONS: '/api/notifications',

    // Webhooks
    WEBHOOKS: '/api/webhooks',

    // KPI
    KPI: {
        PERIODS: '/api/kpi/periods',
        INDICATORS: '/api/kpi/indicators',
        TARGETS: '/api/kpi/targets',
        MY_TARGETS: '/api/kpi/my-targets',
        SUMMARY: '/api/kpi/summary',
    },

    // Travel
    TRAVEL: {
        REQUESTS: '/api/travel/requests',
        SUMMARY: '/api/travel/summary',
        EXPENSES: '/api/travel/expenses',
    },

    // Reimburse
    REIMBURSE: {
        REQUESTS: '/api/reimburse/requests',
        SUMMARY: '/api/reimburse/summary',
    },

    // Announcements
    ANNOUNCEMENTS: {
        LIST: '/api/announcements',
        PINNED: '/api/announcements/pinned',
        SUMMARY: '/api/announcements/summary',
    },
} as const;

/**
 * All routes combined
 */
export const ROUTES = {
    ...PUBLIC_ROUTES,
    DASHBOARD: DASHBOARD_ROUTES,
    FEATURE: FEATURE_ROUTES,
    ADMIN: ADMIN_ROUTES,
    APPROVAL: APPROVAL_ROUTES,
    API: API_ROUTES,
} as const;
